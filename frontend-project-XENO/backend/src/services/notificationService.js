import { prisma } from '../config/prisma.js';
import { publishWorkspaceEvent } from './sseService.js';

export const createNotification = async ({
  workspaceId,
  userId = null,
  type = 'INFO',
  title,
  message,
  data = {},
}) => {
  const notification = await prisma.notification.create({
    data: {
      workspaceId,
      userId,
      type,
      title,
      message,
      data,
    },
  });

  publishWorkspaceEvent(workspaceId, 'notification', notification);
  return notification;
};

export const listNotifications = async ({ workspaceId, userId, limit = 50 }) =>
  prisma.notification.findMany({
    where: {
      workspaceId,
      OR: [{ userId }, { userId: null }],
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

export const unreadNotificationCount = async ({ workspaceId, userId }) =>
  prisma.notification.count({
    where: {
      workspaceId,
      readAt: null,
      OR: [{ userId }, { userId: null }],
    },
  });

export const markNotificationsRead = async ({ workspaceId, userId, ids = [] }) => {
  const where = {
    workspaceId,
    OR: [{ userId }, { userId: null }],
    readAt: null,
  };

  if (ids.length > 0) where.id = { in: ids };

  return prisma.notification.updateMany({
    where,
    data: { readAt: new Date() },
  });
};
