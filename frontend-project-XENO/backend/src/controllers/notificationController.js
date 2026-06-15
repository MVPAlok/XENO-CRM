import { asyncHandler } from '../utils/asyncHandler.js';
import { listNotifications, markNotificationsRead, unreadNotificationCount } from '../services/notificationService.js';

export const notifications = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 100);
  const items = await listNotifications({
    workspaceId: req.params.workspaceId,
    userId: req.user.id,
    limit,
  });
  res.json({
    success: true,
    notifications: items.map((item) => ({
      id: item.id,
      text: item.message,
      title: item.title,
      type: item.type,
      read: Boolean(item.readAt),
      time: item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' today',
      data: item.data,
      createdAt: item.createdAt,
    })),
  });
});

export const unreadCount = asyncHandler(async (req, res) => {
  const count = await unreadNotificationCount({
    workspaceId: req.params.workspaceId,
    userId: req.user.id,
  });
  res.json({ success: true, count });
});

export const markRead = asyncHandler(async (req, res) => {
  const result = await markNotificationsRead({
    workspaceId: req.params.workspaceId,
    userId: req.user.id,
    ids: req.body.ids || [],
  });
  res.json({ success: true, updated: result.count });
});
