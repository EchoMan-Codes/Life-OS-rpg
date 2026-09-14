import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useToast } from '@/components/ui/useToast';
import { useAuth } from '@/features/auth/hooks';
import { useSound } from '@/lib/sound';
import { spawnFloatingText } from '@/features/character/floatingText';
import {
  fetchShopItems,
  fetchShopItem,
  createShopItem,
  updateShopItem,
  archiveShopItem,
  buyShopItem,
  fetchInventory,
} from './api';

export const SHOP_ITEMS_QUERY_KEY = ['shop-items'];
export const INVENTORY_QUERY_KEY = ['inventory'];

/**
 * Hook to retrieve shop items.
 *
 * @param {object} [options]
 * @param {'all' | 'custom' | 'equipment' | 'streak_shield'} [options.category='all']
 */
export function useShopItems({ category = 'all' } = {}) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['shop-items', { category }],
    queryFn: () => fetchShopItems({ category }),
    staleTime: 15 * 1000,
    enabled: isAuthenticated,
  });
}

/**
 * Hook to retrieve a single shop item.
 *
 * @param {string} itemId
 */
export function useShopItem(itemId) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['shop-items', itemId],
    queryFn: () => fetchShopItem(itemId),
    enabled: isAuthenticated && Boolean(itemId),
  });
}

/**
 * Hook to retrieve inventory items.
 */
export function useInventory() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: INVENTORY_QUERY_KEY,
    queryFn: fetchInventory,
    staleTime: 15 * 1000,
    enabled: isAuthenticated,
  });
}

/**
 * Hook to buy a shop item with optimistic gold deduction and audio feedback.
 */
export function useBuyItem() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const playPurchaseSound = useSound('shop_purchase');
  const playInsufficientGoldSound = useSound('shop_insufficient_gold');

  return useMutation({
    mutationFn: ({ itemId, dailyId }) => buyShopItem(itemId, { dailyId }),
    onMutate: async ({ item }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['character'] });
      const previousCharacter = queryClient.getQueryData(['character']);

      // Optimistic update if character data is available
      if (previousCharacter && typeof previousCharacter.gold === 'number' && item?.cost_gold) {
        queryClient.setQueryData(['character'], {
          ...previousCharacter,
          gold: Math.max(0, previousCharacter.gold - item.cost_gold),
        });
      }

      return { previousCharacter };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic gold update
      if (context?.previousCharacter) {
        queryClient.setQueryData(['character'], context.previousCharacter);
      }

      const status = err?.response?.status;
      const errorCode = err?.response?.data?.error?.code;
      const message = err?.response?.data?.error?.message || 'Failed to purchase item.';

      if (status === 402 || errorCode === 'INSUFFICIENT_GOLD') {
        playInsufficientGoldSound();
        showToast({
          title: 'Insufficient Gold',
          message: 'You need more gold to purchase this item. Complete more habits and quests!',
          type: 'error',
        });
      } else {
        showToast({
          title: 'Purchase Failed',
          message,
          type: 'error',
        });
      }
    },
    onSuccess: (data, variables) => {
      playPurchaseSound();

      const cost = variables?.item?.cost_gold;
      if (cost) {
        spawnFloatingText(`-${cost} Gold`, 'gold');
      }

      // Invalidate queries so fresh balances and inventory reflect instantly
      queryClient.invalidateQueries({ queryKey: ['character'] });
      queryClient.invalidateQueries({ queryKey: SHOP_ITEMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY });
      if (variables?.dailyId) {
        queryClient.invalidateQueries({ queryKey: ['dailies'] });
      }

      showToast({
        title: 'Item Purchased!',
        message: `${data?.item?.title || 'Reward'} has been added to your inventory.`,
        type: 'success',
      });
    },
  });
}

/**
 * Hook to create a custom reward shop item.
 */
export function useCreateShopItem() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data) => createShopItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHOP_ITEMS_QUERY_KEY });
      showToast({
        title: 'Reward Created',
        message: 'Your custom reward has been added to the shop.',
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Creation Failed',
        message: err?.response?.data?.error?.message || 'Failed to create reward item.',
        type: 'error',
      });
    },
  });
}

/**
 * Hook to update a custom reward shop item.
 */
export function useUpdateShopItem() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ itemId, data }) => updateShopItem(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHOP_ITEMS_QUERY_KEY });
      showToast({
        title: 'Reward Updated',
        message: 'Your custom reward has been successfully updated.',
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Update Failed',
        message: err?.response?.data?.error?.message || 'Failed to update reward item.',
        type: 'error',
      });
    },
  });
}

/**
 * Hook to archive / delete a custom reward shop item.
 */
export function useDeleteShopItem() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (itemId) => archiveShopItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHOP_ITEMS_QUERY_KEY });
      showToast({
        title: 'Reward Removed',
        message: 'The reward item was removed from the shop.',
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Deletion Failed',
        message: err?.response?.data?.error?.message || 'Failed to delete reward item.',
        type: 'error',
      });
    },
  });
}
