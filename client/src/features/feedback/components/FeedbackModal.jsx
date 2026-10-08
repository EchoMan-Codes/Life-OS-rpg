import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  X,
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Bug,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Loader2,
  Headphones,
} from 'lucide-react';
import clsx from 'clsx';
import { useSubmitFeedback } from '../hooks';
import { isNativePlatform } from '@/lib/native/nativeApp';
import { playSound } from '@/lib/sound';

const CATEGORIES = [
  { id: 'suggestion', label: 'Suggestion', icon: Lightbulb, color: 'text-amber-500' },
  { id: 'bug_report', label: 'Bug Report', icon: Bug, color: 'text-rose-500' },
  { id: 'feature_request', label: 'Feature Request', icon: Sparkles, color: 'text-purple-500' },
  { id: 'ui_ux', label: 'UI / UX Polish', icon: MessageSquare, color: 'text-sky-500' },
  { id: 'general', label: 'General', icon: HelpCircle, color: 'text-slate-400' },
];

export function FeedbackModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('feedback'); // 'feedback' | 'contact'
  const [category, setCategory] = useState('suggestion');
  const [message, setMessage] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const submitMutation = useSubmitFeedback();
  const platform = isNativePlatform() ? 'android' : 'web';
  const appVersion = '1.0.0-mobile';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || submitMutation.isPending) return;

    try {
      await submitMutation.mutateAsync({
        category,
        message: message.trim(),
        appVersion,
        platform,
        attachmentUrl: attachmentUrl.trim() || null,
      });

      playSound('achievement');
      setSubmittedSuccess(true);
      setMessage('');
      setAttachmentUrl('');
    } catch (err) {
      console.error('Feedback submission failed:', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-white/85 dark:bg-[#0B0D14]/75 backdrop-blur-3xl border border-white/70 dark:border-white/18 shadow-[0_20px_60px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shadow-xs">
                  <Headphones size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-ink font-display">
                    Help & Support Sanctum
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-ink-muted">
                    Feedback, bug reports & contact center
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Segmented Switcher */}
            <div className="p-3 border-b border-slate-200/60 dark:border-white/5 bg-slate-50/40 dark:bg-white/[0.01]">
              <div className="p-1 rounded-2xl bg-slate-100 dark:bg-obsidian-950/80 border border-slate-200/80 dark:border-white/10 grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('feedback');
                    setSubmittedSuccess(false);
                  }}
                  className={clsx(
                    'py-2 px-3 rounded-xl text-xs font-bold transition-all text-center',
                    activeTab === 'feedback'
                      ? 'bg-white text-slate-950 dark:bg-white/[0.12] dark:text-ink shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-ink-muted dark:hover:text-ink'
                  )}
                >
                  Give Feedback
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('contact')}
                  className={clsx(
                    'py-2 px-3 rounded-xl text-xs font-bold transition-all text-center',
                    activeTab === 'contact'
                      ? 'bg-white text-slate-950 dark:bg-white/[0.12] dark:text-ink shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-ink-muted dark:hover:text-ink'
                  )}
                >
                  Contact Support
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {activeTab === 'feedback' ? (
                <>
                  {submittedSuccess ? (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                        <CheckCircle2 size={24} />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-ink font-display">
                        Feedback Submitted!
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Thank you for helping us elevate Jeevan. Your telemetry and thoughts directly guide our upcoming releases.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSubmittedSuccess(false)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                      >
                        Submit Another Note
                      </button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Category Selector */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                          Category
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {CATEGORIES.map((cat) => {
                            const isSelected = category === cat.id;
                            const Icon = cat.icon;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => setCategory(cat.id)}
                                className={clsx(
                                  'flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer',
                                  isSelected
                                    ? 'bg-indigo-50/80 border-indigo-400 text-indigo-900 dark:bg-white/[0.12] dark:border-white/30 dark:text-ink shadow-xs'
                                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 dark:bg-white/[0.02] dark:border-white/10 dark:text-slate-400'
                                )}
                              >
                                <Icon size={14} className={cat.color} />
                                <span className="truncate">{cat.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Message Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                          <span>Your Feedback or Issue</span>
                          <span className="text-[10px] font-mono text-slate-400">{message.length}/3000</span>
                        </label>
                        <textarea
                          rows={4}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Describe your idea, bug encountered, or feature suggestion in detail..."
                          className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-ink placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Optional Attachment / Reference */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                          Attachment Reference or Link (Optional)
                        </label>
                        <input
                          type="text"
                          value={attachmentUrl}
                          onChange={(e) => setAttachmentUrl(e.target.value)}
                          placeholder="Screenshot URL, Loom, or drive link..."
                          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-ink placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Diagnostics Metadata Info */}
                      <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-ink-muted">
                        <span>App Version: {appVersion}</span>
                        <span>Platform: {platform.toUpperCase()}</span>
                      </div>

                      {submitMutation.isError && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                          <AlertTriangle size={14} className="shrink-0" />
                          <span>{submitMutation.error?.message || 'Failed to submit feedback. Please try again.'}</span>
                        </div>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={message.trim().length < 5 || submitMutation.isPending}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50 active:scale-98"
                      >
                        {submitMutation.isPending ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <>
                            <Send size={15} />
                            <span>Submit Feedback</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </>
              ) : (
                /* Contact Us Tab */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-cyan-500/10 border border-indigo-500/20 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider font-display text-indigo-700 dark:text-indigo-300 block">
                      Direct Human Support
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Need help with account recovery, billing, synchronization issues, or custom integration? Our team is directly reachable.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {/* Support Channels */}
                    <a
                      href="mailto:support@jeevan.app?subject=Jeevan%20Support%20Request"
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 transition-all text-xs text-slate-900 dark:text-ink font-semibold"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <Mail size={16} />
                        </div>
                        <div>
                          <div>Email Support</div>
                          <div className="text-[11px] font-normal text-slate-500 dark:text-ink-muted">
                            support@jeevan.app
                          </div>
                        </div>
                      </div>
                      <ExternalLink size={14} className="text-slate-400" />
                    </a>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 space-y-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-ink flex items-center gap-2">
                        <Bug size={14} className="text-rose-500" />
                        <span>Security & Critical Bug Reports</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-ink-muted">
                        Submit directly via the Give Feedback tab under &quot;Bug Report&quot; for instant triage by our engineering pipeline.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 space-y-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-ink flex items-center gap-2">
                        <Sparkles size={14} className="text-purple-500" />
                        <span>Feature Requests & Ideas</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-ink-muted">
                        Have a feature idea or RPG mechanic proposal? Submit under &quot;Feature Request&quot; to influence upcoming roadmap phases.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 text-center">
                    <p className="text-[11px] font-mono text-slate-400 dark:text-ink-muted">
                      Typical support response SLA: 24–48 hours
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
