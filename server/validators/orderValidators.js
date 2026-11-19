import { z } from 'zod';
import { objectIdSchema, paginationQuery, phoneSchema } from './shared.js';

export const orderCreateSchema = z.object({
  restaurantId: objectIdSchema,
  items: z
    .array(
      z.object({
        menuItemId: objectIdSchema,
        quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(20),
      })
    )
    .min(1, 'Add at least one item')
    .max(30),
  addressId: objectIdSchema,
  paymentMethod: z.enum(['cod', 'online']),
  couponCode: z.string().trim().toUpperCase().max(30).optional().default(''),
  contactPhone: phoneSchema.optional(),
  idempotencyKey: z.string().trim().min(8).max(100).optional(),
});

export const myOrdersQuerySchema = z.object({
  ...paginationQuery,
  status: z
    .enum(['all', 'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'])
    .default('all'),
});

export const orderIdParamsSchema = z.object({ id: objectIdSchema });

export const cancelOrderSchema = z.object({
  reason: z.string().trim().min(5, 'Provide a reason').max(300),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'preparing',
    'out_for_delivery',
    'delivered',
    'cancelled',
  ]),
  note: z.string().trim().max(300).optional().default(''),
});

export const adminOrderListQuerySchema = z.object({
  ...paginationQuery,
  search: z.string().trim().max(100).optional(),
  status: z
    .enum(['all', 'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'])
    .default('all'),
  paymentStatus: z.enum(['all', 'pending', 'paid', 'failed', 'refunded']).default('all'),
  restaurant: objectIdSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const validateCouponSchema = z.object({
  code: z.string().trim().toUpperCase().min(2, 'Enter a coupon code').max(30),
  subtotal: z.coerce.number().min(1, 'Cart subtotal is required').max(1000000),
});

export const couponParamsSchema = z.object({ id: objectIdSchema });

const couponShape = {
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{3,30}$/, 'Use 3-30 letters, numbers, dashes or underscores'),
  description: z.string().trim().max(240).optional().default(''),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number().min(1).max(100000),
  minimumOrderAmount: z.coerce.number().min(0).max(1000000).optional().default(0),
  maximumDiscount: z.coerce.number().min(0).max(100000).nullable().optional().default(null),
  expiryDate: z.coerce.date(),
  usageLimit: z.coerce.number().int().min(1).max(1000000).nullable().optional().default(null),
  perUserLimit: z.coerce.number().int().min(1).max(100).optional().default(1),
  isActive: z.boolean().optional().default(true),
};

export const createCouponSchema = z
  .object(couponShape)
  .refine((data) => data.discountType !== 'percentage' || data.discountValue <= 100, {
    path: ['discountValue'],
    message: 'Percentage discounts cannot exceed 100',
  });

export const updateCouponSchema = z
  .object(couponShape)
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Provide at least one field to update');

export const paymentCreateSchema = z.object({ orderId: objectIdSchema });

export const paymentVerifySchema = z.object({
  orderId: objectIdSchema,
  providerOrderId: z.string().trim().min(3).max(200),
  providerPaymentId: z.string().trim().max(200).optional().default(''),
  signature: z.string().trim().max(500).optional().default(''),
});
