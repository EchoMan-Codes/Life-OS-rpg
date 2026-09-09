import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Plus, Filter, Sparkles } from 'lucide-react';
import clsx from 'clsx';

import { useHabits } from '@/features/habits/hooks';
import { HabitCard } from '@/components/habits/HabitCard';
import { HabitModal } from '@/components/habits/HabitModal';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'positive', label: 'Positive' },
  { id: 'both', label: 'Both (+ / -)' },
  { id: 'negative', label: 'Negative' },
];

export default function HabitsPage() {
  const { data: habits = [], isLoading, isError } = useHabits();
  const [activeFilter, setActiveFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState(null);

  const filteredHabits = useMemo(() => {
    if (activeFilter === 'all') return habits;
    return habits.filter((h) => h.direction === activeFilter);
  }, [habits, activeFilter]);

  const bestOverallStreak = useMemo(() => {
    if (!habits.length) return 0;
    return Math.max(...habits.map((h) => h.bestStreak || 0), 0);
  }, [habits]);

  const handleOpenCreate = () => {
    setHabitToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (habit) => {
    setHabitToEdit(habit);
    setModalOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display-md text-ink flex items-center gap-2.5">
            <Flame className="w-7 h-7 text-xp fill-xp" />
            <span>Habits & Streaks</span>
          </h1>
          <p className="text-body-sm text-ink-muted mt-1">
            Build disciplines through daily momentum. Swipe right to reward, swipe left to log slips.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-xp to-gold text-obsidian-950 font-semibold text-body-xs hover:opacity-90 active:scale-95 transition-all shadow-glass self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-obsidian-900/60 border border-glass-border shadow-glass">
          <span className="text-body-2xs uppercase tracking-wider text-ink-muted">Total Habits</span>
          <p className="text-display-xs text-ink mt-0.5">{habits.length}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-obsidian-900/60 border border-glass-border shadow-glass">
          <span className="text-body-2xs uppercase tracking-wider text-ink-muted">Best Streak</span>
          <p className="text-display-xs text-xp mt-0.5 flex items-center gap-1">
            <Flame className="w-5 h-5 fill-xp text-xp inline" />
            <span>{bestOverallStreak}</span>
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-obsidian-900/60 border border-glass-border shadow-glass">
          <span className="text-body-2xs uppercase tracking-wider text-ink-muted">Tactile Gesture</span>
          <p className="text-body-xs text-mana mt-1">Swipe card $\pm 80$px to score</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-ink-muted shrink-0 mr-1" />
        {FILTERS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveFilter(tab.id)}
            className={clsx(
              'px-3.5 py-1.5 rounded-xl text-body-xs font-medium transition-all whitespace-nowrap',
              activeFilter === tab.id
                ? 'bg-glass-border-strong text-ink shadow-glass'
                : 'text-ink-muted hover:text-ink hover:bg-glass/40'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="py-16 text-center text-ink-muted text-body-sm animate-pulse">
          Loading habits from PostgreSQL...
        </div>
      ) : isError ? (
        <div className="py-12 text-center text-attr-strength text-body-sm">
          Failed to load habits. Please check your connection.
        </div>
      ) : filteredHabits.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-obsidian-900/40 border border-glass-border shadow-glass">
          <div className="w-12 h-12 mx-auto rounded-full bg-xp/10 flex items-center justify-center text-xp mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-display-xs text-ink">No habits found</h3>
          <p className="text-body-xs text-ink-muted max-w-sm mx-auto mt-1 mb-4">
            {activeFilter === 'all'
              ? 'Start building your character stats by tracking your first daily discipline.'
              : `No habits found matching the "${activeFilter}" filter.`}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-xp to-gold text-obsidian-950 font-semibold text-body-xs hover:opacity-90 active:scale-95 transition-all shadow-glass"
          >
            Create First Habit
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredHabits.map((habit) => (
              <motion.div
                key={habit.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <HabitCard habit={habit} onEdit={handleOpenEdit} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Habit Creation & Edit Modal */}
      <HabitModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        habitToEdit={habitToEdit}
      />
    </div>
  );
}
