import { query } from '../db/pool.js';
import { financeService } from './finance.service.js';
import { studyService } from './study.service.js';
import { aiProviderFactory } from './ai-providers/index.js';

export class AiService {
  /**
   * Aggregate deep contextual awareness across all user domains in Jeevan.
   */
  async getUserContext(userId) {
    const [
      charRes,
      habitsRes,
      dailiesRes,
      questsRes,
      expenseSummary,
      studySummary,
      reflectionsRes,
    ] = await Promise.all([
      query(`SELECT level, xp, hp, max_hp, mana, max_mana, gold, strength, intelligence, vitality, willpower, perception FROM character_stats WHERE user_id = $1`, [userId]),
      query(`SELECT id, title, current_streak, best_streak, last_scored_at FROM habits WHERE user_id = $1 ORDER BY current_streak DESC`, [userId]),
      query(`SELECT id, title, streak_current, is_complete_today FROM dailies WHERE user_id = $1`, [userId]),
      query(`SELECT id, title, description, priority, difficulty, due_date FROM quests WHERE user_id = $1 AND status = 'active' ORDER BY due_date ASC NULLS LAST LIMIT 10`, [userId]),
      financeService.getExpenseSummary({ userId }).catch(() => ({ totalMonth: 0, countMonth: 0, categories: [], recentTransactions: [] })),
      studyService.getStudySummary({ userId }).catch(() => ({ totalMinutes: 0, totalHours: '0.0', weekMinutes: 0, weekHours: '0.0', subjects: [] })),
      query(`SELECT id, mood_score, energy_score, focus_score, for_date FROM reflections WHERE user_id = $1 ORDER BY for_date DESC LIMIT 7`, [userId]),
    ]);

    return {
      character: charRes.rows[0] || null,
      habits: habitsRes.rows || [],
      dailies: dailiesRes.rows || [],
      quests: questsRes.rows || [],
      finance: expenseSummary,
      study: studySummary,
      recentReflections: reflectionsRes.rows || [],
    };
  }

  /**
   * Process a user message through Jeevan's Life Intelligence Layer.
   */
  async processMessage({ userId, message }) {
    if (!message || typeof message !== 'string' || !message.trim()) {
      const err = new Error('Message cannot be empty.');
      err.status = 400;
      throw err;
    }

    const rawMessage = message.trim();

    // 1. Persist user message
    const userMsgRes = await query(
      `INSERT INTO ai_messages (user_id, role, content)
       VALUES ($1, 'user', $2)
       RETURNING id, role, content, action_type, action_payload, action_status, created_at`,
      [userId, rawMessage]
    );
    const userMessageRecord = userMsgRes.rows[0];

    // 2. Load complete ecosystem context
    const context = await this.getUserContext(userId);

    // 3. Delegate to active provider (Gemini or Heuristic Fallback)
    const provider = aiProviderFactory.getActiveProvider();
    const result = await provider.generateResponse({
      message: rawMessage,
      userContext: context,
    });

    const assistantResponse = result.content;
    const actionType = result.actionType || null;
    const actionPayload = result.actionPayload || null;
    const actionStatus = result.actionStatus || (actionType ? 'proposed' : 'none');

    // 4. Save assistant response with action payload (if any)
    const assistantMsgRes = await query(
      `INSERT INTO ai_messages (user_id, role, content, action_type, action_payload, action_status)
       VALUES ($1, 'assistant', $2, $3, $4, $5)
       RETURNING id, role, content, action_type, action_payload, action_status, created_at`,
      [userId, assistantResponse, actionType, actionPayload ? JSON.stringify(actionPayload) : null, actionStatus]
    );

    return {
      userMessage: userMessageRecord,
      assistantMessage: assistantMsgRes.rows[0],
    };
  }

  /**
   * Confirm and execute a proposed action (e.g. create expense, log study).
   */
  async confirmAction({ userId, messageId }) {
    const msgRes = await query(
      `SELECT id, user_id, action_type, action_payload, action_status
       FROM ai_messages
       WHERE id = $1 AND user_id = $2`,
      [messageId, userId]
    );

    const message = msgRes.rows[0];
    if (!message) {
      const err = new Error('Action not found.');
      err.status = 404;
      throw err;
    }

    if (message.action_status !== 'proposed') {
      const err = new Error(`Action is already ${message.action_status}.`);
      err.status = 400;
      throw err;
    }

    const payload = typeof message.action_payload === 'string'
      ? JSON.parse(message.action_payload)
      : message.action_payload;

    let executionResult = null;
    let confirmationNotice = '';

    if (message.action_type === 'create_expense') {
      executionResult = await financeService.createExpense({
        userId,
        amount: payload.amount,
        currency: payload.currency || 'INR',
        category: payload.category,
        note: payload.note,
        spentAt: payload.spentAt ? new Date(payload.spentAt) : new Date(),
      });
      confirmationNotice = `✓ Added ₹${payload.amount} ${payload.category} expense to your Finance vault.`;
    } else if (message.action_type === 'log_study') {
      executionResult = await studyService.logStudySession({
        userId,
        subject: payload.subject,
        durationMinutes: payload.durationMinutes,
        notes: payload.notes,
      });
      confirmationNotice = `✓ Recorded ${payload.durationMinutes} mins of ${payload.subject} study! Earned +${executionResult.progression.xpDelta} XP and +${executionResult.progression.goldDelta} Gold.`;
    } else {
      const err = new Error(`Unsupported action type: ${message.action_type}`);
      err.status = 400;
      throw err;
    }

    // Mark action executed
    await query(
      `UPDATE ai_messages
       SET action_status = 'executed'
       WHERE id = $1`,
      [messageId]
    );

    // Append confirmation message from assistant
    const followUpRes = await query(
      `INSERT INTO ai_messages (user_id, role, content, action_type, action_status)
       VALUES ($1, 'assistant', $2, $3, 'executed')
       RETURNING id, role, content, action_type, action_status, created_at`,
      [userId, confirmationNotice, message.action_type]
    );

    return {
      messageId,
      actionStatus: 'executed',
      executionResult,
      followUpMessage: followUpRes.rows[0],
    };
  }

  /**
   * Cancel a proposed action.
   */
  async cancelAction({ userId, messageId }) {
    const msgRes = await query(
      `UPDATE ai_messages
       SET action_status = 'cancelled'
       WHERE id = $1 AND user_id = $2 AND action_status = 'proposed'
       RETURNING id, action_status`,
      [messageId, userId]
    );

    if (msgRes.rows.length === 0) {
      const err = new Error('No pending proposed action found to cancel.');
      err.status = 404;
      throw err;
    }

    return {
      messageId,
      actionStatus: 'cancelled',
    };
  }

  /**
   * Fetch conversation history for the authenticated user.
   */
  async getConversationHistory({ userId, limit = 50 }) {
    const res = await query(
      `SELECT id, role, content, action_type, action_payload, action_status, created_at
       FROM ai_messages
       WHERE user_id = $1
       ORDER BY created_at ASC
       LIMIT $2`,
      [userId, limit]
    );

    return res.rows.map((row) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      actionType: row.action_type,
      actionPayload: typeof row.action_payload === 'string' ? JSON.parse(row.action_payload) : row.action_payload,
      actionStatus: row.action_status,
      createdAt: row.created_at,
    }));
  }
}

export const aiService = new AiService();
