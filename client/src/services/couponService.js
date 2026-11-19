import { api } from './api.js';

export const couponService = {
  async featured() {
    const response = await api.get('/coupons/featured');
    return response.data.data;
  },

  async validate(payload) {
    const response = await api.post('/coupons/validate', payload);
    return response.data;
  },
};
