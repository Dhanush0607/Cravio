import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CartProvider, useCart } from '../context/CartContext.jsx';

const restaurantA = {
  _id: 'rest-a',
  name: 'Kitchen A',
  slug: 'kitchen-a',
  image: '/images/foods/pizza.jpg',
  deliveryFee: 29,
  minOrder: 149,
  deliveryTime: { min: 20, max: 30 },
  address: { city: 'Bengaluru' },
};

const restaurantB = {
  ...restaurantA,
  _id: 'rest-b',
  name: 'Kitchen B',
  slug: 'kitchen-b',
};

const dishA = {
  _id: 'dish-a',
  name: 'Margherita',
  image: '/images/foods/pizza.jpg',
  price: 250,
  foodType: 'veg',
  category: 'Pizza',
};

const dishB = {
  _id: 'dish-b',
  name: 'Farmhouse',
  image: '/images/foods/pizza.jpg',
  price: 300,
  foodType: 'veg',
  category: 'Pizza',
};

function renderCart() {
  return renderHook(() => useCart(), {
    wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
  });
}

describe('CartProvider', () => {
  it('adds items, increments quantities, and removes emptied items', () => {
    const { result } = renderCart();

    act(() => {
      expect(result.current.addItem(dishA, restaurantA)).toMatchObject({ added: true });
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.totals.subtotal).toBe(250);
    expect(result.current.totals.itemCount).toBe(1);

    act(() => result.current.incrementItem(dishA._id));
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.totals.subtotal).toBe(500);

    act(() => result.current.decrementItem(dishA._id));
    act(() => result.current.decrementItem(dishA._id));
    expect(result.current.items).toHaveLength(0);
    expect(result.current.restaurant).toBeNull();
  });

  it('reports a restaurant conflict instead of mixing carts', () => {
    const { result } = renderCart();

    act(() => result.current.addItem(dishA, restaurantA));
    let conflictResult;
    act(() => {
      conflictResult = result.current.addItem(dishB, restaurantB);
    });

    expect(conflictResult).toMatchObject({
      added: false,
      conflict: true,
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].menuItemId).toBe(dishA._id);
    expect(result.current.restaurant.id).toBe(restaurantA._id);
  });

  it('replaces the cart on request and persists it to local storage', () => {
    const { result } = renderCart();

    act(() => result.current.addItem(dishA, restaurantA));
    act(() => result.current.addItem(dishB, restaurantA));
    expect(result.current.items).toHaveLength(2);

    act(() => result.current.replaceCart(dishB, restaurantB));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].menuItemId).toBe(dishB._id);
    expect(result.current.restaurant.id).toBe(restaurantB._id);

    const stored = JSON.parse(window.localStorage.getItem('cravio_cart_v1'));
    expect(stored.restaurant.id).toBe(restaurantB._id);
    expect(stored.items).toHaveLength(1);
  });

  it('applies coupons, clamps quantities, and clears the cart', () => {
    const { result } = renderCart();

    act(() => result.current.addItem(dishA, restaurantA));
    act(() =>
      result.current.applyCoupon(
        {
          code: 'SPECIAL80',
          description: '80% off',
          discountType: 'percentage',
          discountValue: 80,
          minimumOrderAmount: 199,
          maximumDiscount: 80,
        },
        80
      )
    );

    expect(result.current.coupon.code).toBe('SPECIAL80');
    expect(result.current.totals.discount).toBe(80);
    expect(result.current.totals.total).toBe(250 - 80 + 29 + 5);

    act(() => result.current.updateQuantity(dishA._id, 99));
    expect(result.current.items[0].quantity).toBe(20);

    act(() => result.current.clearCart());
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.coupon).toBeNull();
    expect(result.current.totals.total).toBe(0);
  });
});
