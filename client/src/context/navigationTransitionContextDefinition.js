import { createContext } from 'react';

export const NavigationTransitionContext = createContext({
  variant: 'none',
  direction: 'forward',
  spatialDirection: 1,
  relationship: 'none',
  isInitialLoad: true,
});
