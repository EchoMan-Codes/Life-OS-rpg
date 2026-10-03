import { apiClient } from '@/lib/axios';

export async function fetchStudyLogs(params = {}) {
  const res = await apiClient.get('/study', { params });
  return res.data.data.logs;
}

export async function fetchStudySummary() {
  const res = await apiClient.get('/study/summary');
  return res.data.data.summary;
}

export async function logStudySession(data) {
  const res = await apiClient.post('/study', data);
  return res.data.data;
}
