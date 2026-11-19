import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const RAZORPAY_API = 'https://api.razorpay.com/v1';

function razorpayAuthHeader() {
  return `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64')}`;
}

async function razorpayRequest(path, options = {}) {
  const response = await fetch(`${RAZORPAY_API}${path}`, {
    ...options,
    headers: {
      Authorization: razorpayAuthHeader(),
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      502,
      payload.error?.description || 'The payment gateway could not process this request.'
    );
  }

  return payload;
}

export async function createRazorpayOrder({ amount, receipt, notes }) {
  return razorpayRequest('/orders', {
    method: 'POST',
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt,
      notes,
    }),
  });
}

export async function fetchRazorpayPayment(paymentId) {
  return razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`);
}

export function verifyRazorpaySignature({ providerOrderId, providerPaymentId, signature }) {
  if (!providerOrderId || !providerPaymentId || !signature) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${providerOrderId}|${providerPaymentId}`)
    .digest('hex');

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(signature);

  return (
    expectedBuffer.length === providedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  );
}

export function paymentProviderStatus() {
  if (env.razorpayEnabled) {
    return {
      mode: 'razorpay',
      enabled: true,
      label: 'Secure online payment',
    };
  }

  if (env.PAYMENTS_DEV_MODE) {
    return {
      mode: 'development',
      enabled: true,
      label: 'Development test payments',
      notice: 'No real money is charged. Configure Razorpay credentials for live payments.',
    };
  }

  return {
    mode: 'unavailable',
    enabled: false,
    label: 'Online payment unavailable',
    notice: 'Online payments are not configured for this environment.',
  };
}
