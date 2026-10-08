import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Public / auth-free endpoint for VAPID public key
router.get('/vapid-public-key', (req, res, next) => notificationController.getVapidPublicKey(req, res, next));

// All other endpoints require authentication
router.use(requireAuth);

router.get('/', (req, res, next) => notificationController.list(req, res, next));
router.get('/unread-count', (req, res, next) => notificationController.unreadCount(req, res, next));
router.post('/read-all', (req, res, next) => notificationController.markAllAsRead(req, res, next));
router.patch('/:id/read', (req, res, next) => notificationController.markAsRead(req, res, next));
router.delete('/:id', (req, res, next) => notificationController.delete(req, res, next));

router.get('/preferences', (req, res, next) => notificationController.getPreferences(req, res, next));
router.put('/preferences', (req, res, next) => notificationController.updatePreferences(req, res, next));

// Push subscriptions & actions
router.post('/subscribe', (req, res, next) => notificationController.subscribe(req, res, next));
router.post('/unsubscribe', (req, res, next) => notificationController.unsubscribe(req, res, next));
router.post('/test', (req, res, next) => notificationController.sendTest(req, res, next));
router.post('/snooze', (req, res, next) => notificationController.snooze(req, res, next));
router.post('/process-scheduled', (req, res, next) => notificationController.processScheduled(req, res, next));
router.get('/scheduled', (req, res, next) => notificationController.getUpcomingScheduled(req, res, next));

export default router;
