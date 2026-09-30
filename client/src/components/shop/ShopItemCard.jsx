import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Coins, Check, MoreVertical, Edit2, Trash2 } from 'lucide-react';

import { spring, pressable } from '@/lib/motionVariants';
import { ShopItemIcon } from './shopIcons';

const CATEGORY_STYLES = {
  streak_shield: {
    label: 'Streak Shield',
    border: 'border-attr-intelligence/30',
    bg: 'bg-attr-intelligence/10',
    text: 'text-attr-intelligence',
    glow: 'shadow-[0_0_15px_-3px_rgba(56,189,248,0.3)]',
  },
  equipment: {
    label: 'Equipment',
    border: 'border-attr-willpower/30',
    bg: 'bg-attr-willpower/10',
    text: 'text-attr-willpower',
    glow: 'shadow-[0_0_15px_-3px_rgba(167,139,250,0.3)]',
  },
  custom: {
    label: 'Custom Reward',
    border: 'border-gold/30',
    bg: 'bg-gold/10',
    text: 'text-gold',
    glow: 'shadow-[0_0_15px_-3px_rgba(234,179,8,0.25)]',
  },
};

export function ShopItemCard({
  item,
  userGold = 0,
  onInspect,
  onEdit,
  onDelete,
  onQuickBuy,
  isBuying = false,
}) {
  const shouldReduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);

  const title = item.name || item.title || 'Untitled Reward';
  const costGold = item.costGold ?? item.cost_gold ?? 0;
  const rewardType = item.type || item.reward_type || 'custom';
  const icon = item.icon || 'gift';

  const isAffordable = userGold >= costGold;
  const isOwnedEquipment = rewardType === 'equipment' && Boolean(item.owned);
  const isCustom = rewardType === 'custom';

  const categoryStyle = CATEGORY_STYLES[rewardType] || CATEGORY_STYLES.custom;

  const handleCardClick = (e) => {
    // If clicking menu or actions, don't trigger inspect
    if (e.target.closest('[data-stop-propagation]')) return;
    onInspect({ ...item, name: title, title, costGold, cost_gold: costGold, type: rewardType, reward_type: rewardType, icon });
  };

  return (
    <motion.div
      layout
      whileHover={shouldReduceMotion ? {} : { y: -3, transition: spring.snappy }}
      onClick={handleCardClick}
      className={clsx(
        'group relative flex flex-col justify-between cursor-pointer',
        'bg-white/90 border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:bg-obsidian-800/80 dark:border-glass-border dark:shadow-none backdrop-blur-glass rounded-panel p-5',
        'transition-colors duration-200',
        isOwnedEquipment
          ? 'border-slate-200/50 dark:border-glass-border/50 opacity-80'
          : 'border-slate-200/90 hover:border-slate-300 dark:border-glass-border dark:hover:border-glass-border-hover'
      )}
    >
      {/* Top row: Icon, Category badge, Custom action menu */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-200',
              categoryStyle.border,
              categoryStyle.bg,
              categoryStyle.glow
            )}
          >
            <ShopItemIcon
              icon={icon}
              type={rewardType}
              size={24}
              className={categoryStyle.text}
            />
          </div>

          <div>
            <span
              className={clsx(
                'inline-block text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border mb-1',
                categoryStyle.border,
                categoryStyle.bg,
                categoryStyle.text
              )}
            >
              {categoryStyle.label}
            </span>
            <h3 className="text-display-xs text-slate-900 dark:text-ink font-semibold group-hover:text-amber-600 dark:group-hover:text-gold transition-colors line-clamp-1">
              {title}
            </h3>
          </div>
        </div>

        {/* Custom item edit/delete actions */}
        {isCustom && (
          <div className="relative" data-stop-propagation>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Item actions"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:text-ink-muted dark:hover:text-ink hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-8 z-30 w-32 bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-glass-border rounded-xl shadow-xl py-1 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(item);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-800 dark:text-ink hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-left"
                  >
                    <Edit2 size={13} className="text-slate-400 dark:text-ink-muted" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(item);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-600 dark:text-attr-strength hover:bg-rose-50 dark:hover:bg-attr-strength/10 transition-colors text-left"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Item description */}
      <p className="text-xs text-slate-600 dark:text-ink-muted mt-3 mb-4 line-clamp-2 min-h-[32px]">
        {item.description || 'No description provided.'}
      </p>

      {/* Bottom row: Gold Cost and Action Button */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 dark:border-glass-border mt-auto">
        {/* Cost pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:bg-gold/10 dark:border-gold/25 dark:text-gold font-medium text-xs">
          <Coins size={14} className="animate-pulse text-amber-500 dark:text-gold" />
          <span>{costGold.toLocaleString()} Gold</span>
        </div>

        {/* Action button */}
        <div data-stop-propagation>
          {isOwnedEquipment ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-ink-muted px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-glass-border">
              <Check size={14} className="text-emerald-600 dark:text-attr-vitality" />
              Owned
            </span>
          ) : (
            <motion.button
              type="button"
              variants={pressable}
              initial="rest"
              whileTap="tap"
              disabled={isBuying || (!isAffordable && rewardType !== 'streak_shield')}
              onClick={() => {
                if (rewardType === 'streak_shield') {
                  // Streak shield requires picking target daily -> open modal
                  onInspect({ ...item, name: title, title, costGold, cost_gold: costGold, type: rewardType, reward_type: rewardType, icon });
                } else if (isAffordable) {
                  onQuickBuy({ ...item, name: title, title, costGold, cost_gold: costGold, type: rewardType, reward_type: rewardType, icon });
                } else {
                  onInspect({ ...item, name: title, title, costGold, cost_gold: costGold, type: rewardType, reward_type: rewardType, icon });
                }
              }}
              className={clsx(
                'inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all',
                isAffordable
                  ? 'bg-amber-500 hover:bg-amber-600 text-white dark:bg-gold/20 dark:hover:bg-gold/30 dark:text-gold border border-amber-500 dark:border-gold/40 shadow-xs'
                  : 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-ink-muted border border-slate-200 dark:border-glass-border hover:bg-slate-200/60 dark:hover:bg-white/10'
              )}
            >
              {isBuying ? (
                <span>Buying...</span>
              ) : rewardType === 'streak_shield' ? (
                <span>Charge Shield</span>
              ) : isAffordable ? (
                <>
                  <Coins size={13} />
                  Buy
                </>
              ) : (
                <span>Need {costGold - userGold} Gold</span>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

ShopItemCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    reward_type: PropTypes.oneOf(['custom', 'equipment', 'streak_shield']).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    cost_gold: PropTypes.number.isRequired,
    icon: PropTypes.string,
    owned: PropTypes.bool,
    isAffordable: PropTypes.bool,
  }).isRequired,
  userGold: PropTypes.number,
  onInspect: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onQuickBuy: PropTypes.func.isRequired,
  isBuying: PropTypes.bool,
};
