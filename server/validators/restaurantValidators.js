import { z } from 'zod';
import { objectIdSchema, paginationQuery } from './shared.js';

const imagePathSchema = z.string().trim().min(1, 'Image is required').max(600);

export const restaurantListQuerySchema = z.object({
  ...paginationQuery,
  search: z.string().trim().max(100).optional(),
  city: z.string().trim().max(80).optional(),
  cuisine: z.string().trim().max(60).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sort: z.enum(['featured', 'rating', 'delivery', 'price_low', 'newest']).default('featured'),
  featured: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
});

export const restaurantParamsSchema = z.object({
  identifier: z.string().trim().min(1).max(120),
});

export const restaurantIdParamsSchema = z.object({ id: objectIdSchema });

export const menuQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(80).optional(),
  foodType: z.enum(['veg', 'non-veg', 'egg']).optional(),
  sort: z.enum(['recommended', 'price_low', 'price_high', 'name']).default('recommended'),
});

export const globalMenuQuerySchema = z.object({
  ...paginationQuery,
  search: z.string().trim().min(1, 'Search term is required').max(100),
  city: z.string().trim().max(80).optional(),
  foodType: z.enum(['veg', 'non-veg', 'egg']).optional(),
});

export const topMenuQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(12).default(6),
  city: z.string().trim().max(80).optional(),
});

const restaurantAddressSchema = z.object({
  line1: z.string().trim().min(3).max(180),
  area: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
});

const restaurantShape = {
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(800),
  image: imagePathSchema,
  bannerImage: imagePathSchema,
  cuisines: z.array(z.string().trim().min(1).max(40)).min(1, 'Add at least one cuisine').max(10),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).optional().default([]),
  rating: z.coerce.number().min(0).max(5).optional().default(4.2),
  ratingCount: z.coerce.number().int().min(0).optional().default(0),
  deliveryTime: z.object({
    min: z.coerce.number().int().min(5).max(180),
    max: z.coerce.number().int().min(5).max(240),
  }),
  deliveryFee: z.coerce.number().min(0).max(500).optional().default(29),
  minOrder: z.coerce.number().min(0).max(10000).optional().default(149),
  priceForTwo: z.coerce.number().min(0).max(50000).optional().default(400),
  offer: z.string().trim().max(120).optional().default(''),
  address: restaurantAddressSchema,
  location: z
    .object({
      coordinates: z.array(z.number()).length(2),
    })
    .optional(),
  isActive: z.boolean().optional().default(true),
  isOpen: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
};

export const createRestaurantSchema = z.object(restaurantShape).refine(
  (data) => data.deliveryTime.max >= data.deliveryTime.min,
  { path: ['deliveryTime', 'max'], message: 'Maximum delivery time must be at least the minimum' }
);

export const updateRestaurantSchema = z
  .object(restaurantShape)
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Provide at least one field to update');

const menuShape = {
  restaurant: objectIdSchema,
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(5).max(500),
  image: imagePathSchema,
  price: z.coerce.number().min(1).max(100000),
  category: z.string().trim().min(2).max(80),
  foodType: z.enum(['veg', 'non-veg', 'egg']).default('veg'),
  isAvailable: z.boolean().optional().default(true),
  isRecommended: z.boolean().optional().default(false),
  preparationTime: z.coerce.number().int().min(1).max(120).optional().default(15),
};

export const createMenuItemSchema = z.object(menuShape);

export const updateMenuItemSchema = z
  .object(menuShape)
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Provide at least one field to update');

export const menuItemParamsSchema = z.object({ id: objectIdSchema });
