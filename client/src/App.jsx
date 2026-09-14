import { Routes, Route } from 'react-router-dom';

import { AppShell } from '@/components/layout';
import DevShowcase from '@/pages/DevShowcase';
import AuthCallback from '@/pages/AuthCallback';
import HabitsPage from '@/pages/HabitsPage';
import DailiesPage from '@/pages/DailiesPage';
import QuestsPage from '@/pages/QuestsPage';
import ShopPage from '@/pages/ShopPage';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DevShowcase />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/dailies" element={<DailiesPage />} />
        <Route path="/quests" element={<QuestsPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </AppShell>
  );
}
