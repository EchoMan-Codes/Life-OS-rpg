import { aiService } from '../services/ai.service.js';

export class AiController {
  async getHistory(req, res, next) {
    try {
      const messages = await aiService.getConversationHistory({
        userId: req.user.id,
        limit: parseInt(req.query.limit || '50', 10),
      });
      return res.status(200).json({ data: { messages } });
    } catch (err) {
      next(err);
    }
  }

  async getContext(req, res, next) {
    try {
      const context = await aiService.getUserContext(req.user.id);
      return res.status(200).json({ data: { context } });
    } catch (err) {
      next(err);
    }
  }

  async chat(req, res, next) {
    try {
      const { message } = req.body;
      const result = await aiService.processMessage({
        userId: req.user.id,
        message,
      });
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async confirmAction(req, res, next) {
    try {
      const { messageId } = req.params;
      const result = await aiService.confirmAction({
        userId: req.user.id,
        messageId,
      });
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async cancelAction(req, res, next) {
    try {
      const { messageId } = req.params;
      const result = await aiService.cancelAction({
        userId: req.user.id,
        messageId,
      });
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const aiController = new AiController();
