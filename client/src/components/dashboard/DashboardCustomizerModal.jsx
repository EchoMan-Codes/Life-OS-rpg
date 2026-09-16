import PropTypes from 'prop-types';
import clsx from 'clsx';
import { X, Check, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { Modal } from '@/components/ui';

const SECTIONS_METADATA = [
  { key: 'priorities', label: 'Today’s Priorities', description: 'Due dailies and high-priority quests' },
  { key: 'focus', label: 'Deep Work Focus Chamber', description: 'Active countdown and quick-launch presets' },
  { key: 'goals', label: 'Active Goals & Quests', description: 'Multi-step goals, milestones, and progress bars' },
  { key: 'analytics', label: 'Productivity Analytics', description: 'Weekly activity velocity and focus vs tasks chart' },
  { key: 'timeline', label: 'Today’s Flow & Timeline', description: 'Chronological schedule of daily routines' },
  { key: 'habits', label: 'Habits & Momentum', description: 'Tactile 1-click habit check-ins and streaks' },
  { key: 'insights', label: 'LifeOS Insights & Signals', description: 'Data-driven trends and burnout prevention alerts' },
];

/**
 * Modal to customize dashboard layout, widget visibility, and density.
 */
export function DashboardCustomizerModal({
  isOpen,
  onClose,
  visibleSections = {},
  onToggleSection,
  density = 'comfortable',
  onSetDensity,
  onResetPreferences,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-5 max-w-md">
        <div className="flex items-center justify-between border-b border-glass-border pb-3">
          <div>
            <h3 className="text-display-xs text-ink font-display font-semibold">
              Customize Command Center
            </h3>
            <p className="text-caption text-ink-muted">
              Tailor sections and layout density to match your flow.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close customizer"
            className="p-1 rounded-chip text-ink-muted hover:text-ink hover:bg-glass transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. Layout Density */}
        <div className="space-y-2">
          <label className="text-caption font-semibold uppercase tracking-wider text-ink block">
            Layout Density
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSetDensity('comfortable')}
              className={clsx(
                'p-2.5 rounded-panel border text-xs font-medium transition-all flex items-center justify-between min-h-[44px]',
                density === 'comfortable'
                  ? 'bg-glass border-glass-border-focus text-ink font-semibold'
                  : 'bg-obsidian-900/60 border-glass-border text-ink-muted hover:text-ink'
              )}
            >
              <span>Comfortable Spacing</span>
              {density === 'comfortable' && <Check size={14} className="text-emerald-400" />}
            </button>
            <button
              type="button"
              onClick={() => onSetDensity('compact')}
              className={clsx(
                'p-2.5 rounded-panel border text-xs font-medium transition-all flex items-center justify-between min-h-[44px]',
                density === 'compact'
                  ? 'bg-glass border-glass-border-focus text-ink font-semibold'
                  : 'bg-obsidian-900/60 border-glass-border text-ink-muted hover:text-ink'
              )}
            >
              <span>Compact Command</span>
              {density === 'compact' && <Check size={14} className="text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* 2. Visible Sections Toggle List */}
        <div className="space-y-2">
          <label className="text-caption font-semibold uppercase tracking-wider text-ink block">
            Active Dashboard Sections
          </label>
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {SECTIONS_METADATA.map((section) => {
              const isVisible = visibleSections[section.key] !== false;

              return (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => onToggleSection(section.key)}
                  className={clsx(
                    'w-full p-2.5 rounded-panel border text-left transition-all',
                    'flex items-center justify-between gap-3 min-h-[44px]',
                    isVisible
                      ? 'bg-obsidian-900/80 border-glass-border text-ink'
                      : 'bg-obsidian-900/30 border-glass-border/40 text-ink-muted/60'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className={clsx('text-xs font-medium truncate', isVisible ? 'text-ink' : 'text-ink-muted')}>
                      {section.label}
                    </p>
                    <p className="text-[11px] text-ink-muted/70 truncate mt-0.5">
                      {section.description}
                    </p>
                  </div>

                  <div className="shrink-0 text-ink-muted">
                    {isVisible ? (
                      <Eye size={16} className="text-emerald-400" />
                    ) : (
                      <EyeOff size={16} className="text-ink-muted/50" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-glass-border">
          <button
            type="button"
            onClick={onResetPreferences}
            className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
          >
            <RotateCcw size={13} />
            <span>Reset to Defaults</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-panel text-xs font-semibold text-ink bg-glass hover:bg-glass/80 border border-glass-border transition-colors min-h-[36px]"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}

DashboardCustomizerModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  visibleSections: PropTypes.object,
  onToggleSection: PropTypes.func.isRequired,
  density: PropTypes.string,
  onSetDensity: PropTypes.func.isRequired,
  onResetPreferences: PropTypes.func.isRequired,
};
