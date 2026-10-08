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
        <div
          style={{
            paddingBottom: 'max(1rem, calc(var(--keyboard-inset-bottom, 0px) + env(safe-area-inset-bottom, 0px)))',
            paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto transition-[padding] duration-200"
        >
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-slate-900/40 dark:bg-obsidian-950/75 backdrop-blur-md"
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
              'max-h-[calc(100dvh-var(--keyboard-inset-bottom,0px)-2.5rem)] overflow-y-auto scrollbar-thin',
              'bg-white/95 text-slate-800 border border-slate-200/90 shadow-2xl',
              'dark:bg-obsidian-900/90 dark:text-ink dark:border-white/15 dark:shadow-[0_20px_50px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.2)]',
              'backdrop-blur-2xl rounded-3xl',
              'p-5 sm:p-7',
              'focus:outline-none transition-[max-height] duration-200',
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
