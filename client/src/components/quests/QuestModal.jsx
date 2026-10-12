import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';
import {
  X,
  Scroll,
  Plus,
  Trash2,
  Bell,
  Clock,
  Sparkles,
  Target,
  Sliders,
  CheckCircle2,
  Calendar,
  Layers,
  Wand2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import clsx from 'clsx';

import { modalPanel } from '@/lib/motionVariants';
import { useCreateQuest, useUpdateQuest, useQuestSuggestions } from '@/features/quests/hooks';
import { JeevanLoader } from '@/components/ui/JeevanLoader';
import { useJeevanTransition } from '@/context/JeevanTransitionContext';
import { notificationService } from '@/lib/notifications';
import { computeNextFireTimes } from '@/lib/scheduler';

const DURATIONS = [
  { value: 'weekly', label: 'Weekly', limitHint: 'Max 3 active' },
  { value: 'monthly', label: 'Monthly', limitHint: 'Max 3 active' },
  { value: 'yearly', label: 'Yearly', limitHint: 'Max 1 active' },
  { value: 'custom', label: 'Custom', limitHint: 'Dynamic limits' },
];

const CATEGORIES = [
  { value: 'learning', label: 'Learning' },
  { value: 'projects', label: 'Projects' },
  { value: 'wellbeing', label: 'Wellbeing' },
  { value: 'personal_growth', label: 'Growth' },
  { value: 'other', label: 'Other' },
];

const PROGRESS_MODES = [
  { value: 'count', label: 'Numeric Target', desc: 'Log session counts towards a goal' },
  { value: 'task', label: 'Task-Driven', desc: 'Syncs automatically with linked tasks' },
  { value: 'manual', label: 'Checklist', desc: 'Milestone subtasks checklist' },
];

const DIFFICULTIES = [
  { value: 'trivial', label: 'Trivial', mult: 0.25 },
  { value: 'easy', label: 'Easy', mult: 0.5 },
  { value: 'medium', label: 'Medium', mult: 1.0 },
  { value: 'hard', label: 'Hard', mult: 1.5 },
  { value: 'epic', label: 'Epic', mult: 2.0 },
];

const DURATION_BASE_REWARDS = {
  weekly: { xp: 200, gold: 40 },
  monthly: { xp: 800, gold: 160 },
  yearly: { xp: 5000, gold: 1000 },
  custom: { xp: 400, gold: 80 },
};

export function QuestModal({ isOpen, onClose, questToEdit = null }) {
  const shouldReduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'ai'

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          variants={modalPanel}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={shouldReduceMotion ? { duration: 0 } : undefined}
          className="relative w-full max-w-2xl my-auto rounded-3xl bg-obsidian-900/95 border border-white/12 shadow-2xl backdrop-blur-2xl flex flex-col text-ink max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/8 shrink-0 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-gold">
                <Scroll size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold font-display text-ink">
                  {questToEdit ? 'Edit Quest' : 'Initiate New Quest'}
                </h2>
                <p className="text-xs text-ink-muted">Turn long-term goals into measurable progression</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mode Switcher Tabs (Create Mode Only) */}
          {!questToEdit && (
            <div className="flex items-center gap-2 px-6 pt-4 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={clsx(
                  'px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                  activeTab === 'manual'
                    ? 'bg-amber-500/20 text-gold border border-amber-500/40'
                    : 'text-ink-muted hover:text-ink hover:bg-white/5 border border-transparent'
                )}
              >
                <Sliders size={14} />
                <span>Manual Design</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ai')}
                className={clsx(
                  'px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                  activeTab === 'ai'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-ink-muted hover:text-ink hover:bg-white/5 border border-transparent'
                )}
              >
                <Wand2 size={14} />
                <span>AI Suggestions ✨</span>
              </button>
            </div>
          )}

          {/* Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1">
            {activeTab === 'manual' ? (
              <ManualQuestForm
                questToEdit={questToEdit}
                onClose={onClose}
              />
            ) : (
              <AISuggestionView
                onSelectSuggestion={(sugg) => {
                  setActiveTab('manual');
                }}
                onClose={onClose}
              />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function ManualQuestForm({ questToEdit, onClose }) {
  const createMutation = useCreateQuest();
  const updateMutation = useUpdateQuest();
  const { triggerTransition } = useJeevanTransition();

  const [title, setTitle] = useState(() => questToEdit?.title || '');
  const [objective, setObjective] = useState(() => questToEdit?.objective || '');
  const [description, setDescription] = useState(() => questToEdit?.description || '');
  const [duration, setDuration] = useState(() => questToEdit?.questType || questToEdit?.type || 'weekly');
  const [category, setCategory] = useState(() => questToEdit?.category || 'learning');
  const [difficulty, setDifficulty] = useState(() => questToEdit?.difficulty || 'medium');
  const [progressMode, setProgressMode] = useState(() => questToEdit?.progressMode || 'task');
  const [targetValue, setTargetValue] = useState(() => questToEdit?.targetValue || 5);
  const [dueDate, setDueDate] = useState(() => questToEdit?.dueDate || '');
  const [customRewardsEnabled, setCustomRewardsEnabled] = useState(false);
  const [customXp, setCustomXp] = useState(null);
  const [customCoins, setCustomCoins] = useState(null);
  const [items, setItems] = useState(() => (questToEdit?.items ? questToEdit.items.map((i) => i.title) : []));
  const [newItemInput, setNewItemInput] = useState('');
  const [error, setError] = useState(null);

  // Compute suggested rewards & bounds
  const { suggestedXp, suggestedCoins, minXp, maxXp, minCoins, maxCoins } = useMemo(() => {
    const base = DURATION_BASE_REWARDS[duration] || DURATION_BASE_REWARDS.weekly;
    const diff = DIFFICULTIES.find((d) => d.value === difficulty) || DIFFICULTIES[2];
    const sXp = Math.round(base.xp * diff.mult);
    const sCoins = Math.round(base.gold * diff.mult);
    return {
      suggestedXp: sXp,
      suggestedCoins: sCoins,
      minXp: Math.floor(sXp * 0.5),
      maxXp: Math.ceil(sXp * 1.5),
      minCoins: Math.floor(sCoins * 0.5),
      maxCoins: Math.ceil(sCoins * 1.5),
    };
  }, [duration, difficulty]);

  const effectiveXp = customRewardsEnabled && customXp !== null ? customXp : suggestedXp;
  const effectiveCoins = customRewardsEnabled && customCoins !== null ? customCoins : suggestedCoins;

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemInput.trim()) return;
    setItems((prev) => [...prev, newItemInput.trim()]);
    setNewItemInput('');
  };

  const handleRemoveItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a quest title.');
      return;
    }
    setError(null);

    const payload = {
      title: title.trim(),
      objective: objective.trim() || undefined,
      description: description.trim() || null,
      type: duration,
      questType: duration,
      category,
      difficulty,
      progressMode,
      targetValue: progressMode === 'count' ? Number(targetValue) : 1,
      rewardXp: customRewardsEnabled && customXp !== null ? Number(customXp) : suggestedXp,
      rewardCoins: customRewardsEnabled && customCoins !== null ? Number(customCoins) : suggestedCoins,
      dueDate: dueDate || null,
    };

    if (!questToEdit) {
      payload.items = items;
    }

    try {
      if (questToEdit) {
        await updateMutation.mutateAsync({ questId: questToEdit.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }

      onClose();
      triggerTransition({
        variant: 'medium',
        message: questToEdit ? 'Quest Updated' : 'Quest Initiated!',
        submessage: payload.title,
        duration: 1000,
      });
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to save quest.';
      setError(msg);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert size={16} className="text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Duration Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-ink-muted">Duration & Quota Policy</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDuration(d.value)}
              className={clsx(
                'py-2 px-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col',
                duration === d.value
                  ? 'bg-amber-500/15 border-amber-500/40 text-gold shadow-xs'
                  : 'bg-white/[0.03] border-white/8 text-ink-muted hover:border-white/15'
              )}
            >
              <span className="text-xs font-bold">{d.label}</span>
              <span className="text-[10px] font-mono text-ink-muted/80">{d.limitHint}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Title & Category Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label htmlFor="quest-title" className="text-xs font-semibold text-ink-muted">
            Quest Title <span className="text-rose-400">*</span>
          </label>
          <input
            id="quest-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Master High-Concurrency Postgres"
            maxLength={200}
            required
            className="px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-ink text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="quest-cat" className="text-xs font-semibold text-ink-muted">Category</label>
          <select
            id="quest-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-obsidian-950 border border-white/10 text-ink text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Measurable Objective */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="quest-obj" className="text-xs font-semibold text-ink-muted">
          Measurable Objective
        </label>
        <input
          id="quest-obj"
          type="text"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="e.g. Complete 5 benchmarks and pass integration suite without deadlock"
          maxLength={2000}
          className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-ink text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      {/* Progress Mode & Difficulty */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ink-muted">Progress Mode</label>
          <div className="flex flex-col gap-1.5">
            {PROGRESS_MODES.map((pm) => (
              <label
                key={pm.value}
                className={clsx(
                  'flex items-center gap-2 p-2 rounded-xl border cursor-pointer text-xs transition-all',
                  progressMode === pm.value
                    ? 'bg-amber-500/10 border-amber-500/30 text-ink'
                    : 'bg-white/[0.02] border-white/5 text-ink-muted hover:border-white/10'
                )}
              >
                <input
                  type="radio"
                  name="progressMode"
                  value={pm.value}
                  checked={progressMode === pm.value}
                  onChange={() => setProgressMode(pm.value)}
                  className="accent-amber-500"
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-ink">{pm.label}</span>
                  <span className="text-[10px] text-ink-muted">{pm.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="quest-diff" className="text-xs font-semibold text-ink-muted">Difficulty Tier</label>
            <select
              id="quest-diff"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-obsidian-950 border border-white/10 text-ink text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>{d.label} ({d.mult}x reward)</option>
              ))}
            </select>
          </div>

          {progressMode === 'count' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="quest-target" className="text-xs font-semibold text-ink-muted">Target Count</label>
              <input
                id="quest-target"
                type="number"
                min={1}
                max={1000}
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-ink text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="quest-due" className="text-xs font-semibold text-ink-muted">Target Due Date</label>
            <input
              id="quest-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-ink text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Rewards Configuration with 50%–150% Visual Bounds */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-gold" />
            <span className="text-xs font-bold text-ink">Calculated Rewards</span>
          </div>
          <button
            type="button"
            onClick={() => setCustomRewardsEnabled(!customRewardsEnabled)}
            className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            {customRewardsEnabled ? 'Reset to Suggested Baseline' : 'Customize Rewards (50%–150%)'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
            <span className="text-ink-muted text-[11px]">XP Reward</span>
            <div className="flex items-baseline gap-1 text-gold font-bold text-sm">
              <span>+{effectiveXp} XP</span>
              <span className="text-[10px] text-ink-muted font-normal">({minXp}–{maxXp})</span>
            </div>
            {customRewardsEnabled && (
              <input
                type="range"
                min={minXp}
                max={maxXp}
                value={effectiveXp}
                onChange={(e) => setCustomXp(Number(e.target.value))}
                className="mt-1 accent-amber-500 cursor-pointer"
              />
            )}
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
            <span className="text-ink-muted text-[11px]">Coins / Gold</span>
            <div className="flex items-baseline gap-1 text-gold font-bold text-sm">
              <span>+{effectiveCoins} Coins</span>
              <span className="text-[10px] text-ink-muted font-normal">({minCoins}–{maxCoins})</span>
            </div>
            {customRewardsEnabled && (
              <input
                type="range"
                min={minCoins}
                max={maxCoins}
                value={effectiveCoins}
                onChange={(e) => setCustomCoins(Number(e.target.value))}
                className="mt-1 accent-amber-500 cursor-pointer"
              />
            )}
          </div>
        </div>
      </div>

      {/* Initial Subtasks (Manual Mode) */}
      {!questToEdit && progressMode === 'manual' && (
        <div className="flex flex-col gap-2 pt-1">
          <label className="text-xs font-semibold text-ink-muted">Initial Checklist Subtasks</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newItemInput}
              onChange={(e) => setNewItemInput(e.target.value)}
              placeholder="e.g. Review database indexes..."
              className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-ink text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={handleAddItem}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-ink cursor-pointer active:scale-95 transition-all"
            >
              Add
            </button>
          </div>
          {items.length > 0 && (
            <div className="flex flex-col gap-1 mt-1 max-h-32 overflow-y-auto">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                  <span className="text-ink line-clamp-1">{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="text-ink-muted hover:text-rose-400 p-1 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/8">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || !title.trim()}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md disabled:opacity-50 active:scale-95 cursor-pointer transition-all flex items-center gap-1.5"
        >
          {isPending ? (
            <span>Saving...</span>
          ) : (
            <>
              <CheckCircle2 size={15} />
              <span>{questToEdit ? 'Update Quest' : 'Save & Initiate Quest'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function AISuggestionView({ onSelectSuggestion, onClose }) {
  const [timeframe, setTimeframe] = useState('weekly');
  const [category, setCategory] = useState('projects');
  const [goal, setGoal] = useState('');
  const createMutation = useCreateQuest();
  const { triggerTransition } = useJeevanTransition();

  const { data, isLoading, refetch } = useQuestSuggestions(
    { timeframe, category, goal },
    { enabled: true }
  );

  const suggestion = data?.suggestions?.[0] || data;

  const handleAdoptProposal = async () => {
    if (!suggestion) return;
    try {
      await createMutation.mutateAsync({
        title: suggestion.title,
        objective: suggestion.objective,
        type: suggestion.type || timeframe,
        questType: suggestion.type || timeframe,
        category: suggestion.category || category,
        difficulty: suggestion.difficulty || 'medium',
        progressMode: suggestion.progressMode || 'count',
        targetValue: suggestion.targetValue || 4,
        rewardXp: suggestion.rewardXp || suggestion.suggestedRewards?.xp,
        rewardCoins: suggestion.rewardCoins || suggestion.suggestedRewards?.gold,
        items: suggestion.subtasks || [],
      });

      onClose();
      triggerTransition({
        variant: 'medium',
        message: 'AI Quest Proposal Adopted!',
        submessage: suggestion.title,
        duration: 1100,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Parameter Controls */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
          <Wand2 size={15} />
          <span>Prompt Jeevan Quest Engine</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-ink-muted">Time Horizon</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-2 rounded-xl bg-obsidian-950 border border-white/10 text-ink text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
            >
              <option value="weekly">Weekly Sprint (3-7 days)</option>
              <option value="monthly">Monthly Milestone (30 days)</option>
              <option value="yearly">Yearly Odyssey (365 days)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-ink-muted">Domain</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-obsidian-950 border border-white/10 text-ink text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
            >
              <option value="projects">Software & Projects</option>
              <option value="learning">Deep Learning & Skills</option>
              <option value="wellbeing">Health & Energy Baseline</option>
              <option value="personal_growth">Mindset & Habits</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-ink-muted">Core Goal / Topic (Optional)</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Master React 19, Half Marathon, Full-Stack App..."
              className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-ink text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={() => refetch()}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 cursor-pointer active:scale-95 transition-all"
            >
              Regenerate
            </button>
          </div>
        </div>
      </div>

      {/* Suggested Proposal Card */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-ink-muted">
          <JeevanLoader size={32} />
          <span className="text-xs font-mono">Synthesizing balanced challenge proposal...</span>
        </div>
      ) : suggestion ? (
        <div className="rounded-3xl p-5 bg-gradient-to-br from-white/[0.05] to-purple-500/[0.06] border border-purple-500/20 shadow-lg flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
              AI Proposed Challenge · {suggestion.type || timeframe}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-mono text-gold font-bold">
              <Sparkles size={13} className="text-amber-400" />
              <span>+{suggestion.rewardXp || suggestion.suggestedRewards?.xp} XP · +{suggestion.rewardCoins || suggestion.suggestedRewards?.gold} Coins</span>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-ink font-display">{suggestion.title}</h3>
            {suggestion.objective && (
              <p className="mt-1 text-xs text-ink-muted leading-relaxed font-medium">
                {suggestion.objective}
              </p>
            )}
          </div>

          {Array.isArray(suggestion.subtasks) && suggestion.subtasks.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-2 border-t border-white/8">
              <span className="text-[11px] font-semibold text-ink-muted">Actionable Subtasks</span>
              <div className="flex flex-col gap-1">
                {suggestion.subtasks.map((st, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-ink/90">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    <span>{st}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={handleAdoptProposal}
              disabled={createMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-500 hover:bg-purple-400 text-white shadow-lg disabled:opacity-50 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>{createMutation.isPending ? 'Initiating...' : 'Adopt & Initiate Quest'}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

QuestModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  questToEdit: PropTypes.object,
};
