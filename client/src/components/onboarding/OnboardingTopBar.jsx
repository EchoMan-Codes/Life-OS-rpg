import PropTypes from 'prop-types';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, LogIn } from 'lucide-react';
import clsx from 'clsx';
import { spring } from '@/lib/motionVariants';

/**
 * Minimal iOS-grade top navigation bar for the Onboarding screen.
 */
export function OnboardingTopBar({
  onSkip,
  onSignIn,
  isAuthenticated = false,
  className = '',
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.header
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { ...spring.gentle, delay: 0.1 }}
      className={clsx(
        'w-full max-w-6xl mx-auto px-6 sm:px-8 pt-6 sm:pt-8 flex items-center justify-between pointer-events-auto',
        className
      )}
    >
      {/* Brand Pill */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/[0.12] shadow-sm select-none">
        <Sparkles size={14} className="text-violet-300" />
        <span className="text-sm font-semibold tracking-tight text-white font-display">
          LifeOS
        </span>
      </div>

      {/* Action: Skip or Sign In */}
      <div className="flex items-center gap-3">
        {!isAuthenticated && onSignIn && (
          <button
            type="button"
            onClick={onSignIn}
            className={clsx(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full',
              'text-xs font-medium text-white/80 hover:text-white',
              'bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/[0.16]',
              'border border-white/[0.10] backdrop-blur-md transition-all duration-150',
              'min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:py-1.5 sm:px-3',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40'
            )}
            aria-label="Sign In"
          >
            <LogIn size={13} className="text-white/70" />
            <span>Sign In</span>
          </button>
        )}

        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className={clsx(
              'px-3.5 py-1.5 rounded-full',
              'text-xs font-medium text-white/60 hover:text-white/90 active:text-white',
              'hover:bg-white/[0.08] transition-all duration-150',
              'min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40'
            )}
            aria-label="Skip onboarding"
          >
            Skip
          </button>
        )}
      </div>
    </motion.header>
  );
}

OnboardingTopBar.propTypes = {
  onSkip: PropTypes.func,
  onSignIn: PropTypes.func,
  isAuthenticated: PropTypes.bool,
  className: PropTypes.string,
};
