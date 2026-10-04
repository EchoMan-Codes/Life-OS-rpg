import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  Send,
  CalendarCheck,
  Flame,
  Scroll,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import clsx from 'clsx';

import { useAiChat, useAiExecuteAction } from '../hooks';
import { useFloatingText } from '@/features/character/floatingText';
import { playSound } from '@/lib/sound';

export function JeevanAiModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 'init',
      role: 'assistant',
      content:
        'Greetings, Hero! I am your Jeevan AI strategist. I can build realistic daily routines, prioritize your workload, or forge new disciplines.\n\nTry asking me to **"Plan tomorrow"** or **"What should I focus on today?"**',
      structuredAction: null,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [appliedActionIds, setAppliedActionIds] = useState(new Set());
  const chatBottomRef = useRef(null);

  const chatMutation = useAiChat();
  const executeMutation = useAiExecuteAction();
  const { spawnFloatingText } = useFloatingText();

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatMutation.isPending]);

  const handleSend = (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text || chatMutation.isPending) return;

    const userMsg = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text,
      structuredAction: null,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');

    const history = messages.slice(-5).map((m) => ({ role: m.role, content: m.content }));

    chatMutation.mutate(
      { message: text, history },
      {
        onSuccess: (data) => {
          setMessages((prev) => [
            ...prev,
            {
              id: `a_${Date.now()}`,
              role: 'assistant',
              content: data.message,
              structuredAction: data.structuredAction,
            },
          ]);
          playSound('quest_subtask');
        },
        onError: (err) => {
          setMessages((prev) => [
            ...prev,
            {
              id: `e_${Date.now()}`,
              role: 'assistant',
              content: `Error connecting to AI: ${err?.message || 'Please try again.'}`,
              structuredAction: null,
            },
          ]);
        },
      }
    );
  };

  const handleExecuteAction = async (msgId, action) => {
    try {
      await executeMutation.mutateAsync({
        actionType: action.type,
        payload: action,
      });
      setAppliedActionIds((prev) => new Set([...prev, msgId]));
      playSound('achievement');
      spawnFloatingText('Action applied successfully!');
    } catch (err) {
      console.error('Failed to execute action:', err);
    }
  };

  const quickPrompts = [
    'Plan tomorrow',
    'What should I focus on today?',
    'Create a habit to drink water every morning',
    'Plan my week',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="relative w-full max-w-lg h-[85vh] flex flex-col rounded-3xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-ink font-display flex items-center gap-1.5">
                    <span>Jeevan AI</span>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                      Action Agent
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-ink-muted">
                    Intelligent daily strategist & routine optimizer
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={clsx(
                    'flex flex-col',
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  <div
                    className={clsx(
                      'max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed transition-all shadow-xs',
                      msg.role === 'user'
                        ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-xs'
                        : 'bg-slate-100 dark:bg-white/[0.04] text-slate-800 dark:text-ink border border-slate-200/80 dark:border-white/10 rounded-tl-xs'
                    )}
                  >
                    <div className="whitespace-pre-line">{msg.content}</div>

                    {/* Structured Action Preview Card */}
                    {msg.structuredAction && (
                      <div className="mt-3 p-3 rounded-xl bg-white dark:bg-obsidian-950 border border-slate-200 dark:border-white/10 space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-white/5">
                          <span className="font-bold text-slate-900 dark:text-ink flex items-center gap-1.5">
                            <Sparkles size={13} className="text-amber-500" />
                            <span>{msg.structuredAction.summary || 'Proposed Actions'}</span>
                          </span>
                          <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold uppercase">
                            Ready to Apply
                          </span>
                        </div>

                        {/* Items Preview */}
                        {Array.isArray(msg.structuredAction.items) && (
                          <div className="space-y-1 max-h-36 overflow-y-auto">
                            {msg.structuredAction.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-slate-50 dark:bg-white/[0.02]"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Clock size={11} className="text-slate-400 shrink-0" />
                                  <span className="font-mono text-slate-500 dark:text-ink-muted">
                                    {item.scheduledTime || 'Flexible'}
                                  </span>
                                  <span className="font-medium text-slate-800 dark:text-ink truncate">
                                    {item.title}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono px-1 rounded bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-ink-muted shrink-0">
                                  {item.durationMinutes || 30}m
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Apply Action Button */}
                        <div className="pt-1">
                          {appliedActionIds.has(msg.id) ? (
                            <div className="flex items-center justify-center gap-1.5 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                              <CheckCircle2 size={14} />
                              <span>Applied to Your Dailies!</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleExecuteAction(msg.id, msg.structuredAction)}
                              disabled={executeMutation.isPending}
                              className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                            >
                              {executeMutation.isPending ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <>
                                  <span>Confirm & Add to Schedule</span>
                                  <ArrowRight size={13} />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {chatMutation.isPending && (
                <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                  <Loader2 size={14} className="animate-spin text-amber-500" />
                  <span>Jeevan AI is reasoning about your schedule...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Prompts */}
            <div className="p-2 px-3 border-t border-slate-200/60 dark:border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-50/50 dark:bg-white/[0.01]">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap bg-white dark:bg-white/[0.04] text-slate-600 dark:text-ink-muted hover:text-slate-900 dark:hover:text-ink border border-slate-200/80 dark:border-white/10 shadow-xs transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Chat Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-obsidian-900 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask Jeevan AI (e.g. Plan tomorrow)..."
                className="flex-1 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-ink placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || chatMutation.isPending}
                className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold hover:bg-amber-400 disabled:opacity-50 transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
