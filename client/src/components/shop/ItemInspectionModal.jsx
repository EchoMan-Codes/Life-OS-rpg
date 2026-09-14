import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  X,
  Coins,
  Shield,
  Check,
  AlertCircle,
  Sparkles,
  Package,
} from 'lucide-react';
import clsx from 'clsx';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ShopItemIcon } from './shopIcons';
import { useBuyItem } from '@/features/shop/hooks';
import { useDailies } from '@/features/dailies/hooks';

export function ItemInspectionModal({
  isOpen,
  onClose,
  item = null,
  userGold = 0,
}) {
  const buyMutation = useBuyItem();
  const { data: dailies = [], isLoading: isLoadingDailies } = useDailies();

  const [prevModalKey, setPrevModalKey] = useState({ isOpen: false, itemId: null });
  const [selectedDailyId, setSelectedDailyId] = useState('');
  const [validationError, setValidationError] = useState(null);

  if (prevModalKey.isOpen !== isOpen || prevModalKey.itemId !== item?.id) {
    setPrevModalKey({ isOpen, itemId: item?.id });
    setValidationError(null);
    if (item?.reward_type === 'streak_shield') {
      const eligible = dailies.find((d) => (d.streak_shield_charges || 0) < 3);
      setSelectedDailyId(eligible ? eligible.id : '');
    } else {
      setSelectedDailyId('');
    }
  }

  if (!item) return null;

  const title = item.name || item.title || 'Untitled Reward';
  const costGold = item.costGold ?? item.cost_gold ?? 0;
  const rewardType = item.type || item.reward_type || 'custom';
  const icon = item.icon || 'gift';

  const isAffordable = userGold >= costGold;
  const isOwnedEquipment = rewardType === 'equipment' && Boolean(item.owned);
  const isStreakShield = rewardType === 'streak_shield';

  // Check selected daily charges
  const targetDaily = dailies.find((d) => d.id === selectedDailyId);
  const targetDailyCharges = targetDaily ? (targetDaily.streak_shield_charges || 0) : 0;
  const isTargetDailyMaxed = targetDailyCharges >= 3;

  const handlePurchase = async () => {
    setValidationError(null);

    if (!isAffordable) {
      setValidationError(`Insufficient gold. You need ${costGold - userGold} more gold.`);
      return;
    }

    if (isOwnedEquipment) {
      setValidationError('You already own this equipment.');
      return;
    }

    if (isStreakShield) {
      if (!selectedDailyId) {
        setValidationError('Please select an active daily ritual to protect.');
        return;
      }
      if (isTargetDailyMaxed) {
        setValidationError('This daily already has the maximum of 3 shield charges.');
        return;
      }
    }

    try {
      await buyMutation.mutateAsync({
        itemId: item.id,
        dailyId: isStreakShield ? selectedDailyId : undefined,
        item,
      });
      onClose();
    } catch (err) {
      setValidationError(err?.response?.data?.error?.message || 'Failed to complete purchase.');
    }
  };

  const isPending = buyMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-glass-border">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'w-14 h-14 rounded-2xl flex items-center justify-center border transition-all',
              isStreakShield
                ? 'bg-attr-intelligence/15 border-attr-intelligence/30 text-attr-intelligence shadow-[0_0_20px_-3px_rgba(56,189,248,0.35)]'
                : rewardType === 'equipment'
                ? 'bg-attr-willpower/15 border-attr-willpower/30 text-attr-willpower shadow-[0_0_20px_-3px_rgba(167,139,250,0.35)]'
                : 'bg-gold/15 border-gold/30 text-gold shadow-[0_0_20px_-3px_rgba(234,179,8,0.3)]'
            )}
          >
            <ShopItemIcon icon={icon} type={rewardType} size={28} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={clsx(
                  'text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border',
                  isStreakShield
                    ? 'bg-attr-intelligence/10 border-attr-intelligence/25 text-attr-intelligence'
                    : rewardType === 'equipment'
                    ? 'bg-attr-willpower/10 border-attr-willpower/25 text-attr-willpower'
                    : 'bg-gold/10 border-gold/25 text-gold'
                )}
              >
                {isStreakShield ? 'Streak Shield' : rewardType === 'equipment' ? 'Equipment' : 'Custom Reward'}
              </span>

              {isOwnedEquipment && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-attr-vitality bg-attr-vitality/10 border border-attr-vitality/20 px-2 py-0.5 rounded-full">
                  <Check size={10} /> Owned
                </span>
              )}
            </div>

            <h2 className="text-display-xs text-ink font-semibold mt-1">
              {title}
            </h2>
          </div>
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

      {/* Description & Lore */}
      <div className="py-4 space-y-4">
        <p className="text-sm text-ink-muted leading-relaxed">
          {item.description || 'No description provided for this reward item.'}
        </p>

        {/* Streak Shield Configuration */}
        {isStreakShield && (
          <div className="p-3.5 rounded-xl bg-obsidian-900/80 border border-attr-intelligence/20 space-y-2.5">
            <div className="flex items-center gap-2 text-attr-intelligence text-xs font-semibold">
              <Shield size={16} />
              <span>Target Daily Ritual (Max 3 Charges)</span>
            </div>

            <p className="text-xs text-ink-muted">
              Select which daily ritual will receive this shield. A shield automatically absorbs one missed day to preserve your streak.
            </p>

            {isLoadingDailies ? (
              <p className="text-xs text-ink-muted">Loading your daily rituals...</p>
            ) : dailies.length === 0 ? (
              <div className="p-2.5 rounded-lg bg-attr-strength/10 border border-attr-strength/25 text-xs text-attr-strength flex items-center gap-2">
                <AlertCircle size={15} />
                <span>You have no active dailies. Create a daily ritual first!</span>
              </div>
            ) : (
              <select
                value={selectedDailyId}
                onChange={(e) => setSelectedDailyId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-800 border border-glass-border text-ink text-xs focus:border-attr-intelligence focus:outline-none"
              >
                {dailies.map((daily) => {
                  const charges = daily.streak_shield_charges || 0;
                  const isMaxed = charges >= 3;
                  return (
                    <option key={daily.id} value={daily.id} disabled={isMaxed}>
                      {daily.title} — {charges}/3 Charges {isMaxed ? '(MAX)' : ''}
                    </option>
                  );
                })}
              </select>
            )}

            {targetDaily && (
              <div className="flex items-center justify-between text-xs pt-1 text-ink-muted">
                <span>Current Shield Level:</span>
                <div className="flex items-center gap-1 font-semibold text-attr-intelligence">
                  {[...Array(3)].map((_, i) => (
                    <Shield
                      key={i}
                      size={14}
                      className={i < targetDailyCharges ? 'fill-attr-intelligence text-attr-intelligence' : 'text-ink-muted/30'}
                    />
                  ))}
                  <span className="ml-1 text-[11px]">({targetDailyCharges}/3)</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Equipment Note */}
        {rewardType === 'equipment' && (
          <div className="p-3 rounded-xl bg-obsidian-900/60 border border-glass-border flex items-center gap-2.5 text-xs text-ink-muted">
            <Package size={16} className="text-attr-willpower shrink-0" />
            <span>
              Equipment is uniquely forged for your adventurer. You can only acquire one copy.
            </span>
          </div>
        )}

        {/* Custom Item Note */}
        {rewardType === 'custom' && (
          <div className="p-3 rounded-xl bg-obsidian-900/60 border border-glass-border flex items-center gap-2.5 text-xs text-ink-muted">
            <Sparkles size={16} className="text-gold shrink-0" />
            <span>
              Purchased custom rewards are stored in your inventory and stack indefinitely.
            </span>
          </div>
        )}

        {/* Validation error display */}
        {validationError && (
          <div className="p-3 rounded-lg bg-attr-strength/10 border border-attr-strength/30 text-xs text-attr-strength flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
      </div>

      {/* Footer: Balance, Cost, and Buy Button */}
      <div className="pt-4 border-t border-glass-border space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-muted">Item Cost:</span>
          <span className="flex items-center gap-1 font-bold text-gold text-sm">
            <Coins size={15} />
            {costGold.toLocaleString()} Gold
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-muted">Your Balance:</span>
          <span
            className={clsx(
              'flex items-center gap-1 font-semibold text-sm',
              isAffordable ? 'text-ink' : 'text-attr-strength'
            )}
          >
            <Coins size={14} className={isAffordable ? 'text-gold' : 'text-attr-strength'} />
            {userGold.toLocaleString()} Gold
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            Close
          </Button>

          {isOwnedEquipment ? (
            <Button type="button" variant="ghost" disabled className="text-ink-muted">
              Already In Inventory
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              disabled={
                isPending ||
                !isAffordable ||
                (isStreakShield && (!selectedDailyId || isTargetDailyMaxed))
              }
              onClick={handlePurchase}
              className={clsx(
                'font-semibold min-w-[130px]',
                isAffordable
                  ? 'bg-gold hover:bg-gold/90 text-obsidian shadow-glow'
                  : 'bg-white/5 text-ink-muted'
              )}
            >
              {isPending ? (
                'Purchasing...'
              ) : !isAffordable ? (
                `Need ${costGold - userGold} Gold`
              ) : isStreakShield ? (
                'Charge Shield'
              ) : (
                'Purchase Reward'
              )}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

ItemInspectionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  item: PropTypes.object,
  userGold: PropTypes.number,
};
