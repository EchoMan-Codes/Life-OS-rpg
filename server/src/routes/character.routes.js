import { Router } from 'express';
import { z } from 'zod';

import { characterController } from '../controllers/character.controller.js';
import { attachUser, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { CANONICAL_ATTRIBUTES } from '../services/progression.service.js';

const router = Router();

const allocateSchema = z.object({
  attribute: z.enum(CANONICAL_ATTRIBUTES, {
    errorMap: () => ({ message: `Attribute must be one of: ${CANONICAL_ATTRIBUTES.join(', ')}` }),
  }),
  points: z.number().int().positive('Points must be a positive integer').default(1),
});

// GET /api/v1/character — optional auth attaches user context if token provided
router.get('/', attachUser, characterController.getCharacter);

// POST /api/v1/character/allocate — spend unallocated attribute points (requires auth)
router.post('/allocate', requireAuth, validate(allocateSchema), characterController.allocate);

export default router;
