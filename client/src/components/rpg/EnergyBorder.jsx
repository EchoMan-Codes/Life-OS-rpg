import PropTypes from 'prop-types';
import clsx from 'clsx';
import { useReducedMotion } from 'framer-motion';

/**
 * EnergyBorder — Luminous cybernetic frame with animated energy pulse and corner brackets.
 */
export function EnergyBorder({
  children,
  energyColor = 'cyan', // 'cyan' | 'purple' | 'blue'
  cornerAccents = true,
  className = '',
}) {
  const shouldReduceMotion = useReducedMotion();

  const colorStyles = {
    cyan: {
      border: 'border-cyan-500/40',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.2)]',
      corner: 'text-cyan-400',
      gradient: 'from-blue-600 via-cyan-400 to-indigo-600',
    },
    purple: {
      border: 'border-purple-500/40',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]',
      corner: 'text-purple-400',
      gradient: 'from-purple-600 via-fuchsia-400 to-indigo-600',
    },
    blue: {
      border: 'border-blue-500/40',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]',
      corner: 'text-blue-400',
      gradient: 'from-indigo-600 via-sky-400 to-blue-600',
    },
  };

  const style = colorStyles[energyColor] || colorStyles.cyan;

  return (
    <div
      className={clsx(
        'relative rounded-xl border bg-obsidian-900/80 backdrop-blur-xl p-4 overflow-hidden',
        style.border,
        style.glow,
        className
      )}
    >
      {/* Animated Subtle Shimmer Sweep */}
      {!shouldReduceMotion && (
        <div
          className={clsx(
            'absolute inset-0 opacity-15 pointer-events-none bg-linear-to-r bg-size-[200%_100%] animate-pulse',
            style.gradient
          )}
        />
      )}

      {/* Cybernetic Corner Brackets */}
      {cornerAccents && (
        <>
          <span className={clsx('absolute top-1 left-1.5 font-mono text-[9px] font-bold select-none pointer-events-none', style.corner)}>┌</span>
          <span className={clsx('absolute top-1 right-1.5 font-mono text-[9px] font-bold select-none pointer-events-none', style.corner)}>┐</span>
          <span className={clsx('absolute bottom-1 left-1.5 font-mono text-[9px] font-bold select-none pointer-events-none', style.corner)}>└</span>
          <span className={clsx('absolute bottom-1 right-1.5 font-mono text-[9px] font-bold select-none pointer-events-none', style.corner)}>┘</span>
        </>
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
}

EnergyBorder.propTypes = {
  children: PropTypes.node,
  energyColor: PropTypes.oneOf(['cyan', 'purple', 'blue']),
  cornerAccents: PropTypes.bool,
  className: PropTypes.string,
};
