import PropTypes from 'prop-types';
import { motion, useReducedMotion } from 'framer-motion';
import { Plus, Flame, Filter, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { RpgButton } from '@/components/rpg/RpgButton';
import { ForgePanel, ForgeChamber } from '@/components/habits/RitualFrame';

const HABIT_FILTERS = [
  { id: 'all', label: 'All Disciplines' },
  { id: 'positive', label: 'Positive (+)' },
  { id: 'both', label: 'Dual Flow (±)' },
  { id: 'negative', label: 'Reminders (-)' },
];

/**
 * HabitsHero — Tactical Structural Holographic Command Deck for the Ritual Forge.
 *
 * Implements the Structural Object Mandate:
 * - Angular rails with animated traveling energy seams and central crest emitter
 * - Segmented side pylons and mechanical corner brackets
 * - Inset dark-glass plane with framed internal chambers
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
    <ForgePanel
      variant="neutral"
      hasCrest={true}
      innerClassName="p-5 sm:p-7"
    >
      {/* Background Arcane Ambient Accents */}
      <div className="absolute top-0 right-1/4 w-80 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-1/3 w-80 h-36 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* ══════════════════════════════════════════════════
          CHAMBER 1: SYSTEM TELEMETRY & DAILY SUMMARY BAR
          ══════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-obsidian-950/80 border border-cyan-500/20">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
          <span className="text-[11px] font-mono font-bold tracking-widest text-cyan-300 uppercase">
            [ RITUAL FORGE // DISCIPLINE TELEMETRY ]
          </span>
        </div>

        {totalHabits > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-xs font-mono text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {completedTodayCount} of {totalHabits} forged today ({completionPercent}%)
            </span>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          CHAMBER 2: MAIN COMMAND DECK & PRIMARY ACTION
          ══════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-linear-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.3)]">
              <Flame className="w-6 h-6 fill-current text-cyan-400" />
            </span>
            <span>Habits & Disciplines</span>
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Every conscious repetition forges a stronger real-life character. Log positive executions or maintain accountability on slips.
          </p>
        </div>

        <RpgButton
          variant="primary"
          size="md"
          icon={Plus}
          onClick={onOpenCreateModal}
          className="self-start sm:self-auto shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
        >
          <span>+ New Ritual</span>
        </RpgButton>
      </div>

      {/* ══════════════════════════════════════════════════
          CHAMBER 3: INSET TACTICAL FILTER MOUNT
          ══════════════════════════════════════════════════ */}
      <ForgeChamber
        variant="inset"
        className="mt-6 flex items-center gap-2 overflow-x-auto p-2 scrollbar-none"
      >
        <div className="flex items-center text-ink-muted text-xs font-mono px-2 shrink-0">
          <Filter className="w-3.5 h-3.5 mr-1.5 text-cyan-400/80" />
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
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
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
      </ForgeChamber>
    </ForgePanel>
  );
}

HabitsHero.propTypes = {
  totalHabits: PropTypes.number,
  completedTodayCount: PropTypes.number,
  activeFilter: PropTypes.string,
  onSelectFilter: PropTypes.func.isRequired,
  onOpenCreateModal: PropTypes.func.isRequired,
};

