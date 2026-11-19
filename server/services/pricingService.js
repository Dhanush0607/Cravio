export const PLATFORM_FEE = {
  rate: 0.02,
  min: 5,
  max: 25,
};

export function roundCurrency(value) {
  return Math.round(Number(value) * 100) / 100;
}

export function calculatePlatformFee(subtotal) {
  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    return 0;
  }
  const fee = Math.round(subtotal * PLATFORM_FEE.rate);
  return Math.max(PLATFORM_FEE.min, Math.min(PLATFORM_FEE.max, fee));
}

export function calculateQuote({ subtotal, deliveryFee = 0, discount = 0 }) {
  const safeSubtotal = roundCurrency(Math.max(0, subtotal));
  const safeDeliveryFee = roundCurrency(Math.max(0, deliveryFee));
  const safeDiscount = roundCurrency(Math.min(Math.max(0, discount), safeSubtotal));
  const platformFee = calculatePlatformFee(safeSubtotal);
  const total = roundCurrency(Math.max(0, safeSubtotal - safeDiscount + safeDeliveryFee + platformFee));

  return {
    subtotal: safeSubtotal,
    deliveryFee: safeDeliveryFee,
    platformFee,
    discount: safeDiscount,
    total,
  };
}
