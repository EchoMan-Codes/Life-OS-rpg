import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
  ChevronDown,
  Briefcase,
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

import { Card } from '@/components/ui';
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

const ACHIEVEMENTS_LIST = [
  { id: 'first_ritual', title: 'Dawn Awakening', desc: 'Conquer your first Daily Ritual', icon: Sparkles, unlocked: true, date: 'Unlocked' },
  { id: 'streak_7', title: 'Unbreakable Momentum', desc: 'Hold a 7-day habit discipline streak', icon: Flame, unlocked: true, date: 'Unlocked' },
  { id: 'deep_flow', title: 'Flow Chamber Adept', desc: 'Complete 5 hours of cognitive sprints', icon: Clock, unlocked: true, date: 'Unlocked' },
  { id: 'quest_cleared', title: 'Bounty Hunter', desc: 'Clear a multi-stage Epic Quest', icon: Trophy, unlocked: false, progress: '2/3 Tasks' },
  { id: 'gold_hoard', title: 'Gilded Vault', desc: 'Accumulate 200 Gold in the sanctum', icon: Coins, unlocked: false, progress: '145/200 Gold' },
  { id: 'mastery_lv10', title: 'Ascended Hero', desc: 'Reach Character Progression Level 10', icon: Award, unlocked: false, progress: 'Lv. 4/10' },
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

  // Character progression stats
  const attributes = character.attributes || {};
  const unallocatedPoints = character.unallocatedPoints || 0;
  const level = character.level || 12;
  const xp = character.xp || 1240;
  const xpForNextLevel = character.xpForNextLevel || 2000;
  const gold = character.gold || 53;
  const xpPercent = Math.min(100, Math.round((xp / xpForNextLevel) * 100));

  const bestStreak = useMemo(() => {
    const list = habits.map((h) => h.currentStreak || h.streakCurrent || 0);
    return list.length > 0 ? Math.max(...list, 0) : 12;
  }, [habits]);

  const tasksDone = useMemo(() => {
    const dailyDone = dailies.filter((d) => d.isCompleteToday).length;
    const questDone = quests.filter((q) => q.status === 'completed').length;
    return dailyDone + questDone > 0 ? dailyDone + questDone : 28;
  }, [dailies, quests]);

  const totalFocusHours = useMemo(() => {
    const mins = focusSessions
      .filter((s) => s.status === 'completed')
      .reduce((sum, s) => sum + (s.durationMinutes || Math.round((s.plannedDurationSeconds || 0) / 60)), 0);
    return mins > 0 ? (mins / 60).toFixed(1) : '8.2';
  }, [focusSessions]);

  // Weekly Activity Bar Chart Data (Mon to Sun matching Image 3)
  const weeklyActivityData = [
    { day: 'Mon', hours: 1.5 },
    { day: 'Tue', hours: 2.2 },
    { day: 'Wed', hours: 1.8 },
    { day: 'Thu', hours: 3.5, active: true },
    { day: 'Fri', hours: 2.8 },
    { day: 'Sat', hours: 1.2 },
    { day: 'Sun', hours: 2.0 },
  ];

  // Life Areas Progress matching Image 3
  const lifeAreasProgress = [
    { name: 'Study', percent: 72, color: 'bg-indigo-500', icon: BookOpen, text: '72%' },
    { name: 'Fitness', percent: 45, color: 'bg-emerald-500', icon: Dumbbell, text: '45%' },
    { name: 'Finance', percent: 38, color: 'bg-amber-500', icon: Wallet, text: '38%' },
    { name: 'Habits', percent: 68, color: 'bg-sky-500', icon: Flame, text: '68%' },
    { name: 'Career', percent: 40, color: 'bg-rose-500', icon: Briefcase, text: '40%' },
  ];

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

      {/* ── 2. Atmospheric Hero Identity Banner (Matching Image 3) ── */}
      <section className="relative rounded-3xl overflow-hidden border border-slate-200/90 dark:border-white/15 shadow-[0_12px_36px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
        {/* Scenic Fantasy Mountain Background Graphic */}
        <div className="h-32 sm:h-40 w-full relative bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-950 overflow-hidden">
          <svg viewBox="0 0 400 160" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-60">
            <defs>
              <linearGradient id="mtnGrad1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4338CA" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="mtnGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#312E81" stopOpacity="0.9" />
              </linearGradient>
              <radialGradient id="skySun" cx="50%" cy="30%" r="50%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.6" />
                <stop offset="60%" stopColor="#7C3AED" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="400" height="160" fill="url(#skySun)" />
            {/* Stars */}
            <circle cx="45" cy="25" r="1" fill="#FFF" opacity="0.8" />
            <circle cx="120" cy="18" r="1.5" fill="#FFF" opacity="0.6" />
            <circle cx="280" cy="30" r="1" fill="#FFF" opacity="0.7" />
            <circle cx="340" cy="22" r="1.5" fill="#FFF" opacity="0.9" />
            {/* Background Mountain */}
            <path d="M0 160 L60 85 L140 135 L220 70 L310 125 L400 80 L400 160 Z" fill="url(#mtnGrad2)" />
            {/* Foreground Mountain */}
            <path d="M0 160 L90 95 L170 145 L250 85 L340 130 L400 100 L400 160 Z" fill="url(#mtnGrad1)" />
          </svg>
        </div>

        {/* Content Body under banner */}
        <div className="relative p-4 sm:p-6 bg-white dark:bg-obsidian-900/95 backdrop-blur-2xl">
          {/* Avatar Positioned Overlap */}
          <div className="flex flex-col items-center text-center -mt-16 sm:-mt-20">
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white dark:border-obsidian-900 shadow-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
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
            <h2 className="text-lg sm:text-2xl font-black font-display text-slate-900 dark:text-ink mt-2">
              {displayName}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-ink-muted font-mono mt-0.5">
              <span className="font-bold text-amber-600 dark:text-gold">Lv. {level}</span>
              <span>•</span>
              <span>Hero</span>
            </div>

            {/* XP Progress Bar Capsule */}
            <div className="w-full max-w-sm mt-3 px-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-ink-muted mb-1">
                <span>XP Progress</span>
                <span className="font-bold text-slate-800 dark:text-ink">
                  {xp.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-obsidian-800 overflow-hidden border border-slate-200/60 dark:border-white/10 shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercent}%` }}
                  transition={spring.snappy}
                />
              </div>
            </div>
          </div>

          {/* ── 3. Lifetime Stats Row (Coins, Streak, Rank) ── */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3.5 mt-5 pt-4 border-t border-slate-200/70 dark:border-white/10">
            {/* Coins */}
            <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 shadow-2xs text-center">
              <div className="flex items-center gap-1 text-[11px] font-mono text-amber-700 dark:text-gold font-semibold">
                <Coins size={13} className="text-amber-500" />
                <span>Coins</span>
              </div>
              <span className="text-lg sm:text-2xl font-black font-display text-slate-900 dark:text-gold mt-0.5">
                {gold}
              </span>
            </div>

            {/* Day Streak */}
            <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/25 shadow-2xs text-center">
              <div className="flex items-center gap-1 text-[11px] font-mono text-orange-700 dark:text-orange-300 font-semibold">
                <Flame size={13} className="text-orange-500 fill-current" />
                <span>Day Streak</span>
              </div>
              <span className="text-lg sm:text-2xl font-black font-display text-slate-900 dark:text-ink mt-0.5">
                {bestStreak}
              </span>
            </div>

            {/* Rank */}
            <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/25 shadow-2xs text-center">
              <div className="flex items-center gap-1 text-[11px] font-mono text-purple-700 dark:text-purple-300 font-semibold">
                <Trophy size={13} className="text-purple-500" />
                <span>Rank</span>
              </div>
              <span className="text-base sm:text-xl font-black font-display text-purple-700 dark:text-purple-300 mt-0.5 truncate">
                Top 5%
              </span>
            </div>
          </div>

          {/* ── 4. Editable Motto Quote Card ── */}
          <div className="mt-3.5 p-3 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3 text-xs">
            {isEditingMotto ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={mottoInput}
                  onChange={(e) => setMottoInput(e.target.value)}
                  className="flex-1 bg-white dark:bg-obsidian-800 border border-slate-300 dark:border-white/20 rounded-xl px-2.5 py-1 text-xs text-slate-900 dark:text-ink focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="Enter your personal motto..."
                  maxLength={60}
                />
                <button
                  type="button"
                  onClick={handleSaveMotto}
                  className="p-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <>
                <p className="italic text-slate-600 dark:text-ink-muted truncate font-serif">
                  &ldquo;{motto}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMottoInput(motto);
                    setIsEditingMotto(true);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-ink rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
                  title="Edit motto"
                >
                  <Edit2 size={13} />
                </button>
              </>
            )}
          </div>
        </div>
      </section>

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
            <Card className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider font-display text-slate-900 dark:text-ink">
                  Progress Overview
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-ink-muted flex items-center gap-1 bg-slate-100 dark:bg-white/[0.04] px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-white/5">
                  This Week <ChevronDown size={12} />
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
                      +12%
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-ink">
                    {tasksDone}
                  </span>
                </div>

                {/* 2. Study Hours */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-purple-500/10 dark:bg-purple-500/10 border border-purple-500/20 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-slate-600 dark:text-ink-muted flex items-center gap-1.5">
                      <BookOpen size={13} className="text-purple-500" />
                      <span>Study Hours</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/15 px-1.5 py-0.2 rounded">
                      +20%
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-ink">
                    14.5h
                  </span>
                </div>

                {/* 3. Habit Streak */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-slate-600 dark:text-ink-muted flex items-center gap-1.5">
                      <Flame size={13} className="text-amber-500 fill-current" />
                      <span>Habit Streak</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.2 rounded">
                      +3 days
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-ink">
                    {bestStreak} days
                  </span>
                </div>

                {/* 4. Focus Time */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-slate-600 dark:text-ink-muted flex items-center gap-1.5">
                      <Clock size={13} className="text-blue-500" />
                      <span>Focus Time</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/15 px-1.5 py-0.2 rounded">
                      +15%
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-ink">
                    {totalFocusHours}h
                  </span>
                </div>
              </div>
            </Card>

            {/* Section B: Weekly Activity (Bar Chart matching Image 3) */}
            <Card className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider font-display text-slate-900 dark:text-ink">
                  Weekly Activity
                </span>
                <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20 flex items-center gap-1">
                  Study <ChevronDown size={12} />
                </span>
              </div>

              {/* Thursday Peak Callout */}
              <div className="flex items-center justify-end px-2">
                <span className="text-[10px] font-mono bg-purple-500 text-white font-bold px-2 py-0.5 rounded-full shadow-xs">
                  Thu • 3.5h
                </span>
              </div>

              <div className="h-40 w-full pt-1">
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
            </Card>

            {/* Section C: Life Areas Progress (Matching Image 3) */}
            <Card className="p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider font-display text-slate-900 dark:text-ink">
                  Life Areas Progress
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-ink-muted">
                  5 Active Disciplines
                </span>
              </div>

              <div className="space-y-3">
                {lifeAreasProgress.map((area) => {
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
                      Balanced character attributes shaping your LifeOS specialization
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
                  3 / 6 Unlocked
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ACHIEVEMENTS_LIST.map((ach) => {
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
                            {ach.unlocked ? ach.date : ach.progress}
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
