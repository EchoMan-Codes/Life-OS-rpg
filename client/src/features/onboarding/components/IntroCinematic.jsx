import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { JeevanLogo } from '@/components/ui/JeevanLogo';
import { Sparkles, ChevronRight } from 'lucide-react';

const INTRO_PHASES = [
  {
    startMs: 0,
    endMs: 3800,
    label: 'AWAKENING',
    quote: 'Every life is an epic in progress...',
    subtitle: 'Where discipline becomes destiny.',
  },
  {
    startMs: 3800,
    endMs: 7800,
    label: 'SANCTUM',
    quote: 'Transform daily routines into legendary character progression.',
    subtitle: 'Track your existence. Master your focus.',
  },
  {
    startMs: 7800,
    endMs: 11200,
    label: 'SYNTHESIS',
    quote: 'Your personal digital operating system is calibrating.',
    subtitle: 'RPG vitality meets Apple-level clarity.',
  },
  {
    startMs: 11200,
    endMs: 13500,
    label: 'GENESIS',
    quote: 'Welcome to Jeevan.',
    subtitle: 'Live. Track. Grow.',
  },
];

const TOTAL_DURATION_MS = 13500; // ~13.5 seconds cinematic sequence

/**
 * Premium 10-15s Cinematic Intro Animation for first-launch experience.
 * Inspired by loading.mp4 and cosmic dawn minimalism.
 */
export function IntroCinematic({ onComplete }) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = now - startTime;
      setElapsedMs(Math.min(diff, TOTAL_DURATION_MS));

      // Find current phase
      const phaseIdx = INTRO_PHASES.findIndex(
        (p) => diff >= p.startMs && diff < p.endMs
      );
      if (phaseIdx !== -1) {
        setCurrentPhaseIndex(phaseIdx);
      } else if (diff >= TOTAL_DURATION_MS) {
        clearInterval(interval);
        onComplete();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [onComplete]);

  const activePhase = INTRO_PHASES[currentPhaseIndex] || INTRO_PHASES[INTRO_PHASES.length - 1];
  const progressRatio = Math.min(1, elapsedMs / TOTAL_DURATION_MS);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 bg-[#05060A] text-white flex flex-col justify-between p-6 sm:p-10 overflow-hidden select-none"
    >
      {/* ── Ambient Radial Atmosphere ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-purple-900/30 via-indigo-800/25 to-cyan-500/20 rounded-full blur-[160px]"
        />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-amber-500/10 rounded-full blur-[140px]" />

        {/* Ambient Reference Video Layer */}
        <video
          ref={videoRef}
          src="/videos/loading.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-contain opacity-35 mix-blend-screen pointer-events-none scale-125"
        />
      </div>

      {/* ── Top Header Bar with Brand and Skip Control ── */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex items-center justify-between pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
          <span className="text-[10px] font-mono tracking-widest text-slate-300 uppercase">
            {activePhase.label}
          </span>
        </div>

        <button
          type="button"
          onClick={onComplete}
          className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-[11px] font-mono text-slate-400 hover:text-white transition-all cursor-pointer backdrop-blur-md"
        >
          <span>Skip</span>
          <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* ── Centerpiece: Glowing Emblem & Paced Typography ── */}
      <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col items-center text-center my-auto space-y-8">
        {/* Animated Sacred Emblem with Breathing Radiance */}
        <div className="relative flex items-center justify-center">
          {/* Concentric orbital rings */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
            className="absolute w-36 h-36 rounded-full border border-purple-500/20 pointer-events-none"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            className="absolute w-44 h-44 rounded-full border border-indigo-500/15 border-dashed pointer-events-none"
          />

          {/* Glowing Aura Ring */}
          <motion.div
            animate={{
              scale: [0.95, 1.1, 0.95],
              boxShadow: [
                '0 0 40px rgba(168,85,247,0.3)',
                '0 0 70px rgba(168,85,247,0.6)',
                '0 0 40px rgba(168,85,247,0.3)',
              ],
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600/30 via-indigo-600/20 to-purple-900/40 border border-purple-500/40 backdrop-blur-xl flex items-center justify-center"
          >
            <JeevanLogo variant="emblem" size="lg" />
          </motion.div>
        </div>

        {/* Poetic Typography Sequence with Smooth Cross-fades */}
        <div className="min-h-[110px] sm:min-h-[120px] flex flex-col items-center justify-center space-y-3 px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPhaseIndex}
              initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-2 text-center"
            >
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black font-display text-white tracking-tight leading-snug">
                &ldquo;{activePhase.quote}&rdquo;
              </h1>
              <p className="text-xs sm:text-sm text-purple-200/70 font-sans tracking-wide">
                {activePhase.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom Ambient Progress Indicator ── */}
      <div className="relative z-10 w-full max-w-sm mx-auto space-y-2 pb-2">
        <div className="w-full h-1 rounded-full bg-white/[0.08] overflow-hidden border border-white/[0.06]">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-amber-300 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.8)]"
            style={{ width: `${progressRatio * 100}%` }}
            transition={{ ease: 'linear' }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 tracking-wider">
          <span>INITIALIZING EXPERIENCE</span>
          <span>{Math.round(progressRatio * 100)}%</span>
        </div>
      </div>
    </motion.div>
  );
}

IntroCinematic.propTypes = {
  onComplete: PropTypes.func.isRequired,
};
