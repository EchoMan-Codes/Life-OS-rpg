/**
 * LifeOS Onboarding Questions, Data Model Mappings, and Synthesis Logic.
 * Inspired by Reference 1 & 2: single-purpose screens, large typography,
 * illustrated option cards, and progressive calibration.
 */

export const ONBOARDING_STEPS = [
  { id: 'intro', label: 'Welcome', index: 1 },
  { id: 'focus', label: 'Main Goal', index: 2 },
  { id: 'level', label: 'Discipline Level', index: 3 },
  { id: 'style', label: 'Work Style', index: 4 },
  { id: 'auth', label: 'Initialize', index: 5 },
];

export const TOTAL_STEPS = ONBOARDING_STEPS.length;

export const CORE_OBJECTIVES = [
  {
    id: 'deep-work',
    title: 'Study & Deep Work',
    category: 'Study',
    description: 'Cognitive problem solving, skills, coding & learning',
    attribute: 'Intelligence',
    stat: 'INT',
    color: '#38BDF8', // Azure
    archetype: 'Arcane Scholar',
    icon: 'Brain',
    motif: 'cognitive',
  },
  {
    id: 'vitality',
    title: 'Physical Vitality & Fitness',
    category: 'Fitness',
    description: 'Cardio, strength training, clean nutrition & recovery',
    attribute: 'Vitality',
    stat: 'VIT',
    color: '#34D399', // Emerald
    archetype: 'Immortal Warden',
    icon: 'Activity',
    motif: 'vitality',
  },
  {
    id: 'grit',
    title: 'Relentless Habits & Grit',
    category: 'Habits',
    description: 'Breaking bad loops, building daily streaks & stoic grit',
    attribute: 'Willpower',
    stat: 'WIL',
    color: '#A78BFA', // Violet
    archetype: 'Astral Sovereign',
    icon: 'Shield',
    motif: 'grit',
  },
  {
    id: 'execution',
    title: 'Career & Financial Focus',
    category: 'Career',
    description: 'Shipping milestones, wealth building & high-velocity output',
    attribute: 'Strength',
    stat: 'STR',
    color: '#DC2626', // Crimson
    archetype: 'Iron Vanguard',
    icon: 'Zap',
    motif: 'execution',
  },
  {
    id: 'mindfulness',
    title: 'Mindfulness & Life Balance',
    category: 'Balance',
    description: 'Burnout defense, calm evenings & energy restoration',
    attribute: 'Perception',
    stat: 'PER',
    color: '#FBBF24', // Amber
    archetype: 'Shadow Pathfinder',
    icon: 'Eye',
    motif: 'harmony',
  },
];

export const DISCIPLINE_LEVELS = [
  {
    id: 'beginner',
    title: 'Initiate Builder',
    levelLabel: 'Beginner',
    tagline: 'Establishing baseline consistency',
    description: 'Gentle penalty thresholds, forgiving streaks, focus on daily habit formation.',
    xpMultiplier: '1.0x Baseline XP',
    badge: 'Beginner',
    color: '#34D399', // Emerald
    motif: 'initiate',
  },
  {
    id: 'skilled',
    title: 'Disciplined Vanguard',
    levelLabel: 'Skilled',
    tagline: 'Consistent execution & daily rhythm',
    description: 'Standard RPG stat balancing, daily quest requirements, balanced HP/Mana stakes.',
    xpMultiplier: '1.25x Progress Velocity',
    badge: 'Skilled',
    color: '#38BDF8', // Azure
    motif: 'skilled',
  },
  {
    id: 'guru',
    title: 'Relentless Sovereign',
    levelLabel: 'Master',
    tagline: 'Peak performance & zero excuses',
    description: 'High-difficulty quests, strict streak decay, maximum gold & attribute multipliers.',
    xpMultiplier: '1.5x Mastery XP',
    badge: 'Master',
    color: '#A78BFA', // Violet
    motif: 'master',
  },
];

export const FOCUS_STYLES = [
  {
    id: 'sprint',
    duration: 25,
    breakTime: 5,
    title: 'Classic Pomodoro',
    badge: '25m / 5m',
    description: 'High-intensity cognitive bursts with crisp recovery intervals. Fast Mana regeneration.',
    icon: 'Zap',
  },
  {
    id: 'immersion',
    duration: 50,
    breakTime: 10,
    title: 'Extended Deep Flow',
    badge: '50m / 10m',
    description: 'Deep cognitive immersion for complex architecture, deep writing, and sustained thinking.',
    icon: 'Clock',
  },
  {
    id: 'deep',
    duration: 90,
    breakTime: 15,
    title: 'Ultradian Deep Dive',
    badge: '90m / 15m',
    description: 'Maximum stamina sessions matching human ultradian peak performance rhythms.',
    icon: 'Compass',
  },
];

/**
 * Generates an intelligent, tailored summary synthesis based on real selections.
 */
export function generateSystemSynthesis({ objectiveId, levelId, focusStyleId }) {
  const objective = CORE_OBJECTIVES.find((o) => o.id === objectiveId) || CORE_OBJECTIVES[0];
  const level = DISCIPLINE_LEVELS.find((l) => l.id === levelId) || DISCIPLINE_LEVELS[1];
  const focus = FOCUS_STYLES.find((f) => f.id === focusStyleId) || FOCUS_STYLES[1];

  return {
    archetype: objective.archetype,
    primaryAttribute: `${objective.attribute} (${objective.stat})`,
    primaryAttributeColor: objective.color,
    disciplineTier: level.title,
    cadenceTitle: `${level.levelLabel} Tier`,
    xpMultiplier: level.xpMultiplier,
    focusPreset: `${focus.duration}m Sprint`,
    focusSprint: `${focus.duration} min (${focus.title})`,
    summarySentence: `Configured as ${objective.archetype} at ${level.title} discipline tier with ${focus.duration}m cognitive sprints.`,
    recommendedDailies: [
      `Morning Calibration (${objective.stat} check-in)`,
      `${focus.duration}-Minute Deep Focus Chamber Sprint`,
      'Evening Reflection & Burnout Defense',
    ],
  };
}
