import multer from 'multer';
import { env } from '../config/env.js';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.uploadMaxMb * 1024 * 1024,
    files: 4,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      return cb(new Error('Only CSV files are supported'));
    }
    return cb(null, true);
  },
});
