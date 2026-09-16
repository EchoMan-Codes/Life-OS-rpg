import { useState } from 'react';
import clsx from 'clsx';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { PlayerHud, FloatingTextContainer } from '@/components/hud';
import { ToastProvider } from '@/components/ui/Toast';
import { LevelUpModal } from '@/components/celebration/LevelUpModal';
import { LootDropPopup } from '@/components/celebration/LootDropPopup';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

/**
 * App shell — desktop sidebar + mobile bottom nav + persistent top player HUD.
 * Responsive swap at md breakpoint (768px).
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Main content area
 */
export function AppShell({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  return (
    <ToastProvider>
      <div className="min-h-screen bg-obsidian">
        {/* Desktop: Sidebar */}
        {isDesktop && (
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((prev) => !prev)}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {/* Persistent Top Player HUD */}
        <PlayerHud
          sidebarCollapsed={sidebarCollapsed}
          isDesktop={isDesktop}
        />

        {/* Floating Combat Text Portal */}
        <FloatingTextContainer />

        {/* Global Level-Up Celebration Modal */}
        <LevelUpModal />

        {/* Global Loot Drop Popup */}
        <LootDropPopup />

        {/* Main content area */}
        <main
          className={clsx(
            'min-h-screen transition-[margin] duration-200',
            isDesktop
              ? clsx(
                  'pt-16',
                  sidebarCollapsed ? 'ml-20' : 'ml-64'
                )
              : clsx(
                  // Mobile: 2-row HUD is taller (~60px), add bottom clearance for nav + safe area
                  'pt-[60px] pb-24'
                )
          )}
        >
          {/* Mobile gets generous horizontal padding; desktop scales up */}
          <div className={clsx(
            isDesktop ? 'p-6 lg:p-8' : 'px-5 py-4'
          )}>
            {children}
          </div>
        </main>

        {/* Mobile: Bottom nav */}
        {!isDesktop && <BottomNav onOpenAuth={() => setAuthModalOpen(true)} />}

        {/* Centralized Authentication Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      </div>
    </ToastProvider>
  );
}
