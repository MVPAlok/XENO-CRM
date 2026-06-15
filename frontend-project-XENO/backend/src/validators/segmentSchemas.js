import { z } from 'zod';

export const segmentRuleSchema = z.object({
  field: z.enum(['city', 'totalSpend', 'lastPurchaseDays', 'lastPurchaseDaysAgo', 'orderCount', 'totalOrders', 'couponSensitive']),
  operator: z.enum(['=', 'equals', 'eq', '!=', 'not_equals', '>', 'gt', '>=', 'gte', '<', 'lt', '<=', 'lte']),
  value: z.string().min(1),
});

export const createSegmentSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  rules: z.array(segmentRuleSchema).min(1).max(10),
});
