import { apiClient } from '@/lib/axios';

export async function sendAiMessage(message) {
  const res = await apiClient.post('/ai/chat', { message });
  return res.data.data;
}

export async function fetchAiHistory() {
  const res = await apiClient.get('/ai/history');
  return res.data.data.messages;
}

export async function confirmAiAction(messageId) {
  const res = await apiClient.post(`/ai/actions/${messageId}/confirm`);
  return res.data.data;
}

export async function cancelAiAction(messageId) {
  const res = await apiClient.post(`/ai/actions/${messageId}/cancel`);
  return res.data.data;
}

export async function fetchAiContext() {
  const res = await apiClient.get('/ai/context');
  return res.data.data.context;
}
