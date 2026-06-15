import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requireWorkspaceMember = asyncHandler(async (req, _res, next) => {
  const workspaceId = req.params.workspaceId || req.params.id;
  if (!workspaceId) throw new ApiError(400, 'workspaceId is required');

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      isArchived: false,
      memberships:
        req.user.role === 'SUPER_ADMIN'
          ? undefined
          : {
              some: {
                userId: req.user.id,
              },
            },
    },
    include: {
      memberships: {
        where: { userId: req.user.id },
        take: 1,
      },
    },
  });

  if (!workspace) throw new ApiError(404, 'Workspace not found or access denied');
  req.workspace = workspace;
  req.workspaceMembership = workspace.memberships[0] || { role: 'OWNER' };
  return next();
});

export const requireWorkspaceRole = (...roles) => (req, _res, next) => {
  if (req.user.role === 'SUPER_ADMIN') return next();
  if (!req.workspaceMembership) return next(new ApiError(403, 'Workspace access required'));
  if (roles.includes(req.workspaceMembership.role)) return next();
  return next(new ApiError(403, 'Insufficient workspace permissions'));
};
