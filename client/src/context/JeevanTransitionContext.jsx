import { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, motion } from 'framer-motion';
import { JeevanLoader } from '@/components/ui/JeevanLoader';

const JeevanTransitionContext = createContext(null);

/**
 * Global Jeevan Transition Provider.
 * Allows any screen, form, or action to trigger full cinematic or medium state transitions
 * with consistent branding, promise completion, and automatic dismissals.
 */
export function JeevanTransitionProvider({ children }) {
  const [transitionState, setTransitionState] = useState(null);

  const triggerTransition = useCallback(
    ({
      variant = 'medium',
      message = 'Updating Jeevan...',
      submessage = 'Live. Track. Grow.',
      duration = variant === 'full' ? 2600 : 1100,
      onComplete,
    } = {}) => {
      return new Promise((resolve) => {
        setTransitionState({
          variant,
          message,
          submessage,
          duration,
          onComplete: () => {
            setTransitionState(null);
            if (onComplete) onComplete();
            resolve();
          },
        });
      });
    },
    []
  );

  return (
    <JeevanTransitionContext.Provider
      value={{
        triggerTransition,
        isTransitioning: Boolean(transitionState),
      }}
    >
      {children}

      <AnimatePresence mode="wait">
        {transitionState && (
          transitionState.variant === 'full' ? (
            <JeevanLoader
              key="full-transition"
              variant="full"
              message={transitionState.message}
              submessage={transitionState.submessage}
              duration={transitionState.duration}
              onComplete={transitionState.onComplete}
            />
          ) : (
            <motion.div
              key="modal-transition"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 select-none"
            >
              <motion.div
                initial={{ scale: 0.9, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 10 }}
                className="bg-obsidian-900/95 dark:bg-[#090A10]/95 border border-white/10 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] p-2 max-w-xs w-full"
              >
                <JeevanLoader
                  variant={transitionState.variant}
                  message={transitionState.message}
                  submessage={transitionState.submessage}
                  duration={transitionState.duration}
                  onComplete={transitionState.onComplete}
                />
              </motion.div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </JeevanTransitionContext.Provider>
  );
}

JeevanTransitionProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useJeevanTransition() {
  const context = useContext(JeevanTransitionContext);
  if (!context) {
    return {
      triggerTransition: async () => {},
      isTransitioning: false,
    };
  }
  return context;
}

export default JeevanTransitionProvider;
