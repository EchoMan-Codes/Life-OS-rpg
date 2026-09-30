import { query } from '../db/pool.js';

export class BattleEventService {
  /**
   * Retrieves recent battle events for an authenticated user with strict tenant isolation.
   *
   * @param {string} userId - User UUID
   * @param {object} [options]
   * @param {number} [options.limit=20] - Maximum number of events to return (1-100)
   * @returns {Promise<Array<object>>}
   */
  async listBattleEvents(userId, { limit = 20 } = {}) {
    const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

    const { rows } = await query(
      `SELECT be.id,
              be.user_id as "userId",
              be.source_type as "sourceType",
              be.source_id as "sourceId",
              be.xp_awarded as "xpAwarded",
              be.gold_awarded as "goldAwarded",
              be.hp_change as "hpChange",
              be.loot_item_id as "lootItemId",
              be.created_at as "createdAt",
              ri.name as "lootItemName",
              ri.icon as "lootItemIcon",
              ri.type as "lootItemType",
              ri.description as "lootItemDescription"
       FROM battle_events be
       LEFT JOIN reward_items ri ON ri.id = be.loot_item_id
       WHERE be.user_id = $1
       ORDER BY be.created_at DESC
       LIMIT $2`,
      [userId, safeLimit]
    );

    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      sourceType: row.sourceType,
      sourceId: row.sourceId,
      xpAwarded: row.xpAwarded,
      goldAwarded: row.goldAwarded,
      hpChange: row.hpChange,
      lootItemId: row.lootItemId,
      createdAt: row.createdAt,
      lootItem: row.lootItemId
        ? {
            id: row.lootItemId,
            name: row.lootItemName,
            icon: row.lootItemIcon,
            type: row.lootItemType,
            description: row.lootItemDescription,
          }
        : null,
    }));
  }
}

export const battleEventService = new BattleEventService();
