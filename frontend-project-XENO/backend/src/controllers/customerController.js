import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, paginationMeta } from '../utils/pagination.js';
import { serializeCustomer, withCustomerTimeline } from '../services/customerMetricsService.js';

const allowedSorts = new Set(['createdAt', 'firstName', 'totalSpend', 'totalOrders', 'lastPurchaseAt', 'status', 'city']);

export const listCustomers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const sort = allowedSorts.has(req.query.sort) ? req.query.sort : 'updatedAt';
  const order = req.query.order === 'asc' ? 'asc' : 'desc';
  const where = {
    workspaceId: req.params.workspaceId,
    deletedAt: null,
  };

  if (req.query.status) where.status = req.query.status.toUpperCase();
  if (req.query.city) where.city = req.query.city;
  if (req.query.channel) where.preferredChannel = req.query.channel;
  if (req.query.search) {
    where.OR = [
      { id: { contains: req.query.search, mode: 'insensitive' } },
      { externalId: { contains: req.query.search, mode: 'insensitive' } },
      { firstName: { contains: req.query.search, mode: 'insensitive' } },
      { lastName: { contains: req.query.search, mode: 'insensitive' } },
      { email: { contains: req.query.search, mode: 'insensitive' } },
      { phone: { contains: req.query.search, mode: 'insensitive' } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { [sort]: order },
      skip,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  res.json({
    success: true,
    customers: customers.map(serializeCustomer),
    pagination: paginationMeta({ page, limit, total }),
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
