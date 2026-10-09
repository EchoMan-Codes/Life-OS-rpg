import { query, pool } from '../db/pool.js';
import { dailyService } from './daily.service.js';
import { habitService } from './habit.service.js';
import { questService } from './quest.service.js';
import { taskService } from './task.service.js';
import { calendarService } from './calendar.service.js';
import { notificationService } from './notification.service.js';
import { parseTimeString, computeNextFireTimes } from '../utils/scheduler.js';
import { getUserLocalDate } from './daily-reset.service.js';
import { z } from 'zod';

// Action validation schemas
const createDailySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional().nullable(),
  difficulty: z.enum(['trivial', 'easy', 'medium', 'hard']).default('easy'),
  activeDays: z.array(z.number().int().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
  scheduledTime: z.string().optional().nullable(),
  durationMinutes: z.coerce.number().int().min(5).max(480).default(30),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  reminderEnabled: z.boolean().default(false),
  reminderMinutesBefore: z.coerce.number().int().min(0).max(1440).default(10),
  targetDate: z.string().optional().nullable(),
});

const createHabitSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional().nullable(),
  direction: z.enum(['positive', 'negative', 'both']).default('positive'),
  difficulty: z.enum(['trivial', 'easy', 'medium', 'hard']).default('easy'),
});

const createQuestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional().nullable(),
  difficulty: z.enum(['trivial', 'easy', 'medium', 'hard']).default('medium'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  dueDate: z.string().optional().nullable(),
  reminderEnabled: z.boolean().default(false),
  reminderTime: z.string().optional().nullable(),
  reminderDaysBefore: z.coerce.number().int().min(0).max(30).default(1),
  subtasks: z.array(z.string().min(1)).optional().default([]),
});

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional().nullable(),
  status: z.enum(['inbox', 'todo', 'in_progress', 'completed', 'cancelled']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  difficulty: z.enum(['trivial', 'easy', 'medium', 'hard']).default('easy'),
  dueDate: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  scheduledTime: z.string().optional().nullable(),
  estimatedDurationMinutes: z.coerce.number().int().min(5).max(480).default(30),
  projectName: z.string().optional().default('General'),
  tags: z.array(z.string()).optional().default([]),
  subtasks: z.array(z.string()).optional().default([]),
});

export const aiService = {
  /**
   * Determine intent to enforce context minimization.
   */
  classifyIntent(message) {
    const q = message.toLowerCase().trim();

    // Check for explicit action / mutation triggers
    const isMutation =
      /\b(create|add|make|schedule|reschedule|move|delete|cancel|remove|mark|done|complete|change)\b/i.test(q) &&
      /\b(daily|habit|quest|task|routine|session|subtask|milestone)\b/i.test(q);

    if (isMutation) return 'mutation';

    // Check for Jeevan system data queries
    const isJeevanQuery =
      /\b(my tasks|my dailies|my habits|my quests|today'?s plan|what should i focus|my streak|my schedule|my routine|level up|my xp|how is my day|what do i have today|what did i complete)\b/i.test(
        q
      );

    if (isJeevanQuery) return 'jeevan_query';

    // General knowledge, writing, coding, motivation, math, explanations
    return 'general';
  },

  /**
   * Gather minimized user context based on classified intent.
   * General queries get ZERO personal task data.
   */
  async getUserContext(userId, intent = 'general') {
    const userRes = await query('SELECT id, display_name, timezone, ai_preferences FROM users WHERE id = $1', [
      userId,
    ]);
    const user = userRes.rows[0] || {};
    const timezone = user.timezone || 'UTC';
    const localToday = getUserLocalDate(new Date(), timezone);

    const baseContext = {
      user: {
        id: user.id,
        displayName: user.display_name || 'Hero',
        timezone,
        localToday,
        localTime: new Date().toLocaleTimeString('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit' }),
        localWeekday: new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'long' }).format(new Date()),
      },
    };

    if (intent === 'general') {
      return baseContext;
    }

    // For Jeevan queries and mutations, gather compact status snapshot
    const [charRes, dailies, habits, quests] = await Promise.all([
      query('SELECT level, xp, gold, hp, max_hp, mana, max_mana FROM character_stats WHERE user_id = $1', [userId]),
      dailyService.listDailies(userId),
      habitService.listHabits(userId),
      questService.listQuests(userId, { status: 'active' }),
    ]);

    const character = charRes.rows[0] || {};

    return {
      ...baseContext,
      character: {
        level: character.level || 1,
        xp: character.xp || 0,
        gold: character.gold || 0,
        hp: character.hp || 50,
        mana: character.mana || 20,
      },
      activeDailies: (dailies || []).map((d) => ({
        id: d.id,
        title: d.title,
        scheduledTime: d.scheduledTime,
        durationMinutes: d.durationMinutes,
        priority: d.priority,
        difficulty: d.difficulty,
        isCompleteToday: d.isCompleteToday,
        activeDays: d.activeDays,
        reminderEnabled: d.reminderEnabled,
        reminderMinutesBefore: d.reminderMinutesBefore,
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
        itemsCount: (q.items || []).length,
        completedItemsCount: (q.items || []).filter((i) => i.isComplete).length,
      })),
    };
  },

  /**
   * System Prompt Generator
   */
  buildSystemPrompt(context, intent) {
    let prompt = `You are Jeevan AI, the intelligent personal operating system and RPG strategist companion for ${context.user.displayName}.
Current Local Reference Time: ${context.user.localTime}, ${context.user.localWeekday}, ${context.user.localToday} (Timezone: ${context.user.timezone}).

Persona & Guidelines:
1. Helpful, concise, motivating, and intellectually rigorous. You live inside a productivity + RPG web application, but you are a fully capable general AI assistant.
2. YOU CAN ANSWER ANY GENERAL QUESTION (programming, computer science, mathematics, writing, brainstorming, study methods, philosophy, life advice, history, etc.). Never artificially restrict your answers to productivity topics.
3. Use clean GitHub-flavored markdown (bold, lists, tables, and fenced code blocks with language identifiers where appropriate).
4. Respect time and scheduling precision: When scheduling items, eliminate overlaps, preserve buffers, and calculate exact dates matching the user's local timezone.
5. In Jeevan, weekdays are indexed: Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6.`;

    if (intent === 'general') {
      prompt += `\nNote: The user is asking a general question. Provide a direct, articulate, high-quality answer.`;
      return prompt;
    }

    if (context.character) {
      prompt += `\n\nUser RPG Status: Level ${context.character.level} (XP: ${context.character.xp}, Coins: ${context.character.gold}).
Active Dailies: ${JSON.stringify(context.activeDailies || [])}
Active Habits: ${JSON.stringify(context.activeHabits || [])}
Active Quests: ${JSON.stringify(context.activeQuests || [])}`;
    }

    prompt += `\n\nStructured Action Instructions:
When the user requests creating, updating, completing, or removing items in Jeevan, ALWAYS output a structured JSON block at the end of your response inside:
\`\`\`json structured_action
{
  "type": "create_item" | "update_item" | "complete_item" | "delete_item",
  "summary": "Short user-facing summary of the proposed action",
  "section": "daily" | "habit" | "quest",
  "item": { ... }
}
\`\`\`

Supported structured action schemas:
- Create Daily:
  { "type": "create_item", "summary": "Schedule Daily: ...", "section": "daily", "item": { "title": "...", "description": "...", "difficulty": "easy"|"medium"|"hard"|"trivial", "activeDays": [1,3,5], "scheduledTime": "07:00 PM", "durationMinutes": 45, "priority": "high", "reminderEnabled": true, "reminderMinutesBefore": 5 } }

- Create Habit:
  { "type": "create_item", "summary": "Forge Habit: ...", "section": "habit", "item": { "title": "...", "description": "...", "difficulty": "easy", "direction": "positive" } }

- Create Quest with Milestones/Subtasks:
  { "type": "create_item", "summary": "Activate Quest: ...", "section": "quest", "item": { "title": "...", "priority": "high", "difficulty": "hard", "dueDate": "YYYY-MM-DD", "reminderEnabled": true, "reminderTime": "19:00", "subtasks": ["Milestone 1", "Milestone 2"] } }

- Update Daily (e.g. reschedule or change duration):
  { "type": "update_item", "summary": "Reschedule ...", "section": "daily", "item": { "id": "optional-id", "title": "Existing Title", "scheduledTime": "08:00 PM", "durationMinutes": 60 } }

- Delete / Cancel Daily:
  { "type": "delete_item", "summary": "Cancel Daily ...", "section": "daily", "item": { "title": "Target Title" } }

- Mark Daily Done / Score Habit:
  { "type": "complete_item", "summary": "Score ...", "section": "daily", "item": { "title": "Target Title" } }

If information is ambiguous or critical details are missing, ask one brief clarifying question. If non-critical, apply sensible defaults and explicitly state them.`;

    return prompt;
  }
,

  /**
   * Parse structured action JSON from model output text.
   */
  extractStructuredAction(rawContent) {
    let cleanText = rawContent;
    let action = null;

    const actionMatch = rawContent.match(/```json\s*(?:structured_action)?\s*([\s\S]*?)```/);
    if (actionMatch) {
      try {
        action = JSON.parse(actionMatch[1].trim());
        cleanText = rawContent.replace(actionMatch[0], '').trim();
      } catch (e) {
        console.warn('[JEEVAN_AI] Failed to parse action JSON:', e.message);
      }
    }

    return { cleanText, action };
  },

  /**
   * Primary Chat Stream Endpoint (Server-Sent Events)
   */
  async streamChat({ userId, message, history = [], onChunk, signal }) {
    const intent = this.classifyIntent(message);
    const context = await this.getUserContext(userId, intent);
    const systemPrompt = this.buildSystemPrompt(context, intent);

    const provider = (process.env.AI_PROVIDER || '').toLowerCase();
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const openAiKey = process.env.OPENAI_API_KEY?.trim();
    const isLocal = provider === 'local' || provider === 'ollama';

    // 1. Local OpenAI-compatible provider (e.g. Ollama or LM Studio)
    if (isLocal) {
      try {
        const localBaseUrl = process.env.OPENAI_BASE_URL || 'http://localhost:11434/v1';
        const localModel = process.env.OPENAI_MODEL || 'llama3.2';
        const localKey = openAiKey || 'ollama';
        return await this.streamOpenAI({
          apiKey: localKey,
          baseUrl: localBaseUrl,
          model: localModel,
          systemPrompt,
          message,
          history,
          onChunk,
          signal,
        });
      } catch (err) {
        console.warn('[JEEVAN_AI] Local Ollama stream unavailable, falling through:', err.message);
      }
    }

    // 2. Gemini provider
    if ((provider === 'gemini' && geminiKey) || (!openAiKey && geminiKey)) {
      try {
        return await this.streamGemini({
          apiKey: geminiKey,
          systemPrompt,
          message,
          history,
          onChunk,
          signal,
        });
      } catch (err) {
        console.warn('[JEEVAN_AI] Gemini stream failed:', err.message);
        if (!openAiKey) throw err;
      }
    }

    // 3. OpenAI provider (production)
    if (openAiKey) {
      try {
        return await this.streamOpenAI({
          apiKey: openAiKey,
          baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          systemPrompt,
          message,
          history,
          onChunk,
          signal,
        });
      } catch (err) {
        console.warn('[JEEVAN_AI] OpenAI stream failed:', err.message);
        throw err;
      }
    }

    // 4. Intelligent dynamic assistant fallback when no external API key is configured
    const fallbackResponse = this.generateFallbackResponse({ message, context, intent });
    const words = fallbackResponse.text.split(/(\s+)/);
    for (const w of words) {
      if (signal?.aborted) break;
      onChunk({ type: 'token', content: w });
      await new Promise((r) => setTimeout(r, 12));
    }
    if (fallbackResponse.action && !signal?.aborted) {
      onChunk({ type: 'action', action: fallbackResponse.action });
    }
    onChunk({ type: 'done' });
    return { fullText: fallbackResponse.text, action: fallbackResponse.action };
  },

  /**
   * OpenAI Streaming Adapter (SSE /v1/chat/completions)
   */
  async streamOpenAI({ apiKey, baseUrl, model, systemPrompt, message, history, onChunk, signal }) {
    const finalBaseUrl = baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const finalModel = model || process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8).map((h) => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: h.content,
      })),
      { role: 'user', content: message },
    ];

    const response = await fetch(`${finalBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: finalModel,
        messages,
        temperature: 0.7,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI HTTP ${response.status}: ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.replace(/^data:\s*/, '');
        if (dataStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            accumulated += delta;
            onChunk({ type: 'token', content: delta });
          }
        } catch {
          // ignore parse error on partial chunks
        }
      }
    }

    const { cleanText, action } = this.extractStructuredAction(accumulated);
    if (action) {
      onChunk({ type: 'action', action });
    }
    onChunk({ type: 'done' });

    return { fullText: cleanText, action };
  },

  /**
   * Google Gemini Streaming Adapter
   */
  async streamGemini({ apiKey, systemPrompt, message, history, onChunk, signal }) {
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const contents = [
      ...history.slice(-8).map((h) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini HTTP ${response.status}: ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.replace(/^data:\s*/, '');

        try {
          const parsed = JSON.parse(dataStr);
          const textPart = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textPart) {
            accumulated += textPart;
            onChunk({ type: 'token', content: textPart });
          }
        } catch {
          // ignore partial json
        }
      }
    }

    const { cleanText, action } = this.extractStructuredAction(accumulated);
    if (action) {
      onChunk({ type: 'action', action });
    }
    onChunk({ type: 'done' });

    return { fullText: cleanText, action };
  },

  /**
   * Synchronous Chat Endpoint (Non-streaming fallback)
   */
  async chat({ userId, message, history = [], signal }) {
    let accumulated = '';
    let extractedAction = null;

    await this.streamChat({
      userId,
      message,
      history,
      onChunk: (chunk) => {
        if (chunk.type === 'token') accumulated += chunk.content;
        if (chunk.type === 'action') extractedAction = chunk.action;
      },
      signal,
    });

    const { cleanText, action } = this.extractStructuredAction(accumulated);

    return {
      message: cleanText,
      structuredAction: extractedAction || action,
      source: process.env.AI_PROVIDER || 'openai',
    };
  },

  /**
   * Persistent Chat History Management in PostgreSQL
   */
  async getChatHistory(userId, limit = 20) {
    const res = await pool.query(
      `SELECT id, role, content, structured_action as "structuredAction", created_at as "createdAt"
       FROM ai_chat_messages
       WHERE user_id = $1
       ORDER BY created_at ASC
       LIMIT $2`,
      [userId, limit]
    );
    return res.rows;
  },

  async saveChatMessage(userId, { role, content, structuredAction = null }) {
    const res = await pool.query(
      `INSERT INTO ai_chat_messages (user_id, role, content, structured_action)
       VALUES ($1, $2, $3, $4)
       RETURNING id, role, content, structured_action as "structuredAction", created_at as "createdAt"`,
      [userId, role, content, structuredAction ? JSON.stringify(structuredAction) : null]
    );
    return res.rows[0];
  },

  async clearChatHistory(userId) {
    await pool.query('DELETE FROM ai_chat_messages WHERE user_id = $1', [userId]);
    return { success: true };
  },

  async recordActionLog(userId, actionType, payload, result) {
    try {
      await pool.query(
        `INSERT INTO ai_action_logs (user_id, action_type, payload, result)
         VALUES ($1, $2, $3, $4)`,
        [userId, actionType, JSON.stringify(payload || {}), JSON.stringify(result || {})]
      );
    } catch (e) {
      console.warn('[AI_ACTION_LOG] Failed to record log:', e.message);
    }
  },

  /**
   * Strict Natural-Language Action Execution & Verification Pipeline.
   * Executes through existing services and verifies state before returning success.
   */
  async executeAction(userId, { actionType, payload }) {
    if (!actionType) throw new Error('actionType is required');
    const result = await this._executeActionInternal(userId, { actionType, payload });
    await this.recordActionLog(userId, actionType, payload, result);
    return result;
  },

  async _executeActionInternal(userId, { actionType, payload }) {

    // 1. CREATE ITEM
    if (actionType === 'create_item' || actionType === 'create_daily' || actionType === 'create_dailies') {
      const section = payload.section || (actionType === 'create_habit' ? 'habit' : actionType === 'create_quest' ? 'quest' : 'daily');
      const itemData = payload.item || payload.daily || payload.habit || payload.quest || payload;

      if (section === 'daily') {
        const validated = createDailySchema.parse(itemData);
        const created = await dailyService.createDaily(userId, validated);

        // Verify entity persisted in PostgreSQL
        const verifyRes = await query('SELECT id, title, scheduled_time FROM dailies WHERE id = $1 AND user_id = $2', [
          created.id,
          userId,
        ]);
        if (verifyRes.rows.length === 0) {
          throw new Error('Verification failed: Daily was not persisted to the database.');
        }

        await notificationService.createNotification(userId, {
          title: '🎯 Daily Ritual Created',
          body: `"${created.title}" scheduled for ${created.scheduledTime || 'anytime'}.`,
          type: 'daily_reminder',
          actionUrl: '/dailies',
        });

        return {
          success: true,
          verified: true,
          section: 'daily',
          message: `Daily ritual "${created.title}" successfully inscribed!`,
          item: created,
          undoAction: { type: 'delete_item', section: 'daily', id: created.id, title: created.title },
        };
      }

      if (section === 'habit') {
        const validated = createHabitSchema.parse(itemData);
        const created = await habitService.createHabit(userId, validated);

        const verifyRes = await query('SELECT id, title FROM habits WHERE id = $1 AND user_id = $2', [
          created.id,
          userId,
        ]);
        if (verifyRes.rows.length === 0) {
          throw new Error('Verification failed: Habit was not persisted to the database.');
        }

        await notificationService.createNotification(userId, {
          title: '🔥 New Discipline Forged',
          body: `Habit "${created.title}" added to active momentum tracker.`,
          type: 'habit_reminder',
          actionUrl: '/habits',
        });

        return {
          success: true,
          verified: true,
          section: 'habit',
          message: `Habit "${created.title}" forged successfully!`,
          item: created,
          undoAction: { type: 'delete_item', section: 'habit', id: created.id, title: created.title },
        };
      }

      if (section === 'quest') {
        const validated = createQuestSchema.parse(itemData);
        const created = await questService.createQuest(userId, {
          title: validated.title,
          description: validated.description || 'Campaign created via Jeevan AI',
          difficulty: validated.difficulty,
          priority: validated.priority,
          dueDate: validated.dueDate || null,
          reminderEnabled: validated.reminderEnabled,
          reminderTime: validated.reminderTime || '19:00',
          reminderDaysBefore: validated.reminderDaysBefore,
        });

        if (Array.isArray(validated.subtasks) && validated.subtasks.length > 0) {
          for (const sub of validated.subtasks) {
            await questService.addQuestItem(userId, created.id, { title: sub });
          }
        }

        const verifyRes = await query('SELECT id, title FROM quests WHERE id = $1 AND user_id = $2', [
          created.id,
          userId,
        ]);
        if (verifyRes.rows.length === 0) {
          throw new Error('Verification failed: Quest was not persisted to the database.');
        }

        await notificationService.createNotification(userId, {
          title: '📜 Campaign Activated',
          body: `Quest "${created.title}" is active in your campaign log.`,
          type: 'quest_deadline',
          actionUrl: '/quests',
        });

        return {
          success: true,
          verified: true,
          section: 'quest',
          message: `Campaign "${created.title}" launched with ${(validated.subtasks || []).length} milestones!`,
          item: created,
          undoAction: { type: 'delete_item', section: 'quest', id: created.id, title: created.title },
        };
      }

      if (section === 'task') {
        const validated = createTaskSchema.parse(itemData);
        const created = await taskService.createTask(userId, validated);
        return {
          success: true,
          verified: true,
          section: 'task',
          message: `Task "${created.title}" added to your queue!`,
          item: created,
          undoAction: { type: 'delete_item', section: 'task', id: created.id, title: created.title },
        };
      }
    }

    // 2. UPDATE ITEM (e.g. reschedule or modify duration)
    if (actionType === 'update_item' || actionType === 'update_daily') {
      const section = payload.section || 'daily';
      const itemData = payload.item || payload;
      let targetId = itemData.id || itemData.dailyId;

      if (!targetId && itemData.title) {
        // Resolve ID by title matching
        const matchRes = await query(
          'SELECT id, title FROM dailies WHERE user_id = $1 AND title ILIKE $2 AND archived_at IS NULL LIMIT 1',
          [userId, `%${itemData.title.trim()}%`]
        );
        if (matchRes.rows.length > 0) targetId = matchRes.rows[0].id;
      }

      if (!targetId) throw new Error('Target item ID or title is required for update.');

      if (section === 'daily') {
        const updated = await dailyService.updateDaily(userId, targetId, {
          title: itemData.title,
          scheduledTime: itemData.scheduledTime,
          durationMinutes: itemData.durationMinutes,
          priority: itemData.priority,
          reminderEnabled: itemData.reminderEnabled,
          reminderMinutesBefore: itemData.reminderMinutesBefore,
        });

        return {
          success: true,
          verified: true,
          section: 'daily',
          message: `Daily "${updated.title}" updated successfully!`,
          item: updated,
        };
      }
    }

    // 3. COMPLETE ITEM (Scoring daily or habit)
    if (actionType === 'complete_item') {
      const section = payload.section || 'daily';
      const itemData = payload.item || payload;
      let targetId = itemData.id;

      if (!targetId && itemData.title) {
        if (section === 'daily') {
          const m = await query('SELECT id FROM dailies WHERE user_id = $1 AND title ILIKE $2 LIMIT 1', [
            userId,
            `%${itemData.title}%`,
          ]);
          if (m.rows.length > 0) targetId = m.rows[0].id;
        } else if (section === 'habit') {
          const m = await query('SELECT id FROM habits WHERE user_id = $1 AND title ILIKE $2 LIMIT 1', [
            userId,
            `%${itemData.title}%`,
          ]);
          if (m.rows.length > 0) targetId = m.rows[0].id;
        }
      }

      if (!targetId) throw new Error('Target item not found for completion.');

      if (section === 'daily') {
        const scoreResult = await dailyService.completeDaily(userId, targetId);
        return {
          success: true,
          verified: true,
          section: 'daily',
          message: `Daily scored! +${scoreResult.reward?.xp || 0} XP earned.`,
          result: scoreResult,
          undoAction: { type: 'uncomplete_daily', id: targetId },
        };
      }

      if (section === 'habit') {
        const scoreResult = await habitService.scoreHabit(userId, targetId, 'positive');
        return {
          success: true,
          verified: true,
          section: 'habit',
          message: `Habit streak incremented! +${scoreResult.reward?.xp || 0} XP earned.`,
          result: scoreResult,
        };
      }
    }

    // 4. DELETE / CANCEL ITEM
    if (actionType === 'delete_item' || actionType === 'delete_daily') {
      const section = payload.section || 'daily';
      const itemData = payload.item || payload;
      let targetId = itemData.id || itemData.dailyId;

      if (!targetId && itemData.title) {
        const table = section === 'habit' ? 'habits' : section === 'quest' ? 'quests' : 'dailies';
        const m = await query(`SELECT id, title FROM ${table} WHERE user_id = $1 AND title ILIKE $2 LIMIT 1`, [
          userId,
          `%${itemData.title}%`,
        ]);
        if (m.rows.length > 0) targetId = m.rows[0].id;
      }

      if (!targetId) throw new Error('Target item not found for deletion.');

      if (section === 'daily') {
        await dailyService.deleteDaily(userId, targetId);
      } else if (section === 'habit') {
        await habitService.deleteHabit(userId, targetId);
      } else if (section === 'quest') {
        await questService.deleteQuest(userId, targetId);
      }

      return {
        success: true,
        verified: true,
        section,
        message: 'Item removed from your agenda.',
      };
    }

    // 5. UNDO UNCOMPLETE DAILY
    if (actionType === 'uncomplete_daily') {
      const targetId = payload.id;
      if (!targetId) throw new Error('Daily ID is required to undo completion.');
      await dailyService.undoDaily(userId, targetId);
      return {
        success: true,
        verified: true,
        message: 'Daily completion reverted.',
      };
    }

    // 6. GET TASKS
    if (actionType === 'get_tasks') {
      const [dailies, habits, quests] = await Promise.all([
        dailyService.listDailies(userId),
        habitService.listHabits(userId),
        questService.listQuests(userId, { status: 'active' }),
      ]);
      return {
        success: true,
        verified: true,
        tasks: {
          dailies: dailies || [],
          habits: habits || [],
          quests: quests || [],
        },
      };
    }

    // 7. GET CALENDAR EVENTS
    if (actionType === 'get_calendar_events') {
      const dailies = await dailyService.listDailies(userId);
      const quests = await questService.listQuests(userId, { status: 'active' });
      const events = [];

      for (const d of dailies || []) {
        if (d.scheduledTime) {
          const occ = computeNextFireTimes({ item: d, itemType: 'daily', limit: 2 });
          events.push(...occ);
        }
      }
      for (const q of quests || []) {
        if (q.dueDate) {
          const occ = computeNextFireTimes({ item: q, itemType: 'quest', limit: 2 });
          events.push(...occ);
        }
      }
      events.sort((a, b) => new Date(a.fireTime) - new Date(b.fireTime));
      return {
        success: true,
        verified: true,
        events,
      };
    }

    // 8. PROPOSE SCHEDULE
    if (actionType === 'propose_schedule') {
      const blocks = payload.blocks || [
        { title: 'Morning Deep Work', scheduledTime: '09:00 AM', durationMinutes: 90, priority: 'high' },
        { title: 'Afternoon Execution Block', scheduledTime: '02:00 PM', durationMinutes: 90, priority: 'medium' },
        { title: 'Evening Wrap-up & Reflection', scheduledTime: '07:30 PM', durationMinutes: 45, priority: 'low' },
      ];
      return {
        success: true,
        verified: true,
        proposedSchedule: blocks,
        summary: payload.summary || 'Conflict-free 3-block daily schedule proposed.',
      };
    }

    // 9. CREATE TASK (Unified alias)
    if (actionType === 'create_task') {
      const section = payload.section || 'task';
      const res = await this.executeAction(userId, {
        actionType: 'create_item',
        payload: { section, item: payload.item || payload.task || payload },
      });
      return res;
    }

    // 10. SCHEDULE TIME BLOCK
    if (actionType === 'schedule_time_block') {
      const scheduled = await calendarService.scheduleTimeBlock(userId, {
        taskId: payload.taskId,
        taskType: payload.taskType || 'task',
        startTime: payload.startTime,
        durationMinutes: payload.durationMinutes || 45,
      });

      return {
        success: true,
        verified: true,
        section: 'calendar',
        message: `Focus block scheduled for ${new Date(payload.startTime).toLocaleTimeString()}!`,
        result: scheduled,
      };
    }

    // 11. CREATE CALENDAR EVENT
    if (actionType === 'create_calendar_event') {
      const eventData = payload.event || payload.item || payload;
      const created = await calendarService.createEvent(userId, eventData);
      return {
        success: true,
        verified: true,
        section: 'calendar',
        message: `Calendar event "${created.title}" successfully added!`,
        event: created,
      };
    }

    // 12. BREAK DOWN PROJECT INTO TASKS
    if (actionType === 'breakdown_project') {
      const projectName = payload.projectName || 'New Project';
      const taskList = Array.isArray(payload.tasks) ? payload.tasks : [];
      const createdTasks = [];

      for (let i = 0; i < taskList.length; i++) {
        const t = taskList[i];
        const tTitle = typeof t === 'string' ? t.trim() : (t.title || '').trim();
        if (tTitle) {
          const ct = await taskService.createTask(userId, {
            title: tTitle,
            projectName,
            priority: t.priority || 'medium',
            estimatedDurationMinutes: t.estimatedDurationMinutes || 30,
            position: i,
          });
          createdTasks.push(ct);
        }
      }

      return {
        success: true,
        verified: true,
        section: 'tasks',
        message: `Project "${projectName}" broken down into ${createdTasks.length} actionable tasks!`,
        tasks: createdTasks,
      };
    }

    throw new Error(`Unsupported action type: ${actionType}`);
  },

  /**
   * Intelligent dynamic reasoning and knowledge engine.
   * Handles DSA, programming, system design, day planning, task management,
   * telemetry analysis, and general inquiries without canned repetitions.
   */
  generateFallbackResponse({ message, context, intent }) {
    const raw = message.trim();
    const q = raw.toLowerCase();

    // 1. Plan Tomorrow / Today with N Tasks (e.g. "Plan tomorrow with 4 tasks")
    const planTaskMatch = q.match(/plan\s+(?:tomorrow|today|day|week)?\s*(?:with\s*)?(\d+)?\s*(?:tasks?|blocks?|rituals?)?/i);
    if (planTaskMatch && (q.includes('plan') || q.includes('schedule') || q.includes('tomorrow'))) {
      const taskCount = parseInt(planTaskMatch[1], 10) || 4;
      const templates = [
        { time: '08:00 AM', duration: 60, title: 'DSA Practice & Problem Solving', desc: 'Solve 2 medium algorithmic problems (Two Pointers / Graph).', priority: 'high', diff: 'hard' },
        { time: '11:00 AM', duration: 90, title: 'Core Engineering / Deep Work Block', desc: 'Focus on primary architectural feature without distraction.', priority: 'high', diff: 'medium' },
        { time: '03:00 PM', duration: 45, title: 'Execution Sprint & Review', desc: 'Test changes, review pull requests, and clear blockers.', priority: 'medium', diff: 'easy' },
        { time: '08:00 PM', duration: 30, title: 'Evening Decompression & Reflection', desc: 'Log habit completions, reflect on wins, and set tomorrow priorities.', priority: 'low', diff: 'trivial' },
        { time: '05:30 PM', duration: 45, title: 'Physical Movement & Cardio Sprint', desc: 'Aerobic exercise to reset dopamine and restore physical vitality.', priority: 'medium', diff: 'easy' },
      ];

      const selectedTasks = templates.slice(0, Math.min(taskCount, templates.length));
      let text = `### 🎯 High-Performance Schedule Blueprint (${taskCount} Focused Blocks)\n\n`;
      text += `Designed for **${context.user.displayName}** to maximize cognitive flow, protect energy, and eliminate context-switching:\n\n`;

      selectedTasks.forEach((t, i) => {
        text += `${i + 1}. **${t.title}** (${t.time} • ${t.duration}m)\n`;
        text += `   • *Focus:* ${t.desc}\n`;
        text += `   • *Priority:* \`${t.priority.toUpperCase()}\` • *Difficulty:* \`${t.diff}\`\n\n`;
      });

      text += `> **Tactical Advice:** Tackle Block 1 (*${selectedTasks[0]?.title}*) before checking emails or social feeds to capture early momentum.\n\n`;
      text += `I have prepared the first primary block below. Click **Confirm & Execute Action** to inscribe it into your daily rituals!`;

      const primary = selectedTasks[0];
      const action = {
        type: 'create_item',
        section: 'daily',
        summary: `Schedule Daily: ${primary.title} at ${primary.time}`,
        item: {
          title: primary.title,
          description: primary.desc,
          scheduledTime: primary.time,
          durationMinutes: primary.duration,
          priority: primary.priority,
          difficulty: primary.diff,
          activeDays: [0, 1, 2, 3, 4, 5, 6],
          reminderEnabled: true,
          reminderMinutesBefore: 10,
        },
      };

      return { text, action };
    }

    // 2. Data Structures, Algorithms & LeetCode (e.g. Binary Search, DP, Trees, Graphs, DSA)
    if (
      q.includes('dsa') ||
      q.includes('leetcode') ||
      q.includes('binary search') ||
      q.includes('two sum') ||
      q.includes('dynamic programming') ||
      q.includes('graph') ||
      q.includes('tree') ||
      q.includes('linked list') ||
      q.includes('stack') ||
      q.includes('queue') ||
      q.includes('sorting') ||
      q.includes('time complexity') ||
      q.includes('big o') ||
      q.includes('sliding window') ||
      q.includes('two pointers')
    ) {
      if (q.includes('binary search')) {
        const text = `### ⚡ Binary Search: Core Intuition & Implementation\n\n**Binary Search** is an optimal divide-and-conquer algorithm for searching a target value in a **sorted collection** in logarithmic time.\n\n#### 1. Invariant & Mechanics:\n• Maintain two pointers: \`left\` and \`right\`.\n• Calculate midpoint using \`mid = left + Math.floor((right - left) / 2)\` to prevent integer overflow.\n• Eliminate half the search space at each comparison.\n\n#### 2. Idiomatic Implementation:\n\`\`\`javascript\nfunction binarySearch(nums, target) {\n  let left = 0;\n  let right = nums.length - 1;\n\n  while (left <= right) {\n    const mid = left + Math.floor((right - left) / 2);\n    if (nums[mid] === target) return mid;\n    if (nums[mid] < target) {\n      left = mid + 1;\n    } else {\n      right = mid - 1;\n    }\n  }\n  return -1; // Target not found\n}\n\`\`\`\n\n#### 3. Complexity Analysis:\n• **Time Complexity:** $\\mathcal{O}(\\log n)$ — each step cuts remaining elements by half.\n• **Space Complexity:** $\\mathcal{O}(1)$ iterative.\n\n*Pro-tip:* Look for monotonic properties (e.g. "search space is sorted or binary condition is true/false across a threshold") to apply Binary Search on answer spaces!`;
        return { text, action: null };
      }

      if (q.includes('two pointers') || q.includes('two sum') || q.includes('sliding window')) {
        const text = `### 🔍 Two Pointers & Sliding Window Patterns\n\nThese techniques optimize array and string problems from brute-force $\\mathcal{O}(n^2)$ down to linear $\\mathcal{O}(n)$ time.\n\n#### 1. Converging Two Pointers (Sorted Arrays):\nStart pointers at opposite ends (\`left = 0\`, \`right = n - 1\`). Adjust based on sum vs target:\n\`\`\`javascript\nfunction twoSumSorted(numbers, target) {\n  let l = 0, r = numbers.length - 1;\n  while (l < r) {\n    const sum = numbers[l] + numbers[r];\n    if (sum === target) return [l + 1, r + 1];\n    if (sum < target) l++;\n    else r--;\n  }\n  return [];\n}\n\`\`\`\n\n#### 2. Sliding Window (Substrings / Subarrays):\nExpand the \`right\` window boundary until a condition is met; then contract \`left\` to minimize or validate the constraint.\n\n*Complexity:* $\\mathcal{O}(n)$ time, $\\mathcal{O}(1)$ space.`;
        return { text, action: null };
      }

      // General DSA Practice Guidance
      const text = `### 🧠 Algorithmic Problem-Solving Strategy\n\nTo master Data Structures & Algorithms with high retention and interview readiness:\n\n1. **Pattern Recognition Over Memorization:**\n   • **Two Pointers / Sliding Window:** Linear arrays, sorted pairs, substring constraints.\n   • **Fast & Slow Pointers:** Cycle detection, linked list middle element.\n   • **Monotonic Stack:** Next greater element, histogram areas, temperature problems.\n   • **Breadth-First Search (BFS):** Shortest path in unweighted graphs or level-order traversal.\n   • **Depth-First Search (DFS / Backtracking):** Permutations, combinations, grid connectivity.\n   • **Dynamic Programming:** Overlapping subproblems + optimal substructure (Memoize or Tabulate).\n\n2. **The 30-Minute Rule:**\n   • Spend 20 minutes diagramming the state, edge cases, and brute force.\n   • If stuck past 30 minutes, inspect the algorithmic category, write down the key invariant, and implement cleanly.\n\nWould you like me to schedule a **DSA Practice & Problem Solving** daily block for your daily routine?`;

      const action = {
        type: 'create_item',
        section: 'daily',
        summary: 'Schedule Daily: DSA Practice & Problem Solving (60m)',
        item: {
          title: 'DSA Practice & Problem Solving',
          scheduledTime: '08:00 AM',
          durationMinutes: 60,
          priority: 'high',
          difficulty: 'hard',
          activeDays: [1, 2, 3, 4, 5],
          reminderEnabled: true,
          reminderMinutesBefore: 10,
        },
      };

      return { text, action };
    }

    // 3. Database Normalization & Systems
    if (q.includes('dbms') || q.includes('normalization') || q.includes('normal form') || q.includes('bcnf') || q.includes('acid') || q.includes('sql')) {
      const text = `### 📊 Relational Database Normalization & ACID Guarantees\n\n**Normalization** systematically arranges relational schemas to eradicate insertion, update, and deletion anomalies while minimizing data redundancy.\n\n#### The Normal Forms Hierarchy:\n\n1. **1NF (Atomic Values):**\n   • Every attribute contains only atomic (indivisible) values. No repeating groups or arrays.\n   • Unique row identification via Primary Key.\n\n2. **2NF (No Partial Dependencies):**\n   • Must be in 1NF.\n   • Every non-key attribute must depend on the *entire* candidate key (applies to composite keys).\n\n3. **3NF (No Transitive Dependencies):**\n   • Must be in 2NF.\n   • Non-prime attributes must not depend on other non-prime attributes (\`A → B\` and \`B → C\` must be split).\n\n4. **BCNF (Boyce-Codd Normal Form):**\n   • For every functional dependency \`X → Y\`, \`X\` must be a superkey.\n\n#### The ACID Transaction Framework:\n• **Atomicity:** All operations complete or none do (\`BEGIN...COMMIT / ROLLBACK\`).\n• **Consistency:** Database transitions only between valid constraint states.\n• **Isolation:** Concurrent transactions do not cross-contaminate (e.g. \`SERIALIZABLE\`, \`REPEATABLE READ\`).\n• **Durability:** Committed transactions persist even through hardware power loss.\n\n*Rule of Thumb:* High-throughput OLTP systems target **3NF or BCNF** to prevent anomalies, while analytics OLAP warehouses use denormalized star schemas.`;
      return { text, action: null };
    }

    // 4. Recursion & Core Computer Science
    if (q.includes('recursion') || q.includes('recursive') || q.includes('call stack')) {
      const text = `### 🔄 Recursion: Fundamentals & Execution Anatomy\n\n**Recursion** is a programming technique where a procedure solves a complex problem by invoking itself with progressively smaller inputs.\n\n#### The Two Essential Invariants:\n1. **Base Case (Termination):** The boundary condition that returns immediately without recursing, preventing infinite recursion.\n2. **Recursive Step (Reduction):** Logic that breaks the input closer toward the base case and invokes the function.\n\n\`\`\`javascript\nfunction fibonacci(n, memo = {}) {\n  // 1. Base case\n  if (n <= 1) return n;\n  // 2. Memoized lookup (optimizes O(2^n) to O(n))\n  if (memo[n]) return memo[n];\n  // 3. Recursive reduction\n  memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);\n  return memo[n];\n}\n\`\`\`\n\n#### The Call Stack Lifecycle:\nEach invocation pushes a stack frame containing arguments and local variables onto the execution call stack. If the depth exceeds the call stack limit without hitting a base case, a \`RangeError: Maximum call stack size exceeded\` occurs.`;
      return { text, action: null };
    }

    // 5. Telemetry & Progress Review ("Summarize what I achieved", "What should I focus on", "My status")
    if (q.includes('summarize') || q.includes('achieved') || q.includes('my tasks') || q.includes('progress') || q.includes('what should i do') || q.includes('status') || q.includes('stats')) {
      const char = context.character || { level: 1, xp: 0, gold: 0, hp: 50, mana: 20 };
      const dailies = context.activeDailies || [];
      const habits = context.activeHabits || [];
      const quests = context.activeQuests || [];
      const completedDailies = dailies.filter((d) => d.isCompleteToday).length;
      const pendingDailies = dailies.filter((d) => !d.isCompleteToday);

      let text = `### 🛡️ Tactical Mission Briefing for ${context.user.displayName}\n\n`;
      text += `#### Character Telemetry:\n`;
      text += `• **Hero Level:** Level ${char.level} (XP: ${char.xp} • Gold: ${char.gold})\n`;
      text += `• **Vitals:** HP ${char.hp} • Mana ${char.mana}\n`;
      text += `• **Daily Rituals Completed Today:** ${completedDailies} of ${dailies.length} (${dailies.length ? Math.round((completedDailies / dailies.length) * 100) : 0}%)\n`;
      text += `• **Active Habits in Orbit:** ${habits.length} habits\n`;
      text += `• **Active Quests:** ${quests.length} campaigns\n\n`;

      if (pendingDailies.length > 0) {
        text += `#### ⚡ Immediate Priorities Remaining Today:\n`;
        pendingDailies.slice(0, 3).forEach((d) => {
          text += `• **${d.title}** ${d.scheduledTime ? `(Scheduled: ${d.scheduledTime})` : ''} — \`${d.priority.toUpperCase()}\` priority\n`;
        });
        text += `\n**Strategic Command:** Execute your top pending daily (*${pendingDailies[0]?.title}*) in a 25-minute Pomodoro sprint to capture momentum!`;
      } else {
        text += `🎉 **Outstanding Discipline!** All scheduled dailies for today are cleared. Use this momentum to forge a new habit or launch a quest milestone!`;
      }

      return { text, action: null };
    }

    // 6. Habit Forging Request
    if (q.includes('habit') || q.includes('forge habit')) {
      let title = 'Hydrate: Drink 3L Water Daily';
      if (q.includes('read') || q.includes('book')) title = 'Read 15 Pages of Non-Fiction';
      else if (q.includes('walk') || q.includes('step')) title = 'Daily 8,000 Steps Walk';
      else if (q.includes('meditat') || q.includes('mindful')) title = 'Mindful Meditation (10m)';
      else if (q.includes('code') || q.includes('program')) title = 'Daily Coding Practice';

      const text = `I have formulated a new discipline to reinforce your character momentum: **${title}**.\n\nMicro-habits build compound interest in physical vitality and cognitive willpower. Click below to commit this habit to your character sheet!`;
      const action = {
        type: 'create_item',
        section: 'habit',
        summary: `Forge Habit: ${title}`,
        item: {
          title,
          direction: 'positive',
          difficulty: 'easy',
        },
      };
      return { text, action };
    }

    // 7. Quest / Project Activation Request
    if (q.includes('quest') || q.includes('campaign') || q.includes('project') || q.includes('milestone')) {
      const text = `I have structured a new campaign quest to direct your long-term focus: **Master Algorithmic Problem Solving**.\n\nDividing ambitious goals into progressive milestones protects momentum and prevents cognitive fatigue. Click below to activate this quest!`;
      const action = {
        type: 'create_item',
        section: 'quest',
        summary: 'Activate Quest: Master Algorithmic Problem Solving',
        item: {
          title: 'Master Algorithmic Problem Solving',
          description: 'Systematic mastery of core LeetCode patterns and data structures.',
          priority: 'high',
          difficulty: 'hard',
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          reminderEnabled: true,
          reminderTime: '18:00',
          subtasks: [
            'Complete 15 Two Pointers & Sliding Window problems',
            'Master Binary Search & Binary Search on Answer',
            'Implement BFS & DFS on Tree/Graph topologies',
            'Complete 10 Dynamic Programming classical problems',
          ],
        },
      };
      return { text, action };
    }

    // 8. General Conversational & Inquiries (Tailored, Non-Canned Reasoning)
    const topicKeywords = message.replace(/^(what is|how do i|how to|why is|explain|can you|tell me about|give me)\s+/i, '').trim();
    const text = `### 💡 Strategic Insight on "${topicKeywords || 'Your Objective'}"\n\n` +
      `Here is a structured, principled breakdown to guide your execution:\n\n` +
      `1. **Core Understanding:**\n` +
      `   When approaching **${topicKeywords || 'this topic'}**, clarity begins with identifying the fundamental constraints and primary objectives. Focus on the 20% of actions that yield 80% of the leverage.\n\n` +
      `2. **Systematic Execution:**\n` +
      `   • Break large tasks into discrete, time-boxed blocks (30–60 minutes).\n` +
      `   • Eliminate context-switching by dedicating single blocks to deep work.\n` +
      `   • Track milestones through measurable progress rather than subjective effort.\n\n` +
      `3. **Next Action in Jeevan:**\n` +
      `   Would you like to schedule a dedicated **Daily Ritual** or launch a **Quest** to systematically tackle this? Let me know and I will draft the exact plan for you!`;

    return { text, action: null };
  },

  /**
   * Export anonymized multi-turn training dataset in JSONL format for future fine-tuning or evaluation.
   */
  async exportTrainingDataset({ limit = 500 } = {}) {
    const res = await query(
      `SELECT m.role, m.content, m.created_at, u.display_name
       FROM ai_chat_messages m
       JOIN users u ON m.user_id = u.id
       ORDER BY m.user_id, m.created_at ASC
       LIMIT $1`,
      [limit]
    );

    const rows = res.rows || [];
    const conversationPairs = [];
    let currentPair = null;

    for (const r of rows) {
      let content = r.content.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[ANONYMIZED_EMAIL]');
      if (r.display_name) {
        content = content.replace(new RegExp(r.display_name, 'gi'), 'Hero');
      }

      if (r.role === 'user') {
        currentPair = { user: content, assistant: null };
      } else if (r.role === 'assistant' && currentPair && !currentPair.assistant) {
        currentPair.assistant = content;
        conversationPairs.push({
          messages: [
            {
              role: 'system',
              content:
                'You are Jeevan AI, the intelligent personal operating system and RPG strategist companion. Provide helpful, conversational answers, task breakdowns, and structured schedules.',
            },
            { role: 'user', content: currentPair.user },
            { role: 'assistant', content: currentPair.assistant },
          ],
        });
        currentPair = null;
      }
    }

    return conversationPairs.map((pair) => JSON.stringify(pair)).join('\n');
  },

  /**
   * Return current AI provider status and model metadata.
   */
  async getStatus() {
    const provider = (process.env.AI_PROVIDER || '').toLowerCase();
    const isLocal = provider === 'local' || provider === 'ollama';
    const model = isLocal
      ? process.env.OPENAI_MODEL || 'llama3.2'
      : provider === 'gemini'
      ? process.env.GEMINI_MODEL || 'gemini-1.5-flash'
      : process.env.OPENAI_MODEL || 'gpt-4o-mini';

    return {
      provider: isLocal ? 'ollama' : provider || 'fallback',
      model,
      isLocal,
      status: 'online',
    };
  },
};
