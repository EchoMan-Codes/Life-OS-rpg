import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import { spring } from '@/lib/motionVariants';

/**
 * Animated stat bar with easing transitions and low-stat warning pulses.
 *
 * @param {object} props
 * @param {'hp'|'mana'|'xp'} props.type - Bar stat category
 * @param {number} props.current - Current stat value
 * @param {number} props.max - Maximum stat capacity
 * @param {string} [props.label] - Bar identifier label
 * @param {boolean} [props.compact=false] - Compact mode for mobile (shorter track, inline numbers)
 * @param {string} [props.className] - Additional wrapper classes
 */
export function StatBar({ type, current, max, label, compact = false, className }) {
  const shouldReduceMotion = useReducedMotion();
  const safeMax = Math.max(1, max);
  const pct = Math.max(0, Math.min(100, Math.round((current / safeMax) * 100)));
  const isLowHp = type === 'hp' && pct < 25;

  let fillClass = 'bg-hp';
  if (type === 'mana') {
    fillClass = 'bg-mana';
  } else if (type === 'xp') {
    fillClass = 'bg-gradient-to-r from-xp to-gold';
  }

  if (compact) {
    return (
      <div className={clsx('flex flex-col gap-0.5 min-w-0 flex-1', className)}>
        {/* Compact: label and value on single line */}
        <div className="flex items-center justify-between">
          <span className="text-ink-muted uppercase font-display text-[9px] font-medium tracking-wider">
            {label || type}
          </span>
          <span className="text-ink text-[9px] font-mono font-semibold tabular-nums">
            {current}
            <span className="text-ink-muted font-normal">/{max}</span>
          </span>
        </div>

        {/* Compact track — thinner */}
        <div
          className="bg-obsidian-700/80 rounded-chip h-1.5 overflow-hidden p-px relative shadow-inner"
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={`${label || type} progress`}
        >
          <motion.div
            className={clsx('h-full rounded-chip relative', fillClass)}
            initial={{ width: 0 }}
            animate={{
              width: `${pct}%`,
              opacity: isLowHp && !shouldReduceMotion ? [0.65, 1, 0.65] : 1,
            }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : {
                    width: spring.gentle,
                    opacity: isLowHp
                      ? { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
                      : { duration: 0.2 },
                  }
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('flex flex-col gap-1 min-w-17.5 sm:min-w-25 flex-1', className)}>
      {/* Label and numbers */}
      <div className="flex items-center justify-between text-caption font-medium tracking-wider">
        <span className="text-ink-muted uppercase font-display text-[10px] sm:text-xs">
          {label || type}
        </span>
        <span className="text-ink text-[10px] sm:text-xs font-mono font-semibold tabular-nums">
          {current}
          <span className="text-ink-muted font-normal">/{max}</span>
        </span>
      </div>

      {/* Track */}
      <div
        className="bg-obsidian-700/80 rounded-chip h-2 overflow-hidden p-px relative shadow-inner"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label || type} progress`}
      >
        <motion.div
          className={clsx('h-full rounded-chip relative', fillClass)}
          initial={{ width: 0 }}
          animate={{
            width: `${pct}%`,
            opacity: isLowHp && !shouldReduceMotion ? [0.65, 1, 0.65] : 1,
          }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  width: spring.gentle,
                  opacity: isLowHp
                    ? { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
                    : { duration: 0.2 },
                }
          }
        />
      </div>
    </div>
  );
}

StatBar.propTypes = {
  type: PropTypes.oneOf(['hp', 'mana', 'xp']).isRequired,
  current: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  label: PropTypes.string,
  compact: PropTypes.bool,
  className: PropTypes.string,
};
