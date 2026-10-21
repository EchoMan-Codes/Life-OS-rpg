import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scroll,
  Plus,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  CircleDot,
  LogIn,
  Sparkles,
  Trophy,
  Target,
  Search,
  Flame,
  Zap,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

import { useAuth } from '@/features/auth/hooks';
import { useQuests } from '@/features/quests/hooks';
import { QuestCard } from '@/components/quests/QuestCard';
import { QuestModal } from '@/components/quests/QuestModal';
import { JeevanLoader } from '@/components/ui/JeevanLoader';
import { spring } from '@/lib/motionVariants';

const STATUS_FILTERS = [
  { id: 'all', label: 'All Quests' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'archived', label: 'Archived' },
];

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function QuestsPage() {
  const { isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('board'); // 'board' | 'list'
  const [modalOpen, setModalOpen] = useState(false);
  const [questToEdit, setQuestToEdit] = useState(null);

  // Fetch all quests (including archived)
  const { data: quests = [], isLoading, isError } = useQuests({ status: 'all', includeArchived: true });

  // Separate active and archived quests
  const activeQuests = useMemo(() => {
    return quests.filter((q) => !q.archivedAt);
  }, [quests]);

  const archivedQuests = useMemo(() => {
    return quests.filter((q) => Boolean(q.archivedAt));
  }, [quests]);

  // Filtered quests based on current status filter & search query
  const filteredQuests = useMemo(() => {
    let list = statusFilter === 'archived' ? archivedQuests : activeQuests;

    if (statusFilter === 'active') {
      list = list.filter((q) => q.status === 'active');
    } else if (statusFilter === 'completed') {
      list = list.filter((q) => q.status === 'completed');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeQuests, archivedQuests, statusFilter, searchQuery]);

  // Priority sorted list
  const prioritySortedQuests = useMemo(() => {
    return [...filteredQuests].sort((a, b) => {
      const pA = PRIORITY_ORDER[a.priority] ?? 2;
      const pB = PRIORITY_ORDER[b.priority] ?? 2;
      if (pA !== pB) return pA - pB;
      return (b.progressPercent || 0) - (a.progressPercent || 0);
    });
  }, [filteredQuests]);

  // Board columns:
  // 1. To Do: active quests with 0 subtasks completed
  // 2. In Progress: active quests with >0 subtasks completed
  // 3. Done: completed quests
  const boardColumns = useMemo(() => {
    const todo = [];
    const inProgress = [];
    const done = [];

    for (const q of filteredQuests) {
      if (q.status === 'completed') {
        done.push(q);
      } else if ((q.completedItems || 0) > 0) {
        inProgress.push(q);
      } else {
        todo.push(q);
      }
    }

    return { todo, inProgress, done };
  }, [filteredQuests]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = activeQuests.length;
    const completed = activeQuests.filter((q) => q.status === 'completed').length;
    const active = activeQuests.filter((q) => q.status === 'active').length;
    const subtasksDone = activeQuests.reduce((sum, q) => sum + (q.completedItems || 0), 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, active, subtasksDone, completionRate };
  }, [activeQuests]);

  const handleOpenCreate = () => {
    setQuestToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (quest) => {
    setQuestToEdit(quest);
    setModalOpen(true);
  };

  // Guest State
  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="p-8 sm:p-10 rounded-3xl bg-white/70 dark:bg-obsidian-900/80 border border-slate-200 dark:border-glass-border backdrop-blur-2xl shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500/20 to-amber-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-500 mx-auto shadow-[0_0_30px_rgba(99,102,241,0.2)]">
            <Scroll size={30} />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-500 font-semibold">
              Campaign Sanctum
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-ink tracking-tight font-display">
              Quest Board & Milestones
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-ink-muted leading-relaxed max-w-sm mx-auto">
              Embark on multi-step campaigns, complete checklists, and hit 25% / 50% / 75% / 100% milestone thresholds to unlock immense XP and Gold.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/onboarding"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-all shadow-md min-h-[44px]"
            >
              <span>Initialize Jeevan</span>
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/80 dark:bg-white/[0.05] hover:bg-slate-100 dark:hover:bg-white/[0.09] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-ink font-semibold text-sm transition-all min-h-[44px]"
            >
              <LogIn size={15} />
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 select-none">
      {/* ── 1. Cosmic Glass Cockpit Header ── */}
      <section className="relative rounded-3xl p-5 sm:p-7 bg-white/50 dark:bg-white/[0.035] border border-slate-200/80 dark:border-white/12 shadow-[0_10px_35px_rgba(0,0,0,0.03)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.35)] backdrop-blur-2xl overflow-hidden">
        {/* Ambient atmospheric glows */}
        <div className="absolute -top-24 -left-20 w-80 h-80 bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-400 text-xs font-mono font-semibold">
              <Scroll size={13} className="text-indigo-500" />
              <span>CAMPAIGN PROTOCOLS • 25% / 50% / 75% / 100% MILESTONES</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-ink tracking-tight font-display flex items-center gap-3">
              <span>Quest Board</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-gold border border-amber-500/30">
                {stats.completionRate}% Conquered
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-ink-muted leading-relaxed max-w-xl">
              Break major achievements into sequential milestones. Completing subtasks grants instant rewards and automatically unlocks tiered milestone bonuses.
            </p>
          </div>

          {/* New Quest CTA button (>= 44x44px touch area) */}
          <motion.button
            type="button"
            onClick={handleOpenCreate}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={spring.snappy}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-[0_8px_24px_rgba(99,102,241,0.25)] transition-all cursor-pointer min-h-[46px] shrink-0 self-start md:self-auto"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Embark on Quest</span>
          </motion.button>
        </div>
      </section>

      {/* ── 2. Signature Stats Ribbon ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-obsidian-900/60 border border-slate-200/80 dark:border-glass-border flex flex-col shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-ink-muted font-medium">
            <span>Total Campaigns</span>
            <Target size={14} className="text-slate-400" />
          </div>
          <span className="text-2xl text-slate-900 dark:text-ink font-bold mt-1.5 font-display">
            {stats.total}
          </span>
          <span className="text-[10px] font-mono text-slate-400 mt-0.5">Enrolled campaigns</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-obsidian-900/60 border border-slate-200/80 dark:border-glass-border flex flex-col shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            <span>Active Quests</span>
            <Clock size={14} className="text-indigo-500" />
          </div>
          <span className="text-2xl text-indigo-600 dark:text-indigo-400 font-bold mt-1.5 font-display">
            {stats.active}
          </span>
          <span className="text-[10px] font-mono text-indigo-500/70 mt-0.5">Underway now</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-obsidian-900/60 border border-slate-200/80 dark:border-glass-border flex flex-col shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <span>Conquered</span>
            <CheckCircle2 size={14} className="text-emerald-500" />
          </div>
          <span className="text-2xl text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 font-display">
            {stats.completed}
          </span>
          <span className="text-[10px] font-mono text-emerald-500/70 mt-0.5">Victory achieved</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-obsidian-900/60 border border-slate-200/80 dark:border-glass-border flex flex-col shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-medium">
            <span>Subtasks Cleared</span>
            <Trophy size={14} className="text-amber-500" />
          </div>
          <span className="text-2xl text-amber-600 dark:text-amber-400 font-bold mt-1.5 font-display">
            {stats.subtasksDone}
          </span>
          <span className="text-[10px] font-mono text-amber-500/70 mt-0.5">Checklist steps</span>
        </div>
      </div>

      {/* ── 3. Controls & Filter Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/80 dark:border-glass-border/40">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-obsidian-950/60 border border-slate-200/80 dark:border-glass-border self-start overflow-x-auto max-w-full">
          {STATUS_FILTERS.map((f) => {
            const isActive = statusFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={clsx(
                  'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap min-h-[36px]',
                  isActive
                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-ink shadow-xs font-bold'
                    : 'text-slate-500 dark:text-ink-muted hover:text-slate-900 dark:hover:text-ink hover:bg-white/50 dark:hover:bg-white/5'
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Right Search & View Switcher */}
        <div className="flex items-center gap-2 justify-between sm:justify-end">
          {/* Quick Search Input */}
          <div className="relative w-44 sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-ink-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search campaigns..."
              className="w-full pl-8 pr-8 py-2 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-ink placeholder:text-slate-400 dark:placeholder:text-ink-muted/50 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[36px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-ink cursor-pointer p-0.5"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* View Mode Toggle: Board vs List */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-obsidian-950/60 border border-slate-200/80 dark:border-glass-border shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              aria-label="Board view"
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[34px]',
                viewMode === 'board'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-ink-muted hover:text-slate-900 dark:hover:text-ink'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="Priority List view"
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[34px]',
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-ink-muted hover:text-slate-900 dark:hover:text-ink'
              )}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Priority List</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. Quests Board / List Content ── */}
      {isLoading ? (
        <div className="py-20 flex items-center justify-center">
          <JeevanLoader
            variant="medium"
            message="Calibrating Quest Log..."
            submessage="Aligning campaign milestones & rewards"
          />
        </div>
      ) : isError ? (
        <div className="p-6 text-center text-red-500 text-sm rounded-2xl bg-red-500/10 border border-red-500/20">
          Failed to load quests. Please check your connection.
        </div>
      ) : filteredQuests.length === 0 ? (
        <div className="p-10 sm:p-14 text-center rounded-3xl bg-white/70 dark:bg-obsidian-900/60 border border-slate-200/80 dark:border-glass-border backdrop-blur-xl shadow-xs space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500">
            <Scroll size={26} />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-ink">
            {searchQuery
              ? 'No Quests Match Your Search'
              : statusFilter === 'archived'
              ? 'No Archived Quests'
              : 'Your Quest Log is Empty'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-ink-muted max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? `No campaign titles or descriptions matched "${searchQuery}".`
              : statusFilter === 'archived'
              ? 'You have not archived any quests yet. Active quests can be archived from their options menu.'
              : 'No active campaigns. Establish your first quest, define subtasks, and conquer milestones for substantial XP and Gold!'}
          </p>
          {statusFilter !== 'archived' && !searchQuery && (
            <motion.button
              type="button"
              onClick={handleOpenCreate}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Embark on First Quest</span>
            </motion.button>
          )}
        </div>
      ) : viewMode === 'board' && statusFilter !== 'archived' ? (
        /* ── Three-Column Board View ── */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {/* Column 1: To Do */}
          <div className="flex flex-col gap-3 rounded-3xl p-3.5 sm:p-4 bg-slate-100/70 dark:bg-obsidian-950/40 border border-slate-200/80 dark:border-glass-border/40 backdrop-blur-xl shadow-xs">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-ink">
                <CircleDot size={15} className="text-slate-400 dark:text-ink-muted" />
                <span>To Do</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-white dark:bg-obsidian-800 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-ink-muted">
                {boardColumns.todo.length}
              </span>
            </div>

            <div className="flex flex-col gap-3 min-h-[140px]">
              <AnimatePresence mode="popLayout">
                {boardColumns.todo.map((q) => (
                  <QuestCard key={q.id} quest={q} onEdit={handleOpenEdit} />
                ))}
              </AnimatePresence>
              {boardColumns.todo.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-ink-muted italic border border-dashed border-slate-300 dark:border-glass-border/30 rounded-2xl">
                  No quests awaiting initiation
                </div>
              )}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="flex flex-col gap-3 rounded-3xl p-3.5 sm:p-4 bg-slate-100/70 dark:bg-obsidian-950/40 border border-slate-200/80 dark:border-glass-border/40 backdrop-blur-xl shadow-xs">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                <Clock size={15} className="text-indigo-600 dark:text-indigo-400" />
                <span>In Progress</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300">
                {boardColumns.inProgress.length}
              </span>
            </div>

            <div className="flex flex-col gap-3 min-h-[140px]">
              <AnimatePresence mode="popLayout">
                {boardColumns.inProgress.map((q) => (
                  <QuestCard key={q.id} quest={q} onEdit={handleOpenEdit} />
                ))}
              </AnimatePresence>
              {boardColumns.inProgress.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-ink-muted italic border border-dashed border-slate-300 dark:border-glass-border/30 rounded-2xl">
                  No quests currently underway
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Done / Conquered */}
          <div className="flex flex-col gap-3 rounded-3xl p-3.5 sm:p-4 bg-slate-100/70 dark:bg-obsidian-950/40 border border-slate-200/80 dark:border-glass-border/40 backdrop-blur-xl shadow-xs">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                <span>Conquered</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                {boardColumns.done.length}
              </span>
            </div>

            <div className="flex flex-col gap-3 min-h-[140px]">
              <AnimatePresence mode="popLayout">
                {boardColumns.done.map((q) => (
                  <QuestCard key={q.id} quest={q} onEdit={handleOpenEdit} />
                ))}
              </AnimatePresence>
              {boardColumns.done.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-ink-muted italic border border-dashed border-slate-300 dark:border-glass-border/30 rounded-2xl">
                  No conquered quests yet
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── Flat Priority List View ── */
        <div className="flex flex-col gap-3.5">
          <AnimatePresence mode="popLayout">
            {prioritySortedQuests.map((q) => (
              <QuestCard key={q.id} quest={q} onEdit={handleOpenEdit} />
            ))}
          </AnimatePresence>
          {prioritySortedQuests.length === 0 && (
            <div className="p-10 text-center text-xs text-ink-muted border border-dashed border-slate-300 dark:border-glass-border rounded-2xl">
              No quests match this filter.
            </div>
          )}
        </div>
      )}

      {/* Quest Creation & Edit Modal */}
      <QuestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        questToEdit={questToEdit}
      />
    </div>
  );
}
