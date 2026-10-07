import { aiService } from '../services/ai.service.js';

export const aiController = {
  async chat(req, res, next) {
    const requestId = req.headers['x-request-id'] || `ai_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      const { message, history } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          error: { message: 'Message is required.' },
        });
      }
      const response = await aiService.chat({
        userId: req.user.id,
        message: message.trim(),
        history: history || [],
        requestId,
      });
      return res.status(200).json({ success: true, data: response });
    } catch (err) {
      console.error('[JEEVAN_AI_ERROR]', {
        requestId,
        userId: req.user?.id,
        route: '/api/v1/ai/chat',
        provider: process.env.AI_PROVIDER || 'openai',
        model: process.env.OPENAI_MODEL || 'gpt-6-sol',
        errorType: err.name || 'Error',
        errorMessage: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      });

      return res.status(500).json({
        success: false,
        code: 'AI_PROVIDER_ERROR',
        message: 'Jeevan AI is temporarily unavailable. Please try again.',
        error: {
          code: 'AI_PROVIDER_ERROR',
          message: 'Jeevan AI is temporarily unavailable. Please try again.',
        },
      });
    }
  },

  async executeAction(req, res, next) {
    const requestId = req.headers['x-request-id'] || `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      const { actionType, payload } = req.body;
      if (!actionType) {
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          error: { message: 'actionType is required.' },
        });
      }
      const result = await aiService.executeAction(req.user.id, { actionType, payload });
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      console.error('[JEEVAN_AI_ACTION_ERROR]', {
        requestId,
        userId: req.user?.id,
        route: '/api/v1/ai/execute-action',
        errorMessage: err.message,
      });
      return res.status(500).json({
        success: false,
        code: 'ACTION_EXECUTION_ERROR',
        message: err.message || 'Failed to execute action inside Jeevan.',
        error: { message: err.message || 'Failed to execute action inside Jeevan.' },
      });
    }
  },

  async getContext(req, res, next) {
    try {
      const context = await aiService.getUserContext(req.user.id);
      return res.status(200).json({ success: true, data: context });
    } catch (err) {
      next(err);
    }
  },
};
