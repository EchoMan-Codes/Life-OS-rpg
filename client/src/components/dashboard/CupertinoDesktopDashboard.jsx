import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  CalendarCheck,
  CalendarDays,
  CheckSquare,
  Scroll,
  TrendingUp,
  Zap,
  Target,
  Clock,
  Heart,
  Plus,
  Shield,
  Swords,
  Moon,
  Sparkles,
  ChevronRight,
  Coins,
  Bell,
  Search,
  CheckCircle2,
  Circle,
  MoreVertical,
  ExternalLink,
  Share2,
  ArrowUpRight,
  Briefcase,
  Play,
  Layers,
  Sparkle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import clsx from 'clsx';

import { spring } from '@/lib/motionVariants';
import { openBattleLogDrawer, openAttributesDrawer } from '@/features/celebration/celebrationEvents';
import { openCalendarQuickAccess } from '@/components/calendar';
import { useCreateTask } from '@/features/tasks/hooks';
import { HabitModal } from '@/components/habits';
import { DailyModal } from '@/components/dailies';

/**
 * Custom Minimal Cupertino Chart Tooltip
 */
function CupertinoTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 dark:bg-black/95 text-white rounded-2xl px-3 py-2 text-xs shadow-xl backdrop-blur-md border border-white/10 font-mono">
      <p className="text-slate-400 font-semibold mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-300">{entry.name}:</span>
          <span className="font-bold">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Cupertino Light Desktop Bento Grid Dashboard
 * Visual layout and card composition directly inspired by Apple Bento reference.
 */
export function CupertinoDesktopDashboard({
  user,
  character,
  habits = [],
  dailies = [],
  quests = [],
  tasks = [],
  focusSessions = [],
  activeFocus = null,
  onScoreHabit,
  onCompleteDaily,
  onUndoDaily,
  onCompleteTask,
  onOpenCommand,
  onOpenAi,
  onOpenNotifications,
  unreadNotificationsCount = 0,
}) {
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [quickTaskModalOpen, setQuickTaskModalOpen] = useState(false);
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [dailyModalOpen, setDailyModalOpen] = useState(false);

  // Quick Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskProject, setTaskProject] = useState('General');
  const [taskDueDate, setTaskDueDate] = useState('');

  const createTaskMutation = useCreateTask();

  // Character progression numbers
  const displayName = user?.displayName || 'Hero';
  const level = character?.level ?? 1;
  const hp = character?.hp ?? 62;
  const maxHp = character?.maxHp ?? 80;
  const mana = character?.mana ?? 30;
  const maxMana = character?.maxMana ?? 50;
  const xp = character?.xp ?? 320;
  const xpForNextLevel = character?.xpForNextLevel ?? 604;
  const gold = character?.gold ?? 145;

  const xpPct = Math.max(0, Math.min(100, Math.round((xp / Math.max(1, xpForNextLevel)) * 100)));
  const hpPct = Math.max(0, Math.min(100, Math.round((hp / Math.max(1, maxHp)) * 100)));

  // Derived stats
  const activeDailies = useMemo(() => dailies.filter((d) => !d.archivedAt), [dailies]);
  const completedDailiesCount = useMemo(() => activeDailies.filter((d) => d.isCompleteToday).length, [activeDailies]);
  const dailiesRate = activeDailies.length > 0 ? Math.round((completedDailiesCount / activeDailies.length) * 100) : 0;

  const activeHabits = useMemo(() => habits.filter((h) => !h.archivedAt), [habits]);
  const bestStreak = useMemo(() => activeHabits.reduce((m, h) => Math.max(m, h.currentStreak || 0), 0), [activeHabits]);
  const habitsRate = activeHabits.length > 0
    ? Math.round((activeHabits.filter((h) => (h.currentStreak || 0) > 0).length / activeHabits.length) * 100)
    : 0;

  const activeQuests = useMemo(() => quests.filter((q) => q.status === 'active'), [quests]);
  const completedQuestsCount = useMemo(() => quests.filter((q) => q.status === 'completed').length, [quests]);
  const questsRate = quests.length > 0 ? Math.round((completedQuestsCount / quests.length) * 100) : 0;

  const activeTasks = useMemo(() => tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled'), [tasks]);
  const completedTasksCount = useMemo(() => tasks.filter((t) => t.status === 'completed').length, [tasks]);

  // Weekly Progress spline chart data (M T W T F S S)
  const weeklyProgressData = useMemo(() => {
    const days = [
      { key: 'Mon', label: 'M' },
      { key: 'Tue', label: 'T' },
      { key: 'Wed', label: 'W' },
      { key: 'Thu', label: 'T' },
      { key: 'Fri', label: 'F' },
      { key: 'Sat', label: 'S' },
      { key: 'Sun', label: 'S' },
    ];

    // Seed realistic curve from current activity
    const baseDailyScore = Math.max(2, completedDailiesCount * 2);
    const baseTaskScore = Math.max(1, completedTasksCount);

    return days.map((d, idx) => ({
      name: d.label,
      fullDay: d.key,
      Disciplines: Math.round(baseDailyScore * (0.8 + 0.4 * Math.sin(idx + 1))),
      Focus: Math.round(15 + 25 * Math.cos(idx * 0.8)),
    }));
  }, [completedDailiesCount, completedTasksCount]);

  const handleCreateTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    await createTaskMutation.mutateAsync({
      title: taskTitle.trim(),
      priority: taskPriority,
      projectName: taskProject.trim() || 'General',
      dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : null,
    });

    setTaskTitle('');
    setTaskDueDate('');
    setQuickTaskModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* ── 1. Top Workspace Header Bar ── */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Greeting matching Reference Image 2 ("Hi, Dilan!") */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-display text-slate-900 dark:text-ink">
            Hi, {displayName}!
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-ink-muted mt-0.5">
            Your personal operating system is synchronized and ready for momentum.
          </p>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* "+ Create" capsule button (exact look from Reference Image 2) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setCreateMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-bold shadow-sm transition-all cursor-pointer min-h-[38px] active:scale-95"
            >
              <Plus size={15} />
              <span>Create</span>
            </button>

            <AnimatePresence>
              {createMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setCreateMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                    transition={spring.snappy}
                    className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-[#12151D] border border-slate-200/90 dark:border-white/10 shadow-xl backdrop-blur-xl p-1.5 z-30 space-y-0.5 text-xs font-medium text-slate-700 dark:text-ink"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setCreateMenuOpen(false);
                        setQuickTaskModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                    >
                      <CheckSquare size={15} className="text-emerald-500" />
                      <span>New Task</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreateMenuOpen(false);
                        setDailyModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                    >
                      <CalendarCheck size={15} className="text-amber-500" />
                      <span>New Daily Ritual</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreateMenuOpen(false);
                        setHabitModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                    >
                      <Flame size={15} className="text-orange-500" />
                      <span>New Habit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreateMenuOpen(false);
                        openCalendarQuickAccess();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-left cursor-pointer border-t border-slate-100 dark:border-white/5 pt-1.5"
                    >
                      <Clock size={15} className="text-indigo-500" />
                      <span>Block Time Slot</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Search Button (magnifying glass) */}
          <button
            type="button"
            onClick={onOpenCommand}
            className="w-9 h-9 rounded-full bg-white dark:bg-white/[0.04] border border-slate-200/90 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-ink-muted hover:text-slate-900 dark:hover:text-ink hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
            title="Search & Commands (Cmd+K)"
          >
            <Search size={16} />
          </button>

          {/* Calendar Quick Access Button */}
          <button
            type="button"
            onClick={openCalendarQuickAccess}
            className="w-9 h-9 rounded-full bg-white dark:bg-white/[0.04] border border-slate-200/90 dark:border-white/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/80 transition-colors shadow-2xs cursor-pointer"
            title="Quick Calendar Agenda"
          >
            <CalendarDays size={16} />
          </button>

          {/* Notifications Bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="w-9 h-9 rounded-full bg-white dark:bg-white/[0.04] border border-slate-200/90 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-ink-muted hover:text-slate-900 dark:hover:text-ink hover:bg-slate-100 transition-colors shadow-2xs relative cursor-pointer"
            title="Notifications"
          >
            <Bell size={16} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] font-mono font-bold flex items-center justify-center shadow-xs">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* User Profile Avatar Pill */}
          <Link
            to="/profile"
            className="flex items-center pl-1 group cursor-pointer"
            title="Character Profile"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={displayName}
                className="w-9 h-9 rounded-full object-cover border border-slate-300 dark:border-white/20 group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/20 flex items-center justify-center text-slate-700 dark:text-ink font-bold text-xs group-hover:scale-105 transition-transform">
                {displayName?.[0]?.toUpperCase() || 'H'}
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* ── 2. Bento Grid Layout (Row 1) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── CARD 1: Overall Information (Dark Sleek Bento Card matching Image 2 top-left) ── */}
        <div className="lg:col-span-4 rounded-[28px] bg-[#12151D] text-white p-5 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex flex-col justify-between relative overflow-hidden">
          {/* Subtle atmospheric sheen */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-indigo-500/15 via-transparent to-transparent pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-slate-300 font-display">
              Overall Information
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={openBattleLogDrawer}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Battle Chronicles"
              >
                <Swords size={15} />
              </button>
              <button
                type="button"
                onClick={openAttributesDrawer}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Attributes Radar"
              >
                <Shield size={15} />
              </button>
            </div>
          </div>

          {/* Bold Core Numbers */}
          <div className="py-4 space-y-1 relative z-10">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold font-display tracking-tight text-white">
                {completedTasksCount + completedDailiesCount}
              </span>
              <span className="text-xs text-slate-400 font-medium leading-tight">
                actions conquered for all time
              </span>
            </div>

            <div className="flex items-center gap-3 pt-2 text-xs font-mono text-slate-300">
              <span className="flex items-center gap-1 font-bold text-amber-400">
                <Coins size={13} /> {gold} Coins
              </span>
              <span>•</span>
              <span className="text-slate-400">
                Level {level} Hero ({xp} / {xpForNextLevel} XP)
              </span>
            </div>

            {/* XP progress bar */}
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-300"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>

          {/* Three Inner Pill Tiles (exact composition matching Image 2 top-left card) */}
          <div className="grid grid-cols-3 gap-2 pt-2 relative z-10">
            <div className="rounded-2xl bg-[#1C202B] p-2.5 text-center border border-white/5">
              <div className="w-2 h-2 rounded-full bg-purple-400 mx-auto mb-1 opacity-80" />
              <span className="text-lg font-bold font-display text-white block leading-tight">
                {quests.length}
              </span>
              <span className="text-[10px] font-medium text-slate-400 block truncate">
                Projects
              </span>
            </div>

            <div className="rounded-2xl bg-[#1C202B] p-2.5 text-center border border-white/5">
              <div className="w-2 h-2 rounded-full bg-amber-400 mx-auto mb-1 opacity-80" />
              <span className="text-lg font-bold font-display text-white block leading-tight">
                {activeDailies.length}
              </span>
              <span className="text-[10px] font-medium text-slate-400 block truncate">
                Dailies
              </span>
            </div>

            <div className="rounded-2xl bg-[#1C202B] p-2.5 text-center border border-white/5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 mx-auto mb-1 opacity-80" />
              <span className="text-lg font-bold font-display text-white block leading-tight">
                {completedDailiesCount}
              </span>
              <span className="text-[10px] font-medium text-slate-400 block truncate">
                Completed
              </span>
            </div>
          </div>
        </div>

        {/* ── CARD 2: Weekly Progress (Smooth Spline Chart matching Image 2 center) ── */}
        <div className="lg:col-span-4 rounded-[28px] bg-white dark:bg-[#12151D] p-5 border border-slate-200/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-ink font-display block">
                Weekly progress
              </span>
              <div className="flex items-center gap-3 mt-1 text-[11px] font-medium text-slate-500 dark:text-ink-muted">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" /> Disciplines
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-white/30" /> Focus output
                </span>
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-500/25">
              +24%
            </span>
          </div>

          {/* Smooth Monotone Recharts Curve */}
          <div className="h-40 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyProgressData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="disciplinesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <Tooltip content={<CupertinoTooltip />} />
                <Area type="monotone" dataKey="Disciplines" stroke="#4F46E5" strokeWidth={2.5} fill="url(#disciplinesGrad)" />
                <Area type="monotone" dataKey="Focus" stroke="#94A3B8" strokeWidth={2} strokeDasharray="3 3" fill="url(#focusGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── CARD 3: Month Progress (Concentric Radial Velocity matching Image 2 right) ── */}
        <div className="lg:col-span-4 rounded-[28px] bg-white dark:bg-[#12151D] p-5 border border-slate-200/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-ink font-display block">
                Month progress
              </span>
              <span className="text-[11px] text-slate-500 dark:text-ink-muted">
                +20% compared to last month
              </span>
            </div>
            <TrendingUp size={16} className="text-slate-400" />
          </div>

          {/* Radial Concentric Gauge Mockup */}
          <div className="flex items-center justify-center py-3">
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* Outer Ring */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-white/5" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#4F46E5"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * Math.min(100, dailiesRate)) / 100}
                  fill="none"
                  className="transition-all duration-500"
                />
                {/* Inner Ring */}
                <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="6" className="text-slate-100 dark:text-white/5" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="30"
                  stroke="#10B981"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="188"
                  strokeDashoffset={188 - (188 * Math.min(100, habitsRate)) / 100}
                  fill="none"
                  className="transition-all duration-500"
                />
              </svg>

              <div className="absolute text-center">
                <span className="text-xl font-extrabold font-display text-slate-900 dark:text-ink block leading-none">
                  {dailiesRate || 100}%
                </span>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tight">
                  momentum
                </span>
              </div>
            </div>

            {/* Legend bullets matching Image 2 */}
            <div className="space-y-1.5 pl-4 text-xs font-medium text-slate-600 dark:text-ink-muted">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                <span>Rituals ({dailiesRate}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Habits ({habitsRate}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>Quests ({questsRate}%)</span>
              </div>
            </div>
          </div>

          {/* Action button */}
          <Link
            to="/insights"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-semibold text-slate-800 dark:text-ink transition-colors cursor-pointer"
          >
            <span>Review Insights & Telemetry</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── 3. Bento Grid Layout (Row 2) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── CARD 4: Daily Rituals & Goals (Checklist card matching Image 2 middle-left) ── */}
        <div className="lg:col-span-4 rounded-[28px] bg-white dark:bg-[#12151D] p-5 border border-slate-200/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <span className="text-xs font-bold text-slate-800 dark:text-ink font-display">
                Daily Rituals
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  {completedDailiesCount}/{activeDailies.length}
                </span>
                <button
                  type="button"
                  onClick={() => setDailyModalOpen(true)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-ink"
                  title="Add Daily"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {/* Rituals Checklist */}
            <div className="py-3 space-y-2.5">
              {activeDailies.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No daily rituals added yet.
                </div>
              ) : (
                activeDailies.slice(0, 4).map((d) => (
                  <div
                    key={d.id}
                    onClick={() => {
                      if (d.isCompleteToday) onUndoDaily(d.id, d);
                      else onCompleteDaily(d.id);
                    }}
                    className={clsx(
                      'flex items-center gap-3 p-2.5 rounded-2xl border transition-all cursor-pointer',
                      d.isCompleteToday
                        ? 'bg-slate-50 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/5 opacity-70'
                        : 'bg-white dark:bg-white/[0.04] border-slate-200/80 dark:border-white/10 hover:border-indigo-300 dark:hover:border-white/20 shadow-2xs'
                    )}
                  >
                    <div className="shrink-0 mt-0.5">
                      {d.isCompleteToday ? (
                        <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-500/20" />
                      ) : (
                        <Circle size={18} className="text-slate-300 dark:text-white/20 hover:text-emerald-400" />
                      )}
                    </div>
                    <span
                      className={clsx(
                        'text-xs font-semibold truncate flex-1',
                        d.isCompleteToday ? 'line-through text-slate-400 dark:text-ink-muted' : 'text-slate-800 dark:text-ink'
                      )}
                    >
                      {d.title}
                    </span>
                    {d.scheduledTime && (
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {d.scheduledTime}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <Link
            to="/dailies"
            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 pt-2"
          >
            <span>Manage all rituals ({activeDailies.length})</span>
            <ChevronRight size={13} />
          </Link>
        </div>

        {/* ── CARD 5: Tasks in Process (Horizontal/Vertical Cards Deck matching Image 2 center) ── */}
        <div className="lg:col-span-5 rounded-[28px] bg-slate-50/70 dark:bg-[#12151D]/60 p-4 border border-slate-200/70 dark:border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5">
              <span className="text-xs font-bold text-slate-800 dark:text-ink font-display">
                Task In Process ({activeTasks.length})
              </span>
              <Link
                to="/tasks"
                className="text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:text-ink-muted dark:hover:text-ink flex items-center gap-0.5"
              >
                <span>Open queue</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            {/* Horizontal Cards Layout matching Image 2 */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {activeTasks.slice(0, 2).map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl bg-white dark:bg-[#181C26] p-3.5 border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between min-h-[140px]"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-700 dark:text-ink">
                      <Briefcase size={14} />
                    </div>
                    <button
                      type="button"
                      onClick={() => onCompleteTask(t.id)}
                      className="text-slate-300 hover:text-emerald-500 transition-colors cursor-pointer"
                      title="Mark Complete"
                    >
                      <Circle size={16} />
                    </button>
                  </div>

                  <div className="py-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-ink line-clamp-2 leading-tight">
                      {t.title}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5">
                    <span className="text-[10px] font-mono text-slate-400">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString([], { month: 'numeric', day: 'numeric' }) : 'Backlog'}
                    </span>
                    <Bell size={12} className="text-slate-400" />
                  </div>
                </div>
              ))}

              {/* Dashed Border "+ Add task" card (exact component from Image 2!) */}
              <button
                type="button"
                onClick={() => setQuickTaskModalOpen(true)}
                className="rounded-2xl border-2 border-dashed border-slate-300/80 dark:border-white/15 hover:border-indigo-400 dark:hover:border-indigo-400/50 bg-white/40 hover:bg-white dark:bg-transparent dark:hover:bg-white/[0.02] flex flex-col items-center justify-center gap-1.5 p-4 text-center transition-all cursor-pointer min-h-[140px]"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-ink-muted">
                  <Plus size={16} />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-ink">
                  Add task
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ── CARD 6: Focus Sprint & Schedule Snippet ── */}
        <div className="lg:col-span-3 rounded-[28px] bg-white dark:bg-[#12151D] p-5 border border-slate-200/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-ink font-display">
                Focus Chamber
              </span>
              <Clock size={15} className="text-sky-500" />
            </div>

            <div className="py-2 space-y-2">
              {activeFocus ? (
                <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20">
                  <span className="text-[10px] font-mono font-bold text-sky-700 dark:text-sky-400 uppercase">
                    Session In Progress
                  </span>
                  <p className="text-xs font-bold text-slate-900 dark:text-ink mt-0.5 truncate">
                    {activeFocus.taskTitle || 'Deep Work Sprint'}
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                    Optimal Next Slot
                  </span>
                  <p className="text-xs font-bold text-slate-800 dark:text-ink mt-0.5">
                    45m Deep Work Sprint
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Link
              to="/focus"
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold text-xs transition-colors shadow-xs cursor-pointer"
            >
              <Play size={13} className="fill-current" />
              <span>{activeFocus ? 'Resume Sprint' : 'Start Focus'}</span>
            </Link>

            <button
              type="button"
              onClick={openCalendarQuickAccess}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-ink-muted dark:hover:text-ink transition-colors cursor-pointer"
            >
              <CalendarDays size={13} />
              <span>View Day Agenda</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. Bento Grid Layout (Row 3: "Last Projects" matching bottom row in Image 2) ── */}
      <div>
        <div className="flex items-center justify-between pb-3">
          <span className="text-xs font-bold uppercase tracking-wider font-display text-slate-800 dark:text-ink">
            Last Projects & Campaign Quests
          </span>
          <Link
            to="/quests"
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
          >
            <span>View all ({quests.length})</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* 3 Horizontal Bento Dark Cards matching Image 2 bottom row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quests.slice(0, 3).map((q) => {
            const items = q.items || [];
            const completedItems = items.filter((i) => i.isComplete).length;
            const progress = q.progressPercent || (items.length > 0 ? Math.round((completedItems / items.length) * 100) : 0);

            return (
              <Link
                key={q.id}
                to="/quests"
                className="rounded-[26px] bg-[#12151D] text-white p-4.5 border border-white/10 hover:border-white/25 transition-all shadow-md group flex flex-col justify-between min-h-[140px] cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                      {q.title}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> In progress
                    </span>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-mono text-xs font-bold text-white shrink-0 border border-white/15">
                    {progress}%
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <p className="text-[11px] text-slate-400 truncate">
                    {items.length > 0
                      ? `Task: ${items[0].title}`
                      : q.description || 'Milestone campaign roadmap'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Quick Task Modal ── */}
      <AnimatePresence>
        {quickTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-[28px] bg-white dark:bg-[#12151D] border border-slate-200 dark:border-white/10 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-display text-slate-900 dark:text-ink">
                  Add Task to Queue
                </h3>
                <button
                  type="button"
                  onClick={() => setQuickTaskModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-ink rounded-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTaskSubmit} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-mono text-slate-500 block mb-1">
                    TASK TITLE
                  </label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Finish system presentation..."
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-ink"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-500 block mb-1">
                      PRIORITY
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-ink"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-500 block mb-1">
                      PROJECT
                    </label>
                    <input
                      type="text"
                      value={taskProject}
                      onChange={(e) => setTaskProject(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-ink"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-500 block mb-1">
                    DUE DATE (OPTIONAL)
                  </label>
                  <input
                    type="datetime-local"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-800 dark:text-ink"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setQuickTaskModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createTaskMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Add Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Habit & Daily Modals */}
      <HabitModal
        isOpen={habitModalOpen}
        onClose={() => setHabitModalOpen(false)}
      />

      <DailyModal
        isOpen={dailyModalOpen}
        onClose={() => setDailyModalOpen(false)}
      />
    </div>
  );
}
