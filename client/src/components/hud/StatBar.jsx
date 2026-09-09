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
 * @param {string} [props.className] - Additional wrapper classes
 */
export function StatBar({ type, current, max, label, className }) {
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

  return (
    <div className={clsx('flex flex-col gap-1 min-w-[70px] sm:min-w-[100px] flex-1', className)}>
      {/* Label and numbers */}
      <div className="flex items-center justify-between text-caption font-medium tracking-wider">
        <span className="text-ink-muted uppercase font-display text-[10px] sm:text-xs">
          {label || type}
        </span>
        <span className="text-ink text-[10px] sm:text-xs font-mono font-semibold">
          {current}
          <span className="text-ink-muted font-normal">/{max}</span>
        </span>
      </div>

      {/* Track */}
      <div
        className="bg-obsidian-700 rounded-chip h-2.5 overflow-hidden p-[1px] relative shadow-inner"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label || type} progress`}
      >
        <motion.div
          className={clsx(
            'h-full rounded-chip relative',
            fillClass,
            isLowHp && !shouldReduceMotion && 'animate-pulse'
          )}
          initial={{ width: 0 }}
          animate={{
            width: `${pct}%`,
            ...(isLowHp && !shouldReduceMotion
              ? { opacity: [0.85, 1, 0.85] }
              : { opacity: 1 }),
          }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  width: spring.gentle,
                  opacity: isLowHp
                    ? { repeat: Infinity, duration: 1.2, ease: 'easeInOut' }
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
  className: PropTypes.string,
};
