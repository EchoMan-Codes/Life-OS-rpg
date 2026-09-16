import { z } from 'zod';
import * as reflectionService from '../services/reflection.service.js';

const createReflectionSchema = z.object({
  mood_score: z.number().int().min(1).max(5).optional(),
  moodScore: z.number().int().min(1).max(5).optional(),
  energy_score: z.number().int().min(1).max(5).optional(),
  energyScore: z.number().int().min(1).max(5).optional(),
  focus_score: z.number().int().min(1).max(5).optional(),
  focusScore: z.number().int().min(1).max(5).optional(),
  for_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be in YYYY-MM-DD format').optional(),
  forDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be in YYYY-MM-DD format').optional(),
  note: z.string().max(2000).optional().nullable(),
}).refine(
  (data) => (data.mood_score !== undefined || data.moodScore !== undefined) &&
            (data.energy_score !== undefined || data.energyScore !== undefined) &&
            (data.focus_score !== undefined || data.focusScore !== undefined),
  { message: 'mood, energy, and focus scores are required (1 to 5).' }
);

const updateReflectionSchema = z.object({
  mood_score: z.number().int().min(1).max(5).optional(),
  moodScore: z.number().int().min(1).max(5).optional(),
  energy_score: z.number().int().min(1).max(5).optional(),
  energyScore: z.number().int().min(1).max(5).optional(),
  focus_score: z.number().int().min(1).max(5).optional(),
  focusScore: z.number().int().min(1).max(5).optional(),
  note: z.string().max(2000).optional().nullable(),
});

/**
 * POST /api/v1/reflections
 */
export async function createReflection(req, res, next) {
  try {
    const parsed = createReflectionSchema.parse(req.body);
    const moodScore = parsed.mood_score ?? parsed.moodScore;
    const energyScore = parsed.energy_score ?? parsed.energyScore;
    const focusScore = parsed.focus_score ?? parsed.focusScore;
    const forDate = parsed.for_date ?? parsed.forDate;

    const reflection = await reflectionService.createReflection(req.user.id, {
      moodScore,
      energyScore,
      focusScore,
      forDate,
      note: parsed.note,
    });

    res.status(201).json({ data: reflection });
  } catch (err) {
    if (err instanceof z.ZodError) {
      err.status = 400;
      err.code = 'VALIDATION_ERROR';
      err.message = err.issues.map((i) => i.message).join(', ');
    }
    next(err);
  }
}

/**
 * PATCH /api/v1/reflections/:id
 */
export async function updateReflection(req, res, next) {
  try {
    const parsed = updateReflectionSchema.parse(req.body);
    const moodScore = parsed.mood_score ?? parsed.moodScore;
    const energyScore = parsed.energy_score ?? parsed.energyScore;
    const focusScore = parsed.focus_score ?? parsed.focusScore;

    const reflection = await reflectionService.updateReflection(req.user.id, req.params.id, {
      moodScore,
      energyScore,
      focusScore,
      note: parsed.note,
    });

    res.status(200).json({ data: reflection });
  } catch (err) {
    if (err instanceof z.ZodError) {
      err.status = 400;
      err.code = 'VALIDATION_ERROR';
      err.message = err.issues.map((i) => i.message).join(', ');
    }
    next(err);
  }
}

/**
 * GET /api/v1/reflections
 */
export async function getReflections(req, res, next) {
  try {
    const range = req.query.range || '30d';
    const reflections = await reflectionService.getReflections(req.user.id, { range });
    res.status(200).json({ data: reflections });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/reflections/today
 */
export async function getTodayReflection(req, res, next) {
  try {
    const reflection = await reflectionService.getTodayReflection(req.user.id);
    res.status(200).json({ data: reflection });
  } catch (err) {
    next(err);
  }
}
