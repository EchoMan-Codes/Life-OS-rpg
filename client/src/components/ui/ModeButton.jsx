import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Sparkles, Monitor } from 'lucide-react';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import { useTheme } from '@/lib/theme';
import { spring } from '@/lib/motionVariants';

const MODE_ICONS = {
  dark: Moon,
  dim: Sparkles,
  light: Sun,
  system: Monitor,
};

/**
 * Polished Mode Button for desktop HUD and mobile profile/settings.
 * Features smooth icon rotation transitions and accessible popover menu.
 */
export function ModeButton({ className, compact = false, showLabel = false }) {
  const { mode, setMode, availableModes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const CurrentIcon = MODE_ICONS[mode] || Moon;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelectMode = (newMode) => {
    setMode(newMode);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={clsx('relative inline-flex items-center', className)}>
      <motion.button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        whileTap={{ scale: 0.94 }}
        title={`Appearance: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`}
        aria-label="Toggle appearance mode"
        aria-expanded={isOpen}
        className={clsx(
          'p-2 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all duration-200 shadow-xs min-h-[36px] flex items-center gap-1.5',
          'bg-white/90 border-slate-200/90 text-slate-700 hover:text-slate-900 hover:bg-slate-100/80',
          'dark:bg-white/[0.04] dark:border-white/10 dark:text-ink-muted dark:hover:text-ink dark:hover:bg-white/[0.08]',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-white/20'
        )}
      >
        <motion.div
          key={mode}
          initial={{ rotate: -40, opacity: 0, scale: 0.8 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          transition={spring.snappy}
          className="flex items-center justify-center shrink-0 text-amber-500 dark:text-attr-perception"
        >
          <CurrentIcon size={15} />
        </motion.div>
        {showLabel && (
          <span className="capitalize text-xs font-semibold hidden sm:inline text-slate-800 dark:text-ink">
            {mode}
          </span>
        )}
      </motion.button>

      {/* Popover Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={spring.ios}
            className={clsx(
              'absolute top-full right-0 mt-2 z-50 w-44 p-1.5 rounded-2xl',
              'bg-white/95 dark:bg-obsidian-900/95 border border-slate-200/90 dark:border-glass-border shadow-2xl backdrop-blur-2xl',
              'space-y-1'
            )}
          >
            <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-ink-muted">
              Appearance
            </div>
            {availableModes.map((item) => {
              const Icon = MODE_ICONS[item.id];
              const isSelected = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectMode(item.id)}
                  className={clsx(
                    'w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all',
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-white/10 dark:text-ink'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 dark:text-ink-muted dark:hover:text-ink dark:hover:bg-white/[0.04]'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={isSelected ? 'text-indigo-600 dark:text-attr-perception' : 'text-slate-400 dark:text-ink-muted'} />
                    <span>{item.label}</span>
                  </div>
                  {isSelected && (
                    <motion.span
                      layoutId="active-theme-check"
                      className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-attr-perception"
                      transition={spring.snappy}
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

ModeButton.propTypes = {
  className: PropTypes.string,
  compact: PropTypes.bool,
  showLabel: PropTypes.bool,
};
