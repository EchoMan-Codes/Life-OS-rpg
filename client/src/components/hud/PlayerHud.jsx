import { useState, useEffect } from 'react';
import { Coins, Moon, Shield, Swords, User as UserIcon } from 'lucide-react';
import clsx from 'clsx';
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
 * Sticky top Player Status HUD.
 * Bold glass surface displaying avatar + level badge, HP/Mana/XP bars, Gold counter,
 * and attributes drawer trigger.
 *
 * @param {object} props
 * @param {boolean} [props.sidebarCollapsed=false] - Whether desktop sidebar is collapsed
 * @param {boolean} [props.isDesktop=false] - Whether viewport is desktop (>= 768px)
 */
export function PlayerHud({ sidebarCollapsed = false, isDesktop = false }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [battleLogOpen, setBattleLogOpen] = useState(false);
  const { data: character = {} } = useCharacter();
  const { user } = useAuth();
  const { data: restStatus } = useRestModeStatus();

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

  // Fallback defaults while initial query loads
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
      <header
        className={clsx(
          'fixed top-0 right-0 z-40 h-16',
          // Bold glass surface per design tokens (stronger blur and opacity)
          'bg-obsidian-900/90 backdrop-blur-2xl border-b border-glass-border shadow-glow',
          'transition-[left] duration-200',
          isDesktop
            ? sidebarCollapsed
              ? 'left-20'
              : 'left-64'
            : 'left-0'
        )}
      >
        <div className="h-full px-3 sm:px-4 md:px-6 flex items-center justify-between gap-2 sm:gap-4 md:gap-6 overflow-hidden">
          {/* 1. Left: Avatar + Level Badge */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            title="Open Character Attributes"
            aria-label="Open character attributes"
            className={clsx(
              'flex items-center gap-2 group p-1 rounded-lg hover:bg-glass transition-colors shrink-0',
              'focus:outline-none focus:ring-2 focus:ring-glass-border'
            )}
          >
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-chip object-cover border border-gold/40 shadow-sm"
                />
              ) : (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-chip bg-obsidian-700 border border-gold/40 flex items-center justify-center text-gold shadow-sm">
                  <UserIcon size={20} />
                </div>
              )}
              {/* Level Badge overlaid */}
              <span className="absolute -bottom-1 -right-1 bg-obsidian-900 text-gold border border-gold/50 rounded-chip px-1 text-[9px] sm:text-[10px] font-mono font-bold leading-tight shadow">
                {level}
              </span>
            </div>

            <div className="hidden xl:flex flex-col text-left">
              <span className="text-caption font-semibold text-ink leading-tight truncate max-w-[90px]">
                {displayName}
              </span>
              <span className="text-[10px] text-ink-muted leading-none">
                Lv. {level} Hero
              </span>
            </div>
          </button>

          {/* Rest Mode Persistent Badge */}
          {restStatus?.isActive && (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-950/80 border border-teal-600/50 text-teal-300 text-[10px] sm:text-xs font-medium shadow-sm shrink-0"
              title={`Rest Mode Active: HP reset penalties are paused${restStatus.autoDeactivateAt ? ` until ${new Date(restStatus.autoDeactivateAt).toLocaleDateString()}` : ''}`}
            >
              <Moon size={11} className="text-teal-400 shrink-0" />
              <span>Resting</span>
            </div>
          )}

          {/* 2. Middle: HP, Mana, XP StatBars */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-5 flex-1 max-w-2xl min-w-0">
            <StatBar type="hp" current={hp} max={maxHp} label="HP" />
            <StatBar type="mana" current={mana} max={maxMana} label="MP" />
            <StatBar type="xp" current={xp} max={xpForNextLevel} label="XP" />
          </div>

          {/* 3. Right: Gold Counter & Attributes Drawer Trigger */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Gold Counter */}
            <div
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-chip bg-obsidian-800 border border-gold/30 text-gold shadow-inner"
              title={`${gold} Gold`}
            >
              <Coins size={15} className="text-gold shrink-0" />
              <span className="font-mono font-bold text-xs sm:text-sm">
                {gold}
              </span>
            </div>

            {/* Battle Activity Feed Button */}
            <button
              type="button"
              onClick={() => setBattleLogOpen(true)}
              aria-label="Open battle activity log"
              title="Battle Activity Feed"
              className={clsx(
                'p-1.5 sm:px-2.5 sm:py-1.5 min-w-[44px] min-h-[44px] rounded-lg border border-glass-border',
                'bg-glass hover:bg-glass/80 text-ink-muted hover:text-ink',
                'flex items-center justify-center gap-1.5 text-caption font-display font-medium',
                'transition-colors focus:outline-none focus:ring-2 focus:ring-glass-border'
              )}
            >
              <Swords size={16} className="text-gold shrink-0" />
              <span className="hidden md:inline">Log</span>
            </button>

            {/* Attributes Drawer Button */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="View Attributes Radar Chart"
              title="View Attributes"
              className={clsx(
                'p-1.5 sm:px-2.5 sm:py-1.5 min-w-[44px] min-h-[44px] rounded-lg border border-glass-border',
                'bg-glass hover:bg-glass/80 text-ink-muted hover:text-ink',
                'flex items-center justify-center gap-1.5 text-caption font-display font-medium',
                'transition-colors focus:outline-none focus:ring-2 focus:ring-glass-border'
              )}
            >
              <Shield size={16} className="text-attr-willpower shrink-0" />
              <span className="hidden sm:inline">Stats</span>
            </button>
          </div>
        </div>
      </header>

      {/* Collapsible Attributes Side Panel */}
      <AttributesDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        character={character}
      />

      {/* Collapsible Battle Activity Side Panel */}
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
