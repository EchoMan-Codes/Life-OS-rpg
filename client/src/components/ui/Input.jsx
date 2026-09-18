import { forwardRef } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';

/**
 * Canonical LifeOS Input component (text, password, email, number, textarea).
 *
 * Enforces:
 * - 44px minimum interactive height for mobile touch ergonomics
 * - Consistent 2px focus ring with semantic accent color
 * - Accessible label and error message linkage (aria-invalid, aria-describedby)
 */
export const Input = forwardRef(function Input(
  {
    label,
    helperText,
    error,
    id,
    type = 'text',
    className,
    multiline = false,
    rows = 3,
    disabled = false,
    required = false,
    ...props
  },
  ref
) {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  const baseClasses = clsx(
    'w-full px-3.5 py-2.5 rounded-control font-body text-sm',
    'bg-obsidian-800 border transition-all duration-150',
    'text-ink placeholder:text-ink-muted/50',
    'focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary',
    error
      ? 'border-danger focus:ring-danger focus:border-danger'
      : 'border-glass-border hover:border-glass-border-strong',
    disabled ? 'opacity-50 cursor-not-allowed bg-obsidian-900' : 'cursor-text',
    !multiline && 'min-h-[44px]'
  );

  const Component = multiline ? 'textarea' : 'input';

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-ink-muted select-none flex items-center gap-1"
        >
          <span>{label}</span>
          {required && <span className="text-danger">*</span>}
        </label>
      )}

      <Component
        ref={ref}
        id={inputId}
        type={multiline ? undefined : type}
        rows={multiline ? rows : undefined}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId || helperId}
        className={clsx(baseClasses, className)}
        {...props}
      />

      {error ? (
        <p id={errorId} className="text-xs text-danger font-medium mt-0.5">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-ink-muted mt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Input.propTypes = {
  label: PropTypes.string,
  helperText: PropTypes.string,
  error: PropTypes.string,
  id: PropTypes.string,
  type: PropTypes.string,
  className: PropTypes.string,
  multiline: PropTypes.bool,
  rows: PropTypes.number,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
};
