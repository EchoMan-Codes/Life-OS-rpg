import { useState } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { PlayerHud, FloatingTextContainer } from '@/components/hud';
import { ToastProvider } from '@/components/ui/Toast';
import { LevelUpModal } from '@/components/celebration/LevelUpModal';
import { LootDropPopup } from '@/components/celebration/LootDropPopup';
import { DesktopNav } from './DesktopNav';
import { BottomNav } from './BottomNav';

/**
 * AppShell — Phase 2 Premium Operating Environment.
 * Combines iOS-level polish, cinematic atmospheric depth, and subtle RPG chrome:
 * - Desktop: Floating 3-Zone Command Chrome (incorporating identity, route navigation, and telemetry)
 * - Mobile: Detached Floating Top HUD + Detached Floating Bottom Pill Navigation
 * - Centered Content Stage with authored max-width and breathing room, prepared for Phase 3 transitions
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Main page content
 */
export function AppShell({ children }) {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  return (
    <ToastProvider>
      <div className="min-h-screen bg-shell-ambient text-ink selection:bg-accent-primary/20 selection:text-ink relative overflow-x-hidden">
        {/* ── Desktop: Floating 3-Zone Command Chrome ── */}
        <div className="hidden md:block">
          <DesktopNav onOpenAuth={() => setAuthModalOpen(true)} />
        </div>

        {/* ── Player HUD (Floating 2-row on Mobile, Drawer provider on Desktop) ── */}
        <PlayerHud isDesktop={isDesktop} />

        {/* ── Floating Combat Text Portal ── */}
        <FloatingTextContainer />

        {/* ── Global Level-Up Celebration Modal ── */}
        <LevelUpModal />

        {/* ── Global Loot Drop Popup ── */}
        <LootDropPopup />

        {/* ── Main Content Stage: Centered with authored breathing room ── */}
        <main
          className={clsx(
            'min-h-screen w-full transition-[padding] duration-200',
            'pt-28 pb-32 px-4 sm:px-5',
            'md:pt-24 md:pb-16 md:max-w-7xl md:mx-auto md:px-8'
          )}
        >
          {/* Transition stage container prepared for Phase 3 spatial navigation */}
          <div id="page-stage" className="relative w-full">
            {children}
          </div>
        </main>

        {/* ── Mobile: Detached Floating Bottom Pill Navigation ── */}
        <div className="md:hidden">
          <BottomNav />
        </div>

        {/* ── Centralized Authentication Modal ── */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      </div>
    </ToastProvider>
  );
}

AppShell.propTypes = {
  children: PropTypes.node,
};
