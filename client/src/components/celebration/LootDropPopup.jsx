import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Gift, X, Sparkles } from 'lucide-react';
import clsx from 'clsx';

import { spring } from '@/lib/motionVariants';
import { LIFEOS_LOOT_DROP_EVENT } from '@/features/celebration/celebrationEvents';
import { ShopItemIcon } from '@/components/shop/shopIcons';

export function LootDropPopup() {
  const [activeItem, setActiveItem] = useState(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    let timer = null;

    const handleLootDrop = (e) => {
      const item = e.detail;
      if (!item) return;

      setActiveItem(item);

      // Auto-dismiss after 4 seconds per specification
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setActiveItem(null);
      }, 4000);
    };

    window.addEventListener(LIFEOS_LOOT_DROP_EVENT, handleLootDrop);
    return () => {
      window.removeEventListener(LIFEOS_LOOT_DROP_EVENT, handleLootDrop);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleDismiss = () => {
    setActiveItem(null);
  };

  return (
    <div
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-sm px-4"
      aria-live="polite"
    >
      <AnimatePresence>
        {activeItem && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -40, scale: 0.95 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -20, scale: 0.95 }}
            transition={spring.bouncy}
            onClick={handleDismiss}
            role="status"
            className={clsx(
              'pointer-events-auto cursor-pointer select-none rounded-2xl p-4 shadow-2xl',
              'bg-obsidian-900/95 border border-gold/40 shadow-gold/20 backdrop-blur-xl',
              'flex items-center gap-3.5'
            )}
          >
            {/* Item Icon */}
            <div className="w-12 h-12 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold shrink-0">
              {activeItem.icon ? (
                <ShopItemIcon icon={activeItem.icon} className="w-6 h-6" />
              ) : (
                <Gift className="w-6 h-6" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1.5 text-gold text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Loot Drop Obtained!</span>
              </div>
              <div className="text-ink font-semibold text-sm truncate mt-0.5">
                {activeItem.name || 'Rare Artifact'}
              </div>
              <div className="text-xs text-ink-muted">
                Auto-added to your Inventory
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              aria-label="Dismiss loot notification"
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-ink-muted hover:text-ink transition-colors rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
