import { api } from '@/lib/axios';

/**
 * Start a new focus session.
 */
export async function startFocusSession(data) {
  const response = await api.post('/focus/start', {
    plannedDurationSeconds: data.plannedDurationSeconds,
    ambientSound: data.ambientSound || 'silence',
    taskId: data.taskId || null,
    taskType: data.taskType || 'task',
    taskTitle: data.taskTitle || null,
    sessionType: data.sessionType || 'focus',
  });
  return response.data?.data;
}

/**
 * Get current active focus session.
 */
export async function fetchCurrentFocus() {
  const response = await api.get('/focus/current');
  return response.data?.data || null;
}

/**
 * Pause active focus session.
 */
export async function pauseFocusSession(id) {
  const response = await api.post(`/focus/${id}/pause`);
  return response.data?.data;
}

/**
 * Resume paused focus session.
 */
export async function resumeFocusSession(id) {
  const response = await api.post(`/focus/${id}/resume`);
  return response.data?.data;
}

/**
 * Fetch focus session history.
 */
export async function fetchFocusHistory({ limit = 20 } = {}) {
  const response = await api.get('/focus/history', { params: { limit } });
  return response.data?.data || [];
}

/**
 * Fetch focus analytics summary.
 */
export async function fetchFocusSummary() {
  const response = await api.get('/focus/summary');
  return response.data?.data || {};
}

/**
 * Complete a focus session.
 */
export async function completeFocusSession(id) {
  const response = await api.post(`/focus/${id}/complete`);
  return response.data?.data;
}

/**
 * Abandon a focus session.
 */
export async function abandonFocusSession(id) {
  const response = await api.post(`/focus/${id}/abandon`);
  return response.data?.data;
}
