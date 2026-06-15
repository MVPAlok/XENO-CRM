import { Router } from 'express';
import {
  cloneWorkspace,
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  listWorkspaces,
  updateWorkspace,
} from '../controllers/workspaceController.js';
import { overview } from '../controllers/analyticsController.js';
import { getCustomer, listCustomers } from '../controllers/customerController.js';
import { importCsv } from '../controllers/importController.js';
import { createSegment, listSegments } from '../controllers/segmentController.js';
import { createCampaign, getCampaigns, simulatorControl, simulatorLogs, simulatorMetrics } from '../controllers/campaignController.js';
import { createConversation, listConversations, sendMessage } from '../controllers/chatController.js';
import { markRead, notifications, unreadCount } from '../controllers/notificationController.js';
import { workspaceEvents } from '../controllers/sseController.js';
import { protect } from '../middleware/auth.js';
import { requireWorkspaceMember, requireWorkspaceRole } from '../middleware/workspace.js';
import { upload } from '../middleware/upload.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createWorkspaceSchema, updateWorkspaceSchema } from '../validators/workspaceSchemas.js';
import { listQuerySchema, logsQuerySchema } from '../validators/querySchemas.js';
import { createSegmentSchema } from '../validators/segmentSchemas.js';
import { createCampaignSchema, simulatorControlSchema } from '../validators/campaignSchemas.js';
import { createConversationSchema, createMessageSchema } from '../validators/chatSchemas.js';
import { markReadSchema } from '../validators/notificationSchemas.js';

const router = Router();

router.use(protect);

router.route('/').get(listWorkspaces).post(validateBody(createWorkspaceSchema), createWorkspace);

router.use('/:workspaceId', requireWorkspaceMember);

router.get('/:workspaceId', getWorkspace);
router.patch(
  '/:workspaceId',
  requireWorkspaceRole('OWNER', 'ADMIN'),
  validateBody(updateWorkspaceSchema),
  updateWorkspace
);
router.delete('/:workspaceId', requireWorkspaceRole('OWNER'), deleteWorkspace);
router.post('/:workspaceId/duplicate', requireWorkspaceRole('OWNER', 'ADMIN'), cloneWorkspace);

router.get('/:workspaceId/customers', validateQuery(listQuerySchema), listCustomers);
router.get('/:workspaceId/customers/:customerId', getCustomer);

router.get('/:workspaceId/segments', listSegments);
router.post('/:workspaceId/segments', requireWorkspaceRole('OWNER', 'ADMIN', 'MEMBER'), validateBody(createSegmentSchema), createSegment);

router.post(
  '/:workspaceId/imports',
  requireWorkspaceRole('OWNER', 'ADMIN', 'MEMBER'),
  upload.any(),
  importCsv
);

router.get('/:workspaceId/analytics/overview', overview);

router.get('/:workspaceId/campaigns', validateQuery(listQuerySchema), getCampaigns);
router.post(
  '/:workspaceId/campaigns',
  requireWorkspaceRole('OWNER', 'ADMIN', 'MEMBER'),
  validateBody(createCampaignSchema),
  createCampaign
);
router.get('/:workspaceId/campaigns/simulator/logs', validateQuery(logsQuerySchema), simulatorLogs);
router.get('/:workspaceId/campaigns/simulator/metrics', simulatorMetrics);
router.post('/:workspaceId/campaigns/simulator/control', validateBody(simulatorControlSchema), simulatorControl);

router.get('/:workspaceId/chats/conversations', listConversations);
router.post('/:workspaceId/chats/conversations', validateBody(createConversationSchema), createConversation);
router.post('/:workspaceId/chats/conversations/:conversationId/messages', validateBody(createMessageSchema), sendMessage);

router.get('/:workspaceId/notifications', notifications);
router.get('/:workspaceId/notifications/unread-count', unreadCount);
router.post('/:workspaceId/notifications/read', validateBody(markReadSchema), markRead);

router.get('/:workspaceId/events', workspaceEvents);

export default router;
