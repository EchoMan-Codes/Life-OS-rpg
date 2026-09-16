import { api } from '@/lib/axios';

/**
 * Start a new focus session.
 * @param {object} params
 * @param {number} params.plannedDurationSeconds - 900, 1500, or 3000
 * @param {string} [params.ambientSound='silence'] - 'rain' | 'lofi' | 'silence'
 */
export async function startFocusSession({ plannedDurationSeconds, ambientSound = 'silence' }) {
  const { data } = await api.post('/focus/start', {
    plannedDurationSeconds,
    ambientSound,
  });
  return data.data;
}

/**
 * Complete an active focus session.
 * @param {string} sessionId
 */
export async function completeFocusSession(sessionId) {
  const { data } = await api.post(`/focus/${sessionId}/complete`);
  return data.data;
}

/**
 * Abandon an active focus session without penalty.
 * @param {string} sessionId
 */
export async function abandonFocusSession(sessionId) {
  const { data } = await api.post(`/focus/${sessionId}/abandon`);
  return data.data;
}

/**
 * Get currently active focus session if one exists.
 */
export async function getCurrentFocusSession() {
  const { data } = await api.get('/focus/current');
  return data.data;
}

/**
 * List past focus session history.
 */
export async function listFocusHistory(limit = 20) {
  const { data } = await api.get('/focus/history', {
    params: { limit },
  });
  return data.data;
}
