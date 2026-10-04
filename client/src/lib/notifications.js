import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativePlatform } from './native/nativeApp';

/**
 * Centralized Smart Notification & Reminder Engine
 * Handles Capacitor LocalNotifications on native Android/iOS,
 * browser notifications fallback, and deep linking actions.
 */
class NotificationService {
  constructor() {
    this.permissionGranted = false;
    this.navigateHandler = null;
    this.init();
  }

  async init() {
    try {
      if (isNativePlatform()) {
        const status = await LocalNotifications.checkPermissions();
        this.permissionGranted = status.display === 'granted';

        // Deep link listener for tapped notifications
        LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
          const actionUrl = action.notification?.extra?.actionUrl;
          if (actionUrl) {
            if (this.navigateHandler) {
              this.navigateHandler(actionUrl);
            } else if (typeof window !== 'undefined') {
              window.location.hash = actionUrl;
            }
          }
        });
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        this.permissionGranted = Notification.permission === 'granted';
      }
    } catch (err) {
      console.warn('[NOTIFICATIONS] Init error:', err.message);
    }
  }

  setNavigateHandler(fn) {
    this.navigateHandler = fn;
  }

  async requestPermission() {
    try {
      if (isNativePlatform()) {
        const status = await LocalNotifications.requestPermissions();
        this.permissionGranted = status.display === 'granted';
        return this.permissionGranted;
      }
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const result = await Notification.requestPermission();
        this.permissionGranted = result === 'granted';
        return this.permissionGranted;
      }
    } catch (err) {
      console.warn('[NOTIFICATIONS] Permission request failed:', err.message);
    }
    return false;
  }

  /**
   * Parse time string like "07:00 PM" or "19:00" into hours and minutes.
   */
  parseTimeString(timeStr) {
    if (!timeStr) return null;
    const clean = timeStr.trim().toUpperCase();
    const isPM = clean.includes('PM');
    const isAM = clean.includes('AM');
    const parts = clean.replace(/[APM\s]/g, '').split(':');
    if (parts.length < 2) return null;

    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return { hours, minutes };
  }

  /**
   * Schedule a reminder for a Daily ritual.
   */
  async scheduleDailyReminder(daily) {
    if (!daily || !daily.reminderEnabled || !daily.scheduledTime) return null;

    const time = this.parseTimeString(daily.scheduledTime);
    if (!time) return null;

    const minutesBefore = daily.reminderMinutesBefore ?? 10;

    const now = new Date();
    const scheduledDate = new Date();
    scheduledDate.setHours(time.hours, time.minutes, 0, 0);
    scheduledDate.setMinutes(scheduledDate.getMinutes() - minutesBefore);

    if (scheduledDate <= now) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    const id = Math.abs(this.hashCode(`daily_${daily.id || daily.title}`)) % 100000;
    const title = minutesBefore === 0
      ? `🎯 Time for: ${daily.title}`
      : `🔔 Daily in ${minutesBefore}m: ${daily.title}`;
    const body = daily.description || `Scheduled daily ritual (${daily.durationMinutes || 30} mins)`;

    try {
      if (isNativePlatform()) {
        await this.requestPermission();
        await LocalNotifications.schedule({
          notifications: [
            {
              id,
              title,
              body,
              schedule: { at: scheduledDate },
              sound: 'beep.wav',
              extra: { dailyId: daily.id, actionUrl: '/dailies' },
            },
          ],
        });
        return id;
      }
      const diff = scheduledDate.getTime() - now.getTime();
      if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          this.showLocalToast(title, body, '/dailies');
        }, diff);
      }
    } catch (err) {
      console.warn('[NOTIFICATIONS] Schedule daily error:', err.message);
    }
    return null;
  }

  /**
   * Schedule a reminder for a Quest deadline.
   */
  async scheduleQuestReminder(quest) {
    if (!quest || !quest.reminderEnabled) return null;

    const reminderTime = this.parseTimeString(quest.reminderTime || '19:00') || { hours: 19, minutes: 0 };
    const now = new Date();
    const targetDate = quest.dueDate ? new Date(quest.dueDate) : new Date();

    const daysBefore = quest.reminderDaysBefore ?? 1;
    targetDate.setDate(targetDate.getDate() - daysBefore);
    targetDate.setHours(reminderTime.hours, reminderTime.minutes, 0, 0);

    if (targetDate <= now) {
      targetDate.setDate(now.getDate() + 1);
    }

    const id = Math.abs(this.hashCode(`quest_${quest.id || quest.title}`)) % 100000;
    const title = `⚔️ Quest Reminder: ${quest.title}`;
    const body = quest.dueDate
      ? `Due in ${daysBefore} days (${quest.dueDate}). Complete subtasks to claim your reward!`
      : `Active quest in your campaign log. Keep your momentum going!`;

    try {
      if (isNativePlatform()) {
        await this.requestPermission();
        await LocalNotifications.schedule({
          notifications: [
            {
              id,
              title,
              body,
              schedule: { at: targetDate },
              sound: 'beep.wav',
              extra: { questId: quest.id, actionUrl: '/quests' },
            },
          ],
        });
        return id;
      }
      const diff = targetDate.getTime() - now.getTime();
      if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          this.showLocalToast(title, body, '/quests');
        }, diff);
      }
    } catch (err) {
      console.warn('[NOTIFICATIONS] Schedule quest error:', err.message);
    }
    return null;
  }

  /**
   * Schedule daily morning briefing and evening reflection notifications based on user preferences.
   */
  async scheduleDailyRituals(preferences = {}) {
    const morningTimeStr = preferences.morningTime || '07:00 AM';
    const eveningTimeStr = preferences.eveningTime || '09:00 PM';

    const morningParsed = this.parseTimeString(morningTimeStr) || { hours: 7, minutes: 0 };
    const eveningParsed = this.parseTimeString(eveningTimeStr) || { hours: 21, minutes: 0 };

    const now = new Date();

    // 1. Morning notification
    if (preferences.morningBriefing !== false) {
      const morningDate = new Date();
      morningDate.setHours(morningParsed.hours, morningParsed.minutes, 0, 0);
      if (morningDate <= now) morningDate.setDate(morningDate.getDate() + 1);

      const mId = 99901;
      try {
        if (isNativePlatform()) {
          await LocalNotifications.schedule({
            notifications: [
              {
                id: mId,
                title: '🌅 Good Morning!',
                body: 'Your Dailies and Quests for today are ready. Step into your routine.',
                schedule: { at: morningDate, repeats: true, every: 'day' },
                extra: { actionUrl: '/dailies' },
              },
            ],
          });
        }
      } catch (e) {
        console.warn('[NOTIFICATIONS] Morning schedule failed:', e.message);
      }
    }

    // 2. Evening reflection
    if (preferences.eveningReflection !== false) {
      const eveningDate = new Date();
      eveningDate.setHours(eveningParsed.hours, eveningParsed.minutes, 0, 0);
      if (eveningDate <= now) eveningDate.setDate(eveningDate.getDate() + 1);

      const eId = 99902;
      try {
        if (isNativePlatform()) {
          await LocalNotifications.schedule({
            notifications: [
              {
                id: eId,
                title: '🌙 Evening Reflection',
                body: 'How did today go? Take a mindful moment to review your progress.',
                schedule: { at: eveningDate, repeats: true, every: 'day' },
                extra: { actionUrl: '/reflection' },
              },
            ],
          });
        }
      } catch (e) {
        console.warn('[NOTIFICATIONS] Evening schedule failed:', e.message);
      }
    }
  }

  /**
   * Cancel a scheduled notification.
   */
  async cancelNotification(notificationId) {
    if (!notificationId) return;
    try {
      if (isNativePlatform()) {
        await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
      }
    } catch (err) {
      console.warn('[NOTIFICATIONS] Cancel error:', err.message);
    }
  }

  /**
   * Display an immediate local notification / toast alert.
   */
  showLocalToast(title, body, actionUrl = null) {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, { body, icon: '/branding/jeevan-icon-192.png' });
        if (actionUrl && this.navigateHandler) {
          notif.onclick = () => {
            window.focus();
            this.navigateHandler(actionUrl);
          };
        }
      } catch (e) {
        console.log(`[ALERT] ${title}: ${body}`);
      }
    }
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}

export const notificationService = new NotificationService();
