import { query } from '../db/pool.js';
import { getUserLocalDate } from './daily-reset.service.js';
import { getRestModeStatus } from './rest-mode.service.js';

/**
 * Checks whether a user should be flagged with a suggested Rest Mode.
 *
 * Conditions:
 * (a) Calculate the average of all `mood_score` and `energy_score` values across
 *     the last 3 calendar days with reflections. Trigger when the resulting average is <= 4.0.
 * (b) 2+ hard dailies were missed (streak broken, no shield) in the last 3 calendar days.
 *
 * If the user is already in active Rest Mode, no new suggestion is produced.
 *
 * @param {string} userId - User UUID
 * @param {Date} [now=new Date()] - Optional date for testing
 * @returns {Promise<{ suggested: boolean, reason: string|null, isActive: boolean }>}
 */
export async function checkBurnoutSuggestion(userId, now = new Date()) {
  // 1. Check if user is already resting
  const restStatus = await getRestModeStatus(userId, now);
  if (restStatus.isActive) {
    return {
      suggested: false,
      reason: null,
      isActive: true,
    };
  }

  // 2. Fetch user's IANA timezone
  const userRes = await query('SELECT timezone FROM users WHERE id = $1', [userId]);
  const tz = userRes.rows[0]?.timezone || 'UTC';

  // --------------------------------------------------------------------------
  // Condition (a): Average of (mood_score + energy_score) across the last 3
  // calendar days with reflections is <= 4.0 (out of 10)
  // --------------------------------------------------------------------------
  const reflectionsRes = await query(
    `SELECT mood_score, energy_score, for_date
     FROM reflections
     WHERE user_id = $1
     ORDER BY for_date DESC
     LIMIT 3`,
    [userId]
  );

  if (reflectionsRes.rows.length >= 3) {
    const totalMoodEnergy = reflectionsRes.rows.reduce(
      (sum, row) => sum + Number(row.mood_score) + Number(row.energy_score),
      0
    );
    const avgMoodEnergy = totalMoodEnergy / reflectionsRes.rows.length;

    if (avgMoodEnergy <= 4.0) {
      return {
        suggested: true,
        reason: 'Consistently low mood and energy reported over the last 3 days with reflections.',
        isActive: false,
      };
    }
  }

  // --------------------------------------------------------------------------
  // Condition (b): 2+ hard dailies missed (streak broken, no shield) in the
  // last 3 calendar days
  // --------------------------------------------------------------------------
  const todayStr = getUserLocalDate(now, tz);
  const [year, month, day] = todayStr.split('-').map(Number);
  const todayUtcNoon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  // Determine the 3 calendar dates preceding today: today - 1, today - 2, today - 3
  const pastDates = [];
  for (let i = 1; i <= 3; i++) {
    const pastDateNoon = new Date(todayUtcNoon.getTime() - i * 24 * 60 * 60 * 1000);
    pastDates.push({
      dateStr: pastDateNoon.toISOString().slice(0, 10),
      weekday: pastDateNoon.getUTCDay(), // 0 = Sun..6 = Sat
    });
  }

  let missedHardDailiesCount = 0;

  for (const { dateStr, weekday } of pastDates) {
    // Find hard dailies that were active on that date
    const hardDailies = await query(
      `SELECT id, active_days
       FROM dailies
       WHERE user_id = $1
         AND difficulty = 'hard'
         AND (archived_at IS NULL OR archived_at > $2::date)
         AND created_at::date <= $2::date`,
      [userId, dateStr]
    );

    for (const daily of hardDailies.rows) {
      const activeDays = daily.active_days || [0, 1, 2, 3, 4, 5, 6];
      if (activeDays.includes(weekday)) {
        // Daily was scheduled for this date. Check if completed or shielded.
        const compRes = await query(
          `SELECT id, used_shield
           FROM daily_completions
           WHERE daily_id = $1 AND for_date = $2`,
          [daily.id, dateStr]
        );

        if (compRes.rows.length === 0) {
          // No completion record at all: streak was broken and no shield was used
          missedHardDailiesCount++;
        }
      }
    }
  }

  if (missedHardDailiesCount >= 2) {
    return {
      suggested: true,
      reason: 'Multiple hard dailies missed in the past 3 days without a streak shield.',
      isActive: false,
    };
  }

  return {
    suggested: false,
    reason: null,
    isActive: false,
  };
}

/**
 * Cron helper to auto-deactivate expired rest modes.
 *
 * @param {import('pg').Pool | import('pg').PoolClient} poolOrClient
 * @param {Date} [now=new Date()]
 * @returns {Promise<number>} Number of deactivated rows
 */
export async function autoDeactivateExpiredRestModes(poolOrClient, now = new Date()) {
  const result = await poolOrClient.query(
    `UPDATE rest_mode
     SET is_active = false
     WHERE is_active = true
       AND auto_deactivate_at IS NOT NULL
       AND auto_deactivate_at <= $1`,
    [now.toISOString()]
  );

  return result.rowCount || 0;
}
