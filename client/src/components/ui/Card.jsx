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
export function Card({ variant = 'default', className, children, ...props }) {
  const variants = {
    default: clsx(
      'bg-glass border border-glass-border',
      'backdrop-blur-glass rounded-panel',
      'shadow-glow'
    ),
    hud: clsx(
      'bg-white/[0.07] border border-white/[0.12]',
      'backdrop-blur-[24px] rounded-panel',
      'shadow-glow'
    ),
  };

  return (
    <div className={clsx(variants[variant], className)} {...props}>
      {children}
    </div>
  );
}
