import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';

import { useAuth } from '@/features/auth/hooks';
import { TOTAL_STEPS } from './constants';
import { OnboardingBanner } from './components/OnboardingBanner';
import { Step1Goal } from './components/Step1Goal';
import { Step2LifeAreas } from './components/Step2LifeAreas';
import { Step3Schedule } from './components/Step3Schedule';
import { Step4Challenge } from './components/Step4Challenge';
import { Step5AiHelp } from './components/Step5AiHelp';
import { SetupTransitionScreen } from './components/SetupTransitionScreen';
import { StepAuth } from './components/StepAuth';
import { spring } from '@/lib/motionVariants';

const LOCAL_STORAGE_ANSWERS_KEY = 'lifeos_onboarding_answers';
export const LOCAL_STORAGE_COMPLETED_KEY = 'lifeos_onboarding_completed';

const DEFAULT_ANSWERS = {
  goalId: 'crack-gate',
  goalLabel: 'Crack GATE',
  lifeAreas: ['study', 'fitness', 'habits'],
  wakeTime: '06:00 AM',
  sleepTime: '11:15 PM',
  commitments: ['College (10:45 AM - 5:30 PM)', 'Exercise', 'Study'],
  challenges: ['procrastination', 'inconsistent'],
  aiHelp: ['plan-day', 'quests-tasks', 'track-progress'],
};

/**
 * Master Onboarding Flow (5-Step Adaptive Personalization).
 * Exact flow: Goal -> Life Areas -> Schedule -> Problem -> AI Preferences
 * Displays scenic atmospheric banners, 1-to-5 number pills, and progressive setup animation.
 */
export default function OnboardingPage({ defaultMode = 'onboarding' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const isDirectLogin = location.pathname === '/login' || defaultMode === 'login';

  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [showAuthDirect, setShowAuthDirect] = useState(isDirectLogin);

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
    } catch {
      // storage unavailable
    }
  }, [answers]);

  // If already authenticated and not in setup, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && !isSettingUp && !authLoading && isDirectLogin) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isSettingUp, authLoading, isDirectLogin, navigate]);

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
    // Skip to step 5 or finish
    goToStep(5);
  }, [goToStep]);

  // When Step 5 completes: trigger setup transition
  const handleCompleteFlow = useCallback(() => {
    // Generate adaptive profile in localStorage
    try {
      localStorage.setItem(LOCAL_STORAGE_COMPLETED_KEY, 'true');
      localStorage.setItem(
        'lifeos_adaptive_profile',
        JSON.stringify({
          primaryGoal: answers.goalLabel,
          enabledAreas: answers.lifeAreas,
          schedule: { wake: answers.wakeTime, sleep: answers.sleepTime, commitments: answers.commitments },
          challenges: answers.challenges,
          aiPreferences: answers.aiHelp,
          initializedAt: new Date().toISOString(),
        })
      );
    } catch {
      // storage full
    }
    setIsSettingUp(true);
  }, [answers]);

  const handleFinishSetup = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);

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
          x: dir > 0 ? 28 : -28,
          filter: 'blur(3px)',
        }),
        animate: {
          opacity: 1,
          x: 0,
          filter: 'blur(0px)',
          transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
        },
        exit: (dir) => ({
          opacity: 0,
          x: dir > 0 ? -28 : 28,
          filter: 'blur(3px)',
          transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
        }),
      };

  // If directly in Login mode
  if (showAuthDirect) {
    return (
      <div className="min-h-screen bg-[#07080C] text-ink flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
            <h2 className="text-xl font-bold font-display text-white">Sign In to LifeOS</h2>
            <button
              onClick={() => setShowAuthDirect(false)}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
            >
              Start Personalization
            </button>
          </div>
          <StepAuth
            answers={answers}
            onEditPreferences={() => setShowAuthDirect(false)}
            onComplete={() => navigate('/', { replace: true })}
            initialMode="login"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#07080C] text-ink overflow-x-hidden flex flex-col justify-between selection:bg-purple-600 selection:text-white">
      {/* ── Background Atmospheric Accents ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-[160px]" />
      </div>

      {/* ── Setup Animated Transition Overlay ── */}
      <AnimatePresence>
        {isSettingUp && (
          <SetupTransitionScreen onFinish={handleFinishSetup} />
        )}
      </AnimatePresence>

      {/* ── Main Container ── */}
      <div className="relative z-10 w-full max-w-lg mx-auto flex-1 flex flex-col p-4 sm:p-6 pb-12">
        {/* ── Top Step Number Indicator (1 to 5 matching Image 3) ── */}
        <div className="flex items-center justify-center gap-3 pt-2 pb-4">
          {[1, 2, 3, 4, 5].map((stepNum) => {
            const isActive = stepNum === currentStepIndex;
            const isCompleted = stepNum < currentStepIndex;

            return (
              <div key={stepNum} className="flex items-center gap-2">
                <div
                  className={clsx(
                    'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all duration-200',
                    isActive
                      ? 'bg-purple-600 text-white shadow-[0_0_14px_rgba(168,85,247,0.5)] scale-110 ring-2 ring-purple-400'
                      : isCompleted
                      ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40'
                      : 'bg-white/5 text-slate-500 border border-white/10'
                  )}
                >
                  {stepNum}
                </div>
                {stepNum < 5 && (
                  <div
                    className={clsx(
                      'w-3 sm:w-5 h-[2px] rounded-full transition-colors',
                      stepNum < currentStepIndex ? 'bg-purple-500/60' : 'bg-white/10'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Atmospheric Scene Banner Artwork (Matching Image 3) ── */}
        <div className="mb-4">
          <OnboardingBanner stepIndex={currentStepIndex} />
        </div>

        {/* ── Active Step Card Container ── */}
        <div className="p-4 sm:p-6 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.06)] relative overflow-hidden flex-1 flex flex-col justify-between">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStepIndex}
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full flex-1 flex flex-col justify-between"
            >
              {currentStepIndex === 1 && (
                <Step1Goal
                  selectedGoal={answers.goalId}
                  onSelect={(id, label) =>
                    setAnswers((prev) => ({ ...prev, goalId: id, goalLabel: label }))
                  }
                  onNext={handleNext}
                  onSkip={handleSkip}
                />
              )}

              {currentStepIndex === 2 && (
                <Step2LifeAreas
                  selectedAreas={answers.lifeAreas}
                  onToggle={(id) =>
                    setAnswers((prev) => {
                      const exists = prev.lifeAreas.includes(id);
                      return {
                        ...prev,
                        lifeAreas: exists
                          ? prev.lifeAreas.filter((a) => a !== id)
                          : [...prev.lifeAreas, id],
                      };
                    })
                  }
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}

              {currentStepIndex === 3 && (
                <Step3Schedule
                  wakeTime={answers.wakeTime}
                  sleepTime={answers.sleepTime}
                  commitments={answers.commitments}
                  onUpdateWake={(val) =>
                    setAnswers((prev) => ({ ...prev, wakeTime: val }))
                  }
                  onUpdateSleep={(val) =>
                    setAnswers((prev) => ({ ...prev, sleepTime: val }))
                  }
                  onAddCommitment={(item) =>
                    setAnswers((prev) => ({
                      ...prev,
                      commitments: [...prev.commitments, item],
                    }))
                  }
                  onRemoveCommitment={(index) =>
                    setAnswers((prev) => ({
                      ...prev,
                      commitments: prev.commitments.filter((_, i) => i !== index),
                    }))
                  }
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}

              {currentStepIndex === 4 && (
                <Step4Challenge
                  selectedChallenges={answers.challenges}
                  onToggle={(id) =>
                    setAnswers((prev) => {
                      const exists = prev.challenges.includes(id);
                      return {
                        ...prev,
                        challenges: exists
                          ? prev.challenges.filter((c) => c !== id)
                          : [...prev.challenges, id],
                      };
                    })
                  }
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}

              {currentStepIndex === 5 && (
                <Step5AiHelp
                  selectedAiHelp={answers.aiHelp}
                  onToggle={(id) =>
                    setAnswers((prev) => {
                      const exists = prev.aiHelp.includes(id);
                      return {
                        ...prev,
                        aiHelp: exists
                          ? prev.aiHelp.filter((a) => a !== id)
                          : [...prev.aiHelp, id],
                      };
                    })
                  }
                  onComplete={handleCompleteFlow}
                  onBack={handleBack}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Subdued Minimalist Footer ── */}
        <div className="pt-4 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>LifeOS Adaptive Engine</span>
          <button
            type="button"
            onClick={() => setShowAuthDirect(true)}
            className="hover:text-purple-400 transition-colors"
          >
            Existing account? Sign in
          </button>
        </div>
      </div>
    </div>
  );
}

OnboardingPage.propTypes = {
  defaultMode: PropTypes.oneOf(['onboarding', 'login']),
};
