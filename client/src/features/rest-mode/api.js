import { api } from '@/lib/axios';

/**
 * Retrieves burnout rest mode suggestion if conditions are met.
 */
export async function getRestModeSuggestion() {
  const { data } = await api.get('/rest-mode/suggestion');
  return data.data;
}

/**
 * Retrieves current rest mode status.
 */
export async function getRestModeStatus() {
  const { data } = await api.get('/rest-mode/status');
  return data.data;
}

/**
 * Activates Rest Mode for a user.
 *
 * @param {object} payload
 * @param {number} [payload.durationDays=3]
 * @param {string} [payload.reason]
 */
export async function activateRestMode({ durationDays = 3, reason } = {}) {
  const { data } = await api.post('/rest-mode/activate', {
    durationDays,
    reason,
  });
  return data.data;
}

/**
 * Manually turns off Rest Mode.
 */
export async function deactivateRestMode() {
  const { data } = await api.post('/rest-mode/deactivate');
  return data.data;
}
