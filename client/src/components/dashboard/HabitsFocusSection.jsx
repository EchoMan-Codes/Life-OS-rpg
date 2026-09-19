import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Flame, Plus, Minus, ArrowRight } from 'lucide-react';

import { useScoreHabit } from '@/features/habits/hooks';
import { Card } from '@/components/ui/Card';

/**
 * HabitsFocusSection — Tactical habit streaks & momentum scoring.
 */
export function HabitsFocusSection({
  topHabits = [],
  className = '',
}) {
  return (
    <section className={clsx('space-y-3.5 select-none', className)}>
      <div className="flex items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-display-xs text-ink font-display font-bold flex items-center gap-2">
            <Flame size={16} className="text-amber-400 shrink-0" />
            <span>MOMENTUM & HABITS</span>
          </h2>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-obsidian-800 text-ink-muted border border-glass-border">
            [{topHabits.length} ACTIVE]
          </span>
        </div>

        <Link
          to="/habits"
          className="text-caption font-mono text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 shrink-0"
        >
          <span>HABIT MATRIX</span>
          <ArrowRight size={12} />
        </Link>
      </div>

      {topHabits.length === 0 ? (
        <Card variant="surface" className="p-6 text-center flex flex-col items-center justify-center space-y-2.5">
          <Flame size={24} className="text-ink-muted" />
          <div>
            <p className="text-sm font-display font-semibold text-ink">No habit protocols tracked.</p>
            <p className="text-caption text-ink-muted">
              Forge daily consistency with positive micro-habits that reward character XP.
            </p>
          </div>
          <Link
            to="/habits"
            className="mt-1 px-3.5 py-1.5 rounded-panel text-xs font-mono font-medium bg-glass hover:bg-glass/80 border border-glass-border text-ink transition-colors"
          >
            + INITIALIZE HABIT
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {topHabits.map((habit) => (
            <HabitScoreCard key={habit.id} habit={habit} />
          ))}
        </div>
      )}
    </section>
  );
}

function HabitScoreCard({ habit }) {
  const scoreMutation = useScoreHabit(habit.id);
  const allowPositive = habit.direction === 'positive' || habit.direction === 'both';
  const allowNegative = habit.direction === 'negative' || habit.direction === 'both';

  return (
    <Card
      variant="surface"
      className="p-3.5 flex items-center justify-between gap-3 hover:border-glass-border-strong transition-all relative overflow-hidden group"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-display font-bold text-ink truncate">
            {habit.title}
          </span>
          {(habit.streak || 0) > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-mono font-bold text-amber-300 shrink-0 px-1.5 py-0.2 rounded bg-amber-950/50 border border-amber-800/50">
              <Flame size={11} className="text-amber-400" />
              <span>{habit.streak}d</span>
            </span>
          )}
        </div>
        <p className="text-[11px] font-mono text-ink-muted truncate mt-0.5">
          {habit.attribute ? habit.attribute.toUpperCase() : 'GENERAL'} // {habit.difficulty?.toUpperCase() || 'STANDARD'}
        </p>
      </div>

      {/* Tactile 1-click score buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        {allowNegative && (
          <button
            type="button"
            onClick={() => scoreMutation.mutate('negative')}
            disabled={scoreMutation.isPending}
            aria-label={`Score negative for ${habit.title}`}
            className="p-1.5 rounded-chip text-attr-strength/70 hover:text-attr-strength hover:bg-attr-strength/15 border border-glass-border active:scale-95 transition-all min-h-9 min-w-9 flex items-center justify-center"
          >
            <Minus size={14} />
          </button>
        )}
        {allowPositive && (
          <button
            type="button"
            onClick={() => scoreMutation.mutate('positive')}
            disabled={scoreMutation.isPending}
            aria-label={`Score positive for ${habit.title}`}
            className="p-1.5 rounded-chip text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-700/50 active:scale-95 transition-all min-h-9 min-w-9 flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.15)]"
          >
            <Plus size={14} />
          </button>
        )}
      </div>
    </Card>
  );
}

HabitsFocusSection.propTypes = {
  topHabits: PropTypes.array,
  className: PropTypes.string,
};

HabitScoreCard.propTypes = {
  habit: PropTypes.object.isRequired,
};
