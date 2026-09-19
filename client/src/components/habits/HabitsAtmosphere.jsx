import React, { useState, lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { useReducedMotion } from 'framer-motion';

// Lazy-load Three.js scene strictly on demand so it chunks into a route-isolated artifact
const RitualForgeScene = lazy(() => import('./RitualForgeScene'));

/**
 * Checks if WebGL is supported safely without throwing.
 */
function isWebGLAvailable() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

/**
 * Lightweight, high-performance CSS/SVG Celestial Aura fallback.
 * Rendered when WebGL is unavailable, on mobile devices (<768px), or when prefers-reduced-motion is active.
 * Features an original procedural abstract guardian silhouette, violet/cyan portal glow, and floating embers.
 */
function CelestialAuraFallback({ hasActiveStreaks = false }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Radial Obsidian Portal Lighting Glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-radial from-cyan-500/10 via-purple-900/10 to-transparent blur-3xl" />
      <div className="absolute w-[350px] h-[350px] rounded-full bg-radial from-purple-600/10 to-transparent blur-2xl -translate-y-8" />
      {hasActiveStreaks && (
        <div className="absolute w-[320px] h-[320px] rounded-full bg-radial from-amber-500/15 to-transparent blur-2xl animate-pulse" />
      )}

      {/* Procedural Celestial SVG Guardian & Arcane Rings */}
      <svg
        viewBox="0 0 400 400"
        className="w-[340px] h-[340px] opacity-45 text-cyan-400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Celestial Ring */}
        <circle
          cx="200"
          cy="200"
          r="165"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 8"
          className="opacity-40"
        />

        {/* Middle Violet Arcane Ring */}
        <circle
          cx="200"
          cy="200"
          r="125"
          stroke="#c084fc"
          strokeWidth="1.2"
          strokeDasharray="8 6"
          className="opacity-50"
        />

        {/* Abstract Guardian Monolith Silhouette (Faceted Pylon) */}
        <polygon
          points="200,105 245,280 155,280"
          stroke="#38bdf8"
          strokeWidth="1.2"
          fill="rgba(9, 13, 22, 0.7)"
          className="opacity-70"
        />
        <line x1="200" y1="105" x2="200" y2="280" stroke="#38bdf8" strokeWidth="0.75" strokeDasharray="3 3" className="opacity-40" />

        {/* Central Faceted Crystal Heart Core */}
        <polygon
          points="200,150 230,185 200,220 170,185"
          stroke="#a855f7"
          strokeWidth="1.5"
          fill="rgba(109, 40, 217, 0.25)"
          className="drop-shadow-[0_0_8px_#a855f7]"
        />

        {/* Inner Diamond Emitter */}
        <polygon
          points="200,165 215,185 200,205 185,185"
          stroke="#38bdf8"
          strokeWidth="1"
          fill="rgba(56, 189, 248, 0.3)"
        />
        <circle cx="200" cy="185" r="2.5" fill="#ffffff" />

        {/* Satellite Floating Shards */}
        <polygon points="120,170 130,155 135,175 125,180" stroke="#38bdf8" strokeWidth="1" fill="rgba(6, 182, 212, 0.3)" className="opacity-60" />
        <polygon points="280,160 270,145 265,165 275,170" stroke="#c084fc" strokeWidth="1" fill="rgba(168, 85, 247, 0.3)" className="opacity-60" />
        <polygon points="195,75 205,75 200,60" stroke="#38bdf8" strokeWidth="1" fill="rgba(56, 189, 248, 0.4)" className="opacity-60" />

        {/* Ambient Ember Sparks */}
        <circle cx="150" cy="130" r="1.5" fill="#38bdf8" className="opacity-70" />
        <circle cx="255" cy="120" r="1.5" fill="#c084fc" className="opacity-70" />
        <circle cx="165" cy="240" r="1.2" fill="#f59e0b" className="opacity-60" />
        <circle cx="240" cy="235" r="1.2" fill="#38bdf8" className="opacity-60" />
      </svg>
    </div>
  );
}

CelestialAuraFallback.propTypes = {
  hasActiveStreaks: PropTypes.bool,
};

class SceneErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('[HabitsAtmosphere] WebGL scene caught error, falling back to CSS/SVG:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

SceneErrorBoundary.propTypes = {
  children: PropTypes.node,
  fallback: PropTypes.node,
};

/**
 * HabitsAtmosphere — Route-scoped atmospheric background for /habits.
 * Integrates procedural Three.js consistency core with immediate CSS/SVG fallback.
 */
export function HabitsAtmosphere({ hasActiveStreaks = false }) {
  const shouldReduceMotion = useReducedMotion();
  const [canUseWebGL] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 768 && isWebGLAvailable();
  });

  const is3DActive = canUseWebGL && !shouldReduceMotion;

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none" aria-hidden="true">
      {/* Base Dark Fantasy Atmosphere */}
      <div className="absolute inset-0 bg-obsidian-950" />
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-purple-950/20 via-cyan-950/10 to-transparent" />

      {/* 3D Core with Progressive Enhancement & Fallback */}
      {is3DActive ? (
        <SceneErrorBoundary fallback={<CelestialAuraFallback hasActiveStreaks={hasActiveStreaks} />}>
          <Suspense fallback={<CelestialAuraFallback hasActiveStreaks={hasActiveStreaks} />}>
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-xl h-[420px] opacity-75">
              <RitualForgeScene hasActiveStreaks={hasActiveStreaks} />
            </div>
          </Suspense>
        </SceneErrorBoundary>
      ) : (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-xl h-[420px]">
          <CelestialAuraFallback hasActiveStreaks={hasActiveStreaks} />
        </div>
      )}
    </div>
  );
}

HabitsAtmosphere.propTypes = {
  hasActiveStreaks: PropTypes.bool,
};
