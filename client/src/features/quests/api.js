import { api } from '@/lib/axios';

/**
 * Fetch quests list for the authenticated user.
 *
 * @param {object} [params]
 * @param {'active' | 'completed' | 'all'} [params.status='active']
 * @returns {Promise<Array<object>>}
 */
export async function fetchQuests({ status = 'active' } = {}) {
  const response = await api.get('/quests', {
    params: { status },
  });
  return response.data.data;
}

/**
 * Fetch single quest by ID.
 *
 * @param {string} questId
 * @returns {Promise<object>}
 */
export async function fetchQuest(questId) {
  const response = await api.get(`/quests/${questId}`);
  return response.data.data;
}

/**
 * Create a new quest.
 *
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function createQuest(data) {
  const response = await api.post('/quests', data);
  return response.data.data;
}

/**
 * Update an existing quest.
 *
 * @param {string} questId
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function updateQuest(questId, data) {
  const response = await api.patch(`/quests/${questId}`, data);
  return response.data.data;
}

/**
 * Archive / soft-delete a quest.
 *
 * @param {string} questId
 * @returns {Promise<{ success: boolean }>}
 */
export async function archiveQuest(questId) {
  const response = await api.delete(`/quests/${questId}`);
  return response.data.data;
}

/**
 * Reorder active quests.
 *
 * @param {Array<string>} orderedIds
 * @returns {Promise<{ success: boolean }>}
 */
export async function reorderQuests(orderedIds) {
  const response = await api.patch('/quests/reorder', { orderedIds });
  return response.data.data;
}

/**
 * Add a checklist item / subtask to a quest.
 *
 * @param {string} questId
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function addQuestItem(questId, data) {
  const response = await api.post(`/quests/${questId}/items`, data);
  return response.data.data;
}

/**
 * Update a checklist item's title.
 *
 * @param {string} questId
 * @param {string} itemId
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function updateQuestItem(questId, itemId, data) {
  const response = await api.patch(`/quests/${questId}/items/${itemId}`, data);
  return response.data.data;
}

/**
 * Delete a checklist item.
 *
 * @param {string} questId
 * @param {string} itemId
 * @returns {Promise<{ success: boolean }>}
 */
export async function deleteQuestItem(questId, itemId) {
  const response = await api.delete(`/quests/${questId}/items/${itemId}`);
  return response.data.data;
}

/**
 * Reorder checklist items within a quest.
 *
 * @param {string} questId
 * @param {Array<string>} orderedIds
 * @returns {Promise<{ success: boolean }>}
 */
export async function reorderQuestItems(questId, orderedIds) {
  const response = await api.patch(`/quests/${questId}/items/reorder`, { orderedIds });
  return response.data.data;
}

/**
 * Complete a checklist item.
 *
 * @param {string} questId
 * @param {string} itemId
 * @returns {Promise<object>}
 */
export async function completeQuestItem(questId, itemId) {
  const response = await api.post(`/quests/${questId}/items/${itemId}/complete`);
  return response.data.data;
}

/**
 * Undo a checklist item completion.
 *
 * @param {string} questId
 * @param {string} itemId
 * @returns {Promise<object>}
 */
export async function undoQuestItem(questId, itemId) {
  const response = await api.post(`/quests/${questId}/items/${itemId}/undo`);
  return response.data.data;
}

/**
 * Explicitly complete a quest.
 *
 * @param {string} questId
 * @returns {Promise<object>}
 */
export async function completeQuest(questId) {
  const response = await api.post(`/quests/${questId}/complete`);
  return response.data.data;
}
