import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

import { AppShell } from '@/components/layout';
import { AuthGate } from '@/components/auth/AuthGate';
import OnboardingPage from '@/pages/OnboardingPage';
import AuthCallback from '@/pages/AuthCallback';

// Lazy-loaded feature pages with Suspense boundaries (§15 Low-Risk Route Splitting)
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const HabitsPage = lazy(() => import('@/pages/HabitsPage'));
const DailiesPage = lazy(() => import('@/pages/DailiesPage'));
const QuestsPage = lazy(() => import('@/pages/QuestsPage'));
const ShopPage = lazy(() => import('@/pages/ShopPage'));
const FocusChamberPage = lazy(() => import('@/pages/FocusChamberPage'));
const ReflectionPage = lazy(() => import('@/pages/ReflectionPage'));
const DevShowcase = lazy(() => import('@/pages/DevShowcase'));
const TokenGalleryPage = lazy(() => import('@/pages/TokenGalleryPage'));

/**
 * Token-built skeleton loader for Suspense route transitions.
 */
function PageSkeleton() {
  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-pulse">
      <div className="h-10 w-48 rounded-control bg-obsidian-800 border border-glass-border" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-32 rounded-card bg-obsidian-900 border border-glass-border" />
        <div className="h-32 rounded-card bg-obsidian-900 border border-glass-border" />
        <div className="h-32 rounded-card bg-obsidian-900 border border-glass-border" />
      </div>
      <div className="h-64 rounded-card-lg bg-obsidian-900 border border-glass-border" />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public routes — eager loaded to guarantee immediate response & no auth race condition */}
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Full-screen focus — auth-gated but no AppShell chrome */}
      <Route
        path="/focus"
        element={
          <AuthGate>
            <Suspense fallback={<PageSkeleton />}>
              <FocusChamberPage />
            </Suspense>
          </AuthGate>
        }
      />

      {/* Dev showcase & Token gallery routes (dev-only exploration) */}
      <Route
        path="/showcase"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <DevShowcase />
          </Suspense>
        }
      />
      <Route
        path="/dev"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <DevShowcase />
          </Suspense>
        }
      />
      <Route
        path="/dev/tokens"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <TokenGalleryPage />
          </Suspense>
        }
      />

      {/* Protected application routes — auth-gated + AppShell */}
      <Route
        path="*"
        element={
          <AuthGate>
            <AppShell>
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/habits" element={<HabitsPage />} />
                  <Route path="/dailies" element={<DailiesPage />} />
                  <Route path="/quests" element={<QuestsPage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/reflection" element={<ReflectionPage />} />
                </Routes>
              </Suspense>
            </AppShell>
          </AuthGate>
        }
      />
    </Routes>
  );
}
