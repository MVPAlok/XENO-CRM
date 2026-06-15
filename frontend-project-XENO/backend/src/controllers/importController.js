import { asyncHandler } from '../utils/asyncHandler.js';
import { ingestCsvFiles } from '../services/importService.js';

export const importCsv = asyncHandler(async (req, res) => {
  const job = await ingestCsvFiles({
    workspaceId: req.params.workspaceId,
    userId: req.user.id,
    files: req.files,
  });
  res.status(201).json({ success: true, importJob: job });
});
