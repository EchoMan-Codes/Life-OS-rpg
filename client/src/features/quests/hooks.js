import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useToast } from '@/components/ui/useToast';
import { useAuth } from '@/features/auth/hooks';
import { checkAndTriggerCelebrations } from '@/features/celebration/celebrationEvents';
import {
  fetchQuests,
  fetchQuest,
  createQuest,
  updateQuest,
  archiveQuest,
  deleteQuestPermanently,
  restoreQuest,
  reorderQuests,
  addQuestItem,
  updateQuestItem,
  deleteQuestItem,
  reorderQuestItems,
  completeQuestItem,
  undoQuestItem,
  completeQuest,
} from './api';

/**
 * Hook to retrieve user quests with TanStack Query.
 * Gated by isAuthenticated to prevent unauthenticated 401 requests on mount.
 */
export function useQuests({ status = 'active', includeArchived = false } = {}) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['quests', { status, includeArchived }],
    queryFn: () => fetchQuests({ status, includeArchived }),
    staleTime: 30 * 1000,
    enabled: isAuthenticated,
  });
}

/**
 * Hook to retrieve a single quest by ID.
 */
export function useQuest(questId) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['quests', questId],
    queryFn: () => fetchQuest(questId),
    enabled: isAuthenticated && Boolean(questId),
  });
}

/**
 * Hook to create a new quest.
 */
export function useCreateQuest() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data) => createQuest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      showToast({
        title: 'Quest Accepted',
        message: 'New quest added to your quest log.',
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Quest Creation Failed',
        message: err?.response?.data?.error?.message || 'Failed to create quest.',
        type: 'error',
      });
    },
  });
}

/**
 * Hook to update an existing quest.
 */
export function useUpdateQuest() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ questId, data }) => updateQuest(questId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      showToast({
        title: 'Quest Updated',
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Update Failed',
        message: err?.response?.data?.error?.message || 'Failed to update quest.',
        type: 'error',
      });
    },
  });
}

/**
 * Hook to archive/soft-delete a quest.
 */
export function useArchiveQuest() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (questId) => archiveQuest(questId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      showToast({
        title: 'Quest Archived',
        message: 'The quest has been moved to archives.',
        type: 'info',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Archive Failed',
        message: err?.response?.data?.error?.message || 'Failed to archive quest.',
        type: 'error',
      });
    },
  });
}

/**
 * Hook to permanently delete a quest.
 */
export function useDeleteQuest() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (questId) => deleteQuestPermanently(questId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      showToast({
        title: 'Quest Deleted',
        message: 'Quest permanently removed.',
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Delete Failed',
        message: err?.response?.data?.error?.message || 'Failed to delete quest.',
        type: 'error',
      });
    },
  });
}

/**
 * Hook to restore an archived quest.
 */
export function useRestoreQuest() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (questId) => restoreQuest(questId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      showToast({
        title: 'Quest Restored',
        message: 'Quest returned to active board.',
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Restore Failed',
        message: err?.response?.data?.error?.message || 'Failed to restore quest.',
        type: 'error',
      });
    },
  });
}

/**
 * Hook to reorder quests.
 */
export function useReorderQuests() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (orderedIds) => reorderQuests(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      showToast({
        title: 'Reorder Failed',
        message: err?.response?.data?.error?.message || 'Failed to reorder quests.',
        type: 'error',
      });
    },
  });
}

/**
 * Hook to add a checklist subtask to a quest.
 */
export function useAddQuestItem() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ questId, data }) => addQuestItem(questId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
    },
    onError: (err) => {
      showToast({
        title: 'Failed to Add Subtask',
        message: err?.response?.data?.error?.message || 'Failed to add item.',
        type: 'error',
      });
    },
  });
}

/**
 * Hook to update a checklist subtask.
 */
export function useUpdateQuestItem() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ questId, itemId, data }) => updateQuestItem(questId, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
    },
    onError: (err) => {
      showToast({
        title: 'Failed to Update Subtask',
        message: err?.response?.data?.error?.message || 'Failed to update item.',
        type: 'error',
      });
    },
  });
}

/**
 * Hook to delete a checklist subtask.
 */
export function useDeleteQuestItem() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ questId, itemId }) => deleteQuestItem(questId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
    },
    onError: (err) => {
      showToast({
        title: 'Failed to Delete Subtask',
        message: err?.response?.data?.error?.message || 'Failed to delete item.',
        type: 'error',
      });
    },
  });
}

/**
 * Hook to reorder checklist subtasks within a quest.
 */
export function useReorderQuestItems() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ questId, orderedIds }) => reorderQuestItems(questId, orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      showToast({
        title: 'Reorder Failed',
        message: err?.response?.data?.error?.message || 'Failed to reorder items.',
        type: 'error',
      });
    },
  });
}

/**
 * Hook to complete a checklist subtask with optimistic UI.
 */
export function useCompleteQuestItem() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ questId, itemId }) => completeQuestItem(questId, itemId),
    onMutate: async ({ questId, itemId }) => {
      await queryClient.cancelQueries({ queryKey: ['quests'] });
      const previousQuests = queryClient.getQueryData(['quests', { status: 'active' }]);

      queryClient.setQueriesData({ queryKey: ['quests'] }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((q) => {
          if (q.id !== questId) return q;
          const updatedItems = (q.items || []).map((it) =>
            it.id === itemId ? { ...it, isComplete: true } : it
          );
          const completedCount = updatedItems.filter((i) => i.isComplete).length;
          const progressPercent = updatedItems.length > 0 ? Math.round((completedCount / updatedItems.length) * 100) : 0;
          return { ...q, items: updatedItems, progressPercent };
        });
      });

      return { previousQuests };
    },
    onError: (err, variables, context) => {
      if (context?.previousQuests) {
        queryClient.setQueryData(['quests', { status: 'active' }], context.previousQuests);
      }
      showToast({
        title: 'Completion Failed',
        message: err?.response?.data?.error?.message || 'Failed to complete subtask.',
        type: 'error',
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
      checkAndTriggerCelebrations(data);

      if (data?.parentCompleted) {
        showToast({
          title: 'Quest Completed! 🏆',
          message: 'All checklist subtasks conquered! Completion bonus awarded.',
          type: 'success',
        });
      }
    },
  });
}

/**
 * Hook to undo a checklist subtask completion with optimistic UI.
 */
export function useUndoQuestItem() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ questId, itemId }) => undoQuestItem(questId, itemId),
    onMutate: async ({ questId, itemId }) => {
      await queryClient.cancelQueries({ queryKey: ['quests'] });
      const previousQuests = queryClient.getQueryData(['quests', { status: 'active' }]);

      queryClient.setQueriesData({ queryKey: ['quests'] }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((q) => {
          if (q.id !== questId) return q;
          const updatedItems = (q.items || []).map((it) =>
            it.id === itemId ? { ...it, isComplete: false } : it
          );
          const completedCount = updatedItems.filter((i) => i.isComplete).length;
          const progressPercent = updatedItems.length > 0 ? Math.round((completedCount / updatedItems.length) * 100) : 0;
          return { ...q, items: updatedItems, progressPercent };
        });
      });

      return { previousQuests };
    },
    onError: (err, variables, context) => {
      if (context?.previousQuests) {
        queryClient.setQueryData(['quests', { status: 'active' }], context.previousQuests);
      }
      showToast({
        title: 'Undo Failed',
        message: err?.response?.data?.error?.message || 'Failed to undo subtask.',
        type: 'error',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
    },
  });
}

/**
 * Hook to explicitly complete a quest.
 */
export function useCompleteQuest() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (questId) => completeQuest(questId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
      checkAndTriggerCelebrations(data);
      showToast({
        title: 'Quest Conquered! 🏆',
        message: 'Quest rewards and completion bonus granted.',
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        title: 'Quest Completion Failed',
        message: err?.response?.data?.error?.message || 'Failed to complete quest.',
        type: 'error',
      });
    },
  });
}
