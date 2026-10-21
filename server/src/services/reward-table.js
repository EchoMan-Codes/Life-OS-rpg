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

