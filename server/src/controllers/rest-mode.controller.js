import { z } from 'zod';
import * as restModeService from '../services/rest-mode.service.js';
import * as burnoutService from '../services/burnout.service.js';

const activateRestModeSchema = z.object({
  duration_days: z.number().int().min(1, 'Duration must be at least 1 day').max(14, 'Duration cannot exceed 14 days').optional(),
  durationDays: z.number().int().min(1, 'Duration must be at least 1 day').max(14, 'Duration cannot exceed 14 days').optional(),
  reason: z.string().max(500).optional().nullable(),
});

/**
 * GET /api/v1/rest-mode/suggestion
 */
export async function getSuggestion(req, res, next) {
  try {
    const suggestion = await burnoutService.checkBurnoutSuggestion(req.user.id);
    res.status(200).json({ data: suggestion });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/rest-mode or GET /api/v1/rest-mode/status
 */
export async function getStatus(req, res, next) {
  try {
    const status = await restModeService.getRestModeStatus(req.user.id);
    res.status(200).json({ data: status });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/rest-mode/activate
 */
export async function activate(req, res, next) {
  try {
    const parsed = activateRestModeSchema.parse(req.body || {});
    const durationDays = parsed.duration_days ?? parsed.durationDays ?? 3;
    const reason = parsed.reason;

    const status = await restModeService.activateRestMode(req.user.id, {
      durationDays,
      reason,
    });

    res.status(200).json({ data: status });
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
 * POST /api/v1/rest-mode/deactivate
 */
export async function deactivate(req, res, next) {
  try {
    const status = await restModeService.deactivateRestMode(req.user.id);
    res.status(200).json({ data: status });
  } catch (err) {
    next(err);
  }
}
