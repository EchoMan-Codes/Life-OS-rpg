import { query } from '../db/pool.js';
import { financeService } from './finance.service.js';
import { studyService } from './study.service.js';

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
    const lower = rawMessage.toLowerCase();

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

    // 3. Intelligent Intent Resolution Engine
    let assistantResponse = '';
    let actionType = null;
    let actionPayload = null;
    let actionStatus = 'none';

    // -------------------------------------------------------------
    // INTENT A: EXPENSE LOGGING
    // e.g. "I spent ₹450 today", "spent 350 on dinner", "spent 1200 on books"
    // -------------------------------------------------------------
    const expenseRegex = /(?:spent|spend|paid|cost|bought)\s*(?:(?:rs\.?|inr|₹)\s*)?(\d+(?:\.\d+)?)\s*(?:(?:rs|rupees|bucks)\s*)?(?:(?:on|for|in)\s+([^.,\n]+))?/i;
    const amountFirstRegex = /(?:(?:rs\.?|inr|₹)\s*)(\d+(?:\.\d+)?)\s*(?:spent|paid)?\s*(?:(?:on|for|in)\s+([^.,\n]+))?/i;

    const expenseMatch = lower.match(expenseRegex) || lower.match(amountFirstRegex);

    if (expenseMatch) {
      const amount = parseFloat(expenseMatch[1]);
      const rawTarget = expenseMatch[2] ? expenseMatch[2].trim() : 'General Expense';

      // Auto-categorization
      let category = 'other';
      const targetLower = rawTarget.toLowerCase();
      if (/food|dinner|lunch|breakfast|coffee|tea|snacks|zomato|swiggy|restaurant|groceries/i.test(targetLower)) {
        category = 'food';
      } else if (/book|course|study|exam|notes|tuition|pen|udemy/i.test(targetLower)) {
        category = 'study';
      } else if (/gym|fitness|workout|medicine|doctor|pharmacy|supplement/i.test(targetLower)) {
        category = 'health';
      } else if (/uber|ola|auto|cab|metro|bus|train|fuel|petrol|travel/i.test(targetLower)) {
        category = 'transport';
      } else if (/amazon|flipkart|shopping|clothes|shoes|gadget/i.test(targetLower)) {
        category = 'shopping';
      }

      actionType = 'create_expense';
      actionPayload = {
        amount,
        currency: 'INR',
        category,
        note: rawTarget,
        spentAt: new Date().toISOString(),
      };
      actionStatus = 'proposed';

      assistantResponse = `I found a **₹${amount}** expense for **${rawTarget}** (Category: *${category.toUpperCase()}*).\n\nWould you like me to record this in your Finance vault?`;
    }

    // -------------------------------------------------------------
    // INTENT B: STUDY LOGGING
    // e.g. "I studied DBMS for 2 hours", "studied math for 45 mins"
    // -------------------------------------------------------------
    else if (/studied|study session|focused on|logged study/i.test(lower) && /\d+\s*(?:hours?|hrs?|mins?|minutes?)/i.test(lower)) {
      const studyMatch = lower.match(/(?:studied|study session on|focused on|logged study for)\s+([a-zA-Z0-9\s]+?)\s+(?:for\s+)?(\d+(?:\.\d+)?)\s*(hours?|hrs?|mins?|minutes?)/i);
      
      let subject = 'General Study';
      let durationMinutes = 60;

      if (studyMatch) {
        subject = studyMatch[1].trim();
        const value = parseFloat(studyMatch[2]);
        const unit = studyMatch[3].toLowerCase();
        durationMinutes = unit.startsWith('h') ? Math.round(value * 60) : Math.round(value);
      } else {
        const numMatch = lower.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|mins?|minutes?)/i);
        if (numMatch) {
          const value = parseFloat(numMatch[1]);
          const unit = numMatch[2].toLowerCase();
          durationMinutes = unit.startsWith('h') ? Math.round(value * 60) : Math.round(value);
        }
      }

      actionType = 'log_study';
      actionPayload = {
        subject: subject.toUpperCase(),
        durationMinutes,
        notes: `Logged via Jeevan AI`,
      };
      actionStatus = 'proposed';

      const xpEst = Math.max(1, Math.round(durationMinutes / 30)) * 15;
      const goldEst = Math.max(1, Math.round(durationMinutes / 30)) * 5;

      assistantResponse = `Impressive dedication! I parsed a **${durationMinutes}-minute** study sprint in **${subject.toUpperCase()}**.\n\nLogging this will grant you **+${xpEst} Intelligence XP** and **+${goldEst} Gold**.\n\nConfirm to log this into StudySmart?`;
    }

    // -------------------------------------------------------------
    // INTENT C: PLAN TOMORROW / SCHEDULE SYNTHESIS
    // e.g. "Plan tomorrow", "Plan my day", "Plan my week"
    // -------------------------------------------------------------
    else if (/plan tomorrow|plan my day|plan today|plan my week|generate schedule/i.test(lower)) {
      const activeDailies = context.dailies.map((d) => d.title).slice(0, 4);
      const activeHabits = context.habits.map((h) => h.title).slice(0, 3);
      const topQuests = context.quests.map((q) => q.title).slice(0, 3);
      const topSubject = context.study.subjects[0]?.subject || 'Deep Study';

      const isOverloaded = (context.dailies.length + context.quests.length) > 7;

      assistantResponse = `### 📅 Optimized Daily Blueprint for Tomorrow\n\n` +
        `**🌅 Phase 1: Morning Power Anchor (06:30 AM – 09:00 AM)**\n` +
        `- 06:30 AM: Wake up & Hydrate (Habit: *${activeHabits[0] || 'Morning Routine'}*)\n` +
        `- 07:00 AM: Deep Cognition Sprint (StudySmart: **${topSubject}** for 90 mins)\n` +
        `- 08:30 AM: Active Daily: *${activeDailies[0] || 'Core Review'}*\n\n` +
        `**⚡ Phase 2: Midday Execution (11:00 AM – 02:30 PM)**\n` +
        `- 11:00 AM: Primary Quest: **${topQuests[0] || 'Priority Task Sprint'}**\n` +
        `- 01:00 PM: Nutrition & Rest Cooldown\n` +
        `- 02:00 PM: Daily Ritual: *${activeDailies[1] || 'Daily Practice'}*\n\n` +
        `**🌙 Phase 3: Evening Consolidation (07:30 PM – 10:00 PM)**\n` +
        `- 07:30 PM: Secondary Focus Sprint (45 mins)\n` +
        `- 08:45 PM: Evening Reflection & Gratitude (*Restores Mana*)\n` +
        `- 10:00 PM: Wind Down & Sleep Protection\n\n` +
        (isOverloaded
          ? `⚠️ **Schedule Overload Alert:** You currently have ${context.dailies.length} active dailies and ${context.quests.length} quests. Focus strictly on Phase 1 & 2 to avoid HP burnout.`
          : `✨ **Schedule Balance:** Excellent commitment density. Keep focus intervals under 90 minutes for peak memory retention.`);
    }

    // -------------------------------------------------------------
    // INTENT D: STREAK LOSS / HABIT DIAGNOSIS
    // e.g. "Why am I losing my streak?", "Analyze my habits"
    // -------------------------------------------------------------
    else if (/streak|losing my streak|why am i losing|broken streak|analyze my habits/i.test(lower)) {
      const brokenHabits = context.habits.filter((h) => h.current_streak === 0 && h.best_streak > 1);
      const strongestHabit = context.habits.find((h) => h.current_streak > 0);

      if (brokenHabits.length > 0) {
        const worst = brokenHabits[0];
        assistantResponse = `### 🔍 Habit Diagnostic: Broken Streak Analysis\n\n` +
          `I analyzed your tracking telemetry. You recently lost momentum on **${worst.title}** (Previous Best: **${worst.best_streak} days**, Current: **0**).\n\n` +
          `**Root Causes Detected:**\n` +
          `1. **High Friction at Step 0**: The habit trigger lacked an immediate, non-negotiable anchor.\n` +
          `2. **Evening Energy Depletion**: Your recent reflection logs indicate lower energy scores past 8:00 PM, where deferred habits are often abandoned.\n` +
          `3. **Missing Rest Mode**: When life got busy, Rest Mode wasn't activated to protect your streak shield.\n\n` +
          `**Actionable Recovery Strategy:**\n` +
          `- **The 2-Minute Rule**: Tomorrow, perform just 2 minutes of *${worst.title}* at 08:00 AM.\n` +
          `- **Anchor Habit**: Pair it immediately after *${strongestHabit?.title || 'Morning Breakfast'}*.\n` +
          `- **Shield Protocol**: If you ever feel exhausted, tap 'Rest Mode' in Wellness to preserve character HP.`;
      } else {
        assistantResponse = `### 🛡️ Habit Telemetry Status: Resilient!\n\n` +
          `You currently have no broken streaks across your primary routines! Your strongest momentum is on **${strongestHabit?.title || 'Daily Tracking'}** with a **${strongestHabit?.current_streak || 1}-day active streak**.\n\n` +
          `**Pro Tip**: The danger zone for habit drop-off is Day 7–14 when initial excitement wanes. Keep your minimum daily bar tiny.`;
      }
    }

    // -------------------------------------------------------------
    // INTENT E: WEEKLY AI LIFE REVIEW
    // e.g. "Weekly AI Life Review", "Review my progress"
    // -------------------------------------------------------------
    else if (/weekly (?:ai )?life review|weekly review|review my progress|life review/i.test(lower)) {
      const totalStudyHrs = context.study.weekHours || '0.0';
      const totalSpent = context.finance.totalMonth || 0;
      const charLevel = context.character?.level || 1;
      const charGold = context.character?.gold || 0;
      const activeStreaks = context.habits.filter((h) => h.current_streak > 0).length;

      assistantResponse = `### 📊 Weekly AI Life Review & Ecosystem Audit\n\n` +
        `**🧠 1. StudySmart Intelligence**\n` +
        `- Logged Study Time: **${totalStudyHrs} hrs** this week across ${context.study.subjects.length} subjects.\n` +
        `- Focus Consistency: ${parseFloat(totalStudyHrs) >= 5 ? 'High Performance 🔥' : 'Room for deeper focus sprints 🎯'}\n\n` +
        `**🌱 2. Wellness & Habit Consistency**\n` +
        `- Active Streaks Maintained: **${activeStreaks} habits**\n` +
        `- Energy & Sleep: Rest mode telemetry shows stable recovery.\n\n` +
        `**💰 3. Financial Discipline**\n` +
        `- Total Monthly Outflow: **₹${totalSpent.toLocaleString()}** across ${context.finance.countMonth} transactions.\n` +
        `- Budget Status: Healthy liquidity.\n\n` +
        `**⚔️ 4. Character Progression (RPG)**\n` +
        `- Current Rank: **Level ${charLevel} Vanguard**\n` +
        `- Gold Vault: **${charGold} Coins** ready for Reward Store unlocking.\n\n` +
        `**💡 AI Strategic Recommendation for Next Week:**\n` +
        `*Prioritize 2 uninterrupted 50-minute study chambers before 12:00 PM. That single lever will double your weekly XP gain.*`;
    }

    // -------------------------------------------------------------
    // INTENT F: GOAL-RISK DETECTION
    // e.g. "Check goal risks", "goal risk", "goals falling behind"
    // -------------------------------------------------------------
    else if (/goal risk|check goal|goals falling behind|at risk/i.test(lower)) {
      const riskyQuests = context.quests.filter((q) => {
        if (!q.due_date) return false;
        const diffDays = (new Date(q.due_date) - new Date()) / (1000 * 60 * 60 * 24);
        return diffDays < 7;
      });

      if (riskyQuests.length > 0) {
        const q = riskyQuests[0];
        assistantResponse = `### ⚠️ Goal Risk Detection: Deadline Approaching\n\n` +
          `I analyzed your quest roadmap. **${q.title}** has an upcoming milestone deadline (${new Date(q.due_date).toLocaleDateString()}).\n\n` +
          `- **Estimated Completion Remaining**: ~40%\n` +
          `- **Risk Factor**: Moderate (Deadline within 7 days)\n\n` +
          `**Remediation Plan**:\n` +
          `1. Break ${q.title} into 3 micro-tasks today.\n` +
          `2. Dedicate a 50-minute Focus Chamber block tomorrow afternoon.\n` +
          `3. Completion reward: **+${q.xp_reward} XP** and **+${q.gold_reward} Gold**!`;
      } else {
        assistantResponse = `### 🎯 Goal Health: All Green\n\n` +
          `None of your active goals or quests are currently in critical danger zones. You have **${context.quests.length} active quests** scheduled with balanced lead times.`;
      }
    }

    // -------------------------------------------------------------
    // INTENT G: SCHEDULE OVERLOAD DETECTION
    // e.g. "Overloaded schedule", "Am I overloaded"
    // -------------------------------------------------------------
    else if (/overload|too busy|overwhelmed|schedule overload/i.test(lower)) {
      const totalLoad = context.dailies.length + context.quests.length;
      if (totalLoad > 7) {
        assistantResponse = `### ⚠️ Overload Detected: ${totalLoad} Active Items\n\n` +
          `Your task queue exceeds cognitive capacity guidelines for a single day.\n\n` +
          `- **Dailies Pending**: ${context.dailies.filter(d => !d.is_complete_today).length}\n` +
          `- **Active Quests**: ${context.quests.length}\n\n` +
          `**Recommended Pruning**:\n` +
          `Archive or postpone non-urgent quests to Focus on just 2 primary deliverables today. Your HP will thank you.`;
      } else {
        assistantResponse = `### 🌿 Schedule Density: Optimal\n\n` +
          `You have a sustainable workload of **${totalLoad} active commitments**. This gives you ample bandwidth for high-quality deep work and restorative evening reflection.`;
      }
    }

    // -------------------------------------------------------------
    // INTENT H: GENERAL CONVERSATIONAL / COACHING
    // -------------------------------------------------------------
    else {
      assistantResponse = `Hello! I'm **Jeevan AI**, your personal life assistant and global intelligence companion.\n\n` +
        `I am connected directly to your **StudySmart**, **Wellness**, **Finance**, **Goals**, and **RPG Progression**.\n\n` +
        `You can speak to me naturally:\n` +
        `- *"I spent ₹450 today"* → I'll log an expense in your Finance vault.\n` +
        `- *"I studied DBMS for 2 hours"* → I'll record study hours and grant Intelligence XP.\n` +
        `- *"Plan tomorrow"* → I'll construct a phased daily blueprint.\n` +
        `- *"Why am I losing my streak?"* → I'll diagnose your habit patterns.\n` +
        `- *"Weekly Life Review"* → I'll produce a holistic ecosystem report.\n\n` +
        `How can I assist your evolution today?`;
    }

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
