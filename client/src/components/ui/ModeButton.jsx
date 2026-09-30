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
          'p-2 sm:px-2.5 sm:py-1.5 rounded-xl border border-white/10',
          'bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 text-ink-muted hover:text-ink',
          'flex items-center gap-1.5 text-caption font-medium transition-all shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-white/20 min-h-[36px]'
        )}
      >
        <motion.div
          key={mode}
          initial={{ rotate: -40, opacity: 0, scale: 0.8 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          transition={spring.snappy}
          className="flex items-center justify-center shrink-0 text-attr-perception"
        >
          <CurrentIcon size={15} />
        </motion.div>
        {showLabel && (
          <span className="capitalize text-xs font-semibold hidden sm:inline text-ink">
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
              'bg-obsidian-900/95 border border-glass-border shadow-2xl backdrop-blur-2xl',
              'space-y-1'
            )}
          >
            <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-ink-muted">
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
                      ? 'bg-white/10 text-ink font-semibold'
                      : 'text-ink-muted hover:text-ink hover:bg-white/[0.04]'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={isSelected ? 'text-attr-perception' : 'text-ink-muted'} />
                    <span>{item.label}</span>
                  </div>
                  {isSelected && (
                    <motion.span
                      layoutId="active-theme-check"
                      className="w-1.5 h-1.5 rounded-full bg-attr-perception"
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
