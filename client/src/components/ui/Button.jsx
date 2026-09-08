import { motion, useReducedMotion } from 'framer-motion';
import { forwardRef } from 'react';
import clsx from 'clsx';

import { pressable } from '@/lib/motionVariants';

/**
 * Attribute glow shadow mapping.
 * Maps attribute names to their Tailwind shadow token classes.
 */
const attrGlowMap = {
  strength: 'shadow-glow-strength',
  intelligence: 'shadow-glow-intelligence',
  vitality: 'shadow-glow-vitality',
  willpower: 'shadow-glow-willpower',
  perception: 'shadow-glow-perception',
};

/**
 * Attribute border color mapping.
 */
const attrBorderMap = {
  strength: 'border-attr-strength',
  intelligence: 'border-attr-intelligence',
  vitality: 'border-attr-vitality',
  willpower: 'border-attr-willpower',
  perception: 'border-attr-perception',
};

/**
 * Button component with three variants.
 *
 * @param {object} props
 * @param {'primary'|'ghost'|'attr'} [props.variant='primary'] - Visual variant
 * @param {'strength'|'intelligence'|'vitality'|'willpower'|'perception'} [props.attribute] - For attr variant
 * @param {string} [props.className] - Additional classes
 * @param {boolean} [props.disabled] - Disabled state
 * @param {React.ReactNode} props.children
 */
const Button = forwardRef(function Button(
  { variant = 'primary', attribute, className, children, disabled, ...props },
  ref
) {
  const shouldReduceMotion = useReducedMotion();

  const motionProps = shouldReduceMotion ? {} : pressable;

  const base = clsx(
    'inline-flex items-center justify-center gap-2',
    'px-5 py-2.5 rounded-panel',
    'font-body text-sm font-medium',
    'transition-colors duration-150',
    'cursor-pointer select-none',
    'min-h-[44px] min-w-[44px]',
    // Focus ring — 2px glass border with 2px offset (a11y rule)
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glass-border',
    disabled && 'opacity-50 pointer-events-none'
  );

  const variants = {
    primary: clsx(
      'bg-gradient-to-b from-obsidian-700 to-obsidian-800',
      'border border-glass-border',
      'text-ink shadow-glow',
      'hover:from-obsidian-700/80 hover:to-obsidian-800/80'
    ),
    ghost: clsx(
      'bg-transparent border border-transparent',
      'text-ink-muted',
      'hover:bg-glass hover:text-ink hover:border-glass-border'
    ),
    attr: clsx(
      'bg-obsidian-800 border',
      'text-ink',
      attribute && attrBorderMap[attribute],
      attribute && attrGlowMap[attribute]
    ),
  };

  return (
    <motion.button
      ref={ref}
      className={clsx(base, variants[variant], className)}
      disabled={disabled}
      {...motionProps}
      {...props}
    >
      {children}
    </motion.button>
  );
});

export { Button };
