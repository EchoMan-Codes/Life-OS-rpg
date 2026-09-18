/**
 * Life OS — Route Information Architecture & Spatial Relationship Map
 *
 * Single source of truth for:
 * - IA depth hierarchy (root sibling vs. deeper focused vs. lateral calm)
 * - Sibling spatial ordering for left/right directional continuity
 * - Resolution of transition variants and spatial direction
 */

export const ROUTE_IA = {
  '/': { depth: 1, type: 'root', index: 0, label: 'Dashboard' },
  '/dashboard': { depth: 1, type: 'root', index: 0, label: 'Dashboard' },
  '/habits': { depth: 1, type: 'root', index: 1, label: 'Habits' },
  '/dailies': { depth: 1, type: 'root', index: 2, label: 'Dailies' },
  '/quests': { depth: 1, type: 'root', index: 3, label: 'Quests' },
  '/shop': { depth: 1, type: 'root', index: 4, label: 'Shop' },
  '/profile': { depth: 1, type: 'root', index: 5, label: 'Profile' },
  '/reflection': { depth: 1, type: 'calm', index: 6, label: 'Reflection' },
  '/focus': { depth: 2, type: 'deeper', parent: '/', label: 'Focus Chamber' },
};

/**
 * Routes completely excluded from spatial transitions (instant or static fade).
 */
export const EXCLUDED_TRANSITION_ROUTES = [
  '/onboarding',
  '/auth/callback',
  '/showcase',
  '/dev',
  '/dev/tokens',
];

/**
 * Matches a pathname to known route definitions, handling potential sub-paths.
 *
 * @param {string} pathname
 * @returns {object|null}
 */
export function getRouteMeta(pathname) {
  if (!pathname) return null;
  const normalized = pathname === '' ? '/' : pathname;

  if (ROUTE_IA[normalized]) {
    return ROUTE_IA[normalized];
  }

  // Check prefix matches for detail routes (e.g. /quests/123)
  for (const [routePath, meta] of Object.entries(ROUTE_IA)) {
    if (routePath !== '/' && normalized.startsWith(routePath)) {
      return meta;
    }
  }

  return { depth: 1, type: 'root', index: 99, label: 'Unknown' };
}

/**
 * Resolves the spatial relationship and transition variant between two routes.
 *
 * @param {object} params
 * @param {string} params.fromPath - Previous pathname
 * @param {string} params.toPath - Next pathname
 * @param {'PUSH'|'POP'|'REPLACE'} params.navigationType - React Router navigation type
 * @param {number} [params.historyDelta=0] - Difference in history stack index (positive = forward, negative = back)
 * @param {boolean} [params.isInitialLoad=false] - Whether this is the initial document load
 * @returns {{
 *   variant: 'siblingSlide' | 'deepenPush' | 'lateralCalm' | 'none',
 *   direction: 'forward' | 'back',
 *   spatialDirection: 1 | -1,
 *   relationship: 'sibling' | 'deeper' | 'back-out' | 'lateral-calm' | 'none'
 * }}
 */
export function resolveRouteRelationship({
  fromPath,
  toPath,
  navigationType = 'PUSH',
  historyDelta = 0,
  isInitialLoad = false,
}) {
  // Direct access or hard refresh: no spatial movement, static render or fade
  if (isInitialLoad || !fromPath || fromPath === toPath) {
    return {
      variant: 'none',
      direction: 'forward',
      spatialDirection: 1,
      relationship: 'none',
    };
  }

  // Excluded routes (OAuth callbacks, onboarding, dev galleries)
  if (
    EXCLUDED_TRANSITION_ROUTES.some((route) => toPath.startsWith(route)) ||
    EXCLUDED_TRANSITION_ROUTES.some((route) => fromPath.startsWith(route))
  ) {
    return {
      variant: 'none',
      direction: 'forward',
      spatialDirection: 1,
      relationship: 'none',
    };
  }

  const fromMeta = getRouteMeta(fromPath);
  const toMeta = getRouteMeta(toPath);

  // 1. Check for browser/app POP navigation (History Back / Forward)
  const isPop = navigationType === 'POP';
  const isHistoryBack = isPop && historyDelta < 0;

  // 2. Check Depth Relationship: Root ↔ Deeper (e.g. / ↔ /focus)
  if (toMeta.type === 'deeper' && fromMeta.type !== 'deeper') {
    // Moving INTO deeper space (Root -> Deeper)
    return {
      variant: 'deepenPush',
      direction: 'forward',
      spatialDirection: 1,
      relationship: 'deeper',
    };
  }

  if (fromMeta.type === 'deeper' && toMeta.type !== 'deeper') {
    // Moving OUT OF deeper space back to root (Deeper -> Root)
    return {
      variant: 'deepenPush',
      direction: 'back',
      spatialDirection: -1,
      relationship: 'back-out',
    };
  }

  // 3. Check Lateral Calm Relationship (e.g. Any -> /reflection)
  if (toMeta.type === 'calm' || fromMeta.type === 'calm') {
    const direction = isHistoryBack ? 'back' : 'forward';
    return {
      variant: 'lateralCalm',
      direction,
      spatialDirection: direction === 'forward' ? 1 : -1,
      relationship: 'lateral-calm',
    };
  }

  // 4. Primary Root Sibling Navigation (Dashboard, Habits, Dailies, Quests, Shop)
  if (isPop) {
    // If navigation happened via browser Back/Forward (POP), direction follows history
    const direction = isHistoryBack ? 'back' : 'forward';
    // For sibling horizontal axis, use the relative index if both are siblings
    const spatialDirection =
      toMeta.index !== undefined && fromMeta.index !== undefined
        ? toMeta.index >= fromMeta.index
          ? 1
          : -1
        : direction === 'forward'
          ? 1
          : -1;

    return {
      variant: 'siblingSlide',
      direction,
      spatialDirection,
      relationship: 'sibling',
    };
  }

  // For PUSH navigation between siblings:
  // Direction is determined by stable sibling ordering on the horizontal canvas axis
  const fromIndex = fromMeta.index ?? 0;
  const toIndex = toMeta.index ?? 0;
  const spatialDirection = toIndex >= fromIndex ? 1 : -1;
  const direction = spatialDirection === 1 ? 'forward' : 'back';

  return {
    variant: 'siblingSlide',
    direction,
    spatialDirection,
    relationship: 'sibling',
  };
}
