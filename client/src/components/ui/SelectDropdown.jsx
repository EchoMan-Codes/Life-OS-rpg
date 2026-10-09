import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import clsx from 'clsx';
import { spring } from '@/lib/motionVariants';

/**
 * Top-notch customizable Dropdown component.
 * Replaces ugly native <select> elements with an Apple/Linear grade glassmorphic menu.
 * Supports leading icons, color dots, badges, and keyboard navigation.
 */
export function SelectDropdown({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  disabled = false,
  className,
  buttonClassName,
  menuClassName,
  size = 'md',
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Normalize options: can be strings or objects { value, label, icon, badge, color }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: opt, label: String(opt) };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (optValue) => {
    onChange?.(optValue);
    setIsOpen(false);
  };

  const isSmall = size === 'sm';

  return (
    <div ref={containerRef} className={clsx('relative inline-block w-full', className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-ink-muted block pl-1 mb-1.5 select-none"
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={clsx(
          'w-full flex items-center justify-between gap-2.5 transition-all select-none cursor-pointer text-left',
          'rounded-2xl border backdrop-blur-xl shadow-xs',
          isSmall ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2.5 text-xs sm:text-sm font-medium',
          isOpen
            ? 'bg-white dark:bg-white/[0.08] border-indigo-400 dark:border-indigo-400/60 ring-2 ring-indigo-400/20 text-slate-900 dark:text-ink'
            : 'bg-white/80 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.07] border-slate-200/90 dark:border-white/10 text-slate-800 dark:text-ink',
          disabled && 'opacity-50 cursor-not-allowed',
          buttonClassName
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption?.icon && (
            <selectedOption.icon size={15} className="text-slate-400 dark:text-ink-muted shrink-0" />
          )}
          {selectedOption?.color && (
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          <span className={clsx('truncate', !selectedOption && 'text-slate-400 dark:text-ink-muted')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-ink-muted shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          size={15}
          className={clsx(
            'text-slate-400 dark:text-ink-muted shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180 text-indigo-500 dark:text-indigo-400'
          )}
        />
      </button>

      {/* Dropdown Popover Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={spring.snappy}
            className={clsx(
              'absolute left-0 top-full mt-1.5 z-50 p-1.5 min-w-full w-max max-w-[280px]',
              'rounded-2xl border shadow-2xl backdrop-blur-3xl overflow-hidden',
              'bg-white/95 dark:bg-[#0D0F18]/95 border-slate-200/90 dark:border-white/15',
              'max-h-64 overflow-y-auto custom-scrollbar',
              menuClassName
            )}
            role="listbox"
          >
            {normalizedOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 dark:text-ink-muted">
                No options available
              </div>
            ) : (
              normalizedOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={clsx(
                      'w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-left transition-all text-xs cursor-pointer',
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-900 dark:text-white font-semibold'
                        : 'text-slate-700 dark:text-ink-muted hover:text-slate-900 dark:hover:text-ink hover:bg-slate-100/80 dark:hover:bg-white/[0.06]'
                    )}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {opt.icon && <opt.icon size={14} className="shrink-0 text-slate-400 dark:text-ink-muted" />}
                      {opt.color && (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: opt.color }}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate">{opt.label}</div>
                        {opt.description && (
                          <div className="text-[10px] text-slate-400 dark:text-ink-muted truncate">
                            {opt.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-ink-muted">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
                    </div>
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

SelectDropdown.propTypes = {
  label: PropTypes.string,
  value: PropTypes.any,
  onChange: PropTypes.func,
  options: PropTypes.array,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  buttonClassName: PropTypes.string,
  menuClassName: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  id: PropTypes.string,
};
