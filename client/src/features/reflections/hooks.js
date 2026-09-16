import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks';
import {
  createReflection,
  updateReflection,
  getReflections,
  getTodayReflection,
} from './api';

export const REFLECTIONS_QUERY_KEY = ['reflections'];
export const TODAY_REFLECTION_QUERY_KEY = ['reflections', 'today'];

/**
 * Hook to retrieve reflections within a date range for consistency heatmap.
 *
 * @param {string} [range='30d']
 */
export function useReflections(range = '30d') {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...REFLECTIONS_QUERY_KEY, range],
    queryFn: () => getReflections(range),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to retrieve today's reflection if already submitted.
 */
export function useTodayReflection() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: TODAY_REFLECTION_QUERY_KEY,
    queryFn: () => getTodayReflection(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

/**
 * Mutation hook to create a reflection.
 */
export function useCreateReflection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReflection,
    onSuccess: (newReflection) => {
      queryClient.setQueryData(TODAY_REFLECTION_QUERY_KEY, newReflection);
      queryClient.invalidateQueries({ queryKey: REFLECTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['rest-mode'] });
    },
  });
}

/**
 * Mutation hook to update an existing reflection.
 */
export function useUpdateReflection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => updateReflection(id, payload),
    onSuccess: (updatedReflection) => {
      queryClient.setQueryData(TODAY_REFLECTION_QUERY_KEY, updatedReflection);
      queryClient.invalidateQueries({ queryKey: REFLECTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['rest-mode'] });
    },
  });
}
