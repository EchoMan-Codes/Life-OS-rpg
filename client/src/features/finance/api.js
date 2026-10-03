import { apiClient } from '@/lib/axios';

export async function fetchExpenses(params = {}) {
  const res = await apiClient.get('/finance', { params });
  return res.data.data.expenses;
}

export async function fetchFinanceSummary() {
  const res = await apiClient.get('/finance/summary');
  return res.data.data.summary;
}

export async function createExpense(data) {
  const res = await apiClient.post('/finance', data);
  return res.data.data.expense;
}
