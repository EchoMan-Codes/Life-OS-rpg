import { Navigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import PropTypes from 'prop-types';

import { useAuth } from '@/features/auth/hooks';

/**
 * Auth gate wrapper for protected routes.
 *
 * - While auth is resolving: shows a branded loading screen
 * - If unauthenticated: redirects to /onboarding
 * - If authenticated: renders children
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Protected content
 */
export function AuthGate({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  // Auth is still resolving (silent refresh in flight)
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-obsidian gap-4">
        <motion.div
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-attr-willpower/30 via-glass to-attr-perception/30 border border-white/20 flex items-center justify-center shadow-glow-willpower"
          animate={
            shouldReduceMotion
              ? {}
              : { y: [0, -6, 0], opacity: [0.7, 1, 0.7] }
          }
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Sparkles className="w-7 h-7 text-attr-perception" />
        </motion.div>
        <p className="text-body-sm text-ink-muted font-display tracking-wide">
          Entering LifeOS…
        </p>
      </div>
    );
  }

  // Not authenticated → onboarding
  if (!isAuthenticated) {
    return <Navigate to="/onboarding" replace />;
  }

  // Authenticated → render protected content
  return children;
}

AuthGate.propTypes = {
  children: PropTypes.node.isRequired,
};
