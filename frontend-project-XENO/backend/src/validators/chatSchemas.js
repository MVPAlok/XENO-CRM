import { z } from 'zod';

export const createConversationSchema = z.object({
  title: z.string().min(1).max(160).default('New Conversation'),
});

export const createMessageSchema = z.object({
  text: z.string().min(1).max(4000),
});
