import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import { spring } from '@/lib/motion';

/**
 * Canonical LifeOS Checkbox component.
 *
 * Provides:
 * - Tactile RPG state transition with spring check animation
 * - 44px minimum interactive hit area
 * - Full keyboard navigation (Space to toggle)
 * - Accessible ARIA checkbox semantics
 */
export function Checkbox({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  className,
  id,
}) {
  const shouldReduceMotion = useReducedMotion();
  const checkboxId = id || `checkbox-${Math.random().toString(36).substring(2, 9)}`;

  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-3 cursor-pointer select-none group',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      onClick={handleClick}
    >
      {/* Interactive 44px hit-target wrapper */}
      <div
        role="checkbox"
        id={checkboxId}
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        className={clsx(
          'relative flex items-center justify-center w-11 h-11 -m-2.5 rounded-full',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary'
        )}
      >
        {/* Visual box */}
        <div
          className={clsx(
            'w-5 h-5 rounded-[6px] border flex items-center justify-center transition-colors duration-150',
            checked
              ? 'bg-gradient-to-br from-success to-emerald-600 border-success shadow-glow'
              : 'bg-obsidian-800 border-glass-border-strong group-hover:border-white/30'
          )}
        >
          {checked && (
            <motion.svg
              className="w-3.5 h-3.5 text-obsidian-950 stroke-[3]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              initial={shouldReduceMotion ? { opacity: 1 } : { scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={spring.snappy}
            >
              <polyline points="20 6 9 17 4 12" />
            </motion.svg>
          )}
        </div>
      </div>

      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span
              className={clsx(
                'text-sm font-medium transition-colors',
                checked ? 'text-ink-muted line-through' : 'text-ink'
              )}
            >
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-ink-muted">{description}</span>
          )}
        </div>
      )}
    </div>
  );
}

Checkbox.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  label: PropTypes.node,
  description: PropTypes.node,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  id: PropTypes.string,
};
