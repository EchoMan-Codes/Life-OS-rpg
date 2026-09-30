import { motion } from 'framer-motion';
import { Coins, Zap, Flame, Sparkles, Heart } from 'lucide-react';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import { useCharacter } from '@/features/character/hooks';
import { useHabits } from '@/features/habits/hooks';
import { openAttributesDrawer } from '@/features/celebration/celebrationEvents';
import { spring } from '@/lib/motionVariants';

/**
 * Mobile Progression HUD (Requirement 16).
 * Prominently surfaces the player's core RPG progression resources on mobile:
 * Level -> XP Progress -> Coins -> Mana -> Streak.
 * Compact, tactile, and designed for 375px viewports.
 */
export function MobileProgressionHud({ className }) {
  const { data: character = {} } = useCharacter();
  const { data: habits = [] } = useHabits();

  const level = character.level ?? 1;
  const xp = character.xp ?? 0;
  const xpForNextLevel = character.xpForNextLevel ?? 100;
  const gold = character.gold ?? 0;
  const mana = character.mana ?? 30;
  const maxMana = character.maxMana ?? 50;
  const hp = character.hp ?? 60;
  const maxHp = character.maxHp ?? 80;

  const xpPercent = Math.min(100, Math.round((xp / Math.max(1, xpForNextLevel)) * 100));

  // Compute highest active streak
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.streakCurrent || 0), 0);

  return (
    <div
      onClick={openAttributesDrawer}
      className={clsx(
        'md:hidden w-full cursor-pointer select-none',
        'p-3 sm:p-3.5 rounded-2xl border transition-all',
        'bg-white/90 border-slate-200/90 text-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.04)]',
        'dark:bg-obsidian-900/80 dark:border-white/10 dark:text-ink dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]',
        'backdrop-blur-xl active:scale-[0.99]',
        className
      )}
      role="button"
      aria-label="View Character Attributes and Progression"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          openAttributesDrawer();
        }
      }}
    >
      {/* ── Row 1: Level Badge & XP Counter ── */}
      <div className="flex items-center justify-between text-xs mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono font-bold text-[11px] border border-amber-500/30">
            LV {level}
          </span>
          <span className="text-[11px] font-semibold text-slate-700 dark:text-ink truncate">
            Hero Progress
          </span>
        </div>

        <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500 dark:text-ink-muted">
          <Sparkles size={11} className="text-amber-500" />
          <span className="font-bold text-slate-700 dark:text-ink">{xp}</span>
          <span>/</span>
          <span>{xpForNextLevel} XP</span>
        </div>
      </div>

      {/* ── Row 2: Animated XP Bar ── */}
      <div className="h-2 rounded-full bg-slate-100 dark:bg-obsidian-800 overflow-hidden mb-2.5 relative border border-slate-200/60 dark:border-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${xpPercent}%` }}
          transition={spring.snappy}
        />
      </div>

      {/* ── Row 3: Core Progression Resources (Coins, Mana, HP, Streak) ── */}
      <div className="grid grid-cols-4 gap-1 pt-1 border-t border-slate-100 dark:border-white/5 text-center">
        {/* Coins */}
        <div className="flex items-center justify-center gap-1 py-1 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-600 dark:text-amber-400">
          <Coins size={12} className="shrink-0" />
          <span className="font-mono font-bold text-xs">{gold}</span>
        </div>

        {/* Mana */}
        <div className="flex items-center justify-center gap-1 py-1 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
          <Zap size={12} className="shrink-0" />
          <span className="font-mono font-bold text-xs">{mana}/{maxMana}</span>
        </div>

        {/* HP */}
        <div className="flex items-center justify-center gap-1 py-1 rounded-lg bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 text-rose-600 dark:text-rose-400">
          <Heart size={12} className="shrink-0" />
          <span className="font-mono font-bold text-xs">{hp}/{maxHp}</span>
        </div>

        {/* Streak */}
        <div className="flex items-center justify-center gap-1 py-1 rounded-lg bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 text-orange-600 dark:text-orange-400">
          <Flame size={12} className="shrink-0 fill-current" />
          <span className="font-mono font-bold text-xs">{bestStreak}d</span>
        </div>
      </div>
    </div>
  );
}

MobileProgressionHud.propTypes = {
  className: PropTypes.string,
};
