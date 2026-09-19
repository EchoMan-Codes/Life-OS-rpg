import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Sparkles, Shield, Compass } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks';
import { InitiationConsole } from '@/components/onboarding/InitiationConsole';
import { OnboardingViewport } from '@/components/onboarding/OnboardingViewport';

/**
 * Loading state during auth resolution to eliminate registration flicker.
 */
function OnboardingLoadingScreen() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-obsidian gap-4">
      <motion.div
        className="w-14 h-14 rounded-2xl bg-linear-to-br from-cyan-500/20 via-obsidian-900 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.25)]"
        animate={
          shouldReduceMotion
            ? {}
            : { scale: [1, 1.05, 1], opacity: [0.75, 1, 0.75] }
        }
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Sparkles className="w-7 h-7 text-cyan-400" />
      </motion.div>
      <p className="font-mono text-xs text-cyan-400/80 tracking-widest uppercase">
        Verifying Operator Uplink…
      </p>
    </div>
  );
}

/**
 * LifeOS Onboarding Page — “Enter the Forge”.
 *
 * Implements the immersive split command deck:
 * - Left: Interactive Initiation Console with step progression & exact GET STARTED CTA
 * - Right: 9:16 Cinematic Procedural Viewport with obsidian guardian monolith,
 *   warm horizon glow, violet portal halo, and isolated ember simulation
 * - Mobile: Compact top atmosphere layer with full-width interactive console
 * - Auth Safeguards: Prevents UI flicker, preserves session redirects, zero plaintext leaks
 */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  // Activation sequence state for post-onboarding transition
  const [isActivated, setIsActivated] = useState(false);

  // Clean the 'returning' query parameter after consuming it
  useEffect(() => {
    if (searchParams.get('returning') === 'true') {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('returning');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Handle successful registration or sign-in: brief system-activation transition
  const handleInitiationSuccess = useCallback(() => {
    setIsActivated(true);
    const timer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 700);
    return () => clearTimeout(timer);
  }, [navigate]);

  // 1. Prevent registration UI flicker while silent auth check is active
  if (isLoading) {
    return <OnboardingLoadingScreen />;
  }

  // 2. If already authenticated, redirect directly to dashboard
  if (isAuthenticated && !isActivated) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="relative min-h-screen w-full bg-obsidian text-white overflow-x-hidden flex flex-col justify-between selection:bg-cyan-500 selection:text-obsidian">
      {/* ── Background Cybernetic Atmosphere ── */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Ambient radial gradients */}
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-purple-950/25 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-cyan-950/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-amber-950/15 rounded-full blur-3xl" />
      </div>

      {/* ── Top Navigation Header ── */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-3 flex items-center justify-between pointer-events-auto">
        {/* Holographic LifeOS Brand Badge */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md">
          <div className="w-5 h-5 rounded-sm bg-linear-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-obsidian shadow-[0_0_8px_rgba(56,189,248,0.5)]">
            <Shield size={12} className="stroke-[2.5]" />
          </div>
          <span className="font-display font-bold text-sm tracking-tight text-white">
            LifeOS <span className="text-cyan-400 font-mono text-xs font-normal">v2.0</span>
          </span>
        </div>

        {/* System Directive Beacon */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-ink-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38BDF8] animate-pulse" />
          <span className="hidden sm:inline">COMMAND STATUS:</span>
          <span className="text-cyan-300 font-semibold">FORGE ONLINE</span>
        </div>
      </header>

      {/* ── Mobile Compact Atmosphere Header (Shown on < lg screens) ── */}
      <div className="lg:hidden relative z-10 w-full px-4 pt-2 pb-4 text-center">
        <div className="relative inline-flex items-center justify-center p-3 rounded-2xl bg-obsidian-900/60 border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-cyan-500/30 via-obsidian-950 to-purple-500/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Compass size={22} className="animate-spin-slow" />
          </div>
          <div className="ml-3 text-left">
            <div className="font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
              PORTAL COORDINATE // 390
            </div>
            <div className="text-xs text-ink-muted">
              Synchronizing neural character ledger
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Split Scene ── */}
      <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 xl:gap-12 items-center">
        {/* Left Column: Interactive Onboarding Console */}
        <section
          aria-label="LifeOS Initiation Console"
          className="w-full flex justify-center"
        >
          <InitiationConsole onInitiationSuccess={handleInitiationSuccess} />
        </section>

        {/* Right Column: Tall 9:16 Framed Procedural Viewport (Desktop) */}
        <aside
          aria-label="Cinematic Viewport"
          className="hidden lg:flex justify-center items-center w-full"
        >
          <OnboardingViewport />
        </aside>
      </div>

      {/* ── Footer Status Strip ── */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-white/30 border-t border-white/5">
        <div>LIFEOS // ENTER THE FORGE • INITIATION PROTOCOL</div>
        <div className="flex items-center gap-4">
          <span>SERVER AUTHORITATIVE</span>
          <span>•</span>
          <span>PG CRYPTO VAULT</span>
        </div>
      </footer>

      {/* ── Post-Onboarding "System Activated" Transition Overlay ── */}
      <AnimatePresence>
        {isActivated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-obsidian/95 backdrop-blur-xl"
            role="status"
            aria-live="polite"
          >
            <motion.div
              initial={shouldReduceMotion ? { scale: 1 } : { scale: 0.8, opacity: 0 }}
              animate={shouldReduceMotion ? { scale: 1 } : { scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex flex-col items-center gap-4 text-center p-8 rounded-3xl bg-obsidian-900 border border-cyan-500/50 shadow-[0_0_60px_rgba(6,182,212,0.4)]"
            >
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_30px_rgba(56,189,248,0.5)]">
                <Sparkles size={32} />
              </div>
              <div>
                <h2 className="font-display font-bold text-2xl text-white tracking-tight">
                  FORGE INITIALIZED
                </h2>
                <p className="font-mono text-xs text-cyan-400 mt-1 uppercase tracking-widest">
                  Entering LifeOS Command Deck…
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
