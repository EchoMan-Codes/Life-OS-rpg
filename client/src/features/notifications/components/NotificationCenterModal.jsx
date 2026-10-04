import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  CalendarCheck,
  Flame,
  Scroll,
  Sparkles,
  Award,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '../hooks';

export function NotificationCenterModal({ isOpen, onClose }) {
  const [filterType, setFilterType] = useState('all');
  const [showPreferences, setShowPreferences] = useState(false);

  const { data: notifData = { notifications: [] }, isLoading } = useNotifications({
    type: filterType !== 'all' ? filterType : undefined,
  });
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllMutation = useMarkAllNotificationsAsRead();
  const deleteMutation = useDeleteNotification();

  const { data: preferences = {} } = useNotificationPreferences();
  const updatePrefsMutation = useUpdateNotificationPreferences();

  const notifications = notifData.notifications || [];

  // Group notifications into Today and Earlier
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayNotifications = notifications.filter((n) => (n.createdAt || '').slice(0, 10) === todayStr);
  const earlierNotifications = notifications.filter((n) => (n.createdAt || '').slice(0, 10) !== todayStr);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'daily_reminder':
        return <CalendarCheck size={16} className="text-emerald-500" />;
      case 'habit_reminder':
        return <Flame size={16} className="text-amber-500 fill-amber-500" />;
      case 'quest_deadline':
        return <Scroll size={16} className="text-purple-400" />;
      case 'ai_recommendation':
        return <Sparkles size={16} className="text-cyan-400" />;
      case 'achievement':
        return <Award size={16} className="text-amber-400" />;
      default:
        return <Bell size={16} className="text-indigo-400" />;
    }
  };

  const handleTogglePref = (key) => {
    updatePrefsMutation.mutate({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <Bell size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-ink font-display">
                    Notification Center
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-ink-muted">
                    {notifData.unreadCount || 0} unread notifications
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowPreferences(!showPreferences)}
                  className={clsx(
                    'p-2 rounded-xl border transition-all text-xs flex items-center gap-1',
                    showPreferences
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                      : 'bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/10 text-slate-600 dark:text-ink-muted hover:text-slate-900 dark:hover:text-ink'
                  )}
                  title="Preferences"
                >
                  <SlidersHorizontal size={15} />
                </button>

                {notifications.some((n) => !n.isRead) && (
                  <button
                    type="button"
                    onClick={() => markAllMutation.mutate()}
                    disabled={markAllMutation.isPending}
                    className="p-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-ink-muted hover:text-slate-900 dark:hover:text-ink transition-all text-xs flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <CheckCheck size={15} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-3 px-4 border-b border-slate-200/60 dark:border-white/5 overflow-x-auto no-scrollbar bg-slate-50/40 dark:bg-transparent">
              {[
                { id: 'all', label: 'All' },
                { id: 'daily_reminder', label: 'Dailies' },
                { id: 'habit_reminder', label: 'Habits' },
                { id: 'quest_deadline', label: 'Quests' },
                { id: 'ai_recommendation', label: 'AI Insights' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id)}
                  className={clsx(
                    'px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all',
                    filterType === tab.id
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-ink-muted hover:text-slate-900 dark:hover:text-ink border border-slate-200/80 dark:border-white/5'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {showPreferences ? (
                /* Preferences Panel */
                <div className="space-y-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-ink mb-1">
                    Notification & Reminder Preferences
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-ink-muted mb-3">
                    Configure your personalized smart alerts, daily rituals, and reminder schedules.
                  </p>

                  {/* Scheduled Daily Rituals (Morning & Evening) */}
                  <div className="p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-3">
                    <p className="text-xs font-bold text-slate-900 dark:text-ink">Daily Smart Rituals</p>

                    {/* Morning Briefing */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-800 dark:text-ink">Morning Plan Briefing</p>
                        <p className="text-[10px] text-slate-500 dark:text-ink-muted">Summary of today's Dailies & Quests</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={preferences.morningTime || '07:30'}
                          onChange={(e) => updatePrefsMutation.mutate({ ...preferences, morningTime: e.target.value })}
                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-xs text-slate-800 dark:text-ink font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleTogglePref('morningBriefing')}
                          className={clsx(
                            'w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer',
                            preferences.morningBriefing !== false ? 'bg-amber-500' : 'bg-slate-300 dark:bg-white/15'
                          )}
                        >
                          <div
                            className={clsx(
                              'w-4 h-4 rounded-full bg-white shadow-xs transition-transform',
                              preferences.morningBriefing !== false ? 'translate-x-4' : 'translate-x-0'
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Evening Reflection */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-800 dark:text-ink">Evening Reflection Reminder</p>
                        <p className="text-[10px] text-slate-500 dark:text-ink-muted">Review what went well and plan improvements</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={preferences.eveningTime || '21:00'}
                          onChange={(e) => updatePrefsMutation.mutate({ ...preferences, eveningTime: e.target.value })}
                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-xs text-slate-800 dark:text-ink font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleTogglePref('eveningReflection')}
                          className={clsx(
                            'w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer',
                            preferences.eveningReflection !== false ? 'bg-amber-500' : 'bg-slate-300 dark:bg-white/15'
                          )}
                        >
                          <div
                            className={clsx(
                              'w-4 h-4 rounded-full bg-white shadow-xs transition-transform',
                              preferences.eveningReflection !== false ? 'translate-x-4' : 'translate-x-0'
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Task & Gamification Toggles */}
                  {[
                    { key: 'dailyBeforeTask', label: 'Dailies: 10m Prior Alert', desc: 'Pre-task warning before scheduled time' },
                    { key: 'dailyAtTask', label: 'Dailies: At-Task Alert', desc: 'Notification right when a daily task starts' },
                    { key: 'habitReminders', label: 'Habit Discipline Alerts', desc: 'Gentle nudges to preserve active streaks' },
                    { key: 'questDeadline', label: 'Quest Deadlines', desc: 'Alerts when quest deadlines are approaching' },
                    { key: 'questProgress', label: 'Quest Milestone Progress', desc: 'Celebrations and milestone checkpoints' },
                    { key: 'achievements', label: 'Level Ups & Achievements', desc: 'Celebrations when reaching new tiers' },
                    { key: 'aiRecommendations', label: 'AI Smart Recommendations', desc: 'Personalized schedule and productivity tips' },
                    { key: 'soundEnabled', label: 'Audio Notification Cues', desc: 'Play haptic sound effect on incoming alert' },
                  ].map((pref) => {
                    const isChecked = preferences[pref.key] !== false;
                    return (
                      <div
                        key={pref.key}
                        onClick={() => handleTogglePref(pref.key)}
                        className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 cursor-pointer hover:border-amber-400 transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-ink">{pref.label}</p>
                          <p className="text-[11px] text-slate-500 dark:text-ink-muted">{pref.desc}</p>
                        </div>
                        <div
                          className={clsx(
                            'w-10 h-6 rounded-full transition-colors relative p-0.5 shrink-0',
                            isChecked ? 'bg-amber-500' : 'bg-slate-300 dark:bg-white/15'
                          )}
                        >
                          <div
                            className={clsx(
                              'w-5 h-5 rounded-full bg-white shadow-xs transition-transform',
                              isChecked ? 'translate-x-4' : 'translate-x-0'
                            )}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : isLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                /* Empty State */
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-3xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 mb-3">
                    <Bell size={22} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-ink">All Caught Up</h4>
                  <p className="text-xs text-slate-500 dark:text-ink-muted mt-1 max-w-xs">
                    You have no active alerts. Scheduled daily and habit reminders will appear here.
                  </p>
                </div>
              ) : (
                /* Notifications List */
                <div className="space-y-4">
                  {todayNotifications.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-ink-muted">
                        Today
                      </span>
                      {todayNotifications.map((notif) => (
                        <NotificationItem
                          key={notif.id}
                          notif={notif}
                          getTypeIcon={getTypeIcon}
                          onMarkRead={() => markAsReadMutation.mutate(notif.id)}
                          onDelete={() => deleteMutation.mutate(notif.id)}
                          onClose={onClose}
                        />
                      ))}
                    </div>
                  )}

                  {earlierNotifications.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-ink-muted">
                        Earlier
                      </span>
                      {earlierNotifications.map((notif) => (
                        <NotificationItem
                          key={notif.id}
                          notif={notif}
                          getTypeIcon={getTypeIcon}
                          onMarkRead={() => markAsReadMutation.mutate(notif.id)}
                          onDelete={() => deleteMutation.mutate(notif.id)}
                          onClose={onClose}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function NotificationItem({ notif, getTypeIcon, onMarkRead, onDelete, onClose }) {
  const isUnread = !notif.isRead;

  return (
    <div
      className={clsx(
        'group flex items-start gap-3 p-3 rounded-2xl border transition-all',
        isUnread
          ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30'
          : 'bg-white dark:bg-white/[0.02] border-slate-200/80 dark:border-white/5 opacity-80'
      )}
    >
      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center shrink-0 mt-0.5">
        {getTypeIcon(notif.type)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4
            className={clsx(
              'text-xs font-bold truncate',
              isUnread ? 'text-slate-900 dark:text-ink' : 'text-slate-700 dark:text-ink-muted'
            )}
          >
            {notif.title}
          </h4>
          <span className="text-[10px] font-mono text-slate-400 shrink-0">
            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-ink-muted mt-0.5 line-clamp-2 leading-relaxed">
          {notif.body}
        </p>

        {notif.actionUrl && (
          <Link
            to={notif.actionUrl}
            onClick={onClose}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-gold mt-1.5 hover:underline"
          >
            <span>View details</span>
            <ChevronRight size={12} />
          </Link>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {isUnread && (
          <button
            type="button"
            onClick={onMarkRead}
            className="p-1 text-amber-600 hover:text-amber-700 dark:text-gold rounded-lg hover:bg-amber-500/10 transition-colors"
            title="Mark as read"
          >
            <CheckCheck size={14} />
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
