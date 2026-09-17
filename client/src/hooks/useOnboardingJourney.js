import { useReducer, useCallback } from 'react';

/**
 * @typedef {'idle'|'launching'|'flying'|'approaching'|'authTransition'|'authenticating'|'returnJourney'|'landing'|'complete'} JourneyState
 * @typedef {'LAUNCH'|'FLY'|'APPROACH'|'SHOW_AUTH'|'AUTH_SUCCESS'|'AUTH_CANCEL'|'RETURN'|'LAND'|'ARRIVED'} JourneyAction
 */

/**
 * Valid state transitions — each key lists actions accepted in that state.
 * Any action not listed for the current state is silently ignored (guard).
 */
const TRANSITIONS = {
  idle:           { LAUNCH: 'launching', SIGN_IN: 'authenticating' },
  launching:      { FLY: 'flying', CANCEL: 'idle' },
  flying:         { APPROACH: 'approaching', CANCEL: 'idle' },
  approaching:    { SHOW_AUTH: 'authTransition', CANCEL: 'idle' },
  authTransition: { SHOW_AUTH: 'authenticating', CANCEL: 'idle' },
  authenticating: { AUTH_SUCCESS: 'returnJourney', AUTH_CANCEL: 'idle' },
  returnJourney:  { LAND: 'landing' },
  landing:        { ARRIVED: 'complete' },
  complete:       {},
};

/**
 * Pure reducer — validates transition, returns new state or current.
 * @param {JourneyState} state
 * @param {{ type: JourneyAction }} action
 * @returns {JourneyState}
 */
function journeyReducer(state, action) {
  const allowed = TRANSITIONS[state];
  if (!allowed) return state;
  const next = allowed[action.type];
  return next || state;
}

/**
 * State machine hook for the onboarding airplane journey.
 *
 * @param {JourneyState} [initialState='idle'] - Starting state.
 *   Pass 'returnJourney' when resuming after Google OAuth redirect.
 * @returns {{ state: JourneyState, dispatch: (action: JourneyAction) => void, isActive: boolean }}
 */
export function useOnboardingJourney(initialState = 'idle') {
  const [state, rawDispatch] = useReducer(journeyReducer, initialState);

  /** Typed dispatch wrapper — accepts action string directly. */
  const dispatch = useCallback(
    /** @param {JourneyAction} type */
    (type) => rawDispatch({ type }),
    []
  );

  const isActive = state !== 'idle' && state !== 'complete';

  return { state, dispatch, isActive };
}
