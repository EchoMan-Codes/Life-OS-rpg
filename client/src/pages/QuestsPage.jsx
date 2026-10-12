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
  AlertTriangle,
  Wand2,
  Calendar,
  Layers,
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
  { id: 'expired', label: 'Expired ⏳' },
  { id: 'archived', label: 'Archived' },
];

const HORIZON_TABS = [
  { id: 'all', label: 'All Horizons' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
  { id: 'custom', label: 'Custom' },
];

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function QuestsPage() {
  const { isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');
  const [horizonFilter, setHorizonFilter] = useState('all');
  const [viewMode, setViewMode] = useState('board'); // 'board' | 'list'
  const [modalOpen, setModalOpen] = useState(false);
  const [questToEdit, setQuestToEdit] = useState(null);

  // Fetch all quests (including archived)
  const { data: quests = [], isLoading, isError } = useQuests({ status: 'all', includeArchived: true });

  // Separate active and archived quests
  const nonArchivedQuests = useMemo(() => {
    return quests.filter((q) => !q.archivedAt);
  }, [quests]);

  const archivedQuests = useMemo(() => {
    return quests.filter((q) => Boolean(q.archivedAt));
  }, [quests]);

  // Active Quota Counts for Balanced Limits (Weekly 3, Monthly 3, Yearly 1)
  const quotaStats = useMemo(() => {
    const active = nonArchivedQuests.filter((q) => q.status === 'active');
    const weekly = active.filter((q) => (q.limitCategory || q.questType || q.type) === 'weekly').length;
    const monthly = active.filter((q) => (q.limitCategory || q.questType || q.type) === 'monthly').length;
    const yearly = active.filter((q) => (q.limitCategory || q.questType || q.type) === 'yearly').length;

    return {
      weekly: { count: weekly, max: 3, isFull: weekly >= 3 },
      monthly: { count: monthly, max: 3, isFull: monthly >= 3 },
      yearly: { count: yearly, max: 1, isFull: yearly >= 1 },
    };
  }, [nonArchivedQuests]);

  // Filtered quests based on status and horizon
  const filteredQuests = useMemo(() => {
    let list = statusFilter === 'archived' ? archivedQuests : nonArchivedQuests;

    if (statusFilter !== 'all' && statusFilter !== 'archived') {
      list = list.filter((q) => q.status === statusFilter);
    }

    if (horizonFilter !== 'all') {
      list = list.filter((q) => (q.questType || q.type || 'weekly') === horizonFilter);
    }

    return list;
  }, [nonArchivedQuests, archivedQuests, statusFilter, horizonFilter]);

  // Priority sorted list
  const prioritySortedQuests = useMemo(() => {
    return [...filteredQuests].sort((a, b) => {
      const pA = PRIORITY_ORDER[a.priority] ?? 2;
      const pB = PRIORITY_ORDER[b.priority] ?? 2;
      if (pA !== pB) return pA - pB;
      return (b.progressPercent || 0) - (a.progressPercent || 0);
    });
  }, [filteredQuests]);

  // Board columns (built from filtered quests)
  const boardColumns = useMemo(() => {
    const todo = [];
    const inProgress = [];
    const done = [];

    for (const q of filteredQuests) {
      if (q.status === 'completed') {
        done.push(q);
      } else if (q.status === 'expired') {
        todo.push(q);
      } else if ((q.currentValue || 0) > 0 || (q.completedItems || 0) > 0) {
        inProgress.push(q);
      } else {
        todo.push(q);
      }
    }

    return { todo, inProgress, done };
  }, [filteredQuests]);

  // Overall stats
  const stats = useMemo(() => {
    const total = nonArchivedQuests.length;
    const completed = nonArchivedQuests.filter((q) => q.status === 'completed').length;
    const active = nonArchivedQuests.filter((q) => q.status === 'active').length;
    const expired = nonArchivedQuests.filter((q) => q.status === 'expired').length;
    return { total, completed, active, expired };
  }, [nonArchivedQuests]);

  const handleOpenCreate = () => {
    setQuestToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (quest) => {
    setQuestToEdit(quest);
    setModalOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-2xl space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-gold mx-auto shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <Scroll size={28} />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-gold font-semibold">
              Jeevan Quests
            </span>
            <h2 className="text-2xl font-extrabold text-ink tracking-tight font-display">
              Unified Challenge System
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Connect high-level objectives with daily execution. Balanced active limits ensure focus without cognitive overload.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/onboarding"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-ink text-obsidian font-semibold text-sm hover:bg-ink/90 transition-all shadow-lg min-h-[44px]"
            >
              <span>Initialize Jeevan</span>
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
      {/* ── 1. Glassy Cockpit Header with Active Quotas Meter ── */}
      <section className="relative rounded-3xl p-5 sm:p-7 bg-white/[0.04] border border-white/12 shadow-[0_16px_48px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.18)] backdrop-blur-2xl overflow-hidden">
        <div className="absolute -top-24 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-gold text-xs font-mono font-semibold">
              <Sparkles size={13} className="text-amber-400" />
              <span>JEEVAN QUESTS • WEEKLY (3) · MONTHLY (3) · YEARLY (1)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-display">
              Quest Cockpit
            </h1>

            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-xl">
              Turn long-term aspirations into measurable milestones. Active quest limits protect your focus from burnout while rewarding authentic execution.
            </p>

            {/* Active Quotas Bandwidth Indicators */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/8 text-xs font-mono">
                <span className="text-ink-muted">Weekly:</span>
                <span className={clsx('font-bold', quotaStats.weekly.isFull ? 'text-amber-400' : 'text-sky-300')}>
                  {quotaStats.weekly.count} / {quotaStats.weekly.max}
                </span>
                {quotaStats.weekly.isFull && <span className="text-[10px] text-amber-400 font-semibold">(Maxed)</span>}
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/8 text-xs font-mono">
                <span className="text-ink-muted">Monthly:</span>
                <span className={clsx('font-bold', quotaStats.monthly.isFull ? 'text-amber-400' : 'text-purple-300')}>
                  {quotaStats.monthly.count} / {quotaStats.monthly.max}
                </span>
                {quotaStats.monthly.isFull && <span className="text-[10px] text-amber-400 font-semibold">(Maxed)</span>}
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/8 text-xs font-mono">
                <span className="text-ink-muted">Yearly:</span>
                <span className={clsx('font-bold', quotaStats.yearly.isFull ? 'text-amber-400' : 'text-amber-300')}>
                  {quotaStats.yearly.count} / {quotaStats.yearly.max}
                </span>
                {quotaStats.yearly.isFull && <span className="text-[10px] text-amber-400 font-semibold">(Maxed)</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <motion.button
              type="button"
              onClick={handleOpenCreate}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              transition={spring.snappy}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs sm:text-sm hover:from-amber-400 hover:to-amber-500 transition-all shadow-[0_8px_24px_rgba(245,158,11,0.3)] min-h-[46px] cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>New Quest</span>
            </motion.button>
          </div>
        </div>
      </section>

      {/* ── 2. Glance Metric Strip ── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-xs space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Total Enrolled</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-ink">{stats.total}</p>
          <span className="text-[10px] text-ink-muted font-mono">In quest catalog</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-xs space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Active In Flight</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-sky-400 flex items-center gap-1.5">
            <Clock size={18} />
            <span>{stats.active}</span>
          </p>
          <span className="text-[10px] text-sky-400/80 font-mono">Tracking now</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-xs space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Conquered</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 size={18} />
            <span>{stats.completed}</span>
          </p>
          <span className="text-[10px] text-emerald-400/80 font-mono">100% achieved</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-xs space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Overdue / Expired</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-rose-400 flex items-center gap-1.5">
            <AlertTriangle size={18} />
            <span>{stats.expired}</span>
          </p>
          <span className="text-[10px] text-rose-400/80 font-mono">Extendable recovery</span>
        </div>
      </section>

      {/* ── 3. Horizon Tabs & Status Filters ── */}
      <div className="flex flex-col gap-3">
        {/* Horizon Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {HORIZON_TABS.map((h) => {
            const isActive = horizonFilter === h.id;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => setHorizonFilter(h.id)}
                className={clsx(
                  'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                  isActive
                    ? 'bg-amber-500/20 text-gold border border-amber-500/40 shadow-xs'
                    : 'text-ink-muted hover:text-ink bg-white/[0.03] hover:bg-white/[0.06] border border-white/8'
                )}
              >
                {h.label}
              </button>
            );
          })}
        </div>

        {/* Status Filters & View Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl flex items-center gap-1 overflow-x-auto">
            {STATUS_FILTERS.map((f) => {
              const isActive = statusFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={clsx(
                    'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer',
                    isActive
                      ? 'bg-white/15 text-ink font-bold shadow-xs'
                      : 'text-ink-muted hover:text-ink hover:bg-white/5'
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl flex items-center gap-1 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              aria-label="Board view"
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                viewMode === 'board'
                  ? 'bg-amber-500/20 text-gold font-bold'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="List view"
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                viewMode === 'list'
                  ? 'bg-amber-500/20 text-gold font-bold'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              <List size={14} />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. Quests Board / List Content ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-48 rounded-3xl bg-white/[0.02] border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 text-center text-rose-400 text-sm rounded-3xl bg-rose-500/10 border border-rose-500/20">
          Failed to load quests. Please check your connection.
        </div>
      ) : filteredQuests.length === 0 ? (
        <div className="p-10 sm:p-14 text-center rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-xs space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-gold">
            <Scroll size={26} />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-ink">
            {statusFilter === 'archived' ? 'No Archived Quests' : 'No Quests In Horizon'}
          </h3>
          <p className="text-xs sm:text-sm text-ink-muted max-w-sm mx-auto leading-relaxed">
            {statusFilter === 'archived'
              ? 'Archived campaigns will appear here.'
              : 'No quests currently match this filter. Initiate a new challenge to boost your attributes!'}
          </p>
          {statusFilter !== 'archived' && (
            <motion.button
              type="button"
              onClick={handleOpenCreate}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Initiate First Quest</span>
            </motion.button>
          )}
        </div>
      ) : viewMode === 'board' && statusFilter !== 'archived' ? (
        /* ── Three-Column Board View ── */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {/* Column 1: Awaiting / To Do */}
          <div className="flex flex-col gap-3 rounded-3xl p-3.5 sm:p-4 bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-xs">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2 text-xs font-bold text-ink">
                <CircleDot size={15} className="text-ink-muted" />
                <span>To Do / Pending</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-white/5 border border-white/10 text-ink-muted">
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
                <div className="p-8 text-center text-xs text-ink-muted italic border border-dashed border-white/10 rounded-2xl">
                  No pending quests
                </div>
              )}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="flex flex-col gap-3 rounded-3xl p-3.5 sm:p-4 bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-xs">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Clock size={15} />
                <span>In Progress</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-amber-500/15 border border-amber-500/30 text-gold">
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
                <div className="p-8 text-center text-xs text-ink-muted italic border border-dashed border-white/10 rounded-2xl">
                  No active quests in progress
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Conquered */}
          <div className="flex flex-col gap-3 rounded-3xl p-3.5 sm:p-4 bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-xs">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <CheckCircle2 size={15} />
                <span>Conquered</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
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
                <div className="p-8 text-center text-xs text-ink-muted italic border border-dashed border-white/10 rounded-2xl">
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
