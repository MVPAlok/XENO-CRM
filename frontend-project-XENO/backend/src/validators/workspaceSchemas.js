import { z } from 'zod';

export const workspaceParamsSchema = z.object({
  workspaceId: z.string().uuid(),
});

export const idParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  brandName: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional().or(z.literal('')),
  industry: z.string().max(120).optional(),
  businessType: z.string().max(120).optional(),
  primaryChannel: z.string().max(40).optional(),
  monthlyCustomers: z.string().max(40).optional(),
}).refine((data) => data.name || data.brandName, {
  message: 'name or brandName is required',
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  brandName: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional().or(z.literal('')),
  industry: z.string().max(120).optional(),
  businessType: z.string().max(120).optional(),
  primaryChannel: z.string().max(40).optional(),
  monthlyCustomers: z.string().max(40).optional(),
  isArchived: z.boolean().optional(),
});
