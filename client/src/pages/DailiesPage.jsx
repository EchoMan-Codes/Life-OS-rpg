import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CalendarCheck, Plus, Filter, Sparkles, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

import { useDailies } from '@/features/dailies/hooks';
import { DailyCard } from '@/components/dailies/DailyCard';
import { DailyModal } from '@/components/dailies/DailyModal';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'due', label: 'Due Today' },
  { id: 'completed', label: 'Completed' },
  { id: 'pending', label: 'Pending' },
];

export default function DailiesPage() {
  const { data: dailies = [], isLoading, isError } = useDailies();
  const [activeFilter, setActiveFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [dailyToEdit, setDailyToEdit] = useState(null);

  const currentWeekday = new Date().getDay();

  // Filtered dailies
  const filteredDailies = useMemo(() => {
    return dailies.filter((d) => {
      const isDue = (d.activeDays || [0, 1, 2, 3, 4, 5, 6]).includes(currentWeekday);
      const isDone = Boolean(d.isCompleteToday);

      if (activeFilter === 'due') return isDue;
      if (activeFilter === 'completed') return isDone;
      if (activeFilter === 'pending') return isDue && !isDone;
      return true;
    });
  }, [dailies, activeFilter, currentWeekday]);

  // Statistics
  const dueCount = useMemo(() => {
    return dailies.filter((d) => (d.activeDays || [0, 1, 2, 3, 4, 5, 6]).includes(currentWeekday)).length;
  }, [dailies, currentWeekday]);

  const completedCount = useMemo(() => {
    return dailies.filter((d) => Boolean(d.isCompleteToday)).length;
  }, [dailies]);

  const bestOverallStreak = useMemo(() => {
    if (!dailies.length) return 0;
    return Math.max(...dailies.map((d) => d.streakBest || 0), 0);
  }, [dailies]);

  const handleOpenCreate = () => {
    setDailyToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (daily) => {
    setDailyToEdit(daily);
    setModalOpen(true);
  };

  const todayFormatted = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-attr-perception uppercase tracking-wider mb-1">
            <span>{todayFormatted}</span>
            <span>•</span>
            <span>Local Midnight Reset</span>
          </div>
          <h1 className="text-display-md text-ink flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-attr-perception" />
            <span>Daily Rituals</span>
          </h1>
          <p className="text-body-sm text-ink-muted mt-1 max-w-2xl">
            Binary rituals that refresh each night. Complete them before midnight to build streaks and protect your HP.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-panel bg-attr-perception text-obsidian-950 font-semibold text-xs hover:bg-attr-perception/90 active:scale-95 transition-all shadow-glow-perception self-start sm:self-auto min-h-[44px]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Daily</span>
        </button>
      </div>

      {/* ── Stats Ribbon ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-panel bg-obsidian-900/80 border border-glass-border shadow-panel">
          <span className="text-[11px] uppercase tracking-wider text-ink-muted font-medium">Due Today</span>
          <p className="text-display-xs text-ink mt-0.5">{dueCount}</p>
        </div>
        <div className="p-3.5 rounded-panel bg-obsidian-900/80 border border-glass-border shadow-panel">
          <span className="text-[11px] uppercase tracking-wider text-ink-muted font-medium">Completed</span>
          <p className="text-display-xs text-attr-vitality mt-0.5 flex items-center gap-1.5">
            <CheckCircle2 size={18} />
            <span>{completedCount}</span>
          </p>
        </div>
        <div className="p-3.5 rounded-panel bg-obsidian-900/80 border border-glass-border shadow-panel">
          <span className="text-[11px] uppercase tracking-wider text-ink-muted font-medium">Best Streak</span>
          <p className="text-display-xs text-attr-strength mt-0.5">{bestOverallStreak}d</p>
        </div>
        <div className="p-3.5 rounded-panel bg-obsidian-900/80 border border-glass-border shadow-panel">
          <span className="text-[11px] uppercase tracking-wider text-ink-muted font-medium">Day Progress</span>
          <p className="text-display-xs text-attr-perception mt-0.5">
            {dueCount > 0 ? `${Math.round((completedCount / dueCount) * 100)}%` : '100%'}
          </p>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-ink-muted shrink-0 mr-1" />
        {FILTERS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveFilter(tab.id)}
            className={clsx(
              'px-3.5 py-1.5 rounded-panel text-xs font-medium transition-all whitespace-nowrap min-h-[36px]',
              activeFilter === tab.id
                ? 'bg-glass text-ink border border-glass-border shadow-panel'
                : 'text-ink-muted hover:text-ink hover:bg-glass/40'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Dailies List ── */}
      {isLoading ? (
        <div className="p-12 text-center text-ink-muted text-sm animate-pulse">
          Consulting the chronicles of daily rituals...
        </div>
      ) : isError ? (
        <div className="p-4 rounded-panel bg-attr-strength/10 border border-attr-strength/30 text-attr-strength text-sm">
          Failed to load daily rituals. Please verify your connection.
        </div>
      ) : filteredDailies.length === 0 ? (
        <div className="p-12 rounded-panel border border-dashed border-glass-border text-center space-y-3 bg-obsidian-900/40">
          <div className="w-12 h-12 rounded-full bg-attr-perception/10 text-attr-perception flex items-center justify-center mx-auto">
            <Sparkles size={24} />
          </div>
          <h2 className="text-sm font-semibold text-ink">
            {dailies.length === 0 ? 'No Daily Rituals Yet' : 'No Dailies Match Filter'}
          </h2>
          <p className="text-xs text-ink-muted max-w-sm mx-auto">
            {dailies.length === 0
              ? 'Establish recurring rituals to protect your HP and gain XP/Gold every day.'
              : 'Try selecting a different filter tab above to view your other rituals.'}
          </p>
          {dailies.length === 0 && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 text-xs font-semibold text-obsidian-950 bg-attr-perception rounded-panel hover:bg-attr-perception/90 transition-colors min-h-[44px]"
            >
              Create First Daily
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          <AnimatePresence initial={false}>
            {filteredDailies.map((daily) => (
              <DailyCard key={daily.id} daily={daily} onEdit={handleOpenEdit} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      <DailyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        dailyToEdit={dailyToEdit}
      />
    </div>
  );
}
