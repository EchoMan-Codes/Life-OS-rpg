import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useToast } from '@/components/ui/useToast';
import { useAuth } from '@/features/auth/hooks';
import {
  fetchHabits,
  createHabit,
  updateHabit,
  archiveHabit,
  scoreHabit,
} from './api';
import { calculateHabitReward } from './rewardTable';
import { checkAndTriggerCelebrations } from '@/features/celebration/celebrationEvents';

/**
 * Hook to retrieve user habits with TanStack Query.
 */
export function useHabits({ includeArchived = false } = {}) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['habits', { includeArchived }],
    queryFn: () => fetchHabits({ includeArchived }),
    staleTime: 30 * 1000,
    enabled: isAuthenticated,
  });
}

/**
 * Hook to create a new habit.
 */
export function useCreateHabit() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data) => createHabit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      showToast({
        title: 'Habit Created',
        message: 'Your new habit is ready to track.',
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Creation Failed',
        message: err?.response?.data?.error?.message || 'Failed to create habit.',
        type: 'error',
      });
    },
  });
}

/**
 * Hook to update an existing habit.
 */
export function useUpdateHabit() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ habitId, data }) => updateHabit(habitId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      showToast({
        title: 'Habit Updated',
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Update Failed',
        message: err?.response?.data?.error?.message || 'Failed to update habit.',
        type: 'error',
      });
    },
  });
}

/**
 * Hook to archive / soft-delete a habit.
 */
export function useArchiveHabit() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (habitId) => archiveHabit(habitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      showToast({
        title: 'Habit Archived',
        message: 'Habit removed from active list.',
        type: 'info',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Archive Failed',
        message: err?.response?.data?.error?.message || 'Failed to archive habit.',
        type: 'error',
      });
    },
  });
}

/**
 * Optimistically bumps habit streak and lastScoredAt.
 */
function bumpHabitOptimistically(oldHabits, habitId, direction) {
  if (!Array.isArray(oldHabits)) return oldHabits;
  return oldHabits.map((habit) => {
    if (habit.id !== habitId) return habit;

    let newCurrentStreak;
    let newBestStreak;

    if (direction === 'positive') {
      newCurrentStreak = habit.currentStreak + 1;
      newBestStreak = Math.max(habit.bestStreak, newCurrentStreak);
    } else {
      newCurrentStreak = 0;
      newBestStreak = habit.bestStreak;
    }

    return {
      ...habit,
      currentStreak: newCurrentStreak,
      bestStreak: newBestStreak,
      lastScoredAt: new Date().toISOString(),
    };
  });
}

/**
 * Optimistically bumps character stats (XP, Gold, or HP).
 */
function bumpCharacterOptimistically(oldChar, habit, direction) {
  if (!oldChar) return oldChar;

  const reward = calculateHabitReward(habit?.difficulty || 'easy', direction);

  if (direction === 'positive') {
    return {
      ...oldChar,
      xp: oldChar.xp + reward.xp,
      gold: oldChar.gold + reward.gold,
    };
  }

  if (direction === 'negative') {
    return {
      ...oldChar,
      hp: Math.max(0, oldChar.hp + reward.hp),
    };
  }

  return oldChar;
}

/**
 * Hook to score a habit with optimistic updates, sound, floating text, and error rollback.
 *
 * @param {string} habitId
 * @param {object} [habit] - Full habit object for difficulty calculation
 */
export function useScoreHabit(habitId, habit) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (direction) => scoreHabit(habitId, direction),
    onMutate: async (direction) => {
      await queryClient.cancelQueries({ queryKey: ['habits'] });
      await queryClient.cancelQueries({ queryKey: ['character'] });

      const prevHabits = queryClient.getQueryData(['habits', { includeArchived: false }]);
      const prevChar = queryClient.getQueryData(['character']);

      // Optimistically update habit list
      queryClient.setQueryData(['habits', { includeArchived: false }], (old) =>
        bumpHabitOptimistically(old, habitId, direction)
      );

      // Optimistically update character stats in HUD
      queryClient.setQueryData(['character'], (old) =>
        bumpCharacterOptimistically(old, habit, direction)
      );

      return { prevHabits, prevChar };
    },
    onError: (err, _vars, ctx) => {
      // Rollback to prior snapshot
      if (ctx?.prevHabits !== undefined) {
        queryClient.setQueryData(['habits', { includeArchived: false }], ctx.prevHabits);
      }
      if (ctx?.prevChar !== undefined) {
        queryClient.setQueryData(['character'], ctx.prevChar);
      }

      showToast({
        title: 'Action Failed',
        message: err?.response?.data?.error?.message || 'Network error: scoring rolled back.',
        type: 'error',
      });
    },
    onSuccess: (res) => {
      checkAndTriggerCelebrations(res?.data);
      queryClient.invalidateQueries({ queryKey: ['battle-events'] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
      queryClient.invalidateQueries({ queryKey: ['battle-events'] });
    },
  });
}
