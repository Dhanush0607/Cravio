import mongoose from 'mongoose';
import { Coupon } from '../models/Coupon.js';
import { CouponCustomerUsage } from '../models/CouponCustomerUsage.js';
import { Order } from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import { roundCurrency } from './pricingService.js';

function calculateDiscount(coupon, subtotal) {
  let discount =
    coupon.discountType === 'percentage'
      ? (subtotal * coupon.discountValue) / 100
      : coupon.discountValue;

  if (coupon.maximumDiscount != null) {
    discount = Math.min(discount, coupon.maximumDiscount);
  }

  return roundCurrency(Math.min(discount, subtotal));
}

export async function validateCoupon({ code, userId, subtotal }) {
  if (!code) {
    return { coupon: null, discount: 0 };
  }

  const normalizedCode = code.toUpperCase().trim();
  const coupon = await Coupon.findOne({ code: normalizedCode });

  if (!coupon || !coupon.isActive) {
    throw ApiError.badRequest('This coupon is invalid or no longer active.');
  }

  if (coupon.expiryDate.getTime() <= Date.now()) {
    throw ApiError.badRequest('This coupon has expired.');
  }

  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
    throw ApiError.badRequest('This coupon has reached its usage limit.');
  }

  if (subtotal < coupon.minimumOrderAmount) {
    throw ApiError.badRequest(
      `Add items worth ₹${Math.ceil(coupon.minimumOrderAmount - subtotal)} more to use ${coupon.code}.`
    );
  }

  if (userId) {
    const userUsage = await Order.countDocuments({
      customer: userId,
      'coupon.couponId': coupon._id,
      orderStatus: { $ne: 'cancelled' },
    });

    const reservation = await CouponCustomerUsage.findOne({ coupon: coupon._id, customer: userId });
    const activeUsage = reservation?.usageCount || 0;
    if (userUsage >= coupon.perUserLimit || activeUsage >= coupon.perUserLimit) {
      throw ApiError.badRequest('You have already used this coupon the maximum number of times.');
    }
  }

  return {
    coupon,
    discount: calculateDiscount(coupon, subtotal),
  };
}

export async function listRedeemableCoupons(limit = 4) {
  const now = new Date();
  return Coupon.find({
    isActive: true,
    expiryDate: { $gt: now },
    $or: [{ usageLimit: null }, { $expr: { $lt: ['$usageCount', '$usageLimit'] } }],
  })
    .select(
      'code description discountType discountValue minimumOrderAmount maximumDiscount expiryDate'
    )
    .sort({ discountValue: -1 })
    .limit(limit)
    .lean();
}

export async function reserveCoupon(coupon, userId, session) {
  if (!coupon) {
    return null;
  }

  const filter = {
    _id: coupon._id,
    isActive: true,
    expiryDate: { $gt: new Date() },
  };

  if (coupon.usageLimit != null) {
    filter.$expr = { $lt: ['$usageCount', '$usageLimit'] };
  }

  const reserved = await Coupon.findOneAndUpdate(
    filter,
    { $inc: { usageCount: 1 } },
    { new: true, session }
  );

  if (!reserved) {
    throw ApiError.badRequest('This coupon has reached its usage limit.');
  }

  const existingReservation = await CouponCustomerUsage.findOne({
    coupon: coupon._id,
    customer: userId,
  }).session(session);
  const existingOrders = await Order.countDocuments({
    customer: userId,
    'coupon.couponId': coupon._id,
    orderStatus: { $ne: 'cancelled' },
  }).session(session);
  if (Math.max(existingReservation?.usageCount || 0, existingOrders) >= coupon.perUserLimit) {
    throw ApiError.badRequest('You have already used this coupon the maximum number of times.');
  }

  if (existingReservation) {
    const usageUpdate = await CouponCustomerUsage.updateOne(
      { _id: existingReservation._id, usageCount: { $lt: coupon.perUserLimit } },
      { $inc: { usageCount: 1 } },
      { session }
    );
    if (!usageUpdate.modifiedCount) {
      throw ApiError.badRequest('You have already used this coupon the maximum number of times.');
    }
  } else {
    try {
      await CouponCustomerUsage.create(
        [{ coupon: coupon._id, customer: userId, usageCount: existingOrders + 1 }],
        { session }
      );
    } catch (error) {
      if (error.code === 11000) {
        throw ApiError.badRequest('You have already used this coupon the maximum number of times.');
      }
      throw error;
    }
  }

  return reserved;
}

export async function releaseCoupon(order, session) {
  if (!order?.coupon?.couponId || !order.couponReservationActive) {
    return;
  }
  const claimed = await Order.updateOne(
    { _id: order._id, couponReservationActive: true },
    { $set: { couponReservationActive: false } },
    { session }
  );
  if (!claimed.modifiedCount) return;
  order.couponReservationActive = false;
  const released = await Coupon.updateOne(
    { _id: order.coupon.couponId, usageCount: { $gt: 0 } },
    { $inc: { usageCount: -1 } },
    { session }
  );
  const userUsageReleased = await CouponCustomerUsage.updateOne(
    { coupon: order.coupon.couponId, customer: order.customer, usageCount: { $gt: 0 } },
    { $inc: { usageCount: -1 } },
    { session }
  );
  if (!released.modifiedCount || !userUsageReleased.modifiedCount) {
    throw new Error('Coupon reservation counters are inconsistent; cancellation was rolled back.');
  }
}

export async function withTransaction(operation) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await operation(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}
