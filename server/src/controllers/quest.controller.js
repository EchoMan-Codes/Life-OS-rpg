import { questService } from '../services/quest.service.js';

/**
 * Controller for Quest and checklist subtask endpoints.
 */
export class QuestController {
  /**
   * GET /api/v1/quests
   */
  async listQuests(req, res, next) {
    try {
      const status = req.query.status || 'active';
      const quests = await questService.listQuests(req.user.id, { status });
      return res.status(200).json({ data: quests });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/quests/:id
   */
  async getQuest(req, res, next) {
    try {
      const quest = await questService.getQuestById(req.user.id, req.params.id);
      return res.status(200).json({ data: quest });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/quests
   */
  async createQuest(req, res, next) {
    try {
      const { title, description, priority, difficulty, dueDate, items } = req.body;
      const quest = await questService.createQuest(req.user.id, {
        title,
        description,
        priority,
        difficulty,
        dueDate,
        items,
      });
      return res.status(201).json({ data: quest });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/quests/:id
   */
  async updateQuest(req, res, next) {
    try {
      const { title, description, priority, difficulty, dueDate } = req.body;
      const quest = await questService.updateQuest(req.user.id, req.params.id, {
        title,
        description,
        priority,
        difficulty,
        dueDate,
      });
      return res.status(200).json({ data: quest });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/quests/:id
   */
  async archiveQuest(req, res, next) {
    try {
      const result = await questService.archiveQuest(req.user.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/quests/reorder
   */
  async reorderQuests(req, res, next) {
    try {
      const { orderedIds } = req.body;
      const result = await questService.reorderQuests(req.user.id, orderedIds);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/quests/:id/items
   */
  async addQuestItem(req, res, next) {
    try {
      const { title, xpReward, goldReward } = req.body;
      const item = await questService.addQuestItem(req.user.id, req.params.id, {
        title,
        xpReward,
        goldReward,
      });
      return res.status(201).json({ data: item });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/quests/:id/items/:itemId
   */
  async updateQuestItem(req, res, next) {
    try {
      const { title } = req.body;
      const item = await questService.updateQuestItem(req.user.id, req.params.id, req.params.itemId, {
        title,
      });
      return res.status(200).json({ data: item });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/quests/:id/items/:itemId
   */
  async deleteQuestItem(req, res, next) {
    try {
      const result = await questService.deleteQuestItem(req.user.id, req.params.id, req.params.itemId);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/quests/:id/items/reorder
   */
  async reorderQuestItems(req, res, next) {
    try {
      const { orderedIds } = req.body;
      const result = await questService.reorderQuestItems(req.user.id, req.params.id, orderedIds);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/quests/:id/items/:itemId/complete
   */
  async completeQuestItem(req, res, next) {
    try {
      const result = await questService.completeQuestItem(req.user.id, req.params.id, req.params.itemId);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/quests/:id/items/:itemId/undo
   */
  async undoQuestItem(req, res, next) {
    try {
      const result = await questService.undoQuestItem(req.user.id, req.params.id, req.params.itemId);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/quests/:id/complete
   */
  async completeQuest(req, res, next) {
    try {
      const result = await questService.completeQuest(req.user.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const questController = new QuestController();
