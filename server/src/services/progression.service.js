import { withTransaction } from '../db/pool.js';

export const CANONICAL_ATTRIBUTES = [
  'strength',
  'intelligence',
  'vitality',
  'willpower',
  'perception',
];

/**
 * Authoritative leveling curve formula per Phase 2.2 spec.
 *
 * @param {number} level - Current character level
 * @returns {number} XP required to advance to the next level
 */
export function xpRequiredFor(level) {
  return Math.round(0.25 * level ** 2 + 10 * level + 100);
}

/**
 * Applies an XP/Gold/HP/Mana delta atomically inside a transaction with
 * SELECT ... FOR UPDATE row locking, resolves level-ups (possibly several at once),
 * awards 2 unallocated points per level gained, and clamps stats within valid bounds.
 *
 * Every caller in Phase 3/4 goes through this — nothing else is allowed to UPDATE character_stats directly.
 *
 * @param {import('pg').PoolClient} client - Active transactional client
 * @param {string} userId - User UUID
 * @param {object} deltas - Delta changes
 * @param {number} [deltas.xp=0] - XP delta
 * @param {number} [deltas.gold=0] - Gold delta
 * @param {number} [deltas.hp=0] - HP delta
 * @param {number} [deltas.mana=0] - Mana delta
 * @returns {Promise<object>} Progression summary
 */
export async function applyReward(client, userId, { xp = 0, gold = 0, hp = 0, mana = 0 }) {
  const { rows } = await client.query(
    'SELECT * FROM character_stats WHERE user_id = $1 FOR UPDATE',
    [userId]
  );
  const stat = rows[0];

  if (!stat) {
    const err = new Error('Character stats not found for user');
    err.status = 404;
    err.code = 'CHARACTER_NOT_FOUND';
    throw err;
  }

  let newXp = stat.xp + xp;
  let level = stat.level;
  let leveledUp = false;
  let unallocated = stat.unallocated_points;

  // Resolve multi-level-ups atomically in a loop
  while (newXp >= xpRequiredFor(level)) {
    newXp -= xpRequiredFor(level);
    level += 1;
    unallocated += 2; // 2 stat points per level
    leveledUp = true;
  }

  const finalXp = Math.max(0, newXp);
  const newHp = Math.max(0, Math.min(stat.max_hp, stat.hp + hp));
  const newMana = Math.max(0, Math.min(stat.max_mana, stat.mana + mana));
  const newGold = Math.max(0, stat.gold + gold);

  await client.query(
    `UPDATE character_stats
     SET xp = $1, level = $2, hp = $3, mana = $4, gold = $5, unallocated_points = $6, updated_at = now()
     WHERE user_id = $7`,
    [finalXp, level, newHp, newMana, newGold, unallocated, userId]
  );

  return {
    leveledUp,
    levelsGained: level - stat.level,
    newLevel: level,
    newHp,
    newMana,
    newGold,
    newXp: finalXp,
    xpForNextLevel: xpRequiredFor(level),
    unallocatedPoints: unallocated,
  };
}

/**
 * Transactionally reverses a previously granted daily/quest completion reward.
 * Correctly restores character level and unallocated stat points if the original
 * completion triggered one or more level-ups, leaving character progression
 * in a completely consistent state without negative XP or invalid thresholds.
 *
 * @param {import('pg').PoolClient} client - Active transactional client
 * @param {string} userId - User UUID
 * @param {object} params
 * @param {number} [params.xpAwarded=0]
 * @param {number} [params.goldAwarded=0]
 * @param {number} [params.levelsGained=0]
 * @param {number} [params.pointsAwarded=0]
 * @returns {Promise<object>}
 */
export async function revertReward(
  client,
  userId,
  { xpAwarded = 0, goldAwarded = 0, levelsGained = 0, pointsAwarded = 0 }
) {
  const { rows } = await client.query(
    'SELECT * FROM character_stats WHERE user_id = $1 FOR UPDATE',
    [userId]
  );
  const stat = rows[0];

  if (!stat) {
    const err = new Error('Character stats not found for user');
    err.status = 404;
    err.code = 'CHARACTER_NOT_FOUND';
    throw err;
  }

  let level = stat.level;
  let unallocated = stat.unallocated_points;
  let xp = stat.xp;

  // 1. If level-ups occurred during the original completion, step down level(s)
  if (levelsGained > 0) {
    for (let i = 0; i < levelsGained; i++) {
      if (level > 1) {
        level -= 1;
        xp += xpRequiredFor(level);
      }
    }
    unallocated = Math.max(0, unallocated - pointsAwarded);
  }

  // 2. Revert the granted XP and Gold safely
  let finalXp = Math.max(0, xp - xpAwarded);
  const finalGold = Math.max(0, stat.gold - goldAwarded);

  // 3. If any residual XP still meets or exceeds the required threshold, resolve forward
  while (finalXp >= xpRequiredFor(level)) {
    finalXp -= xpRequiredFor(level);
    level += 1;
    unallocated += 2;
  }

  await client.query(
    `UPDATE character_stats
     SET xp = $1, level = $2, gold = $3, unallocated_points = $4, updated_at = now()
     WHERE user_id = $5`,
    [finalXp, level, finalGold, unallocated, userId]
  );

  return {
    revertedLevel: level,
    revertedXp: finalXp,
    revertedGold: finalGold,
    unallocatedPoints: unallocated,
    xpForNextLevel: xpRequiredFor(level),
  };
}

/**
 * Spend unallocated stat points on one of the 5 canonical attributes.
 * Runs in a managed transaction with SELECT ... FOR UPDATE row locking.
 *
 * @param {string} userId - User UUID
 * @param {object} params
 * @param {string} params.attribute - One of: strength, intelligence, vitality, willpower, perception
 * @param {number} [params.points=1] - Number of points to allocate
 * @returns {Promise<object>} Updated character stats
 */
export async function allocateAttribute(userId, { attribute, points = 1 }) {
  if (!CANONICAL_ATTRIBUTES.includes(attribute)) {
    const err = new Error(`Invalid attribute: ${attribute}. Must be one of ${CANONICAL_ATTRIBUTES.join(', ')}.`);
    err.status = 400;
    err.code = 'INVALID_ATTRIBUTE';
    throw err;
  }

  if (points <= 0 || !Number.isInteger(points)) {
    const err = new Error('Points must be a positive integer.');
    err.status = 400;
    err.code = 'INVALID_POINTS';
    throw err;
  }

  return withTransaction(async (client) => {
    const { rows } = await client.query(
      'SELECT * FROM character_stats WHERE user_id = $1 FOR UPDATE',
      [userId]
    );
    const stat = rows[0];

    if (!stat) {
      const err = new Error('Character stats not found for user');
      err.status = 404;
      err.code = 'CHARACTER_NOT_FOUND';
      throw err;
    }

    if (points > stat.unallocated_points) {
      const err = new Error(`Insufficient unallocated points. You have ${stat.unallocated_points} available, requested ${points}.`);
      err.status = 400;
      err.code = 'INSUFFICIENT_POINTS';
      throw err;
    }

    // Derived stat bonuses:
    // Strength / Vitality: +4 Max HP per point
    // Intelligence / Willpower: +3 Max Mana per point
    // Perception: 0 derived stats
    let hpBonus = 0;
    let manaBonus = 0;

    if (attribute === 'strength' || attribute === 'vitality') {
      hpBonus = 4 * points;
    } else if (attribute === 'intelligence' || attribute === 'willpower') {
      manaBonus = 3 * points;
    }

    const newMaxHp = stat.max_hp + hpBonus;
    const newHp = stat.hp + hpBonus; // Heal current HP by same amount so player remains full
    const newMaxMana = stat.max_mana + manaBonus;
    const newMana = stat.mana + manaBonus;
    const newUnallocated = stat.unallocated_points - points;
    const newAttrValue = stat[attribute] + points;

    const attributes = {
      strength: attribute === 'strength' ? newAttrValue : stat.strength,
      intelligence: attribute === 'intelligence' ? newAttrValue : stat.intelligence,
      vitality: attribute === 'vitality' ? newAttrValue : stat.vitality,
      willpower: attribute === 'willpower' ? newAttrValue : stat.willpower,
      perception: attribute === 'perception' ? newAttrValue : stat.perception,
    };

    await client.query(
      `UPDATE character_stats
       SET strength = $1, intelligence = $2, vitality = $3, willpower = $4, perception = $5,
           max_hp = $6, hp = $7, max_mana = $8, mana = $9, unallocated_points = $10, updated_at = now()
       WHERE user_id = $11`,
      [
        attributes.strength,
        attributes.intelligence,
        attributes.vitality,
        attributes.willpower,
        attributes.perception,
        newMaxHp,
        newHp,
        newMaxMana,
        newMana,
        newUnallocated,
        userId,
      ]
    );

    return {
      level: stat.level,
      xp: stat.xp,
      xpForNextLevel: xpRequiredFor(stat.level),
      hp: newHp,
      maxHp: newMaxHp,
      mana: newMana,
      maxMana: newMaxMana,
      gold: stat.gold,
      attributes,
      unallocatedPoints: newUnallocated,
    };
  });
}
