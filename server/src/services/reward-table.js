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
