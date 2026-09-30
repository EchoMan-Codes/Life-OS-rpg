import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/hooks';
import { useToast } from '@/components/ui/useToast';
import {
  fetchReflections,
  fetchTodayReflection,
  createReflection,
  updateReflection,
} from './api';

/**
 * Hook to retrieve reflections over a range.
 * @param {object} [options]
 * @param {string} [options.range='30d']
 */
export function useReflections({ range = '30d' } = {}) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['reflections', { range }],
    queryFn: () => fetchReflections({ range }),
    staleTime: 60 * 1000,
    enabled: isAuthenticated,
  });
}

/**
 * Hook to fetch today's reflection.
 */
export function useTodayReflection() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['reflections', 'today'],
    queryFn: fetchTodayReflection,
    staleTime: 30 * 1000,
    enabled: isAuthenticated,
  });
}

/**
 * Hook to create a reflection.
 */
export function useCreateReflection() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data) => createReflection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflections'] });
      showToast({
        title: 'Reflection Saved',
        message: 'Your daily reflection has been recorded.',
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Save Failed',
        message: err?.response?.data?.error?.message || 'Failed to save reflection.',
        type: 'error',
      });
    },
  });
}

/**
 * Hook to update a reflection.
 */
export function useUpdateReflection() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => updateReflection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflections'] });
      showToast({
        title: 'Reflection Updated',
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Update Failed',
        message: err?.response?.data?.error?.message || 'Failed to update reflection.',
        type: 'error',
      });
    },
  });
}
