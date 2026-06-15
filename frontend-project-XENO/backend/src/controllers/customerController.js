import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, paginationMeta } from '../utils/pagination.js';
import { serializeCustomer, withCustomerTimeline } from '../services/customerMetricsService.js';
import { buildPrismaWhereFromRules } from '../services/segmentService.js';

const allowedSorts = new Set(['createdAt', 'firstName', 'totalSpend', 'totalOrders', 'lastPurchaseAt', 'status', 'city']);

export const listCustomers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const sort = allowedSorts.has(req.query.sort) ? req.query.sort : 'updatedAt';
  const order = req.query.order === 'asc' ? 'asc' : 'desc';
  const workspaceId = req.params.workspaceId;

  // If a segmentId is provided, look up that segment's rules and filter by them
  if (req.query.segmentId) {
    const segment = await prisma.segment.findFirst({
      where: { id: req.query.segmentId, workspaceId },
      include: { rules: true },
    });
    if (!segment) throw new ApiError(404, 'Segment not found');

    const segWhere = buildPrismaWhereFromRules(workspaceId, segment.rules);

    const [customers, total, agg] = await Promise.all([
      prisma.customer.findMany({
        where: segWhere,
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where: segWhere }),
      prisma.customer.aggregate({
        where: segWhere,
        _sum: { totalSpend: true },
        _avg: { averageOrderValue: true, recencyDays: true },
      }),
    ]);

    return res.json({
      success: true,
      customers: customers.map(serializeCustomer),
      pagination: paginationMeta({ page, limit, total }),
      segment: { id: segment.id, name: segment.name, description: segment.description },
      aggregates: {
        totalSpend: Math.round(Number(agg._sum.totalSpend || 0)),
        avgOrderValue: Math.round(Number(agg._avg.averageOrderValue || 0)),
        avgRecencyDays: Math.round(Number(agg._avg.recencyDays || 0)),
      },
    });
  }

  // Build standard where clause with advanced filters
  const where = {
    workspaceId,
    deletedAt: null,
  };
  const AND = [];

  // Basic filters
  if (req.query.status) {
    // Support comma-separated statuses e.g. "ACTIVE,VIP"
    const statuses = req.query.status.toUpperCase().split(',').map(s => s.trim()).filter(Boolean);
    if (statuses.length === 1) {
      where.status = statuses[0];
    } else if (statuses.length > 1) {
      AND.push({ status: { in: statuses } });
    }
  }
  if (req.query.city) where.city = req.query.city;
  if (req.query.channel) where.preferredChannel = req.query.channel;

  // Search
  if (req.query.search) {
    AND.push({
      OR: [
        { id: { contains: req.query.search, mode: 'insensitive' } },
        { externalId: { contains: req.query.search, mode: 'insensitive' } },
        { firstName: { contains: req.query.search, mode: 'insensitive' } },
        { lastName: { contains: req.query.search, mode: 'insensitive' } },
        { email: { contains: req.query.search, mode: 'insensitive' } },
        { phone: { contains: req.query.search, mode: 'insensitive' } },
      ],
    });
  }

  // Advanced numeric filters — totalSpend range
  const spendMin = Number(req.query.spendMin);
  const spendMax = Number(req.query.spendMax);
  if (Number.isFinite(spendMin)) AND.push({ totalSpend: { gte: spendMin } });
  if (Number.isFinite(spendMax)) AND.push({ totalSpend: { lte: spendMax } });

  // Advanced numeric filters — totalOrders range
  const ordersMin = Number(req.query.ordersMin);
  const ordersMax = Number(req.query.ordersMax);
  if (Number.isFinite(ordersMin)) AND.push({ totalOrders: { gte: ordersMin } });
  if (Number.isFinite(ordersMax)) AND.push({ totalOrders: { lte: ordersMax } });

  // Advanced date filters — last purchase recency
  const withinDays = Number(req.query.lastPurchaseWithin);
  const overDays = Number(req.query.lastPurchaseOver);
  if (Number.isFinite(withinDays) && withinDays > 0) {
    const cutoff = new Date(Date.now() - withinDays * 86400000);
    AND.push({ lastPurchaseAt: { gte: cutoff } });
  }
  if (Number.isFinite(overDays) && overDays > 0) {
    const cutoff = new Date(Date.now() - overDays * 86400000);
    AND.push({
      OR: [
        { lastPurchaseAt: { lt: cutoff } },
        { lastPurchaseAt: null },
      ],
    });
  }

  if (AND.length) where.AND = AND;

  const [customers, total, agg] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { [sort]: order },
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

  res.json({
    success: true,
    customers: customers.map(serializeCustomer),
    pagination: paginationMeta({ page, limit, total }),
    aggregates: {
      totalSpend: Math.round(Number(agg._sum.totalSpend || 0)),
      avgOrderValue: Math.round(Number(agg._avg.averageOrderValue || 0)),
      avgRecencyDays: Math.round(Number(agg._avg.recencyDays || 0)),
    },
  });
});

export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await prisma.customer.findFirst({
    where: {
      id: req.params.customerId,
      workspaceId: req.params.workspaceId,
      deletedAt: null,
    },
  });
  if (!customer) throw new ApiError(404, 'Customer not found');

  res.json({ success: true, customer: await withCustomerTimeline(req.params.workspaceId, customer) });
});
