import { useState, useEffect } from 'react';
import { Coins, Shield, Swords, User as UserIcon } from 'lucide-react';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import { useCharacter } from '@/features/character/hooks';
import { useAuth } from '@/features/auth/hooks';
import { LIFEOS_OPEN_ATTRIBUTES_EVENT } from '@/features/celebration/celebrationEvents';
import { StatBar } from './StatBar';
import { AttributesDrawer } from './AttributesDrawer';

/**
 * Sticky top Player Status HUD.
 * Bold glass surface displaying avatar + level badge, HP/Mana/XP bars, Gold counter,
 * and attributes drawer trigger.
 */
export function PlayerHud({ sidebarCollapsed = false, isDesktop = false, onOpenBattleLog }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: character = {} } = useCharacter();
  const { user } = useAuth();

  useEffect(() => {
    const handleOpen = () => setDrawerOpen(true);
    window.addEventListener(LIFEOS_OPEN_ATTRIBUTES_EVENT, handleOpen);
    return () => window.removeEventListener(LIFEOS_OPEN_ATTRIBUTES_EVENT, handleOpen);
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
          'bg-obsidian-950/75 backdrop-blur-2xl border-b border-white/10',
          'shadow-[0_4px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]',
          'transition-[left] duration-200',
          isDesktop
            ? sidebarCollapsed
              ? 'left-20'
              : 'left-64'
            : 'left-0'
        )}
      >
        <div className="h-full px-2.5 sm:px-4 md:px-6 flex items-center justify-between gap-1.5 sm:gap-4 md:gap-6 overflow-hidden">
          {/* 1. Left: Avatar + Level Badge */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            title="Open Character Attributes"
            aria-label="Open character attributes"
            className={clsx(
              'flex items-center gap-2 group p-1 rounded-xl hover:bg-white/[0.06] active:scale-95 transition-all shrink-0',
              'focus:outline-none focus:ring-2 focus:ring-white/20'
            )}
          >
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-gold/50 shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-obsidian-800 border border-gold/40 flex items-center justify-center text-gold shadow-sm">
                  <UserIcon size={18} />
                </div>
              )}
              {/* Level Badge overlaid */}
              <span className="absolute -bottom-1 -right-1 bg-obsidian-950 text-gold border border-gold/60 rounded-full px-1.5 text-[8px] sm:text-[10px] font-mono font-bold leading-tight shadow">
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

          {/* 2. Middle: HP, Mana, XP StatBars */}
          <div className="flex items-center gap-1.5 sm:gap-3 md:gap-5 flex-1 max-w-2xl min-w-0">
            <StatBar type="hp" current={hp} max={maxHp} label="HP" />
            <StatBar type="mana" current={mana} max={maxMana} label="MP" />
            <StatBar type="xp" current={xp} max={xpForNextLevel} label="XP" />
          </div>

          {/* 3. Right: Gold Counter & Triggers */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Gold Counter */}
            <div
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-obsidian-900/80 border border-gold/30 text-gold shadow-inner"
              title={`${gold} Gold`}
            >
              <Coins size={14} className="text-gold shrink-0" />
              <span className="font-mono font-bold text-xs sm:text-sm">
                {gold}
              </span>
            </div>

            {/* Battle Chronicles Trigger Button */}
            {onOpenBattleLog && (
              <button
                type="button"
                onClick={onOpenBattleLog}
                aria-label="Open Battle Chronicles"
                title="Battle Chronicles"
                className={clsx(
                  'p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-white/10',
                  'bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 text-gold',
                  'flex items-center gap-1 transition-all min-h-[36px] min-w-[36px] justify-center',
                  'focus:outline-none focus:ring-2 focus:ring-white/20'
                )}
              >
                <Swords size={15} className="shrink-0" />
              </button>
            )}

            {/* Attributes Drawer Button */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="View Attributes Radar Chart"
              title="View Attributes"
              className={clsx(
                'p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-white/10',
                'bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 text-ink-muted hover:text-ink',
                'flex items-center gap-1.5 text-caption font-display font-medium',
                'transition-all focus:outline-none focus:ring-2 focus:ring-white/20 min-h-[36px]'
              )}
            >
              <Shield size={15} className="text-attr-willpower shrink-0" />
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
    </>
  );
}

PlayerHud.propTypes = {
  sidebarCollapsed: PropTypes.bool,
  isDesktop: PropTypes.bool,
  onOpenBattleLog: PropTypes.func,
};
