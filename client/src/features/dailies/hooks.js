import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useToast } from '@/components/ui/useToast';
import { useAuth } from '@/features/auth/hooks';
import {
  fetchDailies,
  createDaily,
  updateDaily,
  archiveDaily,
  completeDaily,
  undoDaily,
} from './api';

const DIFFICULTY_REWARDS = {
  trivial: { xp: 3, gold: 1 },
  easy: { xp: 8, gold: 3 },
  medium: { xp: 15, gold: 6 },
  hard: { xp: 25, gold: 10 },
};

/**
 * Hook to retrieve user dailies with TanStack Query.
 */
export function useDailies({ includeArchived = false } = {}) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['dailies', { includeArchived }],
    queryFn: () => fetchDailies({ includeArchived }),
    staleTime: 30 * 1000,
    enabled: isAuthenticated,
  });
}

/**
 * Hook to create a new daily ritual.
 */
export function useCreateDaily() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data) => createDaily(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailies'] });
      showToast({
        title: 'Daily Ritual Created',
        message: 'Your new daily is ready for today.',
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Creation Failed',
        message: err?.response?.data?.error?.message || 'Failed to create daily.',
        type: 'error',
      });
    },
  });
}

/**
 * Hook to update an existing daily ritual.
 */
export function useUpdateDaily() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ dailyId, data }) => updateDaily(dailyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailies'] });
      showToast({
        title: 'Daily Updated',
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Update Failed',
        message: err?.response?.data?.error?.message || 'Failed to update daily.',
        type: 'error',
      });
    },
  });
}

/**
 * Hook to archive / soft-delete a daily ritual.
 */
export function useArchiveDaily() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (dailyId) => archiveDaily(dailyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailies'] });
      showToast({
        title: 'Daily Archived',
        message: 'Daily ritual removed from active tracking.',
        type: 'info',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Archive Failed',
        message: err?.response?.data?.error?.message || 'Failed to archive daily.',
        type: 'error',
      });
    },
  });
}

/**
 * Hook to complete a daily ritual for today with optimistic update & rollback.
 */
export function useCompleteDaily(dailyId, daily) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: () => completeDaily(dailyId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['dailies'] });
      await queryClient.cancelQueries({ queryKey: ['character'] });

      const prevDailies = queryClient.getQueryData(['dailies', { includeArchived: false }]);
      const prevChar = queryClient.getQueryData(['character']);

      const reward = DIFFICULTY_REWARDS[daily?.difficulty || 'easy'];

      // Optimistically update daily in list
      queryClient.setQueryData(['dailies', { includeArchived: false }], (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((d) => (d.id === dailyId ? { ...d, isCompleteToday: true } : d));
      });

      // Optimistically update character stats in HUD
      queryClient.setQueryData(['character'], (old) => {
        if (!old) return old;
        return {
          ...old,
          xp: old.xp + reward.xp,
          gold: old.gold + reward.gold,
        };
      });

      return { prevDailies, prevChar };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prevDailies !== undefined) {
        queryClient.setQueryData(['dailies', { includeArchived: false }], ctx.prevDailies);
      }
      if (ctx?.prevChar !== undefined) {
        queryClient.setQueryData(['character'], ctx.prevChar);
      }

      showToast({
        title: 'Completion Failed',
        message: err?.response?.data?.error?.message || 'Failed to complete daily.',
        type: 'error',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dailies'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
    },
  });
}

/**
 * Hook to undo today's completion of a daily ritual with optimistic rollback.
 */
export function useUndoDaily(dailyId, daily) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: () => undoDaily(dailyId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['dailies'] });
      await queryClient.cancelQueries({ queryKey: ['character'] });

      const prevDailies = queryClient.getQueryData(['dailies', { includeArchived: false }]);
      const prevChar = queryClient.getQueryData(['character']);

      const reward = DIFFICULTY_REWARDS[daily?.difficulty || 'easy'];

      // Optimistically mark incomplete in list
      queryClient.setQueryData(['dailies', { includeArchived: false }], (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((d) => (d.id === dailyId ? { ...d, isCompleteToday: false } : d));
      });

      // Optimistically deduct character stats in HUD
      queryClient.setQueryData(['character'], (old) => {
        if (!old) return old;
        return {
          ...old,
          xp: Math.max(0, old.xp - reward.xp),
          gold: Math.max(0, old.gold - reward.gold),
        };
      });

      return { prevDailies, prevChar };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prevDailies !== undefined) {
        queryClient.setQueryData(['dailies', { includeArchived: false }], ctx.prevDailies);
      }
      if (ctx?.prevChar !== undefined) {
        queryClient.setQueryData(['character'], ctx.prevChar);
      }

      showToast({
        title: 'Undo Failed',
        message: err?.response?.data?.error?.message || 'Failed to undo daily.',
        type: 'error',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dailies'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
    },
  });
}
