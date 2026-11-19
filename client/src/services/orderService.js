import { api } from './api.js';

export const orderService = {
  async create(payload, idempotencyKey) {
    const response = await api.post('/orders', payload, {
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
    return response.data;
  },

  async myOrders(params = {}) {
    const response = await api.get('/orders/my-orders', { params });
    return { data: response.data.data, meta: response.data.meta };
  },

  async get(orderId) {
    const response = await api.get(`/orders/${orderId}`);
    return response.data.data;
  },

  async cancel(orderId, reason) {
    const response = await api.patch(`/orders/${orderId}/cancel`, { reason });
    return response.data;
  },
};
