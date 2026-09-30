import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

import { useAuth } from '@/features/auth/hooks';
import { ONBOARDING_STEPS, TOTAL_STEPS } from './constants';
import { OnboardingIllustration } from './components/OnboardingIllustration';
import { OnboardingProgress } from './components/OnboardingProgress';
import { StepIntro } from './components/StepIntro';
import { StepCoreFocus } from './components/StepCoreFocus';
import { StepRitualCadence } from './components/StepRitualCadence';
import { StepFocusStyle } from './components/StepFocusStyle';
import { StepAuth } from './components/StepAuth';

const LOCAL_STORAGE_ANSWERS_KEY = 'lifeos_onboarding_answers';
export const LOCAL_STORAGE_COMPLETED_KEY = 'lifeos_onboarding_completed';

const DEFAULT_ANSWERS = {
  objectiveId: 'deep-work',
  cadenceId: 'morning',
  focusStyleId: 'immersion',
};

const STEP_CAPTIONS = {
  intro: {
    category: 'INITIALIZE',
    headline: 'Your Life. One Operating System.',
    subtext: 'A unified digital sanctum fusing deep focus, physical vitality, unyielding discipline, and anti-burnout wellness into character progression.',
  },
  focus: {
    category: 'CALIBRATION 01',
    headline: 'Define Your Core Crucible',
    subtext: 'Every action builds your character. Align your primary domain to calibrate your initial RPG stat progression.',
  },
  cadence: {
    category: 'CALIBRATION 02',
    headline: 'Pace Your Daily Rhythm',
    subtext: 'Align your quests with your natural biological clock to eliminate decision fatigue and build momentum.',
  },
  style: {
    category: 'CALIBRATION 03',
    headline: 'Focus Chamber Presets',
    subtext: 'Deep work sprints regenerate Mana and forge your Willpower attribute with zero external distractions.',
  },
  auth: {
    category: 'ENTRY CODE',
    headline: 'Activate Your Sanctum',
    subtext: 'Your tailored LifeOS configuration is ready for deployment. Create or access your profile to step inside.',
  },
};

/**
 * Master Onboarding & Authentication Experience Page.
 * Implements editorial desktop split + mobile-first full-height composition.
 */
export default function OnboardingPage({ defaultMode = 'onboarding' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  // If user navigates directly to /login, start on step 5 (auth) in 'login' mode
  const isDirectLogin = location.pathname === '/login' || defaultMode === 'login';

  const [currentStepIndex, setCurrentStepIndex] = useState(isDirectLogin ? 5 : 1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [isFinishing, setIsFinishing] = useState(false);

  // Load saved answers or fallback to defaults
  const [answers, setAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ANSWERS_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_ANSWERS;
    } catch {
      return DEFAULT_ANSWERS;
    }
  });

  // Persist answers on change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ANSWERS_KEY, JSON.stringify(answers));
    } catch (err) {
      // storage unavailable or full
    }
  }, [answers]);

  // If already authenticated and not finishing, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && !isFinishing && !authLoading) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isFinishing, authLoading, navigate]);

  const currentStep = ONBOARDING_STEPS[currentStepIndex - 1] || ONBOARDING_STEPS[0];
  const stepInfo = STEP_CAPTIONS[currentStep.id] || STEP_CAPTIONS.intro;

  const goToStep = useCallback((index) => {
    setDirection(index > currentStepIndex ? 1 : -1);
    setCurrentStepIndex(Math.max(1, Math.min(index, TOTAL_STEPS)));
  }, [currentStepIndex]);

  const handleNext = useCallback(() => {
    if (currentStepIndex < TOTAL_STEPS) {
      goToStep(currentStepIndex + 1);
    }
  }, [currentStepIndex, goToStep]);

  const handleBack = useCallback(() => {
    if (currentStepIndex > 1) {
      goToStep(currentStepIndex - 1);
    }
  }, [currentStepIndex, goToStep]);

  const handleSkip = useCallback(() => {
    // Skip directly to Auth / Step 5
    goToStep(5);
  }, [goToStep]);

  const handleJumpToAuth = useCallback(() => {
    goToStep(5);
  }, [goToStep]);

  // Complete onboarding and enter LifeOS
  const handleComplete = useCallback(() => {
    setIsFinishing(true);
    try {
      localStorage.setItem(LOCAL_STORAGE_COMPLETED_KEY, 'true');
    } catch {
      // ignore
    }
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 700);
  }, [navigate]);

  // Keyboard navigation: Enter to continue, Escape to back (when not focused on text input)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tagName = e.target?.tagName?.toLowerCase();
      const isInput = tagName === 'input' || tagName === 'textarea';

      if (e.key === 'Escape' && !isInput && currentStepIndex > 1) {
        handleBack();
      } else if (e.key === 'Enter' && !isInput && currentStepIndex < TOTAL_STEPS) {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStepIndex, handleBack, handleNext]);

  // Motion variants for smooth step sliding
  const slideVariants = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: (dir) => ({
          opacity: 0,
          x: dir > 0 ? 32 : -32,
          filter: 'blur(4px)',
        }),
        animate: {
          opacity: 1,
          x: 0,
          filter: 'blur(0px)',
          transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
        },
        exit: (dir) => ({
          opacity: 0,
          x: dir > 0 ? -32 : 32,
          filter: 'blur(4px)',
          transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
        }),
      };

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#07080C] text-ink overflow-x-hidden flex flex-col justify-between selection:bg-mana selection:text-obsidian">
      {/* ── Background Atmospheric Accents ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Subtle radial ambient glows */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-mana/5 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[160px]" />
        {/* Subtle hair-line grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* ── Exit Transition Overlay ── */}
      <AnimatePresence>
        {isFinishing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 bg-[#07080C] flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="space-y-4 max-w-sm"
            >
              <div className="w-12 h-12 rounded-2xl bg-mana/20 border border-mana/40 mx-auto flex items-center justify-center text-mana">
                <span className="w-4 h-4 rounded-full bg-mana animate-ping" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-ink">
                Initializing LifeOS Sanctum...
              </h2>
              <p className="text-xs text-ink-muted">
                Synthesizing character attributes, focus chamber, and daily action deck.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Container ── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto flex-1 flex flex-col p-4 sm:p-6 lg:p-10">
        {/* Top Progress Bar Component */}
        <OnboardingProgress
          currentStepIndex={currentStepIndex}
          onBack={handleBack}
          onSkip={handleSkip}
          canGoBack={currentStepIndex > 1}
          canSkip={currentStepIndex < TOTAL_STEPS}
        />

        {/* ── Responsive Layout: Desktop Split / Mobile Full-Height ── */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center py-6 sm:py-8 lg:py-12">
          {/* Left Column (Desktop: Editorial Illustration & Storytelling / Mobile: Compact Header Banner) */}
          <div className="lg:col-span-5 flex flex-col justify-center items-center lg:items-start text-center lg:text-left space-y-6">
            {/* Category tag */}
            <div className="hidden lg:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-mana" />
              <span className="text-[10px] font-mono tracking-widest text-ink-muted uppercase">
                {stepInfo.category}
              </span>
            </div>

            {/* Bespoke Editorial Illustration */}
            <div className="w-full max-w-[280px] sm:max-w-[340px] lg:max-w-full aspect-square flex items-center justify-center p-2 sm:p-4 rounded-3xl bg-white/[0.015] border border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <OnboardingIllustration step={currentStep.id} />
            </div>

            {/* Editorial Storytelling Caption (Desktop) */}
            <div className="hidden lg:block space-y-2 max-w-md">
              <h3 className="text-lg font-bold text-ink tracking-tight">
                {stepInfo.headline}
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                {stepInfo.subtext}
              </p>
            </div>
          </div>

          {/* Right Column: Active Step Interactive Container */}
          <div className="lg:col-span-7 flex flex-col justify-center min-h-[460px]">
            <div className="w-full max-w-xl mx-auto lg:mx-0 p-5 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/[0.07] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] relative overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep.id}
                  custom={direction}
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="w-full"
                >
                  {currentStep.id === 'intro' && (
                    <StepIntro
                      onContinue={handleNext}
                      onJumpToAuth={handleJumpToAuth}
                    />
                  )}

                  {currentStep.id === 'focus' && (
                    <StepCoreFocus
                      selectedId={answers.objectiveId}
                      onSelect={(id) => setAnswers((prev) => ({ ...prev, objectiveId: id }))}
                      onContinue={handleNext}
                    />
                  )}

                  {currentStep.id === 'cadence' && (
                    <StepRitualCadence
                      selectedId={answers.cadenceId}
                      onSelect={(id) => setAnswers((prev) => ({ ...prev, cadenceId: id }))}
                      onContinue={handleNext}
                    />
                  )}

                  {currentStep.id === 'style' && (
                    <StepFocusStyle
                      selectedId={answers.focusStyleId}
                      onSelect={(id) => setAnswers((prev) => ({ ...prev, focusStyleId: id }))}
                      onContinue={handleNext}
                    />
                  )}

                  {currentStep.id === 'auth' && (
                    <StepAuth
                      answers={answers}
                      onEditPreferences={() => goToStep(2)}
                      onComplete={handleComplete}
                      initialMode={isDirectLogin ? 'login' : 'register'}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Subdued Minimalist Footer ── */}
        <footer className="w-full pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-ink-muted border-t border-white/[0.04]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
            <span>LifeOS Core v1.4 • Dual-Token Secured</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">Press [Enter] to continue • [Esc] to go back</span>
            <span className="text-ink-faint">Dark Obsidian Architecture</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

OnboardingPage.propTypes = {
  defaultMode: PropTypes.oneOf(['onboarding', 'login']),
};
