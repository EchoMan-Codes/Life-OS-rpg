import { Router } from 'express';
import { financeController } from '../controllers/finance.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', financeController.getExpenses);
router.get('/summary', financeController.getSummary);
router.post('/', financeController.createExpense);

export default router;
