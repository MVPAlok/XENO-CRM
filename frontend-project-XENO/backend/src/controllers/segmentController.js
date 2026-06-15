import { asyncHandler } from '../utils/asyncHandler.js';
import { createCustomSegment, ensureAutoSegments, listEnrichedSegments, paginatedMatchForSegment } from '../services/segmentService.js';
import { serializeCustomer } from '../services/customerMetricsService.js';

export const listSegments = asyncHandler(async (req, res) => {
  await ensureAutoSegments(req.params.workspaceId, req.user.id);
  const segments = await listEnrichedSegments(req.params.workspaceId);
  res.json({ success: true, segments });
});

export const createSegment = asyncHandler(async (req, res) => {
  const segment = await createCustomSegment({
    workspaceId: req.params.workspaceId,
    userId: req.user.id,
    name: req.body.name,
    description: req.body.description,
    rules: req.body.rules,
  });
  res.status(201).json({ success: true, segment });
});

export const previewSegment = asyncHandler(async (req, res) => {
  const rules = req.body.rules || [];
  const page = Math.max(Number(req.body.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.body.limit || 25), 1), 100);

  const result = await paginatedMatchForSegment(req.params.workspaceId, rules, { page, limit });

  res.json({
    success: true,
    customers: result.customers.map(serializeCustomer),
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
    aggregates: result.aggregates,
  });
});
