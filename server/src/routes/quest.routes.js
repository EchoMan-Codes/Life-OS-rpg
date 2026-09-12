import { Router } from 'express';
import { z } from 'zod';

import { questController } from '../controllers/quest.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const createQuestSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().trim().max(2000).nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  difficulty: z.enum(['trivial', 'easy', 'medium', 'hard']).default('medium'),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
  items: z
    .array(
      z.union([
        z.string().trim().min(1),
        z.object({
          title: z.string().trim().min(1, 'Item title is required').max(200),
        }),
      ])
    )
    .optional()
    .default([]),
});

const updateQuestSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  difficulty: z.enum(['trivial', 'easy', 'medium', 'hard']).optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
});

const reorderSchema = z.object({
  orderedIds: z.array(z.string().uuid('Invalid UUID in orderedIds')).min(1, 'At least one ID required'),
});

const createItemSchema = z.object({
  title: z.string().trim().min(1, 'Item title is required').max(200),
  xpReward: z.number().int().min(1).optional(),
  goldReward: z.number().int().min(0).optional(),
});

const updateItemSchema = z.object({
  title: z.string().trim().min(1, 'Item title is required').max(200),
});

// All quest routes require authentication
router.use(requireAuth);

router.get('/', (req, res, next) => questController.listQuests(req, res, next));
router.post('/', validate(createQuestSchema), (req, res, next) => questController.createQuest(req, res, next));
router.patch('/reorder', validate(reorderSchema), (req, res, next) => questController.reorderQuests(req, res, next));

router.get('/:id', (req, res, next) => questController.getQuest(req, res, next));
router.patch('/:id', validate(updateQuestSchema), (req, res, next) => questController.updateQuest(req, res, next));
router.delete('/:id', (req, res, next) => questController.archiveQuest(req, res, next));
router.post('/:id/complete', (req, res, next) => questController.completeQuest(req, res, next));

router.post('/:id/items', validate(createItemSchema), (req, res, next) => questController.addQuestItem(req, res, next));
router.patch('/:id/items/reorder', validate(reorderSchema), (req, res, next) => questController.reorderQuestItems(req, res, next));
router.patch('/:id/items/:itemId', validate(updateItemSchema), (req, res, next) => questController.updateQuestItem(req, res, next));
router.delete('/:id/items/:itemId', (req, res, next) => questController.deleteQuestItem(req, res, next));

router.post('/:id/items/:itemId/complete', (req, res, next) => questController.completeQuestItem(req, res, next));
router.post('/:id/items/:itemId/undo', (req, res, next) => questController.undoQuestItem(req, res, next));

export default router;
