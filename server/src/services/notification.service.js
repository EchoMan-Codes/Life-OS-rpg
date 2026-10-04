import { pool } from '../db/pool.js';

export const notificationService = {
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
};
