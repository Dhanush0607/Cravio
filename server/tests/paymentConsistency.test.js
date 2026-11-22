import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const gateway = vi.hoisted(() => ({
  orderSequence: 0,
  captures: new Map(),
  fetchImplementation: null,
}));

vi.mock('../services/paymentService.js', () => ({
  createRazorpayOrder: vi.fn(async () => ({ id: `rz_order_${++gateway.orderSequence}` })),
  fetchRazorpayPayment: vi.fn((paymentId) => gateway.fetchImplementation(paymentId)),
  paymentProviderStatus: vi.fn(() => ({ enabled: true, mode: 'razorpay', label: 'Test gateway' })),
  verifyRazorpaySignature: vi.fn(({ signature }) => signature === 'valid-signature'),
}));

import { env } from '../config/env.js';
import {
  Order,
  Payment,
  app,
  connectDB,
  createMenuItem,
  createRestaurant,
  createUser,
  disconnectDB,
  loginAs,
  request,
  resetDatabase,
} from './helpers.js';

async function setupOnlinePayment() {
  const customer = await createUser();
  const restaurant = await createRestaurant();
  const dish = await createMenuItem(restaurant, { price: 250 });
  const token = await loginAs(customer);
  const created = await request(app)
    .post('/api/orders')
    .set('Authorization', token)
    .send({
      restaurantId: restaurant._id.toString(),
      items: [{ menuItemId: dish._id.toString(), quantity: 1 }],
      addressId: customer.addresses[0]._id.toString(),
      paymentMethod: 'online',
      couponCode: '',
    });
  expect(created.status).toBe(201);

  const order = created.body.data.order;
  const createdPayment = await request(app)
    .post('/api/payments/create')
    .set('Authorization', token)
    .send({ orderId: order._id });
  expect(createdPayment.status).toBe(201);
  const providerOrderId = createdPayment.body.data.payment.providerOrderId;
  const providerPaymentId = `rz_payment_${providerOrderId}`;
  gateway.captures.set(providerPaymentId, {
    order_id: providerOrderId,
    status: 'captured',
    amount: Math.round(order.total * 100),
    currency: 'INR',
  });

  return {
    orderId: order._id,
    token,
    providerOrderId,
    providerPaymentId,
    verify: (signature = 'valid-signature') =>
      request(app)
        .post('/api/payments/verify')
        .set('Authorization', token)
        .send({
          orderId: order._id,
          providerOrderId,
          providerPaymentId,
          signature,
        }),
    cancel: () =>
      request(app)
        .patch(`/api/orders/${order._id}/cancel`)
        .set('Authorization', token)
        .send({ reason: 'Cancel during payment verification test' }),
  };
}

describe('payment verification consistency', () => {
  let previousRazorpayEnabled;
  let previousDevMode;

  beforeAll(async () => {
    previousRazorpayEnabled = env.razorpayEnabled;
    previousDevMode = env.PAYMENTS_DEV_MODE;
    env.razorpayEnabled = true;
    env.PAYMENTS_DEV_MODE = false;
    await connectDB();
  });

  beforeEach(async () => {
    gateway.orderSequence = 0;
    gateway.captures.clear();
    gateway.fetchImplementation = async (paymentId) => gateway.captures.get(paymentId);
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await disconnectDB();
    env.razorpayEnabled = previousRazorpayEnabled;
    env.PAYMENTS_DEV_MODE = previousDevMode;
  });

  it('records a gateway capture as refund_required when cancellation wins during verification', async () => {
    const fixture = await setupOnlinePayment();
    let signalFetchStarted;
    const fetchStarted = new Promise((resolve) => {
      signalFetchStarted = resolve;
    });
    let releaseFetch;
    const fetchGate = new Promise((resolve) => {
      releaseFetch = resolve;
    });
    gateway.fetchImplementation = async (paymentId) => {
      signalFetchStarted();
      await fetchGate;
      return gateway.captures.get(paymentId);
    };

    const verification = fixture.verify().then((response) => response);
    await fetchStarted;
    expect((await fixture.cancel()).status).toBe(200);
    releaseFetch();

    expect((await verification).status).toBe(409);
    expect((await Order.findById(fixture.orderId)).paymentStatus).toBe('pending');
    expect((await Order.findById(fixture.orderId)).orderStatus).toBe('cancelled');
    expect((await Payment.findOne({ order: fixture.orderId })).status).toBe('refund_required');
  });

  it('does not let invalid-signature verification interfere with a valid captured verification', async () => {
    const fixture = await setupOnlinePayment();
    let signalFetchStarted;
    const fetchStarted = new Promise((resolve) => {
      signalFetchStarted = resolve;
    });
    let releaseFetch;
    const fetchGate = new Promise((resolve) => {
      releaseFetch = resolve;
    });
    gateway.fetchImplementation = async (paymentId) => {
      signalFetchStarted();
      await fetchGate;
      return gateway.captures.get(paymentId);
    };

    const validVerification = fixture.verify().then((response) => response);
    await fetchStarted;
    expect((await fixture.verify('invalid-signature')).status).toBe(400);
    releaseFetch();

    expect((await validVerification).status).toBe(200);
    expect((await Order.findById(fixture.orderId)).paymentStatus).toBe('paid');
    expect((await Payment.findOne({ order: fixture.orderId })).status).toBe('paid');
    expect((await fixture.verify('invalid-signature')).status).toBe(400);
    expect((await Payment.findOne({ order: fixture.orderId })).status).toBe('paid');
  });

  it('settles duplicate valid verification requests idempotently', async () => {
    const fixture = await setupOnlinePayment();
    const responses = await Promise.all([fixture.verify(), fixture.verify()]);
    expect(responses.map(({ status }) => status)).toEqual([200, 200]);
    const order = await Order.findById(fixture.orderId);
    const payment = await Payment.findOne({ order: fixture.orderId });
    expect(order.paymentStatus).toBe('paid');
    expect(payment.status).toBe('paid');
    expect(payment.providerPaymentId).toBe(fixture.providerPaymentId);
  });

  it('reconciles an already-paid Payment with a still-pending Order', async () => {
    const fixture = await setupOnlinePayment();
    await Payment.updateOne(
      { order: fixture.orderId },
      { $set: { status: 'paid', providerPaymentId: fixture.providerPaymentId, signatureVerified: true } }
    );

    const response = await fixture.verify();
    expect(response.status).toBe(200);
    expect((await Order.findById(fixture.orderId)).paymentStatus).toBe('paid');
    expect((await Payment.findOne({ order: fixture.orderId })).status).toBe('paid');
  });

  it('flags a captured payment verified after cancellation for refund review', async () => {
    const fixture = await setupOnlinePayment();
    expect((await fixture.cancel()).status).toBe(200);
    expect((await fixture.verify()).status).toBe(409);
    expect((await Order.findById(fixture.orderId)).paymentStatus).toBe('pending');
    expect((await Payment.findOne({ order: fixture.orderId })).status).toBe('refund_required');
  });
});
