import { Router } from 'express';
import { calendarController } from '../controllers/calendar.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/events', calendarController.getEvents);
router.post('/events', calendarController.createEvent);
router.patch('/events/:id', calendarController.updateEvent);
router.delete('/events/:id', calendarController.deleteEvent);
router.get('/conflicts', calendarController.checkConflicts);
router.post('/time-block', calendarController.scheduleTimeBlock);

export default router;
