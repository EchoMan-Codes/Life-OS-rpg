/**
 * LifeOS Onboarding Questions, Data Model Mappings, and Synthesis Logic.
 */

export const ONBOARDING_STEPS = [
  { id: 'intro', label: 'Manifesto', index: 1 },
  { id: 'focus', label: 'Core Objective', index: 2 },
  { id: 'cadence', label: 'Daily Rhythm', index: 3 },
  { id: 'style', label: 'Focus Style', index: 4 },
  { id: 'auth', label: 'Initialize', index: 5 },
];

export const TOTAL_STEPS = ONBOARDING_STEPS.length;

export const CORE_OBJECTIVES = [
  {
    id: 'deep-work',
    title: 'Deep Work & Skill Mastery',
    description: 'Cognitive problem solving, learning, coding, writing',
    attribute: 'Intelligence',
    stat: 'INT',
    color: '#38BDF8', // Azure
    archetype: 'Arcane Scholar',
    icon: 'Brain',
  },
  {
    id: 'vitality',
    title: 'Physical Vitality & Health',
    description: 'Cardio, strength training, clean nutrition, sleep',
    attribute: 'Vitality',
    stat: 'VIT',
    color: '#34D399', // Emerald
    archetype: 'Immortal Warden',
    icon: 'Activity',
  },
  {
    id: 'grit',
    title: 'Relentless Discipline & Habits',
    description: 'Breaking bad habits, daily streaks, unstoppable grit',
    attribute: 'Willpower',
    stat: 'WIL',
    color: '#A78BFA', // Violet
    archetype: 'Astral Sovereign',
    icon: 'Shield',
  },
  {
    id: 'execution',
    title: 'Execution Speed & Output',
    description: 'Crushing tasks, shipping projects, high-volume delivery',
    attribute: 'Strength',
    stat: 'STR',
    color: '#DC2626', // Crimson
    archetype: 'Iron Vanguard',
    icon: 'Zap',
  },
  {
    id: 'mindfulness',
    title: 'Clarity, Energy & Harmony',
    description: 'Stress mitigation, evening reflection, burnout defense',
    attribute: 'Perception',
    stat: 'PER',
    color: '#FBBF24', // Amber
    archetype: 'Shadow Pathfinder',
    icon: 'Eye',
  },
];

export const DAILY_CADENCES = [
  {
    id: 'morning',
    title: 'Morning Momentum',
    tagline: 'Win the morning, win the day',
    description: 'Stack your most critical dailies before noon. Generates early XP and sets daily momentum.',
    icon: 'Sunrise',
  },
  {
    id: 'flow',
    title: 'Steady Rhythm',
    tagline: 'Consistent pacing throughout',
    description: 'Balanced check-ins across the day. Ideal for blended schedules and flexible priorities.',
    icon: 'Compass',
  },
  {
    id: 'evening',
    title: 'Night Owl & Reflection',
    tagline: 'Mindful evening decompression',
    description: 'Evening review, 30-day wellness reflections, and preparing tomorrow’s quest objectives.',
    icon: 'Moon',
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
  },
  {
    id: 'immersion',
    duration: 50,
    breakTime: 10,
    title: 'Extended Flow',
    badge: '50m / 10m',
    description: 'Deep cognitive immersion for complex architecture, deep writing, and sustained thinking.',
  },
  {
    id: 'deep',
    duration: 90,
    breakTime: 15,
    title: 'Ultradian Deep Dive',
    badge: '90m / 15m',
    description: 'Maximum stamina sessions matching human ultradian peak performance rhythms.',
  },
];

/**
 * Generates an intelligent, tailored summary synthesis based on real selections.
 */
export function generateSystemSynthesis({ objectiveId, cadenceId, focusStyleId }) {
  const objective = CORE_OBJECTIVES.find((o) => o.id === objectiveId) || CORE_OBJECTIVES[0];
  const cadence = DAILY_CADENCES.find((c) => c.id === cadenceId) || DAILY_CADENCES[0];
  const focus = FOCUS_STYLES.find((f) => f.id === focusStyleId) || FOCUS_STYLES[1];

  return {
    archetype: objective.archetype,
    primaryAttribute: `${objective.attribute} (${objective.stat})`,
    primaryAttributeColor: objective.color,
    cadenceTitle: cadence.title,
    focusPreset: focus.badge,
    summarySentence: `Configured for ${objective.title.toLowerCase()}, a ${cadence.title.toLowerCase()} ritual cadence, and ${focus.title.toLowerCase()} focus intervals.`,
  };
}
