import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Shield,
  Brain,
  Heart,
  Zap,
  Eye,
  Plus,
  Flame,
  User as UserIcon,
  LogOut,
  Swords,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  ArrowLeft,
  ArrowRight,
  Settings,
  Edit2,
  Check,
  Camera,
  Coins,
  Trophy,
  BookOpen,
  Clock,
  CheckCircle2,
  Award,
  Dumbbell,
  Wallet,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import clsx from 'clsx';

import { Card, WavyHeroScenery, ModeButton } from '@/components/ui';
import { spring } from '@/lib/motionVariants';
import { useAuth } from '@/features/auth/hooks';
import { useCharacter, useAllocateAttribute } from '@/features/character/hooks';
import { useHabits } from '@/features/habits/hooks';
import { useDailies } from '@/features/dailies/hooks';
import { useQuests } from '@/features/quests/hooks';
import { useFocusHistory } from '@/features/focus/hooks';
import { useFloatingText } from '@/features/character/floatingText';
import { openBattleLogDrawer } from '@/features/celebration/celebrationEvents';
import { AttributesRadarChart } from '@/components/hud/AttributesRadarChart';
import { useTheme } from '@/lib/theme';

const ATTR_DETAILS = [
  {
    key: 'strength',
    name: 'Strength',
    stat: 'STR',
    icon: Shield,
    color: '#DC2626',
    colorClass: 'text-attr-strength',
    bgClass: 'bg-attr-strength/10 border-attr-strength/25',
    desc: 'Physical power (+4 Max HP per point). Drives execution capacity and stamina.',
  },
  {
    key: 'intelligence',
    name: 'Intelligence',
    stat: 'INT',
    icon: Brain,
    color: '#38BDF8',
    colorClass: 'text-attr-intelligence',
    bgClass: 'bg-attr-intelligence/10 border-attr-intelligence/25',
    desc: 'Cognitive acuity (+3 Max Mana per point). Deep work retention & complex problem solving.',
  },
  {
    key: 'vitality',
    name: 'Vitality',
    stat: 'VIT',
    icon: Heart,
    color: '#34D399',
    colorClass: 'text-attr-vitality',
    bgClass: 'bg-attr-vitality/10 border-attr-vitality/25',
    desc: 'Biological resilience (+4 Max HP per point). Fatigue resistance & immune recovery.',
  },
  {
    key: 'willpower',
    name: 'Willpower',
    stat: 'WIL',
    icon: Zap,
    color: '#A78BFA',
    colorClass: 'text-attr-willpower',
    bgClass: 'bg-attr-willpower/10 border-attr-willpower/25',
    desc: 'Habit discipline (+3 Max Mana per point). Resistance against distraction and cognitive drift.',
  },
  {
    key: 'perception',
    name: 'Perception',
    stat: 'PER',
    icon: Eye,
    color: '#FBBF24',
    colorClass: 'text-attr-perception',
    bgClass: 'bg-attr-perception/10 border-attr-perception/25',
    desc: 'Mindful clarity, burnout sensing, and daily streak consistency.',
  },
];



/**
 * Dedicated Mobile & Desktop Character / Profile Experience.
 * Exactly matches Image 3 blueprint with Hero Banner, Lifetime Stats,
 * Progress Overview 2x2, Weekly Activity Bar Chart, and Life Areas Progress.
 */
export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: character = {} } = useCharacter();
  const { data: habits = [] } = useHabits();
  const { data: dailies = [] } = useDailies();
  const { data: quests = [] } = useQuests();
  const { data: focusSessions = [] } = useFocusHistory({ limit: 50 });
  const allocateMutation = useAllocateAttribute();
  const { spawnFloatingText } = useFloatingText();
  const { mode, setMode } = useTheme();

  // Active tab: 'overview' | 'stats' | 'achievements' | 'settings'
  const [activeTab, setActiveTab] = useState('overview');

  // Editable motto quote
  const [motto, setMotto] = useState(() => {
    return localStorage.getItem('lifeos_user_motto') || 'Disciplined today. A better tomorrow.';
  });
  const [isEditingMotto, setIsEditingMotto] = useState(false);
  const [mottoInput, setMottoInput] = useState(motto);

  // Audio preference
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('lifeos_sound_enabled') !== 'false';
  });

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('lifeos_sound_enabled', String(next));
      return next;
    });
  };

  const handleSaveMotto = () => {
    setMotto(mottoInput);
    localStorage.setItem('lifeos_user_motto', mottoInput);
    setIsEditingMotto(false);
  };

  // Real character progression stats
  const attributes = character.attributes || {};
  const unallocatedPoints = character.unallocatedPoints || 0;
  const level = character.level || 1;
  const xp = character.xp || 0;
  const xpForNextLevel = character.xpForNextLevel || 100;
  const gold = character.gold || 0;
  const xpPercent = Math.min(100, Math.round((xp / Math.max(1, xpForNextLevel)) * 100));

  const bestStreak = useMemo(() => {
    const list = habits.map((h) => h.currentStreak || h.streakCurrent || 0);
    return list.length > 0 ? Math.max(...list, 0) : 0;
  }, [habits]);

  const tasksDone = useMemo(() => {
    const dailyDone = dailies.filter((d) => d.isCompleteToday).length;
    const questDone = quests.filter((q) => q.status === 'completed').length;
    return dailyDone + questDone;
  }, [dailies, quests]);

  const totalFocusHours = useMemo(() => {
    const mins = focusSessions
      .filter((s) => s.status === 'completed')
      .reduce((sum, s) => sum + (s.durationMinutes || Math.round((s.plannedDurationSeconds || 0) / 60)), 0);
    return (mins / 60).toFixed(1);
  }, [focusSessions]);

  const completedQuestsCount = useMemo(() => {
    return quests.filter((q) => q.status === 'completed').length;
  }, [quests]);

  const rankText = level >= 12 ? 'Top 5%' : level >= 7 ? 'Top 10%' : level >= 3 ? 'Top 20%' : 'Top 50%';

  // Dynamic RPG Class Title based on highest attribute
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

  // Real Weekly Activity Bar Chart Data (Past 7 days from real completed focus sessions)
  const weeklyActivityData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayHours = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    focusSessions
      .filter((s) => s.status === 'completed')
      .forEach((s) => {
        const sessionDate = new Date(s.completedAt || s.createdAt);
        if (sessionDate >= oneWeekAgo) {
          const dayName = sessionDate.toLocaleDateString('en-US', { weekday: 'short' });
          if (dayHours[dayName] !== undefined) {
            const hours = (s.durationMinutes || Math.round((s.plannedDurationSeconds || 0) / 60)) / 60;
            dayHours[dayName] += hours;
          }
        }
      });

    const todayName = now.toLocaleDateString('en-US', { weekday: 'short' });
    return days.map((day) => ({
      day,
      hours: Number(dayHours[day].toFixed(1)),
      active: day === todayName,
    }));
  }, [focusSessions]);

  const totalWeeklyFocusHours = useMemo(() => {
    return weeklyActivityData.reduce((sum, d) => sum + d.hours, 0);
  }, [weeklyActivityData]);

  // Real Life Areas Progress from Active Systems
  const activeSystemsProgress = useMemo(() => {
    const habitRate = habits.length > 0
      ? Math.round((habits.filter((h) => (h.currentStreak || 0) > 0).length / habits.length) * 100)
      : 0;
    const dailiesDone = dailies.filter((d) => d.isCompleteToday).length;
    const dailyRate = dailies.length > 0 ? Math.round((dailiesDone / dailies.length) * 100) : 0;
    const questRate = quests.length > 0
      ? Math.round((completedQuestsCount / quests.length) * 100)
      : 0;
    const focusRate = Math.min(100, Math.round((Number(totalFocusHours) / 5) * 100));

    return [
      { name: 'Habit Momentum', percent: habitRate, color: 'bg-amber-500', icon: Flame, text: `${habitRate}% streak active` },
      { name: 'Daily Rituals', percent: dailyRate, color: 'bg-emerald-500', icon: CheckCircle2, text: `${dailiesDone}/${dailies.length} conquered today` },
      { name: 'Campaign Quests', percent: questRate, color: 'bg-indigo-500', icon: BookOpen, text: `${completedQuestsCount}/${quests.length} completed` },
      { name: 'Deep Focus Chamber', percent: focusRate, color: 'bg-sky-500', icon: Clock, text: `${totalFocusHours}h logged` },
    ];
  }, [habits, dailies, quests, totalFocusHours, completedQuestsCount]);

  // Real Dynamic Achievements derived from user progression
  const dynamicAchievements = useMemo(() => {
    return [
      {
        id: 'first_ritual',
        title: 'Dawn Awakening',
        desc: 'Conquer your first Daily Ritual',
        icon: Sparkles,
        unlocked: dailies.some((d) => d.isCompleteToday),
        progress: dailies.some((d) => d.isCompleteToday) ? 'Unlocked' : '0/1 Daily',
      },
      {
        id: 'streak_7',
        title: 'Unbreakable Momentum',
        desc: 'Hold a 7-day habit discipline streak',
        icon: Flame,
        unlocked: bestStreak >= 7,
        progress: bestStreak >= 7 ? 'Unlocked' : `${bestStreak}/7 Days`,
      },
      {
        id: 'deep_flow',
        title: 'Flow Chamber Adept',
        desc: 'Complete at least 1 hour of cognitive focus sprints',
        icon: Clock,
        unlocked: Number(totalFocusHours) >= 1.0,
        progress: Number(totalFocusHours) >= 1.0 ? 'Unlocked' : `${totalFocusHours}/1.0h`,
      },
      {
        id: 'quest_cleared',
        title: 'Bounty Hunter',
        desc: 'Clear a multi-stage Epic Quest',
        icon: Trophy,
        unlocked: completedQuestsCount > 0,
        progress: completedQuestsCount > 0 ? 'Unlocked' : `${completedQuestsCount} Quests`,
      },
      {
        id: 'gold_hoard',
        title: 'Gilded Vault',
        desc: 'Accumulate 100 Gold in the sanctum',
        icon: Coins,
        unlocked: gold >= 100,
        progress: gold >= 100 ? 'Unlocked' : `${gold}/100 Gold`,
      },
      {
        id: 'mastery_lv5',
        title: 'Ascended Hero',
        desc: 'Reach Character Progression Level 5',
        icon: Award,
        unlocked: level >= 5,
        progress: level >= 5 ? 'Unlocked' : `Lv. ${level}/5`,
      },
    ];
  }, [dailies, bestStreak, totalFocusHours, completedQuestsCount, gold, level]);

  const handleAllocate = async (attributeKey, attributeName) => {
    try {
      await allocateMutation.mutateAsync({ attribute: attributeKey, points: 1 });
      spawnFloatingText(`+1 ${attributeName}`);
    } catch (err) {
      console.error('Failed to allocate point:', err);
    }
  };

  const displayName = user?.displayName || 'Rohit';
  const avatarUrl = user?.avatarUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.snappy}
      className="space-y-4 sm:space-y-6 max-w-4xl mx-auto pb-24"
    >
      {/* ── 1. Top Mobile Navigation Bar ── */}
      <div className="flex items-center justify-between pb-1">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-ink hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all shadow-xs active:scale-95 cursor-pointer"
          title="Back to Dashboard"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft size={18} />
        </button>

        <h1 className="text-base font-bold font-display text-slate-900 dark:text-ink">
          Profile
        </h1>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={openBattleLogDrawer}
            className="w-10 h-10 rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-amber-600 dark:text-gold hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Battle Chronicles"
            aria-label="Battle Chronicles"
          >
            <Swords size={17} />
          </button>
          <ModeButton compact />
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={clsx(
              'w-10 h-10 rounded-2xl border flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer',
              activeTab === 'settings'
                ? 'bg-indigo-500 text-white border-indigo-400'
                : 'bg-white/80 dark:bg-white/[0.04] border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-ink hover:bg-slate-100 dark:hover:bg-white/[0.08]'
            )}
            title="Settings"
            aria-label="Settings"
          >
            <Settings size={17} />
          </button>
        </div>
      </div>

      {/* ── 2. Atmospheric Hero Identity Banner with Wavy Scenery ── */}
      <WavyHeroScenery variant="profile" className="p-4 sm:p-6">
        <div className="flex flex-col items-center text-center">
          {/* Avatar Positioned with Glow Ring */}
          <div className="relative group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-amber-400/80 shadow-2xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center text-white">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={38} className="text-white" />
              )}
            </div>

            {/* Camera Icon Overlay Badge */}
            <button
              type="button"
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-slate-900 text-white dark:bg-white dark:text-obsidian flex items-center justify-center shadow-md hover:scale-105 transition-transform"
              title="Update avatar"
            >
              <Camera size={13} />
            </button>
          </div>

          {/* Name & Title */}
          <h2 className="text-xl sm:text-2xl font-black font-display text-white mt-2.5">
            {displayName}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-indigo-200/80 font-mono mt-0.5">
            <span className="font-bold text-amber-300">Lv. {level}</span>
            <span>•</span>
            <span>{characterTitle}</span>
          </div>

          {/* XP Progress Bar Capsule */}
          <div className="w-full max-w-sm mt-3 px-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-indigo-200/70 mb-1">
              <span>XP Progress</span>
              <span className="font-bold text-white">
                {xp.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
              </span>
            </div>
            <div className="h-2 rounded-full bg-black/40 overflow-hidden border border-white/10 shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={spring.snappy}
              />
            </div>
          </div>

          {/* ── 3. Lifetime Stats Row (Coins, Streak, Rank) ── */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3.5 w-full max-w-md mt-4 pt-3.5 border-t border-white/10">
            {/* Coins */}
            <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-black/35 border border-amber-500/30 shadow-2xs text-center backdrop-blur-md">
              <div className="flex items-center gap-1 text-[11px] font-mono text-amber-300 font-semibold">
                <Coins size={13} className="text-amber-400" />
                <span>Coins</span>
              </div>
              <span className="text-lg sm:text-2xl font-black font-display text-amber-300 mt-0.5">
                {gold}
              </span>
            </div>

            {/* Day Streak */}
            <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-black/35 border border-orange-500/30 shadow-2xs text-center backdrop-blur-md">
              <div className="flex items-center gap-1 text-[11px] font-mono text-orange-300 font-semibold">
                <Flame size={13} className="text-orange-400 fill-current" />
                <span>Day Streak</span>
              </div>
              <span className="text-lg sm:text-2xl font-black font-display text-white mt-0.5">
                {bestStreak}
              </span>
            </div>

            {/* Rank */}
            <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-black/35 border border-purple-500/30 shadow-2xs text-center backdrop-blur-md">
              <div className="flex items-center gap-1 text-[11px] font-mono text-purple-300 font-semibold">
                <Trophy size={13} className="text-purple-400" />
                <span>Rank</span>
              </div>
              <span className="text-base sm:text-xl font-black font-display text-purple-300 mt-0.5 truncate">
                {rankText}
              </span>
            </div>
          </div>

          {/* ── 4. Editable Motto Quote Card ── */}
          <div className="w-full max-w-md mt-3.5 p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-3 text-xs backdrop-blur-md">
            {isEditingMotto ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={mottoInput}
                  onChange={(e) => setMottoInput(e.target.value)}
                  className="flex-1 bg-black/50 border border-white/20 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="Enter your personal motto..."
                  maxLength={60}
                />
                <button
                  type="button"
                  onClick={handleSaveMotto}
                  className="p-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <>
                <p className="italic text-indigo-100/90 truncate font-serif">
                  &ldquo;{motto}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMottoInput(motto);
                    setIsEditingMotto(true);
                  }}
                  className="p-1 text-indigo-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  title="Edit motto"
                >
                  <Edit2 size={13} />
                </button>
              </>
            )}
          </div>
        </div>
      </WavyHeroScenery>

      {/* ── 5. Segmented Tab Switcher (Overview, Stats, Achievements, Settings) ── */}
      <div className="p-1 rounded-2xl bg-slate-100/90 dark:bg-obsidian-900/80 border border-slate-200/80 dark:border-white/10 shadow-inner grid grid-cols-4 gap-1 backdrop-blur-md">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'stats', label: 'Stats' },
          { id: 'achievements', label: 'Achievements' },
          { id: 'settings', label: 'Settings' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'py-2 px-1 rounded-xl text-xs font-semibold transition-all relative text-center truncate',
                isActive
                  ? 'bg-white text-slate-950 dark:bg-white/[0.12] dark:text-ink shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-ink-muted dark:hover:text-ink'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── 6. Tab Content ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={spring.snappy}
            className="space-y-4 sm:space-y-6"
          >
            {/* Section A: Progress Overview (2x2 Cards matching Image 3) */}
            {/* Section A: Progress Overview (Real Data Only) */}
            <Card className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider font-display text-slate-900 dark:text-ink">
                  Progress Overview
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-ink-muted bg-slate-100 dark:bg-white/[0.04] px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-white/5">
                  Real Telemetry
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                {/* 1. Tasks Done */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-slate-600 dark:text-ink-muted flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      <span>Tasks Done</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded">
                      Today & Quests
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-ink">
                    {tasksDone}
                  </span>
                </div>

                {/* 2. Habit Streak */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-slate-600 dark:text-ink-muted flex items-center gap-1.5">
                      <Flame size={13} className="text-orange-500 fill-current" />
                      <span>Habit Streak</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.2 rounded">
                      Current Peak
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-ink">
                    {bestStreak} days
                  </span>
                </div>

                {/* 3. Focus Chamber */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-sky-500/10 dark:bg-sky-500/10 border border-sky-500/20 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-slate-600 dark:text-ink-muted flex items-center gap-1.5">
                      <Clock size={13} className="text-sky-500" />
                      <span>Focus Chamber</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-500/15 px-1.5 py-0.2 rounded">
                      Total Time
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-ink">
                    {totalFocusHours}h
                  </span>
                </div>

                {/* 4. Quests Cleared */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-purple-500/10 dark:bg-purple-500/10 border border-purple-500/20 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-slate-600 dark:text-ink-muted flex items-center gap-1.5">
                      <Trophy size={13} className="text-purple-500" />
                      <span>Quests Cleared</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/15 px-1.5 py-0.2 rounded">
                      Milestones
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-ink">
                    {completedQuestsCount}
                  </span>
                </div>
              </div>
            </Card>

            {/* Section B: Weekly Activity (Real Data or Intentional Empty State) */}
            <Card className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider font-display text-slate-900 dark:text-ink">
                    Weekly Activity
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    Past 7 Days
                  </span>
                </div>
                {totalWeeklyFocusHours > 0 && (
                  <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                    {totalWeeklyFocusHours.toFixed(1)}h total
                  </span>
                )}
              </div>

              {totalWeeklyFocusHours > 0 ? (
                <div className="h-44 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyActivityData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'monospace' }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900 text-white dark:bg-obsidian-900 border border-white/10 px-2.5 py-1.5 rounded-xl text-xs font-mono shadow-xl">
                                <span className="font-bold">{payload[0].payload.day}:</span> {payload[0].value}h focus
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="hours" radius={[8, 8, 4, 4]}>
                        {weeklyActivityData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.active ? '#8B5CF6' : '#C4B5FD'}
                            className="transition-colors hover:opacity-80"
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                /* Intentional Empty State matching user instructions */
                <div className="py-8 px-4 text-center flex flex-col items-center justify-center space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
                    <Clock size={22} />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-ink font-display">
                    Your progress graph will appear as you build your history.
                  </p>
                  <p className="text-xs text-slate-500 dark:text-ink-muted max-w-sm leading-relaxed">
                    Start a sprint in the Focus Chamber or complete your daily rituals to begin recording your personal analytics.
                  </p>
                  <Link
                    to="/focus"
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500 text-white font-bold text-xs hover:bg-purple-600 transition-colors shadow-xs active:scale-95"
                  >
                    <span>Enter Focus Chamber</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              )}
            </Card>

            {/* Section C: Life Areas & Active Disciplines (Real Progress + Future Modules) */}
            <Card className="p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider font-display text-slate-900 dark:text-ink">
                  Life Areas & Systems
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-ink-muted">
                  4 Active Disciplines
                </span>
              </div>

              {/* Active Systems */}
              <div className="space-y-3">
                {activeSystemsProgress.map((area) => {
                  const Icon = area.icon;
                  return (
                    <div key={area.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-ink flex items-center gap-2">
                          <Icon size={14} className="text-slate-500 dark:text-ink-muted" />
                          <span>{area.name}</span>
                        </span>
                        <span className="font-mono font-bold text-slate-700 dark:text-ink text-[11px]">
                          {area.text}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-black/40 overflow-hidden border border-slate-200/50 dark:border-white/5">
                        <motion.div
                          className={clsx('h-full rounded-full', area.color)}
                          initial={{ width: 0 }}
                          animate={{ width: `${area.percent}%` }}
                          transition={spring.snappy}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Upcoming Roadmap Modules (Clean Placeholders without Fake Metrics) */}
              <div className="pt-2 border-t border-slate-200/70 dark:border-white/10 space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-ink-faint font-semibold">
                  Planned Expansion Modules
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                      <Dumbbell size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-ink">Fitness & Health</h4>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                          Phase 6+
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-ink-muted mt-0.5">
                        Physical workout logging and stamina metrics will sync here.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                      <Wallet size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-ink">Finance & Wealth</h4>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold">
                          Phase 6+
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-ink-muted mt-0.5">
                        Budget tracking and savings goals will link into RPG gold.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Tab 2: Stats (Attributes Radar & Point Allocation) */}
        {activeTab === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={spring.snappy}
            className="space-y-5"
          >
            <Card className="p-4 sm:p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-glass-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-gold">
                    <Shield size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold font-display text-slate-900 dark:text-ink">
                      RPG Attribute Pentagon
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-ink-muted">
                      Balanced character attributes shaping your Jeevan specialization
                    </p>
                  </div>
                </div>

                {unallocatedPoints > 0 && (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-gold text-xs font-mono font-bold animate-pulse">
                    +{unallocatedPoints} SP Ready
                  </span>
                )}
              </div>

              {/* Radar Chart Visualizer */}
              <div className="py-2 flex flex-col items-center bg-slate-50/80 rounded-2xl border border-slate-200/80 dark:bg-white/[0.01] dark:border-white/5">
                <AttributesRadarChart attributes={attributes} />
              </div>

              {/* 5 Attributes Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {ATTR_DETAILS.map((attr) => {
                  const Icon = attr.icon;
                  const val = attributes[attr.key] ?? 5;
                  const maxBaseline = 25;
                  const barPercent = Math.min(100, Math.round((val / maxBaseline) * 100));

                  return (
                    <div
                      key={attr.key}
                      className={clsx(
                        'p-3.5 rounded-2xl border transition-all space-y-2',
                        attr.bgClass
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon size={16} className={attr.colorClass} />
                          <span className="font-bold text-slate-900 dark:text-ink text-xs sm:text-sm">
                            {attr.name}
                          </span>
                          <span
                            className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold"
                            style={{
                              backgroundColor: `${attr.color}20`,
                              color: attr.color,
                            }}
                          >
                            {attr.stat}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-900 dark:text-ink">
                            {val}
                          </span>
                          {unallocatedPoints > 0 && (
                            <button
                              type="button"
                              onClick={() => handleAllocate(attr.key, attr.name)}
                              disabled={allocateMutation.isPending}
                              aria-label={`Allocate 1 point to ${attr.name}`}
                              className="w-6 h-6 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-700 dark:text-gold flex items-center justify-center transition-all active:scale-95"
                            >
                              <Plus size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-black/40 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: attr.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${barPercent}%` }}
                          transition={spring.snappy}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-ink-muted leading-tight">
                        {attr.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Tab 3: Achievements */}
        {activeTab === 'achievements' && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={spring.snappy}
            className="space-y-4"
          >
            <Card className="p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider font-display text-slate-900 dark:text-ink">
                  Sanctum Achievements & Medals
                </span>
                <span className="text-[11px] font-mono text-amber-600 dark:text-gold font-bold">
                  {dynamicAchievements.filter((a) => a.unlocked).length} / {dynamicAchievements.length} Unlocked
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dynamicAchievements.map((ach) => {
                  const Icon = ach.icon;
                  return (
                    <div
                      key={ach.id}
                      className={clsx(
                        'p-3.5 rounded-2xl border transition-all flex items-center gap-3',
                        ach.unlocked
                          ? 'bg-amber-500/10 border-amber-500/30 text-slate-900 dark:text-ink shadow-2xs'
                          : 'bg-slate-50/60 dark:bg-white/[0.02] border-slate-200/70 dark:border-white/5 opacity-60'
                      )}
                    >
                      <div
                        className={clsx(
                          'w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-inner',
                          ach.unlocked
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-gold'
                            : 'bg-slate-200/60 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-400'
                        )}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-ink truncate">
                            {ach.title}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-ink-muted">
                            {ach.progress}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-ink-muted mt-0.5 line-clamp-1">
                          {ach.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Tab 4: Settings & Preferences */}
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={spring.snappy}
            className="space-y-4"
          >
            {/* Appearance Mode Controller */}
            <Card className="p-4 sm:p-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider font-display text-slate-900 dark:text-ink block">
                Appearance Mode
              </span>
              <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200 dark:bg-white/[0.03] dark:border-white/10 backdrop-blur-md">
                {[
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'dim', label: 'Dim', icon: Sparkles },
                  { id: 'light', label: 'Light', icon: Sun },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = mode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMode(item.id)}
                      className={clsx(
                        'py-2 px-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                        isActive
                          ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-300 dark:bg-white/10 dark:text-ink dark:border-white/20'
                          : 'text-slate-600 dark:text-ink-muted hover:text-slate-900 dark:hover:text-ink'
                      )}
                    >
                      <Icon size={14} className={isActive ? 'text-amber-500' : 'text-slate-400'} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* System Preferences & Audio */}
            <Card className="p-4 sm:p-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider font-display text-slate-900 dark:text-ink block">
                Audio & Account
              </span>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={toggleSound}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 dark:bg-white/[0.02] dark:hover:bg-white/[0.05] dark:border-white/10 transition-all text-xs text-slate-800 dark:text-ink cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {soundEnabled ? (
                      <Volume2 size={16} className="text-amber-500" />
                    ) : (
                      <VolumeX size={16} className="text-slate-400" />
                    )}
                    <span>Audio Haptic FX</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500 dark:text-ink-muted uppercase">
                    {soundEnabled ? 'Enabled' : 'Muted'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/25 transition-all text-xs text-rose-600 dark:text-hp font-semibold mt-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <LogOut size={16} />
                    <span>Sign Out of Sanctum</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider opacity-80">
                    Disconnect
                  </span>
                </button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
