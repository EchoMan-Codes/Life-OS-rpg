import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { useAuth } from '@/features/auth/hooks';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { OnboardingVideoBackground } from '@/components/onboarding/OnboardingVideoBackground';
import { OnboardingTopBar } from '@/components/onboarding/OnboardingTopBar';
import { OnboardingHero } from '@/components/onboarding/OnboardingHero';
import { OnboardingAirplane } from '@/components/onboarding/OnboardingAirplane';
import { OnboardingFlightEffects } from '@/components/onboarding/OnboardingFlightEffects';
import { OnboardingTransition } from '@/components/onboarding/OnboardingTransition';
import { useOnboardingJourney } from '@/hooks/useOnboardingJourney';
import {
  getFlightPath,
  getReturnPath,
  interpolatePath,
  getFlightDurations,
} from '@/components/onboarding/AirplaneFlightPath';

/**
 * Full-screen LifeOS Onboarding Page.
 * Implements the signature interactive airplane journey:
 * Get Started → arrow transforms into airplane → flies through landscape
 * → transitions into authentication → returns on success → lands in Dashboard.
 */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  // Check if returning from Google OAuth redirect
  const isReturningFromOAuth = searchParams.get('returning') === 'true';

  // Determine starting state machine state
  const initialJourneyState = useMemo(() => {
    return isReturningFromOAuth ? 'returnJourney' : 'idle';
  }, [isReturningFromOAuth]);

  const { state: journeyState, dispatch } = useOnboardingJourney(initialJourneyState);

  // Clean the 'returning' query parameter after consuming it
  useEffect(() => {
    if (isReturningFromOAuth) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('returning');
      setSearchParams(nextParams, { replace: true });
    }
  }, [isReturningFromOAuth, searchParams, setSearchParams]);

  // Auth modal mode
  const [authMode, setAuthMode] = useState('register');

  // Mobile viewport detection
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 640;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Airplane live coordinate state
  const [airplaneState, setAirplaneState] = useState({
    visible: false,
    x: 50,
    y: 85,
    rotation: 0,
    scale: 1,
    opacity: 1,
  });

  // Recorded arrow launch position from OnboardingHero
  const launchPosRef = useRef({ x: 50, y: 85 });
  const rafRef = useRef(null);

  // Cleanup active animation frame on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Handle launch position reported by OnboardingHero
  const handleLaunchPositionReady = useCallback((rect) => {
    if (rect && typeof window !== 'undefined') {
      const x = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
      const y = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
      launchPosRef.current = {
        x: Math.max(10, Math.min(90, x)),
        y: Math.max(10, Math.min(95, y)),
      };
    }
  }, []);

  // ── Step 1: User clicks "Get Started" ──────────────────────────────
  const handleGetStarted = useCallback(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }
    setAuthMode('register');
    dispatch('LAUNCH');
  }, [isAuthenticated, navigate, dispatch]);

  // ── Top Bar Handlers ──────────────────────────────────────────────
  const handleSkip = useCallback(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    } else {
      setAuthMode('login');
      dispatch('SIGN_IN');
    }
  }, [isAuthenticated, navigate, dispatch]);

  const handleSignIn = useCallback(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    } else {
      setAuthMode('login');
      dispatch('SIGN_IN');
    }
  }, [isAuthenticated, navigate, dispatch]);

  // ── Step 2: "launching" state (morphing in button) ────────────────
  useEffect(() => {
    if (journeyState !== 'launching') return;

    if (shouldReduceMotion) {
      const timer = setTimeout(() => {
        dispatch('FLY');
        dispatch('APPROACH');
        dispatch('SHOW_AUTH');
        dispatch('SHOW_AUTH');
      }, 150);
      return () => clearTimeout(timer);
    }

    // Wait ~600ms for arrow morph to complete, then take flight
    const timer = setTimeout(() => {
      dispatch('FLY');
    }, 600);

    return () => clearTimeout(timer);
  }, [journeyState, shouldReduceMotion, dispatch]);

  // ── Step 3: "flying" and "approaching" states (outbound flight) ────
  useEffect(() => {
    if (journeyState !== 'flying') return;

    if (shouldReduceMotion) {
      dispatch('APPROACH');
      dispatch('SHOW_AUTH');
      return;
    }

    const startPos = launchPosRef.current;
    const basePath = getFlightPath(isMobile);
    // Anchor first segment to arrow position
    const path = basePath.map((seg, idx) =>
      idx === 0 ? { ...seg, p0: [startPos.x, startPos.y] } : seg
    );

    const durations = getFlightDurations(isMobile);
    const totalDuration = durations.outbound * 1000;
    const startTime = performance.now();
    let approachDispatched = false;

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);
      const pos = interpolatePath(progress, path, 'outbound');

      setAirplaneState({
        visible: true,
        x: pos.x,
        y: pos.y,
        rotation: pos.rotation,
        scale: pos.scale,
        opacity: 1,
      });

      // Around 65% progress, switch to "approaching" (turns toward foreground)
      if (progress >= 0.65 && !approachDispatched) {
        approachDispatched = true;
        dispatch('APPROACH');
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // Reached foreground
        dispatch('SHOW_AUTH');
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [journeyState, isMobile, shouldReduceMotion, dispatch]);

  // ── Step 4: "authTransition" state (light sweep & backdrop) ──────
  useEffect(() => {
    if (journeyState !== 'authTransition') return;

    // Fade out airplane as auth overlay covers it
    const fadeTimer = setTimeout(() => {
      setAirplaneState((prev) => ({ ...prev, opacity: 0 }));
    }, 0);

    const finishTimer = setTimeout(
      () => {
        setAirplaneState((prev) => ({ ...prev, visible: false }));
        dispatch('SHOW_AUTH');
      },
      shouldReduceMotion ? 100 : 500
    );

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [journeyState, shouldReduceMotion, dispatch]);

  // ── Step 5: Auth success & Google start callbacks ──────────────────
  const handleAuthSuccess = useCallback(() => {
    dispatch('AUTH_SUCCESS');
  }, [dispatch]);

  const handleGoogleAuthStart = useCallback(() => {
    try {
      sessionStorage.setItem('lifeos_onboarding_return', 'airplaneJourney');
    } catch {
      // sessionStorage unavailable or blocked
    }
  }, []);

  const handleAuthClose = useCallback(() => {
    dispatch('AUTH_CANCEL');
    setAirplaneState((prev) => ({ ...prev, visible: false }));
  }, [dispatch]);

  // ── Step 6: "returnJourney" state (airplane returns into horizon) ──
  useEffect(() => {
    if (journeyState !== 'returnJourney') return;

    if (shouldReduceMotion) {
      const timer = setTimeout(() => {
        dispatch('LAND');
        dispatch('ARRIVED');
      }, 300);
      return () => clearTimeout(timer);
    }

    const returnPath = getReturnPath(isMobile);
    const durations = getFlightDurations(isMobile);
    const totalDuration = durations.return * 1000;
    const startTime = performance.now();
    let landDispatched = false;

    const tickReturn = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);
      const pos = interpolatePath(progress, returnPath, 'return');

      setAirplaneState({
        visible: true,
        x: pos.x,
        y: pos.y,
        rotation: pos.rotation,
        scale: pos.scale,
        opacity: progress > 0.9 ? Math.max(0, 1 - (progress - 0.9) * 10) : 1,
      });

      if (progress >= 0.85 && !landDispatched) {
        landDispatched = true;
        dispatch('LAND');
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tickReturn);
      }
    };

    rafRef.current = requestAnimationFrame(tickReturn);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [journeyState, isMobile, shouldReduceMotion, dispatch]);

  // ── Step 7: "landing" state (settle & complete) ────────────────────
  useEffect(() => {
    if (journeyState !== 'landing') return;

    const timer = setTimeout(
      () => {
        setAirplaneState((prev) => ({ ...prev, visible: false }));
        dispatch('ARRIVED');
      },
      shouldReduceMotion ? 150 : 600
    );

    return () => clearTimeout(timer);
  }, [journeyState, shouldReduceMotion, dispatch]);

  // ── Step 8: "complete" state (navigate to dashboard) ──────────────
  useEffect(() => {
    if (journeyState === 'complete') {
      navigate('/', { replace: true });
    }
  }, [journeyState, navigate]);

  const isVideoBlurred = journeyState === 'authTransition' || journeyState === 'authenticating';
  const showFlightEffects =
    airplaneState.visible &&
    (journeyState === 'flying' ||
      journeyState === 'approaching' ||
      journeyState === 'returnJourney');

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none bg-obsidian">
      <OnboardingVideoBackground blurred={isVideoBlurred}>
        {/* Top iOS Navigation Bar */}
        <div
          className={
            journeyState !== 'idle'
              ? 'opacity-0 pointer-events-none transition-opacity duration-300'
              : 'transition-opacity duration-300'
          }
        >
          <OnboardingTopBar
            onSkip={handleSkip}
            onSignIn={handleSignIn}
            isAuthenticated={isAuthenticated}
          />
        </div>

        {/* Center / Lower Hero Action Area */}
        <OnboardingHero
          onGetStarted={handleGetStarted}
          journeyState={journeyState}
          onLaunchPositionReady={handleLaunchPositionReady}
        />
      </OnboardingVideoBackground>

      {/* Signature Airplane Live Layer */}
      <OnboardingAirplane
        visible={airplaneState.visible}
        x={airplaneState.x}
        y={airplaneState.y}
        rotation={airplaneState.rotation}
        scale={airplaneState.scale}
        opacity={airplaneState.opacity}
      />

      {/* Flight Effects: Particle & Light Trail */}
      <OnboardingFlightEffects
        active={showFlightEffects}
        x={airplaneState.x}
        y={airplaneState.y}
        isMobile={isMobile}
      />

      {/* Transition Overlay: Light Sweep & Backdrop */}
      <OnboardingTransition journeyState={journeyState} />

      {/* Glassmorphic Auth Modal */}
      <AuthModal
        isOpen={journeyState === 'authenticating'}
        onClose={handleAuthClose}
        initialMode={authMode}
        onAuthSuccess={handleAuthSuccess}
        onGoogleAuthStart={handleGoogleAuthStart}
      />
    </main>
  );
}
