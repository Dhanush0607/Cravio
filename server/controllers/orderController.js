import crypto from 'node:crypto';
import { Order } from '../models/Order.js';
import { Restaurant } from '../models/Restaurant.js';
import { MenuItem } from '../models/MenuItem.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { calculateQuote } from '../services/pricingService.js';
import {
  releaseCoupon,
  reserveCoupon,
  validateCoupon,
  withTransaction,
} from '../services/couponService.js';
import { CUSTOMER_CANCELLABLE_STATUSES, canTransition } from '../services/orderStatusService.js';

const orderPopulate = [
  { path: 'restaurant', select: 'name slug image bannerImage deliveryTime address' },
  { path: 'customer', select: 'name email phone' },
];

function generateOrderNumber() {
  return `CRV-${Date.now().toString(36).toUpperCase()}-${crypto
    .randomBytes(3)
    .toString('hex')
    .toUpperCase()}`;
}

function createIdempotencyKey(userId) {
  return `srv-${userId}-${crypto.randomUUID()}`;
}

function sendOrder(res, order, statusCode = 200, message = 'Order loaded.') {
  res.status(statusCode).json({
    success: true,
    message,
    data: { order },
  });
}

export const createOrder = asyncHandler(async (req, res) => {
  const { restaurantId, items, addressId, paymentMethod, couponCode, contactPhone } = req.body;

  const idempotencyKey =
    req.body.idempotencyKey || req.get('x-idempotency-key') || createIdempotencyKey(req.user._id);

  const existingOrder = await Order.findOne({ idempotencyKey });

  if (existingOrder) {
    if (existingOrder.customer.toString() !== req.user._id.toString()) {
      throw ApiError.conflict('This request key has already been used.');
    }
    await existingOrder.populate(orderPopulate);
    sendOrder(res, existingOrder, 200, 'This order was already placed.');
    return;
  }

  const restaurant = await Restaurant.findOne({ _id: restaurantId, isActive: true });
  if (!restaurant) {
    throw ApiError.notFound('Restaurant not found or currently unavailable.');
  }
  if (!restaurant.isOpen) {
    throw ApiError.badRequest('This restaurant is currently closed. Please try again later.');
  }

  const address = req.user.addresses.id(addressId);
  if (!address) {
    throw ApiError.notFound('Delivery address not found. Add or select a saved address.');
  }

  if (address.city.trim().toLowerCase() !== restaurant.address.city.trim().toLowerCase()) {
    throw ApiError.badRequest(
      `This restaurant currently delivers only within ${restaurant.address.city}.`
    );
  }

  const menuItemIds = [...new Set(items.map((item) => item.menuItemId))];
  const menuItems = await MenuItem.find({
    _id: { $in: menuItemIds },
    restaurant: restaurant._id,
  });
  const menuById = new Map(menuItems.map((item) => [item._id.toString(), item]));

  const orderItems = items.map((requested) => {
    const menuItem = menuById.get(requested.menuItemId);
    if (!menuItem) {
      throw ApiError.badRequest('One of the selected dishes is no longer on this menu.');
    }
    if (!menuItem.isAvailable) {
      throw ApiError.badRequest(`${menuItem.name} is currently unavailable.`);
    }
    if (requested.quantity < 1 || requested.quantity > 20) {
      throw ApiError.badRequest(`Choose a valid quantity for ${menuItem.name}.`);
    }

    return {
      menuItem: menuItem._id,
      name: menuItem.name,
      image: menuItem.image,
      price: menuItem.price,
      quantity: requested.quantity,
      foodType: menuItem.foodType,
      category: menuItem.category,
    };
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (subtotal < restaurant.minOrder) {
    throw ApiError.badRequest(
      `This restaurant has a minimum order of ₹${restaurant.minOrder}. Add ₹${Math.ceil(
        restaurant.minOrder - subtotal
      )} more to continue.`
    );
  }

  const { coupon, discount } = await validateCoupon({
    code: couponCode,
    userId: req.user._id,
    subtotal,
  });

  const quote = calculateQuote({
    subtotal,
    deliveryFee: restaurant.deliveryFee,
    discount,
  });

  let order;

  try {
    order = await withTransaction(async (session) => {
      await reserveCoupon(coupon, req.user._id, session);
      const [created] = await Order.create(
        [
          {
            orderNumber: generateOrderNumber(),
            customer: req.user._id,
            restaurant: restaurant._id,
            items: orderItems,
            deliveryAddress: {
              label: address.label,
              line1: address.line1,
              line2: address.line2,
              landmark: address.landmark,
              city: address.city,
              state: address.state,
              pincode: address.pincode,
            },
            contact: {
              name: req.user.name,
              phone: contactPhone || req.user.phone,
              email: req.user.email,
            },
            subtotal: quote.subtotal,
            deliveryFee: quote.deliveryFee,
            platformFee: quote.platformFee,
            discount: quote.discount,
            total: quote.total,
            coupon: {
              couponId: coupon?._id,
              code: coupon?.code || '',
              discountType: coupon?.discountType || '',
              discount: quote.discount,
            },
            couponReservationActive: Boolean(coupon),
            paymentMethod,
            paymentStatus: 'pending',
            orderStatus: 'pending',
            statusHistory: [
              {
                status: 'pending',
                note: 'Order placed by customer',
                changedBy: req.user._id,
                at: new Date(),
              },
            ],
            estimatedDeliveryMinutes: Math.round(
              (restaurant.deliveryTime.min + restaurant.deliveryTime.max) / 2
            ),
            idempotencyKey,
          },
        ],
        { session }
      );
      return created;
    });
  } catch (error) {
    if (error.code === 11000) {
      const duplicate = await Order.findOne({ idempotencyKey }).populate(orderPopulate);
      if (duplicate && duplicate.customer._id.toString() === req.user._id.toString()) {
        sendOrder(res, duplicate, 200, 'This order was already placed.');
        return;
      }
      if (coupon && error.keyPattern?.coupon && error.keyPattern?.customer) {
        throw ApiError.badRequest('You have already used this coupon the maximum number of times.');
      }
      throw ApiError.conflict('This request has already been processed.');
    }

    throw error;
  }

  await order.populate(orderPopulate);
  sendOrder(res, order, 201, 'Your order has been placed.');
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;
  const filter = { customer: req.user._id };
  if (status !== 'all') {
    filter.orderStatus = status;
  }

  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('restaurant', 'name slug image deliveryTime address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { orders },
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      hasMore: page * limit < total,
    },
  });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(orderPopulate);
  if (!order) {
    throw ApiError.notFound('Order not found.');
  }

  const isOwner = order.customer._id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    throw ApiError.forbidden('You do not have access to this order.');
  }

  sendOrder(res, order);
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await withTransaction(async (session) => {
    const current = await Order.findOne({ _id: req.params.id, customer: req.user._id }).session(
      session
    );
    if (!current) throw ApiError.notFound('Order not found.');
    if (!CUSTOMER_CANCELLABLE_STATUSES.includes(current.orderStatus)) {
      throw ApiError.badRequest(
        'This order can no longer be cancelled online. Please contact support for help.'
      );
    }
    if (current.paymentStatus === 'paid') {
      throw ApiError.badRequest(
        'This order has already been paid. Please contact support to arrange a refund.'
      );
    }
    current.orderStatus = 'cancelled';
    current.cancellation = { reason: req.body.reason, cancelledBy: req.user._id, at: new Date() };
    current.statusHistory.push({
      status: 'cancelled',
      note: req.body.reason,
      changedBy: req.user._id,
      at: new Date(),
    });
    await current.save({ session });
    await releaseCoupon(current, session);
    return current;
  });
  await order.populate(orderPopulate);

  sendOrder(res, order, 200, 'Your order has been cancelled.');
});

export const adminUpdateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await withTransaction(async (session) => {
    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      throw ApiError.notFound('Order not found.');
    }

    if (order.orderStatus === status) {
      throw ApiError.badRequest(`Order is already marked as ${status.replaceAll('_', ' ')}.`);
    }

    if (!canTransition(order.orderStatus, status)) {
      throw ApiError.badRequest(
        `Cannot move an order from ${order.orderStatus.replaceAll('_', ' ')} to ${status.replaceAll(
          '_',
          ' '
        )}.`
      );
    }

    if (status === 'cancelled' && order.paymentStatus === 'paid') {
      throw ApiError.badRequest(
        'This order has already been paid. Please arrange a refund before cancelling it.'
      );
    }

    if (
      status === 'delivered' &&
      order.paymentMethod === 'online' &&
      order.paymentStatus !== 'paid'
    ) {
      throw ApiError.badRequest('The online payment has not been completed for this order.');
    }

    if (status === 'cancelled') {
      order.cancellation = {
        reason: note || 'Cancelled by administrator',
        cancelledBy: req.user._id,
        at: new Date(),
      };
      await releaseCoupon(order, session);
    }

    if (status === 'delivered' && order.paymentMethod === 'cod') {
      order.paymentStatus = 'paid';
    }

    order.orderStatus = status;
    order.statusHistory.push({
      status,
      note: note || `Status updated to ${status.replaceAll('_', ' ')}`,
      changedBy: req.user._id,
      at: new Date(),
    });

    await order.save({ session });
    return order;
  });
  await order.populate(orderPopulate);

  sendOrder(res, order, 200, 'Order status updated.');
});
