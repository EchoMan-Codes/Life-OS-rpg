import { habitService } from '../services/habit.service.js';

/**
 * Controller for habit endpoints.
 */
export class HabitController {
  /**
   * GET /api/v1/habits
   */
  async listHabits(req, res, next) {
    try {
      const includeArchived = req.query.includeArchived === 'true';
      const habits = await habitService.listHabits(req.user.id, { includeArchived });
      return res.status(200).json({ data: habits });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/habits/:id
   */
  async getHabit(req, res, next) {
    try {
      const habit = await habitService.getHabitById(req.user.id, req.params.id);
      return res.status(200).json({ data: habit });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/habits
   */
  async createHabit(req, res, next) {
    try {
      const { title, description, direction, difficulty } = req.body;
      const habit = await habitService.createHabit(req.user.id, {
        title,
        description,
        direction,
        difficulty,
      });
      return res.status(201).json({ data: habit });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/habits/:id
   */
  async updateHabit(req, res, next) {
    try {
      const { title, description, direction, difficulty } = req.body;
      const habit = await habitService.updateHabit(req.user.id, req.params.id, {
        title,
        description,
        direction,
        difficulty,
      });
      return res.status(200).json({ data: habit });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/habits/:id
   */
  async archiveHabit(req, res, next) {
    try {
      const result = await habitService.archiveHabit(req.user.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/habits/:id/score
   */
  async scoreHabit(req, res, next) {
    try {
      const { direction } = req.body;
      const result = await habitService.scoreHabit(req.user.id, req.params.id, direction);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const habitController = new HabitController();
