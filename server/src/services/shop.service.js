import { query, withTransaction } from '../db/pool.js';

export const STARTER_REWARD_ITEMS = [
  {
    name: 'Coffee / Tea Break',
    description: 'Enjoy a warm, guilt-free beverage while relaxing for 15 minutes.',
    cost_gold: 10,
    type: 'custom',
    icon: 'Coffee',
  },
  {
    name: '1 Hour Gaming / Streaming',
    description: 'An hour of guilt-free recreation, gaming, or entertainment.',
    cost_gold: 25,
    type: 'custom',
    icon: 'Gamepad2',
  },
  {
    name: 'Streak Shield Charge',
    description: 'Protects one chosen Daily ritual from breaking its streak if missed tomorrow (max 3 charges).',
    cost_gold: 40,
    type: 'streak_shield',
    icon: 'Shield',
  },
  {
    name: 'Iron Helm of Focus',
    description: 'A sturdy iron helm forged for focused heroes on the path of discipline.',
    cost_gold: 60,
    type: 'equipment',
    icon: 'Crown',
  },
];

export class ShopService {
  /**
   * Seeds starter rewards for a user if they have none yet.
   *
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async seedStarterItemsIfEmpty(userId) {
    const checkRes = await query(
      'SELECT COUNT(*) as count FROM reward_items WHERE user_id = $1',
      [userId]
    );

    if (parseInt(checkRes.rows[0].count, 10) === 0) {
      for (const item of STARTER_REWARD_ITEMS) {
        await query(
          `INSERT INTO reward_items (user_id, name, description, cost_gold, type, icon)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, item.name, item.description, item.cost_gold, item.type, item.icon]
        );
      }
    }
  }

  /**
   * Lists unarchived shop items for a user, automatically seeding starters if empty.
   *
   * @param {string} userId
   * @param {object} [filter]
   * @param {string} [filter.type]
   * @returns {Promise<Array<object>>}
   */
  async listShopItems(userId, { type } = {}) {
    await this.seedStarterItemsIfEmpty(userId);

    const values = [userId];
    let sql = `
      SELECT id, user_id as "userId", name, description,
             cost_gold as "costGold", type, icon,
             created_at as "createdAt", archived_at as "archivedAt"
      FROM reward_items
      WHERE user_id = $1 AND archived_at IS NULL
    `;

    if (type) {
      values.push(type);
      sql += ` AND type = $2`;
    }

    sql += ` ORDER BY cost_gold ASC, created_at ASC`;

    const { rows } = await query(sql, values);
    return rows;
  }

  /**
   * Gets a single reward item by ID with tenant isolation.
   *
   * @param {string} userId
   * @param {string} itemId
   * @returns {Promise<object>}
   */
  async getShopItemById(userId, itemId) {
    const { rows } = await query(
      `SELECT id, user_id as "userId", name, description,
              cost_gold as "costGold", type, icon,
              created_at as "createdAt", archived_at as "archivedAt"
       FROM reward_items
       WHERE id = $1 AND user_id = $2 AND archived_at IS NULL`,
      [itemId, userId]
    );

    if (rows.length === 0) {
      const err = new Error('Reward item not found');
      err.status = 404;
      err.code = 'ITEM_NOT_FOUND';
      throw err;
    }

    return rows[0];
  }

  /**
   * Creates a user-authored custom reward item.
   *
   * @param {string} userId
   * @param {object} data
   * @returns {Promise<object>}
   */
  async createShopItem(userId, { name, description, costGold, type = 'custom', icon = 'Gift' }) {
    const cost = parseInt(costGold, 10);
    if (isNaN(cost) || cost < 0) {
      const err = new Error('costGold must be a non-negative integer');
      err.status = 400;
      err.code = 'INVALID_COST';
      throw err;
    }

    const { rows } = await query(
      `INSERT INTO reward_items (user_id, name, description, cost_gold, type, icon)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id as "userId", name, description,
                 cost_gold as "costGold", type, icon,
                 created_at as "createdAt", archived_at as "archivedAt"`,
      [userId, name.trim(), description?.trim() || null, cost, type, icon || 'Gift']
    );

    return rows[0];
  }

  /**
   * Updates an existing reward item.
   *
   * @param {string} userId
   * @param {string} itemId
   * @param {object} updates
   * @returns {Promise<object>}
   */
  async updateShopItem(userId, itemId, { name, description, costGold, type, icon }) {
    const fields = [];
    const values = [itemId, userId];
    let idx = 3;

    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(name.trim());
    }
    if (description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(description ? description.trim() : null);
    }
    if (costGold !== undefined) {
      const cost = parseInt(costGold, 10);
      if (isNaN(cost) || cost < 0) {
        const err = new Error('costGold must be a non-negative integer');
        err.status = 400;
        err.code = 'INVALID_COST';
        throw err;
      }
      fields.push(`cost_gold = $${idx++}`);
      values.push(cost);
    }
    if (type !== undefined) {
      fields.push(`type = $${idx++}`);
      values.push(type);
    }
    if (icon !== undefined) {
      fields.push(`icon = $${idx++}`);
      values.push(icon);
    }

    if (fields.length === 0) {
      return this.getShopItemById(userId, itemId);
    }

    const sql = `
      UPDATE reward_items
      SET ${fields.join(', ')}
      WHERE id = $1 AND user_id = $2 AND archived_at IS NULL
      RETURNING id
    `;

    const { rows } = await query(sql, values);
    if (rows.length === 0) {
      const err = new Error('Reward item not found');
      err.status = 404;
      err.code = 'ITEM_NOT_FOUND';
      throw err;
    }

    return this.getShopItemById(userId, itemId);
  }

  /**
   * Soft-deletes a reward item.
   *
   * @param {string} userId
   * @param {string} itemId
   * @returns {Promise<{ success: boolean }>}
   */
  async archiveShopItem(userId, itemId) {
    const { rows } = await query(
      `UPDATE reward_items
       SET archived_at = now()
       WHERE id = $1 AND user_id = $2 AND archived_at IS NULL
       RETURNING id`,
      [itemId, userId]
    );

    if (rows.length === 0) {
      const err = new Error('Reward item not found');
      err.status = 404;
      err.code = 'ITEM_NOT_FOUND';
      throw err;
    }

    return { success: true };
  }

  /**
   * Purchases a reward item in a single managed transaction with row locking.
   * 1. Locks character_stats row via SELECT ... FOR UPDATE.
   * 2. Locks reward_items row via SELECT ... FOR UPDATE.
   * 3. Validates affordability (rejects with 402 INSUFFICIENT_GOLD if gold < cost).
   * 4. If streak_shield, validates target dailyId and caps charges at 3.
   * 5. If equipment, ensures unique ownership.
   * 6. Deducts gold from character_stats.
   * 7. Upserts inventory quantity (or inserts equipment).
   * 8. Records purchase audit row in purchases table.
   *
   * @param {string} userId
   * @param {string} itemId
   * @param {object} [options]
   * @param {string} [options.dailyId]
   * @returns {Promise<object>}
   */
  async buyShopItem(userId, itemId, { dailyId } = {}) {
    return withTransaction(async (client) => {
      // 1. Lock character_stats row first for consistent lock order
      const charRes = await client.query(
        'SELECT * FROM character_stats WHERE user_id = $1 FOR UPDATE',
        [userId]
      );
      if (charRes.rows.length === 0) {
        const err = new Error('Character stats not found for user');
        err.status = 404;
        err.code = 'CHARACTER_NOT_FOUND';
        throw err;
      }
      const charStat = charRes.rows[0];

      // 2. Lock reward item row
      const itemRes = await client.query(
        `SELECT * FROM reward_items WHERE id = $1 AND user_id = $2 AND archived_at IS NULL FOR UPDATE`,
        [itemId, userId]
      );
      if (itemRes.rows.length === 0) {
        const err = new Error('Reward item not found');
        err.status = 404;
        err.code = 'ITEM_NOT_FOUND';
        throw err;
      }
      const item = itemRes.rows[0];

      // 3. Server-authoritative gold balance check
      if (charStat.gold < item.cost_gold) {
        const err = new Error(
          `Insufficient gold. You have ${charStat.gold} Gold, but "${item.name}" costs ${item.cost_gold} Gold.`
        );
        err.status = 402;
        err.code = 'INSUFFICIENT_GOLD';
        throw err;
      }

      // 4. Streak Shield handling
      let updatedDaily = null;
      if (item.type === 'streak_shield') {
        if (!dailyId) {
          const err = new Error('A target Daily ritual is required when purchasing a Streak Shield.');
          err.status = 400;
          err.code = 'DAILY_REQUIRED';
          throw err;
        }

        const dailyRes = await client.query(
          `SELECT id, title, streak_shield_charges
           FROM dailies
           WHERE id = $1 AND user_id = $2 AND archived_at IS NULL
           FOR UPDATE`,
          [dailyId, userId]
        );
        if (dailyRes.rows.length === 0) {
          const err = new Error('Target Daily ritual not found');
          err.status = 404;
          err.code = 'DAILY_NOT_FOUND';
          throw err;
        }

        const daily = dailyRes.rows[0];
        if (daily.streak_shield_charges >= 3) {
          const err = new Error(
            `Daily ritual "${daily.title}" already has the maximum of 3 Streak Shield charges.`
          );
          err.status = 400;
          err.code = 'SHIELD_MAX_REACHED';
          throw err;
        }

        const updDailyRes = await client.query(
          `UPDATE dailies
           SET streak_shield_charges = streak_shield_charges + 1
           WHERE id = $1
           RETURNING id, title, streak_shield_charges as "streakShieldCharges"`,
          [dailyId]
        );
        updatedDaily = updDailyRes.rows[0];
      }

      // 5. Inventory handling (stackable vs equipment)
      let inventoryItem = null;
      if (item.type === 'equipment') {
        const existEquip = await client.query(
          `SELECT id FROM inventory WHERE user_id = $1 AND reward_item_id = $2`,
          [userId, itemId]
        );
        if (existEquip.rows.length > 0) {
          const err = new Error('You already own this unique piece of equipment.');
          err.status = 409;
          err.code = 'EQUIPMENT_ALREADY_OWNED';
          throw err;
        }

        const insEquip = await client.query(
          `INSERT INTO inventory (user_id, reward_item_id, quantity)
           VALUES ($1, $2, 1)
           RETURNING id, user_id as "userId", reward_item_id as "rewardItemId", quantity, acquired_at as "acquiredAt"`,
          [userId, itemId]
        );
        inventoryItem = insEquip.rows[0];
      } else {
        // Custom or Streak Shield stackable upsert
        const existInv = await client.query(
          `SELECT id, quantity FROM inventory WHERE user_id = $1 AND reward_item_id = $2 FOR UPDATE`,
          [userId, itemId]
        );

        if (existInv.rows.length > 0) {
          const updInv = await client.query(
            `UPDATE inventory
             SET quantity = quantity + 1
             WHERE id = $1
             RETURNING id, user_id as "userId", reward_item_id as "rewardItemId", quantity, acquired_at as "acquiredAt"`,
            [existInv.rows[0].id]
          );
          inventoryItem = updInv.rows[0];
        } else {
          const insInv = await client.query(
            `INSERT INTO inventory (user_id, reward_item_id, quantity)
             VALUES ($1, $2, 1)
             RETURNING id, user_id as "userId", reward_item_id as "rewardItemId", quantity, acquired_at as "acquiredAt"`,
            [userId, itemId]
          );
          inventoryItem = insInv.rows[0];
        }
      }

      // 6. Deduct gold atomically
      const newGold = charStat.gold - item.cost_gold;
      const updCharRes = await client.query(
        `UPDATE character_stats
         SET gold = $1, updated_at = now()
         WHERE user_id = $2
         RETURNING *`,
        [newGold, userId]
      );
      const updatedCharacter = updCharRes.rows[0];

      // 7. Record purchase in purchases audit table
      const purchaseRes = await client.query(
        `INSERT INTO purchases (user_id, reward_item_id, gold_spent)
         VALUES ($1, $2, $3)
         RETURNING id, user_id as "userId", reward_item_id as "rewardItemId", gold_spent as "goldSpent", created_at as "createdAt"`,
        [userId, itemId, item.cost_gold]
      );

      return {
        character: {
          level: updatedCharacter.level,
          xp: updatedCharacter.xp,
          hp: updatedCharacter.hp,
          maxHp: updatedCharacter.max_hp,
          mana: updatedCharacter.mana,
          maxMana: updatedCharacter.max_mana,
          gold: updatedCharacter.gold,
          unallocatedPoints: updatedCharacter.unallocated_points,
        },
        item: {
          id: item.id,
          name: item.name,
          description: item.description,
          costGold: item.cost_gold,
          type: item.type,
          icon: item.icon,
        },
        inventory: inventoryItem,
        purchase: purchaseRes.rows[0],
        goldSpent: item.cost_gold,
        daily: updatedDaily,
      };
    });
  }

  /**
   * Lists inventory items owned by the authenticated user, joined with reward metadata.
   *
   * @param {string} userId
   * @returns {Promise<Array<object>>}
   */
  async listInventory(userId) {
    const { rows } = await query(
      `SELECT inv.id, inv.user_id as "userId", inv.reward_item_id as "rewardItemId",
              inv.quantity, inv.acquired_at as "acquiredAt",
              ri.name, ri.description, ri.type, ri.icon, ri.cost_gold as "costGold"
       FROM inventory inv
       JOIN reward_items ri ON ri.id = inv.reward_item_id
       WHERE inv.user_id = $1
       ORDER BY inv.acquired_at DESC`,
      [userId]
    );

    return rows;
  }
}

export const shopService = new ShopService();
