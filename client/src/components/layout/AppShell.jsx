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
import { CommandPalette } from './CommandPalette';
import { JeevanAiModal } from '@/features/ai/components/JeevanAiModal';

/**
 * App shell — desktop sidebar + mobile bottom nav + persistent top player HUD.
 * Mounts global celebration modals, command palette, and battle drawer listeners.
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
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const isDashboard = location.pathname === '/';
  const isProfile = location.pathname === '/profile';

  // Listen for global open battle log events and Cmd+K / Ctrl+K
  useEffect(() => {
    const handleOpenBattleLog = () => setBattleDrawerOpen(true);
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener(LIFEOS_OPEN_BATTLE_LOG_EVENT, handleOpenBattleLog);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener(LIFEOS_OPEN_BATTLE_LOG_EVENT, handleOpenBattleLog);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (isOnboardingPage) {
    return (
      <ToastProvider>
        <ThemeRippleOverlay />
        <div
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            paddingLeft: 'env(safe-area-inset-left, 0px)',
            paddingRight: 'env(safe-area-inset-right, 0px)',
          }}
          className="min-h-screen bg-obsidian text-ink"
        >
          {children}
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <ThemeRippleOverlay />
      <div className="min-h-screen bg-obsidian relative overflow-x-hidden">
        {/* iOS Atmospheric Ambient Mesh Gradients (diffuses through translucent glass panels) */}
        <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[650px] h-[650px] rounded-full bg-gradient-to-br from-amber-500/22 via-orange-500/12 to-transparent blur-3xl opacity-80" />
          <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-indigo-600/25 via-purple-600/15 to-transparent blur-3xl opacity-75" />
          <div className="absolute bottom-12 right-1/4 w-[520px] h-[520px] rounded-full bg-gradient-to-tl from-emerald-500/20 via-teal-500/10 to-transparent blur-3xl opacity-60" />
          <div className="absolute top-2/3 -right-20 w-[450px] h-[450px] rounded-full bg-gradient-to-b from-rose-500/15 via-purple-500/8 to-transparent blur-3xl opacity-50" />
        </div>
        {/* Desktop: Sidebar */}
        {isDesktop && (
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((prev) => !prev)}
            onOpenAuth={() => setAuthModalOpen(true)}
            onOpenCommand={() => setCommandPaletteOpen(true)}
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

        {/* Main content area with strict mobile safe-area handling and stable #page-stage */}
        <main
          id="page-stage"
          style={!isDesktop ? {
            paddingTop: isDashboard || isProfile
              ? 'max(0.75rem, env(safe-area-inset-top, 0px))'
              : 'calc(3.5rem + max(0.5rem, env(safe-area-inset-top, 0px)))',
            paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
            paddingLeft: 'env(safe-area-inset-left, 0px)',
            paddingRight: 'env(safe-area-inset-right, 0px)',
          } : undefined}
          className={clsx(
            'min-h-screen transition-[margin,padding] duration-200',
            isDesktop
              ? sidebarCollapsed
                ? isDashboard ? 'pt-20 ml-20' : isProfile ? 'pt-6 ml-20' : 'pt-[72px] ml-20'
                : isDashboard ? 'pt-20 ml-64' : isProfile ? 'pt-6 ml-64' : 'pt-[72px] ml-64'
              : ''
          )}
        >
          <div className="p-3 sm:p-5 md:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile: Bottom nav with Hub drawer */}
        {!isDesktop && <BottomNav onOpenAuth={() => setAuthModalOpen(true)} />}

        {/* Desktop Command Palette (Cmd+K / Ctrl+K) */}
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onOpenAi={() => setAiModalOpen(true)}
        />

        {/* Global Jeevan AI Strategist Modal */}
        <JeevanAiModal
          isOpen={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
        />

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
