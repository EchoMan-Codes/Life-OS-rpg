import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, Bot, Layers, Target, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';

const STAGES = [
  { text: 'Creating your dashboard...', icon: Layers },
  { text: 'Setting your targets...', icon: Target },
  { text: 'Preparing your quests...', icon: Sparkles },
  { text: 'Configuring your AI...', icon: Bot },
  { text: 'Your LifeOS is ready!', icon: ShieldCheck },
];

/**
 * Animated Setup Transition Screen.
 * Displays "Building your LifeOS..." with progressive staging before routing to Dashboard.
 */
export function SetupTransitionScreen({ onFinish }) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev < STAGES.length - 1) {
          return prev + 1;
        }
        clearInterval(timer);
        setTimeout(() => {
          onFinish();
        }, 600);
        return prev;
      });
    }, 600);

    return () => clearInterval(timer);
  }, [onFinish]);

  const progressPercent = Math.round(((currentStageIndex + 1) / STAGES.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#07080C] flex flex-col items-center justify-center p-6 text-center"
    >
      {/* Ambient background glows */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm space-y-6">
        {/* Animated glowing core */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
            className="absolute inset-0 rounded-3xl border-2 border-dashed border-purple-500/40"
          />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(168,85,247,0.4)]">
            <Sparkles size={28} className="animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
            Building your LifeOS...
          </h2>
          <p className="text-xs text-slate-400">
            Personalizing your operating system based on your answers
          </p>
        </div>

        {/* Staged Checklist Progress */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5 text-left">
          {STAGES.map((stage, idx) => {
            const isDone = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            const isPending = idx > currentStageIndex;
            const Icon = stage.icon;

            return (
              <div
                key={stage.text}
                className={clsx(
                  'flex items-center gap-2.5 text-xs transition-colors duration-200',
                  isDone && 'text-purple-300 font-medium',
                  isCurrent && 'text-white font-bold',
                  isPending && 'text-slate-600 font-normal'
                )}
              >
                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                  {isDone ? (
                    <CheckCircle2 size={15} className="text-emerald-400" />
                  ) : isCurrent ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  )}
                </div>
                <span className="truncate">{stage.text}</span>
              </div>
            );
          })}
        </div>

        {/* Panoramic Progress Bar */}
        <div className="space-y-1">
          <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/10 shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-500 text-right">
            {progressPercent}% configured
          </div>
        </div>
      </div>
    </motion.div>
  );
}

SetupTransitionScreen.propTypes = {
  onFinish: PropTypes.func.isRequired,
};
