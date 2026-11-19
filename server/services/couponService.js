import { Coupon } from '../models/Coupon.js';
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

    if (userUsage >= coupon.perUserLimit) {
      throw ApiError.badRequest('You have already used this coupon the maximum number of times.');
    }
  }

  return {
    coupon,
    discount: calculateDiscount(coupon, subtotal),
  };
}

export async function reserveCoupon(coupon) {
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

  const reserved = await Coupon.findOneAndUpdate(filter, { $inc: { usageCount: 1 } }, { new: true });

  if (!reserved) {
    throw ApiError.badRequest('This coupon has reached its usage limit.');
  }

  return reserved;
}

export async function releaseCoupon(couponId) {
  if (!couponId) {
    return;
  }
  await Coupon.updateOne(
    { _id: couponId, usageCount: { $gt: 0 } },
    { $inc: { usageCount: -1 } }
  );
}
