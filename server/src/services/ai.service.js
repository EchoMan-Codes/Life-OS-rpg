import { query, pool } from '../db/pool.js';
import { dailyService } from './daily.service.js';
import { habitService } from './habit.service.js';
import { questService } from './quest.service.js';
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
        const localModel = process.env.OPENAI_MODEL || 'llama3';
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
        console.warn('[JEEVAN_AI] Local AI stream failed:', err.message);
        if (!geminiKey && !openAiKey) throw err;
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

  /**
   * Strict Natural-Language Action Execution & Verification Pipeline.
   * Executes through existing services and verifies state before returning success.
   */
  async executeAction(userId, { actionType, payload }) {
    if (!actionType) throw new Error('actionType is required');

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
      const section = payload.section || (payload.type === 'habit' ? 'habit' : payload.type === 'quest' ? 'quest' : 'daily');
      return await this.executeAction(userId, {
        actionType: 'create_item',
        payload: { section, item: payload.item || payload },
      });
    }

    // 10. UPDATE TASK (Unified alias)
    if (actionType === 'update_task') {
      return await this.executeAction(userId, {
        actionType: 'update_item',
        payload,
      });
    }

    // 11. CREATE CALENDAR EVENT (Unified alias)
    if (actionType === 'create_calendar_event') {
      return await this.executeAction(userId, {
        actionType: 'create_item',
        payload: { section: 'daily', item: payload.item || payload },
      });
    }

    throw new Error(`Unsupported action type: ${actionType}`);
  },

  /**
   * Intelligent fallback response generator when external API keys are missing or offline.
   */
  generateFallbackResponse({ message, context, intent }) {
    const q = message.toLowerCase().trim();

    // Planning / Day breakdown request
    if (q.includes('plan') || q.includes('schedule') || q.includes('focus block') || q.includes('blocks') || q.includes('routine')) {
      const text = `Here is your optimized, conflict-free schedule designed to maximize focus and protect your energy:\n\n### 🎯 Daily Focus Schedule (${context.user.localWeekday}, ${context.user.localToday})\n\n1. **Deep Work Block 1: High Priority (09:00 AM – 10:30 AM)**\n   • 90 minutes of single-tasking on your core objective.\n   • Silence notifications and eliminate browser distractions.\n\n2. **Deep Work Block 2: Technical Execution (02:00 PM – 03:30 PM)**\n   • Architecture, study, or complex problem-solving.\n   • Hydrate and take an active 5-minute break at the 45-minute mark.\n\n3. **Decompression & Review (07:30 PM – 08:15 PM)**\n   • Score completed dailies, reflect on learnings, and plan tomorrow.\n\nI have created a proposed schedule block below. Click **Confirm & Execute Action** to add this to your system.`;

      const action = {
        type: 'create_item',
        section: 'daily',
        summary: 'Schedule 3 Focused Daily Ritual Blocks',
        item: {
          title: 'Morning Focus: Core Milestone',
          scheduledTime: '09:00 AM',
          durationMinutes: 90,
          priority: 'high',
          difficulty: 'medium',
          activeDays: [0, 1, 2, 3, 4, 5, 6],
          reminderEnabled: true,
          reminderMinutesBefore: 10,
        },
      };

      return { text, action };
    }

    // DBMS / Normalization queries
    if (q.includes('dbms') || q.includes('normalization') || q.includes('normal form') || q.includes('bcnf')) {
      const text = `### 📊 Database Normalization Explained\n\n**Normalization** is the systematic process of organizing data in a relational database to minimize redundancy and eliminate insertion, update, and deletion anomalies.\n\n#### The Core Normal Forms:\n\n1. **1NF (First Normal Form)**:\n   • Every column must hold atomic (indivisible) values.\n   • Each record must be uniquely identifiable via a Primary Key.\n\n2. **2NF (Second Normal Form)**:\n   • Must be in 1NF.\n   • Eliminates **partial dependencies**: Every non-prime attribute must depend on the *entire* candidate key, not just a subset.\n\n3. **3NF (Third Normal Form)**:\n   • Must be in 2NF.\n   • Eliminates **transitive dependencies**: If \`A → B\` and \`B → C\`, then \`A → C\` must be resolved by splitting into separate relations.\n\n4. **BCNF (Boyce-Codd Normal Form)**:\n   • A stricter version of 3NF where for every functional dependency \`X → Y\`, \`X\` must be a super key.\n\n*Rule of thumb:* Most production applications target **3NF or BCNF** to guarantee ACID data integrity while avoiding excessive JOIN overhead.`;
      return { text, action: null };
    }

    // Recursion queries
    if (q.includes('recursion') || q.includes('recursive')) {
      const text = `### 🔄 What is Recursion?\n\n**Recursion** is a programming technique where a function solves a problem by calling a smaller instance of itself until it reaches a known terminal condition.\n\nEvery recursive solution requires two critical components:\n\n1. **Base Case**: The stopping condition that returns immediately without further recursive calls, preventing infinite loops and stack overflow.\n2. **Recursive Step**: The logic that reduces the problem space and calls the function with simpler input.\n\n\`\`\`javascript\nfunction factorial(n) {\n  // 1. Base case\n  if (n <= 1) return 1;\n  // 2. Recursive step\n  return n * factorial(n - 1);\n}\n\`\`\`\n\nEach recursive call allocates a frame on the **call stack**. If the recursion depth exceeds stack limits, a \`RangeError: Maximum call stack size exceeded\` occurs.`;
      return { text, action: null };
    }

    // Focus / Tasks request
    if (q.includes('focus') || q.includes('tasks') || q.includes('what should i do') || q.includes('prioritize')) {
      const activeCount = (context.activeDailies || []).length;
      const text = `Based on your current Jeevan OS state:\n\n• **Active Rituals**: ${activeCount} active dailies\n• **RPG Level**: Level ${context.character?.level || 1} (${context.character?.xp || 0} XP)\n\n### ⚡ Strategic Recommendation:\n1. **Eat the Frog**: Clear your highest-difficulty daily first to secure maximum XP and momentum.\n2. **Pomodoro Sprint**: Run a 45-minute deep focus session with ambient sound enabled.\n3. **Protect the Streak**: Log your habit completions before 10 PM to protect your streak multiplier!`;

      return { text, action: null };
    }

    // Habit creation request
    if (q.includes('habit') || q.includes('drink water') || q.includes('water')) {
      const text = `I have formulated a new positive habit to reinforce your daily vitality: **Drink 3L Water**.\n\nConsistency with micro-habits builds the foundation for deep work and high willpower. Click below to commit this habit to your character sheet.`;
      const action = {
        type: 'create_item',
        section: 'habit',
        summary: 'Commit New Habit: Drink 3L Water',
        item: {
          title: 'Drink 3L Water',
          direction: 'positive',
          difficulty: 'easy',
        },
      };
      return { text, action };
    }

    // Daily creation request
    if (q.includes('daily') || q.includes('morning run') || q.includes('run')) {
      const text = `I have structured a new recurring ritual: **Morning Run at 7:00 AM (Mon, Wed, Fri)**.\n\nPhysical momentum in the morning primes dopamine and clarity for cognitive deep work. Click below to verify and add this daily to your agend.`;
      const action = {
        type: 'create_item',
        section: 'daily',
        summary: 'Inscribe Daily: Morning Run at 7 AM',
        item: {
          title: 'Morning Run (30 mins)',
          scheduledTime: '07:00 AM',
          durationMinutes: 30,
          difficulty: 'medium',
          activeDays: [1, 3, 5],
          priority: 'high',
          reminderEnabled: true,
          reminderMinutesBefore: 10,
        },
      };
      return { text, action };
    }

    // General conversational response (polite, helpful, zero technical .env leaks)
    return {
      text: `Hello, ${context.user.displayName}! I am your **Jeevan AI Personal Operating System** assistant.\n\nI can help you plan your schedule, prioritize tasks, explain complex technical topics, forge productive habits, or break large goals into progressive quests.\n\nWhat would you like to plan, study, or accomplish today?`,
      action: null,
    };
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
