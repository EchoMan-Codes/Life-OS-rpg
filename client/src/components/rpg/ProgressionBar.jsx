import PropTypes from 'prop-types';
import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import { spring } from '@/lib/motion';

/**
 * ProgressionBar — RPG progression bar supporting segmented blocks or continuous fill.
 *
 * Implements:
 * - Segmented multi-block mode (e.g. [ 3 / 5 ]) with gradient glow
 * - Continuous percentage mode with glowing leading head
 * - Smooth Framer Motion spring fill
 */
export function ProgressionBar({
  value = 0,
  max = 100,
  segments = 0, // if > 0, renders segmented blocks
  colorVariant = 'cyan', // 'cyan' | 'purple' | 'amber' | 'emerald' | 'gradient'
  showLabel = true,
  className = '',
}) {
  const shouldReduceMotion = useReducedMotion();
  const clampedValue = Math.max(0, Math.min(max, value));
  const pct = max > 0 ? Math.round((clampedValue / max) * 100) : 0;

  const gradientMap = {
    cyan: 'bg-linear-to-r from-blue-600 via-sky-500 to-cyan-400',
    purple: 'bg-linear-to-r from-purple-600 via-violet-500 to-fuchsia-400',
    amber: 'bg-linear-to-r from-amber-600 via-yellow-500 to-amber-400',
    emerald: 'bg-linear-to-r from-emerald-600 via-teal-500 to-emerald-400',
    gradient: 'bg-linear-to-r from-purple-600 via-indigo-500 to-cyan-400',
  };

  const glowMap = {
    cyan: 'shadow-[0_0_12px_rgba(56,189,248,0.5)]',
    purple: 'shadow-[0_0_12px_rgba(168,85,247,0.5)]',
    amber: 'shadow-[0_0_12px_rgba(245,158,11,0.5)]',
    emerald: 'shadow-[0_0_12px_rgba(16,185,129,0.5)]',
    gradient: 'shadow-[0_0_14px_rgba(56,189,248,0.4)]',
  };

  const activeGradient = gradientMap[colorVariant] || gradientMap.cyan;
  const activeGlow = glowMap[colorVariant] || glowMap.cyan;

  // Segmented Mode
  if (segments > 0) {
    const activeSegments = Math.round((clampedValue / max) * segments);

    return (
      <div className={clsx('space-y-1.5', className)}>
        <div className="flex items-center gap-1.5 h-3">
          {Array.from({ length: segments }).map((_, idx) => {
            const isActive = idx < activeSegments;
            return (
              <div
                key={idx}
                className={clsx(
                  'flex-1 h-full rounded-xs transition-all duration-300',
                  isActive
                    ? clsx(activeGradient, activeGlow)
                    : 'bg-obsidian-800/80 border border-white/5'
                )}
              />
            );
          })}
        </div>
        {showLabel && (
          <div className="flex justify-between items-center text-[10px] font-mono text-ink-muted">
            <span className="font-semibold text-ink-secondary">PROGRESS</span>
            <span>[{clampedValue} / {max}]</span>
          </div>
        )}
      </div>
    );
  }

  // Continuous Fill Mode
  return (
    <div className={clsx('space-y-1', className)}>
      <div className="relative h-2 sm:h-2.5 rounded-full bg-obsidian-950 border border-white/10 overflow-hidden p-0.5 shadow-inner">
        <motion.div
          className={clsx('h-full rounded-full transition-all', activeGradient, activeGlow)}
          initial={shouldReduceMotion ? { width: `${pct}%` } : { width: '0%' }}
          animate={{ width: `${pct}%` }}
          transition={shouldReduceMotion ? { duration: 0 } : spring.gentle}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center text-[10px] font-mono text-ink-muted px-0.5">
          <span>{clampedValue} / {max}</span>
          <span className="font-semibold">{pct}%</span>
        </div>
      )}
    </div>
  );
}

ProgressionBar.propTypes = {
  value: PropTypes.number,
  max: PropTypes.number,
  segments: PropTypes.number,
  colorVariant: PropTypes.oneOf(['cyan', 'purple', 'amber', 'emerald', 'gradient']),
  showLabel: PropTypes.bool,
  className: PropTypes.string,
};
