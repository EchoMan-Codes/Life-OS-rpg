import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { PlayerHud, FloatingTextContainer } from '@/components/hud';
import { ToastProvider } from '@/components/ui/Toast';
import { BattleActivityDrawer } from '@/components/hud/BattleActivityDrawer';
import { LevelUpModal } from '@/components/celebration/LevelUpModal';
import { LootDropPopup } from '@/components/celebration/LootDropPopup';
import { LIFEOS_OPEN_BATTLE_LOG_EVENT } from '@/features/celebration/celebrationEvents';
import { ThemeRippleOverlay, JeevanLoader } from '@/components/ui';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { FloatingAiCompanion } from '@/features/ai/components/FloatingAiCompanion';
import { AiChatSheet } from '@/features/ai/components/AiChatSheet';
import { SectionSwitcherModal } from '@/features/navigation/SectionSwitcherModal';

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
  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [sectionSwitcherOpen, setSectionSwitcherOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const isDashboard = location.pathname === '/';
  const isProfile = location.pathname === '/profile';
  const isAiPage = location.pathname === '/ai';

  const [hasLaunched, setHasLaunched] = useState(false);

  const handleLaunchComplete = () => {
    setHasLaunched(true);
  };

  // Listen for global open battle log and section switcher events
  useEffect(() => {
    const handleOpenBattleLog = () => setBattleDrawerOpen(true);
    const handleOpenSwitcher = () => setSectionSwitcherOpen(true);

    window.addEventListener(LIFEOS_OPEN_BATTLE_LOG_EVENT, handleOpenBattleLog);
    window.addEventListener('lifeos:open-section-switcher', handleOpenSwitcher);

    return () => {
      window.removeEventListener(LIFEOS_OPEN_BATTLE_LOG_EVENT, handleOpenBattleLog);
      window.removeEventListener('lifeos:open-section-switcher', handleOpenSwitcher);
    };
  }, []);

  if (isOnboardingPage) {
    return (
      <ToastProvider>
        <ThemeRippleOverlay />
        <div className="min-h-screen bg-obsidian text-ink">
          {children}
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <ThemeRippleOverlay />
      <AnimatePresence>
        {!hasLaunched && (
          <JeevanLoader
            variant="full"
            message="Launching Jeevan OS..."
            submessage="Live. Track. Grow."
            duration={2500}
            onComplete={handleLaunchComplete}
          />
        )}
      </AnimatePresence>
      <div className="min-h-screen bg-obsidian">
        {/* Desktop: Sidebar */}
        {isDesktop && (
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((prev) => !prev)}
            onOpenAuth={() => setAuthModalOpen(true)}
            onOpenSectionSwitcher={() => setSectionSwitcherOpen(true)}
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
                ? 'pt-2 pb-28 sm:pb-32'
                : isProfile
                ? 'pt-2 pb-28 sm:pb-32'
                : 'pt-16 pb-28 sm:pb-32' // Streamlined clearance for focused pages
          )}
        >
          <div className="p-3 sm:p-5 md:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile: Bottom nav with specialized section items & Switcher */}
        {!isDesktop && (
          <BottomNav
            onOpenAuth={() => setAuthModalOpen(true)}
            onOpenSectionSwitcher={() => setSectionSwitcherOpen(true)}
          />
        )}

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

        {/* Universal 3D Rolling Section Cards Switcher Modal */}
        <SectionSwitcherModal
          isOpen={sectionSwitcherOpen}
          onClose={() => setSectionSwitcherOpen(false)}
        />

        {/* Persistent Movable Jeevan AI Companion Figure */}
        {!isAiPage && (
          <FloatingAiCompanion onOpenAi={() => setAiSheetOpen(true)} />
        )}

        {/* Global Jeevan AI Life Intelligence Slide-over Sheet */}
        <AiChatSheet
          isOpen={aiSheetOpen}
          onClose={() => setAiSheetOpen(false)}
        />
      </div>
    </ToastProvider>
  );
}
