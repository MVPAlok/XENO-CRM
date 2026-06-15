import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { campaignStatusToDb, campaignStatusToUi, customerName, toNumber } from '../utils/formatters.js';
import { channelRate } from './analyticsService.js';
import { createNotification } from './notificationService.js';
import { matchCustomersForRules } from './segmentService.js';
import { publishWorkspaceEvent } from './sseService.js';

const deliveryMetrics = (deliveries, orders = []) => {
  const metrics = {
    sent: deliveries.length,
    delivered: deliveries.filter((delivery) => ['DELIVERED', 'READ', 'CLICKED', 'CONVERTED'].includes(delivery.status)).length,
    failed: deliveries.filter((delivery) => delivery.status === 'FAILED').length,
    read: deliveries.filter((delivery) => ['READ', 'CLICKED', 'CONVERTED'].includes(delivery.status)).length,
    clicked: deliveries.filter((delivery) => ['CLICKED', 'CONVERTED'].includes(delivery.status)).length,
    converted: deliveries.filter((delivery) => delivery.status === 'CONVERTED').length,
    revenue: Math.round(orders.reduce((sum, order) => sum + toNumber(order.amount), 0)),
  };
  return metrics;
};

const serializeCampaign = (campaign) => {
  const metrics = deliveryMetrics(campaign.deliveries || [], campaign.orders || []);
  const cost = Math.max(250, metrics.sent * channelRate(campaign.channel));
  return {
    id: campaign.id,
    name: campaign.name,
    segmentId: campaign.segmentId,
    segment: campaign.segment?.name || 'Custom Segment',
    channel: campaign.channel,
    status: campaignStatusToUi(campaign.status),
    createdBy: campaign.creator ? `${campaign.creator.firstName} ${campaign.creator.lastName}` : 'Growth Studio',
    createdDate: campaign.createdAt.toISOString().slice(0, 10),
    message: campaign.messageBody,
    messageSubject: campaign.messageSubject,
    metrics,
    originSegment: campaign.segment?.name || 'Custom Segment',
    recommendedChannel: campaign.channel,
    predictedRoi: metrics.revenue > 0 ? `${(metrics.revenue / cost).toFixed(1)}x` : '4.8x',
    expectedRevenue: Math.max(metrics.revenue, Math.round(metrics.sent * 450)),
  };
};

export const listCampaigns = async ({ workspaceId, search, status, channel, sort = 'createdAt', order = 'desc', page, limit, skip }) => {
  const where = { workspaceId };
  if (search) where.name = { contains: search, mode: 'insensitive' };
  if (status) where.status = campaignStatusToDb(status);
  if (channel) where.channel = channel;

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: {
        creator: true,
        segment: true,
        deliveries: { select: { status: true } },
        orders: { select: { amount: true } },
      },
      orderBy: { [sort]: order },
      skip,
      take: limit,
    }),
    prisma.campaign.count({ where }),
  ]);

  return {
    campaigns: campaigns.map(serializeCampaign),
    total,
    page,
    limit,
  };
};

export const launchCampaign = async ({ workspaceId, userId, name, channel, segmentId, message, messageBody, messageSubject, status }) => {
  const segment = await prisma.segment.findFirst({
    where: { id: segmentId, workspaceId },
    include: { rules: true },
  });
  if (!segment) throw new ApiError(404, 'Segment not found in this workspace');

  const dbStatus = campaignStatusToDb(status);
  const body = messageBody || message;

  const campaign = await prisma.campaign.create({
    data: {
      workspaceId,
      createdBy: userId,
      segmentId,
      name,
      channel,
      messageSubject,
      messageBody: body,
      status: dbStatus,
      launchedAt: dbStatus === 'RUNNING' ? new Date() : null,
    },
    include: {
      creator: true,
      segment: true,
      deliveries: true,
      orders: true,
    },
  });

  if (dbStatus === 'RUNNING') {
    await createDeliveriesForCampaign({ workspaceId, campaignId: campaign.id, segment, messageSubject, messageBody: body });
    await prisma.simulatorLog.create({
      data: {
        workspaceId,
        campaignId: campaign.id,
        type: 'Campaign Sent',
        channel,
        message: `Campaign "${name}" launched for ${segment.name}.`,
      },
    });
    await createNotification({
      workspaceId,
      userId,
      type: 'CAMPAIGN',
      title: 'Campaign launched',
      message: `Campaign "${name}" launched on ${channel}.`,
      data: { campaignId: campaign.id },
    });
  }

  const hydrated = await prisma.campaign.findUnique({
    where: { id: campaign.id },
    include: {
      creator: true,
      segment: true,
      deliveries: { select: { status: true } },
      orders: { select: { amount: true } },
    },
  });

  const serialized = serializeCampaign(hydrated);
  publishWorkspaceEvent(workspaceId, 'campaign_update', serialized);
  return serialized;
};

export const createDeliveriesForCampaign = async ({ workspaceId, campaignId, segment, messageSubject, messageBody }) => {
  const customers = await matchCustomersForRules(workspaceId, segment.rules);
  if (!customers.length) return 0;

  await prisma.campaignDelivery.createMany({
    data: customers.map((customer) => ({
      workspaceId,
      campaignId,
      customerId: customer.id,
      messageSubject,
      messageBody,
      status: 'SENT',
    })),
    skipDuplicates: true,
  });

  return customers.length;
};

export const refreshCampaignRates = async (campaignId) => {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { deliveries: true },
  });
  if (!campaign) return null;

  const metrics = deliveryMetrics(campaign.deliveries);
  const sent = Math.max(metrics.sent, 1);
  return prisma.campaign.update({
    where: { id: campaignId },
    data: {
      sentCount: metrics.sent,
      openRate: (metrics.read / sent) * 100,
      clickRate: (metrics.clicked / sent) * 100,
      conversionRate: (metrics.converted / sent) * 100,
    },
  });
};

export const createCampaignLogPayload = ({ delivery, campaign, customer, eventType, orderValue = null }) => {
  const name = customerName(customer);
  let message = `${name} moved to ${eventType} for "${campaign.name}".`;
  if (eventType === 'Delivered') message = `Delivered "${campaign.name}" dispatch to ${name} (${customer.phone || customer.email || 'contact unknown'}).`;
  if (eventType === 'Read') message = `${name} read "${campaign.name}" template message via ${campaign.channel}.`;
  if (eventType === 'Clicked') message = `${name} clicked link in "${campaign.name}" dispatch.`;
  if (eventType === 'Converted') {
    message = `${name} converted! Order confirmed: ₹${Math.round(orderValue).toLocaleString('en-IN')} generated via ${campaign.channel}.`;
  }
  if (eventType === 'Failed') message = `Outbound dispatch failed to ${name} (${customer.phone || customer.email || 'contact unknown'}) due to Carrier Timeout.`;

  return {
    workspaceId: delivery.workspaceId,
    campaignId: campaign.id,
    customerId: customer.id,
    deliveryId: delivery.id,
    type: eventType,
    channel: campaign.channel,
    message,
    metadata: {
      customerName: name,
      campaignName: campaign.name,
      orderValue,
    },
  };
};
