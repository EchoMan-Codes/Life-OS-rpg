import { apiClient } from '@/lib/axios';

export async function submitFeedback(payload) {
  const { data } = await apiClient.post('/feedback', payload);
  return data;
}

export async function getMyFeedback() {
  const { data } = await apiClient.get('/feedback/my');
  return data?.data || [];
}
