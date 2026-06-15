import { prisma } from '../config/prisma.js';
import { toNumber } from '../utils/formatters.js';

const AUTO_SEGMENTS = [
  {
    name: 'VIP Customers',
    description: 'Customers with lifetime spend above ₹25,000.',
    rules: [{ field: 'totalSpend', operator: '>', value: '25000' }],
  },
  {
    name: 'Inactive Customers',
    description: 'Customers who have not purchased in over 90 days.',
    rules: [{ field: 'lastPurchaseDays', operator: '>', value: '90' }],
  },
  {
    name: 'Recent Buyers',
    description: 'Customers who purchased in the last 30 days.',
    rules: [{ field: 'lastPurchaseDays', operator: '<=', value: '30' }],
  },
  {
    name: 'Frequent Shoppers',
    description: 'Customers with more than 8 lifetime orders.',
    rules: [{ field: 'orderCount', operator: '>', value: '8' }],
  },
  {
    name: 'Coupon Sensitive Customers',
    description: 'Customers who respond to coupons, discounts, or promo-led orders.',
    rules: [{ field: 'couponSensitive', operator: '=', value: 'true' }],
  },
  {
    name: 'At Risk Customers',
    description: 'Customers with no purchase in 60 to 90 days.',
    rules: [
      { field: 'lastPurchaseDays', operator: '>=', value: '60' },
      { field: 'lastPurchaseDays', operator: '<=', value: '90' },
    ],
  },
];

const COLORS = ['#8B5CF6', '#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#EF4444'];

export const ensureAutoSegments = async (workspaceId, userId = null) => {
  for (const segment of AUTO_SEGMENTS) {
    await prisma.segment.upsert({
      where: {
        workspaceId_name: {
          workspaceId,
          name: segment.name,
        },
      },
      update: {
        description: segment.description,
        type: 'AUTO',
        rules: {
          deleteMany: {},
          create: segment.rules,
        },
      },
      create: {
        workspaceId,
        createdBy: userId,
        name: segment.name,
        description: segment.description,
        type: 'AUTO',
        rules: { create: segment.rules },
      },
    });
  }
};

const normalizeField = (field) => {
  const key = String(field).trim();
  const map = {
    city: 'city',
    totalSpend: 'totalSpend',
    spend: 'totalSpend',
    lastPurchaseDays: 'lastPurchaseDays',
    lastPurchaseDaysAgo: 'lastPurchaseDays',
    recency: 'lastPurchaseDays',
    orderCount: 'orderCount',
    totalOrders: 'orderCount',
    couponSensitive: 'couponSensitive',
  };
  return map[key] || key;
};

const compare = (actual, operator, expectedRaw) => {
  const op = String(operator || '=').toLowerCase();
  const expected = String(expectedRaw);
  if (op === '=' || op === 'equals' || op === 'eq') {
    return String(actual).toLowerCase() === expected.toLowerCase();
  }
  if (op === '!=' || op === 'not_equals' || op === 'neq') {
    return String(actual).toLowerCase() !== expected.toLowerCase();
  }

  const actualNum = Number(actual);
  const expectedNum = Number(expected);
  if (!Number.isFinite(actualNum) || !Number.isFinite(expectedNum)) return false;
  if (op === '>' || op === 'gt') return actualNum > expectedNum;
  if (op === '>=' || op === 'gte') return actualNum >= expectedNum;
  if (op === '<' || op === 'lt') return actualNum < expectedNum;
  if (op === '<=' || op === 'lte') return actualNum <= expectedNum;
  return false;
};

export const getCustomerFacts = async (workspaceId) => {
  const customers = await prisma.customer.findMany({
    where: { workspaceId, deletedAt: null },
    include: {
      orders: {
        select: { discountUsage: true, category: true },
      },
    },
  });

  return customers.map((customer) => ({
    customer,
    city: customer.city || '',
    totalSpend: toNumber(customer.totalSpend),
    lastPurchaseDays:
      customer.recencyDays ?? (customer.lastPurchaseAt ? Math.floor((Date.now() - customer.lastPurchaseAt.getTime()) / 86400000) : 9999),
    orderCount: customer.totalOrders || 0,
    couponSensitive: customer.orders.some(
      (order) =>
        order.discountUsage ||
        ['coupon', 'discount', 'promo', 'offer'].some((token) =>
          String(order.category || '').toLowerCase().includes(token)
        )
    ),
  }));
};

export const matchCustomersForRules = async (workspaceId, rules = []) => {
  const facts = await getCustomerFacts(workspaceId);
  if (!rules.length) return facts.map((fact) => fact.customer);

  return facts
    .filter((fact) =>
      rules.every((rule) => {
        const field = normalizeField(rule.field);
        return compare(fact[field], rule.operator, rule.value);
      })
    )
    .map((fact) => fact.customer);
};

export const enrichSegment = async (segment, index = 0) => {
  const rules = segment.rules || [];
  const customers = await matchCustomersForRules(segment.workspaceId, rules);
  const count = customers.length;
  const revenuePotential = Math.round(customers.reduce((sum, customer) => sum + toNumber(customer.clv), 0) * 0.18);
  const avgSpend = count > 0 ? customers.reduce((sum, customer) => sum + toNumber(customer.totalSpend), 0) / count : 0;
  const baseConversion = segment.name.includes('VIP')
    ? 28.6
    : segment.name.includes('Frequent')
      ? 31.2
      : segment.name.includes('Recent')
        ? 22.1
        : segment.name.includes('Inactive')
          ? 15.4
          : segment.name.includes('At Risk')
            ? 12.8
            : 18.9;

  return {
    id: segment.id,
    name: segment.name,
    description: segment.description,
    type: segment.type,
    rules,
    count,
    revenuePotential,
    expectedConversion: `${baseConversion.toFixed(1)}%`,
    confidenceScore: Math.min(99, Math.max(72, Math.round(82 + count / 20 + avgSpend / 50000))),
    color: COLORS[index % COLORS.length],
    createdAt: segment.createdAt,
    updatedAt: segment.updatedAt,
  };
};

export const listEnrichedSegments = async (workspaceId) => {
  const segments = await prisma.segment.findMany({
    where: { workspaceId },
    include: { rules: true },
    orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
  });

  return Promise.all(segments.map((segment, index) => enrichSegment(segment, index)));
};

export const createCustomSegment = async ({ workspaceId, userId, name, description, rules }) => {
  const segment = await prisma.segment.create({
    data: {
      workspaceId,
      createdBy: userId,
      name,
      description,
      type: 'CUSTOM',
      rules: { create: rules },
    },
    include: { rules: true },
  });

  return enrichSegment(segment);
};
