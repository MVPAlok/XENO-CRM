import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { createWorkspaceForUser, duplicateWorkspace, serializeWorkspace } from '../services/workspaceService.js';

export const listWorkspaces = asyncHandler(async (req, res) => {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: req.user.id, workspace: { isArchived: false } },
    include: { workspace: true },
    orderBy: { joinedAt: 'asc' },
  });

  const workspaces = await Promise.all(
    memberships.map((membership) => serializeWorkspace(membership.workspace, membership.role))
  );

  res.json({ success: true, workspaces });
});

export const createWorkspace = asyncHandler(async (req, res) => {
  const name = req.body.name || req.body.brandName;
  const workspace = await createWorkspaceForUser({
    userId: req.user.id,
    name,
    description: req.body.description,
    industry: req.body.industry,
    businessType: req.body.businessType,
    primaryChannel: req.body.primaryChannel,
    monthlyCustomers: req.body.monthlyCustomers,
  });
  res.status(201).json({ success: true, workspace });
});

export const getWorkspace = asyncHandler(async (req, res) => {
  const workspace = await serializeWorkspace(req.workspace, req.workspaceMembership.role);
  res.json({ success: true, workspace });
});

export const updateWorkspace = asyncHandler(async (req, res) => {
  const name = req.body.name || req.body.brandName;
  const workspace = await prisma.workspace.update({
    where: { id: req.params.workspaceId },
    data: {
      ...(name && { name }),
      ...(req.body.description !== undefined && { description: req.body.description }),
      ...(req.body.industry && { industry: req.body.industry }),
      ...(req.body.businessType && { businessType: req.body.businessType }),
      ...(req.body.primaryChannel && { primaryChannel: req.body.primaryChannel }),
      ...(req.body.monthlyCustomers && { monthlyCustomers: req.body.monthlyCustomers }),
      ...(typeof req.body.isArchived === 'boolean' && { isArchived: req.body.isArchived }),
    },
  });
  res.json({ success: true, workspace: await serializeWorkspace(workspace, req.workspaceMembership.role) });
});

export const cloneWorkspace = asyncHandler(async (req, res) => {
  const workspace = await duplicateWorkspace({ workspaceId: req.params.workspaceId, userId: req.user.id });
  res.status(201).json({ success: true, workspace });
});

export const deleteWorkspace = asyncHandler(async (req, res) => {
  const membership = req.workspaceMembership;
  if (membership.role !== 'OWNER' && req.user.role !== 'SUPER_ADMIN') {
    throw new ApiError(403, 'Only workspace owners can delete workspaces');
  }

  await prisma.workspace.delete({ where: { id: req.params.workspaceId } });
  res.json({ success: true, message: 'Workspace deleted successfully' });
});
