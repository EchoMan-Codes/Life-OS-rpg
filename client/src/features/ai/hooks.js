import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiApi } from './api';

export function useAiChat() {
  return useMutation({
    mutationFn: ({ message, history }) => aiApi.chat({ message, history }),
  });
}

export function useAiExecuteAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ actionType, payload }) => aiApi.executeAction({ actionType, payload }),
    onSuccess: () => {
      // Invalidate all active state so dashboard, dailies, habits, quests refresh
      queryClient.invalidateQueries({ queryKey: ['dailies'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useAiContext() {
  return useQuery({
    queryKey: ['ai', 'context'],
    queryFn: () => aiApi.getContext(),
    staleTime: 60 * 1000,
  });
}
