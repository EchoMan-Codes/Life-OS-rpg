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
        'bg-obsidian-800/80 backdrop-blur-glass border rounded-panel p-5',
        'transition-colors duration-200',
        isOwnedEquipment
          ? 'border-glass-border/50 opacity-80'
          : 'border-glass-border hover:border-glass-border-hover'
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
            <h3 className="text-display-xs text-ink font-semibold group-hover:text-gold transition-colors line-clamp-1">
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
              className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-white/5 transition-colors"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-8 z-30 w-32 bg-obsidian-900 border border-glass-border rounded-xl shadow-glow py-1 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(item);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-ink hover:bg-white/5 transition-colors text-left"
                  >
                    <Edit2 size={13} className="text-ink-muted" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(item);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-attr-strength hover:bg-attr-strength/10 transition-colors text-left"
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
      <p className="text-xs text-ink-muted mt-3 mb-4 line-clamp-2 min-h-[32px]">
        {item.description || 'No description provided.'}
      </p>

      {/* Bottom row: Gold Cost and Action Button */}
      <div className="flex items-center justify-between pt-3 border-t border-glass-border mt-auto">
        {/* Cost pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/10 border border-gold/25 text-gold font-medium text-xs">
          <Coins size={14} className="animate-pulse" />
          <span>{costGold.toLocaleString()} Gold</span>
        </div>

        {/* Action button */}
        <div data-stop-propagation>
          {isOwnedEquipment ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted px-3 py-1.5 rounded-lg bg-white/5 border border-glass-border">
              <Check size={14} className="text-attr-vitality" />
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
                  ? 'bg-gold/20 hover:bg-gold/30 text-gold border border-gold/40 hover:border-gold shadow-glow'
                  : 'bg-white/5 text-ink-muted border border-glass-border hover:bg-white/10'
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
