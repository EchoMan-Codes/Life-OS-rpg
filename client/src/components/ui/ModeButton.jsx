import { motion } from 'framer-motion';
import { Sun, Moon, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import { useTheme } from '@/lib/theme';
import { spring } from '@/lib/motionVariants';

const MODE_ICONS = {
  dark: Moon,
  dim: Sparkles,
  light: Sun,
};

/**
 * Tactile, responsive Light/Dark Mode Toggle Button.
 * Instantly toggles between Solar Light and Obsidian Dark mode across the entire app
 * with satisfying micro-interaction physics and zero clipping.
 */
export function ModeButton({ className, compact = false, showLabel = false }) {
  const { mode, toggleTheme, setMode } = useTheme();

  const isLight = mode === 'light';
  const CurrentIcon = isLight ? Sun : Moon;

  const nextModeLabel = isLight ? 'Dark' : 'Light';
  const tooltipText = `Switch to ${nextModeLabel} Mode (Currently ${mode.charAt(0).toUpperCase() + mode.slice(1)})`;

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      onContextMenu={(e) => {
        // Right-click cycles to Dim mode for power users
        e.preventDefault();
        const cycle = mode === 'light' ? 'dark' : mode === 'dark' ? 'dim' : 'light';
        setMode(cycle);
      }}
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.04 }}
      title={tooltipText}
      aria-label={tooltipText}
      className={clsx(
        'relative inline-flex items-center justify-center rounded-xl border transition-all duration-200 shadow-xs cursor-pointer select-none',
        compact
          ? 'w-9 h-9 min-w-[36px] min-h-[36px] p-0'
          : 'h-9 min-h-[36px] px-2.5 sm:px-3 gap-1.5',
        isLight
          ? 'bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/30 text-amber-600 hover:text-amber-700 shadow-amber-500/5'
          : 'bg-indigo-500/10 hover:bg-indigo-500/15 border-indigo-500/30 text-indigo-400 hover:text-indigo-300 shadow-indigo-500/5',
        'focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-indigo-500/20',
        className
      )}
    >
      <motion.div
        key={mode}
        initial={{ rotate: -50, scale: 0.7, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 50, scale: 0.7, opacity: 0 }}
        transition={spring.snappy}
        className="flex items-center justify-center shrink-0"
      >
        <CurrentIcon
          size={compact ? 16 : 15}
          className={clsx(
            'transition-transform duration-200',
            isLight ? 'text-amber-600 fill-amber-500/20' : 'text-indigo-400 fill-indigo-400/20'
          )}
        />
      </motion.div>

      {showLabel && (
        <span className="capitalize text-xs font-semibold font-display tracking-wide hidden sm:inline">
          {mode}
        </span>
      )}
    </motion.button>
  );
}

ModeButton.propTypes = {
  className: PropTypes.string,
  compact: PropTypes.bool,
  showLabel: PropTypes.bool,
};
