import { z } from 'zod';
import { objectIdSchema, paginationQuery } from './shared.js';

export const adminListQuerySchema = z.object({
  ...paginationQuery,
  search: z.string().trim().max(100).optional(),
  status: z.enum(['all', 'active', 'inactive']).default('all'),
});

export const adminMenuQuerySchema = z.object({
  ...paginationQuery,
  restaurant: objectIdSchema.optional(),
  search: z.string().trim().max(100).optional(),
  availability: z.enum(['all', 'available', 'unavailable']).default('all'),
});

export const customerStatusSchema = z.object({
  isActive: z.boolean(),
});

export const customerParamsSchema = z.object({ id: objectIdSchema });
