import webpush from 'web-push';
import { pool } from '../db/pool.js';
import { computeNextFireTimes, generateOccurrenceKey, isWithinQuietHours } from '../utils/scheduler.js';
import { dailyService } from './daily.service.js';
import { questService } from './quest.service.js';

let vapidConfigured = false;
let devVapidKeys = null;

function ensureVapidConfig() {
  if (vapidConfigured) return;
  const subject = process.env.VAPID_SUBJECT || 'mailto:support@jeevan.app';
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;

  if (pub && priv) {
    try {
      webpush.setVapidDetails(subject, pub, priv);
      vapidConfigured = true;
    } catch (e) {
      console.warn('[NOTIFICATIONS] VAPID configuration error:', e.message);
    }
  } else if (!devVapidKeys) {
    try {
      devVapidKeys = webpush.generateVAPIDKeys();
      webpush.setVapidDetails(subject, devVapidKeys.publicKey, devVapidKeys.privateKey);
      vapidConfigured = true;
    } catch (e) {
      console.warn('[NOTIFICATIONS] Dev VAPID generation error:', e.message);
    }
  }
}

export const notificationService = {
  getVapidPublicKey() {
    ensureVapidConfig();
    return process.env.VAPID_PUBLIC_KEY || devVapidKeys?.publicKey || null;
  },

  async listNotifications(userId, { limit = 30, offset = 0, unreadOnly = false, type } = {}) {
    const conditions = ['user_id = $1'];
    const params = [userId];

    if (unreadOnly) {
      conditions.push('is_read = false');
    }

    if (type && type !== 'all') {
      params.push(type);
      conditions.push(`type = $${params.length}`);
    }

    const whereClause = conditions.join(' AND ');

    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const listQuery = `
      SELECT id, user_id as "userId", title, body, type, action_url as "actionUrl",
             is_read as "isRead", data, created_at as "createdAt", read_at as "readAt"
      FROM notifications
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const countQuery = `
      SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE is_read = false) as "unreadCount"
      FROM notifications
      WHERE user_id = $1
    `;

    const [listResult, countResult] = await Promise.all([
      pool.query(listQuery, params),
      pool.query(countQuery, [userId]),
    ]);

    return {
      notifications: listResult.rows,
      total: parseInt(countResult.rows[0]?.total || 0, 10),
      unreadCount: parseInt(countResult.rows[0]?.unreadCount || 0, 10),
    };
  },

  async getUnreadCount(userId) {
    const res = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return parseInt(res.rows[0]?.count || 0, 10);
  },

  async markAsRead(userId, notificationId) {
    const res = await pool.query(
      `UPDATE notifications
       SET is_read = true, read_at = now()
       WHERE id = $1 AND user_id = $2
       RETURNING id, is_read as "isRead", read_at as "readAt"`,
      [notificationId, userId]
    );
    return res.rows[0] || null;
  },

  async markAllAsRead(userId) {
    await pool.query(
      `UPDATE notifications
       SET is_read = true, read_at = now()
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return { success: true };
  },

  async deleteNotification(userId, notificationId) {
    const res = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [notificationId, userId]
    );
    return res.rowCount > 0;
  },

  async createNotification(userId, { title, body, type = 'daily_reminder', actionUrl = null, data = {} }) {
    const res = await pool.query(
      `INSERT INTO notifications (user_id, title, body, type, action_url, data)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id as "userId", title, body, type, action_url as "actionUrl",
                 is_read as "isRead", data, created_at as "createdAt"`,
      [userId, title, body, type, actionUrl, JSON.stringify(data)]
    );
    return res.rows[0];
  },

  async getPreferences(userId) {
    const res = await pool.query(
      'SELECT notification_preferences as "notificationPreferences" FROM users WHERE id = $1',
      [userId]
    );
    return {
      masterEnabled: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      dailyBeforeTask: true,
      dailyAtTask: true,
      habitReminders: true,
      questDeadline: true,
      questProgress: true,
      morningBriefing: true,
      morningTime: '07:00 AM',
      eveningReflection: true,
      eveningTime: '09:00 PM',
      achievements: true,
      aiRecommendations: true,
      reminderMinutesBefore: 10,
      soundEnabled: true,
      ...(res.rows[0]?.notificationPreferences || {}),
    };
  },

  async updatePreferences(userId, preferences) {
    const res = await pool.query(
      `UPDATE users
       SET notification_preferences = COALESCE(notification_preferences, '{}'::jsonb) || $2::jsonb
       WHERE id = $1
       RETURNING notification_preferences as "notificationPreferences"`,
      [userId, JSON.stringify(preferences)]
    );
    return res.rows[0]?.notificationPreferences;
  },

  // ─────────────────────────────────────────────────────────────
  // WEB PUSH SUBSCRIPTIONS & DELIVERY
  // ─────────────────────────────────────────────────────────────

  async savePushSubscription(userId, { endpoint, keys, userAgent }) {
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      throw new Error('Valid push subscription endpoint and cryptographic keys are required.');
    }

    const res = await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (endpoint)
       DO UPDATE SET user_id = $1, p256dh = $3, auth = $4, user_agent = $5, created_at = now()
       RETURNING id, endpoint, user_agent as "userAgent", created_at as "createdAt"`,
      [userId, endpoint, keys.p256dh, keys.auth, userAgent || null]
    );
    return res.rows[0];
  },

  async removePushSubscription(userId, endpoint) {
    if (!endpoint) return false;
    const res = await pool.query(
      'DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2',
      [userId, endpoint]
    );
    return res.rowCount > 0;
  },

  async listPushSubscriptions(userId) {
    const res = await pool.query(
      'SELECT id, endpoint, user_agent as "userAgent", created_at as "createdAt" FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );
    return res.rows;
  },

  async sendPushToUser(userId, payload) {
    ensureVapidConfig();
    const subs = await this.listPushSubscriptions(userId);
    if (subs.length === 0) return { deliveredCount: 0 };

    const payloadString = JSON.stringify({
      title: payload.title || 'Jeevan',
      body: payload.body || '',
      icon: payload.icon || '/branding/jeevan-icon-192.png',
      badge: payload.badge || '/branding/jeevan-icon-192.png',
      data: {
        actionUrl: payload.actionUrl || '/',
        itemId: payload.itemId || null,
        occurrenceKey: payload.occurrenceKey || null,
        ...payload.data,
      },
    });

    let sent = 0;
    const staleEndpoints = [];

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          const pushSub = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };
          // Fetch full keys from db
          const keyRes = await pool.query('SELECT p256dh, auth FROM push_subscriptions WHERE id = $1', [sub.id]);
          if (keyRes.rows[0]) {
            pushSub.keys.p256dh = keyRes.rows[0].p256dh;
            pushSub.keys.auth = keyRes.rows[0].auth;
            await webpush.sendNotification(pushSub, payloadString, { TTL: 60 * 60 });
            sent++;
          }
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            // Subscription expired or unregistered by client browser
            staleEndpoints.push(sub.endpoint);
          } else {
            console.warn('[NOTIFICATIONS] Push delivery failed for subscription:', err.message);
          }
        }
      })
    );

    if (staleEndpoints.length > 0) {
      await pool.query('DELETE FROM push_subscriptions WHERE endpoint = ANY($1)', [staleEndpoints]);
    }

    return { deliveredCount: sent };
  },

  async sendTestNotification(userId) {
    const prefs = await this.getPreferences(userId);
    const inApp = await this.createNotification(userId, {
      title: '🎯 Test Notification Verified',
      body: 'Your Jeevan smart notification pipeline is operating and verified.',
      type: 'system',
      actionUrl: '/dashboard',
    });

    let pushResult = { deliveredCount: 0 };
    if (prefs.masterEnabled !== false) {
      pushResult = await this.sendPushToUser(userId, {
        title: '🎯 Test Notification Verified',
        body: 'Web Push connection verified for this device.',
        actionUrl: '/dashboard',
      });
    }

    return {
      notification: inApp,
      pushDelivered: pushResult.deliveredCount,
    };
  },

  // ─────────────────────────────────────────────────────────────
  // RECURRING SCHEDULE PROCESSING & DEDUPLICATION ENGINE
  // ─────────────────────────────────────────────────────────────

  async processScheduledNotifications(targetUserId = null) {
    ensureVapidConfig();
    const now = new Date();
    const usersQuery = targetUserId
      ? 'SELECT id, timezone, notification_preferences FROM users WHERE id = $1'
      : 'SELECT id, timezone, notification_preferences FROM users WHERE notification_preferences->>\'masterEnabled\' != \'false\'';
    const usersParams = targetUserId ? [targetUserId] : [];

    const usersRes = await pool.query(usersQuery, usersParams);
    const summary = { processedUsers: usersRes.rows.length, delivered: 0, missed: 0, skipped: 0 };

    for (const u of usersRes.rows) {
      const userId = u.id;
      const timezone = u.timezone || 'UTC';
      const prefs = u.notification_preferences || {};

      if (prefs.masterEnabled === false) {
        summary.skipped++;
        continue;
      }

      const quietHours = {
        enabled: Boolean(prefs.quietHoursEnabled),
        start: prefs.quietHoursStart || '22:00',
        end: prefs.quietHoursEnd || '07:00',
      };

      // 1. Fetch user's active Dailies and Quests
      const [dailies, quests] = await Promise.all([
        dailyService.listDailies(userId),
        questService.listQuests(userId, { status: 'active' }),
      ]);

      const allFireTimes = [];

      for (const d of dailies) {
        if (!d.reminderEnabled || !d.scheduledTime) continue;
        const computed = computeNextFireTimes({
          item: d,
          itemType: 'daily',
          now,
          timezone,
          limit: 3,
          quietHours,
        });
        allFireTimes.push(...computed);
      }

      for (const q of quests) {
        if (!q.reminderEnabled) continue;
        const computed = computeNextFireTimes({
          item: q,
          itemType: 'quest',
          now,
          timezone,
          limit: 2,
          quietHours,
        });
        allFireTimes.push(...computed);
      }

      for (const ft of allFireTimes) {
        const fireDiff = now.getTime() - ft.fireTime.getTime();

        // STRICT TIME GATE: Fire time must be reached
        // (within near window of -60s to +600s grace)
        if (fireDiff < -60000) {
          // Future fire time: not yet due
          continue;
        }

        // Check deduplication table
        const checkDelivery = await pool.query(
          'SELECT id, status FROM notification_deliveries WHERE occurrence_key = $1',
          [ft.occurrenceKey]
        );

        if (checkDelivery.rows.length > 0) {
          // Already handled or delivered
          continue;
        }

        // Check if missed beyond 10-minute grace window
        if (fireDiff > 10 * 60 * 1000) {
          // Missed: Record as missed in deliveries and notification center
          await pool.query(
            `INSERT INTO notification_deliveries (user_id, occurrence_key, item_type, item_id, fire_time, status)
             VALUES ($1, $2, $3, $4, $5, 'missed')
             ON CONFLICT (occurrence_key) DO NOTHING`,
            [userId, ft.occurrenceKey, ft.itemType, ft.itemId, ft.fireTime]
          );

          await this.createNotification(userId, {
            title: `Missed: ${ft.title}`,
            body: `Scheduled for ${ft.displayTimeCompact} (${ft.relativeLabel}).`,
            type: ft.itemType === 'daily' ? 'daily_reminder' : 'quest_deadline',
            actionUrl: ft.itemType === 'daily' ? '/dailies' : '/quests',
            data: { status: 'missed', occurrenceKey: ft.occurrenceKey },
          });

          summary.missed++;
          continue;
        }

        // Valid ready fire time within grace window:
        // Record delivery atomically
        const insertRes = await pool.query(
          `INSERT INTO notification_deliveries (user_id, occurrence_key, item_type, item_id, fire_time, status)
           VALUES ($1, $2, $3, $4, $5, 'delivered')
           ON CONFLICT (occurrence_key) DO NOTHING
           RETURNING id`,
          [userId, ft.occurrenceKey, ft.itemType, ft.itemId, ft.fireTime]
        );

        if (insertRes.rows.length === 0) {
          // Concurrent worker delivered this occurrence first
          continue;
        }

        const notifTitle = ft.offsetMinutes === 0
          ? `🎯 ${ft.title}`
          : `🔔 ${ft.title} in ${ft.offsetMinutes}m`;
        const notifBody = ft.itemType === 'daily'
          ? `Daily ritual at ${ft.scheduledTime}. Ready to maintain your momentum?`
          : `Quest reminder due at ${ft.scheduledTime}.`;

        await this.createNotification(userId, {
          title: notifTitle,
          body: notifBody,
          type: ft.itemType === 'daily' ? 'daily_reminder' : 'quest_deadline',
          actionUrl: ft.itemType === 'daily' ? '/dailies' : '/quests',
          data: {
            occurrenceKey: ft.occurrenceKey,
            itemId: ft.itemId,
            itemType: ft.itemType,
          },
        });

        // Deliver Web Push if not in quiet hours
        if (!ft.isQuietHours) {
          await this.sendPushToUser(userId, {
            title: notifTitle,
            body: notifBody,
            actionUrl: ft.itemType === 'daily' ? '/dailies' : '/quests',
            itemId: ft.itemId,
            occurrenceKey: ft.occurrenceKey,
          });
        }

        summary.delivered++;
      }
    }

    return summary;
  },

  async snoozeNotification(userId, { occurrenceKey, snoozeMinutes = 10, title, body, actionUrl }) {
    const deferMinutes = Number(snoozeMinutes) || 10;
    const now = new Date();
    const deferredFireTime = new Date(now.getTime() + deferMinutes * 60 * 1000);
    const newKey = `snooze_${userId}_${Date.now()}_${deferMinutes}m`;

    await pool.query(
      `INSERT INTO notification_deliveries (user_id, occurrence_key, item_type, fire_time, status)
       VALUES ($1, $2, 'snooze', $3, 'snoozed')
       ON CONFLICT (occurrence_key) DO NOTHING`,
      [userId, newKey, deferredFireTime]
    );

    return {
      success: true,
      deferredUntil: deferredFireTime.toISOString(),
      snoozeMinutes: deferMinutes,
    };
  },
};
