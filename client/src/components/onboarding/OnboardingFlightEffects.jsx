import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Max trail points and particle count.
 * Kept low for GPU friendliness.
 */
const MAX_TRAIL_POINTS = 10;
const MAX_PARTICLES = 8;
const PARTICLE_LIFETIME_MS = 600;

/**
 * Flight effects layer — trail + particles rendered as SVG overlay.
 * Absolutely positioned, full viewport, pointer-events-none.
 *
 * @param {object} props
 * @param {boolean} props.active - Whether to render effects
 * @param {number} props.x - Current airplane X (vw %)
 * @param {number} props.y - Current airplane Y (vh %)
 * @param {boolean} [props.isMobile=false] - Reduces particle count
 */
function OnboardingFlightEffectsBase({ active, x, y, isMobile = false }) {
  const shouldReduceMotion = useReducedMotion();
  const [trailPoints, setTrailPoints] = useState([]);
  const [particleRenderList, setParticleRenderList] = useState([]);
  const particlesRef = useRef([]);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const particleIdRef = useRef(0);
  const rafRef = useRef(null);

  const maxParticles = isMobile ? 4 : MAX_PARTICLES;

  // Track position changes
  useEffect(() => {
    lastPosRef.current = { x, y };
  }, [x, y]);

  // Update trail points and particles in animation frame
  const tick = useCallback(() => {
    const currentX = lastPosRef.current.x;
    const currentY = lastPosRef.current.y;
    const now = performance.now();

    setTrailPoints((prev) => {
      const next = [...prev, { x: currentX, y: currentY }];
      return next.slice(-MAX_TRAIL_POINTS);
    });

    // Occasionally emit a particle
    if (Math.random() < 0.3) {
      const id = ++particleIdRef.current;
      const newParticle = {
        id,
        x: currentX + (Math.random() - 0.5) * 1.5,
        y: currentY + (Math.random() - 0.5) * 1.5,
        born: now,
        dx: (Math.random() - 0.5) * 0.8,
        dy: (Math.random() - 0.5) * 0.8 - 0.3,
        size: 1.5 + Math.random() * 2,
      };

      const filtered = particlesRef.current.filter((p) => now - p.born < PARTICLE_LIFETIME_MS);
      if (filtered.length >= maxParticles) {
        filtered.shift();
      }
      filtered.push(newParticle);
      particlesRef.current = filtered;
    } else {
      particlesRef.current = particlesRef.current.filter((p) => now - p.born < PARTICLE_LIFETIME_MS);
    }

    // Precalculate rendered particle positions & opacities
    const rendered = particlesRef.current.map((p) => {
      const age = now - p.born;
      const lifeRatio = Math.min(age / PARTICLE_LIFETIME_MS, 1);
      const fadeOpacity = 1 - lifeRatio;
      const currentSize = p.size * (1 - lifeRatio * 0.6);
      return {
        id: p.id,
        cx: p.x + p.dx * lifeRatio * 3,
        cy: p.y + p.dy * lifeRatio * 3,
        r: currentSize * 0.08,
        opacity: fadeOpacity * 0.5,
      };
    });

    setParticleRenderList(rendered);
  }, [maxParticles]);

  useEffect(() => {
    if (!active || shouldReduceMotion) {
      return;
    }

    let running = true;
    const loop = () => {
      if (!running) return;
      tick();
      rafRef.current = requestAnimationFrame(loop);
    };

    // Start after slight delay to synchronize with airplane
    const startTimer = setTimeout(() => {
      rafRef.current = requestAnimationFrame(loop);
    }, 100);

    return () => {
      running = false;
      clearTimeout(startTimer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      particlesRef.current = [];
    };
  }, [active, shouldReduceMotion, tick]);

  if (!active || shouldReduceMotion) return null;

  // Build trail SVG path from points (viewport-relative)
  const trailPath = trailPoints.length >= 2
    ? trailPoints
        .map((pt, i) => {
          const cmd = i === 0 ? 'M' : 'L';
          return `${cmd} ${pt.x} ${pt.y}`;
        })
        .join(' ')
    : '';

  return (
    <div className="fixed inset-0 pointer-events-none z-20" aria-hidden="true">
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <linearGradient id="trail-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#a78bfa" stopOpacity="0" />
            <stop offset="0.5" stopColor="#a78bfa" stopOpacity="0.2" />
            <stop offset="1" stopColor="#c4b5fd" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Trail line */}
        {trailPath && (
          <path
            d={trailPath}
            fill="none"
            stroke="#c4b5fd"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.7"
            vectorEffect="non-scaling-stroke"
            style={{ filter: 'drop-shadow(0 0 8px rgba(167,139,250,0.9))' }}
          />
        )}

        {/* Particles */}
        {particleRenderList.map((p) => (
          <circle
            key={p.id}
            cx={p.cx}
            cy={p.cy}
            r={p.r * 2.5}
            fill="#e9d5ff"
            opacity={p.opacity * 1.5}
            style={{ filter: 'drop-shadow(0 0 4px rgba(192,132,252,0.9))' }}
          />
        ))}
      </svg>
    </div>
  );
}

OnboardingFlightEffectsBase.propTypes = {
  active: PropTypes.bool.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  isMobile: PropTypes.bool,
};

export const OnboardingFlightEffects = memo(OnboardingFlightEffectsBase);
