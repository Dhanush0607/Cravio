import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { listRedeemableCoupons, validateCoupon } from '../services/couponService.js';

export const featuredCoupons = asyncHandler(async (_req, res) => {
  const coupons = await listRedeemableCoupons(4);

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
