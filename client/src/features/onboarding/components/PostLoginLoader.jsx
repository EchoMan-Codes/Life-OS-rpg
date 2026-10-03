import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { JeevanLogo } from '@/components/ui/JeevanLogo';
import { Sparkles, CheckCircle2 } from 'lucide-react';

const STAGES = [
  {
    title: 'Building your Jeevan...',
    detail: 'Forging your hero profile and core attributes',
    durationMs: 2500,
  },
  {
    title: 'Preparing your personal space...',
    detail: 'Calibrating your quest chambers and daily rituals',
    durationMs: 2500,
  },
  {
    title: 'Aligning neural pathways...',
    detail: 'Synthesizing adaptive focus patterns and reward vaults',
    durationMs: 2500,
  },
  {
    title: 'Your digital sanctum is ready.',
    detail: 'Entering the universe of Jeevan',
    durationMs: 2500,
  },
];

const TOTAL_POST_LOGIN_DURATION = 10000; // Exactly 10 seconds

/**
 * 10-Second Post-Login Preparation Animation.
 * Seamlessly bridges account authentication to the rolling section cards reveal.
 */
export function PostLoginLoader({ onComplete }) {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStageIdx(1), 2500);
    const timer2 = setTimeout(() => setCurrentStageIdx(2), 5000);
    const timer3 = setTimeout(() => setCurrentStageIdx(3), 7500);
    const timerDone = setTimeout(() => onComplete(), TOTAL_POST_LOGIN_DURATION);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timerDone);
    };
  }, [onComplete]);

  const activeStage = STAGES[currentStageIdx] || STAGES[STAGES.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 bg-[#06070B] text-white flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden"
    >
      {/* ── Ambient Radial Atmosphere ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.25, 0.4, 0.25],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-purple-800/30 via-indigo-700/25 to-cyan-500/20 rounded-full blur-[150px]"
        />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[450px] h-[250px] bg-amber-500/15 rounded-full blur-[120px]" />
      </div>

      {/* ── Top Spacer ── */}
      <div className="w-full h-4" />

      {/* ── Centerpiece: Glowing Morphing Emblem & Contextual Copy ── */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center my-auto space-y-7">
        {/* Animated Sacred Emblem with Breathing Radiance */}
        <div className="relative flex items-center justify-center">
          {/* Orbital pulse rings */}
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
            className="absolute w-32 h-32 rounded-full border border-purple-500/40 pointer-events-none"
          />
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
            className="absolute w-36 h-36 rounded-full border border-indigo-400/30 pointer-events-none"
          />

          <motion.div
            animate={{
              boxShadow: [
                '0 0 30px rgba(168,85,247,0.3)',
                '0 0 60px rgba(168,85,247,0.6)',
                '0 0 30px rgba(168,85,247,0.3)',
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600/30 via-indigo-600/20 to-purple-900/40 border border-purple-500/50 backdrop-blur-xl flex items-center justify-center"
          >
            <JeevanLogo variant="emblem" size="md" />
          </motion.div>
        </div>

        {/* Dynamic Contextual Headlines */}
        <div className="min-h-[90px] flex flex-col items-center justify-center space-y-2 px-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStageIdx}
              initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-1.5 text-center"
            >
              <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
                {activeStage.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-sans">
                {activeStage.detail}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Staged Checklist Pills */}
        <div className="w-full p-3 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-2 text-left">
          {STAGES.map((stage, idx) => {
            const isDone = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;

            return (
              <div
                key={stage.title}
                className="flex items-center gap-2.5 text-xs transition-colors duration-200"
              >
                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                  {isDone ? (
                    <CheckCircle2 size={13} className="text-emerald-400" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  )}
                </div>
                <span
                  className={
                    isDone
                      ? 'text-purple-300 font-medium'
                      : isCurrent
                      ? 'text-white font-semibold'
                      : 'text-slate-600'
                  }
                >
                  {stage.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Luminous Continuous Progress Line */}
        <div className="w-full space-y-1.5">
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden border border-white/10 shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-amber-300 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.7)]"
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStageIdx + 1) / STAGES.length) * 100}%` }}
              transition={{ duration: 2.5, ease: 'easeInOut' }}
            />
          </div>
          <p className="text-[10px] font-mono text-purple-300/80 tracking-wider">
            SYNTHESIZING WORKSPACE
          </p>
        </div>
      </div>

      {/* ── Bottom Spacer ── */}
      <div className="w-full h-4" />
    </motion.div>
  );
}

PostLoginLoader.propTypes = {
  onComplete: PropTypes.func.isRequired,
};
