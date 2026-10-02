import { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import { JeevanLogo } from './JeevanLogo';

/**
 * Signature Jeevan Cinematic Loading System.
 *
 * Inspired by geometric shape morphing, futuristic operating systems, and cosmic dawn imagery.
 * Automatically adapts between Dark Mode (obsidian/indigo/violet/cyan/gold) and
 * Light Mode (serene cloud/indigo/violet/amber-gold).
 *
 * Supports 3 intensity levels:
 * - 'full': High-impact cinematic entrance for app boot, onboarding finish, and login activation.
 * - 'medium': Focused glowing emblem transition for saving habits, dailies, quests, and modal actions.
 * - 'micro': Compact spinning energy emblem for inline buttons, badges, and quick states.
 */
export function JeevanLoader({
  variant = 'full',
  message = 'Initializing Jeevan OS...',
  submessage = 'Live. Track. Grow.',
  duration = 1800,
  onComplete,
  progress,
  className = '',
  themeOverride,
}) {
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = useState('converge'); // 'converge' -> 'illuminate' -> 'pulse' -> 'settle' -> 'done'
  const [currentShapeIdx, setCurrentShapeIdx] = useState(0);
  const [isThemeDark, setIsThemeDark] = useState(true);
  const videoRef = useRef(null);

  // Detect current active theme
  useEffect(() => {
    const updateTheme = () => {
      if (themeOverride) {
        setIsThemeDark(themeOverride === 'dark');
        return;
      }
      const dataTheme = document.documentElement.getAttribute('data-theme');
      const hasDarkClass = document.documentElement.classList.contains('dark') || document.documentElement.classList.contains('theme-dark');
      setIsThemeDark(dataTheme !== 'light' && (dataTheme === 'dark' || hasDarkClass));
    };

    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    return () => observer.disconnect();
  }, [themeOverride]);

  // Geometric shapes sequence inspired by reference video (morphing forms)
  const geometricShapes = useMemo(
    () => [
      { borderRadius: '50%', rotate: 0, scale: 0.8 },      // Circle
      { borderRadius: '15%', rotate: 45, scale: 1.0 },     // Diamond / faceted crystal
      { borderRadius: '35% 65% 60% 40% / 40% 30% 70% 60%', rotate: 90, scale: 1.15 }, // Organic energy node
      { borderRadius: '25%', rotate: 180, scale: 1.0 },    // Faceted prism
      { borderRadius: '50%', rotate: 360, scale: 0.95 },   // Converging ring
    ],
    []
  );

  // Phase progression timer for 'full' and 'medium'
  useEffect(() => {
    if (variant === 'micro') return;

    const shapeInterval = setInterval(() => {
      setCurrentShapeIdx((prev) => (prev + 1) % geometricShapes.length);
    }, Math.max(220, Math.floor(duration / 7)));

    // Phase 1 -> 2: Illuminate emblem
    const t1 = setTimeout(() => {
      setPhase('illuminate');
    }, Math.floor(duration * 0.45));

    // Phase 2 -> 3: Energy Pulse
    const t2 = setTimeout(() => {
      setPhase('pulse');
    }, Math.floor(duration * 0.7));

    // Phase 3 -> 4: Settle & Trigger completion
    const t3 = setTimeout(() => {
      setPhase('settle');
      if (onComplete) {
        onComplete();
      }
    }, duration);

    return () => {
      clearInterval(shapeInterval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [variant, duration, geometricShapes.length, onComplete]);

  // ─────────────────────────────────────────────────────────
  // MICRO INTENSITY: Compact glowing indicator for buttons
  // ─────────────────────────────────────────────────────────
  if (variant === 'micro') {
    return (
      <div className={clsx('relative inline-flex items-center justify-center shrink-0', className)}>
        {/* Ambient spinning ring */}
        <motion.div
          className={clsx(
            'w-5 h-5 rounded-full border-2 border-t-amber-400 border-r-indigo-500 border-b-cyan-400 border-l-transparent',
            'shadow-[0_0_8px_rgba(251,191,36,0.4)]'
          )}
          animate={shouldReduceMotion ? { opacity: [0.6, 1, 0.6] } : { rotate: 360 }}
          transition={{
            duration: 1.0,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        {/* Core emblem mark */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-amber-400 to-cyan-300 shadow-[0_0_6px_rgba(251,191,36,0.9)]" />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // MEDIUM INTENSITY: Card/modal backdrop for saves & updates
  // ─────────────────────────────────────────────────────────
  if (variant === 'medium') {
    return (
      <div
        className={clsx(
          'flex flex-col items-center justify-center p-6 text-center select-none',
          className
        )}
      >
        <div className="relative w-20 h-20 flex items-center justify-center mb-4">
          {/* Subtle Outer Energy Pulse */}
          <motion.div
            className={clsx(
              'absolute inset-0 rounded-3xl',
              isThemeDark
                ? 'bg-gradient-to-tr from-cyan-500/25 via-indigo-600/30 to-amber-400/25 border border-amber-400/30'
                : 'bg-gradient-to-tr from-indigo-200/60 via-purple-100 to-amber-200/60 border border-indigo-300/40',
              'blur-sm'
            )}
            animate={
              shouldReduceMotion
                ? {}
                : {
                    scale: [0.95, 1.15, 0.95],
                    opacity: [0.6, 0.9, 0.6],
                    rotate: [0, 45, 90],
                  }
            }
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Central Jeevan Emblem */}
          <motion.div
            className="relative z-10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <JeevanLogo variant="emblem" size="md" />
          </motion.div>

          {/* Expanding shockwave ripple */}
          <motion.div
            className="absolute inset-0 rounded-full border border-amber-400/60 pointer-events-none"
            initial={{ scale: 0.7, opacity: 0.8 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
          />
        </div>

        {/* Message */}
        <p
          className={clsx(
            'text-sm font-semibold tracking-wide font-display',
            isThemeDark ? 'text-white' : 'text-slate-900'
          )}
        >
          {message}
        </p>
        {submessage && (
          <p
            className={clsx(
              'text-[11px] font-mono tracking-wider mt-1 uppercase',
              isThemeDark ? 'text-indigo-300/80' : 'text-indigo-600/80'
            )}
          >
            {submessage}
          </p>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // FULL CINEMATIC INTENSITY: App Startup / Auth / Onboarding
  // ─────────────────────────────────────────────────────────
  const currentShape = geometricShapes[currentShapeIdx] || geometricShapes[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={clsx(
        'fixed inset-0 z-[100] flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden',
        isThemeDark
          ? 'bg-[#06070B] text-white'
          : 'bg-[#F8FAFC] text-slate-900',
        className
      )}
    >
      {/* ── Background Atmosphere & Ambient Video Layer ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Soft Radial Ambient Lights */}
        {isThemeDark ? (
          <>
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-indigo-900/30 via-violet-800/20 to-cyan-500/15 rounded-full blur-[140px]" />
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-amber-500/10 rounded-full blur-[120px]" />
          </>
        ) : (
          <>
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-200/50 via-purple-100/60 to-cyan-100/40 rounded-full blur-[140px]" />
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[450px] h-[250px] bg-amber-200/40 rounded-full blur-[100px]" />
          </>
        )}

        {/* Ambient Reference Video Blend (Dark theme only, soft opacity) */}
        {isThemeDark && (
          <video
            ref={videoRef}
            src="/videos/loading.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-contain opacity-25 mix-blend-screen pointer-events-none scale-125"
          />
        )}
      </div>

      {/* ── Top Header Brand Pill ── */}
      <div className="relative z-10 w-full flex items-center justify-between max-w-4xl pt-2">
        <div
          className={clsx(
            'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-widest uppercase backdrop-blur-md',
            isThemeDark
              ? 'bg-white/[0.04] border border-white/10 text-white/70'
              : 'bg-white/80 border border-slate-200 text-slate-700 shadow-xs'
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          <span>Jeevan OS Core</span>
        </div>

        <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
          v2.4
        </div>
      </div>

      {/* ── Centerpiece: Geometric Morphing & Logo Formation ── */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto w-full max-w-sm">
        <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
          {/* Constellation of small orbiting energy points */}
          {!shouldReduceMotion && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            >
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <div
                  key={deg}
                  className="absolute w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-300 to-cyan-300 shadow-[0_0_6px_rgba(251,191,36,0.9)]"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${deg}deg) translate(80px) rotate(-${deg}deg)`,
                  }}
                />
              ))}
            </motion.div>
          )}

          {/* Morphing Geometric Silhouette (Inspired by Reference Video) */}
          <motion.div
            className={clsx(
              'absolute inset-4 transition-all pointer-events-none',
              isThemeDark
                ? 'border-2 border-white/20 bg-gradient-to-br from-indigo-500/15 via-white/5 to-cyan-500/10 shadow-[0_0_40px_rgba(99,102,241,0.25)]'
                : 'border-2 border-indigo-400/30 bg-gradient-to-br from-indigo-100/60 via-white/40 to-amber-100/40 shadow-[0_0_30px_rgba(99,102,241,0.15)]'
            )}
            animate={
              shouldReduceMotion
                ? { opacity: [0.5, 1, 0.5] }
                : {
                    borderRadius: currentShape.borderRadius,
                    rotate: currentShape.rotate,
                    scale: currentShape.scale,
                  }
            }
            transition={{
              duration: 0.6,
              ease: [0.25, 1, 0.5, 1],
            }}
          />

          {/* Outward Expanding Energy Ripple when Emblem Illuminates */}
          {(phase === 'illuminate' || phase === 'pulse' || phase === 'settle') && (
            <motion.div
              className={clsx(
                'absolute rounded-full border pointer-events-none',
                isThemeDark ? 'border-amber-400/80 shadow-[0_0_24px_rgba(251,191,36,0.5)]' : 'border-indigo-500/80 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
              )}
              initial={{ width: 40, height: 40, opacity: 1 }}
              animate={{ width: 220, height: 220, opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            />
          )}

          {/* Central Jeevan Emblem Container */}
          <motion.div
            className="relative z-10"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={
              phase === 'converge'
                ? { scale: 0.85, opacity: 0.85 }
                : phase === 'illuminate'
                ? { scale: 1.08, opacity: 1, filter: 'drop-shadow(0 0 25px rgba(251, 191, 36, 0.8))' }
                : { scale: 1.0, opacity: 1, filter: 'drop-shadow(0 0 16px rgba(56, 189, 248, 0.4))' }
            }
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <JeevanLogo variant="emblem" size="lg" animated />
          </motion.div>
        </div>

        {/* Luminous Title & Status Typography */}
        <div className="mt-8 space-y-2 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className={clsx(
              'text-2xl sm:text-3xl font-black font-display tracking-tight',
              isThemeDark ? 'text-white' : 'text-slate-900'
            )}
          >
            {message}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className={clsx(
              'text-xs sm:text-sm font-mono tracking-widest uppercase font-medium',
              isThemeDark ? 'text-amber-300/90' : 'text-indigo-600'
            )}
          >
            {submessage}
          </motion.p>
        </div>

        {/* Dynamic Progress Indicator */}
        <div className="w-full max-w-[240px] mt-6 space-y-2">
          <div
            className={clsx(
              'h-1.5 w-full rounded-full overflow-hidden p-0.5 border',
              isThemeDark
                ? 'bg-white/10 border-white/10'
                : 'bg-slate-200 border-slate-300'
            )}
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
              initial={{ width: '15%' }}
              animate={{
                width: progress !== undefined ? `${progress}%` : phase === 'settle' ? '100%' : '85%',
              }}
              transition={{ duration: duration / 1000, ease: 'easeInOut' }}
            />
          </div>

          <div
            className={clsx(
              'flex items-center justify-between text-[10px] font-mono',
              isThemeDark ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            <span>SYNCHRONIZING</span>
            <span>{progress !== undefined ? `${Math.round(progress)}%` : phase === 'settle' ? '100%' : 'CALIBRATING'}</span>
          </div>
        </div>
      </div>

      {/* ── Bottom Quote / Tagline Anchor ── */}
      <div className="relative z-10 w-full text-center pb-2">
        <p
          className={clsx(
            'text-xs tracking-wider font-light italic',
            isThemeDark ? 'text-slate-500' : 'text-slate-400'
          )}
        >
          “Live. Track. Grow.” — The Personal Operating System
        </p>
      </div>
    </motion.div>
  );
}

JeevanLoader.propTypes = {
  variant: PropTypes.oneOf(['full', 'medium', 'micro']),
  message: PropTypes.string,
  submessage: PropTypes.string,
  duration: PropTypes.number,
  onComplete: PropTypes.func,
  progress: PropTypes.number,
  className: PropTypes.string,
  themeOverride: PropTypes.oneOf(['light', 'dark']),
};

export default JeevanLoader;
