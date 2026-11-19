import { Restaurant } from '../models/Restaurant.js';
import { MenuItem } from '../models/MenuItem.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function activeRestaurantIds(city) {
  const filter = { isActive: true };
  if (city) {
    filter['address.city'] = new RegExp(`^${escapeRegex(city)}$`, 'i');
  }
  return Restaurant.find(filter).distinct('_id');
}

export const searchMenu = asyncHandler(async (req, res) => {
  const { page, limit, search, city, foodType } = req.query;
  const restaurantIds = await activeRestaurantIds(city);
  const pattern = new RegExp(escapeRegex(search), 'i');

  const filter = {
    restaurant: { $in: restaurantIds },
    isAvailable: true,
    $or: [{ name: pattern }, { description: pattern }, { category: pattern }],
  };

  if (foodType) {
    filter.foodType = foodType;
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    MenuItem.find(filter)
      .populate('restaurant', 'name slug image deliveryTime rating address.city isOpen')
      .sort({ isRecommended: -1, name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    MenuItem.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { items },
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      hasMore: page * limit < total,
    },
  });
});

export const getTopDishes = asyncHandler(async (req, res) => {
  const { limit, city } = req.query;
  const restaurantIds = await activeRestaurantIds(city);

  const items = await MenuItem.find({
    restaurant: { $in: restaurantIds },
    isAvailable: true,
    isRecommended: true,
  })
    .populate('restaurant', 'name slug image deliveryTime rating address.city isOpen')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.json({ success: true, data: { items } });
});

export const getMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id)
    .populate('restaurant', 'name slug image deliveryTime rating address.city isOpen isActive')
    .lean();

  if (!item || !item.restaurant?.isActive) {
    throw ApiError.notFound('Menu item not found.');
  }

  res.json({ success: true, data: { item } });
});
