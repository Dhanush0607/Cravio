import { api } from './api.js';

export const adminService = {
  async dashboard() {
    const response = await api.get('/admin/dashboard');
    return response.data.data;
  },

  async restaurants(params = {}) {
    const response = await api.get('/admin/restaurants', { params });
    return { data: response.data.data, meta: response.data.meta };
  },

  async createRestaurant(payload) {
    const response = await api.post('/admin/restaurants', payload);
    return response.data;
  },

  async updateRestaurant(id, payload) {
    const response = await api.put(`/admin/restaurants/${id}`, payload);
    return response.data;
  },

  async deactivateRestaurant(id) {
    const response = await api.delete(`/admin/restaurants/${id}`);
    return response.data;
  },

  async menu(params = {}) {
    const response = await api.get('/admin/menu', { params });
    return { data: response.data.data, meta: response.data.meta };
  },

  async createMenuItem(payload) {
    const response = await api.post('/admin/menu', payload);
    return response.data;
  },

  async updateMenuItem(id, payload) {
    const response = await api.put(`/admin/menu/${id}`, payload);
    return response.data;
  },

  async deleteMenuItem(id) {
    const response = await api.delete(`/admin/menu/${id}`);
    return response.data;
  },

  async orders(params = {}) {
    const response = await api.get('/admin/orders', { params });
    return { data: response.data.data, meta: response.data.meta };
  },

  async updateOrderStatus(id, payload) {
    const response = await api.put(`/admin/orders/${id}/status`, payload);
    return response.data;
  },

  async customers(params = {}) {
    const response = await api.get('/admin/customers', { params });
    return { data: response.data.data, meta: response.data.meta };
  },

  async updateCustomerStatus(id, isActive) {
    const response = await api.put(`/admin/customers/${id}/status`, { isActive });
    return response.data;
  },

  async coupons(params = {}) {
    const response = await api.get('/admin/coupons', { params });
    return { data: response.data.data, meta: response.data.meta };
  },

  async createCoupon(payload) {
    const response = await api.post('/admin/coupons', payload);
    return response.data;
  },

  async updateCoupon(id, payload) {
    const response = await api.put(`/admin/coupons/${id}`, payload);
    return response.data;
  },

  async deactivateCoupon(id) {
    const response = await api.delete(`/admin/coupons/${id}`);
    return response.data;
  },

  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/admin/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },
};
