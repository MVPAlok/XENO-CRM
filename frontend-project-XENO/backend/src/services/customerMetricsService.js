import { prisma } from '../config/prisma.js';
import { toNumber } from '../utils/formatters.js';

const daysBetween = (from, to = new Date()) =>
  Math.max(0, Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));

const getStatus = ({ totalSpend, recencyDays, totalOrders }) => {
  if (totalOrders === 0 || recencyDays === null || recencyDays === undefined) return 'INACTIVE';
  if (totalSpend > 25000) return 'VIP';
  if (recencyDays > 90) return 'INACTIVE';
  if (recencyDays >= 60 && recencyDays <= 90) return 'AT_RISK';
  return 'ACTIVE';
};

export const recalculateCustomerMetrics = async (workspaceId, customerId, tx = prisma) => {
  const aggregate = await tx.order.aggregate({
    where: { workspaceId, customerId },
    _sum: { amount: true },
    _count: { id: true },
    _max: { purchaseDate: true },
    _min: { purchaseDate: true },
  });

  const totalSpend = toNumber(aggregate._sum.amount);
  const totalOrders = aggregate._count.id;
  const averageOrderValue = totalOrders > 0 ? totalSpend / totalOrders : 0;
  const clv = totalSpend * 1.3;
  const lastPurchaseAt = aggregate._max.purchaseDate;
  const recencyDays = lastPurchaseAt ? daysBetween(lastPurchaseAt) : null;
  const firstPurchaseAt = aggregate._min.purchaseDate;
  const customerAgeDays = firstPurchaseAt ? Math.max(daysBetween(firstPurchaseAt), 1) : 1;
  const purchaseFrequency = totalOrders > 0 ? totalOrders / Math.max(customerAgeDays / 30, 1) : 0;
  const status = getStatus({ totalSpend, recencyDays, totalOrders });

  return tx.customer.update({
    where: { id: customerId },
    data: {
      totalSpend,
      totalOrders,
      averageOrderValue,
      clv,
      lastPurchaseAt,
      recencyDays,
      purchaseFrequency,
      status,
    },
  });
};

export const recalculateWorkspaceCustomers = async (workspaceId) => {
  const customers = await prisma.customer.findMany({
    where: { workspaceId, deletedAt: null },
    select: { id: true },
  });

  for (const customer of customers) {
    await recalculateCustomerMetrics(workspaceId, customer.id);
  }
};

export const serializeCustomer = (customer) => {
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim();
  return {
    id: customer.id,
    externalId: customer.externalId,
    firstName: customer.firstName,
    lastName: customer.lastName,
    name,
    email: customer.email || '',
    phone: customer.phone || '',
    city: customer.city || '',
    preferredChannel: customer.preferredChannel || 'WhatsApp',
    totalOrders: customer.totalOrders || 0,
    totalSpend: Math.round(toNumber(customer.totalSpend)),
    averageOrderValue: Math.round(toNumber(customer.averageOrderValue)),
    clv: Math.round(toNumber(customer.clv)),
    recencyDays: customer.recencyDays,
    purchaseFrequency: Number(toNumber(customer.purchaseFrequency).toFixed(2)),
    lastPurchaseDate: customer.lastPurchaseAt
      ? customer.lastPurchaseAt.toISOString().slice(0, 10)
      : '',
    status: customer.status,
    timeline: customer.timeline || [],
  };
};

export const withCustomerTimeline = async (workspaceId, customer) => {
  const deliveries = await prisma.campaignDelivery.findMany({
    where: {
      workspaceId,
      customerId: customer.id,
    },
    include: {
      campaign: true,
      order: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  });

  const timeline = deliveries.map((delivery) => {
    const events = [
      { type: 'Message Sent', timestamp: delivery.sentAt, status: 'completed' },
      delivery.deliveredAt && { type: 'Delivered', timestamp: delivery.deliveredAt, status: 'completed' },
      delivery.readAt && { type: 'Opened/Read', timestamp: delivery.readAt, status: 'completed' },
      delivery.clickedAt && { type: 'Clicked Link', timestamp: delivery.clickedAt, status: 'completed' },
      delivery.convertedAt && {
        type: 'Converted Order',
        timestamp: delivery.convertedAt,
        status: 'completed',
        value: `₹${Math.round(toNumber(delivery.order?.amount)).toLocaleString('en-IN')}`,
      },
      delivery.failedAt && { type: 'Failed', timestamp: delivery.failedAt, status: 'failed' },
    ]
      .filter(Boolean)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map((event) => ({ ...event, timestamp: new Date(event.timestamp).toISOString() }));

    return {
      id: delivery.id,
      campaignName: delivery.campaign?.name || 'Campaign',
      channel: delivery.campaign?.channel || 'WhatsApp',
      events,
    };
  });

  return serializeCustomer({ ...customer, timeline });
};
