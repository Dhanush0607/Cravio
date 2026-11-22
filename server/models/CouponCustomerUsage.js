import mongoose from 'mongoose';

const couponCustomerUsageSchema = new mongoose.Schema(
  {
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    usageCount: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

couponCustomerUsageSchema.index({ coupon: 1, customer: 1 }, { unique: true });

export const CouponCustomerUsage = mongoose.model('CouponCustomerUsage', couponCustomerUsageSchema);
