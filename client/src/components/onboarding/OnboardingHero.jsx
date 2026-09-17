import { useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import { spring, pressable } from '@/lib/motionVariants';

/**
 * Inline arrow SVG that can visually morph into a tiny airplane.
 * Uses crossfade rather than actual path morphing for reliability.
 */
function MorphableArrow({ morphed }) {
  return (
    <span className="relative inline-flex items-center justify-center w-[18px] h-[18px]">
      {/* Arrow state */}
      <motion.svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute inset-0"
        animate={{ opacity: morphed ? 0 : 1 }}
        transition={{ duration: 0.25 }}
        aria-hidden="true"
      >
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </motion.svg>

      {/* Airplane state */}
      <motion.svg
        width="18"
        height="18"
        viewBox="0 0 32 32"
        fill="none"
        className="absolute inset-0"
        animate={{ opacity: morphed ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        aria-hidden="true"
      >
        <path
          d="M2 16L28 4L18 16L28 28L2 16Z"
          fill="currentColor"
          fillOpacity="0.9"
        />
      </motion.svg>
    </span>
  );
}

MorphableArrow.propTypes = {
  morphed: PropTypes.bool.isRequired,
};

/**
 * Motivational iOS-grade hero section with clean typography,
 * subtle supporting copy, and the frosted glass pill CTA.
 *
 * The arrow can morph into a tiny airplane when the journey launches.
 *
 * @param {object} props
 * @param {() => void} props.onGetStarted
 * @param {string} props.journeyState - Current onboarding state machine state
 * @param {(rect: DOMRect) => void} [props.onLaunchPositionReady] - Fires with the arrow's screen position
 * @param {string} [props.className]
 */
export function OnboardingHero({
  onGetStarted,
  journeyState = 'idle',
  onLaunchPositionReady,
  className = '',
}) {
  const shouldReduceMotion = useReducedMotion();
  const arrowRef = useRef(null);

  const isIdle = journeyState === 'idle';
  const isLaunching = journeyState === 'launching';
  const isMorphed = isLaunching || (!isIdle && journeyState !== 'complete');
  const shouldHide = !isIdle && journeyState !== 'launching';

  const handleClick = useCallback(() => {
    if (!isIdle) return; // Guard: only fire in idle

    // Report the arrow position before launching
    if (arrowRef.current && onLaunchPositionReady) {
      const rect = arrowRef.current.getBoundingClientRect();
      onLaunchPositionReady(rect);
    }

    onGetStarted();
  }, [isIdle, onGetStarted, onLaunchPositionReady]);

  return (
    <AnimatePresence>
      {!shouldHide && (
        <motion.div
          className={clsx(
            'w-full max-w-xl mx-auto px-6 sm:px-8 pb-12 sm:pb-16 text-center pointer-events-auto',
            'flex flex-col items-center justify-end',
            className
          )}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 1 }}
          exit={
            shouldReduceMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 10, transition: { duration: 0.4, ease: 'easeIn' } }
          }
        >
          {/* 1. Large Motivational Headline */}
          <motion.h1
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            animate={{
              opacity: isLaunching ? 0 : 1,
              y: isLaunching ? -8 : 0,
            }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : isLaunching
                  ? { duration: 0.4, ease: 'easeIn' }
                  : { ...spring.gentle, delay: 0.25 }
            }
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
            animate={{
              opacity: isLaunching ? 0 : 1,
              y: isLaunching ? -6 : 0,
            }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : isLaunching
                  ? { duration: 0.35, ease: 'easeIn' }
                  : { ...spring.gentle, delay: 0.4 }
            }
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
            animate={{
              opacity: isLaunching ? 0 : 1,
              y: isLaunching ? -4 : 0,
              scale: isLaunching ? 0.95 : 1,
            }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : isLaunching
                  ? { duration: 0.5, ease: 'easeIn' }
                  : { ...spring.gentle, delay: 0.55 }
            }
            className="mt-8 sm:mt-10 w-full sm:w-auto"
          >
            <motion.button
              type="button"
              onClick={handleClick}
              whileHover={shouldReduceMotion || !isIdle ? undefined : pressable.whileHover}
              whileTap={shouldReduceMotion || !isIdle ? undefined : pressable.whileTap}
              transition={spring.snappy}
              disabled={!isIdle}
              aria-label="Get Started with LifeOS"
              className={clsx(
                'group relative inline-flex items-center justify-center gap-2.5',
                'w-full sm:w-auto min-w-[220px] px-8 py-4 rounded-full',
                'bg-white/[0.14] hover:bg-white/[0.22] active:bg-white/[0.28]',
                'backdrop-blur-xl border border-white/25',
                'shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)]',
                'text-white font-medium text-base sm:text-lg tracking-tight',
                'transition-colors duration-200 min-h-[48px] select-none',
                'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white',
                !isIdle && 'cursor-default opacity-80'
              )}
            >
              {/* Subtle interior highlight reflection */}
              <span className="absolute inset-x-4 top-0.5 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

              <motion.span
                animate={{ opacity: isLaunching ? 0 : 1 }}
                transition={{ duration: 0.2 }}
              >
                Get Started
              </motion.span>
              <span ref={arrowRef}>
                <MorphableArrow morphed={isMorphed} />
              </span>
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

OnboardingHero.propTypes = {
  onGetStarted: PropTypes.func.isRequired,
  journeyState: PropTypes.string,
  onLaunchPositionReady: PropTypes.func,
  className: PropTypes.string,
};
