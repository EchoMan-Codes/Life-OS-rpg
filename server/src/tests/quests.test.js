import assert from 'node:assert/strict';
import http from 'node:http';

import app from '../app.js';
import { query } from '../db/pool.js';
import { AuthService } from '../services/auth.service.js';
import { calculateQuestReward, CHECKLIST_ITEM_REWARD, MILESTONE_REWARDS, QUEST_REWARDS } from '../services/reward-table.js';

const authService = new AuthService();

async function runQuestsTestSuite() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log(' Starting Phase 3.3 Quests & Milestones Test Suite     ');
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
    // Test 1: Reward Constants & Formulas
    // -------------------------------------------------------------
    console.log('1. Testing Quest, Checklist, and Milestone reward constants...');
    assert.deepEqual(CHECKLIST_ITEM_REWARD, { xp: 2, gold: 1 });
    assert.deepEqual(MILESTONE_REWARDS[25], { xp: 5, gold: 2 });
    assert.deepEqual(MILESTONE_REWARDS[50], { xp: 10, gold: 4 });
    assert.deepEqual(MILESTONE_REWARDS[75], { xp: 15, gold: 6 });
    assert.deepEqual(MILESTONE_REWARDS[100], { xp: 20, gold: 8 });

    assert.deepEqual(calculateQuestReward('trivial'), { xp: 10, gold: 5 });
    assert.deepEqual(calculateQuestReward('easy'), { xp: 20, gold: 10 });
    assert.deepEqual(calculateQuestReward('medium'), { xp: 35, gold: 18 });
    assert.deepEqual(calculateQuestReward('hard'), { xp: 60, gold: 30 });
    console.log('   ✅ Quest reward constants and formulas verified.');

    // -------------------------------------------------------------
    // Test 2: User Setup
    // -------------------------------------------------------------
    console.log('2. Setting up test users User A and User B...');
    const emailA = `quest-user-a-${Date.now()}@lifeos.game`;
    const emailB = `quest-user-b-${Date.now()}@lifeos.game`;

    const regA = await authService.register({
      email: emailA,
      password: 'StrongPassword123!',
      displayName: 'Quest Hero A',
    });
    testUserA = regA.user;
    tokenA = regA.accessToken;

    const regB = await authService.register({
      email: emailB,
      password: 'StrongPassword123!',
      displayName: 'Quest Hero B',
    });
    testUserB = regB.user;
    tokenB = regB.accessToken;

    console.log('   ✅ Test users created with auto-initialized character stats.');

    // -------------------------------------------------------------
    // Test 3: Quest CRUD & Zod Validation
    // -------------------------------------------------------------
    console.log('3. Testing Quest CRUD and Zod schema validation...');

    // Missing title -> 400
    const badRes1 = await fetch(`${baseUrl}/quests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ priority: 'high' }),
    });
    assert.equal(badRes1.status, 400);

    // Invalid priority -> 400
    const badRes2 = await fetch(`${baseUrl}/quests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Invalid Quest', priority: 'ultra' }),
    });
    assert.equal(badRes2.status, 400);

    // Invalid difficulty -> 400
    const badRes3 = await fetch(`${baseUrl}/quests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Invalid Quest', difficulty: 'impossible' }),
    });
    assert.equal(badRes3.status, 400);

    // Invalid dueDate -> 400
    const badRes4 = await fetch(`${baseUrl}/quests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Invalid Quest', dueDate: 'not-a-date' }),
    });
    assert.equal(badRes4.status, 400);

    // Create valid quest with initial items
    const createRes = await fetch(`${baseUrl}/quests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Master PostgreSQL Migrations',
        description: 'Deep architectural study of transactional schema changes.',
        priority: 'high',
        difficulty: 'medium',
        dueDate: '2026-10-01',
        items: [
          'Read PostgreSQL advisory locks docs',
          'Write repeatable DDL migrations',
        ],
      }),
    });
    assert.equal(createRes.status, 201);
    const { data: quest1 } = await createRes.json();
    assert.equal(quest1.title, 'Master PostgreSQL Migrations');
    assert.equal(quest1.priority, 'high');
    assert.equal(quest1.difficulty, 'medium');
    assert.equal(quest1.status, 'active');
    assert.equal(quest1.items.length, 2);
    assert.equal(quest1.milestones.length, 4);
    assert.equal(quest1.progressPercent, 0);

    // Get quest by ID
    const getRes = await fetch(`${baseUrl}/quests/${quest1.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(getRes.status, 200);
    const { data: fetchedQuest } = await getRes.json();
    assert.equal(fetchedQuest.id, quest1.id);

    // Update quest
    const updateRes = await fetch(`${baseUrl}/quests/${quest1.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Master PostgreSQL & Neon Migrations',
        priority: 'critical',
      }),
    });
    assert.equal(updateRes.status, 200);
    const { data: updatedQuest } = await updateRes.json();
    assert.equal(updatedQuest.title, 'Master PostgreSQL & Neon Migrations');
    assert.equal(updatedQuest.priority, 'critical');

    console.log('   ✅ Quest CRUD and Zod schema validation verified.');

    // -------------------------------------------------------------
    // Test 4: Strict Tenant Isolation
    // -------------------------------------------------------------
    console.log('4. Testing strict tenant isolation...');

    // User B cannot GET User A's quest
    const isoGet = await fetch(`${baseUrl}/quests/${quest1.id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(isoGet.status, 404);

    // User B cannot PATCH User A's quest
    const isoPatch = await fetch(`${baseUrl}/quests/${quest1.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ title: 'Hacked Quest Title' }),
    });
    assert.equal(isoPatch.status, 404);

    // User B cannot DELETE User A's quest
    const isoDelete = await fetch(`${baseUrl}/quests/${quest1.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(isoDelete.status, 404);

    // User B cannot add subtasks to User A's quest
    const isoAddItem = await fetch(`${baseUrl}/quests/${quest1.id}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ title: 'Infiltrator item' }),
    });
    assert.equal(isoAddItem.status, 404);

    console.log('   ✅ Tenant isolation verified: User B received 404 for all User A resources.');

    // -------------------------------------------------------------
    // Test 5: Checklist Subtasks CRUD & Ordering
    // -------------------------------------------------------------
    console.log('5. Testing Checklist subtasks CRUD & reordering...');

    // Add item 3
    const addItemRes = await fetch(`${baseUrl}/quests/${quest1.id}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Test rollback script with --down' }),
    });
    assert.equal(addItemRes.status, 201);
    const { data: item3 } = await addItemRes.json();
    assert.equal(item3.title, 'Test rollback script with --down');
    assert.equal(item3.isComplete, false);

    // Update item 3 title
    const updateItemRes = await fetch(`${baseUrl}/quests/${quest1.id}/items/${item3.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Verify rollback script with --down' }),
    });
    assert.equal(updateItemRes.status, 200);
    const { data: updatedItem3 } = await updateItemRes.json();
    assert.equal(updatedItem3.title, 'Verify rollback script with --down');

    // Add temporary item 4 to test deletion
    const addTempRes = await fetch(`${baseUrl}/quests/${quest1.id}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Temporary Item to delete' }),
    });
    assert.equal(addTempRes.status, 201);
    const { data: tempItem } = await addTempRes.json();

    // Delete temporary item
    const delItemRes = await fetch(`${baseUrl}/quests/${quest1.id}/items/${tempItem.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(delItemRes.status, 200);

    // Reorder items
    const { data: currentQuestState } = await (await fetch(`${baseUrl}/quests/${quest1.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    })).json();
    assert.equal(currentQuestState.items.length, 3);
    const reversedIds = currentQuestState.items.map((i) => i.id).reverse();

    const reorderRes = await fetch(`${baseUrl}/quests/${quest1.id}/items/reorder`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ orderedIds: reversedIds }),
    });
    assert.equal(reorderRes.status, 200);

    const { data: reorderedQuest } = await (await fetch(`${baseUrl}/quests/${quest1.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    })).json();
    assert.equal(reorderedQuest.items[0].id, reversedIds[0]);

    console.log('   ✅ Checklist CRUD and subtask reordering verified.');

    // -------------------------------------------------------------
    // Test 6: Checklist Item Completion & Progression Integration
    // -------------------------------------------------------------
    console.log('6. Testing item completion rewards (+2 XP, +1 Gold) & audit tracking...');

    const initialStats = (await query('SELECT xp, gold FROM character_stats WHERE user_id = $1', [testUserA.id])).rows[0];

    const targetItem = reorderedQuest.items[0];
    const completeItemRes = await fetch(`${baseUrl}/quests/${quest1.id}/items/${targetItem.id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(completeItemRes.status, 200);
    const itemCompletePayload = await completeItemRes.json();
    assert.equal(itemCompletePayload.data.itemId, targetItem.id);
    assert.ok(itemCompletePayload.data.rewardsAwarded.some((r) => r.type === 'item' && r.xp === 2 && r.gold === 1));

    // Check DB character stats updated (item +2 XP, +1 Gold AND 25% milestone +5 XP, +2 Gold = +7 XP, +3 Gold)
    const updatedStats = (await query('SELECT xp, gold FROM character_stats WHERE user_id = $1', [testUserA.id])).rows[0];
    assert.equal(updatedStats.xp, initialStats.xp + 7);
    assert.equal(updatedStats.gold, initialStats.gold + 3);

    // Check quest_completions audit record
    const auditRes = await query(
      `SELECT * FROM quest_completions WHERE item_id = $1 AND action_type = 'item_complete'`,
      [targetItem.id]
    );
    assert.equal(auditRes.rows.length, 1);
    assert.equal(auditRes.rows[0].xp_awarded, 2);
    assert.equal(auditRes.rows[0].gold_awarded, 1);

    // Duplicate item completion rejected with 409
    const dupItemRes = await fetch(`${baseUrl}/quests/${quest1.id}/items/${targetItem.id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(dupItemRes.status, 409);

    console.log('   ✅ Item completion rewards and duplicate 409 protection verified.');

    // -------------------------------------------------------------
    // Test 7: Item Undo & Safe Progression Reversal
    // -------------------------------------------------------------
    console.log('7. Testing safe item undo with revertReward()...');

    const undoItemRes = await fetch(`${baseUrl}/quests/${quest1.id}/items/${targetItem.id}/undo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(undoItemRes.status, 200);
    const undoPayload = await undoItemRes.json();
    assert.equal(undoPayload.data.progressPercent, 0);

    // DB character stats should revert the item reward (+2 XP, +1 Gold),
    // but the 25% milestone reward (+5 XP, +2 Gold) is permanently retained!
    const revertedStats = (await query('SELECT xp, gold FROM character_stats WHERE user_id = $1', [testUserA.id])).rows[0];
    assert.equal(revertedStats.xp, initialStats.xp + 5);
    assert.equal(revertedStats.gold, initialStats.gold + 2);

    // Audit completion deleted
    const postUndoAudit = await query(
      `SELECT * FROM quest_completions WHERE item_id = $1 AND action_type = 'item_complete'`,
      [targetItem.id]
    );
    assert.equal(postUndoAudit.rows.length, 0);

    console.log('   ✅ Item undo progression reversal verified.');

    // -------------------------------------------------------------
    // Test 8: Milestones (25%, 50%, 75%, 100%) & Parent Quest Auto-Completion
    // -------------------------------------------------------------
    console.log('8. Testing milestone thresholds (25%, 50%, 75%, 100%) and parent auto-completion...');

    // Create a fresh 4-item quest for User A (each item = 25% progress)
    const q4Res = await fetch(`${baseUrl}/quests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Four-Step Hero Trial',
        difficulty: 'medium', // Base completion reward: 35 XP, 18 Gold
        items: [
          'Trial Step 1',
          'Trial Step 2',
          'Trial Step 3',
          'Trial Step 4',
        ],
      }),
    });
    assert.equal(q4Res.status, 201);
    const { data: quest4 } = await q4Res.json();
    assert.equal(quest4.items.length, 4);

    const statsBefore = (await query('SELECT xp, gold FROM character_stats WHERE user_id = $1', [testUserA.id])).rows[0];

    // Step 1: 1/4 = 25% -> Item (+2 XP, +1 G) + 25% Milestone (+5 XP, +2 G) = +7 XP, +3 Gold
    const step1 = await (await fetch(`${baseUrl}/quests/${quest4.id}/items/${quest4.items[0].id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    })).json();
    assert.equal(step1.data.progressPercent, 25);
    assert.ok(step1.data.rewardsAwarded.some((r) => r.type === 'milestone' && r.xp === 5));

    // Step 2: 2/4 = 50% -> Item (+2 XP, +1 G) + 50% Milestone (+10 XP, +4 G) = +12 XP, +5 Gold
    const step2 = await (await fetch(`${baseUrl}/quests/${quest4.id}/items/${quest4.items[1].id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    })).json();
    assert.equal(step2.data.progressPercent, 50);
    assert.ok(step2.data.rewardsAwarded.some((r) => r.type === 'milestone' && r.xp === 10));

    // Step 3: 3/4 = 75% -> Item (+2 XP, +1 G) + 75% Milestone (+15 XP, +6 G) = +17 XP, +7 Gold
    const step3 = await (await fetch(`${baseUrl}/quests/${quest4.id}/items/${quest4.items[2].id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    })).json();
    assert.equal(step3.data.progressPercent, 75);
    assert.ok(step3.data.rewardsAwarded.some((r) => r.type === 'milestone' && r.xp === 15));

    // Step 4: 4/4 = 100% -> Item (+2 XP, +1 G) + 100% Milestone (+20 XP, +8 G) + Parent Quest Completion (+35 XP, +18 G)
    const step4 = await (await fetch(`${baseUrl}/quests/${quest4.id}/items/${quest4.items[3].id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    })).json();
    assert.equal(step4.data.progressPercent, 100);
    assert.equal(step4.data.parentCompleted, true);
    assert.ok(step4.data.rewardsAwarded.some((r) => r.type === 'quest_complete' && r.xp === 35 && r.gold === 18));
    assert.ok(step4.data.rewardsAwarded.some((r) => r.type === 'milestone' && r.xp === 20));

    // Verify parent quest status in DB
    const finalQuestRow = (await query('SELECT status, completed_at FROM quests WHERE id = $1', [quest4.id])).rows[0];
    assert.equal(finalQuestRow.status, 'completed');
    assert.ok(finalQuestRow.completed_at !== null);

    // Verify total rewards granted matches exact sum:
    // Items: 4 * (2 XP, 1 G) = 8 XP, 4 G
    // Milestones: (5+10+15+20) = 50 XP, (2+4+6+8) = 20 G
    // Parent Quest: 35 XP, 18 G
    // Total: 93 XP, 42 Gold
    const statsAfter = (await query('SELECT xp, gold FROM character_stats WHERE user_id = $1', [testUserA.id])).rows[0];
    const totalXpGained = statsAfter.xp - statsBefore.xp;
    const totalGoldGained = statsAfter.gold - statsBefore.gold;
    assert.equal(totalXpGained, 93);
    assert.equal(totalGoldGained, 42);

    console.log('   ✅ Milestones and auto-completion stacking rewards verified.');

    // -------------------------------------------------------------
    // Test 9: Parent Quest Reward Idempotency
    // -------------------------------------------------------------
    console.log('9. Testing parent quest completion idempotency & 409 rejection...');

    const dupParentRes = await fetch(`${baseUrl}/quests/${quest4.id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(dupParentRes.status, 409);

    // Database unique constraint test: trying to insert duplicate quest_complete row fails
    await assert.rejects(async () => {
      await query(
        `INSERT INTO quest_completions (quest_id, user_id, action_type, xp_awarded, gold_awarded)
         VALUES ($1, $2, 'quest_complete', 35, 18)`,
        [quest4.id, testUserA.id]
      );
    });

    console.log('   ✅ Parent quest completion idempotency verified.');

    // -------------------------------------------------------------
    // Test 10: Direct Completion for Zero-Item Quests
    // -------------------------------------------------------------
    console.log('10. Testing direct completion for zero-subtask quests...');

    const zeroRes = await fetch(`${baseUrl}/quests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Single Milestone Quest',
        difficulty: 'easy', // 20 XP, 10 Gold
        items: [],
      }),
    });
    assert.equal(zeroRes.status, 201);
    const { data: zeroQuest } = await zeroRes.json();
    assert.equal(zeroQuest.items.length, 0);

    const directCompleteRes = await fetch(`${baseUrl}/quests/${zeroQuest.id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(directCompleteRes.status, 200);
    const directPayload = await directCompleteRes.json();
    assert.equal(directPayload.data.parentCompleted, true);

    const zeroQuestDb = (await query('SELECT status FROM quests WHERE id = $1', [zeroQuest.id])).rows[0];
    assert.equal(zeroQuestDb.status, 'completed');

    console.log('   ✅ Direct completion for zero-item quests verified.');

    // -------------------------------------------------------------
    // Test 11: Concurrent Item & Quest Completion Serialization
    // -------------------------------------------------------------
    console.log('11. Testing concurrent complete requests serialization (SELECT ... FOR UPDATE)...');

    // Create a quest with 1 item
    const concRes = await fetch(`${baseUrl}/quests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Race Condition Duel',
        difficulty: 'hard',
        items: ['Fast click test'],
      }),
    });
    const { data: concQuest } = await concRes.json();
    const concItemId = concQuest.items[0].id;

    // Fire 2 concurrent item completions in parallel
    const [cRes1, cRes2] = await Promise.all([
      fetch(`${baseUrl}/quests/${concQuest.id}/items/${concItemId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
      }),
      fetch(`${baseUrl}/quests/${concQuest.id}/items/${concItemId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
      }),
    ]);

    const statuses = [cRes1.status, cRes2.status].sort();
    assert.deepEqual(statuses, [200, 409]);

    // Check that quest completion only has 1 quest_complete record
    const compRows = (await query(
      `SELECT * FROM quest_completions WHERE quest_id = $1 AND action_type = 'quest_complete'`,
      [concQuest.id]
    )).rows;
    assert.equal(compRows.length, 1);

    console.log('   ✅ Concurrent completion serialization verified (zero lost updates, zero double-grants).');

    // -------------------------------------------------------------
    // Test 12: Quest Reordering & Archiving
    // -------------------------------------------------------------
    console.log('12. Testing quest reordering and soft deletion (archive)...');

    // Archive quest
    const archiveRes = await fetch(`${baseUrl}/quests/${zeroQuest.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(archiveRes.status, 200);

    const activeList = await (await fetch(`${baseUrl}/quests?status=active`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    })).json();
    assert.ok(!activeList.data.some((q) => q.id === zeroQuest.id));

    console.log('   ✅ Quest archiving and status filters verified.');

    // -------------------------------------------------------------
    // Test 13: Cleanup & Cascading Deletes
    // -------------------------------------------------------------
    console.log('13. Cleaning up test rows and testing cascade deletes...');
    await query('DELETE FROM users WHERE id IN ($1, $2)', [testUserA.id, testUserB.id]);

    const leftoverQuests = await query('SELECT count(*) FROM quests WHERE user_id = $1', [testUserA.id]);
    assert.equal(parseInt(leftoverQuests.rows[0].count, 10), 0);

    const leftoverItems = await query('SELECT count(*) FROM quest_items WHERE user_id = $1', [testUserA.id]);
    assert.equal(parseInt(leftoverItems.rows[0].count, 10), 0);

    console.log('   ✅ Cascade cleanup verified.');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(' 🎉 All Phase 3.3 Quests Integration Tests Passed!    ');
    console.log('═══════════════════════════════════════════════════════\n');
  } finally {
    server.close();
  }
}

runQuestsTestSuite().catch((err) => {
  console.error('\n❌ Quests Test Suite Failed:\n', err);
  process.exit(1);
});
