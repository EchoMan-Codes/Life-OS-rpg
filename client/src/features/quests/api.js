import { api } from '@/lib/axios';

/**
 * Fetch quests list for the authenticated user.
 *
 * @param {object} [params]
 * @param {'active' | 'completed' | 'all'} [params.status='active']
 * @returns {Promise<Array<object>>}
 */
export async function fetchQuests({ status = 'active', includeArchived = false } = {}) {
  const response = await api.get('/quests', {
    params: { status, includeArchived },
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
 * Permanently delete a quest.
 *
 * @param {string} questId
 * @returns {Promise<{ id: string, deleted: boolean }>}
 */
export async function deleteQuestPermanently(questId) {
  const response = await api.delete(`/quests/${questId}`, {
    params: { permanent: 'true' },
  });
  return response.data.data;
}

/**
 * Restore an archived quest.
 *
 * @param {string} questId
 * @returns {Promise<object>}
 */
export async function restoreQuest(questId) {
  const response = await api.post(`/quests/${questId}/restore`);
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

/**
 * Record quantitative/count-based progress on a quest.
 *
 * @param {string} questId
 * @param {object} params
 * @param {number} [params.delta=1]
 * @param {number} [params.increment]
 * @param {number} [params.currentCount]
 * @param {string} [params.idempotencyKey]
 * @param {string} [params.eventId]
 * @param {string} [params.notes]
 * @returns {Promise<object>}
 */
export async function recordQuestProgress(questId, params = {}) {
  const response = await api.post(`/quests/${questId}/progress`, params);
  return response.data.data;
}

/**
 * Extend a quest's deadline with a reason, restoring it to active status.
 *
 * @param {string} questId
 * @param {object} params
 * @param {string} params.newDueDate
 * @param {string} [params.reason]
 * @returns {Promise<object>}
 */
export async function extendQuest(questId, { newDueDate, reason } = {}) {
  const response = await api.post(`/quests/${questId}/extend`, { newDueDate, reason });
  return response.data.data;
}

/**
 * Cancel an active quest without granting completion rewards.
 *
 * @param {string} questId
 * @returns {Promise<object>}
 */
export async function cancelQuest(questId) {
  const response = await api.post(`/quests/${questId}/cancel`);
  return response.data.data;
}

/**
 * Fetch AI quest suggestions based on timeframe, goal, and category.
 *
 * @param {object} params
 * @param {'weekly' | 'monthly' | 'yearly' | 'custom'} [params.timeframe='weekly']
 * @param {string} [params.goal='']
 * @param {string} [params.category='learning']
 * @returns {Promise<object>}
 */
export async function fetchQuestSuggestions({ timeframe = 'weekly', goal = '', category = 'learning' } = {}) {
  const response = await api.post('/quests/suggestions', { timeframe, goal, category });
  return response.data.data;
}
