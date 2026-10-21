import { query, withTransaction } from '../db/pool.js';
import { applyReward } from './progression.service.js';

export const TASK_STATUSES = ['inbox', 'todo', 'in_progress', 'completed', 'cancelled'];
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'];
export const TASK_DIFFICULTIES = ['trivial', 'easy', 'medium', 'hard'];

const REWARD_MAP = {
  trivial: { xp: 5, gold: 2 },
  easy: { xp: 10, gold: 5 },
  medium: { xp: 20, gold: 10 },
  hard: { xp: 40, gold: 20 },
};

export class TaskService {
  /**
   * Create a new task (supports quick capture and subtasks)
   */
  async createTask(userId, data) {
    const title = (data.title || '').trim();
    if (!title) {
      const err = new Error('Task title is required');
      err.status = 400;
      err.code = 'INVALID_TITLE';
      throw err;
    }

    const status = TASK_STATUSES.includes(data.status) ? data.status : (data.isInbox ? 'inbox' : 'todo');
    const priority = TASK_PRIORITIES.includes(data.priority) ? data.priority : 'medium';
    const difficulty = TASK_DIFFICULTIES.includes(data.difficulty) ? data.difficulty : 'easy';
    const rewards = REWARD_MAP[difficulty] || REWARD_MAP.easy;

    const res = await query(
      `INSERT INTO tasks (
        user_id, title, description, status, priority, difficulty,
        due_date, start_date, scheduled_time, estimated_duration_minutes,
        project_name, tags, parent_id, position, xp_reward, gold_reward
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING
        id, user_id as "userId", title, description, status, priority, difficulty,
        due_date as "dueDate", start_date as "startDate", scheduled_time as "scheduledTime",
        estimated_duration_minutes as "estimatedDurationMinutes",
        actual_duration_minutes as "actualDurationMinutes",
        project_name as "projectName", tags, parent_id as "parentId",
        position, xp_reward as "xpReward", gold_reward as "goldReward",
        completed_at as "completedAt", created_at as "createdAt", updated_at as "updatedAt"`,
      [
        userId,
        title,
        data.description || null,
        status,
        priority,
        difficulty,
        data.dueDate ? new Date(data.dueDate) : null,
        data.startDate ? new Date(data.startDate) : null,
        data.scheduledTime || null,
        data.estimatedDurationMinutes ? parseInt(data.estimatedDurationMinutes, 10) : 30,
        (data.projectName || 'General').trim(),
        Array.isArray(data.tags) ? data.tags : [],
        data.parentId || null,
        data.position || 0,
        rewards.xp,
        rewards.gold,
      ]
    );

    const task = res.rows[0];

    // Subtasks batch creation if provided
    if (Array.isArray(data.subtasks) && data.subtasks.length > 0) {
      const subtaskResults = [];
      for (let i = 0; i < data.subtasks.length; i++) {
        const sub = data.subtasks[i];
        const subTitle = typeof sub === 'string' ? sub.trim() : (sub?.title || '').trim();
        if (subTitle) {
          const subRes = await query(
            `INSERT INTO tasks (user_id, title, status, priority, difficulty, parent_id, position, project_name)
             VALUES ($1, $2, 'todo', 'low', 'trivial', $3, $4, $5)
             RETURNING id, title, status, position`,
            [userId, subTitle, task.id, i, task.projectName]
          );
          subtaskResults.push(subRes.rows[0]);
        }
      }
      task.subtasks = subtaskResults;
    } else {
      task.subtasks = [];
    }

    return task;
  }

  /**
   * List tasks with rich filtering, search, and grouping
   */
  async listTasks(userId, filters = {}) {
    const conditions = ['t.user_id = $1', 't.parent_id IS NULL'];
    const params = [userId];
    let pIdx = 2;

    if (filters.status) {
      if (filters.status === 'active') {
        conditions.push(`t.status IN ('inbox', 'todo', 'in_progress')`);
      } else if (filters.status === 'completed') {
        conditions.push(`t.status = 'completed'`);
      } else if (TASK_STATUSES.includes(filters.status)) {
        conditions.push(`t.status = $${pIdx}`);
        params.push(filters.status);
        pIdx++;
      }
    }

    if (filters.projectName) {
      conditions.push(`t.project_name = $${pIdx}`);
      params.push(filters.projectName);
      pIdx++;
    }

    if (filters.priority && TASK_PRIORITIES.includes(filters.priority)) {
      conditions.push(`t.priority = $${pIdx}`);
      params.push(filters.priority);
      pIdx++;
    }

    if (filters.search) {
      conditions.push(`(t.title ILIKE $${pIdx} OR t.description ILIKE $${pIdx})`);
      params.push(`%${filters.search}%`);
      pIdx++;
    }

    if (filters.filterType === 'today') {
      conditions.push(`(t.due_date::date = CURRENT_DATE OR t.start_date::date = CURRENT_DATE)`);
    } else if (filters.filterType === 'overdue') {
      conditions.push(`(t.due_date < now() AND t.status != 'completed')`);
    } else if (filters.filterType === 'upcoming') {
      conditions.push(`(t.due_date >= now() AND t.due_date <= (now() + interval '7 days') AND t.status != 'completed')`);
    } else if (filters.filterType === 'inbox') {
      conditions.push(`t.status = 'inbox'`);
    }

    const whereClause = conditions.join(' AND ');

    const sql = `
      SELECT
        t.id, t.user_id as "userId", t.title, t.description, t.status, t.priority, t.difficulty,
        t.due_date as "dueDate", t.start_date as "startDate", t.scheduled_time as "scheduledTime",
        t.estimated_duration_minutes as "estimatedDurationMinutes",
        t.actual_duration_minutes as "actualDurationMinutes",
        t.project_name as "projectName", t.tags, t.parent_id as "parentId",
        t.position, t.xp_reward as "xpReward", t.gold_reward as "goldReward",
        t.completed_at as "completedAt", t.created_at as "createdAt", t.updated_at as "updatedAt",
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', st.id,
            'title', st.title,
            'status', st.status,
            'position', st.position
          ) ORDER BY st.position ASC)
          FROM tasks st WHERE st.parent_id = t.id), '[]'::json
        ) as subtasks
      FROM tasks t
      WHERE ${whereClause}
      ORDER BY
        CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END ASC,
        t.due_date ASC NULLS LAST,
        t.position ASC,
        t.created_at DESC
    `;

    const { rows } = await query(sql, params);
    return rows;
  }

  /**
   * Get single task with subtasks
   */
  async getTask(userId, taskId) {
    const res = await query(
      `SELECT
        t.id, t.user_id as "userId", t.title, t.description, t.status, t.priority, t.difficulty,
        t.due_date as "dueDate", t.start_date as "startDate", t.scheduled_time as "scheduledTime",
        t.estimated_duration_minutes as "estimatedDurationMinutes",
        t.actual_duration_minutes as "actualDurationMinutes",
        t.project_name as "projectName", t.tags, t.parent_id as "parentId",
        t.position, t.xp_reward as "xpReward", t.gold_reward as "goldReward",
        t.completed_at as "completedAt", t.created_at as "createdAt", t.updated_at as "updatedAt",
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', st.id,
            'title', st.title,
            'status', st.status,
            'position', st.position
          ) ORDER BY st.position ASC)
          FROM tasks st WHERE st.parent_id = t.id), '[]'::json
        ) as subtasks
      FROM tasks t
      WHERE t.id = $1 AND t.user_id = $2`,
      [taskId, userId]
    );

    if (res.rows.length === 0) {
      const err = new Error('Task not found');
      err.status = 404;
      err.code = 'TASK_NOT_FOUND';
      throw err;
    }

    return res.rows[0];
  }

  /**
   * Update task fields safely
   */
  async updateTask(userId, taskId, data) {
    const existing = await this.getTask(userId, taskId);

    const title = data.title !== undefined ? data.title.trim() : existing.title;
    const description = data.description !== undefined ? data.description : existing.description;
    const status = data.status && TASK_STATUSES.includes(data.status) ? data.status : existing.status;
    const priority = data.priority && TASK_PRIORITIES.includes(data.priority) ? data.priority : existing.priority;
    const difficulty = data.difficulty && TASK_DIFFICULTIES.includes(data.difficulty) ? data.difficulty : existing.difficulty;
    const dueDate = data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : existing.dueDate;
    const startDate = data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : existing.startDate;
    const scheduledTime = data.scheduledTime !== undefined ? data.scheduledTime : existing.scheduledTime;
    const estimatedDuration = data.estimatedDurationMinutes !== undefined ? parseInt(data.estimatedDurationMinutes, 10) : existing.estimatedDurationMinutes;
    const projectName = data.projectName !== undefined ? data.projectName.trim() : existing.projectName;
    const tags = Array.isArray(data.tags) ? data.tags : existing.tags;

    const res = await query(
      `UPDATE tasks
       SET title = $1, description = $2, status = $3, priority = $4, difficulty = $5,
           due_date = $6, start_date = $7, scheduled_time = $8,
           estimated_duration_minutes = $9, project_name = $10, tags = $11, updated_at = now()
       WHERE id = $12 AND user_id = $13
       RETURNING
        id, user_id as "userId", title, description, status, priority, difficulty,
        due_date as "dueDate", start_date as "startDate", scheduled_time as "scheduledTime",
        estimated_duration_minutes as "estimatedDurationMinutes",
        actual_duration_minutes as "actualDurationMinutes",
        project_name as "projectName", tags, parent_id as "parentId",
        position, xp_reward as "xpReward", gold_reward as "goldReward",
        completed_at as "completedAt", created_at as "createdAt", updated_at as "updatedAt"`,
      [
        title, description, status, priority, difficulty,
        dueDate, startDate, scheduledTime, estimatedDuration, projectName, tags,
        taskId, userId
      ]
    );

    return res.rows[0];
  }

  /**
   * Complete task with strict idempotency and authoritative progression reward
   */
  async completeTask(userId, taskId) {
    return withTransaction(async (client) => {
      // 1. Lock task row
      const { rows } = await client.query(
        `SELECT id, user_id, title, status, difficulty, xp_reward, gold_reward, completed_at
         FROM tasks
         WHERE id = $1 AND user_id = $2
         FOR UPDATE`,
        [taskId, userId]
      );

      if (rows.length === 0) {
        const err = new Error('Task not found');
        err.status = 404;
        err.code = 'TASK_NOT_FOUND';
        throw err;
      }

      const task = rows[0];

      // 2. Check if already completed (Idempotency)
      const existingComp = await client.query(
        `SELECT id, xp_awarded, gold_awarded FROM task_completions WHERE task_id = $1`,
        [taskId]
      );

      if (existingComp.rows.length > 0 || task.status === 'completed') {
        return {
          task: { ...task, status: 'completed' },
          reward: { xp: 0, gold: 0 },
          alreadyCompleted: true,
          message: 'Task is already completed.',
        };
      }

      const xp = task.xp_reward || 10;
      const gold = task.gold_reward || 5;

      // 3. Atomically apply progression reward via central applyReward()
      const rewardResult = await applyReward(client, userId, {
        xp,
        gold,
        sourceType: 'quest',
        sourceId: taskId,
      });

      // 4. Mark task completed
      const updateRes = await client.query(
        `UPDATE tasks
         SET status = 'completed', completed_at = now(), updated_at = now()
         WHERE id = $1
         RETURNING id, user_id as "userId", title, status, completed_at as "completedAt"`,
        [taskId]
      );

      // 5. Insert completion record to ensure strict single-grant idempotency
      await client.query(
        `INSERT INTO task_completions (task_id, user_id, xp_awarded, gold_awarded)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (task_id) DO NOTHING`,
        [taskId, userId, xp, gold]
      );

      return {
        task: updateRes.rows[0],
        reward: {
          xp,
          gold,
          leveledUp: rewardResult.leveledUp,
          newLevel: rewardResult.newLevel,
        },
        character: {
          level: rewardResult.newLevel,
          xp: rewardResult.newXp,
          gold: rewardResult.newGold,
        },
        alreadyCompleted: false,
      };
    });
  }

  /**
   * Revert task completion
   */
  async uncompleteTask(userId, taskId) {
    return withTransaction(async (client) => {
      const { rows } = await client.query(
        `SELECT id, status FROM tasks WHERE id = $1 AND user_id = $2 FOR UPDATE`,
        [taskId, userId]
      );

      if (rows.length === 0) {
        const err = new Error('Task not found');
        err.status = 404;
        err.code = 'TASK_NOT_FOUND';
        throw err;
      }

      await client.query(
        `UPDATE tasks
         SET status = 'todo', completed_at = NULL, updated_at = now()
         WHERE id = $1`,
        [taskId]
      );

      await client.query(`DELETE FROM task_completions WHERE task_id = $1`, [taskId]);

      return { success: true, message: 'Task restored to active.' };
    });
  }

  /**
   * Delete task and subtasks
   */
  async deleteTask(userId, taskId) {
    const res = await query(
      `DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id`,
      [taskId, userId]
    );

    if (res.rows.length === 0) {
      const err = new Error('Task not found');
      err.status = 404;
      err.code = 'TASK_NOT_FOUND';
      throw err;
    }

    return { success: true, id: taskId };
  }

  /**
   * Summary counts for quick navigation filters
   */
  async getSummary(userId) {
    const res = await query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'inbox') as inbox_count,
        COUNT(*) FILTER (WHERE status IN ('inbox', 'todo', 'in_progress')) as active_count,
        COUNT(*) FILTER (WHERE due_date::date = CURRENT_DATE AND status != 'completed') as today_count,
        COUNT(*) FILTER (WHERE due_date < now() AND status != 'completed') as overdue_count,
        COUNT(*) FILTER (WHERE due_date >= now() AND due_date <= (now() + interval '7 days') AND status != 'completed') as upcoming_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count
       FROM tasks
       WHERE user_id = $1 AND parent_id IS NULL`,
      [userId]
    );

    const projectsRes = await query(
      `SELECT project_name as name, COUNT(*) as count
       FROM tasks
       WHERE user_id = $1 AND parent_id IS NULL AND status != 'completed'
       GROUP BY project_name
       ORDER BY count DESC`,
      [userId]
    );

    const s = res.rows[0];
    return {
      inbox: parseInt(s.inbox_count || 0, 10),
      active: parseInt(s.active_count || 0, 10),
      today: parseInt(s.today_count || 0, 10),
      overdue: parseInt(s.overdue_count || 0, 10),
      upcoming: parseInt(s.upcoming_count || 0, 10),
      completed: parseInt(s.completed_count || 0, 10),
      projects: projectsRes.rows.map((p) => ({ name: p.name, count: parseInt(p.count, 10) })),
    };
  }
}

export const taskService = new TaskService();
