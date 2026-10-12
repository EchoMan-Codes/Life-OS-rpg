import assert from 'node:assert/strict';
import http from 'node:http';

import app from '../app.js';
import { query } from '../db/pool.js';
import { AuthService } from '../services/auth.service.js';
import { questService } from '../services/quest.service.js';
import {
  ACTIVE_QUEST_LIMITS,
  calculateQuestSuggestedReward,
  resolveCustomQuestLimitCategory,
  validateQuestRewards,
} from '../services/reward-table.js';

const authService = new AuthService();

async function runJeevanQuestsTestSuite() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log(' Starting Jeevan Quests Unified System Test Suite      ');
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
    // Test 1: Reward Formulas & Bounds Helpers
    // -------------------------------------------------------------
    console.log('1. Testing Quest suggested rewards & bounds calculation...');
    const weeklyMedium = calculateQuestSuggestedReward('weekly', 'medium');
    assert.deepEqual(weeklyMedium, { xp: 200, gold: 40 });

    const monthlyHard = calculateQuestSuggestedReward('monthly', 'hard');
    assert.deepEqual(monthlyHard, { xp: 1200, gold: 240 });

    const yearlyEpic = calculateQuestSuggestedReward('yearly', 'epic');
    assert.deepEqual(yearlyEpic, { xp: 10000, gold: 2000 });

    // Custom limit resolution
    assert.equal(resolveCustomQuestLimitCategory(5), 'weekly');
    assert.equal(resolveCustomQuestLimitCategory(14), 'weekly');
    assert.equal(resolveCustomQuestLimitCategory(15), 'monthly');
    assert.equal(resolveCustomQuestLimitCategory(90), 'monthly');
    assert.equal(resolveCustomQuestLimitCategory(91), 'yearly');

    // Validation bounds (50% - 150%)
    const valid = validateQuestRewards('weekly', 'medium', 250, 50);
    assert.equal(valid.valid, true);

    const tooHighXp = validateQuestRewards('weekly', 'medium', 500, 40);
    assert.equal(tooHighXp.valid, false);

    const tooLowCoins = validateQuestRewards('weekly', 'medium', 200, 10);
    assert.equal(tooLowCoins.valid, false);
    console.log('   ✅ Reward formulas and bounds verified.');

    // -------------------------------------------------------------
    // Test 2: User Setup
    // -------------------------------------------------------------
    console.log('2. Setting up test users User A and User B...');
    const emailA = `jeevan-quest-a-${Date.now()}@lifeos.game`;
    const emailB = `jeevan-quest-b-${Date.now()}@lifeos.game`;

    const regA = await authService.register({
      email: emailA,
      password: 'StrongPassword123!',
      displayName: 'Jeevan Hero A',
    });
    testUserA = regA.user;
    tokenA = regA.accessToken;

    const regB = await authService.register({
      email: emailB,
      password: 'StrongPassword123!',
      displayName: 'Jeevan Hero B',
    });
    testUserB = regB.user;
    tokenB = regB.accessToken;
    console.log('   ✅ Test users created with character stats.');

    // -------------------------------------------------------------
    // Test 3: AI / Suggestion Endpoint
    // -------------------------------------------------------------
    console.log('3. Testing /api/v1/quests/suggestions endpoint...');
    const suggRes = await fetch(`${baseUrl}/quests/suggestions?questType=weekly&category=fitness`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(suggRes.status, 200);
    const suggJson = await suggRes.json();
    assert.equal(suggJson.success, true);
    assert.ok(Array.isArray(suggJson.data.suggestions));
    assert.ok(suggJson.data.suggestions.length > 0);
    const firstSugg = suggJson.data.suggestions[0];
    assert.ok(firstSugg.title);
    assert.ok(firstSugg.suggestedRewards.xp > 0);
    console.log('   ✅ Suggestions endpoint returned valid quest templates.');

    // -------------------------------------------------------------
    // Test 4: Active Quest Limits & Concurrency (Advisory Lock)
    // -------------------------------------------------------------
    console.log('4. Testing concurrent active quest limits with advisory lock (max 3 weekly)...');
    // Launch 5 simultaneous creation requests for weekly quests
    const concurrentPayloads = [1, 2, 3, 4, 5].map((i) =>
      fetch(`${baseUrl}/quests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          title: `Concurrent Weekly Quest ${i}`,
          questType: 'weekly',
          category: 'productivity',
          difficulty: 'medium',
          progressMode: 'count',
          targetValue: 5,
        }),
      })
    );

    const responses = await Promise.all(concurrentPayloads);
    const statuses = responses.map((r) => r.status);
    const successCount = statuses.filter((s) => s === 201).length;
    const limitHitCount = statuses.filter((s) => s === 409).length;

    console.log(`   Concurrent response statuses: ${statuses.join(', ')}`);
    assert.equal(successCount, 3, 'Exactly 3 weekly quests must succeed');
    assert.equal(limitHitCount, 2, 'Exactly 2 weekly quests must be rejected with 409');

    // Sequential attempt to create a 4th weekly quest must also fail with 409
    const fourthRes = await fetch(`${baseUrl}/quests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Fourth Weekly Quest',
        questType: 'weekly',
        category: 'fitness',
        difficulty: 'medium',
        progressMode: 'count',
        targetValue: 5,
      }),
    });
    assert.equal(fourthRes.status, 409);
    const fourthJson = await fourthRes.json();
    assert.equal(fourthJson.error?.code || fourthJson.code, 'QUEST_LIMIT_REACHED');
    console.log('   ✅ Active limits concurrency and rejection verified.');

    // -------------------------------------------------------------
    // Test 5: Custom Reward Bounds Validation via API
    // -------------------------------------------------------------
    console.log('5. Testing custom reward bounds validation (50% - 150%)...');
    // Base weekly medium = 200 XP, 40 coins.
    // Try 5000 XP (> 150% max)
    const highXpRes = await fetch(`${baseUrl}/quests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Too Greedy Quest',
        questType: 'monthly',
        category: 'wellness',
        difficulty: 'medium',
        rewardXp: 5000,
        rewardCoins: 400,
        progressMode: 'count',
        targetValue: 10,
      }),
    });
    assert.equal(highXpRes.status, 400);
    const highXpJson = await highXpRes.json();
    assert.equal(highXpJson.error?.code || highXpJson.code, 'INVALID_REWARD_BOUNDS');

    // Create valid monthly quest within bounds (Monthly medium base: 800 XP, 400 coins. Allowable: 400-1200 XP, 200-600 coins)
    const validMonthlyRes = await fetch(`${baseUrl}/quests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Valid Monthly Quest',
        questType: 'monthly',
        category: 'learning',
        difficulty: 'medium',
        rewardXp: 900,
        rewardCoins: 180,
        progressMode: 'count',
        targetValue: 10,
      }),
    });
    assert.equal(validMonthlyRes.status, 201);
    const validMonthlyJson = await validMonthlyRes.json();
    assert.equal(validMonthlyJson.data.rewardXp, 900);
    assert.equal(validMonthlyJson.data.rewardCoins, 180);
    console.log('   ✅ Reward bounds enforcement and valid custom creation verified.');

    // -------------------------------------------------------------
    // Test 6: Count-Based Progress & Duplicate Event Idempotency
    // -------------------------------------------------------------
    console.log('6. Testing count-based progress & duplicate event idempotency...');
    // Create count-based quest for User B
    const bQuestRes = await fetch(`${baseUrl}/quests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        title: 'Run 4 Times',
        questType: 'weekly',
        category: 'fitness',
        difficulty: 'easy',
        progressMode: 'count',
        targetValue: 4,
      }),
    });
    assert.equal(bQuestRes.status, 201);
    const bQuest = (await bQuestRes.json()).data;

    // Check User B initial stats
    const statsInit = (await query('SELECT xp, gold FROM character_stats WHERE user_id = $1', [testUserB.id])).rows[0];
    const initialXp = statsInit.xp;
    const initialGold = statsInit.gold;

    // Record progress 1 with eventId 'run-session-1'
    const prog1Res = await fetch(`${baseUrl}/quests/${bQuest.id}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        increment: 1,
        eventId: 'run-session-1',
      }),
    });
    assert.equal(prog1Res.status, 200);
    const prog1Json = await prog1Res.json();
    assert.equal(prog1Json.data.currentValue, 1);
    assert.equal(prog1Json.data.status, 'active');

    // Duplicate submission with same eventId 'run-session-1'
    const dupRes = await fetch(`${baseUrl}/quests/${bQuest.id}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        increment: 1,
        eventId: 'run-session-1',
      }),
    });
    assert.equal(dupRes.status, 200);
    const dupJson = await dupRes.json();
    assert.equal(dupJson.data.currentValue, 1, 'Duplicate event must NOT increment progress');
    assert.equal(dupJson.data.idempotentDuplicate, true);

    // Record progress 2 with eventId 'run-session-2' (hits 50% milestone: 2/4 = 50%)
    const prog2Res = await fetch(`${baseUrl}/quests/${bQuest.id}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        increment: 1,
        eventId: 'run-session-2',
      }),
    });
    assert.equal(prog2Res.status, 200);
    const prog2Json = await prog2Res.json();
    assert.equal(prog2Json.data.currentValue, 2);
    assert.ok(prog2Json.data.milestoneHit, '50% milestone must be triggered');

    // Record progress to 4 (completion)
    const prog3Res = await fetch(`${baseUrl}/quests/${bQuest.id}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        increment: 2,
        eventId: 'run-session-3',
      }),
    });
    assert.equal(prog3Res.status, 200);
    const prog3Json = await prog3Res.json();
    assert.equal(prog3Json.data.currentValue, 4);
    assert.equal(prog3Json.data.status, 'completed');
    assert.ok(prog3Json.data.questCompleted, 'Quest must auto-complete at 100%');

    // Check stats increased
    const statsAfter = (await query('SELECT xp, gold FROM character_stats WHERE user_id = $1', [testUserB.id])).rows[0];
    assert.ok(statsAfter.xp > initialXp, 'XP must have increased upon milestones and completion');
    assert.ok(statsAfter.gold > initialGold, 'Gold must have increased');

    // Progress on already completed quest should return 409
    const progOverRes = await fetch(`${baseUrl}/quests/${bQuest.id}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        increment: 1,
        eventId: 'run-session-4',
      }),
    });
    assert.equal(progOverRes.status, 409);
    console.log('   ✅ Count progress, event idempotency, milestones, and auto-completion verified.');

    // -------------------------------------------------------------
    // Test 7: Task-Based Progress Derived from Linked Tasks
    // -------------------------------------------------------------
    console.log('7. Testing task-based progress derived from linked tasks...');
    // Create task-mode quest for User B
    const taskQuestRes = await fetch(`${baseUrl}/quests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        title: 'Ship Feature Quests',
        questType: 'weekly',
        category: 'productivity',
        difficulty: 'medium',
        progressMode: 'task',
        targetValue: 2,
      }),
    });
    assert.equal(taskQuestRes.status, 201);
    const taskQuest = (await taskQuestRes.json()).data;

    // Create 2 tasks linked to this quest
    const t1Res = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        title: 'Write Quests API',
        questId: taskQuest.id,
      }),
    });
    assert.equal(t1Res.status, 201);
    const t1 = (await t1Res.json()).data;

    const t2Res = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        title: 'Write Quests Frontend',
        questId: taskQuest.id,
      }),
    });
    assert.equal(t2Res.status, 201);
    const t2 = (await t2Res.json()).data;

    // Complete Task 1
    const compT1 = await fetch(`${baseUrl}/tasks/${t1.id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(compT1.status, 200);

    // Verify quest progress is now 1
    const checkQ1 = await fetch(`${baseUrl}/quests/${taskQuest.id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const q1Data = (await checkQ1.json()).data;
    assert.equal(q1Data.currentValue, 1);
    assert.equal(q1Data.status, 'active');

    // Complete Task 2 -> should complete quest
    const compT2 = await fetch(`${baseUrl}/tasks/${t2.id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(compT2.status, 200);

    const checkQ2 = await fetch(`${baseUrl}/quests/${taskQuest.id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const q2Data = (await checkQ2.json()).data;
    assert.equal(q2Data.currentValue, 2);
    assert.equal(q2Data.status, 'completed');
    console.log('   ✅ Task-based quest progress syncing and auto-completion verified.');

    // -------------------------------------------------------------
    // Test 8: Expiration Processing & Extension Recovery
    // -------------------------------------------------------------
    console.log('8. Testing background expiration and extension recovery...');
    // Create an overdue quest for User B
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const overdueRes = await fetch(`${baseUrl}/quests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        title: 'Overdue Quest',
        questType: 'weekly',
        category: 'personal_growth',
        difficulty: 'medium',
        dueDate: pastDate,
        progressMode: 'count',
        targetValue: 5,
      }),
    });
    assert.equal(overdueRes.status, 201);
    const overdueQuest = (await overdueRes.json()).data;

    // Run expiration processor
    const expResult = await questService.expireOverdueQuestsAcrossUsers();
    assert.ok((expResult.expiredCount ?? expResult) >= 1, 'At least 1 quest should be expired');

    // Check status is now 'expired'
    const expiredCheck = await fetch(`${baseUrl}/quests/${overdueQuest.id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const expiredData = (await expiredCheck.json()).data;
    assert.equal(expiredData.status, 'expired');

    // Extend the expired quest
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const extendRes = await fetch(`${baseUrl}/quests/${overdueQuest.id}/extend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        newDueDate: futureDate,
        reason: 'Needed extra days to wrap up',
      }),
    });
    assert.equal(extendRes.status, 200);
    const extendedData = (await extendRes.json()).data;
    assert.equal(extendedData.status, 'active');
    assert.equal(extendedData.dueDate, futureDate);
    assert.ok(extendedData.extensions.length >= 1);
    assert.equal(extendedData.extensions[0].reason, 'Needed extra days to wrap up');
    console.log('   ✅ Expiration background worker and extension recovery verified.');

    // -------------------------------------------------------------
    // Test 9: Strict Tenant Isolation
    // -------------------------------------------------------------
    console.log('9. Testing strict tenant isolation...');
    // User B tries to access User A's quest
    const listAJson = await (await fetch(`${baseUrl}/quests`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    })).json();
    const questsA = Array.isArray(listAJson.data) ? listAJson.data : listAJson.data.quests;
    const userAQuestId = questsA[0]?.id;
    assert.ok(userAQuestId);

    const stealGet = await fetch(`${baseUrl}/quests/${userAQuestId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(stealGet.status, 404);

    const stealProg = await fetch(`${baseUrl}/quests/${userAQuestId}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ increment: 1 }),
    });
    assert.equal(stealProg.status, 404);

    const stealExtend = await fetch(`${baseUrl}/quests/${userAQuestId}/extend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ newDueDate: futureDate, reason: 'Unauthorized' }),
    });
    assert.equal(stealExtend.status, 404);

    const stealCancel = await fetch(`${baseUrl}/quests/${userAQuestId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(stealCancel.status, 404);
    console.log('   ✅ Strict tenant isolation verified (404 on all unauthorized cross-tenant operations).');

    // -------------------------------------------------------------
    // Test 10: Quest Cancellation & Active Limit Slot Freeing
    // -------------------------------------------------------------
    console.log('10. Testing quest cancellation & active quota slot freeing...');
    // User A currently has 3 active weekly quests. Let's cancel one.
    const cancelRes = await fetch(`${baseUrl}/quests/${userAQuestId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(cancelRes.status, 200);
    const cancelData = (await cancelRes.json()).data;
    assert.equal(cancelData.status, 'cancelled');

    // Now User A has 2 active weekly quests, so creating a new weekly quest should succeed!
    const createAfterCancel = await fetch(`${baseUrl}/quests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'New Weekly Quest After Cancel',
        questType: 'weekly',
        category: 'career',
        difficulty: 'medium',
        progressMode: 'count',
        targetValue: 3,
      }),
    });
    assert.equal(createAfterCancel.status, 201);
    console.log('   ✅ Quest cancellation transitions status and frees active slot properly.');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(' 🎉 All Jeevan Quests Integration Tests Passed!        ');
    console.log('═══════════════════════════════════════════════════════\n');
  } finally {
    // Cleanup test users
    if (testUserA) {
      await query('DELETE FROM users WHERE id = $1', [testUserA.id]).catch(() => {});
    }
    if (testUserB) {
      await query('DELETE FROM users WHERE id = $1', [testUserB.id]).catch(() => {});
    }
    server.close();
  }
}

runJeevanQuestsTestSuite()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  });
