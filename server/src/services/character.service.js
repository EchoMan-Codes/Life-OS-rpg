import { query } from '../db/pool.js';
import { xpRequiredFor } from './progression.service.js';

/**
 * Character service providing database-backed character stats.
 */
export class CharacterService {
  /**
   * Retrieve character stats for a given user or guest demo fallback.
   *
   * @param {string|null} [userId=null] - Optional user UUID
   * @returns {Promise<object>} Character stats conforming to API specification
   */
  async getCharacter(userId = null) {
    if (!userId) {
      // Guest demo fallback per Phase 2.1 spec
      return {
        level: 4,
        xp: 320,
        xpForNextLevel: xpRequiredFor(4),
        hp: 62,
        maxHp: 80,
        mana: 30,
        maxMana: 50,
        gold: 145,
        attributes: {
          strength: 7,
          intelligence: 5,
          vitality: 6,
          willpower: 4,
          perception: 5,
        },
        unallocatedPoints: 2,
      };
    }

    // Query real character stats from PostgreSQL
    let res = await query(
      `SELECT user_id, level, xp, hp, max_hp, mana, max_mana, gold,
              strength, intelligence, vitality, willpower, perception,
              unallocated_points
       FROM character_stats
       WHERE user_id = $1`,
      [userId]
    );

    // Defensive fallback: create initial row if missing
    if (res.rows.length === 0) {
      await query(
        `INSERT INTO character_stats (user_id)
         VALUES ($1)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId]
      );
      res = await query(
        `SELECT user_id, level, xp, hp, max_hp, mana, max_mana, gold,
                strength, intelligence, vitality, willpower, perception,
                unallocated_points
         FROM character_stats
         WHERE user_id = $1`,
        [userId]
      );
    }

    const stat = res.rows[0];

    return {
      level: stat.level,
      xp: stat.xp,
      xpForNextLevel: xpRequiredFor(stat.level),
      hp: stat.hp,
      maxHp: stat.max_hp,
      mana: stat.mana,
      maxMana: stat.max_mana,
      gold: stat.gold,
      attributes: {
        strength: stat.strength,
        intelligence: stat.intelligence,
        vitality: stat.vitality,
        willpower: stat.willpower,
        perception: stat.perception,
      },
      unallocatedPoints: stat.unallocated_points,
    };
  }
}

export const characterService = new CharacterService();
