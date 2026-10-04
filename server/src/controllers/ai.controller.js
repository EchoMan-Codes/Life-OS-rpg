import { aiService } from '../services/ai.service.js';

export const aiController = {
  async chat(req, res, next) {
    try {
      const { message, history } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: { message: 'Message is required.' } });
      }
      const response = await aiService.chat({
        userId: req.user.id,
        message: message.trim(),
        history: history || [],
      });
      return res.status(200).json({ data: response });
    } catch (err) {
      next(err);
    }
  },

  async executeAction(req, res, next) {
    try {
      const { actionType, payload } = req.body;
      if (!actionType) {
        return res.status(400).json({ error: { message: 'actionType is required.' } });
      }
      const result = await aiService.executeAction(req.user.id, { actionType, payload });
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  async getContext(req, res, next) {
    try {
      const context = await aiService.getUserContext(req.user.id);
      return res.status(200).json({ data: context });
    } catch (err) {
      next(err);
    }
  },
};
