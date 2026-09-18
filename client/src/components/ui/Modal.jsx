import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import { motionPresets, getAccessibleMotion } from '@/lib/motion';

/**
 * Canonical LifeOS Modal overlay system.
 *
 * Provides:
 * - Full focus trapping (keeps Tab / Shift+Tab inside the dialog)
 * - Focus restoration (returns focus to trigger element on close)
 * - Escape key dismissal
 * - Zero-layout-shift scroll lock (compensates for scrollbar width)
 * - ARIA accessibility (dialog role, aria-modal, optional labelledby)
 * - material-modal-glass backdrop and panel
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
}) {
  const shouldReduceMotion = useReducedMotion();
  const panelRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape' && closeOnEscape) {
        e.stopPropagation();
        onClose?.();
        return;
      }

      // Keyboard focus trap inside dialog
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [isOpen, closeOnEscape, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      document.addEventListener('keydown', handleKeyDown);

      // Scroll lock with scrollbar width compensation
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      // Auto-focus dialog panel or first focusable child
      requestAnimationFrame(() => {
        const firstFocusable = panelRef.current?.querySelector(
          'button:not([disabled]), input:not([disabled]), [tabindex="0"]'
        );
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          panelRef.current?.focus();
        }
      });
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';

      // Restore focus to original trigger element
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, handleKeyDown]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)]',
  };

  const backdropMotion = shouldReduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.15 } },
        exit: { opacity: 0, transition: { duration: 0.12 } },
      };

  const panelMotion = getAccessibleMotion(shouldReduceMotion, motionPresets.modalIn);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 safe-top safe-bottom"
          role="presentation"
        >
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-sm cursor-pointer"
            onClick={closeOnBackdrop ? onClose : undefined}
            aria-hidden="true"
            {...backdropMotion}
          />

          {/* Dialog Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title || 'Dialog'}
            aria-describedby={description ? 'modal-description' : undefined}
            tabIndex={-1}
            className={clsx(
              'relative z-10 w-full',
              sizeClasses[size] || sizeClasses.md,
              'material-modal-glass rounded-modal p-6 text-ink',
              'focus:outline-none',
              className
            )}
            {...panelMotion}
          >
            {description && (
              <span id="modal-description" className="sr-only">
                {description}
              </span>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  closeOnBackdrop: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
};
