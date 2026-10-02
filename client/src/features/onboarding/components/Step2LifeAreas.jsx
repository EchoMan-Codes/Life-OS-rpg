import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Dumbbell,
  Wallet,
  Briefcase,
  Flame,
  Target,
  Sparkles,
  Activity,
  Check,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import clsx from 'clsx';

import { LIFE_AREA_OPTIONS } from '../constants';
import { spring } from '@/lib/motionVariants';

const ICONS = {
  BookOpen,
  Dumbbell,
  Wallet,
  Briefcase,
  Flame,
  Target,
  Sparkles,
  Activity,
};

/**
 * Step 2: Life Areas Multi-Select
 * "📊 Which areas do you want to improve?"
 */
export function Step2LifeAreas({ selectedAreas = [], onToggle, onNext, onBack }) {
  const safeAreas = Array.isArray(selectedAreas) ? selectedAreas : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight">
          Which areas do you want to improve?
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Select multiple areas.
        </p>
      </div>

      {/* 2-Column Life Areas Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 max-h-[340px] sm:max-h-[380px] overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {LIFE_AREA_OPTIONS.map((area) => {
          const Icon = ICONS[area.icon] || Sparkles;
          const isSelected = safeAreas.includes(area.id);

          return (
            <motion.button
              key={area.id}
              type="button"
              whileTap={{ scale: 0.96 }}
              transition={spring.snappy}
              onClick={() => onToggle(area.id)}
              className={clsx(
                'p-3 sm:p-4 rounded-2xl border text-left transition-all duration-150 flex flex-col justify-between h-24 sm:h-28 relative cursor-pointer',
                isSelected
                  ? 'bg-purple-600/20 border-purple-500 ring-1 ring-purple-500/50 shadow-[0_0_18px_rgba(168,85,247,0.2)] text-white'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 text-slate-300 hover:text-white'
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={clsx(
                    'w-8 h-8 rounded-xl border flex items-center justify-center shrink-0',
                    isSelected ? 'bg-purple-500 border-purple-400 text-white' : 'bg-white/5 border-white/10 text-slate-400'
                  )}
                >
                  <Icon size={16} />
                </div>

                <div
                  className={clsx(
                    'w-5 h-5 rounded-full border flex items-center justify-center transition-all',
                    isSelected
                      ? 'bg-purple-500 border-purple-400 text-white'
                      : 'border-white/20 bg-transparent text-transparent'
                  )}
                >
                  <Check size={11} className="stroke-[3]" />
                </div>
              </div>

              <div>
                <span className="text-xs sm:text-sm font-bold block truncate font-display">
                  {area.label}
                </span>
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
          disabled={safeAreas.length === 0}
          className={clsx(
            'inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer',
            safeAreas.length === 0 && 'opacity-50 pointer-events-none'
          )}
        >
          <span>Next</span>
          <ArrowRight size={14} />
        </motion.button>
      </div>
    </div>
  );
}

Step2LifeAreas.propTypes = {
  selectedAreas: PropTypes.arrayOf(PropTypes.string),
  onToggle: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};
