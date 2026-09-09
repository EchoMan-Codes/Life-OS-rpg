import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';

import { FLOATING_TEXT_EVENT } from '@/features/character/floatingText';

/**
 * Portal-rendered container mounted near the top HUD to display floating combat text.
 */
export function FloatingTextContainer() {
  const [items, setItems] = useState([]);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handleSpawn = (event) => {
      const newItem = event.detail;
      setItems((prev) => [...prev, newItem]);

      // Auto-dismiss after 900ms per specification
      setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== newItem.id));
      }, 900);
    };

    window.addEventListener(FLOATING_TEXT_EVENT, handleSpawn);
    return () => {
      window.removeEventListener(FLOATING_TEXT_EVENT, handleSpawn);
    };
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center gap-1"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence>
        {items.map((item) => {
          const isNegative = String(item.text).trim().startsWith('-');
          let colorClass = 'text-xp';
          if (item.stat === 'gold') colorClass = 'text-gold';
          else if (item.stat === 'mana') colorClass = 'text-mana';
          else if (item.stat === 'hp') {
            colorClass = isNegative ? 'text-attr-strength' : 'text-attr-vitality';
          }

          return (
            <motion.div
              key={item.id}
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 0, scale: 0.8 }
              }
              animate={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { opacity: 1, y: -28, scale: 1 }
              }
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -48 }
              }
              transition={
                shouldReduceMotion
                  ? { duration: 0.2 }
                  : { duration: 0.9, ease: 'easeOut' }
              }
              className={clsx(
                'font-display font-bold text-base md:text-lg tracking-wide',
                'drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]',
                colorClass
              )}
            >
              {item.text}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body
  );
}
