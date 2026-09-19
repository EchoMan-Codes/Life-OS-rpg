import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Loader2,
  KeyRound,
} from 'lucide-react';
import clsx from 'clsx';
import { StructuralFrame, StructuralChamber } from '@/components/rpg/StructuralFrame';
import { PasswordMeter } from '@/features/auth/components/PasswordMeter';
import { useAuth } from '@/features/auth/hooks';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * InitiationConsole — Interactive Onboarding Console for LifeOS.
 *
 * Implements the "Enter the Forge" multi-step command interface:
 * - LIFEOS // INITIATION PROTOCOL header
 * - Headline: "Build a life worth leveling up."
 * - Supporting sentence: "LifeOS turns real-world consistency into visible progress."
 * - Step 1: Identity Matrix (Character / Display name)
 * - Step 2: Neural Uplink (Email address)
 * - Step 3: Security Cipher (Passphrase + live zxcvbn meter)
 * - Step 4: Forge Awakening (Dossier review with exact CTA: "GET STARTED")
 * - Mode toggle for existing operators (Sign In)
 * - Strict credentials protection: raw passwords are NEVER stored in storage,
 *   displayed in review, or logged.
 */
export function InitiationConsole({ onInitiationSuccess, className = '' }) {
  const shouldReduceMotion = useReducedMotion();
  const { register, login, isRegistering, isLoggingIn } = useAuth();
  const isSubmitting = isRegistering || isLoggingIn;

  // Mode: 'register' (Initiation Protocol) | 'login' (Operator Access)
  const [mode, setMode] = useState('register');

  // Multi-step progression (1 to 4)
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Form states — stored ONLY in memory (never in localStorage / sessionStorage)
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordValid, setPasswordValid] = useState(false);
  const [passwordScore, setPasswordScore] = useState(0);

  // Sign-in mode credentials
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Selection confirmation pulse animation trigger
  const [confirmPulse, setConfirmPulse] = useState(false);

  // Error state
  const [errorMsg, setErrorMsg] = useState('');

  // Step directional motion
  const [stepDirection, setStepDirection] = useState(1); // 1 = forward, -1 = back

  // Step 1 validation
  const isStep1Valid = displayName.trim().length >= 1 && displayName.trim().length <= 50;

  // Step 2 validation
  const isStep2Valid = EMAIL_REGEX.test(email.trim());

  // Step 3 validation
  const isStep3Valid = passwordValid && password.length >= 8;

  // Trigger brief confirmation pulse
  const triggerPulse = useCallback(() => {
    setConfirmPulse(true);
    const timer = setTimeout(() => setConfirmPulse(false), 350);
    return () => clearTimeout(timer);
  }, []);

  // Handle Forward Navigation
  const handleContinue = useCallback(() => {
    setErrorMsg('');
    if (currentStep === 1 && !isStep1Valid) {
      setErrorMsg('Please designate a valid character name (1–50 characters).');
      return;
    }
    if (currentStep === 2 && !isStep2Valid) {
      setErrorMsg('Please provide a valid transmission email address.');
      return;
    }
    if (currentStep === 3 && !isStep3Valid) {
      setErrorMsg('Please fortify your cipher with at least 8 characters and fair strength.');
      return;
    }

    triggerPulse();
    setStepDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  }, [currentStep, isStep1Valid, isStep2Valid, isStep3Valid, triggerPulse]);

  // Handle Back Navigation
  const handleBack = useCallback(() => {
    setErrorMsg('');
    setStepDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  // PasswordMeter change callback
  const handlePasswordChange = useCallback(({ score, isValid }) => {
    setPasswordScore(score);
    setPasswordValid(isValid);
  }, []);

  // Final CTA Submission Handler: exact "GET STARTED"
  const handleGetStarted = async (e) => {
    e?.preventDefault?.();
    setErrorMsg('');

    if (mode === 'register') {
      if (!isStep1Valid || !isStep2Valid || !isStep3Valid) {
        setErrorMsg('Please complete all protocol requirements before initiating.');
        return;
      }

      try {
        await register({
          displayName: displayName.trim(),
          email: email.trim(),
          password,
        });
        onInitiationSuccess?.();
      } catch (err) {
        let message =
          err?.response?.data?.error?.message ||
          (err?.response?.data?.error?.suggestions?.[0]
            ? `Weak cipher: ${err.response.data.error.suggestions[0]}`
            : null);
        if (!message) {
          if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
            message = 'Neural server connection failed. Please ensure the backend is active on http://localhost:5000.';
          } else {
            message = err?.message || 'Initiation failed. Please check your data and retry.';
          }
        }
        setErrorMsg(message);
      }
    } else {
      // Login mode submit
      if (!loginEmail.trim() || !loginPassword) {
        setErrorMsg('Please enter both transmission email and access cipher.');
        return;
      }

      try {
        await login({
          email: loginEmail.trim(),
          password: loginPassword,
        });
        onInitiationSuccess?.();
      } catch (err) {
        let message = err?.response?.data?.error?.message;
        if (!message) {
          if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
            message = 'Neural server connection failed. Please verify backend connectivity.';
          } else {
            message = err?.message || 'Invalid credentials. Please verify your cipher and retry.';
          }
        }
        setErrorMsg(message);
      }
    }
  };

  // Google OAuth Initiator
  const handleGoogleAuth = () => {
    try {
      sessionStorage.setItem('lifeos_onboarding_return', 'airplaneJourney');
    } catch {
      // sessionStorage unavailable or disabled
    }
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    window.location.href = `${apiBase}/auth/google`;
  };

  // Directional slide animation variants
  const slideVariants = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, x: stepDirection * 24 },
        animate: { opacity: 1, x: 0, transition: { duration: 0.22, ease: 'easeOut' } },
        exit: { opacity: 0, x: -stepDirection * 24, transition: { duration: 0.16, ease: 'easeIn' } },
      };

  return (
    <div className={clsx('w-full max-w-xl mx-auto', className)}>
      <StructuralFrame
        theme="cyan"
        className={clsx(
          'transition-all duration-300',
          confirmPulse && 'ring-2 ring-cyan-400 shadow-[0_0_35px_rgba(56,189,248,0.35)]'
        )}
        innerClassName="p-6 sm:p-8"
      >
        {/* ── 1. Protocol Header Banner ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38BDF8] animate-pulse" />
              <span className="font-mono text-[11px] font-bold tracking-widest text-cyan-400 uppercase">
                LIFEOS // INITIATION PROTOCOL
              </span>
            </div>
            {mode === 'register' && (
              <span className="font-mono text-[10px] font-semibold tracking-wider text-purple-300 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded-xs">
                PHASE 0{currentStep} / 0{totalSteps}
              </span>
            )}
          </div>

          <h1 className="text-display-md sm:text-display-lg text-white font-display font-bold tracking-tight leading-tight">
            {mode === 'register' ? 'Build a life worth leveling up.' : 'Resume Command Protocol'}
          </h1>
          <p className="text-body-sm text-ink-muted mt-1.5 leading-relaxed font-body">
            {mode === 'register'
              ? 'LifeOS turns real-world consistency into visible progress.'
              : 'Enter your verified transmission coordinate and security cipher.'}
          </p>
        </div>

        {/* ── 2. Segmented Energy Progress Meter (Register mode) ── */}
        {mode === 'register' && (
          <div className="mb-6" aria-label={`Step ${currentStep} of ${totalSteps}`}>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((stepIdx) => {
                const isActive = currentStep >= stepIdx;
                const isCurrent = currentStep === stepIdx;
                return (
                  <div key={stepIdx} className="space-y-1">
                    <div
                      className={clsx(
                        'h-1.5 rounded-full transition-all duration-300 overflow-hidden',
                        isActive
                          ? 'bg-cyan-500 shadow-[0_0_10px_rgba(56,189,248,0.5)]'
                          : 'bg-white/10'
                      )}
                    >
                      {isCurrent && !shouldReduceMotion && (
                        <div className="w-full h-full bg-white/40 animate-pulse" />
                      )}
                    </div>
                    <div
                      className={clsx(
                        'font-mono text-[9px] font-semibold uppercase tracking-wider',
                        isCurrent
                          ? 'text-cyan-400'
                          : isActive
                          ? 'text-ink-muted'
                          : 'text-white/20'
                      )}
                    >
                      {stepIdx === 1 && 'Identity'}
                      {stepIdx === 2 && 'Uplink'}
                      {stepIdx === 3 && 'Cipher'}
                      {stepIdx === 4 && 'Awaken'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 3. Error Callout Banner ── */}
        {errorMsg && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-panel bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* ── 4. Form Chambers with Directional Transitions ── */}
        <div className="min-h-[200px]">
          <AnimatePresence mode="wait" custom={stepDirection}>
            {mode === 'register' ? (
              <motion.div key={`step-${currentStep}`} {...slideVariants}>
                {/* ── STEP 1: IDENTITY MATRIX ── */}
                {currentStep === 1 && (
                  <StructuralChamber
                    label="CHAMBER 01 // IDENTITY MATRIX"
                    variant="highlight"
                    className="space-y-4"
                  >
                    <div>
                      <label
                        htmlFor="onboarding-displayName"
                        className="block text-xs font-mono font-medium text-cyan-300 mb-1.5 uppercase tracking-wide"
                      >
                        Character Designation / Hunter Codename
                      </label>
                      <div className="relative">
                        <User
                          size={18}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/70"
                          aria-hidden="true"
                        />
                        <input
                          id="onboarding-displayName"
                          type="text"
                          value={displayName}
                          onChange={(e) => {
                            setDisplayName(e.target.value);
                            setErrorMsg('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && isStep1Valid) {
                              e.preventDefault();
                              handleContinue();
                            }
                          }}
                          placeholder="E.g. Eldrin Shadowwalker"
                          autoFocus
                          required
                          maxLength={50}
                          className={clsx(
                            'w-full pl-11 pr-4 py-3 rounded-panel',
                            'bg-obsidian-900/90 border border-white/15 text-white text-sm font-medium',
                            'min-h-[46px] transition-all',
                            'focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50',
                            'placeholder:text-white/30'
                          )}
                        />
                      </div>
                      <p className="text-[11px] text-ink-muted mt-2">
                        Your canonical identifier across character records, quests, and battle queues.
                      </p>
                    </div>
                  </StructuralChamber>
                )}

                {/* ── STEP 2: NEURAL UPLINK ── */}
                {currentStep === 2 && (
                  <StructuralChamber
                    label="CHAMBER 02 // NEURAL UPLINK"
                    variant="highlight"
                    className="space-y-4"
                  >
                    <div>
                      <label
                        htmlFor="onboarding-email"
                        className="block text-xs font-mono font-medium text-cyan-300 mb-1.5 uppercase tracking-wide"
                      >
                        Primary Transmission Coordinate (Email)
                      </label>
                      <div className="relative">
                        <Mail
                          size={18}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/70"
                          aria-hidden="true"
                        />
                        <input
                          id="onboarding-email"
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setErrorMsg('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && isStep2Valid) {
                              e.preventDefault();
                              handleContinue();
                            }
                          }}
                          placeholder="hunter@lifeos.protocol"
                          autoFocus
                          required
                          className={clsx(
                            'w-full pl-11 pr-4 py-3 rounded-panel',
                            'bg-obsidian-900/90 border border-white/15 text-white text-sm font-medium',
                            'min-h-[46px] transition-all',
                            'focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50',
                            'placeholder:text-white/30'
                          )}
                        />
                      </div>
                      <p className="text-[11px] text-ink-muted mt-2">
                        Used for session restoration, token recovery, and daily ritual summaries.
                      </p>
                    </div>
                  </StructuralChamber>
                )}

                {/* ── STEP 3: SECURITY CIPHER ── */}
                {currentStep === 3 && (
                  <StructuralChamber
                    label="CHAMBER 03 // SECURITY CIPHER"
                    variant="highlight"
                    className="space-y-4"
                  >
                    <div>
                      <label
                        htmlFor="onboarding-password"
                        className="block text-xs font-mono font-medium text-cyan-300 mb-1.5 uppercase tracking-wide"
                      >
                        Master Vault Passphrase (Password)
                      </label>
                      <div className="relative">
                        <Lock
                          size={18}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/70"
                          aria-hidden="true"
                        />
                        <input
                          id="onboarding-password"
                          type="password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setErrorMsg('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && isStep3Valid) {
                              e.preventDefault();
                              handleContinue();
                            }
                          }}
                          placeholder="••••••••••••"
                          autoFocus
                          required
                          className={clsx(
                            'w-full pl-11 pr-4 py-3 rounded-panel',
                            'bg-obsidian-900/90 border border-white/15 text-white text-sm font-medium',
                            'min-h-[46px] transition-all',
                            'focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50',
                            'placeholder:text-white/30'
                          )}
                        />
                      </div>

                      {/* Live Password Strength Meter */}
                      <PasswordMeter
                        password={password}
                        onChange={handlePasswordChange}
                      />
                    </div>
                  </StructuralChamber>
                )}

                {/* ── STEP 4: FORGE AWAKENING & REVIEW DOSSIER ── */}
                {currentStep === 4 && (
                  <StructuralChamber
                    label="CHAMBER 04 // FORGE AWAKENING"
                    variant="highlight"
                    className="space-y-4"
                  >
                    <div className="p-4 rounded-xl bg-obsidian-950/90 border border-cyan-500/30 space-y-3">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="font-mono text-xs text-ink-muted uppercase">Character Designation</span>
                        <span className="font-bold text-sm text-cyan-300">{displayName}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="font-mono text-xs text-ink-muted uppercase">Neural Uplink</span>
                        <span className="font-medium text-sm text-white truncate max-w-[220px]">{email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-ink-muted uppercase">Vault Cipher Status</span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-attr-vitality bg-attr-vitality/10 border border-attr-vitality/30 px-2 py-0.5 rounded-full">
                          <ShieldCheck size={13} />
                          <span>Fortified (Score {passwordScore}/4)</span>
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10 flex items-center gap-2.5 text-xs text-ink-muted">
                      <Sparkles size={16} className="text-purple-400 shrink-0" />
                      <span>
                        Upon initialization, your starting stats (HP 50, Mana 20, Level 1) will be forged automatically.
                      </span>
                    </div>
                  </StructuralChamber>
                )}
              </motion.div>
            ) : (
              /* ── OPERATOR ACCESS (SIGN IN MODE) ── */
              <motion.div key="mode-login" {...slideVariants}>
                <StructuralChamber
                  label="OPERATOR ACCESS // CREDENTIALS"
                  variant="highlight"
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="login-email"
                      className="block text-xs font-mono font-medium text-cyan-300 mb-1.5 uppercase tracking-wide"
                    >
                      Transmission Email
                    </label>
                    <div className="relative">
                      <Mail
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/70"
                        aria-hidden="true"
                      />
                      <input
                        id="login-email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="player@example.com"
                        required
                        className={clsx(
                          'w-full pl-11 pr-4 py-3 rounded-panel',
                          'bg-obsidian-900/90 border border-white/15 text-white text-sm font-medium',
                          'min-h-[46px] focus:outline-none focus:border-cyan-400',
                          'placeholder:text-white/30'
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-mono font-medium text-cyan-300 mb-1.5 uppercase tracking-wide"
                    >
                      Security Cipher
                    </label>
                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/70"
                        aria-hidden="true"
                      />
                      <input
                        id="login-password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className={clsx(
                          'w-full pl-11 pr-4 py-3 rounded-panel',
                          'bg-obsidian-900/90 border border-white/15 text-white text-sm font-medium',
                          'min-h-[46px] focus:outline-none focus:border-cyan-400',
                          'placeholder:text-white/30'
                        )}
                      />
                    </div>
                  </div>
                </StructuralChamber>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 5. Action Controls (Back, Continue, GET STARTED) ── */}
        <div className="mt-8 space-y-3">
          {mode === 'register' ? (
            <div className="flex items-center gap-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className={clsx(
                    'inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-panel',
                    'bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/15',
                    'text-ink-muted hover:text-white text-sm font-medium transition-colors',
                    'min-h-[46px] focus-visible:outline-2 focus-visible:outline-cyan-400'
                  )}
                  aria-label="Previous step"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
              )}

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleContinue}
                  className={clsx(
                    'flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-panel',
                    'bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-obsidian font-bold text-sm tracking-wide',
                    'shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all',
                    'min-h-[46px] focus-visible:outline-2 focus-visible:outline-cyan-300'
                  )}
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                /* PROMINENT FINAL CTA WITH EXACT TEXT: "GET STARTED" */
                <button
                  type="button"
                  onClick={handleGetStarted}
                  disabled={isSubmitting || !isStep1Valid || !isStep2Valid || !isStep3Valid}
                  className={clsx(
                    'flex-1 inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-panel',
                    'bg-linear-to-r from-cyan-500 via-sky-400 to-cyan-500 hover:brightness-110 active:scale-[0.99]',
                    'text-obsidian font-display font-extrabold text-base tracking-wider uppercase',
                    'shadow-[0_0_30px_rgba(56,189,248,0.5),inset_0_1px_1px_rgba(255,255,255,0.6)]',
                    'transition-all duration-200 min-h-[48px]',
                    'focus-visible:outline-2 focus-visible:outline-white',
                    isSubmitting && 'opacity-80 cursor-wait'
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-obsidian" />
                      <span>INITIALIZING FORGE…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} className="text-obsidian" />
                      <span>GET STARTED</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            /* Sign In Mode CTA */
            <button
              type="button"
              onClick={handleGetStarted}
              disabled={isSubmitting}
              className={clsx(
                'w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-panel',
                'bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-obsidian font-bold text-base tracking-wide',
                'shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all min-h-[48px]',
                isSubmitting && 'opacity-80 cursor-wait'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin text-obsidian" />
                  <span>AUTHENTICATING…</span>
                </>
              ) : (
                <>
                  <KeyRound size={18} className="text-obsidian" />
                  <span>RESUME QUEST (SIGN IN)</span>
                </>
              )}
            </button>
          )}

          {/* ── 6. Alternative Quick Google Uplink ── */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleGoogleAuth}
              className={clsx(
                'w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-panel',
                'bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] border border-white/10',
                'text-ink text-xs font-medium min-h-[44px] transition-colors',
                'focus-visible:outline-2 focus-visible:outline-cyan-400'
              )}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="pt-3 border-t border-white/10 text-center text-xs text-ink-muted">
            {mode === 'register' ? (
              <p className="flex items-center justify-center flex-wrap gap-1">
                <span>Existing Operator?</span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className="text-cyan-400 hover:underline font-semibold cursor-pointer min-h-[44px] inline-flex items-center px-2 focus-visible:outline-1 focus-visible:outline-cyan-400"
                >
                  Enter with Cipher
                </button>
              </p>
            ) : (
              <p className="flex items-center justify-center flex-wrap gap-1">
                <span>Need to initialize a character?</span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg('');
                  }}
                  className="text-cyan-400 hover:underline font-semibold cursor-pointer min-h-[44px] inline-flex items-center px-2 focus-visible:outline-1 focus-visible:outline-cyan-400"
                >
                  Initiate Protocol
                </button>
              </p>
            )}
          </div>
        </div>
      </StructuralFrame>
    </div>
  );
}

InitiationConsole.propTypes = {
  onInitiationSuccess: PropTypes.func.isRequired,
  className: PropTypes.string,
};
