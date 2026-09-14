import assert from 'node:assert/strict';
import http from 'node:http';

import app from '../app.js';
import { query } from '../db/pool.js';
import { AuthService } from '../services/auth.service.js';
import { STARTER_REWARD_ITEMS } from '../services/shop.service.js';

const authService = new AuthService();

async function runShopTestSuite() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log(' Starting Phase 4.1 Reward Shop & Inventory Test Suite ');
  console.log('═══════════════════════════════════════════════════════\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;
  console.log(`Test server running at http://localhost:${port}`);

  let testUserA = null;
  let testUserB = null;
  let tokenA = null;
  let tokenB = null;

  try {
    // -------------------------------------------------------------
    // Test 1: Starter Rewards Constant Verification
    // -------------------------------------------------------------
    console.log('1. Testing Starter Reward items definitions...');
    assert(Array.isArray(STARTER_REWARD_ITEMS) && STARTER_REWARD_ITEMS.length >= 4);
    const types = STARTER_REWARD_ITEMS.map((i) => i.type);
    assert(types.includes('custom'));
    assert(types.includes('streak_shield'));
    assert(types.includes('equipment'));
    console.log('   ✅ Starter reward items constants verified.');

    // -------------------------------------------------------------
    // Test 2: User Setup with Character Stats
    // -------------------------------------------------------------
    console.log('2. Setting up test users User A and User B...');
    const emailA = `shop-user-a-${Date.now()}@lifeos.game`;
    const emailB = `shop-user-b-${Date.now()}@lifeos.game`;

    const regA = await authService.register({
      email: emailA,
      password: 'StrongPassword123!',
      displayName: 'Shop Hero A',
    });
    testUserA = regA.user;
    tokenA = regA.accessToken;

    const regB = await authService.register({
      email: emailB,
      password: 'StrongPassword123!',
      displayName: 'Shop Hero B',
    });
    testUserB = regB.user;
    tokenB = regB.accessToken;

    assert(testUserA?.id && testUserB?.id);
    console.log('   ✅ Test users created with auto-initialized character stats.');

    // -------------------------------------------------------------
    // Test 3: Starter Items Auto-Seeding on First Fetch
    // -------------------------------------------------------------
    console.log('3. Testing starter items automatic seeding...');
    const listRes1 = await fetch(`${baseUrl}/shop/items`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(listRes1.status, 200);
    const listJson1 = await listRes1.json();
    assert(Array.isArray(listJson1.data));
    assert.equal(listJson1.data.length, STARTER_REWARD_ITEMS.length);

    const shieldStarter = listJson1.data.find((i) => i.type === 'streak_shield');
    const equipStarter = listJson1.data.find((i) => i.type === 'equipment');
    const customStarter = listJson1.data.find((i) => i.type === 'custom');
    assert(shieldStarter && equipStarter && customStarter);
    console.log('   ✅ Starter items automatically seeded for new user.');

    // -------------------------------------------------------------
    // Test 4: Shop Item CRUD & Zod Validation
    // -------------------------------------------------------------
    console.log('4. Testing Shop Item CRUD and validation...');
    // Create valid custom reward
    const createRes = await fetch(`${baseUrl}/shop/items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Order Favorite Pizza',
        description: 'Large wood-fired pizza after hitting weekly goals.',
        costGold: 50,
        type: 'custom',
        icon: 'Pizza',
      }),
    });
    assert.equal(createRes.status, 201);
    const createJson = await createRes.json();
    const createdItem = createJson.data;
    assert.equal(createdItem.name, 'Order Favorite Pizza');
    assert.equal(createdItem.costGold, 50);
    assert.equal(createdItem.type, 'custom');

    // Validation rejection: negative costGold
    const badCostRes = await fetch(`${baseUrl}/shop/items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Hacked Negative Cost',
        costGold: -20,
      }),
    });
    assert.equal(badCostRes.status, 400);

    // Validation rejection: empty name
    const badNameRes = await fetch(`${baseUrl}/shop/items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: '   ',
        costGold: 20,
      }),
    });
    assert.equal(badNameRes.status, 400);

    // Update item
    const updateRes = await fetch(`${baseUrl}/shop/items/${createdItem.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Order Deluxe Pizza',
        costGold: 55,
      }),
    });
    assert.equal(updateRes.status, 200);
    const updateJson = await updateRes.json();
    assert.equal(updateJson.data.name, 'Order Deluxe Pizza');
    assert.equal(updateJson.data.costGold, 55);

    // Soft delete (archive)
    const delRes = await fetch(`${baseUrl}/shop/items/${createdItem.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(delRes.status, 200);

    // Verify item is no longer in active list
    const listAfterDel = await fetch(`${baseUrl}/shop/items`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const listAfterDelJson = await listAfterDel.json();
    assert(!listAfterDelJson.data.some((i) => i.id === createdItem.id));
    console.log('   ✅ Shop item CRUD and validation verified.');

    // -------------------------------------------------------------
    // Test 5: Strict Tenant Isolation
    // -------------------------------------------------------------
    console.log('5. Testing strict tenant isolation...');
    // Create an item as User A
    const itemARes = await fetch(`${baseUrl}/shop/items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: "User A's Secret Reward",
        costGold: 30,
        type: 'custom',
      }),
    });
    const itemA = (await itemARes.json()).data;

    // User B attempts to access item A
    const bGetRes = await fetch(`${baseUrl}/shop/items/${itemA.id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(bGetRes.status, 404);

    // User B attempts to edit item A
    const bPatchRes = await fetch(`${baseUrl}/shop/items/${itemA.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${tokenB}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Hacked by B' }),
    });
    assert.equal(bPatchRes.status, 404);

    // User B attempts to delete item A
    const bDelRes = await fetch(`${baseUrl}/shop/items/${itemA.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(bDelRes.status, 404);

    // User B attempts to buy item A
    const bBuyRes = await fetch(`${baseUrl}/shop/items/${itemA.id}/buy`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(bBuyRes.status, 404);
    console.log('   ✅ Strict tenant isolation verified (User B receives 404 for all User A items).');

    // -------------------------------------------------------------
    // Test 6: Insufficient Gold Rejection (HTTP 402)
    // -------------------------------------------------------------
    console.log('6. Testing insufficient gold rejection (HTTP 402 INSUFFICIENT_GOLD)...');
    // Ensure User A has only 5 gold
    await query('UPDATE character_stats SET gold = 5 WHERE user_id = $1', [testUserA.id]);

    // Item costs 30 gold
    const buyFailRes = await fetch(`${baseUrl}/shop/items/${itemA.id}/buy`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(buyFailRes.status, 402);
    const buyFailJson = await buyFailRes.json();
    assert.equal(buyFailJson.error?.code, 'INSUFFICIENT_GOLD');

    // Verify gold balance was not touched
    const statsAfterFail = await query(
      'SELECT gold FROM character_stats WHERE user_id = $1',
      [testUserA.id]
    );
    assert.equal(statsAfterFail.rows[0].gold, 5);

    // Verify inventory has 0 rows
    const invCountFail = await query(
      'SELECT COUNT(*) as count FROM inventory WHERE user_id = $1',
      [testUserA.id]
    );
    assert.equal(parseInt(invCountFail.rows[0].count, 10), 0);
    console.log('   ✅ Insufficient gold rejected with 402 and zero state mutation.');

    // -------------------------------------------------------------
    // Test 7: Successful Purchase Flow & Atomic Gold Deduction
    // -------------------------------------------------------------
    console.log('7. Testing successful purchase flow and atomic gold deduction...');
    // Give User A 100 gold
    await query('UPDATE character_stats SET gold = 100 WHERE user_id = $1', [testUserA.id]);

    // Buy item A (costs 30 gold)
    const buySuccessRes = await fetch(`${baseUrl}/shop/items/${itemA.id}/buy`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(buySuccessRes.status, 200);
    const buySuccessJson = await buySuccessRes.json();
    assert.equal(buySuccessJson.data.character.gold, 70);
    assert.equal(buySuccessJson.data.goldSpent, 30);
    assert.equal(buySuccessJson.data.inventory.quantity, 1);

    // Verify DB character_stats
    const dbStat = await query(
      'SELECT gold FROM character_stats WHERE user_id = $1',
      [testUserA.id]
    );
    assert.equal(dbStat.rows[0].gold, 70);

    // Verify purchases table record
    const dbPurchases = await query(
      'SELECT * FROM purchases WHERE user_id = $1 AND reward_item_id = $2',
      [testUserA.id, itemA.id]
    );
    assert.equal(dbPurchases.rows.length, 1);
    assert.equal(dbPurchases.rows[0].gold_spent, 30);
    console.log('   ✅ Purchase completed, 30 gold deducted, inventory and audit record created.');

    // -------------------------------------------------------------
    // Test 8: Stackable Inventory Behavior
    // -------------------------------------------------------------
    console.log('8. Testing stackable inventory quantity increments...');
    // Buy the same item A a second time (costs 30 gold, remaining becomes 40)
    const buy2Res = await fetch(`${baseUrl}/shop/items/${itemA.id}/buy`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(buy2Res.status, 200);
    const buy2Json = await buy2Res.json();
    assert.equal(buy2Json.data.character.gold, 40);
    assert.equal(buy2Json.data.inventory.quantity, 2);

    // Verify inventory has 1 row with quantity = 2
    const invRows = await query(
      'SELECT * FROM inventory WHERE user_id = $1 AND reward_item_id = $2',
      [testUserA.id, itemA.id]
    );
    assert.equal(invRows.rows.length, 1);
    assert.equal(invRows.rows[0].quantity, 2);

    // Verify purchases has 2 records
    const purchasesRows = await query(
      'SELECT * FROM purchases WHERE user_id = $1 AND reward_item_id = $2',
      [testUserA.id, itemA.id]
    );
    assert.equal(purchasesRows.rows.length, 2);
    console.log('   ✅ Stackable items increment quantity cleanly without duplicate rows.');

    // -------------------------------------------------------------
    // Test 9: Equipment Non-Stackable / Unique Purchase Behavior
    // -------------------------------------------------------------
    console.log('9. Testing equipment unique ownership and re-purchase prevention...');
    // Find seeded equipment item for User A
    const equipItems = await query(
      `SELECT * FROM reward_items WHERE user_id = $1 AND type = 'equipment' AND archived_at IS NULL`,
      [testUserA.id]
    );
    assert(equipItems.rows.length > 0);
    const equipItem = equipItems.rows[0];

    // Give User A 200 gold
    await query('UPDATE character_stats SET gold = 200 WHERE user_id = $1', [testUserA.id]);

    // First purchase of equipment
    const buyEquipRes = await fetch(`${baseUrl}/shop/items/${equipItem.id}/buy`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(buyEquipRes.status, 200);
    const buyEquipJson = await buyEquipRes.json();
    assert.equal(buyEquipJson.data.character.gold, 200 - equipItem.cost_gold);

    // Second purchase attempt for the same equipment -> rejected with 409
    const buyEquipDupRes = await fetch(`${baseUrl}/shop/items/${equipItem.id}/buy`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(buyEquipDupRes.status, 409);
    const dupJson = await buyEquipDupRes.json();
    assert.equal(dupJson.error?.code, 'EQUIPMENT_ALREADY_OWNED');

    // Confirm gold was not deducted a second time
    const equipGoldCheck = await query(
      'SELECT gold FROM character_stats WHERE user_id = $1',
      [testUserA.id]
    );
    assert.equal(equipGoldCheck.rows[0].gold, 200 - equipItem.cost_gold);
    console.log('   ✅ Equipment unique ownership verified (duplicate purchase rejected with 409).');

    // -------------------------------------------------------------
    // Test 10: Streak Shield Integration with Daily Ritual & 3-Charge Cap
    // -------------------------------------------------------------
    console.log('10. Testing Streak Shield purchasing and 3-charge cap enforcement...');
    // Create a Daily for User A with 1 shield charge
    const insDailyRes = await query(
      `INSERT INTO dailies (user_id, title, difficulty, streak_shield_charges)
       VALUES ($1, 'Meditate 10 Minutes', 'easy', 1)
       RETURNING id, streak_shield_charges`,
      [testUserA.id]
    );
    const daily = insDailyRes.rows[0];
    assert.equal(daily.streak_shield_charges, 1);

    // Find streak shield item
    const shieldItems = await query(
      `SELECT * FROM reward_items WHERE user_id = $1 AND type = 'streak_shield' AND archived_at IS NULL`,
      [testUserA.id]
    );
    assert(shieldItems.rows.length > 0);
    const shieldItem = shieldItems.rows[0];

    // Give User A 300 gold
    await query('UPDATE character_stats SET gold = 300 WHERE user_id = $1', [testUserA.id]);

    // Buying streak shield without dailyId -> 400 DAILY_REQUIRED
    const noDailyRes = await fetch(`${baseUrl}/shop/items/${shieldItem.id}/buy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    assert.equal(noDailyRes.status, 400);

    // Buying streak shield with non-existent dailyId -> 404 DAILY_NOT_FOUND
    const fakeDailyRes = await fetch(`${baseUrl}/shop/items/${shieldItem.id}/buy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dailyId: '00000000-0000-0000-0000-000000000000' }),
    });
    assert.equal(fakeDailyRes.status, 404);

    // Buy shield 1 (charges: 1 -> 2)
    const buyShield1 = await fetch(`${baseUrl}/shop/items/${shieldItem.id}/buy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dailyId: daily.id }),
    });
    assert.equal(buyShield1.status, 200);
    const shield1Json = await buyShield1.json();
    assert.equal(shield1Json.data.daily.streakShieldCharges, 2);

    // Buy shield 2 (charges: 2 -> 3 max)
    const buyShield2 = await fetch(`${baseUrl}/shop/items/${shieldItem.id}/buy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dailyId: daily.id }),
    });
    assert.equal(buyShield2.status, 200);
    const shield2Json = await buyShield2.json();
    assert.equal(shield2Json.data.daily.streakShieldCharges, 3);

    // Buy shield 3 (already at 3) -> rejected with 400 SHIELD_MAX_REACHED
    const goldBeforeOvercap = (
      await query('SELECT gold FROM character_stats WHERE user_id = $1', [testUserA.id])
    ).rows[0].gold;

    const buyShield3 = await fetch(`${baseUrl}/shop/items/${shieldItem.id}/buy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dailyId: daily.id }),
    });
    assert.equal(buyShield3.status, 400);
    const shield3Json = await buyShield3.json();
    assert.equal(shield3Json.error?.code, 'SHIELD_MAX_REACHED');

    // Confirm charges remains 3 and gold was not deducted
    const dailyCheck = await query(
      'SELECT streak_shield_charges FROM dailies WHERE id = $1',
      [daily.id]
    );
    assert.equal(dailyCheck.rows[0].streak_shield_charges, 3);
    const goldAfterOvercap = (
      await query('SELECT gold FROM character_stats WHERE user_id = $1', [testUserA.id])
    ).rows[0].gold;
    assert.equal(goldAfterOvercap, goldBeforeOvercap);
    console.log('   ✅ Streak Shield integration and 3-charge cap verified.');

    // -------------------------------------------------------------
    // Test 11: Concurrency Protection (SELECT ... FOR UPDATE Serialization)
    // -------------------------------------------------------------
    console.log('11. Testing concurrent buy serialization and double-spend protection...');
    // Create an item costing 20 gold
    const cheapItemRes = await fetch(`${baseUrl}/shop/items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Quick Snack Break',
        costGold: 20,
        type: 'custom',
      }),
    });
    const cheapItem = (await cheapItemRes.json()).data;

    // Set User A gold to EXACTLY 30 (enough for ONE purchase of 20, but not two)
    await query('UPDATE character_stats SET gold = 30 WHERE user_id = $1', [testUserA.id]);

    // Dispatch two buy requests in parallel
    const [res1, res2] = await Promise.all([
      fetch(`${baseUrl}/shop/items/${cheapItem.id}/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
      }),
      fetch(`${baseUrl}/shop/items/${cheapItem.id}/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
      }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    assert.deepEqual(
      statuses,
      [200, 402],
      `Expected one 200 and one 402, but received ${statuses.join(', ')}`
    );

    // Verify final gold in database is exactly 10 (30 - 20)
    const finalGoldRes = await query(
      'SELECT gold FROM character_stats WHERE user_id = $1',
      [testUserA.id]
    );
    assert.equal(finalGoldRes.rows[0].gold, 10);
    console.log('   ✅ Concurrency protection verified: Exactly one purchase succeeded, zero double-spend.');

    // -------------------------------------------------------------
    // Test 12: List Inventory Endpoint
    // -------------------------------------------------------------
    console.log('12. Testing GET /shop/inventory endpoint...');
    const invRes = await fetch(`${baseUrl}/shop/inventory`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(invRes.status, 200);
    const invJson = await invRes.json();
    assert(Array.isArray(invJson.data));
    assert(invJson.data.length > 0);
    // Verify joined fields
    const firstOwned = invJson.data[0];
    assert(firstOwned.id && firstOwned.rewardItemId && firstOwned.name && firstOwned.quantity);
    console.log('   ✅ GET /shop/inventory successfully returns owned items with joined metadata.');

    // -------------------------------------------------------------
    // Test 13: Cleanup & Cascade Deletes
    // -------------------------------------------------------------
    console.log('13. Testing cleanup and ON DELETE CASCADE...');
    await query('DELETE FROM users WHERE id = $1', [testUserA.id]);
    await query('DELETE FROM users WHERE id = $1', [testUserB.id]);

    const remainingShopItems = await query(
      'SELECT COUNT(*) as count FROM reward_items WHERE user_id IN ($1, $2)',
      [testUserA.id, testUserB.id]
    );
    const remainingInventory = await query(
      'SELECT COUNT(*) as count FROM inventory WHERE user_id IN ($1, $2)',
      [testUserA.id, testUserB.id]
    );
    const remainingPurchases = await query(
      'SELECT COUNT(*) as count FROM purchases WHERE user_id IN ($1, $2)',
      [testUserA.id, testUserB.id]
    );

    assert.equal(parseInt(remainingShopItems.rows[0].count, 10), 0);
    assert.equal(parseInt(remainingInventory.rows[0].count, 10), 0);
    assert.equal(parseInt(remainingPurchases.rows[0].count, 10), 0);
    console.log('   ✅ Cleaned up test data via ON DELETE CASCADE.');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(' 🎉 All Phase 4.1 Shop & Inventory Tests Passed!       ');
    console.log('═══════════════════════════════════════════════════════\n');
  } finally {
    server.close();
  }
}

runShopTestSuite().catch((err) => {
  console.error('\n❌ Shop test suite failed:', err);
  process.exit(1);
});
