import { asyncHandler } from '../utils/asyncHandler.js';
import { subscribeToWorkspace, unsubscribeFromWorkspace } from '../services/sseService.js';

export const workspaceEvents = asyncHandler(async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  res.write(`event: connected\ndata: ${JSON.stringify({ workspaceId: req.params.workspaceId })}\n\n`);
  subscribeToWorkspace(req.params.workspaceId, res);

  req.on('close', () => {
    unsubscribeFromWorkspace(req.params.workspaceId, res);
  });
});
