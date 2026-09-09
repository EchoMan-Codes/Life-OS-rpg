import { useState } from 'react';
import clsx from 'clsx';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { PlayerHud, FloatingTextContainer } from '@/components/hud';
import { ToastProvider } from '@/components/ui/Toast';
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

        {/* Main content area */}
        <main
          className={clsx(
            'min-h-screen pt-16 transition-[margin] duration-200',
            isDesktop
              ? sidebarCollapsed
                ? 'ml-20'
                : 'ml-64'
              : 'pb-20' // padding for bottom nav on mobile
          )}
        >
          <div className="p-4 md:p-6 lg:p-8">{children}</div>
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
