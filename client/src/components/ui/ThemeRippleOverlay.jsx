import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ThemeRippleOverlay
 * Renders the cinematic radial energy ripple (Sun Flare for Light Mode,
 * Cosmic Nebula Wave for Dark Mode) originating from the toggle button's exact coordinates.
 * High performance, zero layout shift, self-cleaning.
 */
export function ThemeRippleOverlay() {
  const [activeRipple, setActiveRipple] = useState(null);

  useEffect(() => {
    const handleRippleEvent = (e) => {
      const detail = e.detail;
      if (!detail) return;
      const { x, y, nextMode, maxRadius, prefersReduced } = detail;

      if (prefersReduced) return;

      const rippleId = Date.now();
      setActiveRipple({
        id: rippleId,
        x,
        y,
        nextMode,
        maxRadius: maxRadius || Math.max(window.innerWidth, window.innerHeight),
        hasViewTransition: typeof document !== 'undefined' && 'startViewTransition' in document,
      });

      // Clear ripple after animation completes
      setTimeout(() => {
        setActiveRipple((current) => (current?.id === rippleId ? null : current));
      }, 750);
    };

    window.addEventListener('lifeos-theme-cinematic-ripple', handleRippleEvent);
    return () => {
      window.removeEventListener('lifeos-theme-cinematic-ripple', handleRippleEvent);
    };
  }, []);

  return (
    <AnimatePresence>
      {activeRipple && (
        <div
          className="fixed inset-0 pointer-events-none z-[999999] overflow-hidden"
          style={{ willChange: 'opacity' }}
          aria-hidden="true"
        >
          {/* Fallback circular color mask if document.startViewTransition is unsupported */}
          {!activeRipple.hasViewTransition && (
            <motion.div
              initial={{
                clipPath: `circle(0px at ${activeRipple.x}px ${activeRipple.y}px)`,
                opacity: 0.95,
              }}
              animate={{
                clipPath: `circle(${activeRipple.maxRadius * 1.15}px at ${activeRipple.x}px ${activeRipple.y}px)`,
                opacity: 1,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
              style={{
                backgroundColor: activeRipple.nextMode === 'light' ? '#F6F8FC' : '#07080C',
              }}
            />
          )}

          {/* ── Visual Energy Wave / Sun Flare or Cosmic Moon Ripple ── */}
          {activeRipple.nextMode === 'light' ? (
            /* Dark → Light: Golden Sunflare & Radiant Morning Sunlight */
            <div className="absolute inset-0">
              {/* Expanding Luminous Sun Halo */}
              <motion.div
                initial={{
                  width: 0,
                  height: 0,
                  x: activeRipple.x,
                  y: activeRipple.y,
                  opacity: 0.9,
                  scale: 0,
                }}
                animate={{
                  width: activeRipple.maxRadius * 2.2,
                  height: activeRipple.maxRadius * 2.2,
                  x: activeRipple.x - (activeRipple.maxRadius * 2.2) / 2,
                  y: activeRipple.y - (activeRipple.maxRadius * 2.2) / 2,
                  opacity: [0.95, 0.7, 0],
                  scale: 1,
                }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="absolute rounded-full border-4 border-amber-300 shadow-[0_0_80px_30px_rgba(251,191,36,0.6)] bg-radial from-amber-200/40 via-yellow-400/20 to-transparent"
              />

              {/* Radiant Sun Ray Ring */}
              <motion.div
                initial={{
                  width: 20,
                  height: 20,
                  x: activeRipple.x - 10,
                  y: activeRipple.y - 10,
                  rotate: 0,
                  opacity: 1,
                }}
                animate={{
                  width: 400,
                  height: 400,
                  x: activeRipple.x - 200,
                  y: activeRipple.y - 200,
                  rotate: 45,
                  opacity: [1, 0.8, 0],
                }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute rounded-full pointer-events-none"
              >
                <div className="w-full h-full relative">
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                    <div
                      key={deg}
                      className="absolute top-1/2 left-1/2 w-1.5 h-16 sm:h-24 bg-gradient-to-t from-amber-400 to-transparent rounded-full -translate-x-1/2 -translate-y-full origin-bottom"
                      style={{ transform: `rotate(${deg}deg) translateY(-20px)` }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            /* Light → Dark: Cosmic Indigo/Violet Moonfall & Starlight Ripple */
            <div className="absolute inset-0">
              {/* Expanding Cosmic Moon Halo */}
              <motion.div
                initial={{
                  width: 0,
                  height: 0,
                  x: activeRipple.x,
                  y: activeRipple.y,
                  opacity: 0.95,
                  scale: 0,
                }}
                animate={{
                  width: activeRipple.maxRadius * 2.2,
                  height: activeRipple.maxRadius * 2.2,
                  x: activeRipple.x - (activeRipple.maxRadius * 2.2) / 2,
                  y: activeRipple.y - (activeRipple.maxRadius * 2.2) / 2,
                  opacity: [0.95, 0.75, 0],
                  scale: 1,
                }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="absolute rounded-full border-4 border-indigo-400 shadow-[0_0_90px_35px_rgba(99,102,241,0.65)] bg-radial from-violet-600/40 via-indigo-900/30 to-transparent"
              />

              {/* Cosmic Ring Pulse */}
              <motion.div
                initial={{
                  width: 10,
                  height: 10,
                  x: activeRipple.x - 5,
                  y: activeRipple.y - 5,
                  opacity: 1,
                }}
                animate={{
                  width: 320,
                  height: 320,
                  x: activeRipple.x - 160,
                  y: activeRipple.y - 160,
                  opacity: [1, 0.6, 0],
                }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                className="absolute rounded-full border border-cyan-400/80 shadow-[0_0_40px_rgba(56,189,248,0.7)]"
              />
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
