import { motion } from 'framer-motion';
import { Moon, HeartPulse, Sparkles, ShieldCheck, Smile } from 'lucide-react';
import { RestModeBanner } from '@/components/hud/RestModeBanner';
import { EveningReflectionCard } from '@/components/reflection/EveningReflectionCard';
import { ConsistencyHeatmap } from '@/components/reflection/ConsistencyHeatmap';
import { useRestModeStatus, useDeactivateRestMode } from '@/features/rest-mode/hooks';
import { spring } from '@/lib/motionVariants';

/**
 * Reflection & Wellness Page — Phase 5.2.
 * Redesigned with Glassy iOS Cockpit, Mindful Teal palette, and smooth motion.
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
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* ── 1. Glassy iOS Cockpit Header (Mindful Teal Theme) ── */}
      <section className="relative rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-white via-teal-50/40 to-slate-50 border border-slate-200/80 shadow-[0_10px_35px_rgba(0,0,0,0.05)] dark:from-obsidian-900/85 dark:via-obsidian-900/65 dark:to-obsidian-800/75 dark:border-white/15 dark:shadow-[0_16px_48px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-2xl overflow-hidden">
        {/* Ambient atmospheric glows */}
        <div className="absolute -top-24 -left-20 w-80 h-80 bg-teal-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-mono font-semibold">
              <HeartPulse size={13} className="text-teal-600 dark:text-teal-400 animate-pulse" />
              <span>ANTI-BURNOUT DEFENSE • WELLNESS SANCTUARY</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-ink tracking-tight font-display">
              Evening Reflection & Wellness
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-ink-muted leading-relaxed max-w-xl">
              A serene decompression zone. Review today’s energy, log 30-day consistency reflections, and activate Rest Mode to shield your character from burnout penalties.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 flex items-center gap-2 font-mono text-xs shadow-xs">
              <Moon size={16} />
              <span>30-Day Heatmap</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Quiet Rest Mode Suggestion Banner ── */}
      <RestModeBanner />

      {/* ── 3. Active Rest Mode Status Card (when active) ── */}
      {restStatus?.isActive && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-5 bg-gradient-to-r from-teal-950/60 via-teal-900/40 to-obsidian-900/80 border border-teal-500/40 backdrop-blur-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_8px_32px_rgba(20,184,166,0.15)]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 shrink-0">
              <Moon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-300 font-mono">
                  Rest Mode Active
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-200 border border-teal-500/40 font-semibold">
                  HP Penalties 100% Paused
                </span>
              </div>
              <p className="text-xs text-teal-100/90 mt-1 leading-relaxed">
                {restStatus.reason || 'Rest and recovery'} • Your character is protected from daily reset penalties.
                {restStatus.autoDeactivateAt && (
                  <span className="block sm:inline sm:ml-1 text-teal-300/80 font-mono text-[11px]">
                    (Auto-deactivates {new Date(restStatus.autoDeactivateAt).toLocaleDateString()})
                  </span>
                )}
              </p>
            </div>
          </div>

          <motion.button
            type="button"
            onClick={handleDeactivate}
            disabled={deactivateMutation.isPending}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-obsidian bg-teal-400 hover:bg-teal-300 transition-all shadow-md min-h-[44px] shrink-0"
          >
            {deactivateMutation.isPending ? 'Resuming...' : 'Deactivate Rest Mode'}
          </motion.button>
        </motion.div>
      )}

      {/* ── 4. Evening Reflection Card & Consistency Heatmap ── */}
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
