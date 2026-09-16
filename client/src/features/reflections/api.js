import { api } from '@/lib/axios';

/**
 * Creates a new evening reflection.
 *
 * @param {object} payload
 * @param {number} payload.moodScore - 1..5
 * @param {number} payload.energyScore - 1..5
 * @param {number} payload.focusScore - 1..5
 * @param {string} [payload.forDate] - 'YYYY-MM-DD'
 * @param {string} [payload.note]
 */
export async function createReflection({ moodScore, energyScore, focusScore, forDate, note }) {
  const { data } = await api.post('/reflections', {
    moodScore,
    energyScore,
    focusScore,
    forDate,
    note,
  });
  return data.data;
}

/**
 * Updates an existing reflection.
 *
 * @param {string} id - Reflection UUID
 * @param {object} payload
 */
export async function updateReflection(id, payload) {
  const { data } = await api.patch(`/reflections/${id}`, payload);
  return data.data;
}

/**
 * Retrieves reflections within a date range for consistency heatmap.
 *
 * @param {string} [range='30d']
 */
export async function getReflections(range = '30d') {
  const { data } = await api.get('/reflections', {
    params: { range },
  });
  return data.data;
}

/**
 * Retrieves today's reflection if already submitted.
 */
export async function getTodayReflection() {
  const { data } = await api.get('/reflections/today');
  return data.data;
}
