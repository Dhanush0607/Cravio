import mongoose from 'mongoose';
import { Restaurant } from '../models/Restaurant.js';
import { MenuItem } from '../models/MenuItem.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function listSort(sort) {
  switch (sort) {
    case 'rating':
      return { rating: -1, ratingCount: -1 };
    case 'delivery':
      return { 'deliveryTime.min': 1 };
    case 'price_low':
      return { priceForTwo: 1 };
    case 'newest':
      return { createdAt: -1 };
    case 'featured':
    default:
      return { featured: -1, rating: -1 };
  }
}

export const listRestaurants = asyncHandler(async (req, res) => {
  const { page, limit, search, city, cuisine, minRating, sort, featured } = req.query;
  const filter = { isActive: true };

  if (city) {
    filter['address.city'] = new RegExp(`^${escapeRegex(city)}$`, 'i');
  }

  if (cuisine) {
    filter.cuisines = new RegExp(`^${escapeRegex(cuisine)}$`, 'i');
  }

  if (minRating !== undefined) {
    filter.rating = { $gte: minRating };
  }

  if (featured !== undefined) {
    filter.featured = featured;
  }

  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [
      { name: pattern },
      { description: pattern },
      { cuisines: pattern },
      { tags: pattern },
    ];
  }

  const skip = (page - 1) * limit;
  const [restaurants, total] = await Promise.all([
    Restaurant.find(filter)
      .sort(listSort(sort))
      .skip(skip)
      .limit(limit)
      .select('-location')
      .lean(),
    Restaurant.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { restaurants },
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      hasMore: page * limit < total,
    },
  });
});

export const getCuisines = asyncHandler(async (req, res) => {
  const city = req.query.city;
  const match = { isActive: true };
  if (city) {
    match['address.city'] = new RegExp(`^${escapeRegex(city)}$`, 'i');
  }

  const cuisines = await Restaurant.distinct('cuisines', match);
  res.json({ success: true, data: { cuisines: cuisines.sort() } });
});

export const getRestaurant = asyncHandler(async (req, res) => {
  const { identifier } = req.params;
  const query = mongoose.isValidObjectId(identifier)
    ? { _id: identifier, isActive: true }
    : { slug: identifier.toLowerCase(), isActive: true };

  const restaurant = await Restaurant.findOne(query).lean();

  if (!restaurant) {
    throw ApiError.notFound('Restaurant not found or currently unavailable.');
  }

  res.json({ success: true, data: { restaurant } });
});

export const getRestaurantMenu = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ _id: req.params.id, isActive: true }).lean();
  if (!restaurant) {
    throw ApiError.notFound('Restaurant not found or currently unavailable.');
  }

  const { search, category, foodType, sort } = req.query;
  const filter = { restaurant: restaurant._id };

  if (category) {
    filter.category = new RegExp(`^${escapeRegex(category)}$`, 'i');
  }
  if (foodType) {
    filter.foodType = foodType;
  }
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: pattern }, { description: pattern }, { category: pattern }];
  }

  const sortMap = {
    recommended: { isRecommended: -1, isAvailable: -1, name: 1 },
    price_low: { price: 1 },
    price_high: { price: -1 },
    name: { name: 1 },
  };

  const items = await MenuItem.find(filter).sort(sortMap[sort]).lean();

  res.json({
    success: true,
    data: {
      restaurant,
      items,
      categories: [...new Set(items.map((item) => item.category))],
    },
  });
});
