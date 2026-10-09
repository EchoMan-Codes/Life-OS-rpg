import { query, withTransaction } from '../db/pool.js';
import { applyReward } from './progression.service.js';

export const ALLOWED_AMBIENTS = ['rain', 'lofi', 'silence'];

export class FocusService {
  /**
   * Starts a new focus session.
   * Enforces DB-level and service-level single active session rule per user.
   */
  async startSession(userId, {
    plannedDurationSeconds = 1500,
    ambientSound = 'silence',
    taskId = null,
    taskType = 'task',
    taskTitle = null,
    sessionType = 'focus',
  }) {
    const plannedSec = Math.max(60, Math.min(14400, parseInt(plannedDurationSeconds, 10) || 1500));
    const sound = ALLOWED_AMBIENTS.includes(ambientSound) ? ambientSound : 'silence';
    const sType = ['focus', 'short_break', 'long_break'].includes(sessionType) ? sessionType : 'focus';

    // 1. Proactive check for existing active session
    const existing = await query(
      `SELECT id, user_id as "userId", started_at as "startedAt",
              planned_duration_seconds as "plannedDurationSeconds",
              ambient_sound as "ambientSound", completed,
              mana_regenerated as "manaRegenerated",
              task_id as "taskId", task_type as "taskType", task_title as "taskTitle",
              session_type as "sessionType", paused_at as "pausedAt",
              total_paused_seconds as "totalPausedSeconds"
       FROM focus_sessions
       WHERE user_id = $1 AND ended_at IS NULL`,
      [userId]
    );

    if (existing.rows.length > 0) {
      const active = existing.rows[0];
      const now = Date.now();
      const started = new Date(active.startedAt).getTime();
      let pausedOffset = active.totalPausedSeconds || 0;
      if (active.pausedAt) {
        pausedOffset += Math.floor((now - new Date(active.pausedAt).getTime()) / 1000);
      }
      const rawElapsed = Math.max(0, Math.floor((now - started) / 1000));
      const activeElapsed = Math.max(0, rawElapsed - pausedOffset);
      const remaining = Math.max(0, active.plannedDurationSeconds - activeElapsed);

      const err = new Error('An active focus session is already in progress');
      err.status = 409;
      err.code = 'ACTIVE_SESSION_EXISTS';
      err.details = {
        session: {
          ...active,
          elapsedSeconds: activeElapsed,
          remainingSeconds: remaining,
          isPaused: Boolean(active.pausedAt),
          serverTime: new Date(now).toISOString(),
        },
      };
      throw err;
    }

    // 2. Insert new session
    try {
      const { rows } = await query(
        `INSERT INTO focus_sessions (
          user_id, planned_duration_seconds, ambient_sound,
          task_id, task_type, task_title, session_type
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, user_id as "userId", started_at as "startedAt",
                  ended_at as "endedAt", planned_duration_seconds as "plannedDurationSeconds",
                  ambient_sound as "ambientSound", completed,
                  mana_regenerated as "manaRegenerated",
                  task_id as "taskId", task_type as "taskType", task_title as "taskTitle",
                  session_type as "sessionType", paused_at as "pausedAt",
                  total_paused_seconds as "totalPausedSeconds"`,
        [userId, plannedSec, sound, taskId, taskType, taskTitle, sType]
      );

      const session = rows[0];
      return {
        ...session,
        remainingSeconds: session.plannedDurationSeconds,
        elapsedSeconds: 0,
        isPaused: false,
        serverTime: new Date().toISOString(),
      };
    } catch (err) {
      if (err.code === '23505') {
        const conflictErr = new Error('An active focus session is already in progress');
        conflictErr.status = 409;
        conflictErr.code = 'ACTIVE_SESSION_EXISTS';
        throw conflictErr;
      }
      throw err;
    }
  }

  /**
   * Pause active session
   */
  async pauseSession(userId, sessionId) {
    return withTransaction(async (client) => {
      const { rows } = await client.query(
        `SELECT id, ended_at, paused_at FROM focus_sessions WHERE id = $1 AND user_id = $2 FOR UPDATE`,
        [sessionId, userId]
      );

      if (rows.length === 0) {
        const err = new Error('Focus session not found');
        err.status = 404;
        err.code = 'SESSION_NOT_FOUND';
        throw err;
      }

      const s = rows[0];
      if (s.ended_at !== null) {
        const err = new Error('Focus session has already ended');
        err.status = 409;
        err.code = 'SESSION_ALREADY_ENDED';
        throw err;
      }

      if (s.paused_at !== null) {
        return { id: sessionId, isPaused: true, message: 'Session already paused.' };
      }

      const updateRes = await client.query(
        `UPDATE focus_sessions SET paused_at = now() WHERE id = $1 RETURNING id, paused_at as "pausedAt"`,
        [sessionId]
      );

      return { id: sessionId, isPaused: true, pausedAt: updateRes.rows[0].pausedAt };
    });
  }

  /**
   * Resume paused session
   */
  async resumeSession(userId, sessionId) {
    return withTransaction(async (client) => {
      const { rows } = await client.query(
        `SELECT id, ended_at, paused_at, total_paused_seconds FROM focus_sessions WHERE id = $1 AND user_id = $2 FOR UPDATE`,
        [sessionId, userId]
      );

      if (rows.length === 0) {
        const err = new Error('Focus session not found');
        err.status = 404;
        err.code = 'SESSION_NOT_FOUND';
        throw err;
      }

      const s = rows[0];
      if (s.ended_at !== null) {
        const err = new Error('Focus session has already ended');
        err.status = 409;
        err.code = 'SESSION_ALREADY_ENDED';
        throw err;
      }

      if (!s.paused_at) {
        return { id: sessionId, isPaused: false, message: 'Session is not paused.' };
      }

      const pauseDuration = Math.max(0, Math.floor((Date.now() - new Date(s.paused_at).getTime()) / 1000));
      const totalPaused = (s.total_paused_seconds || 0) + pauseDuration;

      await client.query(
        `UPDATE focus_sessions SET paused_at = NULL, total_paused_seconds = $1 WHERE id = $2`,
        [totalPaused, sessionId]
      );

      return { id: sessionId, isPaused: false, totalPausedSeconds: totalPaused };
    });
  }

  /**
   * Completes an active focus session atomically under row locks.
   * Enforces server-authoritative elapsed active time verification (anti-tamper).
   */
  async completeSession(userId, sessionId) {
    return withTransaction(async (client) => {
      // 1. Lock session row for update
      const { rows } = await client.query(
        `SELECT id, user_id, started_at, ended_at, planned_duration_seconds,
                ambient_sound, completed, mana_regenerated,
                task_id, task_type, session_type, paused_at, total_paused_seconds
         FROM focus_sessions
         WHERE id = $1 AND user_id = $2
         FOR UPDATE`,
        [sessionId, userId]
      );

      if (rows.length === 0) {
        const err = new Error('Focus session not found');
        err.status = 404;
        err.code = 'SESSION_NOT_FOUND';
        throw err;
      }

      const session = rows[0];

      if (session.ended_at !== null || session.completed) {
        const err = new Error('Focus session is already ended or completed');
        err.status = 409;
        err.code = 'SESSION_ALREADY_ENDED';
        throw err;
      }

      // 2. Server-authoritative anti-tamper check (exclude paused duration)
      const now = Date.now();
      const startedAt = new Date(session.started_at).getTime();
      let totalPaused = session.total_paused_seconds || 0;
      if (session.paused_at) {
        totalPaused += Math.floor((now - new Date(session.paused_at).getTime()) / 1000);
      }

      const activeElapsedSeconds = Math.max(0, (now - startedAt) / 1000 - totalPaused);

      // Allow 3 seconds grace for network latency
      if (activeElapsedSeconds < session.planned_duration_seconds - 3) {
        const err = new Error('Cannot complete session before planned active duration has elapsed');
        err.status = 400;
        err.code = 'EARLY_COMPLETION_REJECTED';
        err.details = {
          activeElapsedSeconds: Math.floor(activeElapsedSeconds),
          plannedDurationSeconds: session.planned_duration_seconds,
          remainingSeconds: Math.max(0, Math.ceil(session.planned_duration_seconds - activeElapsedSeconds)),
        };
        throw err;
      }

      // 3. Compute theoretical mana: Math.round(minutes * 1.5)
      const actualMinutes = Math.round(activeElapsedSeconds / 60);
      const theoreticalMana = Math.round((session.planned_duration_seconds / 60) * 1.5);

      // 4. Atomically apply mana reward to character_stats (row lock + clamp to max_mana)
      const rewardResult = await applyReward(client, userId, {
        mana: theoreticalMana,
        skipBattleEvent: true,
      });

      const actualManaRestored = rewardResult.actualManaRestored;

      // 5. Update session record
      const updateRes = await client.query(
        `UPDATE focus_sessions
         SET completed = true, ended_at = now(), mana_regenerated = $1,
             actual_duration_seconds = $2, paused_at = NULL, total_paused_seconds = $3
         WHERE id = $4
         RETURNING id, user_id as "userId", started_at as "startedAt",
                   ended_at as "endedAt", planned_duration_seconds as "plannedDurationSeconds",
                   ambient_sound as "ambientSound", completed,
                   mana_regenerated as "manaRegenerated",
                   actual_duration_seconds as "actualDurationSeconds",
                   task_id as "taskId", task_type as "taskType"`,
        [actualManaRestored, Math.floor(activeElapsedSeconds), totalPaused, sessionId]
      );

      // 6. If linked to a task, update task actual duration
      if (session.task_id && session.task_type === 'task') {
        await client.query(
          `UPDATE tasks
           SET actual_duration_minutes = COALESCE(actual_duration_minutes, 0) + $1
           WHERE id = $2`,
          [actualMinutes, session.task_id]
        );
      }

      const updatedSession = updateRes.rows[0];

      return {
        session: updatedSession,
        manaRegenerated: actualManaRestored,
        theoreticalMana,
        maxManaCapped: actualManaRestored < theoreticalMana,
        character: {
          mana: rewardResult.newMana,
          maxMana: rewardResult.maxMana,
        },
      };
    });
  }

  /**
   * Abandons an active session without penalty.
   */
  async abandonSession(userId, sessionId) {
    return withTransaction(async (client) => {
      const { rows } = await client.query(
        `SELECT id, ended_at, completed
         FROM focus_sessions
         WHERE id = $1 AND user_id = $2
         FOR UPDATE`,
        [sessionId, userId]
      );

      if (rows.length === 0) {
        const err = new Error('Focus session not found');
        err.status = 404;
        err.code = 'SESSION_NOT_FOUND';
        throw err;
      }

      const session = rows[0];
      if (session.ended_at !== null) {
        const err = new Error('Focus session is already ended');
        err.status = 409;
        err.code = 'SESSION_ALREADY_ENDED';
        throw err;
      }

      const updateRes = await client.query(
        `UPDATE focus_sessions
         SET completed = false, ended_at = now(), mana_regenerated = 0, paused_at = NULL
         WHERE id = $1
         RETURNING id, user_id as "userId", started_at as "startedAt",
                   ended_at as "endedAt", planned_duration_seconds as "plannedDurationSeconds",
                   ambient_sound as "ambientSound", completed,
                   mana_regenerated as "manaRegenerated"`,
        [sessionId]
      );

      return updateRes.rows[0];
    });
  }

  /**
   * Retrieves the currently active session with server-synchronized timing.
   */
  async getActiveSession(userId) {
    const { rows } = await query(
      `SELECT id, user_id as "userId", started_at as "startedAt",
              ended_at as "endedAt", planned_duration_seconds as "plannedDurationSeconds",
              ambient_sound as "ambientSound", completed,
              mana_regenerated as "manaRegenerated",
              task_id as "taskId", task_type as "taskType", task_title as "taskTitle",
              session_type as "sessionType", paused_at as "pausedAt",
              total_paused_seconds as "totalPausedSeconds"
       FROM focus_sessions
       WHERE user_id = $1 AND ended_at IS NULL`,
      [userId]
    );

    if (rows.length === 0) {
      return null;
    }

    const session = rows[0];
    const now = Date.now();
    const started = new Date(session.startedAt).getTime();
    let totalPaused = session.totalPausedSeconds || 0;
    if (session.pausedAt) {
      totalPaused += Math.floor((now - new Date(session.pausedAt).getTime()) / 1000);
    }

    const rawElapsed = Math.max(0, Math.floor((now - started) / 1000));
    const activeElapsedSeconds = Math.max(0, rawElapsed - totalPaused);
    const remainingSeconds = Math.max(0, session.plannedDurationSeconds - activeElapsedSeconds);

    return {
      ...session,
      serverTime: new Date(now).toISOString(),
      elapsedSeconds: activeElapsedSeconds,
      remainingSeconds,
      isPaused: Boolean(session.pausedAt),
    };
  }

  /**
   * Retrieves history of focus sessions for user.
   */
  async listSessions(userId, { limit = 20 } = {}) {
    const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const { rows } = await query(
      `SELECT id, user_id as "userId", started_at as "startedAt",
              ended_at as "endedAt", planned_duration_seconds as "plannedDurationSeconds",
              ambient_sound as "ambientSound", completed,
              mana_regenerated as "manaRegenerated",
              task_id as "taskId", task_title as "taskTitle", session_type as "sessionType",
              actual_duration_seconds as "actualDurationSeconds"
       FROM focus_sessions
       WHERE user_id = $1
       ORDER BY started_at DESC
       LIMIT $2`,
      [userId, safeLimit]
    );
    return rows;
  }

  /**
   * Computes comprehensive focus analytics and totals
   */
  async getSummary(userId) {
    const todayRes = await query(
      `SELECT
        COUNT(*) as total_today,
        COUNT(*) FILTER (WHERE completed = true) as completed_today,
        COALESCE(SUM(actual_duration_seconds) FILTER (WHERE completed = true), 0) as focused_seconds_today
       FROM focus_sessions
       WHERE user_id = $1 AND started_at >= CURRENT_DATE`,
      [userId]
    );

    const weekRes = await query(
      `SELECT
        COUNT(*) as total_week,
        COUNT(*) FILTER (WHERE completed = true) as completed_week,
        COALESCE(SUM(actual_duration_seconds) FILTER (WHERE completed = true), 0) as focused_seconds_week,
        COALESCE(AVG(actual_duration_seconds) FILTER (WHERE completed = true), 0) as avg_duration_seconds
       FROM focus_sessions
       WHERE user_id = $1 AND started_at >= (CURRENT_DATE - interval '7 days')`,
      [userId]
    );

    const taskDistribution = await query(
      `SELECT
        COALESCE(task_title, 'Unlinked Focus') as title,
        COUNT(*) as session_count,
        SUM(actual_duration_seconds) as total_seconds
       FROM focus_sessions
       WHERE user_id = $1 AND completed = true AND started_at >= (CURRENT_DATE - interval '30 days')
       GROUP BY task_title
       ORDER BY total_seconds DESC
       LIMIT 5`,
      [userId]
    );

    const td = todayRes.rows[0];
    const wk = weekRes.rows[0];

    const totalWeek = parseInt(wk.total_week || 0, 10);
    const completedWeek = parseInt(wk.completed_week || 0, 10);
    const completionRate = totalWeek > 0 ? Math.round((completedWeek / totalWeek) * 100) : 100;

    return {
      todayMinutes: Math.round(parseInt(td.focused_seconds_today || 0, 10) / 60),
      todayCompletedSessions: parseInt(td.completed_today || 0, 10),
      weekMinutes: Math.round(parseInt(wk.focused_seconds_week || 0, 10) / 60),
      weekCompletedSessions: completedWeek,
      completionRate,
      averageSessionMinutes: Math.round(parseFloat(wk.avg_duration_seconds || 0) / 60),
      taskBreakdown: taskDistribution.rows.map((r) => ({
        taskTitle: r.title,
        minutes: Math.round(parseInt(r.total_seconds || 0, 10) / 60),
        sessions: parseInt(r.session_count, 10),
      })),
    };
  }
}

export const focusService = new FocusService();
