import { Router } from 'express';
import { z } from 'zod';

import { questController } from '../controllers/quest.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const createQuestSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  objective: z.string().trim().max(2000).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  difficulty: z.enum(['trivial', 'easy', 'medium', 'hard', 'epic']).default('medium'),
  type: z.enum(['weekly', 'monthly', 'yearly', 'custom']).optional(),
  questType: z.enum(['weekly', 'monthly', 'yearly', 'custom']).optional(),
  limitCategory: z.enum(['weekly', 'monthly', 'yearly']).nullable().optional(),
  category: z.preprocess((val) => {
    if (val === 'fitness' || val === 'wellness') return 'wellbeing';
    if (val === 'productivity' || val === 'career') return 'projects';
    return val;
  }, z.enum(['learning', 'projects', 'wellbeing', 'personal_growth', 'other'])).default('other'),
  progressMode: z.enum(['count', 'task', 'manual']).default('task'),
  targetValue: z.coerce.number().int().min(1).default(1),
  currentValue: z.coerce.number().int().min(0).default(0),
  rewardXp: z.coerce.number().int().min(1).nullable().optional(),
  rewardCoins: z.coerce.number().int().min(0).nullable().optional(),
  startsAt: z.string().optional().nullable(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
  reminderEnabled: z.boolean().optional(),
  reminderTime: z.string().trim().max(10).nullable().optional(),
  reminderDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Reminder date must be in YYYY-MM-DD format').nullable().optional(),
  reminderFrequency: z.enum(['daily', 'days_before', 'on_due_date']).optional(),
  reminderDaysBefore: z.coerce.number().int().min(1).max(30).optional(),
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
  linkedTaskIds: z.array(z.string().uuid('Invalid UUID in linkedTaskIds')).optional().default([]),
});

const updateQuestSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  objective: z.string().trim().max(2000).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  difficulty: z.enum(['trivial', 'easy', 'medium', 'hard', 'epic']).optional(),
  category: z.enum(['learning', 'projects', 'wellbeing', 'personal_growth', 'other']).optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
  startsAt: z.string().optional().nullable(),
  reminderEnabled: z.boolean().optional(),
  reminderTime: z.string().trim().max(10).nullable().optional(),
  reminderDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Reminder date must be in YYYY-MM-DD format').nullable().optional(),
  reminderFrequency: z.enum(['daily', 'days_before', 'on_due_date']).optional(),
  reminderDaysBefore: z.coerce.number().int().min(1).max(30).optional(),
});

const recordProgressSchema = z.object({
  delta: z.coerce.number().int().optional(),
  increment: z.coerce.number().int().optional(),
  currentCount: z.coerce.number().int().min(0).optional(),
  idempotencyKey: z.string().max(100).nullable().optional(),
  eventId: z.string().max(100).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

const extendQuestSchema = z.object({
  newDueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'New due date must be in YYYY-MM-DD format'),
  reason: z.string().max(500).nullable().optional(),
});

const suggestionSchema = z.object({
  timeframe: z.enum(['weekly', 'monthly', 'yearly', 'custom']).default('weekly'),
  goal: z.string().max(500).optional().default(''),
  category: z.enum(['learning', 'projects', 'wellbeing', 'personal_growth', 'other']).default('learning'),
});

const reorderSchema = z.object({
  orderedIds: z.array(z.string().uuid('Invalid UUID in orderedIds')).min(1, 'At least one ID required'),
});

const createItemSchema = z.object({
  title: z.string().trim().min(1, 'Item title is required').max(200),
  xpReward: z.coerce.number().int().min(1).optional(),
  goldReward: z.coerce.number().int().min(0).optional(),
});

const updateItemSchema = z.object({
  title: z.string().trim().min(1, 'Item title is required').max(200),
});

// All quest routes require authentication
router.use(requireAuth);

router.get('/', (req, res, next) => questController.listQuests(req, res, next));
router.get('/suggestions', (req, res, next) => questController.generateSuggestions(req, res, next));
router.post('/suggestions', validate(suggestionSchema), (req, res, next) => questController.generateSuggestions(req, res, next));
router.post('/', validate(createQuestSchema), (req, res, next) => questController.createQuest(req, res, next));
router.patch('/reorder', validate(reorderSchema), (req, res, next) => questController.reorderQuests(req, res, next));

router.get('/:id', (req, res, next) => questController.getQuest(req, res, next));
router.patch('/:id', validate(updateQuestSchema), (req, res, next) => questController.updateQuest(req, res, next));
router.delete('/:id', (req, res, next) => questController.archiveQuest(req, res, next));
router.post('/:id/restore', (req, res, next) => questController.restoreQuest(req, res, next));
router.post('/:id/complete', (req, res, next) => questController.completeQuest(req, res, next));
router.post('/:id/progress', validate(recordProgressSchema), (req, res, next) => questController.recordProgress(req, res, next));
router.post('/:id/extend', validate(extendQuestSchema), (req, res, next) => questController.extendQuest(req, res, next));
router.post('/:id/cancel', (req, res, next) => questController.cancelQuest(req, res, next));

router.post('/:id/items', validate(createItemSchema), (req, res, next) => questController.addQuestItem(req, res, next));
router.patch('/:id/items/reorder', validate(reorderSchema), (req, res, next) => questController.reorderQuestItems(req, res, next));
router.patch('/:id/items/:itemId', validate(updateItemSchema), (req, res, next) => questController.updateQuestItem(req, res, next));
router.delete('/:id/items/:itemId', (req, res, next) => questController.deleteQuestItem(req, res, next));

router.post('/:id/items/:itemId/complete', (req, res, next) => questController.completeQuestItem(req, res, next));
router.post('/:id/items/:itemId/undo', (req, res, next) => questController.undoQuestItem(req, res, next));

export default router;
