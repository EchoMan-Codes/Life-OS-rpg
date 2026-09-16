import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks';
import { fetchBattleEvents } from './api';

/**
 * Hook to query recent battle activity events for authenticated users.
 *
 * @param {object} [options]
 * @param {number} [options.limit=20]
 */
export function useBattleEvents({ limit = 20 } = {}) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['battle-events', { limit }],
    queryFn: () => fetchBattleEvents({ limit }),
    enabled: isAuthenticated,
    staleTime: 1000 * 15, // 15 seconds
  });
}
