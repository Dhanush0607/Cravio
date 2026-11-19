import { z } from 'zod';

export const assistantChatSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Ask a question to continue.')
    .max(500, 'Keep questions under 500 characters.'),
  city: z.string().trim().max(60).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(1000),
      })
    )
    .max(8, 'Conversation history is too long.')
    .default([]),
});
