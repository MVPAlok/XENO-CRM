import { z } from 'zod';

export const createCampaignSchema = z.object({
  name: z.string().min(1).max(160),
  channel: z.enum(['WhatsApp', 'Email', 'SMS', 'RCS']),
  segmentId: z.string().uuid().optional(),
  segment: z.string().optional(),
  message: z.string().optional(),
  messageBody: z.string().optional(),
  messageSubject: z.string().max(160).optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'FAILED', 'Draft', 'Scheduled', 'Running', 'Completed', 'Failed']).default('RUNNING'),
}).refine((data) => data.message || data.messageBody, {
  message: 'message or messageBody is required',
});

export const simulatorControlSchema = z.object({
  action: z.enum(['pause', 'resume']).optional(),
  isPaused: z.boolean().optional(),
  speed: z.number().int().min(1).max(30).optional(),
});
