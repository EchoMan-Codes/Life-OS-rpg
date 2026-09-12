import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { setAccessToken, getAccessToken } from '@/lib/axios';
import {
  loginUser,
  registerUser,
  refreshToken,
  logoutUser,
  fetchCurrentUser,
} from './api';

export const ME_QUERY_KEY = ['me'];

/**
 * Hook to retrieve the current authenticated user profile.
 */
export function useMe() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => {
      // If we don't have an in-memory access token yet, attempt silent refresh first
      if (!getAccessToken()) {
        try {
          const refreshed = await refreshToken();
          setAccessToken(refreshed.accessToken);
          queryClient.invalidateQueries({ queryKey: ['character'] });
          queryClient.invalidateQueries({ queryKey: ['habits'] });
          queryClient.invalidateQueries({ queryKey: ['dailies'] });
          return refreshed.user;
        } catch {
          return null;
        }
      }
      const data = await fetchCurrentUser();
      return data.user;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

/**
 * Mutation hook for logging in.
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      queryClient.setQueryData(ME_QUERY_KEY, data.user);
      queryClient.invalidateQueries({ queryKey: ['character'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['dailies'] });
    },
  });
}

/**
 * Mutation hook for registering.
 */
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      queryClient.setQueryData(ME_QUERY_KEY, data.user);
      queryClient.invalidateQueries({ queryKey: ['character'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['dailies'] });
    },
  });
}

/**
 * Mutation hook for logging out.
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      setAccessToken(null);
      queryClient.setQueryData(ME_QUERY_KEY, null);
      queryClient.clear();
    },
    onError: () => {
      // Even if network fails, clear local credentials
      setAccessToken(null);
      queryClient.setQueryData(ME_QUERY_KEY, null);
    },
  });
}

/**
 * Convenience auth hook providing state and action triggers.
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading, error } = useMe();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const handleSessionExpired = () => {
      setAccessToken(null);
      queryClient.setQueryData(ME_QUERY_KEY, null);
      setSessionExpired(true);
    };

    window.addEventListener('lifeos:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('lifeos:session-expired', handleSessionExpired);
    };
  }, [queryClient]);

  return {
    user: user || null,
    isAuthenticated: Boolean(user),
    isLoading,
    error,
    sessionExpired,
    resetSessionExpired: () => setSessionExpired(false),
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  };
}
