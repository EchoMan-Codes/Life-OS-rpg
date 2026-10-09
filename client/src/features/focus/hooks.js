import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/hooks';
import { useToast } from '@/components/ui/useToast';
import {
  startFocusSession,
  fetchCurrentFocus,
  fetchFocusHistory,
  fetchFocusSummary,
  pauseFocusSession,
  resumeFocusSession,
  completeFocusSession,
  abandonFocusSession,
} from './api';

/**
 * Hook for the current active focus session.
 */
export function useCurrentFocus() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['focus', 'current'],
    queryFn: fetchCurrentFocus,
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000,
    enabled: isAuthenticated,
  });
}
export const useCurrentFocusSession = useCurrentFocus;

/**
 * Hook for focus session history.
 */
export function useFocusHistory({ limit = 50 } = {}) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['focus', 'history', { limit }],
    queryFn: () => fetchFocusHistory({ limit }),
    staleTime: 30 * 1000,
    enabled: isAuthenticated,
  });
}

/**
 * Hook for focus summary analytics.
 */
export function useFocusSummary() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['focus', 'summary'],
    queryFn: fetchFocusSummary,
    staleTime: 30 * 1000,
    enabled: isAuthenticated,
  });
}

/**
 * Hook to start a focus session.
 */
export function useStartFocus() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data) => startFocusSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus'] });
      showToast({
        title: 'Focus Chamber Activated',
        message: 'Stay locked in — Mana restoration in progress!',
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Failed to Start',
        message: err?.response?.data?.error?.message || 'Could not start focus session.',
        type: 'error',
      });
    },
  });
}
export const useStartFocusSession = useStartFocus;

/**
 * Hook to pause a focus session.
 */
export function usePauseFocusSession() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id) => pauseFocusSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus', 'current'] });
      showToast({ title: 'Focus Paused', message: 'Timer paused. Take a breath.', type: 'info' });
    },
    onError: (err) => {
      showToast({
        title: 'Failed to pause',
        message: err?.response?.data?.error?.message || 'Error pausing session.',
        type: 'error',
      });
    },
  });
}

/**
 * Hook to resume a paused focus session.
 */
export function useResumeFocusSession() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id) => resumeFocusSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus', 'current'] });
      showToast({ title: 'Resumed Flow ⚡', message: 'Deep work timer is running.', type: 'success' });
    },
    onError: (err) => {
      showToast({
        title: 'Failed to resume',
        message: err?.response?.data?.error?.message || 'Error resuming session.',
        type: 'error',
      });
    },
  });
}

/**
 * Hook to complete a focus session.
 */
export function useCompleteFocus() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id) => completeFocusSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      showToast({
        title: 'Focus Complete! ⚡',
        message: 'Mana replenished and deep work recorded.',
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Completion Failed',
        message: err?.response?.data?.error?.message || 'Could not complete session.',
        type: 'error',
      });
    },
  });
}
export const useCompleteFocusSession = useCompleteFocus;

/**
 * Hook to abandon a focus session.
 */
export function useAbandonFocus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => abandonFocusSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus'] });
    },
  });
}
export const useAbandonFocusSession = useAbandonFocus;

/**
 * Custom hook to run a real-time countdown timer for an active session with pause awareness.
 */
export function useFocusTimer(session) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!session || session.status === 'completed' || session.status === 'abandoned' || session.endedAt) {
      setElapsed(0);
      return;
    }

    const start = new Date(session.startedAt).getTime();
    const planned = session.plannedDurationSeconds || 1500;
    const isPaused = Boolean(session.isPaused || session.pausedAt);
    const pausedAtTime = session.pausedAt ? new Date(session.pausedAt).getTime() : null;
    const baseTotalPaused = session.totalPausedSeconds || 0;

    const calculateElapsed = (referenceTime) => {
      let pauseOffset = baseTotalPaused;
      if (pausedAtTime) {
        pauseOffset += Math.floor((referenceTime - pausedAtTime) / 1000);
      }
      const raw = Math.floor((referenceTime - start) / 1000);
      return Math.min(planned, Math.max(0, raw - pauseOffset));
    };

    if (isPaused) {
      // If paused, freeze elapsed at time of pause
      setElapsed(calculateElapsed(pausedAtTime || Date.now()));
      return;
    }

    const tick = () => {
      setElapsed(calculateElapsed(Date.now()));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const planned = session?.plannedDurationSeconds || 1500;
  const remaining = Math.max(0, planned - elapsed);
  const progress = planned > 0 ? elapsed / planned : 0;
  const isFinished = session ? elapsed >= planned : false;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    elapsed,
    remaining,
    progress,
    isFinished,
    formattedTime,
    isPaused: Boolean(session?.isPaused || session?.pausedAt),
  };
}
