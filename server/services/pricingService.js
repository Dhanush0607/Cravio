const PLATFORM_FEE_RATE = 0.02;
const MIN_PLATFORM_FEE = 5;
const MAX_PLATFORM_FEE = 25;

export function roundCurrency(value) {
  return Math.round(Number(value) * 100) / 100;
}

export function calculatePlatformFee(subtotal) {
  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    return 0;
  }
  const fee = Math.round(subtotal * PLATFORM_FEE_RATE);
  return Math.max(MIN_PLATFORM_FEE, Math.min(MAX_PLATFORM_FEE, fee));
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
