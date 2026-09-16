import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { battleEventController } from '../controllers/battle-event.controller.js';

const router = Router();

// All battle-event routes require authentication
router.use(requireAuth);

router.get('/', (req, res, next) => battleEventController.listEvents(req, res, next));

export default router;
