import { Router } from 'express';
import { focusController } from '../controllers/focus.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.post('/start', (req, res, next) => focusController.start(req, res, next));
router.get('/current', (req, res, next) => focusController.getCurrent(req, res, next));
router.get('/history', (req, res, next) => focusController.list(req, res, next));
router.post('/:id/complete', (req, res, next) => focusController.complete(req, res, next));
router.post('/:id/abandon', (req, res, next) => focusController.abandon(req, res, next));

export default router;
