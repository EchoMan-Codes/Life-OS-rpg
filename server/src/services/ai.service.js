import { query, pool } from '../db/pool.js';
import { dailyService } from './daily.service.js';
import { habitService } from './habit.service.js';
import { questService } from './quest.service.js';
import { notificationService } from './notification.service.js';

/**
 * Jeevan AI Service
 * Connects securely to OpenAI through server-side environment variables,
 * incorporates real user telemetry & active system data, and provides
 * structured action execution for Dailies, Habits, and Quests.
 */
export const aiService = {
  /**
   * Gather comprehensive user context for AI prompt.
   */
  async getUserContext(userId) {
    const [userRes, charRes, dailies, habits, quests, focusHistory] = await Promise.all([
      query('SELECT id, display_name, motto, timezone, notification_preferences FROM users WHERE id = $1', [userId]),
      query('SELECT level, xp, hp, max_hp, mana, max_mana, gold, strength, intelligence, vitality, willpower, perception FROM character_stats WHERE user_id = $1', [userId]),
      dailyService.listDailies(userId),
      habitService.listHabits(userId),
      questService.listQuests(userId, { status: 'active' }),
      query('SELECT duration_minutes, planned_duration_seconds, status, created_at FROM focus_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10', [userId]),
    ]);

    const user = userRes.rows[0] || {};
    const character = charRes.rows[0] || {};
    const totalFocusMinutes = (focusHistory.rows || []).reduce(
      (sum, s) => sum + (s.duration_minutes || Math.round((s.planned_duration_seconds || 0) / 60)),
      0
    );

    return {
      user: {
        id: user.id,
        displayName: user.display_name || 'Hero',
        motto: user.motto,
        timezone: user.timezone || 'UTC',
      },
      character: {
        level: character.level || 1,
        xp: character.xp || 0,
        gold: character.gold || 0,
        hp: character.hp || 50,
        maxHp: character.max_hp || 50,
        mana: character.mana || 20,
        maxMana: character.max_mana || 20,
        attributes: {
          strength: character.strength || 10,
          intelligence: character.intelligence || 10,
          vitality: character.vitality || 10,
          willpower: character.willpower || 10,
          perception: character.perception || 10,
        },
      },
      activeDailies: (dailies || []).map((d) => ({
        id: d.id,
        title: d.title,
        scheduledTime: d.scheduledTime,
        durationMinutes: d.durationMinutes,
        priority: d.priority,
        isCompleteToday: d.isCompleteToday,
        difficulty: d.difficulty,
      })),
      activeHabits: (habits || []).map((h) => ({
        id: h.id,
        title: h.title,
        currentStreak: h.currentStreak,
        direction: h.direction,
        difficulty: h.difficulty,
      })),
      activeQuests: (quests || []).map((q) => ({
        id: q.id,
        title: q.title,
        priority: q.priority,
        difficulty: q.difficulty,
        dueDate: q.dueDate,
        progressPercent: q.progressPercent,
        itemsCount: (q.items || []).length,
      })),
      totalFocusMinutes,
    };
  },

  /**
   * Chat with Jeevan AI (with OpenAI integration and reliable heuristic fallback).
   */
  async chat({ userId, message, history = [] }) {
    const context = await this.getUserContext(userId);
    const apiKey = process.env.OPENAI_API_KEY?.trim();

    if (apiKey) {
      try {
        return await this.callOpenAI({ apiKey, context, message, history });
      } catch (err) {
        console.warn('[JEEVAN_AI] OpenAI call failed or timed out, utilizing intelligent fallback:', err.message);
      }
    }

    // Heuristic action engine when OpenAI key is absent or unreachable
    return this.generateHeuristicResponse({ context, message });
  },

  /**
   * OpenAI API Handler
   */
  async callOpenAI({ apiKey, context, message, history }) {
    const systemPrompt = `You are Jeevan AI, the intelligent personal operating system and RPG strategist for ${context.user.displayName}.
Current Date & Time: ${new Date().toLocaleString()} (Timezone: ${context.user.timezone}).
User Profile: Level ${context.character.level}, XP: ${context.character.xp}, Coins: ${context.character.gold}, Total Focus: ${context.totalFocusMinutes} mins.
Active Dailies (${context.activeDailies.length}): ${JSON.stringify(context.activeDailies)}
Active Habits (${context.activeHabits.length}): ${JSON.stringify(context.activeHabits)}
Active Quests (${context.activeQuests.length}): ${JSON.stringify(context.activeQuests)}

Your Mission:
1. Provide concise, high-clarity advice and realistic schedules.
2. Respect existing fixed commitments and avoid overlapping tasks.
3. When the user asks to plan a day/tomorrow, schedule activities, create dailies/habits/quests, format your response cleanly.
4. If you propose actionable items that can be imported directly into Jeevan (e.g. creating Dailies, Habit, or Quest), append a JSON structuredAction block at the very end of your response inside a \`\`\`json structured_action ... \`\`\` code fence.

Supported structuredAction formats:
- Create Dailies:
\`\`\`json structured_action
{
  "type": "create_dailies",
  "summary": "Plan for tomorrow (5 Dailies)",
  "items": [
    { "title": "Morning Routine & Hydration", "scheduledTime": "06:30 AM", "durationMinutes": 30, "priority": "medium", "difficulty": "easy", "reminderEnabled": true, "reminderMinutesBefore": 10 },
    { "title": "Core Focus Session", "scheduledTime": "08:00 AM", "durationMinutes": 60, "priority": "high", "difficulty": "medium", "reminderEnabled": true, "reminderMinutesBefore": 10 }
  ]
}
\`\`\`
- Create Habit:
\`\`\`json structured_action
{
  "type": "create_habit",
  "summary": "Create daily exercise habit",
  "habit": { "title": "Daily Workout", "description": "Morning exercise routine", "difficulty": "medium", "direction": "positive" }
}
\`\`\`
- Create Quest:
\`\`\`json structured_action
{
  "type": "create_quest",
  "summary": "Create new Quest with subtasks",
  "quest": { "title": "Master React 19", "priority": "high", "difficulty": "hard", "subtasks": ["Server Components", "Actions", "Transitions"] }
}
\`\`\`
Never fabricate non-existent user data. Always maintain the mature, motivating Jeevan tone.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map((h) => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content })),
      { role: 'user', content: message },
    ];

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '';

    // Extract structured action if present
    let textResponse = rawContent;
    let structuredAction = null;

    const actionMatch = rawContent.match(/```json\s*(?:structured_action)?\s*([\s\S]*?)```/);
    if (actionMatch) {
      try {
        structuredAction = JSON.parse(actionMatch[1].trim());
        textResponse = rawContent.replace(actionMatch[0], '').trim();
      } catch (e) {
        console.warn('[JEEVAN_AI] Failed to parse structured action JSON:', e.message);
      }
    }

    return {
      message: textResponse,
      structuredAction,
      source: 'openai',
    };
  },

  /**
   * Intelligent Heuristic Response Engine (works instantly without requiring external API keys).
   */
  generateHeuristicResponse({ context, message }) {
    const q = message.toLowerCase().trim();

    // 1. Plan Tomorrow / Schedule intent
    if (q.includes('plan tomorrow') || q.includes('schedule') || q.includes('plan my day') || q.includes('plan day')) {
      const pendingDailies = context.activeDailies.filter((d) => !d.isCompleteToday);
      const topQuest = context.activeQuests[0];

      const plannedItems = [
        {
          title: 'Morning Awakening & Hydration',
          scheduledTime: '06:30 AM',
          durationMinutes: 30,
          priority: 'medium',
          difficulty: 'easy',
          reminderEnabled: true,
          reminderMinutesBefore: 10,
        },
        {
          title: 'Deep Focus Chamber Session',
          scheduledTime: '08:00 AM',
          durationMinutes: 60,
          priority: 'high',
          difficulty: 'medium',
          reminderEnabled: true,
          reminderMinutesBefore: 15,
        },
        ...(topQuest
          ? [
              {
                title: `Quest Progress: ${topQuest.title}`,
                scheduledTime: '02:00 PM',
                durationMinutes: 45,
                priority: 'high',
                difficulty: topQuest.difficulty || 'medium',
                reminderEnabled: true,
                reminderMinutesBefore: 10,
              },
            ]
          : []),
        ...pendingDailies.slice(0, 2).map((d, idx) => ({
          title: d.title,
          scheduledTime: idx === 0 ? '05:30 PM' : '07:30 PM',
          durationMinutes: d.durationMinutes || 30,
          priority: d.priority || 'medium',
          difficulty: d.difficulty || 'easy',
          reminderEnabled: true,
          reminderMinutesBefore: 10,
        })),
        {
          title: 'Evening Reflection & Decompression',
          scheduledTime: '09:30 PM',
          durationMinutes: 20,
          priority: 'low',
          difficulty: 'trivial',
          reminderEnabled: true,
          reminderMinutesBefore: 10,
        },
      ];

      const formattedPlan = plannedItems
        .map((item) => `• **${item.scheduledTime}** — ${item.title} (${item.durationMinutes} min, ${item.priority} priority)`)
        .join('\n');

      return {
        message: `### Tomorrow's Optimal Plan for ${context.user.displayName}\n\nBased on your active disciplines and quests, here is a realistic, non-overlapping schedule:\n\n${formattedPlan}\n\nNotifications are calibrated 10–15 minutes before each session. You can apply these directly to your Dailies below:`,
        structuredAction: {
          type: 'create_dailies',
          summary: `Add ${plannedItems.length} Scheduled Dailies for Tomorrow`,
          items: plannedItems,
        },
        source: 'heuristic',
      };
    }

    // 2. Habit creation intent
    if (q.includes('create a habit') || q.includes('create habit') || q.includes('add habit') || q.includes('new habit')) {
      let habitTitle = 'Daily Habit';
      const match = message.match(/(?:habit(?:\s+to|\s+called|\s+for)?)\s+([^.]+)/i);
      if (match && match[1]) {
        habitTitle = match[1].trim().replace(/^to\s+/i, '').replace(/^for\s+/i, '');
      }

      return {
        message: `I've prepared a new positive habit for **${habitTitle}** (+8 XP / +3 Coins per rep). Review and confirm below to forge it into your active disciplines:`,
        structuredAction: {
          type: 'create_habit',
          summary: `Forge Habit: ${habitTitle}`,
          habit: {
            title: habitTitle,
            description: `Forged via Jeevan AI assistant for ${context.user.displayName}`,
            difficulty: 'easy',
            direction: 'positive',
          },
        },
        source: 'heuristic',
      };
    }

    // 3. Priority query
    if (q.includes('focus on') || q.includes('prioritize') || q.includes('priority')) {
      const topDaily = context.activeDailies.find((d) => !d.isCompleteToday && (d.priority === 'high' || d.priority === 'critical')) || context.activeDailies[0];
      const topQuest = context.activeQuests.find((q) => q.priority === 'high' || q.priority === 'critical') || context.activeQuests[0];

      return {
        message: `### Priority Recommendation for Today\n\n1. **Immediate Focus**: ${topDaily ? `Daily Ritual: **${topDaily.title}**` : 'All scheduled Dailies for today are cleared!'}\n2. **Major Campaign**: ${topQuest ? `Quest: **${topQuest.title}** (${topQuest.progressPercent}% complete)` : 'No active high-priority quests.'}\n3. **Momentum Check**: You have **${context.activeHabits.length}** active disciplines keeping your streak alive.\n\n*Recommendation*: Enter a 25-minute Focus Chamber session right now to build momentum.`,
        structuredAction: null,
        source: 'heuristic',
      };
    }

    // Default intelligent companion response
    return {
      message: `Hello ${context.user.displayName}! I am your Jeevan AI operating agent. I can analyze your routine and take direct action for you:\n\n• **"Plan tomorrow"** — Generate an intelligent timeline and add it to your Dailies\n• **"What should I focus on?"** — Discover your highest leverage task today\n• **"Create a habit to [action]"** — Forge a new discipline\n• **"Plan my week"** — Balance quests, focus, and recovery\n\nHow can I help you level up today?`,
      structuredAction: null,
      source: 'heuristic',
    };
  },

  /**
   * Execute an AI structured action confirmed by the user.
   */
  async executeAction(userId, { actionType, payload }) {
    if (!actionType) {
      throw new Error('Action type is required.');
    }

    if (actionType === 'create_dailies') {
      const items = Array.isArray(payload?.items) ? payload.items : [payload];
      const created = [];

      for (const item of items) {
        if (!item.title) continue;
        const daily = await dailyService.createDaily(userId, {
          title: item.title,
          description: item.description || 'Planned by Jeevan AI',
          difficulty: item.difficulty || 'easy',
          activeDays: [0, 1, 2, 3, 4, 5, 6],
          scheduledTime: item.scheduledTime || null,
          durationMinutes: item.durationMinutes || 30,
          priority: item.priority || 'medium',
          reminderEnabled: Boolean(item.reminderEnabled),
          reminderMinutesBefore: item.reminderMinutesBefore || 10,
        });
        created.push(daily);
      }

      // Log notification
      await notificationService.createNotification(userId, {
        title: '🎯 AI Schedule Applied',
        body: `Created ${created.length} new scheduled Dailies for your routine.`,
        type: 'ai_recommendation',
        actionUrl: '/dailies',
      });

      return {
        success: true,
        message: `Successfully created ${created.length} Dailies with assigned times and reminders.`,
        createdCount: created.length,
        items: created,
      };
    }

    if (actionType === 'create_habit') {
      const habitData = payload.habit || payload;
      const habit = await habitService.createHabit(userId, {
        title: habitData.title,
        description: habitData.description || 'Forged with Jeevan AI',
        difficulty: habitData.difficulty || 'easy',
        direction: habitData.direction || 'positive',
      });

      await notificationService.createNotification(userId, {
        title: '🔥 New Discipline Forged',
        body: `Habit "${habit.title}" has been added to your momentum tracker.`,
        type: 'ai_recommendation',
        actionUrl: '/habits',
      });

      return {
        success: true,
        message: `Habit "${habit.title}" forged successfully.`,
        habit,
      };
    }

    if (actionType === 'create_quest') {
      const questData = payload.quest || payload;
      const quest = await questService.createQuest(userId, {
        title: questData.title,
        description: questData.description || 'Created via Jeevan AI',
        difficulty: questData.difficulty || 'medium',
        priority: questData.priority || 'medium',
      });

      if (Array.isArray(questData.subtasks)) {
        for (const sub of questData.subtasks) {
          await questService.addQuestItem(userId, quest.id, { title: sub });
        }
      }

      await notificationService.createNotification(userId, {
        title: '📜 New Quest Activated',
        body: `Quest "${quest.title}" is now active in your campaign log.`,
        type: 'quest_deadline',
        actionUrl: '/quests',
      });

      return {
        success: true,
        message: `Quest "${quest.title}" created with subtasks.`,
        quest,
      };
    }

    throw new Error(`Unsupported action type: ${actionType}`);
  },
};
