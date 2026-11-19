import { User } from '../models/User.js';
import { Restaurant } from '../models/Restaurant.js';
import { MenuItem } from '../models/MenuItem.js';
import { Coupon } from '../models/Coupon.js';
import { Order } from '../models/Order.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { storeImage } from '../services/uploadService.js';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function paginationMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
    hasMore: page * limit < total,
  };
}

function restaurantPayload(body) {
  const payload = { ...body };
  if (body.location?.coordinates) {
    payload.location = { type: 'Point', coordinates: body.location.coordinates };
  }
  return payload;
}

export const getDashboard = asyncHandler(async (_req, res) => {
  const weekStart = new Date();
  weekStart.setUTCHours(0, 0, 0, 0);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);

  const [
    totalCustomers,
    totalRestaurants,
    totalOrders,
    revenueResult,
    pendingOrders,
    completedOrders,
    recentOrders,
    statusCounts,
    salesRaw,
  ] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    Restaurant.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.countDocuments({ orderStatus: 'pending' }),
    Order.countDocuments({ orderStatus: 'delivered' }),
    Order.find()
      .populate('customer', 'name email')
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: weekStart },
          orderStatus: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const salesByDay = new Map(salesRaw.map((day) => [day._id, day]));
  const salesOverview = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setUTCDate(weekStart.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    const entry = salesByDay.get(key);
    return {
      date: key,
      revenue: entry?.revenue || 0,
      orders: entry?.orders || 0,
    };
  });

  res.json({
    success: true,
    data: {
      stats: {
        totalCustomers,
        totalRestaurants,
        totalOrders,
        totalRevenue: revenueResult[0]?.total || 0,
        pendingOrders,
        completedOrders,
      },
      statusCounts: statusCounts.reduce((result, row) => {
        result[row._id] = row.count;
        return result;
      }, {}),
      salesOverview,
      recentOrders,
    },
  });
});

export const listRestaurants = asyncHandler(async (req, res) => {
  const { page, limit, search, status } = req.query;
  const filter = {};

  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;

  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: pattern }, { cuisines: pattern }, { 'address.city': pattern }];
  }

  const skip = (page - 1) * limit;
  const [restaurants, total] = await Promise.all([
    Restaurant.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Restaurant.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { restaurants },
    meta: paginationMeta(page, limit, total),
  });
});

export const createRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.create(restaurantPayload(req.body));
  res.status(201).json({
    success: true,
    message: 'Restaurant created.',
    data: { restaurant },
  });
});

export const updateRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) {
    throw ApiError.notFound('Restaurant not found.');
  }

  Object.assign(restaurant, restaurantPayload(req.body));
  await restaurant.save();

  res.json({
    success: true,
    message: 'Restaurant updated.',
    data: { restaurant },
  });
});

export const deactivateRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) {
    throw ApiError.notFound('Restaurant not found.');
  }

  restaurant.isActive = false;
  restaurant.isOpen = false;
  await restaurant.save();

  res.json({
    success: true,
    message: 'Restaurant deactivated. Existing orders remain available.',
    data: { restaurant },
  });
});

export const listMenuItems = asyncHandler(async (req, res) => {
  const { page, limit, restaurant, search, availability } = req.query;
  const filter = {};

  if (restaurant) filter.restaurant = restaurant;
  if (availability === 'available') filter.isAvailable = true;
  if (availability === 'unavailable') filter.isAvailable = false;

  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: pattern }, { category: pattern }];
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    MenuItem.find(filter)
      .populate('restaurant', 'name slug isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    MenuItem.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { items },
    meta: paginationMeta(page, limit, total),
  });
});

export const createMenuItem = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.body.restaurant);
  if (!restaurant) {
    throw ApiError.notFound('Restaurant not found.');
  }

  const item = await MenuItem.create(req.body);
  await item.populate('restaurant', 'name slug isActive');

  res.status(201).json({
    success: true,
    message: 'Menu item created.',
    data: { item },
  });
});

export const updateMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) {
    throw ApiError.notFound('Menu item not found.');
  }

  if (req.body.restaurant) {
    const restaurant = await Restaurant.findById(req.body.restaurant);
    if (!restaurant) {
      throw ApiError.notFound('Restaurant not found.');
    }
  }

  Object.assign(item, req.body);
  await item.save();
  await item.populate('restaurant', 'name slug isActive');

  res.json({
    success: true,
    message: 'Menu item updated.',
    data: { item },
  });
});

export const deleteMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndDelete(req.params.id);
  if (!item) {
    throw ApiError.notFound('Menu item not found.');
  }

  res.json({
    success: true,
    message: 'Menu item deleted. Historical orders retain their item snapshots.',
  });
});

export const listOrders = asyncHandler(async (req, res) => {
  const { page, limit, search, status, paymentStatus, restaurant, from, to } = req.query;
  const filter = {};

  if (status !== 'all') filter.orderStatus = status;
  if (paymentStatus !== 'all') filter.paymentStatus = paymentStatus;
  if (restaurant) filter.restaurant = restaurant;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = from;
    if (to) filter.createdAt.$lte = to;
  }

  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    const matchingCustomers = await User.find({
      $or: [{ name: pattern }, { email: pattern }, { phone: pattern }],
    }).distinct('_id');

    filter.$or = [
      { orderNumber: pattern },
      { 'contact.name': pattern },
      { 'contact.phone': pattern },
      { customer: { $in: matchingCustomers } },
    ];
  }

  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('customer', 'name email phone')
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { orders },
    meta: paginationMeta(page, limit, total),
  });
});

export const listCoupons = asyncHandler(async (req, res) => {
  const { page, limit, search, status } = req.query;
  const filter = {};

  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;
  if (search) {
    filter.$or = [
      { code: new RegExp(escapeRegex(search), 'i') },
      { description: new RegExp(escapeRegex(search), 'i') },
    ];
  }

  const skip = (page - 1) * limit;
  const [coupons, total] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Coupon.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { coupons },
    meta: paginationMeta(page, limit, total),
  });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create({
    ...req.body,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Coupon created.',
    data: { coupon },
  });
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    throw ApiError.notFound('Coupon not found.');
  }

  const nextType = req.body.discountType || coupon.discountType;
  const nextValue =
    req.body.discountValue !== undefined ? req.body.discountValue : coupon.discountValue;

  if (nextType === 'percentage' && nextValue > 100) {
    throw ApiError.badRequest('Percentage discounts cannot exceed 100.');
  }

  Object.assign(coupon, req.body);
  await coupon.save();

  res.json({
    success: true,
    message: 'Coupon updated.',
    data: { coupon },
  });
});

export const deactivateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    throw ApiError.notFound('Coupon not found.');
  }

  coupon.isActive = false;
  await coupon.save();

  res.json({
    success: true,
    message: 'Coupon deactivated.',
    data: { coupon },
  });
});

export const listCustomers = asyncHandler(async (req, res) => {
  const { page, limit, search, status } = req.query;
  const filter = { role: 'customer' };

  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;

  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }, { phone: pattern }];
  }

  const skip = (page - 1) * limit;
  const [customers, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  const orderCounts = await Order.aggregate([
    { $match: { customer: { $in: customers.map((customer) => customer._id) } } },
    { $group: { _id: '$customer', count: { $sum: 1 }, spent: { $sum: '$total' } } },
  ]);
  const countsByCustomer = new Map(orderCounts.map((row) => [row._id.toString(), row]));

  res.json({
    success: true,
    data: {
      customers: customers.map((customer) => ({
        ...customer.toJSON(),
        orderCount: countsByCustomer.get(customer._id.toString())?.count || 0,
        totalSpent: countsByCustomer.get(customer._id.toString())?.spent || 0,
      })),
    },
    meta: paginationMeta(page, limit, total),
  });
});

export const updateCustomerStatus = asyncHandler(async (req, res) => {
  const customer = await User.findOne({ _id: req.params.id, role: 'customer' });
  if (!customer) {
    throw ApiError.notFound('Customer not found.');
  }

  customer.isActive = req.body.isActive;
  await customer.save();

  res.json({
    success: true,
    message: customer.isActive ? 'Customer account re-enabled.' : 'Customer account disabled.',
    data: { customer: customer.toJSON() },
  });
});

export const uploadImage = asyncHandler(async (req, res) => {
  const result = await storeImage(req.file);
  res.status(201).json({
    success: true,
    message: 'Image uploaded.',
    data: result,
  });
});
