import { Routes, Route } from 'react-router-dom';

import { AppShell } from '@/components/layout';
import { AuthGate } from '@/components/auth/AuthGate';
import DevShowcase from '@/pages/DevShowcase';
import DashboardPage from '@/pages/DashboardPage';
import AuthCallback from '@/pages/AuthCallback';
import HabitsPage from '@/pages/HabitsPage';
import DailiesPage from '@/pages/DailiesPage';
import QuestsPage from '@/pages/QuestsPage';
import ShopPage from '@/pages/ShopPage';
import FocusChamberPage from '@/pages/FocusChamberPage';
import ReflectionPage from '@/pages/ReflectionPage';
import OnboardingPage from '@/pages/OnboardingPage';

export default function App() {
  return (
    <Routes>
      {/* Public routes — no auth required */}
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Full-screen focus — auth-gated but no AppShell chrome */}
      <Route
        path="/focus"
        element={
          <AuthGate>
            <FocusChamberPage />
          </AuthGate>
        }
      />

      {/* Dev showcase — always accessible for development */}
      <Route path="/showcase" element={<DevShowcase />} />
      <Route path="/dev" element={<DevShowcase />} />

      {/* Protected application routes — auth-gated + AppShell */}
      <Route
        path="*"
        element={
          <AuthGate>
            <AppShell>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/habits" element={<HabitsPage />} />
                <Route path="/dailies" element={<DailiesPage />} />
                <Route path="/quests" element={<QuestsPage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/reflection" element={<ReflectionPage />} />
              </Routes>
            </AppShell>
          </AuthGate>
        }
      />
    </Routes>
  );
}
