import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { OnboardingVideoBackground } from '@/components/onboarding/OnboardingVideoBackground';
import { OnboardingTopBar } from '@/components/onboarding/OnboardingTopBar';
import { OnboardingHero } from '@/components/onboarding/OnboardingHero';

/**
 * Full-screen LifeOS Onboarding Page.
 * Immersive cinematic low-poly world background with iOS-grade glass interface.
 */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/');
    } else {
      setAuthModalOpen(true);
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  const handleSignIn = () => {
    setAuthModalOpen(true);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none">
      <OnboardingVideoBackground>
        {/* Top iOS Navigation Bar */}
        <OnboardingTopBar
          onSkip={handleSkip}
          onSignIn={handleSignIn}
          isAuthenticated={isAuthenticated}
        />

        {/* Center / Lower Hero Action Area */}
        <OnboardingHero onGetStarted={handleGetStarted} />
      </OnboardingVideoBackground>

      {/* Auth Modal Integration */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode="register"
      />
    </main>
  );
}
