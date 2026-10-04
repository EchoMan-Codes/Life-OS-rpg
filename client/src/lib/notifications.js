import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativePlatform } from './native/nativeApp';

/**
 * Centralized Notification & Reminder Service
 * Uses Capacitor LocalNotifications on native iOS/Android,
 * with graceful browser Notification API fallback.
 */

class NotificationService {
  constructor() {
    this.permissionGranted = false;
    this.init();
  }

  async init() {
    try {
      if (isNativePlatform()) {
        const status = await LocalNotifications.checkPermissions();
        this.permissionGranted = status.display === 'granted';
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        this.permissionGranted = Notification.permission === 'granted';
      }
    } catch (err) {
      console.warn('[NOTIFICATIONS] Init error:', err.message);
    }
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

    // Calculate next occurrence
    const now = new Date();
    const scheduledDate = new Date();
    scheduledDate.setHours(time.hours, time.minutes, 0, 0);

    // Subtract minutes before
    scheduledDate.setMinutes(scheduledDate.getMinutes() - minutesBefore);

    // If time has already passed today, schedule for tomorrow
    if (scheduledDate <= now) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    const id = Math.abs(this.hashCode(daily.id || daily.title)) % 100000;
    const title = minutesBefore === 0
      ? `🎯 Time for ${daily.title}`
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
      // Web notification schedule via setTimeout if within 24 hours
      const diff = scheduledDate.getTime() - now.getTime();
      if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          this.showLocalToast(title, body);
        }, diff);
      }
    } catch (err) {
      console.warn('[NOTIFICATIONS] Schedule error:', err.message);
    }
    return null;
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
  showLocalToast(title, body) {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/favicon.ico' });
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
