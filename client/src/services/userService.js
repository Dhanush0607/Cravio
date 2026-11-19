import { api } from './api.js';

export const userService = {
  async profile() {
    const response = await api.get('/users/profile');
    return response.data.data;
  },

  async updateProfile(payload) {
    const response = await api.put('/users/profile', payload);
    return response.data;
  },

  async changePassword(payload) {
    const response = await api.put('/users/password', payload);
    return response.data;
  },

  async addresses() {
    const response = await api.get('/users/addresses');
    return response.data.data;
  },

  async addAddress(payload) {
    const response = await api.post('/users/addresses', payload);
    return response.data;
  },

  async updateAddress(addressId, payload) {
    const response = await api.put(`/users/addresses/${addressId}`, payload);
    return response.data;
  },

  async deleteAddress(addressId) {
    const response = await api.delete(`/users/addresses/${addressId}`);
    return response.data;
  },
};
