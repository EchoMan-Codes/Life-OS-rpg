import { useState } from 'react';
import clsx from 'clsx';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

/**
 * App shell — desktop sidebar + mobile bottom nav.
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
    <div className="min-h-screen bg-obsidian">
      {/* Desktop: Sidebar */}
      {isDesktop && (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
          onOpenAuth={() => setAuthModalOpen(true)}
        />
      )}

      {/* Main content area */}
      <main
        className={clsx(
          'min-h-screen transition-[margin] duration-200',
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
  );
}
