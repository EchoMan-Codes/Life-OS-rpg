import { useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  Loader2,
  Edit2,
  Eye,
  EyeOff,
} from 'lucide-react';
import clsx from 'clsx';

import { useAuth } from '@/features/auth/hooks';
import { PasswordMeter } from '@/features/auth/components/PasswordMeter';
import { generateSystemSynthesis } from '../constants';
import { JeevanLoader } from '@/components/ui/JeevanLoader';
import { useJeevanTransition } from '@/context/JeevanTransitionContext';
import { API_BASE_URL } from '@/lib/axios';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

/**
 * StepAuth
 * Authentication & Personalization confirmation card.
 * Supports smooth directional transition between Sign In and Sign Up,
 * Google OAuth, email credentials, and password strength validation.
 */
export function StepAuth({
  answers,
  onEditPreferences,
  onComplete,
  initialMode = 'register',
  hideDossier = false,
}) {
  const [mode, setMode] = useState(initialMode); // 'register' | 'login'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [localError, setLocalError] = useState('');

  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const { triggerTransition } = useJeevanTransition();
  const isSubmitting = isLoggingIn || isRegistering;

  const synthesis = answers ? generateSystemSynthesis(answers) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (mode === 'register') {
      if (!displayName.trim()) {
        setLocalError('Please enter a display name for your hero character.');
        return;
      }
      if (!passwordValid) {
        setLocalError(
          'Please choose a stronger password (minimum 8 characters with fair complexity).'
        );
        return;
      }
      try {
        await register({ email, password, displayName: displayName.trim() });
        onComplete();
      } catch (err) {
        let errorMsg =
          err?.response?.data?.error?.message ||
          (err?.response?.data?.error?.suggestions?.[0]
            ? `Weak password: ${err.response.data.error.suggestions[0]}`
            : null);
        if (!errorMsg) {
          if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
            errorMsg =
              'Unable to reach Jeevan server. Please check your network connection.';
          } else {
            errorMsg = err?.message || 'Registration failed. Please check your details.';
          }
        }
        setLocalError(errorMsg);
      }
    } else {
      // Login mode
      try {
        await login({ email, password });
        onComplete();
      } catch (err) {
        let errorMsg = err?.response?.data?.error?.message;
        if (!errorMsg) {
          if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
            errorMsg =
              'Unable to reach Jeevan server. Please check your network connection.';
          } else {
            errorMsg = err?.message || 'Invalid credentials. Please try again.';
          }
        }
        setLocalError(errorMsg);
      }
    }
  };

  const handleGoogleLogin = async () => {
    const googleAuthUrl = `${API_BASE_URL}/auth/google${Capacitor.isNativePlatform() ? '?platform=mobile' : ''}`;
    if (Capacitor.isNativePlatform()) {
      try {
        await Browser.open({ url: googleAuthUrl, windowName: '_blank' });
      } catch {
        window.location.href = googleAuthUrl;
      }
    } else {
      window.location.href = googleAuthUrl;
    }
  };


  return (
    <div className="flex flex-col justify-between h-full space-y-5">
      {/* ── 1. Calibration Dossier Pill (Shown if in onboarding flow) ── */}
      {!hideDossier && synthesis && (
        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md space-y-2.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-mono tracking-wider text-slate-200 font-semibold uppercase">
                System Calibration Ready
              </span>
            </div>

            {onEditPreferences && (
              <button
                type="button"
                onClick={onEditPreferences}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white transition-colors px-2 py-0.5 rounded hover:bg-white/5 cursor-pointer"
              >
                <Edit2 size={11} />
                <span>Edit</span>
              </button>
            )}
          </div>

          {/* Synthesis tags */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="px-2 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-300 font-mono font-bold border border-cyan-500/30">
              {synthesis.archetype}
            </span>
            <span
              className="px-2 py-0.5 rounded-lg font-mono font-bold border"
              style={{
                backgroundColor: `${synthesis.primaryAttributeColor}15`,
                color: synthesis.primaryAttributeColor,
                borderColor: `${synthesis.primaryAttributeColor}30`,
              }}
            >
              {synthesis.primaryAttribute}
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-white/5 text-slate-300 font-mono border border-white/10">
              {synthesis.cadenceTitle}
            </span>
          </div>
        </div>
      )}

      {/* ── 2. Google OAuth Button ── */}
      <motion.button
        type="button"
        onClick={handleGoogleLogin}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-display font-bold text-xs sm:text-sm transition-all shadow-[0_4px_16px_rgba(0,0,0,0.15)] min-h-[46px] cursor-pointer"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
      </motion.button>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-1">
        <div className="w-full border-t border-white/10" />
        <span className="absolute bg-[#0D0B1E] px-3 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          OR
        </span>
      </div>

      {/* ── 3. Email & Password Credentials Form ── */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <AnimatePresence mode="wait">
          {mode === 'register' && (
            <motion.div
              key="register-name"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-1"
            >
              <label
                htmlFor="onboarding-display-name"
                className="text-[11px] font-medium text-slate-300 uppercase tracking-wider font-mono block"
              >
                Hero Name
              </label>
              <div className="relative">
                <input
                  id="onboarding-display-name"
                  type="text"
                  required
                  placeholder="e.g. Rohit, Phoenix, Aria"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 focus:outline-none transition-all pl-9"
                />
                <User
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email */}
        <div className="space-y-1">
          <label
            htmlFor="onboarding-email"
            className="text-[11px] font-medium text-slate-300 uppercase tracking-wider font-mono block"
          >
            Email Address
          </label>
          <div className="relative">
            <input
              id="onboarding-email"
              type="email"
              required
              autoComplete="email"
              placeholder="rohit@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 focus:outline-none transition-all pl-9"
            />
            <Mail
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label
            htmlFor="onboarding-password"
            className="text-[11px] font-medium text-slate-300 uppercase tracking-wider font-mono block"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="onboarding-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 focus:outline-none transition-all pl-9 pr-9"
            />
            <Lock
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-0.5 cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Password strength meter */}
          {mode === 'register' && (
            <PasswordMeter
              password={password}
              onChange={({ isValid }) => setPasswordValid(isValid)}
            />
          )}
        </div>

        {/* Inline Error */}
        <AnimatePresence>
          {localError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5"
            >
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-snug">{localError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary CTA Submit Button */}
        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={!isSubmitting ? { scale: 1.01 } : {}}
          whileTap={!isSubmitting ? { scale: 0.98 } : {}}
          className={clsx(
            'w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold font-display text-sm transition-all min-h-[46px] shadow-lg mt-3 cursor-pointer',
            isSubmitting
              ? 'bg-purple-900/50 text-white/50 cursor-wait'
              : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_4px_24px_rgba(168,85,247,0.35)]'
          )}
        >
          {isSubmitting ? (
            <>
              <JeevanLoader variant="micro" className="text-white" />
              <span>
                {mode === 'register' ? 'Initializing Character...' : 'Authenticating...'}
              </span>
            </>
          ) : (
            <>
              <span>
                {mode === 'register' ? 'Create Account' : 'Sign In'}
              </span>
              <ArrowRight size={16} />
            </>
          )}
        </motion.button>
      </form>

      {/* ── 4. Toggle Mode Link (Sign In ↔ Sign Up) ── */}
      <div className="text-center pt-1">
        {mode === 'register' ? (
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setLocalError('');
            }}
            className="text-xs text-slate-400 hover:text-purple-300 font-medium transition-colors cursor-pointer"
          >
            Already have an account? <span className="text-purple-400 font-semibold underline underline-offset-2">Sign in</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setLocalError('');
            }}
            className="text-xs text-slate-400 hover:text-purple-300 font-medium transition-colors cursor-pointer"
          >
            New here? <span className="text-purple-400 font-semibold underline underline-offset-2">Create an account</span>
          </button>
        )}
      </div>
    </div>
  );
}

StepAuth.propTypes = {
  answers: PropTypes.object,
  onEditPreferences: PropTypes.func,
  onComplete: PropTypes.func.isRequired,
  initialMode: PropTypes.oneOf(['register', 'login']),
  hideDossier: PropTypes.bool,
};
