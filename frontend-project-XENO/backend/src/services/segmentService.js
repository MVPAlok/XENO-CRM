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

export const buildPrismaWhereFromRules = (workspaceId, rules = []) => {
  const where = { workspaceId, deletedAt: null };
  const AND = [];

  for (const rule of rules) {
    const field = normalizeField(rule.field);
    const op = String(rule.operator || '=').toLowerCase();
    const rawValue = String(rule.value);

    if (field === 'city') {
      if (op === '=' || op === 'equals' || op === 'eq') {
        AND.push({ city: { equals: rawValue, mode: 'insensitive' } });
      } else if (op === '!=' || op === 'not_equals' || op === 'neq') {
        AND.push({ city: { not: { equals: rawValue, mode: 'insensitive' } } });
      }
      continue;
    }

    if (field === 'couponSensitive') {
      // couponSensitive requires order-level check, fall back to in-memory
      continue;
    }

    // Numeric fields: totalSpend, lastPurchaseDays (recencyDays), orderCount (totalOrders)
    const numericValue = Number(rawValue);
    if (!Number.isFinite(numericValue)) continue;

    let dbField;
    if (field === 'totalSpend') dbField = 'totalSpend';
    else if (field === 'lastPurchaseDays') dbField = 'recencyDays';
    else if (field === 'orderCount') dbField = 'totalOrders';
    else continue;

    if (op === '>' || op === 'gt') AND.push({ [dbField]: { gt: numericValue } });
    else if (op === '>=' || op === 'gte') AND.push({ [dbField]: { gte: numericValue } });
    else if (op === '<' || op === 'lt') AND.push({ [dbField]: { lt: numericValue } });
    else if (op === '<=' || op === 'lte') AND.push({ [dbField]: { lte: numericValue } });
    else if (op === '=' || op === 'equals' || op === 'eq') AND.push({ [dbField]: { equals: numericValue } });
    else if (op === '!=' || op === 'not_equals' || op === 'neq') AND.push({ [dbField]: { not: numericValue } });
  }

  if (AND.length) where.AND = AND;
  return where;
};

// Check if any rules require in-memory filtering (e.g. couponSensitive)
const needsInMemoryFilter = (rules = []) =>
  rules.some((rule) => normalizeField(rule.field) === 'couponSensitive');

export const matchCustomersForRules = async (workspaceId, rules = []) => {
  // If rules include couponSensitive, we must use in-memory approach
  if (needsInMemoryFilter(rules)) {
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
  }

  // Pure DB-level filtering for all other rules
  const where = buildPrismaWhereFromRules(workspaceId, rules);
  return prisma.customer.findMany({ where });
};

export const paginatedMatchForSegment = async (workspaceId, rules = [], { page = 1, limit = 25 } = {}) => {
  const skip = (page - 1) * limit;

  if (needsInMemoryFilter(rules)) {
    // Fall back to in-memory for couponSensitive rules
    const allMatched = await matchCustomersForRules(workspaceId, rules);
    const total = allMatched.length;
    const customers = allMatched.slice(skip, skip + limit);
    const totalSpendSum = allMatched.reduce((sum, c) => sum + toNumber(c.totalSpend), 0);
    const avgOrderValue = total > 0
      ? allMatched.reduce((sum, c) => sum + toNumber(c.averageOrderValue), 0) / total
      : 0;
    return {
      customers,
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      aggregates: {
        totalSpend: Math.round(totalSpendSum),
        avgOrderValue: Math.round(avgOrderValue),
        avgRecencyDays: total > 0
          ? Math.round(allMatched.reduce((sum, c) => sum + (c.recencyDays || 0), 0) / total)
          : 0,
      },
    };
  }

  const where = buildPrismaWhereFromRules(workspaceId, rules);

  const [customers, total, agg] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.customer.count({ where }),
    prisma.customer.aggregate({
      where,
      _sum: { totalSpend: true },
      _avg: { averageOrderValue: true, recencyDays: true },
    }),
  ]);

  return {
    customers,
    total,
    page,
    limit,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    aggregates: {
      totalSpend: Math.round(toNumber(agg._sum.totalSpend)),
      avgOrderValue: Math.round(toNumber(agg._avg.averageOrderValue)),
      avgRecencyDays: Math.round(toNumber(agg._avg.recencyDays)),
    },
  };
};

export const enrichSegment = async (segment, index = 0) => {
  const rules = segment.rules || [];
  const customers = await matchCustomersForRules(segment.workspaceId, rules);
  const count = customers.length;
  const revenuePotential = Math.round(customers.reduce((sum, customer) => sum + toNumber(customer.clv), 0) * 0.18);
  const avgSpend = count > 0 ? customers.reduce((sum, customer) => sum + toNumber(customer.totalSpend), 0) / count : 0;
  
  const avgRecency = count > 0 ? customers.reduce((sum, c) => sum + (c.recencyDays ?? 90), 0) / count : 90;
  const avgFreq = count > 0 ? customers.reduce((sum, c) => sum + toNumber(c.purchaseFrequency), 0) / count : 1;
  const freshness = 1 / (1 + avgRecency / 45);
  const freqFactor = Math.min(5, avgFreq) / 5;
  const computedConversion = (0.05 + 0.35 * freshness * (0.3 + 0.7 * freqFactor)) * 100;
  const baseConversion = Math.min(85.0, Math.max(2.5, computedConversion));

  const totalCustomersInWorkspace = await prisma.customer.count({ where: { workspaceId: segment.workspaceId, deletedAt: null } });
  const sampleSizeFactor = totalCustomersInWorkspace > 0 ? Math.min(25, (count / totalCustomersInWorkspace) * 100) : 0;
  const confidenceScore = Math.min(99, Math.max(60, Math.round(65 + Math.min(15, sampleSizeFactor) + Math.min(19, avgFreq * 3.5))));

  return {
    id: segment.id,
    name: segment.name,
    description: segment.description,
    type: segment.type,
    rules,
    count,
    revenuePotential,
    expectedConversion: `${baseConversion.toFixed(1)}%`,
    confidenceScore,
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
