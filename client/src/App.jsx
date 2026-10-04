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

import OnboardingPage from '@/features/onboarding/OnboardingPage';

import { notificationService } from '@/lib/notifications';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    initNativeStatusBar();
    notificationService.setNavigateHandler((path) => navigate(path));
    const cleanup = initNativeApp({
      onNavigate: (path) => navigate(path),
    });
    return cleanup;
  }, [navigate]);

  useEffect(() => {
    if (authLoading) return;

    const pathname = location.pathname;
    if (pathname.startsWith('/auth/callback') || pathname === '/dev') return;

    const isOnboardingOrLogin = pathname === '/onboarding' || pathname === '/login';

    if (!isAuthenticated) {
      if (!isOnboardingOrLogin) {
        let hasCompletedOnboarding = false;
        try {
          hasCompletedOnboarding = localStorage.getItem('lifeos_onboarding_completed') === 'true';
        } catch {}

        if (!hasCompletedOnboarding) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      }
    } else {
      if (pathname === '/login') {
        navigate('/', { replace: true });
      } else if (pathname === '/onboarding') {
        try {
          const hasCompletedOnboarding = localStorage.getItem('lifeos_onboarding_completed') === 'true';
          if (hasCompletedOnboarding) {
            navigate('/', { replace: true });
          }
        } catch {}
      }
    }
  }, [isAuthenticated, authLoading, location.pathname, navigate]);
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
        <Route path="/focus" element={<FocusChamberPage />} />
        <Route path="/reflection" element={<ReflectionPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/dev" element={<DevShowcase />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </AppShell>
  );
}
