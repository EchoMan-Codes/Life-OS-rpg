import PropTypes from 'prop-types';
import { useReducedMotion } from 'framer-motion';
import clsx from 'clsx';

/**
 * Color and theme configurations for generic structural frames.
 */
const FRAME_THEMES = {
  cyan: {
    border: 'border-cyan-500/50',
    accent: '#38BDF8',
    crestColor: '#38BDF8',
    crestFill: 'rgba(56, 189, 248, 0.15)',
    glowShadow: 'shadow-[0_0_24px_rgba(6,182,212,0.18)]',
    railBg: 'bg-cyan-950/40',
    energySeam: 'from-transparent via-cyan-400 to-transparent',
    pylonColor: 'text-cyan-400/60',
  },
  violet: {
    border: 'border-purple-500/50',
    accent: '#A78BFA',
    crestColor: '#A78BFA',
    crestFill: 'rgba(167, 139, 250, 0.15)',
    glowShadow: 'shadow-[0_0_24px_rgba(168,85,247,0.18)]',
    railBg: 'bg-purple-950/40',
    energySeam: 'from-transparent via-purple-400 to-transparent',
    pylonColor: 'text-purple-400/60',
  },
  amber: {
    border: 'border-amber-500/50',
    accent: '#F59E0B',
    crestColor: '#F59E0B',
    crestFill: 'rgba(245, 158, 11, 0.15)',
    glowShadow: 'shadow-[0_0_24px_rgba(245,158,11,0.18)]',
    railBg: 'bg-amber-950/40',
    energySeam: 'from-transparent via-amber-400 to-transparent',
    pylonColor: 'text-amber-400/60',
  },
};

/**
 * Central crest SVG emitter on top rail.
 */
function FrameCrest({ theme }) {
  return (
    <div className="relative flex items-center justify-center -top-2.5 z-20 pointer-events-none select-none">
      <svg
        width="72"
        height="16"
        viewBox="0 0 72 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_0_8px_currentColor]"
        style={{ color: theme.crestColor }}
        aria-hidden="true"
      >
        <path
          d="M2 8L16 2L24 8L16 14L2 8Z"
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="1"
        />
        <path
          d="M70 8L56 2L48 8L56 14L70 8Z"
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="1"
        />
        <polygon
          points="36,1 44,8 36,15 28,8"
          fill={theme.crestFill}
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <polygon
          points="36,3.5 40.5,8 36,12.5 31.5,8"
          fill="currentColor"
          fillOpacity="0.75"
        />
        <circle cx="36" cy="8" r="1.5" fill="#ffffff" />
      </svg>
    </div>
  );
}

FrameCrest.propTypes = {
  theme: PropTypes.object.isRequired,
};

/**
 * Bottom rail grounding anchor glyph.
 */
function FrameBottomAnchor({ theme }) {
  return (
    <div className="relative flex items-center justify-center -bottom-2 z-20 pointer-events-none select-none">
      <svg
        width="52"
        height="10"
        viewBox="0 0 52 10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color: theme.crestColor }}
        aria-hidden="true"
      >
        <path
          d="M14 1L26 8L38 1"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="10" cy="2" r="1" fill="currentColor" fillOpacity="0.5" />
        <circle cx="26" cy="4" r="1.2" fill="#ffffff" />
        <circle cx="42" cy="2" r="1" fill="currentColor" fillOpacity="0.5" />
      </svg>
    </div>
  );
}

FrameBottomAnchor.propTypes = {
  theme: PropTypes.object.isRequired,
};

/**
 * Side Pylon Segmented Assembly (Vertical Edge Rail).
 */
function SidePylonAssembly({ side = 'left', theme }) {
  const isLeft = side === 'left';
  return (
    <div
      className={clsx(
        'absolute top-4 bottom-4 w-2 flex flex-col justify-between items-center pointer-events-none select-none z-10',
        isLeft ? '-left-1' : '-right-1',
        theme.pylonColor
      )}
      aria-hidden="true"
    >
      <div className="w-1.5 h-3 border border-current rounded-xs opacity-60 flex items-center justify-center">
        <div className="w-0.5 h-1 bg-current opacity-80" />
      </div>
      <div className="flex flex-col gap-1 items-center opacity-70">
        <span className="text-[7px] font-mono leading-none tracking-tighter">■</span>
        <div className="w-1 h-3 border-l border-r border-current opacity-50" />
        <span className="text-[7px] font-mono leading-none tracking-tighter">■</span>
      </div>
      <div className="w-1.5 h-3 border border-current rounded-xs opacity-60 flex items-center justify-center">
        <div className="w-0.5 h-1 bg-current opacity-80" />
      </div>
    </div>
  );
}

SidePylonAssembly.propTypes = {
  side: PropTypes.oneOf(['left', 'right']),
  theme: PropTypes.object.isRequired,
};

/**
 * StructuralFrame — Standalone Holographic HUD Object.
 *
 * Implements the Structural Object Mandate:
 * - Angular top and bottom rails with chamfered corners
 * - Mechanical corner brackets (┌ ┐ └ ┘)
 * - Segmented side edge assemblies (pylons)
 * - Inset dark-glass information plane
 * - Animated energy seams traveling through the rails
 * - Clean reduced-motion fallback
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {'cyan' | 'violet' | 'amber'} [props.theme='cyan']
 * @param {boolean} [props.hasCrest=true]
 * @param {string} [props.className='']
 * @param {string} [props.innerClassName='']
 */
export function StructuralFrame({
  children,
  theme = 'cyan',
  hasCrest = true,
  className = '',
  innerClassName = '',
  ...props
}) {
  const shouldReduceMotion = useReducedMotion();
  const themeConfig = FRAME_THEMES[theme] || FRAME_THEMES.cyan;

  return (
    <div
      className={clsx('relative group', themeConfig.glowShadow, className)}
      {...props}
    >
      {/* ── 1. Top Rail Assembly ── */}
      <div className="relative w-full flex items-center">
        <div className="flex-1 flex items-center">
          <div
            className={clsx('h-1.5 w-4 rounded-tl-sm border-t border-l', themeConfig.border)}
            style={{ clipPath: 'polygon(0% 100%, 100% 100%, 100% 0%, 35% 0%, 0% 100%)' }}
          />
          <div
            className={clsx(
              'flex-1 h-1 border-t relative overflow-hidden',
              themeConfig.border,
              themeConfig.railBg
            )}
          >
            {!shouldReduceMotion && (
              <div
                className={clsx('absolute inset-y-0 w-12 bg-linear-to-r opacity-70', themeConfig.energySeam)}
                style={{ animation: 'energySeamSweepLeft 3.5s ease-in-out infinite' }}
              />
            )}
          </div>
        </div>

        {hasCrest ? (
          <FrameCrest theme={themeConfig} />
        ) : (
          <div className="w-5 h-1 border-t border-b border-current opacity-40 mx-1" />
        )}

        <div className="flex-1 flex items-center">
          <div
            className={clsx(
              'flex-1 h-1 border-t relative overflow-hidden',
              themeConfig.border,
              themeConfig.railBg
            )}
          >
            {!shouldReduceMotion && (
              <div
                className={clsx('absolute inset-y-0 w-12 bg-linear-to-r opacity-70', themeConfig.energySeam)}
                style={{ animation: 'energySeamSweepRight 3.5s ease-in-out infinite 0.4s' }}
              />
            )}
          </div>
          <div
            className={clsx('h-1.5 w-4 rounded-tr-sm border-t border-r', themeConfig.border)}
            style={{ clipPath: 'polygon(0% 100%, 100% 100%, 65% 0%, 0% 0%, 0% 100%)' }}
          />
        </div>
      </div>

      {/* ── 2. Side Pylons & Inset Information Plane ── */}
      <div className="relative">
        <SidePylonAssembly side="left" theme={themeConfig} />
        <SidePylonAssembly side="right" theme={themeConfig} />

        <div
          className={clsx(
            'relative overflow-hidden transition-all duration-200',
            'bg-obsidian-950/95 backdrop-blur-xl border-x',
            themeConfig.border,
            innerClassName
          )}
        >
          {/* Top specular highlight */}
          <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          {/* Precision Corner Brackets */}
          <span
            className="absolute top-2 left-2 text-[11px] font-mono select-none pointer-events-none opacity-60"
            style={{ color: themeConfig.accent }}
            aria-hidden="true"
          >
            ┌
          </span>
          <span
            className="absolute top-2 right-2 text-[11px] font-mono select-none pointer-events-none opacity-60"
            style={{ color: themeConfig.accent }}
            aria-hidden="true"
          >
            ┐
          </span>
          <span
            className="absolute bottom-2 left-2 text-[11px] font-mono select-none pointer-events-none opacity-60"
            style={{ color: themeConfig.accent }}
            aria-hidden="true"
          >
            └
          </span>
          <span
            className="absolute bottom-2 right-2 text-[11px] font-mono select-none pointer-events-none opacity-60"
            style={{ color: themeConfig.accent }}
            aria-hidden="true"
          >
            ┘
          </span>

          {/* Micro Grid Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, ${themeConfig.accent} 1px, transparent 0)`,
              backgroundSize: '16px 16px',
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 h-full flex flex-col">{children}</div>
        </div>
      </div>

      {/* ── 3. Bottom Rail Assembly ── */}
      <div className="relative w-full flex items-center">
        <div className="flex-1 flex items-center">
          <div className={clsx('h-1.5 w-4 rounded-bl-sm border-b border-l', themeConfig.border)} />
          <div className={clsx('flex-1 h-1 border-b', themeConfig.border, themeConfig.railBg)} />
        </div>

        <FrameBottomAnchor theme={themeConfig} />

        <div className="flex-1 flex items-center">
          <div className={clsx('flex-1 h-1 border-b', themeConfig.border, themeConfig.railBg)} />
          <div className={clsx('h-1.5 w-4 rounded-br-sm border-b border-r', themeConfig.border)} />
        </div>
      </div>
    </div>
  );
}

StructuralFrame.propTypes = {
  children: PropTypes.node.isRequired,
  theme: PropTypes.oneOf(['cyan', 'violet', 'amber']),
  hasCrest: PropTypes.bool,
  className: PropTypes.string,
  innerClassName: PropTypes.string,
};

export const StructuralPanel = StructuralFrame;

/**
 * StructuralChamber — Inset compartment for sub-framing form elements,
 * questions, and stats.
 */
export function StructuralChamber({
  children,
  label = null,
  variant = 'default',
  className = '',
  ...props
}) {
  const variantStyles = {
    default: 'bg-obsidian-900/60 border border-white/5',
    inset: 'bg-obsidian-950/80 border border-white/5 shadow-inner',
    action: 'bg-obsidian-900/90 border border-white/10 shadow-elevation-subtle',
    highlight: 'bg-cyan-950/20 border border-cyan-500/20',
  };

  return (
    <div
      className={clsx(
        'relative rounded-xl p-3 sm:p-4 transition-colors duration-150',
        variantStyles[variant] || variantStyles.default,
        className
      )}
      {...props}
    >
      {label && (
        <div className="absolute -top-2.5 left-3 px-1.5 bg-obsidian-950 border border-white/10 rounded-xs text-[9px] font-mono font-bold tracking-widest text-ink-muted uppercase select-none">
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

StructuralChamber.propTypes = {
  children: PropTypes.node.isRequired,
  label: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'inset', 'action', 'highlight']),
  className: PropTypes.string,
};
