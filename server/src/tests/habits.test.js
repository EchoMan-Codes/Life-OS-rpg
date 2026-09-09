import assert from 'node:assert/strict';
import http from 'node:http';

import app from '../app.js';
import { query } from '../db/pool.js';
import { AuthService } from '../services/auth.service.js';
import { calculateHabitReward, DIFFICULTY_REWARDS } from '../services/reward-table.js';

const authService = new AuthService();

async function runHabitsTestSuite() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log(' Starting Phase 3.1 Habits & Streak Engine Test Suite  ');
  console.log('═══════════════════════════════════════════════════════\n');

  // Start test server on ephemeral port
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
    // Test 1: Reward table mathematical calculations
    // -------------------------------------------------------------
    console.log('1. Testing reward table formula & constants...');
    const trivialPos = calculateHabitReward('trivial', 'positive');
    assert.deepEqual(trivialPos, { xp: 3, gold: 1, hp: 0 });

    const trivialNeg = calculateHabitReward('trivial', 'negative');
    assert.deepEqual(trivialNeg, { xp: 0, gold: 0, hp: -1 }); // -round(3 * 0.4) = -1

    const easyPos = calculateHabitReward('easy', 'positive');
    assert.deepEqual(easyPos, { xp: 8, gold: 3, hp: 0 });

    const easyNeg = calculateHabitReward('easy', 'negative');
    assert.deepEqual(easyNeg, { xp: 0, gold: 0, hp: -3 }); // -round(8 * 0.4) = -3

    const medPos = calculateHabitReward('medium', 'positive');
    assert.deepEqual(medPos, { xp: 15, gold: 6, hp: 0 });

    const medNeg = calculateHabitReward('medium', 'negative');
    assert.deepEqual(medNeg, { xp: 0, gold: 0, hp: -6 }); // -round(15 * 0.4) = -6

    const hardPos = calculateHabitReward('hard', 'positive');
    assert.deepEqual(hardPos, { xp: 25, gold: 10, hp: 0 });

    const hardNeg = calculateHabitReward('hard', 'negative');
    assert.deepEqual(hardNeg, { xp: 0, gold: 0, hp: -10 }); // -round(25 * 0.4) = -10

    console.log('   ✅ Reward table values and HP penalty calculations verified.');

    // -------------------------------------------------------------
    // Test 2: User Setup
    // -------------------------------------------------------------
    console.log('2. Setting up test users User A and User B...');
    const emailA = `habit_test_a_${Date.now()}@example.com`;
    const regA = await authService.register({
      email: emailA,
      password: 'StrongHabitPass123!',
      displayName: 'Habit Hero A',
      userAgent: 'habit-test',
      ip: '127.0.0.1',
    });
    testUserA = regA.user;
    tokenA = regA.accessToken;

    const emailB = `habit_test_b_${Date.now()}@example.com`;
    const regB = await authService.register({
      email: emailB,
      password: 'StrongHabitPass123!',
      displayName: 'Habit Hero B',
      userAgent: 'habit-test',
      ip: '127.0.0.1',
    });
    testUserB = regB.user;
    tokenB = regB.accessToken;

    console.log('   ✅ Test users created with auto-initialized character stats.');

    // -------------------------------------------------------------
    // Test 3: Habit CRUD
    // -------------------------------------------------------------
    console.log('3. Testing Habit CRUD operations...');

    // 3a. Create habit
    const createRes = await fetch(`${baseUrl}/habits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Morning Meditation',
        description: '10 minutes of breathing',
        direction: 'both',
        difficulty: 'medium',
      }),
    });
    assert.equal(createRes.status, 201);
    const createdJson = await createRes.json();
    assert.ok(createdJson.data.id);
    assert.equal(createdJson.data.title, 'Morning Meditation');
    assert.equal(createdJson.data.direction, 'both');
    assert.equal(createdJson.data.difficulty, 'medium');
    assert.equal(createdJson.data.currentStreak, 0);
    assert.equal(createdJson.data.bestStreak, 0);
    const habitId = createdJson.data.id;

    // 3b. Create second habit (positive only)
    const create2Res = await fetch(`${baseUrl}/habits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Drink Water',
        direction: 'positive',
        difficulty: 'easy',
      }),
    });
    assert.equal(create2Res.status, 201);
    const habit2Id = (await create2Res.json()).data.id;

    // 3c. List habits
    const listRes = await fetch(`${baseUrl}/habits`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(listRes.status, 200);
    const listJson = await listRes.json();
    assert.equal(listJson.data.length, 2);

    // 3d. Update habit
    const updateRes = await fetch(`${baseUrl}/habits/${habitId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        description: '15 minutes of mindfulness',
      }),
    });
    assert.equal(updateRes.status, 200);
    const updateJson = await updateRes.json();
    assert.equal(updateJson.data.description, '15 minutes of mindfulness');

    // 3e. Archive habit 2
    const archiveRes = await fetch(`${baseUrl}/habits/${habit2Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(archiveRes.status, 200);

    // Check listing excludes archived
    const listAfterArchive = await fetch(`${baseUrl}/habits`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const listAfterJson = await listAfterArchive.json();
    assert.equal(listAfterJson.data.length, 1);
    assert.equal(listAfterJson.data[0].id, habitId);

    console.log('   ✅ Habit CRUD verified (create, list, get, update, archive).');

    // -------------------------------------------------------------
    // Test 4: Tenant Isolation Security
    // -------------------------------------------------------------
    console.log('4. Testing tenant isolation security...');

    // User B tries to view User A's habit
    const unauthorizedGet = await fetch(`${baseUrl}/habits/${habitId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(unauthorizedGet.status, 404);

    // User B tries to score User A's habit
    const unauthorizedScore = await fetch(`${baseUrl}/habits/${habitId}/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ direction: 'positive' }),
    });
    assert.equal(unauthorizedScore.status, 404);

    console.log('   ✅ Tenant isolation verified: User B cannot access or score User A habit.');

    // -------------------------------------------------------------
    // Test 5: Positive Scoring, Streaks & applyReward Integration
    // -------------------------------------------------------------
    console.log('5. Testing positive scoring & progression integration...');

    // Score positive for habitId (medium difficulty = 15 XP, 6 Gold)
    const score1Res = await fetch(`${baseUrl}/habits/${habitId}/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ direction: 'positive' }),
    });
    assert.equal(score1Res.status, 200);
    const score1Json = await score1Res.json();

    // Verify habit response
    assert.equal(score1Json.data.habit.currentStreak, 1);
    assert.equal(score1Json.data.habit.bestStreak, 1);
    assert.ok(score1Json.data.habit.lastScoredAt);

    // Verify reward
    assert.deepEqual(score1Json.data.reward, { xp: 15, gold: 6, hp: 0 });

    // Verify character stats updated via applyReward
    assert.equal(score1Json.data.character.xp, 15);
    assert.equal(score1Json.data.character.gold, 6);

    // Score positive again -> streak = 2
    const score2Res = await fetch(`${baseUrl}/habits/${habitId}/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ direction: 'positive' }),
    });
    const score2Json = await score2Res.json();
    assert.equal(score2Json.data.habit.currentStreak, 2);
    assert.equal(score2Json.data.habit.bestStreak, 2);
    assert.equal(score2Json.data.character.xp, 30);
    assert.equal(score2Json.data.character.gold, 12);

    // Verify audit logs in habit_logs table
    const logsRes = await query(
      'SELECT direction, xp_awarded, gold_awarded, hp_change FROM habit_logs WHERE habit_id = $1 ORDER BY created_at ASC',
      [habitId]
    );
    assert.equal(logsRes.rows.length, 2);
    assert.equal(logsRes.rows[0].direction, 'positive');
    assert.equal(logsRes.rows[0].xp_awarded, 15);
    assert.equal(logsRes.rows[0].gold_awarded, 6);

    console.log('   ✅ Positive scoring verified: streak incremented, XP/Gold awarded, audit logs stored.');

    // -------------------------------------------------------------
    // Test 6: Negative Scoring (HP Deduction & Streak Reset)
    // -------------------------------------------------------------
    console.log('6. Testing negative scoring (streak reset + HP deduction)...');

    // Current streak is 2, best is 2, HP is 50/50.
    // Score negative (medium difficulty = -6 HP)
    const scoreNegRes = await fetch(`${baseUrl}/habits/${habitId}/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ direction: 'negative' }),
    });
    assert.equal(scoreNegRes.status, 200);
    const scoreNegJson = await scoreNegRes.json();

    // Streak should reset to 0, bestStreak preserved at 2
    assert.equal(scoreNegJson.data.habit.currentStreak, 0);
    assert.equal(scoreNegJson.data.habit.bestStreak, 2);

    // HP should drop from 50 to 44
    assert.equal(scoreNegJson.data.reward.hp, -6);
    assert.equal(scoreNegJson.data.character.hp, 44);

    console.log('   ✅ Negative scoring verified: streak reset to 0, best streak preserved, HP deducted to 44.');

    // -------------------------------------------------------------
    // Test 7: Direction Incompatibility Validation
    // -------------------------------------------------------------
    console.log('7. Testing direction validation enforcement...');

    // Create a positive-only habit
    const posOnlyRes = await fetch(`${baseUrl}/habits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Run 5km',
        direction: 'positive',
        difficulty: 'hard',
      }),
    });
    const posOnlyId = (await posOnlyRes.json()).data.id;

    // Try to score negative on positive-only habit
    const invalidScoreRes = await fetch(`${baseUrl}/habits/${posOnlyId}/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ direction: 'negative' }),
    });
    assert.equal(invalidScoreRes.status, 400);
    const invalidJson = await invalidScoreRes.json();
    assert.equal(invalidJson.error.code, 'INVALID_DIRECTION');

    console.log('   ✅ Direction mismatch correctly rejected with HTTP 400 INVALID_DIRECTION.');

    // -------------------------------------------------------------
    // Test 8: Concurrent Scoring Safety (Zero Lost Updates)
    // -------------------------------------------------------------
    console.log('8. Testing concurrent score calls (SELECT ... FOR UPDATE serialization)...');

    // Record pre-concurrency stats
    const preHabit = await fetch(`${baseUrl}/habits/${habitId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    }).then((r) => r.json());
    const preStreak = preHabit.data.currentStreak; // 0

    const preChar = await fetch(`${baseUrl}/character`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    }).then((r) => r.json());
    const preXp = preChar.data.xp; // 30
    const preGold = preChar.data.gold; // 12

    // Fire two positive scores concurrently
    const [res1, res2] = await Promise.all([
      fetch(`${baseUrl}/habits/${habitId}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ direction: 'positive' }),
      }),
      fetch(`${baseUrl}/habits/${habitId}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ direction: 'positive' }),
      }),
    ]);

    assert.equal(res1.status, 200);
    assert.equal(res2.status, 200);

    // Verify final stats reflect both calls
    const postHabit = await fetch(`${baseUrl}/habits/${habitId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    }).then((r) => r.json());
    assert.equal(postHabit.data.currentStreak, preStreak + 2); // 0 + 2 = 2

    const postChar = await fetch(`${baseUrl}/character`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    }).then((r) => r.json());
    assert.equal(postChar.data.xp, preXp + 30); // 30 + 15 + 15 = 60
    assert.equal(postChar.data.gold, preGold + 12); // 12 + 6 + 6 = 24

    console.log('   ✅ Concurrency verified: Two simultaneous scores processed cleanly with zero lost updates.');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(' 🎉 All Phase 3.1 Habits Integration Tests Passed!    ');
    console.log('═══════════════════════════════════════════════════════\n');
    process.exit(0);
  } finally {
    // Clean up test data
    if (testUserA) {
      await query('DELETE FROM users WHERE id = $1', [testUserA.id]);
    }
    if (testUserB) {
      await query('DELETE FROM users WHERE id = $1', [testUserB.id]);
    }
    await new Promise((resolve) => server.close(resolve));
  }
}

runHabitsTestSuite().catch((err) => {
  console.error('\n❌ Habits Integration Test Failed:', err);
  process.exit(1);
});
