import { feedbackService } from '../services/feedback.service.js';

export const feedbackController = {
  /**
   * POST /api/v1/feedback
   */
  async submitFeedback(req, res, next) {
    try {
      const { category, message, appVersion, platform, attachmentUrl } = req.body;
      const feedback = await feedbackService.createFeedback(req.user.id, {
        category,
        message,
        appVersion,
        platform,
        attachmentUrl,
      });

      return res.status(201).json({
        data: feedback,
        message: 'Feedback submitted successfully. Thank you for helping improve Jeevan!',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/feedback/my
   */
  async getMyFeedback(req, res, next) {
    try {
      const feedbackList = await feedbackService.listUserFeedback(req.user.id);
      return res.status(200).json({ data: feedbackList });
    } catch (err) {
      next(err);
    }
  },
};
