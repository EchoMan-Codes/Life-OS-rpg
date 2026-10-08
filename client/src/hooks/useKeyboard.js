import { useState, useEffect } from 'react';
import { keyboardManager } from '@/lib/keyboard';

/**
 * React hook to reactively subscribe to mobile keyboard visibility and height.
 * Exposes:
 * - isKeyboardVisible: boolean
 * - keyboardHeight: number (in px)
 * - dismissKeyboard: () => Promise<void>
 */
export function useKeyboard() {
  const [state, setState] = useState(() => keyboardManager.getState());

  useEffect(() => {
    keyboardManager.init();
    const unsubscribe = keyboardManager.addListener((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  return {
    isKeyboardVisible: state.isVisible,
    keyboardHeight: state.height,
    dismissKeyboard: () => keyboardManager.dismiss(),
  };
}
