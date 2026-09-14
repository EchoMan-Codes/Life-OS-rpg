import { z } from 'zod';
import { shopService } from '../services/shop.service.js';

const rewardTypeEnum = z.enum(['custom', 'equipment', 'streak_shield']);

const createItemSchema = z.preprocess(
  (val) => {
    if (typeof val === 'object' && val !== null) {
      return {
        ...val,
        name: val.name || val.title,
        costGold: val.costGold ?? val.cost_gold,
        type: val.type || val.reward_type || 'custom',
      };
    }
    return val;
  },
  z.object({
    name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
    description: z.string().trim().max(500, 'Description must be 500 characters or less').optional().nullable(),
    costGold: z.number().int().min(0, 'Cost must be a non-negative integer'),
    type: rewardTypeEnum.default('custom'),
    icon: z.string().trim().max(50).optional().default('Gift'),
  })
);

const updateItemSchema = z.preprocess(
  (val) => {
    if (typeof val === 'object' && val !== null) {
      return {
        ...val,
        ...(val.title && !val.name ? { name: val.title } : {}),
        ...(val.cost_gold !== undefined && val.costGold === undefined ? { costGold: val.cost_gold } : {}),
        ...(val.reward_type && !val.type ? { type: val.reward_type } : {}),
      };
    }
    return val;
  },
  z.object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(500).optional().nullable(),
    costGold: z.number().int().min(0).optional(),
    type: rewardTypeEnum.optional(),
    icon: z.string().trim().max(50).optional(),
  })
);

const buyItemSchema = z.object({
  dailyId: z.string().uuid('Invalid dailyId UUID').optional().nullable(),
});

export class ShopController {
  async listItems(req, res, next) {
    try {
      const type = req.query.type || (req.query.category && req.query.category !== 'all' ? req.query.category : undefined);
      if (type && !['custom', 'equipment', 'streak_shield'].includes(type)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_TYPE',
            message: 'type must be one of: custom, equipment, streak_shield',
          },
        });
      }

      const items = await shopService.listShopItems(req.user.id, { type });
      res.json({ data: items });
    } catch (err) {
      next(err);
    }
  }

  async getItem(req, res, next) {
    try {
      const item = await shopService.getShopItemById(req.user.id, req.params.id);
      res.json({ data: item });
    } catch (err) {
      next(err);
    }
  }

  async createItem(req, res, next) {
    try {
      const parsed = createItemSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0].message,
            issues: parsed.error.issues,
          },
        });
      }

      const item = await shopService.createShopItem(req.user.id, parsed.data);
      res.status(201).json({ data: item });
    } catch (err) {
      next(err);
    }
  }

  async updateItem(req, res, next) {
    try {
      const parsed = updateItemSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0].message,
            issues: parsed.error.issues,
          },
        });
      }

      const item = await shopService.updateShopItem(req.user.id, req.params.id, parsed.data);
      res.json({ data: item });
    } catch (err) {
      next(err);
    }
  }

  async archiveItem(req, res, next) {
    try {
      await shopService.archiveShopItem(req.user.id, req.params.id);
      res.json({ data: { success: true } });
    } catch (err) {
      next(err);
    }
  }

  async buyItem(req, res, next) {
    try {
      const parsed = buyItemSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0].message,
            issues: parsed.error.issues,
          },
        });
      }

      const result = await shopService.buyShopItem(req.user.id, req.params.id, {
        dailyId: parsed.data.dailyId,
      });

      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async listInventory(req, res, next) {
    try {
      const inventory = await shopService.listInventory(req.user.id);
      res.json({ data: inventory });
    } catch (err) {
      next(err);
    }
  }
}

export const shopController = new ShopController();
