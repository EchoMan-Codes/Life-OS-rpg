import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import { motionPresets, getAccessibleMotion } from '@/lib/motion';

/**
 * Canonical LifeOS Bottom Sheet overlay component (mobile & drawer interface).
 *
 * Implements:
 * - Slide-up drawer animation from bottom
 * - Focus trapping & Escape key dismissal
 * - Safe area padding on mobile home indicators
 * - Zero-layout-shift scroll lock
 */
export function Sheet({
  isOpen,
  onClose,
  title,
  children,
  className,
  closeOnBackdrop = true,
}) {
  const shouldReduceMotion = useReducedMotion();
  const sheetRef = useRef(null);
  const previousActiveElement = useRef(null);

  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
        return;
      }

      if (e.key === 'Tab' && sheetRef.current) {
        const focusables = sheetRef.current.querySelectorAll(
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
    [isOpen, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      document.addEventListener('keydown', handleKeyDown);

      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      requestAnimationFrame(() => {
        sheetRef.current?.focus();
      });
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';

      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, handleKeyDown]);

  const sheetMotion = getAccessibleMotion(shouldReduceMotion, motionPresets.sheetIn);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" role="presentation">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-sm cursor-pointer"
            onClick={closeOnBackdrop ? onClose : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden="true"
          />

          {/* Sheet Panel */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={title || 'Drawer Sheet'}
            tabIndex={-1}
            className={clsx(
              'relative z-10 w-full max-h-[90dvh] overflow-y-auto',
              'material-modal-glass rounded-t-modal p-6 safe-bottom text-ink',
              'border-t border-glass-border-strong focus:outline-none shadow-elevation-modal',
              className
            )}
            {...sheetMotion}
          >
            {/* Grab handle indicator for touch ergonomics */}
            <div className="flex justify-center -mt-2 mb-4">
              <div className="w-10 h-1.5 rounded-full bg-white/20" />
            </div>

            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

Sheet.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
  closeOnBackdrop: PropTypes.bool,
};
