import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import { AppShell } from '@/components/layout';
import { AuthGate } from '@/components/auth/AuthGate';
import { NavigationTransitionProvider } from '@/context/NavigationTransitionContext';
import { PageTransition } from '@/components/transitions';
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
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-pulse" aria-busy="true" aria-label="Loading page content">
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

/**
 * Protected application routes wrapped in persistent AppShell and spatial AnimatePresence.
 */
function ProtectedAppContent() {
  const location = useLocation();

  return (
    <NavigationTransitionProvider>
      <AppShell>
        <AnimatePresence mode="popLayout" initial={false}>
          <PageTransition key={location.pathname}>
            <Suspense fallback={<PageSkeleton />}>
              <Routes location={location}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                <Route path="/habits" element={<HabitsPage />} />
                <Route path="/dailies" element={<DailiesPage />} />
                <Route path="/quests" element={<QuestsPage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/focus" element={<FocusChamberPage />} />
                <Route path="/reflection" element={<ReflectionPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </PageTransition>
        </AnimatePresence>
      </AppShell>
    </NavigationTransitionProvider>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public routes — eager loaded to guarantee immediate response & no auth race condition */}
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

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

      {/* Protected application routes — auth-gated + spatial page transitions in AppShell */}
      <Route
        path="*"
        element={
          <AuthGate>
            <ProtectedAppContent />
          </AuthGate>
        }
      />
    </Routes>
  );
}
