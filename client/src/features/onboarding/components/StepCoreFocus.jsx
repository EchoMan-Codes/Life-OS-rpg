import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Sparkles, Brain, Activity, Shield, Zap, Eye } from 'lucide-react';
import clsx from 'clsx';
import { CORE_OBJECTIVES } from '../constants';

const ICON_MAP = {
  Brain,
  Activity,
  Shield,
  Zap,
  Eye,
};

/**
 * Step 2: Core Objective selection (maps directly to LifeOS 5 RPG Attributes).
 */
export function StepCoreFocus({ selectedId, onSelect, onContinue }) {
  return (
    <div className="flex flex-col justify-between h-full">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-mana/10 border border-mana/20 text-mana text-[10px] font-mono tracking-widest uppercase">
            <Sparkles size={11} />
            <span>Attribute Alignment</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
            What matters most right now?
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-lg">
            Select your foundational discipline. LifeOS will tailor your starting quests, dashboard priority decks, and primary RPG attribute growth.
          </p>
        </div>

        {/* Objective Option Cards */}
        <div className="space-y-2.5">
          {CORE_OBJECTIVES.map((item, index) => {
            const isSelected = selectedId === item.id;
            const Icon = ICON_MAP[item.icon] || Zap;

            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                whileHover={{ scale: 1.008 }}
                whileTap={{ scale: 0.99 }}
                className={clsx(
                  'w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3.5 group relative overflow-hidden',
                  isSelected
                    ? 'bg-mana/10 border-mana/50 shadow-[0_0_25px_rgba(99,102,241,0.15)] ring-1 ring-mana/40'
                    : 'bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.04] hover:border-white/20'
                )}
              >
                {/* Active ambient accent glow */}
                {isSelected && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                    style={{ backgroundColor: item.color }}
                  />
                )}

                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Icon */}
                  <div
                    className={clsx(
                      'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                      isSelected
                        ? 'bg-mana/20 text-ink'
                        : 'bg-white/[0.04] text-ink-muted group-hover:text-ink'
                    )}
                    style={{ color: isSelected ? item.color : undefined }}
                  >
                    <Icon size={18} />
                  </div>

                  {/* Title & Description */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-ink">
                        {item.title}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${item.color}15`,
                          color: item.color,
                        }}
                      >
                        {item.stat}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Right side: Archetype Tag & Check indicator */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="hidden sm:inline-block text-[11px] font-mono text-ink-faint">
                    {item.archetype}
                  </span>
                  <div
                    className={clsx(
                      'w-5 h-5 rounded-full flex items-center justify-center transition-all',
                      isSelected
                        ? 'bg-mana text-obsidian scale-105'
                        : 'border border-white/20 group-hover:border-white/40'
                    )}
                  >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-6 sm:pt-8 flex items-center justify-between border-t border-white/[0.06]">
        <span className="text-[11px] font-mono text-ink-faint hidden sm:inline">
          Tip: You can rebalance attributes anytime
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
          <span>Continue</span>
          <ArrowRight size={16} />
        </motion.button>
      </div>
    </div>
  );
}

StepCoreFocus.propTypes = {
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onContinue: PropTypes.func.isRequired,
};
