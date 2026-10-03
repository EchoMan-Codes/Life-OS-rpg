import { useState } from 'react';
import PropTypes from 'prop-types';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import {
  Layers,
  Sparkles,
  Menu,
  X,
  LogIn,
  LogOut,
  Shield,
  User as UserIcon,
} from 'lucide-react';

import { useAuth } from '@/features/auth/hooks';
import { spring } from '@/lib/motionVariants';
import { ModeButton } from '@/components/ui/ModeButton';
import { getActiveSectionConfig } from '@/features/navigation/sectionNavConfig';

/**
 * Mobile iOS-inspired floating rounded glassy navbar.
 * Renders specialized sub-navigation for the current active Jeevan section,
 * plus a dedicated "Switch Section" trigger to open the 3D Rolling Cards selector.
 */
export function BottomNav({ onOpenAuth, onOpenSectionSwitcher }) {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const activeConfig = getActiveSectionConfig(location.pathname);
  const items = activeConfig.mobileItems || [];

  return (
    <>
      <div
        style={{ bottom: 'max(1rem, calc(0.5rem + env(safe-area-inset-bottom, 0px)))' }}
        className="fixed inset-x-3 sm:inset-x-6 max-w-md mx-auto z-40 md:hidden pointer-events-none"
      >
        <nav
          className={clsx(
            'pointer-events-auto relative',
            'flex items-center justify-around gap-1',
            'h-16 px-2 py-1.5',
            'rounded-full',
            'bg-white/90 dark:bg-obsidian-950/85 backdrop-blur-2xl',
            'border border-slate-200/90 dark:border-white/15',
            'shadow-[0_12px_36px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.22)]'
          )}
        >
          {/* Section Specialized Items */}
          {items.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                className="relative flex-1 h-full flex flex-col items-center justify-center focus:outline-none select-none"
              >
                {isActive && (
                  <motion.div
                    layoutId="ios-active-nav-pill"
                    className="absolute inset-1 rounded-full bg-indigo-50/90 border border-indigo-200/80 shadow-xs dark:bg-white/[0.12] dark:border-white/15"
                    transition={spring.capsule}
                  />
                )}
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  transition={spring.capsule}
                  className="relative z-10 flex flex-col items-center justify-center gap-0.5"
                >
                  <Icon
                    size={19}
                    className={clsx(
                      'transition-colors duration-150',
                      isActive ? 'text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-ink-muted/80'
                    )}
                  />
                  <span
                    className={clsx(
                      'text-[10px] tracking-tight font-sans transition-colors duration-150',
                      isActive
                        ? 'font-bold text-indigo-700 dark:text-white'
                        : 'font-medium text-slate-500 dark:text-ink-muted/80'
                    )}
                  >
                    {label}
                  </span>
                </motion.div>
              </NavLink>
            );
          })}

          {/* Dedicated "Switch Section" Rolling Cards Button */}
          <button
            type="button"
            onClick={onOpenSectionSwitcher}
            className="relative flex-1 h-full flex flex-col items-center justify-center focus:outline-none select-none group cursor-pointer"
            aria-label="Switch Jeevan Section"
          >
            <motion.div
              whileTap={{ scale: 0.88 }}
              transition={spring.capsule}
              className="relative z-10 flex flex-col items-center justify-center gap-0.5"
            >
              <div className="relative">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md border border-white/20 group-hover:scale-105 transition-transform"
                >
                  <Layers size={14} />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              </div>
              <span className="text-[10px] tracking-tight font-sans font-bold text-purple-600 dark:text-purple-300">
                Switch
              </span>
            </motion.div>
          </button>
        </nav>
      </div>
    </>
  );
}

BottomNav.propTypes = {
  onOpenAuth: PropTypes.func,
  onOpenSectionSwitcher: PropTypes.func.isRequired,
};
