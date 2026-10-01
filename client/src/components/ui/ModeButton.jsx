import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import { useTheme } from '@/lib/theme';
import { spring } from '@/lib/motionVariants';

/**
 * Tactile, Cinematic Light/Dark Mode Toggle Button.
 * Emits radiating sparks/solar rays on tap, detects exact screen coordinates,
 * and triggers a smooth physical distribution of light or cosmic nightfall.
 */
export function ModeButton({ className, compact = false, showLabel = false }) {
  const { mode, toggleThemeWithTransition, setMode } = useTheme();
  const buttonRef = useRef(null);
  const [isSparking, setIsSparking] = useState(false);

  const isLight = mode === 'light';
  const CurrentIcon = isLight ? Sun : Moon;

  const nextModeLabel = isLight ? 'Dark' : 'Light';
  const tooltipText = `Switch to ${nextModeLabel} Mode (Currently ${mode.charAt(0).toUpperCase() + mode.slice(1)})`;

  const handleClick = (e) => {
    setIsSparking(true);
    setTimeout(() => setIsSparking(false), 550);
    toggleThemeWithTransition(e);
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* ── Micro-Interaction Particle Spark Rays ── */}
      <AnimatePresence>
        {isSparking && (
          <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <motion.div
                key={deg}
                initial={{ opacity: 1, scale: 0.2, x: 0, y: 0 }}
                animate={{
                  opacity: 0,
                  scale: 1,
                  x: Math.cos((deg * Math.PI) / 180) * (compact ? 22 : 26),
                  y: Math.sin((deg * Math.PI) / 180) * (compact ? 22 : 26),
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className={clsx(
                  'absolute w-1.5 h-1.5 rounded-full shadow-sm',
                  isLight
                    ? 'bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]'
                    : 'bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.9)]'
                )}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          const cycle = mode === 'light' ? 'dark' : mode === 'dark' ? 'dim' : 'light';
          setMode(cycle);
        }}
        whileTap={{ scale: 0.90 }}
        whileHover={{ scale: 1.05 }}
        title={tooltipText}
        aria-label={tooltipText}
        className={clsx(
          'relative inline-flex items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer select-none overflow-visible',
          compact
            ? 'w-9 h-9 min-w-[36px] min-h-[36px] p-0'
            : 'h-9 min-h-[36px] px-2.5 sm:px-3 gap-1.5',
          isLight
            ? 'bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/35 text-amber-600 hover:text-amber-700 shadow-[0_2px_10px_rgba(245,158,11,0.12)]'
            : 'bg-indigo-500/15 hover:bg-indigo-500/25 border-indigo-500/35 text-indigo-300 hover:text-indigo-200 shadow-[0_2px_12px_rgba(99,102,241,0.18)]',
          'focus:outline-none focus:ring-2 focus:ring-amber-500/25 dark:focus:ring-indigo-500/25',
          className
        )}
      >
        {/* Glow ambient aura behind icon */}
        <div
          className={clsx(
            'absolute inset-0 rounded-xl transition-opacity duration-300 opacity-0 group-hover:opacity-100 blur-sm pointer-events-none',
            isLight ? 'bg-amber-400/20' : 'bg-indigo-500/25'
          )}
        />

        <motion.div
          key={mode}
          initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
          transition={spring.snappy}
          className="flex items-center justify-center shrink-0 z-10"
        >
          <CurrentIcon
            size={compact ? 16 : 15}
            className={clsx(
              'transition-all duration-200',
              isLight
                ? 'text-amber-500 fill-amber-400/25 drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]'
                : 'text-indigo-300 fill-indigo-400/20 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]'
            )}
          />
        </motion.div>

        {showLabel && (
          <span className="capitalize text-xs font-semibold font-display tracking-wide hidden sm:inline z-10">
            {mode}
          </span>
        )}
      </motion.button>
    </div>
  );
}

ModeButton.propTypes = {
  className: PropTypes.string,
  compact: PropTypes.bool,
  showLabel: PropTypes.bool,
};
