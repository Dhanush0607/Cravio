import { api } from './api.js';

export const restaurantService = {
  async list(params = {}) {
    const response = await api.get('/restaurants', { params });
    return { data: response.data.data, meta: response.data.meta };
  },

  async cuisines(city) {
    const response = await api.get('/restaurants/cuisines', { params: { city } });
    return response.data.data;
  },

  async get(identifier) {
    const response = await api.get(`/restaurants/${encodeURIComponent(identifier)}`);
    return response.data.data;
  },

  async menu(restaurantId, params = {}) {
    const response = await api.get(`/restaurants/${restaurantId}/menu`, { params });
    return response.data.data;
  },

  async searchMenu(params = {}) {
    const response = await api.get('/menu', { params });
    return { data: response.data.data, meta: response.data.meta };
  },

  async topDishes(params = {}) {
    const response = await api.get('/menu/top', { params });
    return response.data.data;
  },
};
