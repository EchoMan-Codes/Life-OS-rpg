import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativePlatform } from './native/nativeApp';
import { computeNextFireTimes, generateOccurrenceKey, isWithinQuietHours } from './scheduler';
import { playSound } from './sound';
import { apiClient } from './axios';

/**
 * Convert URL-safe base64 string to Uint8Array for applicationServerKey.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Authoritative Client-Side Notification & Reminder Engine
 * Integrates Web Push (Service Worker), Capacitor LocalNotifications for native mobile,
 * BroadcastChannel multi-tab deduplication, and pure scheduling computation.
 */
class NotificationService {
  constructor() {
    this.permissionGranted = false;
    this.navigateHandler = null;
    this.toastHandler = null;
    this.broadcastChannel = null;
    this.activeTimers = new Map();
    this.isServiceWorkerRegistered = false;

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('jeevan_notification_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'OCCURRENCE_DELIVERED') {
            this.markOccurrenceHandledLocal(event.data.occurrenceKey);
          }
        };
      } catch (err) {
        console.warn('[NOTIFICATIONS] BroadcastChannel unavailable:', err.message);
      }
    }

    this.init();
  }

  async init() {
    try {
      if (isNativePlatform()) {
        const status = await LocalNotifications.checkPermissions();
        this.permissionGranted = status.display === 'granted';

        LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
          const actionUrl = action.notification?.extra?.actionUrl;
          if (actionUrl) {
            this.handleNavigation(actionUrl);
          }
        });
      } else if (typeof window !== 'undefined') {
        if ('Notification' in window) {
          this.permissionGranted = Notification.permission === 'granted';
        }
        // Register service worker if supported
        if ('serviceWorker' in navigator) {
          try {
            await navigator.serviceWorker.register('/sw.js');
            this.isServiceWorkerRegistered = true;
          } catch (swErr) {
            console.warn('[NOTIFICATIONS] Service worker registration error:', swErr.message);
          }
        }
      }
    } catch (err) {
      console.warn('[NOTIFICATIONS] Init error:', err.message);
    }
  }

  setNavigateHandler(fn) {
    this.navigateHandler = fn;
  }

  setToastHandler(fn) {
    this.toastHandler = fn;
  }

  handleNavigation(url) {
    if (this.navigateHandler) {
      this.navigateHandler(url);
    } else if (typeof window !== 'undefined') {
      window.location.hash = url;
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

        if (this.permissionGranted) {
          // Opportunistically subscribe to Web Push
          await this.subscribeToWebPush();
        }
        return this.permissionGranted;
      }
    } catch (err) {
      console.warn('[NOTIFICATIONS] Permission request failed:', err.message);
    }
    return false;
  }

  /**
   * Register Web Push subscription with VAPID key
   */
  async subscribeToWebPush() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      // 1. Fetch server VAPID public key
      const keyRes = await apiClient.get('/notifications/vapid-public-key');
      const publicKey = keyRes.data.data?.publicKey;

      if (!publicKey) {
        console.warn('[NOTIFICATIONS] No VAPID public key returned by server.');
        return null;
      }

      // 2. Subscribe with pushManager
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // 3. Post subscription to backend
      const rawSub = subscription.toJSON();
      await apiClient.post('/notifications/subscribe', {
        endpoint: rawSub.endpoint,
        keys: rawSub.keys,
        userAgent: navigator.userAgent,
      });

      console.log('[NOTIFICATIONS] Web Push subscribed successfully.');
      return subscription;
    } catch (err) {
      console.warn('[NOTIFICATIONS] Web Push subscription failed:', err.message);
      return null;
    }
  }

  /**
   * iOS PWA inspection helper
   */
  isIosDevice() {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  isIosStandalone() {
    if (typeof window === 'undefined') return false;
    return Boolean(window.navigator.standalone) || window.matchMedia('(display-mode: standalone)').matches;
  }

  /**
   * Schedule Daily reminder using authoritative scheduler
   */
  async scheduleDailyReminder(daily, userPreferences = {}) {
    if (!daily || !daily.reminderEnabled || !daily.scheduledTime) return null;

    const fireTimes = computeNextFireTimes({
      item: daily,
      itemType: 'daily',
      now: new Date(),
      limit: 3,
      quietHours: {
        enabled: Boolean(userPreferences.quietHoursEnabled),
        start: userPreferences.quietHoursStart || '22:00',
        end: userPreferences.quietHoursEnd || '07:00',
      },
    });

    if (fireTimes.length === 0) return null;

    const nextOccurrence = fireTimes[0];
    const diffMs = nextOccurrence.fireTime.getTime() - Date.now();

    // Native Mobile Scheduling
    if (isNativePlatform()) {
      try {
        await this.requestPermission();
        const id = Math.abs(this.hashCode(nextOccurrence.occurrenceKey)) % 100000;
        await LocalNotifications.schedule({
          notifications: [
            {
              id,
              title: `🔔 ${daily.title}`,
              body: `Daily ritual at ${daily.scheduledTime}. Ready to maintain your momentum?`,
              schedule: { at: nextOccurrence.fireTime },
              sound: 'beep.wav',
              extra: { dailyId: daily.id, actionUrl: '/dailies' },
            },
          ],
        });
        return id;
      } catch (err) {
        console.warn('[NOTIFICATIONS] Native schedule error:', err.message);
      }
    }

    // In-App Web scheduling (if tab remains open within 24 hours)
    if (diffMs > 0 && diffMs < 24 * 60 * 60 * 1000) {
      this.cancelInAppTimer(nextOccurrence.occurrenceKey);

      const timerId = setTimeout(() => {
        this.triggerInAppOccurrence(nextOccurrence, '/dailies');
      }, diffMs);

      this.activeTimers.set(nextOccurrence.occurrenceKey, timerId);
    }

    return nextOccurrence.occurrenceKey;
  }

  /**
   * Schedule Quest reminder using authoritative scheduler
   */
  async scheduleQuestReminder(quest, userPreferences = {}) {
    if (!quest || !quest.reminderEnabled) return null;

    const fireTimes = computeNextFireTimes({
      item: quest,
      itemType: 'quest',
      now: new Date(),
      limit: 2,
    });

    if (fireTimes.length === 0) return null;

    const nextOccurrence = fireTimes[0];
    const diffMs = nextOccurrence.fireTime.getTime() - Date.now();

    if (isNativePlatform()) {
      try {
        await this.requestPermission();
        const id = Math.abs(this.hashCode(nextOccurrence.occurrenceKey)) % 100000;
        await LocalNotifications.schedule({
          notifications: [
            {
              id,
              title: `⚔️ Quest Reminder: ${quest.title}`,
              body: `Due soon (${quest.dueDate || 'Active Campaign'}). Complete subtasks to claim your reward!`,
              schedule: { at: nextOccurrence.fireTime },
              sound: 'beep.wav',
              extra: { questId: quest.id, actionUrl: '/quests' },
            },
          ],
        });
        return id;
      } catch (err) {
        console.warn('[NOTIFICATIONS] Native quest schedule error:', err.message);
      }
    }

    if (diffMs > 0 && diffMs < 24 * 60 * 60 * 1000) {
      this.cancelInAppTimer(nextOccurrence.occurrenceKey);
      const timerId = setTimeout(() => {
        this.triggerInAppOccurrence(nextOccurrence, '/quests');
      }, diffMs);
      this.activeTimers.set(nextOccurrence.occurrenceKey, timerId);
    }

    return nextOccurrence.occurrenceKey;
  }

  triggerInAppOccurrence(occurrence, actionUrl) {
    if (this.hasOccurrenceBeenHandled(occurrence.occurrenceKey)) {
      return; // Already delivered by another tab
    }

    this.markOccurrenceHandledLocal(occurrence.occurrenceKey);

    // Broadcast to peer tabs to prevent duplicate alerts
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'OCCURRENCE_DELIVERED',
        occurrenceKey: occurrence.occurrenceKey,
      });
    }

    const title = occurrence.offsetMinutes === 0
      ? `🎯 ${occurrence.title}`
      : `🔔 ${occurrence.title} in ${occurrence.offsetMinutes}m`;
    const body = `Scheduled ritual time has arrived. Tap to view.`;

    // 1. Play sound effect
    playSound('quest_subtask');

    // 2. Show in-app Toast
    if (this.toastHandler) {
      this.toastHandler({ title, message: body, type: 'info' });
    }

    // 3. Show System Notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: '/branding/jeevan-icon-192.png',
          badge: '/branding/jeevan-icon-192.png',
        });
        notif.onclick = () => {
          window.focus();
          this.handleNavigation(actionUrl);
        };
      } catch {
        // Fallback
      }
    }
  }

  cancelInAppTimer(occurrenceKey) {
    if (this.activeTimers.has(occurrenceKey)) {
      clearTimeout(this.activeTimers.get(occurrenceKey));
      this.activeTimers.delete(occurrenceKey);
    }
  }

  markOccurrenceHandledLocal(key) {
    try {
      localStorage.setItem(`jeevan_notif_${key}`, String(Date.now()));
    } catch {
      // Ignore
    }
  }

  hasOccurrenceBeenHandled(key) {
    try {
      return Boolean(localStorage.getItem(`jeevan_notif_${key}`));
    } catch {
      return false;
    }
  }

  async sendTestNotification() {
    try {
      const res = await apiClient.post('/notifications/test');
      playSound('achievement');
      return res.data.data;
    } catch (err) {
      console.error('[NOTIFICATIONS] Send test failed:', err);
      throw err;
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
