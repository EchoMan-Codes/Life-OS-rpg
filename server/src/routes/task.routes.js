import { Router } from 'express';
import { taskController } from '../controllers/task.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/summary', taskController.getSummary);
router.get('/', taskController.listTasks);
router.post('/', taskController.createTask);
router.get('/:id', taskController.getTask);
router.patch('/:id', taskController.updateTask);
router.post('/:id/complete', taskController.completeTask);
router.post('/:id/uncomplete', taskController.uncompleteTask);
router.delete('/:id', taskController.deleteTask);

export default router;
