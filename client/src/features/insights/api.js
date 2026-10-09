import { api } from '@/lib/axios';

export async function fetchWeeklyInsights(params = {}) {
  const response = await api.get('/insights/weekly', { params });
  return response.data?.data;
}

export async function fetchInsightTrends(params = {}) {
  const response = await api.get('/insights/trends', { params });
  return response.data?.data;
}

export async function fetchWeeklyReviews(params = {}) {
  const response = await api.get('/insights/reviews', { params });
  return response.data?.data || [];
}

export async function saveWeeklyReview(data) {
  const response = await api.post('/insights/reviews', data);
  return response.data?.data;
}
