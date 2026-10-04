import { apiClient } from '@/lib/axios';

export const notificationApi = {
  async list({ limit = 30, offset = 0, unreadOnly = false, type } = {}) {
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit);
    if (offset) params.set('offset', offset);
    if (unreadOnly) params.set('unreadOnly', 'true');
    if (type && type !== 'all') params.set('type', type);

    const res = await apiClient.get(`/notifications?${params.toString()}`);
    return res.data.data;
  },

  async unreadCount() {
    const res = await apiClient.get('/notifications/unread-count');
    return res.data.data.unreadCount;
  },

  async markAsRead(id) {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res.data.data;
  },

  async markAllAsRead() {
    const res = await apiClient.post('/notifications/read-all');
    return res.data.data;
  },

  async delete(id) {
    const res = await apiClient.delete(`/notifications/${id}`);
    return res.data.data;
  },

  async getPreferences() {
    const res = await apiClient.get('/notifications/preferences');
    return res.data.data;
  },

  async updatePreferences(preferences) {
    const res = await apiClient.put('/notifications/preferences', preferences);
    return res.data.data;
  },
};
