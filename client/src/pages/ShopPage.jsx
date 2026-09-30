import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Plus,
  Coins,
  Package,
  Sparkles,
  Shield,
  Sword,
  Search,
  LogIn,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

import { useAuth } from '@/features/auth/hooks';
import { useCharacter } from '@/features/character/hooks';
import {
  useShopItems,
  useInventory,
  useDeleteShopItem,
  useBuyItem,
} from '@/features/shop/hooks';
import { ShopItemCard } from '@/components/shop/ShopItemCard';
import { ShopItemModal } from '@/components/shop/ShopItemModal';
import { ItemInspectionModal } from '@/components/shop/ItemInspectionModal';
import { InventoryDrawer } from '@/components/shop/InventoryDrawer';
import { spring } from '@/lib/motionVariants';

const CATEGORIES = [
  { id: 'all', label: 'All Items', icon: ShoppingBag },
  { id: 'custom', label: 'Custom Treats', icon: Sparkles },
  { id: 'equipment', label: 'Equipment', icon: Sword },
  { id: 'streak_shield', label: 'Streak Shields', icon: Shield },
];

export default function ShopPage() {
  const { isAuthenticated } = useAuth();
  const { data: character } = useCharacter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [inspectingItem, setInspectingItem] = useState(null);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  // Queries & Mutations
  const { data: shopItems = [], isLoading, isError } = useShopItems({
    category: selectedCategory,
  });
  const { data: inventory = [] } = useInventory();
  const deleteMutation = useDeleteShopItem();
  const buyMutation = useBuyItem();

  const userGold = character?.gold ?? 0;
  const totalInventoryCount = inventory.reduce((sum, i) => sum + (i.quantity || 1), 0);

  // Filtered by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return shopItems;
    const q = searchQuery.toLowerCase();
    return shopItems.filter((item) => {
      const title = (item.name || item.title || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }, [shopItems, searchQuery]);

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (item) => {
    const title = item.name || item.title || 'this reward';
    if (window.confirm(`Are you sure you want to remove "${title}" from the shop?`)) {
      await deleteMutation.mutateAsync(item.id);
    }
  };

  const handleQuickBuy = async (item) => {
    await buyMutation.mutateAsync({
      itemId: item.id,
      item,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* ── 1. Glassy iOS Cockpit Header (Radiant Gold Theme) ── */}
      <section className="relative rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-obsidian-900/85 via-obsidian-900/65 to-obsidian-800/75 border border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-2xl overflow-hidden">
        {/* Ambient golden atmospheric glow */}
        <div className="absolute -top-24 -left-20 w-80 h-80 bg-gold/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/25 text-gold text-xs font-mono font-semibold">
              <Coins size={13} className="text-gold" />
              <span>THE EMPORIUM • HARD-WON SPOILS</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-display">
              Reward Shop & Vault
            </h1>

            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-xl">
              Spend gold earned from dailies and quests. Unlock custom real-world rewards, tactical streak shields, and RPG equipment.
            </p>
          </div>

          {/* Right side controls: Gold balance, Inventory button, Add Custom button */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Gold Counter Frosted Capsule */}
            <div
              id="player-gold-counter"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gold/15 border border-gold/30 text-gold shadow-[0_0_20px_rgba(234,179,8,0.15)] backdrop-blur-md"
            >
              <Coins size={18} className="animate-pulse text-gold" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                Balance:
              </span>
              <span className="text-base font-bold font-mono text-gold">
                {userGold.toLocaleString()} GP
              </span>
            </div>

            {/* Inventory Drawer Trigger */}
            <motion.button
              id="open-inventory-btn"
              type="button"
              onClick={() => setIsInventoryOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-ink text-xs font-semibold backdrop-blur-md transition-all min-h-[44px]"
            >
              <Package size={16} className="text-ink-muted" />
              <span>Inventory</span>
              {totalInventoryCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gold/20 text-gold border border-gold/30">
                  {totalInventoryCount}
                </span>
              )}
            </motion.button>

            {/* Create Custom Reward Button */}
            {isAuthenticated && (
              <motion.button
                id="create-custom-reward-btn"
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setIsCreateModalOpen(true);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-gold to-amber-500 text-obsidian font-bold text-xs shadow-[0_8px_24px_rgba(234,179,8,0.35)] transition-all min-h-[44px]"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Custom Treat</span>
              </motion.button>
            )}
          </div>
        </div>
      </section>

      {/* ── Unauthenticated State Notice ── */}
      {!isAuthenticated && (
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-ink">Sign in to unlock the Reward Vault</h3>
            <p className="text-xs text-ink-muted">
              Create an account or sign in to purchase rewards, store equipment, and protect your habits with shields.
            </p>
          </div>
          <Link
            to="/login"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-obsidian font-bold text-xs hover:bg-gold/90 transition-all shadow-md min-h-[42px]"
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </Link>
        </div>
      )}

      {/* ── Controls: Category Tabs & Search (iOS Capsule) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Tabs Capsule */}
        <div className="p-1 rounded-full bg-obsidian-900/80 border border-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] backdrop-blur-md flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                id={`shop-tab-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200',
                  isSelected
                    ? 'bg-gold text-obsidian shadow-sm'
                    : 'text-ink-muted hover:text-ink hover:bg-white/5'
                )}
              >
                <Icon size={14} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar (iOS Frosted Input) */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vault rewards..."
            className="w-full pl-9 pr-3.5 py-2 rounded-2xl bg-white/[0.03] border border-white/10 text-ink placeholder:text-ink-muted/50 focus:border-gold focus:outline-none text-xs transition-colors backdrop-blur-md"
          />
        </div>
      </div>

      {/* ── Shop Grid Content ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-3xl bg-white/[0.02] border border-white/10 animate-pulse p-5"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-xs text-red-400 border border-red-500/20 rounded-2xl bg-red-500/10">
          Failed to load shop items. Please verify your connection.
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-lg space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
            <ShoppingBag size={24} />
          </div>
          <h3 className="text-lg font-bold text-ink">No spoils discovered</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? `No items match "${searchQuery}". Clear your search query.`
              : 'Add your first personal treat reward to incentivize your hard work.'}
          </p>
          {isAuthenticated && (
            <motion.button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setIsCreateModalOpen(true);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-5 py-2.5 rounded-xl bg-gold text-obsidian font-bold text-xs hover:bg-gold/90 transition-all shadow-md inline-flex items-center gap-1.5 mt-2"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Forge First Treat</span>
            </motion.button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={spring.ios}
              >
                <ShopItemCard
                  item={item}
                  userGold={userGold}
                  onInspect={() => setInspectingItem(item)}
                  onEdit={() => handleOpenEdit(item)}
                  onDelete={() => handleDelete(item)}
                  onQuickBuy={() => handleQuickBuy(item)}
                  isBuying={buyMutation.isPending && buyMutation.variables?.itemId === item.id}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Modals & Drawers ── */}
      <ShopItemModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        itemToEdit={editingItem}
      />

      <ItemInspectionModal
        item={inspectingItem}
        userGold={userGold}
        onClose={() => setInspectingItem(null)}
        onBuy={(item) => handleQuickBuy(item)}
        isBuying={buyMutation.isPending}
      />

      <InventoryDrawer
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
      />
    </div>
  );
}
