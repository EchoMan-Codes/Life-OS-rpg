import { Router } from 'express';
import { focusController } from '../controllers/focus.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

// Capability and Profiles
router.get('/capabilities', (req, res, next) => focusController.getCapabilities(req, res, next));
router.get('/profiles', (req, res, next) => focusController.listProfiles(req, res, next));
router.post('/profiles', (req, res, next) => focusController.createProfile(req, res, next));
router.put('/profiles/:id', (req, res, next) => focusController.updateProfile(req, res, next));
router.delete('/profiles/:id', (req, res, next) => focusController.deleteProfile(req, res, next));

// Session Queries
router.get('/current', (req, res, next) => focusController.getCurrent(req, res, next));
router.get('/history', (req, res, next) => focusController.list(req, res, next));
router.get('/summary', (req, res, next) => focusController.getSummary(req, res, next));
router.get('/analytics', (req, res, next) => focusController.getAnalytics(req, res, next));

// Session Actions
router.post('/start', (req, res, next) => focusController.start(req, res, next));
router.post('/:id/pause', (req, res, next) => focusController.pause(req, res, next));
router.post('/:id/resume', (req, res, next) => focusController.resume(req, res, next));
router.post('/:id/event', (req, res, next) => focusController.recordEvent(req, res, next));
router.post('/:id/early-exit', (req, res, next) => focusController.earlyExit(req, res, next));
router.post('/:id/emergency-exit', (req, res, next) => focusController.emergencyExit(req, res, next));
router.post('/:id/complete', (req, res, next) => focusController.complete(req, res, next));
router.post('/:id/abandon', (req, res, next) => focusController.abandon(req, res, next));

export default router;
