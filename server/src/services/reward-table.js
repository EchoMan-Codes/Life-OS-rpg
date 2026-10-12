/**
 * Reward table constants shared across Phase 3 (Habits, Dailies, Quests) and Phase 4.
 *
 * Difficulty reward base values:
 * - trivial: 3 XP, 1 Gold
 * - easy: 8 XP, 3 Gold
 * - medium: 15 XP, 6 Gold
 * - hard: 25 XP, 10 Gold
 */
export const DIFFICULTY_REWARDS = {
  trivial: { xp: 3, gold: 1 },
  easy: { xp: 8, gold: 3 },
  medium: { xp: 15, gold: 6 },
  hard: { xp: 25, gold: 10 },
};

/**
 * Calculates XP, Gold, and HP delta for scoring a habit.
 *
 * Positive score:
 *   - Grants difficulty-scaled XP and Gold
 *   - 0 HP delta
 *
 * Negative score:
 *   - 0 XP, 0 Gold
 *   - Deducts HP based on: -Math.round(reward.xp * 0.4)
 *
 * @param {'trivial' | 'easy' | 'medium' | 'hard'} difficulty
 * @param {'positive' | 'negative'} direction
 * @returns {{ xp: number, gold: number, hp: number }}
 */
export function calculateHabitReward(difficulty, direction) {
  const base = DIFFICULTY_REWARDS[difficulty] || DIFFICULTY_REWARDS.easy;

  if (direction === 'positive') {
    return {
      xp: base.xp,
      gold: base.gold,
      hp: 0,
    };
  }

  if (direction === 'negative') {
    return {
      xp: 0,
      gold: 0,
      hp: -Math.round(base.xp * 0.4),
    };
  }

  throw new Error(`Invalid score direction: ${direction}`);
}

/**
 * HP penalty values for failing an active daily on midnight reset.
 * Phase 3.2 specification:
 * - trivial: 2 HP
 * - easy: 5 HP
 * - medium: 10 HP
 * - hard: 18 HP
 */
export const HP_PENALTY = {
  trivial: 2,
  easy: 5,
  medium: 10,
  hard: 18,
};

/**
 * Returns the authoritative HP penalty for missing an active daily.
 *
 * @param {'trivial' | 'easy' | 'medium' | 'hard'} difficulty
 * @returns {number} HP penalty (positive integer, e.g. 5 for easy)
 */
export function hpPenaltyFor(difficulty) {
  return HP_PENALTY[difficulty] ?? HP_PENALTY.easy;
}

/**
 * Calculates XP and Gold granted for completing a daily.
 *
 * @param {'trivial' | 'easy' | 'medium' | 'hard'} difficulty
 * @returns {{ xp: number, gold: number }}
 */
export function calculateDailyReward(difficulty) {
  const base = DIFFICULTY_REWARDS[difficulty] || DIFFICULTY_REWARDS.easy;
  return {
    xp: base.xp,
    gold: base.gold,
  };
}

/**
 * Quest completion reward base values.
 * Phase 3.3 specification:
 * - trivial: 10 XP / 5 Gold
 * - easy:    20 XP / 10 Gold
 * - medium:  35 XP / 18 Gold
 * - hard:    60 XP / 30 Gold
 */
export const QUEST_REWARDS = {
  trivial: { xp: 10, gold: 5 },
  easy: { xp: 20, gold: 10 },
  medium: { xp: 35, gold: 18 },
  hard: { xp: 60, gold: 30 },
};

/**
 * Standard checklist subtask reward.
 * Phase 3.3 specification: +2 XP / +1 Gold per item.
 */
export const CHECKLIST_ITEM_REWARD = {
  xp: 2,
  gold: 1,
};

/**
 * Milestone bonuses at 25%, 50%, 75%, 100% progress thresholds.
 */
export const MILESTONE_REWARDS = {
  25: { xp: 5, gold: 2 },
  50: { xp: 10, gold: 4 },
  75: { xp: 15, gold: 6 },
  100: { xp: 20, gold: 8 },
};

/**
 * Calculates parent quest completion reward based on difficulty.
 *
 * @param {'trivial' | 'easy' | 'medium' | 'hard'} difficulty
 * @returns {{ xp: number, gold: number }}
 */
export function calculateQuestReward(difficulty) {
  const base = QUEST_REWARDS[difficulty] || QUEST_REWARDS.medium;
  return {
    xp: base.xp,
    gold: base.gold,
  };
}

/**
 * Jeevan Quests Unified System — Duration Base Rewards
 * - Weekly: 200 XP, 40 Coins/Gold
 * - Monthly: 800 XP, 160 Coins/Gold
 * - Yearly: 5,000 XP, 1,000 Coins/Gold
 * - Custom: 400 XP, 80 Coins/Gold
 */
export const QUEST_DURATION_BASE = {
  weekly: { xp: 200, gold: 40 },
  monthly: { xp: 800, gold: 160 },
  yearly: { xp: 5000, gold: 1000 },
  custom: { xp: 400, gold: 80 },
};

/**
 * Jeevan Quests Unified System — Difficulty Multipliers
 * - trivial: 0.25x
 * - easy: 0.5x
 * - medium: 1.0x
 * - hard: 1.5x
 * - epic: 2.0x
 */
export const QUEST_DIFFICULTY_MULTIPLIERS = {
  trivial: 0.25,
  easy: 0.5,
  medium: 1.0,
  hard: 1.5,
  epic: 2.0,
};

/**
 * Active quest limit quotas per category
 */
export const ACTIVE_QUEST_LIMITS = {
  weekly: 3,
  monthly: 3,
  yearly: 1,
};

/**
 * Calculates suggested XP and Coins/Gold for a quest given its duration and difficulty.
 *
 * @param {'weekly' | 'monthly' | 'yearly' | 'custom'} duration
 * @param {'trivial' | 'easy' | 'medium' | 'hard' | 'epic'} difficulty
 * @returns {{ xp: number, gold: number }}
 */
export function calculateQuestSuggestedReward(duration = 'weekly', difficulty = 'medium') {
  const base = QUEST_DURATION_BASE[duration] || QUEST_DURATION_BASE.weekly;
  const mult = QUEST_DIFFICULTY_MULTIPLIERS[difficulty] ?? 1.0;
  return {
    xp: Math.round(base.xp * mult),
    gold: Math.round(base.gold * mult),
  };
}

/**
 * Validates edited quest rewards against server-enforced bounds (50% to 150% of suggested baseline).
 *
 * @param {'weekly' | 'monthly' | 'yearly' | 'custom'} duration
 * @param {'trivial' | 'easy' | 'medium' | 'hard' | 'epic'} difficulty
 * @param {{ xp: number, gold: number }} rewards
 * @returns {{ valid: boolean, error?: string, minXp: number, maxXp: number, minGold: number, maxGold: number, suggested: { xp: number, gold: number } }}
 */
export function validateQuestRewards(duration = 'weekly', difficulty = 'medium', rewardsOrXp = {}, maybeGold = undefined) {
  const suggested = calculateQuestSuggestedReward(duration, difficulty);
  const minXp = Math.floor(suggested.xp * 0.5);
  const maxXp = Math.ceil(suggested.xp * 1.5);
  const minGold = Math.floor(suggested.gold * 0.5);
  const maxGold = Math.ceil(suggested.gold * 1.5);

  let rawXp;
  let rawGold;
  if (typeof rewardsOrXp === 'number') {
    rawXp = rewardsOrXp;
    rawGold = maybeGold;
  } else if (rewardsOrXp && typeof rewardsOrXp === 'object') {
    rawXp = rewardsOrXp.xp ?? rewardsOrXp.rewardXp;
    rawGold = rewardsOrXp.gold ?? rewardsOrXp.coins ?? rewardsOrXp.rewardCoins;
  }

  const numXp = Number(rawXp ?? suggested.xp);
  const numGold = Number(rawGold ?? suggested.gold);

  if (isNaN(numXp) || numXp < minXp || numXp > maxXp) {
    return {
      valid: false,
      error: `XP reward must be between ${minXp} and ${maxXp} (50%–150% of suggested ${suggested.xp} XP). Received: ${rawXp}`,
      minXp,
      maxXp,
      minGold,
      maxGold,
      suggested,
    };
  }

  if (isNaN(numGold) || numGold < minGold || numGold > maxGold) {
    return {
      valid: false,
      error: `Coins/Gold reward must be between ${minGold} and ${maxGold} (50%–150% of suggested ${suggested.gold} Coins). Received: ${rawGold}`,
      minXp,
      maxXp,
      minGold,
      maxGold,
      suggested,
    };
  }

  return {
    valid: true,
    xp: Math.round(numXp),
    gold: Math.round(numGold),
    minXp,
    maxXp,
    minGold,
    maxGold,
    suggested,
  };
}

/**
 * Categorizes a custom quest's limit category based on start and due date span.
 * - <= 14 days: 'weekly'
 * - <= 90 days: 'monthly'
 * - > 90 days: 'yearly'
 *
 * @param {string | Date} startDate
 * @param {string | Date} dueDate
 * @returns {'weekly' | 'monthly' | 'yearly'}
 */
export function resolveCustomQuestLimitCategory(startDateOrDays, dueDate) {
  if (typeof startDateOrDays === 'number' && dueDate === undefined) {
    if (startDateOrDays <= 14) return 'weekly';
    if (startDateOrDays <= 90) return 'monthly';
    return 'yearly';
  }
  if (!dueDate) return 'weekly';
  const start = startDateOrDays ? new Date(startDateOrDays) : new Date();
  const due = new Date(dueDate);
  const diffDays = Math.ceil((due.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 14) return 'weekly';
  if (diffDays <= 90) return 'monthly';
  return 'yearly';
}


