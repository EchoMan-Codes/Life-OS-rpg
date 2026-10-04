import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { submitFeedback, getMyFeedback } from './api';

export function useSubmitFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-feedback'] });
    },
  });
}

export function useMyFeedback() {
  return useQuery({
    queryKey: ['my-feedback'],
    queryFn: getMyFeedback,
    staleTime: 60 * 1000,
  });
}
