import { z } from 'zod';
import { focusService } from '../services/focus.service.js';

const startSessionSchema = z.object({
  plannedDurationSeconds: z.coerce.number().int().min(60).max(14400).default(1500),
  ambientSound: z.enum(['rain', 'lofi', 'silence']).optional().default('silence'),
  taskId: z.string().uuid().optional().nullable(),
  taskType: z.string().optional().default('task'),
  taskTitle: z.string().optional().nullable(),
  sessionType: z.enum(['focus', 'short_break', 'long_break']).optional().default('focus'),
});

export class FocusController {
  /**
   * POST /api/v1/focus/start
   */
  async start(req, res, next) {
    try {
      const parsed = startSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        const err = new Error('Invalid focus session parameters');
        err.status = 400;
        err.code = 'INVALID_REQUEST';
        err.details = parsed.error.format();
        return next(err);
      }

      const session = await focusService.startSession(req.user.id, parsed.data);
      return res.status(201).json({ data: session });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/focus/:id/pause
   */
  async pause(req, res, next) {
    try {
      const result = await focusService.pauseSession(req.user.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/focus/:id/resume
   */
  async resume(req, res, next) {
    try {
      const result = await focusService.resumeSession(req.user.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/focus/:id/complete
   */
  async complete(req, res, next) {
    try {
      const { id } = req.params;
      const result = await focusService.completeSession(req.user.id, id);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/focus/:id/abandon
   */
  async abandon(req, res, next) {
    try {
      const { id } = req.params;
      const session = await focusService.abandonSession(req.user.id, id);
      return res.status(200).json({ data: session });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/focus/current
   */
  async getCurrent(req, res, next) {
    try {
      const session = await focusService.getActiveSession(req.user.id);
      return res.status(200).json({ data: session });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/focus/history
   */
  async list(req, res, next) {
    try {
      const sessions = await focusService.listSessions(req.user.id, req.query);
      return res.status(200).json({ data: sessions });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/focus/summary
   */
  async getSummary(req, res, next) {
    try {
      const summary = await focusService.getSummary(req.user.id);
      return res.status(200).json({ data: summary });
    } catch (err) {
      next(err);
    }
  }
}

export const focusController = new FocusController();
