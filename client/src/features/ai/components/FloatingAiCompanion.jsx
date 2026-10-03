import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Bot } from 'lucide-react';
import clsx from 'clsx';

const STORAGE_POS_KEY = 'lifeos_ai_figure_pos_v2';

/**
 * Persistent Movable Jeevan AI Companion Figure.
 *
 * Appears as a rounded, glowing obsidian robotic/orb companion face
 * matching the reference design.
 * Fully draggable across desktop and mobile, respecting safe areas.
 * Distinguishes drags from taps with spring physics.
 */
export function FloatingAiCompanion({ onOpenAi }) {
  const shouldReduceMotion = useReducedMotion();
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_POS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {
      // storage unavailable
    }
    // Default safe placement: bottom-right above mobile bottom nav
    return { x: 0, y: 0 };
  });

  const dragStartPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  const handleDragStart = (_, info) => {
    isDragging.current = true;
    dragStartPos.current = { x: info.point.x, y: info.point.y };
  };

  const handleDragEnd = (_, info) => {
    setTimeout(() => {
      isDragging.current = false;
    }, 120);

    const newPos = {
      x: position.x + (info.offset.x || 0),
      y: position.y + (info.offset.y || 0),
    };

    // Keep within reasonable viewport boundaries
    const maxX = window.innerWidth / 2 - 40;
    const minX = -window.innerWidth / 2 + 40;
    const maxY = 20;
    const minY = -window.innerHeight + 140;

    const clampedX = Math.max(minX, Math.min(newPos.x, maxX));
    const clampedY = Math.max(minY, Math.min(newPos.y, maxY));

    const finalPos = { x: clampedX, y: clampedY };
    setPosition(finalPos);

    try {
      localStorage.setItem(STORAGE_POS_KEY, JSON.stringify(finalPos));
    } catch {
      // ignore
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (isDragging.current) return;
    onOpenAi();
  };

  return (
    <div
      style={{
        bottom: 'max(5.5rem, calc(4.75rem + env(safe-area-inset-bottom, 0px)))',
        right: '1.25rem',
      }}
      className="fixed z-40 pointer-events-none select-none"
    >
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.15}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        animate={{
          x: position.x,
          y: position.y,
        }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 350, damping: 28 }
        }
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={handleClick}
        className="pointer-events-auto relative cursor-grab active:cursor-grabbing group touch-none"
        aria-label="Open Jeevan AI Assistant"
      >
        {/* Ambient Radial Aura Glow */}
        <motion.div
          animate={
            shouldReduceMotion
              ? {}
              : {
                  scale: [1, 1.25, 1],
                  opacity: [0.35, 0.65, 0.35],
                }
          }
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -inset-3 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 blur-xl pointer-events-none"
        />

        {/* Outer Robotic Obsidian Orb Shell */}
        <div className="relative w-15 h-15 rounded-full bg-gradient-to-b from-[#1E113A] via-[#100926] to-[#06040F] p-0.5 shadow-[0_8px_30px_rgba(168,85,247,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-purple-400/40 flex items-center justify-center">
          
          {/* Inner Visor / Face Dome with Cyan Glowing Eyes */}
          <div className="w-11.5 h-11.5 rounded-full bg-[#070512] border border-cyan-500/30 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
            
            {/* Expressive AI Eye Orbs */}
            <div className="flex items-center gap-2">
              <motion.span
                animate={
                  shouldReduceMotion
                    ? {}
                    : {
                        scaleY: [1, 1, 0.1, 1],
                      }
                }
                transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
                className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22D3EE]"
              />
              <motion.span
                animate={
                  shouldReduceMotion
                    ? {}
                    : {
                        scaleY: [1, 1, 0.1, 1],
                      }
                }
                transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
                className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22D3EE]"
              />
            </div>

            {/* Subtle mouth glow indicator */}
            <motion.div
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-3 h-0.5 rounded-full bg-cyan-300/60 mt-1"
            />
          </div>

          {/* Active status pip */}
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0B081E] shadow-[0_0_6px_#34D399]" />
        </div>

        {/* Hover Tooltip / Guidance */}
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-obsidian-950/90 border border-purple-500/30 text-purple-200 text-[11px] font-mono whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:block">
          Ask Jeevan AI
        </div>
      </motion.div>
    </div>
  );
}

FloatingAiCompanion.propTypes = {
  onOpenAi: PropTypes.func.isRequired,
};
