import { questService } from '../services/quest.service.js';
import { calculateQuestSuggestedReward } from '../services/reward-table.js';

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
      const type = req.query.type || null;
      const category = req.query.category || null;
      const includeArchived = req.query.includeArchived === 'true' || req.query.include_archived === 'true';
      const quests = await questService.listQuests(req.user.id, { status, type, category, includeArchived });
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
      const {
        title,
        objective,
        description,
        priority,
        difficulty,
        type,
        limitCategory,
        category,
        progressMode,
        targetValue,
        currentValue,
        rewardXp,
        rewardCoins,
        startsAt,
        dueDate,
        reminderEnabled,
        reminderTime,
        reminderDate,
        reminderFrequency,
        reminderDaysBefore,
        items,
        linkedTaskIds,
      } = req.body;

      const quest = await questService.createQuest(req.user.id, {
        title,
        objective,
        description,
        priority,
        difficulty,
        type: type || req.body.questType || null,
        limitCategory,
        category,
        progressMode,
        targetValue,
        currentValue,
        rewardXp,
        rewardCoins,
        startsAt,
        dueDate,
        reminderEnabled,
        reminderTime,
        reminderDate,
        reminderFrequency,
        reminderDaysBefore,
        items,
        linkedTaskIds,
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
      const {
        title,
        objective,
        description,
        priority,
        difficulty,
        category,
        dueDate,
        startsAt,
        reminderEnabled,
        reminderTime,
        reminderDate,
        reminderFrequency,
        reminderDaysBefore,
      } = req.body;

      const quest = await questService.updateQuest(req.user.id, req.params.id, {
        title,
        objective,
        description,
        priority,
        difficulty,
        category,
        dueDate,
        startsAt,
        reminderEnabled,
        reminderTime,
        reminderDate,
        reminderFrequency,
        reminderDaysBefore,
      });

      return res.status(200).json({ data: quest });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/quests/:id/progress
   */
  async recordProgress(req, res, next) {
    try {
      const { delta, increment, currentCount, idempotencyKey, eventId, notes } = req.body;
      const result = await questService.recordProgress(req.user.id, req.params.id, {
        delta: delta ?? increment ?? 1,
        currentCount,
        idempotencyKey: idempotencyKey ?? eventId ?? null,
        notes,
      });
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/quests/:id/extend
   */
  async extendQuest(req, res, next) {
    try {
      const { newDueDate, reason } = req.body;
      const result = await questService.extendQuest(req.user.id, req.params.id, {
        newDueDate,
        reason,
      });
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/quests/:id/cancel
   */
  async cancelQuest(req, res, next) {
    try {
      const result = await questService.cancelQuest(req.user.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/quests/suggestions
   * Generates structured AI quest proposals based on timeframe, goal, and category.
   */
  async generateSuggestions(req, res, next) {
    try {
      const src = req.method === 'GET' ? req.query : req.body;
      const timeframe = src.timeframe || src.questType || 'weekly';
      const goal = src.goal || '';
      let category = src.category || 'learning';
      if (category === 'fitness' || category === 'wellness') category = 'wellbeing';
      if (category === 'career') category = 'projects';

      const suggestedRewards = calculateQuestSuggestedReward(timeframe, 'medium');

      // Curated suggestions mapping for diverse goals and timeframes
      const domainTemplates = {
        learning: {
          title: goal ? `Master ${goal}` : 'Deep Skill Acquisition Sprint',
          objective: goal
            ? `Complete 5 structured study/practice modules for ${goal} and document key insights.`
            : 'Complete 5 structured study/practice modules and document key insights.',
          progressMode: 'count',
          targetValue: 5,
          subtasks: [
            'Review foundational concepts & architectural overview',
            'Implement 2 hands-on practice exercises',
            'Conduct code review and refine solution',
            'Write synthesis notes and key takeaways',
          ],
        },
        projects: {
          title: goal ? `Deliver ${goal}` : 'Project Milestone Execution',
          objective: goal
            ? `Ship complete functional prototype for ${goal} with automated test suite.`
            : 'Ship complete functional prototype with automated test suite.',
          progressMode: 'task',
          targetValue: 4,
          subtasks: [
            'Finalize architectural schema and endpoints',
            'Build frontend UI components and responsive layout',
            'Connect integration tests and fix edge cases',
            'Deploy release candidate and record demo',
          ],
        },
        wellbeing: {
          title: goal ? `Health Protocol: ${goal}` : 'Vitality & Recovery Reset',
          objective: 'Maintain unbroken morning routines, hydration targets, and physical recovery.',
          progressMode: 'count',
          targetValue: 7,
          subtasks: [
            'Daily morning sunlight and hydration',
            'Complete focused 30-minute cardio / lifting session',
            'Unplug digital devices 45 mins before bedtime',
          ],
        },
        personal_growth: {
          title: goal ? `Evolution: ${goal}` : 'Habit Mastery & Discipline Protocol',
          objective: 'Execute high-leverage habits without compromise and record daily reflections.',
          progressMode: 'count',
          targetValue: 5,
          subtasks: [
            'Conduct morning priority planning',
            'Eliminate distractions during deep focus block',
            'Review weekly wins and blockers',
          ],
        },
        other: {
          title: goal ? `Conquer: ${goal}` : 'High Impact Objective',
          objective: goal ? `Achieve full measurable outcome for ${goal}.` : 'Achieve full measurable outcome.',
          progressMode: 'task',
          targetValue: 3,
          subtasks: [
            'Define requirements and scope',
            'Execute primary milestone actions',
            'Verify quality and document completion',
          ],
        },
      };

      const template = domainTemplates[category] || domainTemplates.other;

      const suggestion = {
        title: template.title,
        objective: template.objective,
        type: timeframe,
        category,
        difficulty: 'medium',
        progressMode: template.progressMode,
        targetValue: template.targetValue,
        rewardXp: suggestedRewards.xp,
        rewardCoins: suggestedRewards.gold,
        suggestedRewards,
        subtasks: template.subtasks,
      };

      return res.status(200).json({
        success: true,
        data: {
          ...suggestion,
          suggestions: [suggestion],
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/quests/:id
   */
  async archiveQuest(req, res, next) {
    try {
      const permanent = req.query.permanent === 'true';
      if (permanent) {
        const result = await questService.deleteQuestPermanently(req.user.id, req.params.id);
        return res.status(200).json({ data: result });
      }
      const result = await questService.archiveQuest(req.user.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/quests/:id/restore
   */
  async restoreQuest(req, res, next) {
    try {
      const result = await questService.restoreQuest(req.user.id, req.params.id);
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
