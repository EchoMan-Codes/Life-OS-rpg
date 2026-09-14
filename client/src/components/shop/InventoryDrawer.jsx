import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';
import { X, Package, Check } from 'lucide-react';
import clsx from 'clsx';

import { useInventory } from '@/features/shop/hooks';
import { ShopItemIcon } from './shopIcons';
import { useToast } from '@/components/ui/useToast';
import { useSound } from '@/lib/sound';

export function InventoryDrawer({ isOpen, onClose }) {
  const shouldReduceMotion = useReducedMotion();
  const { data: inventory = [], isLoading } = useInventory();
  const { showToast } = useToast();
  const playRedeemSound = useSound('quest_item_complete');

  const [activeFilter, setActiveFilter] = useState('all');

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const filteredItems = inventory.filter((inv) => {
    const item = inv.item || inv;
    if (!item) return false;
    if (activeFilter === 'all') return true;
    const invType = item.type || item.reward_type || 'custom';
    return invType === activeFilter;
  });

  const totalItemCount = inventory.reduce((sum, inv) => sum + (inv.quantity || 1), 0);

  const handleRedeemCustom = (invItem) => {
    playRedeemSound();
    const item = invItem.item || invItem;
    const itemName = item.name || item.title || 'Reward';
    showToast({
      title: 'Reward Redeemed!',
      message: `Enjoy your reward: ${itemName}! Well earned, adventurer.`,
      type: 'success',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer Container */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { x: '100%' }}
              animate={shouldReduceMotion ? { opacity: 1 } : { x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { x: '100%' }}
              transition={
                shouldReduceMotion
                  ? { duration: 0.1 }
                  : { type: 'spring', damping: 28, stiffness: 280 }
              }
              className={clsx(
                'w-screen max-w-md',
                'bg-obsidian-900 border-l border-glass-border',
                'flex flex-col shadow-2xl overflow-hidden'
              )}
            >
              {/* Header */}
              <div className="p-5 border-b border-glass-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold shadow-glow">
                    <Package size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-display-xs text-ink font-semibold">
                        Adventurer&apos;s Inventory
                      </h2>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-ink border border-glass-border">
                        {totalItemCount}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted">
                      Purchased gear, active shields, and custom treats
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close inventory"
                  className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-white/5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="px-5 pt-3 pb-2 border-b border-glass-border/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'All Items' },
                  { id: 'equipment', label: 'Equipment' },
                  { id: 'streak_shield', label: 'Shields' },
                  { id: 'custom', label: 'Custom' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id)}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
                      activeFilter === tab.id
                        ? 'bg-gold/20 text-gold border border-gold/40 shadow-glow'
                        : 'text-ink-muted hover:text-ink hover:bg-white/5'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
                {isLoading ? (
                  <div className="py-12 text-center text-ink-muted text-sm animate-pulse">
                    Loading inventory...
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-glass-border flex items-center justify-center text-ink-muted mx-auto">
                      <Package size={26} />
                    </div>
                    <h3 className="text-sm font-semibold text-ink">
                      {activeFilter === 'all'
                        ? 'Your pack is empty'
                        : `No ${activeFilter} items found`}
                    </h3>
                    <p className="text-xs text-ink-muted max-w-xs mx-auto">
                      Visit the Reward Shop to exchange your hard-earned gold for treats, shields, and equipment.
                    </p>
                  </div>
                ) : (
                  filteredItems.map((inv) => {
                    const item = inv.item || inv;
                    const invTitle = item.name || item.title || 'Reward';
                    const invType = item.type || item.reward_type || 'custom';
                    const isShield = invType === 'streak_shield';
                    const isEquipment = invType === 'equipment';
                    const isCustom = invType === 'custom';

                    return (
                      <div
                        key={inv.id}
                        className="p-4 rounded-xl bg-obsidian-800/80 border border-glass-border hover:border-glass-border-hover transition-colors flex items-start justify-between gap-3.5"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={clsx(
                              'w-11 h-11 rounded-xl flex items-center justify-center border shrink-0',
                              isShield
                                ? 'bg-attr-intelligence/15 border-attr-intelligence/30 text-attr-intelligence'
                                : isEquipment
                                ? 'bg-attr-willpower/15 border-attr-willpower/30 text-attr-willpower'
                                : 'bg-gold/15 border-gold/30 text-gold'
                            )}
                          >
                            <ShopItemIcon icon={item.icon} type={invType} size={22} />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-ink">
                                {invTitle}
                              </h4>
                              {inv.quantity > 1 && (
                                <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-md bg-gold/20 text-gold border border-gold/30">
                                  x{inv.quantity}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-ink-muted line-clamp-2 mt-1">
                              {item.description || 'Adventurer reward item.'}
                            </p>

                            <div className="flex items-center gap-2 mt-2">
                              <span
                                className={clsx(
                                  'text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border',
                                  isShield
                                    ? 'bg-attr-intelligence/10 border-attr-intelligence/20 text-attr-intelligence'
                                    : isEquipment
                                    ? 'bg-attr-willpower/10 border-attr-willpower/20 text-attr-willpower'
                                    : 'bg-gold/10 border-gold/20 text-gold'
                                )}
                              >
                                {isShield ? 'Shield' : isEquipment ? 'Equipment' : 'Custom Treat'}
                              </span>

                              {isEquipment && (
                                <span className="text-[10px] text-attr-vitality flex items-center gap-0.5">
                                  <Check size={12} /> Owned
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Custom Redeem Button */}
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => handleRedeemCustom(inv)}
                            className="shrink-0 px-2.5 py-1.5 rounded-lg bg-gold/15 hover:bg-gold/25 border border-gold/30 text-gold text-xs font-semibold transition-colors shadow-glow"
                          >
                            Redeem
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-glass-border bg-obsidian-900/90 text-center text-xs text-ink-muted">
                <span>Items stay in your inventory until redeemed or active.</span>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

InventoryDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
