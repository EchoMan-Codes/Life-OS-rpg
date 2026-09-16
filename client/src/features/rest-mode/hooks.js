import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks';
import {
  getRestModeStatus,
  getRestModeSuggestion,
  activateRestMode,
  deactivateRestMode,
} from './api';

export const REST_MODE_STATUS_KEY = ['rest-mode', 'status'];
export const REST_MODE_SUGGESTION_KEY = ['rest-mode', 'suggestion'];

/**
 * Hook to retrieve current Rest Mode status.
 */
export function useRestModeStatus() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: REST_MODE_STATUS_KEY,
    queryFn: () => getRestModeStatus(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to retrieve burnout Rest Mode suggestion.
 */
export function useRestModeSuggestion() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: REST_MODE_SUGGESTION_KEY,
    queryFn: () => getRestModeSuggestion(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

/**
 * Mutation hook to activate Rest Mode.
 */
export function useActivateRestMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateRestMode,
    onSuccess: (newStatus) => {
      queryClient.setQueryData(REST_MODE_STATUS_KEY, newStatus);
      queryClient.invalidateQueries({ queryKey: REST_MODE_SUGGESTION_KEY });
    },
  });
}

/**
 * Mutation hook to deactivate Rest Mode.
 */
export function useDeactivateRestMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateRestMode,
    onSuccess: (newStatus) => {
      queryClient.setQueryData(REST_MODE_STATUS_KEY, newStatus);
      queryClient.invalidateQueries({ queryKey: REST_MODE_SUGGESTION_KEY });
    },
  });
}
