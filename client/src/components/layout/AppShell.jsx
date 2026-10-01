import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const isOnboardingPage = location.pathname === '/onboarding' || location.pathname === '/login';

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [battleDrawerOpen, setBattleDrawerOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const isDashboard = location.pathname === '/';
  const isProfile = location.pathname === '/profile';

  // Listen for global open battle log events
  useEffect(() => {
    const handleOpenBattleLog = () => setBattleDrawerOpen(true);
    window.addEventListener(LIFEOS_OPEN_BATTLE_LOG_EVENT, handleOpenBattleLog);
    return () => window.removeEventListener(LIFEOS_OPEN_BATTLE_LOG_EVENT, handleOpenBattleLog);
  }, []);

  if (isOnboardingPage) {
    return (
      <ToastProvider>
        <div className="min-h-screen bg-obsidian text-ink">
          {children}
        </div>
      </ToastProvider>
    );
  }

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
            'min-h-screen transition-[margin,padding] duration-200',
            isDesktop
              ? sidebarCollapsed
                ? isDashboard ? 'pt-20 ml-20' : isProfile ? 'pt-6 ml-20' : 'pt-[72px] ml-20'
                : isDashboard ? 'pt-20 ml-64' : isProfile ? 'pt-6 ml-64' : 'pt-[72px] ml-64'
              : isDashboard
                ? 'pt-[172px] pb-28 sm:pb-32'
                : isProfile
                ? 'pt-3 pb-28 sm:pb-32'
                : 'pt-[70px] pb-28 sm:pb-32' // Streamlined clearance for focused pages
          )}
        >
          <div className="p-3 sm:p-5 md:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
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
