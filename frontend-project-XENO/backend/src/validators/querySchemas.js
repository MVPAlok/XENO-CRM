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
  // Advanced filters for real backend-driven filtering
  spendMin: z.string().optional(),
  spendMax: z.string().optional(),
  ordersMin: z.string().optional(),
  ordersMax: z.string().optional(),
  lastPurchaseWithin: z.string().optional(),  // days
  lastPurchaseOver: z.string().optional(),     // days
  segmentId: z.string().uuid().optional(),
});

export const logsQuerySchema = z.object({
  limit: z.string().optional(),
});
