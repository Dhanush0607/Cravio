export function calculatePlatformFee(subtotal) {
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0;
  return Math.max(5, Math.min(25, Math.round(subtotal * 0.02)));
}

export function calculateCouponDiscount(coupon, subtotal) {
  if (!coupon || subtotal < (coupon.minimumOrderAmount || 0)) return 0;
  let discount =
    coupon.discountType === 'percentage'
      ? (subtotal * coupon.discountValue) / 100
      : coupon.discountValue;

  if (coupon.maximumDiscount != null) {
    discount = Math.min(discount, coupon.maximumDiscount);
  }

  return Math.round(Math.min(discount, subtotal));
}

export function calculateCartTotals({ items = [], restaurant, coupon }) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = restaurant?.deliveryFee || 0;
  const platformFee = calculatePlatformFee(subtotal);
  const discount = calculateCouponDiscount(coupon, subtotal);
  const total = Math.max(0, subtotal - discount + deliveryFee + platformFee);

  return {
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    deliveryFee,
    platformFee,
    discount,
    total,
  };
}
