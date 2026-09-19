import { useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';
import { Flame, Plus, Minus, MoreVertical, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

import { spring } from '@/lib/motionVariants';
import { useFloatingText } from '@/features/character/floatingText';
import { useScoreHabit, useArchiveHabit } from '@/features/habits/hooks';
import { calculateHabitReward, DIFFICULTY_REWARDS } from '@/features/habits/rewardTable';

const DIFFICULTY_LABELS = {
  trivial: 'TRIVIAL',
  easy: 'EASY',
  medium: 'MEDIUM',
  hard: 'HARD',
};

const DIFFICULTY_STYLES = {
  trivial: 'text-ink-muted border-glass-border bg-obsidian-800/60',
  easy: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  medium: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  hard: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
};

export function HabitCard({ habit, onEdit, isCompletedToday = false }) {
  const shouldReduceMotion = useReducedMotion();
  const { spawnFloatingText } = useFloatingText();
  const scoreMutation = useScoreHabit(habit.id, habit);
  const archiveMutation = useArchiveHabit();

  const [flashBorder, setFlashBorder] = useState(null); // 'positive' | 'negative' | null
  const [menuOpen, setMenuOpen] = useState(false);

  const canScorePositive = habit.direction === 'positive' || habit.direction === 'both';
  const canScoreNegative = habit.direction === 'negative' || habit.direction === 'both';

  const reward = DIFFICULTY_REWARDS[habit.difficulty] || DIFFICULTY_REWARDS.easy;
  const hpPenalty = Math.round(reward.xp * 0.4);

  // Silent visual-only scoring feedback
  const handleScore = useCallback(
    (direction) => {
      if (scoreMutation.isPending) return;

      const delta = calculateHabitReward(habit.difficulty, direction);

      if (direction === 'positive') {
        setFlashBorder('positive');
        spawnFloatingText(`+${delta.xp} XP`, 'xp');
        if (delta.gold > 0) {
          setTimeout(() => spawnFloatingText(`+${delta.gold} Gold`, 'gold'), 120);
        }
      } else {
        setFlashBorder('negative');
        spawnFloatingText(`${delta.hp} HP`, 'hp');
      }

      setTimeout(() => {
        setFlashBorder(null);
      }, 250);

      scoreMutation.mutate(direction);
    },
    [habit.difficulty, scoreMutation, spawnFloatingText]
  );

  const handleDragEnd = (_event, info) => {
    const threshold = 80;
    if (info.offset.x > threshold && canScorePositive) {
      handleScore('positive');
    } else if (info.offset.x < -threshold && canScoreNegative) {
      handleScore('negative');
    }
  };

  const isStreakHigh = habit.currentStreak >= 3;

  return (
    <div className="relative group select-none">
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        layout="position"
        transition={shouldReduceMotion ? { duration: 0 } : spring.snappy}
        className={clsx(
          'relative flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl',
          'bg-obsidian-900/80 backdrop-blur-xl border shadow-glass transition-colors duration-200 cursor-grab active:cursor-grabbing',
          flashBorder === 'positive' && 'border-cyan-400 ring-2 ring-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]',
          flashBorder === 'negative' && 'border-rose-500 ring-2 ring-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.3)]',
          !flashBorder && 'border-glass-border hover:border-glass-border-strong'
        )}
      >
        {/* Cybernetic Corner Brackets */}
        <div className="absolute top-1.5 left-1.5 text-cyan-400/30 text-[9px] font-mono select-none pointer-events-none">┌</div>
        <div className="absolute top-1.5 right-1.5 text-cyan-400/30 text-[9px] font-mono select-none pointer-events-none">┐</div>
        <div className="absolute bottom-1.5 left-1.5 text-cyan-400/30 text-[9px] font-mono select-none pointer-events-none">└</div>
        <div className="absolute bottom-1.5 right-1.5 text-cyan-400/30 text-[9px] font-mono select-none pointer-events-none">┘</div>

        {/* Left Area: Title, Description, Difficulty & Streaks */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm sm:text-base font-bold text-ink truncate">{habit.title}</h3>

            {/* Difficulty Badge */}
            <span
              className={clsx(
                'px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded-md border uppercase',
                DIFFICULTY_STYLES[habit.difficulty] || DIFFICULTY_STYLES.easy
              )}
              title={`Reward: +${reward.xp} XP, +${reward.gold} Gold (${canScoreNegative ? `-${hpPenalty} HP on slip` : 'no slip penalty'})`}
            >
              {DIFFICULTY_LABELS[habit.difficulty] || 'EASY'}
            </span>

            {/* Streak Counter with Ember Pulse */}
            <div
              className={clsx(
                'flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-mono font-bold transition-all',
                isStreakHigh
                  ? 'border-amber-500/40 bg-amber-500/15 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                  : 'border-glass-border bg-obsidian-950/60 text-ink-muted'
              )}
              title={`Current streak: ${habit.currentStreak} days (Record: ${habit.bestStreak} days)`}
            >
              <motion.div
                animate={
                  isStreakHigh && !shouldReduceMotion
                    ? { scale: [1, 1.25, 1], rotate: [-3, 3, -3] }
                    : { scale: 1, rotate: 0 }
                }
                transition={
                  isStreakHigh && !shouldReduceMotion
                    ? { repeat: Infinity, duration: 1.8, ease: 'easeInOut' }
                    : { duration: 0 }
                }
              >
                <Flame className={clsx('w-3.5 h-3.5', isStreakHigh ? 'fill-amber-400 text-amber-400' : 'text-ink-muted')} />
              </motion.div>
              <span>{habit.currentStreak}d</span>
            </div>

            {/* Authoritative "Forged Today" Indicator */}
            {isCompletedToday && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-[10px] font-mono font-bold text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                <span>FORGED TODAY</span>
              </span>
            )}
          </div>

          {habit.description && (
            <p className="mt-1 text-xs text-ink-muted line-clamp-2 leading-relaxed">{habit.description}</p>
          )}

          {/* Value preview indicator */}
          <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-ink-muted/70">
            <span>+{reward.xp} XP</span>
            <span>•</span>
            <span>+{reward.gold} G</span>
            {canScoreNegative && (
              <>
                <span>•</span>
                <span className="text-rose-400/80">-{hpPenalty} HP slip</span>
              </>
            )}
          </div>
        </div>

        {/* Right Area: Action Buttons & Menu */}
        <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
          {/* Accessible Negative Button (min 44x44px touch area) */}
          {canScoreNegative && (
            <button
              type="button"
              disabled={scoreMutation.isPending}
              onClick={(e) => {
                e.stopPropagation();
                handleScore('negative');
              }}
              aria-label={`Log slip for ${habit.title}`}
              className={clsx(
                'min-w-11 min-h-11 w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer select-none',
                'border border-rose-500/30 bg-rose-500/10 text-rose-400',
                'hover:bg-rose-500/25 hover:border-rose-500/50 active:scale-95 transition-all shadow-elevation-subtle',
                'disabled:opacity-40 disabled:pointer-events-none'
              )}
            >
              <Minus className="w-5 h-5" />
            </button>
          )}

          {/* Accessible Positive Button (min 44x44px touch area) */}
          {canScorePositive && (
            <button
              type="button"
              disabled={scoreMutation.isPending}
              onClick={(e) => {
                e.stopPropagation();
                handleScore('positive');
              }}
              aria-label={`Score positive completion for ${habit.title}`}
              className={clsx(
                'min-w-11 min-h-11 w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer select-none',
                'border border-cyan-400/40 bg-cyan-500/15 text-cyan-300',
                'hover:bg-cyan-500/30 hover:border-cyan-400 active:scale-95 transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)]',
                'disabled:opacity-40 disabled:pointer-events-none'
              )}
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}

          {/* Edit / Actions Dropdown Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
              aria-label="Habit options"
              className="min-w-11 min-h-11 w-11 h-11 flex items-center justify-center rounded-xl text-ink-muted hover:text-ink hover:bg-white/5 transition-colors cursor-pointer select-none"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-12 z-30 w-40 py-1.5 rounded-xl bg-obsidian-900 border border-glass-border shadow-elevation-high backdrop-blur-xl"
                onClick={(e) => e.stopPropagation()}
              >
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(habit);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-ink hover:bg-white/10 transition-colors text-left cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Edit Discipline</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    archiveMutation.mutate(habit.id);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-400 hover:bg-white/10 transition-colors text-left cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Archive Ritual</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

HabitCard.propTypes = {
  habit: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    direction: PropTypes.oneOf(['positive', 'negative', 'both']).isRequired,
    difficulty: PropTypes.oneOf(['trivial', 'easy', 'medium', 'hard']).isRequired,
    currentStreak: PropTypes.number.isRequired,
    bestStreak: PropTypes.number.isRequired,
  }).isRequired,
  onEdit: PropTypes.func,
  isCompletedToday: PropTypes.bool,
};
