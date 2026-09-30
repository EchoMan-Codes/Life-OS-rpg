import clsx from 'clsx';

/**
 * Glass-panel card component.
 *
 * Two surface levels per design-system rules:
 * - default: quiet glass card (most UI surfaces)
 * - hud: bold glass HUD panel (stronger blur/opacity — the one deliberately loud surface)
 *
 * @param {object} props
 * @param {'default'|'hud'} [props.variant='default'] - Surface variant
 * @param {string} [props.className] - Additional classes
 * @param {React.ReactNode} props.children
 */
export function Card({ variant = 'default', interactive = false, className, children, ...props }) {
  const variants = {
    default: clsx(
      'bg-obsidian-900/60 border border-white/[0.10]',
      'backdrop-blur-2xl rounded-3xl',
      'shadow-[0_8px_32px_rgba(0,0,0,0.37),inset_0_1px_0_rgba(255,255,255,0.12)]'
    ),
    hud: clsx(
      'bg-obsidian-900/80 border border-white/[0.16]',
      'backdrop-blur-3xl rounded-3xl',
      'shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.2)]'
    ),
    minimal: clsx(
      'bg-white/[0.04] border border-white/[0.08]',
      'backdrop-blur-xl rounded-2xl',
      'shadow-[0_4px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.08)]'
    ),
  };

  return (
    <div
      className={clsx(
        variants[variant] || variants.default,
        interactive && 'hover:border-white/25 active:scale-[0.98] transition-all duration-200 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

