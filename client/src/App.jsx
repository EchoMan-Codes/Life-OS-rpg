import { Routes, Route } from 'react-router-dom';

import { AppShell } from '@/components/layout';
import DevShowcase from '@/pages/DevShowcase';
import AuthCallback from '@/pages/AuthCallback';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DevShowcase />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </AppShell>
  );
}
