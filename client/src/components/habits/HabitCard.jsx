import { useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';
import { Flame, Plus, Minus, MoreVertical, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

import { spring } from '@/lib/motionVariants';
import { useFloatingText } from '@/features/character/floatingText';
import { useScoreHabit, useArchiveHabit } from '@/features/habits/hooks';
import { calculateHabitReward, DIFFICULTY_REWARDS } from '@/features/habits/rewardTable';
import { RitualFrame, ForgeChamber, DIFFICULTY_THEMES } from '@/components/habits/RitualFrame';

const DIFFICULTY_LABELS = {
  trivial: 'TRIVIAL',
  easy: 'EASY',
  medium: 'MEDIUM',
  hard: 'HARD',
};

/**
 * Exact Habit Difficulty Badge Styles:
 * - Easy / Trivial: light cyan / azure blue
 * - Medium: vivid violet / purple
 * - Difficult (Hard): deep electric cobalt blue (NEVER RED)
 */
const DIFFICULTY_BADGE_STYLES = {
  trivial: 'text-cyan-300/80 border-cyan-500/25 bg-cyan-950/40',
  easy: DIFFICULTY_THEMES.easy.badgeClass,
  medium: DIFFICULTY_THEMES.medium.badgeClass,
  hard: DIFFICULTY_THEMES.difficult.badgeClass,
};

/**
 * HabitCard — Structural Holographic HUD Instrument.
 *
 * Implements the Structural Object Mandate:
 * - Angular top and bottom rails with chamfered corners
 * - Mechanical/celestial corner brackets
 * - Side pylons / segmented edge assemblies
 * - Inset dark-glass information plane
 * - Framed internal chambers for title, streak, progress, rewards, and tactical actions
 * - Animated energy seams traveling through the structure
 * - Original crest/emitter geometry at top anchor
 * - Exact difficulty color palettes: Easy = Light Cyan/Azure, Medium = Vivid Violet, Difficult = Deep Cobalt Blue
 */
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

  // Map difficulty to structural theme variant
  const frameVariant = habit.difficulty === 'hard' ? 'difficult' : habit.difficulty === 'medium' ? 'medium' : 'easy';

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
      }, 280);

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
        className="cursor-grab active:cursor-grabbing"
      >
        <RitualFrame
          variant={frameVariant}
          hasCrest={true}
          flashState={flashBorder}
          innerClassName="p-3.5 sm:p-4.5"
        >
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 sm:gap-4">
            {/* ══════════════════════════════════════════════════
                CHAMBER 1: CORE IDENTIFICATION & DIRECTIVE
                ══════════════════════════════════════════════════ */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Ritual Title */}
                <h3 className="text-sm sm:text-base font-bold text-ink tracking-tight truncate">
                  {habit.title}
                </h3>

                {/* Exact Difficulty Badge */}
                <span
                  className={clsx(
                    'px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded-md border uppercase select-none',
                    DIFFICULTY_BADGE_STYLES[habit.difficulty] || DIFFICULTY_BADGE_STYLES.easy
                  )}
                  title={`Tier: ${DIFFICULTY_LABELS[habit.difficulty]} (+${reward.xp} XP / +${reward.gold} Gold)`}
                >
                  {DIFFICULTY_LABELS[habit.difficulty] || 'EASY'}
                </span>

                {/* Celestial Streak Chamber Badge */}
                <div
                  className={clsx(
                    'flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-mono font-bold transition-all',
                    isStreakHigh
                      ? 'border-amber-500/40 bg-amber-500/15 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                      : 'border-white/10 bg-obsidian-950/70 text-ink-muted'
                  )}
                  title={`Current streak: ${habit.currentStreak} days (Best: ${habit.bestStreak} days)`}
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
                    <Flame
                      className={clsx(
                        'w-3.5 h-3.5',
                        isStreakHigh ? 'fill-amber-400 text-amber-400' : 'text-ink-muted'
                      )}
                    />
                  </motion.div>
                  <span>{habit.currentStreak}d</span>
                </div>

                {/* Authoritative "Forged Today" Indicator */}
                {isCompletedToday && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/50 text-[10px] font-mono font-bold text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                    <span>FORGED TODAY</span>
                  </span>
                )}
              </div>

              {/* Directive Guidelines */}
              {habit.description && (
                <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed">
                  {habit.description}
                </p>
              )}

              {/* Framed Internal Chamber: Contract Reward Preview */}
              <ForgeChamber
                variant="inset"
                className="py-1.5 px-2.5 flex items-center gap-2.5 text-[10px] font-mono text-ink-muted/80 w-fit"
              >
                <span className="text-cyan-300 font-semibold">+{reward.xp} XP</span>
                <span className="text-white/20">•</span>
                <span className="text-amber-300 font-semibold">+{reward.gold} G</span>
                {canScoreNegative && (
                  <>
                    <span className="text-white/20">•</span>
                    <span className="text-rose-400 font-semibold">-{hpPenalty} HP slip</span>
                  </>
                )}
                {habit.bestStreak > 0 && (
                  <>
                    <span className="text-white/20">•</span>
                    <span className="text-ink-muted">Peak: {habit.bestStreak}d</span>
                  </>
                )}
              </ForgeChamber>
            </div>

            {/* ══════════════════════════════════════════════════
                CHAMBER 2: TACTICAL ACTION MOUNT
                ══════════════════════════════════════════════════ */}
            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
              {/* Accessible Negative Accountability Button (min 44x44px touch area) */}
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
                    'border border-rose-500/40 bg-rose-500/15 text-rose-300',
                    'hover:bg-rose-500/30 hover:border-rose-400 active:scale-95 transition-all shadow-[0_0_10px_rgba(244,63,94,0.2)]',
                    'disabled:opacity-40 disabled:pointer-events-none'
                  )}
                >
                  <Minus className="w-5 h-5 stroke-[2.2]" />
                </button>
              )}

              {/* Accessible Positive Forge Button (min 44x44px touch area) */}
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
                    frameVariant === 'difficult'
                      ? 'border-blue-400/80 bg-blue-600/30 text-blue-100 hover:bg-blue-600/45 hover:border-blue-300 shadow-[0_0_16px_rgba(37,99,235,0.4)]'
                      : frameVariant === 'medium'
                      ? 'border-purple-400/60 bg-purple-500/25 text-purple-200 hover:bg-purple-500/40 hover:border-purple-300 shadow-[0_0_14px_rgba(168,85,247,0.35)]'
                      : 'border-cyan-400/60 bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/35 hover:border-cyan-300 shadow-[0_0_14px_rgba(6,182,212,0.3)]',
                    'active:scale-95 transition-all',
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
                  className="min-w-11 min-h-11 w-11 h-11 flex items-center justify-center rounded-xl text-ink-muted hover:text-ink hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer select-none"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {menuOpen && (
                  <div
                    className="absolute right-0 top-12 z-40 w-44 py-1.5 rounded-xl bg-obsidian-950 border border-white/15 shadow-elevation-high backdrop-blur-2xl"
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
          </div>
        </RitualFrame>
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

