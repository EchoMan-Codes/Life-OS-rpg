import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as reflectionController from '../controllers/reflection.controller.js';

const router = Router();

router.use(requireAuth);

router.post('/', reflectionController.createReflection);
router.get('/', reflectionController.getReflections);
router.get('/today', reflectionController.getTodayReflection);
router.patch('/:id', reflectionController.updateReflection);

export default router;
