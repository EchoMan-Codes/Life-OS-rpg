import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  X,
  Send,
  Square,
  RefreshCw,
  Trash2,
  PlusCircle,
  ArrowDown,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Calendar,
  Flame,
  Scroll,
  Undo2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  LogIn,
  CalendarCheck,
  ListTodo,
} from 'lucide-react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

import { aiApi } from '../api';
import { useAiExecuteAction, useAiHistory, useAiClearHistory, useAiStatus } from '../hooks';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useAuth } from '@/features/auth/hooks';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { useFloatingText } from '@/features/character/floatingText';
import { playSound } from '@/lib/sound';
import { computeNextFireTimes } from '@/lib/scheduler';

function formatTimestamp(ts) {
  if (!ts) return '';
  const date = new Date(ts);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function JeevanAiModal({ isOpen, onClose }) {
  const shouldReduceMotion = useReducedMotion();
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { data: aiStatus } = useAiStatus();
  const { data: dbHistory = [] } = useAiHistory();
  const executeMutation = useAiExecuteAction();
  const clearHistoryMutation = useAiClearHistory();
  const { spawnFloatingText } = useFloatingText();

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [appliedActionIds, setAppliedActionIds] = useState(new Set());
  const [undoneActionIds, setUndoneActionIds] = useState(new Set());
  const [lastUserPrompt, setLastUserPrompt] = useState('');
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  const abortControllerRef = useRef(null);
  const chatContainerRef = useRef(null);
  const chatBottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Initialize messages from DB history or initial welcome
  useEffect(() => {
    if (!isOpen) return;

    if (dbHistory && dbHistory.length > 0) {
      setMessages(
        dbHistory.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          structuredAction: m.structuredAction,
          timestamp: m.createdAt || m.created_at || Date.now(),
        }))
      );
    } else if (messages.length === 0) {
      setMessages([
        {
          id: 'init_welcome',
          role: 'assistant',
          content: `Greetings, Hero! I am your **Jeevan AI Personal Strategist**.\n\nI can answer **any general question** (programming, research, writing, science, philosophy), or take direct actions inside your Jeevan operating system:\n\n• **Plan your day or tomorrow** with focused, conflict-free timeblocks\n• **Review or create tasks** and organize productivity sprints\n• **Add Dailies** with recurrence schedules (e.g. *"every Mon, Wed, Fri at 7 PM"*)\n• **Forge Habits** to build unstoppable momentum\n• **Launch Quests** and break them into progressive milestones\n\nWhat would you like to explore or accomplish today?`,
          structuredAction: null,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [isOpen, dbHistory]);

  // Punchy, concise chips that never clip
  const dynamicChips = useMemo(() => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      return [
        'Plan my day (3 blocks)',
        'What should I focus on?',
        'Summarize my tasks',
        'Add daily: Run at 7 AM',
        'Add habit: Drink 3L water',
        'Explain DBMS normalization',
        'What is recursion?',
      ];
    } else if (currentHour < 18) {
      return [
        'What should I focus on?',
        'Review my tasks today',
        'Plan tomorrow (6 AM to 10 PM)',
        'Add habit: Drink 3L water',
        'Explain DBMS normalization',
        'How to optimize React?',
        'Create a weekly routine',
      ];
    } else {
      return [
        'Plan tomorrow with 4 tasks',
        'Summarize what I achieved',
        'Give me a 30m wind-down',
        'Add daily: Read at 8 PM',
        'Add habit: Drink 3L water',
        'What is recursion?',
        'Create a weekly routine',
      ];
    }
  }, []);

  // Handle auto-scroll without fighting user when scrolled up
  const handleScroll = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsUserScrolledUp(distanceToBottom > 80);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    if (!chatBottomRef.current) return;
    chatBottomRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    if (!isUserScrolledUp) {
      scrollToBottom(false);
    }
  }, [messages, isStreaming, isUserScrolledUp, scrollToBottom]);

  // Auto-grow textarea
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 130)}px`;
    }
  };

  // Stop/Cancel active stream
  const handleStopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  };

  // Core stream orchestrator: reuses user message and feeds assistant placeholder
  const streamAssistantResponse = async (text, currentMessages) => {
    setIsStreaming(true);
    setIsUserScrolledUp(false);
    scrollToBottom();

    const assistantMsgId = `a_${Date.now()}`;
    const assistantMsgPlaceholder = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      structuredAction: null,
      timestamp: Date.now(),
    };

    setMessages([...currentMessages, assistantMsgPlaceholder]);

    const historyPayload = currentMessages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content }));

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let accumulatedText = '';

    try {
      await aiApi.streamChat({
        message: text,
        history: historyPayload,
        onChunk: (chunk) => {
          if (chunk.type === 'token') {
            accumulatedText += chunk.content;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, content: accumulatedText } : m))
            );
          } else if (chunk.type === 'action') {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, structuredAction: chunk.action } : m))
            );
            playSound('quest_subtask');
          } else if (chunk.type === 'error') {
            setStreamError(chunk.error);
          }
        },
        signal: abortController.signal,
      });

      playSound('quest_subtask');
    } catch (err) {
      if (err.name === 'AbortError') {
        // Stream cancelled by user
      } else {
        console.error('[AI_CHAT_STREAM_ERROR]', err);
        setStreamError(err.message || 'Could not connect to Jeevan AI.');
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  role: 'error',
                  content:
                    err.code === 'AUTH_REQUIRED'
                      ? 'Please sign in to Jeevan to converse with your personal AI Strategist.'
                      : err.message || 'Jeevan AI is temporarily unavailable.',
                  errorCode: err.code || (err.status ? `HTTP_${err.status}` : 'AI_STREAM_ERROR'),
                  technicalDetails: err.stack || err.message,
                }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Send new user message
  const handleSend = async (overrideText) => {
    const text = (overrideText || inputValue).trim();
    if (!text || isStreaming) return;

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setLastUserPrompt(text);
    setStreamError(null);
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMsg = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text,
      structuredAction: null,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    await streamAssistantResponse(text, updatedMessages);
  };

  // Retry without duplicating user messages
  const handleRetry = (errorMsgId) => {
    const errorIndex = messages.findIndex((m) => m.id === errorMsgId);
    let promptToRetry = lastUserPrompt;

    if (errorIndex > 0 && messages[errorIndex - 1]?.role === 'user') {
      promptToRetry = messages[errorIndex - 1].content;
    }

    if (!promptToRetry) return;

    // Remove the failed error message, keep the single user bubble
    const baseMessages = messages.filter((m) => m.id !== errorMsgId);
    setStreamError(null);

    streamAssistantResponse(promptToRetry, baseMessages);
  };

  // Execute in-chat action card
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
      spawnFloatingText('Action execution failed');
    }
  };

  // Undo last action
  const handleUndoAction = async (msgId, action) => {
    try {
      if (action.type === 'create_item' || action.type === 'create_daily' || action.type === 'create_task') {
        await executeMutation.mutateAsync({
          actionType: 'delete_item',
          payload: { section: action.section || 'daily', item: action.item },
        });
      } else if (action.type === 'complete_item') {
        await executeMutation.mutateAsync({
          actionType: 'uncomplete_daily',
          payload: { id: action.item?.id },
        });
      }
      setUndoneActionIds((prev) => new Set([...prev, msgId]));
      playSound('click');
      spawnFloatingText('Action reverted');
    } catch (err) {
      console.error('Failed to undo action:', err);
    }
  };

  // Start new chat session
  const handleNewChat = () => {
    handleStopStream();
    setMessages([
      {
        id: `init_${Date.now()}`,
        role: 'assistant',
        content: `Greetings! Started a new strategy session. How can I assist you with your day, studies, or RPG progression?`,
        structuredAction: null,
        timestamp: Date.now(),
      },
    ]);
  };

  // Clear chat history
  const handleClearHistory = async () => {
    try {
      await clearHistoryMutation.mutateAsync();
      handleNewChat();
      spawnFloatingText('Chat history cleared');
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
          paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4"
      >
        {/* Absolute Glassy Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-2xl transition-opacity"
        />

        {/* Ambient Diffused Glow Behind Dialog */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[550px] h-[300px] bg-gradient-to-b from-amber-500/10 via-orange-500/5 to-transparent blur-3xl rounded-full" />

        {/* Main Absolute Glassy Transparent Dialog */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          className="relative w-full max-w-2xl h-[92vh] sm:h-[86vh] flex flex-col rounded-3xl bg-slate-950/60 border border-white/20 shadow-[0_25px_80px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-3xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="relative z-10 flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 bg-white/[0.04] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-bold shadow-[0_0_20px_rgba(245,158,11,0.4)] shrink-0">
                <Sparkles size={20} className="stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white font-display tracking-tight">
                    Jeevan AI
                  </h3>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span>
                      {aiStatus?.isLocal
                        ? `Ollama · ${aiStatus.model || 'llama3.2'}`
                        : aiStatus?.provider
                        ? `${aiStatus.provider} · ${aiStatus.model}`
                        : 'Ollama · llama3.2'}
                    </span>
                  </span>
                </div>
                <p className="text-[11px] text-white/60 tracking-wide">
                  Your personal planning & reasoning assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleNewChat}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white transition-all text-xs flex items-center gap-1.5 cursor-pointer backdrop-blur-md active:scale-95"
                title="New Chat Session"
                aria-label="New Chat Session"
              >
                <PlusCircle size={15} />
                <span className="hidden sm:inline font-medium">New Chat</span>
              </button>

              <button
                type="button"
                onClick={handleClearHistory}
                disabled={clearHistoryMutation.isPending || messages.length <= 1}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/20 border border-white/15 text-white/60 hover:text-rose-400 transition-all text-xs flex items-center justify-center cursor-pointer disabled:opacity-25 backdrop-blur-md active:scale-95"
                title="Clear Conversation History"
                aria-label="Clear Conversation History"
              >
                <Trash2 size={15} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/70 hover:text-white transition-all cursor-pointer backdrop-blur-md active:scale-95 ml-1"
                aria-label="Close Dialog"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Guest Warning Banner if Unauthenticated */}
          {!isAuthenticated && (
            <div className="relative z-10 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 backdrop-blur-md flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-300">
                <AlertCircle size={14} className="shrink-0 text-amber-400" />
                <span>Guest mode active. Sign in to sync your RPG character, tasks, and calendar.</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] shrink-0 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Chat Scroll Container */}
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 smooth-scroll relative z-10 scrollbar-thin"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={clsx('flex flex-col group', msg.role === 'user' ? 'items-end' : 'items-start')}
              >
                {/* User Message Bubble */}
                {msg.role === 'user' && (
                  <div className="max-w-[85%] flex flex-col items-end">
                    <div className="p-3.5 sm:p-4 rounded-2xl rounded-tr-xs bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-semibold text-xs sm:text-sm shadow-md shadow-amber-500/15 border border-amber-400/40 leading-relaxed break-words">
                      {msg.content}
                    </div>
                    <span className="text-[10px] font-mono text-white/40 mt-1 mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                  </div>
                )}

                {/* Assistant Message Bubble */}
                {msg.role === 'assistant' && (
                  <div className="max-w-[92%] sm:max-w-[88%] flex flex-col items-start">
                    <div className="p-4 sm:p-5 rounded-2xl rounded-tl-xs bg-white/[0.08] text-slate-100 border border-white/15 backdrop-blur-2xl space-y-3.5 text-xs sm:text-sm shadow-xl leading-relaxed">
                      {/* Assistant Header Info */}
                      <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-[11px] text-white/60">
                        <Sparkles size={14} className="text-amber-400" />
                        <span className="font-semibold text-white tracking-wide">Jeevan AI</span>
                        <span className="ml-auto font-mono text-[10px] text-white/50">
                          {formatTimestamp(msg.timestamp)}
                        </span>
                      </div>

                      {msg.content ? (
                        <MarkdownRenderer content={msg.content} />
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-white/60 py-1">
                          <Loader2 size={14} className="animate-spin text-amber-400" />
                          <span className="animate-pulse">Reasoning and structuring response...</span>
                        </div>
                      )}

                      {/* Proposed Action Card */}
                      {msg.structuredAction && (
                        <ActionCard
                          action={msg.structuredAction}
                          isApplied={appliedActionIds.has(msg.id)}
                          isUndone={undoneActionIds.has(msg.id)}
                          isPending={executeMutation.isPending}
                          onExecute={() => handleExecuteAction(msg.id, msg.structuredAction)}
                          onUndo={() => handleUndoAction(msg.id, msg.structuredAction)}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Error Bubble with Single Retry & Technical Details */}
                {msg.role === 'error' && (
                  <ErrorCard
                    msg={msg}
                    onRetry={handleRetry}
                    onOpenAuth={() => setShowAuthModal(true)}
                  />
                )}
              </div>
            ))}

            <div ref={chatBottomRef} />
          </div>

          {/* Floating Jump to Latest Button */}
          <AnimatePresence>
            {isUserScrolledUp && (
              <motion.button
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                type="button"
                onClick={() => scrollToBottom(true)}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-semibold shadow-2xl backdrop-blur-xl border border-white/20 flex items-center gap-1.5 cursor-pointer hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
              >
                <ArrowDown size={13} className="text-amber-400" />
                <span>Jump to latest</span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Dynamic Contextual Chips Bar */}
          <div className="relative z-10 px-4 py-2 border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar bg-black/20 backdrop-blur-xl scroll-smooth">
            {dynamicChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleSend(chip)}
                disabled={isStreaming}
                className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-white/10 hover:bg-white/20 text-white/90 hover:text-white border border-white/15 backdrop-blur-md shadow-xs transition-all cursor-pointer shrink-0 active:scale-95 disabled:opacity-40"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Bar (Composer) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative z-10 p-3 sm:p-4 border-t border-white/10 bg-slate-950/60 backdrop-blur-2xl flex items-center gap-2.5"
          >
            <div className="flex-1 flex items-center rounded-2xl bg-white/[0.08] border border-white/20 focus-within:border-amber-400/70 focus-within:bg-white/[0.12] transition-all px-3.5 py-1.5">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={
                  !isAuthenticated
                    ? 'Sign in to chat with Jeevan AI...'
                    : 'Ask anything, plan your day, or request tasks (Enter to send)...'
                }
                disabled={isStreaming}
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-white/45 focus:outline-none resize-none max-h-36 leading-normal py-1.5 disabled:opacity-50"
              />
            </div>

            {isStreaming ? (
              <button
                type="button"
                onClick={handleStopStream}
                className="w-11 h-11 rounded-2xl bg-rose-500/90 hover:bg-rose-500 text-white flex items-center justify-center font-bold transition-all shrink-0 cursor-pointer shadow-lg shadow-rose-500/20 active:scale-95"
                aria-label="Stop generation"
                title="Stop generation"
              >
                <Square size={15} className="fill-white" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputValue.trim() || isStreaming}
                className="w-11 h-11 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-bold hover:from-amber-400 hover:to-orange-400 disabled:opacity-30 transition-all shrink-0 cursor-pointer shadow-lg shadow-amber-500/25 active:scale-95"
                aria-label="Send message"
              >
                <Send size={16} className="translate-x-[-1px] translate-y-[1px]" />
              </button>
            )}
          </form>
        </motion.div>
      </div>

      {/* Auth Modal Trigger for Guest Users */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}

JeevanAiModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

function ErrorCard({ msg, onRetry, onOpenAuth }) {
  const [showDetails, setShowDetails] = useState(false);
  const isAuth = msg.errorCode === 'AUTH_REQUIRED';

  return (
    <div className="max-w-[92%] sm:max-w-[88%] p-4 rounded-2xl rounded-tl-xs bg-rose-500/15 border border-rose-500/30 backdrop-blur-2xl text-rose-200 space-y-3 shadow-lg">
      <div className="flex items-center gap-2">
        <AlertCircle size={16} className="text-rose-400 shrink-0" />
        <h4 className="font-bold text-xs sm:text-sm text-rose-100">
          {isAuth ? 'Authentication Required' : 'Request Encountered an Issue'}
        </h4>
      </div>

      <p className="text-xs text-rose-200/90 leading-relaxed">{msg.content}</p>

      {/* Expandable Technical Details */}
      {!isAuth && (
        <div className="pt-0.5">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-[11px] font-mono text-rose-300/80 hover:text-rose-200 transition-colors cursor-pointer"
          >
            <span>{showDetails ? 'Hide technical details' : 'Show technical details'}</span>
            {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showDetails && (
            <div className="mt-2 p-2.5 rounded-xl bg-black/40 border border-white/5 font-mono text-[10px] text-rose-300/90 break-all select-text space-y-1">
              <div>
                <span className="text-white/50">Error Code:</span> {msg.errorCode || 'UNKNOWN'}
              </div>
              {msg.technicalDetails && (
                <div>
                  <span className="text-white/50">Details:</span> {msg.technicalDetails}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        {isAuth ? (
          <button
            type="button"
            onClick={onOpenAuth}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <LogIn size={13} />
            <span>Sign In to Jeevan</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onRetry(msg.id)}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <RefreshCw size={13} />
            <span>Retry Request</span>
          </button>
        )}
      </div>
    </div>
  );
}

ErrorCard.propTypes = {
  msg: PropTypes.object.isRequired,
  onRetry: PropTypes.func.isRequired,
  onOpenAuth: PropTypes.func.isRequired,
};

function ActionCard({ action, isApplied, isUndone, isPending, onExecute, onUndo }) {
  const section =
    action.section ||
    (action.type.includes('daily')
      ? 'daily'
      : action.type.includes('habit')
      ? 'habit'
      : action.type.includes('calendar')
      ? 'calendar'
      : action.type.includes('task')
      ? 'task'
      : 'quest');

  const item = action.item || action.daily || action.habit || action.quest || action.task || action;

  // Compute live preview of reminders if scheduling
  const nextReminders = useMemo(() => {
    if (section === 'daily' && item.scheduledTime) {
      return computeNextFireTimes({
        item: {
          ...item,
          reminderEnabled: item.reminderEnabled ?? true,
          reminderMinutesBefore: item.reminderMinutesBefore ?? 10,
        },
        itemType: 'daily',
        limit: 3,
      });
    }
    return [];
  }, [section, item]);

  const sectionIcon =
    section === 'daily' ? (
      <Calendar size={14} className="text-emerald-400" />
    ) : section === 'habit' ? (
      <Flame size={14} className="text-amber-400" />
    ) : section === 'calendar' ? (
      <CalendarCheck size={14} className="text-cyan-400" />
    ) : section === 'task' ? (
      <ListTodo size={14} className="text-blue-400" />
    ) : (
      <Scroll size={14} className="text-purple-400" />
    );

  const deepLink =
    section === 'daily'
      ? '/dailies'
      : section === 'habit'
      ? '/habits'
      : section === 'calendar'
      ? '/calendar'
      : '/quests';

  // Read-only actions (like propose_schedule, get_tasks, get_calendar_events)
  const isReadOnly =
    action.type === 'propose_schedule' ||
    action.type === 'get_tasks' ||
    action.type === 'get_calendar_events';

  return (
    <div className="mt-2.5 p-4 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-xl space-y-3 shadow-md text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          {sectionIcon}
          <span className="font-bold text-white text-xs sm:text-sm">
            {action.summary || `Proposed ${section.toUpperCase()} Action`}
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold uppercase">
          {action.type.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Details Box */}
      <div className="p-3 rounded-xl bg-black/30 border border-white/10 text-xs space-y-2">
        <div className="flex items-center justify-between font-semibold text-white">
          <span>{item.title || action.title || 'Action Details'}</span>
          {item.difficulty && (
            <span className="text-[10px] uppercase font-mono text-amber-400 font-bold">{item.difficulty}</span>
          )}
        </div>

        {/* Schedule & Recurrence details */}
        {item.scheduledTime && (
          <div className="flex items-center gap-2 text-[11px] text-white/70">
            <Clock size={12} className="text-amber-400 shrink-0" />
            <span>
              Time: {item.scheduledTime} ({item.durationMinutes || 30} mins)
            </span>
          </div>
        )}

        {/* Schedule Proposal Blocks Preview */}
        {Array.isArray(item.blocks) && item.blocks.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-white/10">
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
              Proposed Schedule Blocks:
            </span>
            <div className="space-y-1">
              {item.blocks.map((blk, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10"
                >
                  <span className="font-medium text-white/90">{blk.title || blk.task}</span>
                  <span className="font-mono text-[10px] text-amber-400">{blk.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live reminders preview */}
        {nextReminders.length > 0 && (
          <div className="pt-1.5 border-t border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
              Reminder Schedule:
            </span>
            <div className="flex flex-wrap gap-1">
              {nextReminders.map((r, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px]"
                >
                  {r.displayTime}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quest Subtasks Preview */}
        {Array.isArray(item.subtasks) && item.subtasks.length > 0 && (
          <div className="pt-1.5 border-t border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-white/60">
              Milestone Roadmap ({item.subtasks.length}):
            </span>
            <ul className="list-disc list-inside text-[11px] text-white/80 space-y-0.5">
              {item.subtasks.map((st, sIdx) => (
                <li key={sIdx} className="truncate">
                  {typeof st === 'string' ? st : st.title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Confirmation & Result UX */}
      {!isReadOnly ? (
        <div>
          {isApplied ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-xs">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} />
                  <span>Verified & Applied!</span>
                </div>
                <Link to={deepLink} className="inline-flex items-center gap-1 text-[11px] hover:underline">
                  <span>View {section}</span>
                  <ExternalLink size={11} />
                </Link>
              </div>

              {!isUndone ? (
                <button
                  type="button"
                  onClick={onUndo}
                  className="w-full py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-white/10"
                >
                  <Undo2 size={13} />
                  <span>Undo this action</span>
                </button>
              ) : (
                <p className="text-[11px] text-center text-white/50 italic">Action has been undone.</p>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onExecute}
              disabled={isPending}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isPending ? (
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
      ) : (
        <div className="flex items-center justify-end">
          <Link
            to={deepLink}
            className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:underline"
          >
            <span>Open in {section}</span>
            <ExternalLink size={11} />
          </Link>
        </div>
      )}
    </div>
  );
}

ActionCard.propTypes = {
  action: PropTypes.object.isRequired,
  isApplied: PropTypes.bool.isRequired,
  isUndone: PropTypes.bool.isRequired,
  isPending: PropTypes.bool.isRequired,
  onExecute: PropTypes.func.isRequired,
  onUndo: PropTypes.func.isRequired,
};
