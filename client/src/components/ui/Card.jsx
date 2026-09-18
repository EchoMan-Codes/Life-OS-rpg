import { forwardRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import { spring } from '@/lib/motion';

/**
 * Canonical LifeOS Card component.
 *
 * Implements the formal 9-tier card hierarchy:
 * - surface: default quiet panel (most standard UI surfaces)
 * - interactive: clickable card with tactile press compression and hover lift
 * - elevated: higher visual weight with layered contact+ambient shadows
 * - featured: hero or quest focus card with subtle accent lighting
 * - immersive: high-blur HUD glass surface for full atmospheric overlays
 * - compact: dense tile for tight grids and mobile list items
 * - stat: numeric stat display with tabular figures
 * - listRow: horizontal row with interactive hover state
 * - mediaHorizontal: media/icon left, details right
 */
export const Card = forwardRef(function Card(
  {
    variant = 'surface',
    className,
    children,
    onClick,
    as: Component = onClick ? 'button' : 'div',
    disabled = false,
    ...props
  },
  ref
) {
  const shouldReduceMotion = useReducedMotion();
  const isInteractive = variant === 'interactive' || Boolean(onClick);

  const motionProps = isInteractive && !shouldReduceMotion && !disabled
    ? {
        whileTap: { scale: 0.985 },
        whileHover: { y: -2 },
        transition: spring.snappy,
      }
    : {};

  // 9-tier variant classes enforcing nested radius and layered depth
  const variantClasses = {
    // 1. Surface: default quiet panel
    surface: clsx(
      'bg-obsidian-900 border border-glass-border rounded-card p-4',
      'shadow-elevation-surface'
    ),
    // 2. Interactive: clickable card with hover/active states
    interactive: clsx(
      'w-full text-left cursor-pointer select-none',
      'bg-obsidian-900 hover:bg-obsidian-850 active:bg-obsidian-800',
      'border border-glass-border hover:border-glass-border-strong',
      'rounded-card p-4 shadow-elevation-surface hover:shadow-elevation-elevated',
      'transition-colors duration-150',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian'
    ),
    // 3. Elevated: prominent card for secondary heroes
    elevated: clsx(
      'bg-obsidian-800/90 border border-glass-border-strong rounded-card-lg p-5',
      'shadow-elevation-elevated'
    ),
    // 4. Featured: highlighted with accent glow
    featured: clsx(
      'bg-gradient-to-b from-obsidian-800 to-obsidian-900',
      'border border-accent-primary/40 rounded-card-lg p-5',
      'shadow-glow'
    ),
    // 5. Immersive: HUD glass panel
    immersive: clsx(
      'material-translucent rounded-card-lg p-6',
      'shadow-elevation-floating'
    ),
    // 6. Compact: dense tile for mobile rows
    compact: clsx(
      'bg-obsidian-900/70 border border-glass-border rounded-control p-3',
      'shadow-elevation-subtle'
    ),
    // 7. Stat: metric card with tabular numbers
    stat: clsx(
      'bg-obsidian-900 border border-glass-border rounded-card p-3.5',
      'flex flex-col gap-1 shadow-elevation-surface'
    ),
    // 8. ListRow: horizontal row
    listRow: clsx(
      'w-full flex items-center justify-between gap-3',
      'p-3 rounded-control bg-obsidian-900/50 border border-glass-border/60',
      'hover:bg-obsidian-800/60 hover:border-glass-border transition-colors'
    ),
    // 9. MediaHorizontal: media/icon left, content right
    mediaHorizontal: clsx(
      'flex items-center gap-4 p-4 rounded-card',
      'bg-obsidian-900 border border-glass-border shadow-elevation-surface'
    ),
    // Backwards compatibility aliases
    default: clsx(
      'bg-obsidian-900 border border-glass-border rounded-card p-4',
      'shadow-elevation-surface'
    ),
    hud: clsx(
      'material-translucent rounded-card-lg p-6',
      'shadow-elevation-floating'
    ),
  };

  const CardComponent = isInteractive ? motion[Component] || motion.div : Component;

  return (
    <CardComponent
      ref={ref}
      className={clsx(variantClasses[variant] || variantClasses.surface, className)}
      onClick={onClick}
      disabled={disabled}
      role={isInteractive && Component === 'div' ? 'button' : undefined}
      tabIndex={isInteractive && Component === 'div' ? 0 : undefined}
      {...motionProps}
      {...props}
    >
      {children}
    </CardComponent>
  );
});

Card.propTypes = {
  variant: PropTypes.oneOf([
    'surface',
    'interactive',
    'elevated',
    'featured',
    'immersive',
    'compact',
    'stat',
    'listRow',
    'mediaHorizontal',
    'default',
    'hud',
  ]),
  className: PropTypes.string,
  children: PropTypes.node,
  onClick: PropTypes.func,
  as: PropTypes.elementType,
  disabled: PropTypes.bool,
};
