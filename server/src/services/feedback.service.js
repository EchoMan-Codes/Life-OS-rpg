import { query } from '../db/pool.js';

export const feedbackService = {
  /**
   * Submit a new feedback ticket.
   */
  async createFeedback(userId, { category, message, appVersion = '1.0.0', platform = 'web', attachmentUrl = null }) {
    if (!category || !message) {
      const err = new Error('Category and message are required.');
      err.status = 400;
      throw err;
    }

    const sql = `
      INSERT INTO user_feedback (user_id, category, message, app_version, platform, attachment_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'Submitted')
      RETURNING id, user_id, category, message, app_version, platform, attachment_url, status, created_at, updated_at
    `;

    const { rows } = await query(sql, [
      userId,
      category.trim(),
      message.trim(),
      appVersion || '1.0.0',
      platform || 'web',
      attachmentUrl || null,
    ]);

    return rows[0];
  },

  /**
   * List feedback submitted by the authenticated user.
   */
  async listUserFeedback(userId) {
    const sql = `
      SELECT id, category, message, app_version, platform, attachment_url, status, created_at, updated_at
      FROM user_feedback
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `;
    const { rows } = await query(sql, [userId]);
    return rows;
  },
};
