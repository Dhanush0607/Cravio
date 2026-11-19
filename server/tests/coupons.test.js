import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  Coupon,
  app,
  connectDB,
  createCoupon,
  createUser,
  disconnectDB,
  loginAs,
  request,
  resetDatabase,
} from './helpers.js';
import { calculatePlatformFee, calculateQuote } from '../services/pricingService.js';

describe('coupons and pricing', () => {
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

  it('keeps the SPECIAL80 rules: 80% off, capped at ₹80, minimum ₹199', async () => {
    const customer = await createUser();
    const token = await loginAs(customer);

    await createCoupon({
      code: 'SPECIAL80',
      discountType: 'percentage',
      discountValue: 80,
      minimumOrderAmount: 199,
      maximumDiscount: 80,
      usageLimit: 5000,
      perUserLimit: 1,
    });

    const belowMinimum = await request(app)
      .post('/api/coupons/validate')
      .set('Authorization', token)
      .send({ code: 'SPECIAL80', subtotal: 198 });
    expect(belowMinimum.status).toBe(400);
    expect(belowMinimum.body.message).toMatch(/add items worth/i);

    const eligible = await request(app)
      .post('/api/coupons/validate')
      .set('Authorization', token)
      .send({ code: 'SPECIAL80', subtotal: 500 });
    expect(eligible.status).toBe(200);
    expect(eligible.body.data.discount).toBe(80);
    expect(eligible.body.data.coupon.code).toBe('SPECIAL80');

    const smallOrder = await request(app)
      .post('/api/coupons/validate')
      .set('Authorization', token)
      .send({ code: 'SPECIAL80', subtotal: 199 });
    expect(smallOrder.status).toBe(200);
    expect(smallOrder.body.data.discount).toBe(80);
  });

  it('applies fixed discounts and never exceeds the subtotal', async () => {
    const customer = await createUser();
    const token = await loginAs(customer);

    await createCoupon({
      code: 'FLAT100',
      discountType: 'fixed',
      discountValue: 100,
      minimumOrderAmount: 0,
      maximumDiscount: null,
    });

    const response = await request(app)
      .post('/api/coupons/validate')
      .set('Authorization', token)
      .send({ code: 'flat100', subtotal: 60 });

    expect(response.status).toBe(200);
    expect(response.body.data.discount).toBe(60);
  });

  it('rejects expired, inactive, and exhausted coupons', async () => {
    const customer = await createUser();
    const token = await loginAs(customer);

    await createCoupon({
      code: 'EXPIRED10',
      expiryDate: new Date(Date.now() - 1000),
    });
    await createCoupon({ code: 'INACTIVE10', isActive: false });
    await createCoupon({ code: 'USEDUP10', usageLimit: 1, usageCount: 1 });

    for (const [code, pattern] of [
      ['EXPIRED10', /expired/i],
      ['INACTIVE10', /invalid or no longer active/i],
      ['USEDUP10', /usage limit/i],
    ]) {
      const response = await request(app)
        .post('/api/coupons/validate')
        .set('Authorization', token)
        .send({ code, subtotal: 500 });
      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(pattern);
    }
  });

  it('returns only redeemable featured coupons', async () => {
    await createCoupon({ code: 'LIVE10', discountValue: 10 });
    await createCoupon({ code: 'DEAD10', isActive: false });
    await createCoupon({ code: 'OLD10', expiryDate: new Date(Date.now() - 1000) });

    const response = await request(app).get('/api/coupons/featured');
    expect(response.status).toBe(200);
    const codes = response.body.data.coupons.map((coupon) => coupon.code);
    expect(codes).toContain('LIVE10');
    expect(codes).not.toContain('DEAD10');
    expect(codes).not.toContain('OLD10');
    expect(await Coupon.countDocuments()).toBe(3);
  });

  it('computes the platform fee and quote consistently', () => {
    expect(calculatePlatformFee(0)).toBe(0);
    expect(calculatePlatformFee(100)).toBe(5);
    expect(calculatePlatformFee(500)).toBe(10);
    expect(calculatePlatformFee(10000)).toBe(25);

    const quote = calculateQuote({ subtotal: 500, deliveryFee: 29, discount: 80 });
    expect(quote).toEqual({
      subtotal: 500,
      deliveryFee: 29,
      platformFee: 10,
      discount: 80,
      total: 459,
    });
  });
});
