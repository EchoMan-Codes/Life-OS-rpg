import { useState } from 'react';
import PropTypes from 'prop-types';
import { X, Sparkles, Coins } from 'lucide-react';
import clsx from 'clsx';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { JeevanLoader } from '@/components/ui/JeevanLoader';
import { useJeevanTransition } from '@/context/JeevanTransitionContext';
import { ShopItemIcon } from './shopIcons';
import { useCreateShopItem, useUpdateShopItem } from '@/features/shop/hooks';

const ICON_PRESETS = [
  { id: 'coffee', label: 'Coffee' },
  { id: 'pizza', label: 'Pizza' },
  { id: 'gamepad', label: 'Gaming' },
  { id: 'film', label: 'Movie' },
  { id: 'music', label: 'Music' },
  { id: 'tv', label: 'Show' },
  { id: 'book', label: 'Reading' },
  { id: 'gift', label: 'Gift' },
  { id: 'sparkles', label: 'Treat' },
  { id: 'trophy', label: 'Trophy' },
];

export function ShopItemModal({ isOpen, onClose, initialData = null }) {
  const isEditing = Boolean(initialData);
  const createMutation = useCreateShopItem();
  const updateMutation = useUpdateShopItem();
  const { triggerTransition } = useJeevanTransition();

  const [prevSnapshot, setPrevSnapshot] = useState({ isOpen: false, initialData: null });
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [costGold, setCostGold] = useState(50);
  const [icon, setIcon] = useState('gift');
  const [error, setError] = useState(null);

  if (prevSnapshot.isOpen !== isOpen || prevSnapshot.initialData !== initialData) {
    setPrevSnapshot({ isOpen, initialData });
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setCostGold(initialData.cost_gold || 50);
      setIcon(initialData.icon || 'gift');
    } else {
      setTitle('');
      setDescription('');
      setCostGold(50);
      setIcon('gift');
    }
    setError(null);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Title is required');
      return;
    }

    const goldValue = parseInt(costGold, 10);
    if (Number.isNaN(goldValue) || goldValue <= 0) {
      setError('Gold cost must be a positive number');
      return;
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          itemId: initialData.id,
          data: {
            title: trimmedTitle,
            description: description.trim() || undefined,
            cost_gold: goldValue,
            icon,
          },
        });
      } else {
        await createMutation.mutateAsync({
          title: trimmedTitle,
          description: description.trim() || undefined,
          cost_gold: goldValue,
          icon,
        });
      }
      onClose();
      triggerTransition({
        variant: 'medium',
        message: isEditing ? 'Updating Reward...' : 'Stocking New Reward...',
        submessage: 'Jeevan Reward Shop',
        duration: 750,
      });
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to save reward item');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex items-center justify-between pb-4 border-b border-glass-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
            <Sparkles size={18} />
          </div>
          <h2 className="text-display-xs text-ink font-semibold">
            {isEditing ? 'Edit Custom Reward' : 'Create Custom Reward'}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-white/5 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {error && (
          <div className="p-3 text-xs text-attr-strength bg-attr-strength/10 border border-attr-strength/30 rounded-lg">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">
            Reward Title <span className="text-attr-strength">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 1 Hour Video Game Break"
            className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-ink placeholder:text-ink-muted/40 focus:border-white/30 focus:bg-white/[0.07] focus:ring-2 focus:ring-white/10 backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] focus:outline-none text-sm transition-all"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">
            Description
          </label>
          <textarea
            maxLength={500}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Treat yourself after conquering your quests..."
            className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-ink placeholder:text-ink-muted/40 focus:border-white/30 focus:bg-white/[0.07] focus:ring-2 focus:ring-white/10 backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] focus:outline-none text-sm transition-all resize-none"
          />
        </div>

        {/* Gold Cost */}
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">
            Cost in Gold <span className="text-attr-strength">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              required
              min={1}
              max={1000000}
              value={costGold}
              onChange={(e) => setCostGold(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-ink focus:border-white/30 focus:bg-white/[0.07] focus:ring-2 focus:ring-white/10 backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] focus:outline-none text-sm transition-all"
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold">
              <Coins size={16} />
            </div>
          </div>
        </div>

        {/* Icon Preset Picker */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
            Choose Icon
          </label>
          <div className="grid grid-cols-5 gap-2 pt-1">
            {ICON_PRESETS.map((preset) => {
              const isSelected = icon === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setIcon(preset.id)}
                  className={clsx(
                    'flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all',
                    isSelected
                      ? 'bg-gold/20 border-gold text-gold shadow-glow'
                      : 'bg-obsidian-900/50 border-glass-border text-ink-muted hover:text-ink hover:border-glass-border-hover'
                  )}
                >
                  <ShopItemIcon icon={preset.id} size={20} />
                  <span className="text-[10px] mt-1 truncate max-w-full">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-glass-border">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isPending}
            className="bg-gold hover:bg-gold/90 text-obsidian font-semibold inline-flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <JeevanLoader variant="micro" />
                <span>Saving...</span>
              </>
            ) : isEditing ? (
              'Update Reward'
            ) : (
              'Create Reward'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

ShopItemModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.object,
};
