import { query } from '../db/pool.js';
import { getUserLocalDate } from './daily-reset.service.js';

/**
 * Validates that an integer score is between 1 and 5.
 *
 * @param {number} score
 * @param {string} fieldName
 */
function validateScore(score, fieldName) {
  if (typeof score !== 'number' || !Number.isInteger(score) || score < 1 || score > 5) {
    const err = new Error(`${fieldName} must be an integer between 1 and 5.`);
    err.status = 400;
    err.code = 'INVALID_SCORE';
    throw err;
  }
}

/**
 * Formats a reflection database row into a standardized camelCase object.
 *
 * @param {object} row
 * @returns {object}
 */
export function formatReflection(row) {
  if (!row) return null;
  const moodScore = Number(row.mood_score);
  const energyScore = Number(row.energy_score);
  const focusScore = Number(row.focus_score);
  const blendedScore = Number(((moodScore + energyScore + focusScore) / 3.0).toFixed(2));

  return {
    id: row.id,
    userId: row.user_id,
    forDate: typeof row.for_date === 'string' ? row.for_date.slice(0, 10) : new Date(row.for_date).toISOString().slice(0, 10),
    moodScore,
    energyScore,
    focusScore,
    blendedScore,
    note: row.note || null,
    createdAt: row.created_at,
  };
}

/**
 * Creates a new evening reflection for a given date.
 * Strictly wellness data only: never calls applyReward(), never awards XP/Gold/Mana,
 * never modifies HP or streaks, and never generates Battle Events.
 *
 * @param {string} userId - User UUID
 * @param {object} params
 * @param {string} [params.forDate] - 'YYYY-MM-DD'
 * @param {number} params.moodScore - 1..5
 * @param {number} params.energyScore - 1..5
 * @param {number} params.focusScore - 1..5
 * @param {string} [params.note]
 * @returns {Promise<object>}
 */
export async function createReflection(userId, { forDate, moodScore, energyScore, focusScore, note }) {
  validateScore(moodScore, 'moodScore');
  validateScore(energyScore, 'energyScore');
  validateScore(focusScore, 'focusScore');

  let dateToUse = forDate;
  if (!dateToUse) {
    const userRes = await query('SELECT timezone FROM users WHERE id = $1', [userId]);
    const tz = userRes.rows[0]?.timezone || 'UTC';
    dateToUse = getUserLocalDate(new Date(), tz);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateToUse)) {
    const err = new Error('forDate must be a valid string in YYYY-MM-DD format.');
    err.status = 400;
    err.code = 'INVALID_DATE';
    throw err;
  }

  const cleanNote = typeof note === 'string' ? note.trim() : null;

  try {
    const result = await query(
      `INSERT INTO reflections (user_id, for_date, mood_score, energy_score, focus_score, note)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, for_date::text as for_date, mood_score, energy_score, focus_score, note, created_at`,
      [userId, dateToUse, moodScore, energyScore, focusScore, cleanNote]
    );

    return formatReflection(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      const conflictErr = new Error(`A reflection already exists for date ${dateToUse}. Use PATCH /reflections/:id to update it.`);
      conflictErr.status = 409;
      conflictErr.code = 'REFLECTION_ALREADY_EXISTS';
      throw conflictErr;
    }
    throw err;
  }
}

/**
 * Updates an existing reflection. Enforces tenant isolation.
 * Strictly wellness data only: zero rewards, stat changes, or battle event side effects.
 *
 * @param {string} userId - User UUID
 * @param {string} reflectionId - Reflection UUID
 * @param {object} params
 * @param {number} [params.moodScore]
 * @param {number} [params.energyScore]
 * @param {number} [params.focusScore]
 * @param {string} [params.note]
 * @returns {Promise<object>}
 */
export async function updateReflection(userId, reflectionId, { moodScore, energyScore, focusScore, note }) {
  if (moodScore !== undefined) validateScore(moodScore, 'moodScore');
  if (energyScore !== undefined) validateScore(energyScore, 'energyScore');
  if (focusScore !== undefined) validateScore(focusScore, 'focusScore');

  // Verify existence & ownership
  const existing = await query(
    'SELECT id, user_id FROM reflections WHERE id = $1',
    [reflectionId]
  );

  if (existing.rows.length === 0 || existing.rows[0].user_id !== userId) {
    const err = new Error('Reflection not found or unauthorized.');
    err.status = 404;
    err.code = 'REFLECTION_NOT_FOUND';
    throw err;
  }

  const cleanNote = note !== undefined ? (typeof note === 'string' ? note.trim() : null) : undefined;

  const result = await query(
    `UPDATE reflections
     SET mood_score = COALESCE($1, mood_score),
         energy_score = COALESCE($2, energy_score),
         focus_score = COALESCE($3, focus_score),
         note = CASE WHEN $4::text IS NOT NULL THEN $4 ELSE note END
     WHERE id = $5 AND user_id = $6
     RETURNING id, user_id, for_date::text as for_date, mood_score, energy_score, focus_score, note, created_at`,
    [
      moodScore ?? null,
      energyScore ?? null,
      focusScore ?? null,
      cleanNote ?? null,
      reflectionId,
      userId,
    ]
  );

  return formatReflection(result.rows[0]);
}

/**
 * Retrieves reflections within a time window for the consistency heatmap.
 *
 * @param {string} userId - User UUID
 * @param {object} [options]
 * @param {string} [options.range='30d'] - e.g. '7d', '14d', '30d', '60d', '90d'
 * @returns {Promise<Array<object>>}
 */
export async function getReflections(userId, { range = '30d' } = {}) {
  let days = 30;
  const match = String(range).match(/^(\d+)d?$/);
  if (match) {
    days = Math.max(1, Math.min(365, parseInt(match[1], 10)));
  }

  // Get user local date to anchor the date filter accurately
  const userRes = await query('SELECT timezone FROM users WHERE id = $1', [userId]);
  const tz = userRes.rows[0]?.timezone || 'UTC';
  const localToday = getUserLocalDate(new Date(), tz);

  const result = await query(
    `SELECT id, user_id, for_date::text as for_date, mood_score, energy_score, focus_score, note, created_at
     FROM reflections
     WHERE user_id = $1 AND for_date >= ($2::date - ($3 || ' days')::INTERVAL)
     ORDER BY for_date ASC`,
    [userId, localToday, days]
  );

  return result.rows.map(formatReflection);
}

/**
 * Retrieves today's reflection if already submitted.
 *
 * @param {string} userId
 * @param {string} [localDate]
 * @returns {Promise<object|null>}
 */
export async function getTodayReflection(userId, localDate = null) {
  let dateToUse = localDate;
  if (!dateToUse) {
    const userRes = await query('SELECT timezone FROM users WHERE id = $1', [userId]);
    const tz = userRes.rows[0]?.timezone || 'UTC';
    dateToUse = getUserLocalDate(new Date(), tz);
  }

  const result = await query(
    `SELECT id, user_id, for_date::text as for_date, mood_score, energy_score, focus_score, note, created_at
     FROM reflections
     WHERE user_id = $1 AND for_date = $2`,
    [userId, dateToUse]
  );

  return result.rows.length > 0 ? formatReflection(result.rows[0]) : null;
}
