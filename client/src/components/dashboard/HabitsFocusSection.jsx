import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Flame, Plus, Minus, ArrowRight } from 'lucide-react';
import { useScoreHabit } from '@/features/habits/hooks';

/**
 * Curated Top Habits for today with tactile 1-click scoring.
 * Avoids giant grid clutter by surfacing the highest-momentum habits.
 */
export function HabitsFocusSection({
  topHabits = [],
  className = '',
}) {
  return (
    <section className={clsx('space-y-3', className)}>
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-display-xs text-ink font-display font-semibold flex items-center gap-2">
            <Flame size={18} className="text-amber-400" />
            <span>Habits & Momentum</span>
          </h2>
          <span className="px-2 py-0.5 rounded-full text-caption font-mono font-medium bg-obsidian-800 text-ink-muted border border-glass-border">
            {topHabits.length}
          </span>
        </div>

        <Link
          to="/habits"
          className="text-caption font-medium text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
        >
          <span>All Habits</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {topHabits.length === 0 ? (
        <div className="p-6 rounded-card border border-glass-border bg-obsidian-900/40 text-center flex flex-col items-center justify-center space-y-2">
          <p className="text-body font-medium text-ink">No habits created yet.</p>
          <p className="text-caption text-ink-muted">
            Build consistency with positive micro-habits that reward character XP.
          </p>
          <Link
            to="/habits"
            className="mt-1 px-3.5 py-1.5 rounded-panel text-xs font-medium bg-glass hover:bg-glass/80 border border-glass-border text-ink transition-colors"
          >
            + Create a Habit
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
    <div className="p-3 sm:p-3.5 rounded-card bg-obsidian-900/60 border border-glass-border flex items-center justify-between gap-3 hover:border-glass-border-focus transition-all">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink truncate">
            {habit.title}
          </span>
          {(habit.streak || 0) > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-mono font-bold text-amber-300 shrink-0">
              <Flame size={12} className="text-amber-400" />
              {habit.streak}
            </span>
          )}
        </div>
        <p className="text-caption text-ink-muted/70 truncate mt-0.5">
          {habit.attribute ? habit.attribute.toUpperCase() : 'GENERAL'} • {habit.difficulty || 'easy'}
        </p>
      </div>

      {/* Tactile 1-click score buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {allowNegative && (
          <button
            type="button"
            onClick={() => scoreMutation.mutate('negative')}
            disabled={scoreMutation.isPending}
            aria-label={`Score negative for ${habit.title}`}
            className="p-1.5 rounded-chip text-attr-strength/70 hover:text-attr-strength hover:bg-attr-strength/10 border border-glass-border transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
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
            className="p-1.5 rounded-chip text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-950/40 border border-glass-border transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <Plus size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

HabitsFocusSection.propTypes = {
  topHabits: PropTypes.array,
  className: PropTypes.string,
};

HabitScoreCard.propTypes = {
  habit: PropTypes.object.isRequired,
};
