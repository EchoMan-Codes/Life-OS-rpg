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
} from 'lucide-react';
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
import { Button } from '@/components/ui/Button';

const CATEGORIES = [
  { id: 'all', label: 'All Items', icon: ShoppingBag },
  { id: 'custom', label: 'Custom Rewards', icon: Sparkles },
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
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24 md:pb-12 space-y-7">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold shadow-glow">
              <ShoppingBag size={22} />
            </div>
            <div>
              <h1 className="text-display-md text-ink font-semibold">Reward Shop</h1>
              <p className="text-body-sm text-ink-muted">
                Exchange hard-earned gold for custom treats, tactical shields, and legendary gear.
              </p>
            </div>
          </div>
        </div>

        {/* Right side controls: Gold balance, Inventory button, Add Custom button */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Gold Counter Badge */}
          <div
            id="player-gold-counter"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold shadow-glow"
          >
            <Coins size={18} className="animate-pulse text-gold" />
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Gold:
            </span>
            <span className="text-sm font-bold tracking-tight text-gold font-mono">
              {userGold.toLocaleString()}
            </span>
          </div>

          {/* Inventory Drawer Trigger */}
          <Button
            id="open-inventory-btn"
            variant="ghost"
            onClick={() => setIsInventoryOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-obsidian-800/80 border border-glass-border hover:border-glass-border-hover text-ink text-xs font-semibold"
          >
            <Package size={16} className="text-ink-muted" />
            <span>Inventory</span>
            {totalInventoryCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gold/20 text-gold border border-gold/30">
                {totalInventoryCount}
              </span>
            )}
          </Button>

          {/* Create Custom Reward Button */}
          {isAuthenticated && (
            <Button
              id="create-custom-reward-btn"
              variant="primary"
              onClick={() => {
                setEditingItem(null);
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-gold hover:bg-gold/90 text-obsidian font-semibold text-xs px-3.5 py-2 rounded-xl shadow-glow"
            >
              <Plus size={16} />
              <span>Custom Reward</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Unauthenticated State Notice ── */}
      {!isAuthenticated && (
        <div className="p-6 rounded-panel bg-obsidian-800/60 border border-glass-border flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-ink">Sign in to unlock the Reward Shop</h3>
            <p className="text-xs text-ink-muted">
              Create an account or log in to customize your rewards, purchase gear, and protect your streaks.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => window.dispatchEvent(new CustomEvent('lifeos:open-auth'))}
            className="flex items-center gap-2 bg-gold text-obsidian font-semibold text-xs"
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </Button>
        </div>
      )}

      {/* ── Controls: Category Tabs & Search ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-glass-border pb-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
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
                  'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200',
                  isSelected
                    ? 'bg-gold/20 text-gold border border-gold/40 shadow-glow'
                    : 'text-ink-muted hover:text-ink hover:bg-white/5 border border-transparent'
                )}
              >
                <Icon size={15} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rewards..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-obsidian-900/90 border border-glass-border text-ink placeholder:text-ink-muted/50 focus:border-gold focus:outline-none text-xs transition-colors"
          />
        </div>
      </div>

      {/* ── Shop Grid Content ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-panel bg-obsidian-800/40 border border-glass-border/40 animate-pulse p-5"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="p-12 text-center text-body-sm text-attr-strength border border-dashed border-attr-strength/30 rounded-panel bg-attr-strength/5">
          Failed to load shop items. Please refresh or try again later.
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center space-y-3 border border-dashed border-glass-border rounded-panel bg-obsidian-900/40">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-glass-border flex items-center justify-center text-ink-muted mx-auto">
            <ShoppingBag size={26} />
          </div>
          <h3 className="text-body-md font-semibold text-ink">No reward items found</h3>
          <p className="text-body-sm text-ink-muted max-w-sm mx-auto">
            {searchQuery
              ? 'No items match your search. Try a different keyword.'
              : selectedCategory === 'custom'
              ? 'You have not created any custom rewards yet. Add your favorite treats!'
              : 'There are no items currently available in this category.'}
          </p>
          {selectedCategory === 'custom' && isAuthenticated && (
            <Button
              variant="primary"
              onClick={() => {
                setEditingItem(null);
                setIsCreateModalOpen(true);
              }}
              className="bg-gold text-obsidian text-xs font-semibold mt-2"
            >
              + Create Custom Reward
            </Button>
          )}
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <ShopItemCard
                key={item.id}
                item={item}
                userGold={userGold}
                onInspect={(itm) => setInspectingItem(itm)}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                onQuickBuy={handleQuickBuy}
                isBuying={buyMutation.isPending && buyMutation.variables?.itemId === item.id}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Modals & Drawers ── */}
      <ShopItemModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingItem(null);
        }}
        initialData={editingItem}
      />

      <ItemInspectionModal
        isOpen={Boolean(inspectingItem)}
        onClose={() => setInspectingItem(null)}
        item={inspectingItem}
        userGold={userGold}
      />

      <InventoryDrawer
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
      />
    </div>
  );
}
