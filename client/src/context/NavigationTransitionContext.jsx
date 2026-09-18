import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import PropTypes from 'prop-types';

import { resolveRouteRelationship } from '@/lib/routeRelationships';
import { NavigationTransitionContext } from './navigationTransitionContextDefinition';

export function NavigationTransitionProvider({ children }) {
  const location = useLocation();
  const navigationType = useNavigationType();

  // Track history index and previous pathname
  const prevPathRef = useRef(location.pathname);
  const prevIdxRef = useRef(window.history.state?.idx ?? 0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [transitionState, setTransitionState] = useState(() =>
    resolveRouteRelationship({
      fromPath: '',
      toPath: location.pathname,
      navigationType,
      historyDelta: 0,
      isInitialLoad: true,
    })
  );

  useEffect(() => {
    // Current history index from browser/React Router
    const currentIdx = window.history.state?.idx ?? prevIdxRef.current;
    const historyDelta = currentIdx - prevIdxRef.current;

    const fromPath = prevPathRef.current;
    const toPath = location.pathname;

    if (fromPath !== toPath) {
      const resolved = resolveRouteRelationship({
        fromPath,
        toPath,
        navigationType,
        historyDelta,
        isInitialLoad,
      });

      setTransitionState(resolved);

      // Scroll reset on page transition (§3)
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

      // Update refs
      prevPathRef.current = toPath;
      prevIdxRef.current = currentIdx;
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    }
  }, [location.pathname, navigationType, isInitialLoad]);

  return (
    <NavigationTransitionContext.Provider
      value={{
        ...transitionState,
        isInitialLoad,
      }}
    >
      {children}
    </NavigationTransitionContext.Provider>
  );
}

NavigationTransitionProvider.propTypes = {
  children: PropTypes.node,
};
