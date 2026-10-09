import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/useToast';
import { useAuth } from '@/features/auth/hooks';
import {
  fetchWeeklyInsights,
  fetchInsightTrends,
  fetchWeeklyReviews,
  saveWeeklyReview,
} from './api';

export function useWeeklyInsights(params = {}) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['insights', 'weekly', params],
    queryFn: () => fetchWeeklyInsights(params),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useInsightTrends(params = {}) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['insights', 'trends', params],
    queryFn: () => fetchInsightTrends(params),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useWeeklyReviews(params = {}) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['insights', 'reviews', params],
    queryFn: () => fetchWeeklyReviews(params),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useSaveWeeklyReview() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: saveWeeklyReview,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showToast({
        title: 'Weekly Review Immortalized 📜',
        message: 'Your progress and lessons have been recorded.',
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Failed to save review',
        message: err?.response?.data?.error?.message || 'Error saving review.',
        type: 'error',
      });
    },
  });
}
