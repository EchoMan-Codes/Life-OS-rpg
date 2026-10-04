import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from './api';

export const NOTIFICATION_QUERY_KEYS = {
  all: ['notifications'],
  list: (params) => ['notifications', 'list', params],
  unreadCount: ['notifications', 'unreadCount'],
  preferences: ['notifications', 'preferences'],
};

export function useNotifications(params = {}) {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.list(params),
    queryFn: () => notificationApi.list(params),
    staleTime: 30 * 1000,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.unreadCount,
    queryFn: () => notificationApi.unreadCount(),
    staleTime: 15 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => notificationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.preferences,
    queryFn: () => notificationApi.getPreferences(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prefs) => notificationApi.updatePreferences(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.preferences });
    },
  });
}
