import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import { motionPresets } from '@/lib/motion';

/**
 * Variant gradient and color definitions for LifeOS Progress Bar.
 */
const variantColors = {
  xp: 'bg-gradient-to-r from-xp to-gold',
  hp: 'bg-gradient-to-r from-danger to-hp',
  mana: 'bg-gradient-to-r from-mana to-accent-secondary',
  gold: 'bg-gradient-to-r from-gold to-yellow-300',
  focus: 'bg-gradient-to-r from-focus to-accent-secondary',
  strength: 'bg-attr-strength',
  intelligence: 'bg-attr-intelligence',
  vitality: 'bg-attr-vitality',
  willpower: 'bg-attr-willpower',
  perception: 'bg-attr-perception',
  default: 'bg-accent-primary',
};

/**
 * Canonical LifeOS Progress component.
 *
 * Provides:
 * - Smooth interpolated fill animation using spring/motion presets
 * - Milestone diamond indicators
 * - Proper ARIA progressbar semantics
 */
export function Progress({
  value = 0,
  max = 100,
  variant = 'xp',
  size = 'md',
  milestones = [],
  showLabel = false,
  label,
  className,
}) {
  const shouldReduceMotion = useReducedMotion();
  const clampedValue = Math.min(Math.max(value, 0), max);
  const percentage = max > 0 ? Math.round((clampedValue / max) * 100) : 0;

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const fillTransition = shouldReduceMotion
    ? { duration: 0 }
    : motionPresets.progressFill.transition;

  return (
    <div className={clsx('flex flex-col gap-1.5 w-full', className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span>{label || 'Progress'}</span>
          <span className="font-mono tabular-nums font-semibold text-ink">
            {clampedValue}/{max} ({percentage}%)
          </span>
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={max}
        className={clsx(
          'relative w-full rounded-full bg-obsidian-950/70 border border-glass-border/40 overflow-visible flex items-center',
          heightClasses[size] || heightClasses.md
        )}
      >
        {/* Animated fill track */}
        <motion.div
          className={clsx(
            'h-full rounded-full',
            variantColors[variant] || variantColors.default
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={fillTransition}
        />

        {/* Milestone diamond markers */}
        {milestones.map((m) => {
          const milestonePercent = typeof m === 'number' ? m : m.thresholdPercent;
          const isReached = percentage >= milestonePercent;
          return (
            <div
              key={milestonePercent}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group/marker z-10"
              style={{ left: `${milestonePercent}%` }}
              title={typeof m === 'object' ? m.title : `${milestonePercent}% Milestone`}
            >
              <div
                className={clsx(
                  'w-3 h-3 rotate-45 rounded-[2px] border transition-colors duration-200 flex items-center justify-center',
                  isReached
                    ? 'bg-gold border-gold text-obsidian-950 shadow-glow'
                    : 'bg-obsidian-900 border-glass-border text-ink-muted'
                )}
              >
                {isReached && <div className="w-1 h-1 rounded-full bg-obsidian-950 -rotate-45" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Progress.propTypes = {
  value: PropTypes.number,
  max: PropTypes.number,
  variant: PropTypes.oneOf([
    'xp',
    'hp',
    'mana',
    'gold',
    'focus',
    'strength',
    'intelligence',
    'vitality',
    'willpower',
    'perception',
    'default',
  ]),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  milestones: PropTypes.array,
  showLabel: PropTypes.bool,
  label: PropTypes.string,
  className: PropTypes.string,
};
