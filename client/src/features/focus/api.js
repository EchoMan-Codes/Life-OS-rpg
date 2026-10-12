import { api } from '@/lib/axios';

/**
 * Fetch platform capabilities and permissions.
 */
export async function fetchFocusCapabilities(platform = 'web') {
  const response = await api.get('/focus/capabilities', { params: { platform } });
  return response.data?.data;
}

/**
 * Fetch distraction shield profiles.
 */
export async function fetchFocusProfiles() {
  const response = await api.get('/focus/profiles');
  return response.data?.data || [];
}

/**
 * Create a new distraction shield profile.
 */
export async function createFocusProfile(data) {
  const response = await api.post('/focus/profiles', data);
  return response.data?.data;
}

/**
 * Update an existing distraction shield profile.
 */
export async function updateFocusProfile(id, data) {
  const response = await api.put(`/focus/profiles/${id}`, data);
  return response.data?.data;
}

/**
 * Delete a distraction shield profile.
 */
export async function deleteFocusProfile(id) {
  const response = await api.delete(`/focus/profiles/${id}`);
  return response.data?.data;
}

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
    commitmentLevel: data.commitmentLevel || 1,
    shieldProfileId: data.shieldProfileId || null,
    goalDescription: data.goalDescription || null,
    linkedEntityType: data.linkedEntityType || 'none',
    linkedEntityId: data.linkedEntityId || null,
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
 * Pause active focus session (Level 1 only).
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
 * Record a lifecycle or interruption event in the session audit trail.
 */
export async function recordFocusEvent(id, { eventType, metadata = {}, clientTimestamp = null }) {
  const response = await api.post(`/focus/${id}/event`, {
    eventType,
    metadata,
    clientTimestamp: clientTimestamp || new Date().toISOString(),
  });
  return response.data?.data;
}

/**
 * Hold-to-Confirm deliberate early exit.
 */
export async function earlyExitFocusSession(id, data = {}) {
  const response = await api.post(`/focus/${id}/early-exit`, data);
  return response.data?.data;
}

/**
 * Immediate Emergency Exit pathway.
 */
export async function emergencyExitFocusSession(id, data = {}) {
  const response = await api.post(`/focus/${id}/emergency-exit`, data);
  return response.data?.data;
}

/**
 * Fetch focus session history.
 */
export async function fetchFocusHistory({ limit = 20, status = null } = {}) {
  const response = await api.get('/focus/history', { params: { limit, status } });
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
 * Fetch detailed focus analytics.
 */
export async function fetchFocusAnalytics() {
  const response = await api.get('/focus/analytics');
  return response.data?.data || {};
}

/**
 * Complete a focus session with server-authoritative validation.
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
