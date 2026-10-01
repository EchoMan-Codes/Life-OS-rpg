import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Check, ArrowRight, ArrowLeft, Flame, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

import { CHALLENGE_OPTIONS } from '../constants';
import { spring } from '@/lib/motionVariants';

/**
 * Step 4: Friction Points & Challenges Multi-Select
 * "🔥 What is holding you back right now?"
 */
export function Step4Challenge({ selectedChallenges = [], onToggle, onNext, onBack }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight">
          What is holding you back right now?
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Select what feels most accurate.
        </p>
      </div>

      {/* Challenges List (Multi-Select) */}
      <div className="space-y-2 max-h-[340px] sm:max-h-[380px] overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CHALLENGE_OPTIONS.map((item) => {
          const isSelected = selectedChallenges.includes(item.id);

          return (
            <motion.button
              key={item.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              transition={spring.snappy}
              onClick={() => onToggle(item.id)}
              className={clsx(
                'w-full p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer',
                isSelected
                  ? 'bg-purple-600/20 border-purple-500 ring-1 ring-purple-500/50 shadow-[0_0_18px_rgba(168,85,247,0.2)] text-white'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 text-slate-300 hover:text-white'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={clsx(
                    'w-7 h-7 rounded-xl border flex items-center justify-center shrink-0',
                    isSelected ? 'bg-purple-500 border-purple-400 text-white' : 'bg-white/5 border-white/10 text-slate-400'
                  )}
                >
                  <Flame size={14} className={isSelected ? 'fill-white' : 'fill-none'} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold truncate font-display">
                    {item.label}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div
                className={clsx(
                  'w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all',
                  isSelected
                    ? 'bg-purple-500 border-purple-400 text-white'
                    : 'border-white/20 bg-transparent text-transparent'
                )}
              >
                <Check size={11} className="stroke-[3]" />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={onNext}
          disabled={selectedChallenges.length === 0}
          className={clsx(
            'inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer',
            selectedChallenges.length === 0 && 'opacity-50 pointer-events-none'
          )}
        >
          <span>Next</span>
          <ArrowRight size={14} />
        </motion.button>
      </div>
    </div>
  );
}

Step4Challenge.propTypes = {
  selectedChallenges: PropTypes.arrayOf(PropTypes.string),
  onToggle: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};
