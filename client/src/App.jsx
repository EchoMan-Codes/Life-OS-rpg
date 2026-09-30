import { Routes, Route } from 'react-router-dom';

import { AppShell } from '@/components/layout';
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

export default function App() {
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
