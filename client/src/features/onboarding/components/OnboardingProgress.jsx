import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { TOTAL_STEPS } from '../constants';

/**
 * Minimalist editorial progress bar and navigation header.
 * Displays step index (e.g. 02 / 05), thin segmented spine, and Back/Skip controls.
 */
export function OnboardingProgress({
  currentStepIndex,
  onBack,
  onSkip,
  canGoBack = true,
  canSkip = true,
}) {
  const formattedIndex = String(currentStepIndex).padStart(2, '0');
  const formattedTotal = String(TOTAL_STEPS).padStart(2, '0');

  return (
    <header className="w-full flex flex-col gap-3 py-2">
      {/* Top row: Back button, Step Counter, Skip button */}
      <div className="flex items-center justify-between min-h-[44px]">
        {/* Back navigation */}
        <div className="w-24">
          {canGoBack && currentStepIndex > 1 ? (
            <motion.button
              type="button"
              onClick={onBack}
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-ink-muted hover:text-ink transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mana"
              aria-label="Previous step"
            >
              <ArrowLeft size={14} className="text-ink-muted" />
              <span>BACK</span>
            </motion.button>
          ) : null}
        </div>

        {/* Step indicator: 01 / 05 */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono tracking-widest text-ink font-semibold">
            {formattedIndex}
          </span>
          <span className="text-xs font-mono text-ink-faint">/</span>
          <span className="text-xs font-mono text-ink-muted">{formattedTotal}</span>
        </div>

        {/* Skip button */}
        <div className="w-24 flex justify-end">
          {canSkip && currentStepIndex < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={onSkip}
              className="inline-flex items-center gap-1 text-xs font-mono text-ink-muted hover:text-ink transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mana"
            >
              <span>SKIP</span>
              <ChevronRight size={13} className="text-ink-faint" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Segmented progress spine */}
      <div
        className="w-full grid grid-cols-5 gap-1.5"
        role="progressbar"
        aria-valuenow={currentStepIndex}
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-label={`Step ${currentStepIndex} of ${TOTAL_STEPS}`}
      >
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((stepNum) => {
          const isCompleted = stepNum < currentStepIndex;
          const isCurrent = stepNum === currentStepIndex;

          return (
            <div
              key={stepNum}
              className="h-1 rounded-full overflow-hidden bg-white/[0.07] relative"
            >
              {isCompleted && (
                <div className="w-full h-full bg-mana/80" />
              )}
              {isCurrent && (
                <motion.div
                  className="h-full bg-gradient-to-r from-mana to-indigo-400"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                />
              )}
            </div>
          );
        })}
      </div>
    </header>
  );
}

OnboardingProgress.propTypes = {
  currentStepIndex: PropTypes.number.isRequired,
  onBack: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired,
  canGoBack: PropTypes.bool,
  canSkip: PropTypes.bool,
};
