import { asyncHandler } from '../utils/asyncHandler.js';
import { createCustomSegment, ensureAutoSegments, listEnrichedSegments } from '../services/segmentService.js';

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
