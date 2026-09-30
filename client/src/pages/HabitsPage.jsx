import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Plus, Sparkles, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import clsx from 'clsx';

import { useHabits } from '@/features/habits/hooks';
import { HabitCard, HabitModal, HabitMomentumRibbon } from '@/components/habits';
import { spring } from '@/lib/motionVariants';

const FILTERS = [
  { id: 'all', label: 'All Habits' },
  { id: 'positive', label: 'Positive (+)' },
  { id: 'both', label: 'Dual (+ / -)' },
  { id: 'negative', label: 'Negative (-)' },
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

  const totalCompletions = useMemo(() => {
    return habits.reduce((acc, h) => acc + (h.positiveCount || 0), 0);
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
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* ── 1. Glassy Cockpit Header (Flame / Amber Theme) ── */}
      <section className="relative rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-white via-amber-50/40 to-slate-50 border border-slate-200/80 shadow-[0_10px_35px_rgba(0,0,0,0.05)] dark:from-obsidian-900/85 dark:via-obsidian-900/65 dark:to-obsidian-800/75 dark:border-white/15 dark:shadow-[0_16px_48px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-2xl overflow-hidden">
        {/* Ambient atmospheric glows */}
        <div className="absolute -top-24 -left-20 w-80 h-80 bg-amber-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 -right-20 w-64 h-64 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-mono font-semibold">
              <Flame size={13} className="fill-amber-500 animate-pulse" />
              <span>STREAK ENGINE • WILLPOWER & GRIT</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-ink tracking-tight font-display">
              Habits & Momentum
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-ink-muted leading-relaxed max-w-xl">
              Forge positive disciplines and conquer detrimental routines. Swipe right on cards to log success (+XP), or swipe left to hold yourself accountable.
            </p>
          </div>

          <motion.button
            type="button"
            onClick={handleOpenCreate}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            transition={spring.snappy}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs sm:text-sm hover:from-amber-400 hover:to-amber-300 transition-all shadow-[0_8px_24px_rgba(245,158,11,0.25)] self-start sm:self-auto min-h-[46px]"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Forge Habit</span>
          </motion.button>
        </div>
      </section>

      {/* ── 2. Unique Connected 7-Day Habit Momentum Wave ── */}
      <HabitMomentumRibbon
        habits={habits}
        bestOverallStreak={bestOverallStreak}
        totalCompletions={totalCompletions}
      />

      {/* ── 3. iOS Frosted Segmented Filter Capsule ── */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="p-1 rounded-full bg-slate-100/90 dark:bg-obsidian-900/80 border border-slate-200/90 dark:border-white/10 shadow-inner backdrop-blur-md flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={clsx(
                  'px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-ink-muted dark:hover:text-ink hover:bg-slate-200/60 dark:hover:bg-white/5'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <span className="text-[11px] font-mono text-slate-400 dark:text-ink-faint hidden sm:inline">
          Showing {filteredHabits.length} of {habits.length}
        </span>
      </div>

      {/* ── 4. Habits List / Empty State ── */}
      {isLoading ? (
        <div className="py-20 text-center text-ink-muted text-sm animate-pulse space-y-2">
          <Flame size={28} className="mx-auto text-amber-500 animate-bounce" />
          <p>Loading discipline protocols...</p>
        </div>
      ) : isError ? (
        <div className="p-6 text-center text-red-400 text-sm rounded-2xl bg-red-500/10 border border-red-500/20">
          Failed to load habits. Please verify your connection.
        </div>
      ) : filteredHabits.length === 0 ? (
        <div className="p-10 sm:p-14 text-center rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-lg space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles size={26} />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-ink">No habits found</h3>
          <p className="text-xs sm:text-sm text-ink-muted max-w-sm mx-auto leading-relaxed">
            {activeFilter === 'all'
              ? 'Start building your character attributes by forging your first daily discipline.'
              : `No habits match the "${activeFilter}" filter.`}
          </p>
          <motion.button
            type="button"
            onClick={handleOpenCreate}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-obsidian font-bold text-xs hover:bg-amber-400 transition-all shadow-md inline-flex items-center gap-1.5"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Create First Habit</span>
          </motion.button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredHabits.map((habit) => (
              <motion.div
                key={habit.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={spring.ios}
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
