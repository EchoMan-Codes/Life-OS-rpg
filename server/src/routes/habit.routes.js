import { Router } from 'express';
import { z } from 'zod';

import { habitController } from '../controllers/habit.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const createHabitSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().trim().max(1000).nullable().optional(),
  direction: z.enum(['positive', 'negative', 'both']).default('positive'),
  difficulty: z.enum(['trivial', 'easy', 'medium', 'hard']).default('easy'),
});

const updateHabitSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  direction: z.enum(['positive', 'negative', 'both']).optional(),
  difficulty: z.enum(['trivial', 'easy', 'medium', 'hard']).optional(),
});

const scoreHabitSchema = z.object({
  direction: z.enum(['positive', 'negative'], {
    required_error: "Direction is required and must be 'positive' or 'negative'",
  }),
});

// All habit routes require authentication
router.use(requireAuth);

router.get('/', (req, res, next) => habitController.listHabits(req, res, next));
router.get('/activity', (req, res, next) => habitController.getHabitActivity(req, res, next));
router.post('/', validate(createHabitSchema), (req, res, next) => habitController.createHabit(req, res, next));
router.get('/:id', (req, res, next) => habitController.getHabit(req, res, next));
router.patch('/:id', validate(updateHabitSchema), (req, res, next) => habitController.updateHabit(req, res, next));
router.delete('/:id', (req, res, next) => habitController.archiveHabit(req, res, next));
router.post('/:id/score', validate(scoreHabitSchema), (req, res, next) => habitController.scoreHabit(req, res, next));

export default router;
