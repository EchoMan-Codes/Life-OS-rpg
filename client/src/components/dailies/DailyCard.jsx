import { useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';
import { Flame, Shield, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import clsx from 'clsx';

import { spring } from '@/lib/motionVariants';
import { playSound } from '@/lib/sound';
import { useFloatingText } from '@/features/character/floatingText';
import { useCharacter } from '@/features/character/hooks';
import { useCompleteDaily, useUndoDaily, useArchiveDaily } from '@/features/dailies/hooks';

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

const DIFFICULTY_REWARDS = {
  trivial: { xp: 3, gold: 1 },
  easy: { xp: 8, gold: 3 },
  medium: { xp: 15, gold: 6 },
  hard: { xp: 25, gold: 10 },
};

const DAYS_OF_WEEK = [
  { label: 'S', day: 0, title: 'Sunday' },
  { label: 'M', day: 1, title: 'Monday' },
  { label: 'T', day: 2, title: 'Tuesday' },
  { label: 'W', day: 3, title: 'Wednesday' },
  { label: 'T', day: 4, title: 'Thursday' },
  { label: 'F', day: 5, title: 'Friday' },
  { label: 'S', day: 6, title: 'Saturday' },
];

export function DailyCard({ daily, onEdit }) {
  const shouldReduceMotion = useReducedMotion();
  const { spawnFloatingText } = useFloatingText();
  const { data: character } = useCharacter();
  const [menuOpen, setMenuOpen] = useState(false);

  const completeMutation = useCompleteDaily(daily.id, daily);
  const undoMutation = useUndoDaily(daily.id, daily);
  const archiveMutation = useArchiveDaily();

  const isCompleteToday = Boolean(daily.isCompleteToday);
  const activeDays = daily.activeDays || [0, 1, 2, 3, 4, 5, 6];
  const currentWeekday = new Date().getDay();
  const isDueToday = activeDays.includes(currentWeekday);

  const reward = DIFFICULTY_REWARDS[daily.difficulty] || DIFFICULTY_REWARDS.easy;

  // Streak progress ring around checkbox capped at 30 days
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.min((daily.streakCurrent || 0) / 30, 1);
  const strokeDashoffset = circumference * (1 - progressRatio);

  const handleToggle = useCallback(() => {
    if (completeMutation.isPending || undoMutation.isPending) return;

    if (isCompleteToday) {
      playSound('daily_undo');
      spawnFloatingText(`-${reward.xp} XP`, 'damage');
      undoMutation.mutate();
    } else {
      const willLevelUp =
        character && character.xp + reward.xp >= (character.xpForNextLevel || 100);
      if (!willLevelUp) {
        playSound('daily_complete');
      }
      spawnFloatingText(`+${reward.xp} XP`, 'xp');
      if (reward.gold > 0) {
        setTimeout(() => spawnFloatingText(`+${reward.gold} Gold`, 'gold'), 120);
      }
      completeMutation.mutate();
    }
  }, [completeMutation, undoMutation, isCompleteToday, reward, spawnFloatingText, character]);

  return (
    <div className="relative group select-none">
      <div
        className={clsx(
          'relative flex items-center gap-3.5 p-4 rounded-panel',
          'bg-obsidian-900/80 backdrop-blur-glass border border-glass-border',
          'transition-all duration-200 shadow-panel hover:border-glass-border/80',
          isCompleteToday && 'opacity-70 bg-obsidian-900/50'
        )}
      >
        {/* ── Checkbox with Circular Streak Progress Ring ── */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={completeMutation.isPending || undoMutation.isPending}
          aria-label={isCompleteToday ? `Undo completion for ${daily.title}` : `Complete ${daily.title}`}
          className={clsx(
            'relative flex items-center justify-center shrink-0',
            'w-11 h-11 min-w-[44px] min-h-[44px] rounded-full',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-attr-perception/60'
          )}
        >
          {/* Progress ring SVG */}
          <svg className="absolute inset-0 w-11 h-11 pointer-events-none" viewBox="0 0 44 44">
            {/* Track */}
            <circle
              cx="22"
              cy="22"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-white/[0.08]"
            />
            {/* Progress */}
            <motion.circle
              cx="22"
              cy="22"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={false}
              animate={{ strokeDashoffset }}
              transition={shouldReduceMotion ? { duration: 0 } : spring.snappy}
              transform="rotate(-90 22 22)"
              className={clsx(isCompleteToday ? 'text-attr-vitality' : 'text-attr-perception')}
            />
          </svg>

          {/* Inner checkbox fill */}
          <div
            className={clsx(
              'w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200 border',
              isCompleteToday
                ? 'bg-attr-vitality border-attr-vitality text-obsidian-950 shadow-glow-vitality'
                : 'border-glass-border bg-obsidian-950/80 hover:border-attr-perception/60 text-transparent'
            )}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <motion.path
                d="M5 13l4 4L19 7"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={false}
                animate={{ pathLength: isCompleteToday ? 1 : 0 }}
                transition={shouldReduceMotion ? { duration: 0 } : spring.snappy}
              />
            </svg>
          </div>
        </button>

        {/* ── Daily Details ── */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3
              className={clsx(
                'text-sm md:text-base font-semibold text-ink truncate max-w-full',
                'transition-opacity duration-150'
              )}
            >
              {daily.title}
            </h3>

            {/* Difficulty Badge */}
            <span
              className={clsx(
                'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider',
                DIFFICULTY_COLORS[daily.difficulty] || DIFFICULTY_COLORS.easy
              )}
            >
              {DIFFICULTY_LABELS[daily.difficulty] || 'Easy'}
            </span>

            {/* Shield Badge */}
            {daily.streakShieldCharges > 0 ? (
              <span
                title={`${daily.streakShieldCharges} streak shield charge(s) active`}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-attr-perception bg-attr-perception/10 border border-attr-perception/30"
              >
                <Shield size={11} className="fill-attr-perception text-attr-perception" />
                <span>{daily.streakShieldCharges}</span>
              </span>
            ) : null}
          </div>

          {daily.description && (
            <p className="text-xs text-ink-muted line-clamp-1 mb-2 leading-relaxed">
              {daily.description}
            </p>
          )}

          {/* Active Days Indicator Pills & Streak Counter */}
          <div className="flex items-center gap-3 flex-wrap pt-0.5">
            {/* 7 Days of Week */}
            <div className="flex items-center gap-1">
              {DAYS_OF_WEEK.map(({ label, day, title }) => {
                const isActive = activeDays.includes(day);
                const isCurrent = day === currentWeekday;
                return (
                  <span
                    key={day}
                    title={`${title}: ${isActive ? 'Due' : 'Off'}`}
                    className={clsx(
                      'w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold transition-all',
                      isActive
                        ? 'bg-obsidian-800 text-ink border border-glass-border'
                        : 'bg-obsidian-950/40 text-ink-muted/30 border border-transparent',
                      isCurrent && isActive && 'ring-1 ring-attr-perception text-attr-perception'
                    )}
                  >
                    {label}
                  </span>
                );
              })}
            </div>

            {/* Streak Counter Badge */}
            <div
              className={clsx(
                'flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-chip border',
                daily.streakCurrent >= 3
                  ? 'text-attr-strength bg-attr-strength/10 border-attr-strength/30'
                  : 'text-ink-muted bg-obsidian-800/60 border-glass-border'
              )}
            >
              <Flame
                size={13}
                className={clsx(
                  daily.streakCurrent >= 3
                    ? 'fill-attr-strength text-attr-strength animate-pulse'
                    : 'text-ink-muted'
                )}
              />
              <span>{daily.streakCurrent || 0}</span>
              <span className="text-[10px] text-ink-muted/70 font-normal">
                (best: {daily.streakBest || 0})
              </span>
            </div>

            {/* Due status hint */}
            {!isDueToday && (
              <span className="text-[11px] text-ink-muted italic">Not due today</span>
            )}
          </div>
        </div>

        {/* ── Actions Menu ── */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Daily options"
            className={clsx(
              'p-2 rounded-panel text-ink-muted hover:text-ink hover:bg-glass',
              'min-w-[44px] min-h-[44px] flex items-center justify-center',
              'transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-glass-border'
            )}
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              <div
                className={clsx(
                  'absolute right-0 top-full mt-1 w-36 rounded-panel py-1 z-30',
                  'bg-obsidian-900 border border-glass-border shadow-modal',
                  'animate-in fade-in zoom-in-95 duration-100'
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit?.(daily);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-ink hover:bg-glass flex items-center gap-2 min-h-[36px]"
                >
                  <Edit2 size={13} />
                  <span>Edit Daily</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    archiveMutation.mutate(daily.id);
                  }}
                  disabled={archiveMutation.isPending}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-attr-strength hover:bg-attr-strength/10 flex items-center gap-2 min-h-[36px]"
                >
                  <Trash2 size={13} />
                  <span>Archive</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

DailyCard.propTypes = {
  daily: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    difficulty: PropTypes.string.isRequired,
    activeDays: PropTypes.arrayOf(PropTypes.number),
    streakCurrent: PropTypes.number,
    streakBest: PropTypes.number,
    streakShieldCharges: PropTypes.number,
    isCompleteToday: PropTypes.bool,
  }).isRequired,
  onEdit: PropTypes.func,
};
