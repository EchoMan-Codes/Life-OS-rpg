import { motion } from 'framer-motion';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import { spring } from '@/lib/motion';

/**
 * Canonical LifeOS Tabs component with smoothly sliding indicator.
 *
 * @param {object} props
 * @param {Array<{ id: string, label: string, icon?: React.ComponentType, count?: number }>} props.tabs
 * @param {string} props.activeTab - Current active tab ID
 * @param {(id: string) => void} props.onChange - Tab selection callback
 * @param {string} [props.className]
 */
export function Tabs({ tabs = [], activeTab, onChange, className }) {
  return (
    <div
      role="tablist"
      className={clsx(
        'relative inline-flex items-center gap-1 p-1 rounded-control bg-obsidian-950/80 border border-glass-border',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'relative z-10 flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium rounded-control select-none cursor-pointer',
              'min-h-[38px] hit-area-expand transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary',
              isActive ? 'text-ink font-semibold' : 'text-ink-muted hover:text-ink'
            )}
          >
            {/* Sliding background pill indicator */}
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 z-[-1] rounded-control bg-obsidian-800 border border-glass-border-strong shadow-elevation-subtle"
                transition={spring.snappy}
              />
            )}

            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={clsx(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                  isActive ? 'bg-accent-primary/20 text-accent-primary' : 'bg-white/10 text-ink-muted'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType,
      count: PropTypes.number,
    })
  ).isRequired,
  activeTab: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
};
