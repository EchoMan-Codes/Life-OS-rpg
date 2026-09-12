import { query, withTransaction, pool } from '../db/pool.js';
import { applyReward, revertReward, xpRequiredFor } from './progression.service.js';
import { calculateDailyReward } from './reward-table.js';
import { getUserLocalDate, checkAndProcessUserReset } from './daily-reset.service.js';

/**
 * Format raw PostgreSQL daily row into API-ready object.
 */
export function formatDaily(row) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || null,
    difficulty: row.difficulty,
    activeDays: row.active_days || [0, 1, 2, 3, 4, 5, 6],
    streakCurrent: row.streak_current,
    streakBest: row.streak_best,
    streakShieldCharges: row.streak_shield_charges,
    isCompleteToday: Boolean(row.is_complete_today),
    lastResetDate: row.last_reset_date ? String(row.last_reset_date).slice(0, 10) : null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    archivedAt: row.archived_at ? new Date(row.archived_at).toISOString() : null,
  };
}

/**
 * Format raw character_stats row.
 */
export function formatCharacter(stat) {
  return {
    level: stat.level,
    xp: stat.xp,
    xpForNextLevel: xpRequiredFor(stat.level),
    hp: stat.hp,
    maxHp: stat.max_hp,
    mana: stat.mana,
    maxMana: stat.max_mana,
    gold: stat.gold,
    attributes: {
      strength: stat.strength,
      intelligence: stat.intelligence,
      vitality: stat.vitality,
      willpower: stat.willpower,
      perception: stat.perception,
    },
    unallocatedPoints: stat.unallocated_points,
  };
}

export class DailyService {
  /**
   * List all unarchived dailies for a user (or include archived if requested).
   * Runs an opportunistic midnight-reset check first so state is never stale.
   *
   * @param {string} userId - User UUID
   * @param {object} [options]
   * @param {boolean} [options.includeArchived=false]
   * @returns {Promise<Array<object>>}
   */
  async listDailies(userId, { includeArchived = false } = {}) {
    // Opportunistically ensure midnight reset has run for this user
    try {
      await checkAndProcessUserReset(pool, userId);
    } catch (err) {
      console.error('[DAILY_SERVICE] Opportunistic reset check failed:', err.message);
    }

    let sql = `
      SELECT id, user_id, title, description, difficulty, active_days,
             streak_current, streak_best, streak_shield_charges, is_complete_today,
             last_reset_date::text as last_reset_date, created_at, archived_at
      FROM dailies
      WHERE user_id = $1
    `;
    const params = [userId];

    if (!includeArchived) {
      sql += ' AND archived_at IS NULL';
    }

    sql += ' ORDER BY created_at ASC';

    const result = await query(sql, params);
    return result.rows.map(formatDaily);
  }

  /**
   * Get a single daily by ID, enforcing strict tenant ownership.
   *
   * @param {string} userId - User UUID
   * @param {string} dailyId - Daily UUID
   * @returns {Promise<object>}
   */
  async getDailyById(userId, dailyId) {
    const result = await query(
      `SELECT id, user_id, title, description, difficulty, active_days,
              streak_current, streak_best, streak_shield_charges, is_complete_today,
              last_reset_date::text as last_reset_date, created_at, archived_at
       FROM dailies
       WHERE id = $1 AND user_id = $2`,
      [dailyId, userId]
    );

    if (result.rows.length === 0) {
      const err = new Error('Daily not found');
      err.status = 404;
      err.code = 'DAILY_NOT_FOUND';
      throw err;
    }

    return formatDaily(result.rows[0]);
  }

  /**
   * Create a new daily ritual. Sets initial last_reset_date to user's local today.
   *
   * @param {string} userId - User UUID
   * @param {object} data
   * @param {string} data.title
   * @param {string} [data.description]
   * @param {'trivial'|'easy'|'medium'|'hard'} [data.difficulty='easy']
   * @param {number[]} [data.activeDays=[0,1,2,3,4,5,6]]
   * @returns {Promise<object>}
   */
  async createDaily(userId, { title, description = null, difficulty = 'easy', activeDays = [0, 1, 2, 3, 4, 5, 6] }) {
    const userRes = await query('SELECT timezone FROM users WHERE id = $1', [userId]);
    const timezone = userRes.rows[0]?.timezone || 'UTC';
    const localToday = getUserLocalDate(new Date(), timezone);

    const result = await query(
      `INSERT INTO dailies (user_id, title, description, difficulty, active_days, last_reset_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, title, description, difficulty, active_days,
                 streak_current, streak_best, streak_shield_charges, is_complete_today,
                 last_reset_date::text as last_reset_date, created_at, archived_at`,
      [userId, title.trim(), description ? description.trim() : null, difficulty, activeDays, localToday]
    );

    return formatDaily(result.rows[0]);
  }

  /**
   * Update an existing daily.
   *
   * @param {string} userId - User UUID
   * @param {string} dailyId - Daily UUID
   * @param {object} data
   * @returns {Promise<object>}
   */
  async updateDaily(userId, dailyId, data) {
    const existing = await query(
      'SELECT id, archived_at FROM dailies WHERE id = $1 AND user_id = $2',
      [dailyId, userId]
    );

    if (existing.rows.length === 0) {
      const err = new Error('Daily not found');
      err.status = 404;
      err.code = 'DAILY_NOT_FOUND';
      throw err;
    }

    const updates = [];
    const values = [];
    let idx = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${idx++}`);
      values.push(data.title.trim());
    }
    if (data.description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(data.description ? data.description.trim() : null);
    }
    if (data.difficulty !== undefined) {
      updates.push(`difficulty = $${idx++}`);
      values.push(data.difficulty);
    }
    if (data.activeDays !== undefined) {
      updates.push(`active_days = $${idx++}`);
      values.push(data.activeDays);
    }

    if (updates.length === 0) {
      return this.getDailyById(userId, dailyId);
    }

    values.push(dailyId, userId);
    const sql = `
      UPDATE dailies
      SET ${updates.join(', ')}
      WHERE id = $${idx++} AND user_id = $${idx++}
      RETURNING id, user_id, title, description, difficulty, active_days,
                streak_current, streak_best, streak_shield_charges, is_complete_today,
                last_reset_date::text as last_reset_date, created_at, archived_at
    `;

    const result = await query(sql, values);
    return formatDaily(result.rows[0]);
  }

  /**
   * Archive / soft-delete a daily.
   *
   * @param {string} userId - User UUID
   * @param {string} dailyId - Daily UUID
   * @returns {Promise<{ id: string, archived: boolean }>}
   */
  async archiveDaily(userId, dailyId) {
    const result = await query(
      `UPDATE dailies
       SET archived_at = now()
       WHERE id = $1 AND user_id = $2 AND archived_at IS NULL
       RETURNING id`,
      [dailyId, userId]
    );

    if (result.rows.length === 0) {
      const err = new Error('Daily not found or already archived');
      err.status = 404;
      err.code = 'DAILY_NOT_FOUND';
      throw err;
    }

    return { id: result.rows[0].id, archived: true };
  }

  /**
   * Complete a daily for today.
   *
   * In a transaction:
   * 1. Lock dailies row with SELECT ... FOR UPDATE.
   * 2. Verify daily exists, is unarchived, and is NOT already complete today.
   * 3. Apply progression reward (XP/Gold) via applyReward().
   * 4. Record daily_completions row with audit details (reward amounts, level delta).
   * 5. Set is_complete_today = true.
   * 6. Return updated daily, character, and reward.
   *
   * @param {string} userId - User UUID
   * @param {string} dailyId - Daily UUID
   * @returns {Promise<{ daily: object, character: object, reward: object }>}
   */
  async completeDaily(userId, dailyId) {
    return withTransaction(async (client) => {
      // 1. Resolve user timezone & local today
      const userRes = await client.query('SELECT timezone FROM users WHERE id = $1', [userId]);
      const timezone = userRes.rows[0]?.timezone || 'UTC';
      const localToday = getUserLocalDate(new Date(), timezone);

      // 2. Lock daily row with tenant ownership verification
      const dailyRes = await client.query(
        `SELECT id, user_id, title, description, difficulty, active_days,
                streak_current, streak_best, streak_shield_charges, is_complete_today,
                last_reset_date::text as last_reset_date, created_at, archived_at
         FROM dailies
         WHERE id = $1 AND user_id = $2
         FOR UPDATE`,
        [dailyId, userId]
      );

      if (dailyRes.rows.length === 0 || dailyRes.rows[0].archived_at !== null) {
        const err = new Error('Daily not found or archived');
        err.status = 404;
        err.code = 'DAILY_NOT_FOUND';
        throw err;
      }

      const daily = dailyRes.rows[0];

      // 3. Reject duplicate completion with HTTP 409
      if (daily.is_complete_today) {
        const err = new Error('Daily is already completed for today');
        err.status = 409;
        err.code = 'ALREADY_COMPLETE';
        throw err;
      }

      // 4. Calculate difficulty reward
      const reward = calculateDailyReward(daily.difficulty);

      // 5. Apply progression reward
      const progression = await applyReward(client, userId, reward);
      const pointsAwarded = (progression.levelsGained || 0) * 2;

      // 6. Record completion audit record for safe undo
      await client.query(
        `INSERT INTO daily_completions (
           daily_id, user_id, for_date, completed_at, used_shield,
           xp_awarded, gold_awarded, leveled_up, levels_gained, points_awarded
         )
         VALUES ($1, $2, $3, now(), false, $4, $5, $6, $7, $8)
         ON CONFLICT (daily_id, for_date) DO UPDATE
         SET completed_at = now(),
             used_shield = false,
             xp_awarded = $4,
             gold_awarded = $5,
             leveled_up = $6,
             levels_gained = $7,
             points_awarded = $8`,
        [
          daily.id,
          userId,
          localToday,
          reward.xp,
          reward.gold,
          progression.leveledUp,
          progression.levelsGained || 0,
          pointsAwarded,
        ]
      );

      // 7. Mark complete today
      const updatedDailyRes = await client.query(
        `UPDATE dailies
         SET is_complete_today = true
         WHERE id = $1
         RETURNING id, user_id, title, description, difficulty, active_days,
                   streak_current, streak_best, streak_shield_charges, is_complete_today,
                   last_reset_date::text as last_reset_date, created_at, archived_at`,
        [daily.id]
      );

      // 8. Query updated character stats
      const charRes = await client.query(
        `SELECT user_id, level, xp, hp, max_hp, mana, max_mana, gold,
                strength, intelligence, vitality, willpower, perception,
                unallocated_points
         FROM character_stats
         WHERE user_id = $1`,
        [userId]
      );

      return {
        daily: formatDaily(updatedDailyRes.rows[0]),
        character: formatCharacter(charRes.rows[0]),
        reward: {
          ...reward,
          leveledUp: progression.leveledUp,
          levelsGained: progression.levelsGained || 0,
        },
      };
    });
  }

  /**
   * Undo today's completion of a daily ritual.
   *
   * In a transaction:
   * 1. Lock dailies row with SELECT ... FOR UPDATE.
   * 2. Verify daily is currently marked complete today.
   * 3. Fetch completion record for localToday with SELECT ... FOR UPDATE.
   * 4. Reverse progression reward safely via revertReward().
   * 5. Remove completion record.
   * 6. Set is_complete_today = false.
   * 7. Return updated daily and restored character stats.
   *
   * @param {string} userId - User UUID
   * @param {string} dailyId - Daily UUID
   * @returns {Promise<{ daily: object, character: object, reversedReward: object }>}
   */
  async undoDaily(userId, dailyId) {
    return withTransaction(async (client) => {
      // 1. Resolve user timezone & local today
      const userRes = await client.query('SELECT timezone FROM users WHERE id = $1', [userId]);
      const timezone = userRes.rows[0]?.timezone || 'UTC';
      const localToday = getUserLocalDate(new Date(), timezone);

      // 2. Lock daily row
      const dailyRes = await client.query(
        `SELECT id, user_id, title, description, difficulty, active_days,
                streak_current, streak_best, streak_shield_charges, is_complete_today,
                last_reset_date::text as last_reset_date, created_at, archived_at
         FROM dailies
         WHERE id = $1 AND user_id = $2
         FOR UPDATE`,
        [dailyId, userId]
      );

      if (dailyRes.rows.length === 0 || dailyRes.rows[0].archived_at !== null) {
        const err = new Error('Daily not found or archived');
        err.status = 404;
        err.code = 'DAILY_NOT_FOUND';
        throw err;
      }

      const daily = dailyRes.rows[0];

      if (!daily.is_complete_today) {
        const err = new Error('Daily is not completed today');
        err.status = 400;
        err.code = 'NOT_COMPLETED_TODAY';
        throw err;
      }

      // 3. Find today's completion record
      const compRes = await client.query(
        `SELECT id, xp_awarded, gold_awarded, leveled_up, levels_gained, points_awarded
         FROM daily_completions
         WHERE daily_id = $1 AND user_id = $2 AND for_date = $3
         FOR UPDATE`,
        [daily.id, userId, localToday]
      );

      if (compRes.rows.length === 0) {
        const err = new Error('No completion record found for today');
        err.status = 400;
        err.code = 'COMPLETION_NOT_FOUND';
        throw err;
      }

      const comp = compRes.rows[0];

      // 4. Revert progression reward transactionally
      await revertReward(client, userId, {
        xpAwarded: comp.xp_awarded,
        goldAwarded: comp.gold_awarded,
        levelsGained: comp.levels_gained,
        pointsAwarded: comp.points_awarded,
      });

      // 5. Delete completion record
      await client.query('DELETE FROM daily_completions WHERE id = $1', [comp.id]);

      // 6. Reset daily completion status
      const updatedDailyRes = await client.query(
        `UPDATE dailies
         SET is_complete_today = false
         WHERE id = $1
         RETURNING id, user_id, title, description, difficulty, active_days,
                   streak_current, streak_best, streak_shield_charges, is_complete_today,
                   last_reset_date::text as last_reset_date, created_at, archived_at`,
        [daily.id]
      );

      // 7. Query updated character stats
      const charRes = await client.query(
        `SELECT user_id, level, xp, hp, max_hp, mana, max_mana, gold,
                strength, intelligence, vitality, willpower, perception,
                unallocated_points
         FROM character_stats
         WHERE user_id = $1`,
        [userId]
      );

      return {
        daily: formatDaily(updatedDailyRes.rows[0]),
        character: formatCharacter(charRes.rows[0]),
        reversedReward: {
          xp: comp.xp_awarded,
          gold: comp.gold_awarded,
        },
      };
    });
  }
}

export const dailyService = new DailyService();
