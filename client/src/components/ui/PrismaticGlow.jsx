import PropTypes from 'prop-types';
import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';

/**
 * PrismaticGlow — Iridescent chromatic-aberration refraction rim highlight.
 * Inspired by precision-milled physical hardware & holographic optics.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Inner content (avatar, button, pill)
 * @param {'circle' | 'pill' | 'card'} [props.variant='circle'] - Geometry shape
 * @param {string} [props.className=''] - Container class
 * @param {boolean} [props.active=true] - Whether chromatic refraction is active
 */
export function PrismaticGlow({
  children,
  variant = 'circle',
  className = '',
  active = true,
}) {
  const shouldReduceMotion = useReducedMotion();

  const shapeClasses = {
    circle: 'rounded-full',
    pill: 'rounded-pill',
    card: 'rounded-card',
  }[variant] || 'rounded-full';

  if (!active) {
    return <div className={clsx('relative inline-flex', className)}>{children}</div>;
  }

  return (
    <div className={clsx('relative inline-flex group select-none', className)}>
      {/* 1. Iridescent Refraction Outer Glow (Diffused Chromatic Aura) */}
      <div
        className={clsx(
          'absolute -inset-0.5 pointer-events-none opacity-70 group-hover:opacity-100 transition-opacity duration-500 blur-[3px]',
          shapeClasses,
          'bg-[conic-gradient(from_180deg_at_50%_50%,#38bdf8_0deg,#818cf8_72deg,#c084fc_144deg,#fb923c_216deg,#34d399_288deg,#38bdf8_360deg)]'
        )}
        aria-hidden="true"
      />

      {/* 2. Razor-Sharp Chromatic Refraction Rim (Precision Hairline Highlight) */}
      <motion.div
        className={clsx(
          'absolute -inset-px pointer-events-none p-px overflow-hidden',
          shapeClasses,
          'bg-[conic-gradient(from_0deg_at_50%_50%,rgba(56,189,248,0.9)_0deg,rgba(129,140,248,0.8)_72deg,rgba(192,132,252,0.9)_144deg,rgba(251,146,60,0.85)_216deg,rgba(52,211,153,0.8)_288deg,rgba(56,189,248,0.9)_360deg)]'
        )}
        animate={
          shouldReduceMotion
            ? {}
            : {
                rotate: [0, 360],
              }
        }
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'linear',
        }}
        aria-hidden="true"
      />

      {/* 3. Top Specular Glint (Simulates physical glass bevel reflection) */}
      <div
        className={clsx(
          'absolute inset-0 pointer-events-none border-t border-white/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] z-10',
          shapeClasses
        )}
        aria-hidden="true"
      />

      {/* 4. Child Content Container */}
      <div className={clsx('relative z-10', shapeClasses)}>
        {children}
      </div>
    </div>
  );
}

PrismaticGlow.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['circle', 'pill', 'card']),
  className: PropTypes.string,
  active: PropTypes.bool,
};
