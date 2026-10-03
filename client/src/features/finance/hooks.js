import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchExpenses, fetchFinanceSummary, createExpense } from './api';

export const FINANCE_EXPENSES_KEY = ['finance', 'expenses'];
export const FINANCE_SUMMARY_KEY = ['finance', 'summary'];

export function useExpenses(params) {
  return useQuery({
    queryKey: [...FINANCE_EXPENSES_KEY, params],
    queryFn: () => fetchExpenses(params),
    staleTime: 1000 * 30,
  });
}

export function useFinanceSummary() {
  return useQuery({
    queryKey: FINANCE_SUMMARY_KEY,
    queryFn: fetchFinanceSummary,
    staleTime: 1000 * 30,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_EXPENSES_KEY });
      queryClient.invalidateQueries({ queryKey: FINANCE_SUMMARY_KEY });
    },
  });
}
