import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';

import { modalPanel } from '@/lib/motionVariants';

/**
 * Modal component with Framer Motion AnimatePresence.
 * Backdrop fade + panel scale-from-0.96 using modalPanel variant.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {() => void} props.onClose - Called when the modal requests closing
 * @param {string} [props.className] - Additional classes for the panel
 * @param {React.ReactNode} props.children
 */
export function Modal({ isOpen, onClose, className, children }) {
  const shouldReduceMotion = useReducedMotion();
  const panelRef = useRef(null);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Basic focus trap: focus the panel on mount
      panelRef.current?.focus();
      // Prevent background scroll
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const backdropMotion = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.15 } },
        exit: { opacity: 0, transition: { duration: 0.1 } },
      };

  const panelMotion = shouldReduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : modalPanel;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-obsidian/80 backdrop-blur-sm"
            onClick={onClose}
            {...backdropMotion}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className={clsx(
              'relative z-10 w-full max-w-lg',
              'bg-obsidian-800 border border-glass-border',
              'backdrop-blur-glass rounded-panel shadow-glow',
              'p-6',
              'focus:outline-none',
              className
            )}
            {...panelMotion}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
