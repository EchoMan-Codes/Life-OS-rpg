import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchStudyLogs, fetchStudySummary, logStudySession } from './api';
import { CHARACTER_QUERY_KEY } from '@/features/character/hooks';

export const STUDY_LOGS_KEY = ['study', 'logs'];
export const STUDY_SUMMARY_KEY = ['study', 'summary'];

export function useStudyLogs(params) {
  return useQuery({
    queryKey: [...STUDY_LOGS_KEY, params],
    queryFn: () => fetchStudyLogs(params),
    staleTime: 1000 * 30,
  });
}

export function useStudySummary() {
  return useQuery({
    queryKey: STUDY_SUMMARY_KEY,
    queryFn: fetchStudySummary,
    staleTime: 1000 * 30,
  });
}

export function useLogStudy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => logStudySession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STUDY_LOGS_KEY });
      queryClient.invalidateQueries({ queryKey: STUDY_SUMMARY_KEY });
      queryClient.invalidateQueries({ queryKey: CHARACTER_QUERY_KEY });
    },
  });
}
