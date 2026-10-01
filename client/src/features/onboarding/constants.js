/**
 * LifeOS 5-Question Personalization Onboarding Flow Constants & Presets.
 * Exact logic: Goal -> Life Areas -> Schedule -> Problem -> AI Preferences
 */

export const ONBOARDING_STEPS = [
  { id: 'goal', label: 'Primary Goal', index: 1 },
  { id: 'life_areas', label: 'Life Areas', index: 2 },
  { id: 'schedule', label: 'Daily Schedule', index: 3 },
  { id: 'challenges', label: 'Current Challenge', index: 4 },
  { id: 'ai_help', label: 'AI Assistance', index: 5 },
];

export const TOTAL_STEPS = ONBOARDING_STEPS.length;

// Question 1: Goals
export const GOAL_OPTIONS = [
  { id: 'crack-gate', label: 'Crack GATE', desc: 'Master technical syllabus, revisions & mock sprints' },
  { id: 'get-fit', label: 'Get Fit', desc: 'Strength training, cardio endurance & healthy routine' },
  { id: 'learn-skill', label: 'Learn a New Skill', desc: 'Programming, AI engineering, design, or language' },
  { id: 'build-projects', label: 'Build Projects', desc: 'Ship production-ready software & showcase work' },
  { id: 'internship', label: 'Get an Internship', desc: 'Resume prep, technical interviews & cold outreach' },
  { id: 'freelancing', label: 'Start Freelancing', desc: 'Client acquisition, portfolio building & monetization' },
  { id: 'discipline', label: 'Improve Discipline', desc: 'Eliminate bad routines, conquer procrastination' },
  { id: 'manage-money', label: 'Manage Money Better', desc: 'Budgeting, expense tracking & wealth compounding' },
  { id: 'other', label: 'Other (Custom)', desc: 'Define your own personal epic quest' },
];

// Question 2: Life Areas
export const LIFE_AREA_OPTIONS = [
  { id: 'study', label: 'Study & Learning', icon: 'BookOpen', color: '#6366F1', bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' },
  { id: 'fitness', label: 'Fitness & Health', icon: 'Dumbbell', color: '#10B981', bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
  { id: 'finance', label: 'Finance & Expenses', icon: 'Wallet', color: '#F59E0B', bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
  { id: 'career', label: 'Career & Skills', icon: 'Briefcase', color: '#EC4899', bg: 'bg-pink-500/10 border-pink-500/30 text-pink-400' },
  { id: 'habits', label: 'Habits & Discipline', icon: 'Flame', color: '#F97316', bg: 'bg-orange-500/10 border-orange-500/30 text-orange-400' },
  { id: 'productivity', label: 'Productivity', icon: 'Target', color: '#0EA5E9', bg: 'bg-sky-500/10 border-sky-500/30 text-sky-400' },
  { id: 'growth', label: 'Personal Growth', icon: 'Sparkles', color: '#8B5CF6', bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400' },
  { id: 'other', label: 'Other', icon: 'Activity', color: '#64748B', bg: 'bg-slate-500/10 border-slate-500/30 text-slate-400' },
];

// Question 4: Current Challenges
export const CHALLENGE_OPTIONS = [
  { id: 'procrastination', label: 'Procrastination', desc: 'Putting off important work until the last minute' },
  { id: 'inconsistent', label: 'Inconsistent Routine', desc: 'Starting strong but losing momentum after a few days' },
  { id: 'screen-time', label: 'Too Much Screen Time', desc: 'Endless doomscrolling and digital distractions' },
  { id: 'time-mgmt', label: 'Poor Time Management', desc: 'Days slip away without finishing primary priorities' },
  { id: 'motivation', label: 'Lack of Motivation', desc: 'Struggling to find energy and focus to begin' },
  { id: 'staying-consistent', label: 'Difficulty Staying Consistent', desc: 'Broken habit loops when schedule gets disrupted' },
  { id: 'priority-confusion', label: 'Not Knowing What to Prioritize', desc: 'Too many tasks, unclear roadmap or direction' },
  { id: 'other', label: 'Other', desc: 'Custom personal hurdles' },
];

// Question 5: AI Assistance
export const AI_HELP_OPTIONS = [
  { id: 'plan-day', label: 'Plan My Day', desc: 'Intelligent daily itinerary structured around focus peaks' },
  { id: 'quests-tasks', label: 'Create Quests & Tasks', desc: 'Break big ambitions into executable daily milestones' },
  { id: 'track-progress', label: 'Track My Progress', desc: 'Real-time telemetry on streaks, hours & XP velocity' },
  { id: 'analyze-habits', label: 'Analyze My Habits', desc: 'Spot consistency gaps and suggest habit stacking' },
  { id: 'manage-goals', label: 'Manage My Goals', desc: 'Long-term goal governance and quarterly roadmaps' },
  { id: 'study-plans', label: 'Create Study Plans', desc: 'Curate learning roadmaps with deep focus intervals' },
  { id: 'analyze-expenses', label: 'Analyze My Expenses', desc: 'Track spending against financial milestone targets' },
  { id: 'ai-recommendations', label: 'Give AI Recommendations', desc: 'Proactive tactical suggestions when energy drops' },
  { id: 'other', label: 'Other', desc: 'Custom AI companion directives' },
];

/**
 * Backward-compatible synthesis helper.
 */
export function generateSystemSynthesis(answers = {}) {
  return {
    archetype: 'Hero Vanguard',
    primaryGoal: answers?.goalLabel || 'Crack GATE',
    lifeAreas: answers?.lifeAreas || ['study', 'fitness', 'habits'],
    statSpecialization: 'All-Rounder',
  };
}
