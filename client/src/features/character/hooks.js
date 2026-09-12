import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { fetchCharacter, allocateAttribute } from './api';
import { useAuth } from '@/features/auth/hooks';

export const CHARACTER_QUERY_KEY = ['character'];

/**
 * Hook to retrieve current character stats.
 */
export function useCharacter() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: CHARACTER_QUERY_KEY,
    queryFn: fetchCharacter,
    staleTime: 10_000,
    enabled: isAuthenticated,
  });
}

/**
 * Mutation hook to allocate attribute points with optimistic updates and error rollback.
 */
export function useAllocateAttribute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: allocateAttribute,
    onMutate: async ({ attribute, points = 1 }) => {
      await queryClient.cancelQueries({ queryKey: CHARACTER_QUERY_KEY });
      const previous = queryClient.getQueryData(CHARACTER_QUERY_KEY);

      if (previous && previous.unallocatedPoints >= points) {
        let hpBonus = 0;
        let manaBonus = 0;
        if (attribute === 'strength' || attribute === 'vitality') hpBonus = 4 * points;
        if (attribute === 'intelligence' || attribute === 'willpower') manaBonus = 3 * points;

        queryClient.setQueryData(CHARACTER_QUERY_KEY, {
          ...previous,
          maxHp: previous.maxHp + hpBonus,
          hp: previous.hp + hpBonus,
          maxMana: previous.maxMana + manaBonus,
          mana: previous.mana + manaBonus,
          unallocatedPoints: previous.unallocatedPoints - points,
          attributes: {
            ...previous.attributes,
            [attribute]: (previous.attributes?.[attribute] || 5) + points,
          },
        });
      }

      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CHARACTER_QUERY_KEY, context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(CHARACTER_QUERY_KEY, data);
    },
  });
}
