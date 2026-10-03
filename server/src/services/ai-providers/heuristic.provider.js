/**
 * Intelligent Local Heuristic AI Provider.
 *
 * Fast, robust, deterministic fallback engine that runs without requiring any external
 * cloud API keys. Handles conversational queries, Jeevan commands, and data analysis.
 */
export class HeuristicAiProvider {
  name = 'heuristic';

  async generateResponse({ message, userContext, history = [] }) {
    const rawMessage = message.trim();
    const lower = rawMessage.toLowerCase();

    let assistantResponse = '';
    let actionType = null;
    let actionPayload = null;
    let actionStatus = null;

    // ── Command 1: Expense Tracking ──
    const expenseRegex = /(?:spent|spend|paid|cost|bought|purchase)\s+(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:on|for)?\s*([a-zA-Z0-9\s]+)?/i;
    const expenseMatch = rawMessage.match(expenseRegex);

    if (expenseMatch) {
      const amount = parseFloat(expenseMatch[1]);
      let item = (expenseMatch[2] || 'General expense').trim().replace(/today|yesterday|now/gi, '').trim() || 'General expense';
      
      let category = 'other';
      const itemLower = item.toLowerCase();
      if (/food|dinner|lunch|breakfast|snack|tea|coffee|swiggy|zomato|burger|pizza|biryani|grocery/i.test(itemLower)) category = 'food';
      else if (/cloth|dress|shoe|amazon|myntra|flipkart|shopping/i.test(itemLower)) category = 'shopping';
      else if (/book|course|study|udemy|fee|tuition|pen|notebook/i.test(itemLower)) category = 'study';
      else if (/med|medicine|doctor|pharmacy|gym|fitness/i.test(itemLower)) category = 'health';
      else if (/uber|ola|cab|auto|bus|metro|fuel|petrol/i.test(itemLower)) category = 'transport';

      actionType = 'create_expense';
      actionPayload = {
        amount,
        currency: 'INR',
        category,
        note: item,
        spentAt: new Date().toISOString(),
      };
      actionStatus = 'proposed';

      assistantResponse =
        `I found a **₹${amount}** expense for **${item}** (Category: *${category.toUpperCase()}*).\n\n` +
        `Would you like me to record this in your Finance vault?`;
      
      return { content: assistantResponse, actionType, actionPayload, actionStatus };
    }

    // ── Command 2: Study Sprint Logging ──
    const studyRegex = /(?:studied|study|reading|read|worked on|practiced)\s+([a-zA-Z0-9\s\-_]+?)\s+(?:for\s+)?(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)/i;
    const studyMatch = rawMessage.match(studyRegex);

    if (studyMatch) {
      const subjectName = studyMatch[1].trim();
      const num = parseFloat(studyMatch[2]);
      const unit = studyMatch[3].toLowerCase();
      const durationMinutes = unit.startsWith('h') ? Math.round(num * 60) : Math.round(num);

      actionType = 'log_study';
      actionPayload = {
        subject: subjectName.toUpperCase(),
        durationMinutes,
        notes: `Logged via Jeevan AI prompt: "${rawMessage}"`,
      };
      actionStatus = 'proposed';

      const xpEstimate = Math.round(durationMinutes * 0.5);
      const goldEstimate = Math.round(durationMinutes * 0.16);

      assistantResponse =
        `Impressive dedication! I parsed a **${durationMinutes}-minute** study sprint in **${subjectName.toUpperCase()}**.\n\n` +
        `Logging this will grant you **+${xpEstimate} Intelligence XP** and **+${goldEstimate} Gold**.\n\n` +
        `Confirm to log this into StudySmart?`;

      return { content: assistantResponse, actionType, actionPayload, actionStatus };
    }

    // ── Command 3: Day Planning ("Plan tomorrow", "Plan my day") ──
    if (lower.includes('plan tomorrow') || lower.includes('plan my day') || lower.includes('plan today')) {
      const habitsCount = userContext.habits?.length || 0;
      const dailiesCount = userContext.dailies?.length || 0;
      const questsCount = userContext.quests?.length || 0;

      assistantResponse =
        `### 🗓️ Optimized Daily Schedule Blueprint\n\n` +
        `Here is your balanced, high-performance daily structure:\n\n` +
        `* **06:30 AM – 07:15 AM: Morning Activation Phase**\n` +
        `  - Hydration (500ml) & light movement\n` +
        `  - Review daily priorities & habit kickoff (${habitsCount} active habits)\n\n` +
        `* **09:00 AM – 11:30 AM: Deep Work & Academic Focus Sprint**\n` +
        `  - Core study module (Focus timer recommended: 2x 50-min blocks)\n` +
        `  - Zero phone notifications / Deep Work mode\n\n` +
        `* **02:00 PM – 03:30 PM: Quest Execution & Operational Block**\n` +
        `  - Target top priority quest (${questsCount} active quests)\n` +
        `  - Review routine dailies (${dailiesCount} pending)\n\n` +
        `* **06:00 PM – 07:15 PM: Physical Vitality & Cardio**\n` +
        `  - Evening exercise or walking session\n\n` +
        `* **09:30 PM – 10:00 PM: Evening Reflection & Recovery**\n` +
        `  - Log final expenses into Finance vault\n` +
        `  - Record mood & sleep readiness in Reflection\n\n` +
        `Ready to execute? Start a sprint from the Focus Chamber whenever you're set!`;

      return { content: assistantResponse, actionType, actionPayload, actionStatus };
    }

    // ── Command 4: Streak Diagnosis ──
    if (lower.includes('streak') || lower.includes('losing my streak')) {
      const topHabit = userContext.habits?.[0];
      const streakInfo = topHabit
        ? `Your highest active habit is **"${topHabit.title}"** (Current streak: **${topHabit.current_streak} days**, Best: **${topHabit.best_streak} days**).`
        : `You haven't established active habit streaks yet.`;

      assistantResponse =
        `### ⚡ Habit Streak Telemetry & Diagnostic\n\n` +
        `${streakInfo}\n\n` +
        `**Root Cause Analysis:**\n` +
        `1. **Friction Points:** Streaks break when the habit trigger is vague (e.g. "read more" vs "read 10 pages immediately after dinner").\n` +
        `2. **Energy Depletion:** Late evening habits have a 65% higher skip rate due to decision fatigue.\n` +
        `3. **Cognitive Load:** Trying to maintain too many high-difficulty habits simultaneously.\n\n` +
        `**Recommended Protocol:**\n` +
        `- Shift critical habits to the first 2 hours after waking.\n` +
        `- Use a **Streak Shield** from the Reward Shop to protect hard-earned streaks on recovery days.`;

      return { content: assistantResponse, actionType, actionPayload, actionStatus };
    }

    // ── Command 5: Weekly Life Review ──
    if (lower.includes('weekly') && (lower.includes('review') || lower.includes('life review') || lower.includes('audit'))) {
      const totalHours = userContext.study?.totalHours || '0.0';
      const spent = userContext.finance?.totalMonth || 0;
      const level = userContext.character?.level || 1;
      const xp = userContext.character?.xp || 0;
      const habitsActive = userContext.habits?.length || 0;

      assistantResponse =
        `### 📊 Holistic Weekly Life Ecosystem Review\n\n` +
        `* **RPG Evolution:** Level **${level}** Explorer (${xp} Total XP accumulated).\n` +
        `* **StudySmart Progress:** **${totalHours} hours** logged in academic & skill sprints.\n` +
        `* **Habits & Wellness:** **${habitsActive} active habits** tracked with positive momentum.\n` +
        `* **Financial Health:** **₹${spent}** recorded expenses this month.\n\n` +
        `**Key Observation:** Your academic focus and consistency are solid. Recommend maintaining your evening reflection habit to optimize rest and prevent burnout!`;

      return { content: assistantResponse, actionType, actionPayload, actionStatus };
    }

    // ── Command 6: Schedule Overload Check ──
    if (lower.includes('overload') || lower.includes('busy') || lower.includes('too much')) {
      const activeQuests = userContext.quests?.length || 0;
      const activeDailies = userContext.dailies?.length || 0;
      const totalLoad = activeQuests + activeDailies;

      assistantResponse =
        `### ⚖️ Workload & Capacity Audit\n\n` +
        `You currently have **${activeQuests} active quests** and **${activeDailies} daily rituals** scheduled.\n\n` +
        (totalLoad > 8
          ? `⚠️ **Elevated Cognitive Density:** Your task density is high. Focus exclusively on your top 2 high-priority quests today and defer secondary tasks.`
          : `✅ **Optimal Flow State:** Your schedule density is well-balanced (${totalLoad} active items). Keep momentum without overwhelming your willpower reserves!`);

      return { content: assistantResponse, actionType, actionPayload, actionStatus };
    }

    // ── Command 7: Goal Risk Scan ──
    if (lower.includes('goal risk') || lower.includes('check goal') || lower.includes('on track')) {
      const quests = userContext.quests || [];
      const urgentQuests = quests.filter((q) => q.due_date && new Date(q.due_date) < new Date(Date.now() + 3 * 86400000));

      assistantResponse =
        `### 🎯 Goal & Quest Risk Evaluation\n\n` +
        (urgentQuests.length > 0
          ? `⚠️ **${urgentQuests.length} Quest(s) Approaching Deadline:**\n` +
            urgentQuests.map((q) => `- **${q.title}** (Due: ${new Date(q.due_date).toLocaleDateString()})`).join('\n') +
            `\n\nPrioritize these items in today's Focus sprint to prevent HP penalty!`
          : `✅ **All Clear:** None of your active quests have imminent deadlines within the next 72 hours. Perfect window to make deep progress on long-term milestones.`);

      return { content: assistantResponse, actionType, actionPayload, actionStatus };
    }

    // ── Conversational Greetings & General Questions ──
    if (/^(hi|hello|hey|greetings|good morning|good evening)/i.test(lower)) {
      const name = userContext.character ? `Hero (Level ${userContext.character.level})` : 'Explorer';
      assistantResponse =
        `Greetings, ${name}! I'm Jeevan AI, your personal life intelligence companion.\n\n` +
        `I'm connected to your Study, Wellness, Finance, Goals, and RPG progression.\n\n` +
        `Here are a few things you can ask me anytime:\n` +
        `- *"I spent ₹250 on books today"* → Propose an expense for Finance vault\n` +
        `- *"I studied DBMS for 90 minutes"* → Log study sprint & earn XP\n` +
        `- *"Plan tomorrow"* → Synthesize a structured day blueprint\n` +
        `- *"Why am I losing my streak?"* → Diagnose habit consistency\n` +
        `- *"Weekly Life Review"* → Produce cross-domain ecosystem report\n\n` +
        `How would you like to evolve today?`;

      return { content: assistantResponse, actionType, actionPayload, actionStatus };
    }

    // Default intelligent assistant response
    assistantResponse =
      `I hear you! As your Jeevan AI companion, I analyze your entire operating system to help you grow.\n\n` +
      `You can tell me about what you studied, expenses you made, habits you want to improve, or ask for planning assistance.\n\n` +
      `Try:\n` +
      `- *"Plan tomorrow"*\n` +
      `- *"I spent ₹300 on groceries"*\n` +
      `- *"I studied Data Structures for 1 hour"*\n` +
      `- *"Weekly Life Review"*`;

    return { content: assistantResponse, actionType, actionPayload, actionStatus };
  }
}
