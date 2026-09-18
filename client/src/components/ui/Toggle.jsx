import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import { spring } from '@/lib/motion';

/**
 * Canonical LifeOS Toggle (Switch) component.
 *
 * Enforces:
 * - 44px hit-target hit zone
 * - Spring thumb translation
 * - Full keyboard navigation (Space / Enter to toggle)
 * - Accessible switch semantics (role="switch", aria-checked)
 */
export function Toggle({
  checked = false,
  onChange,
  label,
  disabled = false,
  className,
  id,
}) {
  const shouldReduceMotion = useReducedMotion();
  const toggleId = id || `toggle-${Math.random().toString(36).substring(2, 9)}`;

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
      {/* 44px hit target wrapper */}
      <div
        role="switch"
        id={toggleId}
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        className={clsx(
          'relative flex items-center justify-center w-11 h-11 -m-1.5 rounded-full',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary'
        )}
      >
        {/* Track */}
        <div
          className={clsx(
            'w-11 h-6 rounded-full p-0.5 transition-colors duration-200 border',
            checked
              ? 'bg-accent-primary border-accent-primary'
              : 'bg-obsidian-800 border-glass-border-strong group-hover:border-white/30'
          )}
        >
          {/* Sliding Thumb */}
          <motion.div
            className="w-5 h-5 rounded-full bg-white shadow-elevation-subtle"
            animate={{ x: checked ? 20 : 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : spring.snappy}
          />
        </div>
      </div>

      {label && <span className="text-sm font-medium text-ink">{label}</span>}
    </div>
  );
}

Toggle.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  label: PropTypes.node,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  id: PropTypes.string,
};
