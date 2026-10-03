import { useState } from 'react';
import { Bot, BookOpen, Flame, Wallet, Sparkles, Brain, Compass } from 'lucide-react';
import { AiChatView } from '@/features/ai/components/AiChatView';

const AI_MODES = [
  { id: 'coach', label: 'Life Coach', icon: Compass, prompt: 'Give me a complete life status debrief across my habits, study, and goals.' },
  { id: 'study', label: 'Study Assistant', icon: BookOpen, prompt: 'Diagnose my weakest study topics and build a 45-minute revision sprint.' },
  { id: 'habit', label: 'Habit Architect', icon: Flame, prompt: 'Analyze my habit consistency and suggest habit stacking for morning focus.' },
  { id: 'money', label: 'Money Advisor', icon: Wallet, prompt: 'Audit my recent expenses and tell me if I am on track with my monthly budget.' },
  { id: 'general', label: 'Intelligence', icon: Brain, prompt: 'What should be my highest priority focus block today?' },
];

export default function AiPage() {
  const [activeMode, setActiveMode] = useState('coach');

  return (
    <div className="min-h-screen pt-16 pb-24 md:pb-8 max-w-5xl mx-auto px-2 sm:px-4 flex flex-col h-[calc(100vh-4rem)] space-y-3">
      {/* ── Mode Switcher Pills ── */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 overflow-x-auto scrollbar-none shrink-0">
        {AI_MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => setActiveMode(mode.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={14} />
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── AI Main Chat Chamber ── */}
      <div className="flex-1 rounded-3xl border border-purple-500/25 shadow-2xl overflow-hidden bg-[#080711]">
        <AiChatView key={activeMode} />
      </div>
    </div>
  );
}
