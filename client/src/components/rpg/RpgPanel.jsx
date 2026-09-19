import PropTypes from 'prop-types';
import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import { spring } from '@/lib/motion';

/**
 * RpgPanel — Multi-layered obsidian glass panel with technical corner brackets.
 *
 * Implements the LifeOS glass material:
 * - Base: Dark translucent obsidian surface (bg-obsidian-900/80)
 * - Depth: Backdrop blur (backdrop-blur-xl)
 * - Edge: Very thin luminous border (border-glass-border / border-white/10)
 * - Inner Highlight: Subtle top specular line
 * - Accents: Technical cybernetic corner brackets (┌ ┐ └ ┘)
 * - Depth Response: Smooth hover lift & subtle perspective response
 */
export function RpgPanel({
  children,
  className = '',
  bracketColor = 'text-accent-primary/60',
  glowVariant = 'subtle', // 'none' | 'subtle' | 'cyan' | 'purple' | 'gold'
  interactive = false,
  onClick,
  ...props
}) {
  const shouldReduceMotion = useReducedMotion();

  const glowClasses = {
    none: '',
    subtle: 'shadow-[0_4px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_8px_32px_rgba(56,189,248,0.1)]',
    cyan: 'shadow-[0_0_24px_rgba(56,189,248,0.15)] hover:shadow-[0_0_32px_rgba(56,189,248,0.25)]',
    purple: 'shadow-[0_0_24px_rgba(168,85,247,0.15)] hover:shadow-[0_0_32px_rgba(168,85,247,0.25)]',
    gold: 'shadow-[0_0_24px_rgba(245,158,11,0.15)] hover:shadow-[0_0_32px_rgba(245,158,11,0.25)]',
  };

  const Component = interactive ? motion.div : 'div';

  const motionProps = interactive
    ? {
        whileHover: shouldReduceMotion ? {} : { y: -2, transition: spring.snappy },
        whileTap: shouldReduceMotion ? {} : { scale: 0.99, transition: spring.instant },
        onClick,
      }
    : {};

  return (
    <Component
      className={clsx(
        'relative rounded-card-lg border border-glass-border bg-obsidian-900/80 backdrop-blur-xl overflow-hidden transition-all duration-200',
        glowClasses[glowVariant] || glowClasses.subtle,
        interactive && 'cursor-pointer select-none',
        className
      )}
      {...motionProps}
      {...props}
    >
      {/* 1. Top Specular Edge Highlight */}
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

      {/* 2. Cybernetic Corner Accents (┌ ┐ └ ┘) */}
      <span className={clsx('absolute top-1 left-1.5 font-mono text-[9px] font-bold select-none pointer-events-none leading-none', bracketColor)} aria-hidden="true">┌</span>
      <span className={clsx('absolute top-1 right-1.5 font-mono text-[9px] font-bold select-none pointer-events-none leading-none', bracketColor)} aria-hidden="true">┐</span>
      <span className={clsx('absolute bottom-1 left-1.5 font-mono text-[9px] font-bold select-none pointer-events-none leading-none', bracketColor)} aria-hidden="true">└</span>
      <span className={clsx('absolute bottom-1 right-1.5 font-mono text-[9px] font-bold select-none pointer-events-none leading-none', bracketColor)} aria-hidden="true">┘</span>

      {/* 3. Panel Content */}
      <div className="relative z-10">{children}</div>
    </Component>
  );
}

RpgPanel.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  bracketColor: PropTypes.string,
  glowVariant: PropTypes.oneOf(['none', 'subtle', 'cyan', 'purple', 'gold']),
  interactive: PropTypes.bool,
  onClick: PropTypes.func,
};
