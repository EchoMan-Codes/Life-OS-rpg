import { api } from '@/lib/axios';

/**
 * Fetch reflections for current user.
 * @param {object} [params]
 * @param {string} [params.range='30d'] - e.g. '7d', '30d'
 * @returns {Promise<Array<object>>}
 */
export async function fetchReflections({ range = '30d' } = {}) {
  const response = await api.get('/reflections', { params: { range } });
  return response.data.data;
}

/**
 * Fetch today's reflection.
 * @returns {Promise<object|null>}
 */
export async function fetchTodayReflection() {
  const response = await api.get('/reflections/today');
  return response.data.data;
}

/**
 * Create a new reflection.
 * @param {object} data
 * @param {number} data.moodScore  - 1-5
 * @param {number} data.energyScore - 1-5
 * @param {number} data.focusScore  - 1-5
 * @param {string} [data.note]
 * @param {string} [data.forDate]   - YYYY-MM-DD
 * @returns {Promise<object>}
 */
export async function createReflection(data) {
  const response = await api.post('/reflections', data);
  return response.data.data;
}

/**
 * Update an existing reflection.
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function updateReflection(id, data) {
  const response = await api.patch(`/reflections/${id}`, data);
  return response.data.data;
}
