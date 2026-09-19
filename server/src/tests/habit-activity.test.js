import assert from 'node:assert/strict';
import http from 'node:http';

import app from '../app.js';
import { query } from '../db/pool.js';
import { AuthService } from '../services/auth.service.js';
import { habitService } from '../services/habit.service.js';
import { getUserLocalDate } from '../services/daily-reset.service.js';

const authService = new AuthService();

async function runHabitActivityTestSuite() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log(' Starting Habit Activity & Consistency Test Suite   ');
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
    // Test 1: User Setup with Timezones
    // -------------------------------------------------------------
    console.log('1. Setting up test users with custom timezones...');
    const emailA = `habit_act_a_${Date.now()}@example.com`;
    const regA = await authService.register({
      email: emailA,
      password: 'StrongPassword123!',
      displayName: 'Ritual Master A',
      userAgent: 'habit-test',
      ip: '127.0.0.1',
      timezone: 'America/New_York',
    });
    testUserA = regA.user;
    tokenA = regA.accessToken;

    const emailB = `habit_act_b_${Date.now()}@example.com`;
    const regB = await authService.register({
      email: emailB,
      password: 'StrongPassword123!',
      displayName: 'Ritual Master B',
      userAgent: 'habit-test',
      ip: '127.0.0.1',
      timezone: 'UTC',
    });
    testUserB = regB.user;
    tokenB = regB.accessToken;

    assert.equal(testUserA.timezone, 'America/New_York');
    assert.equal(testUserB.timezone, 'UTC');
    console.log('   ✅ Test users created with specific IANA timezones.');

    // -------------------------------------------------------------
    // Test 2: Empty Activity History
    // -------------------------------------------------------------
    console.log('2. Testing empty activity history for new user...');
    const emptyRes = await fetch(`${baseUrl}/habits/activity`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(emptyRes.status, 200);
    const emptyJson = await emptyRes.json();
    const actEmpty = emptyJson.data;

    assert.equal(actEmpty.timezone, 'America/New_York');
    assert.equal(actEmpty.calendarDays.length, 7);
    assert.equal(actEmpty.weeklyTotal, 0);
    assert.deepEqual(actEmpty.completedHabitIdsToday, []);
    assert.deepEqual(actEmpty.recentLogs, []);
    for (const day of actEmpty.calendarDays) {
      assert.equal(actEmpty.dailyCompletions[day], 0);
    }
    console.log('   ✅ Empty activity history returns 7 local days with 0 completions and empty arrays.');

    // -------------------------------------------------------------
    // Test 3: Endpoint Validation & Tenant Isolation
    // -------------------------------------------------------------
    console.log('3. Testing endpoint validation & tenant isolation...');
    const unauthRes = await fetch(`${baseUrl}/habits/activity`);
    assert.equal(unauthRes.status, 401, 'Unauthenticated request must be 401');

    const invalidLimitRes = await fetch(`${baseUrl}/habits/activity?recentLimit=999`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(invalidLimitRes.status, 400, 'Invalid limit must return 400');

    const invalidLimitAlphaRes = await fetch(`${baseUrl}/habits/activity?recentLimit=notanumber`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(invalidLimitAlphaRes.status, 400);
    console.log('   ✅ Endpoint validation (auth, numeric bounds) verified.');

    // -------------------------------------------------------------
    // Test 4: Positive vs. Negative Scoring Semantics
    // -------------------------------------------------------------
    console.log('4. Testing positive vs negative scoring semantics...');
    const habit1 = await habitService.createHabit(testUserA.id, {
      title: 'Deep Meditation',
      direction: 'both',
      difficulty: 'medium',
    });

    // Score positive once
    await habitService.scoreHabit(testUserA.id, habit1.id, 'positive');

    // Check activity
    let actRes = await fetch(`${baseUrl}/habits/activity`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    let actData = (await actRes.json()).data;
    assert.equal(actData.weeklyTotal, 1);
    assert.equal(actData.dailyCompletions[actData.todayDate], 1);
    assert.deepEqual(actData.completedHabitIdsToday, [habit1.id]);
    assert.equal(actData.recentLogs.length, 1);
    assert.equal(actData.recentLogs[0].direction, 'positive');
    assert.equal(actData.recentLogs[0].xpAwarded, 15);
    assert.equal(actData.recentLogs[0].goldAwarded, 6);
    assert.equal(actData.recentLogs[0].hpChange, 0);

    // Now score negative on the same habit (a slip)
    await habitService.scoreHabit(testUserA.id, habit1.id, 'negative');

    actRes = await fetch(`${baseUrl}/habits/activity`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    actData = (await actRes.json()).data;
    // Weekly positive total should STILL be 1 (negative scores do not count toward completion)
    assert.equal(actData.weeklyTotal, 1);
    assert.equal(actData.dailyCompletions[actData.todayDate], 1);
    // Habit was scored positively today, so it remains completed today
    assert.deepEqual(actData.completedHabitIdsToday, [habit1.id]);
    // Recent logs has 2 logs: latest is negative with -6 HP
    assert.equal(actData.recentLogs.length, 2);
    assert.equal(actData.recentLogs[0].direction, 'negative');
    assert.equal(actData.recentLogs[0].hpChange, -6);
    assert.equal(actData.recentLogs[0].xpAwarded, 0);

    // Now test habit2 that ONLY gets scored negative
    const habit2 = await habitService.createHabit(testUserA.id, {
      title: 'Late Night Snacking',
      direction: 'negative',
      difficulty: 'easy',
    });
    await habitService.scoreHabit(testUserA.id, habit2.id, 'negative');

    actRes = await fetch(`${baseUrl}/habits/activity`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    actData = (await actRes.json()).data;
    // habit2 MUST NOT be in completedHabitIdsToday because it has 0 positive completions!
    assert.ok(!actData.completedHabitIdsToday.includes(habit2.id));
    assert.deepEqual(actData.completedHabitIdsToday, [habit1.id]);
    console.log('   ✅ Positive vs negative scoring semantics verified: negative score does NOT increment completion.');

    // -------------------------------------------------------------
    // Test 5: Tenant Isolation
    // -------------------------------------------------------------
    console.log('5. Testing tenant isolation for activity logs...');
    const userBActRes = await fetch(`${baseUrl}/habits/activity`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const userBAct = (await userBActRes.json()).data;
    assert.equal(userBAct.weeklyTotal, 0);
    assert.equal(userBAct.recentLogs.length, 0);
    assert.deepEqual(userBAct.completedHabitIdsToday, []);
    console.log('   ✅ Tenant isolation verified: User B sees 0 logs despite User A activity.');

    // -------------------------------------------------------------
    // Test 6: Archived Habit Title Resolution
    // -------------------------------------------------------------
    console.log('6. Testing archived habit activity title resolution...');
    await habitService.archiveHabit(testUserA.id, habit1.id);

    actRes = await fetch(`${baseUrl}/habits/activity`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    actData = (await actRes.json()).data;
    // Even though habit1 is archived, its log still retains its original title from the join and flags isArchived
    const archivedLog = actData.recentLogs.find((l) => l.habitId === habit1.id);
    assert.ok(archivedLog);
    assert.equal(archivedLog.habitTitle, 'Deep Meditation');
    assert.equal(archivedLog.isArchived, true);
    console.log('   ✅ Archived habit activity safely resolved with title and isArchived flag.');

    // -------------------------------------------------------------
    // Test 7: >50 Relevant Logs in One Week (Mathematical Completeness)
    // -------------------------------------------------------------
    console.log('7. Testing high-volume scoring (>50 positive completions in 7 days)...');
    const habitBatch = await habitService.createHabit(testUserA.id, {
      title: 'Hydration Ritual',
      direction: 'positive',
      difficulty: 'trivial',
    });

    // Insert 55 positive completions directly across the past few days within the 7-day window
    const day0 = actData.calendarDays[6]; // today
    const day2 = actData.calendarDays[4]; // 2 days ago
    const day4 = actData.calendarDays[2]; // 4 days ago

    // Insert 20 logs for today, 20 for 2 days ago, 15 for 4 days ago = 55 logs
    const insertLogs = [];
    for (let i = 0; i < 20; i++) {
      insertLogs.push(
        query(
          `INSERT INTO habit_logs (habit_id, user_id, direction, xp_awarded, gold_awarded, hp_change, created_at)
           VALUES ($1, $2, 'positive', 3, 1, 0, ($3::date + time '10:00:00') AT TIME ZONE 'America/New_York')`,
          [habitBatch.id, testUserA.id, day0]
        )
      );
    }
    for (let i = 0; i < 20; i++) {
      insertLogs.push(
        query(
          `INSERT INTO habit_logs (habit_id, user_id, direction, xp_awarded, gold_awarded, hp_change, created_at)
           VALUES ($1, $2, 'positive', 3, 1, 0, ($3::date + time '12:00:00') AT TIME ZONE 'America/New_York')`,
          [habitBatch.id, testUserA.id, day2]
        )
      );
    }
    for (let i = 0; i < 15; i++) {
      insertLogs.push(
        query(
          `INSERT INTO habit_logs (habit_id, user_id, direction, xp_awarded, gold_awarded, hp_change, created_at)
           VALUES ($1, $2, 'positive', 3, 1, 0, ($3::date + time '14:00:00') AT TIME ZONE 'America/New_York')`,
          [habitBatch.id, testUserA.id, day4]
        )
      );
    }
    await Promise.all(insertLogs);

    actRes = await fetch(`${baseUrl}/habits/activity?recentLimit=10`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    actData = (await actRes.json()).data;

    // Prior positive: 1 (from habit1) + 55 = 56 positive logs total
    assert.equal(actData.weeklyTotal, 56, 'Weekly total must include ALL 56 logs without truncation');
    assert.equal(actData.dailyCompletions[day0], 21, 'Today must have 20 + 1 prior = 21 completions');
    assert.equal(actData.dailyCompletions[day2], 20, 'Day 2 must have exactly 20 completions');
    assert.equal(actData.dailyCompletions[day4], 15, 'Day 4 must have exactly 15 completions');

    // Recent activity feed must be bounded by recentLimit (10)
    assert.equal(actData.recentLogs.length, 10, 'recentLogs must be bounded to requested limit of 10');
    console.log('   ✅ High-volume check passed: all 56 completions counted in weekly aggregate; recentLogs cleanly bounded to 10.');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(' 🎉 All Habit Activity & Consistency Tests Passed!   ');
    console.log('═══════════════════════════════════════════════════════\n');
  } finally {
    // Cleanup test users
    if (testUserA?.id) {
      await query('DELETE FROM users WHERE id = $1', [testUserA.id]);
    }
    if (testUserB?.id) {
      await query('DELETE FROM users WHERE id = $1', [testUserB.id]);
    }
    await new Promise((resolve) => server.close(resolve));
    process.exit(0);
  }
}

runHabitActivityTestSuite().catch((err) => {
  console.error('\n❌ Habit Activity test suite failed:', err);
  process.exit(1);
});
