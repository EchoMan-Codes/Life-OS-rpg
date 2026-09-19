import PropTypes from 'prop-types';
import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import { spring } from '@/lib/motion';

/**
 * HolographicFrame — Signature Solo-Leveling-inspired quest frame.
 * Features:
 * - Asymmetric technical outer frame with plasma energy border
 * - Glowing corner brackets (┌ ┐ └ ┘)
 * - Layered glass surface with inner dark void
 * - Technical monospace system header
 */
export function HolographicFrame({
  children,
  headerTag = '[ SYSTEM DIRECTIVE ]',
  subtitle = "Today's Main Quest",
  badge,
  className = '',
  energyColor = 'violet', // 'cyan' | 'violet' | 'blue'
  ...props
}) {
  const shouldReduceMotion = useReducedMotion();

  const energyStyles = {
    cyan: {
      border: 'border-cyan-500/50',
      glow: 'shadow-[0_0_30px_rgba(6,182,212,0.2),inset_0_0_20px_rgba(6,182,212,0.06)]',
      bracket: 'text-cyan-400',
      header: 'text-cyan-400',
      line: 'via-cyan-500/30',
    },
    violet: {
      border: 'border-purple-500/60',
      glow: 'shadow-[0_0_30px_rgba(168,85,247,0.25),inset_0_0_20px_rgba(168,85,247,0.08)]',
      bracket: 'text-purple-400',
      header: 'text-purple-400',
      line: 'via-purple-500/30',
    },
    blue: {
      border: 'border-blue-500/50',
      glow: 'shadow-[0_0_30px_rgba(59,130,246,0.2),inset_0_0_20px_rgba(59,130,246,0.06)]',
      bracket: 'text-blue-400',
      header: 'text-blue-400',
      line: 'via-blue-500/30',
    },
  };

  const currentEnergy = energyStyles[energyColor] || energyStyles.violet;

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={spring.gentle}
      className={clsx(
        'relative rounded-2xl border bg-linear-to-b from-obsidian-900/95 via-obsidian-950/95 to-obsidian-900/95 backdrop-blur-2xl p-5 sm:p-6 overflow-hidden transition-shadow duration-300',
        currentEnergy.border,
        currentEnergy.glow,
        className
      )}
      {...props}
    >
      {/* 1. Plasma Energy Horizon Lines */}
      <div className={clsx('absolute top-0 inset-x-0 h-0.5 bg-linear-to-r from-transparent to-transparent', currentEnergy.line)} />
      <div className={clsx('absolute bottom-0 inset-x-0 h-0.5 bg-linear-to-r from-transparent to-transparent', currentEnergy.line)} />

      {/* 2. Cybernetic Corner Accents */}
      <span className={clsx('absolute top-2 left-2.5 font-mono text-xs font-bold select-none pointer-events-none drop-shadow-sm', currentEnergy.bracket)} aria-hidden="true">┌</span>
      <span className={clsx('absolute top-2 right-2.5 font-mono text-xs font-bold select-none pointer-events-none drop-shadow-sm', currentEnergy.bracket)} aria-hidden="true">┐</span>
      <span className={clsx('absolute bottom-2 left-2.5 font-mono text-xs font-bold select-none pointer-events-none drop-shadow-sm', currentEnergy.bracket)} aria-hidden="true">└</span>
      <span className={clsx('absolute bottom-2 right-2.5 font-mono text-xs font-bold select-none pointer-events-none drop-shadow-sm', currentEnergy.bracket)} aria-hidden="true">┘</span>

      {/* 3. Header Bar with System Monospace Tag & Optional Difficulty Badge */}
      <div className="relative z-10 flex items-center justify-between gap-3 mb-3.5 pb-2 border-b border-white/5">
        <div>
          <div className={clsx('font-mono text-[11px] font-bold tracking-widest uppercase', currentEnergy.header)}>
            {headerTag}
          </div>
          {subtitle && (
            <div className="text-xs text-ink-muted font-medium mt-0.5 tracking-tight">
              {subtitle}
            </div>
          )}
        </div>
        {badge && <div>{badge}</div>}
      </div>

      {/* 4. Frame Inner Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

HolographicFrame.propTypes = {
  children: PropTypes.node,
  headerTag: PropTypes.string,
  subtitle: PropTypes.string,
  badge: PropTypes.node,
  className: PropTypes.string,
  energyColor: PropTypes.oneOf(['cyan', 'violet', 'blue']),
};
