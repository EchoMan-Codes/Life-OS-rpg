import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Coins, Moon, Swords, User as UserIcon } from 'lucide-react';
import PropTypes from 'prop-types';

import { useCharacter } from '@/features/character/hooks';
import { useAuth } from '@/features/auth/hooks';
import { useRestModeStatus } from '@/features/rest-mode/hooks';
import {
  LIFEOS_OPEN_ATTRIBUTES_EVENT,
  LIFEOS_OPEN_BATTLE_LOG_EVENT,
} from '@/features/celebration/celebrationEvents';
import { StatBar } from './StatBar';
import { AttributesDrawer } from './AttributesDrawer';
import { BattleActivityDrawer } from './BattleActivityDrawer';

/**
 * Purpose-built Mobile Player HUD (floating 2-row header) & Global Drawer Host.
 * On desktop (>= 768px), telemetry is integrated into DesktopNav, so PlayerHud
 * acts as the global drawer provider.
 * On mobile (< 768px), it renders a detached, floating 2-row glass HUD header.
 *
 * @param {object} props
 * @param {boolean} [props.isDesktop=false] - Whether viewport is desktop (>= 768px)
 */
export function PlayerHud({ isDesktop: _isDesktop = false }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [battleLogOpen, setBattleLogOpen] = useState(false);
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const { data: character = {} } = useCharacter();
  const { user } = useAuth();
  const { data: restStatus } = useRestModeStatus();

  // Close open drawers immediately on route navigation (§12)
  useEffect(() => {
    setDrawerOpen(false);
    setBattleLogOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleOpenAttrs = () => setDrawerOpen(true);
    const handleOpenBattle = () => setBattleLogOpen(true);

    window.addEventListener(LIFEOS_OPEN_ATTRIBUTES_EVENT, handleOpenAttrs);
    window.addEventListener(LIFEOS_OPEN_BATTLE_LOG_EVENT, handleOpenBattle);

    return () => {
      window.removeEventListener(LIFEOS_OPEN_ATTRIBUTES_EVENT, handleOpenAttrs);
      window.removeEventListener(LIFEOS_OPEN_BATTLE_LOG_EVENT, handleOpenBattle);
    };
  }, []);

  // Character progression stats
  const level = character.level ?? 4;
  const hp = character.hp ?? 62;
  const maxHp = character.maxHp ?? 80;
  const mana = character.mana ?? 30;
  const maxMana = character.maxMana ?? 50;
  const xp = character.xp ?? 320;
  const xpForNextLevel = character.xpForNextLevel ?? 604;
  const gold = character.gold ?? 145;

  const displayName = user?.displayName || 'Hero';
  const avatarUrl = user?.avatarUrl;

  return (
    <>
      {/* Mobile Floating HUD — visible only on mobile (< 768px) */}
      <header
        className="fixed top-2.5 inset-x-3 z-40 safe-top pointer-events-none md:hidden"
        aria-label="Player Status Header"
      >
        <div className="pointer-events-auto material-translucent border-glass-edge rounded-card-lg p-2.5 shadow-elevation-floating flex flex-col gap-2 transition-all">
            {/* ── Row 1: Avatar + Level + Identity  +  XP Progress Bar ── */}
            <div className="flex items-center gap-2.5">
              {/* Tap Avatar opens attributes drawer */}
              <motion.button
                type="button"
                onClick={() => setDrawerOpen(true)}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
                aria-label={`Open character attributes for ${displayName}, Level ${level}`}
                title="View Hero Attributes"
                className="flex items-center gap-2 shrink-0 p-0.5 -m-0.5 rounded-control hit-area-expand cursor-pointer focus-visible:outline-2 focus-visible:outline-accent-primary"
              >
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-8 h-8 rounded-full object-cover border border-gold/40 shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-obsidian-800 border border-gold/40 flex items-center justify-center text-gold shadow-sm">
                      <UserIcon size={16} />
                    </div>
                  )}
                  {/* Level Badge */}
                  <span className="absolute -bottom-1 -right-1 bg-obsidian-900 text-gold border border-gold/50 rounded-full px-1 text-[8px] font-mono font-bold leading-tight shadow">
                    {level}
                  </span>
                </div>

                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-ink truncate max-w-[84px] leading-tight">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-ink-muted leading-none font-mono">
                    Lv. {level}
                  </span>
                </div>
              </motion.button>

              {/* XP progress bar takes remaining width */}
              <div className="flex-1 min-w-0">
                <StatBar type="xp" current={xp} max={xpForNextLevel} label="XP" compact />
              </div>

              {/* Gold pill counter */}
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-chip bg-obsidian-800/90 border border-gold/25 text-gold shrink-0 shadow-inner"
                title={`${gold} Gold`}
              >
                <Coins size={12} className="text-gold" />
                <span className="font-mono font-bold text-[11px] tabular-nums">{gold}</span>
              </div>
            </div>

            {/* ── Row 2: HP & MP Gauges + Battle Feed Trigger + Rest Status ── */}
            <div className="flex items-center gap-2">
              <StatBar type="hp" current={hp} max={maxHp} label="HP" compact />
              <StatBar type="mana" current={mana} max={maxMana} label="MP" compact />

              {/* Rest Mode Badge if active */}
              {restStatus?.isActive && (
                <div
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-chip bg-teal-950/80 border border-teal-600/40 text-teal-300 text-[10px] font-medium shrink-0 shadow-sm"
                  title="Rest Mode Active"
                >
                  <Moon size={10} className="text-teal-400" />
                  <span>Rest</span>
                </div>
              )}

              {/* Quick Battle Log button */}
              <motion.button
                type="button"
                onClick={() => setBattleLogOpen(true)}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.90 }}
                className="w-7 h-7 rounded-control border border-white/10 bg-white/[0.04] text-gold flex items-center justify-center hit-area-expand cursor-pointer shrink-0"
                title="Battle Feed"
                aria-label="Open Battle Activity Feed"
              >
                <Swords size={13} />
              </motion.button>
            </div>
          </div>
        </header>

      {/* Global Collapsible Attributes Side Panel */}
      <AttributesDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        character={character}
      />

      {/* Global Collapsible Battle Activity Side Panel */}
      <BattleActivityDrawer
        isOpen={battleLogOpen}
        onClose={() => setBattleLogOpen(false)}
      />
    </>
  );
}

PlayerHud.propTypes = {
  sidebarCollapsed: PropTypes.bool,
  isDesktop: PropTypes.bool,
};
