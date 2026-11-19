import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { calculateCartTotals } from '../utils/cart.js';

const CartContext = createContext(null);
const STORAGE_KEY = 'cravio_cart_v1';
const EMPTY_CART = { restaurant: null, items: [], coupon: null };

function loadCart() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    if (!stored || !stored.restaurant || !Array.isArray(stored.items)) {
      return EMPTY_CART;
    }
    return {
      restaurant: stored.restaurant,
      items: stored.items
        .filter((item) => item.menuItemId && item.quantity > 0)
        .map((item) => ({ ...item, quantity: Math.min(20, Number(item.quantity) || 1) })),
      coupon: stored.coupon || null,
    };
  } catch {
    return EMPTY_CART;
  }
}

function restaurantSnapshot(restaurant) {
  return {
    id: restaurant._id || restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    image: restaurant.image,
    deliveryFee: restaurant.deliveryFee || 0,
    minOrder: restaurant.minOrder || 0,
    deliveryTime: restaurant.deliveryTime,
    city: restaurant.address?.city || '',
  };
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addItem = useCallback(
    (menuItem, restaurant) => {
      if (cart.items.length > 0 && cart.restaurant?.id !== restaurant._id) {
        return {
          added: false,
          conflict: true,
          existingRestaurant: cart.restaurant,
        };
      }

      const existing = cart.items.find((item) => item.menuItemId === menuItem._id);

      setCart((current) => {
        if (current.items.length > 0 && current.restaurant?.id !== restaurant._id) {
          return current;
        }

        const nextRestaurant =
          current.items.length === 0 ? restaurantSnapshot(restaurant) : current.restaurant;

        if (existing) {
          return {
            ...current,
            restaurant: nextRestaurant,
            items: current.items.map((item) =>
              item.menuItemId === menuItem._id
                ? { ...item, quantity: Math.min(20, item.quantity + 1) }
                : item
            ),
          };
        }

        return {
          ...current,
          restaurant: nextRestaurant,
          items: [
            ...current.items,
            {
              menuItemId: menuItem._id,
              name: menuItem.name,
              image: menuItem.image,
              price: menuItem.price,
              foodType: menuItem.foodType,
              category: menuItem.category,
              quantity: 1,
            },
          ],
        };
      });

      return {
        added: true,
        conflict: false,
        quantity: Math.min(20, (existing?.quantity || 0) + 1),
      };
    },
    [cart.items, cart.restaurant]
  );

  const replaceCart = useCallback((menuItem, restaurant) => {
    setCart({
      restaurant: restaurantSnapshot(restaurant),
      items: [
        {
          menuItemId: menuItem._id,
          name: menuItem.name,
          image: menuItem.image,
          price: menuItem.price,
          foodType: menuItem.foodType,
          category: menuItem.category,
          quantity: 1,
        },
      ],
      coupon: null,
    });
  }, []);

  const updateQuantity = useCallback((menuItemId, quantity) => {
    setCart((current) => {
      const nextQuantity = Math.max(0, Math.min(20, Number(quantity) || 0));
      const items = current.items
        .map((item) =>
          item.menuItemId === menuItemId ? { ...item, quantity: nextQuantity } : item
        )
        .filter((item) => item.quantity > 0);

      if (items.length === 0) {
        return EMPTY_CART;
      }

      return { ...current, items };
    });
  }, []);

  const incrementItem = useCallback(
    (menuItemId) => {
      setCart((current) => ({
        ...current,
        items: current.items.map((item) =>
          item.menuItemId === menuItemId
            ? { ...item, quantity: Math.min(20, item.quantity + 1) }
            : item
        ),
      }));
    },
    []
  );

  const decrementItem = useCallback((menuItemId) => {
    setCart((current) => {
      const items = current.items
        .map((item) =>
          item.menuItemId === menuItemId
            ? { ...item, quantity: Math.max(0, item.quantity - 1) }
            : item
        )
        .filter((item) => item.quantity > 0);

      return items.length ? { ...current, items } : EMPTY_CART;
    });
  }, []);

  const removeItem = useCallback((menuItemId) => {
    setCart((current) => {
      const items = current.items.filter((item) => item.menuItemId !== menuItemId);
      return items.length ? { ...current, items } : EMPTY_CART;
    });
  }, []);

  const clearCart = useCallback(() => setCart(EMPTY_CART), []);

  const applyCoupon = useCallback((coupon, discount) => {
    setCart((current) => ({
      ...current,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minimumOrderAmount: coupon.minimumOrderAmount,
        maximumDiscount: coupon.maximumDiscount,
        appliedDiscount: discount,
      },
    }));
  }, []);

  const clearCoupon = useCallback(() => {
    setCart((current) => ({ ...current, coupon: null }));
  }, []);

  const getItemQuantity = useCallback(
    (menuItemId) =>
      cart.items.find((item) => item.menuItemId === menuItemId)?.quantity || 0,
    [cart.items]
  );

  const totals = useMemo(
    () =>
      calculateCartTotals({
        items: cart.items,
        restaurant: cart.restaurant,
        coupon: cart.coupon,
      }),
    [cart.items, cart.restaurant, cart.coupon]
  );

  const value = useMemo(
    () => ({
      restaurant: cart.restaurant,
      items: cart.items,
      coupon: cart.coupon,
      totals,
      isEmpty: cart.items.length === 0,
      addItem,
      replaceCart,
      updateQuantity,
      incrementItem,
      decrementItem,
      removeItem,
      clearCart,
      applyCoupon,
      clearCoupon,
      getItemQuantity,
      isDifferentRestaurant: (restaurantId) =>
        cart.items.length > 0 && cart.restaurant?.id !== restaurantId,
    }),
    [
      cart.restaurant,
      cart.items,
      cart.coupon,
      totals,
      addItem,
      replaceCart,
      updateQuantity,
      incrementItem,
      decrementItem,
      removeItem,
      clearCart,
      applyCoupon,
      clearCoupon,
      getItemQuantity,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
