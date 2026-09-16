import { Routes, Route } from 'react-router-dom';

import { AppShell } from '@/components/layout';
import DevShowcase from '@/pages/DevShowcase';
import DashboardPage from '@/pages/DashboardPage';
import AuthCallback from '@/pages/AuthCallback';
import HabitsPage from '@/pages/HabitsPage';
import DailiesPage from '@/pages/DailiesPage';
import QuestsPage from '@/pages/QuestsPage';
import ShopPage from '@/pages/ShopPage';
import FocusChamberPage from '@/pages/FocusChamberPage';
import ReflectionPage from '@/pages/ReflectionPage';

export default function App() {
  return (
    <Routes>
      <Route path="/focus" element={<FocusChamberPage />} />
      <Route
        path="*"
        element={
          <AppShell>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/showcase" element={<DevShowcase />} />
              <Route path="/dev" element={<DevShowcase />} />
              <Route path="/habits" element={<HabitsPage />} />
              <Route path="/dailies" element={<DailiesPage />} />
              <Route path="/quests" element={<QuestsPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/reflection" element={<ReflectionPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
            </Routes>
          </AppShell>
        }
      />
    </Routes>
  );
}
