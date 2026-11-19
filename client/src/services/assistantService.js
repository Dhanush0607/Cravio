import { api } from './api.js';

export const assistantService = {
  async chat(payload) {
    const response = await api.post('/assistant/chat', payload);
    return response.data.data;
  },
};
