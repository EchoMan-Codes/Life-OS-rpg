import { api } from '@/lib/axios';

/**
 * Fetch current character stats from the server.
 *
 * @returns {Promise<object>} Canonical character data
 */
export async function fetchCharacter() {
  const response = await api.get('/character');
  return response.data.data;
}

/**
 * Allocate stat points to an attribute.
 *
 * @param {object} params
 * @param {string} params.attribute - Attribute name (strength, intelligence, vitality, willpower, perception)
 * @param {number} [params.points=1] - Number of points to allocate
 * @returns {Promise<object>} Updated character data
 */
export async function allocateAttribute({ attribute, points = 1 }) {
  const response = await api.post('/character/allocate', { attribute, points });
  return response.data.data;
}
