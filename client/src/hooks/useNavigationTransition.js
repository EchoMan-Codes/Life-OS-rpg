import { useContext } from 'react';
import { NavigationTransitionContext } from '@/context/navigationTransitionContextDefinition';

/**
 * Hook to access current route transition variant and spatial direction.
 */
export function useNavigationTransition() {
  return useContext(NavigationTransitionContext);
}
