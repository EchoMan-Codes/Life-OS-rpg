import { query, withTransaction } from '../db/pool.js';
import { applyReward, revertReward } from './progression.service.js';
import { calculateQuestReward, CHECKLIST_ITEM_REWARD, MILESTONE_REWARDS } from './reward-table.js';

export class QuestService {
  /**
   * Lists quests for an authenticated user, with attached subtask items, milestones,
   * and dynamically computed progress percentage.
   *
   * @param {string} userId - User UUID
   * @param {object} [filters={}]
   * @param {'active' | 'completed' | 'all'} [filters.status='active']
   * @returns {Promise<Array<object>>}
   */
  async listQuests(userId, { status = 'active' } = {}) {
    let statusClause = "AND q.status = 'active'";
    if (status === 'completed') {
      statusClause = "AND q.status = 'completed'";
    } else if (status === 'all') {
      statusClause = "AND q.status IN ('active', 'completed')";
    }

    const sql = `
      SELECT q.id, q.user_id, q.title, q.description, q.priority, q.difficulty,
             q.due_date::text as due_date, q.status, q.position,
             q.created_at, q.completed_at, q.archived_at,
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
      WHERE q.user_id = $1
        AND q.archived_at IS NULL
        ${statusClause}
      GROUP BY q.id
      ORDER BY q.position ASC, q.created_at DESC
    `;

    const { rows } = await query(sql, [userId]);

    // Fetch milestones for all returned quests in one batch
    if (rows.length === 0) return [];

    const questIds = rows.map((r) => r.id);
    const { rows: milestoneRows } = await query(
      `SELECT id, quest_id, title, threshold_percent, is_reached, xp_bonus, gold_bonus, reached_at
       FROM quest_milestones
       WHERE quest_id = ANY($1)
       ORDER BY threshold_percent ASC`,
      [questIds]
    );

    const milestonesByQuest = {};
    for (const m of milestoneRows) {
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

    return rows.map((q) => {
      const items = q.items || [];
      const totalItems = items.length;
      const completedItems = items.filter((i) => i.isComplete).length;
      const progressPercent = totalItems > 0
        ? Math.round((completedItems / totalItems) * 100)
        : q.status === 'completed' ? 100 : 0;

      const milestones = milestonesByQuest[q.id] || [];
      const questReward = calculateQuestReward(q.difficulty);

      return {
        id: q.id,
        userId: q.user_id,
        title: q.title,
        description: q.description,
        priority: q.priority,
        difficulty: q.difficulty,
        dueDate: q.due_date,
        status: q.status,
        position: q.position,
        createdAt: q.created_at,
        completedAt: q.completed_at,
        progressPercent,
        totalItems,
        completedItems,
        reward: questReward,
        items,
        milestones,
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
    const quests = await this.listQuests(userId, { status: 'all' });
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
   * Creates a new quest, standard milestone thresholds (25%, 50%, 75%, 100%),
   * and any optional initial checklist subtasks in a single transaction.
   *
   * @param {string} userId - User UUID
   * @param {object} params
   * @param {string} params.title
   * @param {string} [params.description]
   * @param {'low' | 'medium' | 'high' | 'critical'} [params.priority='medium']
   * @param {'trivial' | 'easy' | 'medium' | 'hard'} [params.difficulty='medium']
   * @param {string} [params.dueDate]
   * @param {Array<string | { title: string }>} [params.items=[]]
   * @returns {Promise<object>}
   */
  async createQuest(userId, { title, description, priority = 'medium', difficulty = 'medium', dueDate, items = [] }) {
    return withTransaction(async (client) => {
      // 1. Determine next position
      const posRes = await client.query(
        'SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM quests WHERE user_id = $1 AND archived_at IS NULL',
        [userId]
      );
      const nextPos = posRes.rows[0].next_pos;

      // 2. Insert quest
      const insertQuestRes = await client.query(
        `INSERT INTO quests (user_id, title, description, priority, difficulty, due_date, position)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, user_id, title, description, priority, difficulty,
                   due_date::text as due_date, status, position, created_at, completed_at`,
        [userId, title.trim(), description?.trim() || null, priority, difficulty, dueDate || null, nextPos]
      );
      const quest = insertQuestRes.rows[0];

      // 3. Insert standard milestones: 25%, 50%, 75%, 100%
      const defaultMilestones = [
        { title: 'First Steps', percent: 25, ...MILESTONE_REWARDS[25] },
        { title: 'Halfway Mark', percent: 50, ...MILESTONE_REWARDS[50] },
        { title: 'The Home Stretch', percent: 75, ...MILESTONE_REWARDS[75] },
        { title: 'Grand Triumph', percent: 100, ...MILESTONE_REWARDS[100] },
      ];

      for (const m of defaultMilestones) {
        await client.query(
          `INSERT INTO quest_milestones (quest_id, user_id, title, threshold_percent, xp_bonus, gold_bonus)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [quest.id, userId, m.title, m.percent, m.xp, m.gold]
        );
      }

      // 4. Insert initial items if provided
      if (Array.isArray(items) && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const itemTitle = typeof items[i] === 'string' ? items[i] : items[i].title;
          if (itemTitle && itemTitle.trim()) {
            await client.query(
              `INSERT INTO quest_items (quest_id, user_id, title, position, xp_reward, gold_reward)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [quest.id, userId, itemTitle.trim(), i, CHECKLIST_ITEM_REWARD.xp, CHECKLIST_ITEM_REWARD.gold]
            );
          }
        }
      }

      return quest.id;
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
  async updateQuest(userId, questId, { title, description, priority, difficulty, dueDate }) {
    const fields = [];
    const values = [questId, userId];
    let idx = 3;

    if (title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(title.trim());
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
    if (dueDate !== undefined) {
      fields.push(`due_date = $${idx++}`);
      values.push(dueDate || null);
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
    // Verify quest ownership
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
      // Verify quest ownership
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
      // 1. Lock quest row first to enforce consistent lock order (quests -> character_stats)
      const questRes = await client.query(
        `SELECT id, user_id, title, difficulty, status
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
         VALUES ($1, $2, 'item_complete', $3, $4, $5, $6, $7, $8)`,
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
           VALUES ($1, $2, 'milestone_reached', $3, $4, $5, $6, $7, $8)`,
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

        const questReward = calculateQuestReward(quest.difficulty);
        const questProg = await applyReward(client, userId, {
          xp: questReward.xp,
          gold: questReward.gold,
          sourceType: 'quest',
          sourceId: questId,
        });
        latestProgression = questProg;

        await client.query(
          `INSERT INTO quest_completions (quest_id, user_id, action_type, xp_awarded, gold_awarded, leveled_up, levels_gained, points_awarded)
           VALUES ($1, $2, 'quest_complete', $3, $4, $5, $6, $7)`,
          [
            questId,
            userId,
            questReward.xp,
            questReward.gold,
            questProg.leveledUp,
            questProg.levelsGained || (questProg.leveledUp ? 1 : 0),
            questProg.unallocatedPoints || 0,
          ]
        );

        rewardsAwarded.push({
          type: 'quest_complete',
          title: `Quest Complete: ${quest.title}`,
          xp: questReward.xp,
          gold: questReward.gold,
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
   * Previously reached milestone rewards are permanently preserved per rule:
   * "If an item is undone and progress falls below a previously reached milestone,
   * do NOT automatically award that milestone again when progress later crosses the threshold."
   *
   * @param {string} userId
   * @param {string} questId
   * @param {string} itemId
   * @returns {Promise<object>}
   */
  async undoQuestItem(userId, questId, itemId) {
    return withTransaction(async (client) => {
      // 1. Lock quest row
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

      if (!item.is_complete) {
        const err = new Error('Item is not completed');
        err.status = 400;
        err.code = 'ITEM_NOT_COMPLETED';
        throw err;
      }

      // 3. Mark item incomplete
      await client.query(
        `UPDATE quest_items SET is_complete = false, completed_at = null WHERE id = $1`,
        [itemId]
      );

      // 4. Find item completion record and revert reward
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

      // 5. Recalculate progress
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
   * Directly completes a quest (for zero-item quests or manual trigger).
   * Transactionally serialized with SELECT ... FOR UPDATE.
   * Guarantees exact-once reward grant with 409 rejection on duplicate attempts.
   *
   * @param {string} userId
   * @param {string} questId
   * @returns {Promise<object>}
   */
  async completeQuest(userId, questId) {
    return withTransaction(async (client) => {
      // 1. Lock quest row
      const questRes = await client.query(
        `SELECT id, user_id, title, difficulty, status
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
         SET status = 'completed', completed_at = now()
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
           VALUES ($1, $2, 'milestone_reached', $3, $4, $5, $6, $7, $8)`,
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
      const questReward = calculateQuestReward(quest.difficulty);
      const questProg = await applyReward(client, userId, {
        xp: questReward.xp,
        gold: questReward.gold,
        sourceType: 'quest',
        sourceId: questId,
      });
      latestProgression = questProg;

      await client.query(
        `INSERT INTO quest_completions (quest_id, user_id, action_type, xp_awarded, gold_awarded, leveled_up, levels_gained, points_awarded)
         VALUES ($1, $2, 'quest_complete', $3, $4, $5, $6, $7)`,
        [
          questId,
          userId,
          questReward.xp,
          questReward.gold,
          questProg.leveledUp,
          questProg.levelsGained || (questProg.leveledUp ? 1 : 0),
          questProg.unallocatedPoints || 0,
        ]
      );

      rewardsAwarded.push({
        type: 'quest_complete',
        title: `Quest Complete: ${quest.title}`,
        xp: questReward.xp,
        gold: questReward.gold,
      });

      return {
        questId,
        parentCompleted: true,
        rewardsAwarded,
        character: latestProgression,
      };
    });
  }
}

export const questService = new QuestService();
