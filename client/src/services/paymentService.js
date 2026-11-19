import { api } from './api.js';

export const paymentService = {
  async config() {
    const response = await api.get('/payments/config');
    return response.data.data;
  },

  async create(orderId) {
    const response = await api.post('/payments/create', { orderId });
    return response.data.data;
  },

  async verify(payload) {
    const response = await api.post('/payments/verify', payload);
    return response.data;
  },
};
