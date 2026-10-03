import { Router } from 'express';
import { studyController } from '../controllers/study.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', studyController.getStudyLogs);
router.get('/summary', studyController.getSummary);
router.post('/', studyController.logStudy);

export default router;
