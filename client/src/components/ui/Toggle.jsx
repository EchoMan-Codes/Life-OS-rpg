import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import { spring } from '@/lib/motion';

/**
 * Canonical LifeOS Toggle (Switch) component.
 * Reinterprets physical dimensional switch controls with concave inset track,
 * tactile thumb, and spring physics.
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
  const reactId = useId();
  const toggleId = id || `toggle-${reactId}`;

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
        {/* Dimensional Inset Track (Image 4) */}
        <div
          className={clsx(
            'w-12 h-6.5 rounded-full p-0.5 transition-all duration-300 border relative overflow-hidden',
            'shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]',
            checked
              ? 'bg-linear-to-r from-accent-primary/80 to-accent-secondary/80 border-accent-primary/50 shadow-[inset_0_0_8px_rgba(168,85,247,0.4)]'
              : 'bg-obsidian-950 border-glass-border-strong group-hover:border-white/20'
          )}
        >
          {/* Subtle track specular edge */}
          <div className="absolute inset-x-0 top-0 h-px bg-white/15 pointer-events-none" />

          {/* Physical Sliding Tactile Thumb (Image 4) */}
          <motion.div
            className={clsx(
              'w-5.5 h-5.5 rounded-full relative flex items-center justify-center',
              'bg-linear-to-b from-white via-slate-100 to-slate-300',
              'shadow-[0_2px_4px_rgba(0,0,0,0.4),0_0_1px_rgba(255,255,255,0.8)_inset]',
              'border border-white/60'
            )}
            animate={{ x: checked ? 22 : 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : spring.snappy}
          >
            {/* Center optical dimple */}
            <div
              className={clsx(
                'w-1.5 h-1.5 rounded-full transition-colors duration-200',
                checked ? 'bg-accent-primary shadow-[0_0_4px_rgba(168,85,247,0.8)]' : 'bg-slate-400'
              )}
            />
          </motion.div>
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
