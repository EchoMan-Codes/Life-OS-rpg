import { useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';
import { Flame, Plus, Minus, Check, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import clsx from 'clsx';

import { spring } from '@/lib/motionVariants';
import { playSound } from '@/lib/sound';
import { useFloatingText } from '@/features/character/floatingText';
import {
  useScoreHabit,
  useArchiveHabit,
  useDeleteHabit,
  useRestoreHabit,
  useUpdateHabit,
} from '@/features/habits/hooks';
import { calculateHabitReward } from '@/features/habits/rewardTable';
import { ItemActionMenu } from '@/components/ui';

const DIFFICULTY_CONFIG = {
  trivial: { label: 'Trivial', color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' },
  easy: { label: 'Easy', color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' },
  medium: { label: 'Medium', color: 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400' },
  hard: { label: 'Hard', color: 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-400' },
};

const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * Contextual SVG Illustration for each Habit based on title / keywords.
 * Creates an intentional, premium RPG visual identity matching Image 3.
 */
function HabitThumbnail({ title = '' }) {
  const lower = title.toLowerCase();

  // 1. Sunrise / Morning / Wake Up
  if (lower.includes('wake') || lower.includes('morning') || lower.includes('sun') || lower.includes('early') || lower.includes('alarm')) {
    return (
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shrink-0 relative bg-gradient-to-b from-sky-400 via-amber-200 to-amber-500 shadow-md flex items-center justify-center border border-amber-300/40">
        <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
          {/* Sky Gradient */}
          <rect width="64" height="64" fill="url(#sunSky)" />
          <defs>
            <linearGradient id="sunSky" x1="32" y1="0" x2="32" y2="64" gradientUnits="userSpaceOnUse">
              <stop stopColor="#60A5FA" />
              <stop offset="0.4" stopColor="#FDE68A" />
              <stop offset="0.75" stopColor="#F59E0B" />
              <stop offset="1" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="sunDisc" x1="32" y1="18" x2="32" y2="42" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FEF08A" />
              <stop offset="1" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          {/* Rising Sun Disc */}
          <circle cx="32" cy="30" r="12" fill="url(#sunDisc)" />
          {/* Sun Rays */}
          <path d="M32 10V14M32 46V50M12 30H16M48 30H52M18 16L21 19M43 41L46 44M18 44L21 41M43 19L46 16" stroke="#FEF08A" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          {/* Rolling Green Hills in Foreground */}
          <path d="M0 48C14 42 24 45 38 43C52 41 58 45 64 48V64H0V48Z" fill="#10B981" />
          <path d="M0 54C16 50 34 52 48 50C56 49 60 51 64 54V64H0V54Z" fill="#047857" />
        </svg>
      </div>
    );
  }

  // 2. Hydration / Water Drink
  if (lower.includes('water') || lower.includes('drink') || lower.includes('hydrate') || lower.includes('liquid')) {
    return (
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shrink-0 relative bg-gradient-to-b from-sky-100 via-sky-200 to-blue-400 dark:from-sky-950 dark:via-blue-900 dark:to-cyan-900 shadow-md flex items-center justify-center border border-sky-300/40">
        <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
          <defs>
            <radialGradient id="dropGlow" cx="32" cy="34" r="18" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" />
              <stop offset="0.7" stopColor="#0284C7" />
              <stop offset="1" stopColor="#0369A1" />
            </radialGradient>
          </defs>
          {/* Ripple rings */}
          <ellipse cx="32" cy="52" rx="20" ry="6" fill="#38BDF8" fillOpacity="0.25" />
          <ellipse cx="32" cy="52" rx="13" ry="3.5" fill="#0284C7" fillOpacity="0.35" />
          {/* Water Droplet */}
          <path d="M32 14C32 14 18 31 18 41C18 48.732 24.268 55 32 55C39.732 55 46 48.732 46 41C46 31 32 14 32 14Z" fill="url(#dropGlow)" />
          {/* Droplet Highlight Reflection */}
          <path d="M26 34C24 38 24 43 27 47" stroke="#BAE6FD" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
        </svg>
      </div>
    );
  }

  // 3. Study / Reading / Books / Learning
  if (lower.includes('study') || lower.includes('read') || lower.includes('book') || lower.includes('learn') || lower.includes('code') || lower.includes('project') || lower.includes('gate')) {
    return (
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shrink-0 relative bg-gradient-to-b from-indigo-100 via-purple-100 to-amber-100 dark:from-purple-950 dark:via-indigo-950 dark:to-purple-900 shadow-md flex items-center justify-center border border-purple-300/40">
        <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
          <defs>
            <linearGradient id="bookCover" x1="12" y1="20" x2="52" y2="52" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F59E0B" />
              <stop offset="1" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="bookPage" x1="32" y1="24" x2="32" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#F3F4F6" />
            </linearGradient>
          </defs>
          {/* Ambient Glow */}
          <circle cx="32" cy="32" r="22" fill="#FCD34D" fillOpacity="0.2" />
          {/* Open Book Base */}
          <path d="M14 46C20 44 26 44 32 47C38 44 44 44 50 46V23C44 21 38 21 32 24C26 21 20 21 14 23V46Z" fill="url(#bookPage)" stroke="#6366F1" strokeWidth="1.5" />
          {/* Book Spine Center */}
          <line x1="32" y1="24" x2="32" y2="47" stroke="#4F46E5" strokeWidth="1.5" />
          {/* Bookmark Ribbon */}
          <path d="M32 24V36L35 34L38 36V23.5" fill="#EF4444" />
          {/* Page Lines */}
          <line x1="19" y1="28" x2="27" y2="28" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="19" y1="33" x2="27" y2="33" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="19" y1="38" x2="25" y2="38" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="37" y1="28" x2="45" y2="28" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="37" y1="33" x2="45" y2="33" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
          {/* Sparkles */}
          <circle cx="48" cy="18" r="1.5" fill="#F59E0B" />
          <circle cx="16" cy="18" r="1.5" fill="#8B5CF6" />
        </svg>
      </div>
    );
  }

  // 4. Fitness / Gym / Workout / Health
  if (lower.includes('fit') || lower.includes('gym') || lower.includes('workout') || lower.includes('exercise') || lower.includes('run') || lower.includes('walk') || lower.includes('pushup')) {
    return (
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shrink-0 relative bg-gradient-to-b from-rose-100 via-orange-100 to-amber-200 dark:from-rose-950 dark:via-red-900 dark:to-orange-950 shadow-md flex items-center justify-center border border-rose-300/40">
        <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
          <defs>
            <linearGradient id="dumbGrad" x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F43F5E" />
              <stop offset="1" stopColor="#E11D48" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="20" fill="#F43F5E" fillOpacity="0.15" />
          {/* Dumbbell Handle */}
          <rect x="22" y="30" width="20" height="4" rx="2" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
          {/* Left Plate Outer */}
          <rect x="14" y="22" width="5" height="20" rx="2.5" fill="url(#dumbGrad)" />
          {/* Left Plate Inner */}
          <rect x="19" y="25" width="3" height="14" rx="1.5" fill="#FDA4AF" />
          {/* Right Plate Inner */}
          <rect x="42" y="25" width="3" height="14" rx="1.5" fill="#FDA4AF" />
          {/* Right Plate Outer */}
          <rect x="45" y="22" width="5" height="20" rx="2.5" fill="url(#dumbGrad)" />
        </svg>
      </div>
    );
  }

  // Default LifeOS RPG Discipline Emblem
  return (
    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shrink-0 relative bg-gradient-to-br from-amber-100 via-orange-50 to-amber-200 dark:from-obsidian-800 dark:via-obsidian-900 dark:to-amber-950/40 shadow-md flex items-center justify-center border border-amber-300/40">
      <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
        <defs>
          <linearGradient id="crestGrad" x1="32" y1="14" x2="32" y2="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F59E0B" />
            <stop offset="1" stopColor="#D97706" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="18" fill="#F59E0B" fillOpacity="0.15" />
        <path d="M32 14L46 24V40L32 50L18 40V24L32 14Z" fill="url(#crestGrad)" fillOpacity="0.3" stroke="#F59E0B" strokeWidth="1.5" />
        <path d="M32 20V44M20 32H44" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="32" cy="32" r="4" fill="#F59E0B" />
      </svg>
    </div>
  );
}

HabitThumbnail.propTypes = {
  title: PropTypes.string,
};

export function HabitCard({ habit, onEdit }) {
  const shouldReduceMotion = useReducedMotion();
  const { spawnFloatingText } = useFloatingText();
  const scoreMutation = useScoreHabit(habit.id, habit);
  const archiveMutation = useArchiveHabit();
  const deleteMutation = useDeleteHabit();
  const restoreMutation = useRestoreHabit();
  const updateMutation = useUpdateHabit();

  const isArchived = Boolean(habit.archivedAt);

  const moveOptions = [
    { id: 'positive', label: 'Positive (+)', current: habit.direction === 'positive' },
    { id: 'both', label: 'Dual (+ / -)', current: habit.direction === 'both' },
    { id: 'negative', label: 'Negative (-)', current: habit.direction === 'negative' },
  ];

  const handleMove = (destinationId) => {
    updateMutation.mutate({
      habitId: habit.id,
      data: { direction: destinationId },
    });
  };

  const [flashBorder, setFlashBorder] = useState(null); // 'positive' | 'negative' | null
  const [justCompleted, setJustCompleted] = useState(false);

  const canScorePositive = habit.direction === 'positive' || habit.direction === 'both';
  const canScoreNegative = habit.direction === 'negative' || habit.direction === 'both';

  const diffConfig = DIFFICULTY_CONFIG[habit.difficulty] || DIFFICULTY_CONFIG.easy;
  const currentDayIndex = new Date().getDay();

  const handleScore = useCallback(
    (direction) => {
      if (scoreMutation.isPending) return;

      const reward = calculateHabitReward(habit.difficulty, direction);

      if (direction === 'positive') {
        playSound('habit_positive');
        setFlashBorder('positive');
        setJustCompleted(true);
        spawnFloatingText(`+${reward.xp} XP`, 'xp');
        if (reward.gold > 0) {
          setTimeout(() => spawnFloatingText(`+${reward.gold} Gold`, 'gold'), 120);
        }
        setTimeout(() => setJustCompleted(false), 1500);
      } else {
        playSound('habit_negative');
        setFlashBorder('negative');
        spawnFloatingText(`${reward.hp} HP`, 'hp');
      }

      setTimeout(() => {
        setFlashBorder(null);
      }, 300);

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

  const isStreakHigh = (habit.currentStreak || 0) >= 3;

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
          'relative flex items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-3xl',
          'bg-white/90 hover:bg-white dark:bg-obsidian-900/80 dark:hover:bg-obsidian-900/95',
          'border transition-all duration-200 backdrop-blur-xl',
          'shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]',
          flashBorder === 'positive' && 'border-emerald-500 ring-2 ring-emerald-500/40',
          flashBorder === 'negative' && 'border-rose-500 ring-2 ring-rose-500/40',
          !flashBorder && 'border-slate-200/85 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20'
        )}
      >
        {/* Left: Thematic Artwork Thumbnail */}
        <HabitThumbnail title={habit.title} />

        {/* Center: Title, Difficulty, Streak, Time Cadence & Scheduled Days */}
        <div className="flex-1 min-w-0 pr-1">
          {/* Row 1: Title + Badges + Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-ink truncate max-w-[200px] sm:max-w-md font-display">
              {habit.title}
            </h3>

            {/* Difficulty Badge */}
            <span
              className={clsx(
                'px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border shrink-0',
                diffConfig.color
              )}
            >
              {diffConfig.label}
            </span>

            {/* Streak Counter Pill */}
            <div
              className={clsx(
                'flex items-center gap-1 px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-gold text-[10px] font-mono font-bold shrink-0'
              )}
              title={`Current streak: ${habit.currentStreak || 0}d (Best: ${habit.bestStreak || 0}d)`}
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
                <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
              </motion.div>
              <span>{habit.currentStreak || 0}</span>
            </div>
          </div>

          {/* Row 2: Subtitle / Description / Time Target */}
          {habit.description && (
            <p className="text-xs text-slate-500 dark:text-ink-muted line-clamp-1 mb-2 font-medium">
              {habit.description}
            </p>
          )}

          {/* Row 3: Scheduled Days Indicator Strip (S M T W T F S) */}
          <div className="flex items-center gap-1 pt-0.5">
            {WEEK_DAYS.map((dayLabel, idx) => {
              const isToday = idx === currentDayIndex;
              return (
                <div
                  key={idx}
                  className={clsx(
                    'w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono transition-all',
                    isToday
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs ring-1 ring-amber-400'
                      : 'bg-slate-100 text-slate-400 dark:bg-white/[0.04] dark:text-ink-muted/50 border border-slate-200/50 dark:border-white/5'
                  )}
                  title={`${dayLabel} - ${isToday ? 'Today' : 'Scheduled'}`}
                >
                  {dayLabel}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Area: Tactile Completion Controls & Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Dual Habit: Show Minus Button */}
          {habit.direction === 'both' && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              disabled={scoreMutation.isPending}
              onClick={(e) => {
                e.stopPropagation();
                handleScore('negative');
              }}
              aria-label={`Score negative on ${habit.title}`}
              className={clsx(
                'w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-2xl',
                'border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-hp',
                'hover:bg-rose-500/20 active:scale-95 transition-all shadow-xs',
                'disabled:opacity-40 disabled:pointer-events-none cursor-pointer'
              )}
            >
              <Minus className="w-5 h-5 stroke-[2.5]" />
            </motion.button>
          )}

          {/* Primary Action Button (Checkmark for positive / both, Minus for negative) */}
          {canScorePositive ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              disabled={scoreMutation.isPending}
              onClick={(e) => {
                e.stopPropagation();
                handleScore('positive');
              }}
              aria-label={`Score positive on ${habit.title}`}
              className={clsx(
                'w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl transition-all shadow-xs cursor-pointer',
                justCompleted
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30 ring-2 ring-emerald-400'
                  : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 border border-emerald-300/80 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
                scoreMutation.isPending && 'opacity-50 pointer-events-none'
              )}
            >
              {justCompleted ? (
                <Check className="w-6 h-6 stroke-[3] animate-bounce" />
              ) : habit.direction === 'both' ? (
                <Plus className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <Check className="w-6 h-6 stroke-[2.5]" />
              )}
            </motion.button>
          ) : (
            /* Negative Only Habit Action */
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              disabled={scoreMutation.isPending}
              onClick={(e) => {
                e.stopPropagation();
                handleScore('negative');
              }}
              aria-label={`Score negative on ${habit.title}`}
              className={clsx(
                'w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl',
                'border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-hp',
                'hover:bg-rose-500/20 active:scale-95 transition-all shadow-xs cursor-pointer'
              )}
            >
              <Minus className="w-6 h-6 stroke-[2.5]" />
            </motion.button>
          )}

          {/* Options Dropdown Menu */}
          <ItemActionMenu
            title={habit.title}
            entityName="Habit"
            onEdit={onEdit ? () => onEdit(habit) : undefined}
            moveOptions={moveOptions}
            onMove={handleMove}
            onArchive={() => archiveMutation.mutate(habit.id)}
            isArchived={isArchived}
            onRestore={() => restoreMutation.mutate(habit.id)}
            onDelete={() => deleteMutation.mutate(habit.id)}
          />
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
    currentStreak: PropTypes.number,
    bestStreak: PropTypes.number,
  }).isRequired,
  onEdit: PropTypes.func,
};
