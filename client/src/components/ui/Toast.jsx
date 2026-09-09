import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

import { spring } from '@/lib/motionVariants';
import { ToastContext } from './useToast';

let toastCount = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const shouldReduceMotion = useReducedMotion();

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({ title, message, type = 'info', duration = 4000 }) => {
    const id = ++toastCount;
    const toast = { id, title, message, type, duration };
    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__showToast = showToast;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.__showToast;
      }
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div
        className="fixed z-50 pointer-events-none flex flex-col gap-2 p-4 bottom-20 md:bottom-6 right-0 md:right-6 left-0 md:left-auto items-center md:items-end max-w-full md:max-w-md"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const isError = toast.type === 'error';
            const isSuccess = toast.type === 'success';

            const Icon = isError ? AlertCircle : isSuccess ? CheckCircle2 : Info;
            const borderColor = isError
              ? 'border-attr-strength/50'
              : isSuccess
              ? 'border-attr-vitality/50'
              : 'border-glass-border';
            const iconColor = isError
              ? 'text-attr-strength'
              : isSuccess
              ? 'text-attr-vitality'
              : 'text-mana';

            return (
              <motion.div
                key={toast.id}
                role="alert"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 10 }}
                transition={shouldReduceMotion ? { duration: 0 } : spring.snappy}
                className={`pointer-events-auto flex items-start gap-3 w-full sm:w-80 p-3.5 rounded-xl bg-obsidian-900/95 backdrop-blur-xl border ${borderColor} shadow-glass text-ink`}
              >
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
                <div className="flex-1 min-w-0">
                  {toast.title && (
                    <h4 className="text-body-sm font-semibold text-ink truncate">{toast.title}</h4>
                  )}
                  {toast.message && (
                    <p className="text-body-xs text-ink-muted break-words">{toast.message}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  aria-label="Dismiss notification"
                  className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-glass/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
