import { createContext, useContext } from 'react';

export const ToastContext = createContext(null);

/**
 * Hook to access the toast notification system.
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
