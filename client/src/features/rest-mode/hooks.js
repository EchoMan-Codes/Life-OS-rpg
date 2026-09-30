import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks';
import { useToast } from '@/components/ui/useToast';
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
  const { showToast } = useToast();

  return useMutation({
    mutationFn: activateRestMode,
    onSuccess: (newStatus) => {
      queryClient.setQueryData(REST_MODE_STATUS_KEY, newStatus);
      queryClient.invalidateQueries({ queryKey: REST_MODE_SUGGESTION_KEY });
      showToast({
        title: 'Rest Mode Activated',
        message: 'Daily reset HP penalties paused. Take time to recover.',
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Activation Failed',
        message: err?.response?.data?.error?.message || 'Could not activate rest mode.',
        type: 'error',
      });
    },
  });
}

/**
 * Mutation hook to deactivate Rest Mode.
 */
export function useDeactivateRestMode() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: deactivateRestMode,
    onSuccess: (newStatus) => {
      queryClient.setQueryData(REST_MODE_STATUS_KEY, newStatus);
      queryClient.invalidateQueries({ queryKey: REST_MODE_SUGGESTION_KEY });
      showToast({
        title: 'Welcome Back, Hero!',
        message: 'Game mechanics and progression resumed.',
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Deactivation Failed',
        message: err?.response?.data?.error?.message || 'Could not deactivate rest mode.',
        type: 'error',
      });
    },
  });
}
