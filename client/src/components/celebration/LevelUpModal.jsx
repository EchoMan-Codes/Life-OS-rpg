import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion, useMotionValue, animate } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Award, Sparkles, ArrowRight, Shield, X } from 'lucide-react';
import clsx from 'clsx';

import { spring, modalPanel } from '@/lib/motionVariants';
import {
  LIFEOS_LEVEL_UP_EVENT,
  openAttributesDrawer,
} from '@/features/celebration/celebrationEvents';
import { playSound } from '@/lib/sound';

const ATTRIBUTE_CONFETTI_COLORS = [
  '#EF4444', // STR
  '#10B981', // VIT
  '#3B82F6', // INT
  '#8B5CF6', // WIL
  '#F59E0B', // PER / Gold
];

export function LevelUpModal() {
  const [levelUpData, setLevelUpData] = useState(null);
  const [displayLevel, setDisplayLevel] = useState(1);
  const motionLevel = useMotionValue(1);
  const shouldReduceMotion = useReducedMotion();
  const modalRef = useRef(null);

  useEffect(() => {
    const handleLevelUp = (e) => {
      const data = e.detail;
      if (!data) return;

      setLevelUpData(data);

      if (shouldReduceMotion) {
        setDisplayLevel(data.newLevel);
        motionLevel.set(data.newLevel);
      } else {
        const startVal = data.previousLevel || Math.max(1, data.newLevel - (data.levelsGained || 1));
        setDisplayLevel(startVal);
        motionLevel.set(startVal);
      }

      try {
        playSound('level_up');
      } catch {
        // Audio fallback
      }

      if (!shouldReduceMotion) {
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.4 },
            colors: ATTRIBUTE_CONFETTI_COLORS,
            disableForReducedMotion: true,
          });
        }, 150);
      }
    };

    window.addEventListener(LIFEOS_LEVEL_UP_EVENT, handleLevelUp);
    return () => {
      window.removeEventListener(LIFEOS_LEVEL_UP_EVENT, handleLevelUp);
    };
  }, [shouldReduceMotion, motionLevel]);

  const handleDismiss = useCallback(() => {
    setLevelUpData(null);
  }, []);

  const handleAllocatePoints = useCallback(() => {
    setLevelUpData(null);
    openAttributesDrawer();
  }, []);

  useEffect(() => {
    if (!levelUpData || shouldReduceMotion) return;

    const startVal = levelUpData.previousLevel || Math.max(1, levelUpData.newLevel - (levelUpData.levelsGained || 1));
    const targetVal = levelUpData.newLevel;

    const controls = animate(startVal, targetVal, {
      duration: 0.9,
      ease: 'easeOut',
      onUpdate: (latest) => {
        setDisplayLevel(Math.round(latest));
      },
    });

    return () => controls.stop();
  }, [levelUpData, shouldReduceMotion]);

  useEffect(() => {
    if (!levelUpData) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [levelUpData, handleDismiss]);

  if (!levelUpData) return null;

  const { levelsGained = 1, unallocatedPoints = 2 } = levelUpData;
  const isMultiLevel = levelsGained > 1;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="levelup-title"
        ref={modalRef}
      >
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-obsidian-950/85 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
        />

        {/* Modal Container */}
        <motion.div
          variants={modalPanel}
          initial="initial"
          animate="animate"
          exit="exit"
          className={clsx(
            'relative w-full max-w-lg rounded-card p-6 sm:p-8 z-10 text-center overflow-hidden',
            'bg-obsidian-900 border border-gold/40 shadow-2xl shadow-gold/20'
          )}
        >
          {/* Ambient decorative background glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-gold/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-xp/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close celebration"
            className="absolute top-4 right-4 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-glass transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Golden Crest */}
          <div className="relative mx-auto mb-3 flex items-center justify-center">
            <motion.div
              initial={shouldReduceMotion ? {} : { scale: 0.6, rotate: -15 }}
              animate={shouldReduceMotion ? {} : { scale: 1, rotate: 0 }}
              transition={spring.bouncy}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-gold/30 to-gold/10 border-2 border-gold/60 flex items-center justify-center shadow-lg shadow-gold/30"
            >
              <Award className="w-8 h-8 sm:w-10 sm:h-10 text-gold" />
            </motion.div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Progression Milestone</span>
          </div>

          <h2
            id="levelup-title"
            className="text-2xl sm:text-3xl font-bold font-display text-ink tracking-tight mb-1"
          >
            {isMultiLevel ? `${levelsGained} Levels Gained!` : 'Level Up!'}
          </h2>

          <p className="text-ink-muted text-xs sm:text-sm max-w-sm mx-auto mb-4">
            Your real-world discipline and consistency have elevated your hero status.
          </p>

          {/* Large Level Display */}
          <div className="my-4 p-4 rounded-panel bg-obsidian-950/70 border border-glass-border">
            <div className="text-[10px] uppercase tracking-wider text-ink-muted mb-0.5 font-medium">
              Current Level
            </div>
            <div className="text-4xl sm:text-5xl font-extrabold font-display text-transparent bg-clip-text bg-gradient-to-r from-gold via-amber-300 to-xp">
              Level {displayLevel}
            </div>
            {isMultiLevel && (
              <div className="text-xs font-semibold text-gold mt-1">
                +{levelsGained} Levels Jumped
              </div>
            )}
          </div>

          {/* Stat Points Unlocked Banner */}
          <div className="flex items-center justify-between p-3 rounded-panel bg-xp/10 border border-xp/30 mb-6 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-xp/20 border border-xp/40 flex items-center justify-center text-xp shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-semibold text-ink">
                  +{unallocatedPoints} Attribute Points Unlocked
                </div>
                <div className="text-[11px] text-ink-muted">
                  Strengthen your 5 core character attributes.
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={handleAllocatePoints}
              className={clsx(
                'w-full sm:flex-1 min-h-[44px] px-5 py-2.5 rounded-panel font-semibold text-sm',
                'bg-gradient-to-r from-gold to-amber-500 text-obsidian-950',
                'hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-gold/25',
                'flex items-center justify-center gap-1.5'
              )}
            >
              <span>Allocate Points</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className={clsx(
                'w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-panel font-medium text-xs sm:text-sm',
                'bg-glass hover:bg-glass-hover text-ink border border-glass-border',
                'active:scale-[0.98] transition-all'
              )}
            >
              Continue Questing
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default LevelUpModal;
