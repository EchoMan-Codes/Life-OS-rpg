import { Router } from 'express';
import { z } from 'zod';

import { feedbackController } from '../controllers/feedback.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const createFeedbackSchema = z.object({
  category: z.enum(['suggestion', 'bug_report', 'feature_request', 'ui_ux', 'general']),
  message: z.string().trim().min(5, 'Message must be at least 5 characters long').max(3000),
  appVersion: z.string().trim().max(30).optional(),
  platform: z.enum(['android', 'ios', 'web']).optional(),
  attachmentUrl: z.string().trim().max(1000).nullable().optional(),
});

router.use(requireAuth);

router.post('/', validate(createFeedbackSchema), feedbackController.submitFeedback);
router.get('/my', feedbackController.getMyFeedback);

export default router;
