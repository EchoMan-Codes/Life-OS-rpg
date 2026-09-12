import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import { X, Sparkles, Shield, Mail, Lock, User, AlertCircle } from 'lucide-react';

import { modalPanel, pressable } from '@/lib/motionVariants';
import { Button, Card, Badge } from '@/components/ui';
import { useAuth } from '../hooks';
import { PasswordMeter } from './PasswordMeter';

/**
 * Split-screen glassmorphic authentication modal.
 *
 * Left panel: Form with animated crossfade between Login and Register modes.
 * Right panel: RPG portal illustration & lore panel (hidden below md).
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {() => void} props.onClose - Called to dismiss the modal
 * @param {'login'|'register'} [props.initialMode='login'] - Initial mode
 */
export function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const shouldReduceMotion = useReducedMotion();
  const [mode, setMode] = useState(initialMode);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [passwordValid, setPasswordValid] = useState(false);
  const [localError, setLocalError] = useState('');

  // Reset form state during render when modal opens
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setMode(initialMode);
      setLocalError('');
    }
  }

  const modalRef = useRef(null);
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const isSubmitting = isLoggingIn || isRegistering;

  // Manage body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key handler
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus();
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (mode === 'register') {
      if (!displayName.trim()) {
        setLocalError('Please enter a display name.');
        return;
      }
      if (!passwordValid) {
        setLocalError('Please choose a stronger password (minimum 8 characters and score of 2+).');
        return;
      }
      try {
        await register({ email, password, displayName });
        onClose();
      } catch (err) {
        let errorMsg =
          err?.response?.data?.error?.message ||
          (err?.response?.data?.error?.suggestions?.[0] ? `Weak password: ${err.response.data.error.suggestions[0]}` : null);
        if (!errorMsg) {
          if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
            errorMsg = 'Cannot connect to server. Please verify the backend is running on http://localhost:5000.';
          } else {
            errorMsg = err?.message || 'Registration failed. Please try again.';
          }
        }
        setLocalError(errorMsg);
      }
    } else {
      try {
        await login({ email, password });
        onClose();
      } catch (err) {
        let errorMsg = err?.response?.data?.error?.message;
        if (!errorMsg) {
          if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
            errorMsg = 'Cannot connect to server. Please verify the backend is running on http://localhost:5000.';
          } else {
            errorMsg = err?.message || 'Invalid credentials. Please try again.';
          }
        }
        setLocalError(errorMsg);
      }
    }
  };

  const handleGoogleLogin = () => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    window.location.href = `${apiBase}/auth/google`;
  };

  const formVariants = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, x: mode === 'login' ? -16 : 16 },
        animate: { opacity: 1, x: 0, transition: { duration: 0.18, ease: 'easeOut' } },
        exit: { opacity: 0, x: mode === 'login' ? 16 : -16, transition: { duration: 0.12 } },
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-obsidian/80 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />

          {/* Modal Container */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className="relative z-10 w-full max-w-3xl focus:outline-none"
            {...(shouldReduceMotion
              ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
              : modalPanel)}
          >
            <Card
              variant="hud"
              className={clsx(
                'relative overflow-hidden',
                'border border-glass-border',
                'shadow-glow'
              )}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                aria-label="Close modal"
                className={clsx(
                  'absolute top-4 right-4 z-20',
                  'flex items-center justify-center w-8 h-8 rounded-full',
                  'text-ink-muted hover:text-ink hover:bg-white/10',
                  'transition-colors duration-150',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glass-border'
                )}
              >
                <X size={18} />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* ── Left Half: Form Panel ── */}
                <div className="p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Shield className="w-5 h-5 text-attr-perception" />
                        <span className="text-xs font-semibold tracking-wide text-attr-perception">
                          AUTHENTICATION
                        </span>
                      </div>
                      <h2 className="text-display-sm text-ink">
                        {mode === 'login' ? 'Welcome Back' : 'Begin Your Journey'}
                      </h2>
                      <p className="text-body-sm text-ink-muted mt-1">
                        {mode === 'login'
                          ? 'Enter your credentials to resume your quest.'
                          : 'Create an account to forge your character.'}
                      </p>
                    </div>

                    {/* Google OAuth Button */}
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className={clsx(
                        'w-full flex items-center justify-center gap-3',
                        'py-2.5 px-4 rounded-panel',
                        'bg-white/5 hover:bg-white/10 border border-glass-border',
                        'text-ink text-sm font-medium',
                        'min-h-[44px]',
                        'transition-colors duration-150',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glass-border'
                      )}
                      {...(shouldReduceMotion ? {} : pressable)}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                      Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="flex items-center my-5">
                      <div className="flex-1 border-t border-glass-border" />
                      <span className="px-3 text-xs text-ink-muted">or continue with email</span>
                      <div className="flex-1 border-t border-glass-border" />
                    </div>

                    {/* Error Notice */}
                    {localError && (
                      <div className="mb-4 p-3 rounded-panel bg-attr-strength/15 border border-attr-strength/30 text-attr-strength text-xs flex items-start gap-2">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{localError}</span>
                      </div>
                    )}

                    {/* Form Section with AnimatePresence mode="wait" */}
                    <AnimatePresence mode="wait">
                      <motion.form
                        key={mode}
                        onSubmit={handleSubmit}
                        className="space-y-4"
                        {...formVariants}
                      >
                        {mode === 'register' && (
                          <div>
                            <label className="block text-xs font-medium text-ink-muted mb-1.5">
                              Character / Display name
                            </label>
                            <div className="relative">
                              <User
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
                              />
                              <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="E.g. Eldrin Stormcaller"
                                required
                                className={clsx(
                                  'w-full pl-10 pr-4 py-2.5 rounded-panel',
                                  'bg-obsidian-900/90 border border-glass-border text-ink text-sm',
                                  'min-h-[44px]',
                                  'focus:outline-none focus:border-attr-perception/60'
                                )}
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-medium text-ink-muted mb-1.5">
                            Email address
                          </label>
                          <div className="relative">
                            <Mail
                              size={18}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
                            />
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="player@example.com"
                              required
                              className={clsx(
                                'w-full pl-10 pr-4 py-2.5 rounded-panel',
                                'bg-obsidian-900/90 border border-glass-border text-ink text-sm',
                                'min-h-[44px]',
                                'focus:outline-none focus:border-attr-perception/60'
                              )}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-ink-muted mb-1.5">
                            Password
                          </label>
                          <div className="relative">
                            <Lock
                              size={18}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
                            />
                            <input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              required
                              className={clsx(
                                'w-full pl-10 pr-4 py-2.5 rounded-panel',
                                'bg-obsidian-900/90 border border-glass-border text-ink text-sm',
                                'min-h-[44px]',
                                'focus:outline-none focus:border-attr-perception/60'
                              )}
                            />
                          </div>

                          {/* Live Password Strength Meter only on registration */}
                          {mode === 'register' && (
                            <PasswordMeter
                              password={password}
                              onChange={({ isValid }) => setPasswordValid(isValid)}
                            />
                          )}
                        </div>

                        <Button
                          type="submit"
                          variant="primary"
                          disabled={isSubmitting || (mode === 'register' && !passwordValid)}
                          className="w-full mt-2"
                        >
                          {isSubmitting
                            ? 'Processing...'
                            : mode === 'login'
                            ? 'Sign In'
                            : 'Create Account'}
                        </Button>
                      </motion.form>
                    </AnimatePresence>
                  </div>

                  {/* Mode Toggle Footer */}
                  <div className="mt-6 pt-4 border-t border-glass-border text-center text-xs text-ink-muted">
                    {mode === 'login' ? (
                      <p>
                        Don’t have a character yet?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setMode('register');
                            setLocalError('');
                          }}
                          className="text-attr-perception hover:underline font-medium ml-1"
                        >
                          Register now
                        </button>
                      </p>
                    ) : (
                      <p>
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setMode('login');
                            setLocalError('');
                          }}
                          className="text-attr-perception hover:underline font-medium ml-1"
                        >
                          Sign in
                        </button>
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Right Half: RPG Fantasy Portal Panel (Desktop only) ── */}
                <div
                  className={clsx(
                    'hidden md:flex flex-col justify-between p-8',
                    'bg-gradient-to-br from-obsidian-800 via-obsidian-900 to-obsidian',
                    'border-l border-glass-border relative overflow-hidden'
                  )}
                >
                  {/* Ambient glowing radial effects */}
                  <div className="absolute -top-20 -right-20 w-60 h-60 bg-attr-willpower/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-attr-perception/15 rounded-full blur-3xl pointer-events-none" />

                  {/* Top status chips */}
                  <div className="relative z-10 flex items-center gap-2">
                    <Badge color="hp">HP 100</Badge>
                    <Badge color="mana">MANA 50</Badge>
                    <Badge color="gold">GOLD 120</Badge>
                  </div>

                  {/* Central RPG Visual Motif */}
                  <div className="relative z-10 my-auto py-8 text-center">
                    <motion.div
                      className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-attr-willpower/30 via-glass to-attr-perception/30 border border-white/20 flex items-center justify-center shadow-glow-willpower"
                      animate={
                        shouldReduceMotion
                          ? {}
                          : {
                              y: [0, -6, 0],
                            }
                      }
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <Sparkles className="w-10 h-10 text-attr-perception" />
                    </motion.div>

                    <h3 className="text-display-sm text-ink mb-2">Turn Life into an RPG</h3>
                    <p className="text-body-sm text-ink-muted max-w-xs mx-auto">
                      Build daily habits, defeat tasks, level up attributes, and redeem gold in the reward shop.
                    </p>
                  </div>

                  {/* Bottom quote */}
                  <div className="relative z-10 p-3 rounded-panel bg-white/5 border border-glass-border">
                    <p className="text-[12px] italic text-ink-muted">
                      “Every completed daily quest fuels your legend.”
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
