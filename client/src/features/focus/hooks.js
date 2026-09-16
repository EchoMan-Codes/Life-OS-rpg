import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCurrentFocusSession,
  startFocusSession,
  completeFocusSession,
  abandonFocusSession,
  listFocusHistory,
} from './api';

export const FOCUS_CURRENT_KEY = ['focus', 'current'];
export const FOCUS_HISTORY_KEY = ['focus', 'history'];

export function useFocusHistory(limit = 20) {
  return useQuery({
    queryKey: [...FOCUS_HISTORY_KEY, limit],
    queryFn: () => listFocusHistory(limit),
    staleTime: 30000,
  });
}

export function useCurrentFocusSession() {
  return useQuery({
    queryKey: FOCUS_CURRENT_KEY,
    queryFn: getCurrentFocusSession,
    staleTime: 5000,
  });
}

export function useStartFocusSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startFocusSession,
    onSuccess: (data) => {
      queryClient.setQueryData(FOCUS_CURRENT_KEY, data);
    },
  });
}

export function useCompleteFocusSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: completeFocusSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOCUS_CURRENT_KEY });
      queryClient.invalidateQueries({ queryKey: ['character'] });
    },
  });
}

export function useAbandonFocusSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: abandonFocusSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOCUS_CURRENT_KEY });
    },
  });
}

/**
 * Server-synchronized focus countdown timer.
 * Reconnects and tab-backgrounding will not drift because remaining time
 * is derived from server startedAt and planned duration.
 *
 * @param {object} session
 * @returns {object} { remainingSeconds, elapsedSeconds, progress, isFinished, formattedTime }
 */
export function useFocusTimer(session) {
  const [now, setNow] = useState(() => Date.now());

  const sessionId = session?.id;
  const startedAt = session?.startedAt;
  const plannedDuration = session?.plannedDurationSeconds;

  useEffect(() => {
    if (!sessionId || !startedAt || !plannedDuration) return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId, startedAt, plannedDuration]);

  const started = session ? new Date(session.startedAt).getTime() : 0;
  const elapsedSeconds = session ? Math.max(0, Math.floor((now - started) / 1000)) : 0;
  const remainingSeconds = session ? Math.max(0, (session.plannedDurationSeconds || 0) - elapsedSeconds) : 0;
  const totalSeconds = session?.plannedDurationSeconds || 900;
  const progress = Math.min(1, Math.max(0, elapsedSeconds / totalSeconds));
  const isFinished = remainingSeconds === 0 && Boolean(session);

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return {
    remainingSeconds,
    elapsedSeconds,
    totalSeconds,
    progress,
    isFinished,
    formattedTime,
  };
}
