import { z } from 'zod';

export const listQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  status: z.string().optional(),
  city: z.string().optional(),
  channel: z.string().optional(),
});

export const logsQuerySchema = z.object({
  limit: z.string().optional(),
});
