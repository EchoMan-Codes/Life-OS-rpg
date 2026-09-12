import assert from 'node:assert/strict';
import http from 'node:http';

import app from '../app.js';
import { query } from '../db/pool.js';
import { AuthService } from '../services/auth.service.js';
import { calculateDailyReward, hpPenaltyFor, HP_PENALTY, DIFFICULTY_REWARDS } from '../services/reward-table.js';
import {
  getUserLocalDate,
  getUserLocalYesterday,
  checkAndProcessUserReset,
} from '../services/daily-reset.service.js';

const authService = new AuthService();

async function runDailiesTestSuite() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log(' Starting Phase 3.2 Dailies & Midnight Reset Test Suite');
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
    // Test 1: Reward & Penalty Constants
    // -------------------------------------------------------------
    console.log('1. Testing HP penalties & reward calculations...');
    assert.equal(hpPenaltyFor('trivial'), 2);
    assert.equal(hpPenaltyFor('easy'), 5);
    assert.equal(hpPenaltyFor('medium'), 10);
    assert.equal(hpPenaltyFor('hard'), 18);

    assert.deepEqual(calculateDailyReward('trivial'), { xp: 3, gold: 1 });
    assert.deepEqual(calculateDailyReward('easy'), { xp: 8, gold: 3 });
    assert.deepEqual(calculateDailyReward('medium'), { xp: 15, gold: 6 });
    assert.deepEqual(calculateDailyReward('hard'), { xp: 25, gold: 10 });
    console.log('   ✅ Reward formulas and HP penalties verified.');

    // -------------------------------------------------------------
    // Test 2: IANA Timezone Calculation & DST Transitions
    // -------------------------------------------------------------
    console.log('2. Testing IANA timezone handling and DST transition accuracy...');
    const testDate = new Date('2026-09-10T02:30:00Z');

    // Asia/Kolkata is UTC+5:30 -> 2026-09-10 08:00
    assert.equal(getUserLocalDate(testDate, 'Asia/Kolkata'), '2026-09-10');
    // America/New_York is UTC-4 (EDT) -> 2026-09-09 22:30
    assert.equal(getUserLocalDate(testDate, 'America/New_York'), '2026-09-09');
    // Asia/Tokyo is UTC+9 -> 2026-09-10 11:30
    assert.equal(getUserLocalDate(testDate, 'Asia/Tokyo'), '2026-09-10');
    // Europe/London is UTC+1 (BST) -> 2026-09-10 03:30
    assert.equal(getUserLocalDate(testDate, 'Europe/London'), '2026-09-10');
    // UTC
    assert.equal(getUserLocalDate(testDate, 'UTC'), '2026-09-10');

    // DST transitions: US Spring Forward (2026-03-08) & Fall Back (2026-11-01)
    const springForward = new Date('2026-03-08T07:30:00Z');
    assert.equal(getUserLocalDate(springForward, 'America/New_York'), '2026-03-08');
    const { yesterdayDate: springYest } = getUserLocalYesterday(springForward, 'America/New_York');
    assert.equal(springYest, '2026-03-07');

    const fallBack = new Date('2026-11-01T06:30:00Z');
    assert.equal(getUserLocalDate(fallBack, 'America/New_York'), '2026-11-01');
    const { yesterdayDate: fallYest } = getUserLocalYesterday(fallBack, 'America/New_York');
    assert.equal(fallYest, '2026-10-31');
    console.log('   ✅ Multi-timezone IANA dates and DST transitions verified.');

    // -------------------------------------------------------------
    // Test 3: User Setup with Timezone
    // -------------------------------------------------------------
    console.log('3. Setting up test users with custom timezones...');
    const emailA = `daily_test_a_${Date.now()}@example.com`;
    const regA = await authService.register({
      email: emailA,
      password: 'StrongDailyPass123!',
      displayName: 'Daily Paladin A',
      userAgent: 'daily-test',
      ip: '127.0.0.1',
      timezone: 'America/New_York',
    });
    testUserA = regA.user;
    tokenA = regA.accessToken;

    const emailB = `daily_test_b_${Date.now()}@example.com`;
    const regB = await authService.register({
      email: emailB,
      password: 'StrongDailyPass123!',
      displayName: 'Daily Rogue B',
      userAgent: 'daily-test',
      ip: '127.0.0.1',
      timezone: 'Asia/Kolkata',
    });
    testUserB = regB.user;
    tokenB = regB.accessToken;

    assert.equal(testUserA.timezone, 'America/New_York');
    assert.equal(testUserB.timezone, 'Asia/Kolkata');
    console.log('   ✅ Test users created with IANA timezones and auto-initialized stats.');

    // -------------------------------------------------------------
    // Test 4: Dailies CRUD Operations
    // -------------------------------------------------------------
    console.log('4. Testing Dailies CRUD operations & Zod validation...');

    // Create daily
    const createRes = await fetch(`${baseUrl}/dailies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Morning Meditation',
        description: '10 minutes of breathwork',
        difficulty: 'easy',
        activeDays: [1, 2, 3, 4, 5], // Mon..Fri
      }),
    });
    assert.equal(createRes.status, 201);
    const createdData = await createRes.json();
    const dailyId = createdData.data.id;
    assert.equal(createdData.data.title, 'Morning Meditation');
    assert.equal(createdData.data.difficulty, 'easy');
    assert.deepEqual(createdData.data.activeDays, [1, 2, 3, 4, 5]);
    assert.equal(createdData.data.isCompleteToday, false);
    assert.equal(createdData.data.streakCurrent, 0);

    // List dailies
    const listRes = await fetch(`${baseUrl}/dailies`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(listRes.status, 200);
    const listData = await listRes.json();
    assert.equal(listData.data.length, 1);
    assert.equal(listData.data[0].id, dailyId);

    // Get daily by ID
    const getRes = await fetch(`${baseUrl}/dailies/${dailyId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(getRes.status, 200);

    // Update daily
    const updateRes = await fetch(`${baseUrl}/dailies/${dailyId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Deep Meditation & Journaling',
        difficulty: 'medium',
      }),
    });
    assert.equal(updateRes.status, 200);
    const updatedData = await updateRes.json();
    assert.equal(updatedData.data.title, 'Deep Meditation & Journaling');
    assert.equal(updatedData.data.difficulty, 'medium');

    // Validation rejection (empty title)
    const badRes = await fetch(`${baseUrl}/dailies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: '',
      }),
    });
    assert.equal(badRes.status, 400);
    console.log('   ✅ Dailies CRUD and Zod schema validation verified.');

    // -------------------------------------------------------------
    // Test 5: Tenant Isolation Security
    // -------------------------------------------------------------
    console.log('5. Testing strict tenant isolation...');
    // User B tries to view User A's daily
    const stealGet = await fetch(`${baseUrl}/dailies/${dailyId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(stealGet.status, 404);

    // User B tries to complete User A's daily
    const stealComplete = await fetch(`${baseUrl}/dailies/${dailyId}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(stealComplete.status, 404);

    // User B tries to archive User A's daily
    const stealDelete = await fetch(`${baseUrl}/dailies/${dailyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(stealDelete.status, 404);
    console.log('   ✅ Tenant isolation verified: User B cannot access or modify User A daily.');

    // -------------------------------------------------------------
    // Test 6: Daily Completion & Progression Reward
    // -------------------------------------------------------------
    console.log('6. Testing daily completion & progression reward...');
    const compRes = await fetch(`${baseUrl}/dailies/${dailyId}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(compRes.status, 200);
    const compData = await compRes.json();
    assert.equal(compData.data.daily.isCompleteToday, true);
    // Medium daily awards 15 XP and 6 Gold
    assert.equal(compData.data.reward.xp, 15);
    assert.equal(compData.data.reward.gold, 6);
    assert.equal(compData.data.character.xp, 15);
    assert.equal(compData.data.character.gold, 6);

    // Duplicate completion rejection (409 ALREADY_COMPLETE)
    const dupRes = await fetch(`${baseUrl}/dailies/${dailyId}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(dupRes.status, 409);
    const dupData = await dupRes.json();
    assert.equal(dupData.error.code, 'ALREADY_COMPLETE');
    console.log('   ✅ Daily completion and duplicate 409 prevention verified.');

    // -------------------------------------------------------------
    // Test 7: Same-Day Undo & Safe Reward Reversal
    // -------------------------------------------------------------
    console.log('7. Testing same-day undo & safe progression reversal...');
    const undoRes = await fetch(`${baseUrl}/dailies/${dailyId}/undo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(undoRes.status, 200);
    const undoData = await undoRes.json();
    assert.equal(undoData.data.daily.isCompleteToday, false);
    assert.equal(undoData.data.character.xp, 0);
    assert.equal(undoData.data.character.gold, 0);

    // Verify undoing an uncompleted daily fails (400 NOT_COMPLETED_TODAY)
    const doubleUndo = await fetch(`${baseUrl}/dailies/${dailyId}/undo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(doubleUndo.status, 400);
    const doubleUndoData = await doubleUndo.json();
    assert.equal(doubleUndoData.error.code, 'NOT_COMPLETED_TODAY');
    console.log('   ✅ Same-day undo and reward reversal verified.');

    // -------------------------------------------------------------
    // Test 8: Progression Consistency on Level-Up Undo
    // -------------------------------------------------------------
    console.log('8. Testing undo progression consistency when completion triggered a level-up...');
    // Artificially place User A near level-up threshold: Level 1 with 105 XP (Level 1 requires 110 XP)
    await query('UPDATE character_stats SET xp = 105, level = 1, unallocated_points = 0 WHERE user_id = $1', [
      testUserA.id,
    ]);

    // Complete medium daily (awards 15 XP -> 105 + 15 = 120 >= 110 -> Level 2, 10 XP, 2 stat points)
    const levelCompRes = await fetch(`${baseUrl}/dailies/${dailyId}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(levelCompRes.status, 200);
    const levelCompData = await levelCompRes.json();
    assert.equal(levelCompData.data.character.level, 2);
    assert.equal(levelCompData.data.character.xp, 10);
    assert.equal(levelCompData.data.character.unallocatedPoints, 2);
    assert.equal(levelCompData.data.reward.leveledUp, true);

    // Now undo the completion: Level must revert to 1, XP restored to 105, unallocated points reverted to 0
    const levelUndoRes = await fetch(`${baseUrl}/dailies/${dailyId}/undo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(levelUndoRes.status, 200);
    const levelUndoData = await levelUndoRes.json();
    assert.equal(levelUndoData.data.character.level, 1);
    assert.equal(levelUndoData.data.character.xp, 105);
    assert.equal(levelUndoData.data.character.unallocatedPoints, 0);
    console.log('   ✅ Level-up undo consistency verified (Level 2 -> Level 1 restored cleanly with no orphaned points).');

    // -------------------------------------------------------------
    // Test 9: Concurrency Protection on Complete (SELECT ... FOR UPDATE)
    // -------------------------------------------------------------
    console.log('9. Testing concurrent complete requests serialization...');
    const [concurrent1, concurrent2] = await Promise.all([
      fetch(`${baseUrl}/dailies/${dailyId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
      }),
      fetch(`${baseUrl}/dailies/${dailyId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
      }),
    ]);

    const statuses = [concurrent1.status, concurrent2.status].sort();
    assert.deepEqual(statuses, [200, 409], 'Exactly one concurrent completion must succeed, one must be rejected 409');
    console.log('   ✅ Concurrency protection verified: Exactly one completion succeeded, duplicate was rejected.');

    // -------------------------------------------------------------
    // Test 10: Midnight Reset Engine Simulation & Semantics
    // -------------------------------------------------------------
    console.log('10. Testing midnight reset engine (streaks, shields, HP penalties, inactive days, idempotency)...');

    // Set up User B with 4 specific dailies:
    // Daily 1: Hard difficulty, active yesterday, incomplete, 0 shields -> expects 0 streak, -18 HP
    // Daily 2: Medium difficulty, active yesterday, complete -> expects +1 streak, no HP loss
    // Daily 3: Easy difficulty, active yesterday, incomplete, 1 shield -> expects shield consumed (0), streak preserved (3), no HP loss
    // Daily 4: Inactive yesterday (active only on other days), incomplete -> expects streak preserved, no HP loss

    const { yesterdayWeekday } = getUserLocalYesterday(new Date(), testUserB.timezone);
    const inactiveDay = (yesterdayWeekday + 2) % 7;

    // Reset User B stats to full HP (50)
    await query('UPDATE character_stats SET hp = 50 WHERE user_id = $1', [testUserB.id]);

    const d1Res = await query(
      `INSERT INTO dailies (user_id, title, difficulty, active_days, streak_current, streak_best, streak_shield_charges, is_complete_today, last_reset_date)
       VALUES ($1, 'Hard Unshielded Missed', 'hard', $2, 5, 10, 0, false, '2020-01-01')
       RETURNING id`,
      [testUserB.id, [yesterdayWeekday]]
    );
    const d1Id = d1Res.rows[0].id;

    const d2Res = await query(
      `INSERT INTO dailies (user_id, title, difficulty, active_days, streak_current, streak_best, streak_shield_charges, is_complete_today, last_reset_date)
       VALUES ($1, 'Medium Completed', 'medium', $2, 2, 5, 0, true, '2020-01-01')
       RETURNING id`,
      [testUserB.id, [yesterdayWeekday]]
    );
    const d2Id = d2Res.rows[0].id;

    const d3Res = await query(
      `INSERT INTO dailies (user_id, title, difficulty, active_days, streak_current, streak_best, streak_shield_charges, is_complete_today, last_reset_date)
       VALUES ($1, 'Easy Shielded Missed', 'easy', $2, 3, 4, 1, false, '2020-01-01')
       RETURNING id`,
      [testUserB.id, [yesterdayWeekday]]
    );
    const d3Id = d3Res.rows[0].id;

    const d4Res = await query(
      `INSERT INTO dailies (user_id, title, difficulty, active_days, streak_current, streak_best, streak_shield_charges, is_complete_today, last_reset_date)
       VALUES ($1, 'Inactive Yesterday Missed', 'hard', $2, 7, 7, 0, false, '2020-01-01')
       RETURNING id`,
      [testUserB.id, [inactiveDay]]
    );
    const d4Id = d4Res.rows[0].id;

    // Run reset processor for User B
    const resetResult = await checkAndProcessUserReset(query, testUserB.id, testUserB.timezone);
    assert.equal(resetResult.resetPerformed, true);
    assert.equal(resetResult.dailiesReset, 4);
    assert.equal(resetResult.hpPenalty, 18); // Only Hard missed incurred 18 HP penalty

    // Verify Daily 1: Streak reset to 0, best streak preserved at 10
    const d1Check = await query('SELECT streak_current, streak_best, is_complete_today FROM dailies WHERE id = $1', [d1Id]);
    assert.equal(d1Check.rows[0].streak_current, 0);
    assert.equal(d1Check.rows[0].streak_best, 10);
    assert.equal(d1Check.rows[0].is_complete_today, false);

    // Verify Daily 2: Streak incremented 2 -> 3
    const d2Check = await query('SELECT streak_current, streak_best, is_complete_today FROM dailies WHERE id = $1', [d2Id]);
    assert.equal(d2Check.rows[0].streak_current, 3);
    assert.equal(d2Check.rows[0].is_complete_today, false);

    // Verify Daily 3: Shield consumed (1 -> 0), streak preserved at 3
    const d3Check = await query(
      'SELECT streak_current, streak_shield_charges, is_complete_today FROM dailies WHERE id = $1',
      [d3Id]
    );
    assert.equal(d3Check.rows[0].streak_shield_charges, 0);
    assert.equal(d3Check.rows[0].streak_current, 3);
    assert.equal(d3Check.rows[0].is_complete_today, false);

    // Verify Daily 4: Inactive day streak preserved at 7
    const d4Check = await query('SELECT streak_current, is_complete_today FROM dailies WHERE id = $1', [d4Id]);
    assert.equal(d4Check.rows[0].streak_current, 7);
    assert.equal(d4Check.rows[0].is_complete_today, false);

    // Verify HP deducted: 50 - 18 = 32 HP
    const charBCheck = await query('SELECT hp FROM character_stats WHERE user_id = $1', [testUserB.id]);
    assert.equal(charBCheck.rows[0].hp, 32);

    // Test Idempotency: Running reset a second time for User B must be a no-op!
    const secondReset = await checkAndProcessUserReset(query, testUserB.id, testUserB.timezone);
    assert.equal(secondReset.resetPerformed, false);
    assert.equal(secondReset.hpPenalty, 0);
    console.log('   ✅ Midnight reset verified: Streaks, shields, HP damage, inactive days, and idempotency all passed.');

    // -------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------
    console.log('11. Cleaning up test rows...');
    if (testUserA) {
      await query('DELETE FROM users WHERE id = $1', [testUserA.id]);
    }
    if (testUserB) {
      await query('DELETE FROM users WHERE id = $1', [testUserB.id]);
    }
    console.log('   ✅ Cleaned up test data.');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(' 🎉 All Phase 3.2 Dailies Integration Tests Passed!    ');
    console.log('═══════════════════════════════════════════════════════\n');
  } catch (err) {
    console.error('\n❌ Test failure:', err);
    process.exitCode = 1;
  } finally {
    server.close(() => {
      process.exit(process.exitCode || 0);
    });
    setTimeout(() => process.exit(process.exitCode || 0), 1000);
  }
}

runDailiesTestSuite();
