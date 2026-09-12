import { api } from '@/lib/axios';

/**
 * Fetch list of dailies for the current authenticated user.
 *
 * @param {object} [params]
 * @param {boolean} [params.includeArchived=false]
 * @returns {Promise<Array<object>>}
 */
export async function fetchDailies({ includeArchived = false } = {}) {
  const response = await api.get('/dailies', {
    params: { includeArchived: includeArchived ? 'true' : undefined },
  });
  return response.data.data;
}

/**
 * Create a new daily ritual.
 *
 * @param {object} data
 * @param {string} data.title
 * @param {string} [data.description]
 * @param {'trivial'|'easy'|'medium'|'hard'} [data.difficulty]
 * @param {number[]} [data.activeDays]
 * @returns {Promise<object>}
 */
export async function createDaily(data) {
  const response = await api.post('/dailies', data);
  return response.data.data;
}

/**
 * Update an existing daily ritual.
 *
 * @param {string} dailyId
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function updateDaily(dailyId, data) {
  const response = await api.patch(`/dailies/${dailyId}`, data);
  return response.data.data;
}

/**
 * Archive / soft-delete a daily ritual.
 *
 * @param {string} dailyId
 * @returns {Promise<{ id: string, archived: boolean }>}
 */
export async function archiveDaily(dailyId) {
  const response = await api.delete(`/dailies/${dailyId}`);
  return response.data.data;
}

/**
 * Complete a daily ritual for today.
 *
 * @param {string} dailyId
 * @returns {Promise<{ daily: object, character: object, reward: object }>}
 */
export async function completeDaily(dailyId) {
  const response = await api.post(`/dailies/${dailyId}/complete`);
  return response.data.data;
}

/**
 * Undo today's completion of a daily ritual.
 *
 * @param {string} dailyId
 * @returns {Promise<{ daily: object, character: object, reversedReward: object }>}
 */
export async function undoDaily(dailyId) {
  const response = await api.post(`/dailies/${dailyId}/undo`);
  return response.data.data;
}
