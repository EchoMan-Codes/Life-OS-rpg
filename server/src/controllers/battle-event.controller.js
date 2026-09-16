import { z } from 'zod';
import { battleEventService } from '../services/battle-event.service.js';

const listQuerySchema = z.object({
  limit: z
    .preprocess((val) => (val !== undefined ? parseInt(String(val), 10) : 20), z.number().int().min(1).max(100))
    .default(20),
});

export class BattleEventController {
  /**
   * GET /api/v1/battle-events?limit=20
   */
  async listEvents(req, res, next) {
    try {
      const parsed = listQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        const err = new Error('Invalid query parameters');
        err.status = 400;
        err.code = 'INVALID_QUERY_PARAMS';
        err.details = parsed.error.format();
        return next(err);
      }

      const events = await battleEventService.listBattleEvents(req.user.id, {
        limit: parsed.data.limit,
      });

      return res.status(200).json({ data: events });
    } catch (err) {
      next(err);
    }
  }
}

export const battleEventController = new BattleEventController();
