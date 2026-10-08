import { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Bot, Compass, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

export function DesktopAiWidget({ onOpenAi }) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      onOpenAi?.();
      return;
    }
    onOpenAi?.(prompt.trim());
    setPrompt('');
  };

  const handleChipClick = (chipText) => {
    onOpenAi?.(chipText);
  };

  return (
    <div className="p-5 rounded-3xl bg-white/80 dark:bg-white/[0.04] border border-slate-200/90 dark:border-white/10 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] space-y-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-bold shadow-[0_0_16px_rgba(245,158,11,0.3)] shrink-0">
            <Sparkles size={17} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-display text-slate-900 dark:text-ink">
                Jeevan AI Strategist
              </h3>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-ink-muted leading-tight">
              Integrated planning & reasoning engine
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenAi?.()}
          className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-gold border border-amber-500/30 transition-all font-semibold cursor-pointer active:scale-95"
        >
          Expand
        </button>
      </div>

      {/* Interactive Quick Composer */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-slate-200/90 dark:border-white/15 focus-within:border-amber-500/70 focus-within:ring-1 focus-within:ring-amber-500/30 transition-all p-1.5 pl-3.5">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask anything or plan today's focus..."
            className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none"
          />
          <button
            type="submit"
            className="w-8 h-8 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 flex items-center justify-center font-bold transition-all shrink-0 cursor-pointer shadow-xs active:scale-90"
            title="Send to Jeevan AI"
            aria-label="Send to Jeevan AI"
          >
            <ArrowRight size={14} />
          </button>
        </div>
      </form>

      {/* Fast Prompt Suggestions */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-ink-muted font-bold block">
          Suggested Prompts
        </span>
        <div className="flex flex-wrap gap-1.5">
          {[
            'Plan my day (3 blocks)',
            'Review my priorities',
            'Add habit: Drink 3L water',
            'What should I focus on next?',
          ].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChipClick(chip)}
              className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 border border-slate-200/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-white/80 dark:border-white/10 transition-all cursor-pointer active:scale-95 text-left truncate max-w-full"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

DesktopAiWidget.propTypes = {
  onOpenAi: PropTypes.func.isRequired,
};
