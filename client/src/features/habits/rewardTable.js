/**
 * Reward table constants mirrored from server for client-side optimistic calculation.
 */
export const DIFFICULTY_REWARDS = {
  trivial: { xp: 3, gold: 1 },
  easy: { xp: 8, gold: 3 },
  medium: { xp: 15, gold: 6 },
  hard: { xp: 25, gold: 10 },
};

/**
 * Calculates XP, Gold, and HP delta for a habit score.
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

  return { xp: 0, gold: 0, hp: 0 };
}
