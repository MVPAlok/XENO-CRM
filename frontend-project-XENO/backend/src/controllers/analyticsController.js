import { asyncHandler } from '../utils/asyncHandler.js';
import { getWorkspaceAnalytics } from '../services/analyticsService.js';

export const overview = asyncHandler(async (req, res) => {
  const analytics = await getWorkspaceAnalytics(req.params.workspaceId);
  res.json({ success: true, ...analytics });
});
