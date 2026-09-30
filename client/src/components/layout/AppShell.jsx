import { useState, useEffect } from 'react';
import clsx from 'clsx';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { PlayerHud, FloatingTextContainer } from '@/components/hud';
import { ToastProvider } from '@/components/ui/Toast';
import { BattleActivityDrawer } from '@/components/hud/BattleActivityDrawer';
import { LevelUpModal } from '@/components/celebration/LevelUpModal';
import { LootDropPopup } from '@/components/celebration/LootDropPopup';
import { LIFEOS_OPEN_BATTLE_LOG_EVENT } from '@/features/celebration/celebrationEvents';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

/**
 * App shell — desktop sidebar + mobile bottom nav + persistent top player HUD.
 * Mounts global celebration modals and battle drawer listeners.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Main content area
 */
export function AppShell({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [battleDrawerOpen, setBattleDrawerOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Listen for global open battle log events
  useEffect(() => {
    const handleOpenBattleLog = () => setBattleDrawerOpen(true);
    window.addEventListener(LIFEOS_OPEN_BATTLE_LOG_EVENT, handleOpenBattleLog);
    return () => window.removeEventListener(LIFEOS_OPEN_BATTLE_LOG_EVENT, handleOpenBattleLog);
  }, []);

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
          onOpenBattleLog={() => setBattleDrawerOpen(true)}
        />

        {/* Floating Combat Text Portal */}
        <FloatingTextContainer />

        {/* Main content area */}
        <main
          className={clsx(
            'min-h-screen pt-16 transition-[margin] duration-200',
            isDesktop
              ? sidebarCollapsed
                ? 'ml-20'
                : 'ml-64'
              : 'pb-28 sm:pb-32' // clearance for floating capsule bottom nav on mobile
          )}
        >
          <div className="p-3 sm:p-5 md:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
        </main>

        {/* Mobile: Bottom nav with Hub drawer */}
        {!isDesktop && <BottomNav onOpenAuth={() => setAuthModalOpen(true)} />}

        {/* Battle Chronicles Slide-over Drawer */}
        <BattleActivityDrawer
          isOpen={battleDrawerOpen}
          onClose={() => setBattleDrawerOpen(false)}
        />

        {/* Global Level-Up Celebration Modal */}
        <LevelUpModal />

        {/* Global Loot Drop Popup */}
        <LootDropPopup />

        {/* Centralized Authentication Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      </div>
    </ToastProvider>
  );
}
