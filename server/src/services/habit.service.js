import { query, withTransaction } from '../db/pool.js';
import { applyReward, xpRequiredFor } from './progression.service.js';
import { calculateHabitReward } from './reward-table.js';
import { getUserLocalDate } from './daily-reset.service.js';
import { isValidTimezone } from './auth.service.js';

/**
 * Format a raw PostgreSQL habits row into an API-ready object.
 */
export function formatHabit(row) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || null,
    direction: row.direction,
    difficulty: row.difficulty,
    currentStreak: row.current_streak,
    bestStreak: row.best_streak,
    lastScoredAt: row.last_scored_at ? new Date(row.last_scored_at).toISOString() : null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    archivedAt: row.archived_at ? new Date(row.archived_at).toISOString() : null,
  };
}

/**
 * Format raw PostgreSQL character_stats row.
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

export class HabitService {
  /**
   * List all unarchived habits for a user (or include archived if requested).
   *
   * @param {string} userId - User UUID
   * @param {object} [options]
   * @param {boolean} [options.includeArchived=false]
   * @returns {Promise<Array<object>>}
   */
  async listHabits(userId, { includeArchived = false } = {}) {
    let sql = `
      SELECT id, user_id, title, description, direction, difficulty,
             current_streak, best_streak, last_scored_at, created_at, archived_at
      FROM habits
      WHERE user_id = $1
    `;
    const params = [userId];

    if (!includeArchived) {
      sql += ' AND archived_at IS NULL';
    }

    sql += ' ORDER BY created_at ASC';

    const result = await query(sql, params);
    return result.rows.map(formatHabit);
  }

  /**
   * Get a single habit by ID, verifying tenant ownership.
   *
   * @param {string} userId - User UUID
   * @param {string} habitId - Habit UUID
   * @returns {Promise<object>}
   */
  async getHabitById(userId, habitId) {
    const result = await query(
      `SELECT id, user_id, title, description, direction, difficulty,
              current_streak, best_streak, last_scored_at, created_at, archived_at
       FROM habits
       WHERE id = $1 AND user_id = $2`,
      [habitId, userId]
    );

    if (result.rows.length === 0) {
      const err = new Error('Habit not found');
      err.status = 404;
      err.code = 'HABIT_NOT_FOUND';
      throw err;
    }

    return formatHabit(result.rows[0]);
  }

  /**
   * Create a new habit.
   *
   * @param {string} userId - User UUID
   * @param {object} data
   * @param {string} data.title
   * @param {string} [data.description]
   * @param {'positive'|'negative'|'both'} [data.direction='positive']
   * @param {'trivial'|'easy'|'medium'|'hard'} [data.difficulty='easy']
   * @returns {Promise<object>}
   */
  async createHabit(userId, { title, description = null, direction = 'positive', difficulty = 'easy' }) {
    const result = await query(
      `INSERT INTO habits (user_id, title, description, direction, difficulty)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, title, description, direction, difficulty,
                 current_streak, best_streak, last_scored_at, created_at, archived_at`,
      [userId, title.trim(), description ? description.trim() : null, direction, difficulty]
    );

    return formatHabit(result.rows[0]);
  }

  /**
   * Update an existing habit.
   *
   * @param {string} userId - User UUID
   * @param {string} habitId - Habit UUID
   * @param {object} data
   * @returns {Promise<object>}
   */
  async updateHabit(userId, habitId, data) {
    // Check existence and ownership first
    const existing = await query(
      'SELECT id, archived_at FROM habits WHERE id = $1 AND user_id = $2',
      [habitId, userId]
    );

    if (existing.rows.length === 0) {
      const err = new Error('Habit not found');
      err.status = 404;
      err.code = 'HABIT_NOT_FOUND';
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
    if (data.direction !== undefined) {
      updates.push(`direction = $${idx++}`);
      values.push(data.direction);
    }
    if (data.difficulty !== undefined) {
      updates.push(`difficulty = $${idx++}`);
      values.push(data.difficulty);
    }

    if (updates.length === 0) {
      return this.getHabitById(userId, habitId);
    }

    values.push(habitId, userId);
    const sql = `
      UPDATE habits
      SET ${updates.join(', ')}
      WHERE id = $${idx++} AND user_id = $${idx++}
      RETURNING id, user_id, title, description, direction, difficulty,
                current_streak, best_streak, last_scored_at, created_at, archived_at
    `;

    const result = await query(sql, values);
    return formatHabit(result.rows[0]);
  }

  /**
   * Archive / soft-delete a habit.
   *
   * @param {string} userId - User UUID
   * @param {string} habitId - Habit UUID
   * @returns {Promise<{ id: string, archived: boolean }>}
   */
  async archiveHabit(userId, habitId) {
    const result = await query(
      `UPDATE habits
       SET archived_at = now()
       WHERE id = $1 AND user_id = $2 AND archived_at IS NULL
       RETURNING id`,
      [habitId, userId]
    );

    if (result.rows.length === 0) {
      const err = new Error('Habit not found or already archived');
      err.status = 404;
      err.code = 'HABIT_NOT_FOUND';
      throw err;
    }

    return { id: result.rows[0].id, archived: true };
  }

  /**
   * Score a habit atomically.
   *
   * In a transaction:
   * 1. Lock habits row (FOR UPDATE) and verify ownership & direction.
   * 2. Update streak and last_scored_at.
   * 3. Calculate reward and invoke applyReward() which locks character_stats row.
   * 4. Insert audit record into habit_logs.
   * 5. Commit and return { habit, character, reward }.
   *
   * @param {string} userId - User UUID
   * @param {string} habitId - Habit UUID
   * @param {'positive'|'negative'} direction
   * @returns {Promise<{ habit: object, character: object, reward: object }>}
   */
  async scoreHabit(userId, habitId, direction) {
    if (direction !== 'positive' && direction !== 'negative') {
      const err = new Error("Direction must be 'positive' or 'negative'");
      err.status = 400;
      err.code = 'INVALID_DIRECTION';
      throw err;
    }

    return withTransaction(async (client) => {
      // 1. Lock habit row with tenant verification
      const habitRes = await client.query(
        `SELECT id, user_id, title, description, direction, difficulty,
                current_streak, best_streak, last_scored_at, created_at, archived_at
         FROM habits
         WHERE id = $1 AND user_id = $2
         FOR UPDATE`,
        [habitId, userId]
      );

      if (habitRes.rows.length === 0 || habitRes.rows[0].archived_at !== null) {
        const err = new Error('Habit not found or archived');
        err.status = 404;
        err.code = 'HABIT_NOT_FOUND';
        throw err;
      }

      const habit = habitRes.rows[0];

      // 2. Validate direction compatibility
      if (habit.direction === 'positive' && direction === 'negative') {
        const err = new Error("This habit only supports positive scoring ('positive')");
        err.status = 400;
        err.code = 'INVALID_DIRECTION';
        throw err;
      }
      if (habit.direction === 'negative' && direction === 'positive') {
        const err = new Error("This habit only supports negative scoring ('negative')");
        err.status = 400;
        err.code = 'INVALID_DIRECTION';
        throw err;
      }

      // 3. Update streaks
      let newCurrentStreak;
      let newBestStreak;

      if (direction === 'positive') {
        newCurrentStreak = habit.current_streak + 1;
        newBestStreak = Math.max(habit.best_streak, newCurrentStreak);
      } else {
        newCurrentStreak = 0;
        newBestStreak = habit.best_streak;
      }

      const updatedHabitRes = await client.query(
        `UPDATE habits
         SET current_streak = $1, best_streak = $2, last_scored_at = now()
         WHERE id = $3
         RETURNING id, user_id, title, description, direction, difficulty,
                   current_streak, best_streak, last_scored_at, created_at, archived_at`,
        [newCurrentStreak, newBestStreak, habitId]
      );
      const updatedHabit = updatedHabitRes.rows[0];

      // 4. Calculate reward
      const reward = calculateHabitReward(habit.difficulty, direction);

      // 5. Apply progression reward (locks character_stats inside same transaction)
      const progression = await applyReward(client, userId, {
        ...reward,
        sourceType: 'habit',
        sourceId: habitId,
      });

      // 6. Insert audit log into habit_logs
      await client.query(
        `INSERT INTO habit_logs (habit_id, user_id, direction, xp_awarded, gold_awarded, hp_change)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [habitId, userId, direction, reward.xp, reward.gold, reward.hp]
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
        habit: formatHabit(updatedHabit),
        character: formatCharacter(charRes.rows[0]),
        reward,
        progression,
      };
    });
  }

  /**
   * Retrieves mathematically complete weekly consistency across 7 local calendar days,
   * along with a separately bounded recent activity feed and positive completion state.
   *
   * @param {string} userId - User UUID
   * @param {object} [options]
   * @param {number} [options.recentLimit=10]
   * @param {Date} [options.now=new Date()]
   * @returns {Promise<object>}
   */
  async getHabitActivity(userId, { recentLimit = 10, now = new Date() } = {}) {
    const userRes = await query('SELECT timezone FROM users WHERE id = $1', [userId]);
    const rawTz = userRes.rows[0]?.timezone;
    const tz = rawTz && isValidTimezone(rawTz) ? rawTz : 'UTC';

    const anchorDate = now instanceof Date && !isNaN(now.getTime()) ? now : new Date();
    const todayStr = getUserLocalDate(anchorDate, tz);
    const [year, month, day] = todayStr.split('-').map(Number);
    const todayNoonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

    // Exactly seven calendar days: 6 days before today through today
    const calendarDays = [];
    for (let i = 6; i >= 0; i--) {
      const dayUtc = new Date(todayNoonUtc.getTime() - i * 24 * 60 * 60 * 1000);
      calendarDays.push(getUserLocalDate(dayUtc, tz));
    }

    // 1. Mathematically complete positive completions across the 7 local calendar days
    // Parameterized start-of-window anchored at local midnight of (today - 6 days)
    const aggregateRes = await query(
      `SELECT hl.habit_id as "habitId", hl.created_at as "createdAt"
       FROM habit_logs hl
       WHERE hl.user_id = $1
         AND hl.direction = 'positive'
         AND hl.created_at >= (date_trunc('day', $3::timestamptz AT TIME ZONE $2) - make_interval(days => 6)) AT TIME ZONE $2
       ORDER BY hl.created_at ASC`,
      [userId, tz, anchorDate.toISOString()]
    );

    const dailyCompletions = {};
    calendarDays.forEach((d) => {
      dailyCompletions[d] = 0;
    });

    const todayCompletedSet = new Set();
    let weeklyTotal = 0;

    for (const row of aggregateRes.rows) {
      const logDateStr = getUserLocalDate(new Date(row.createdAt), tz);
      if (dailyCompletions[logDateStr] !== undefined) {
        dailyCompletions[logDateStr] += 1;
        weeklyTotal += 1;
      }
      if (logDateStr === todayStr) {
        todayCompletedSet.add(row.habitId);
      }
    }

    // 2. Separately bounded recent activity feed (1-50 items, default 10)
    const safeRecentLimit = Math.max(1, Math.min(50, parseInt(recentLimit, 10) || 10));
    const recentRes = await query(
      `SELECT hl.id,
              hl.habit_id as "habitId",
              hl.direction,
              hl.xp_awarded as "xpAwarded",
              hl.gold_awarded as "goldAwarded",
              hl.hp_change as "hpChange",
              hl.created_at as "createdAt",
              COALESCE(h.title, 'Archived Ritual') as "habitTitle",
              (h.id IS NULL OR h.archived_at IS NOT NULL) as "isArchived"
       FROM habit_logs hl
       LEFT JOIN habits h ON h.id = hl.habit_id
       WHERE hl.user_id = $1
       ORDER BY hl.created_at DESC
       LIMIT $2`,
      [userId, safeRecentLimit]
    );

    return {
      timezone: tz,
      todayDate: todayStr,
      calendarDays,
      dailyCompletions,
      completedHabitIdsToday: Array.from(todayCompletedSet),
      weeklyTotal,
      recentLogs: recentRes.rows.map((r) => ({
        id: r.id,
        habitId: r.habitId,
        habitTitle: r.habitTitle,
        isArchived: Boolean(r.isArchived),
        direction: r.direction,
        xpAwarded: r.xpAwarded,
        goldAwarded: r.goldAwarded,
        hpChange: r.hpChange,
        createdAt: new Date(r.createdAt).toISOString(),
      })),
    };
  }
}

export const habitService = new HabitService();
