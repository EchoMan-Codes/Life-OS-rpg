import { query, withTransaction } from '../db/pool.js';
import { applyReward } from './progression.service.js';

export class StudyService {
  /**
   * Log a study session, persisting it and awarding character progression atomically.
   */
  async logStudySession({ userId, subject, durationMinutes, notes = '' }) {
    const mins = parseInt(durationMinutes, 10);
    if (isNaN(mins) || mins <= 0) {
      const err = new Error('Duration must be a positive integer in minutes.');
      err.status = 400;
      throw err;
    }

    const cleanSubject = String(subject || 'General Study').trim();
    const cleanNotes = String(notes || '').trim();

    // Reward scaling: 15 XP + 5 Gold per 30 mins
    const blocksOf30 = Math.max(1, Math.round(mins / 30));
    const xpReward = blocksOf30 * 15;
    const goldReward = blocksOf30 * 5;

    return withTransaction(async (client) => {
      // 1. Insert study log
      const insertRes = await client.query(
        `INSERT INTO study_logs (user_id, subject, duration_minutes, notes, xp_earned)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, user_id, subject, duration_minutes, notes, xp_earned, logged_at, created_at`,
        [userId, cleanSubject, mins, cleanNotes, xpReward]
      );
      const studyLog = insertRes.rows[0];

      // 2. Authoritative progression write through applyReward with SELECT FOR UPDATE
      const progression = await applyReward(client, userId, {
        xp: xpReward,
        gold: goldReward,
        sourceType: 'quest',
        sourceId: studyLog.id,
      });

      return {
        studyLog,
        progression,
      };
    });
  }

  /**
   * Fetch paginated study logs for an authenticated user.
   */
  async getStudyLogs({ userId, limit = 50, offset = 0 }) {
    const res = await query(
      `SELECT id, subject, duration_minutes, notes, xp_earned, logged_at, created_at
       FROM study_logs
       WHERE user_id = $1
       ORDER BY logged_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return res.rows;
  }

  /**
   * Fetch study summary analytics for StudySmart and AI intelligence.
   */
  async getStudySummary({ userId }) {
    // Total study minutes all time & this week
    const timeRes = await query(
      `SELECT COALESCE(SUM(duration_minutes), 0) AS total_minutes,
              COALESCE(SUM(CASE WHEN logged_at >= date_trunc('week', now()) THEN duration_minutes ELSE 0 END), 0) AS week_minutes,
              COUNT(id) AS total_sessions
       FROM study_logs
       WHERE user_id = $1`,
      [userId]
    );

    // Grouped by subject
    const subjectRes = await query(
      `SELECT subject,
              SUM(duration_minutes) AS total_minutes,
              COUNT(id) AS session_count
       FROM study_logs
       WHERE user_id = $1
       GROUP BY subject
       ORDER BY total_minutes DESC`,
      [userId]
    );

    const totalMinutes = parseInt(timeRes.rows[0]?.total_minutes || 0, 10);
    const weekMinutes = parseInt(timeRes.rows[0]?.week_minutes || 0, 10);
    const totalSessions = parseInt(timeRes.rows[0]?.total_sessions || 0, 10);

    return {
      totalMinutes,
      totalHours: (totalMinutes / 60).toFixed(1),
      weekMinutes,
      weekHours: (weekMinutes / 60).toFixed(1),
      totalSessions,
      subjects: subjectRes.rows.map((s) => ({
        subject: s.subject,
        minutes: parseInt(s.total_minutes, 10),
        hours: (parseInt(s.total_minutes, 10) / 60).toFixed(1),
        sessions: parseInt(s.session_count, 10),
      })),
    };
  }
}

export const studyService = new StudyService();
