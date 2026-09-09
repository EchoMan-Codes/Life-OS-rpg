import { useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';
import { Flame, Plus, Minus, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import clsx from 'clsx';

import { spring } from '@/lib/motionVariants';
import { playSound } from '@/lib/sound';
import { useFloatingText } from '@/features/character/floatingText';
import { useScoreHabit, useArchiveHabit } from '@/features/habits/hooks';
import { calculateHabitReward } from '@/features/habits/rewardTable';

const DIFFICULTY_LABELS = {
  trivial: 'Trivial',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const DIFFICULTY_COLORS = {
  trivial: 'text-ink-muted border-glass-border bg-obsidian-800/40',
  easy: 'text-attr-vitality border-attr-vitality/30 bg-attr-vitality/10',
  medium: 'text-attr-intelligence border-attr-intelligence/30 bg-attr-intelligence/10',
  hard: 'text-attr-strength border-attr-strength/30 bg-attr-strength/10',
};

export function HabitCard({ habit, onEdit }) {
  const shouldReduceMotion = useReducedMotion();
  const { spawnFloatingText } = useFloatingText();
  const scoreMutation = useScoreHabit(habit.id, habit);
  const archiveMutation = useArchiveHabit();

  const [flashBorder, setFlashBorder] = useState(null); // 'positive' | 'negative' | null
  const [menuOpen, setMenuOpen] = useState(false);

  const canScorePositive = habit.direction === 'positive' || habit.direction === 'both';
  const canScoreNegative = habit.direction === 'negative' || habit.direction === 'both';

  const handleScore = useCallback(
    (direction) => {
      if (scoreMutation.isPending) return;

      const reward = calculateHabitReward(habit.difficulty, direction);

      if (direction === 'positive') {
        playSound('habit_positive');
        setFlashBorder('positive');
        spawnFloatingText(`+${reward.xp} XP`, 'xp');
        if (reward.gold > 0) {
          setTimeout(() => spawnFloatingText(`+${reward.gold} Gold`, 'gold'), 120);
        }
      } else {
        playSound('habit_negative');
        setFlashBorder('negative');
        spawnFloatingText(`${reward.hp} HP`, 'hp');
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
        layout
        transition={shouldReduceMotion ? { duration: 0 } : spring.snappy}
        className={clsx(
          'relative flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl',
          'bg-obsidian-900/80 backdrop-blur-xl border shadow-glass transition-colors duration-200 cursor-grab active:cursor-grabbing',
          flashBorder === 'positive' && 'border-attr-vitality ring-2 ring-attr-vitality/50',
          flashBorder === 'negative' && 'border-attr-strength ring-2 ring-attr-strength/50',
          !flashBorder && 'border-glass-border hover:border-glass-border-strong'
        )}
      >
        {/* Left Area: Title, Description, Difficulty & Streaks */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-body font-semibold text-ink truncate">{habit.title}</h3>
            <span
              className={clsx(
                'px-2 py-0.5 text-body-2xs font-medium rounded-full border',
                DIFFICULTY_COLORS[habit.difficulty] || DIFFICULTY_COLORS.easy
              )}
            >
              {DIFFICULTY_LABELS[habit.difficulty] || 'Easy'}
            </span>

            {/* Streak Counter */}
            <div
              className={clsx(
                'flex items-center gap-1 px-2 py-0.5 rounded-full border border-xp/30 bg-xp/10 text-xp text-body-xs font-semibold'
              )}
              title={`Current streak: ${habit.currentStreak} (Best: ${habit.bestStreak})`}
            >
              <motion.div
                animate={
                  isStreakHigh && !shouldReduceMotion
                    ? { scale: [1, 1.25, 1], rotate: [-2, 2, -2] }
                    : { scale: 1, rotate: 0 }
                }
                transition={
                  isStreakHigh && !shouldReduceMotion
                    ? { repeat: Infinity, duration: 1.6, ease: 'easeInOut' }
                    : { duration: 0 }
                }
              >
                <Flame className="w-3.5 h-3.5 fill-xp text-xp" />
              </motion.div>
              <span>{habit.currentStreak}</span>
            </div>
          </div>

          {habit.description && (
            <p className="mt-1 text-body-xs text-ink-muted line-clamp-2">{habit.description}</p>
          )}
        </div>

        {/* Right Area: Action Buttons & Menu */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          {/* Accessible Negative Button */}
          {canScoreNegative && (
            <button
              type="button"
              disabled={scoreMutation.isPending}
              onClick={(e) => {
                e.stopPropagation();
                handleScore('negative');
              }}
              aria-label={`Score negative on ${habit.title}`}
              className={clsx(
                'min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-xl',
                'border border-attr-strength/40 bg-attr-strength/10 text-attr-strength',
                'hover:bg-attr-strength/25 active:scale-95 transition-all',
                'disabled:opacity-40 disabled:pointer-events-none'
              )}
            >
              <Minus className="w-5 h-5" />
            </button>
          )}

          {/* Accessible Positive Button */}
          {canScorePositive && (
            <button
              type="button"
              disabled={scoreMutation.isPending}
              onClick={(e) => {
                e.stopPropagation();
                handleScore('positive');
              }}
              aria-label={`Score positive on ${habit.title}`}
              className={clsx(
                'min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-xl',
                'border border-attr-vitality/40 bg-attr-vitality/10 text-attr-vitality',
                'hover:bg-attr-vitality/25 active:scale-95 transition-all',
                'disabled:opacity-40 disabled:pointer-events-none'
              )}
            >
              <Plus className="w-5 h-5" />
            </button>
          )}

          {/* Edit / Actions Dropdown Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
              aria-label="Habit options"
              className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-xl text-ink-muted hover:text-ink hover:bg-glass/50 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-12 z-20 w-36 py-1 rounded-xl bg-obsidian-800 border border-glass-border shadow-glass"
                onClick={(e) => e.stopPropagation()}
              >
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(habit);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-body-xs text-ink hover:bg-glass/50 transition-colors text-left"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-mana" />
                    <span>Edit Habit</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    archiveMutation.mutate(habit.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-body-xs text-attr-strength hover:bg-glass/50 transition-colors text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Archive</span>
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
};
