import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import app from '../app.js';
import { pool, query, withTransaction } from '../db/pool.js';
import { AuthService } from '../services/auth.service.js';
import { applyReward, revertReward } from '../services/progression.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authService = new AuthService();

async function runBattleEventsTestSuite() {
  console.log('\n═════════════════════════════════════════════════════════');
  console.log(' Starting Phase 4.2 Battle Events & Level-Up Test Suite  ');
  console.log('═════════════════════════════════════════════════════════\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;
  console.log(`Test server running at http://localhost:${port}`);

  let testUserA = null;
  let testUserB = null;
  let tokenA = null;
  let tokenB = null;
  let testRewardItem = null;

  try {
    // -------------------------------------------------------------
    // Test 1: Migration UP/DOWN/Re-apply Verification
    // -------------------------------------------------------------
    console.log('1. Testing Migration 0007_battle_events.sql UP/DOWN/re-apply...');
    const migrationPath = path.join(__dirname, '../db/migrations/0007_battle_events.sql');
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');

    const downIndex = migrationContent.indexOf('-- DOWN');
    assert(downIndex !== -1, 'Migration must contain a -- DOWN rollback section');

    const upSql = migrationContent.substring(0, downIndex);
    const downPart = migrationContent.substring(downIndex + 7);
    const downSql = downPart
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('--') && !line.startsWith('---'))
      .map((line) => line.replace(/^--\s*/, ''))
      .join('\n');

    // Test DOWN execution (rollback)
    await query(downSql);
    const tableCheckDown = await query(
      `SELECT to_regclass('public.battle_events') as tbl`
    );
    assert.equal(tableCheckDown.rows[0].tbl, null, 'battle_events table should be dropped after rollback');

    const typeCheckDown = await query(
      `SELECT typname FROM pg_type WHERE typname = 'battle_source'`
    );
    assert.equal(typeCheckDown.rows.length, 0, 'battle_source enum should be dropped after rollback');

    // Test UP re-apply
    await query(upSql);
    const tableCheckUp = await query(
      `SELECT to_regclass('public.battle_events') as tbl`
    );
    assert.notEqual(tableCheckUp.rows[0].tbl, null, 'battle_events table should exist after re-applying UP');

    const typeCheckUp = await query(
      `SELECT typname FROM pg_type WHERE typname = 'battle_source'`
    );
    assert.equal(typeCheckUp.rows.length, 1, 'battle_source enum should exist after re-applying UP');
    console.log('   ✅ Migration UP / DOWN / re-apply cleanly verified.');

    // -------------------------------------------------------------
    // Setup Test Users & Starter Reward Item
    // -------------------------------------------------------------
    console.log('2. Registering test users User A and User B...');
    const emailA = `battle-hero-a-${Date.now()}@lifeos.game`;
    const emailB = `battle-hero-b-${Date.now()}@lifeos.game`;

    const regA = await authService.register({
      email: emailA,
      password: 'StrongPassword123!',
      displayName: 'Battle Hero A',
    });
    testUserA = regA.user;
    tokenA = regA.accessToken;

    const regB = await authService.register({
      email: emailB,
      password: 'StrongPassword123!',
      displayName: 'Battle Hero B',
    });
    testUserB = regB.user;
    tokenB = regB.accessToken;

    // Fetch an existing starter reward item for loot tests
    const itemRes = await query(
      `SELECT id, name, icon, type, description FROM reward_items WHERE user_id = $1 LIMIT 1`,
      [testUserA.id]
    );
    if (itemRes.rows.length > 0) {
      testRewardItem = itemRes.rows[0];
    } else {
      // Create a test reward item if none exists
      const createdItem = await query(
        `INSERT INTO reward_items (user_id, name, description, cost_gold, type, icon)
         VALUES ($1, 'Obsidian Blade', 'A legendary sword', 50, 'equipment', 'Sword')
         RETURNING id, name, icon, type, description`,
        [testUserA.id]
      );
      testRewardItem = createdItem.rows[0];
    }
    assert(testRewardItem && testRewardItem.id, 'Test reward item should be available');
    console.log('   ✅ Users and reward items setup complete.');

    // -------------------------------------------------------------
    // Test 3: Centralized Logging in applyReward for All Sources
    // -------------------------------------------------------------
    console.log('3. Testing centralized logging for habit, daily, quest, boss in applyReward()...');
    const sources = ['habit', 'daily', 'quest', 'boss'];
    for (const src of sources) {
      const result = await withTransaction(async (client) => {
        return applyReward(client, testUserA.id, {
          xp: 20,
          gold: 5,
          hp: 0,
          sourceType: src,
        });
      });

      assert(result.battleEvent, 'applyReward should return battleEvent object');
      assert.equal(result.battleEvent.sourceType, src);
      assert.equal(result.battleEvent.xpAwarded, 20);
      assert.equal(result.battleEvent.goldAwarded, 5);
      assert.equal(result.battleEvent.hpChange, 0);

      const dbCheck = await query(
        `SELECT source_type, xp_awarded, gold_awarded FROM battle_events WHERE id = $1`,
        [result.battleEvent.id]
      );
      assert.equal(dbCheck.rows.length, 1);
      assert.equal(dbCheck.rows[0].source_type, src);
    }
    console.log('   ✅ All four battle sources (habit, daily, quest, boss) logged accurately.');

    // -------------------------------------------------------------
    // Test 4: Reversal Semantics (revertReward creates NO positive events)
    // -------------------------------------------------------------
    console.log('4. Testing reversal semantics: revertReward() never creates positive battle events...');
    const countBefore = await query(
      `SELECT count(*) as count FROM battle_events WHERE user_id = $1`,
      [testUserA.id]
    );

    await withTransaction(async (client) => {
      await revertReward(client, testUserA.id, {
        xpAwarded: 20,
        goldAwarded: 5,
        levelsGained: 0,
        pointsAwarded: 0,
      });
    });

    const countAfter = await query(
      `SELECT count(*) as count FROM battle_events WHERE user_id = $1`,
      [testUserA.id]
    );
    assert.equal(
      parseInt(countAfter.rows[0].count, 10),
      parseInt(countBefore.rows[0].count, 10),
      'revertReward must NOT insert any records into battle_events'
    );
    console.log('   ✅ revertReward() confirmed non-logging and safe.');

    // -------------------------------------------------------------
    // Test 5: Loot Auto-Insertion into Inventory & Atomic Progression
    // -------------------------------------------------------------
    console.log('5. Testing loot auto-insertion into inventory via applyReward()...');
    // Check initial inventory quantity for testRewardItem
    const invInitial = await query(
      `SELECT quantity FROM inventory WHERE user_id = $1 AND reward_item_id = $2`,
      [testUserA.id, testRewardItem.id]
    );
    const initialQty = invInitial.rows.length > 0 ? invInitial.rows[0].quantity : 0;

    // Grant reward with lootItemId
    const lootReward1 = await withTransaction(async (client) => {
      return applyReward(client, testUserA.id, {
        xp: 15,
        gold: 10,
        sourceType: 'quest',
        lootItemId: testRewardItem.id,
      });
    });

    assert(lootReward1.battleEvent.lootItem, 'battleEvent should contain joined lootItem');
    assert.equal(lootReward1.battleEvent.lootItem.id, testRewardItem.id);

    const invAfter1 = await query(
      `SELECT quantity FROM inventory WHERE user_id = $1 AND reward_item_id = $2`,
      [testUserA.id, testRewardItem.id]
    );
    assert.equal(invAfter1.rows[0].quantity, initialQty + 1);

    // Grant a second time to verify stack increment
    await withTransaction(async (client) => {
      return applyReward(client, testUserA.id, {
        xp: 15,
        gold: 10,
        sourceType: 'quest',
        lootItemId: testRewardItem.id,
      });
    });

    const invAfter2 = await query(
      `SELECT quantity FROM inventory WHERE user_id = $1 AND reward_item_id = $2`,
      [testUserA.id, testRewardItem.id]
    );
    assert.equal(invAfter2.rows[0].quantity, initialQty + 2);
    console.log('   ✅ Loot auto-insertion and inventory stacking verified.');

    // -------------------------------------------------------------
    // Test 6: Multi-Level Reward Produces Exactly One Battle Event
    // -------------------------------------------------------------
    console.log('6. Testing multi-level reward produces exactly ONE battle event...');
    const eventsCountBeforeMulti = await query(
      `SELECT count(*) as count FROM battle_events WHERE user_id = $1`,
      [testUserA.id]
    );

    const multiLevelGrant = await withTransaction(async (client) => {
      // Award massive XP (e.g. 500 XP) to jump multiple levels
      return applyReward(client, testUserA.id, {
        xp: 500,
        gold: 100,
        sourceType: 'boss',
      });
    });

    assert(multiLevelGrant.leveledUp, 'Should be marked as leveled up');
    assert(multiLevelGrant.levelsGained >= 2, `Should gain multiple levels, gained: ${multiLevelGrant.levelsGained}`);

    const eventsCountAfterMulti = await query(
      `SELECT count(*) as count FROM battle_events WHERE user_id = $1`,
      [testUserA.id]
    );
    assert.equal(
      parseInt(eventsCountAfterMulti.rows[0].count, 10),
      parseInt(eventsCountBeforeMulti.rows[0].count, 10) + 1,
      'Multi-level grant must insert exactly ONE battle_events row'
    );

    const latestEventRes = await query(
      `SELECT * FROM battle_events WHERE id = $1`,
      [multiLevelGrant.battleEvent.id]
    );
    assert.equal(latestEventRes.rows[0].xp_awarded, 500);
    assert.equal(latestEventRes.rows[0].gold_awarded, 100);
    console.log(`   ✅ Single battle event generated for multi-level jump (+${multiLevelGrant.levelsGained} levels).`);

    // -------------------------------------------------------------
    // Test 7: GET /api/v1/battle-events Pagination & Ordering
    // -------------------------------------------------------------
    console.log('7. Testing GET /api/v1/battle-events limit, ordering & validation...');
    // Fetch with default limit
    const resDefault = await fetch(`${baseUrl}/battle-events`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(resDefault.status, 200);
    const jsonDefault = await resDefault.json();
    assert(Array.isArray(jsonDefault.data));
    assert(jsonDefault.data.length <= 20);

    // Verify newest-first ordering
    for (let i = 0; i < jsonDefault.data.length - 1; i++) {
      const t1 = new Date(jsonDefault.data[i].createdAt).getTime();
      const t2 = new Date(jsonDefault.data[i + 1].createdAt).getTime();
      assert(t1 >= t2, 'Events must be ordered newest first (created_at DESC)');
    }

    // Fetch with custom limit = 3
    const resLimit3 = await fetch(`${baseUrl}/battle-events?limit=3`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(resLimit3.status, 200);
    const jsonLimit3 = await resLimit3.json();
    assert.equal(jsonLimit3.data.length, 3);

    // Validation checks: limit > 100 or limit < 1 must return 400
    const resInvalidMax = await fetch(`${baseUrl}/battle-events?limit=150`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(resInvalidMax.status, 400);

    const resInvalidMin = await fetch(`${baseUrl}/battle-events?limit=0`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(resInvalidMin.status, 400);
    console.log('   ✅ Pagination, newest-first ordering, and Zod limit boundary checks verified.');

    // -------------------------------------------------------------
    // Test 8: Loot Metadata Join in GET /api/v1/battle-events
    // -------------------------------------------------------------
    console.log('8. Testing joined loot metadata in GET /api/v1/battle-events...');
    const lootEvents = jsonDefault.data.filter((e) => e.lootItemId !== null);
    assert(lootEvents.length > 0, 'Should find events with loot');
    const firstLootEvent = lootEvents[0];
    assert(firstLootEvent.lootItem, 'lootItem should be joined');
    assert.equal(firstLootEvent.lootItem.id, testRewardItem.id);
    assert.equal(firstLootEvent.lootItem.name, testRewardItem.name);
    console.log('   ✅ Loot metadata successfully joined and formatted.');

    // -------------------------------------------------------------
    // Test 9: Strict Tenant Isolation
    // -------------------------------------------------------------
    console.log('9. Testing strict tenant isolation...');
    const resUserB = await fetch(`${baseUrl}/battle-events`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(resUserB.status, 200);
    const jsonUserB = await resUserB.json();
    assert.equal(jsonUserB.data.length, 0, 'User B should have zero battle events initially');

    // User B gets 1 reward
    await withTransaction(async (client) => {
      return applyReward(client, testUserB.id, {
        xp: 10,
        gold: 2,
        sourceType: 'habit',
      });
    });

    const resUserBAfter = await fetch(`${baseUrl}/battle-events`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const jsonUserBAfter = await resUserBAfter.json();
    assert.equal(jsonUserBAfter.data.length, 1);
    assert.equal(jsonUserBAfter.data[0].userId, testUserB.id);

    // Verify User A still only sees User A's events
    const resUserACheck = await fetch(`${baseUrl}/battle-events`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const jsonUserACheck = await resUserACheck.json();
    for (const evt of jsonUserACheck.data) {
      assert.equal(evt.userId, testUserA.id, 'User A must never see User B events');
    }
    console.log('   ✅ Strict tenant isolation confirmed.');

    // -------------------------------------------------------------
    // Test 10: Concurrency Safety with Row Locks
    // -------------------------------------------------------------
    console.log('10. Testing concurrent rewards producing all events without lost updates...');
    const statsBeforeConcur = await query(
      `SELECT xp, gold FROM character_stats WHERE user_id = $1`,
      [testUserA.id]
    );
    const startXp = statsBeforeConcur.rows[0].xp;
    const startGold = statsBeforeConcur.rows[0].gold;

    const concurrencyCount = 5;
    const rewardPerCall = { xp: 10, gold: 5 };

    await Promise.all(
      Array.from({ length: concurrencyCount }).map(() =>
        withTransaction((client) =>
          applyReward(client, testUserA.id, {
            xp: rewardPerCall.xp,
            gold: rewardPerCall.gold,
            sourceType: 'habit',
          })
        )
      )
    );

    const statsAfterConcur = await query(
      `SELECT xp, gold FROM character_stats WHERE user_id = $1`,
      [testUserA.id]
    );
    // Expected gold increment: 5 * 5 = 25
    assert.equal(statsAfterConcur.rows[0].gold, startGold + (concurrencyCount * rewardPerCall.gold));
    console.log('   ✅ Concurrent rewards safely committed with exact cumulative stats.');

    // -------------------------------------------------------------
    // Test 11: Duplicate Mutation Protection
    // -------------------------------------------------------------
    console.log('11. Testing duplicate mutation protection on domain entity (daily completion idempotency)...');
    // Create a daily for User B
    const dailyCreateRes = await fetch(`${baseUrl}/dailies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        title: 'Daily Workout',
        difficulty: 'medium',
      }),
    });
    assert.equal(dailyCreateRes.status, 201);
    const dailyData = (await dailyCreateRes.json()).data;

    const eventsCountBeforeDaily = await query(
      `SELECT count(*) as count FROM battle_events WHERE user_id = $1`,
      [testUserB.id]
    );

    // 1st complete: should succeed
    const completeRes1 = await fetch(`${baseUrl}/dailies/${dailyData.id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(completeRes1.status, 200);

    const eventsCountAfterDaily1 = await query(
      `SELECT count(*) as count FROM battle_events WHERE user_id = $1`,
      [testUserB.id]
    );
    assert.equal(
      parseInt(eventsCountAfterDaily1.rows[0].count, 10),
      parseInt(eventsCountBeforeDaily.rows[0].count, 10) + 1,
      'First daily completion must generate exactly 1 battle event'
    );

    // 2nd complete on same date: must be rejected with 409 Conflict / duplicate protection
    const completeRes2 = await fetch(`${baseUrl}/dailies/${dailyData.id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(
      completeRes2.status === 409 || completeRes2.status === 400,
      `Expected duplicate complete to return 409 or 400, got ${completeRes2.status}`
    );

    const eventsCountAfterDaily2 = await query(
      `SELECT count(*) as count FROM battle_events WHERE user_id = $1`,
      [testUserB.id]
    );
    assert.equal(
      parseInt(eventsCountAfterDaily2.rows[0].count, 10),
      parseInt(eventsCountAfterDaily1.rows[0].count, 10),
      'Duplicate mutation must NOT generate a duplicate battle event'
    );
    console.log('   ✅ Duplicate mutation correctly blocked with zero duplicate battle events.');

    // -------------------------------------------------------------
    // Test 12: Cascade Deletion on User Delete
    // -------------------------------------------------------------
    console.log('12. Testing ON DELETE CASCADE on battle_events when user is removed...');
    await query(`DELETE FROM users WHERE id = $1`, [testUserA.id]);
    await query(`DELETE FROM users WHERE id = $1`, [testUserB.id]);

    const remainingEvents = await query(
      `SELECT count(*) as count FROM battle_events WHERE user_id IN ($1, $2)`,
      [testUserA.id, testUserB.id]
    );
    assert.equal(parseInt(remainingEvents.rows[0].count, 10), 0);
    console.log('   ✅ Battle events automatically cleaned up via ON DELETE CASCADE.');

    console.log('\n═════════════════════════════════════════════════════════');
    console.log(' 🎉 All Phase 4.2 Battle Events & Level-Up Tests Passed! ');
    console.log('═════════════════════════════════════════════════════════\n');
  } finally {
    server.close();
  }
}

runBattleEventsTestSuite().catch((err) => {
  console.error('\n❌ Battle events test suite failed:', err);
  process.exit(1);
});
