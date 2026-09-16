import { api } from '@/lib/axios';

/**
 * Fetch recent battle activity events for the authenticated hero.
 *
 * @param {object} [params]
 * @param {number} [params.limit=20] - Maximum number of events (1-100)
 * @returns {Promise<Array<object>>}
 */
export async function fetchBattleEvents({ limit = 20 } = {}) {
  const response = await api.get('/battle-events', {
    params: { limit },
  });
  return response.data?.data || [];
}
