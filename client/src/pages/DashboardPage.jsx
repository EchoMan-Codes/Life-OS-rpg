import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  CalendarCheck,
  Scroll,
  TrendingUp,
  Activity,
  Zap,
  Target,
  Clock,
  Brain,
  Heart,
  Smile,
  CheckCircle2,
  Circle,
  Plus,
  ArrowRight,
  Shield,
  Swords,
  Moon,
  Sparkles,
  Award,
  ChevronRight,
  AlertCircle,
  Check,
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

import { Card } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks';
import { useCharacter } from '@/features/character/hooks';
import { useHabits, useScoreHabit } from '@/features/habits/hooks';
import { useDailies, useCompleteDaily } from '@/features/dailies/hooks';
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
 * Custom dark glass chart tooltip.
 */
function CustomChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-obsidian-900/95 border border-glass-border rounded-xl px-3 py-2 shadow-2xl backdrop-blur-xl text-xs">
      <p className="text-ink-muted font-medium mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-ink-muted capitalize">{entry.name}:</span>
          <span className="font-bold text-ink font-mono">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Single interactive Daily row for the Dashboard Action Deck.
 */
function DashboardDailyItem({ daily }) {
  const completeMutation = useCompleteDaily(daily.id, daily);
  const isPending = completeMutation.isPending;

  const handleToggle = () => {
    if (!daily.isCompleteToday && !isPending) {
      completeMutation.mutate();
    }
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={spring.ios}
      onClick={handleToggle}
      className={clsx(
        'group flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer min-h-[52px]',
        'backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)]',
        daily.isCompleteToday
          ? 'bg-white/[0.02] border-white/5 opacity-60'
          : 'bg-white/[0.04] border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
      )}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <motion.button
          type="button"
          whileTap={{ scale: 0.86 }}
          disabled={daily.isCompleteToday || isPending}
          className={clsx(
            'w-7 h-7 rounded-xl border flex items-center justify-center transition-all shrink-0',
            daily.isCompleteToday
              ? 'bg-emerald-500/25 border-emerald-500/60 text-emerald-400 shadow-sm'
              : 'border-white/20 bg-white/[0.04] group-hover:border-attr-perception text-transparent'
          )}
        >
          {daily.isCompleteToday ? (
            <Check size={14} className="stroke-[3]" />
          ) : (
            <Circle size={10} className="group-hover:text-attr-perception/40" />
          )}
        </motion.button>
        <div className="min-w-0">
          <p
            className={clsx(
              'text-xs sm:text-sm font-medium text-ink truncate transition-all',
              daily.isCompleteToday && 'line-through text-ink-muted'
            )}
          >
            {daily.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={clsx(
                'text-[9px] sm:text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border',
                daily.difficulty === 'hard'
                  ? 'bg-hp/15 border-hp/30 text-hp'
                  : daily.difficulty === 'medium'
                  ? 'bg-gold/15 border-gold/30 text-gold'
                  : 'bg-attr-perception/15 border-attr-perception/30 text-attr-perception'
              )}
            >
              {daily.difficulty || 'easy'}
            </span>
            {daily.currentStreak > 0 && (
              <span className="text-[10px] text-gold font-mono flex items-center gap-0.5">
                <Flame size={11} className="fill-current" /> {daily.currentStreak}d streak
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="text-right shrink-0 pl-2">
        {daily.isCompleteToday ? (
          <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 font-mono">
            <CheckCircle2 size={13} /> Conquered
          </span>
        ) : (
          <span className="text-[11px] text-ink-muted group-hover:text-attr-perception transition-colors font-mono">
            +XP
          </span>
        )}
      </div>
    </motion.div>
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
        'bg-white/[0.04] border-white/10 hover:border-white/20 hover:bg-white/[0.06] backdrop-blur-md',
        'shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)]'
      )}
    >
      <div className="min-w-0 flex-1 pr-2.5">
        <p className="text-xs sm:text-sm font-medium text-ink truncate">{habit.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-mono text-gold flex items-center gap-0.5">
            <Flame size={11} className="fill-current" /> {habit.currentStreak || 0}d streak
          </span>
          {habit.bestStreak > 0 && (
            <span className="text-[10px] font-mono text-ink-muted">
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
          'w-8 h-8 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/40 text-gold',
          'flex items-center justify-center transition-all shrink-0 min-h-[32px] min-w-[32px] shadow-sm',
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
 * High-density Glance Metric Card with compact mobile styling and iOS glass.
 */
function GlanceMetricCard({ icon: Icon, label, value, subtext, color, badge, onClick }) {
  return (
    <motion.div
      whileTap={onClick ? { scale: 0.96 } : undefined}
      transition={spring.ios}
      onClick={onClick}
      className={clsx(
        'p-3.5 sm:p-4 rounded-3xl bg-obsidian-900/60 border border-white/10 backdrop-blur-2xl',
        'shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.1)]',
        'flex flex-col justify-between transition-all min-w-0',
        onClick && 'cursor-pointer hover:border-white/20 hover:bg-white/[0.04]'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
          style={{ backgroundColor: `${color}18`, border: `1px solid ${color}35` }}
        >
          <Icon size={17} style={{ color }} />
        </div>
        {badge && (
          <span
            className="text-[9px] sm:text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border"
            style={{ backgroundColor: `${color}15`, borderColor: `${color}35`, color }}
          >
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="text-xl sm:text-2xl font-bold font-display text-ink tracking-tight leading-tight">
          {value}
        </p>
        <p className="text-[11px] sm:text-xs text-ink-muted truncate font-medium mt-0.5">{label}</p>
        {subtext && <p className="text-[10px] sm:text-[11px] text-ink-muted/80 truncate mt-0.5 font-mono">{subtext}</p>}
      </div>
    </motion.div>
  );
}

/**
 * Main RPG Command Center Dashboard
 */
export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
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
  const activeHabits = habits.filter((h) => !h.archivedAt);
  const activeDailies = dailies.filter((d) => !d.archivedAt);
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

  const displayName = user?.displayName || 'Hero';

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 py-8">
        <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-mana/15 border border-mana/30 mx-auto flex items-center justify-center text-mana shadow-[0_0_30px_rgba(99,102,241,0.2)]">
            <Sparkles size={28} />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-mana font-semibold">
              LifeOS Operating System
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              Calibrate Your Sanctum
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Step into a unified personal operating system. Track habits, complete daily rituals, engage in deep focus sprints, and level up your character progression.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/onboarding"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-ink text-obsidian font-semibold text-sm hover:bg-ink/90 transition-all shadow-lg min-h-[44px]"
            >
              <span>Initialize LifeOS</span>
              <ArrowRight size={15} />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-ink font-semibold text-sm transition-all min-h-[44px]"
            >
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-16"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.snappy}
    >
      {/* ── 1. Hero Cockpit & RPG Tactical Header ── */}
      <section className="relative rounded-3xl p-4 sm:p-7 bg-gradient-to-br from-obsidian-900/85 via-obsidian-900/65 to-obsidian-800/75 border border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-2xl overflow-hidden">
        {/* Ambient atmospheric glows */}
        <div className="absolute -top-24 right-10 w-72 h-72 bg-attr-perception/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-10 w-72 h-72 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5">
          {/* Hero Identity */}
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <div className="relative shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-gold/50 shadow-lg"
                />
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-gold/20 to-obsidian-800 border-2 border-gold/40 flex items-center justify-center text-gold font-display font-extrabold text-xl sm:text-2xl shadow-lg">
                  Ω
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-obsidian-950 text-gold border border-gold/60 rounded-full px-2 py-0.2 text-[9px] sm:text-[10px] font-mono font-bold shadow">
                Lv.{character?.level || 1}
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-[11px] sm:text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">
                  {characterTitle}
                </span>
                {bestStreak > 0 && (
                  <span className="text-[11px] sm:text-xs font-mono px-2 py-0.5 rounded-full bg-hp/15 text-hp border border-hp/30 flex items-center gap-1">
                    <Flame size={12} className="fill-current" /> {bestStreak}d streak
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-3xl font-extrabold font-display text-ink tracking-tight mt-1 truncate">
                {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-amber-200 to-attr-perception">{displayName}</span>
              </h1>
              <p className="text-[11px] sm:text-xs text-ink-muted font-mono mt-0.5">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Quick Action Dock */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <Link
              to="/focus"
              className={clsx(
                'flex items-center gap-1.5 sm:gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm min-h-[42px] active:scale-95',
                activeFocus
                  ? 'bg-mana text-obsidian-950 shadow-mana/30 animate-pulse'
                  : 'bg-mana/15 hover:bg-mana/25 text-mana border border-mana/40 backdrop-blur-md'
              )}
            >
              <Clock size={15} />
              <span>{activeFocus ? 'Active Focus' : 'Focus Chamber'}</span>
            </Link>

            <Link
              to="/reflection"
              className="flex items-center gap-1.5 sm:gap-2 px-3.5 py-2.5 rounded-2xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/40 text-xs font-bold transition-all min-h-[42px] backdrop-blur-md active:scale-95"
            >
              <Moon size={15} />
              <span>{todayReflection ? 'Reflection' : 'Reflect'}</span>
            </Link>

            <button
              type="button"
              onClick={openBattleLogDrawer}
              className="flex items-center gap-1.5 sm:gap-2 px-3.5 py-2.5 rounded-2xl bg-gold/15 hover:bg-gold/25 text-gold border border-gold/40 text-xs font-bold transition-all min-h-[42px] backdrop-blur-md active:scale-95"
              title="Battle Chronicles"
            >
              <Swords size={15} />
              <span className="hidden sm:inline">Chronicles</span>
            </button>
          </div>
        </div>

        {/* Tactical Advisory Pill */}
        <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className={clsx('p-1.5 rounded-xl bg-obsidian-950/70 border border-white/10 shrink-0 shadow-inner', tacticalAdvisory.color)}>
              <tacticalAdvisory.icon size={14} />
            </div>
            <span className="text-ink font-medium truncate text-[11px] sm:text-xs">{tacticalAdvisory.text}</span>
          </div>
          <Link
            to={tacticalAdvisory.link}
            className="text-[11px] sm:text-xs text-ink-muted hover:text-ink flex items-center gap-0.5 shrink-0 font-medium transition-colors"
          >
            <span>Act</span>
            <ChevronRight size={13} />
          </Link>
        </div>
      </section>

      {/* ── 2. Unified Glance Metric Strip ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <GlanceMetricCard
          icon={CalendarCheck}
          label="Dailies Due"
          value={`${completedTodayCount}/${activeDailies.length}`}
          subtext={`${dailiesRate}% conquered`}
          badge={dailiesRate === 100 ? 'All Clear' : `${activeDailies.length - completedTodayCount} left`}
          color="#34D399"
        />
        <GlanceMetricCard
          icon={Flame}
          label="Habits Tracked"
          value={activeHabits.length}
          subtext={bestStreak > 0 ? `Best: ${bestStreak}d` : 'Build a ritual'}
          badge={activeHabits.length > 0 ? 'Active' : 'Setup'}
          color="#F59E0B"
        />
        <GlanceMetricCard
          icon={Scroll}
          label="Active Quests"
          value={activeQuests.length}
          subtext={primaryQuest ? primaryQuest.title : 'Ready for duty'}
          badge={activeQuests.length > 0 ? `${activeQuests.length} live` : 'None'}
          color="#A78BFA"
        />
        <GlanceMetricCard
          icon={Clock}
          label="Deep Focus"
          value={`${totalFocusMinutes}m`}
          subtext={`${focusSessions.filter((s) => s.status === 'completed').length} sessions logged`}
          badge={`+${Math.round(totalFocusMinutes * 1.5)} MP`}
          color="#38BDF8"
        />
      </section>

      {/* ── 3. Dedicated Mobile Segmented Switcher (iOS Frosted Glass Capsule) ── */}
      <div className="md:hidden sticky top-16 z-30 -mx-3 px-3 py-2 bg-obsidian-950/80 backdrop-blur-2xl border-y border-white/10">
        <div className="grid grid-cols-4 gap-1 p-1 rounded-full bg-obsidian-900/80 border border-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] backdrop-blur-md">
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
                    className="absolute inset-0 rounded-full bg-white/[0.14] border border-white/20 shadow-sm"
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
                      isActive ? 'text-attr-perception' : 'text-ink-muted'
                    )}
                  />
                  <span
                    className={clsx(
                      'transition-colors',
                      isActive ? 'text-ink font-bold' : 'text-ink-muted'
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
        {/* TAB 1: ACTIONS (Today's Dailies Checklist & Quick Habit Scorer) */}
        <div
          className={clsx(
            'grid grid-cols-1 lg:grid-cols-12 gap-5',
            mobileTab !== 'actions' && 'hidden md:grid'
          )}
        >
          {/* Today's Dailies Command Checklist (7 cols) */}
          <div className="lg:col-span-7">
            <Card className="p-4 sm:p-6 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-glass-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <CalendarCheck size={18} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold font-display text-ink">
                        Today’s Dailies Checklist
                      </h2>
                      <p className="text-[11px] text-ink-muted">
                        One-click conquest right from the cockpit
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/dailies"
                    className="text-xs text-attr-perception hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>Manage</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>

                {activeDailies.length === 0 ? (
                  <div className="py-10 text-center text-ink-muted text-xs">
                    <CalendarCheck size={28} className="mx-auto mb-2 opacity-40 text-emerald-400" />
                    <p className="font-semibold text-ink">No daily rituals for today</p>
                    <Link to="/dailies" className="text-emerald-400 underline mt-1 inline-block">
                      + Add your first daily
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeDailies.map((daily) => (
                      <DashboardDailyItem key={daily.id} daily={daily} />
                    ))}
                  </div>
                )}
              </div>

              {/* Progress Footer */}
              {activeDailies.length > 0 && (
                <div className="pt-3.5 mt-3.5 border-t border-glass-border">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-ink-muted font-medium">Daily Ritual Completion</span>
                    <span className="font-mono font-bold text-ink">{dailiesRate}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-obsidian-700 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${dailiesRate}%` }}
                      transition={spring.snappy}
                    />
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Quick Habits & Active Quest Spotlight (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Quick Habits Card */}
            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3 border-b border-glass-border pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
                    <Flame size={17} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-display text-ink">Habit Quick-Scorer</h3>
                    <p className="text-[11px] text-ink-muted">Tap (+) to score positive habits</p>
                  </div>
                </div>
                <Link to="/habits" className="text-xs text-gold hover:underline font-semibold">
                  All
                </Link>
              </div>

              {activeHabits.length === 0 ? (
                <div className="py-6 text-center text-ink-muted text-xs">
                  <Flame size={24} className="mx-auto mb-1 text-gold opacity-50" />
                  <p>No habits tracked yet</p>
                  <Link to="/habits" className="text-gold underline mt-1 inline-block">
                    Create habit
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeHabits.slice(0, 4).map((h) => (
                    <DashboardHabitItem key={h.id} habit={h} />
                  ))}
                </div>
              )}
            </Card>

            {/* Active Quest Spotlight */}
            <Card className="p-4 sm:p-5 bg-gradient-to-br from-obsidian-800 to-obsidian-900 border-glass-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-attr-perception/15 border border-attr-perception/30 flex items-center justify-center text-attr-perception">
                    <Scroll size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-attr-perception font-bold">
                      Priority Quest
                    </span>
                    <h4 className="text-sm font-bold text-ink truncate max-w-[200px]">
                      {primaryQuest ? primaryQuest.title : 'No Active Quest'}
                    </h4>
                  </div>
                </div>
                <Link to="/quests" className="text-xs text-attr-perception hover:underline font-semibold">
                  Board
                </Link>
              </div>

              {primaryQuest ? (
                <div>
                  <p className="text-xs text-ink-muted line-clamp-2 mb-3">
                    {primaryQuest.description || 'Advance your hero objectives by completing subtasks.'}
                  </p>
                  <div className="flex items-center justify-between text-xs font-mono text-ink-muted mb-1">
                    <span>Progress</span>
                    <span>
                      {primaryQuest.items?.filter((i) => i.isCompleted).length || 0} /{' '}
                      {primaryQuest.items?.length || 0} Tasks
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-obsidian-700 overflow-hidden">
                    <div
                      className="h-full bg-attr-perception rounded-full"
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
                <p className="text-xs text-ink-muted">
                  Accept an epic quest from your Quest Log to earn rare loot and XP bonuses.
                </p>
              )}
            </Card>
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
                  <div className="p-3.5 rounded-2xl bg-obsidian-900/60 border border-glass-border space-y-3">
                    <div className="text-xs font-bold text-ink uppercase tracking-wider">Vitals</div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-ink-muted flex items-center gap-1">
                          <Heart size={12} className="text-hp" /> HP
                        </span>
                        <span className="text-ink font-mono font-bold">{character.hp} / {character.maxHp}</span>
                      </div>
                      <div className="h-2 bg-obsidian-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-hp rounded-full"
                          style={{ width: `${Math.min(100, (character.hp / character.maxHp) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-ink-muted flex items-center gap-1">
                          <Zap size={12} className="text-mana" /> Mana
                        </span>
                        <span className="text-ink font-mono font-bold">{character.mana} / {character.maxMana}</span>
                      </div>
                      <div className="h-2 bg-obsidian-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-mana rounded-full"
                          style={{ width: `${Math.min(100, (character.mana / character.maxMana) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-ink-muted flex items-center gap-1">
                          <Flame size={12} className="text-xp" /> XP Progress
                        </span>
                        <span className="text-ink font-mono font-bold">{character.xp} / {character.xpForNextLevel}</span>
                      </div>
                      <div className="h-2 bg-obsidian-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-xp to-gold rounded-full"
                          style={{ width: `${Math.min(100, (character.xp / character.xpForNextLevel) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Attributes Matrix */}
                  <div className="p-3.5 rounded-2xl bg-obsidian-900/60 border border-glass-border space-y-2">
                    <div className="text-xs font-bold text-ink uppercase tracking-wider mb-2">5 Attributes</div>
                    {character.attributes && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-obsidian-800/80 border border-glass-border flex justify-between">
                          <span className="text-ink-muted">Strength:</span>
                          <strong className="text-hp font-mono">{character.attributes.strength || 5}</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-obsidian-800/80 border border-glass-border flex justify-between">
                          <span className="text-ink-muted">Vitality:</span>
                          <strong className="text-emerald-400 font-mono">{character.attributes.vitality || 5}</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-obsidian-800/80 border border-glass-border flex justify-between">
                          <span className="text-ink-muted">Intelligence:</span>
                          <strong className="text-attr-intelligence font-mono">{character.attributes.intelligence || 5}</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-obsidian-800/80 border border-glass-border flex justify-between">
                          <span className="text-ink-muted">Willpower:</span>
                          <strong className="text-attr-willpower font-mono">{character.attributes.willpower || 5}</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-obsidian-800/80 border border-glass-border flex justify-between col-span-2">
                          <span className="text-ink-muted">Perception:</span>
                          <strong className="text-gold font-mono">{character.attributes.perception || 5}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vault & Rewards */}
                  <div className="p-3.5 rounded-2xl bg-obsidian-900/60 border border-glass-border flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-ink uppercase tracking-wider mb-3">Treasury</div>
                      <div className="p-3 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-between mb-3">
                        <span className="text-xs text-ink-muted">Current Gold</span>
                        <span className="text-xl font-bold font-mono text-gold flex items-center gap-1.5">
                          <Award size={18} />
                          {character.gold?.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                    <Link
                      to="/shop"
                      className="w-full py-2.5 px-4 rounded-xl bg-gold/20 hover:bg-gold/30 text-gold border border-gold/40 text-xs font-bold text-center block transition-all min-h-[40px]"
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
