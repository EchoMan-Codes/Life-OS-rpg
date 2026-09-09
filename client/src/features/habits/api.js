import { api } from '@/lib/axios';

/**
 * Fetch list of habits for current user.
 *
 * @param {object} [params]
 * @param {boolean} [params.includeArchived=false]
 * @returns {Promise<Array<object>>}
 */
export async function fetchHabits({ includeArchived = false } = {}) {
  const response = await api.get('/habits', {
    params: { includeArchived: includeArchived ? 'true' : undefined },
  });
  return response.data.data;
}

/**
 * Create a new habit.
 *
 * @param {object} data
 * @param {string} data.title
 * @param {string} [data.description]
 * @param {'positive'|'negative'|'both'} [data.direction]
 * @param {'trivial'|'easy'|'medium'|'hard'} [data.difficulty]
 * @returns {Promise<object>}
 */
export async function createHabit(data) {
  const response = await api.post('/habits', data);
  return response.data.data;
}

/**
 * Update an existing habit.
 *
 * @param {string} habitId
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function updateHabit(habitId, data) {
  const response = await api.patch(`/habits/${habitId}`, data);
  return response.data.data;
}

/**
 * Archive / delete a habit.
 *
 * @param {string} habitId
 * @returns {Promise<{ id: string, archived: boolean }>}
 */
export async function archiveHabit(habitId) {
  const response = await api.delete(`/habits/${habitId}`);
  return response.data.data;
}

/**
 * Score a habit atomically.
 *
 * @param {string} habitId
 * @param {'positive'|'negative'} direction
 * @returns {Promise<{ habit: object, character: object, reward: object }>}
 */
export async function scoreHabit(habitId, direction) {
  const response = await api.post(`/habits/${habitId}/score`, { direction });
  return response.data.data;
}
