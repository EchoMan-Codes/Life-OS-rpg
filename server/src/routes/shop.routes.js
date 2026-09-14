import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { shopController } from '../controllers/shop.controller.js';

const router = Router();

// All shop routes require authentication
router.use(requireAuth);

router.get('/items', (req, res, next) => shopController.listItems(req, res, next));
router.post('/items', (req, res, next) => shopController.createItem(req, res, next));
router.get('/items/:id', (req, res, next) => shopController.getItem(req, res, next));
router.patch('/items/:id', (req, res, next) => shopController.updateItem(req, res, next));
router.delete('/items/:id', (req, res, next) => shopController.archiveItem(req, res, next));
router.post('/items/:id/buy', (req, res, next) => shopController.buyItem(req, res, next));

router.get('/inventory', (req, res, next) => shopController.listInventory(req, res, next));

export default router;
