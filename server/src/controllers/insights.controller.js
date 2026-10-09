import { insightsService } from '../services/insights.service.js';

export const insightsController = {
  async getWeeklyInsights(req, res, next) {
    try {
      const data = await insightsService.getWeeklyInsights(req.user.id, req.query);
      return res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  },

  async getTrends(req, res, next) {
    try {
      const data = await insightsService.getTrends(req.user.id, req.query);
      return res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  },

  async saveWeeklyReview(req, res, next) {
    try {
      const review = await insightsService.saveWeeklyReview(req.user.id, req.body);
      return res.status(200).json({ data: review });
    } catch (err) {
      next(err);
    }
  },

  async listWeeklyReviews(req, res, next) {
    try {
      const reviews = await insightsService.listWeeklyReviews(req.user.id, req.query);
      return res.status(200).json({ data: reviews });
    } catch (err) {
      next(err);
    }
  },
};
