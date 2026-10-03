import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Send,
  Sparkles,
  Bot,
  Calendar,
  Wallet,
  BookOpen,
  Flame,
  BarChart3,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import clsx from 'clsx';

import {
  useAiHistory,
  useSendAiMessage,
  useConfirmAiAction,
  useCancelAiAction,
} from '../hooks';
import { JeevanLogo } from '@/components/ui/JeevanLogo';

const SUGGESTED_PROMPTS = [
  { label: 'Plan tomorrow', icon: Calendar, text: 'Plan tomorrow' },
  { label: 'I spent ₹450 today', icon: Wallet, text: 'I spent ₹450 on dinner today' },
  { label: 'I studied DBMS for 2 hours', icon: BookOpen, text: 'I studied DBMS for 2 hours' },
  { label: 'Why am I losing my streak?', icon: Flame, text: 'Why am I losing my streak?' },
  { label: 'Weekly AI Life Review', icon: BarChart3, text: 'Weekly AI Life Review' },
  { label: 'Check goal risks', icon: Target, text: 'Check goal risks' },
  { label: 'Am I overloaded?', icon: Clock, text: 'Am I overloaded with tasks?' },
];

/**
 * Universal Jeevan AI Life Intelligence Chat & Action Interface.
 */
export function AiChatView({ isModal = false, onClose }) {
  const shouldReduceMotion = useReducedMotion();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { data: messages = [], isLoading: historyLoading } = useAiHistory();
  const sendMutation = useSendAiMessage();
  const confirmMutation = useConfirmAiAction();
  const cancelMutation = useCancelAiAction();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sendMutation.isPending]);

  const handleSend = async (textToSend) => {
    const queryText = (textToSend || inputText).trim();
    if (!queryText || sendMutation.isPending) return;

    setInputText('');
    try {
      await sendMutation.mutateAsync(queryText);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleConfirmAction = async (messageId) => {
    try {
      await confirmMutation.mutateAsync(messageId);
    } catch (err) {
      console.error('Failed to confirm action:', err);
    }
  };

  const handleCancelAction = async (messageId) => {
    try {
      await cancelMutation.mutateAsync(messageId);
    } catch (err) {
      console.error('Failed to cancel action:', err);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#080711] text-white selection:bg-purple-600 selection:text-white relative overflow-hidden">
      {/* ── Ambient Radial Glows ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-b from-purple-700/20 via-indigo-600/10 to-transparent rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[140px]" />
      </div>

      {/* ── Top Header ── */}
      <header className="relative z-10 px-4 sm:px-6 py-3.5 border-b border-white/10 backdrop-blur-xl bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 border border-purple-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold font-display text-white tracking-tight">
                Jeevan AI
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-widest uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                LIFE INTELLIGENCE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Plan Smarter. Live Better.
            </p>
          </div>
        </div>

        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        )}
      </header>

      {/* ── Chat Messages Body ── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
        {/* If no history yet, display hero companion greeting & suggested prompt chips */}
        {messages.length === 0 && !historyLoading && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center max-w-md mx-auto pt-4 pb-2 space-y-5"
          >
            {/* Animated Avatar Companion Orb */}
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-b from-[#1F123C] via-[#110B27] to-[#070512] p-1 shadow-[0_0_40px_rgba(168,85,247,0.5)] border border-purple-400/50 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#080514] border border-cyan-500/30 flex flex-col items-center justify-center">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#22D3EE]" />
                  <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#22D3EE]" />
                </div>
                <div className="w-4 h-0.5 rounded-full bg-cyan-300/70 mt-1.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-black font-display text-white">
                Hi! I&apos;m Jeevan AI.
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                Your personal life assistant. I can help you plan, track, analyze, and improve your entire ecosystem.
              </p>
            </div>

            {/* Suggested Prompts Cards */}
            <div className="w-full space-y-2 pt-2 text-left">
              <p className="text-[10px] font-mono uppercase tracking-wider text-purple-300/80 px-1">
                Suggested Actions
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => {
                  const Icon = prompt.icon;
                  return (
                    <motion.button
                      key={prompt.label}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSend(prompt.text)}
                      className="p-3 rounded-2xl bg-white/[0.03] hover:bg-purple-900/25 border border-white/10 hover:border-purple-500/40 text-left transition-all flex items-center justify-between group cursor-pointer shadow-md"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:text-purple-200">
                          <Icon size={14} />
                        </div>
                        <span className="text-xs font-medium text-slate-200 group-hover:text-white">
                          {prompt.label}
                        </span>
                      </div>
                      <ChevronRight size={13} className="text-slate-500 group-hover:text-purple-300 transition-transform group-hover:translate-x-0.5" />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Render Conversation Messages Stream */}
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const actionType = msg.actionType || msg.action_type;
          const rawPayload = msg.actionPayload || msg.action_payload;
          let actionPayload = null;
          try {
            actionPayload = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
          } catch {
            actionPayload = rawPayload;
          }
          const actionStatus = msg.actionStatus || msg.action_status;
          const hasAction = Boolean(actionType && actionPayload);

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={clsx(
                'flex flex-col',
                isUser ? 'items-end' : 'items-start'
              )}
            >
              <div
                className={clsx(
                  'max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-xs sm:text-sm font-sans leading-relaxed shadow-lg',
                  isUser
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none shadow-[0_4px_20px_rgba(168,85,247,0.3)]'
                    : 'bg-[#120E24]/90 border border-white/10 text-slate-200 rounded-bl-none backdrop-blur-xl'
                )}
              >
                {/* Markdown line formatting */}
                <div className="space-y-1.5 whitespace-pre-wrap">
                  {msg.content}
                </div>

                {/* Proposed Action Card */}
                {hasAction && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-purple-300">
                      <span>Proposed Action</span>
                      <span className="text-slate-400 font-sans">{actionType.replace('_', ' ')}</span>
                    </div>

                    {actionStatus === 'proposed' && (
                      <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-2">
                        {actionType === 'create_expense' && (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-white">
                                ₹{actionPayload.amount} • {(actionPayload.category || 'expense').toUpperCase()}
                              </p>
                              <p className="text-[11px] text-slate-400">{actionPayload.note}</p>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              PENDING
                            </span>
                          </div>
                        )}

                        {actionType === 'log_study' && (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-white">
                                {actionPayload.subject} • {actionPayload.durationMinutes || actionPayload.duration_minutes} mins
                              </p>
                              <p className="text-[11px] text-emerald-300 font-mono">+Intelligence XP & Gold</p>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                              STUDY SPRINT
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            disabled={confirmMutation.isPending}
                            onClick={() => handleConfirmAction(msg.id)}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                          >
                            <CheckCircle2 size={13} />
                            <span>Confirm & Record</span>
                          </button>

                          <button
                            type="button"
                            disabled={cancelMutation.isPending}
                            onClick={() => handleCancelAction(msg.id)}
                            className="py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 text-xs transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {actionStatus === 'executed' && (
                      <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-xs font-mono">
                        <CheckCircle2 size={14} className="shrink-0" />
                        <span>Action successfully recorded in database</span>
                      </div>
                    )}

                    {actionStatus === 'cancelled' && (
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2 text-slate-500 text-xs font-mono">
                        <XCircle size={14} className="shrink-0" />
                        <span>Action cancelled</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Loading Spinner Indicator */}
        {sendMutation.isPending && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 rounded-2xl bg-[#120E24]/90 border border-purple-500/20 text-slate-300 text-xs max-w-xs"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-mono text-purple-300">Synthesizing life intelligence...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Bottom Input & Quick Suggestion Bar ── */}
      <footer className="relative z-20 p-3 sm:p-4 border-t border-white/10 backdrop-blur-xl bg-black/40">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center max-w-3xl mx-auto"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask me anything... (e.g. 'I spent ₹450 today', 'Plan tomorrow')"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sendMutation.isPending}
            className="w-full py-3.5 pl-4 pr-12 rounded-full bg-white/[0.05] border border-white/15 text-white placeholder-slate-400 text-xs sm:text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 focus:outline-none transition-all shadow-inner"
          />

          <motion.button
            type="submit"
            disabled={!inputText.trim() || sendMutation.isPending}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={clsx(
              'absolute right-1.5 w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg',
              inputText.trim() && !sendMutation.isPending
                ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                : 'bg-white/10 text-slate-500 cursor-not-allowed'
            )}
            aria-label="Send Message"
          >
            <Send size={15} />
          </motion.button>
        </form>
      </footer>
    </div>
  );
}

AiChatView.propTypes = {
  isModal: PropTypes.bool,
  onClose: PropTypes.func,
};
