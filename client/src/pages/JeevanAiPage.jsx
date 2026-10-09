import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
  Bot,
  User,
  Zap,
  HelpCircle,
} from 'lucide-react';
import clsx from 'clsx';

import {
  useAiHistory,
  useAiClearHistory,
  useAiExecuteAction,
  useAiStatus,
} from '@/features/ai/hooks';
import { aiApi } from '@/features/ai/api';
import { MarkdownRenderer } from '@/features/ai/components/MarkdownRenderer';
import { spring } from '@/lib/motionVariants';

const PROMPT_STARTERS = [
  'Plan my day around my upcoming deadlines & calendar.',
  'What are my 3 most important tasks today?',
  'Break down project "Full Stack Launch" into actionable tasks.',
  'Schedule a 90-minute focus block for my highest priority task.',
  'Summarize my productivity trends for this week.',
];

export default function JeevanAiPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const messagesEndRef = useRef(null);

  // Queries
  const { data: history = [] } = useAiHistory();
  const { data: statusInfo = {} } = useAiStatus();
  const clearHistoryMutation = useAiClearHistory();
  const executeActionMutation = useAiExecuteAction();

  // Load history into messages
  useEffect(() => {
    if (history.length > 0 && messages.length === 0) {
      setMessages(
        history.map((h) => ({
          id: h.id,
          role: h.role,
          content: h.content,
          structuredAction: h.structuredAction,
        }))
      );
    }
  }, [history]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, pendingAction]);

  const handleSend = async (textToSend) => {
    const promptText = (textToSend || input).trim();
    if (!promptText || isStreaming) return;

    setInput('');
    const userMsg = { id: Date.now().toString(), role: 'user', content: promptText };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingContent('');
    setPendingAction(null);
    setActionSuccess(null);

    let accumulatedText = '';
    let parsedAction = null;

    try {
      await aiApi.chatStream({
        message: promptText,
        history: messages.slice(-10),
        onChunk: (chunk) => {
          if (chunk.type === 'token') {
            accumulatedText += chunk.content;
            setStreamingContent(accumulatedText);
          } else if (chunk.type === 'action') {
            parsedAction = chunk.action;
            setPendingAction(chunk.action);
          } else if (chunk.type === 'error') {
            console.error('AI Stream Error:', chunk.error);
          }
        },
      });

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: accumulatedText,
          structuredAction: parsedAction,
        },
      ]);
      setStreamingContent('');
    } catch (err) {
      console.error('Failed to stream chat:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I encountered an error connecting to the intelligence engine. Please retry in a moment.',
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleExecuteAction = async (action) => {
    if (!action) return;
    try {
      const res = await executeActionMutation.mutateAsync({
        actionType: action.type || 'create_item',
        payload: action,
      });
      setActionSuccess(res?.message || 'Action executed and verified in your system!');
      setPendingAction(null);
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-10rem)] md:h-[calc(100vh-8.5rem)] max-w-5xl mx-auto space-y-4 select-none pb-2 md:pb-4">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-slate-900 dark:text-ink leading-tight">
              Action-Oriented Jeevan AI
            </h1>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-ink-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Context-Aware Strategist</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => clearHistoryMutation.mutate()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-white/5 text-xs transition-colors"
          title="Clear Chat History"
        >
          <Trash2 size={13} />
          <span>Clear Conversation</span>
        </button>
      </div>

      {/* ── Chat Messages Stream Area ── */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.length === 0 && !isStreaming ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6">
            <div className="w-14 h-14 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-lg">
              <Sparkles size={28} />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h2 className="text-base font-bold font-display text-slate-900 dark:text-ink">
                How can I optimize your trajectory today?
              </h2>
              <p className="text-xs text-slate-500 dark:text-ink-muted leading-relaxed">
                I can schedule focus blocks, break down projects into tasks, analyze your weekly habits, and resolve schedule conflicts.
              </p>
            </div>

            {/* Prompt Starter Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl text-left">
              {PROMPT_STARTERS.map((starter, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(starter)}
                  className="p-3 rounded-2xl bg-white/70 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-ink transition-all shadow-2xs hover:border-indigo-400/50 cursor-pointer flex items-center justify-between gap-2"
                >
                  <span className="truncate">{starter}</span>
                  <ArrowRight size={13} className="text-indigo-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={clsx(
                'flex gap-3 p-4 rounded-3xl backdrop-blur-xl',
                msg.role === 'user'
                  ? 'bg-indigo-500/10 border border-indigo-500/20 ml-8 sm:ml-20'
                  : 'bg-white/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 mr-8 sm:mr-20'
              )}
            >
              <div
                className={clsx(
                  'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold font-mono',
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-sky-500/20 border border-sky-400/40 text-sky-400'
                )}
              >
                {msg.role === 'user' ? <User size={15} /> : <Bot size={15} />}
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="text-xs font-mono font-bold uppercase text-slate-400">
                  {msg.role === 'user' ? 'Hero' : 'Jeevan Strategist'}
                </div>
                <div className="text-xs leading-relaxed text-slate-800 dark:text-ink">
                  <MarkdownRenderer content={msg.content} />
                </div>

                {/* Structured Action Preview Card inside message */}
                {msg.structuredAction && (
                  <ActionPreviewCard
                    action={msg.structuredAction}
                    onConfirm={() => handleExecuteAction(msg.structuredAction)}
                    isExecuting={executeActionMutation.isPending}
                  />
                )}
              </div>
            </div>
          ))
        )}

        {/* Live Streaming Token Bubble */}
        {isStreaming && (
          <div className="flex gap-3 p-4 rounded-3xl bg-white/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 mr-8 sm:mr-20 backdrop-blur-xl">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-400 flex items-center justify-center shrink-0">
              <Bot size={15} className="animate-pulse" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="text-xs font-mono font-bold uppercase text-sky-400">Thinking & Formulating...</div>
              <div className="text-xs leading-relaxed text-slate-800 dark:text-ink">
                <MarkdownRenderer content={streamingContent} />
              </div>
            </div>
          </div>
        )}

        {/* Action Confirmation Banner */}
        {pendingAction && (
          <div className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 shadow-lg backdrop-blur-2xl">
            <ActionPreviewCard
              action={pendingAction}
              onConfirm={() => handleExecuteAction(pendingAction)}
              onDismiss={() => setPendingAction(null)}
              isExecuting={executeActionMutation.isPending}
            />
          </div>
        )}

        {/* Success Feedback */}
        {actionSuccess && (
          <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium backdrop-blur-md">
            <CheckCircle2 size={16} />
            <span>{actionSuccess}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Bar ── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 p-2 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-sm shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Jeevan AI anything or instruct an action..."
          disabled={isStreaming}
          className="flex-1 py-2 px-3 bg-transparent text-xs font-medium text-slate-800 dark:text-ink placeholder:text-slate-400 focus:outline-none"
        />

        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-all cursor-pointer shadow-xs"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STRUCTURED ACTION PREVIEW CARD
// ─────────────────────────────────────────────────────────────
function ActionPreviewCard({ action, onConfirm, onDismiss, isExecuting }) {
  const summary = action.summary || 'Proposed system mutation';
  const type = action.type || 'create_item';
  const section = action.section || 'task';

  return (
    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2.5 backdrop-blur-md text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
          <Zap size={14} />
          <span>PROPOSED ACTION VERIFICATION</span>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-mono uppercase text-slate-300">
          {type.replace('_', ' ')}
        </span>
      </div>

      <p className="text-xs text-white/90 font-medium">{summary}</p>

      {/* Confirm & Dismiss Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="px-3 py-1.5 rounded-xl text-xs text-white/60 hover:text-white transition-colors"
          >
            Dismiss
          </button>
        )}
        <button
          type="button"
          onClick={onConfirm}
          disabled={isExecuting}
          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <CheckCircle2 size={13} />
          <span>{isExecuting ? 'Executing...' : 'Confirm & Execute'}</span>
        </button>
      </div>
    </div>
  );
}
