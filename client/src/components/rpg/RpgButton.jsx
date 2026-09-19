import PropTypes from 'prop-types';
import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import { spring } from '@/lib/motion';

/**
 * RpgButton — Tactile dimensional command button with glowing plasma rim.
 * Features:
 * - Subtle chamfered/beveled appearance
 * - Plasma energy border
 * - Tactile spring press (scale: 0.97)
 * - Specular edge highlight
 */
export function RpgButton({
  children,
  onClick,
  variant = 'primary', // 'primary' | 'secondary' | 'holographic' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: Icon,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  const shouldReduceMotion = useReducedMotion();

  const variantStyles = {
    primary:
      'bg-linear-to-r from-blue-600 via-sky-500 to-cyan-500 text-obsidian-950 font-bold border border-cyan-300/50 shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:shadow-[0_0_28px_rgba(56,189,248,0.6)] hover:brightness-110',
    secondary:
      'bg-obsidian-850/90 text-ink font-semibold border border-glass-border hover:border-accent-primary/40 hover:bg-obsidian-800 shadow-elevation-subtle hover:shadow-glow',
    holographic:
      'bg-linear-to-r from-purple-900/60 via-indigo-900/60 to-purple-900/60 text-purple-200 font-bold border border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:shadow-[0_0_28px_rgba(168,85,247,0.55)] hover:text-white',
    ghost:
      'bg-transparent text-ink-muted hover:text-ink hover:bg-white/5 border border-transparent hover:border-white/10',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
    md: 'px-4 py-2 text-xs sm:text-sm gap-2 rounded-xl',
    lg: 'px-6 py-3 text-sm sm:text-base gap-2.5 rounded-xl',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={shouldReduceMotion || disabled ? {} : { scale: 1.02, transition: spring.snappy }}
      whileTap={shouldReduceMotion || disabled ? {} : { scale: 0.97, transition: spring.instant }}
      className={clsx(
        'relative inline-flex items-center justify-center font-mono tracking-wider uppercase select-none transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
        variantStyles[variant] || variantStyles.primary,
        sizeStyles[size] || sizeStyles.md,
        className
      )}
      {...props}
    >
      {/* Specular Glint */}
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

      {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} className="shrink-0" />}
      <span>{children}</span>
    </motion.button>
  );
}

RpgButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['primary', 'secondary', 'holographic', 'ghost']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  icon: PropTypes.elementType,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  type: PropTypes.string,
};
