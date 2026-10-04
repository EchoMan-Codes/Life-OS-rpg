import { query, pool } from '../db/pool.js';
import { dailyService } from './daily.service.js';
import { habitService } from './habit.service.js';
import { questService } from './quest.service.js';
import { notificationService } from './notification.service.js';

/**
 * Jeevan AI Service
 * Comprehensive AI Agent architecture supporting OpenAI and Google Gemini provider adapters,
 * real application context integration, and validated structured tool executions.
 */
export const aiService = {
  /**
   * Gather comprehensive user context for AI prompt.
   */
  async getUserContext(userId) {
    const [userRes, charRes, dailies, habits, quests, focusHistory, todayRef] = await Promise.all([
      query(
        'SELECT id, display_name, motto, timezone, notification_preferences, ai_preferences FROM users WHERE id = $1',
        [userId]
      ),
      query(
        'SELECT level, xp, hp, max_hp, mana, max_mana, gold, strength, intelligence, vitality, willpower, perception FROM character_stats WHERE user_id = $1',
        [userId]
      ),
      dailyService.listDailies(userId),
      habitService.listHabits(userId),
      questService.listQuests(userId, { status: 'active' }),
      query(
        'SELECT duration_minutes, planned_duration_seconds, status, created_at FROM focus_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
        [userId]
      ),
      query(
        'SELECT mood, notes, created_at FROM reflections WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [userId]
      ),
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
        aiPreferences: user.ai_preferences || {},
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
        reminderEnabled: d.reminderEnabled,
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
        reminderEnabled: q.reminderEnabled,
        reminderTime: q.reminderTime,
        itemsCount: (q.items || []).length,
        items: (q.items || []).map((i) => ({ id: i.id, title: i.title, isComplete: i.isComplete })),
      })),
      totalFocusMinutes,
      recentReflection: todayRef.rows[0] || null,
    };
  },

  /**
   * Primary Chat Entrypoint.
   * Delegates to selected provider (OpenAI | Gemini) with automated fallback to the heuristic agent.
   */
  async chat({ userId, message, history = [] }) {
    const context = await this.getUserContext(userId);
    const preferredProvider = context.user.aiPreferences?.provider || process.env.AI_PROVIDER || 'openai';

    // 1. Try Gemini if configured as preferred
    if (preferredProvider === 'gemini') {
      const geminiKey = process.env.GEMINI_API_KEY?.trim();
      if (geminiKey) {
        try {
          return await this.callGemini({ apiKey: geminiKey, context, message, history });
        } catch (err) {
          console.warn('[JEEVAN_AI] Gemini call failed, trying backup:', err.message);
        }
      }
    }

    // 2. Try OpenAI
    const openAiKey = process.env.OPENAI_API_KEY?.trim();
    if (openAiKey) {
      try {
        return await this.callOpenAI({ apiKey: openAiKey, context, message, history });
      } catch (err) {
        console.warn('[JEEVAN_AI] OpenAI call failed:', err.message);
      }
    }

    // 3. Try Gemini as fallback if OpenAI failed
    if (preferredProvider !== 'gemini') {
      const geminiKey = process.env.GEMINI_API_KEY?.trim();
      if (geminiKey) {
        try {
          return await this.callGemini({ apiKey: geminiKey, context, message, history });
        } catch (err) {
          console.warn('[JEEVAN_AI] Gemini fallback failed:', err.message);
        }
      }
    }

    // 4. Guaranteed intelligent heuristic response engine
    return this.generateHeuristicResponse({ context, message });
  },

  /**
   * System Prompt Generator
   */
  buildSystemPrompt(context) {
    return `You are Jeevan AI, the deeply integrated personal operating system and RPG strategist for ${context.user.displayName}.
Current Date & Time: ${new Date().toLocaleString()} (Timezone: ${context.user.timezone}).
User Profile: Level ${context.character.level}, XP: ${context.character.xp}, Coins: ${context.character.gold}, Total Focus: ${context.totalFocusMinutes} mins.
Active Dailies (${context.activeDailies.length}): ${JSON.stringify(context.activeDailies)}
Active Habits (${context.activeHabits.length}): ${JSON.stringify(context.activeHabits)}
Active Quests (${context.activeQuests.length}): ${JSON.stringify(context.activeQuests)}
Recent Reflection: ${context.recentReflection ? JSON.stringify(context.recentReflection) : 'None recorded yet'}

Capabilities:
1. Provide actionable advice, realistic schedules, productivity insights, and reflection guidance.
2. Natural-language scheduling: Always respect existing commitments, wake/sleep constraints, and eliminate overlapping activities.
3. Structured Tool Generation:
   When the user asks you to schedule their day, plan tomorrow, create/edit tasks, modify a daily, cancel a workout, or break down a quest, ALWAYS include a JSON structured_action block at the end of your response inside a \`\`\`json structured_action ... \`\`\` block.

Supported Structured Action Types:
- "create_dailies": { "type": "create_dailies", "summary": "...", "items": [{ "title": "...", "scheduledTime": "08:00 AM", "durationMinutes": 60, "priority": "high", "reminderEnabled": true, "reminderMinutesBefore": 10 }] }
- "create_habit": { "type": "create_habit", "summary": "...", "habit": { "title": "...", "description": "...", "difficulty": "easy", "direction": "positive" } }
- "create_quest": { "type": "create_quest", "summary": "...", "quest": { "title": "...", "priority": "high", "difficulty": "hard", "dueDate": "YYYY-MM-DD", "subtasks": ["..."] } }
- "update_daily": { "type": "update_daily", "summary": "...", "dailyId": "uuid", "scheduledTime": "08:00 PM", "durationMinutes": 60 }
- "delete_daily": { "type": "delete_daily", "summary": "...", "dailyId": "uuid", "title": "..." }
- "add_quest_subtasks": { "type": "add_quest_subtasks", "summary": "...", "questId": "uuid", "subtasks": ["..."] }

Never fabricate non-existent user data. Be encouraging, concise, and structured.`;
  },

  /**
   * OpenAI API Provider Adapter
   */
  async callOpenAI({ apiKey, context, message, history }) {
    const systemPrompt = this.buildSystemPrompt(context);
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
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '';

    return this.parseAiResponse(rawContent, 'openai');
  },

  /**
   * Google Gemini API Provider Adapter
   */
  async callGemini({ apiKey, context, message, history }) {
    const systemPrompt = this.buildSystemPrompt(context);
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    const contents = [
      ...history.slice(-6).map((h) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1200,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return this.parseAiResponse(rawContent, 'gemini');
  },

  /**
   * Parse AI text and extract structured actions from JSON code blocks
   */
  parseAiResponse(rawContent, source) {
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
      source,
    };
  },

  /**
   * Intelligent Heuristic Agent Engine (Works 100% offline & without API keys)
   */
  generateHeuristicResponse({ context, message }) {
    const q = message.toLowerCase().trim();

    // 1. Move task / Reschedule Daily
    // E.g.: "Move my DBMS Daily to 8 PM"
    const moveMatch = message.match(/(?:move|reschedule|shift)\s+(?:my\s+)?(.+?)\s+(?:daily\s+)?to\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    if (moveMatch) {
      const targetQuery = moveMatch[1].toLowerCase().trim();
      let targetTime = moveMatch[2].trim().toUpperCase();
      if (!targetTime.includes('AM') && !targetTime.includes('PM')) {
        targetTime += ' PM';
      }

      const matchedDaily = context.activeDailies.find((d) => d.title.toLowerCase().includes(targetQuery));
      if (matchedDaily) {
        return {
          message: `I've prepared an action to reschedule **${matchedDaily.title}** to **${targetTime}**. Notifications will automatically align 10 minutes prior.\n\nReview and confirm below:`,
          structuredAction: {
            type: 'update_daily',
            summary: `Reschedule ${matchedDaily.title} to ${targetTime}`,
            dailyId: matchedDaily.id,
            title: matchedDaily.title,
            scheduledTime: targetTime,
          },
          source: 'heuristic',
        };
      }
    }

    // 2. Modify Task Duration
    // E.g.: "Make my DSA session 90 minutes"
    const durationMatch = message.match(/(?:make|set|change)\s+(?:my\s+)?(.+?)\s+(?:session|daily)?\s*(?:to\s+)?(\d+)\s*(?:mins|min|minutes)/i);
    if (durationMatch) {
      const targetQuery = durationMatch[1].toLowerCase().trim();
      const newDuration = parseInt(durationMatch[2], 10);
      const matchedDaily = context.activeDailies.find((d) => d.title.toLowerCase().includes(targetQuery));
      if (matchedDaily && newDuration > 0) {
        return {
          message: `I've adjusted the planned duration for **${matchedDaily.title}** from ${matchedDaily.durationMinutes}m to **${newDuration}m**.\n\nConfirm to update your schedule:`,
          structuredAction: {
            type: 'update_daily',
            summary: `Update ${matchedDaily.title} duration to ${newDuration} min`,
            dailyId: matchedDaily.id,
            title: matchedDaily.title,
            durationMinutes: newDuration,
          },
          source: 'heuristic',
        };
      }
    }

    // 3. Cancel / Delete Daily
    // E.g.: "Cancel tomorrow's workout"
    const cancelMatch = message.match(/(?:cancel|remove|delete)\s+(?:tomorrow['’]s\s+|today['’]s\s+|my\s+)?(.+)/i);
    if (cancelMatch) {
      const targetQuery = cancelMatch[1].toLowerCase().trim();
      const matchedDaily = context.activeDailies.find((d) => d.title.toLowerCase().includes(targetQuery));
      if (matchedDaily) {
        return {
          message: `I found the scheduled task **${matchedDaily.title}**. Cancelling it will free up ${matchedDaily.durationMinutes} minutes in your timeline.\n\nConfirm cancellation below:`,
          structuredAction: {
            type: 'delete_daily',
            summary: `Cancel Daily: ${matchedDaily.title}`,
            dailyId: matchedDaily.id,
            title: matchedDaily.title,
          },
          source: 'heuristic',
        };
      }
    }

    // 4. Break Quest into Subtasks
    // E.g.: "Break this Quest into 5 subtasks" or "Break DBMS into smaller subtasks"
    if (q.includes('break') && (q.includes('quest') || q.includes('subtask'))) {
      const topQuest = context.activeQuests[0];
      const questTitle = topQuest ? topQuest.title : 'Target Quest';
      const subtasks = [
        'Core Foundations & Architectural Concepts',
        'Practical Problem Sets & Code Walkthrough',
        'Deep Focus Sprint (60 min uninterrupted)',
        'Comprehensive Review & Edge Case Analysis',
        'Milestone Check & Knowledge Verification',
      ];

      return {
        message: `I've broken down **${questTitle}** into 5 structured, progressive milestones. Each item awards +2 XP upon completion.\n\nReview the subtask roadmap below:`,
        structuredAction: {
          type: 'add_quest_subtasks',
          summary: `Add 5 Subtasks to ${questTitle}`,
          questId: topQuest?.id || null,
          questTitle,
          subtasks,
        },
        source: 'heuristic',
      };
    }

    // 5. Plan Tomorrow / Scheduling with Constraints
    if (q.includes('plan tomorrow') || q.includes('schedule') || q.includes('plan my day') || q.includes('plan day')) {
      const pendingDailies = context.activeDailies.filter((d) => !d.isCompleteToday);
      const topQuest = context.activeQuests[0];

      // Parse user constraints if mentioned
      const hasCollege = q.includes('college');
      const plannedItems = [];

      // Early morning
      plannedItems.push({
        title: 'Morning Awakening & Routine',
        scheduledTime: '06:30 AM',
        durationMinutes: 30,
        priority: 'medium',
        difficulty: 'easy',
        reminderEnabled: true,
        reminderMinutesBefore: 10,
      });

      // Morning focus
      plannedItems.push({
        title: 'DSA Practice & Problem Solving',
        scheduledTime: '08:00 AM',
        durationMinutes: 60,
        priority: 'high',
        difficulty: 'medium',
        reminderEnabled: true,
        reminderMinutesBefore: 15,
      });

      // If college mentioned or default daytime schedule
      if (hasCollege) {
        // College slot is a preserved commitment (10:45 AM - 05:30 PM), no overlapping tasks!
        plannedItems.push({
          title: 'Post-College Rest & Recharge',
          scheduledTime: '05:30 PM',
          durationMinutes: 45,
          priority: 'low',
          difficulty: 'trivial',
          reminderEnabled: false,
          reminderMinutesBefore: 0,
        });
        plannedItems.push({
          title: 'DBMS Core Study & Revision',
          scheduledTime: '06:30 PM',
          durationMinutes: 60,
          priority: 'high',
          difficulty: 'medium',
          reminderEnabled: true,
          reminderMinutesBefore: 10,
        });
        plannedItems.push({
          title: topQuest ? `Quest: ${topQuest.title}` : 'Advanced Project Work',
          scheduledTime: '08:00 PM',
          durationMinutes: 60,
          priority: 'medium',
          difficulty: 'medium',
          reminderEnabled: true,
          reminderMinutesBefore: 10,
        });
      } else {
        if (topQuest) {
          plannedItems.push({
            title: `Quest Progress: ${topQuest.title}`,
            scheduledTime: '02:00 PM',
            durationMinutes: 60,
            priority: 'high',
            difficulty: topQuest.difficulty || 'medium',
            reminderEnabled: true,
            reminderMinutesBefore: 10,
          });
        }
        pendingDailies.slice(0, 2).forEach((d, idx) => {
          plannedItems.push({
            title: d.title,
            scheduledTime: idx === 0 ? '04:30 PM' : '07:00 PM',
            durationMinutes: d.durationMinutes || 45,
            priority: d.priority || 'medium',
            difficulty: d.difficulty || 'easy',
            reminderEnabled: true,
            reminderMinutesBefore: 10,
          });
        });
      }

      // Wind down before 10 PM
      plannedItems.push({
        title: 'Daily Reflection & Day Review',
        scheduledTime: '09:30 PM',
        durationMinutes: 20,
        priority: 'low',
        difficulty: 'trivial',
        reminderEnabled: true,
        reminderMinutesBefore: 10,
      });

      const formattedPlan = plannedItems
        .map((item) => `• **${item.scheduledTime}** — ${item.title} (${item.durationMinutes} min, ${item.priority} priority)`)
        .join('\n');

      return {
        message: `### Tomorrow's Optimal Plan for ${context.user.displayName}\n\nBased on your active commitments, here is a realistic, non-overlapping schedule:\n\n${formattedPlan}\n\nAll tasks include notifications calibrated 10 minutes beforehand and leave evening recovery intact. Tap below to add them directly to your Dailies:`,
        structuredAction: {
          type: 'create_dailies',
          summary: `Add ${plannedItems.length} Scheduled Dailies for Tomorrow`,
          items: plannedItems,
        },
        source: 'heuristic',
      };
    }

    // 6. Habit creation
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

    // 7. Productivity & Consistency Analysis
    if (q.includes('consistency') || q.includes('productivity') || q.includes('analyze') || q.includes('progress')) {
      const completedDailies = context.activeDailies.filter((d) => d.isCompleteToday).length;
      const totalDailies = context.activeDailies.length;
      const completionRate = totalDailies > 0 ? Math.round((completedDailies / totalDailies) * 100) : 0;
      const activeStreak = context.activeHabits.reduce((max, h) => Math.max(max, h.currentStreak || 0), 0);

      return {
        message: `### Productivity Intelligence Report\n\n• **Daily Clearance Rate**: ${completedDailies}/${totalDailies} (${completionRate}%)\n• **Current Peak Streak**: ${activeStreak} days across ${context.activeHabits.length} active disciplines\n• **Focus Chamber Telemetry**: ${context.totalFocusMinutes} minutes recorded\n• **Active Quests**: ${context.activeQuests.length} in progress\n\n💡 **Insight**: Your consistency thrives when scheduling your highest cognitive load tasks (like DSA and DBMS) in the morning before 10 AM. Evening sessions benefit most from review and reflection.`,
        structuredAction: null,
        source: 'heuristic',
      };
    }

    // 8. Priority query
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
      message: `Hello ${context.user.displayName}! I am your Jeevan AI operating agent. I can analyze your routine and take direct action for you:\n\n• **"Plan tomorrow"** — Generate an intelligent timeline and add it to your Dailies\n• **"Move my DBMS Daily to 8 PM"** — Reschedule tasks effortlessly\n• **"Cancel tomorrow's workout"** — Remove an unwanted session\n• **"Break this Quest into subtasks"** — Deconstruct a big goal\n• **"What should I focus on?"** — Discover your highest leverage task today\n• **"Analyze my week"** — Review productivity and consistency trends\n\nHow can I help you level up today?`,
      structuredAction: null,
      source: 'heuristic',
    };
  },

  /**
   * Execute an AI structured action confirmed by the user.
   * Enforces rigorous tenant isolation and validation.
   */
  async executeAction(userId, { actionType, payload }) {
    if (!actionType) {
      throw new Error('Action type is required.');
    }

    // 1. Create Dailies
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

    // 2. Update Daily (e.g. reschedule or change duration)
    if (actionType === 'update_daily') {
      const { dailyId, title, scheduledTime, durationMinutes, priority } = payload;
      if (!dailyId) throw new Error('Daily ID is required for update.');

      // Verify ownership
      const checkRes = await query('SELECT id, title FROM dailies WHERE id = $1 AND user_id = $2', [dailyId, userId]);
      if (checkRes.rows.length === 0) throw new Error('Daily not found or unauthorized.');

      const updated = await dailyService.updateDaily(userId, dailyId, {
        title,
        scheduledTime,
        durationMinutes,
        priority,
      });

      await notificationService.createNotification(userId, {
        title: '⏰ Daily Rescheduled',
        body: `"${updated.title}" updated to ${updated.scheduledTime || 'new time'}.`,
        type: 'daily_reminder',
        actionUrl: '/dailies',
      });

      return {
        success: true,
        message: `Daily "${updated.title}" updated successfully.`,
        daily: updated,
      };
    }

    // 3. Delete Daily
    if (actionType === 'delete_daily') {
      const { dailyId } = payload;
      if (!dailyId) throw new Error('Daily ID is required for deletion.');

      await dailyService.deleteDaily(userId, dailyId);

      return {
        success: true,
        message: 'Daily removed from your schedule.',
      };
    }

    // 4. Create Habit
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

    // 5. Create Quest
    if (actionType === 'create_quest') {
      const questData = payload.quest || payload;
      const quest = await questService.createQuest(userId, {
        title: questData.title,
        description: questData.description || 'Created via Jeevan AI',
        difficulty: questData.difficulty || 'medium',
        priority: questData.priority || 'medium',
        dueDate: questData.dueDate || null,
        reminderEnabled: Boolean(questData.reminderEnabled),
        reminderTime: questData.reminderTime || '19:00',
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

    // 6. Add Quest Subtasks
    if (actionType === 'add_quest_subtasks') {
      const { questId, subtasks } = payload;
      let targetQuestId = questId;

      if (!targetQuestId) {
        const activeQuests = await questService.listQuests(userId, { status: 'active' });
        if (activeQuests.length > 0) targetQuestId = activeQuests[0].id;
        else throw new Error('No active quest found to add subtasks to.');
      }

      const added = [];
      if (Array.isArray(subtasks)) {
        for (const sub of subtasks) {
          const item = await questService.addQuestItem(userId, targetQuestId, { title: sub });
          added.push(item);
        }
      }

      return {
        success: true,
        message: `Added ${added.length} subtasks to the quest.`,
        subtasks: added,
      };
    }

    throw new Error(`Unsupported action type: ${actionType}`);
  },
};
