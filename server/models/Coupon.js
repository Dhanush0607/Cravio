import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9_-]{3,30}$/, 'Coupon code must be 3-30 characters'],
    },
    description: { type: String, trim: true, maxlength: 240, default: '' },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: [1, 'Discount value must be positive'],
    },
    minimumOrderAmount: { type: Number, min: 0, default: 0 },
    maximumDiscount: { type: Number, min: 0, default: null },
    expiryDate: { type: Date, required: true, index: true },
    usageLimit: { type: Number, min: 1, default: null },
    usageCount: { type: Number, min: 0, default: 0 },
    perUserLimit: { type: Number, min: 1, default: 1 },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

couponSchema.index({ isActive: 1, expiryDate: 1 });

couponSchema.pre('validate', function normalizeCode(next) {
  if (this.code) {
    this.code = this.code.toUpperCase().trim();
  }
  next();
});

export const Coupon = mongoose.model('Coupon', couponSchema);
