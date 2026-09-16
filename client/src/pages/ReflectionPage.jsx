import { Moon, HeartPulse } from 'lucide-react';
import { RestModeBanner } from '@/components/hud/RestModeBanner';
import { EveningReflectionCard } from '@/components/reflection/EveningReflectionCard';
import { ConsistencyHeatmap } from '@/components/reflection/ConsistencyHeatmap';
import { useRestModeStatus, useDeactivateRestMode } from '@/features/rest-mode/hooks';

/**
 * Reflection & Wellness page — Phase 5.2.
 * Houses the Evening Reflection card, 30-day Consistency Heatmap, and Rest Mode controls.
 */
export default function ReflectionPage() {
  const { data: restStatus } = useRestModeStatus();
  const deactivateMutation = useDeactivateRestMode();

  const handleDeactivate = async () => {
    try {
      await deactivateMutation.mutateAsync();
    } catch (err) {
      console.error('Failed to deactivate rest mode:', err);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* 1. Header */}
      <div>
        <div className="flex items-center gap-2 text-ink-muted text-xs font-mono uppercase tracking-wider mb-1">
          <HeartPulse size={14} className="text-teal-400" />
          <span>Phase 5.2 • Wellness Layer</span>
        </div>
        <h1 className="text-display-lg text-ink mb-1.5">Evening Reflection & Wellness</h1>
        <p className="text-body text-ink-muted max-w-2xl">
          A calm, non-gamified space to decompress, track consistency, and protect against burnout.
        </p>
      </div>

      {/* 2. Quiet Rest Mode Suggestion Banner (when suggested and inactive) */}
      <RestModeBanner />

      {/* 3. Active Rest Mode Status Card (when active) */}
      {restStatus?.isActive && (
        <div className="rounded-card p-4 sm:p-5 bg-teal-950/30 border border-teal-700/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-teal-900/60 border border-teal-600/50 flex items-center justify-center text-teal-300 shrink-0">
              <Moon size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-300">
                  Rest Mode Active
                </span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-teal-900/80 text-teal-200 border border-teal-700/50">
                  Penalties Paused
                </span>
              </div>
              <p className="text-xs text-teal-200/90 mt-0.5">
                {restStatus.reason || 'Rest and recovery'} • Daily reset HP penalties are 100% paused.
                {restStatus.autoDeactivateAt && (
                  <span className="block sm:inline sm:ml-1 text-teal-300/80 font-mono text-[11px]">
                    (Auto-deactivates {new Date(restStatus.autoDeactivateAt).toLocaleDateString()})
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDeactivate}
            disabled={deactivateMutation.isPending}
            className="px-3.5 py-1.5 rounded-panel text-xs font-semibold text-teal-200 hover:text-white bg-teal-900/60 hover:bg-teal-800 border border-teal-600/50 transition-colors min-h-[40px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400"
          >
            {deactivateMutation.isPending ? 'Resuming...' : 'Resume Game (Deactivate Rest Mode)'}
          </button>
        </div>
      )}

      {/* 4. Evening Reflection Card & Consistency Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <EveningReflectionCard />
        </div>
        <div className="lg:col-span-6">
          <ConsistencyHeatmap />
        </div>
      </div>
    </div>
  );
}
