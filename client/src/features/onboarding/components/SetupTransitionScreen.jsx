import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import { JeevanLogo } from '@/components/ui/JeevanLogo';
import { JeevanLoader } from '@/components/ui/JeevanLoader';
import { useAuth } from '@/features/auth/hooks';

const STAGES = [
  'Creating your dashboard',
  'Setting your targets',
  'Preparing your quests',
  'Configuring your AI',
  'Almost there...',
];

/**
 * Cinematic Gateway Setup Transition Screen.
 * Renders the mystical arched portal gateway with traveler silhouette,
 * progressive checklist, glowing progress bar, and "Enter Jeevan →" button.
 */
export function SetupTransitionScreen({ onFinish }) {
  const { isAuthenticated } = useAuth();
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev < STAGES.length - 1) {
          return prev + 1;
        }
        clearInterval(timer);
        setIsReady(true);
        return prev;
      });
    }, 700);

    return () => clearInterval(timer);
  }, []);

  const progressPercent = Math.min(100, Math.round(((currentStageIndex + 1) / STAGES.length) * 100));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#07080C] text-white flex flex-col items-center justify-between p-4 sm:p-6 overflow-y-auto"
    >
      {/* ── Background Atmospheric Glows ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[450px] h-[350px] bg-indigo-500/15 rounded-full blur-[120px]" />
      </div>

      {/* ── Top Spacer ── */}
      <div className="w-full h-2" />

      {/* ── Centerpiece: Sacred Gateway Portal Illustration & Setup Content ── */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center space-y-4 my-auto">
        {/* Sacred Arched Temple Gateway with Traveler */}
        <div className="relative w-full max-w-[280px] h-48 sm:h-56 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.3)] border border-purple-500/30 bg-gradient-to-b from-[#1E113A] via-[#160B2E] to-[#07080C]">
          <svg viewBox="0 0 280 220" preserveAspectRatio="none" className="w-full h-full">
            <defs>
              <linearGradient id="portalSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2E0854" />
                <stop offset="50%" stopColor="#581C87" />
                <stop offset="85%" stopColor="#C084FC" />
                <stop offset="100%" stopColor="#FEF08A" />
              </linearGradient>

              <radialGradient id="portalCore" cx="50%" cy="65%" r="45%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="35%" stopColor="#FDE047" stopOpacity="0.8" />
                <stop offset="70%" stopColor="#A855F7" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#1E113A" stopOpacity="0" />
              </radialGradient>

              <linearGradient id="archPillars" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4A154B" />
                <stop offset="100%" stopColor="#0B061A" />
              </linearGradient>
            </defs>

            {/* Portal Sky Horizon */}
            <rect width="280" height="220" fill="url(#portalSky)" />

            {/* Intense Portal Core Glow */}
            <ellipse cx="140" cy="140" rx="90" ry="75" fill="url(#portalCore)" />

            {/* Distant Mountain Shrines */}
            <path d="M0 160 L60 110 L140 135 L220 100 L280 150 L280 220 L0 220 Z" fill="#1A0D33" opacity="0.6" />

            {/* Sacred Classical Archway Architecture */}
            {/* Outer Arch */}
            <path
              d="M70 220 L70 120 C70 70, 210 70, 210 120 L210 220 L185 220 L185 125 C185 95, 95 95, 95 125 L95 220 Z"
              fill="url(#archPillars)"
            />
            {/* Arch Crown Ornaments */}
            <polygon points="140,55 130,75 150,75" fill="#FDE047" />
            <circle cx="140" cy="50" r="4" fill="#FDE047" />

            {/* Traveler / Hero Silhouette standing at the portal */}
            <circle cx="140" cy="165" r="4.5" fill="#0B061A" />
            <path d="M135 170 L145 170 L147 195 L143 195 L141 182 L139 182 L137 195 L133 195 Z" fill="#0B061A" />
            {/* Small traveler backpack */}
            <rect x="133" y="171" width="3.5" height="7" rx="1.5" fill="#0B061A" />

            {/* Ground Steps */}
            <path d="M40 220 L80 198 L200 198 L240 220 Z" fill="#07080C" opacity="0.95" />
          </svg>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <div className="flex justify-center mb-1">
            <JeevanLogo variant="emblem" size="sm" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
            Building your Jeevan...
          </h2>
          <p className="text-xs text-slate-400">
            Synthesizing your personal operating system
          </p>
        </div>

        {/* Staged Checklist Progress */}
        <div className="w-full p-3.5 sm:p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2 text-left backdrop-blur-md">
          {STAGES.map((text, idx) => {
            const isDone = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            const isPending = idx > currentStageIndex;

            return (
              <div
                key={text}
                className={clsx(
                  'flex items-center gap-2.5 text-xs transition-colors duration-200',
                  isDone && 'text-purple-300 font-medium',
                  isCurrent && 'text-white font-bold',
                  isPending && 'text-slate-600 font-normal'
                )}
              >
                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                  {isDone ? (
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  )}
                </div>
                <span className="truncate">{text}</span>
              </div>
            );
          })}
        </div>

        {/* Luminous Neon Progress Bar */}
        <div className="w-full space-y-1">
          <div className="h-2 rounded-full bg-white/10 overflow-hidden border border-white/10 shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-amber-300 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.7)]"
              initial={{ width: '10%' }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <p className="text-[11px] font-mono text-purple-300/80">
            {isReady ? 'System ready.' : `${progressPercent}% calibrated`}
          </p>
        </div>

        {/* Ready Announcement and Final CTA Button */}
        <div className="w-full pt-2">
          <p className="text-sm font-display font-semibold text-white/90 mb-3">
            &ldquo;Your Jeevan is ready.&rdquo;
          </p>

          <motion.button
            type="button"
            onClick={() => {
              if (isAuthenticated) {
                setIsEntering(true);
              } else {
                onFinish();
              }
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold font-display text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(168,85,247,0.4)] transition-all cursor-pointer"
          >
            <span>Get Started • Enter Jeevan</span>
            <ArrowRight size={18} />
          </motion.button>
        </div>
      </div>

      {/* ── Bottom Spacer ── */}
      <div className="w-full h-2" />

      {/* Full Cinematic Entrance Animation when Enter Jeevan is tapped */}
      <AnimatePresence>
        {isEntering && (
          <JeevanLoader
            variant="full"
            message="Entering Jeevan..."
            submessage="Live. Track. Grow."
            duration={2800}
            onComplete={onFinish}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

SetupTransitionScreen.propTypes = {
  onFinish: PropTypes.func.isRequired,
};
