import { financeService } from '../services/finance.service.js';

export class FinanceController {
  async getExpenses(req, res, next) {
    try {
      const expenses = await financeService.getExpenses({
        userId: req.user.id,
        limit: parseInt(req.query.limit || '50', 10),
        offset: parseInt(req.query.offset || '0', 10),
      });
      return res.status(200).json({ data: { expenses } });
    } catch (err) {
      next(err);
    }
  }

  async getSummary(req, res, next) {
    try {
      const summary = await financeService.getExpenseSummary({ userId: req.user.id });
      return res.status(200).json({ data: { summary } });
    } catch (err) {
      next(err);
    }
  }

  async createExpense(req, res, next) {
    try {
      const { amount, currency, category, note, spentAt } = req.body;
      const expense = await financeService.createExpense({
        userId: req.user.id,
        amount,
        currency,
        category,
        note,
        spentAt,
      });
      return res.status(201).json({ data: { expense } });
    } catch (err) {
      next(err);
    }
  }
}

export const financeController = new FinanceController();
