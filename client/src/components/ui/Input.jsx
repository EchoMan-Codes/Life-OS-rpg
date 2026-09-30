import { forwardRef } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';

/**
 * iOS-inspired Glassy Minimal Input component.
 * Features frosted glass background, subtle specular border, and smooth focus dynamics.
 */
export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    rightElement,
    className,
    containerClassName,
    id,
    disabled,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={clsx('w-full flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-ink-muted flex items-center justify-between select-none"
        >
          <span>{label}</span>
          {helperText && <span className="text-[10px] text-ink-muted/70">{helperText}</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none shrink-0">
            <Icon size={16} />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={clsx(
            'w-full px-4 py-2.5 rounded-2xl text-sm text-ink placeholder:text-ink-muted/40',
            'bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.08]',
            'border border-white/10 hover:border-white/20 focus:border-white/35',
            'focus:outline-none focus:ring-2 focus:ring-white/10',
            'backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] transition-all duration-200',
            Icon && 'pl-10',
            rightElement && 'pr-11',
            disabled && 'opacity-50 cursor-not-allowed bg-white/[0.02]',
            error && 'border-attr-strength/60 focus:border-attr-strength focus:ring-attr-strength/20',
            className
          )}
          {...props}
        />

        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {rightElement}
          </div>
        )}
      </div>

      {error && (
        <span className="text-[11px] font-medium text-attr-strength animate-in fade-in duration-150">
          {error}
        </span>
      )}
    </div>
  );
});

Input.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  icon: PropTypes.elementType,
  rightElement: PropTypes.node,
  className: PropTypes.string,
  containerClassName: PropTypes.string,
  id: PropTypes.string,
  disabled: PropTypes.bool,
};

/**
 * iOS-inspired Glassy Minimal Textarea component.
 */
export const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    helperText,
    className,
    containerClassName,
    id,
    rows = 3,
    disabled,
    ...props
  },
  ref
) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={clsx('w-full flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label
          htmlFor={textareaId}
          className="text-xs font-medium text-ink-muted flex items-center justify-between select-none"
        >
          <span>{label}</span>
          {helperText && <span className="text-[10px] text-ink-muted/70">{helperText}</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        disabled={disabled}
        className={clsx(
          'w-full px-4 py-2.5 rounded-2xl text-sm text-ink placeholder:text-ink-muted/40 resize-none',
          'bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.08]',
          'border border-white/10 hover:border-white/20 focus:border-white/35',
          'focus:outline-none focus:ring-2 focus:ring-white/10',
          'backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] transition-all duration-200',
          disabled && 'opacity-50 cursor-not-allowed bg-white/[0.02]',
          error && 'border-attr-strength/60 focus:border-attr-strength focus:ring-attr-strength/20',
          className
        )}
        {...props}
      />

      {error && (
        <span className="text-[11px] font-medium text-attr-strength animate-in fade-in duration-150">
          {error}
        </span>
      )}
    </div>
  );
});

Textarea.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  className: PropTypes.string,
  containerClassName: PropTypes.string,
  id: PropTypes.string,
  rows: PropTypes.number,
  disabled: PropTypes.bool,
};
