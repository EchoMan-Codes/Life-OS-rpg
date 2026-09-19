import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus } from 'lucide-react';

import { useHabits, useHabitActivity } from '@/features/habits/hooks';
import { HabitsHero } from '@/components/habits/HabitsHero';
import { HabitsTelemetryStrip } from '@/components/habits/HabitsTelemetryStrip';
import { WeeklyConsistencyModule } from '@/components/habits/WeeklyConsistencyModule';
import { HabitActivityModule } from '@/components/habits/HabitActivityModule';
import { HabitCard } from '@/components/habits/HabitCard';
import { HabitModal } from '@/components/habits/HabitModal';
import { HabitsAtmosphere } from '@/components/habits/HabitsAtmosphere';
import { RpgButton } from '@/components/rpg/RpgButton';

export default function HabitsPage() {
  const { data: habits = [], isLoading: isHabitsLoading, isError: isHabitsError } = useHabits();
  const { data: activityData, isLoading: isActivityLoading } = useHabitActivity({ recentLimit: 10 });

  const [activeFilter, setActiveFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState(null);

  const completedHabitIdsToday = activityData?.completedHabitIdsToday || [];

  const filteredHabits = useMemo(() => {
    if (activeFilter === 'all') return habits;
    return habits.filter((h) => h.direction === activeFilter);
  }, [habits, activeFilter]);

  const bestOverallStreak = useMemo(() => {
    if (!habits.length) return 0;
    return Math.max(...habits.map((h) => h.bestStreak || 0), 0);
  }, [habits]);

  const activeStreaksCount = useMemo(() => {
    return habits.filter((h) => (h.currentStreak || 0) >= 1).length;
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
    <div className="relative min-h-screen pb-16 space-y-6 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Route-Scoped Celestial Atmosphere with 3D Core & Fallback */}
      <HabitsAtmosphere hasActiveStreaks={activeStreaksCount > 0} />

      {/* 1. Hero Deck */}
      <HabitsHero
        totalHabits={habits.length}
        completedTodayCount={completedHabitIdsToday.length}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        onOpenCreateModal={handleOpenCreate}
      />

      {/* 2. Telemetry Metrics Strip */}
      <HabitsTelemetryStrip
        totalHabits={habits.length}
        completedTodayCount={completedHabitIdsToday.length}
        bestOverallStreak={bestOverallStreak}
        activeStreaksCount={activeStreaksCount}
      />

      {/* 3. Mathematically Complete 7-Day Consistency Cadence */}
      <WeeklyConsistencyModule
        calendarDays={activityData?.calendarDays || []}
        dailyCompletions={activityData?.dailyCompletions || {}}
        todayDate={activityData?.todayDate || ''}
        weeklyTotal={activityData?.weeklyTotal || 0}
        isLoading={isActivityLoading}
      />

      {/* 4. Active Rituals Card Grid */}
      <section aria-labelledby="rituals-list-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
              [ ACTIVE RITUAL MATRIX ]
            </span>
          </div>
          <span className="text-xs font-mono text-ink-muted">
            {filteredHabits.length} discipline{filteredHabits.length === 1 ? '' : 's'} displayed
          </span>
        </div>

        {isHabitsLoading ? (
          <div className="py-16 text-center text-xs font-mono text-ink-muted animate-pulse rounded-2xl bg-obsidian-900/40 border border-glass-border">
            Loading ritual matrix from PostgreSQL...
          </div>
        ) : isHabitsError ? (
          <div className="py-12 text-center text-xs font-mono text-rose-400 rounded-2xl bg-obsidian-900/40 border border-rose-500/30">
            Failed to synchronize rituals. Please check network connection.
          </div>
        ) : filteredHabits.length === 0 ? (
          <div className="p-10 sm:p-12 text-center rounded-2xl bg-obsidian-900/60 border border-dashed border-glass-border shadow-glass">
            <div className="w-12 h-12 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold font-mono text-ink">No Rituals In Current Filter</h3>
            <p className="text-xs text-ink-muted max-w-sm mx-auto mt-1.5 mb-5 leading-relaxed">
              {activeFilter === 'all'
                ? 'Begin forging your daily discipline character by registering your first tracked ritual.'
                : `No disciplines currently match the "${activeFilter}" filter.`}
            </p>
            <RpgButton
              variant="primary"
              size="md"
              icon={Plus}
              onClick={handleOpenCreate}
            >
              <span>+ Forge First Ritual</span>
            </RpgButton>
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
                  transition={{ duration: 0.2 }}
                >
                  <HabitCard
                    habit={habit}
                    onEdit={handleOpenEdit}
                    isCompletedToday={completedHabitIdsToday.includes(habit.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* 5. Discipline Momentum & Recent Scoring Audit */}
      <HabitActivityModule
        habits={habits}
        recentLogs={activityData?.recentLogs || []}
        isLoading={isActivityLoading}
      />

      {/* Habit Creation & Edit Modal */}
      <HabitModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        habitToEdit={habitToEdit}
      />
    </div>
  );
}
