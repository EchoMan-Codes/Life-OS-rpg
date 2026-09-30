import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { DISCIPLINE_LEVELS } from '../constants';
import { CardMotif } from './CardMotif';

/**
 * Step 3: Discipline Level Selection.
 * Inspired directly by Reference 1 (Screen 2: "What's your level?"):
 * Beginner, Skilled, Guru/Master with large illustrated cards and forward action button.
 */
export function StepDisciplineLevel({ selectedId, onSelect, onContinue }) {
  return (
    <div className="flex flex-col justify-between h-full min-h-[440px]">
      <div className="space-y-5">
        {/* Header (Ref 1: Single focused question with large type) */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-mana/10 border border-mana/20 text-mana text-[10px] font-mono tracking-widest uppercase">
            <Sparkles size={11} />
            <span>Calibration 02</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink font-display">
            What is your discipline level?
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-lg">
            Calibrate habit difficulty, streak forgiveness thresholds, and progression multiplier.
          </p>
        </div>

        {/* Large Level Cards (Ref 1: Large illustrated panels) */}
        <div className="space-y-3">
          {DISCIPLINE_LEVELS.map((level) => {
            const isSelected = selectedId === level.id;

            return (
              <motion.button
                key={level.id}
                type="button"
                onClick={() => onSelect(level.id)}
                whileHover={{ scale: 1.012 }}
                whileTap={{ scale: 0.99 }}
                className={clsx(
                  'w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 group relative overflow-hidden',
                  isSelected
                    ? 'bg-mana/10 border-mana/50 shadow-[0_0_24px_rgba(99,102,241,0.18)] ring-1 ring-mana/40'
                    : 'bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.04] hover:border-white/18'
                )}
              >
                {/* Active vertical accent line */}
                {isSelected && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                    style={{ backgroundColor: level.color }}
                  />
                )}

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base sm:text-lg font-bold text-ink font-display">
                      {level.title}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${level.color}18`,
                        color: level.color,
                      }}
                    >
                      {level.badge}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed max-w-sm">
                    {level.description}
                  </p>
                  <div className="text-[10px] font-mono text-ink-muted pt-1">
                    <span style={{ color: level.color }} className="font-semibold">
                      {level.xpMultiplier}
                    </span>
                  </div>
                </div>

                {/* Right side: Abstract Vector Silhouette Motif (Inspired by Ref 1) */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:block">
                    <CardMotif type={level.motif} color={level.color} />
                  </div>

                  {/* Check Indicator */}
                  <div
                    className={clsx(
                      'w-6 h-6 rounded-full border flex items-center justify-center transition-all shrink-0',
                      isSelected
                        ? 'border-mana bg-mana text-obsidian shadow-sm'
                        : 'border-white/20 bg-white/[0.02] text-transparent'
                    )}
                  >
                    <Check size={13} className="stroke-[3]" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Footer Forward Action (Ref 1: Circular Forward Arrow Button) */}
      <div className="pt-6 mt-4 flex items-center justify-between border-t border-white/[0.06]">
        <span className="text-xs text-ink-muted font-mono hidden sm:inline">
          {DISCIPLINE_LEVELS.find((l) => l.id === selectedId)?.tagline || 'Select your tier'}
        </span>

        <div className="flex items-center gap-3 ml-auto">
          <motion.button
            type="button"
            onClick={onContinue}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 rounded-full bg-ink text-obsidian flex items-center justify-center hover:bg-white shadow-[0_4px_20px_rgba(255,255,255,0.18)] transition-all"
            aria-label="Continue to next step"
            title="Continue [Enter]"
          >
            <ArrowRight size={20} className="stroke-[2.5]" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

StepDisciplineLevel.propTypes = {
  selectedId: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  onContinue: PropTypes.func.isRequired,
};
