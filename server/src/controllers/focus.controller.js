import { z } from 'zod';
import { focusService } from '../services/focus.service.js';

const startSessionSchema = z.object({
  plannedDurationSeconds: z.union([
    z.literal(900),
    z.literal(1500),
    z.literal(3000),
  ], {
    errorMap: () => ({ message: 'Planned duration must be 900 (15m), 1500 (25m), or 3000 (50m) seconds' }),
  }),
  ambientSound: z.enum(['rain', 'lofi', 'silence']).optional().default('silence'),
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
}

export const focusController = new FocusController();
