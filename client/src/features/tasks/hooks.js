import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/useToast';
import { useAuth } from '@/features/auth/hooks';
import { checkAndTriggerCelebrations } from '@/features/celebration/celebrationEvents';
import {
  fetchTasks,
  fetchTaskSummary,
  fetchTaskById,
  createTask,
  updateTask,
  completeTask,
  uncompleteTask,
  deleteTask,
} from './api';

export function useTasks(filters = {}) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => fetchTasks(filters),
    enabled: isAuthenticated,
    staleTime: 15 * 1000,
  });
}

export function useTaskSummary() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['tasks', 'summary'],
    queryFn: fetchTaskSummary,
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
}

export function useTask(id) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => fetchTaskById(id),
    enabled: isAuthenticated && Boolean(id),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: createTask,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showToast({
        title: 'Task Created',
        message: `"${data?.title}" added to your queue.`,
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Failed to create task',
        message: err?.response?.data?.error?.message || 'Server error occurred.',
        type: 'error',
      });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
    onError: (err) => {
      showToast({
        title: 'Update failed',
        message: err?.response?.data?.error?.message || 'Failed to update task.',
        type: 'error',
      });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id) => completeTask(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });

      if (res?.alreadyCompleted) {
        showToast({ title: 'Already completed', message: 'Task is already checked off.', type: 'info' });
        return;
      }

      showToast({
        title: 'Task Conquered! ⚔️',
        message: `Earned +${res?.reward?.xp || 0} XP and +${res?.reward?.gold || 0} Gold!`,
        type: 'success',
      });

      checkAndTriggerCelebrations(res, queryClient);
    },
    onError: (err) => {
      showToast({
        title: 'Completion failed',
        message: err?.response?.data?.error?.message || 'Failed to complete task.',
        type: 'error',
      });
    },
  });
}

export function useUncompleteTask() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id) => uncompleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
      showToast({ title: 'Task Restored', message: 'Task returned to active status.', type: 'info' });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showToast({ title: 'Task Deleted', message: 'Task removed from your backlog.', type: 'info' });
    },
  });
}
