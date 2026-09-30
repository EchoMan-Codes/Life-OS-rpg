import { motion } from 'framer-motion';
import { Coins, Shield, Package, Sparkles, ArrowUpRight, Plus } from 'lucide-react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { spring } from '@/lib/motionVariants';

/**
 * SpoilsVaultRibbon — Unique non-card progression ribbon for the Reward Shop.
 * Breaks away from repetitive card boxes with a continuous, interconnected RPG spoils telemetry strip.
 * Features an integrated glowing golden circuit line, illuminated waypoint nodes,
 * large editorial typographic readouts, and responsive interactive stations.
 */
export function SpoilsVaultRibbon({
  userGold = 0,
  inventory = [],
  shopItems = [],
  onOpenInventory,
  onOpenCreateTreat,
  onFilterCategory,
}) {
  const totalInventoryCount = inventory.reduce((sum, i) => sum + (i.quantity || 1), 0);
  const activeShieldsCount = inventory.filter(
    (i) => (i.item?.type || i.type || i.reward_type) === 'streak_shield'
  ).length;

  // Determine wealth tier
  const wealthTier =
    userGold >= 2000
      ? "Dragon's Cache"
      : userGold >= 1000
      ? 'Royal Treasury'
      : userGold >= 400
      ? 'Merchant Vault'
      : userGold >= 100
      ? 'Adventurer Pouch'
      : 'Novice Purser';

  // Find highest cost custom item as saving goal or closest target
  const customItems = shopItems.filter(
    (i) => (i.type || i.reward_type) === 'custom' || !i.type
  );
  const targetItem = customItems.length > 0
    ? customItems.reduce((prev, curr) => ((curr.costGold || curr.cost_gold || 0) > (prev.costGold || prev.cost_gold || 0) ? curr : prev), customItems[0])
    : null;

  const targetCost = targetItem ? (targetItem.costGold || targetItem.cost_gold || 100) : 100;
  const targetProgress = Math.min(100, Math.round((userGold / Math.max(1, targetCost)) * 100));

  const stations = [
    {
      id: 'gold',
      label: 'Treasury Reserves',
      badge: wealthTier,
      value: `${userGold.toLocaleString()} GP`,
      subtext: 'Hard-won quest spoils',
      icon: Coins,
      color: 'gold',
      actionText: 'Earn More',
      onClick: () => onFilterCategory?.('all'),
      pulse: userGold >= 400,
      nodeBg: 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-gold',
      nodeRing: 'ring-amber-500/20',
      activeText: 'text-amber-600 dark:text-gold',
      accentDot: 'bg-amber-500',
    },
    {
      id: 'shields',
      label: 'Aegis Streak Shields',
      badge: activeShieldsCount > 0 ? `${activeShieldsCount} in Stock` : 'Unprotected',
      value: activeShieldsCount,
      subtext: activeShieldsCount > 0 ? 'Daily habits fortified' : 'Browse shields',
      icon: Shield,
      color: 'intelligence',
      actionText: 'Browse',
      onClick: () => onFilterCategory?.('streak_shield'),
      pulse: activeShieldsCount === 0,
      nodeBg: 'bg-sky-500/15 border-sky-500/40 text-sky-600 dark:text-attr-intelligence',
      nodeRing: 'ring-sky-500/20',
      activeText: 'text-sky-600 dark:text-attr-intelligence',
      accentDot: 'bg-sky-500',
    },
    {
      id: 'inventory',
      label: 'Spoils Acquired',
      badge: totalInventoryCount > 0 ? `${totalInventoryCount} Items` : 'Empty',
      value: totalInventoryCount,
      subtext: 'Gear & custom treats',
      icon: Package,
      color: 'willpower',
      actionText: 'Inspect',
      onClick: onOpenInventory,
      pulse: totalInventoryCount > 0,
      nodeBg: 'bg-violet-500/15 border-violet-500/40 text-violet-600 dark:text-attr-willpower',
      nodeRing: 'ring-violet-500/20',
      activeText: 'text-violet-600 dark:text-attr-willpower',
      accentDot: 'bg-violet-500',
    },
    {
      id: 'goal',
      label: 'Savings Horizon',
      badge: targetItem ? `${targetProgress}% funded` : 'Set Target',
      value: targetItem ? `${targetProgress}%` : '+ Treat',
      subtext: targetItem ? (targetItem.name || targetItem.title || 'Goal') : 'Add custom treat',
      icon: Sparkles,
      color: 'perception',
      actionText: targetItem ? 'View' : 'Forge',
      onClick: targetItem ? () => onFilterCategory?.('custom') : onOpenCreateTreat,
      pulse: targetProgress >= 100,
      nodeBg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
      nodeRing: 'ring-emerald-500/20',
      activeText: 'text-emerald-600 dark:text-emerald-400',
      accentDot: 'bg-emerald-500',
    },
  ];

  return (
    <section className="relative rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-white via-amber-50/40 to-white dark:from-obsidian-900/90 dark:via-obsidian-900/60 dark:to-obsidian-800/80 border border-slate-200/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-2xl overflow-hidden">
      {/* Dynamic Background Energy Beam */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-yellow-400 via-sky-400 to-violet-500 opacity-60 dark:opacity-75" />

      {/* Decorative Continuous Horizon Circuit Track (Desktop) */}
      <div className="hidden lg:block absolute top-[42px] left-12 right-12 h-[2px] bg-gradient-to-r from-amber-500/20 via-yellow-400/20 via-sky-400/20 to-violet-500/20 pointer-events-none -z-0" />

      {/* Ribbon Header bar */}
      <div className="relative z-10 flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span className="text-[11px] font-mono uppercase tracking-widest text-slate-700 dark:text-ink-muted font-bold">
            Vault Telemetry & Spoils Horizon
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500 dark:text-ink-muted hidden sm:inline">
            Status: <strong className="text-amber-600 dark:text-gold">{wealthTier}</strong>
          </span>
        </div>
      </div>

      {/* 4 Connected Horizon Telemetry Stations */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stations.map((st) => {
          const Icon = st.icon;
          return (
            <motion.div
              key={st.id}
              whileHover={{ y: -2 }}
              transition={spring.snappy}
              onClick={st.onClick}
              className={clsx(
                'group relative flex flex-col justify-between p-3 sm:p-3.5 rounded-2xl cursor-pointer select-none',
                'bg-white/90 dark:bg-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.07]',
                'border border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20',
                'transition-all duration-200 shadow-xs'
              )}
            >
              {/* Top Row: Waypoint Node + Badge */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div
                  className={clsx(
                    'relative w-8 h-8 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs',
                    st.nodeBg,
                    st.pulse && 'ring-2',
                    st.nodeRing
                  )}
                >
                  <Icon size={16} />
                  {/* Subtle pulsing accent dot */}
                  <span
                    className={clsx(
                      'absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-obsidian-950',
                      st.accentDot
                    )}
                  />
                </div>

                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-ink-muted border border-slate-200/80 dark:border-white/10 truncate max-w-[110px]">
                  {st.badge}
                </span>
              </div>

              {/* Middle: Value & Metric Label */}
              <div>
                <div className="text-xl sm:text-2xl font-extrabold font-display tracking-tight text-slate-900 dark:text-ink leading-tight">
                  {st.value}
                </div>
                <div className="text-[11px] font-semibold text-slate-600 dark:text-ink-muted uppercase tracking-wider font-mono mt-0.5">
                  {st.label}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-ink-muted/80 truncate mt-0.5">
                  {st.subtext}
                </div>
              </div>

              {/* Bottom Quick-Action Link */}
              <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-200/70 dark:border-white/10">
                <span className={clsx('text-[11px] font-bold flex items-center gap-0.5 transition-colors', st.activeText)}>
                  <span>{st.actionText}</span>
                  <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

SpoilsVaultRibbon.propTypes = {
  userGold: PropTypes.number,
  inventory: PropTypes.array,
  shopItems: PropTypes.array,
  onOpenInventory: PropTypes.func,
  onOpenCreateTreat: PropTypes.func,
  onFilterCategory: PropTypes.func,
};
