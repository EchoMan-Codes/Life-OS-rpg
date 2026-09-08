import { Routes, Route } from 'react-router-dom';

import { AppShell } from '@/components/layout';
import DevShowcase from '@/pages/DevShowcase';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DevShowcase />} />
      </Routes>
    </AppShell>
  );
}
