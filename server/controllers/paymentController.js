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
import { withTransaction } from '../services/couponService.js';

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

  const payment = await withTransaction(async (session) => {
    const latestOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        customer: req.user._id,
        orderStatus: { $ne: 'cancelled' },
        paymentStatus: { $ne: 'paid' },
      },
      { $inc: { paymentAttemptCount: 1 } },
      { new: true, session }
    );
    if (!latestOrder) throw ApiError.conflict('This order can no longer accept a payment.');
    const [created] = await Payment.create(
      [
        {
          order: latestOrder._id,
          customer: req.user._id,
          provider,
          providerOrderId,
          amount: latestOrder.total,
          currency: 'INR',
          status: 'created',
        },
      ],
      { session }
    );
    return created;
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

  const payment = await Payment.findOne({
    order: order._id,
    customer: req.user._id,
    providerOrderId,
  });

  if (!payment) {
    throw ApiError.notFound('Payment attempt not found.');
  }

  let verifiedCapture;
  if (payment.provider === 'development') {
    if (!env.PAYMENTS_DEV_MODE) {
      throw ApiError.forbidden('Development payments are disabled.');
    }
    verifiedCapture = {
      providerPaymentId: payment.providerPaymentId || `dev_payment_${payment._id}`,
      signatureVerified: false,
    };
  } else {
    if (!env.razorpayEnabled) {
      throw ApiError.forbidden('Razorpay is not configured.');
    }

    if (!verifyRazorpaySignature({ providerOrderId, providerPaymentId, signature })) {
      // Invalid requests must not mutate a payment: this request can race a valid
      // verification for the same gateway payment, and gateway state is authoritative.
      console.warn('Rejected payment verification with invalid signature', {
        orderId: order._id.toString(),
        paymentId: payment._id.toString(),
      });
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
      roundCurrency(gatewayPayment.amount / 100) !== roundCurrency(payment.amount) ||
      gatewayPayment.currency !== payment.currency ||
      payment.currency !== 'INR'
    ) {
      throw ApiError.badRequest('The paid amount does not match the order total.');
    }

    verifiedCapture = { providerPaymentId, signatureVerified: true };
  }

  const settlement = await withTransaction(async (session) => {
    const currentOrder = await Order.findOne({ _id: order._id, customer: req.user._id }).session(
      session
    );
    const currentPayment = await Payment.findOne({ _id: payment._id }).session(session);
    if (!currentOrder || !currentPayment) throw ApiError.notFound('Payment attempt not found.');
    if (
      currentPayment.status === 'paid' &&
      currentPayment.providerPaymentId &&
      currentPayment.providerPaymentId !== verifiedCapture.providerPaymentId
    ) {
      console.error('Payment record conflicts with gateway-confirmed payment', {
        orderId: currentOrder._id.toString(),
        paymentId: currentPayment._id.toString(),
      });
      throw ApiError.conflict('Payment state is inconsistent. Please contact support.');
    }
    if (currentOrder.orderStatus === 'cancelled') {
      const refundUpdate = await Payment.updateOne(
        {
          _id: currentPayment._id,
          status: { $in: ['created', 'failed', 'verifying', 'paid'] },
          providerPaymentId: { $in: ['', null, verifiedCapture.providerPaymentId] },
        },
        {
          $set: {
            status: 'refund_required',
            providerPaymentId: verifiedCapture.providerPaymentId,
            signatureVerified: verifiedCapture.signatureVerified,
          },
        },
        { session }
      );
      if (!refundUpdate.modifiedCount && currentPayment.status !== 'refund_required') {
        console.error('Captured payment for cancelled order could not be flagged for refund', {
          orderId: currentOrder._id.toString(),
          paymentId: currentPayment._id.toString(),
          paymentStatus: currentPayment.status,
        });
        throw ApiError.conflict('Payment state is inconsistent. Please contact support.');
      }
      return { order: currentOrder, cancelled: true };
    }

    if (currentPayment.status === 'refund_required' || currentPayment.status === 'refunded') {
      console.error('Gateway-confirmed payment conflicts with its refund state', {
        orderId: currentOrder._id.toString(),
        paymentId: currentPayment._id.toString(),
        paymentStatus: currentPayment.status,
        orderPaymentStatus: currentOrder.paymentStatus,
        orderStatus: currentOrder.orderStatus,
      });
      throw ApiError.conflict('Payment state is inconsistent. Please contact support.');
    }

    if (currentPayment.status === 'paid' && currentOrder.paymentStatus === 'paid') {
      return { order: currentOrder, alreadyPaid: true };
    }

    const paymentUpdate = await Payment.updateOne(
      {
        _id: currentPayment._id,
        status: { $in: ['created', 'failed', 'verifying', 'paid'] },
        providerPaymentId: { $in: ['', null, verifiedCapture.providerPaymentId] },
      },
      {
        $set: {
          status: 'paid',
          providerPaymentId: verifiedCapture.providerPaymentId,
          signatureVerified: verifiedCapture.signatureVerified,
        },
      },
      { session }
    );
    if (!paymentUpdate.modifiedCount && currentPayment.status !== 'paid') {
      console.error('Gateway-confirmed payment could not transition to paid', {
        orderId: currentOrder._id.toString(),
        paymentId: currentPayment._id.toString(),
        paymentStatus: currentPayment.status,
        orderPaymentStatus: currentOrder.paymentStatus,
        orderStatus: currentOrder.orderStatus,
      });
      throw ApiError.conflict('Payment state is inconsistent. Please contact support.');
    }

    let updatedOrder = currentOrder;
    if (currentOrder.paymentStatus !== 'paid') {
      updatedOrder = await Order.findOneAndUpdate(
        {
          _id: currentOrder._id,
          orderStatus: { $ne: 'cancelled' },
          paymentStatus: { $ne: 'paid' },
        },
        { $set: { paymentStatus: 'paid' } },
        { new: true, session }
      );
      if (!updatedOrder) {
        throw ApiError.conflict('The order changed while payment was being verified.');
      }
    }
    return { order: updatedOrder, alreadyPaid: currentPayment.status === 'paid' };
  });

  if (settlement.cancelled) {
    throw ApiError.conflict(
      'Payment was captured after cancellation. It is flagged for refund review.'
    );
  }
  order.paymentStatus = settlement.order.paymentStatus;

  res.json({
    success: true,
    message: settlement.alreadyPaid
      ? 'Payment already verified.'
      : payment.provider === 'development'
        ? 'Test payment verified. No real money was charged.'
        : 'Payment verified successfully.',
    data: { order },
  });
});
