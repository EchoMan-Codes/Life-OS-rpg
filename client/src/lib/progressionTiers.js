/**
 * LifeOS Progression & Tier Color System.
 *
 * Implements a data-driven visual hierarchy mapping player progression from:
 * Blue (Initiate) → Azure (Adept) → Indigo (Vanguard) → Blue-Violet (Elite)
 * → Violet (Ascendant) → Purple (Master) → Deep Violet/Prismatic (Transcendent).
 *
 * Provides reusable tier functions for levels, difficulties, and attributes.
 */

export const LEVEL_TIERS = [
  {
    minLevel: 1,
    maxLevel: 4,
    tier: 1,
    roman: 'I',
    name: 'Initiate',
    hex: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.35)',
    border: 'border-blue-500/40',
    borderGlow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]',
    bgBadge: 'bg-blue-950/60 text-blue-300 border-blue-500/40',
    barGradient: 'from-blue-600 to-blue-400',
    accentClass: 'text-blue-400',
  },
  {
    minLevel: 5,
    maxLevel: 9,
    tier: 2,
    roman: 'II',
    name: 'Adept',
    hex: '#0ea5e9',
    glow: 'rgba(14, 165, 233, 0.35)',
    border: 'border-sky-500/40',
    borderGlow: 'shadow-[0_0_15px_rgba(14,165,233,0.3)]',
    bgBadge: 'bg-sky-950/60 text-sky-300 border-sky-500/40',
    barGradient: 'from-sky-600 to-cyan-400',
    accentClass: 'text-sky-400',
  },
  {
    minLevel: 10,
    maxLevel: 14,
    tier: 3,
    roman: 'III',
    name: 'Vanguard',
    hex: '#6366f1',
    glow: 'rgba(99, 102, 241, 0.4)',
    border: 'border-indigo-500/40',
    borderGlow: 'shadow-[0_0_18px_rgba(99,102,241,0.35)]',
    bgBadge: 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40',
    barGradient: 'from-indigo-600 to-sky-400',
    accentClass: 'text-indigo-400',
  },
  {
    minLevel: 15,
    maxLevel: 19,
    tier: 4,
    roman: 'IV',
    name: 'Elite',
    hex: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.4)',
    border: 'border-violet-500/40',
    borderGlow: 'shadow-[0_0_18px_rgba(139,92,246,0.35)]',
    bgBadge: 'bg-violet-950/60 text-violet-300 border-violet-500/40',
    barGradient: 'from-violet-600 to-indigo-400',
    accentClass: 'text-violet-400',
  },
  {
    minLevel: 20,
    maxLevel: 29,
    tier: 5,
    roman: 'V',
    name: 'Ascendant',
    hex: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.45)',
    border: 'border-purple-500/50',
    borderGlow: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]',
    bgBadge: 'bg-purple-950/70 text-purple-300 border-purple-500/50',
    barGradient: 'from-purple-600 to-violet-400',
    accentClass: 'text-purple-400',
  },
  {
    minLevel: 30,
    maxLevel: 49,
    tier: 6,
    roman: 'VI',
    name: 'Master',
    hex: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.5)',
    border: 'border-fuchsia-500/50',
    borderGlow: 'shadow-[0_0_24px_rgba(192,132,252,0.45)]',
    bgBadge: 'bg-fuchsia-950/70 text-fuchsia-300 border-fuchsia-500/50',
    barGradient: 'from-fuchsia-600 to-purple-400',
    accentClass: 'text-fuchsia-400',
  },
  {
    minLevel: 50,
    maxLevel: 999,
    tier: 7,
    roman: 'VII',
    name: 'Transcendent',
    hex: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.55)',
    border: 'border-pink-500/60',
    borderGlow: 'shadow-[0_0_28px_rgba(236,72,153,0.5)]',
    bgBadge: 'bg-pink-950/80 text-pink-200 border-pink-400/60',
    barGradient: 'from-pink-600 via-purple-500 to-cyan-400',
    accentClass: 'text-pink-400',
  },
];

/**
 * Get tier info object for a specific character level.
 * @param {number} level
 */
export function getLevelTier(level = 1) {
  const lvl = Math.max(1, Number(level) || 1);
  const found = LEVEL_TIERS.find((t) => lvl >= t.minLevel && lvl <= t.maxLevel);
  return found || LEVEL_TIERS[0];
}

/**
 * Get primary hex color for a specific character level.
 * @param {number} level
 */
export function getLevelColor(level = 1) {
  return getLevelTier(level).hex;
}

export const DIFFICULTY_TIERS = {
  low: {
    key: 'low',
    label: 'STANDARD',
    rank: 'RANK D',
    hex: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.25)',
    bgBadge: 'bg-blue-950/60 text-blue-300 border-blue-500/30',
    badgeClass: 'text-blue-400 border-blue-500/30 bg-blue-950/50',
    borderClass: 'border-blue-500/30',
  },
  medium: {
    key: 'medium',
    label: 'MEDIUM',
    rank: 'RANK B',
    hex: '#0ea5e9',
    glow: 'rgba(14, 165, 233, 0.3)',
    bgBadge: 'bg-sky-950/60 text-sky-300 border-sky-500/40',
    badgeClass: 'text-sky-400 border-sky-500/40 bg-sky-950/50',
    borderClass: 'border-sky-500/40',
  },
  high: {
    key: 'high',
    label: 'HIGH',
    rank: 'RANK A',
    hex: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.35)',
    bgBadge: 'bg-purple-950/60 text-purple-300 border-purple-500/50',
    badgeClass: 'text-purple-300 border-purple-500/50 bg-purple-950/60',
    borderClass: 'border-purple-500/50',
  },
  critical: {
    key: 'critical',
    label: 'CRITICAL',
    rank: 'RANK S',
    hex: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.45)',
    bgBadge: 'bg-pink-950/80 text-pink-200 border-pink-500/60',
    badgeClass: 'text-pink-300 border-pink-500/60 bg-pink-950/70',
    borderClass: 'border-pink-500/60',
  },
};

/**
 * Get difficulty configuration object.
 * @param {string} difficulty - 'low' | 'medium' | 'high' | 'critical'
 */
export function getDifficultyTier(difficulty = 'low') {
  const norm = String(difficulty || 'low').toLowerCase();
  if (norm === 'easy') return DIFFICULTY_TIERS.low;
  if (norm === 'hard') return DIFFICULTY_TIERS.high;
  if (norm === 'omega' || norm === 'epic') return DIFFICULTY_TIERS.critical;
  return DIFFICULTY_TIERS[norm] || DIFFICULTY_TIERS.low;
}

/**
 * Get difficulty accent CSS classes.
 * @param {string} difficulty
 */
export function getDifficultyAccent(difficulty = 'low') {
  return getDifficultyTier(difficulty).badgeClass;
}

export const ATTRIBUTE_THEMES = {
  strength: {
    name: 'Strength',
    code: 'STR',
    hex: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.35)',
    textClass: 'text-red-400',
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/30',
    badgeClass: 'bg-red-950/60 text-red-300 border-red-500/40',
    barGradient: 'from-red-600 to-rose-400',
  },
  intelligence: {
    name: 'Intelligence',
    code: 'INT',
    hex: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.35)',
    textClass: 'text-sky-400',
    bgClass: 'bg-sky-500/10',
    borderClass: 'border-sky-500/30',
    badgeClass: 'bg-sky-950/60 text-sky-300 border-sky-500/40',
    barGradient: 'from-sky-600 to-cyan-400',
  },
  vitality: {
    name: 'Vitality',
    code: 'VIT',
    hex: '#10b981',
    glow: 'rgba(16, 185, 129, 0.35)',
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/30',
    badgeClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40',
    barGradient: 'from-emerald-600 to-teal-400',
  },
  willpower: {
    name: 'Willpower',
    code: 'WIS',
    hex: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.35)',
    textClass: 'text-purple-400',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/30',
    badgeClass: 'bg-purple-950/60 text-purple-300 border-purple-500/40',
    barGradient: 'from-purple-600 to-violet-400',
  },
  perception: {
    name: 'Perception',
    code: 'PER',
    hex: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.35)',
    textClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30',
    badgeClass: 'bg-amber-950/60 text-amber-300 border-amber-500/40',
    barGradient: 'from-amber-600 to-yellow-400',
  },
};

/**
 * Get attribute theme object.
 * @param {string} attribute
 */
export function getAttributeTheme(attribute = 'willpower') {
  const norm = String(attribute || 'willpower').toLowerCase();
  return ATTRIBUTE_THEMES[norm] || ATTRIBUTE_THEMES.willpower;
}
