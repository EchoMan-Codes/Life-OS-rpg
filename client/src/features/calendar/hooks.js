import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/useToast';
import { useAuth } from '@/features/auth/hooks';
import {
  fetchCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  checkCalendarConflicts,
  scheduleTaskTimeBlock,
  toggleCalendarEventComplete,
} from './api';

export function useCalendarEvents(params = {}) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['calendar', 'events', params],
    queryFn: () => fetchCalendarEvents(params),
    enabled: isAuthenticated && Boolean(params.startDate && params.endDate),
    staleTime: 30 * 1000,
  });
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: createCalendarEvent,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dailies'] });
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      showToast({
        title: 'Event Scheduled',
        message: `"${data?.title}" confirmed on your calendar.`,
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Failed to schedule event',
        message: err?.response?.data?.error?.message || 'Error creating event.',
        type: 'error',
      });
    },
  });
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => updateCalendarEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dailies'] });
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      showToast({
        title: 'Schedule Updated',
        message: 'Event schedule synchronized across Jeevan.',
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Update failed',
        message: err?.response?.data?.error?.message || 'Failed to update event.',
        type: 'error',
      });
    },
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: deleteCalendarEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dailies'] });
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      showToast({
        title: 'Event Removed',
        message: 'Event cleared and synchronization updated.',
        type: 'info',
      });
    },
  });
}

export function useScheduleTimeBlock() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: scheduleTaskTimeBlock,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      if (res?.conflictWarning?.length > 0) {
        showToast({
          title: 'Time Block Scheduled with Overlap',
          message: `Note: overlaps with ${res.conflictWarning.length} existing event(s).`,
          type: 'warning',
        });
      } else {
        showToast({
          title: 'Task Blocked on Calendar ⚡',
          message: 'Dedicated focus block locked in.',
          type: 'success',
        });
      }
    },
    onError: (err) => {
      showToast({
        title: 'Failed to schedule block',
        message: err?.response?.data?.error?.message || 'Error creating time block.',
        type: 'error',
      });
    },
  });
}

export function useToggleCalendarEventComplete() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (eventId) => toggleCalendarEventComplete(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dailies'] });
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
      showToast({
        title: 'Status Synchronized ⚔️',
        message: 'Progression and calendar updated.',
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Action failed',
        message: err?.response?.data?.error?.message || 'Could not toggle item completion.',
        type: 'error',
      });
    },
  });
}
