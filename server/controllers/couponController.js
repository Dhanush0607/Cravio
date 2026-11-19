import { Coupon } from '../models/Coupon.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { validateCoupon } from '../services/couponService.js';

export const featuredCoupons = asyncHandler(async (_req, res) => {
  const now = new Date();
  const coupons = await Coupon.find({
    isActive: true,
    expiryDate: { $gt: now },
    $or: [{ usageLimit: null }, { $expr: { $lt: ['$usageCount', '$usageLimit'] } }],
  })
    .select(
      'code description discountType discountValue minimumOrderAmount maximumDiscount expiryDate'
    )
    .sort({ discountValue: -1 })
    .limit(4)
    .lean();

  res.json({ success: true, data: { coupons } });
});

export const validateCouponCode = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;

  try {
    const { coupon, discount } = await validateCoupon({
      code,
      userId: req.user._id,
      subtotal,
    });

    res.json({
      success: true,
      message: `${coupon.code} applied. You saved ₹${discount}.`,
      data: {
        coupon: {
          id: coupon._id,
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minimumOrderAmount: coupon.minimumOrderAmount,
          maximumDiscount: coupon.maximumDiscount,
        },
        discount,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.badRequest('This coupon could not be applied.');
  }
});
