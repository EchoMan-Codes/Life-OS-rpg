import cron from 'node-cron';

import { withTransaction, query } from '../db/pool.js';
import { applyReward } from './progression.service.js';
import { hpPenaltyFor } from './reward-table.js';
import { isValidTimezone } from './auth.service.js';

/**
 * Returns the current date in 'YYYY-MM-DD' format for a given IANA timezone.
 * Handles DST transitions seamlessly via Intl.DateTimeFormat.
 *
 * @param {Date} [date=new Date()]
 * @param {string} [timeZone='UTC']
 * @returns {string} 'YYYY-MM-DD'
 */
export function getUserLocalDate(date = new Date(), timeZone = 'UTC') {
  const safeTimezone = isValidTimezone(timeZone) ? timeZone : 'UTC';
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: safeTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/**
 * Calculates yesterday's calendar date and weekday in the user's timezone.
 *
 * @param {Date} [date=new Date()]
 * @param {string} [timeZone='UTC']
 * @returns {{ yesterdayDate: string, yesterdayWeekday: number }}
 */
export function getUserLocalYesterday(date = new Date(), timeZone = 'UTC') {
  const todayStr = getUserLocalDate(date, timeZone);
  const [year, month, day] = todayStr.split('-').map(Number);

  // Anchor at noon UTC to prevent daylight-saving boundary shifts from altering the date
  const todayUtcNoon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const yesterdayUtcNoon = new Date(todayUtcNoon.getTime() - 24 * 60 * 60 * 1000);

  const yesterdayDate = yesterdayUtcNoon.toISOString().slice(0, 10);
  const yesterdayWeekday = yesterdayUtcNoon.getUTCDay(); // 0 = Sunday..6 = Saturday

  return { yesterdayDate, yesterdayWeekday };
}

/**
 * Checks and processes midnight reset for a specific user.
 * Fully transactional, serialized with SELECT ... FOR UPDATE row locking,
 * and 100% idempotent. If dailies were already reset for the user's local today,
 * this function immediately performs a safe no-op.
 *
 * @param {import('pg').Pool | import('pg').PoolClient} poolOrClient
 * @param {string} userId - User UUID
 * @param {string} [timeZone] - User IANA timezone (if not provided, queries users table)
 * @param {Date} [now=new Date()] - Optional date override for testing
 * @returns {Promise<{ resetPerformed: boolean, dailiesReset: number, hpPenalty: number }>}
 */
export async function checkAndProcessUserReset(poolOrClient, userId, timeZone = null, now = new Date()) {
  return withTransaction(async (client) => {
    // 1. Resolve user timezone
    let tz = timeZone;
    if (!tz) {
      const uRes = await client.query('SELECT timezone FROM users WHERE id = $1', [userId]);
      tz = uRes.rows[0]?.timezone || 'UTC';
    }

    const localToday = getUserLocalDate(now, tz);
    const { yesterdayDate, yesterdayWeekday } = getUserLocalYesterday(now, tz);

    // 1b. Check Rest Mode status for this user with row locking
    let isResting = false;
    const restRes = await client.query(
      `SELECT is_active, auto_deactivate_at
       FROM rest_mode
       WHERE user_id = $1
       FOR UPDATE`,
      [userId]
    );

    if (restRes.rows.length > 0 && restRes.rows[0].is_active) {
      const { auto_deactivate_at } = restRes.rows[0];
      if (auto_deactivate_at && new Date(auto_deactivate_at) <= now) {
        // Expired rest mode: automatically deactivate
        await client.query(
          `UPDATE rest_mode
           SET is_active = false
           WHERE user_id = $1`,
          [userId]
        );
      } else {
        isResting = true;
      }
    }

    // 2. Lock all active dailies for this user to ensure isolation against concurrent cron/API resets
    const dailyRes = await client.query(
      `SELECT id, user_id, title, difficulty, active_days, streak_current, streak_best,
              streak_shield_charges, is_complete_today, last_reset_date::text as last_reset_date
       FROM dailies
       WHERE user_id = $1 AND archived_at IS NULL
       FOR UPDATE`,
      [userId]
    );

    if (dailyRes.rows.length === 0) {
      return { resetPerformed: false, dailiesReset: 0, hpPenalty: 0 };
    }

    // 3. Identify dailies that have not yet been reset for localToday
    const dueDailies = dailyRes.rows.filter(
      (d) => !d.last_reset_date || d.last_reset_date.slice(0, 10) < localToday
    );

    if (dueDailies.length === 0) {
      // Already reset for today: idempotent no-op
      return { resetPerformed: false, dailiesReset: 0, hpPenalty: 0 };
    }

    let totalHpLoss = 0;

    // 4. Process streak advancement, shield consumption, or HP penalties for each due daily
    for (const daily of dueDailies) {
      const activeDays = daily.active_days || [0, 1, 2, 3, 4, 5, 6];
      const wasActiveYesterday = activeDays.includes(yesterdayWeekday);

      let newStreak = daily.streak_current;
      let newBestStreak = daily.streak_best;
      let newShieldCharges = daily.streak_shield_charges;

      if (wasActiveYesterday) {
        if (daily.is_complete_today) {
          // Completed yesterday: increment streak and update best
          newStreak = daily.streak_current + 1;
          newBestStreak = Math.max(daily.streak_best, newStreak);
        } else if (daily.streak_shield_charges > 0) {
          // Missed yesterday but has streak shield: consume 1 charge, preserve streak, no HP penalty
          newShieldCharges = daily.streak_shield_charges - 1;
          // Record shield consumption for yesterday in daily_completions
          await client.query(
            `INSERT INTO daily_completions (daily_id, user_id, for_date, used_shield)
             VALUES ($1, $2, $3, true)
             ON CONFLICT (daily_id, for_date) DO UPDATE SET used_shield = true`,
            [daily.id, userId, yesterdayDate]
          );
        } else {
          // Missed yesterday with no shield: reset streak to 0 as normal
          newStreak = 0;
          // If Rest Mode is active: skip HP penalty entirely (0 damage)
          if (!isResting) {
            totalHpLoss += hpPenaltyFor(daily.difficulty);
          }
        }
      }

      // 5. Update daily to fresh uncompleted state for localToday
      await client.query(
        `UPDATE dailies
         SET streak_current = $1,
             streak_best = $2,
             streak_shield_charges = $3,
             is_complete_today = false,
             last_reset_date = $4
         WHERE id = $5`,
        [newStreak, newBestStreak, newShieldCharges, localToday, daily.id]
      );
    }

    // 6. Apply cumulative HP penalty through progression service if player took damage
    if (totalHpLoss > 0) {
      await applyReward(client, userId, { hp: -totalHpLoss, sourceType: 'daily' });
    }

    return {
      resetPerformed: true,
      dailiesReset: dueDailies.length,
      hpPenalty: totalHpLoss,
    };
  });
}

/**
 * Background processor executed every 15 minutes by node-cron.
 * Finds all users who have active dailies whose last_reset_date predates
 * their local calendar date, and executes midnight reset per-user.
 *
 * @param {import('pg').Pool} pool
 * @returns {Promise<{ processedUsers: number, errors: number }>}
 */
export async function processDueResets(pool) {
  // First, auto-deactivate any expired rest modes across users
  try {
    await pool.query(
      `UPDATE rest_mode
       SET is_active = false
       WHERE is_active = true
         AND auto_deactivate_at IS NOT NULL
         AND auto_deactivate_at <= now()`
    );
  } catch (err) {
    console.error('[DAILY_RESET] Error auto-deactivating rest modes:', err.message);
  }
  const usersRes = await query(
    `SELECT DISTINCT u.id, u.timezone
     FROM users u
     JOIN dailies d ON d.user_id = u.id
     WHERE d.archived_at IS NULL`
  );

  let processedCount = 0;
  let errorCount = 0;

  for (const user of usersRes.rows) {
    try {
      const result = await checkAndProcessUserReset(pool, user.id, user.timezone);
      if (result.resetPerformed) {
        processedCount += 1;
      }
    } catch (err) {
      errorCount += 1;
      console.error(`[DAILY_RESET] Error processing user ${user.id}:`, err.message);
    }
  }

  return { processedUsers: processedCount, errors: errorCount };
}

/**
 * Initializes the node-cron scheduler running every 15 minutes.
 *
 * @param {import('pg').Pool} pool
 * @returns {import('node-cron').ScheduledTask}
 */
export function startDailyResetScheduler(pool) {
  // Check every 15 minutes: */15 * * * *
  const task = cron.schedule('*/15 * * * *', async () => {
    try {
      await processDueResets(pool);
    } catch (err) {
      console.error('[DAILY_RESET_CRON] Unexpected failure:', err.message);
    }
  });

  return task;
}
