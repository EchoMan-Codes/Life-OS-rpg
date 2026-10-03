import { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

import { AppShell } from '@/components/layout';
import { initNativeApp, initNativeStatusBar } from '@/lib/native';
import { useAuth } from '@/features/auth/hooks';
import AuthCallback from '@/pages/AuthCallback';
import DashboardPage from '@/pages/DashboardPage';
import HabitsPage from '@/pages/HabitsPage';
import DailiesPage from '@/pages/DailiesPage';
import QuestsPage from '@/pages/QuestsPage';
import FocusChamberPage from '@/pages/FocusChamberPage';
import ReflectionPage from '@/pages/ReflectionPage';
import ShopPage from '@/pages/ShopPage';
import ProfilePage from '@/pages/ProfilePage';
import DevShowcase from '@/pages/DevShowcase';
import AiPage from '@/pages/AiPage';
import StudyPage from '@/pages/StudyPage';
import FinancePage from '@/pages/FinancePage';
import WellnessPage from '@/pages/WellnessPage';

import OnboardingPage, { LOCAL_STORAGE_COMPLETED_KEY } from '@/features/onboarding/OnboardingPage';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    initNativeStatusBar();
    const cleanup = initNativeApp({
      onNavigate: (path) => navigate(path),
    });
    return cleanup;
  }, [navigate]);

  // Reliable first-launch detection:
  // If genuinely new user at root without completed onboarding, direct to /onboarding
  useEffect(() => {
    if (authLoading) return;

    let isLocalCompleted = false;
    try {
      isLocalCompleted = localStorage.getItem(LOCAL_STORAGE_COMPLETED_KEY) === 'true';
    } catch {
      // storage unavailable
    }

    const isUserCompleted = Boolean(user?.onboardingCompleted);

    if (isUserCompleted && !isLocalCompleted) {
      try {
        localStorage.setItem(LOCAL_STORAGE_COMPLETED_KEY, 'true');
      } catch {
        // ignore
      }
    }

    const hasCompleted = isLocalCompleted || isUserCompleted;

    if (!hasCompleted && location.pathname === '/') {
      navigate('/onboarding', { replace: true });
    }
  }, [user, authLoading, location.pathname, navigate]);

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/login" element={<OnboardingPage defaultMode="login" />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/dailies" element={<DailiesPage />} />
        <Route path="/quests" element={<QuestsPage />} />
        <Route path="/goals" element={<QuestsPage />} />
        <Route path="/wellness" element={<WellnessPage />} />
        <Route path="/focus" element={<FocusChamberPage />} />
        <Route path="/reflection" element={<ReflectionPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/ai" element={<AiPage />} />
        <Route path="/study" element={<StudyPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/dev" element={<DevShowcase />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </AppShell>
  );
}
