import { Router } from 'express';
import { aiController } from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/history', aiController.getHistory);
router.get('/context', aiController.getContext);
router.post('/chat', aiController.chat);
router.post('/actions/:messageId/confirm', aiController.confirmAction);
router.post('/actions/:messageId/cancel', aiController.cancelAction);

export default router;
