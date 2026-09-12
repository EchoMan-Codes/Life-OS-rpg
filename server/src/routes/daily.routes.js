import { Router } from 'express';
import { z } from 'zod';

import { dailyController } from '../controllers/daily.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const createDailySchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().trim().max(1000).nullable().optional(),
  difficulty: z.enum(['trivial', 'easy', 'medium', 'hard']).default('easy'),
  activeDays: z
    .array(z.number().int().min(0).max(6))
    .min(1, 'At least one active day is required')
    .default([0, 1, 2, 3, 4, 5, 6]),
});

const updateDailySchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  difficulty: z.enum(['trivial', 'easy', 'medium', 'hard']).optional(),
  activeDays: z.array(z.number().int().min(0).max(6)).min(1).optional(),
});

// All daily routes require authentication
router.use(requireAuth);

router.get('/', (req, res, next) => dailyController.listDailies(req, res, next));
router.post('/', validate(createDailySchema), (req, res, next) => dailyController.createDaily(req, res, next));
router.get('/:id', (req, res, next) => dailyController.getDaily(req, res, next));
router.patch('/:id', validate(updateDailySchema), (req, res, next) => dailyController.updateDaily(req, res, next));
router.delete('/:id', (req, res, next) => dailyController.archiveDaily(req, res, next));
router.post('/:id/complete', (req, res, next) => dailyController.completeDaily(req, res, next));
router.post('/:id/undo', (req, res, next) => dailyController.undoDaily(req, res, next));

export default router;
