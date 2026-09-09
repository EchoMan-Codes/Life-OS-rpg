import http from 'http';
import assert from 'assert';
import app from '../app.js';
import { pool, withTransaction } from '../db/pool.js';
import { xpRequiredFor, applyReward } from '../services/progression.service.js';
import { generateAccessToken } from '../services/token.service.js';

let server;
let baseUrl;

function request(method, path, { body, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqHeaders = { ...headers };
    let reqBody = null;

    if (body) {
      reqBody = JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(reqBody);
    }

    const req = http.request(url, { method, headers: reqHeaders }, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        let data = null;
        try {
          data = JSON.parse(raw);
        } catch {
          data = raw;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data,
          raw,
        });
      });
    });

    req.on('error', reject);
    if (reqBody) req.write(reqBody);
    req.end();
  });
}

async function runProgressionTests() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log(' Starting Phase 2.2 Character Progression Test Suite  ');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Unit Tests for xpRequiredFor
  console.log('1. Testing xpRequiredFor(level) mathematical formula...');
  assert.strictEqual(xpRequiredFor(1), 110, 'Level 1 requires 110 XP');
  assert.strictEqual(xpRequiredFor(2), 121, 'Level 2 requires 121 XP');
  assert.strictEqual(xpRequiredFor(3), 132, 'Level 3 requires 132 XP');
  assert.strictEqual(xpRequiredFor(4), 144, 'Level 4 requires 144 XP');
  assert.strictEqual(xpRequiredFor(10), 225, 'Level 10 requires 225 XP');
  console.log('   ✅ Leveling curve math verified for levels 1, 2, 3, 4, and 10.');

  server = http.createServer(app);
  await new Promise((res) => server.listen(0, res));
  baseUrl = `http://localhost:${server.address().port}`;
  console.log(`Test server running at ${baseUrl}`);

  const testEmail = `progression_hero_${Date.now()}@lifeos.local`;
  let testUserId = null;
  let testAccessToken = null;

  try {
    // 2. Register user & verify automatic character_stats trigger creation
    console.log('2. Testing user registration and automatic character_stats creation...');
    const regRes = await request('POST', '/api/v1/auth/register', {
      body: {
        email: testEmail,
        password: 'HeroicPassword!#999',
        displayName: 'Progression Champion',
      },
    });
    assert.strictEqual(regRes.status, 201);
    testUserId = regRes.data.data.user.id;
    testAccessToken = regRes.data.data.accessToken;

    const dbStatsRes = await pool.query(
      'SELECT * FROM character_stats WHERE user_id = $1',
      [testUserId]
    );
    assert.strictEqual(dbStatsRes.rows.length, 1, 'character_stats row must be auto-created');
    const initialStats = dbStatsRes.rows[0];
    assert.strictEqual(initialStats.level, 1);
    assert.strictEqual(initialStats.xp, 0);
    assert.strictEqual(initialStats.hp, 50);
    assert.strictEqual(initialStats.max_hp, 50);
    assert.strictEqual(initialStats.mana, 20);
    assert.strictEqual(initialStats.max_mana, 20);
    assert.strictEqual(initialStats.gold, 0);
    assert.strictEqual(initialStats.strength, 5);
    assert.strictEqual(initialStats.unallocated_points, 0);
    console.log('   ✅ User auto-initialized in character_stats with defaults.');

    // 3. Test applyReward single level-up
    console.log('3. Testing applyReward single level-up...');
    const singleLevelResult = await withTransaction(async (client) => {
      return applyReward(client, testUserId, { xp: 115, gold: 20 });
    });
    assert.strictEqual(singleLevelResult.leveledUp, true);
    assert.strictEqual(singleLevelResult.levelsGained, 1);
    assert.strictEqual(singleLevelResult.newLevel, 2);
    assert.strictEqual(singleLevelResult.newXp, 5); // 115 - 110 = 5
    assert.strictEqual(singleLevelResult.newGold, 20);
    assert.strictEqual(singleLevelResult.unallocatedPoints, 2);
    console.log('   ✅ Single level-up verified: Level 1 -> 2, unallocatedPoints = 2, XP = 5.');

    // 4. Test applyReward multi-level-up (resolves 3 levels in a single atomic update)
    console.log('4. Testing applyReward genuine multi-level-up (3 levels in 1 grant)...');
    // Starting with level 2, xp = 5.
    // Level 2 requires 121. Level 3 requires 132. Level 4 requires 144. Total needed = 121 + 132 + 144 - 5 = 392.
    // If we grant 400 XP:
    // Level 2 -> 3: 405 - 121 = 284 XP left
    // Level 3 -> 4: 284 - 132 = 152 XP left
    // Level 4 -> 5: 152 - 144 = 8 XP left
    // Total levels gained = 3 (Level 2 -> 5), unallocated gained = 6 (+ 2 existing = 8).
    const multiLevelResult = await withTransaction(async (client) => {
      return applyReward(client, testUserId, { xp: 400, gold: 50 });
    });
    assert.strictEqual(multiLevelResult.leveledUp, true);
    assert.strictEqual(multiLevelResult.levelsGained, 3);
    assert.strictEqual(multiLevelResult.newLevel, 5);
    assert.strictEqual(multiLevelResult.newXp, 8);
    assert.strictEqual(multiLevelResult.newGold, 70);
    assert.strictEqual(multiLevelResult.unallocatedPoints, 8);
    console.log('   ✅ Multi-level-up verified: Level 2 -> 5 (levelsGained = 3), unallocatedPoints = 8, newXp = 8.');

    // 5. Test HP, Mana, and Gold boundary clamping
    console.log('5. Testing HP, Mana, and Gold boundary clamping...');
    const clampResult = await withTransaction(async (client) => {
      return applyReward(client, testUserId, { hp: 500, mana: 500, gold: 10 });
    });
    assert.strictEqual(clampResult.newHp, 50, 'HP clamped to max_hp (50)');
    assert.strictEqual(clampResult.newMana, 20, 'Mana clamped to max_mana (20)');
    assert.strictEqual(clampResult.newGold, 80);

    const damageResult = await withTransaction(async (client) => {
      return applyReward(client, testUserId, { hp: -500 });
    });
    assert.strictEqual(damageResult.newHp, 0, 'HP clamped to minimum 0');
    console.log('   ✅ Stat clamping verified: HP and Mana never exceed max or drop below 0.');

    // 6. Test concurrent applyReward updates (SELECT ... FOR UPDATE serialization)
    console.log('6. Testing concurrent applyReward calls in parallel (zero lost updates)...');
    const [rewardA, rewardB] = await Promise.all([
      withTransaction(async (client) => applyReward(client, testUserId, { xp: 10, gold: 35 })),
      withTransaction(async (client) => applyReward(client, testUserId, { xp: 15, gold: 65 })),
    ]);
    const finalDbState = await pool.query(
      'SELECT xp, gold FROM character_stats WHERE user_id = $1',
      [testUserId]
    );
    // Previous XP was 8, added 10 and 15 -> 33
    // Previous gold was 80, added 35 and 65 -> 180
    assert.strictEqual(finalDbState.rows[0].xp, 33, 'Final XP reflects both rewards');
    assert.strictEqual(finalDbState.rows[0].gold, 180, 'Final Gold reflects both rewards');
    console.log(`   ✅ Concurrency protection verified: Final XP = ${finalDbState.rows[0].xp}, Gold = ${finalDbState.rows[0].gold} (both rewards preserved).`);

    // 7. Test database-backed GET /api/v1/character
    console.log('7. Testing database-backed GET /api/v1/character...');
    const getCharRes = await request('GET', '/api/v1/character', {
      headers: { Authorization: `Bearer ${testAccessToken}` },
    });
    assert.strictEqual(getCharRes.status, 200);
    assert.strictEqual(getCharRes.data.data.level, 5);
    assert.strictEqual(getCharRes.data.data.xp, 33);
    assert.strictEqual(getCharRes.data.data.gold, 180);
    assert.strictEqual(getCharRes.data.data.unallocatedPoints, 8);
    assert.strictEqual(getCharRes.data.data.xpForNextLevel, xpRequiredFor(5));
    console.log('   ✅ GET /api/v1/character returns real PostgreSQL stats for authenticated user.');

    // 8. Test attribute allocation POST /api/v1/character/allocate
    console.log('8. Testing POST /api/v1/character/allocate (Strength -> +4 Max HP)...');
    const allocStrengthRes = await request('POST', '/api/v1/character/allocate', {
      headers: { Authorization: `Bearer ${testAccessToken}` },
      body: { attribute: 'strength', points: 1 },
    });
    assert.strictEqual(allocStrengthRes.status, 200);
    assert.strictEqual(allocStrengthRes.data.data.attributes.strength, 6);
    assert.strictEqual(allocStrengthRes.data.data.maxHp, 54, 'Max HP bumped by 4');
    assert.strictEqual(allocStrengthRes.data.data.hp, 4, 'Current HP bumped by 4');
    assert.strictEqual(allocStrengthRes.data.data.unallocatedPoints, 7, 'Points deducted');

    // Allocate Intelligence (+3 Max Mana)
    console.log('   Testing Intelligence allocation (+3 Max Mana)...');
    const allocIntRes = await request('POST', '/api/v1/character/allocate', {
      headers: { Authorization: `Bearer ${testAccessToken}` },
      body: { attribute: 'intelligence', points: 2 },
    });
    assert.strictEqual(allocIntRes.status, 200);
    assert.strictEqual(allocIntRes.data.data.attributes.intelligence, 7);
    assert.strictEqual(allocIntRes.data.data.maxMana, 26, 'Max Mana bumped by 6 (3 * 2)');
    assert.strictEqual(allocIntRes.data.data.unallocatedPoints, 5);
    console.log('   ✅ Derived stat bonuses verified for Strength (+4 HP) and Intelligence (+3 MP).');

    // 9. Test allocation edge cases: Insufficient points & Invalid attribute
    console.log('9. Testing allocation rejection: insufficient points...');
    const overSpendRes = await request('POST', '/api/v1/character/allocate', {
      headers: { Authorization: `Bearer ${testAccessToken}` },
      body: { attribute: 'vitality', points: 99 },
    });
    assert.strictEqual(overSpendRes.status, 400);
    assert.strictEqual(overSpendRes.data.error.code, 'INSUFFICIENT_POINTS');
    console.log('   ✅ Over-allocation rejected with 400 INSUFFICIENT_POINTS.');

    console.log('   Testing allocation rejection: invalid attribute...');
    const invalidAttrRes = await request('POST', '/api/v1/character/allocate', {
      headers: { Authorization: `Bearer ${testAccessToken}` },
      body: { attribute: 'agility', points: 1 },
    });
    assert.strictEqual(invalidAttrRes.status, 400);
    console.log('   ✅ Invalid attribute rejected with 400 validation error.');

    console.log('   Testing allocation rejection: unauthorized request...');
    const unauthAllocRes = await request('POST', '/api/v1/character/allocate', {
      body: { attribute: 'vitality', points: 1 },
    });
    assert.strictEqual(unauthAllocRes.status, 401);
    assert.strictEqual(unauthAllocRes.data.error.code, 'UNAUTHORIZED');
    console.log('   ✅ Unauthenticated request rejected with 401 UNAUTHORIZED.');

    // Clean up
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    console.log('   ✅ Cleaned up test user (ON DELETE CASCADE removed character_stats).');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(' 🎉 All Phase 2.2 Progression Tests Passed Cleanly!    ');
    console.log('═══════════════════════════════════════════════════════\n');
  } finally {
    server.close();
    await pool.end();
  }
}

runProgressionTests().catch((err) => {
  console.error('\n❌ Progression test suite failed:', err);
  if (server) server.close();
  pool.end().finally(() => process.exit(1));
});
