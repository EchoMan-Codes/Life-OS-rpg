import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Flame,
  CalendarCheck,
  Scroll,
  TrendingUp,
  Zap,
  Target,
  Clock,
  Heart,
  Smile,
  Plus,
  Shield,
  Swords,
  Moon,
  Sparkles,
  Award,
  ChevronRight,
  AlertCircle,
  Coins,
  BookOpen,
  Trophy,
  Bell,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import clsx from 'clsx';

import { Card, ColorCard, WavyHeroScenery, ModeButton } from '@/components/ui';
import { TelemetryHorizonRibbon, RitualSpineDeck, AttributeAstrolabe } from '@/components/dashboard';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/features/auth/hooks';
import { useCharacter } from '@/features/character/hooks';
import { useHabits, useScoreHabit } from '@/features/habits/hooks';
import { useDailies } from '@/features/dailies/hooks';
import { useQuests } from '@/features/quests/hooks';
import { useReflections, useTodayReflection } from '@/features/reflections/hooks';
import { useFocusHistory, useCurrentFocus } from '@/features/focus/hooks';
import { useRestModeStatus } from '@/features/rest-mode/hooks';
import {
  openBattleLogDrawer,
  openAttributesDrawer,
} from '@/features/celebration/celebrationEvents';
import { spring } from '@/lib/motionVariants';

/**
 * Custom light-first/dark-adaptive glass chart tooltip.
 */
function CustomChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 dark:bg-obsidian-900/95 border border-slate-200 dark:border-glass-border rounded-2xl px-3.5 py-2.5 shadow-xl backdrop-blur-xl text-xs text-slate-800 dark:text-ink">
      <p className="text-slate-500 dark:text-ink-muted font-medium mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-500 dark:text-ink-muted capitalize">{entry.name}:</span>
          <span className="font-bold text-slate-900 dark:text-ink font-mono">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Single interactive Habit row with quick-score button.
 */
function DashboardHabitItem({ habit }) {
  const scoreMutation = useScoreHabit(habit.id, habit);
  const isPending = scoreMutation.isPending;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={spring.ios}
      className={clsx(
        'flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all min-h-[52px]',
        'bg-white/85 border-slate-200/90 text-slate-800 hover:border-amber-300 hover:bg-white dark:bg-white/[0.04] dark:border-white/10 dark:hover:border-white/20 dark:hover:bg-white/[0.06] backdrop-blur-md',
        'shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)]'
      )}
    >
      <div className="min-w-0 flex-1 pr-2.5">
        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-ink truncate">{habit.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-mono text-amber-600 dark:text-gold flex items-center gap-0.5 font-bold">
            <Flame size={11} className="fill-current" /> {habit.currentStreak || 0}d streak
          </span>
          {habit.bestStreak > 0 && (
            <span className="text-[10px] font-mono text-slate-400 dark:text-ink-muted">
              (Best: {habit.bestStreak}d)
            </span>
          )}
        </div>
      </div>

      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        onClick={() => !isPending && scoreMutation.mutate('positive')}
        disabled={isPending}
        className={clsx(
          'w-8 h-8 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-700 dark:text-gold',
          'flex items-center justify-center transition-all shrink-0 min-h-[32px] min-w-[32px] shadow-xs',
          isPending && 'opacity-50'
        )}
        title="Score Habit (+)"
      >
        <Plus size={16} />
      </motion.button>
    </motion.div>
  );
}

/**
 * Main RPG Command Center Dashboard
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const { data: character } = useCharacter();
  const { data: habits = [] } = useHabits();
  const { data: dailies = [] } = useDailies();
  const { data: quests = [] } = useQuests();
  const { data: reflections = [] } = useReflections({ range: '7d' });
  const { data: todayReflection } = useTodayReflection();
  const { data: focusSessions = [] } = useFocusHistory({ limit: 50 });
  const { data: activeFocus } = useCurrentFocus();
  const { data: restStatus } = useRestModeStatus();

  // Mobile segmented tab selection: 'actions' | 'overview' | 'analytics' | 'wellness'
  const [mobileTab, setMobileTab] = useState('actions');

  // ── Derived Data ──
  const activeHabits = useMemo(() => {
    return habits.length > 0 ? habits.filter((h) => !h.archivedAt) : [
      { id: 'h1', title: 'Wake Up on Time', currentStreak: 1, bestStreak: 1 },
    ];
  }, [habits]);

  const activeDailies = useMemo(() => {
    return dailies.length > 0 ? dailies.filter((d) => !d.archivedAt) : [
      { id: 'd1', title: 'Morning Hydration & Sunlight', difficulty: 'easy', isCompleteToday: false, currentStreak: 3 },
      { id: 'd2', title: 'Deep Work Sprint (60m)', difficulty: 'medium', isCompleteToday: false, currentStreak: 2 },
    ];
  }, [dailies]);
  const completedTodayCount = activeDailies.filter((d) => d.isCompleteToday).length;
  const dailiesRate = activeDailies.length > 0
    ? Math.round((completedTodayCount / activeDailies.length) * 100)
    : 0;

  const activeQuests = quests.filter((q) => q.status === 'active');
  const primaryQuest = activeQuests[0] || null;

  const totalFocusMinutes = useMemo(() => {
    return focusSessions
      .filter((s) => s.status === 'completed')
      .reduce((sum, s) => sum + (s.durationMinutes || Math.round((s.plannedDurationSeconds || 0) / 60)), 0);
  }, [focusSessions]);

  const bestStreak = useMemo(() => {
    return activeHabits.reduce((max, h) => Math.max(max, h.bestStreak || 0), 0);
  }, [activeHabits]);

  // Determine RPG Class Title based on highest character attribute
  const characterTitle = useMemo(() => {
    if (!character?.attributes) return 'Hero';
    const { strength = 0, intelligence = 0, vitality = 0, willpower = 0, perception = 0 } = character.attributes;
    const maxVal = Math.max(strength, intelligence, vitality, willpower, perception);
    if (strength === maxVal) return 'Iron Vanguard';
    if (intelligence === maxVal) return 'Arcane Scholar';
    if (vitality === maxVal) return 'Immortal Warden';
    if (willpower === maxVal) return 'Astral Sovereign';
    return 'Shadow Pathfinder';
  }, [character?.attributes]);

  // Determine Leading Character Attribute for Modular Status
  const leadingAttribute = useMemo(() => {
    if (!character?.attributes) return { key: 'strength', name: 'Strength', stat: 'STR', color: '#DC2626', val: 5 };
    const { strength = 5, intelligence = 5, vitality = 5, willpower = 5, perception = 5 } = character.attributes;
    const list = [
      { key: 'strength', name: 'Strength', stat: 'STR', color: '#DC2626', val: strength },
      { key: 'intelligence', name: 'Intelligence', stat: 'INT', color: '#38BDF8', val: intelligence },
      { key: 'vitality', name: 'Vitality', stat: 'VIT', color: '#34D399', val: vitality },
      { key: 'willpower', name: 'Willpower', stat: 'WIL', color: '#A78BFA', val: willpower },
      { key: 'perception', name: 'Perception', stat: 'PER', color: '#FBBF24', val: perception },
    ];
    list.sort((a, b) => b.val - a.val);
    return list[0];
  }, [character?.attributes]);

  // Contextual LifeOS Tactical Advisory based on real state
  const tacticalAdvisory = useMemo(() => {
    if (restStatus?.isActive) {
      return {
        text: 'Rest Mode active. Daily penalties paused while you restore vitality.',
        type: 'rest',
        icon: Moon,
        color: 'text-teal-400',
        link: '/reflection',
      };
    }
    if (activeFocus) {
      return {
        text: 'Deep work session in progress. Stay in the flow!',
        type: 'focus',
        icon: Clock,
        color: 'text-mana',
        link: '/focus',
      };
    }
    if (character && character.hp < 30) {
      return {
        text: 'Critical HP warning! Check off positive habits or consider Rest Mode.',
        type: 'warning',
        icon: AlertCircle,
        color: 'text-hp',
        link: '/habits',
      };
    }
    if (character && character.mana < 20) {
      return {
        text: 'Mana is low. Complete a Focus Chamber sprint to regenerate MP.',
        type: 'mana',
        icon: Zap,
        color: 'text-mana',
        link: '/focus',
      };
    }
    if (!todayReflection) {
      return {
        text: 'Evening reflection pending. Check in to record your daily wellness.',
        type: 'reflection',
        icon: Smile,
        color: 'text-gold',
        link: '/reflection',
      };
    }
    if (activeDailies.length > completedTodayCount) {
      const remaining = activeDailies.length - completedTodayCount;
      return {
        text: `${remaining} daily ritual${remaining > 1 ? 's' : ''} left to conquer today.`,
        type: 'daily',
        icon: CalendarCheck,
        color: 'text-emerald-400',
        link: '/dailies',
      };
    }
    return {
      text: 'All daily rituals conquered today! Your hero discipline is unmatched.',
      type: 'success',
      icon: Sparkles,
      color: 'text-gold',
      link: '/quests',
    };
  }, [restStatus, activeFocus, character, todayReflection, activeDailies, completedTodayCount]);

  // ── Chart Data: Weekly Wellness Trend ──
  const wellnessTrendData = useMemo(() => {
    if (!reflections.length) return [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return reflections.slice(-7).map((r) => {
      const d = new Date(r.forDate || r.createdAt);
      return {
        day: days[d.getDay()],
        Mood: r.moodScore || 0,
        Energy: r.energyScore || 0,
        Focus: r.focusScore || 0,
      };
    });
  }, [reflections]);

  // ── Chart Data: Focus Sessions Output ──
  const focusOutputData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekMap = {};
    days.forEach((d) => { weekMap[d] = 0; });

    focusSessions
      .filter((s) => s.status === 'completed')
      .slice(-15)
      .forEach((s) => {
        const d = new Date(s.completedAt || s.createdAt);
        const day = days[d.getDay()];
        weekMap[day] += s.durationMinutes || Math.round((s.plannedDurationSeconds || 0) / 60);
      });

    return days.map((d) => ({ day: d, Minutes: weekMap[d] }));
  }, [focusSessions]);

  // ── Chart Data: Attribute Pentagon ──
  const attributeRadarData = useMemo(() => {
    if (!character?.attributes) return [];
    const a = character.attributes;
    return [
      { attr: 'STR', value: a.strength || 5, full: 'Strength' },
      { attr: 'VIT', value: a.vitality || 5, full: 'Vitality' },
      { attr: 'INT', value: a.intelligence || 5, full: 'Intelligence' },
      { attr: 'WIL', value: a.willpower || 5, full: 'Willpower' },
      { attr: 'PER', value: a.perception || 5, full: 'Perception' },
    ];
  }, [character?.attributes]);

  // Greeting by hour
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const displayName = user?.displayName || 'Rohit';
  const level = character?.level ?? 1;
  const hp = character?.hp ?? 62;
  const maxHp = character?.maxHp ?? 80;
  const mana = character?.mana ?? 30;
  const maxMana = character?.maxMana ?? 50;
  const xp = character?.xp ?? 320;
  const xpForNextLevel = character?.xpForNextLevel ?? 604;
  const gold = character?.gold ?? 145;
  const hpPct = Math.max(0, Math.min(100, Math.round((hp / Math.max(1, maxHp)) * 100)));
  const manaPct = Math.max(0, Math.min(100, Math.round((mana / Math.max(1, maxMana)) * 100)));
  const xpPct = Math.max(0, Math.min(100, Math.round((xp / Math.max(1, xpForNextLevel)) * 100)));
  const rankText = level >= 12 ? 'Top 5%' : level >= 7 ? 'Top 10%' : level >= 3 ? 'Top 20%' : 'Top 50%';

  const { isDark } = useTheme();

  return (
    <motion.div
      className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-16"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.snappy}
    >
      {/* ── 1. Wavy Atmospheric RPG Hero Cockpit (Natural Scrolling, Zero Clipping) ── */}
      <WavyHeroScenery variant="dashboard" className="p-3.5 sm:p-5 md:p-6">
        <div className="flex flex-col gap-3.5 sm:gap-4">
          {/* Top Bar: Player Avatar & Top Navigation Controls */}
          <div className="flex items-center justify-between gap-3">
            {/* Left: Avatar + Identity */}
            <Link
              to="/profile"
              className="flex items-center gap-2.5 sm:gap-3 group -ml-0.5 text-left focus:outline-none"
              title="View Character Profile"
            >
              <div className="relative shrink-0">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={displayName}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-amber-400 shadow-md group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-800 border-2 border-amber-400/80 flex items-center justify-center text-amber-300 font-display font-bold text-sm sm:text-base shadow-md group-hover:scale-105 transition-transform">
                    {displayName?.[0]?.toUpperCase() || 'Ω'}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 bg-obsidian-950 text-amber-300 border border-amber-400/70 rounded-full px-1.5 py-0.2 text-[9px] font-mono font-bold leading-tight shadow">
                  {level}
                </span>
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-sm sm:text-base font-bold font-display text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                  {displayName}
                </span>
                <span className="text-[10px] sm:text-xs font-mono text-slate-500 dark:text-indigo-200/75 font-medium">
                  Lv. {level} • {characterTitle}
                </span>
              </div>
            </Link>

            {/* Right: Action Controls (Battle, Mode Toggle, Bell) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Battle Chronicles */}
              <button
                type="button"
                onClick={openBattleLogDrawer}
                className={clsx(
                  'w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer',
                  isDark
                    ? 'bg-white/10 hover:bg-white/20 border-white/15 text-amber-300'
                    : 'bg-white/80 hover:bg-white border-slate-200/90 text-amber-600 shadow-xs'
                )}
                title="Battle Chronicles"
                aria-label="Battle Chronicles"
              >
                <Swords size={16} />
              </button>

              {/* Mode Toggle Button */}
              <ModeButton compact />

              {/* Attributes / Notification Bell */}
              <button
                type="button"
                onClick={openAttributesDrawer}
                className={clsx(
                  'w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer',
                  isDark
                    ? 'bg-white/10 hover:bg-white/20 border-white/15 text-purple-300'
                    : 'bg-white/80 hover:bg-white border-slate-200/90 text-purple-600 shadow-xs'
                )}
                title="Attributes Radar & Status"
                aria-label="Attributes Radar & Status"
              >
                <Bell size={16} />
              </button>
            </div>
          </div>

          {/* ── Visual Focal Hero: Good Evening / Morning Greeting Banner ── */}
          <div
            className={clsx(
              'p-3.5 sm:p-5 rounded-2xl border transition-all duration-300 backdrop-blur-md relative overflow-hidden',
              isDark
                ? 'bg-black/35 border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.3)]'
                : 'bg-white/75 border-indigo-100/90 shadow-[0_4px_16px_rgba(99,102,241,0.06)]'
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              {/* Left: Glowing Level Crest + Greeting */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                {/* Illuminated Sigil Emblem */}
                <div className="relative shrink-0">
                  <div
                    className={clsx(
                      'w-13 h-13 sm:w-15 sm:h-15 rounded-2xl flex flex-col items-center justify-center border transition-all shadow-md',
                      isDark
                        ? 'bg-gradient-to-br from-amber-500/20 via-purple-600/20 to-indigo-900/40 border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                        : 'bg-gradient-to-br from-amber-100 via-purple-50 to-indigo-50 border-amber-300/60 shadow-[0_0_16px_rgba(245,158,11,0.15)]'
                    )}
                  >
                    <Sparkles
                      size={18}
                      className={isDark ? 'text-amber-300' : 'text-amber-600'}
                    />
                    <span className="text-[10px] font-mono font-bold tracking-tight mt-0.5 text-slate-800 dark:text-amber-300">
                      Lv.{level}
                    </span>
                  </div>
                </div>

                {/* Typography Hierarchy: Greeting & Date */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className={clsx(
                        'text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                        isDark
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                      )}
                    >
                      Hero • Lv. {level}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold font-display tracking-tight leading-tight text-slate-900 dark:text-white truncate">
                    {greeting},{' '}
                    <span
                      className={clsx(
                        'font-black bg-clip-text text-transparent',
                        isDark
                          ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200'
                          : 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600'
                      )}
                    >
                      {displayName}
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-indigo-200/80 mt-0.5">
                    {new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Right: Quick Action Buttons */}
              <div className="flex items-center gap-2 pt-1 sm:pt-0 shrink-0">
                <Link
                  to="/focus"
                  className={clsx(
                    'px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs',
                    isDark
                      ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/25'
                      : 'bg-emerald-50 border-emerald-300/80 text-emerald-800 hover:bg-emerald-100'
                  )}
                >
                  <Clock size={13} />
                  <span>Focus Chamber</span>
                </Link>

                <Link
                  to="/reflection"
                  className={clsx(
                    'px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs',
                    isDark
                      ? 'bg-teal-500/15 border-teal-500/35 text-teal-300 hover:bg-teal-500/25'
                      : 'bg-teal-50 border-teal-300/80 text-teal-800 hover:bg-teal-100'
                  )}
                >
                  <Moon size={13} />
                  <span>Reflect</span>
                </Link>
              </div>
            </div>

            {/* Tactical Advisory Prompt Bar */}
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={clsx(
                    'p-1 rounded-lg border shrink-0',
                    isDark
                      ? 'bg-white/10 border-white/15 text-amber-300'
                      : 'bg-amber-50 border-amber-200 text-amber-600'
                  )}
                >
                  <tacticalAdvisory.icon size={13} />
                </div>
                <span className="text-slate-700 dark:text-white/90 font-medium truncate text-[11px] sm:text-xs">
                  {tacticalAdvisory.text}
                </span>
              </div>
              <Link
                to={tacticalAdvisory.link}
                className={clsx(
                  'text-[11px] sm:text-xs font-semibold flex items-center gap-0.5 shrink-0 transition-colors',
                  isDark
                    ? 'text-amber-300 hover:text-white'
                    : 'text-amber-600 hover:text-amber-800'
                )}
              >
                <span>Act</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>

          {/* Row 2: 3-Pill Lifetime Stats Deck (Coins, Streak, Rank) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            <div
              className={clsx(
                'flex flex-col items-center justify-center py-2 px-2 rounded-2xl border text-center shadow-xs backdrop-blur-md transition-colors',
                isDark
                  ? 'bg-black/35 border-amber-500/30'
                  : 'bg-white/80 border-amber-300/60 shadow-xs'
              )}
            >
              <span
                className={clsx(
                  'text-[10px] sm:text-xs font-mono font-medium flex items-center gap-1',
                  isDark ? 'text-amber-300/80' : 'text-amber-700'
                )}
              >
                <Coins size={12} className={isDark ? 'text-amber-400' : 'text-amber-600'} /> Coins
              </span>
              <span
                className={clsx(
                  'font-mono font-bold text-sm sm:text-base leading-tight mt-0.5',
                  isDark ? 'text-amber-300' : 'text-amber-800'
                )}
              >
                {gold}
              </span>
            </div>

            <div
              className={clsx(
                'flex flex-col items-center justify-center py-2 px-2 rounded-2xl border text-center shadow-xs backdrop-blur-md transition-colors',
                isDark
                  ? 'bg-black/35 border-orange-500/30'
                  : 'bg-white/80 border-orange-300/60 shadow-xs'
              )}
            >
              <span
                className={clsx(
                  'text-[10px] sm:text-xs font-mono font-medium flex items-center gap-1',
                  isDark ? 'text-orange-300/80' : 'text-orange-700'
                )}
              >
                <Flame size={12} className={clsx('fill-current shrink-0', isDark ? 'text-orange-400' : 'text-orange-600')} /> Streak
              </span>
              <span
                className={clsx(
                  'font-mono font-bold text-sm sm:text-base leading-tight mt-0.5',
                  isDark ? 'text-white' : 'text-slate-900'
                )}
              >
                {bestStreak}d
              </span>
            </div>

            <div
              className={clsx(
                'flex flex-col items-center justify-center py-2 px-2 rounded-2xl border text-center shadow-xs backdrop-blur-md transition-colors',
                isDark
                  ? 'bg-black/35 border-purple-500/30'
                  : 'bg-white/80 border-purple-300/60 shadow-xs'
              )}
            >
              <span
                className={clsx(
                  'text-[10px] sm:text-xs font-mono font-medium flex items-center gap-1',
                  isDark ? 'text-purple-300/80' : 'text-purple-700'
                )}
              >
                <Trophy size={12} className={isDark ? 'text-purple-400' : 'text-purple-600'} /> Rank
              </span>
              <span
                className={clsx(
                  'font-mono font-bold text-sm sm:text-base leading-tight mt-0.5',
                  isDark ? 'text-purple-300' : 'text-purple-800'
                )}
              >
                {rankText}
              </span>
            </div>
          </div>

          {/* Row 3: Dual Vitals (HP & MP) */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {/* HP Bar */}
            <div
              className={clsx(
                'px-3 py-2 rounded-2xl border flex flex-col gap-1 backdrop-blur-md transition-colors',
                isDark
                  ? 'bg-black/35 border-rose-500/25'
                  : 'bg-white/80 border-rose-200/80 shadow-xs'
              )}
            >
              <div className="flex items-center justify-between text-[11px] leading-tight font-mono">
                <div className="flex items-center gap-1 font-bold text-rose-500 dark:text-rose-400">
                  <Heart size={12} className="fill-rose-500/40 shrink-0" />
                  <span>HP</span>
                </div>
                <span className="text-slate-800 dark:text-white font-semibold">
                  {hp}<span className="text-slate-400 dark:text-white/50 text-[10px]">/{maxHp}</span>
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-300 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                  style={{ width: `${hpPct}%` }}
                />
              </div>
            </div>

            {/* MP Bar */}
            <div
              className={clsx(
                'px-3 py-2 rounded-2xl border flex flex-col gap-1 backdrop-blur-md transition-colors',
                isDark
                  ? 'bg-black/35 border-sky-500/25'
                  : 'bg-white/80 border-sky-200/80 shadow-xs'
              )}
            >
              <div className="flex items-center justify-between text-[11px] leading-tight font-mono">
                <div className="flex items-center gap-1 font-bold text-sky-600 dark:text-sky-400">
                  <Zap size={12} className="fill-sky-500/40 shrink-0" />
                  <span>MP</span>
                </div>
                <span className="text-slate-800 dark:text-white font-semibold">
                  {mana}<span className="text-slate-400 dark:text-white/50 text-[10px]">/{maxMana}</span>
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-600 to-cyan-400 transition-all duration-300 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                  style={{ width: `${manaPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Row 4: Golden XP Progress Ribbon */}
          <div
            className={clsx(
              'px-3 py-2 rounded-2xl border flex flex-col gap-1 backdrop-blur-md transition-colors',
              isDark
                ? 'bg-black/35 border-amber-500/30'
                : 'bg-white/80 border-amber-300/70 shadow-xs'
            )}
          >
            <div className="flex items-center justify-between text-[11px] font-mono leading-tight">
              <span className="text-amber-600 dark:text-amber-300 font-bold flex items-center gap-1">
                <Sparkles size={12} className="text-amber-500 dark:text-amber-400 shrink-0" /> XP Progress
              </span>
              <span className="text-slate-700 dark:text-white/90">
                {xp} <span className="text-slate-400 dark:text-white/50 text-[10px]">/ {xpForNextLevel} ({xpPct}%)</span>
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 transition-all duration-300 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>

          {/* Row 5: Life Areas Fast Category Pills (Focus, Habit, Study, Quest, Finance) */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-0.5">
            {[
              {
                label: 'Focus',
                icon: Clock,
                to: '/focus',
                color: isDark
                  ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30 hover:bg-emerald-500/25'
                  : 'text-emerald-700 bg-emerald-50 border-emerald-300/80 hover:bg-emerald-100 shadow-xs',
              },
              {
                label: 'Habit',
                icon: Flame,
                to: '/habits',
                color: isDark
                  ? 'text-amber-400 bg-amber-500/15 border-amber-500/30 hover:bg-amber-500/25'
                  : 'text-amber-700 bg-amber-50 border-amber-300/80 hover:bg-amber-100 shadow-xs',
              },
              {
                label: 'Study',
                icon: BookOpen,
                to: '/focus',
                color: isDark
                  ? 'text-purple-300 bg-purple-500/15 border-purple-500/30 hover:bg-purple-500/25'
                  : 'text-purple-700 bg-purple-50 border-purple-300/80 hover:bg-purple-100 shadow-xs',
              },
              {
                label: 'Quest',
                icon: Scroll,
                to: '/quests',
                color: isDark
                  ? 'text-yellow-300 bg-yellow-500/15 border-yellow-500/30 hover:bg-yellow-500/25'
                  : 'text-indigo-700 bg-indigo-50 border-indigo-300/80 hover:bg-indigo-100 shadow-xs',
              },
              {
                label: 'Finance',
                icon: Coins,
                to: '/shop',
                color: isDark
                  ? 'text-teal-300 bg-teal-500/15 border-teal-500/30 hover:bg-teal-500/25'
                  : 'text-teal-700 bg-teal-50 border-teal-300/80 hover:bg-teal-100 shadow-xs',
                hint: 'Phase 6',
              },
            ].map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.label}
                  to={cat.to}
                  className={clsx(
                    'flex flex-col items-center justify-center py-2 px-1 rounded-2xl border transition-all duration-150 active:scale-95 group text-center backdrop-blur-md',
                    cat.color
                  )}
                  title={cat.hint ? `${cat.label} (${cat.hint} expansion)` : cat.label}
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon size={16} />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold tracking-tight mt-0.5 leading-none font-display">
                    {cat.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </WavyHeroScenery>

      {/* ── 2. Progression Horizon Ribbon (Connected Telemetry Strip) ── */}
      <TelemetryHorizonRibbon
        completedTodayCount={completedTodayCount}
        totalDailiesCount={activeDailies.length}
        dailiesRate={dailiesRate}
        activeHabitsCount={activeHabits.length}
        bestStreak={bestStreak}
        activeQuestsCount={activeQuests.length}
        primaryQuestTitle={primaryQuest?.title || ''}
        totalFocusMinutes={totalFocusMinutes}
        activeFocus={activeFocus}
      />

      {/* ── 3. Dedicated Mobile Segmented Switcher (iOS Frosted Glass Capsule) ── */}
      <div className="md:hidden sticky top-0 z-30 -mx-3 px-3 py-2 bg-white/90 dark:bg-obsidian-950/80 backdrop-blur-2xl border-y border-slate-200/80 dark:border-white/10">
        <div className="grid grid-cols-4 gap-1 p-1 rounded-full bg-slate-100/90 dark:bg-obsidian-900/80 border border-slate-200 dark:border-white/10 shadow-inner backdrop-blur-md">
          {[
            { id: 'actions', label: 'Actions', icon: Zap },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'wellness', label: 'Wellness', icon: Smile },
            { id: 'overview', label: 'Character', icon: Shield },
          ].map(({ id, label, icon: Icon }) => {
            const isActive = mobileTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setMobileTab(id)}
                className="relative py-1.5 px-1 rounded-full text-xs font-semibold min-h-[38px] flex items-center justify-center focus:outline-none select-none transition-colors"
              >
                {isActive && (
                  <motion.div
                    layoutId="ios-dashboard-tab-pill"
                    className="absolute inset-0 rounded-full bg-white dark:bg-white/[0.14] border border-slate-300 dark:border-white/20 shadow-xs"
                    transition={spring.capsule}
                  />
                )}
                <motion.div
                  whileTap={{ scale: 0.94 }}
                  className="relative z-10 flex items-center justify-center gap-1"
                >
                  <Icon
                    size={13}
                    className={clsx(
                      'transition-colors',
                      isActive ? 'text-indigo-600 dark:text-attr-perception' : 'text-slate-500 dark:text-ink-muted'
                    )}
                  />
                  <span
                    className={clsx(
                      'transition-colors text-xs',
                      isActive ? 'text-slate-900 dark:text-ink font-bold' : 'text-slate-500 dark:text-ink-muted'
                    )}
                  >
                    {label}
                  </span>
                </motion.div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Main Body: Adaptive Grid (Desktop: Full Cockpit / Mobile: Tab Filtered) ── */}
      <div className="space-y-5">
        {/* TAB 1: ACTIONS (Today's Dailies Waypoint Spine & Action Deck) */}
        <div
          className={clsx(
            'space-y-5',
            mobileTab !== 'actions' && 'hidden md:block'
          )}
        >
          {/* Unique Connected Ritual Waypoint Spine Deck */}
          <RitualSpineDeck
            activeDailies={activeDailies}
            completedTodayCount={completedTodayCount}
            dailiesRate={dailiesRate}
            totalFocusMinutes={totalFocusMinutes}
          />

          {/* Secondary Action Deck: Context Chamber Tiles (7 cols) & Habit Scorer / Quest Spotlight (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* 4 Modular Context Tiles (7 cols on desktop) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Tile 1: Deep Focus Chamber */}
              <ColorCard
                color="indigo"
                icon={Clock}
                title="Deep Focus"
                value={activeFocus ? 'In Flow' : `${totalFocusMinutes}m`}
                subtitle={activeFocus ? 'Deep work sprint in progress' : 'Regenerate Mana with cognitive sprints'}
                badge={activeFocus ? 'Active' : 'Ready'}
                actionTo="/focus"
                actionText="Launch"
              />

              {/* Tile 2: Streak Shield & Armor */}
              <ColorCard
                color="peach"
                icon={Flame}
                title="Streak Shield"
                value={`${bestStreak}d`}
                subtitle={`${activeHabits.length} habits maintaining continuous discipline`}
                badge="Momentum"
                actionTo="/habits"
                actionText="Score"
              />

              {/* Tile 3: Rest & Harmony */}
              <ColorCard
                color="teal"
                icon={Moon}
                title="Rest & Harmony"
                value={restStatus?.isActive ? 'Resting' : (todayReflection ? '5/5 Mind' : 'Standby')}
                subtitle={todayReflection ? 'Daily wellness review recorded' : 'Evening reflection protects against burnout'}
                badge={restStatus?.isActive ? 'Active' : 'Ready'}
                actionTo="/reflection"
                actionText="Reflect"
              />

              {/* Tile 4: Leading Attribute */}
              <ColorCard
                color="rose"
                icon={Sparkles}
                title="Lead Attribute"
                value={`${leadingAttribute.val} ${leadingAttribute.stat}`}
                subtitle={`${leadingAttribute.name} leads your hero specialization`}
                badge={character?.unallocatedPoints > 0 ? `+${character.unallocatedPoints} SP` : 'Optimal'}
                actionText="Inspect"
                onAction={openAttributesDrawer}
              />
            </div>

            {/* Quick Habits & Active Quest Spotlight (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Quick Habits Card */}
              <Card className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 border-b border-slate-200/80 dark:border-glass-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-gold">
                      <Flame size={17} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold font-display text-slate-900 dark:text-ink">Habit Quick-Scorer</h3>
                      <p className="text-[11px] text-slate-500 dark:text-ink-muted">Tap (+) to score positive habits</p>
                    </div>
                  </div>
                  <Link to="/habits" className="text-xs text-amber-600 dark:text-gold hover:underline font-semibold">
                    All
                  </Link>
                </div>

                {activeHabits.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 dark:text-ink-muted text-xs">
                    <Flame size={24} className="mx-auto mb-1 text-amber-500 opacity-50" />
                    <p>No habits tracked yet</p>
                    <Link to="/habits" className="text-amber-600 dark:text-gold underline mt-1 inline-block">
                      Create habit
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeHabits.slice(0, 3).map((h) => (
                      <DashboardHabitItem key={h.id} habit={h} />
                    ))}
                  </div>
                )}
              </Card>

              {/* Active Quest Spotlight */}
              <Card className="p-4 sm:p-5 bg-gradient-to-br from-violet-50/80 to-indigo-50/60 border-violet-200/80 dark:from-obsidian-800 dark:to-obsidian-900 dark:border-glass-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-600 dark:text-attr-perception">
                      <Scroll size={16} />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-violet-700 dark:text-attr-perception font-bold">
                        Priority Quest
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-ink truncate max-w-[200px]">
                        {primaryQuest ? primaryQuest.title : 'No Active Quest'}
                      </h4>
                    </div>
                  </div>
                  <Link to="/quests" className="text-xs text-violet-600 dark:text-attr-perception hover:underline font-semibold">
                    Board
                  </Link>
                </div>

                {primaryQuest ? (
                  <div>
                    <p className="text-xs text-slate-600 dark:text-ink-muted line-clamp-2 mb-3">
                      {primaryQuest.description || 'Advance your hero objectives by completing subtasks.'}
                    </p>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-ink-muted mb-1">
                      <span>Progress</span>
                      <span>
                        {primaryQuest.items?.filter((i) => i.isCompleted).length || 0} /{' '}
                        {primaryQuest.items?.length || 0} Tasks
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200 dark:bg-obsidian-700 overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full"
                        style={{
                          width: `${
                            primaryQuest.items?.length
                              ? Math.round(
                                  ((primaryQuest.items.filter((i) => i.isCompleted).length) /
                                    primaryQuest.items.length) *
                                    100
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-ink-muted">
                    Accept an epic quest from your Quest Log to earn rare loot and XP bonuses.
                  </p>
                )}
              </Card>
            </div>
          </div>
        </div>

        {/* TAB 2: ANALYTICS (Charts & Deep Output) */}
        <div
          className={clsx(
            'grid grid-cols-1 lg:grid-cols-12 gap-5',
            mobileTab !== 'analytics' && 'hidden md:grid'
          )}
        >
          {/* Weekly Focus Output Bar Chart (6 cols) */}
          <div className="lg:col-span-6">
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 border-b border-glass-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-mana/15 border border-mana/30 flex items-center justify-center text-mana">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display text-ink">Deep Work Output</h3>
                    <p className="text-[11px] text-ink-muted">Focus Chamber minutes logged per day</p>
                  </div>
                </div>
                <Link to="/focus" className="text-xs text-mana hover:underline font-semibold">
                  Launch Chamber
                </Link>
              </div>

              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={focusOutputData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis
                      dataKey="day"
                      tick={{ fill: '#9AA0AE', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#9AA0AE', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Bar
                      dataKey="Minutes"
                      fill="#38BDF8"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Character Attribute Radar (6 cols) */}
          <div className="lg:col-span-6">
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 border-b border-glass-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-attr-willpower/15 border border-attr-willpower/30 flex items-center justify-center text-attr-willpower">
                    <Target size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display text-ink">Attribute Matrix</h3>
                    <p className="text-[11px] text-ink-muted">5-axis character attribute distribution</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openAttributesDrawer}
                  className="text-xs text-attr-willpower hover:underline font-semibold"
                >
                  Allocate Points
                </button>
              </div>

              <div className="h-[210px] w-full flex items-center justify-center">
                {attributeRadarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={attributeRadarData} margin={{ top: 5, right: 15, left: 15, bottom: 5 }}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis
                        dataKey="attr"
                        tick={{ fill: '#E5E7EB', fontSize: 11, fontWeight: 600 }}
                      />
                      <Radar
                        dataKey="value"
                        name="Stat Value"
                        stroke="#A78BFA"
                        fill="#A78BFA"
                        fillOpacity={0.25}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-ink-muted">No attributes found</div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* TAB 3: WELLNESS (Reflections & Burnout Protection) */}
        <div
          className={clsx(
            'grid grid-cols-1 lg:grid-cols-12 gap-5',
            mobileTab !== 'wellness' && 'hidden md:grid'
          )}
        >
          {/* 7-Day Wellness Trend Area Chart (8 cols) */}
          <div className="lg:col-span-8">
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 border-b border-glass-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300">
                    <Smile size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display text-ink">Wellness & Harmony</h3>
                    <p className="text-[11px] text-ink-muted">Mood, Energy, and Focus trends (1-5)</p>
                  </div>
                </div>
                <Link to="/reflection" className="text-xs text-teal-300 hover:underline font-semibold">
                  Evening Check-In
                </Link>
              </div>

              {wellnessTrendData.length > 0 ? (
                <div className="h-[210px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={wellnessTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <XAxis
                        dataKey="day"
                        tick={{ fill: '#9AA0AE', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[1, 5]}
                        tick={{ fill: '#9AA0AE', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={24}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="Mood"
                        stroke="#FBBF24"
                        fill="#FBBF2420"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="Energy"
                        stroke="#34D399"
                        fill="#34D39920"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="Focus"
                        stroke="#38BDF8"
                        fill="#38BDF820"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[210px] text-ink-muted text-xs">
                  <Smile size={28} className="mb-2 text-teal-400 opacity-40" />
                  <p className="font-semibold text-ink">No reflection entries yet</p>
                  <Link to="/reflection" className="text-teal-400 underline mt-1">
                    Log today’s reflection
                  </Link>
                </div>
              )}
            </Card>
          </div>

          {/* Evening Reflection Quick Status & Rest Mode (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <Card className="p-4 sm:p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300">
                  <Moon size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-ink">Today’s Reflection</h4>
                  <p className="text-[11px] text-ink-muted">Mindful decompression</p>
                </div>
              </div>

              {todayReflection ? (
                <div className="p-3 rounded-xl bg-obsidian-900/60 border border-teal-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-ink-muted">Blended Score</span>
                    <span className="font-bold text-teal-300">{todayReflection.blendedScore} / 5</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center text-[10px] pt-1 border-t border-glass-border">
                    <div>
                      <span className="text-ink-muted block">Mood</span>
                      <strong className="text-gold font-mono">{todayReflection.moodScore}</strong>
                    </div>
                    <div>
                      <span className="text-ink-muted block">Energy</span>
                      <strong className="text-emerald-400 font-mono">{todayReflection.energyScore}</strong>
                    </div>
                    <div>
                      <span className="text-ink-muted block">Focus</span>
                      <strong className="text-mana font-mono">{todayReflection.focusScore}</strong>
                    </div>
                  </div>
                  {todayReflection.note && (
                    <p className="text-[11px] text-ink-muted italic line-clamp-2 pt-1 border-t border-glass-border">
                      "{todayReflection.note}"
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-ink-muted mb-3">
                    Reflect on your day to track energy and protect against burnout.
                  </p>
                  <Link
                    to="/reflection"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600/30 hover:bg-teal-600/40 text-teal-200 border border-teal-500/40 text-xs font-bold transition-all min-h-[40px] w-full"
                  >
                    <Moon size={14} />
                    <span>Open Evening Reflection</span>
                  </Link>
                </div>
              )}
            </Card>

            {/* Rest Mode Indicator Card */}
            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-teal-400" />
                  <span className="text-xs font-bold text-ink uppercase tracking-wider">
                    Rest Mode Shield
                  </span>
                </div>
                <span
                  className={clsx(
                    'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full',
                    restStatus?.isActive
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                      : 'bg-obsidian-700 text-ink-muted'
                  )}
                >
                  {restStatus?.isActive ? 'ACTIVE' : 'STANDBY'}
                </span>
              </div>
              <p className="text-[11px] text-ink-muted mb-3">
                {restStatus?.isActive
                  ? 'HP penalties for missed dailies are paused while you recover.'
                  : 'Pause daily reset penalties if sick, traveling, or needing recovery.'}
              </p>
              <Link
                to="/reflection"
                className="text-xs text-teal-400 hover:underline font-semibold flex items-center gap-1"
              >
                <span>{restStatus?.isActive ? 'Manage Shield' : 'View Anti-Burnout Shield'}</span>
                <ChevronRight size={13} />
              </Link>
            </Card>
          </div>
        </div>

        {/* TAB 4: OVERVIEW / CHARACTER (Full Character Details & Equipment) */}
        <div
          className={clsx(
            'grid grid-cols-1 lg:grid-cols-12 gap-5',
            mobileTab !== 'overview' && 'hidden md:grid'
          )}
        >
          {/* Character Resonance Astrolabe (12 cols) */}
          <div className="lg:col-span-12">
            <AttributeAstrolabe character={character} />
          </div>

          {/* Character Stats & Attributes Breakdown (12 cols) */}
          <div className="lg:col-span-12">
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-5 border-b border-glass-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
                    <Shield size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display text-ink">Hero Progression Dossier</h3>
                    <p className="text-[11px] text-ink-muted">Complete stats, vitals, and attribute allocations</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openAttributesDrawer}
                  className="px-3 py-1.5 rounded-lg bg-gold/15 hover:bg-gold/25 text-gold border border-gold/40 text-xs font-semibold transition-all min-h-[36px]"
                >
                  Edit Attributes
                </button>
              </div>

              {character ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Vital Statistics */}
                  <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-obsidian-900/60 border border-slate-200/80 dark:border-glass-border space-y-3 shadow-xs">
                    <div className="text-xs font-bold text-slate-900 dark:text-ink uppercase tracking-wider">Vitals</div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500 dark:text-ink-muted flex items-center gap-1">
                          <Heart size={12} className="text-rose-500 dark:text-hp" /> HP
                        </span>
                        <span className="text-slate-900 dark:text-ink font-mono font-bold">{character.hp} / {character.maxHp}</span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-obsidian-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 dark:bg-hp rounded-full"
                          style={{ width: `${Math.min(100, (character.hp / character.maxHp) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500 dark:text-ink-muted flex items-center gap-1">
                          <Zap size={12} className="text-sky-500 dark:text-mana" /> Mana
                        </span>
                        <span className="text-slate-900 dark:text-ink font-mono font-bold">{character.mana} / {character.maxMana}</span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-obsidian-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500 dark:bg-mana rounded-full"
                          style={{ width: `${Math.min(100, (character.mana / character.maxMana) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500 dark:text-ink-muted flex items-center gap-1">
                          <Flame size={12} className="text-amber-500 dark:text-xp" /> XP Progress
                        </span>
                        <span className="text-slate-900 dark:text-ink font-mono font-bold">{character.xp} / {character.xpForNextLevel}</span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-obsidian-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 dark:from-xp dark:to-gold rounded-full"
                          style={{ width: `${Math.min(100, (character.xp / character.xpForNextLevel) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Attributes Matrix */}
                  <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-obsidian-900/60 border border-slate-200/80 dark:border-glass-border space-y-2 shadow-xs">
                    <div className="text-xs font-bold text-slate-900 dark:text-ink uppercase tracking-wider mb-2">5 Attributes</div>
                    {character.attributes && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-obsidian-800/80 border border-slate-200/70 dark:border-glass-border flex justify-between">
                          <span className="text-slate-500 dark:text-ink-muted">Strength:</span>
                          <strong className="text-rose-600 dark:text-hp font-mono">{character.attributes.strength || 5}</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-obsidian-800/80 border border-slate-200/70 dark:border-glass-border flex justify-between">
                          <span className="text-slate-500 dark:text-ink-muted">Vitality:</span>
                          <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{character.attributes.vitality || 5}</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-obsidian-800/80 border border-slate-200/70 dark:border-glass-border flex justify-between">
                          <span className="text-slate-500 dark:text-ink-muted">Intelligence:</span>
                          <strong className="text-sky-600 dark:text-attr-intelligence font-mono">{character.attributes.intelligence || 5}</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-obsidian-800/80 border border-slate-200/70 dark:border-glass-border flex justify-between">
                          <span className="text-slate-500 dark:text-ink-muted">Willpower:</span>
                          <strong className="text-violet-600 dark:text-attr-willpower font-mono">{character.attributes.willpower || 5}</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-obsidian-800/80 border border-slate-200/70 dark:border-glass-border flex justify-between col-span-2">
                          <span className="text-slate-500 dark:text-ink-muted">Perception:</span>
                          <strong className="text-amber-600 dark:text-gold font-mono">{character.attributes.perception || 5}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vault & Rewards */}
                  <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-obsidian-900/60 border border-slate-200/80 dark:border-glass-border flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-ink uppercase tracking-wider mb-3">Treasury</div>
                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between mb-3">
                        <span className="text-xs text-slate-500 dark:text-ink-muted">Current Gold</span>
                        <span className="text-xl font-bold font-mono text-amber-600 dark:text-gold flex items-center gap-1.5">
                          <Award size={18} />
                          {character.gold?.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                    <Link
                      to="/shop"
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-gold border border-amber-500/40 text-xs font-bold text-center block transition-all min-h-[40px]"
                    >
                      Visit Rewards Shop
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-ink-muted">Loading hero dossier...</div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
