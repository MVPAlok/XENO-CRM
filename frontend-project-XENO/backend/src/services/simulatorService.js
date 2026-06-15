import { prisma } from '../config/prisma.js';
import { randomInt } from 'crypto';
import { createCampaignLogPayload, refreshCampaignRates } from './campaignService.js';
import { recalculateCustomerMetrics } from './customerMetricsService.js';
import { createNotification } from './notificationService.js';
import { publishWorkspaceEvent } from './sseService.js';

let intervalHandle = null;
const lastRunByWorkspace = new Map();

const buildEvent = (status, type, field) => ({
  status,
  type,
  data: { [field]: new Date() },
});

const chooseNextEvent = (currentStatus) => {
  const roll = Math.random();
  if (currentStatus === 'SENT') {
    if (roll < 0.05) return buildEvent('FAILED', 'Failed', 'failedAt');
    return buildEvent('DELIVERED', 'Delivered', 'deliveredAt');
  }
  if (currentStatus === 'DELIVERED') {
    if (roll < 0.45) return buildEvent('READ', 'Read', 'readAt');
    return null;
  }
  if (currentStatus === 'READ') {
    if (roll < 0.3) return buildEvent('CLICKED', 'Clicked', 'clickedAt');
    return null;
  }
  if (currentStatus === 'CLICKED') {
    if (roll < 0.2) return buildEvent('CONVERTED', 'Converted', 'convertedAt');
    return null;
  }
  return null;
};

const runWorkspaceTick = async (control) => {
  const now = Date.now();
  const lastRun = lastRunByWorkspace.get(control.workspaceId) || 0;
  if (now - lastRun < control.speed * 1000) return;
  lastRunByWorkspace.set(control.workspaceId, now);

  const candidates = await prisma.campaignDelivery.findMany({
    where: {
      workspaceId: control.workspaceId,
      status: { in: ['SENT', 'DELIVERED', 'READ', 'CLICKED'] },
      campaign: { status: 'RUNNING' },
    },
    include: {
      campaign: true,
      customer: true,
    },
    orderBy: { updatedAt: 'asc' },
    take: 30,
  });

  if (!candidates.length) return;

  const delivery = candidates[randomInt(candidates.length)];
  const nextEvent = chooseNextEvent(delivery.status);
  if (!nextEvent) return;

  let orderValue = null;
  const data = {
    status: nextEvent.status,
    ...nextEvent.data,
  };

  await prisma.$transaction(async (tx) => {
    await tx.campaignDelivery.update({
      where: { id: delivery.id },
      data,
    });

    if (nextEvent.status === 'CONVERTED') {
      orderValue = randomInt(800, 3501);
      await tx.order.create({
        data: {
          workspaceId: delivery.workspaceId,
          customerId: delivery.customerId,
          campaignId: delivery.campaignId,
          deliveryId: delivery.id,
          amount: orderValue,
          purchaseDate: new Date(),
          category: 'Campaign Conversion',
          source: 'SIMULATOR',
        },
      });
      await recalculateCustomerMetrics(delivery.workspaceId, delivery.customerId, tx);
    }
  });

  await refreshCampaignRates(delivery.campaignId);

  const logPayload = createCampaignLogPayload({
    delivery,
    campaign: delivery.campaign,
    customer: delivery.customer,
    eventType: nextEvent.type,
    orderValue,
  });

  const log = await prisma.simulatorLog.create({ data: logPayload });
  publishWorkspaceEvent(delivery.workspaceId, 'simulator_log', log);

  if (nextEvent.status === 'CONVERTED') {
    await createNotification({
      workspaceId: delivery.workspaceId,
      type: 'CONVERSION',
      title: 'Conversion happened',
      message: logPayload.message,
      data: {
        campaignId: delivery.campaignId,
        customerId: delivery.customerId,
        orderValue,
      },
    });
  }

  publishWorkspaceEvent(delivery.workspaceId, 'campaign_update', {
    campaignId: delivery.campaignId,
    status: nextEvent.status,
  });
};

const tick = async () => {
  const controls = await prisma.simulatorControl.findMany({
    where: { isPaused: false },
  });

  await Promise.allSettled(controls.map(runWorkspaceTick));
};

export const startSimulatorDaemon = () => {
  if (intervalHandle) return;
  intervalHandle = setInterval(() => {
    tick().catch((error) => console.error('Simulator tick failed', error));
  }, 1000);
};

export const stopSimulatorDaemon = () => {
  if (intervalHandle) clearInterval(intervalHandle);
  intervalHandle = null;
};

export const getSimulatorMetrics = async (workspaceId) => {
  const deliveries = await prisma.campaignDelivery.findMany({
    where: { workspaceId },
    select: { status: true },
  });

  return {
    sent: deliveries.length,
    delivered: deliveries.filter((delivery) => ['DELIVERED', 'READ', 'CLICKED', 'CONVERTED'].includes(delivery.status)).length,
    failed: deliveries.filter((delivery) => delivery.status === 'FAILED').length,
    read: deliveries.filter((delivery) => ['READ', 'CLICKED', 'CONVERTED'].includes(delivery.status)).length,
    clicked: deliveries.filter((delivery) => ['CLICKED', 'CONVERTED'].includes(delivery.status)).length,
    converted: deliveries.filter((delivery) => delivery.status === 'CONVERTED').length,
  };
};

export const getSimulatorLogs = async (workspaceId, limit = 50) => {
  const logs = await prisma.simulatorLog.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return logs.map((log) => ({
    id: log.id,
    time: log.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type: log.type,
    channel: log.channel,
    message: log.message,
    campaignId: log.campaignId,
    customerId: log.customerId,
    customerName: log.metadata?.customerName,
    createdAt: log.createdAt,
  }));
};

export const updateSimulatorControl = async (workspaceId, payload) => {
  const data = {};
  if (payload.action === 'pause') data.isPaused = true;
  if (payload.action === 'resume') data.isPaused = false;
  if (typeof payload.isPaused === 'boolean') data.isPaused = payload.isPaused;
  if (payload.speed !== undefined) data.speed = Math.min(Math.max(Number(payload.speed), 1), 30);

  return prisma.simulatorControl.upsert({
    where: { workspaceId },
    update: data,
    create: {
      workspaceId,
      isPaused: data.isPaused ?? false,
      speed: data.speed ?? 4,
    },
  });
};
