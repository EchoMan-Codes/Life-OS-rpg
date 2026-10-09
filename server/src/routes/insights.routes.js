import { Router } from 'express';
import { insightsController } from '../controllers/insights.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/weekly', insightsController.getWeeklyInsights);
router.get('/trends', insightsController.getTrends);
router.get('/reviews', insightsController.listWeeklyReviews);
router.post('/reviews', insightsController.saveWeeklyReview);

export default router;
