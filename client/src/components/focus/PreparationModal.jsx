import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Shield,
  Clock,
  Sparkles,
  Lock,
  Coins,
  X,
  Target,
  ExternalLink,
} from 'lucide-react';
import { distractionShield } from '@/features/focus/shield';

export default function PreparationModal({
  isOpen,
  onClose,
  onConfirm,
  isStarting,
  sessionConfig,
  capabilities,
}) {
  if (!isOpen) return null;

  const plannedMinutes = Math.round((sessionConfig.plannedDurationSeconds || 1500) / 60);
  const baseXP = plannedMinutes;
  const baseGold = Math.floor(plannedMinutes * 0.5);
  const baseMana = Math.round(plannedMinutes * 1.5);

  const multiplier =
    sessionConfig.commitmentLevel === 3 ? 1.25 : sessionConfig.commitmentLevel === 2 ? 1.15 : 1.0;

  const totalXP = Math.round(baseXP * multiplier);
  const totalGold = Math.floor(baseGold * multiplier);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/30 text-slate-900 dark:text-white shadow-2xl relative max-h-[90vh] overflow-y-auto"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full bg-slate-100 dark:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 dark:border-indigo-500/40">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Focus Chamber Briefing</h3>
              <p className="text-xs text-indigo-600 dark:text-indigo-300 font-mono">Pre-flight Verification</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {/* Goal & Duration Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  <span>Objective</span>
                </span>
                <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[220px]">
                  {sessionConfig.taskTitle || sessionConfig.goalDescription || 'Free Flow Deep Sprint'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                  <span>Duration</span>
                </span>
                <span className="font-mono font-semibold text-sky-600 dark:text-sky-300">
                  {plannedMinutes} minutes ({sessionConfig.plannedDurationSeconds}s)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>Commitment</span>
                </span>
                <span className="font-semibold text-amber-600 dark:text-amber-300">
                  Level {sessionConfig.commitmentLevel}:{' '}
                  {sessionConfig.commitmentLevel === 3
                    ? 'Maximum Shield (+25% Bonus)'
                    : sessionConfig.commitmentLevel === 2
                    ? 'Commitment Lock (+15% Bonus)'
                    : 'Standard Flow'}
                </span>
              </div>
            </div>

            {/* Distraction Shield Details */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span>Shield Profile</span>
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-300">
                  {sessionConfig.shieldProfile?.name || 'Standard Distraction Filter'}
                </span>
              </div>
              {sessionConfig.shieldProfile?.restrictedApps?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {sessionConfig.shieldProfile.restrictedApps.map((a) => (
                    <span
                      key={a.id || a.name}
                      className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-600 dark:text-emerald-300 font-medium"
                    >
                      {a.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Rewards Summary */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-gradient-to-br dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  <span>Completion Rewards</span>
                </span>
                {multiplier > 1 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                    +{Math.round((multiplier - 1) * 100)}% Lock Bonus
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-white dark:bg-black/40 border border-slate-200/80 dark:border-white/5 shadow-xs dark:shadow-none">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">XP</div>
                  <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">+{totalXP}</div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-black/40 border border-slate-200/80 dark:border-white/5 shadow-xs dark:shadow-none">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-center space-x-1">
                    <Coins className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400" />
                    <span>Gold</span>
                  </div>
                  <div className="text-sm font-bold text-amber-500 dark:text-amber-400">+{totalGold}</div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-black/40 border border-slate-200/80 dark:border-white/5 shadow-xs dark:shadow-none">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Mana</div>
                  <div className="text-sm font-bold text-sky-600 dark:text-sky-400">+{baseMana}</div>
                </div>
              </div>
            </div>

            {/* Platform Capabilities & Permissions status */}
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/5 text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                <span>Platform Enforcement</span>
                <span className="text-indigo-600 dark:text-indigo-400 uppercase">{capabilities?.platform || 'WEB'}</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {capabilities?.degradedModeExplanation ||
                  'Jeevan operates in honest accountability mode. App switching and visibility changes are recorded accurately.'}
              </p>
              {capabilities?.platform === 'android' && !capabilities?.usageAccessGranted && (
                <div className="flex space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => distractionShield.requestUsageAccess()}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-500/30 text-[10px] text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 transition-colors flex items-center justify-center space-x-1"
                  >
                    <span>Grant Usage Access</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => distractionShield.requestOverlayPermission()}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-500/30 text-[10px] text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 transition-colors flex items-center justify-center space-x-1"
                  >
                    <span>Grant Overlay</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isStarting}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
            >
              Adjust Settings
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isStarting}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-xs font-bold text-white transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>{isStarting ? 'Engaging...' : 'Engage Focus Chamber'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

PreparationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isStarting: PropTypes.bool,
  sessionConfig: PropTypes.object.isRequired,
  capabilities: PropTypes.object,
};
