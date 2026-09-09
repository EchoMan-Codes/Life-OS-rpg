import { Routes, Route } from 'react-router-dom';

import { AppShell } from '@/components/layout';
import DevShowcase from '@/pages/DevShowcase';
import AuthCallback from '@/pages/AuthCallback';
import HabitsPage from '@/pages/HabitsPage';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DevShowcase />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </AppShell>
  );
}
