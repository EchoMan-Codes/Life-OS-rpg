import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

import { useAuth } from '@/features/auth/hooks';
import { useToast } from '@/components/ui/useToast';
import {
  fetchFocusCapabilities,
  fetchFocusProfiles,
  createFocusProfile,
  updateFocusProfile,
  deleteFocusProfile,
  startFocusSession,
  fetchCurrentFocus,
  fetchFocusHistory,
  fetchFocusSummary,
  fetchFocusAnalytics,
  pauseFocusSession,
  resumeFocusSession,
  completeFocusSession,
  abandonFocusSession,
  earlyExitFocusSession,
  emergencyExitFocusSession,
  recordFocusEvent,
} from './api';

/**
 * Hook for platform focus capabilities.
 */
export function useFocusCapabilities(platform) {
  const plat = platform || Capacitor.getPlatform();
  return useQuery({
    queryKey: ['focus', 'capabilities', plat],
    queryFn: () => fetchFocusCapabilities(plat),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for distraction shield profiles.
 */
export function useFocusProfiles() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['focus', 'profiles'],
    queryFn: fetchFocusProfiles,
    staleTime: 60 * 1000,
    enabled: isAuthenticated,
  });
}

/**
 * Hook to create a focus profile.
 */
export function useCreateFocusProfile() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: createFocusProfile,
    onSuccess: (newProfile) => {
      queryClient.invalidateQueries({ queryKey: ['focus', 'profiles'] });
      showToast({
        title: 'Shield Profile Saved',
        message: `Profile "${newProfile.name}" is ready for focus sessions.`,
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Failed to Save Profile',
        message: err?.response?.data?.error?.message || 'Could not save profile.',
        type: 'error',
      });
    },
  });
}

/**
 * Hook to update a focus profile.
 */
export function useUpdateFocusProfile() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => updateFocusProfile(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus', 'profiles'] });
      showToast({
        title: 'Shield Profile Updated',
        message: 'Your distraction restrictions were saved.',
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Failed to Update Profile',
        message: err?.response?.data?.error?.message || 'Could not update profile.',
        type: 'error',
      });
    },
  });
}

/**
 * Hook to delete a focus profile.
 */
export function useDeleteFocusProfile() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: deleteFocusProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus', 'profiles'] });
      showToast({
        title: 'Profile Removed',
        message: 'Shield profile has been deleted.',
        type: 'info',
      });
    },
  });
}

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
export function useFocusHistory({ limit = 50, status = null } = {}) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['focus', 'history', { limit, status }],
    queryFn: () => fetchFocusHistory({ limit, status }),
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
 * Hook for detailed focus analytics.
 */
export function useFocusAnalytics() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['focus', 'analytics'],
    queryFn: fetchFocusAnalytics,
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
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['focus'] });
      const levelLabels = { 1: 'Standard Flow', 2: 'Commitment Lock (Hold to Exit)', 3: 'Maximum Shield 🛡️' };
      showToast({
        title: 'Focus Chamber Engaged',
        message: `${levelLabels[session.commitmentLevel] || 'Focus Sprint'} active — Deep work in progress!`,
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
        title: 'Pause Unavailable',
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['focus'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      showToast({
        title: 'Focus Complete! ⚡',
        message: `Awarded +${data?.xpAwarded || 0} XP, +${data?.goldAwarded || 0} Gold, and +${data?.manaRegenerated || 0} Mana!`,
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Completion Verification Failed',
        message: err?.response?.data?.error?.message || 'Could not complete session.',
        type: 'error',
      });
    },
  });
}
export const useCompleteFocusSession = useCompleteFocus;

/**
 * Hook for Hold-to-Confirm early exit.
 */
export function useEarlyExitFocusSession() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => earlyExitFocusSession(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['focus'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
      showToast({
        title: 'Session Ended Early',
        message: data?.message || 'Session ended. Distraction restrictions released.',
        type: 'info',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Early Exit Failed',
        message: err?.response?.data?.error?.message || 'Could not exit session.',
        type: 'error',
      });
    },
  });
}

/**
 * Hook for Emergency Exit pathway.
 */
export function useEmergencyExitFocusSession() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => emergencyExitFocusSession(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus'] });
      showToast({
        title: 'Emergency Exit Activated',
        message: 'All device restrictions released immediately.',
        type: 'warning',
      });
    },
  });
}

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
 * Hook to record session events (audit trail).
 */
export function useRecordFocusEvent() {
  return useMutation({
    mutationFn: ({ id, eventType, metadata, clientTimestamp }) =>
      recordFocusEvent(id, { eventType, metadata, clientTimestamp }),
  });
}

/**
 * Upgraded real-time countdown timer with monotonic delta tracking,
 * background-suspension reconciliation, and pause awareness.
 */
export function useFocusTimer(session) {
  const [elapsed, setElapsed] = useState(0);

  const calculateElapsed = useCallback(
    (referenceTime) => {
      if (!session || session.status === 'completed' || session.status === 'abandoned' || session.endedAt) {
        return 0;
      }

      const start = new Date(session.startedAt).getTime();
      const planned = session.plannedDurationSeconds || 1500;
      const isPaused = Boolean(session.isPaused || session.pausedAt);
      const pausedAtTime = session.pausedAt ? new Date(session.pausedAt).getTime() : null;
      let totalPaused = session.totalPausedSeconds || 0;

      if (isPaused && pausedAtTime) {
        totalPaused += Math.floor((referenceTime - pausedAtTime) / 1000);
      }

      const raw = Math.floor((referenceTime - start) / 1000);
      return Math.min(planned, Math.max(0, raw - totalPaused));
    },
    [session]
  );

  useEffect(() => {
    if (!session || session.status === 'completed' || session.status === 'abandoned' || session.endedAt) {
      setElapsed(0);
      return;
    }

    const isPaused = Boolean(session.isPaused || session.pausedAt);
    const pausedAtTime = session.pausedAt ? new Date(session.pausedAt).getTime() : null;

    if (isPaused) {
      setElapsed(calculateElapsed(pausedAtTime || Date.now()));
      return;
    }

    // Monotonic tick
    const tick = () => {
      setElapsed(calculateElapsed(Date.now()));
    };

    tick();
    const interval = setInterval(tick, 1000);

    // Background/foreground re-sync listeners
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        tick();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Native Capacitor app lifecycle listener
    let capListener = null;
    if (Capacitor.isNativePlatform()) {
      capListener = CapApp.addListener('appStateChange', (state) => {
        if (state.isActive) {
          tick();
        }
      });
    }

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (capListener && typeof capListener.then === 'function') {
        capListener.then((l) => l.remove()).catch(() => {});
      }
    };
  }, [session, calculateElapsed]);

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
