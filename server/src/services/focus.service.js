import { query, withTransaction } from '../db/pool.js';
import { applyReward } from './progression.service.js';

export const ALLOWED_DURATIONS = [900, 1500, 3000]; // 15 min, 25 min, 50 min
export const ALLOWED_AMBIENTS = ['rain', 'lofi', 'silence'];

export class FocusService {
  /**
   * Starts a new focus session.
   * Enforces DB-level and service-level single active session rule per user.
   */
  async startSession(userId, { plannedDurationSeconds, ambientSound = 'silence' }) {
    if (!ALLOWED_DURATIONS.includes(plannedDurationSeconds)) {
      const err = new Error('Planned duration must be 900 (15m), 1500 (25m), or 3000 (50m) seconds');
      err.status = 400;
      err.code = 'INVALID_DURATION';
      throw err;
    }

    const sound = ALLOWED_AMBIENTS.includes(ambientSound) ? ambientSound : 'silence';

    // 1. Proactive check for existing active session
    const existing = await query(
      `SELECT id, user_id as "userId", started_at as "startedAt",
              planned_duration_seconds as "plannedDurationSeconds",
              ambient_sound as "ambientSound", completed,
              mana_regenerated as "manaRegenerated"
       FROM focus_sessions
       WHERE user_id = $1 AND ended_at IS NULL`,
      [userId]
    );

    if (existing.rows.length > 0) {
      const active = existing.rows[0];
      const now = Date.now();
      const started = new Date(active.startedAt).getTime();
      const elapsed = Math.max(0, Math.floor((now - started) / 1000));
      const remaining = Math.max(0, active.plannedDurationSeconds - elapsed);

      const err = new Error('An active focus session is already in progress');
      err.status = 409;
      err.code = 'ACTIVE_SESSION_EXISTS';
      err.details = {
        session: {
          ...active,
          elapsedSeconds: elapsed,
          remainingSeconds: remaining,
          serverTime: new Date(now).toISOString(),
        },
      };
      throw err;
    }

    // 2. Insert new session (protected by partial unique index idx_focus_sessions_active_user)
    try {
      const { rows } = await query(
        `INSERT INTO focus_sessions (user_id, planned_duration_seconds, ambient_sound)
         VALUES ($1, $2, $3)
         RETURNING id, user_id as "userId", started_at as "startedAt",
                   ended_at as "endedAt", planned_duration_seconds as "plannedDurationSeconds",
                   ambient_sound as "ambientSound", completed,
                   mana_regenerated as "manaRegenerated"`,
        [userId, plannedDurationSeconds, sound]
      );

      const session = rows[0];
      return {
        ...session,
        remainingSeconds: session.plannedDurationSeconds,
        elapsedSeconds: 0,
        serverTime: new Date().toISOString(),
      };
    } catch (err) {
      if (err.code === '23505') {
        // Unique constraint violation from concurrent start
        const conflictErr = new Error('An active focus session is already in progress');
        conflictErr.status = 409;
        conflictErr.code = 'ACTIVE_SESSION_EXISTS';
        throw conflictErr;
      }
      throw err;
    }
  }

  /**
   * Completes an active focus session atomically under row locks.
   * Enforces server-authoritative elapsed time verification (anti-tamper).
   */
  async completeSession(userId, sessionId) {
    return withTransaction(async (client) => {
      // 1. Lock session row for update
      const { rows } = await client.query(
        `SELECT id, user_id, started_at, ended_at, planned_duration_seconds,
                ambient_sound, completed, mana_regenerated
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

      // 2. Server-authoritative anti-tamper check
      const now = Date.now();
      const startedAt = new Date(session.started_at).getTime();
      const elapsedSeconds = (now - startedAt) / 1000;

      // Allow 2 seconds grace for network transmission
      if (elapsedSeconds < session.planned_duration_seconds - 2) {
        const err = new Error('Cannot complete session before planned duration has elapsed');
        err.status = 400;
        err.code = 'EARLY_COMPLETION_REJECTED';
        err.details = {
          elapsedSeconds: Math.floor(elapsedSeconds),
          plannedDurationSeconds: session.planned_duration_seconds,
          remainingSeconds: Math.max(0, Math.ceil(session.planned_duration_seconds - elapsedSeconds)),
        };
        throw err;
      }

      // 3. Compute theoretical mana: Math.round(minutes * 1.5)
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
         SET completed = true, ended_at = now(), mana_regenerated = $1
         WHERE id = $2
         RETURNING id, user_id as "userId", started_at as "startedAt",
                   ended_at as "endedAt", planned_duration_seconds as "plannedDurationSeconds",
                   ambient_sound as "ambientSound", completed,
                   mana_regenerated as "manaRegenerated"`,
        [actualManaRestored, sessionId]
      );

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
         SET completed = false, ended_at = now(), mana_regenerated = 0
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
              mana_regenerated as "manaRegenerated"
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
    const elapsedSeconds = Math.max(0, Math.floor((now - started) / 1000));
    const remainingSeconds = Math.max(0, session.plannedDurationSeconds - elapsedSeconds);

    return {
      ...session,
      serverTime: new Date(now).toISOString(),
      elapsedSeconds,
      remainingSeconds,
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
              mana_regenerated as "manaRegenerated"
       FROM focus_sessions
       WHERE user_id = $1
       ORDER BY started_at DESC
       LIMIT $2`,
      [userId, safeLimit]
    );
    return rows;
  }
}

export const focusService = new FocusService();
