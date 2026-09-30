import { useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  Loader2,
  Edit2,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import clsx from 'clsx';

import { useAuth } from '@/features/auth/hooks';
import { PasswordMeter } from '@/features/auth/components/PasswordMeter';
import { generateSystemSynthesis } from '../constants';

/**
 * Step 5: Calibration Synthesis + Minimal Authentication.
 */
export function StepAuth({
  answers,
  onEditPreferences,
  onComplete,
  initialMode = 'register',
}) {
  const [mode, setMode] = useState(initialMode); // 'register' | 'login'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [localError, setLocalError] = useState('');

  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const isSubmitting = isLoggingIn || isRegistering;

  const synthesis = generateSystemSynthesis(answers);

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
              'Cannot reach the server. Please verify the backend is running.';
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
              'Cannot reach the server. Please verify the backend is running.';
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

  return (
    <div className="flex flex-col justify-between h-full space-y-6">
      {/* ── 1. Calibration Dossier Pill & Dynamic Synthesis ── */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-mana animate-pulse" />
            <span className="text-[11px] font-mono tracking-wider text-ink font-semibold uppercase">
              System Calibration Ready
            </span>
          </div>

          <button
            type="button"
            onClick={onEditPreferences}
            className="inline-flex items-center gap-1 text-[11px] font-mono text-ink-muted hover:text-ink transition-colors px-2 py-1 rounded hover:bg-white/5"
          >
            <Edit2 size={11} />
            <span>Edit</span>
          </button>
        </div>

        {/* Synthesis tags */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-mana/15 text-mana font-mono font-bold border border-mana/30">
            {synthesis.archetype}
          </span>
          <span
            className="px-2.5 py-1 rounded-lg font-mono font-bold border"
            style={{
              backgroundColor: `${synthesis.primaryAttributeColor}15`,
              color: synthesis.primaryAttributeColor,
              borderColor: `${synthesis.primaryAttributeColor}30`,
            }}
          >
            {synthesis.primaryAttribute}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white/5 text-ink font-mono border border-white/10">
            {synthesis.cadenceTitle}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white/5 text-ink-muted font-mono border border-white/10">
            {synthesis.focusPreset}
          </span>
        </div>

        <p className="text-xs text-ink-muted leading-relaxed italic border-t border-white/[0.06] pt-2">
          &ldquo;{synthesis.summarySentence}&rdquo;
        </p>
      </div>

      {/* ── 2. Mode Selector (Register vs Login) ── */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setLocalError('');
            }}
            className={clsx(
              'py-2 text-xs font-semibold rounded-lg transition-all',
              mode === 'register'
                ? 'bg-ink text-obsidian shadow-sm'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            Create LifeOS Profile
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setLocalError('');
            }}
            className={clsx(
              'py-2 text-xs font-semibold rounded-lg transition-all',
              mode === 'login'
                ? 'bg-ink text-obsidian shadow-sm'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            Existing Sign In
          </button>
        </div>

        {/* ── 3. Google OAuth Button ── */}
        <motion.button
          type="button"
          onClick={handleGoogleLogin}
          whileHover={{ scale: 1.008 }}
          whileTap={{ scale: 0.99 }}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs sm:text-sm font-medium text-ink transition-all shadow-sm min-h-[44px]"
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
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-white/[0.08]" />
          <span className="absolute bg-[#0b0c13] px-3 text-[11px] font-mono text-ink-muted uppercase tracking-wider">
            or with credentials
          </span>
        </div>

        {/* ── 4. Form ── */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Display Name (Register only) */}
          {mode === 'register' && (
            <div className="space-y-1">
              <label
                htmlFor="onboarding-display-name"
                className="text-[11px] font-medium text-ink-muted uppercase tracking-wider font-mono block"
              >
                Hero Name
              </label>
              <div className="relative">
                <input
                  id="onboarding-display-name"
                  type="text"
                  required
                  placeholder="e.g. Phoenix, Cipher, Aria"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-ink placeholder-ink-faint text-sm focus:border-mana focus:ring-1 focus:ring-mana focus:outline-none transition-all pl-9"
                />
                <User
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label
              htmlFor="onboarding-email"
              className="text-[11px] font-medium text-ink-muted uppercase tracking-wider font-mono block"
            >
              Email Address
            </label>
            <div className="relative">
              <input
                id="onboarding-email"
                type="email"
                required
                autoComplete="email"
                placeholder="operative@lifeos.internal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-ink placeholder-ink-faint text-sm focus:border-mana focus:ring-1 focus:ring-mana focus:outline-none transition-all pl-9"
              />
              <Mail
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label
              htmlFor="onboarding-password"
              className="text-[11px] font-medium text-ink-muted uppercase tracking-wider font-mono block"
            >
              Master Key
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-ink placeholder-ink-faint text-sm focus:border-mana focus:ring-1 focus:ring-mana focus:outline-none transition-all pl-9 pr-9"
              />
              <Lock
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors p-0.5"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {/* Live Password Strength Meter (Register mode) */}
            {mode === 'register' && (
              <PasswordMeter
                password={password}
                onChange={({ isValid }) => setPasswordValid(isValid)}
              />
            )}
          </div>

          {/* Inline Actionable Error State */}
          <AnimatePresence>
            {localError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="p-3 rounded-xl bg-attr-strength/10 border border-attr-strength/30 text-xs text-red-300 flex items-start gap-2.5"
              >
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-attr-strength" />
                <span className="leading-snug">{localError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={!isSubmitting ? { scale: 1.008 } : {}}
            whileTap={!isSubmitting ? { scale: 0.99 } : {}}
            className={clsx(
              'w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all min-h-[46px] shadow-lg mt-2',
              isSubmitting
                ? 'bg-ink/50 text-obsidian/80 cursor-wait'
                : 'bg-ink text-obsidian hover:bg-ink/90 shadow-[0_4px_20px_rgba(255,255,255,0.15)]'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin text-obsidian" />
                <span>
                  {mode === 'register' ? 'Initializing Character...' : 'Authenticating...'}
                </span>
              </>
            ) : (
              <>
                <span>
                  {mode === 'register' ? 'Initialize LifeOS & Enter' : 'Sign In & Enter'}
                </span>
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </form>
      </div>

      {/* Footnote */}
      <p className="text-[10px] text-ink-faint text-center font-mono pt-4 border-t border-white/[0.06]">
        Protected by Argon2/Bcrypt & Dual-Token Rotation. Zero telemetry tracking.
      </p>
    </div>
  );
}

StepAuth.propTypes = {
  answers: PropTypes.shape({
    objectiveId: PropTypes.string,
    cadenceId: PropTypes.string,
    focusStyleId: PropTypes.string,
  }).isRequired,
  onEditPreferences: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  initialMode: PropTypes.oneOf(['register', 'login']),
};
