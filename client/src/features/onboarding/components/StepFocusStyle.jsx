import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Timer, Zap, Clock, Compass } from 'lucide-react';
import clsx from 'clsx';
import { FOCUS_STYLES } from '../constants';

const STYLE_ICONS = {
  Zap,
  Clock,
  Compass,
};

/**
 * Step 4: Work Style / Cognitive Interval Calibration.
 * Inspired by Reference 1: Large question typography, visual option cards,
 * and bottom circular forward button.
 */
export function StepFocusStyle({ selectedId, onSelect, onContinue }) {
  return (
    <div className="flex flex-col justify-between h-full min-h-[440px]">
      <div className="space-y-5">
        {/* Header (Ref 1: Single focused question with large type) */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-mana/10 border border-mana/20 text-mana text-[10px] font-mono tracking-widest uppercase">
            <Timer size={11} />
            <span>Calibration 03</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink font-display">
            How do you prefer to work?
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-lg">
            Choose your default cognitive sprint duration. Deep work sessions in LifeOS regenerate Mana and build Willpower.
          </p>
        </div>

        {/* Focus Style Cards */}
        <div className="space-y-3">
          {FOCUS_STYLES.map((style) => {
            const isSelected = selectedId === style.id;
            const Icon = STYLE_ICONS[style.icon] || Clock;

            return (
              <motion.button
                key={style.id}
                type="button"
                onClick={() => onSelect(style.id)}
                whileHover={{ scale: 1.01 }}
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
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-mana rounded-l-2xl" />
                )}

                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div
                    className={clsx(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors font-mono text-xs font-bold',
                      isSelected
                        ? 'bg-mana text-obsidian shadow-sm'
                        : 'bg-white/[0.04] text-ink-muted group-hover:text-ink'
                    )}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm sm:text-base font-bold text-ink">
                        {style.title}
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-mana bg-mana/10 border border-mana/20 px-2 py-0.5 rounded-full">
                        {style.badge}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      {style.description}
                    </p>
                  </div>
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
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Footer Forward Action (Ref 1: Circular Forward Arrow Button) */}
      <div className="pt-6 mt-4 flex items-center justify-between border-t border-white/[0.06]">
        <span className="text-xs text-ink-muted font-mono hidden sm:inline">
          Full audio ambiance included in Focus Chamber
        </span>

        <div className="flex items-center gap-3 ml-auto">
          <motion.button
            type="button"
            onClick={onContinue}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 rounded-full bg-ink text-obsidian flex items-center justify-center hover:bg-white shadow-[0_4px_20px_rgba(255,255,255,0.18)] transition-all"
            aria-label="Continue to sanctum initialization"
            title="Continue [Enter]"
          >
            <ArrowRight size={20} className="stroke-[2.5]" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

StepFocusStyle.propTypes = {
  selectedId: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  onContinue: PropTypes.func.isRequired,
};
