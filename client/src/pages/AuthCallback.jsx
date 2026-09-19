import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Sparkles, AlertCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

import { refreshToken } from '@/features/auth/api';
import { setAccessToken } from '@/lib/axios';
import { ME_QUERY_KEY } from '@/features/auth/hooks';

/**
 * OAuth Callback Landing Page.
 * Handles the redirect from Google OAuth.
 * Exchanges the HttpOnly refresh cookie for the in-memory access token.
 *
 * Standalone page (no AppShell) to avoid auth race conditions.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const shouldReduceMotion = useReducedMotion();

  const authError = searchParams.get('auth_error');
  const [errorMsg, setErrorMsg] = useState(() => {
    if (!authError) return '';
    return authError === 'google_not_configured'
      ? 'Google sign-in is not available on this server.'
      : 'Google sign-in could not be completed.';
  });

  useEffect(() => {
    if (authError) return;

    async function completeAuth() {
      try {
        const data = await refreshToken();
        setAccessToken(data.accessToken);
        queryClient.setQueryData(ME_QUERY_KEY, data.user);
        // Invalidate dependent queries so dashboard loads fresh data
        queryClient.invalidateQueries({ queryKey: ['character'] });
        queryClient.invalidateQueries({ queryKey: ['habits'] });
        queryClient.invalidateQueries({ queryKey: ['dailies'] });
        queryClient.invalidateQueries({ queryKey: ['quests'] });

        const returnIntent = sessionStorage.getItem('lifeos_onboarding_return');
        if (returnIntent === 'airplaneJourney') {
          sessionStorage.removeItem('lifeos_onboarding_return');
          navigate('/onboarding?returning=true', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } catch (err) {
        console.error('Failed to complete OAuth sign-in:', err);
        setErrorMsg('Sign in couldn\'t be completed. Your session may have expired.');
      }
    }

    completeAuth();
  }, [navigate, queryClient, authError]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-obsidian p-6">
      {!errorMsg ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <motion.div
            className="w-14 h-14 rounded-2xl bg-linear-to-br from-attr-willpower/30 via-glass to-attr-perception/30 border border-white/20 flex items-center justify-center shadow-glow-willpower"
            animate={
              shouldReduceMotion
                ? {}
                : { y: [0, -6, 0], opacity: [0.7, 1, 0.7] }
            }
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="w-7 h-7 text-attr-perception" />
          </motion.div>
          <p className="text-body-sm text-ink-muted font-display tracking-wide">
            Entering LifeOS…
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-attr-strength/15 border border-attr-strength/30 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-attr-strength" />
          </div>
          <div>
            <h2 className="text-display-sm text-ink mb-1">Authentication Error</h2>
            <p className="text-body-sm text-ink-muted">{errorMsg}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
                window.location.href = `${apiBase}/auth/google`;
              }}
              className="px-4 py-2.5 rounded-panel bg-glass hover:bg-glass/80 border border-glass-border text-ink text-sm font-medium min-h-11 transition-colors"
            >
              Try Google Again
            </button>
            <button
              type="button"
              onClick={() => navigate('/onboarding', { replace: true })}
              className="px-4 py-2.5 rounded-panel text-ink-muted hover:text-ink text-sm font-medium min-h-11 transition-colors"
            >
              Back to LifeOS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
