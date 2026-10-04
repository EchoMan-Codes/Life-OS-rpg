import { apiClient } from '@/lib/axios';

export const aiApi = {
  async chat({ message, history = [] }) {
    const res = await apiClient.post('/ai/chat', { message, history });
    return res.data.data;
  },

  async executeAction({ actionType, payload }) {
    const res = await apiClient.post('/ai/execute-action', { actionType, payload });
    return res.data.data;
  },

  async getContext() {
    const res = await apiClient.get('/ai/context');
    return res.data.data;
  },
};
