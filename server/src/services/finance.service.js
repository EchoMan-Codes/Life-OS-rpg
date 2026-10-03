import { query } from '../db/pool.js';

export class FinanceService {
  /**
   * Log an expense entry for a user.
   */
  async createExpense({ userId, amount, currency = 'INR', category = 'other', note = '', spentAt = new Date() }) {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      const err = new Error('Expense amount must be a positive number.');
      err.status = 400;
      throw err;
    }

    const cleanCategory = String(category).toLowerCase().trim() || 'other';
    const cleanNote = String(note || '').trim();

    const res = await query(
      `INSERT INTO expenses (user_id, amount, currency, category, note, spent_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, amount, currency, category, note, spent_at, created_at`,
      [userId, numAmount, currency, cleanCategory, cleanNote, spentAt]
    );

    return res.rows[0];
  }

  /**
   * Fetch paginated expenses for an authenticated user.
   */
  async getExpenses({ userId, limit = 50, offset = 0 }) {
    const res = await query(
      `SELECT id, amount, currency, category, note, spent_at, created_at
       FROM expenses
       WHERE user_id = $1
       ORDER BY spent_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return res.rows;
  }

  /**
   * Fetch high-level spending analytics for dashboard and AI intelligence.
   */
  async getExpenseSummary({ userId }) {
    // Current month total
    const monthRes = await query(
      `SELECT COALESCE(SUM(amount), 0) AS total_month,
              COUNT(id) AS count_month
       FROM expenses
       WHERE user_id = $1
         AND spent_at >= date_trunc('month', now())`,
      [userId]
    );

    // Grouped by category this month
    const categoryRes = await query(
      `SELECT category,
              SUM(amount) AS total,
              COUNT(id) AS count
       FROM expenses
       WHERE user_id = $1
         AND spent_at >= date_trunc('month', now())
       GROUP BY category
       ORDER BY total DESC`,
      [userId]
    );

    // Recent 5 transactions
    const recentRes = await query(
      `SELECT id, amount, currency, category, note, spent_at
       FROM expenses
       WHERE user_id = $1
       ORDER BY spent_at DESC
       LIMIT 5`,
      [userId]
    );

    const totalMonth = parseFloat(monthRes.rows[0]?.total_month || 0);
    const countMonth = parseInt(monthRes.rows[0]?.count_month || 0, 10);

    return {
      totalMonth,
      countMonth,
      categories: categoryRes.rows.map((r) => ({
        category: r.category,
        total: parseFloat(r.total),
        count: parseInt(r.count, 10),
      })),
      recentTransactions: recentRes.rows,
    };
  }
}

export const financeService = new FinanceService();
