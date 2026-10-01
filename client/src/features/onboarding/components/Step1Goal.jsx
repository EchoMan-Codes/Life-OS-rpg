import { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Target, Sparkles } from 'lucide-react';
import clsx from 'clsx';

import { GOAL_OPTIONS } from '../constants';
import { spring } from '@/lib/motionVariants';

/**
 * Step 1: Primary Goal Selection (Single Select + Custom Option)
 * "🎯 What do you want to achieve?"
 */
export function Step1Goal({ selectedGoal, onSelect, onNext, onSkip }) {
  const [customGoal, setCustomGoal] = useState('');
  const [isCustom, setIsCustom] = useState(selectedGoal === 'other');

  const handleSelect = (id) => {
    if (id === 'other') {
      setIsCustom(true);
      onSelect('other', customGoal || 'Custom Ambition');
    } else {
      setIsCustom(false);
      const chosen = GOAL_OPTIONS.find((g) => g.id === id);
      onSelect(id, chosen?.label || id);
    }
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    setCustomGoal(val);
    onSelect('other', val || 'Custom Ambition');
  };

  return (
    <div className="space-y-4">
      {/* Question Header */}
      <div className="text-center space-y-1">
        <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight flex items-center justify-center gap-2">
          <span>What do you want to achieve?</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Choose your main goal or write your own.
        </p>
      </div>

      {/* Goal Cards Grid (Single-Select) */}
      <div className="space-y-2 max-h-[340px] sm:max-h-[380px] overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {GOAL_OPTIONS.map((item) => {
          const isSelected = selectedGoal === item.id;
          return (
            <motion.button
              key={item.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              transition={spring.snappy}
              onClick={() => handleSelect(item.id)}
              className={clsx(
                'w-full p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer',
                isSelected
                  ? 'bg-purple-600/20 border-purple-500 ring-1 ring-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.2)] text-white'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 text-slate-300 hover:text-white'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={clsx(
                    'w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-colors',
                    isSelected
                      ? 'bg-purple-500 border-purple-400 text-white shadow-xs'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  )}
                >
                  <Target size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold truncate leading-tight font-display">
                    {item.label}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5 font-sans">
                    {item.desc}
                  </p>
                </div>
              </div>

              {/* Selection indicator pill */}
              <div
                className={clsx(
                  'w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all',
                  isSelected
                    ? 'bg-purple-500 border-purple-400 text-white'
                    : 'border-white/20 bg-transparent text-transparent'
                )}
              >
                <Check size={13} className="stroke-[3]" />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Custom Goal Input if 'Other' selected */}
      {isCustom && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="pt-1"
        >
          <input
            type="text"
            value={customGoal}
            onChange={handleCustomChange}
            placeholder="Type your primary goal here (e.g. Publish Research Paper)"
            className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-purple-500/50 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-inner"
            autoFocus
          />
        </motion.div>
      )}

      {/* Footer Navigation Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <button
          type="button"
          onClick={onSkip}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          Skip
        </button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <span>Next</span>
          <ArrowRight size={14} />
        </motion.button>
      </div>
    </div>
  );
}

Step1Goal.propTypes = {
  selectedGoal: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired,
};
