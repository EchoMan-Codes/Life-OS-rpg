import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Sparkles,
  Clock,
  CalendarDays,
  CheckSquare,
  TrendingUp,
  CalendarCheck,
  Flame,
  Scroll,
  Moon,
  ShoppingBag,
  User,
  Swords,
  X,
  ArrowRight,
  Command,
} from 'lucide-react';
import clsx from 'clsx';
import { modalPanel } from '@/lib/motionVariants';

const COMMAND_ITEMS = [
  {
    id: 'ai-strategist',
    title: 'Ask Jeevan AI',
    subtitle: 'Plan your day, reason over tasks, create schedules',
    icon: Sparkles,
    category: 'AI Assistant',
    color: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    path: '/ai',
  },
  {
    id: 'open-calendar',
    title: 'Smart Calendar & Time Blocking',
    subtitle: 'View day/week/month schedule and drop task blocks',
    icon: CalendarDays,
    category: 'Productivity',
    color: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30',
    path: '/calendar',
  },
  {
    id: 'manage-tasks',
    title: 'Tasks & Deadline Manager',
    subtitle: 'Organize backlog, subtasks, projects and deadlines',
    icon: CheckSquare,
    category: 'Productivity',
    color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    path: '/tasks',
  },
  {
    id: 'start-focus',
    title: 'Start Focus Chamber',
    subtitle: 'Begin deep work session & regenerate Mana',
    icon: Clock,
    category: 'Productivity',
    color: 'text-sky-400 bg-sky-500/15 border-sky-500/30',
    path: '/focus',
  },
  {
    id: 'weekly-insights',
    title: 'Weekly Review & Analytics',
    subtitle: 'Inspect deep work metrics, completion velocity & reflect',
    icon: TrendingUp,
    category: 'Analytics',
    color: 'text-purple-400 bg-purple-500/15 border-purple-500/30',
    path: '/insights',
  },
  {
    id: 'conquer-dailies',
    title: 'Daily Rituals',
    subtitle: 'Review & conquer recurring daily commitments',
    icon: CalendarCheck,
    category: 'Rituals',
    color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    path: '/dailies',
  },
  {
    id: 'score-habits',
    title: 'Habit Momentum',
    subtitle: 'Score positive/negative habits & build streaks',
    icon: Flame,
    category: 'Habits',
    color: 'text-orange-400 bg-orange-500/15 border-orange-500/30',
    path: '/habits',
  },
  {
    id: 'view-quests',
    title: 'Campaign Quests',
    subtitle: 'Break down major goals into milestone roadmaps',
    icon: Scroll,
    category: 'Quests',
    color: 'text-purple-400 bg-purple-500/15 border-purple-500/30',
    path: '/quests',
  },
  {
    id: 'evening-reflection',
    title: 'Evening Reflection',
    subtitle: 'Log daily wellness, mood, and cognitive focus',
    icon: Moon,
    category: 'Wellness',
    color: 'text-teal-400 bg-teal-500/15 border-teal-500/30',
    path: '/reflection',
  },
  {
    id: 'reward-shop',
    title: 'Reward Shop',
    subtitle: 'Spend hard-earned gold coins on custom rewards',
    icon: ShoppingBag,
    category: 'RPG Economy',
    color: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30',
    path: '/shop',
  },
  {
    id: 'character-profile',
    title: 'Character Profile & Radar',
    subtitle: 'Inspect 5 attributes, level progression & history',
    icon: User,
    category: 'Character',
    color: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30',
    path: '/profile',
  },
];

export function CommandPalette({ isOpen, onClose, onOpenAi }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const filteredItems = COMMAND_ITEMS.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        executeItem(selected);
      }
    }
  };

  const executeItem = (item) => {
    onClose();
    if (item.action === 'ai') {
      onOpenAi?.();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          onKeyDown={handleKeyDown}
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 p-4 overflow-y-auto"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-md"
          />

          {/* Palette Dialog */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-xl rounded-3xl bg-slate-950/45 border border-white/20 shadow-[0_25px_70px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-3xl overflow-hidden text-white"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
              <Search size={18} className="text-amber-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Type a command or jump to feature (e.g. Focus, Dailies, AI)..."
                className="w-full bg-transparent text-sm sm:text-base text-white placeholder:text-white/40 focus:outline-none"
              />
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                aria-label="Close command palette"
              >
                <X size={16} />
              </button>
            </div>

            {/* List of Results */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1 scrollbar-thin">
              {filteredItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-white/40 font-mono">
                  No matching workspace actions found
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => executeItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={clsx(
                        'w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left cursor-pointer min-h-[52px]',
                        isSelected
                          ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30'
                          : 'hover:bg-white/5 border border-transparent'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={clsx(
                            'w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-inner',
                            item.color
                          )}
                        >
                          <Icon size={17} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-white leading-tight truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-white/50 leading-tight mt-0.5 truncate">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10">
                          {item.category}
                        </span>
                        {isSelected && <ArrowRight size={14} className="text-amber-400" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom Keyboard Shortcut Hint */}
            <div className="px-4 py-2.5 bg-black/40 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-white/40">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70">↓</kbd> navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70">↵</kbd> select
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70">esc</kbd> close
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

CommandPalette.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onOpenAi: PropTypes.func,
};
