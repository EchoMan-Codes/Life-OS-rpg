import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useReducedMotion } from 'framer-motion';

/**
 * DashboardAtmosphere — High-performance 2D cinematic cosmic depth layer.
 *
 * Implements:
 * - Layer 1: Deep obsidian void
 * - Layer 2: Attribute-reactive radial plasma energy fields (blue -> indigo -> violet -> purple)
 * - Layer 3: Lightweight 2D canvas starfield (capped at ~45 subtle particles)
 * - Layer 4: Occasional subtle shooting-star energy streaks (Images 2 & 4 inspired)
 * - Power Management: Freezes render loop when tab is hidden or reduced motion is active
 */
export function DashboardAtmosphere({ primaryAttribute = 'willpower' }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  // Attribute-based plasma lighting map
  const attributeGradients = {
    strength:
      'radial-gradient(ellipse 60% 40% at 50% 12%, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.02) 60%, transparent 100%)',
    intelligence:
      'radial-gradient(ellipse 60% 40% at 50% 12%, rgba(56, 189, 248, 0.12) 0%, rgba(56, 189, 248, 0.02) 60%, transparent 100%)',
    vitality:
      'radial-gradient(ellipse 60% 40% at 50% 12%, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.02) 60%, transparent 100%)',
    willpower:
      'radial-gradient(ellipse 60% 40% at 50% 12%, rgba(168, 85, 247, 0.14) 0%, rgba(99, 102, 241, 0.03) 60%, transparent 100%)',
    perception:
      'radial-gradient(ellipse 60% 40% at 50% 12%, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.02) 60%, transparent 100%)',
  };

  const activeGradient = attributeGradients[primaryAttribute] || attributeGradients.willpower;

  useEffect(() => {
    if (shouldReduceMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let isVisible = true;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Handle tab visibility to save power & battery
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const width = () => canvas.clientWidth || window.innerWidth;
    const height = () => canvas.clientHeight || 800;

    // Seed 42 subtle cosmic particulate dust motes
    const particleCount = 42;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width(),
        y: Math.random() * height(),
        radius: Math.random() * 1.1 + 0.4,
        baseAlpha: Math.random() * 0.35 + 0.1,
        twinkleSpeed: Math.random() * 0.02 + 0.008,
        twinklePhase: Math.random() * Math.PI * 2,
        vy: -(Math.random() * 0.12 + 0.04), // Gentle upward atmospheric drift
        vx: (Math.random() - 0.5) * 0.06,
      });
    }

    // Occasional shooting star streak state
    let shootingStar = null;
    let nextShootingStarTime = performance.now() + Math.random() * 4000 + 3000;

    const spawnShootingStar = (now) => {
      const w = width();
      const h = height();
      const startX = Math.random() * w * 0.8;
      const startY = Math.random() * h * 0.3;
      const length = Math.random() * 80 + 60;
      const speed = Math.random() * 3 + 4;
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.2; // ~45 deg downward-right

      shootingStar = {
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length,
        life: 1.0,
        decay: Math.random() * 0.02 + 0.015,
      };

      nextShootingStarTime = now + Math.random() * 8000 + 5000;
    };

    let lastTime = performance.now();

    const render = (time) => {
      if (!isVisible) return;
      const dt = Math.min((time - lastTime) / 16.67, 3);
      lastTime = time;

      const w = width();
      const h = height();

      ctx.clearRect(0, 0, w, h);

      // 1. Draw drifting stardust particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += p.vy * dt;
        p.x += p.vx * dt;
        p.twinklePhase += p.twinkleSpeed * dt;

        // Wrap around boundaries
        if (p.y < -10) p.y = h + 10;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        const currentAlpha = Math.max(0.04, p.baseAlpha + Math.sin(p.twinklePhase) * 0.12);

        ctx.fillStyle = `rgba(224, 231, 255, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Draw occasional shooting star energy streak
      if (time > nextShootingStarTime && !shootingStar) {
        spawnShootingStar(time);
      }

      if (shootingStar) {
        shootingStar.x += shootingStar.vx * dt;
        shootingStar.y += shootingStar.vy * dt;
        shootingStar.life -= shootingStar.decay * dt;

        if (shootingStar.life <= 0 || shootingStar.x > w || shootingStar.y > h) {
          shootingStar = null;
        } else {
          const tailX = shootingStar.x - shootingStar.vx * 12;
          const tailY = shootingStar.y - shootingStar.vy * 12;

          const grad = ctx.createLinearGradient(tailX, tailY, shootingStar.x, shootingStar.y);
          grad.addColorStop(0, 'rgba(168, 85, 247, 0)');
          grad.addColorStop(0.5, `rgba(56, 189, 248, ${shootingStar.life * 0.5})`);
          grad.addColorStop(1, `rgba(255, 255, 255, ${shootingStar.life * 0.8})`);

          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(shootingStar.x, shootingStar.y);
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [shouldReduceMotion]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none select-none -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* 1. Base Deep Obsidian Void */}
      <div className="absolute inset-0 bg-[#06080e]" />

      {/* 2. Slow-moving Large Radial Energy Field (Blue/Violet glow) */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-out opacity-85"
        style={{ background: activeGradient }}
      />

      {/* 3. Secondary subtle bottom cyan/indigo vignette */}
      <div className="absolute bottom-0 inset-x-0 h-96 bg-linear-to-t from-indigo-950/20 via-transparent to-transparent opacity-60" />

      {/* 4. Horizon Specular Line */}
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-sky-400/15 to-transparent" />

      {/* 5. Cosmic Dust & Shooting Stars Canvas */}
      {!shouldReduceMotion && (
        <canvas
          ref={canvasRef}
          className="w-full h-full opacity-70 mix-blend-screen"
        />
      )}
    </div>
  );
}

DashboardAtmosphere.propTypes = {
  primaryAttribute: PropTypes.string,
};
