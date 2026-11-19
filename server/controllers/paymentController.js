import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {
  createRazorpayOrder,
  fetchRazorpayPayment,
  paymentProviderStatus,
  verifyRazorpaySignature,
} from '../services/paymentService.js';
import { roundCurrency } from '../services/pricingService.js';

export const getPaymentConfig = asyncHandler(async (_req, res) => {
  res.json({
    success: true,
    data: {
      provider: paymentProviderStatus(),
      currency: 'INR',
    },
  });
});

export const createPayment = asyncHandler(async (req, res) => {
  const providerStatus = paymentProviderStatus();

  if (!providerStatus.enabled) {
    throw new ApiError(503, 'Online payments are not configured for this environment.');
  }

  const order = await Order.findOne({
    _id: req.body.orderId,
    customer: req.user._id,
  });

  if (!order) {
    throw ApiError.notFound('Order not found.');
  }

  if (order.paymentMethod !== 'online') {
    throw ApiError.badRequest('This order is not configured for online payment.');
  }

  if (order.orderStatus === 'cancelled') {
    throw ApiError.badRequest('Cancelled orders cannot be paid.');
  }

  if (order.paymentStatus === 'paid') {
    throw ApiError.conflict('This order has already been paid.');
  }

  let providerOrderId;
  let provider;

  if (env.razorpayEnabled) {
    provider = 'razorpay';
    const gatewayOrder = await createRazorpayOrder({
      amount: order.total,
      receipt: order.orderNumber,
      notes: { orderId: order._id.toString(), customerId: req.user._id.toString() },
    });
    providerOrderId = gatewayOrder.id;
  } else {
    provider = 'development';
    providerOrderId = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  const payment = await Payment.create({
    order: order._id,
    customer: req.user._id,
    provider,
    providerOrderId,
    amount: order.total,
    currency: 'INR',
    status: 'created',
  });

  res.status(201).json({
    success: true,
    message:
      provider === 'development'
        ? 'Development test payment created. No real money will be charged.'
        : 'Payment order created.',
    data: {
      payment: {
        id: payment._id,
        provider,
        providerOrderId,
        amount: order.total,
        currency: 'INR',
      },
      checkout:
        provider === 'razorpay'
          ? {
              mode: 'razorpay',
              keyId: env.RAZORPAY_KEY_ID,
              providerOrderId,
              amount: Math.round(order.total * 100),
              currency: 'INR',
              name: 'CRAVIO',
              description: `Order ${order.orderNumber}`,
            }
          : {
              mode: 'development',
              notice: 'TEST MODE — no real money will be charged.',
            },
    },
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, providerOrderId, providerPaymentId, signature } = req.body;

  const order = await Order.findOne({ _id: orderId, customer: req.user._id });
  if (!order) {
    throw ApiError.notFound('Order not found.');
  }

  if (order.paymentStatus === 'paid') {
    res.json({ success: true, message: 'Payment already verified.', data: { order } });
    return;
  }

  const payment = await Payment.findOne({
    order: order._id,
    customer: req.user._id,
    providerOrderId,
  });

  if (!payment) {
    throw ApiError.notFound('Payment attempt not found.');
  }

  if (payment.status === 'paid') {
    order.paymentStatus = 'paid';
    await order.save();
    res.json({ success: true, message: 'Payment already verified.', data: { order } });
    return;
  }

  if (payment.provider === 'development') {
    if (!env.PAYMENTS_DEV_MODE) {
      throw ApiError.forbidden('Development payments are disabled.');
    }
    payment.status = 'paid';
    payment.providerPaymentId = `dev_payment_${Date.now()}`;
    payment.signatureVerified = false;
  } else {
    if (!env.razorpayEnabled) {
      throw ApiError.forbidden('Razorpay is not configured.');
    }

    if (!verifyRazorpaySignature({ providerOrderId, providerPaymentId, signature })) {
      payment.status = 'failed';
      payment.failureReason = 'Signature verification failed';
      await payment.save();
      throw ApiError.badRequest('Payment signature verification failed.');
    }

    const gatewayPayment = await fetchRazorpayPayment(providerPaymentId);

    if (gatewayPayment.order_id !== providerOrderId) {
      throw ApiError.badRequest('The payment does not belong to this order.');
    }

    if (gatewayPayment.status !== 'captured') {
      throw ApiError.badRequest(`Payment is not complete (status: ${gatewayPayment.status}).`);
    }

    if (
      roundCurrency(gatewayPayment.amount / 100) !== roundCurrency(order.total) ||
      gatewayPayment.currency !== 'INR'
    ) {
      throw ApiError.badRequest('The paid amount does not match the order total.');
    }

    payment.status = 'paid';
    payment.providerPaymentId = providerPaymentId;
    payment.signatureVerified = true;
  }

  await payment.save();
  order.paymentStatus = 'paid';
  await order.save();

  res.json({
    success: true,
    message:
      payment.provider === 'development'
        ? 'Test payment verified. No real money was charged.'
        : 'Payment verified successfully.',
    data: { order },
  });
});
