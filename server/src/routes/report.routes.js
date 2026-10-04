import { Router } from 'express';
import { reportService } from '../services/report.service.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/data', async (req, res, next) => {
  try {
    const data = await reportService.getReportData(req.user.id, req.query);
    return res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
