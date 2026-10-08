import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { aiController } from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Strict AI rate limiter: 30 requests per minute per IP
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many AI requests. Please slow down and try again in a moment.',
    },
  },
});

// Public status endpoint (shows active provider/model)
router.get('/status', (req, res, next) => aiController.getStatus(req, res, next));

router.use(requireAuth);
router.use(aiRateLimiter);

router.post('/chat/stream', (req, res) => aiController.chatStream(req, res));
router.post('/chat', (req, res) => aiController.chat(req, res));
router.get('/history', (req, res, next) => aiController.getHistory(req, res, next));
router.delete('/history', (req, res, next) => aiController.clearHistory(req, res, next));
router.post('/execute-action', (req, res) => aiController.executeAction(req, res));
router.get('/context', (req, res, next) => aiController.getContext(req, res, next));
router.get('/export-training-data', (req, res, next) => aiController.exportTrainingData(req, res, next));

export default router;
