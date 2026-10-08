import { notificationService } from '../services/notification.service.js';
import { dailyService } from '../services/daily.service.js';
import { questService } from '../services/quest.service.js';
import { computeNextFireTimes } from '../utils/scheduler.js';

export const notificationController = {
  async list(req, res, next) {
    try {
      const limit = parseInt(req.query.limit || '30', 10);
      const offset = parseInt(req.query.offset || '0', 10);
      const unreadOnly = req.query.unreadOnly === 'true';
      const type = req.query.type;

      const result = await notificationService.listNotifications(req.user.id, {
        limit,
        offset,
        unreadOnly,
        type,
      });

      return res.json({
        data: result.notifications,
        meta: {
          total: result.total,
          unreadCount: result.unreadCount,
          limit,
          offset,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async unreadCount(req, res, next) {
    try {
      const count = await notificationService.getUnreadCount(req.user.id);
      return res.json({ data: { unreadCount: count } });
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await notificationService.markAsRead(req.user.id, id);
      if (!updated) {
        return res.status(404).json({ error: { message: 'Notification not found' } });
      }
      return res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      await notificationService.markAllAsRead(req.user.id);
      return res.json({ data: { success: true } });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await notificationService.deleteNotification(req.user.id, id);
      if (!deleted) {
        return res.status(404).json({ error: { message: 'Notification not found' } });
      }
      return res.json({ data: { success: true } });
    } catch (err) {
      next(err);
    }
  },

  async getPreferences(req, res, next) {
    try {
      const prefs = await notificationService.getPreferences(req.user.id);
      return res.json({ data: prefs });
    } catch (err) {
      next(err);
    }
  },

  async updatePreferences(req, res, next) {
    try {
      const prefs = await notificationService.updatePreferences(req.user.id, req.body);
      return res.json({ data: prefs });
    } catch (err) {
      next(err);
    }
  },

  async getVapidPublicKey(req, res, next) {
    try {
      const publicKey = notificationService.getVapidPublicKey();
      return res.json({ data: { publicKey } });
    } catch (err) {
      next(err);
    }
  },

  async subscribe(req, res, next) {
    try {
      const { endpoint, keys, userAgent } = req.body;
      if (!endpoint || !keys) {
        return res.status(400).json({ error: { message: 'Push subscription endpoint and keys are required' } });
      }
      const saved = await notificationService.savePushSubscription(req.user.id, { endpoint, keys, userAgent });
      return res.json({ data: saved });
    } catch (err) {
      next(err);
    }
  },

  async unsubscribe(req, res, next) {
    try {
      const { endpoint } = req.body;
      const removed = await notificationService.removePushSubscription(req.user.id, endpoint);
      return res.json({ data: { success: removed } });
    } catch (err) {
      next(err);
    }
  },

  async sendTest(req, res, next) {
    try {
      const result = await notificationService.sendTestNotification(req.user.id);
      return res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  async snooze(req, res, next) {
    try {
      const { occurrenceKey, snoozeMinutes, title, body, actionUrl } = req.body;
      const result = await notificationService.snoozeNotification(req.user.id, {
        occurrenceKey,
        snoozeMinutes,
        title,
        body,
        actionUrl,
      });
      return res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  async processScheduled(req, res, next) {
    try {
      const result = await notificationService.processScheduledNotifications(req.user?.id);
      return res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  async getUpcomingScheduled(req, res, next) {
    try {
      const userId = req.user.id;
      const [dailies, quests, prefs] = await Promise.all([
        dailyService.listDailies(userId),
        questService.listQuests(userId, { status: 'active' }),
        notificationService.getPreferences(userId),
      ]);

      const now = new Date();
      const timezone = req.user.timezone || 'UTC';
      const quietHours = {
        enabled: Boolean(prefs.quietHoursEnabled),
        start: prefs.quietHoursStart || '22:00',
        end: prefs.quietHoursEnd || '07:00',
      };

      const upcoming = [];
      for (const d of dailies) {
        if (!d.reminderEnabled || !d.scheduledTime) continue;
        const times = computeNextFireTimes({
          item: d,
          itemType: 'daily',
          now,
          timezone,
          limit: 3,
          quietHours,
        });
        upcoming.push(...times);
      }

      for (const q of quests) {
        if (!q.reminderEnabled) continue;
        const times = computeNextFireTimes({
          item: q,
          itemType: 'quest',
          now,
          timezone,
          limit: 2,
          quietHours,
        });
        upcoming.push(...times);
      }

      upcoming.sort((a, b) => a.fireTime.getTime() - b.fireTime.getTime());
      return res.json({ data: upcoming.slice(0, 15) });
    } catch (err) {
      next(err);
    }
  },
};
