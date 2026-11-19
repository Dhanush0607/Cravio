import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  Coupon,
  Order,
  app,
  connectDB,
  createAdmin,
  createCoupon,
  createMenuItem,
  createRestaurant,
  createUser,
  disconnectDB,
  loginAs,
  request,
  resetDatabase,
} from './helpers.js';

async function setupOrderFixtures(overrides = {}) {
  const customer = overrides.customer || (await createUser());
  const admin = overrides.admin || (await createAdmin());
  const restaurant = overrides.restaurant || (await createRestaurant());
  const dish = overrides.dish || (await createMenuItem(restaurant, { price: 250 }));
  const customerToken = await loginAs(customer);
  const adminToken = await loginAs(admin);

  return {
    customer,
    admin,
    restaurant,
    dish,
    customerToken,
    adminToken,
    addressId: customer.addresses[0]._id.toString(),
  };
}

function orderBody({ restaurant, dish, addressId, quantity = 2, couponCode = '', extra = {} }) {
  return {
    restaurantId: restaurant._id.toString(),
    items: [{ menuItemId: dish._id.toString(), quantity, ...extra }],
    addressId,
    paymentMethod: 'cod',
    couponCode,
  };
}

describe('order creation, coupons, and status transitions', () => {
  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await disconnectDB();
  });

  it('calculates totals and discounts authoritatively on the server', async () => {
    const fixtures = await setupOrderFixtures();
    await createCoupon({
      code: 'SPECIAL80',
      discountType: 'percentage',
      discountValue: 80,
      minimumOrderAmount: 199,
      maximumDiscount: 80,
      perUserLimit: 1,
    });

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', fixtures.customerToken)
      .send(
        orderBody({
          ...fixtures,
          couponCode: 'SPECIAL80',
          extra: { price: 1, name: 'Tampered dish' },
        })
      );

    expect(response.status).toBe(201);
    const order = response.body.data.order;
    expect(order.subtotal).toBe(500);
    expect(order.deliveryFee).toBe(29);
    expect(order.platformFee).toBe(10);
    expect(order.discount).toBe(80);
    expect(order.total).toBe(459);
    expect(order.items[0].price).toBe(250);
    expect(order.items[0].name).toBe(fixtures.dish.name);
    expect(order.orderStatus).toBe('pending');
    expect(order.paymentStatus).toBe('pending');
    expect(order.coupon.code).toBe('SPECIAL80');

    const coupon = await Coupon.findOne({ code: 'SPECIAL80' });
    expect(coupon.usageCount).toBe(1);
  });

  it('rejects unavailable dishes, foreign restaurant dishes, and orders below the minimum', async () => {
    const fixtures = await setupOrderFixtures();
    const otherRestaurant = await createRestaurant();
    const foreignDish = await createMenuItem(otherRestaurant);

    const foreign = await request(app)
      .post('/api/orders')
      .set('Authorization', fixtures.customerToken)
      .send(
        orderBody({
          ...fixtures,
          dish: foreignDish,
          quantity: 2,
        })
      );
    expect(foreign.status).toBe(400);
    expect(foreign.body.message).toMatch(/no longer on this menu/i);

    await fixtures.dish.updateOne({ isAvailable: false });
    const unavailable = await request(app)
      .post('/api/orders')
      .set('Authorization', fixtures.customerToken)
      .send(orderBody({ ...fixtures, quantity: 1 }));
    expect(unavailable.status).toBe(400);
    expect(unavailable.body.message).toMatch(/currently unavailable/i);

    await fixtures.dish.updateOne({ isAvailable: true, price: 50 });
    const belowMinimum = await request(app)
      .post('/api/orders')
      .set('Authorization', fixtures.customerToken)
      .send(orderBody({ ...fixtures, quantity: 1 }));
    expect(belowMinimum.status).toBe(400);
    expect(belowMinimum.body.message).toMatch(/minimum order/i);
  });

  it('replays an idempotent request instead of creating a duplicate order', async () => {
    const fixtures = await setupOrderFixtures();
    const body = {
      ...orderBody(fixtures),
      idempotencyKey: 'test-idempotency-key-0001',
    };

    const first = await request(app)
      .post('/api/orders')
      .set('Authorization', fixtures.customerToken)
      .send(body);
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/orders')
      .set('Authorization', fixtures.customerToken)
      .send(body);
    expect(second.status).toBe(200);
    expect(second.body.data.order._id).toBe(first.body.data.order._id);
    expect(await Order.countDocuments()).toBe(1);
  });

  it('enforces the one-use-per-customer coupon limit and releases it on cancellation', async () => {
    const fixtures = await setupOrderFixtures();
    await createCoupon({
      code: 'SPECIAL80',
      discountType: 'percentage',
      discountValue: 80,
      minimumOrderAmount: 199,
      maximumDiscount: 80,
      perUserLimit: 1,
    });

    const first = await request(app)
      .post('/api/orders')
      .set('Authorization', fixtures.customerToken)
      .send(orderBody({ ...fixtures, couponCode: 'SPECIAL80' }));
    expect(first.status).toBe(201);

    const reuse = await request(app)
      .post('/api/orders')
      .set('Authorization', fixtures.customerToken)
      .send(orderBody({ ...fixtures, couponCode: 'SPECIAL80' }));
    expect(reuse.status).toBe(400);
    expect(reuse.body.message).toMatch(/already used/i);

    const cancellation = await request(app)
      .patch(`/api/orders/${first.body.data.order._id}/cancel`)
      .set('Authorization', fixtures.customerToken)
      .send({ reason: 'Changed my mind about dinner' });
    expect(cancellation.status).toBe(200);

    const afterRelease = await request(app)
      .post('/api/orders')
      .set('Authorization', fixtures.customerToken)
      .send(orderBody({ ...fixtures, couponCode: 'SPECIAL80' }));
    expect(afterRelease.status).toBe(201);
  });

  it('scopes order reads and cancellations to their owner', async () => {
    const fixtures = await setupOrderFixtures();
    const intruder = await createUser();
    const intruderToken = await loginAs(intruder);

    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', fixtures.customerToken)
      .send(orderBody(fixtures));
    const orderId = created.body.data.order._id;

    const read = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', intruderToken);
    expect(read.status).toBe(403);

    const cancel = await request(app)
      .patch(`/api/orders/${orderId}/cancel`)
      .set('Authorization', intruderToken)
      .send({ reason: 'Trying to cancel someone else order' });
    expect(cancel.status).toBe(404);

    const ownerRead = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', fixtures.customerToken);
    expect(ownerRead.status).toBe(200);
  });

  it('validates admin status transitions and settles COD payment on delivery', async () => {
    const fixtures = await setupOrderFixtures();
    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', fixtures.customerToken)
      .send(orderBody(fixtures));
    const orderId = created.body.data.order._id;

    const invalidJump = await request(app)
      .put(`/api/admin/orders/${orderId}/status`)
      .set('Authorization', fixtures.adminToken)
      .send({ status: 'delivered' });
    expect(invalidJump.status).toBe(400);
    expect(invalidJump.body.message).toMatch(/cannot move/i);

    for (const status of ['confirmed', 'preparing', 'out_for_delivery', 'delivered']) {
      const response = await request(app)
        .put(`/api/admin/orders/${orderId}/status`)
        .set('Authorization', fixtures.adminToken)
        .send({ status, note: `Test moved to ${status}` });
      expect(response.status).toBe(200);
      expect(response.body.data.order.orderStatus).toBe(status);
      if (status === 'delivered') {
        expect(response.body.data.order.paymentStatus).toBe('paid');
      }
    }

    const terminal = await request(app)
      .put(`/api/admin/orders/${orderId}/status`)
      .set('Authorization', fixtures.adminToken)
      .send({ status: 'cancelled' });
    expect(terminal.status).toBe(400);

    const customerCancel = await request(app)
      .patch(`/api/orders/${orderId}/cancel`)
      .set('Authorization', fixtures.customerToken)
      .send({ reason: 'Too late to cancel now' });
    expect(customerCancel.status).toBe(400);
  });

  it('requires online payments to be settled before delivery', async () => {
    const fixtures = await setupOrderFixtures();
    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', fixtures.customerToken)
      .send({ ...orderBody(fixtures), paymentMethod: 'online' });
    expect(created.status).toBe(201);
    const orderId = created.body.data.order._id;

    for (const status of ['confirmed', 'preparing', 'out_for_delivery']) {
      const response = await request(app)
        .put(`/api/admin/orders/${orderId}/status`)
        .set('Authorization', fixtures.adminToken)
        .send({ status });
      expect(response.status).toBe(200);
    }

    const delivered = await request(app)
      .put(`/api/admin/orders/${orderId}/status`)
      .set('Authorization', fixtures.adminToken)
      .send({ status: 'delivered' });
    expect(delivered.status).toBe(400);
    expect(delivered.body.message).toMatch(/online payment has not been completed/i);

    const config = await request(app).get('/api/payments/config');
    expect(config.status).toBe(200);
    expect(config.body.data.provider.mode).toBe('development');

    const payment = await request(app)
      .post('/api/payments/create')
      .set('Authorization', fixtures.customerToken)
      .send({ orderId });
    expect(payment.status).toBe(201);
    expect(payment.body.data.payment.provider).toBe('development');

    const verified = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', fixtures.customerToken)
      .send({
        orderId,
        providerOrderId: payment.body.data.payment.providerOrderId,
      });
    expect(verified.status).toBe(200);
    expect(verified.body.data.order.paymentStatus).toBe('paid');

    const nowDelivered = await request(app)
      .put(`/api/admin/orders/${orderId}/status`)
      .set('Authorization', fixtures.adminToken)
      .send({ status: 'delivered' });
    expect(nowDelivered.status).toBe(200);
  });
});
