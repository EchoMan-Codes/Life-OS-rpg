import { query } from '../db/pool.js';
import { dailyService } from './daily.service.js';
import { habitService } from './habit.service.js';
import { questService } from './quest.service.js';

export const reportService = {
  /**
   * Aggregate complete user operational data for reporting.
   */
  async getReportData(userId, { startDate, endDate } = {}) {
    const [userRes, charRes, dailies, habits, quests, focusRes, compRes, reflectionRes] = await Promise.all([
      query('SELECT id, display_name, email, motto, timezone, created_at FROM users WHERE id = $1', [userId]),
      query('SELECT level, xp, hp, max_hp, mana, max_mana, gold, strength, intelligence, vitality, willpower, perception, unallocated_points FROM character_stats WHERE user_id = $1', [userId]),
      dailyService.listDailies(userId, { includeArchived: true }),
      habitService.listHabits(userId, { includeArchived: true }),
      questService.listQuests(userId, { status: 'all', includeArchived: true }),
      query('SELECT id, title, duration_minutes, planned_duration_seconds, status, created_at, completed_at FROM focus_sessions WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
      query('SELECT id, daily_id, for_date, xp_awarded, gold_awarded, completed_at FROM daily_completions WHERE user_id = $1 ORDER BY completed_at DESC', [userId]),
      query('SELECT id, reflection_date, energy_level, mood, notes, created_at FROM reflections WHERE user_id = $1 ORDER BY reflection_date DESC', [userId]),
    ]);

    const user = userRes.rows[0] || {};
    const character = charRes.rows[0] || {};
    const focusSessions = focusRes.rows || [];
    const dailyCompletions = compRes.rows || [];
    const reflections = reflectionRes.rows || [];

    const totalFocusMinutes = focusSessions
      .filter((s) => s.status === 'completed')
      .reduce((sum, s) => sum + (s.duration_minutes || Math.round((s.planned_duration_seconds || 0) / 60)), 0);

    const completedDailiesCount = dailies.filter((d) => d.isCompleteToday).length;
    const completedQuestsCount = quests.filter((q) => q.status === 'completed').length;
    const bestHabitStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.bestStreak || h.currentStreak || 0)) : 0;

    return {
      generatedAt: new Date().toISOString(),
      user: {
        id: user.id,
        displayName: user.display_name,
        email: user.email,
        motto: user.motto,
        timezone: user.timezone || 'UTC',
        memberSince: user.created_at,
      },
      character: {
        level: character.level || 1,
        xp: character.xp || 0,
        gold: character.gold || 0,
        attributes: {
          strength: character.strength || 10,
          intelligence: character.intelligence || 10,
          vitality: character.vitality || 10,
          willpower: character.willpower || 10,
          perception: character.perception || 10,
        },
      },
      summary: {
        totalFocusHours: (totalFocusMinutes / 60).toFixed(1),
        activeHabitsCount: habits.filter((h) => !h.archivedAt).length,
        bestHabitStreak,
        totalDailiesCount: dailies.filter((d) => !d.archivedAt).length,
        completedDailiesToday: completedDailiesCount,
        totalQuestsCount: quests.length,
        completedQuestsCount,
        totalCompletionsRecorded: dailyCompletions.length,
      },
      dailies: dailies.map((d) => ({
        id: d.id,
        title: d.title,
        difficulty: d.difficulty,
        scheduledTime: d.scheduledTime || 'Unscheduled',
        durationMinutes: d.durationMinutes || 30,
        priority: d.priority || 'medium',
        isCompleteToday: d.isCompleteToday,
        streakCurrent: d.streakCurrent || 0,
        streakBest: d.streakBest || 0,
      })),
      habits: habits.map((h) => ({
        id: h.id,
        title: h.title,
        difficulty: h.difficulty,
        direction: h.direction,
        currentStreak: h.currentStreak || 0,
        bestStreak: h.bestStreak || 0,
      })),
      quests: quests.map((q) => ({
        id: q.id,
        title: q.title,
        priority: q.priority,
        difficulty: q.difficulty,
        status: q.status,
        dueDate: q.dueDate || 'None',
        progressPercent: q.progressPercent || 0,
        subtasksTotal: (q.items || []).length,
        subtasksCompleted: (q.items || []).filter((i) => i.isComplete).length,
      })),
      focusSessions: focusSessions.map((s) => ({
        id: s.id,
        title: s.title || 'Focus Chamber Session',
        durationMinutes: s.duration_minutes || Math.round((s.planned_duration_seconds || 0) / 60),
        status: s.status,
        date: s.created_at,
      })),
      reflections: reflections.map((r) => ({
        date: r.reflection_date,
        energyLevel: r.energy_level,
        mood: r.mood,
        notes: r.notes || '',
      })),
    };
  },
};
