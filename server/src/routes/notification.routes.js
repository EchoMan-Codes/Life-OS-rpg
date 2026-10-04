import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res, next) => notificationController.list(req, res, next));
router.get('/unread-count', (req, res, next) => notificationController.unreadCount(req, res, next));
router.post('/read-all', (req, res, next) => notificationController.markAllAsRead(req, res, next));
router.patch('/:id/read', (req, res, next) => notificationController.markAsRead(req, res, next));
router.delete('/:id', (req, res, next) => notificationController.delete(req, res, next));

router.get('/preferences', (req, res, next) => notificationController.getPreferences(req, res, next));
router.put('/preferences', (req, res, next) => notificationController.updatePreferences(req, res, next));

export default router;
