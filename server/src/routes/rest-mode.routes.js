import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as restModeController from '../controllers/rest-mode.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/suggestion', restModeController.getSuggestion);
router.get('/status', restModeController.getStatus);
router.get('/', restModeController.getStatus);
router.post('/activate', restModeController.activate);
router.post('/deactivate', restModeController.deactivate);

export default router;
