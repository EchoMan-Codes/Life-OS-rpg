import { query } from '../db/pool.js';

/**
 * Formats a rest_mode database row into camelCase.
 *
 * @param {object} [row]
 * @returns {{ isActive: boolean, activatedAt: string|null, reason: string|null, autoDeactivateAt: string|null }}
 */
export function formatRestMode(row) {
  if (!row) {
    return {
      isActive: false,
      activatedAt: null,
      reason: null,
      autoDeactivateAt: null,
    };
  }

  return {
    isActive: Boolean(row.is_active),
    activatedAt: row.activated_at ? new Date(row.activated_at).toISOString() : null,
    reason: row.reason || null,
    autoDeactivateAt: row.auto_deactivate_at ? new Date(row.auto_deactivate_at).toISOString() : null,
  };
}

/**
 * Retrieves the current rest mode status for a user.
 * Automatically deactivates expired sessions where auto_deactivate_at <= now().
 *
 * @param {string} userId - User UUID
 * @param {Date} [now=new Date()] - Optional date for testing
 * @returns {Promise<{ isActive: boolean, activatedAt: string|null, reason: string|null, autoDeactivateAt: string|null }>}
 */
export async function getRestModeStatus(userId, now = new Date()) {
  const result = await query(
    `SELECT user_id, is_active, activated_at, reason, auto_deactivate_at
     FROM rest_mode
     WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return formatRestMode(null);
  }

  const row = result.rows[0];

  // Auto-deactivate if duration expired
  if (row.is_active && row.auto_deactivate_at && new Date(row.auto_deactivate_at) <= now) {
    await query(
      `UPDATE rest_mode
       SET is_active = false
       WHERE user_id = $1`,
      [userId]
    );
    return {
      isActive: false,
      activatedAt: row.activated_at ? new Date(row.activated_at).toISOString() : null,
      reason: row.reason || null,
      autoDeactivateAt: row.auto_deactivate_at ? new Date(row.auto_deactivate_at).toISOString() : null,
    };
  }

  return formatRestMode(row);
}

/**
 * Activates Rest Mode for a user.
 *
 * @param {string} userId - User UUID
 * @param {object} params
 * @param {string} [params.reason] - Optional reason (max 500 chars)
 * @param {number} [params.durationDays=3] - Integer duration strictly between 1 and 14
 * @param {Date} [now=new Date()] - Optional date for testing
 * @returns {Promise<object>}
 */
export async function activateRestMode(userId, { reason, durationDays = 3 } = {}, now = new Date()) {
  if (typeof durationDays !== 'number' || !Number.isInteger(durationDays) || durationDays < 1 || durationDays > 14) {
    const err = new Error('durationDays must be an integer strictly between 1 and 14 days.');
    err.status = 400;
    err.code = 'INVALID_DURATION';
    throw err;
  }

  const cleanReason = typeof reason === 'string' && reason.trim() ? reason.trim().slice(0, 500) : 'Rest and recovery';
  const autoDeactivateAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const result = await query(
    `INSERT INTO rest_mode (user_id, is_active, activated_at, reason, auto_deactivate_at)
     VALUES ($1, true, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE
     SET is_active = true,
         activated_at = EXCLUDED.activated_at,
         reason = EXCLUDED.reason,
         auto_deactivate_at = EXCLUDED.auto_deactivate_at
     RETURNING user_id, is_active, activated_at, reason, auto_deactivate_at`,
    [userId, now.toISOString(), cleanReason, autoDeactivateAt.toISOString()]
  );

  return formatRestMode(result.rows[0]);
}

/**
 * Manually deactivates Rest Mode for a user.
 *
 * @param {string} userId - User UUID
 * @returns {Promise<object>}
 */
export async function deactivateRestMode(userId) {
  const result = await query(
    `UPDATE rest_mode
     SET is_active = false,
         auto_deactivate_at = null
     WHERE user_id = $1
     RETURNING user_id, is_active, activated_at, reason, auto_deactivate_at`,
    [userId]
  );

  return result.rows.length > 0
    ? formatRestMode(result.rows[0])
    : { isActive: false, activatedAt: null, reason: null, autoDeactivateAt: null };
}
