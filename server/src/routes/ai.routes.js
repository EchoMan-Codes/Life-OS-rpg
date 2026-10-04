import { Router } from 'express';
import { aiController } from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.post('/chat', (req, res, next) => aiController.chat(req, res, next));
router.post('/execute-action', (req, res, next) => aiController.executeAction(req, res, next));
router.get('/context', (req, res, next) => aiController.getContext(req, res, next));

export default router;
