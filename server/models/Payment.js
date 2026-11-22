import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['razorpay', 'development'],
      required: true,
    },
    providerOrderId: { type: String, required: true, index: true },
    providerPaymentId: { type: String, default: '' },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['created', 'verifying', 'paid', 'failed', 'refund_required', 'refunded'],
      default: 'created',
      index: true,
    },
    signatureVerified: { type: Boolean, default: false },
    failureReason: { type: String, default: '' },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

paymentSchema.index({ order: 1, createdAt: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
