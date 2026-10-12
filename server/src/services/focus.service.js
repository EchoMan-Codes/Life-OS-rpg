import { query, withTransaction } from '../db/pool.js';
import { applyReward } from './progression.service.js';

export const ALLOWED_AMBIENTS = ['rain', 'lofi', 'silence'];

export class FocusService {
  /**
   * Returns platform-capability specifications and permission prerequisites.
   * Truthfully documents what each platform can and cannot enforce.
   */
  getCapabilities(platform = 'web') {
    const norm = String(platform || 'web').toLowerCase();
    if (norm === 'android') {
      return {
        platform: 'android',
        canDetectForegroundApp: true,
        canDisplayWarningOverlay: true,
        canEnforceAppRestriction: false, // Standard Android does not allow hard-blocking/killing 3rd party apps without MDM/Device Owner
        canMaintainBackgroundEnforcement: false, // Subject to OEM battery saver / process killer
        canRecoverAfterInterruption: true,
        status: 'supported_with_permissions',
        requiredPermissions: ['PACKAGE_USAGE_STATS', 'SYSTEM_ALERT_WINDOW'],
        degradedModeExplanation:
          'On Android, Jeevan can detect when a restricted app is opened and display a Focus Chamber reminder overlay, but cannot physically prevent system app launch.',
      };
    }

    if (norm === 'ios') {
      return {
        platform: 'ios',
        canDetectForegroundApp: false,
        canDisplayWarningOverlay: false,
        canEnforceAppRestriction: false, // Requires Apple FamilyControls entitlement approval
        canMaintainBackgroundEnforcement: false,
        canRecoverAfterInterruption: true,
        status: 'requires_apple_family_controls_entitlement',
        requiredEntitlements: ['com.apple.developer.family-controls'],
        degradedModeExplanation:
          'Apple Screen Time / FamilyControls requires paid Apple Developer Program membership and explicit entitlement grant from Apple. Fallback mode uses web accountability.',
      };
    }

    // Default: Web / PWA
    return {
      platform: 'web',
      canDetectForegroundApp: false,
      canDisplayWarningOverlay: false,
      canEnforceAppRestriction: false,
      canMaintainBackgroundEnforcement: false,
      canRecoverAfterInterruption: true,
      status: 'browser_accountability',
      requiredPermissions: [],
      degradedModeExplanation:
        'Web browsers cannot access installed OS applications. Jeevan uses page visibility and window focus detection to track interruptions honestly.',
    };
  }

  // ---------------------------------------------------------------------------
  // Focus Profiles (Distraction Shield Profiles)
  // ---------------------------------------------------------------------------

  /**
   * List all distraction shield profiles for a user.
   */
  async listProfiles(userId) {
    const { rows } = await query(
      `SELECT id, user_id as "userId", name, description, category,
              restricted_apps as "restrictedApps",
              restricted_domains as "restrictedDomains",
              default_duration_seconds as "defaultDurationSeconds",
              commitment_level as "commitmentLevel",
              is_default as "isDefault",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM focus_profiles
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at ASC`,
      [userId]
    );
    return rows;
  }

  /**
   * Create a new distraction shield profile.
   */
  async createProfile(userId, {
    name,
    description = null,
    category = 'general',
    restrictedApps = [],
    restrictedDomains = [],
    defaultDurationSeconds = 1500,
    commitmentLevel = 1,
    isDefault = false,
  }) {
    return withTransaction(async (client) => {
      if (isDefault) {
        await client.query(
          `UPDATE focus_profiles SET is_default = false, updated_at = now() WHERE user_id = $1`,
          [userId]
        );
      }

      const { rows } = await client.query(
        `INSERT INTO focus_profiles (
          user_id, name, description, category,
          restricted_apps, restricted_domains,
          default_duration_seconds, commitment_level, is_default
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, user_id as "userId", name, description, category,
                  restricted_apps as "restrictedApps",
                  restricted_domains as "restrictedDomains",
                  default_duration_seconds as "defaultDurationSeconds",
                  commitment_level as "commitmentLevel",
                  is_default as "isDefault",
                  created_at as "createdAt", updated_at as "updatedAt"`,
        [
          userId,
          name.trim(),
          description,
          category,
          JSON.stringify(restrictedApps || []),
          JSON.stringify(restrictedDomains || []),
          defaultDurationSeconds,
          commitmentLevel,
          Boolean(isDefault),
        ]
      );

      return rows[0];
    });
  }

  /**
   * Update an existing distraction shield profile.
   */
  async updateProfile(userId, profileId, data) {
    return withTransaction(async (client) => {
      const existing = await client.query(
        `SELECT id FROM focus_profiles WHERE id = $1 AND user_id = $2 FOR UPDATE`,
        [profileId, userId]
      );

      if (existing.rows.length === 0) {
        const err = new Error('Focus profile not found');
        err.status = 404;
        err.code = 'PROFILE_NOT_FOUND';
        throw err;
      }

      if (data.isDefault) {
        await client.query(
          `UPDATE focus_profiles SET is_default = false, updated_at = now() WHERE user_id = $1 AND id != $2`,
          [userId, profileId]
        );
      }

      const fields = [];
      const values = [];
      let idx = 1;

      if (data.name !== undefined) {
        fields.push(`name = $${idx++}`);
        values.push(data.name.trim());
      }
      if (data.description !== undefined) {
        fields.push(`description = $${idx++}`);
        values.push(data.description);
      }
      if (data.category !== undefined) {
        fields.push(`category = $${idx++}`);
        values.push(data.category);
      }
      if (data.restrictedApps !== undefined) {
        fields.push(`restricted_apps = $${idx++}`);
        values.push(JSON.stringify(data.restrictedApps));
      }
      if (data.restrictedDomains !== undefined) {
        fields.push(`restricted_domains = $${idx++}`);
        values.push(JSON.stringify(data.restrictedDomains));
      }
      if (data.defaultDurationSeconds !== undefined) {
        fields.push(`default_duration_seconds = $${idx++}`);
        values.push(data.defaultDurationSeconds);
      }
      if (data.commitmentLevel !== undefined) {
        fields.push(`commitment_level = $${idx++}`);
        values.push(data.commitmentLevel);
      }
      if (data.isDefault !== undefined) {
        fields.push(`is_default = $${idx++}`);
        values.push(Boolean(data.isDefault));
      }

      fields.push(`updated_at = now()`);
      values.push(profileId, userId);

      const queryText = `
        UPDATE focus_profiles
        SET ${fields.join(', ')}
        WHERE id = $${idx++} AND user_id = $${idx++}
        RETURNING id, user_id as "userId", name, description, category,
                  restricted_apps as "restrictedApps",
                  restricted_domains as "restrictedDomains",
                  default_duration_seconds as "defaultDurationSeconds",
                  commitment_level as "commitmentLevel",
                  is_default as "isDefault",
                  created_at as "createdAt", updated_at as "updatedAt"
      `;

      const { rows } = await client.query(queryText, values);
      return rows[0];
    });
  }

  /**
   * Delete a distraction shield profile.
   */
  async deleteProfile(userId, profileId) {
    const { rows } = await query(
      `DELETE FROM focus_profiles WHERE id = $1 AND user_id = $2 RETURNING id`,
      [profileId, userId]
    );

    if (rows.length === 0) {
      const err = new Error('Focus profile not found');
      err.status = 404;
      err.code = 'PROFILE_NOT_FOUND';
      throw err;
    }

    return { id: profileId, deleted: true };
  }

  // ---------------------------------------------------------------------------
  // Focus Session Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Starts a new focus session.
   * Enforces DB-level single active session rule and logs started event.
   */
  async startSession(userId, {
    plannedDurationSeconds = 1500,
    ambientSound = 'silence',
    taskId = null,
    taskType = 'task',
    taskTitle = null,
    sessionType = 'focus',
    commitmentLevel = 1,
    shieldProfileId = null,
    goalDescription = null,
    linkedEntityType = 'none',
    linkedEntityId = null,
  }) {
    const plannedSec = Math.max(60, Math.min(14400, parseInt(plannedDurationSeconds, 10) || 1500));
    const sound = ALLOWED_AMBIENTS.includes(ambientSound) ? ambientSound : 'silence';
    const sType = ['focus', 'short_break', 'long_break'].includes(sessionType) ? sessionType : 'focus';
    const cLevel = [1, 2, 3].includes(parseInt(commitmentLevel, 10)) ? parseInt(commitmentLevel, 10) : 1;
    const lEntityType = ['none', 'task', 'quest', 'daily', 'habit'].includes(linkedEntityType)
      ? linkedEntityType
      : taskId
      ? 'task'
      : 'none';
    const lEntityId = linkedEntityId || taskId || null;

    // 1. Proactive check for existing active session
    const existing = await query(
      `SELECT id, user_id as "userId", started_at as "startedAt",
              planned_duration_seconds as "plannedDurationSeconds",
              ambient_sound as "ambientSound", completed, status,
              mana_regenerated as "manaRegenerated",
              task_id as "taskId", task_type as "taskType", task_title as "taskTitle",
              session_type as "sessionType", paused_at as "pausedAt",
              total_paused_seconds as "totalPausedSeconds",
              commitment_level as "commitmentLevel",
              shield_profile_id as "shieldProfileId",
              shield_status as "shieldStatus",
              goal_description as "goalDescription",
              linked_entity_type as "linkedEntityType",
              linked_entity_id as "linkedEntityId",
              interruption_count as "interruptionCount"
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

    // 2. Validate shieldProfileId ownership if supplied
    let verifiedProfileId = null;
    let initialShieldStatus = 'none';
    if (shieldProfileId) {
      const pCheck = await query(
        `SELECT id FROM focus_profiles WHERE id = $1 AND user_id = $2`,
        [shieldProfileId, userId]
      );
      if (pCheck.rows.length > 0) {
        verifiedProfileId = shieldProfileId;
        initialShieldStatus = 'active';
      }
    }

    // 3. Insert new session and event atomically
    return withTransaction(async (client) => {
      try {
        const { rows } = await client.query(
          `INSERT INTO focus_sessions (
            user_id, planned_duration_seconds, ambient_sound,
            task_id, task_type, task_title, session_type,
            commitment_level, shield_profile_id, shield_status,
            goal_description, linked_entity_type, linked_entity_id,
            status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'active')
          RETURNING id, user_id as "userId", started_at as "startedAt",
                    ended_at as "endedAt", planned_duration_seconds as "plannedDurationSeconds",
                    ambient_sound as "ambientSound", completed, status,
                    mana_regenerated as "manaRegenerated",
                    task_id as "taskId", task_type as "taskType", task_title as "taskTitle",
                    session_type as "sessionType", paused_at as "pausedAt",
                    total_paused_seconds as "totalPausedSeconds",
                    commitment_level as "commitmentLevel",
                    shield_profile_id as "shieldProfileId",
                    shield_status as "shieldStatus",
                    goal_description as "goalDescription",
                    linked_entity_type as "linkedEntityType",
                    linked_entity_id as "linkedEntityId",
                    interruption_count as "interruptionCount",
                    xp_awarded as "xpAwarded",
                    gold_awarded as "goldAwarded"`,
          [
            userId,
            plannedSec,
            sound,
            lEntityId,
            lEntityType,
            taskTitle || goalDescription,
            sType,
            cLevel,
            verifiedProfileId,
            initialShieldStatus,
            goalDescription || taskTitle,
            lEntityType,
            lEntityId,
          ]
        );

        const session = rows[0];

        // Record started event in append-only log
        await client.query(
          `INSERT INTO focus_session_events (session_id, user_id, event_type, metadata)
           VALUES ($1, $2, 'started', $3)`,
          [
            session.id,
            userId,
            JSON.stringify({
              plannedDurationSeconds: plannedSec,
              commitmentLevel: cLevel,
              shieldProfileId: verifiedProfileId,
              sessionType: sType,
            }),
          ]
        );

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
    });
  }

  /**
   * Pause active session (strictly disallowed in Commitment Lock Level 2 & 3).
   */
  async pauseSession(userId, sessionId) {
    return withTransaction(async (client) => {
      const { rows } = await client.query(
        `SELECT id, ended_at, paused_at, commitment_level FROM focus_sessions WHERE id = $1 AND user_id = $2 FOR UPDATE`,
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

      // Strict Anti-Cheat Rule: Pausing is forbidden in Commitment Lock Level 2 and Level 3
      if (s.commitment_level > 1) {
        const err = new Error('Pausing is disabled in Commitment Lock mode. Use deliberate early exit if needed.');
        err.status = 400;
        err.code = 'PAUSE_NOT_ALLOWED_IN_COMMITMENT_LOCK';
        throw err;
      }

      if (s.paused_at !== null) {
        return { id: sessionId, isPaused: true, message: 'Session already paused.' };
      }

      const updateRes = await client.query(
        `UPDATE focus_sessions SET paused_at = now(), status = 'paused' WHERE id = $1 RETURNING id, paused_at as "pausedAt"`,
        [sessionId]
      );

      await client.query(
        `INSERT INTO focus_session_events (session_id, user_id, event_type)
         VALUES ($1, $2, 'paused')`,
        [sessionId, userId]
      );

      return { id: sessionId, isPaused: true, pausedAt: updateRes.rows[0].pausedAt };
    });
  }

  /**
   * Resume paused session.
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
        `UPDATE focus_sessions SET paused_at = NULL, total_paused_seconds = $1, status = 'active' WHERE id = $2`,
        [totalPaused, sessionId]
      );

      await client.query(
        `INSERT INTO focus_session_events (session_id, user_id, event_type, metadata)
         VALUES ($1, $2, 'resumed', $3)`,
        [sessionId, userId, JSON.stringify({ pauseDurationSeconds: pauseDuration })]
      );

      return { id: sessionId, isPaused: false, totalPausedSeconds: totalPaused };
    });
  }

  /**
   * Record a lifecycle or interruption event in the audit trail.
   */
  async recordEvent(userId, sessionId, { eventType, metadata = {}, clientTimestamp = null }) {
    const sessionRes = await query(
      `SELECT id, ended_at FROM focus_sessions WHERE id = $1 AND user_id = $2`,
      [sessionId, userId]
    );

    if (sessionRes.rows.length === 0) {
      const err = new Error('Focus session not found');
      err.status = 404;
      err.code = 'SESSION_NOT_FOUND';
      throw err;
    }

    const isInterruption = ['visibility_hidden', 'app_switched', 'interruption'].includes(eventType);

    if (isInterruption) {
      await query(
        `UPDATE focus_sessions SET interruption_count = interruption_count + 1 WHERE id = $1`,
        [sessionId]
      );
    }

    const { rows } = await query(
      `INSERT INTO focus_session_events (session_id, user_id, event_type, metadata, client_timestamp)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, event_type as "eventType", created_at as "createdAt"`,
      [
        sessionId,
        userId,
        eventType,
        JSON.stringify(metadata || {}),
        clientTimestamp ? new Date(clientTimestamp) : null,
      ]
    );

    return rows[0];
  }

  /**
   * Deliberate early exit with Hold-to-Confirm.
   * If user focused for >= 10 mins (600s), awards fair partial XP (half rate) and 0 Gold.
   */
  async earlyExitSession(userId, sessionId, { reason = 'user_cancelled', holdConfirmed = true }) {
    return withTransaction(async (client) => {
      const { rows } = await client.query(
        `SELECT id, user_id, started_at, ended_at, planned_duration_seconds,
                paused_at, total_paused_seconds, commitment_level
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

      const s = rows[0];
      if (s.ended_at !== null) {
        const err = new Error('Focus session has already ended');
        err.status = 409;
        err.code = 'SESSION_ALREADY_ENDED';
        throw err;
      }

      const now = Date.now();
      const startedAt = new Date(s.started_at).getTime();
      let totalPaused = s.total_paused_seconds || 0;
      if (s.paused_at) {
        totalPaused += Math.floor((now - new Date(s.paused_at).getTime()) / 1000);
      }
      const activeElapsedSeconds = Math.max(0, Math.floor((now - startedAt) / 1000 - totalPaused));
      const activeMinutes = Math.floor(activeElapsedSeconds / 60);

      let awardedXp = 0;
      let awardedMana = 0;
      let progressionSummary = null;

      // Fairness policy: if focused for >= 10 minutes, grant partial XP (half rate) and mana
      if (activeMinutes >= 10) {
        awardedXp = Math.floor(activeMinutes * 0.5); // Half rate
        awardedMana = Math.round(activeMinutes * 1.5);

        progressionSummary = await applyReward(client, userId, {
          xp: awardedXp,
          gold: 0, // No gold on early exit
          mana: awardedMana,
          sourceType: 'habit',
          sourceId: sessionId,
          skipBattleEvent: false,
        });
      }

      const updateRes = await client.query(
        `UPDATE focus_sessions
         SET completed = false, status = 'interrupted', ended_at = now(),
             early_exit_requested = true, actual_duration_seconds = $1,
             xp_awarded = $2, gold_awarded = 0, mana_regenerated = $3,
             shield_status = 'released', paused_at = NULL, total_paused_seconds = $4
         WHERE id = $5
         RETURNING id, user_id as "userId", started_at as "startedAt",
                   ended_at as "endedAt", status, completed,
                   actual_duration_seconds as "actualDurationSeconds",
                   xp_awarded as "xpAwarded", gold_awarded as "goldAwarded",
                   mana_regenerated as "manaRegenerated"`,
        [activeElapsedSeconds, awardedXp, progressionSummary?.actualManaRestored || 0, totalPaused, sessionId]
      );

      await client.query(
        `INSERT INTO focus_session_events (session_id, user_id, event_type, metadata)
         VALUES ($1, $2, 'hold_to_exit_confirmed', $3)`,
        [sessionId, userId, JSON.stringify({ reason, holdConfirmed, activeElapsedSeconds })]
      );

      return {
        session: updateRes.rows[0],
        xpAwarded: awardedXp,
        goldAwarded: 0,
        manaRegenerated: progressionSummary?.actualManaRestored || 0,
        message: activeMinutes >= 10
          ? `Session terminated early. Credited ${awardedXp} partial XP for ${activeMinutes}m focused.`
          : 'Session terminated early. Focus sprint under 10m does not grant rewards.',
        character: progressionSummary ? {
          mana: progressionSummary.newMana,
          maxMana: progressionSummary.maxMana,
          xp: progressionSummary.newXp,
          level: progressionSummary.newLevel,
        } : null,
      };
    });
  }

  /**
   * Emergency exit: ALWAYS accessible, instantly releases all restrictions.
   */
  async emergencyExitSession(userId, sessionId, { reason = 'emergency' } = {}) {
    return withTransaction(async (client) => {
      const { rows } = await client.query(
        `SELECT id, user_id, started_at, ended_at, paused_at, total_paused_seconds
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

      const s = rows[0];
      if (s.ended_at !== null) {
        const err = new Error('Focus session has already ended');
        err.status = 409;
        err.code = 'SESSION_ALREADY_ENDED';
        throw err;
      }

      const now = Date.now();
      const startedAt = new Date(s.started_at).getTime();
      let totalPaused = s.total_paused_seconds || 0;
      if (s.paused_at) {
        totalPaused += Math.floor((now - new Date(s.paused_at).getTime()) / 1000);
      }
      const activeElapsedSeconds = Math.max(0, Math.floor((now - startedAt) / 1000 - totalPaused));
      const activeMinutes = Math.floor(activeElapsedSeconds / 60);

      let awardedXp = 0;
      let awardedMana = 0;
      let progressionSummary = null;

      if (activeMinutes >= 10) {
        awardedXp = Math.floor(activeMinutes * 0.5);
        awardedMana = Math.round(activeMinutes * 1.5);

        progressionSummary = await applyReward(client, userId, {
          xp: awardedXp,
          gold: 0,
          mana: awardedMana,
          sourceType: 'habit',
          sourceId: sessionId,
          skipBattleEvent: false,
        });
      }

      const updateRes = await client.query(
        `UPDATE focus_sessions
         SET completed = false, status = 'interrupted', ended_at = now(),
             emergency_exit_used = true, actual_duration_seconds = $1,
             xp_awarded = $2, gold_awarded = 0, mana_regenerated = $3,
             shield_status = 'released', paused_at = NULL, total_paused_seconds = $4
         WHERE id = $5
         RETURNING id, user_id as "userId", started_at as "startedAt",
                   ended_at as "endedAt", status, completed,
                   actual_duration_seconds as "actualDurationSeconds",
                   xp_awarded as "xpAwarded", gold_awarded as "goldAwarded",
                   mana_regenerated as "manaRegenerated"`,
        [activeElapsedSeconds, awardedXp, progressionSummary?.actualManaRestored || 0, totalPaused, sessionId]
      );

      await client.query(
        `INSERT INTO focus_session_events (session_id, user_id, event_type, metadata)
         VALUES ($1, $2, 'emergency_exit', $3)`,
        [sessionId, userId, JSON.stringify({ reason, activeElapsedSeconds })]
      );

      return {
        session: updateRes.rows[0],
        xpAwarded: awardedXp,
        goldAwarded: 0,
        manaRegenerated: progressionSummary?.actualManaRestored || 0,
        message: 'Emergency exit executed. Restrictions released immediately.',
      };
    });
  }

  /**
   * Completes an active focus session atomically under row locks.
   * Enforces server-authoritative elapsed active time verification (anti-tamper).
   * Atomically awards XP + Gold + Mana via applyReward() inside the transaction.
   */
  async completeSession(userId, sessionId) {
    return withTransaction(async (client) => {
      // 1. Lock session row for update
      const { rows } = await client.query(
        `SELECT id, user_id, started_at, ended_at, planned_duration_seconds,
                ambient_sound, completed, mana_regenerated,
                task_id, task_type, session_type, paused_at, total_paused_seconds,
                commitment_level, linked_entity_type, linked_entity_id,
                interruption_count
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

      // 3. Reward Calculation:
      // Base XP = 1 XP per planned minute
      // Base Gold = 0.5 Gold per planned minute
      // Base Mana = 1.5 Mana per planned minute
      // Multipliers: Level 1 = 1.0x, Level 2 = 1.15x, Level 3 = 1.25x
      const plannedMinutes = session.planned_duration_seconds / 60;
      const actualMinutes = Math.round(activeElapsedSeconds / 60);

      const baseXP = Math.round(plannedMinutes * 1.0);
      const baseGold = Math.floor(plannedMinutes * 0.5);
      const theoreticalMana = Math.round(plannedMinutes * 1.5);

      const multiplier =
        session.commitment_level === 3 ? 1.25 : session.commitment_level === 2 ? 1.15 : 1.0;

      const finalXP = Math.round(baseXP * multiplier);
      const finalGold = Math.floor(baseGold * multiplier);

      // 4. Atomically apply rewards to character_stats under SELECT ... FOR UPDATE
      const rewardResult = await applyReward(client, userId, {
        xp: finalXP,
        gold: finalGold,
        mana: theoreticalMana,
        sourceType: 'habit',
        sourceId: sessionId,
        skipBattleEvent: false,
      });

      const actualManaRestored = rewardResult.actualManaRestored;

      // 5. Update session record
      const updateRes = await client.query(
        `UPDATE focus_sessions
         SET completed = true, status = 'completed', ended_at = now(),
             mana_regenerated = $1, xp_awarded = $2, gold_awarded = $3,
             actual_duration_seconds = $4, paused_at = NULL, total_paused_seconds = $5,
             shield_status = 'released'
         WHERE id = $6
         RETURNING id, user_id as "userId", started_at as "startedAt",
                   ended_at as "endedAt", planned_duration_seconds as "plannedDurationSeconds",
                   ambient_sound as "ambientSound", completed, status,
                   mana_regenerated as "manaRegenerated",
                   xp_awarded as "xpAwarded", gold_awarded as "goldAwarded",
                   actual_duration_seconds as "actualDurationSeconds",
                   task_id as "taskId", task_type as "taskType",
                   commitment_level as "commitmentLevel",
                   interruption_count as "interruptionCount"`,
        [actualManaRestored, finalXP, finalGold, Math.floor(activeElapsedSeconds), totalPaused, sessionId]
      );

      // 6. Record completed event in append-only log
      await client.query(
        `INSERT INTO focus_session_events (session_id, user_id, event_type, metadata)
         VALUES ($1, $2, 'completed', $3)`,
        [
          sessionId,
          userId,
          JSON.stringify({
            xpAwarded: finalXP,
            goldAwarded: finalGold,
            manaRegenerated: actualManaRestored,
            commitmentMultiplier: multiplier,
            activeElapsedSeconds: Math.floor(activeElapsedSeconds),
          }),
        ]
      );

      // 7. If linked to a task, update task actual duration
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
        xpAwarded: finalXP,
        goldAwarded: finalGold,
        manaRegenerated: actualManaRestored,
        theoreticalMana,
        maxManaCapped: actualManaRestored < theoreticalMana,
        commitmentMultiplier: multiplier,
        character: {
          mana: rewardResult.newMana,
          maxMana: rewardResult.maxMana,
          xp: rewardResult.newXp,
          level: rewardResult.newLevel,
          gold: rewardResult.newGold,
          leveledUp: rewardResult.leveledUp,
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
         SET completed = false, status = 'abandoned', ended_at = now(),
             mana_regenerated = 0, xp_awarded = 0, gold_awarded = 0,
             shield_status = 'released', paused_at = NULL
         WHERE id = $1
         RETURNING id, user_id as "userId", started_at as "startedAt",
                   ended_at as "endedAt", planned_duration_seconds as "plannedDurationSeconds",
                   ambient_sound as "ambientSound", completed, status,
                   mana_regenerated as "manaRegenerated"`,
        [sessionId]
      );

      await client.query(
        `INSERT INTO focus_session_events (session_id, user_id, event_type)
         VALUES ($1, $2, 'abandoned')`,
        [sessionId, userId]
      );

      return updateRes.rows[0];
    });
  }

  /**
   * Retrieves the currently active session with server-synchronized timing.
   */
  async getActiveSession(userId) {
    const { rows } = await query(
      `SELECT s.id, s.user_id as "userId", s.started_at as "startedAt",
              s.ended_at as "endedAt", s.planned_duration_seconds as "plannedDurationSeconds",
              s.ambient_sound as "ambientSound", s.completed, s.status,
              s.mana_regenerated as "manaRegenerated",
              s.task_id as "taskId", s.task_type as "taskType", s.task_title as "taskTitle",
              s.session_type as "sessionType", s.paused_at as "pausedAt",
              s.total_paused_seconds as "totalPausedSeconds",
              s.commitment_level as "commitmentLevel",
              s.shield_profile_id as "shieldProfileId",
              s.shield_status as "shieldStatus",
              s.goal_description as "goalDescription",
              s.linked_entity_type as "linkedEntityType",
              s.linked_entity_id as "linkedEntityId",
              s.interruption_count as "interruptionCount",
              s.xp_awarded as "xpAwarded", s.gold_awarded as "goldAwarded",
              p.name as "shieldProfileName"
       FROM focus_sessions s
       LEFT JOIN focus_profiles p ON s.shield_profile_id = p.id
       WHERE s.user_id = $1 AND s.ended_at IS NULL`,
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
   * Retrieves history of focus sessions for user with profiles and events summary.
   */
  async listSessions(userId, { limit = 20, status = null } = {}) {
    const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    let queryText = `
      SELECT s.id, s.user_id as "userId", s.started_at as "startedAt",
             s.ended_at as "endedAt", s.planned_duration_seconds as "plannedDurationSeconds",
             s.ambient_sound as "ambientSound", s.completed, s.status,
             s.mana_regenerated as "manaRegenerated",
             s.xp_awarded as "xpAwarded", s.gold_awarded as "goldAwarded",
             s.task_id as "taskId", s.task_title as "taskTitle", s.session_type as "sessionType",
             s.actual_duration_seconds as "actualDurationSeconds",
             s.commitment_level as "commitmentLevel",
             s.interruption_count as "interruptionCount",
             s.goal_description as "goalDescription",
             p.name as "shieldProfileName"
      FROM focus_sessions s
      LEFT JOIN focus_profiles p ON s.shield_profile_id = p.id
      WHERE s.user_id = $1
    `;
    const params = [userId];

    if (status) {
      params.push(status);
      queryText += ` AND s.status = $${params.length}`;
    }

    queryText += ` ORDER BY s.started_at DESC LIMIT $${params.length + 1}`;
    params.push(safeLimit);

    const { rows } = await query(queryText, params);
    return rows;
  }

  /**
   * Computes comprehensive focus analytics and totals.
   */
  async getSummary(userId) {
    const todayRes = await query(
      `SELECT
        COUNT(*) as total_today,
        COUNT(*) FILTER (WHERE completed = true) as completed_today,
        COUNT(*) FILTER (WHERE status = 'interrupted') as interrupted_today,
        COALESCE(SUM(actual_duration_seconds) FILTER (WHERE completed = true), 0) as focused_seconds_today,
        COALESCE(SUM(xp_awarded), 0) as xp_today,
        COALESCE(SUM(gold_awarded), 0) as gold_today
       FROM focus_sessions
       WHERE user_id = $1 AND started_at >= CURRENT_DATE`,
      [userId]
    );

    const weekRes = await query(
      `SELECT
        COUNT(*) as total_week,
        COUNT(*) FILTER (WHERE completed = true) as completed_week,
        COUNT(*) FILTER (WHERE status = 'interrupted') as interrupted_week,
        COALESCE(SUM(actual_duration_seconds) FILTER (WHERE completed = true), 0) as focused_seconds_week,
        COALESCE(AVG(actual_duration_seconds) FILTER (WHERE completed = true), 0) as avg_duration_seconds,
        COALESCE(SUM(xp_awarded), 0) as xp_week,
        COALESCE(SUM(gold_awarded), 0) as gold_week,
        COALESCE(SUM(interruption_count), 0) as total_interruptions_week
       FROM focus_sessions
       WHERE user_id = $1 AND started_at >= (CURRENT_DATE - interval '7 days')`,
      [userId]
    );

    const taskDistribution = await query(
      `SELECT
        COALESCE(task_title, goal_description, 'Free Flow Sprint') as title,
        COUNT(*) as session_count,
        SUM(actual_duration_seconds) as total_seconds
       FROM focus_sessions
       WHERE user_id = $1 AND completed = true AND started_at >= (CURRENT_DATE - interval '30 days')
       GROUP BY COALESCE(task_title, goal_description, 'Free Flow Sprint')
       ORDER BY total_seconds DESC
       LIMIT 5`,
      [userId]
    );

    const commitmentDistribution = await query(
      `SELECT
        commitment_level,
        COUNT(*) as session_count,
        COUNT(*) FILTER (WHERE completed = true) as completed_count
       FROM focus_sessions
       WHERE user_id = $1 AND started_at >= (CURRENT_DATE - interval '30 days')
       GROUP BY commitment_level
       ORDER BY commitment_level ASC`,
      [userId]
    );

    const td = todayRes.rows[0];
    const wk = weekRes.rows[0];

    const totalWeek = parseInt(wk.total_week || 0, 10);
    const completedWeek = parseInt(wk.completed_week || 0, 10);
    const interruptedWeek = parseInt(wk.interrupted_week || 0, 10);
    const completionRate = totalWeek > 0 ? Math.round((completedWeek / totalWeek) * 100) : 100;

    return {
      todayMinutes: Math.round(parseInt(td.focused_seconds_today || 0, 10) / 60),
      todayCompletedSessions: parseInt(td.completed_today || 0, 10),
      todayInterruptedSessions: parseInt(td.interrupted_today || 0, 10),
      todayXp: parseInt(td.xp_today || 0, 10),
      todayGold: parseInt(td.gold_today || 0, 10),

      weekMinutes: Math.round(parseInt(wk.focused_seconds_week || 0, 10) / 60),
      weekCompletedSessions: completedWeek,
      weekInterruptedSessions: interruptedWeek,
      weekXp: parseInt(wk.xp_week || 0, 10),
      weekGold: parseInt(wk.gold_week || 0, 10),
      weekInterruptions: parseInt(wk.total_interruptions_week || 0, 10),

      completionRate,
      averageSessionMinutes: Math.round(parseFloat(wk.avg_duration_seconds || 0) / 60),

      taskBreakdown: taskDistribution.rows.map((r) => ({
        taskTitle: r.title,
        minutes: Math.round(parseInt(r.total_seconds || 0, 10) / 60),
        sessions: parseInt(r.session_count, 10),
      })),

      commitmentBreakdown: commitmentDistribution.rows.map((r) => ({
        commitmentLevel: parseInt(r.commitment_level, 10),
        totalSessions: parseInt(r.session_count, 10),
        completedSessions: parseInt(r.completed_count, 10),
      })),
    };
  }
}

export const focusService = new FocusService();
