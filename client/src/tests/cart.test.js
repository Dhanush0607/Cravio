import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatDeliveryTime,
  getApiError,
  pluralize,
  titleCase,
} from '../utils/format.js';
import {
  calculateCartTotals,
  calculateCouponDiscount,
  calculatePlatformFee,
} from '../utils/cart.js';

describe('formatters', () => {
  it('formats rupee amounts and delivery windows', () => {
    expect(formatCurrency(459)).toContain('459');
    expect(formatDeliveryTime({ min: 20, max: 35 })).toBe('20–35 min');
    expect(formatDeliveryTime(null)).toBe('25–35 min');
    expect(titleCase('out_for_delivery')).toBe('Out For Delivery');
    expect(pluralize(1, 'item')).toBe('item');
    expect(pluralize(3, 'item')).toBe('items');
  });

  it('extracts safe API error messages', () => {
    expect(
      getApiError({
        response: {
          status: 400,
          data: { message: 'Coupon expired.', errors: [{ field: 'code', message: 'Expired' }] },
        },
      })
    ).toEqual({
      message: 'Coupon expired.',
      errors: [{ field: 'code', message: 'Expired' }],
      status: 400,
    });

    expect(getApiError(null).message).toMatch(/went wrong/i);
  });
});

describe('cart pricing helpers', () => {
  it('matches the server platform fee rules', () => {
    expect(calculatePlatformFee(0)).toBe(0);
    expect(calculatePlatformFee(100)).toBe(5);
    expect(calculatePlatformFee(500)).toBe(10);
    expect(calculatePlatformFee(10000)).toBe(25);
  });

  it('applies SPECIAL80 as 80% off capped at ₹80 above ₹199', () => {
    const coupon = {
      discountType: 'percentage',
      discountValue: 80,
      minimumOrderAmount: 199,
      maximumDiscount: 80,
    };

    expect(calculateCouponDiscount(coupon, 198)).toBe(0);
    expect(calculateCouponDiscount(coupon, 199)).toBe(80);
    expect(calculateCouponDiscount(coupon, 1200)).toBe(80);
  });

  it('builds a complete cart summary', () => {
    const totals = calculateCartTotals({
      items: [
        { menuItemId: 'a', price: 250, quantity: 2 },
        { menuItemId: 'b', price: 100, quantity: 1 },
      ],
      restaurant: { deliveryFee: 29 },
      coupon: {
        discountType: 'fixed',
        discountValue: 100,
        minimumOrderAmount: 199,
        maximumDiscount: null,
      },
    });

    expect(totals).toEqual({
      itemCount: 3,
      subtotal: 600,
      deliveryFee: 29,
      platformFee: 12,
      discount: 100,
      total: 541,
    });
  });
});
