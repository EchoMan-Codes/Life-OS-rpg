import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Scroll,
  Plus,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  CircleDot,
  LogIn,
} from 'lucide-react';
import clsx from 'clsx';

import { useAuth } from '@/features/auth/hooks';
import { useQuests } from '@/features/quests/hooks';
import { QuestCard } from '@/components/quests/QuestCard';
import { QuestModal } from '@/components/quests/QuestModal';

const STATUS_FILTERS = [
  { id: 'all', label: 'All Quests' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
];

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function QuestsPage() {
  const { isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('board'); // 'board' | 'list'
  const [modalOpen, setModalOpen] = useState(false);
  const [questToEdit, setQuestToEdit] = useState(null);

  // Fetch all quests so board can distribute into columns
  const { data: quests = [], isLoading, isError } = useQuests({ status: 'all' });

  // Filtered quests
  const filteredQuests = useMemo(() => {
    return quests.filter((q) => {
      if (statusFilter === 'active') return q.status === 'active';
      if (statusFilter === 'completed') return q.status === 'completed';
      return true;
    });
  }, [quests, statusFilter]);

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

    for (const q of quests) {
      if (q.status === 'completed') {
        done.push(q);
      } else if ((q.completedItems || 0) > 0) {
        inProgress.push(q);
      } else {
        todo.push(q);
      }
    }

    return { todo, inProgress, done };
  }, [quests]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = quests.length;
    const completed = quests.filter((q) => q.status === 'completed').length;
    const active = quests.filter((q) => q.status === 'active').length;
    const subtasksDone = quests.reduce((sum, q) => sum + (q.completedItems || 0), 0);
    return { total, completed, active, subtasksDone };
  }, [quests]);

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
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="p-8 rounded-panel bg-obsidian-900/80 border border-glass-border backdrop-blur-glass shadow-panel max-w-md mx-auto flex flex-col items-center gap-4">
          <div className="p-3 rounded-full bg-attr-intelligence/10 text-attr-intelligence">
            <Scroll className="w-8 h-8" />
          </div>
          <h2 className="text-display-sm text-ink font-semibold">Quests & Milestones</h2>
          <p className="text-body-sm text-ink-muted">
            Embark on multi-step campaigns, complete checklists, and hit milestone thresholds to earn powerful XP and Gold. Sign in to track your adventures.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-glass/15 border border-glass-border text-ink text-body-sm">
            <LogIn className="w-4 h-4 text-attr-intelligence" />
            <span>Sign in from the menu to access your Quest Log</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-attr-intelligence uppercase tracking-wider mb-1">
            <span>Multi-Step Campaigns</span>
            <span>•</span>
            <span>25% / 50% / 75% / 100% Milestones</span>
          </div>
          <h1 className="text-display-md text-ink flex items-center gap-2.5">
            <Scroll className="w-7 h-7 text-attr-intelligence" />
            <span>Quest Board</span>
          </h1>
        </div>

        {/* New Quest CTA button (>= 44x44px target) */}
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-attr-intelligence text-obsidian-950 font-semibold text-sm hover:bg-attr-intelligence/90 shadow-glow transition-all cursor-pointer min-h-[44px]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Quest</span>
        </button>
      </div>

      {/* ── Stats Ribbon ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-panel bg-obsidian-900/60 border border-glass-border flex flex-col">
          <span className="text-xs text-ink-muted font-medium">Total Quests</span>
          <span className="text-display-xs text-ink font-bold mt-1">{stats.total}</span>
        </div>
        <div className="p-3.5 rounded-panel bg-obsidian-900/60 border border-glass-border flex flex-col">
          <span className="text-xs text-attr-intelligence font-medium">Active Quests</span>
          <span className="text-display-xs text-attr-intelligence font-bold mt-1">{stats.active}</span>
        </div>
        <div className="p-3.5 rounded-panel bg-obsidian-900/60 border border-glass-border flex flex-col">
          <span className="text-xs text-attr-vitality font-medium">Completed</span>
          <span className="text-display-xs text-attr-vitality font-bold mt-1">{stats.completed}</span>
        </div>
        <div className="p-3.5 rounded-panel bg-obsidian-900/60 border border-glass-border flex flex-col">
          <span className="text-xs text-gold font-medium">Subtasks Conquered</span>
          <span className="text-display-xs text-gold font-bold mt-1">{stats.subtasksDone}</span>
        </div>
      </div>

      {/* ── Controls Bar: Filter Tabs & View Switcher ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-glass-border/30">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-obsidian-950/60 border border-glass-border self-start">
          {STATUS_FILTERS.map((f) => {
            const isActive = statusFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer min-h-[36px]',
                  isActive
                    ? 'bg-glass/20 text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink hover:bg-glass/10'
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle: Board vs List */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-obsidian-950/60 border border-glass-border self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('board')}
            aria-label="Board view"
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer min-h-[36px]',
              viewMode === 'board'
                ? 'bg-attr-intelligence/20 text-attr-intelligence border border-attr-intelligence/40'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Board</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-label="List view"
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer min-h-[36px]',
              viewMode === 'list'
                ? 'bg-attr-intelligence/20 text-attr-intelligence border border-attr-intelligence/40'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Priority List</span>
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {isError && (
        <div className="p-4 rounded-panel bg-hp/10 border border-hp/30 text-hp text-body-sm">
          Failed to load quests. Please check your connection.
        </div>
      )}

      {/* ── Loading Skeleton ── */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-48 rounded-panel bg-obsidian-900/40 border border-glass-border animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Quests Content ── */}
      {!isLoading && !isError && (
        <>
          {/* Empty State */}
          {quests.length === 0 ? (
            <div className="p-10 rounded-panel bg-obsidian-900/40 border border-glass-border text-center flex flex-col items-center gap-3">
              <div className="p-3 rounded-full bg-glass/10 text-ink-muted">
                <Scroll className="w-6 h-6" />
              </div>
              <h3 className="text-display-xs text-ink font-semibold">Your Quest Log is Empty</h3>
              <p className="text-body-sm text-ink-muted max-w-sm">
                No active quests. Establish your first quest campaign, define checklist subtasks, and hit milestones for massive rewards!
              </p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-attr-intelligence text-obsidian-950 font-semibold text-xs hover:bg-attr-intelligence/90 shadow-glow cursor-pointer min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Embark on First Quest</span>
              </button>
            </div>
          ) : viewMode === 'board' ? (
            /* ── Three-Column Board View ── */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
              {/* Column 1: To Do */}
              <div className="flex flex-col gap-3 rounded-panel p-3 bg-obsidian-950/40 border border-glass-border/40">
                <div className="flex items-center justify-between px-2 py-1">
                  <div className="flex items-center gap-2 text-body-sm font-semibold text-ink">
                    <CircleDot className="w-4 h-4 text-ink-muted" />
                    <span>To Do</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-obsidian-800 text-ink-muted">
                    {boardColumns.todo.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3 min-h-[120px]">
                  <AnimatePresence mode="popLayout">
                    {boardColumns.todo.map((q) => (
                      <QuestCard key={q.id} quest={q} onEdit={handleOpenEdit} />
                    ))}
                  </AnimatePresence>
                  {boardColumns.todo.length === 0 && (
                    <div className="p-6 text-center text-xs text-ink-muted italic border border-dashed border-glass-border/30 rounded-lg">
                      No quests in To Do
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: In Progress */}
              <div className="flex flex-col gap-3 rounded-panel p-3 bg-obsidian-950/40 border border-glass-border/40">
                <div className="flex items-center justify-between px-2 py-1">
                  <div className="flex items-center gap-2 text-body-sm font-semibold text-attr-intelligence">
                    <Clock className="w-4 h-4" />
                    <span>In Progress</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-attr-intelligence/15 text-attr-intelligence">
                    {boardColumns.inProgress.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3 min-h-[120px]">
                  <AnimatePresence mode="popLayout">
                    {boardColumns.inProgress.map((q) => (
                      <QuestCard key={q.id} quest={q} onEdit={handleOpenEdit} />
                    ))}
                  </AnimatePresence>
                  {boardColumns.inProgress.length === 0 && (
                    <div className="p-6 text-center text-xs text-ink-muted italic border border-dashed border-glass-border/30 rounded-lg">
                      No quests currently in progress
                    </div>
                  )}
                </div>
              </div>

              {/* Column 3: Done */}
              <div className="flex flex-col gap-3 rounded-panel p-3 bg-obsidian-950/40 border border-glass-border/40">
                <div className="flex items-center justify-between px-2 py-1">
                  <div className="flex items-center gap-2 text-body-sm font-semibold text-attr-vitality">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Done</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-attr-vitality/15 text-attr-vitality">
                    {boardColumns.done.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3 min-h-[120px]">
                  <AnimatePresence mode="popLayout">
                    {boardColumns.done.map((q) => (
                      <QuestCard key={q.id} quest={q} onEdit={handleOpenEdit} />
                    ))}
                  </AnimatePresence>
                  {boardColumns.done.length === 0 && (
                    <div className="p-6 text-center text-xs text-ink-muted italic border border-dashed border-glass-border/30 rounded-lg">
                      No completed quests yet
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
                <div className="p-8 text-center text-body-sm text-ink-muted border border-dashed border-glass-border rounded-panel">
                  No quests match this filter.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Create / Edit Modal ── */}
      <QuestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        questToEdit={questToEdit}
      />
    </div>
  );
}
