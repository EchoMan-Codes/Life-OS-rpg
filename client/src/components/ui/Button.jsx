import { forwardRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import { spring } from '@/lib/motion';

/**
 * Attribute color mappings for the 'attr' button variant.
 */
const attrGlowMap = {
  strength: 'shadow-glow-strength border-attr-strength/50 text-attr-strength hover:bg-attr-strength/10',
  intelligence: 'shadow-glow-intelligence border-attr-intelligence/50 text-attr-intelligence hover:bg-attr-intelligence/10',
  vitality: 'shadow-glow-vitality border-attr-vitality/50 text-attr-vitality hover:bg-attr-vitality/10',
  willpower: 'shadow-glow-willpower border-attr-willpower/50 text-attr-willpower hover:bg-attr-willpower/10',
  perception: 'shadow-glow-perception border-attr-perception/50 text-attr-perception hover:bg-attr-perception/10',
};

/**
 * Canonical LifeOS Button component.
 *
 * Supports:
 * - Variants: primary, secondary, ghost, destructive, success, glass, attr
 * - Sizes: xs, sm, md, lg (all enforcing 44px interactive hit area)
 * - Modes: icon-only, fullWidth, loading, success
 * - States: hover, press (sub-100ms scale on pointer-down), focus-visible ring, disabled
 */
export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    attribute,
    type = 'button',
    className,
    children,
    disabled = false,
    loading = false,
    success = false,
    iconOnly = false,
    fullWidth = false,
    'aria-label': ariaLabel,
    onClick,
    ...props
  },
  ref
) {
  const shouldReduceMotion = useReducedMotion();

  // Accessibility check for icon-only buttons
  if (iconOnly && !ariaLabel && typeof children !== 'string') {
    console.warn('LifeOS Button: icon-only buttons must provide an aria-label for accessibility.');
  }

  // Motion press compression firing on pointer-down (sub-100ms)
  const motionProps = shouldReduceMotion || disabled || loading
    ? {}
    : {
        whileTap: { scale: 0.97 },
        whileHover: { scale: 1.01 },
        transition: spring.press,
      };

  // Base geometry & accessible interactive target
  const baseClasses = clsx(
    'relative inline-flex items-center justify-center select-none font-body font-medium',
    'transition-colors duration-150',
    'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian',
    'rounded-control',
    fullWidth ? 'w-full' : 'w-auto',
    (disabled || loading) && 'opacity-50 cursor-not-allowed pointer-events-none'
  );

  // Size definitions — every size satisfies the 44px hit-target requirement
  const sizeClasses = {
    xs: iconOnly
      ? 'w-8 h-8 text-xs hit-area-expand'
      : 'px-3 py-1.5 text-xs min-h-[32px] hit-area-expand gap-1.5',
    sm: iconOnly
      ? 'w-9 h-9 text-sm hit-area-expand'
      : 'px-3.5 py-2 text-sm min-h-[38px] hit-area-expand gap-2',
    md: iconOnly
      ? 'w-11 h-11 text-base touch-target-44'
      : 'px-4 py-2.5 text-sm min-h-[44px] touch-target-44 gap-2',
    lg: iconOnly
      ? 'w-12 h-12 text-lg touch-target-44'
      : 'px-6 py-3 text-base min-h-[48px] touch-target-44 gap-2.5',
  };

  // Visual variants
  const variantClasses = {
    primary: clsx(
      'bg-gradient-to-b from-obsidian-700 to-obsidian-800',
      'border border-glass-border hover:border-glass-border-strong',
      'text-ink shadow-elevation-surface hover:shadow-elevation-elevated',
      'hover:from-obsidian-700/90 hover:to-obsidian-800/90'
    ),
    secondary: clsx(
      'bg-obsidian-800/70 hover:bg-obsidian-800',
      'border border-glass-border hover:border-glass-border-strong',
      'text-ink-muted hover:text-ink'
    ),
    ghost: clsx(
      'bg-transparent border border-transparent',
      'text-ink-muted hover:text-ink hover:bg-glass hover:border-glass-border'
    ),
    destructive: clsx(
      'bg-danger/15 hover:bg-danger/25',
      'border border-danger/40 hover:border-danger/60',
      'text-danger shadow-elevation-subtle'
    ),
    success: clsx(
      'bg-success/15 hover:bg-success/25',
      'border border-success/40 hover:border-success/60',
      'text-success shadow-elevation-subtle'
    ),
    glass: clsx(
      'bg-glass hover:bg-glass/80',
      'border border-glass-border hover:border-glass-border-strong',
      'backdrop-blur-glass text-ink shadow-elevation-subtle'
    ),
    attr: clsx(
      'bg-obsidian-800 border',
      attribute ? attrGlowMap[attribute] : 'border-glass-border text-ink'
    ),
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      aria-label={ariaLabel}
      aria-busy={loading ? 'true' : undefined}
      disabled={disabled || loading}
      className={clsx(
        baseClasses,
        sizeClasses[size] || sizeClasses.md,
        variantClasses[variant] || variantClasses.primary,
        className
      )}
      onClick={onClick}
      {...motionProps}
      {...props}
    >
      {/* Loading spinner with preserved label width to prevent layout shift */}
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="opacity-70">{children}</span>
        </span>
      ) : success ? (
        <span className="flex items-center gap-1.5 text-success">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
});

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'destructive', 'success', 'glass', 'attr']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  attribute: PropTypes.oneOf(['strength', 'intelligence', 'vitality', 'willpower', 'perception']),
  type: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  success: PropTypes.bool,
  iconOnly: PropTypes.bool,
  fullWidth: PropTypes.bool,
  'aria-label': PropTypes.string,
  onClick: PropTypes.func,
};
