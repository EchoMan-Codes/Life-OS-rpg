import PropTypes from 'prop-types';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import { spring, pressable } from '@/lib/motionVariants';

/**
 * Motivational iOS-grade hero section with clean typography,
 * subtle supporting copy, and the frosted glass pill CTA.
 */
export function OnboardingHero({ onGetStarted, className = '' }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={clsx(
        'w-full max-w-xl mx-auto px-6 sm:px-8 pb-12 sm:pb-16 text-center pointer-events-auto',
        'flex flex-col items-center justify-end',
        className
      )}
    >
      {/* 1. Large Motivational Headline */}
      <motion.h1
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { ...spring.gentle, delay: 0.25 }}
        className={clsx(
          'font-display font-bold text-white tracking-tight',
          'text-4xl sm:text-5xl md:text-6xl leading-[1.08]',
          'drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]'
        )}
      >
        Build a Better You.
      </motion.h1>

      {/* 2. Short Supporting Message */}
      <motion.p
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { ...spring.gentle, delay: 0.4 }}
        className={clsx(
          'mt-3 sm:mt-4 text-base sm:text-lg text-slate-300/90 font-body',
          'max-w-md mx-auto leading-relaxed',
          'drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]'
        )}
      >
        Plan. Focus. Grow. Everything you need to move forward.
      </motion.p>

      {/* 3. Premium Primary Pill CTA */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={shouldReduceMotion ? { duration: 0 } : { ...spring.gentle, delay: 0.55 }}
        className="mt-8 sm:mt-10 w-full sm:w-auto"
      >
        <motion.button
          type="button"
          onClick={onGetStarted}
          whileHover={shouldReduceMotion ? undefined : pressable.whileHover}
          whileTap={shouldReduceMotion ? undefined : pressable.whileTap}
          transition={spring.snappy}
          aria-label="Get Started with LifeOS"
          className={clsx(
            'group relative inline-flex items-center justify-center gap-2.5',
            'w-full sm:w-auto min-w-[220px] px-8 py-4 rounded-full',
            // Light glass translucent material
            'bg-white/[0.14] hover:bg-white/[0.22] active:bg-white/[0.28]',
            'backdrop-blur-xl border border-white/25',
            'shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)]',
            // Text typography
            'text-white font-medium text-base sm:text-lg tracking-tight',
            'transition-colors duration-200 min-h-[48px] select-none',
            // Accessible focus ring
            'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white'
          )}
        >
          {/* Subtle interior highlight reflection */}
          <span className="absolute inset-x-4 top-0.5 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

          <span>Get Started</span>
          <ArrowRight
            size={18}
            className="text-white/80 group-hover:text-white group-hover:translate-x-0.5 transition-transform duration-150"
          />
        </motion.button>
      </motion.div>
    </div>
  );
}

OnboardingHero.propTypes = {
  onGetStarted: PropTypes.func.isRequired,
  className: PropTypes.string,
};
