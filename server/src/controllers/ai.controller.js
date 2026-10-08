import { aiService } from '../services/ai.service.js';

export const aiController = {
  /**
   * SSE Token-by-Token Streaming Chat Endpoint
   */
  async chatStream(req, res) {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'A non-empty message string is required.' },
      });
    }

    if (message.length > 4000) {
      return res.status(400).json({
        error: { code: 'INPUT_TOO_LONG', message: 'Message exceeds maximum length of 4000 characters.' },
      });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const abortController = new AbortController();
    req.on('close', () => {
      abortController.abort();
    });

    const sendEvent = (data) => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    };

    try {
      // Save incoming user message in DB
      await aiService.saveChatMessage(req.user.id, { role: 'user', content: message.trim() });

      let fullText = '';
      let structuredAction = null;

      await aiService.streamChat({
        userId: req.user.id,
        message: message.trim(),
        history: history || [],
        onChunk: (chunk) => {
          if (chunk.type === 'token') fullText += chunk.content;
          if (chunk.type === 'action') structuredAction = chunk.action;
          sendEvent(chunk);
        },
        signal: abortController.signal,
      });

      // Save assistant response in DB
      if (fullText) {
        await aiService.saveChatMessage(req.user.id, {
          role: 'assistant',
          content: fullText,
          structuredAction,
        });
      }

      res.end();
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('[AI_STREAM_ERROR]', err.message);
      sendEvent({
        type: 'error',
        error: err.message || 'AI service temporarily unavailable. Please retry.',
      });
      res.end();
    }
  },

  /**
   * Synchronous Chat Endpoint (Non-streaming)
   */
  async chat(req, res) {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Message is required.' },
      });
    }

    if (message.length > 4000) {
      return res.status(400).json({
        error: { code: 'INPUT_TOO_LONG', message: 'Message exceeds maximum length of 4000 characters.' },
      });
    }

    try {
      await aiService.saveChatMessage(req.user.id, { role: 'user', content: message.trim() });

      const response = await aiService.chat({
        userId: req.user.id,
        message: message.trim(),
        history: history || [],
      });

      if (response.message) {
        await aiService.saveChatMessage(req.user.id, {
          role: 'assistant',
          content: response.message,
          structuredAction: response.structuredAction,
        });
      }

      return res.status(200).json({ data: response });
    } catch (err) {
      console.error('[AI_CHAT_ERROR]', err.message);
      return res.status(500).json({
        error: {
          code: 'AI_PROVIDER_ERROR',
          message: err.message || 'AI service temporarily unavailable.',
        },
      });
    }
  },

  async getHistory(req, res, next) {
    try {
      const history = await aiService.getChatHistory(req.user.id, 30);
      return res.json({ data: history });
    } catch (err) {
      next(err);
    }
  },

  async clearHistory(req, res, next) {
    try {
      await aiService.clearChatHistory(req.user.id);
      return res.json({ data: { success: true } });
    } catch (err) {
      next(err);
    }
  },

  async executeAction(req, res) {
    try {
      const { actionType, payload } = req.body;
      if (!actionType) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'actionType is required.' },
        });
      }
      const result = await aiService.executeAction(req.user.id, { actionType, payload });
      return res.status(200).json({ data: result });
    } catch (err) {
      console.error('[AI_ACTION_ERROR]', err.message);
      return res.status(500).json({
        error: {
          code: 'ACTION_EXECUTION_ERROR',
          message: err.message || 'Failed to execute requested action inside Jeevan.',
        },
      });
    }
  },

  async getContext(req, res, next) {
    try {
      const context = await aiService.getUserContext(req.user.id, 'jeevan_query');
      return res.status(200).json({ data: context });
    } catch (err) {
      next(err);
    }
  },

  async exportTrainingData(req, res, next) {
    try {
      const jsonl = await aiService.exportTrainingDataset();
      res.setHeader('Content-Type', 'application/x-jsonlines');
      res.setHeader('Content-Disposition', 'attachment; filename="jeevan-ai-training-dataset.jsonl"');
      return res.send(jsonl);
    } catch (err) {
      next(err);
    }
  },

  async getStatus(req, res, next) {
    try {
      const data = await aiService.getStatus();
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
