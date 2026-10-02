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
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

import { useAuth } from '@/features/auth/hooks';
import { useQuests } from '@/features/quests/hooks';
import { QuestCard } from '@/components/quests/QuestCard';
import { QuestModal } from '@/components/quests/QuestModal';
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
  const [viewMode, setViewMode] = useState('board'); // 'board' | 'list'
  const [modalOpen, setModalOpen] = useState(false);
  const [questToEdit, setQuestToEdit] = useState(null);

  // Fetch all quests (including archived) so board & archives can distribute properly
  const { data: quests = [], isLoading, isError } = useQuests({ status: 'all', includeArchived: true });

  // Separate active and archived quests
  const activeQuests = useMemo(() => {
    return quests.filter((q) => !q.archivedAt);
  }, [quests]);

  const archivedQuests = useMemo(() => {
    return quests.filter((q) => Boolean(q.archivedAt));
  }, [quests]);

  // Filtered quests based on current status filter
  const filteredQuests = useMemo(() => {
    if (statusFilter === 'archived') {
      return archivedQuests;
    }
    return activeQuests.filter((q) => {
      if (statusFilter === 'active') return q.status === 'active';
      if (statusFilter === 'completed') return q.status === 'completed';
      return true;
    });
  }, [activeQuests, archivedQuests, statusFilter]);

  // Priority sorted list
  const prioritySortedQuests = useMemo(() => {
    return [...filteredQuests].sort((a, b) => {
      const pA = PRIORITY_ORDER[a.priority] ?? 2;
      const pB = PRIORITY_ORDER[b.priority] ?? 2;
      if (pA !== pB) return pA - pB;
      return (b.progressPercent || 0) - (a.progressPercent || 0);
    });
  }, [filteredQuests]);

  // Board columns (built from active quests only)
  const boardColumns = useMemo(() => {
    const todo = [];
    const inProgress = [];
    const done = [];

    for (const q of activeQuests) {
      if (q.status === 'completed') {
        done.push(q);
      } else if ((q.completedItems || 0) > 0) {
        inProgress.push(q);
      } else {
        todo.push(q);
      }
    }

    return { todo, inProgress, done };
  }, [activeQuests]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = activeQuests.length;
    const completed = activeQuests.filter((q) => q.status === 'completed').length;
    const active = activeQuests.filter((q) => q.status === 'active').length;
    const subtasksDone = activeQuests.reduce((sum, q) => sum + (q.completedItems || 0), 0);
    return { total, completed, active, subtasksDone };
  }, [activeQuests]);

  const handleOpenCreate = () => {
    setQuestToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (quest) => {
    setQuestToEdit(quest);
    setModalOpen(true);
  };

  // Guest State with iOS Glassy Gateway
  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-2xl space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 mx-auto shadow-[0_0_30px_rgba(139,92,246,0.2)]">
            <Scroll size={28} />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-violet-400 font-semibold">
              Campaign Sanctum
            </span>
            <h2 className="text-2xl font-extrabold text-ink tracking-tight font-display">
              Quest Board & Milestones
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Embark on multi-step campaigns, complete checklists, and hit 25% / 50% / 75% / 100% milestone thresholds to unlock immense XP and Gold.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/onboarding"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-ink text-obsidian font-semibold text-sm hover:bg-ink/90 transition-all shadow-lg min-h-[44px]"
            >
              <span>Initialize LifeOS</span>
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-ink font-semibold text-sm transition-all min-h-[44px]"
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
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* ── 1. Glassy Cockpit Header (Astral Violet Theme) ── */}
      <section className="relative rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-white via-violet-50/40 to-slate-50 border border-slate-200/80 shadow-[0_10px_35px_rgba(0,0,0,0.05)] dark:from-obsidian-900/85 dark:via-obsidian-900/65 dark:to-obsidian-800/75 dark:border-white/15 dark:shadow-[0_16px_48px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-2xl overflow-hidden">
        {/* Ambient violet & indigo glow */}
        <div className="absolute -top-24 -left-20 w-80 h-80 bg-violet-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-700 dark:text-violet-300 text-xs font-mono font-semibold">
              <Sparkles size={13} className="text-violet-600 dark:text-violet-400" />
              <span>CAMPAIGN DECK • 25% / 50% / 75% / 100% THRESHOLDS</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-ink tracking-tight font-display">
              Quest Log & Milestones
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-ink-muted leading-relaxed max-w-xl">
              Break down complex projects into actionable checklists. Progressing through quest milestones yields proportional XP, character stat increments, and gold.
            </p>
          </div>

          <motion.button
            type="button"
            onClick={handleOpenCreate}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            transition={spring.snappy}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs sm:text-sm hover:from-violet-500 hover:to-indigo-500 transition-all shadow-[0_8px_24px_rgba(139,92,246,0.35)] self-start sm:self-auto min-h-[46px]"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Quest</span>
          </motion.button>
        </div>
      </section>

      {/* ── 2. Unified iOS Glance Metric Strip ── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-ink-muted">Total Campaigns</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-ink">{stats.total}</p>
          <span className="text-[10px] text-slate-400 dark:text-ink-muted font-mono">Enrolled in log</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-ink-muted">Active Missions</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
            <Clock size={18} className="text-violet-600 dark:text-violet-400" />
            <span>{stats.active}</span>
          </p>
          <span className="text-[10px] text-violet-600/80 dark:text-violet-400/80 font-mono">In progress</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-ink-muted">Conquered</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 size={18} className="text-emerald-500" />
            <span>{stats.completed}</span>
          </p>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-mono">100% completed</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-ink-muted">Subtasks Cleared</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-gold flex items-center gap-1.5">
            <Zap size={18} className="text-amber-500" />
            <span>{stats.subtasksDone}</span>
          </p>
          <span className="text-[10px] text-slate-400 dark:text-ink-muted font-mono">Checklist items</span>
        </div>
      </section>

      {/* ── 3. iOS Frosted Segmented Controls Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Capsule */}
        <div className="p-1 rounded-full bg-slate-100/90 dark:bg-obsidian-900/80 border border-slate-200/90 dark:border-white/10 shadow-inner backdrop-blur-md flex items-center gap-1 self-start">
          {STATUS_FILTERS.map((f) => {
            const isActive = statusFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={clsx(
                  'px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-violet-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-ink-muted dark:hover:text-ink hover:bg-slate-200/60 dark:hover:bg-white/5'
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle Capsule (Board vs List) */}
        <div className="p-1 rounded-full bg-slate-100/90 dark:bg-obsidian-900/80 border border-slate-200/90 dark:border-white/10 shadow-inner backdrop-blur-md flex items-center gap-1 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('board')}
            aria-label="Board view"
            className={clsx(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all',
              viewMode === 'board'
                ? 'bg-violet-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-ink-muted dark:hover:text-ink hover:bg-slate-200/60 dark:hover:bg-white/5'
            )}
          >
            <LayoutGrid size={14} />
            <span className="hidden sm:inline">Board</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-label="Priority List view"
            className={clsx(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all',
              viewMode === 'list'
                ? 'bg-violet-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-ink-muted dark:hover:text-ink hover:bg-slate-200/60 dark:hover:bg-white/5'
            )}
          >
            <List size={14} />
            <span className="hidden sm:inline">Priority List</span>
          </button>
        </div>
      </div>

      {/* ── 4. Quests Board / List Content ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-48 rounded-2xl bg-slate-100/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 text-center text-red-500 text-sm rounded-2xl bg-red-500/10 border border-red-500/20">
          Failed to load quests. Please check your connection.
        </div>
      ) : filteredQuests.length === 0 ? (
        <div className="p-10 sm:p-14 text-center rounded-3xl bg-white/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <Scroll size={26} />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-ink">
            {statusFilter === 'archived' ? 'No Archived Quests' : 'Your Quest Log is Empty'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-ink-muted max-w-sm mx-auto leading-relaxed">
            {statusFilter === 'archived'
              ? 'You have not archived any quests yet. Active quests can be archived from their options menu.'
              : 'No active campaigns. Establish your first quest, define subtasks, and conquer milestones for substantial XP and Gold!'}
          </p>
          {statusFilter !== 'archived' && (
            <motion.button
              type="button"
              onClick={handleOpenCreate}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-5 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-all shadow-md inline-flex items-center gap-1.5"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Embark on First Quest</span>
            </motion.button>
          )}
        </div>
      ) : viewMode === 'board' && statusFilter !== 'archived' ? (
        /* ── Three-Column iOS Frosted Board View ── */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {/* Column 1: To Do */}
          <div className="flex flex-col gap-3 rounded-3xl p-3.5 sm:p-4 bg-slate-100/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-ink">
                <CircleDot size={15} className="text-slate-400 dark:text-ink-muted" />
                <span>To Do</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-ink-muted">
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
                <div className="p-8 text-center text-xs text-slate-400 dark:text-ink-muted italic border border-dashed border-slate-300 dark:border-white/10 rounded-2xl">
                  No quests awaiting initiation
                </div>
              )}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="flex flex-col gap-3 rounded-3xl p-3.5 sm:p-4 bg-slate-100/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2 text-xs font-bold text-violet-700 dark:text-violet-300">
                <Clock size={15} className="text-violet-600 dark:text-violet-400" />
                <span>In Progress</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-violet-500/15 border border-violet-500/30 text-violet-700 dark:text-violet-300">
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
                <div className="p-8 text-center text-xs text-slate-400 dark:text-ink-muted italic border border-dashed border-slate-300 dark:border-white/10 rounded-2xl">
                  No quests currently underway
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Done */}
          <div className="flex flex-col gap-3 rounded-3xl p-3.5 sm:p-4 bg-slate-100/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs">
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
                <div className="p-8 text-center text-xs text-slate-400 dark:text-ink-muted italic border border-dashed border-slate-300 dark:border-white/10 rounded-2xl">
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
            <div className="p-10 text-center text-xs text-ink-muted border border-dashed border-white/10 rounded-2xl">
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
