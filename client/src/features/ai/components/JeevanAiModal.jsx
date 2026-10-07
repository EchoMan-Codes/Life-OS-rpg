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
  RefreshCw,
  WifiOff,
  AlertCircle,
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
        'Greetings, Hero! I am your **Jeevan AI Action Agent** (powered by GPT-6 Sol architecture).\n\nI can build realistic daily routines, prioritize your workload, or forge new disciplines inside Jeevan.\n\nTry asking me to **"Plan tomorrow"** or **"What should I focus on today?"**',
      structuredAction: null,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [appliedActionIds, setAppliedActionIds] = useState(new Set());
  const [thinkingStep, setThinkingStep] = useState(0);

  const chatContainerRef = useRef(null);
  const chatBottomRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  const chatMutation = useAiChat();
  const executeMutation = useAiExecuteAction();
  const { spawnFloatingText } = useFloatingText();

  const thinkingSteps = [
    'Jeevan AI is thinking...',
    'Analyzing your active disciplines & schedule...',
    'Checking time constraints & resolving conflicts...',
    'Building your optimal plan...',
  ];

  // Cycle thinking phrases while request is pending
  useEffect(() => {
    let interval;
    if (chatMutation.isPending) {
      setThinkingStep(0);
      interval = setInterval(() => {
        setThinkingStep((prev) => (prev + 1) % thinkingSteps.length);
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [chatMutation.isPending]);

  // Track if user has scrolled away from bottom to prevent aggressive force-scrolling
  const handleScroll = () => {
    const el = chatContainerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 90;
    shouldAutoScrollRef.current = isAtBottom;
  };

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatMutation.isPending, thinkingStep]);

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
    shouldAutoScrollRef.current = true;

    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

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
        onError: (_err) => {
          setMessages((prev) => [
            ...prev,
            {
              id: `e_${Date.now()}`,
              role: 'error',
              content: "Jeevan AI couldn't connect right now.",
              lastUserPrompt: text,
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
      spawnFloatingText('Action applied to your system!');
    } catch (err) {
      console.error('Failed to execute action:', err);
    }
  };

  const quickPrompts = [
    'Plan tomorrow',
    'What should I focus on today?',
    'What are my tasks today?',
    'Create a habit for exercising every morning at 6 AM',
    'Create a Quest called DBMS Mastery and break it into 5 subtasks',
    'Explain DBMS normalization',
    'Explain recursion',
    'Move my DBMS Daily to 8 PM',
  ];

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // Format message text with markdown headers, bold, and list bullets
  const renderMessageContent = (text) => {
    if (!text) return null;
    return (
      <div className="space-y-1.5 text-xs leading-relaxed break-words font-sans">
        {text.split('\n\n').map((block, bIdx) => {
          if (block.startsWith('### ')) {
            return (
              <h4 key={bIdx} className="font-bold text-[13px] text-slate-900 dark:text-ink pt-1 pb-0.5">
                {block.replace('### ', '')}
              </h4>
            );
          }
          if (block.startsWith('#### ')) {
            return (
              <h5 key={bIdx} className="font-semibold text-xs text-indigo-600 dark:text-indigo-400 pt-0.5">
                {block.replace('#### ', '')}
              </h5>
            );
          }
          if (block.startsWith('• ') || block.startsWith('- ')) {
            const items = block.split('\n');
            return (
              <ul key={bIdx} className="space-y-1 pl-1">
                {items.map((line, lIdx) => (
                  <li key={lIdx} className="flex items-start gap-1.5">
                    <span className="text-amber-500 font-bold shrink-0">•</span>
                    <span
                      dangerouslySetInnerHTML={{
                        __html: line.replace(/^[•-]\s+/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                      }}
                    />
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <p
              key={bIdx}
              dangerouslySetInnerHTML={{
                __html: block
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/~~(.*?)~~/g, '<del>$1</del>'),
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
            paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
            paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-lg h-[90vh] sm:h-[84vh] flex flex-col rounded-3xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-ink font-display flex items-center gap-1.5">
                    <span>Jeevan AI</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      Action Agent
                    </span>
                    {!isOnline && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        Offline Safe
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-ink-muted">
                    Intelligent daily strategist & routine optimizer
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Body with Native Scrolling */}
            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 smooth-scroll"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={clsx('flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start')}
                >
                  {/* User & Assistant Bubble */}
                  {msg.role !== 'error' && (
                    <div
                      className={clsx(
                        'max-w-[88%] p-3.5 rounded-2xl transition-all shadow-xs',
                        msg.role === 'user'
                          ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-xs'
                          : 'bg-slate-100 dark:bg-white/[0.04] text-slate-800 dark:text-ink border border-slate-200/80 dark:border-white/10 rounded-tl-xs'
                      )}
                    >
                      {renderMessageContent(msg.content)}

                      {/* Structured Action Preview Card */}
                      {msg.structuredAction && (
                        <div className="mt-3 p-3 rounded-2xl bg-white dark:bg-obsidian-950 border border-slate-200 dark:border-white/10 space-y-2.5">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                            <span className="font-bold text-slate-900 dark:text-ink flex items-center gap-1.5 text-xs">
                              <Sparkles size={13} className="text-amber-500" />
                              <span>{msg.structuredAction.summary || 'Proposed Routine Updates'}</span>
                            </span>
                            <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold uppercase">
                              Ready to Apply
                            </span>
                          </div>

                          {/* Items Preview for create_dailies */}
                          {Array.isArray(msg.structuredAction.items) && (
                            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 smooth-scroll">
                              {msg.structuredAction.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Clock size={12} className="text-amber-500 shrink-0" />
                                    <span className="font-mono text-slate-500 dark:text-ink-muted shrink-0">
                                      {item.scheduledTime || 'Flexible'}
                                    </span>
                                    <span className="font-medium text-slate-800 dark:text-ink truncate">
                                      {item.title}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-ink-muted shrink-0">
                                    {item.durationMinutes || 30}m
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Preview for update_daily */}
                          {msg.structuredAction.type === 'update_daily' && (
                            <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/20 text-[11px] text-slate-700 dark:text-ink space-y-1">
                              <p className="font-semibold text-indigo-700 dark:text-indigo-300">
                                Task to reschedule: {msg.structuredAction.dailyTitle || msg.structuredAction.title}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-ink-muted">
                                Target Time: {msg.structuredAction.scheduledTime || msg.structuredAction.updates?.scheduledTime || '08:00 PM'} · Duration: {msg.structuredAction.durationMinutes || 60}m
                              </p>
                            </div>
                          )}

                          {/* Preview for delete_daily */}
                          {msg.structuredAction.type === 'delete_daily' && (
                            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-700 dark:text-rose-300">
                              <p className="font-bold">Task to remove: {msg.structuredAction.dailyTitle || msg.structuredAction.title}</p>
                              <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80">
                                This will remove the item from your daily agenda.
                              </p>
                            </div>
                          )}

                          {/* Preview for create_habit */}
                          {msg.structuredAction.type === 'create_habit' && (
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
                              <p className="font-bold">New Discipline: {msg.structuredAction.title || msg.structuredAction.habit?.title}</p>
                              <p className="text-[10px] opacity-80">
                                Cadence: Daily · +8 XP / +3 Coins per completion
                              </p>
                            </div>
                          )}

                          {/* Preview for create_quest */}
                          {msg.structuredAction.type === 'create_quest' && (
                            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-800 dark:text-purple-300 space-y-1.5">
                              <p className="font-bold">New Campaign: {msg.structuredAction.title || msg.structuredAction.quest?.title}</p>
                              <p className="text-[10px] opacity-80">
                                Priority: {msg.structuredAction.priority || 'high'} · {(msg.structuredAction.items || msg.structuredAction.quest?.subtasks || []).length} milestone subtasks
                              </p>
                              <ul className="list-disc list-inside text-[10px] space-y-0.5 max-h-32 overflow-y-auto">
                                {(msg.structuredAction.items || msg.structuredAction.quest?.subtasks || []).map((s, idx) => (
                                  <li key={idx} className="truncate">{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Preview for add_quest_subtasks */}
                          {msg.structuredAction.type === 'add_quest_subtasks' && (
                            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-800 dark:text-purple-300 space-y-1">
                              <p className="font-bold">
                                Adding {(msg.structuredAction.subtasks || []).length} Subtasks to Quest
                              </p>
                              <ul className="list-disc list-inside text-[10px] space-y-0.5">
                                {(msg.structuredAction.subtasks || []).map((s, idx) => (
                                  <li key={idx} className="truncate">{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Action Confirmation & Execute Button */}
                          <div className="pt-1">
                            {appliedActionIds.has(msg.id) ? (
                              <div className="flex items-center justify-center gap-1.5 py-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 rounded-xl">
                                <CheckCircle2 size={15} />
                                <span>Applied to Your System!</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleExecuteAction(msg.id, msg.structuredAction)}
                                disabled={executeMutation.isPending}
                                className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                              >
                                {executeMutation.isPending ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <>
                                    <span>Confirm & Execute Action</span>
                                    <ArrowRight size={14} />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Clean Structured Error Card */}
                  {msg.role === 'error' && (
                    <div className="max-w-[92%] p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-800 dark:text-rose-300 space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="text-rose-500 shrink-0" />
                        <h4 className="font-bold text-xs">Jeevan AI couldn&apos;t connect right now.</h4>
                      </div>
                      <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80 leading-relaxed">
                        Your system, active habits, and local data remain safe. You can retry your request or ask another question.
                      </p>
                      {msg.lastUserPrompt && (
                        <div className="pt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSend(msg.lastUserPrompt)}
                            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            <RefreshCw size={12} />
                            <span>Retry Request</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Dynamic Lightweight Thinking Indicator */}
              {chatMutation.isPending && (
                <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-ink-muted p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 w-fit">
                  <Loader2 size={14} className="animate-spin text-amber-500 shrink-0" />
                  <span className="font-medium animate-pulse">{thinkingSteps[thinkingStep]}</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Prompts Bar */}
            <div className="p-2 px-3 border-t border-slate-200/60 dark:border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-50/50 dark:bg-white/[0.01]">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap bg-white dark:bg-white/[0.04] text-slate-600 dark:text-ink-muted hover:text-slate-900 dark:hover:text-ink border border-slate-200/80 dark:border-white/10 shadow-xs transition-colors cursor-pointer active:scale-95"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Chat Input with Safe-Area aware padding */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              style={{
                paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
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
                className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold hover:bg-amber-400 disabled:opacity-40 transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
                aria-label="Send message"
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
