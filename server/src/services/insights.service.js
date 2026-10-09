import { query, withTransaction } from '../db/pool.js';
import { taskService } from './task.service.js';

export class InsightsService {
  /**
   * Authoritative weekly metrics calculation with prior-week comparison
   */
  async getWeeklyInsights(userId, { weekStartDate } = {}) {
    // Determine target week boundary (defaults to current week's Monday)
    let start = weekStartDate ? new Date(weekStartDate) : new Date();
    // Normalize to Monday 00:00:00 UTC
    const day = start.getUTCDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + diffToMon, 0, 0, 0));
    const sunday = new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

    const prevMonday = new Date(monday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevSunday = new Date(monday.getTime() - 1);

    const mondayStr = monday.toISOString().slice(0, 10);
    const sundayStr = sunday.toISOString().slice(0, 10);
    const prevMondayStr = prevMonday.toISOString().slice(0, 10);

    // 1. Current week queries
    const [
      currTasksRes,
      prevTasksRes,
      currFocusRes,
      prevFocusRes,
      habitsRes,
      currEventsRes,
      reflectionsRes,
      existingReviewRes,
    ] = await Promise.all([
      // Tasks completed this week + created this week
      query(
        `SELECT
          COUNT(*) as total_planned,
          COUNT(*) FILTER (WHERE status = 'completed' AND completed_at BETWEEN $2 AND $3) as completed_count,
          COUNT(*) FILTER (WHERE status != 'completed' AND due_date BETWEEN $2 AND $3) as missed_count,
          COUNT(*) FILTER (WHERE status != 'completed' AND due_date < now()) as overdue_count,
          COUNT(*) FILTER (WHERE status != 'completed' AND due_date > now() AND due_date <= $3) as upcoming_count
         FROM tasks
         WHERE user_id = $1 AND parent_id IS NULL AND (
           (created_at BETWEEN $2 AND $3) OR
           (completed_at BETWEEN $2 AND $3) OR
           (due_date BETWEEN $2 AND $3)
         )`,
        [userId, monday, sunday]
      ),
      // Prior week tasks
      query(
        `SELECT
          COUNT(*) FILTER (WHERE status = 'completed' AND completed_at BETWEEN $2 AND $3) as completed_count
         FROM tasks
         WHERE user_id = $1 AND parent_id IS NULL`,
        [userId, prevMonday, prevSunday]
      ),
      // Current week focus sessions
      query(
        `SELECT
          COUNT(*) as total_sessions,
          COUNT(*) FILTER (WHERE completed = true) as completed_sessions,
          COALESCE(SUM(actual_duration_seconds) FILTER (WHERE completed = true), 0) as total_focus_seconds,
          COALESCE(AVG(actual_duration_seconds) FILTER (WHERE completed = true), 0) as avg_focus_seconds
         FROM focus_sessions
         WHERE user_id = $1 AND started_at BETWEEN $2 AND $3`,
        [userId, monday, sunday]
      ),
      // Prior week focus sessions
      query(
        `SELECT
          COALESCE(SUM(actual_duration_seconds) FILTER (WHERE completed = true), 0) as total_focus_seconds
         FROM focus_sessions
         WHERE user_id = $1 AND started_at BETWEEN $2 AND $3`,
        [userId, prevMonday, prevSunday]
      ),
      // Habits and streaks
      query(
        `SELECT id, title, current_streak as "currentStreak", best_streak as "bestStreak"
         FROM habits
         WHERE user_id = $1 AND archived_at IS NULL`,
        [userId]
      ),
      // Calendar events scheduled this week
      query(
        `SELECT COUNT(*) as event_count,
                COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time))), 0) as scheduled_seconds
         FROM calendar_events
         WHERE user_id = $1 AND start_time BETWEEN $2 AND $3`,
        [userId, monday, sunday]
      ),
      // Daily reflections for this week (mood & energy)
      query(
        `SELECT for_date as "date", energy_score as "energy", mood_score as "mood", focus_score as "focus", note as "notes"
         FROM reflections
         WHERE user_id = $1 AND for_date BETWEEN $2 AND $3
         ORDER BY for_date ASC`,
        [userId, mondayStr, sundayStr]
      ),
      // Existing saved weekly review
      query(
        `SELECT id, week_start_date as "weekStartDate", week_end_date as "weekEndDate",
                summary, wins, blockers, lessons, next_week_priorities as "nextWeekPriorities",
                status, created_at as "createdAt"
         FROM weekly_reviews
         WHERE user_id = $1 AND week_start_date = $2`,
        [userId, mondayStr]
      ),
    ]);

    const curTasks = currTasksRes.rows[0];
    const prevTasks = prevTasksRes.rows[0];
    const curFocus = currFocusRes.rows[0];
    const prevFocus = prevFocusRes.rows[0];
    const curEvents = currEventsRes.rows[0];
    const habits = habitsRes.rows;

    const completedTasksCurr = parseInt(curTasks.completed_count || 0, 10);
    const completedTasksPrev = parseInt(prevTasks.completed_count || 0, 10);
    const taskChangePct = completedTasksPrev > 0
      ? Math.round(((completedTasksCurr - completedTasksPrev) / completedTasksPrev) * 100)
      : completedTasksCurr > 0 ? 100 : 0;

    const focusSecCurr = parseInt(curFocus.total_focus_seconds || 0, 10);
    const focusSecPrev = parseInt(prevFocus.total_focus_seconds || 0, 10);
    const focusChangePct = focusSecPrev > 0
      ? Math.round(((focusSecCurr - focusSecPrev) / focusSecPrev) * 100)
      : focusSecCurr > 0 ? 100 : 0;

    const totalSessions = parseInt(curFocus.total_sessions || 0, 10);
    const completedSessions = parseInt(curFocus.completed_sessions || 0, 10);
    const sessionCompletionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 100;

    const habitCount = habits.length;
    const avgStreak = habitCount > 0
      ? Math.round(habits.reduce((acc, h) => acc + (h.currentStreak || 0), 0) / habitCount)
      : 0;
    const bestStreak = habitCount > 0
      ? Math.max(...habits.map((h) => h.bestStreak || h.currentStreak || 0))
      : 0;

    return {
      weekRange: {
        startDate: mondayStr,
        endDate: sundayStr,
        priorStartDate: prevMondayStr,
      },
      metrics: {
        tasksCompleted: completedTasksCurr,
        tasksCompletedPrior: completedTasksPrev,
        taskChangePercent: taskChangePct,
        tasksPlanned: parseInt(curTasks.total_planned || 0, 10),
        tasksMissed: parseInt(curTasks.missed_count || 0, 10),
        tasksOverdue: parseInt(curTasks.overdue_count || 0, 10),
        tasksUpcoming: parseInt(curTasks.upcoming_count || 0, 10),
        focusMinutes: Math.round(focusSecCurr / 60),
        focusMinutesPrior: Math.round(focusSecPrev / 60),
        focusChangePercent: focusChangePct,
        focusSessionsCompleted: completedSessions,
        focusSessionCompletionRate: sessionCompletionRate,
        averageSessionMinutes: Math.round(parseFloat(curFocus.avg_focus_seconds || 0) / 60),
        habitsActive: habitCount,
        averageHabitStreak: avgStreak,
        bestHabitStreak: bestStreak,
        calendarEventsCount: parseInt(curEvents.event_count || 0, 10),
        calendarScheduledHours: (parseInt(curEvents.scheduled_seconds || 0, 10) / 3600).toFixed(1),
      },
      habits,
      reflections: reflectionsRes.rows,
      savedReview: existingReviewRes.rows[0] || null,
    };
  }

  /**
   * 4-Week or daily longitudinal trends for interactive charts
   */
  async getTrends(userId, { weeks = 4 } = {}) {
    const numWeeks = Math.max(2, Math.min(12, parseInt(weeks, 10) || 4));

    // Daily breakdown for past 28 days
    const dailyRes = await query(
      `WITH date_series AS (
        SELECT generate_series(
          (CURRENT_DATE - interval '1 day' * $2)::date,
          CURRENT_DATE::date,
          '1 day'::interval
        )::date as day
      ),
      daily_tasks AS (
        SELECT completed_at::date as day, COUNT(*) as tasks_done
        FROM tasks
        WHERE user_id = $1 AND status = 'completed' AND completed_at >= (CURRENT_DATE - interval '1 day' * $2)
        GROUP BY completed_at::date
      ),
      daily_focus AS (
        SELECT started_at::date as day, COALESCE(SUM(actual_duration_seconds), 0) / 60 as focus_mins
        FROM focus_sessions
        WHERE user_id = $1 AND completed = true AND started_at >= (CURRENT_DATE - interval '1 day' * $2)
        GROUP BY started_at::date
      ),
      daily_reflections AS (
        SELECT for_date as day, energy_score as energy_level, mood_score as mood
        FROM reflections
        WHERE user_id = $1 AND for_date >= (CURRENT_DATE - interval '1 day' * $2)
      )
      SELECT
        ds.day::text,
        COALESCE(dt.tasks_done, 0)::int as "tasksDone",
        COALESCE(df.focus_mins, 0)::int as "focusMinutes",
        dr.energy_level as "energyLevel",
        dr.mood
      FROM date_series ds
      LEFT JOIN daily_tasks dt ON ds.day = dt.day
      LEFT JOIN daily_focus df ON ds.day = df.day
      LEFT JOIN daily_reflections dr ON ds.day = dr.day
      ORDER BY ds.day ASC`,
      [userId, numWeeks * 7]
    );

    // Project breakdown
    const projectRes = await query(
      `SELECT project_name as "projectName",
              COUNT(*) as "totalTasks",
              COUNT(*) FILTER (WHERE status = 'completed') as "completedTasks"
       FROM tasks
       WHERE user_id = $1 AND parent_id IS NULL AND created_at >= (CURRENT_DATE - interval '1 day' * $2)
       GROUP BY project_name
       ORDER BY "totalTasks" DESC`,
      [userId, numWeeks * 7]
    );

    return {
      dailyTrends: dailyRes.rows,
      projectBreakdown: projectRes.rows,
    };
  }

  /**
   * Save or update a weekly review (supports auto-creating follow-up tasks)
   */
  async saveWeeklyReview(userId, data) {
    if (!data.weekStartDate || !data.weekEndDate) {
      const err = new Error('weekStartDate and weekEndDate are required');
      err.status = 400;
      err.code = 'INVALID_DATES';
      throw err;
    }

    return withTransaction(async (client) => {
      const res = await client.query(
        `INSERT INTO weekly_reviews (
          user_id, week_start_date, week_end_date, summary, wins, blockers, lessons, next_week_priorities, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completed')
        ON CONFLICT (user_id, week_start_date)
        DO UPDATE SET
          week_end_date = EXCLUDED.week_end_date,
          summary = EXCLUDED.summary,
          wins = EXCLUDED.wins,
          blockers = EXCLUDED.blockers,
          lessons = EXCLUDED.lessons,
          next_week_priorities = EXCLUDED.next_week_priorities,
          status = 'completed'
        RETURNING
          id, user_id as "userId", week_start_date as "weekStartDate",
          week_end_date as "weekEndDate", summary, wins, blockers, lessons,
          next_week_priorities as "nextWeekPriorities", status, created_at as "createdAt"`,
        [
          userId,
          data.weekStartDate,
          data.weekEndDate,
          data.summary || {},
          data.wins || '',
          data.blockers || '',
          data.lessons || '',
          Array.isArray(data.nextWeekPriorities) ? data.nextWeekPriorities : [],
        ]
      );

      const savedReview = res.rows[0];

      // If user provided follow-up tasks, create them in tasks table!
      if (Array.isArray(data.followUpTasks) && data.followUpTasks.length > 0) {
        for (const t of data.followUpTasks) {
          const title = typeof t === 'string' ? t.trim() : (t?.title || '').trim();
          if (title) {
            await client.query(
              `INSERT INTO tasks (user_id, title, priority, project_name, status)
               VALUES ($1, $2, 'high', 'Weekly Priorities', 'todo')`,
              [userId, title]
            );
          }
        }
      }

      return savedReview;
    });
  }

  /**
   * List past saved weekly reviews
   */
  async listWeeklyReviews(userId, { limit = 12 } = {}) {
    const { rows } = await query(
      `SELECT
        id, user_id as "userId", week_start_date as "weekStartDate",
        week_end_date as "weekEndDate", summary, wins, blockers, lessons,
        next_week_priorities as "nextWeekPriorities", status, created_at as "createdAt"
       FROM weekly_reviews
       WHERE user_id = $1
       ORDER BY week_start_date DESC
       LIMIT $2`,
      [userId, limit]
    );
    return rows;
  }
}

export const insightsService = new InsightsService();
