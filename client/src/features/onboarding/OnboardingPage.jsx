import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';

import { useAuth } from '@/features/auth/hooks';
import { ArrowLeft } from 'lucide-react';
import { ModeButton } from '@/components/ui';
import { JeevanLogo } from '@/components/ui/JeevanLogo';
import { TOTAL_STEPS } from './constants';
import { OnboardingBanner } from './components/OnboardingBanner';
import { OnboardingProgress } from './components/OnboardingProgress';
import { Step1Goal } from './components/Step1Goal';
import { Step2LifeAreas } from './components/Step2LifeAreas';
import { Step3Schedule } from './components/Step3Schedule';
import { Step4Challenge } from './components/Step4Challenge';
import { Step5AiHelp } from './components/Step5AiHelp';
import { StepAuth } from './components/StepAuth';
import { IntroCinematic } from './components/IntroCinematic';
import { PostLoginLoader } from './components/PostLoginLoader';
import { RollingSectionCards } from './components/RollingSectionCards';
import { OnboardingErrorBoundary } from './components/OnboardingErrorBoundary';

export const LOCAL_STORAGE_ANSWERS_KEY = 'lifeos_onboarding_answers';
export const LOCAL_STORAGE_COMPLETED_KEY = 'lifeos_onboarding_completed';
export const LOCAL_STORAGE_INTRO_WATCHED_KEY = 'lifeos_intro_watched';
export const LOCAL_STORAGE_SELECTED_SECTION_KEY = 'lifeos_selected_section';

export const ONBOARDING_STAGES = {
  INTRO_CINEMATIC: 'intro_cinematic',   // 10-15s initial cinematic animation
  QUESTIONS: 'questions',               // 5-question personalization flow
  AUTH: 'auth',                         // Account creation & login
  POST_LOGIN_LOADER: 'post_login',      // 10s workspace preparation animation
  ROLLING_SECTIONS: 'rolling_sections', // Continuous looping rolling cards
};

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
 * Ensures saved or incoming onboarding answers are strictly formed.
 */
function sanitizeAnswers(raw) {
  const data = raw && typeof raw === 'object' ? raw : {};
  return {
    goalId: typeof data.goalId === 'string' && data.goalId ? data.goalId : DEFAULT_ANSWERS.goalId,
    goalLabel: typeof data.goalLabel === 'string' && data.goalLabel ? data.goalLabel : DEFAULT_ANSWERS.goalLabel,
    lifeAreas: Array.isArray(data.lifeAreas) && data.lifeAreas.length > 0
      ? data.lifeAreas.filter((x) => typeof x === 'string')
      : [...DEFAULT_ANSWERS.lifeAreas],
    wakeTime: typeof data.wakeTime === 'string' && data.wakeTime ? data.wakeTime : DEFAULT_ANSWERS.wakeTime,
    sleepTime: typeof data.sleepTime === 'string' && data.sleepTime ? data.sleepTime : DEFAULT_ANSWERS.sleepTime,
    commitments: Array.isArray(data.commitments)
      ? data.commitments.filter((x) => typeof x === 'string')
      : [...DEFAULT_ANSWERS.commitments],
    challenges: Array.isArray(data.challenges)
      ? data.challenges.filter((x) => typeof x === 'string')
      : [...DEFAULT_ANSWERS.challenges],
    aiHelp: Array.isArray(data.aiHelp)
      ? data.aiHelp.filter((x) => typeof x === 'string')
      : [...DEFAULT_ANSWERS.aiHelp],
  };
}

/**
 * Complete First-Launch Onboarding, Authentication & Section Selection Orchestrator.
 *
 * Sequence for brand-new users:
 * First Launch -> 10-15s Cinematic Animation -> 5-Question Onboarding ->
 * Account Creation / Login -> 10s Jeevan Preparation Loader ->
 * Looping Rolling Section Cards -> Section Selected -> Selected Section Dashboard
 */
export default function OnboardingPage({ defaultMode = 'onboarding' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading: authLoading, updateOnboarding } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const isDirectLogin = location.pathname === '/login' || defaultMode === 'login';

  // Determine starting stage
  const [stage, setStage] = useState(() => {
    if (isDirectLogin) return ONBOARDING_STAGES.AUTH;

    try {
      const isCompleted = localStorage.getItem(LOCAL_STORAGE_COMPLETED_KEY) === 'true';
      if (isCompleted) return 'completed';

      const hasWatchedIntro = localStorage.getItem(LOCAL_STORAGE_INTRO_WATCHED_KEY) === 'true';
      return hasWatchedIntro ? ONBOARDING_STAGES.QUESTIONS : ONBOARDING_STAGES.INTRO_CINEMATIC;
    } catch {
      return ONBOARDING_STAGES.INTRO_CINEMATIC;
    }
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [direction, setDirection] = useState(1);

  // Load saved answers or fallback to defaults
  const [answers, setAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ANSWERS_KEY);
      return saved ? sanitizeAnswers(JSON.parse(saved)) : DEFAULT_ANSWERS;
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

  // If already completed and user lands here, redirect to dashboard immediately
  useEffect(() => {
    try {
      const isCompleted = localStorage.getItem(LOCAL_STORAGE_COMPLETED_KEY) === 'true' || user?.onboardingCompleted;
      if (isCompleted && !authLoading && !isDirectLogin) {
        navigate('/', { replace: true });
      }
    } catch {
      // ignore
    }
  }, [user, authLoading, isDirectLogin, navigate]);

  // 1. Cinematic Intro Completed -> Advance to 5 Questions
  const handleIntroComplete = useCallback(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_INTRO_WATCHED_KEY, 'true');
    } catch {
      // ignore
    }
    setStage(ONBOARDING_STAGES.QUESTIONS);
  }, []);

  // Question navigation
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
    goToStep(5);
  }, [goToStep]);

  // Step 5 completed -> Save adaptive profile & transition to Account Creation / Login
  const handleCompleteQuestions = useCallback(() => {
    try {
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

    if (isAuthenticated) {
      // Already authenticated -> Proceed straight to 10s post-login animation
      setStage(ONBOARDING_STAGES.POST_LOGIN_LOADER);
    } else {
      // Require user to create account or login
      setStage(ONBOARDING_STAGES.AUTH);
    }
  }, [answers, isAuthenticated]);

  // Auth completed (Register or Login) -> Advance to 10s post-login animation
  const handleAuthComplete = useCallback(() => {
    // If the user already completed section selection prior, navigate to dashboard
    try {
      const isCompleted = localStorage.getItem(LOCAL_STORAGE_COMPLETED_KEY) === 'true' || user?.onboardingCompleted;
      if (isCompleted) {
        navigate('/', { replace: true });
        return;
      }
    } catch {
      // ignore
    }
    setStage(ONBOARDING_STAGES.POST_LOGIN_LOADER);
  }, [user, navigate]);

  // 10s Post-Login Animation completed -> Reveal Looping Rolling Section Cards
  const handlePostLoginComplete = useCallback(() => {
    setStage(ONBOARDING_STAGES.ROLLING_SECTIONS);
  }, []);

  // Section Selected -> Persist & Navigate to chosen section
  const handleSelectSection = useCallback((section) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_COMPLETED_KEY, 'true');
      localStorage.setItem(LOCAL_STORAGE_SELECTED_SECTION_KEY, section.id);

      // Persist to backend if authenticated asynchronously without blocking navigation
      if (updateOnboarding) {
        updateOnboarding({
          onboardingCompleted: true,
          onboardingAnswers: answers,
          selectedSection: section.id,
        }).catch((err) => console.warn('Failed to sync onboarding to backend:', err));
      }
    } catch (err) {
      console.warn('Failed to save onboarding state:', err);
    }

    // Immediately navigate into selected section (Habits & Study -> '/')
    navigate(section.route || '/', { replace: true });
  }, [answers, updateOnboarding, navigate]);

  // Motion variants for step slide transitions
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

  // ─────────────────────────────────────────────────────────
  // STAGE 1: 10-15s INITIAL CINEMATIC ANIMATION
  // ─────────────────────────────────────────────────────────
  if (stage === ONBOARDING_STAGES.INTRO_CINEMATIC) {
    return <IntroCinematic onComplete={handleIntroComplete} />;
  }

  // ─────────────────────────────────────────────────────────
  // STAGE 4: 10s POST-LOGIN PREPARATION ANIMATION
  // ─────────────────────────────────────────────────────────
  if (stage === ONBOARDING_STAGES.POST_LOGIN_LOADER) {
    return <PostLoginLoader onComplete={handlePostLoginComplete} />;
  }

  // ─────────────────────────────────────────────────────────
  // STAGE 5: LOOPING ROLLING SECTION CARDS REVEAL
  // ─────────────────────────────────────────────────────────
  if (stage === ONBOARDING_STAGES.ROLLING_SECTIONS) {
    return <RollingSectionCards onSelectSection={handleSelectSection} />;
  }

  // ─────────────────────────────────────────────────────────
  // STAGE 3: ACCOUNT CREATION & LOGIN (StepAuth)
  // ─────────────────────────────────────────────────────────
  if (stage === ONBOARDING_STAGES.AUTH) {
    return (
      <div className="min-h-screen bg-[#07080C] text-ink flex flex-col justify-between selection:bg-purple-600 selection:text-white relative overflow-hidden">
        {/* Ambient atmospheric lighting */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px]" />
          <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px]" />
          <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-[160px]" />
        </div>

        {/* Top Navigation Bar */}
        <div className="relative z-20 w-full max-w-md mx-auto px-4 pt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (location.pathname === '/login') {
                navigate('/');
              } else {
                setStage(ONBOARDING_STAGES.QUESTIONS);
              }
            }}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-300 flex items-center justify-center transition-all cursor-pointer"
            title="Return"
          >
            <ArrowLeft size={16} />
          </button>

          <ModeButton compact />
        </div>

        {/* Main Content Container */}
        <div className="relative z-10 w-full max-w-md mx-auto px-4 py-3 flex-1 flex flex-col justify-center">
          {/* Hero Atmospheric Banner Illustration */}
          <div className="w-full h-40 sm:h-48 rounded-t-3xl overflow-hidden relative shadow-lg border-t border-x border-purple-500/30 bg-gradient-to-b from-[#1E0A3C] via-[#3B0764] to-[#0A071E]">
            <svg viewBox="0 0 360 170" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="authSky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E0A3C" />
                  <stop offset="45%" stopColor="#4A154B" />
                  <stop offset="75%" stopColor="#9333EA" />
                  <stop offset="90%" stopColor="#F472B6" />
                  <stop offset="100%" stopColor="#FEF08A" />
                </linearGradient>
              </defs>
              <rect width="360" height="170" fill="url(#authSky)" />
              <circle cx="260" cy="55" r="22" fill="#FEF08A" opacity="0.85" filter="drop-shadow(0 0 16px #F59E0B)" />
              <circle cx="35" cy="25" r="1.1" fill="#FFFFFF" opacity="0.8" />
              <circle cx="85" cy="40" r="1" fill="#FFFFFF" opacity="0.7" />
              <circle cx="150" cy="20" r="1.4" fill="#FDE047" opacity="0.85" />
              <circle cx="320" cy="35" r="1.1" fill="#FFFFFF" opacity="0.75" />
              <path d="M0 170 L0 115 L60 80 L130 115 L200 65 L280 120 L360 85 L360 170 Z" fill="#2E1065" opacity="0.7" />
              <path d="M0 170 L0 135 L80 100 L160 130 L240 85 L320 125 L360 110 L360 170 Z" fill="#1A0738" opacity="0.85" />
              <path d="M0 170 L0 90 L85 105 L115 170 Z" fill="#0D041C" />
              <circle cx="58" cy="80" r="4.5" fill="#0D041C" stroke="#FEF08A" strokeWidth="0.8" />
              <path d="M53 85 L63 85 L65 104 L51 104 Z" fill="#0D041C" stroke="#C084FC" strokeWidth="0.5" />
              <rect x="49" y="86" width="3.5" height="8" rx="1.5" fill="#0D041C" stroke="#FEF08A" strokeWidth="0.6" />
              <path d="M0 145 C110 125, 220 165, 360 140 L360 170 L0 170 Z" fill="#0D0B1E" />
            </svg>
          </div>

          {/* Lower Authentication Panel */}
          <div className="p-5 sm:p-7 rounded-b-3xl bg-[#0D0B1E] border-b border-x border-white/10 backdrop-blur-2xl shadow-2xl relative space-y-4">
            <div className="text-center space-y-1.5">
              <div className="flex justify-center">
                <JeevanLogo variant="lockup" size="md" showTagline />
              </div>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {isDirectLogin
                  ? 'Sign in to access your character, quests, and daily progress.'
                  : 'Save your profile to preserve your attributes and personal workspace.'}
              </p>
            </div>

            {/* StepAuth Component */}
            <StepAuth
              answers={answers}
              onEditPreferences={() => setStage(ONBOARDING_STAGES.QUESTIONS)}
              onComplete={handleAuthComplete}
              initialMode={isDirectLogin ? 'login' : 'register'}
              hideDossier={isDirectLogin}
            />
          </div>
        </div>

        {/* Motivational Footer */}
        <div className="relative z-20 py-4 text-center">
          <p className="text-[11px] font-mono text-slate-500">
            &ldquo;Disciplined today. A better tomorrow.&rdquo;
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // STAGE 2: 5-QUESTION ONBOARDING EXPERIENCE
  // ─────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-[100dvh] w-full bg-[#07080C] text-ink overflow-x-hidden flex flex-col justify-between selection:bg-purple-600 selection:text-white">
      {/* Background Atmospheric Accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-[160px]" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-lg mx-auto flex-1 flex flex-col p-4 sm:p-6 pb-10">
        {/* Onboarding Editorial Progress: 01 / 05 */}
        <OnboardingProgress
          currentStepIndex={currentStepIndex}
          onBack={handleBack}
          onSkip={handleSkip}
          canGoBack={currentStepIndex > 1}
          canSkip={currentStepIndex < TOTAL_STEPS}
        />

        {/* Atmospheric Scene Banner Artwork */}
        <div className="my-3">
          <OnboardingBanner stepIndex={currentStepIndex} />
        </div>

        {/* Active Step Question Card Container */}
        <div className="p-4 sm:p-6 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.06)] relative overflow-hidden flex-1 flex flex-col justify-between">
          <OnboardingErrorBoundary onReset={() => setAnswers(DEFAULT_ANSWERS)}>
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
                    selectedGoal={answers?.goalId}
                    onSelect={(id, label) =>
                      setAnswers((prev) => ({ ...prev, goalId: id, goalLabel: label }))
                    }
                    onNext={handleNext}
                    onSkip={handleSkip}
                  />
                )}

                {currentStepIndex === 2 && (
                  <Step2LifeAreas
                    selectedAreas={answers?.lifeAreas}
                    onToggle={(id) =>
                      setAnswers((prev) => {
                        const currentAreas = Array.isArray(prev?.lifeAreas) ? prev.lifeAreas : [];
                        const exists = currentAreas.includes(id);
                        return {
                          ...prev,
                          lifeAreas: exists
                            ? currentAreas.filter((a) => a !== id)
                            : [...currentAreas, id],
                        };
                      })
                    }
                    onNext={handleNext}
                    onBack={handleBack}
                  />
                )}

                {currentStepIndex === 3 && (
                  <Step3Schedule
                    wakeTime={answers?.wakeTime}
                    sleepTime={answers?.sleepTime}
                    commitments={answers?.commitments}
                    onUpdateWake={(val) =>
                      setAnswers((prev) => ({ ...prev, wakeTime: val || '06:00 AM' }))
                    }
                    onUpdateSleep={(val) =>
                      setAnswers((prev) => ({ ...prev, sleepTime: val || '11:15 PM' }))
                    }
                    onAddCommitment={(item) =>
                      setAnswers((prev) => {
                        const list = Array.isArray(prev?.commitments) ? prev.commitments : [];
                        return {
                          ...prev,
                          commitments: [...list, item],
                        };
                      })
                    }
                    onRemoveCommitment={(index) =>
                      setAnswers((prev) => {
                        const list = Array.isArray(prev?.commitments) ? prev.commitments : [];
                        return {
                          ...prev,
                          commitments: list.filter((_, i) => i !== index),
                        };
                      })
                    }
                    onNext={handleNext}
                    onBack={handleBack}
                  />
                )}

                {currentStepIndex === 4 && (
                  <Step4Challenge
                    selectedChallenges={answers?.challenges}
                    onToggle={(id) =>
                      setAnswers((prev) => {
                        const currentChallenges = Array.isArray(prev?.challenges) ? prev.challenges : [];
                        const exists = currentChallenges.includes(id);
                        return {
                          ...prev,
                          challenges: exists
                            ? currentChallenges.filter((c) => c !== id)
                            : [...currentChallenges, id],
                        };
                      })
                    }
                    onNext={handleNext}
                    onBack={handleBack}
                  />
                )}

                {currentStepIndex === 5 && (
                  <Step5AiHelp
                    selectedAiHelp={answers?.aiHelp}
                    onToggle={(id) =>
                      setAnswers((prev) => {
                        const currentAiHelp = Array.isArray(prev?.aiHelp) ? prev.aiHelp : [];
                        const exists = currentAiHelp.includes(id);
                        return {
                          ...prev,
                          aiHelp: exists
                            ? currentAiHelp.filter((a) => a !== id)
                            : [...currentAiHelp, id],
                        };
                      })
                    }
                    onComplete={handleCompleteQuestions}
                    onBack={handleBack}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </OnboardingErrorBoundary>
        </div>

        {/* Subdued Footer */}
        <div className="pt-3 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>Jeevan Adaptive Engine</span>
          <button
            type="button"
            onClick={() => setStage(ONBOARDING_STAGES.AUTH)}
            className="hover:text-purple-400 transition-colors cursor-pointer"
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
