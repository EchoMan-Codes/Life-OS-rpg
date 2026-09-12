import { dailyService } from '../services/daily.service.js';

/**
 * Controller for Daily ritual endpoints.
 */
export class DailyController {
  /**
   * GET /api/v1/dailies
   */
  async listDailies(req, res, next) {
    try {
      const includeArchived = req.query.includeArchived === 'true';
      const dailies = await dailyService.listDailies(req.user.id, { includeArchived });
      return res.status(200).json({ data: dailies });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/dailies/:id
   */
  async getDaily(req, res, next) {
    try {
      const daily = await dailyService.getDailyById(req.user.id, req.params.id);
      return res.status(200).json({ data: daily });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/dailies
   */
  async createDaily(req, res, next) {
    try {
      const { title, description, difficulty, activeDays } = req.body;
      const daily = await dailyService.createDaily(req.user.id, {
        title,
        description,
        difficulty,
        activeDays,
      });
      return res.status(201).json({ data: daily });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/dailies/:id
   */
  async updateDaily(req, res, next) {
    try {
      const { title, description, difficulty, activeDays } = req.body;
      const daily = await dailyService.updateDaily(req.user.id, req.params.id, {
        title,
        description,
        difficulty,
        activeDays,
      });
      return res.status(200).json({ data: daily });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/dailies/:id
   */
  async archiveDaily(req, res, next) {
    try {
      const result = await dailyService.archiveDaily(req.user.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/dailies/:id/complete
   */
  async completeDaily(req, res, next) {
    try {
      const result = await dailyService.completeDaily(req.user.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/dailies/:id/undo
   */
  async undoDaily(req, res, next) {
    try {
      const result = await dailyService.undoDaily(req.user.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const dailyController = new DailyController();
