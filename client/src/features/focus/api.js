import { api } from '@/lib/axios';

/**
 * Start a new focus session.
 * @param {object} data
 * @param {number} data.plannedDurationSeconds - 900 (15m), 1500 (25m), or 3000 (50m)
 * @param {'rain'|'lofi'|'silence'} [data.ambientSound='silence']
 * @returns {Promise<object>}
 */
export async function startFocusSession(data) {
  const response = await api.post('/focus/start', {
    plannedDurationSeconds: data.plannedDurationSeconds,
    ambientSound: data.ambientSound || 'silence',
  });
  return response.data?.data;
}

/**
 * Get current active focus session.
 * @returns {Promise<object|null>}
 */
export async function fetchCurrentFocus() {
  const response = await api.get('/focus/current');
  return response.data?.data || null;
}

/**
 * Fetch focus session history.
 * @param {object} [params]
 * @param {number} [params.limit=20]
 * @returns {Promise<Array<object>>}
 */
export async function fetchFocusHistory({ limit = 20 } = {}) {
  const response = await api.get('/focus/history', { params: { limit } });
  return response.data?.data || [];
}

/**
 * Complete a focus session.
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function completeFocusSession(id) {
  const response = await api.post(`/focus/${id}/complete`);
  return response.data?.data;
}

/**
 * Abandon a focus session.
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function abandonFocusSession(id) {
  const response = await api.post(`/focus/${id}/abandon`);
  return response.data?.data;
}
