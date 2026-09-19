import PropTypes from 'prop-types';
import { useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import { DIFFICULTY_THEMES } from './difficultyThemes';

export { DIFFICULTY_THEMES };


/**
 * Top rail central crest SVG emitter.
 * Precision faceted geometric crest with glowing diamond core and lateral wing vents.
 */
function TopRailCrest({ theme, intensity = 'normal' }) {
  return (
    <div className="relative flex items-center justify-center -top-2.5 z-20 pointer-events-none select-none">
      <svg
        width="76"
        height="18"
        viewBox="0 0 76 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_0_8px_currentColor]"
        style={{ color: theme.crestColor }}
      >
        {/* Lateral wing struts */}
        <path
          d="M2 9L18 3L26 9L18 15L2 9Z"
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="1"
        />
        <path
          d="M74 9L58 3L50 9L58 15L74 9Z"
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="1"
        />
        {/* Central Faceted Diamond Emitter */}
        <polygon
          points="38,1 47,9 38,17 29,9"
          fill={theme.crestFill}
          stroke="currentColor"
          strokeWidth="1.25"
        />
        <polygon
          points="38,4 43,9 38,14 33,9"
          fill="currentColor"
          fillOpacity={intensity === 'heavy' ? '0.9' : '0.6'}
        />
        {/* Micro focal dot */}
        <circle cx="38" cy="9" r="1.5" fill="#ffffff" />
      </svg>
    </div>
  );
}

TopRailCrest.propTypes = {
  theme: PropTypes.object.isRequired,
  intensity: PropTypes.string,
};

/**
 * Bottom stabilizer anchor glyph.
 */
function BottomRailAnchor({ theme }) {
  return (
    <div className="relative flex items-center justify-center -bottom-2 z-20 pointer-events-none select-none">
      <svg
        width="56"
        height="10"
        viewBox="0 0 56 10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color: theme.crestColor }}
      >
        {/* Grounding chevron */}
        <path
          d="M16 1L28 8L40 1"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Status micro-nodes */}
        <circle cx="12" cy="2" r="1" fill="currentColor" fillOpacity="0.5" />
        <circle cx="28" cy="4" r="1.25" fill="#ffffff" />
        <circle cx="44" cy="2" r="1" fill="currentColor" fillOpacity="0.5" />
      </svg>
    </div>
  );
}

BottomRailAnchor.propTypes = {
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
    >
      {/* Top pylon bracket */}
      <div className="w-1.5 h-3 border border-current rounded-xs opacity-60 flex items-center justify-center">
        <div className="w-0.5 h-1 bg-current opacity-80" />
      </div>

      {/* Middle segmented ticks */}
      <div className="flex flex-col gap-1.5 items-center opacity-70">
        <span className="text-[7px] font-mono leading-none tracking-tighter">■</span>
        <div className="w-1 h-3 border-l border-r border-current opacity-50" />
        <span className="text-[7px] font-mono leading-none tracking-tighter">■</span>
      </div>

      {/* Bottom pylon bracket */}
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
 * RitualFrame — Structural Holographic HUD Object.
 *
 * Implements the Structural Object Mandate:
 * - Angular top and bottom rails with chamfered corners
 * - Mechanical / celestial corner brackets with metallic accent pins
 * - Segmented side edge assemblies (pylons)
 * - Inset dark-glass information plane
 * - Animated energy seams traveling through the structure
 * - Original crest/emitter geometry at selected frame anchors
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {'easy' | 'medium' | 'difficult' | 'neutral'} [props.variant='easy']
 * @param {boolean} [props.hasCrest=true]
 * @param {'positive' | 'negative' | null} [props.flashState=null]
 * @param {string} [props.className='']
 * @param {string} [props.innerClassName='']
 */
export function RitualFrame({
  children,
  variant = 'easy',
  hasCrest = true,
  flashState = null,
  className = '',
  innerClassName = '',
  ...props
}) {
  const shouldReduceMotion = useReducedMotion();
  const theme = DIFFICULTY_THEMES[variant] || DIFFICULTY_THEMES.easy;

  return (
    <div
      className={clsx(
        'relative group',
        theme.glowShadow,
        className
      )}
      {...props}
    >
      {/* ══════════════════════════════════════════════
          1. TOP STRUCTURAL RAIL ASSEMBLY
          ══════════════════════════════════════════════ */}
      <div className="relative w-full flex items-center">
        {/* Left Angular Chamfer Rail */}
        <div className="flex-1 flex items-center">
          <div
            className={clsx(
              'h-1.5 w-4 rounded-tl-sm border-t border-l',
              flashState === 'positive'
                ? 'border-cyan-300'
                : flashState === 'negative'
                ? 'border-rose-400'
                : theme.border
            )}
            style={{
              clipPath: 'polygon(0% 100%, 100% 100%, 100% 0%, 35% 0%, 0% 100%)',
            }}
          />
          <div
            className={clsx(
              'flex-1 h-1 border-t relative overflow-hidden',
              flashState === 'positive'
                ? 'border-cyan-300 bg-cyan-500/20'
                : flashState === 'negative'
                ? 'border-rose-400 bg-rose-500/20'
                : `${theme.border} ${theme.railBg}`
            )}
          >
            {/* Animated Energy Seam traveling across left rail */}
            {!shouldReduceMotion && (
              <div
                className={clsx(
                  'absolute inset-y-0 w-12 bg-linear-to-r opacity-70 animate-pulse',
                  theme.energySeam
                )}
                style={{
                  animation: 'energySeamSweepLeft 3.5s ease-in-out infinite',
                }}
              />
            )}
          </div>
        </div>

        {/* Center Crest Emitter Anchor */}
        {hasCrest ? (
          <TopRailCrest theme={theme} intensity={theme.intensity} />
        ) : (
          <div className="w-6 h-1 border-t border-b border-current opacity-40 mx-1" />
        )}

        {/* Right Angular Chamfer Rail */}
        <div className="flex-1 flex items-center">
          <div
            className={clsx(
              'flex-1 h-1 border-t relative overflow-hidden',
              flashState === 'positive'
                ? 'border-cyan-300 bg-cyan-500/20'
                : flashState === 'negative'
                ? 'border-rose-400 bg-rose-500/20'
                : `${theme.border} ${theme.railBg}`
            )}
          >
            {/* Animated Energy Seam traveling across right rail */}
            {!shouldReduceMotion && (
              <div
                className={clsx(
                  'absolute inset-y-0 w-12 bg-linear-to-r opacity-70 animate-pulse',
                  theme.energySeam
                )}
                style={{
                  animation: 'energySeamSweepRight 3.5s ease-in-out infinite 0.4s',
                }}
              />
            )}
          </div>
          <div
            className={clsx(
              'h-1.5 w-4 rounded-tr-sm border-t border-r',
              flashState === 'positive'
                ? 'border-cyan-300'
                : flashState === 'negative'
                ? 'border-rose-400'
                : theme.border
            )}
            style={{
              clipPath: 'polygon(0% 100%, 100% 100%, 65% 0%, 0% 0%, 0% 100%)',
            }}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          2. SIDE PYLONS & INSET DARK-GLASS PLANE
          ══════════════════════════════════════════════ */}
      <div className="relative">
        {/* Left and Right Side Segmented Pylon Assemblies */}
        <SidePylonAssembly side="left" theme={theme} />
        <SidePylonAssembly side="right" theme={theme} />

        {/* Inset Dark-Glass Information Plane */}
        <div
          className={clsx(
            'relative overflow-hidden transition-all duration-200',
            'bg-obsidian-950/90 backdrop-blur-xl border-x',
            flashState === 'positive'
              ? 'border-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.4)]'
              : flashState === 'negative'
              ? 'border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.4)]'
              : `${theme.border} hover:border-opacity-100`,
            theme.intensity === 'heavy' && 'border-x-2',
            innerClassName
          )}
        >
          {/* Specular Edge Highlight */}
          <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          {/* Mechanical / Arcane Precision Corner Brackets */}
          <div
            className="absolute top-2 left-2 text-[10px] font-mono select-none pointer-events-none"
            style={{ color: theme.accent, opacity: 0.65 }}
          >
            ┌
          </div>
          <div
            className="absolute top-2 right-2 text-[10px] font-mono select-none pointer-events-none"
            style={{ color: theme.accent, opacity: 0.65 }}
          >
            ┐
          </div>
          <div
            className="absolute bottom-2 left-2 text-[10px] font-mono select-none pointer-events-none"
            style={{ color: theme.accent, opacity: 0.65 }}
          >
            └
          </div>
          <div
            className="absolute bottom-2 right-2 text-[10px] font-mono select-none pointer-events-none"
            style={{ color: theme.accent, opacity: 0.65 }}
          >
            ┘
          </div>

          {/* Subtle Cybernetic Grid Pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.035]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, ${theme.accent} 1px, transparent 0)`,
              backgroundSize: '16px 16px',
            }}
          />

          {/* Real Content Injected Here */}
          <div className="relative z-10">{children}</div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          3. BOTTOM STRUCTURAL RAIL ASSEMBLY
          ══════════════════════════════════════════════ */}
      <div className="relative w-full flex items-center">
        {/* Left Foot Rail */}
        <div className="flex-1 flex items-center">
          <div
            className={clsx(
              'h-1.5 w-4 rounded-bl-sm border-b border-l',
              flashState === 'positive'
                ? 'border-cyan-300'
                : flashState === 'negative'
                ? 'border-rose-400'
                : theme.border
            )}
          />
          <div
            className={clsx(
              'flex-1 h-1 border-b',
              flashState === 'positive'
                ? 'border-cyan-300 bg-cyan-500/20'
                : flashState === 'negative'
                ? 'border-rose-400 bg-rose-500/20'
                : `${theme.border} ${theme.railBg}`
            )}
          />
        </div>

        {/* Bottom Grounding Anchor */}
        <BottomRailAnchor theme={theme} />

        {/* Right Foot Rail */}
        <div className="flex-1 flex items-center">
          <div
            className={clsx(
              'flex-1 h-1 border-b',
              flashState === 'positive'
                ? 'border-cyan-300 bg-cyan-500/20'
                : flashState === 'negative'
                ? 'border-rose-400 bg-rose-500/20'
                : `${theme.border} ${theme.railBg}`
            )}
          />
          <div
            className={clsx(
              'h-1.5 w-4 rounded-br-sm border-b border-r',
              flashState === 'positive'
                ? 'border-cyan-300'
                : flashState === 'negative'
                ? 'border-rose-400'
                : theme.border
            )}
          />
        </div>
      </div>
    </div>
  );
}

RitualFrame.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['easy', 'medium', 'difficult', 'neutral']),
  hasCrest: PropTypes.bool,
  flashState: PropTypes.oneOf(['positive', 'negative', null]),
  className: PropTypes.string,
  innerClassName: PropTypes.string,
};

/**
 * Alias export as ForgePanel for modular structural consistency across the application.
 */
export const ForgePanel = RitualFrame;

/**
 * ForgeChamber — Inset structural sub-compartment for framing internal information:
 * title, streak, progress, rewards, and action bays.
 */
export function ForgeChamber({
  children,
  label = null,
  variant = 'default', // 'default' | 'inset' | 'action' | 'highlight'
  className = '',
  ...props
}) {
  const variantStyles = {
    default: 'bg-obsidian-900/50 border border-white/5',
    inset: 'bg-obsidian-950/70 border border-white/5 shadow-inner',
    action: 'bg-obsidian-900/80 border border-white/10 shadow-elevation-subtle',
    highlight: 'bg-white/3 border border-white/10',
  };

  return (
    <div
      className={clsx(
        'relative rounded-xl p-2.5 sm:p-3 transition-colors duration-150',
        variantStyles[variant] || variantStyles.default,
        className
      )}
      {...props}
    >
      {label && (
        <div className="absolute -top-2 left-3 px-1.5 bg-obsidian-950 border border-white/10 rounded-xs text-[9px] font-mono font-bold tracking-widest text-ink-muted uppercase select-none">
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

ForgeChamber.propTypes = {
  children: PropTypes.node.isRequired,
  label: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'inset', 'action', 'highlight']),
  className: PropTypes.string,
};
