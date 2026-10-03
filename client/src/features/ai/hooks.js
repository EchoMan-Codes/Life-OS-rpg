import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  sendAiMessage,
  fetchAiHistory,
  confirmAiAction,
  cancelAiAction,
  fetchAiContext,
} from './api';
import { CHARACTER_QUERY_KEY } from '@/features/character/hooks';

export const AI_HISTORY_KEY = ['ai', 'history'];
export const AI_CONTEXT_KEY = ['ai', 'context'];
export const FINANCE_SUMMARY_KEY = ['finance', 'summary'];
export const STUDY_SUMMARY_KEY = ['study', 'summary'];

export function useAiHistory() {
  return useQuery({
    queryKey: AI_HISTORY_KEY,
    queryFn: fetchAiHistory,
    staleTime: 1000 * 30,
  });
}

export function useAiContext() {
  return useQuery({
    queryKey: AI_CONTEXT_KEY,
    queryFn: fetchAiContext,
    staleTime: 1000 * 60,
  });
}

export function useSendAiMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message) => sendAiMessage(message),
    onSuccess: (data) => {
      queryClient.setQueryData(AI_HISTORY_KEY, (old = []) => [
        ...old,
        data.userMessage,
        data.assistantMessage,
      ]);
      queryClient.invalidateQueries({ queryKey: AI_CONTEXT_KEY });
    },
  });
}

export function useConfirmAiAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId) => confirmAiAction(messageId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: AI_HISTORY_KEY });
      queryClient.invalidateQueries({ queryKey: AI_CONTEXT_KEY });
      queryClient.invalidateQueries({ queryKey: CHARACTER_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FINANCE_SUMMARY_KEY });
      queryClient.invalidateQueries({ queryKey: STUDY_SUMMARY_KEY });
    },
  });
}

export function useCancelAiAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId) => cancelAiAction(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AI_HISTORY_KEY });
    },
  });
}
