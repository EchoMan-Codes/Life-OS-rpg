import { query, withTransaction } from '../db/pool.js';
import { applyReward, revertReward } from './progression.service.js';
import {
  calculateQuestReward,
  CHECKLIST_ITEM_REWARD,
  MILESTONE_REWARDS,
  ACTIVE_QUEST_LIMITS,
  calculateQuestSuggestedReward,
  validateQuestRewards,
  resolveCustomQuestLimitCategory,
} from './reward-table.js';

/**
 * Acquires a stable per-user transactional advisory lock in PostgreSQL.
 * Scoped strictly to the active transaction. Guarantees serialization
 * across concurrent requests for the same user without locking unrelated users.
 *
 * @param {import('pg').PoolClient} client
 * @param {string} userId
 */
async function acquireUserQuestLock(client, userId) {
  await client.query("SELECT pg_advisory_xact_lock(hashtext('quest_limit:' || $1::text))", [userId]);
}

/**
 * Checks active quest limit quota inside an active transaction client.
 * Must be called AFTER acquiring acquireUserQuestLock(client, userId).
 *
 * @param {import('pg').PoolClient} client
 * @param {string} userId
 * @param {'weekly' | 'monthly' | 'yearly'} limitCategory
 */
async function checkActiveQuestLimit(client, userId, limitCategory) {
  const limit = ACTIVE_QUEST_LIMITS[limitCategory] ?? 3;
  const { rows } = await client.query(
    `SELECT id, title, quest_type as "questType", limit_category as "limitCategory", due_date::text as "dueDate"
     FROM quests
     WHERE user_id = $1
       AND limit_category = $2
       AND status = 'active'
       AND archived_at IS NULL`,
    [userId, limitCategory]
  );

  if (rows.length >= limit) {
    const err = new Error(`Active quest limit reached for ${limitCategory} quests (maximum ${limit} active allowed).`);
    err.status = 409;
    err.code = 'QUEST_LIMIT_REACHED';
    err.details = {
      limit,
      limitCategory,
      conflictingQuests: rows,
    };
    throw err;
  }
}

export class QuestService {
  /**
   * Lists quests for an authenticated user, with attached subtask items, milestones,
   * linked tasks, extensions, and dynamically computed progress percentage.
   *
   * @param {string} userId - User UUID
   * @param {object} [filters={}]
   * @param {'active' | 'completed' | 'expired' | 'cancelled' | 'archived' | 'all'} [filters.status='active']
   * @param {'weekly' | 'monthly' | 'yearly' | 'custom'} [filters.type]
   * @param {string} [filters.category]
   * @param {boolean} [filters.includeArchived=false]
   * @returns {Promise<Array<object>>}
   */
  async listQuests(userId, { status = 'active', type = null, category = null, includeArchived = false } = {}) {
    let archiveClause = 'AND q.archived_at IS NULL';
    let statusClause = "AND q.status = 'active'";

    if (status === 'archived') {
      archiveClause = 'AND q.archived_at IS NOT NULL';
      statusClause = '';
    } else if (includeArchived) {
      archiveClause = '';
      if (status === 'completed') {
        statusClause = "AND q.status = 'completed'";
      } else if (status === 'expired') {
        statusClause = "AND q.status = 'expired'";
      } else if (status === 'cancelled') {
        statusClause = "AND q.status = 'cancelled'";
      } else if (status === 'all') {
        statusClause = '';
      }
    } else {
      if (status === 'completed') {
        statusClause = "AND q.status = 'completed'";
      } else if (status === 'expired') {
        statusClause = "AND q.status = 'expired'";
      } else if (status === 'cancelled') {
        statusClause = "AND q.status = 'cancelled'";
      } else if (status === 'all') {
        statusClause = '';
      } else if (status === 'active') {
        statusClause = "AND q.status = 'active'";
      }
    }

    const conditions = ['q.user_id = $1'];
    const params = [userId];
    let pIdx = 2;

    if (type) {
      conditions.push(`q.quest_type = $${pIdx++}`);
      params.push(type);
    }
    if (category) {
      conditions.push(`q.category = $${pIdx++}`);
      params.push(category);
    }

    const sql = `
      SELECT q.id, q.user_id, q.title, q.description, q.objective, q.priority, q.difficulty,
             q.quest_type as "questType", q.limit_category as "limitCategory", q.category,
             q.progress_mode as "progressMode", q.target_value as "targetValue", q.current_value as "currentValue",
             q.reward_xp as "rewardXp", q.reward_coins as "rewardCoins",
             q.due_date::text as due_date, q.starts_at as "startsAt", q.status, q.position,
             q.reminder_enabled, q.reminder_time, q.reminder_date::text as reminder_date,
             q.reminder_frequency, q.reminder_days_before,
             q.created_at, q.completed_at, q.cancelled_at as "cancelledAt", q.archived_at,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', qi.id,
                   'questId', qi.quest_id,
                   'title', qi.title,
                   'isComplete', qi.is_complete,
                   'xpReward', qi.xp_reward,
                   'goldReward', qi.gold_reward,
                   'position', qi.position,
                   'completedAt', qi.completed_at,
                   'createdAt', qi.created_at
                 ) ORDER BY qi.position ASC, qi.created_at ASC
               ) FILTER (WHERE qi.id IS NOT NULL), '[]'
             ) as items
      FROM quests q
      LEFT JOIN quest_items qi ON qi.quest_id = q.id
      WHERE ${conditions.join(' AND ')}
        ${archiveClause}
        ${statusClause}
      GROUP BY q.id
      ORDER BY q.position ASC, q.created_at DESC
    `;

    const { rows } = await query(sql, params);
    if (rows.length === 0) return [];

    const questIds = rows.map((r) => r.id);

    // Fetch milestones, linked tasks, and extensions in parallel batches
    const [milestoneRes, taskRes, extensionRes] = await Promise.all([
      query(
        `SELECT id, quest_id, title, threshold_percent, is_reached, xp_bonus, gold_bonus, reached_at
         FROM quest_milestones
         WHERE quest_id = ANY($1)
         ORDER BY threshold_percent ASC`,
        [questIds]
      ),
      query(
        `SELECT id, quest_id, title, status, difficulty, priority, due_date::text as "dueDate", scheduled_time as "scheduledTime"
         FROM tasks
         WHERE quest_id = ANY($1)
         ORDER BY position ASC, created_at ASC`,
        [questIds]
      ),
      query(
        `SELECT id, quest_id, previous_due_date::text as "previousDueDate", new_due_date::text as "newDueDate", reason, created_at as "createdAt"
         FROM quest_extensions
         WHERE quest_id = ANY($1)
         ORDER BY created_at DESC`,
        [questIds]
      ),
    ]);

    const milestonesByQuest = {};
    for (const m of milestoneRes.rows) {
      if (!milestonesByQuest[m.quest_id]) milestonesByQuest[m.quest_id] = [];
      milestonesByQuest[m.quest_id].push({
        id: m.id,
        questId: m.quest_id,
        title: m.title,
        thresholdPercent: m.threshold_percent,
        isReached: m.is_reached,
        xpBonus: m.xp_bonus,
        goldBonus: m.gold_bonus,
        reachedAt: m.reached_at,
      });
    }

    const tasksByQuest = {};
    for (const t of taskRes.rows) {
      if (!tasksByQuest[t.quest_id]) tasksByQuest[t.quest_id] = [];
      tasksByQuest[t.quest_id].push(t);
    }

    const extensionsByQuest = {};
    for (const ext of extensionRes.rows) {
      if (!extensionsByQuest[ext.quest_id]) extensionsByQuest[ext.quest_id] = [];
      extensionsByQuest[ext.quest_id].push(ext);
    }

    return rows.map((q) => {
      const items = q.items || [];
      const linkedTasks = tasksByQuest[q.id] || [];
      const milestones = milestonesByQuest[q.id] || [];
      const extensions = extensionsByQuest[q.id] || [];

      // Calculate progress percentage according to progress mode
      let progressPercent = 0;
      let totalTasks = items.length + linkedTasks.length;
      let completedTasks = items.filter((i) => i.isComplete).length + linkedTasks.filter((t) => t.status === 'completed').length;

      if (q.progressMode === 'task') {
        if (totalTasks > 0) {
          progressPercent = Math.round((completedTasks / totalTasks) * 100);
        } else {
          progressPercent = q.status === 'completed' ? 100 : (q.targetValue > 0 ? Math.min(100, Math.round((q.currentValue / q.targetValue) * 100)) : 0);
        }
      } else if (q.progressMode === 'count') {
        progressPercent = q.targetValue > 0 ? Math.min(100, Math.round((q.currentValue / q.targetValue) * 100)) : 0;
      } else {
        // Manual verification
        progressPercent = q.status === 'completed' ? 100 : 0;
      }

      // Legacy fallback reward calculation
      const questReward = {
        xp: q.rewardXp || calculateQuestReward(q.difficulty).xp,
        gold: q.rewardCoins || calculateQuestReward(q.difficulty).gold,
      };

      return {
        id: q.id,
        userId: q.user_id,
        title: q.title,
        description: q.description,
        objective: q.objective || q.description || q.title,
        priority: q.priority,
        difficulty: q.difficulty,
        questType: q.questType || 'weekly',
        limitCategory: q.limitCategory || 'weekly',
        category: q.category || 'other',
        progressMode: q.progressMode || 'task',
        targetValue: q.targetValue !== undefined ? q.targetValue : 1,
        currentValue: q.currentValue !== undefined ? q.currentValue : 0,
        rewardXp: questReward.xp,
        rewardCoins: questReward.gold,
        dueDate: q.due_date,
        startsAt: q.startsAt,
        status: q.status,
        position: q.position,
        reminderEnabled: Boolean(q.reminder_enabled),
        reminderTime: q.reminder_time || null,
        reminderDate: q.reminder_date || null,
        reminderFrequency: q.reminder_frequency || 'days_before',
        reminderDaysBefore: q.reminder_days_before !== null && q.reminder_days_before !== undefined ? Number(q.reminder_days_before) : 1,
        createdAt: q.created_at,
        completedAt: q.completed_at,
        cancelledAt: q.cancelledAt,
        archivedAt: q.archived_at ? new Date(q.archived_at).toISOString() : null,
        progressPercent,
        totalItems: items.length,
        completedItems: items.filter((i) => i.isComplete).length,
        totalTasks,
        completedTasks,
        reward: questReward,
        items,
        linkedTasks,
        milestones,
        extensions,
      };
    });
  }

  /**
   * Retrieves a single quest by ID, enforcing tenant isolation.
   *
   * @param {string} userId - User UUID
   * @param {string} questId - Quest UUID
   * @returns {Promise<object>}
   */
  async getQuestById(userId, questId) {
    const quests = await this.listQuests(userId, { status: 'all', includeArchived: true });
    const quest = quests.find((q) => q.id === questId);
    if (!quest) {
      const err = new Error('Quest not found');
      err.status = 404;
      err.code = 'QUEST_NOT_FOUND';
      throw err;
    }
    return quest;
  }

  /**
   * Creates a new quest inside a managed transaction with per-user advisory lock,
   * atomic active-limit quota enforcement, reward validation, milestones, and initial items/tasks.
   *
   * @param {string} userId - User UUID
   * @param {object} params
   * @returns {Promise<object>}
   */
  async createQuest(userId, {
    title,
    objective,
    description,
    priority = 'medium',
    difficulty = 'medium',
    type = null,
    limitCategory = null,
    category = 'other',
    progressMode = 'task',
    targetValue = 1,
    currentValue = 0,
    rewardXp = null,
    rewardCoins = null,
    startsAt = null,
    dueDate = null,
    reminderEnabled = false,
    reminderTime = null,
    reminderDate = null,
    reminderFrequency = 'days_before',
    reminderDaysBefore = 1,
    items = [],
    linkedTaskIds = [],
  }) {
    return withTransaction(async (client) => {
      // 1. Acquire stable per-user transaction advisory lock to serialize limit enforcement
      await acquireUserQuestLock(client, userId);

      // 2. Resolve quest type and limit category
      const isExplicitNewSystem = Boolean(
        type ||
        (rewardXp !== undefined && rewardXp !== null) ||
        (rewardCoins !== undefined && rewardCoins !== null)
      );
      const questType = ['weekly', 'monthly', 'yearly', 'custom'].includes(type) ? type : 'weekly';
      const resolvedLimitCategory = questType === 'custom'
        ? (limitCategory || resolveCustomQuestLimitCategory(startsAt, dueDate))
        : questType;

      // 3. Atomically check and enforce active quest limit
      await checkActiveQuestLimit(client, userId, resolvedLimitCategory);

      // 4. Resolve reward values (backward-compatible with Phase 3.3 legacy tests when type/rewardXp are omitted)
      let finalXp;
      let finalCoins;

      if (rewardXp !== undefined && rewardXp !== null) {
        const rewardVal = validateQuestRewards(questType, difficulty, { xp: rewardXp, gold: rewardCoins });
        if (!rewardVal.valid) {
          const err = new Error(rewardVal.error);
          err.status = 400;
          err.code = 'INVALID_REWARD_BOUNDS';
          err.details = rewardVal;
          throw err;
        }
        finalXp = rewardVal.xp;
        finalCoins = rewardVal.gold;
      } else if (isExplicitNewSystem) {
        const suggested = calculateQuestSuggestedReward(questType, difficulty);
        finalXp = suggested.xp;
        finalCoins = suggested.gold;
      } else {
        const legacy = calculateQuestReward(difficulty);
        finalXp = legacy.xp;
        finalCoins = legacy.gold;
      }

      // 5. Determine position
      const posRes = await client.query(
        'SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM quests WHERE user_id = $1 AND archived_at IS NULL',
        [userId]
      );
      const nextPos = posRes.rows[0].next_pos;

      // 6. Insert quest
      const insertRes = await client.query(
        `INSERT INTO quests (
          user_id, title, description, objective, priority, difficulty,
          quest_type, limit_category, category, progress_mode, target_value, current_value,
          reward_xp, reward_coins, starts_at, due_date,
          reminder_enabled, reminder_time, reminder_date, reminder_frequency, reminder_days_before,
          position
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16,
          $17, $18, $19, $20, $21,
          $22
        ) RETURNING id`,
        [
          userId,
          title.trim(),
          description?.trim() || null,
          (objective || description || title).trim(),
          priority,
          difficulty,
          questType,
          resolvedLimitCategory,
          category,
          progressMode,
          Math.max(1, parseInt(targetValue, 10) || 1),
          Math.max(0, parseInt(currentValue, 10) || 0),
          finalXp,
          finalCoins,
          startsAt ? new Date(startsAt) : new Date(),
          dueDate || null,
          Boolean(reminderEnabled),
          reminderTime || null,
          reminderDate || null,
          reminderFrequency || 'days_before',
          reminderDaysBefore !== undefined && reminderDaysBefore !== null ? Number(reminderDaysBefore) : 1,
          nextPos,
        ]
      );
      const questId = insertRes.rows[0].id;

      // 7. Insert standard milestones: 25%, 50%, 75%, 100%
      const defaultMilestones = [
        { title: 'First Steps', percent: 25, ...MILESTONE_REWARDS[25] },
        { title: 'Halfway Mark', percent: 50, ...MILESTONE_REWARDS[50] },
        { title: 'The Home Stretch', percent: 75, ...MILESTONE_REWARDS[75] },
        { title: 'Grand Triumph', percent: 100, ...MILESTONE_REWARDS[100] },
      ];
      for (const m of defaultMilestones) {
        await client.query(
          `INSERT INTO quest_milestones (quest_id, user_id, title, threshold_percent, xp_bonus, gold_bonus)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (quest_id, threshold_percent) DO NOTHING`,
          [questId, userId, m.title, m.percent, m.xp, m.gold]
        );
      }

      // 8. Insert initial checklist items if provided
      if (Array.isArray(items) && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const itemTitle = typeof items[i] === 'string' ? items[i] : items[i].title;
          if (itemTitle && itemTitle.trim()) {
            await client.query(
              `INSERT INTO quest_items (quest_id, user_id, title, position, xp_reward, gold_reward)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [questId, userId, itemTitle.trim(), i, CHECKLIST_ITEM_REWARD.xp, CHECKLIST_ITEM_REWARD.gold]
            );
          }
        }
      }

      // 9. Link initial tasks if provided
      if (Array.isArray(linkedTaskIds) && linkedTaskIds.length > 0) {
        await client.query(
          `UPDATE tasks SET quest_id = $1 WHERE id = ANY($2) AND user_id = $3`,
          [questId, linkedTaskIds, userId]
        );
      }

      return questId;
    }).then((id) => this.getQuestById(userId, id));
  }

  /**
   * Updates an existing quest with tenant isolation.
   *
   * @param {string} userId
   * @param {string} questId
   * @param {object} updates
   * @returns {Promise<object>}
   */
  async updateQuest(userId, questId, {
    title,
    objective,
    description,
    priority,
    difficulty,
    category,
    dueDate,
    startsAt,
    reminderEnabled,
    reminderTime,
    reminderDate,
    reminderFrequency,
    reminderDaysBefore,
  }) {
    const fields = [];
    const values = [questId, userId];
    let idx = 3;

    if (title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(title.trim());
    }
    if (objective !== undefined) {
      fields.push(`objective = $${idx++}`);
      values.push(objective ? objective.trim() : null);
    }
    if (description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(description ? description.trim() : null);
    }
    if (priority !== undefined) {
      fields.push(`priority = $${idx++}`);
      values.push(priority);
    }
    if (difficulty !== undefined) {
      fields.push(`difficulty = $${idx++}`);
      values.push(difficulty);
    }
    if (category !== undefined) {
      fields.push(`category = $${idx++}`);
      values.push(category);
    }
    if (dueDate !== undefined) {
      fields.push(`due_date = $${idx++}`);
      values.push(dueDate || null);
    }
    if (startsAt !== undefined) {
      fields.push(`starts_at = $${idx++}`);
      values.push(startsAt ? new Date(startsAt) : null);
    }
    if (reminderEnabled !== undefined) {
      fields.push(`reminder_enabled = $${idx++}`);
      values.push(Boolean(reminderEnabled));
    }
    if (reminderTime !== undefined) {
      fields.push(`reminder_time = $${idx++}`);
      values.push(reminderTime || null);
    }
    if (reminderDate !== undefined) {
      fields.push(`reminder_date = $${idx++}`);
      values.push(reminderDate || null);
    }
    if (reminderFrequency !== undefined) {
      fields.push(`reminder_frequency = $${idx++}`);
      values.push(reminderFrequency || 'days_before');
    }
    if (reminderDaysBefore !== undefined) {
      fields.push(`reminder_days_before = $${idx++}`);
      values.push(Number(reminderDaysBefore));
    }

    if (fields.length === 0) {
      return this.getQuestById(userId, questId);
    }

    const sql = `
      UPDATE quests
      SET ${fields.join(', ')}
      WHERE id = $1 AND user_id = $2 AND archived_at IS NULL
      RETURNING id
    `;

    const { rows } = await query(sql, values);
    if (rows.length === 0) {
      const err = new Error('Quest not found');
      err.status = 404;
      err.code = 'QUEST_NOT_FOUND';
      throw err;
    }

    return this.getQuestById(userId, questId);
  }

  /**
   * Records progress on count-based or general quests.
   * Clamps between 0 and targetValue, logs an idempotent progress event,
   * and auto-completes the quest if the target is met.
   *
   * @param {string} userId
   * @param {string} questId
   * @param {object} params
   * @param {number} [params.delta=1]
   * @param {number} [params.currentCount]
   * @param {string} [params.idempotencyKey]
   * @param {string} [params.notes]
   * @returns {Promise<object>}
   */
  async recordProgress(userId, questId, { delta = 1, currentCount, idempotencyKey = null, notes = null } = {}) {
    return withTransaction(async (client) => {
      // 1. Lock quest row
      const questRes = await client.query(
        `SELECT id, user_id, title, status, progress_mode, target_value, current_value, reward_xp, reward_coins
         FROM quests
         WHERE id = $1 AND user_id = $2 AND archived_at IS NULL
         FOR UPDATE`,
        [questId, userId]
      );
      if (questRes.rows.length === 0) {
        const err = new Error('Quest not found');
        err.status = 404;
        err.code = 'QUEST_NOT_FOUND';
        throw err;
      }
      const quest = questRes.rows[0];

      if (quest.status !== 'active') {
        const err = new Error(`Cannot record progress on a quest with status '${quest.status}'`);
        err.status = 409;
        err.code = 'QUEST_NOT_ACTIVE';
        throw err;
      }

      // 2. Check idempotencyKey if provided
      if (idempotencyKey) {
        const existingEvent = await client.query(
          `SELECT id, current_value FROM quest_progress_events WHERE quest_id = $1 AND idempotency_key = $2`,
          [questId, idempotencyKey]
        );
        if (existingEvent.rows.length > 0) {
          return { isDuplicate: true };
        }
      }

      // 3. Compute clamped progress
      let nextValue;
      let effectiveDelta;
      if (currentCount !== undefined && currentCount !== null) {
        nextValue = Math.max(0, Math.min(quest.target_value, Number(currentCount)));
        effectiveDelta = nextValue - quest.current_value;
      } else {
        const safeDelta = Number(delta) || 1;
        nextValue = Math.max(0, Math.min(quest.target_value, quest.current_value + safeDelta));
        effectiveDelta = nextValue - quest.current_value;
      }

      // 4. Update quest current_value
      await client.query(
        `UPDATE quests SET current_value = $1 WHERE id = $2`,
        [nextValue, questId]
      );

      // 5. Log progress event
      await client.query(
        `INSERT INTO quest_progress_events (quest_id, user_id, source_type, idempotency_key, delta, current_value, notes)
         VALUES ($1, $2, 'count_update', $3, $4, $5, $6)`,
        [questId, userId, idempotencyKey || null, effectiveDelta, nextValue, notes || null]
      );

      // Check milestones
      let milestoneHit = null;
      if (quest.target_value > 0) {
        const pct = Math.floor((nextValue / quest.target_value) * 100);
        const unreachedMilestones = await client.query(
          `SELECT id, threshold_percent, xp_bonus, gold_bonus
           FROM quest_milestones
           WHERE quest_id = $1 AND threshold_percent <= $2 AND is_reached = FALSE
           ORDER BY threshold_percent ASC
           FOR UPDATE`,
          [questId, pct]
        );
        for (const ms of unreachedMilestones.rows) {
          await client.query(
            `UPDATE quest_milestones SET is_reached = TRUE, reached_at = NOW() WHERE id = $1`,
            [ms.id]
          );
          await applyReward(client, userId, {
            xp: ms.xp_bonus,
            gold: ms.gold_bonus,
            sourceType: 'quest_milestone',
            sourceId: ms.id,
          });
          milestoneHit = ms;
        }
      }

      // 6. Auto-complete if target reached
      let questCompleted = false;
      if (nextValue >= quest.target_value && quest.target_value > 0) {
        await this.completeQuest(userId, questId, client);
        questCompleted = true;
      }

      return { nextValue, milestoneHit, questCompleted, isDuplicate: false };
    }).then(async (res) => {
      const q = await this.getQuestById(userId, questId);
      return {
        ...q,
        idempotentDuplicate: res?.isDuplicate ?? false,
        milestoneHit: !!res?.milestoneHit,
        questCompleted: res?.questCompleted ?? false,
      };
    });
  }

  /**
   * Synchronizes task-driven progress for a quest based on persisted qualifying tasks and items.
   * Fully idempotent: derives counts directly from PostgreSQL state.
   *
   * @param {string} taskId
   * @param {string} questId
   * @param {import('pg').PoolClient} [externalClient=null]
   * @returns {Promise<object>}
   */
  async syncTaskProgress(taskId, questId, externalClient = null) {
    const run = async (client) => {
      const qRes = await client.query(
        `SELECT id, user_id, title, status, progress_mode, target_value, current_value
         FROM quests
         WHERE id = $1 AND archived_at IS NULL
         FOR UPDATE`,
        [questId]
      );
      if (qRes.rows.length === 0) return null;
      const quest = qRes.rows[0];

      if (quest.status !== 'active') return null;

      // Derive counts from persisted tasks and items
      const taskCounts = await client.query(
        `SELECT
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE status = 'completed') as completed
         FROM tasks
         WHERE quest_id = $1`,
        [questId]
      );
      const itemCounts = await client.query(
        `SELECT
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE is_complete = true) as completed
         FROM quest_items
         WHERE quest_id = $1`,
        [questId]
      );

      const totalTasks = parseInt(taskCounts.rows[0].total, 10) + parseInt(itemCounts.rows[0].total, 10);
      const completedTasks = parseInt(taskCounts.rows[0].completed, 10) + parseInt(itemCounts.rows[0].completed, 10);

      if (totalTasks === 0) return null;

      await client.query(
        `UPDATE quests SET current_value = $1, target_value = $2 WHERE id = $3`,
        [completedTasks, totalTasks, questId]
      );

      // Record idempotent progress event
      if (taskId) {
        await client.query(
          `INSERT INTO quest_progress_events (quest_id, user_id, source_type, source_id, delta, current_value, notes)
           VALUES ($1, $2, 'task_completed', $3, 1, $4, 'Task completion sync')
           ON CONFLICT (quest_id, source_type, source_id) WHERE source_id IS NOT NULL DO NOTHING`,
          [questId, quest.user_id, taskId, completedTasks]
        );
      }

      // Auto-complete if all tasks are complete
      if (completedTasks >= totalTasks && totalTasks > 0) {
        return this.completeQuest(quest.user_id, questId, client);
      }

      return { questId, completedTasks, totalTasks };
    };

    if (externalClient) {
      return run(externalClient);
    }
    return withTransaction(run);
  }

  /**
   * Extends a quest's deadline, preserving existing progress.
   * If the quest was expired, verifies active limits atomically and restores to active status.
   *
   * @param {string} userId
   * @param {string} questId
   * @param {object} params
   * @param {string} params.newDueDate
   * @param {string} [params.reason]
   * @returns {Promise<object>}
   */
  async extendQuest(userId, questId, { newDueDate, reason = null } = {}) {
    if (!newDueDate) {
      const err = new Error('newDueDate is required in YYYY-MM-DD format');
      err.status = 400;
      err.code = 'INVALID_DUE_DATE';
      throw err;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (newDueDate <= todayStr) {
      const err = new Error('New deadline must be in the future.');
      err.status = 400;
      err.code = 'DEADLINE_MUST_BE_FUTURE';
      throw err;
    }

    return withTransaction(async (client) => {
      // 1. Acquire per-user advisory lock
      await acquireUserQuestLock(client, userId);

      // 2. Lock quest row
      const qRes = await client.query(
        `SELECT id, user_id, title, status, limit_category, due_date::text as due_date
         FROM quests
         WHERE id = $1 AND user_id = $2 AND archived_at IS NULL
         FOR UPDATE`,
        [questId, userId]
      );
      if (qRes.rows.length === 0) {
        const err = new Error('Quest not found');
        err.status = 404;
        err.code = 'QUEST_NOT_FOUND';
        throw err;
      }
      const quest = qRes.rows[0];

      if (quest.status === 'completed') {
        const err = new Error('Cannot extend a completed quest');
        err.status = 400;
        err.code = 'CANNOT_EXTEND_COMPLETED_QUEST';
        throw err;
      }

      // If quest was expired, restoring to active requires an available active slot!
      if (quest.status === 'expired') {
        await checkActiveQuestLimit(client, userId, quest.limit_category);
      }

      // 3. Record in quest_extensions table
      await client.query(
        `INSERT INTO quest_extensions (quest_id, user_id, previous_due_date, new_due_date, reason)
         VALUES ($1, $2, $3, $4, $5)`,
        [questId, userId, quest.due_date || null, newDueDate, reason?.trim() || null]
      );

      // 4. Update quest deadline and restore to active status
      await client.query(
        `UPDATE quests
         SET due_date = $1, status = 'active'
         WHERE id = $2`,
        [newDueDate, questId]
      );

      return questId;
    }).then((id) => this.getQuestById(userId, id));
  }

  /**
   * Cancels a quest without granting completion rewards.
   *
   * @param {string} userId
   * @param {string} questId
   * @returns {Promise<object>}
   */
  async cancelQuest(userId, questId) {
    return withTransaction(async (client) => {
      const qRes = await client.query(
        `SELECT id, status FROM quests WHERE id = $1 AND user_id = $2 AND archived_at IS NULL FOR UPDATE`,
        [questId, userId]
      );
      if (qRes.rows.length === 0) {
        const err = new Error('Quest not found');
        err.status = 404;
        err.code = 'QUEST_NOT_FOUND';
        throw err;
      }
      const quest = qRes.rows[0];
      if (quest.status === 'completed') {
        const err = new Error('Cannot cancel a completed quest');
        err.status = 400;
        err.code = 'CANNOT_CANCEL_COMPLETED_QUEST';
        throw err;
      }

      await client.query(
        `UPDATE quests SET status = 'cancelled', cancelled_at = now() WHERE id = $1`,
        [questId]
      );

      return questId;
    }).then((id) => this.getQuestById(userId, id));
  }

  /**
   * Background expiration worker: marks active overdue quests as expired across all users.
   * Safe and idempotent to run repeatedly via scheduler/cron.
   *
   * @returns {Promise<{ expiredCount: number, expiredQuests: Array<object> }>}
   */
  async expireOverdueQuestsAcrossUsers() {
    const res = await query(
      `UPDATE quests
       SET status = 'expired'
       WHERE status = 'active'
         AND archived_at IS NULL
         AND due_date IS NOT NULL
         AND due_date < CURRENT_DATE
       RETURNING id, user_id, title, due_date::text as due_date`
    );
    return {
      expiredCount: res.rows.length,
      expiredQuests: res.rows,
    };
  }

  /**
   * Soft-deletes a quest and its checklist items.
   *
   * @param {string} userId
   * @param {string} questId
   * @returns {Promise<{ success: boolean }>}
   */
  async archiveQuest(userId, questId) {
    const res = await query(
      `UPDATE quests
       SET archived_at = now(), status = 'archived'
       WHERE id = $1 AND user_id = $2 AND archived_at IS NULL
       RETURNING id`,
      [questId, userId]
    );

    if (res.rows.length === 0) {
      const err = new Error('Quest not found');
      err.status = 404;
      err.code = 'QUEST_NOT_FOUND';
      throw err;
    }

    return { success: true };
  }

  /**
   * Permanently delete a quest and cascade subtasks and milestones.
   *
   * @param {string} userId
   * @param {string} questId
   * @returns {Promise<{ id: string, deleted: boolean }>}
   */
  async deleteQuestPermanently(userId, questId) {
    const res = await query(
      'DELETE FROM quests WHERE id = $1 AND user_id = $2 RETURNING id',
      [questId, userId]
    );

    if (res.rows.length === 0) {
      const err = new Error('Quest not found');
      err.status = 404;
      err.code = 'QUEST_NOT_FOUND';
      throw err;
    }

    return { id: res.rows[0].id, deleted: true };
  }

  /**
   * Restore an archived quest, atomically validating active quest limits.
   *
   * @param {string} userId
   * @param {string} questId
   * @returns {Promise<object>}
   */
  async restoreQuest(userId, questId) {
    return withTransaction(async (client) => {
      await acquireUserQuestLock(client, userId);

      const qRes = await client.query(
        `SELECT id, limit_category FROM quests WHERE id = $1 AND user_id = $2 FOR UPDATE`,
        [questId, userId]
      );
      if (qRes.rows.length === 0) {
        const err = new Error('Quest not found');
        err.status = 404;
        err.code = 'QUEST_NOT_FOUND';
        throw err;
      }
      const quest = qRes.rows[0];

      await checkActiveQuestLimit(client, userId, quest.limit_category);

      await client.query(
        `UPDATE quests
         SET archived_at = NULL, status = 'active'
         WHERE id = $1 AND user_id = $2`,
        [questId, userId]
      );

      return this.getQuestById(userId, questId);
    });
  }

  /**
   * Reorders active quests in a single transaction.
   *
   * @param {string} userId
   * @param {Array<string>} orderedIds
   * @returns {Promise<{ success: boolean }>}
   */
  async reorderQuests(userId, orderedIds) {
    if (!Array.isArray(orderedIds)) {
      const err = new Error('orderedIds must be an array');
      err.status = 400;
      err.code = 'INVALID_INPUT';
      throw err;
    }

    return withTransaction(async (client) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await client.query(
          `UPDATE quests SET position = $1 WHERE id = $2 AND user_id = $3`,
          [i, orderedIds[i], userId]
        );
      }
      return { success: true };
    });
  }

  /**
   * Adds a checklist subtask item to a quest.
   *
   * @param {string} userId
   * @param {string} questId
   * @param {object} itemData
   * @returns {Promise<object>}
   */
  async addQuestItem(userId, questId, { title, xpReward = CHECKLIST_ITEM_REWARD.xp, goldReward = CHECKLIST_ITEM_REWARD.gold }) {
    const questCheck = await query(
      `SELECT id, status FROM quests WHERE id = $1 AND user_id = $2 AND archived_at IS NULL`,
      [questId, userId]
    );
    if (questCheck.rows.length === 0) {
      const err = new Error('Quest not found');
      err.status = 404;
      err.code = 'QUEST_NOT_FOUND';
      throw err;
    }

    const posRes = await query(
      `SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM quest_items WHERE quest_id = $1`,
      [questId]
    );
    const nextPos = posRes.rows[0].next_pos;

    const res = await query(
      `INSERT INTO quest_items (quest_id, user_id, title, position, xp_reward, gold_reward)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, quest_id as "questId", title, is_complete as "isComplete",
                 xp_reward as "xpReward", gold_reward as "goldReward", position,
                 completed_at as "completedAt", created_at as "createdAt"`,
      [questId, userId, title.trim(), nextPos, xpReward, goldReward]
    );

    return res.rows[0];
  }

  /**
   * Updates a checklist item's title.
   *
   * @param {string} userId
   * @param {string} questId
   * @param {string} itemId
   * @param {object} updates
   * @returns {Promise<object>}
   */
  async updateQuestItem(userId, questId, itemId, { title }) {
    const res = await query(
      `UPDATE quest_items
       SET title = $1
       WHERE id = $2 AND quest_id = $3 AND user_id = $4
       RETURNING id, quest_id as "questId", title, is_complete as "isComplete",
                 xp_reward as "xpReward", gold_reward as "goldReward", position,
                 completed_at as "completedAt", created_at as "createdAt"`,
      [title.trim(), itemId, questId, userId]
    );

    if (res.rows.length === 0) {
      const err = new Error('Checklist item not found');
      err.status = 404;
      err.code = 'ITEM_NOT_FOUND';
      throw err;
    }

    return res.rows[0];
  }

  /**
   * Deletes a checklist item.
   *
   * @param {string} userId
   * @param {string} questId
   * @param {string} itemId
   * @returns {Promise<{ success: boolean }>}
   */
  async deleteQuestItem(userId, questId, itemId) {
    const res = await query(
      `DELETE FROM quest_items WHERE id = $1 AND quest_id = $2 AND user_id = $3 RETURNING id`,
      [itemId, questId, userId]
    );

    if (res.rows.length === 0) {
      const err = new Error('Checklist item not found');
      err.status = 404;
      err.code = 'ITEM_NOT_FOUND';
      throw err;
    }

    return { success: true };
  }

  /**
   * Reorders checklist items within a quest.
   *
   * @param {string} userId
   * @param {string} questId
   * @param {Array<string>} orderedIds
   * @returns {Promise<{ success: boolean }>}
   */
  async reorderQuestItems(userId, questId, orderedIds) {
    return withTransaction(async (client) => {
      const qCheck = await client.query(
        'SELECT id FROM quests WHERE id = $1 AND user_id = $2 AND archived_at IS NULL',
        [questId, userId]
      );
      if (qCheck.rows.length === 0) {
        const err = new Error('Quest not found');
        err.status = 404;
        err.code = 'QUEST_NOT_FOUND';
        throw err;
      }

      for (let i = 0; i < orderedIds.length; i++) {
        await client.query(
          `UPDATE quest_items SET position = $1 WHERE id = $2 AND quest_id = $3 AND user_id = $4`,
          [i, orderedIds[i], questId, userId]
        );
      }
      return { success: true };
    });
  }

  /**
   * Completes a checklist item in a managed transaction.
   * 1. Awards item completion reward (+2 XP / +1 Gold).
   * 2. Recalculates quest progress percentage.
   * 3. Detects newly reached milestone thresholds (25%, 50%, 75%, 100%) and grants their one-time rewards.
   * 4. If all items are completed, auto-completes parent quest and awards quest completion reward!
   *
   * @param {string} userId
   * @param {string} questId
   * @param {string} itemId
   * @returns {Promise<object>}
   */
  async completeQuestItem(userId, questId, itemId) {
    return withTransaction(async (client) => {
      // 1. Lock quest row first to enforce consistent lock order
      const questRes = await client.query(
        `SELECT id, user_id, title, difficulty, status, reward_xp, reward_coins
         FROM quests
         WHERE id = $1 AND user_id = $2 AND archived_at IS NULL
         FOR UPDATE`,
        [questId, userId]
      );
      if (questRes.rows.length === 0) {
        const err = new Error('Quest not found');
        err.status = 404;
        err.code = 'QUEST_NOT_FOUND';
        throw err;
      }
      const quest = questRes.rows[0];

      // 2. Lock item row
      const itemRes = await client.query(
        `SELECT id, quest_id, title, is_complete, xp_reward, gold_reward
         FROM quest_items
         WHERE id = $1 AND quest_id = $2 AND user_id = $3
         FOR UPDATE`,
        [itemId, questId, userId]
      );
      if (itemRes.rows.length === 0) {
        const err = new Error('Checklist item not found');
        err.status = 404;
        err.code = 'ITEM_NOT_FOUND';
        throw err;
      }
      const item = itemRes.rows[0];

      if (item.is_complete) {
        const err = new Error('Item is already completed');
        err.status = 409;
        err.code = 'ITEM_ALREADY_COMPLETED';
        throw err;
      }

      // 3. Mark item complete
      await client.query(
        `UPDATE quest_items
         SET is_complete = true, completed_at = now()
         WHERE id = $1`,
        [itemId]
      );

      // 4. Award item reward via applyReward
      const itemProgression = await applyReward(client, userId, {
        xp: item.xp_reward,
        gold: item.gold_reward,
        sourceType: 'quest',
        sourceId: questId,
      });

      // 5. Insert audit completion record for item
      await client.query(
        `INSERT INTO quest_completions (quest_id, user_id, action_type, item_id, xp_awarded, gold_awarded, leveled_up, levels_gained, points_awarded)
         VALUES ($1, $2, 'item_complete', $3, $4, $5, $6, $7, $8)
         ON CONFLICT (item_id) WHERE action_type = 'item_complete' DO NOTHING`,
        [
          questId,
          userId,
          itemId,
          item.xp_reward,
          item.gold_reward,
          itemProgression.leveledUp,
          itemProgression.levelsGained || (itemProgression.leveledUp ? 1 : 0),
          itemProgression.unallocatedPoints || 0,
        ]
      );

      let latestProgression = itemProgression;
      const rewardsAwarded = [
        { type: 'item', title: item.title, xp: item.xp_reward, gold: item.gold_reward },
      ];

      // 6. Recalculate quest progress
      const countRes = await client.query(
        `SELECT COUNT(*) as total,
                COUNT(*) FILTER (WHERE is_complete = true) as completed
         FROM quest_items
         WHERE quest_id = $1`,
        [questId]
      );
      const totalItems = parseInt(countRes.rows[0].total, 10);
      const completedItems = parseInt(countRes.rows[0].completed, 10);
      const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 100;

      // 7. Check unreached milestones where threshold_percent <= progressPercent
      const milestoneRes = await client.query(
        `SELECT id, title, threshold_percent, xp_bonus, gold_bonus
         FROM quest_milestones
         WHERE quest_id = $1 AND is_reached = false AND threshold_percent <= $2
         ORDER BY threshold_percent ASC
         FOR UPDATE`,
        [questId, progressPercent]
      );

      for (const m of milestoneRes.rows) {
        await client.query(
          `UPDATE quest_milestones
           SET is_reached = true, reached_at = now()
           WHERE id = $1`,
          [m.id]
        );

        const milestoneProg = await applyReward(client, userId, {
          xp: m.xp_bonus,
          gold: m.gold_bonus,
          sourceType: 'quest',
          sourceId: questId,
        });
        latestProgression = milestoneProg;

        await client.query(
          `INSERT INTO quest_completions (quest_id, user_id, action_type, milestone_id, xp_awarded, gold_awarded, leveled_up, levels_gained, points_awarded)
           VALUES ($1, $2, 'milestone_reached', $3, $4, $5, $6, $7, $8)
           ON CONFLICT (milestone_id) WHERE action_type = 'milestone_reached' DO NOTHING`,
          [
            questId,
            userId,
            m.id,
            m.xp_bonus,
            m.gold_bonus,
            milestoneProg.leveledUp,
            milestoneProg.levelsGained || (milestoneProg.leveledUp ? 1 : 0),
            milestoneProg.unallocatedPoints || 0,
          ]
        );

        rewardsAwarded.push({
          type: 'milestone',
          title: `${m.threshold_percent}% - ${m.title}`,
          xp: m.xp_bonus,
          gold: m.gold_bonus,
        });
      }

      // 8. Auto-complete parent quest if all items are complete
      let parentCompleted = false;
      if (completedItems === totalItems && totalItems > 0 && quest.status !== 'completed') {
        await client.query(
          `UPDATE quests
           SET status = 'completed', completed_at = now()
           WHERE id = $1`,
          [questId]
        );

        const xpToAward = quest.reward_xp || calculateQuestReward(quest.difficulty).xp;
        const goldToAward = quest.reward_coins || calculateQuestReward(quest.difficulty).gold;

        const questProg = await applyReward(client, userId, {
          xp: xpToAward,
          gold: goldToAward,
          sourceType: 'quest',
          sourceId: questId,
        });
        latestProgression = questProg;

        await client.query(
          `INSERT INTO quest_completions (quest_id, user_id, action_type, xp_awarded, gold_awarded, leveled_up, levels_gained, points_awarded)
           VALUES ($1, $2, 'quest_complete', $3, $4, $5, $6, $7)
           ON CONFLICT (quest_id) WHERE action_type = 'quest_complete' DO NOTHING`,
          [
            questId,
            userId,
            xpToAward,
            goldToAward,
            questProg.leveledUp,
            questProg.levelsGained || (questProg.leveledUp ? 1 : 0),
            questProg.unallocatedPoints || 0,
          ]
        );

        rewardsAwarded.push({
          type: 'quest_complete',
          title: `Quest Complete: ${quest.title}`,
          xp: xpToAward,
          gold: goldToAward,
        });
        parentCompleted = true;
      }

      return {
        questId,
        itemId,
        progressPercent,
        parentCompleted,
        rewardsAwarded,
        character: latestProgression,
      };
    });
  }

  /**
   * Undoes a checklist item completion in a managed transaction.
   * Safely reverts the item's awarded XP and Gold using revertReward().
   *
   * @param {string} userId
   * @param {string} questId
   * @param {string} itemId
   * @returns {Promise<object>}
   */
  async undoQuestItem(userId, questId, itemId) {
    return withTransaction(async (client) => {
      const questRes = await client.query(
        `SELECT id, user_id, title, status FROM quests WHERE id = $1 AND user_id = $2 AND archived_at IS NULL FOR UPDATE`,
        [questId, userId]
      );
      if (questRes.rows.length === 0) {
        const err = new Error('Quest not found');
        err.status = 404;
        err.code = 'QUEST_NOT_FOUND';
        throw err;
      }
      const quest = questRes.rows[0];

      if (quest.status === 'completed') {
        const err = new Error('Cannot undo checklist item on a completed quest');
        err.status = 400;
        err.code = 'QUEST_ALREADY_COMPLETED';
        throw err;
      }

      const itemRes = await client.query(
        `SELECT id, quest_id, title, is_complete, xp_reward, gold_reward
         FROM quest_items
         WHERE id = $1 AND quest_id = $2 AND user_id = $3
         FOR UPDATE`,
        [itemId, questId, userId]
      );
      if (itemRes.rows.length === 0) {
        const err = new Error('Checklist item not found');
        err.status = 404;
        err.code = 'ITEM_NOT_FOUND';
        throw err;
      }
      const item = itemRes.rows[0];

      if (!item.is_complete) {
        const err = new Error('Item is not completed');
        err.status = 400;
        err.code = 'ITEM_NOT_COMPLETED';
        throw err;
      }

      await client.query(
        `UPDATE quest_items SET is_complete = false, completed_at = null WHERE id = $1`,
        [itemId]
      );

      const compRes = await client.query(
        `SELECT id, xp_awarded, gold_awarded, levels_gained, points_awarded
         FROM quest_completions
         WHERE item_id = $1 AND action_type = 'item_complete'`,
        [itemId]
      );

      let revertedProgression = null;
      if (compRes.rows.length > 0) {
        const comp = compRes.rows[0];
        revertedProgression = await revertReward(client, userId, {
          xpAwarded: comp.xp_awarded,
          goldAwarded: comp.gold_awarded,
          levelsGained: comp.levels_gained,
          pointsAwarded: comp.points_awarded,
        });

        await client.query(`DELETE FROM quest_completions WHERE id = $1`, [comp.id]);
      }

      const countRes = await client.query(
        `SELECT COUNT(*) as total,
                COUNT(*) FILTER (WHERE is_complete = true) as completed
         FROM quest_items
         WHERE quest_id = $1`,
        [questId]
      );
      const totalItems = parseInt(countRes.rows[0].total, 10);
      const completedItems = parseInt(countRes.rows[0].completed, 10);
      const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      return {
        questId,
        itemId,
        progressPercent,
        character: revertedProgression,
      };
    });
  }

  /**
   * Directly completes a quest.
   * Transactionally serialized with SELECT ... FOR UPDATE on quests.
   * Guarantees exact-once reward grant with 409 rejection on duplicate attempts.
   *
   * @param {string} userId
   * @param {string} questId
   * @param {import('pg').PoolClient} [existingClient=null]
   * @returns {Promise<object>}
   */
  async completeQuest(userId, questId, existingClient = null) {
    const execute = async (client) => {
      // 1. Lock quest row
      const questRes = await client.query(
        `SELECT id, user_id, title, difficulty, status, progress_mode, target_value, current_value,
                reward_xp, reward_coins
         FROM quests
         WHERE id = $1 AND user_id = $2 AND archived_at IS NULL
         FOR UPDATE`,
        [questId, userId]
      );
      if (questRes.rows.length === 0) {
        const err = new Error('Quest not found');
        err.status = 404;
        err.code = 'QUEST_NOT_FOUND';
        throw err;
      }
      const quest = questRes.rows[0];

      if (quest.status === 'completed') {
        const err = new Error('Quest is already completed');
        err.status = 409;
        err.code = 'QUEST_ALREADY_COMPLETED';
        throw err;
      }

      // 2. Mark quest completed
      await client.query(
        `UPDATE quests
         SET status = 'completed', completed_at = now(), current_value = target_value
         WHERE id = $1`,
        [questId]
      );

      // 3. Mark any remaining items complete
      await client.query(
        `UPDATE quest_items
         SET is_complete = true, completed_at = now()
         WHERE quest_id = $1 AND is_complete = false`,
        [questId]
      );

      // 4. Mark all unreached milestones as reached
      const milestoneRes = await client.query(
        `SELECT id, title, threshold_percent, xp_bonus, gold_bonus
         FROM quest_milestones
         WHERE quest_id = $1 AND is_reached = false
         ORDER BY threshold_percent ASC
         FOR UPDATE`,
        [questId]
      );

      let latestProgression = null;
      const rewardsAwarded = [];

      for (const m of milestoneRes.rows) {
        await client.query(
          `UPDATE quest_milestones SET is_reached = true, reached_at = now() WHERE id = $1`,
          [m.id]
        );
        const mProg = await applyReward(client, userId, {
          xp: m.xp_bonus,
          gold: m.gold_bonus,
          sourceType: 'quest',
          sourceId: questId,
        });
        latestProgression = mProg;

        await client.query(
          `INSERT INTO quest_completions (quest_id, user_id, action_type, milestone_id, xp_awarded, gold_awarded, leveled_up, levels_gained, points_awarded)
           VALUES ($1, $2, 'milestone_reached', $3, $4, $5, $6, $7, $8)
           ON CONFLICT (milestone_id) WHERE action_type = 'milestone_reached' DO NOTHING`,
          [
            questId,
            userId,
            m.id,
            m.xp_bonus,
            m.gold_bonus,
            mProg.leveledUp,
            mProg.levelsGained || (mProg.leveledUp ? 1 : 0),
            mProg.unallocatedPoints || 0,
          ]
        );

        rewardsAwarded.push({
          type: 'milestone',
          title: `${m.threshold_percent}% - ${m.title}`,
          xp: m.xp_bonus,
          gold: m.gold_bonus,
        });
      }

      // 5. Award parent quest completion reward
      const xpToAward = quest.reward_xp || calculateQuestReward(quest.difficulty).xp;
      const goldToAward = quest.reward_coins || calculateQuestReward(quest.difficulty).gold;

      const questProg = await applyReward(client, userId, {
        xp: xpToAward,
        gold: goldToAward,
        sourceType: 'quest',
        sourceId: questId,
      });
      latestProgression = questProg;

      await client.query(
        `INSERT INTO quest_completions (quest_id, user_id, action_type, xp_awarded, gold_awarded, leveled_up, levels_gained, points_awarded)
         VALUES ($1, $2, 'quest_complete', $3, $4, $5, $6, $7)
         ON CONFLICT (quest_id) WHERE action_type = 'quest_complete' DO NOTHING`,
        [
          questId,
          userId,
          xpToAward,
          goldToAward,
          questProg.leveledUp,
          questProg.levelsGained || (questProg.leveledUp ? 1 : 0),
          questProg.unallocatedPoints || 0,
        ]
      );

      rewardsAwarded.push({
        type: 'quest_complete',
        title: `Quest Complete: ${quest.title}`,
        xp: xpToAward,
        gold: goldToAward,
      });

      return {
        questId,
        parentCompleted: true,
        rewardsAwarded,
        character: latestProgression,
      };
    };

    if (existingClient) {
      return execute(existingClient);
    }
    return withTransaction(execute);
  }
}

export const questService = new QuestService();
