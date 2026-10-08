import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { setAccessToken, getAccessToken, setRefreshToken } from '@/lib/axios';
import {
  loginUser,
  registerUser,
  refreshToken,
  logoutUser,
  fetchCurrentUser,
  updateUserProfile,
  forgotPassword,
  resetPassword,
  resetUserAccount,
  resetSection,
  deleteUserAccount,
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
          if (refreshed.refreshToken) {
            setRefreshToken(refreshed.refreshToken);
          }
          try {
            localStorage.setItem('lifeos_onboarding_completed', 'true');
          } catch {}
          queryClient.invalidateQueries({ queryKey: ['character'] });
          queryClient.invalidateQueries({ queryKey: ['habits'] });
          queryClient.invalidateQueries({ queryKey: ['dailies'] });
          queryClient.invalidateQueries({ queryKey: ['quests'] });
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
      if (data.refreshToken) {
        setRefreshToken(data.refreshToken);
      }
      try {
        localStorage.setItem('lifeos_onboarding_completed', 'true');
      } catch {}
      queryClient.setQueryData(ME_QUERY_KEY, data.user);
      queryClient.invalidateQueries({ queryKey: ['character'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['dailies'] });
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: ['shop-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
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
      if (data.refreshToken) {
        setRefreshToken(data.refreshToken);
      }
      try {
        localStorage.setItem('lifeos_onboarding_completed', 'true');
      } catch {}
      queryClient.setQueryData(ME_QUERY_KEY, data.user);
      queryClient.invalidateQueries({ queryKey: ['character'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['dailies'] });
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: ['shop-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

/**
 * Mutation hook for updating profile.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(ME_QUERY_KEY, data.user);
      queryClient.invalidateQueries({ queryKey: ['character'] });
    },
  });
}

/**
 * Mutation hook for requesting password reset.
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: forgotPassword,
  });
}

/**
 * Mutation hook for resetting password.
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: resetPassword,
  });
}

/**
 * Mutation hook for resetting account progress back to Level 1.
 */
export function useResetAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resetUserAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['dailies'] });
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

/**
 * Mutation hook for granular section resets.
 */
export function useResetSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resetSection,
    onSuccess: (_, variables) => {
      const target = variables?.target;
      if (target === 'progression' || target === 'character') {
        queryClient.invalidateQueries({ queryKey: ['character'] });
      } else if (target === 'habits') {
        queryClient.invalidateQueries({ queryKey: ['habits'] });
      } else if (target === 'dailies') {
        queryClient.invalidateQueries({ queryKey: ['dailies'] });
      } else if (target === 'quests') {
        queryClient.invalidateQueries({ queryKey: ['quests'] });
      } else if (target === 'inventory') {
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        queryClient.invalidateQueries({ queryKey: ['character'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['character'] });
        queryClient.invalidateQueries({ queryKey: ['habits'] });
        queryClient.invalidateQueries({ queryKey: ['dailies'] });
        queryClient.invalidateQueries({ queryKey: ['quests'] });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
      }
    },
  });
}

/**
 * Mutation hook for deleting account.
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUserAccount,
    onSuccess: () => {
      setAccessToken(null);
      queryClient.setQueryData(ME_QUERY_KEY, null);
      queryClient.clear();
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
      setRefreshToken(null);
      queryClient.setQueryData(ME_QUERY_KEY, null);
      queryClient.clear();
    },
    onError: () => {
      // Even if network fails, clear local credentials
      setAccessToken(null);
      setRefreshToken(null);
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
  const updateProfileMutation = useUpdateProfile();
  const resetAccountMutation = useResetAccount();
  const resetSectionMutation = useResetSection();
  const deleteAccountMutation = useDeleteAccount();
  const [sessionExpired, setSessionExpired] = useState(false);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState('');

  useEffect(() => {
    const handleSessionExpired = (e) => {
      setAccessToken(null);
      setRefreshToken(null);
      queryClient.setQueryData(ME_QUERY_KEY, null);
      setSessionExpired(true);
      setSessionExpiredMessage(
        e.detail?.message ||
        'Your session has expired. We preserved your form drafts. Please sign in to resume.'
      );
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
    sessionExpiredMessage,
    resetSessionExpired: () => {
      setSessionExpired(false);
      setSessionExpiredMessage('');
    },
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    resetAccount: resetAccountMutation.mutateAsync,
    isResettingAccount: resetAccountMutation.isPending,
    resetSection: resetSectionMutation.mutateAsync,
    isResettingSection: resetSectionMutation.isPending,
    deleteAccount: deleteAccountMutation.mutateAsync,
    isDeletingAccount: deleteAccountMutation.isPending,
  };
}
