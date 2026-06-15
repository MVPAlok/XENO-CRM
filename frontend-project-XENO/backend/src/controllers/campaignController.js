import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, paginationMeta } from '../utils/pagination.js';
import { launchCampaign, listCampaigns } from '../services/campaignService.js';
import { getSimulatorLogs, getSimulatorMetrics, updateSimulatorControl } from '../services/simulatorService.js';

export const getCampaigns = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const result = await listCampaigns({
    workspaceId: req.params.workspaceId,
    search: req.query.search,
    status: req.query.status,
    channel: req.query.channel,
    sort: ['createdAt', 'updatedAt', 'name'].includes(req.query.sort) ? req.query.sort : 'createdAt',
    order: req.query.order === 'asc' ? 'asc' : 'desc',
    page,
    limit,
    skip,
  });
  res.json({
    success: true,
    campaigns: result.campaigns,
    pagination: paginationMeta({ page, limit, total: result.total }),
  });
});

export const createCampaign = asyncHandler(async (req, res) => {
  let segmentId = req.body.segmentId;
  if (!segmentId && req.body.segment) {
    const segment = await prisma.segment.findFirst({
      where: { workspaceId: req.params.workspaceId, name: req.body.segment },
    });
    if (!segment) throw new ApiError(404, `Segment "${req.body.segment}" not found`);
    segmentId = segment.id;
  }
  if (!segmentId) throw new ApiError(400, 'segmentId is required');

  const campaign = await launchCampaign({
    workspaceId: req.params.workspaceId,
    userId: req.user.id,
    name: req.body.name,
    channel: req.body.channel,
    segmentId,
    message: req.body.message,
    messageBody: req.body.messageBody,
    messageSubject: req.body.messageSubject,
    status: req.body.status,
  });
  res.status(201).json({ success: true, campaign });
});

export const simulatorLogs = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 200);
  const logs = await getSimulatorLogs(req.params.workspaceId, limit);
  res.json({ success: true, logs });
});

export const simulatorMetrics = asyncHandler(async (req, res) => {
  const metrics = await getSimulatorMetrics(req.params.workspaceId);
  res.json({ success: true, metrics });
});

export const simulatorControl = asyncHandler(async (req, res) => {
  const status = await updateSimulatorControl(req.params.workspaceId, req.body);
  res.json({ success: true, status: { isPaused: status.isPaused, speed: status.speed } });
});
