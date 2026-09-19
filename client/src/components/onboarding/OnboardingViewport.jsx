import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import { StructuralFrame } from '@/components/rpg/StructuralFrame';

/**
 * OnboardingViewport — Tall 9:16 Structural Holographic Portal Viewport.
 *
 * Implements the original procedural scene mandate:
 * - Abstract faceted guardian silhouette / crystal core (SVG vector geometry)
 * - Warm horizon backlight glow (amber/orange ember gradient)
 * - Cyan rune-like geometric energy marks and coordinate indicators
 * - Slow rotating violet/cyan portal halo rings
 * - Isolated, lightweight particle canvas (max 28 drifting embers, capped DPR,
 *   paused when tab is hidden, NO React state updates in render loop)
 * - Pure CSS/SVG fallback if canvas fails or prefers-reduced-motion is active
 * - aria-hidden="true" for screen reader accessibility
 */
export function OnboardingViewport({ className = '' }) {
  const canvasRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // If user prefers reduced motion, do not start canvas particle simulation
    if (shouldReduceMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx = null;
    try {
      ctx = canvas.getContext('2d', { alpha: true });
    } catch {
      // Fallback gracefully if context acquisition fails
      return;
    }
    if (!ctx) return;

    let animationFrameId = null;
    let isPaused = false;
    let width = 0;
    let height = 0;

    // Conservative particle simulation: 26 drifting ember/spark shards
    const PARTICLE_COUNT = 26;
    const particles = [];

    const initParticles = (w, h) => {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 2.2 + 0.8,
          speedY: -(Math.random() * 0.45 + 0.15),
          speedX: (Math.random() - 0.5) * 0.25,
          opacity: Math.random() * 0.7 + 0.2,
          pulseSpeed: Math.random() * 0.02 + 0.01,
          colorType: Math.random() > 0.4 ? 'cyan' : 'amber', // Cyan sparks and warm backlight embers
        });
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // Capped DPR to prevent GPU overhead
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles(width, height);
    };

    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    // Visibility change handler: pause loop when document is hidden
    const handleVisibilityChange = () => {
      isPaused = document.hidden;
      if (!isPaused && !animationFrameId) {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let lastTime = performance.now();

    const render = (now) => {
      if (isPaused || document.hidden) {
        animationFrameId = null;
        return;
      }

      // Elapsed time delta check (optional frame rate capping)
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // Render drifting particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += p.speedY * (delta * 60);
        p.x += p.speedX * (delta * 60);

        // Reset particle to bottom when it drifts off top
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        // Subtle opacity pulsation
        p.opacity += Math.sin(now * p.pulseSpeed) * 0.005;
        const clampedOpacity = Math.max(0.1, Math.min(0.85, p.opacity));

        ctx.fillStyle =
          p.colorType === 'cyan'
            ? `rgba(56, 189, 248, ${clampedOpacity})`
            : `rgba(245, 158, 11, ${clampedOpacity * 0.8})`;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      resizeObserver.disconnect();
    };
  }, [shouldReduceMotion]);

  return (
    <div
      className={clsx('relative w-full max-w-[420px] mx-auto select-none', className)}
      aria-hidden="true"
    >
      {/* 9:16 Aspect Ratio Frame */}
      <StructuralFrame
        theme="cyan"
        className="w-full shadow-[0_0_40px_rgba(6,182,212,0.15)]"
        innerClassName="aspect-[9/16] relative flex flex-col justify-between p-0 overflow-hidden bg-obsidian-950"
      >
        {/* ── 1. Cosmic Atmosphere & Gradients ── */}
        <div className="absolute inset-0 bg-radial-[circle_at_50%_45%] from-purple-950/40 via-obsidian-950 to-obsidian-950 pointer-events-none" />

        {/* Warm Horizon Light Glow (Backlight inspired by reference mood) */}
        <div className="absolute bottom-0 inset-x-0 h-1/2 bg-linear-to-t from-amber-500/15 via-purple-600/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 h-32 bg-amber-500/15 blur-3xl rounded-full pointer-events-none" />

        {/* Cyan/Azure Ambient Portal Aura */}
        <div className="absolute top-[28%] left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* ── 2. SVG Procedural Guardian Monolith & Arcane Portal Halo ── */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg
            className="w-full h-full"
            viewBox="0 0 360 640"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Slow-Rotating Violet Portal Ring */}
            <g
              className={shouldReduceMotion ? '' : 'origin-[180px_320px]'}
              style={
                shouldReduceMotion
                  ? {}
                  : { animation: 'spin 45s linear infinite' }
              }
            >
              <circle
                cx="180"
                cy="320"
                r="125"
                stroke="rgba(167, 139, 250, 0.28)"
                strokeWidth="1.2"
                strokeDasharray="6 8"
              />
              <circle
                cx="180"
                cy="320"
                r="145"
                stroke="rgba(167, 139, 250, 0.15)"
                strokeWidth="1"
                strokeDasharray="2 12"
              />
              {/* Arcane celestial glyph nodes */}
              <rect x="177" y="172" width="6" height="6" fill="#A78BFA" opacity="0.7" transform="rotate(45 180 175)" />
              <rect x="177" y="462" width="6" height="6" fill="#A78BFA" opacity="0.7" transform="rotate(45 180 465)" />
              <rect x="32" y="317" width="6" height="6" fill="#A78BFA" opacity="0.7" transform="rotate(45 35 320)" />
              <rect x="322" y="317" width="6" height="6" fill="#A78BFA" opacity="0.7" transform="rotate(45 325 320)" />
            </g>

            {/* Inner Concentric Cyan Energy Ring */}
            <g
              className={shouldReduceMotion ? '' : 'origin-[180px_320px]'}
              style={
                shouldReduceMotion
                  ? {}
                  : { animation: 'spin 30s linear infinite reverse' }
              }
            >
              <circle
                cx="180"
                cy="320"
                r="95"
                stroke="rgba(56, 189, 248, 0.45)"
                strokeWidth="1.5"
                strokeDasharray="16 10"
              />
              {/* Cardinal energy tics */}
              <line x1="180" y1="215" x2="180" y2="228" stroke="#38BDF8" strokeWidth="2" opacity="0.9" />
              <line x1="180" y1="412" x2="180" y2="425" stroke="#38BDF8" strokeWidth="2" opacity="0.9" />
              <line x1="75" y1="320" x2="88" y2="320" stroke="#38BDF8" strokeWidth="2" opacity="0.9" />
              <line x1="272" y1="320" x2="285" y2="320" stroke="#38BDF8" strokeWidth="2" opacity="0.9" />
            </g>

            {/* Central Portal Horizon Core Glow */}
            <circle cx="180" cy="320" r="70" fill="url(#portalGlow)" opacity="0.7" />

            {/* ── Abstract Faceted Guardian Monolith (Obsidian silhouette form) ── */}
            {/* Grounding shadow cape silhouette */}
            <path
              d="M180 260 L130 420 L95 560 L180 540 L265 560 L230 420 Z"
              fill="rgba(4, 5, 8, 0.95)"
              stroke="rgba(167, 139, 250, 0.2)"
              strokeWidth="1.2"
            />
            {/* Central Faceted Core Monolith */}
            <polygon
              points="180,225 210,295 180,375 150,295"
              fill="rgba(11, 13, 20, 0.98)"
              stroke="#38BDF8"
              strokeWidth="1.75"
              className="drop-shadow-[0_0_15px_rgba(56,189,248,0.6)]"
            />
            {/* Internal Cyan Energy Rune seams in Monolith */}
            <path
              d="M180 240 L180 355 M165 295 L195 295 M170 270 L190 320"
              stroke="#38BDF8"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.95"
            />
            {/* Crown Apex Crest */}
            <polygon
              points="180,205 188,220 180,215 172,220"
              fill="#A78BFA"
              opacity="0.9"
            />

            {/* Horizon Platform Grid Grounding Lines */}
            <line x1="40" y1="560" x2="320" y2="560" stroke="rgba(245, 158, 11, 0.35)" strokeWidth="1.2" />
            <line x1="70" y1="580" x2="290" y2="580" stroke="rgba(245, 158, 11, 0.22)" strokeWidth="1" />
            <line x1="100" y1="600" x2="260" y2="600" stroke="rgba(245, 158, 11, 0.12)" strokeWidth="1" />

            <defs>
              <radialGradient id="portalGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#0B0D14" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        {/* ── 3. Interactive Lightweight Canvas (Floating Embers & Stardust) ── */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* ── 4. Subtle Scanline & HUD Telemetry Overlay ── */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: 'repeating-linear-gradient(to bottom, #38BDF8 0px, #38BDF8 1px, transparent 1px, transparent 4px)',
          }}
        />

        {/* Top HUD Status Ticker */}
        <div className="relative z-20 flex items-center justify-between px-4 pt-3.5 text-[10px] font-mono tracking-widest text-cyan-400/80">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>FORGE // CORE_ACTIVE</span>
          </div>
          <span className="text-white/40">SYS.916</span>
        </div>

        {/* Bottom Lore Coordinate Tag */}
        <div className="relative z-20 flex items-center justify-between px-4 pb-3.5 text-[9px] font-mono tracking-wider text-ink-muted/60">
          <span>PORTAL // HORIZON</span>
          <span className="text-amber-400/70">WARM_EMBERS: ON</span>
        </div>
      </StructuralFrame>
    </div>
  );
}

OnboardingViewport.propTypes = {
  className: PropTypes.string,
};
