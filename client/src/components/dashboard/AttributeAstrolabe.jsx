import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, Swords, Zap, Brain, Heart, Eye } from 'lucide-react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { openAttributesDrawer } from '@/features/celebration/celebrationEvents';
import { spring } from '@/lib/motionVariants';

const ATTRIBUTE_METRICS = [
  {
    key: 'strength',
    name: 'Strength',
    code: 'STR',
    icon: Swords,
    color: '#DC2626',
    textColor: 'text-red-600 dark:text-hp',
    bgColor: 'bg-red-500/15 border-red-500/30',
    description: 'Increases quest physical rewards and critical multipliers.',
    scaling: '+2.5% XP per point',
  },
  {
    key: 'intelligence',
    name: 'Intelligence',
    code: 'INT',
    icon: Brain,
    color: '#0284C7',
    textColor: 'text-sky-600 dark:text-mana',
    bgColor: 'bg-sky-500/15 border-sky-500/30',
    description: 'Expands maximum Mana pool and focus sprint efficiency.',
    scaling: '+4 Max MP per point',
  },
  {
    key: 'vitality',
    name: 'Vitality',
    code: 'VIT',
    icon: Heart,
    color: '#059669',
    textColor: 'text-emerald-600 dark:text-attr-vitality',
    bgColor: 'bg-emerald-500/15 border-emerald-500/30',
    description: 'Bolsters maximum Health and shields against daily decay penalties.',
    scaling: '+5 Max HP per point',
  },
  {
    key: 'willpower',
    name: 'Willpower',
    code: 'WIL',
    icon: Zap,
    color: '#7C3AED',
    textColor: 'text-violet-600 dark:text-attr-willpower',
    bgColor: 'bg-violet-500/15 border-violet-500/30',
    description: 'Fortifies habit streaks and streak resilience protection.',
    scaling: '+1 Streak Shield day',
  },
  {
    key: 'perception',
    name: 'Perception',
    code: 'PER',
    icon: Eye,
    color: '#D97706',
    textColor: 'text-amber-600 dark:text-attr-perception',
    bgColor: 'bg-amber-500/15 border-amber-500/30',
    description: 'Magnifies gold yield from completed habits and quests.',
    scaling: '+3% Gold yield bonus',
  },
];

/**
 * AttributeAstrolabe — Unique non-card RPG Character Resonance Wheel.
 * Presents character attributes as an interconnected astrolabe with concentric
 * orbital rings, glowing elemental beacons, and interactive power inspect.
 */
export function AttributeAstrolabe({ character = {} }) {
  const [selectedAttrKey, setSelectedAttrKey] = useState('strength');
  const attributes = character?.attributes || {
    strength: 5,
    intelligence: 5,
    vitality: 5,
    willpower: 5,
    perception: 5,
  };

  const selectedAttr = ATTRIBUTE_METRICS.find((a) => a.key === selectedAttrKey) || ATTRIBUTE_METRICS[0];
  const selectedValue = attributes[selectedAttr.key] || 5;
  const unallocatedPoints = character?.unallocatedPoints || 0;

  return (
    <section className="relative rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-white via-slate-50/70 to-indigo-50/30 dark:from-obsidian-900/90 dark:via-obsidian-900/60 dark:to-obsidian-800/80 border border-slate-200/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-2xl overflow-hidden">
      {/* Astrolabe Header */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200/70 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-attr-perception shadow-inner">
            <Shield size={18} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold font-display text-slate-900 dark:text-ink">
              Character Resonance Astrolabe
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-ink-muted">
              5 core RPG attributes • tap a node to inspect specialization
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAttributesDrawer}
          className="text-xs font-bold font-mono px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-white/10 dark:text-ink border border-indigo-200 dark:border-white/15 transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
        >
          <Sparkles size={13} className="text-amber-500 dark:text-gold" />
          <span>{unallocatedPoints > 0 ? `+${unallocatedPoints} SP Ready` : 'Full Radar'}</span>
        </button>
      </div>

      {/* Main Astrolabe Body */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* The 5 Interactive Nodes Horizon (7 cols) */}
        <div className="md:col-span-7 grid grid-cols-5 gap-1.5 sm:gap-2.5">
          {ATTRIBUTE_METRICS.map((attr) => {
            const val = attributes[attr.key] || 5;
            const isSelected = selectedAttrKey === attr.key;
            const Icon = attr.icon;

            return (
              <motion.button
                key={attr.key}
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => setSelectedAttrKey(attr.key)}
                className={clsx(
                  'flex flex-col items-center p-2 sm:p-3 rounded-2xl border transition-all text-center relative select-none',
                  isSelected
                    ? 'bg-white dark:bg-white/10 border-indigo-400 dark:border-white/30 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-slate-50/70 hover:bg-white dark:bg-white/[0.03] dark:hover:bg-white/[0.07] border-slate-200/70 dark:border-white/10'
                )}
              >
                <div
                  className={clsx(
                    'w-9 h-9 sm:w-11 sm:h-11 rounded-xl border flex items-center justify-center mb-1.5 shadow-inner transition-transform',
                    attr.bgColor,
                    attr.textColor,
                    isSelected && 'scale-105'
                  )}
                >
                  <Icon size={18} />
                </div>

                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-ink-muted">
                  {attr.code}
                </span>

                <span className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-ink leading-tight mt-0.5">
                  {val}
                </span>

                {isSelected && (
                  <motion.div
                    layoutId="astrolabe-active-indicator"
                    className="absolute -bottom-1.5 w-6 h-1 rounded-full bg-indigo-600 dark:bg-attr-perception"
                    transition={spring.snappy}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Selected Attribute Inspect Chamber (5 cols) */}
        <div className="md:col-span-5 p-4 rounded-2xl bg-white/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 shadow-xs backdrop-blur-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedAttr.key}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={spring.snappy}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={clsx('w-2 h-2 rounded-full', selectedAttr.textColor.replace('text-', 'bg-'))} />
                  <span className="text-xs font-bold text-slate-900 dark:text-ink">
                    {selectedAttr.name} ({selectedAttr.code})
                  </span>
                </div>
                <span className="text-xs font-mono font-black text-slate-900 dark:text-ink px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10">
                  Level {selectedValue}
                </span>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-ink-muted leading-relaxed">
                {selectedAttr.description}
              </p>

              <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 dark:text-ink-muted font-mono">Current Perk:</span>
                <span className={clsx('font-mono font-bold', selectedAttr.textColor)}>
                  {selectedAttr.scaling}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

AttributeAstrolabe.propTypes = {
  character: PropTypes.object,
};
