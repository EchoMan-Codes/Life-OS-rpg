import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Timer, Zap, Hourglass } from 'lucide-react';
import clsx from 'clsx';
import { FOCUS_STYLES } from '../constants';

/**
 * Step 4: Focus Chamber cognitive interval calibration.
 */
export function StepFocusStyle({ selectedId, onSelect, onContinue }) {
  return (
    <div className="flex flex-col justify-between h-full">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-mana/10 border border-mana/20 text-mana text-[10px] font-mono tracking-widest uppercase">
            <Timer size={11} />
            <span>Focus Chamber Calibration</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
            What is your preferred focus rhythm?
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-lg">
            Choose your default cognitive sprint duration. Focus sessions in LifeOS regenerate Mana, train Willpower, and log deep work minutes.
          </p>
        </div>

        {/* Focus Style Cards */}
        <div className="space-y-3">
          {FOCUS_STYLES.map((style) => {
            const isSelected = selectedId === style.id;

            return (
              <motion.button
                key={style.id}
                type="button"
                onClick={() => onSelect(style.id)}
                whileHover={{ scale: 1.008 }}
                whileTap={{ scale: 0.99 }}
                className={clsx(
                  'w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-start justify-between gap-4 group relative overflow-hidden',
                  isSelected
                    ? 'bg-mana/10 border-mana/50 shadow-[0_0_25px_rgba(99,102,241,0.15)] ring-1 ring-mana/40'
                    : 'bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.04] hover:border-white/20'
                )}
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div
                    className={clsx(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors mt-0.5 font-mono text-xs font-bold',
                      isSelected
                        ? 'bg-mana text-obsidian'
                        : 'bg-white/[0.04] text-ink-muted group-hover:text-ink'
                    )}
                  >
                    {style.duration}m
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-ink">{style.title}</span>
                      <span className="text-[11px] font-mono font-semibold text-mana bg-mana/10 border border-mana/20 px-2 py-0.5 rounded-full">
                        {style.badge}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      {style.description}
                    </p>
                  </div>
                </div>

                <div
                  className={clsx(
                    'w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 mt-1',
                    isSelected
                      ? 'bg-mana text-obsidian scale-105'
                      : 'border border-white/20 group-hover:border-white/40'
                  )}
                >
                  {isSelected && <Check size={12} strokeWidth={3} />}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-6 sm:pt-8 flex items-center justify-between border-t border-white/[0.06]">
        <span className="text-[11px] font-mono text-ink-faint hidden sm:inline">
          Full audio ambiance included in Focus Chamber
        </span>

        <motion.button
          type="button"
          onClick={onContinue}
          disabled={!selectedId}
          whileHover={selectedId ? { scale: 1.01 } : {}}
          whileTap={selectedId ? { scale: 0.98 } : {}}
          className={clsx(
            'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all min-h-[46px] w-full sm:w-auto',
            selectedId
              ? 'bg-ink text-obsidian hover:bg-ink/90 shadow-[0_4px_20px_rgba(255,255,255,0.12)]'
              : 'bg-white/10 text-ink-muted cursor-not-allowed'
          )}
        >
          <span>Review Calibration</span>
          <ArrowRight size={16} />
        </motion.button>
      </div>
    </div>
  );
}

StepFocusStyle.propTypes = {
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onContinue: PropTypes.func.isRequired,
};
