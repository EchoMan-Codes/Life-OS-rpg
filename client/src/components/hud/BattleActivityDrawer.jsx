import { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Swords, Zap, Calendar, Scroll, Skull, Gift, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import { useBattleEvents } from '@/features/battle-events/hooks';
import { spring } from '@/lib/motionVariants';

function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const now = Date.now();
  const past = new Date(isoString).getTime();
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function getSourceIcon(sourceType) {
  switch (sourceType) {
    case 'habit':
      return { Icon: Zap, color: 'text-attr-willpower', bg: 'bg-attr-willpower/10 border-attr-willpower/30' };
    case 'daily':
      return { Icon: Calendar, color: 'text-attr-intelligence', bg: 'bg-attr-intelligence/10 border-attr-intelligence/30' };
    case 'quest':
      return { Icon: Scroll, color: 'text-attr-perception', bg: 'bg-attr-perception/10 border-attr-perception/30' };
    case 'boss':
      return { Icon: Skull, color: 'text-attr-strength', bg: 'bg-attr-strength/10 border-attr-strength/30' };
    default:
      return { Icon: Swords, color: 'text-gold', bg: 'bg-gold/10 border-gold/30' };
  }
}

export function BattleActivityDrawer({ isOpen, onClose }) {
  const { data: events = [], isLoading } = useBattleEvents({ limit: 20 });
  const shouldReduceMotion = useReducedMotion();

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-sm"
          />

          {/* Drawer Container (Desktop: Right slide; Mobile: full width) */}
          <motion.aside
            initial={shouldReduceMotion ? { opacity: 0 } : { x: '100%' }}
            animate={shouldReduceMotion ? { opacity: 1 } : { x: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { x: '100%' }}
            transition={spring.snappy}
            role="dialog"
            aria-modal="true"
            aria-labelledby="battle-activity-title"
            className={clsx(
              'relative z-10 w-full sm:max-w-md h-full',
              'bg-obsidian-900 border-l border-glass-border shadow-2xl',
              'flex flex-col overflow-hidden'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-glass-border">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
                  <Swords className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    id="battle-activity-title"
                    className="text-lg font-bold font-display text-ink"
                  >
                    Battle Activity
                  </h2>
                  <p className="text-xs text-ink-muted">
                    Recent combat & progression feed
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close battle activity log"
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-glass transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {isLoading && (
                <div className="py-12 text-center text-ink-muted text-sm animate-pulse">
                  Loading battle encounters...
                </div>
              )}

              {!isLoading && events.length === 0 && (
                <div className="py-16 text-center">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-glass border border-glass-border flex items-center justify-center text-ink-muted">
                    <Swords className="w-7 h-7" />
                  </div>
                  <div className="text-ink font-semibold text-base mb-1">
                    No Battle Events Yet
                  </div>
                  <p className="text-xs text-ink-muted max-w-xs mx-auto">
                    Score habits, conquer dailies, or finish quests to write your battle chronicles.
                  </p>
                </div>
              )}

              {!isLoading &&
                events.map((event) => {
                  const { Icon, color, bg } = getSourceIcon(event.sourceType);
                  const isHpLoss = event.hpChange < 0;
                  const isHpGain = event.hpChange > 0;

                  return (
                    <div
                      key={event.id}
                      className="p-3.5 rounded-xl bg-glass border border-glass-border/70 hover:border-glass-border transition-colors flex items-start gap-3"
                    >
                      {/* Source Icon Badge */}
                      <div
                        className={clsx(
                          'w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5',
                          bg,
                          color
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-ink capitalize">
                            {event.sourceType} Encounter
                          </span>
                          <span className="text-[11px] text-ink-muted shrink-0">
                            {formatRelativeTime(event.createdAt)}
                          </span>
                        </div>

                        {/* Reward Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {event.xpAwarded > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-xp/15 text-xp text-xs font-semibold">
                              +{event.xpAwarded} XP
                            </span>
                          )}

                          {event.goldAwarded > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gold/15 text-gold text-xs font-semibold">
                              +{event.goldAwarded} Gold
                            </span>
                          )}

                          {isHpLoss && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-attr-strength/15 text-attr-strength text-xs font-semibold">
                              <ShieldAlert className="w-3 h-3" />
                              {event.hpChange} HP
                            </span>
                          )}

                          {isHpGain && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-attr-vitality/15 text-attr-vitality text-xs font-semibold">
                              +{event.hpChange} HP
                            </span>
                          )}

                          {event.lootItem && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gold/20 text-gold text-xs font-semibold border border-gold/40">
                              <Gift className="w-3 h-3" />
                              Loot: {event.lootItem.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

BattleActivityDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
