import { memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Transition overlay between the flight sequence and authentication.
 *
 * - During `authTransition`: plays a light sweep + fades in a semi-transparent overlay
 * - During `authenticating`: holds the overlay steady as the auth backdrop
 * - During `returnJourney`: fades out the overlay
 * - All other states: invisible
 *
 * @param {object} props
 * @param {string} props.journeyState - Current state machine state
 */
function OnboardingTransitionBase({ journeyState }) {
  const shouldReduceMotion = useReducedMotion();
  const showOverlay = journeyState === 'authTransition' || journeyState === 'authenticating';
  const showSweep = journeyState === 'authTransition';

  return (
    <>
      {/* Light sweep — brief horizontal gradient flash */}
      <AnimatePresence>
        {showSweep && !shouldReduceMotion && (
          <motion.div
            key="light-sweep"
            className="fixed inset-0 pointer-events-none z-35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
          >
            <motion.div
              className="absolute inset-y-0 w-[30%]"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
              }}
              initial={{ left: '-30%' }}
              animate={{ left: '130%' }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Semi-transparent auth backdrop overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            key="auth-overlay"
            className="fixed inset-0 z-40 bg-obsidian/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.1 : 0.5 }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </>
  );
}

OnboardingTransitionBase.propTypes = {
  journeyState: PropTypes.string.isRequired,
};

export const OnboardingTransition = memo(OnboardingTransitionBase);
