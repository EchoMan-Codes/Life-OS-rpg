import PropTypes from 'prop-types';
import { motion, useReducedMotion } from 'framer-motion';
import { Plus, Flame, Filter, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { RpgButton } from '@/components/rpg/RpgButton';

const HABIT_FILTERS = [
  { id: 'all', label: 'All Disciplines' },
  { id: 'positive', label: 'Positive (+)' },
  { id: 'both', label: 'Dual Flow (±)' },
  { id: 'negative', label: 'Reminders (-)' },
];

/**
 * HabitsHero — Tactical header deck for the Ritual Forge.
 * Features:
 * - System tag with pulsing status indicator
 * - Headline with dark-fantasy celestial typography
 * - Daily positive completion summary
 * - Primary CTA to trigger New Habit modal
 * - Interactive filter bar
 */
export function HabitsHero({
  totalHabits = 0,
  completedTodayCount = 0,
  activeFilter = 'all',
  onSelectFilter,
  onOpenCreateModal,
}) {
  const shouldReduceMotion = useReducedMotion();
  const completionPercent = totalHabits > 0 ? Math.round((completedTodayCount / totalHabits) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-glass-border bg-obsidian-900/80 backdrop-blur-xl p-5 sm:p-7 shadow-glass">
      {/* Subtle Arcane Glow Accents */}
      <div className="absolute top-0 right-1/4 w-72 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-1/3 w-80 h-36 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cybernetic Corner Brackets */}
      <div className="absolute top-2 left-2 text-cyan-400/40 text-[10px] font-mono select-none pointer-events-none">┌</div>
      <div className="absolute top-2 right-2 text-cyan-400/40 text-[10px] font-mono select-none pointer-events-none">┐</div>
      <div className="absolute bottom-2 left-2 text-cyan-400/40 text-[10px] font-mono select-none pointer-events-none">└</div>
      <div className="absolute bottom-2 right-2 text-cyan-400/40 text-[10px] font-mono select-none pointer-events-none">┘</div>

      {/* Top Deck: System Tag & Quick Progress */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
          <span className="text-[11px] font-mono font-bold tracking-widest text-cyan-400/90 uppercase">
            [ RITUAL FORGE // REAL-TIME CONSISTENCY ]
          </span>
        </div>

        {totalHabits > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-950/70 border border-cyan-500/20 text-xs font-mono text-cyan-300/90">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {completedTodayCount} of {totalHabits} forged today ({completionPercent}%)
            </span>
          </div>
        )}
      </div>

      {/* Main Row: Headline & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Flame className="w-6 h-6 fill-current text-cyan-400" />
            </span>
            <span>Habits & Disciplines</span>
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Every small repetition fuels a stronger real-life character. Log positive executions or hold accountability on slips.
          </p>
        </div>

        <RpgButton
          variant="primary"
          size="md"
          icon={Plus}
          onClick={onOpenCreateModal}
          className="self-start sm:self-auto shrink-0"
        >
          <span>+ New Ritual</span>
        </RpgButton>
      </div>

      {/* Filter Tabs */}
      <div className="mt-6 pt-4 border-t border-glass-border/60 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center text-ink-muted text-xs font-mono mr-1 shrink-0">
          <Filter className="w-3.5 h-3.5 mr-1 text-cyan-400/70" />
          <span className="hidden sm:inline">FILTER:</span>
        </div>
        {HABIT_FILTERS.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectFilter(tab.id)}
              className={clsx(
                'relative px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all duration-200 whitespace-nowrap cursor-pointer select-none',
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-ink-muted hover:text-ink hover:bg-white/5 border border-transparent'
              )}
            >
              {isActive && !shouldReduceMotion && (
                <motion.div
                  layoutId="activeFilterGlow"
                  className="absolute inset-0 rounded-lg bg-cyan-400/10 pointer-events-none"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

HabitsHero.propTypes = {
  totalHabits: PropTypes.number,
  completedTodayCount: PropTypes.number,
  activeFilter: PropTypes.string,
  onSelectFilter: PropTypes.func.isRequired,
  onOpenCreateModal: PropTypes.func.isRequired,
};
