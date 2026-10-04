import { notificationService } from '../services/notification.service.js';

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
};
