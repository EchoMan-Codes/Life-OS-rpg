import { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Sparkles, Shield, Brain, Heart, Zap, Eye, Plus } from 'lucide-react';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import { spring } from '@/lib/motionVariants';
import { useAllocateAttribute } from '@/features/character/hooks';
import { useFloatingText } from '@/features/character/floatingText';
import { AttributesRadarChart } from './AttributesRadarChart';

const ATTR_DETAILS = [
  {
    key: 'strength',
    name: 'Strength',
    icon: Shield,
    colorClass: 'text-attr-strength',
    bgClass: 'bg-attr-strength/10 border-attr-strength/25',
    desc: 'Physical prowess (+4 Max HP per point).',
  },
  {
    key: 'intelligence',
    name: 'Intelligence',
    icon: Brain,
    colorClass: 'text-attr-intelligence',
    bgClass: 'bg-attr-intelligence/10 border-attr-intelligence/25',
    desc: 'Mental acuity (+3 Max Mana per point).',
  },
  {
    key: 'vitality',
    name: 'Vitality',
    icon: Heart,
    colorClass: 'text-attr-vitality',
    bgClass: 'bg-attr-vitality/10 border-attr-vitality/25',
    desc: 'Immune resilience (+4 Max HP per point).',
  },
  {
    key: 'willpower',
    name: 'Willpower',
    icon: Zap,
    colorClass: 'text-attr-willpower',
    bgClass: 'bg-attr-willpower/10 border-attr-willpower/25',
    desc: 'Habit discipline (+3 Max Mana per point).',
  },
  {
    key: 'perception',
    name: 'Perception',
    icon: Eye,
    colorClass: 'text-attr-perception',
    bgClass: 'bg-attr-perception/10 border-attr-perception/25',
    desc: 'Self-awareness & streak detection.',
  },
];

/**
 * Attributes drawer (desktop: right drawer; mobile: full-screen sheet).
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Whether drawer is open
 * @param {() => void} props.onClose - Dismiss callback
 * @param {object} props.character - Current character data
 */
export function AttributesDrawer({ isOpen, onClose, character = {} }) {
  const shouldReduceMotion = useReducedMotion();
  const allocateMutation = useAllocateAttribute();
  const { spawnFloatingText } = useFloatingText();

  const attributes = character.attributes || {};
  const unallocatedPoints = character.unallocatedPoints || 0;

  const handleAllocate = async (attributeKey, attributeName) => {
    try {
      await allocateMutation.mutateAsync({ attribute: attributeKey, points: 1 });
      spawnFloatingText(`+1 ${attributeName}`);
    } catch (err) {
      console.error('Failed to allocate point:', err);
    }
  };

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
            <motion.div
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { x: '100%' }
              }
              animate={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { x: 0 }
              }
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { x: '100%' }
              }
              transition={shouldReduceMotion ? { duration: 0 } : spring.gentle}
              className={clsx(
                'w-screen sm:max-w-md md:max-w-lg',
                'bg-obsidian-900/95 backdrop-blur-2xl border-l border-glass-border',
                'flex flex-col shadow-2xl overflow-y-auto'
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-glass-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h2 className="text-display-sm text-ink font-semibold">
                      Character Attributes
                    </h2>
                    <p className="text-caption text-ink-muted">
                      Level {character.level || 1} Hero Overview
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close attributes panel"
                  className={clsx(
                    'p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-glass',
                    'transition-colors focus:outline-none focus:ring-2 focus:ring-glass-border'
                  )}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Unallocated points banner if any */}
              {unallocatedPoints > 0 && (
                <div className="mx-5 mt-4 p-3.5 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-gold animate-ping" />
                    <span className="text-body-sm font-semibold text-gold">
                      {unallocatedPoints} unallocated stat points available
                    </span>
                  </div>
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-gold/80 bg-gold/15 px-2 py-0.5 rounded">
                    Ready to spend
                  </span>
                </div>
              )}

              {/* Radar Chart Section */}
              <div className="p-4 sm:p-5 flex flex-col items-center">
                <AttributesRadarChart attributes={attributes} />
              </div>

              {/* Attributes List */}
              <div className="px-5 pb-8 flex flex-col gap-2.5">
                <h3 className="text-caption text-ink-muted uppercase tracking-wider font-display font-medium mb-1">
                  Attribute Breakdown
                </h3>
                {ATTR_DETAILS.map((attr) => {
                  const Icon = attr.icon;
                  const val = attributes[attr.key] ?? 5;

                  return (
                    <div
                      key={attr.key}
                      className={clsx(
                        'p-3.5 rounded-panel border flex items-center justify-between',
                        attr.bgClass
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx(
                            'w-8 h-8 rounded-lg flex items-center justify-center',
                            attr.colorClass
                          )}
                        >
                          <Icon size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display font-semibold text-ink text-sm">
                              {attr.name}
                            </span>
                          </div>
                          <p className="text-[11px] text-ink-muted leading-tight line-clamp-1">
                            {attr.desc}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span
                          className={clsx(
                            'font-mono font-bold text-base min-w-5 text-right',
                            attr.colorClass
                          )}
                        >
                          {val}
                        </span>

                        {unallocatedPoints > 0 && (
                          <button
                            type="button"
                            onClick={() => handleAllocate(attr.key, attr.name)}
                            disabled={allocateMutation.isPending}
                            aria-label={`Allocate 1 point to ${attr.name}`}
                            title={`Add 1 point to ${attr.name}`}
                            className={clsx(
                              'w-7 h-7 rounded-lg border border-gold/40 bg-gold/15 text-gold',
                              'hover:bg-gold/25 hover:border-gold/60 active:scale-95',
                              'flex items-center justify-center font-bold',
                              'transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                              'focus:outline-none focus:ring-2 focus:ring-gold/50 shadow-sm'
                            )}
                          >
                            <Plus size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

AttributesDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  character: PropTypes.object,
};
