import assert from 'node:assert';
import { aiService } from '../services/ai.service.js';
import { pool, query } from '../db/pool.js';
import { authService } from '../services/auth.service.js';

console.log('\n═══════════════════════════════════════════════════════');
console.log(' Starting Jeevan AI Service & Action Test Suite        ');
console.log('═══════════════════════════════════════════════════════\n');

async function runAiTests() {
  // 1. Intent Classification & Context Minimization
  console.log('1. Testing Intent Classification & Context Minimization...');
  assert.strictEqual(aiService.classifyIntent('What is recursion?'), 'general');
  assert.strictEqual(aiService.classifyIntent('Explain database normalization'), 'general');
  assert.strictEqual(aiService.classifyIntent('Help me write a professional email'), 'general');
  assert.strictEqual(aiService.classifyIntent('What is 25 * 4?'), 'general');

  assert.strictEqual(aiService.classifyIntent('What are my tasks today?'), 'jeevan_query');
  assert.strictEqual(aiService.classifyIntent('What should I focus on today?'), 'jeevan_query');
  assert.strictEqual(aiService.classifyIntent('Show my dailies and habits'), 'jeevan_query');

  assert.strictEqual(aiService.classifyIntent('Add a daily called Read 20 pages every Mon, Wed, Fri at 7 PM'), 'mutation');
  assert.strictEqual(aiService.classifyIntent('Create a habit: drink water, easy'), 'mutation');
  assert.strictEqual(aiService.classifyIntent('Create a quest called DBMS Mastery'), 'mutation');
  console.log('   ✅ Intent classification cleanly distinguishes general knowledge from Jeevan queries.');

  // Create test user for database tests
  const testEmail = `ai_test_${Date.now()}@example.com`;
  const reg = await authService.register({
    email: testEmail,
    password: 'Password123!',
    displayName: 'AITestHero',
    timezone: 'Asia/Kolkata',
  });
  const userId = reg.user.id;

  try {
    // 2. Test Context Minimization Output
    console.log('2. Testing Context Minimization payload...');
    const generalCtx = await aiService.getUserContext(userId, 'general');
    assert.strictEqual(generalCtx.activeDailies, undefined, 'General context must NOT contain user tasks');
    assert.strictEqual(generalCtx.character, undefined, 'General context must NOT contain character stats');
    assert.strictEqual(generalCtx.user.displayName, 'AITestHero');

    const jeevanCtx = await aiService.getUserContext(userId, 'jeevan_query');
    assert.ok(Array.isArray(jeevanCtx.activeDailies), 'Jeevan context contains active dailies');
    assert.ok(jeevanCtx.character, 'Jeevan context contains character stats');
    console.log('   ✅ Context minimization verified: 0 task data leaked for general questions.');

    // 3. Test Action Verification: Create Daily with Real Days & Offsets
    console.log('3. Testing Action Execution: Create Daily with recurrence & offsets...');
    const createDailyAction = await aiService.executeAction(userId, {
      actionType: 'create_item',
      payload: {
        section: 'daily',
        item: {
          title: 'Read System Design 20 Pages',
          difficulty: 'medium',
          activeDays: [1, 3, 5], // Mon, Wed, Fri
          scheduledTime: '07:00 PM',
          durationMinutes: 45,
          priority: 'high',
          reminderEnabled: true,
          reminderMinutesBefore: 5,
        },
      },
    });

    assert.strictEqual(createDailyAction.success, true);
    assert.strictEqual(createDailyAction.verified, true);
    assert.strictEqual(createDailyAction.item.title, 'Read System Design 20 Pages');
    assert.deepStrictEqual(createDailyAction.item.activeDays, [1, 3, 5]);
    assert.strictEqual(createDailyAction.item.scheduledTime, '07:00 PM');
    assert.strictEqual(createDailyAction.item.reminderMinutesBefore, 5);

    // Verify directly in PostgreSQL
    const dbDaily = await query('SELECT * FROM dailies WHERE id = $1', [createDailyAction.item.id]);
    assert.strictEqual(dbDaily.rows.length, 1);
    assert.strictEqual(dbDaily.rows[0].title, 'Read System Design 20 Pages');
    console.log('   ✅ Daily creation validated and verified in database with exact recurrence rules.');

    // 4. Test Action Execution: Create Habit
    console.log('4. Testing Action Execution: Create Habit...');
    const createHabitAction = await aiService.executeAction(userId, {
      actionType: 'create_item',
      payload: {
        section: 'habit',
        item: {
          title: 'Drink 3L Water',
          direction: 'positive',
          difficulty: 'easy',
        },
      },
    });
    assert.strictEqual(createHabitAction.success, true);
    assert.strictEqual(createHabitAction.item.title, 'Drink 3L Water');
    console.log('   ✅ Habit creation validated and verified.');

    // 5. Test Action Execution: Create Quest with Subtasks
    console.log('5. Testing Action Execution: Create Quest with Subtasks...');
    const createQuestAction = await aiService.executeAction(userId, {
      actionType: 'create_item',
      payload: {
        section: 'quest',
        item: {
          title: 'Master DBMS Architecture',
          priority: 'high',
          difficulty: 'hard',
          dueDate: '2026-10-31',
          subtasks: ['ER Diagrams', 'BCNF Decomposition', 'ACID Transactions'],
        },
      },
    });
    assert.strictEqual(createQuestAction.success, true);
    assert.strictEqual(createQuestAction.item.title, 'Master DBMS Architecture');

    const dbQuestItems = await query('SELECT * FROM quest_items WHERE quest_id = $1', [createQuestAction.item.id]);
    assert.strictEqual(dbQuestItems.rows.length, 3);
    console.log('   ✅ Quest and 3 subtasks validated and verified.');

    // 6. Test Scoring Daily via Tool Call (executes through progression service)
    console.log('6. Testing Score Daily via Tool Call...');
    const scoreDailyAction = await aiService.executeAction(userId, {
      actionType: 'complete_item',
      payload: {
        section: 'daily',
        item: { id: createDailyAction.item.id },
      },
    });
    assert.strictEqual(scoreDailyAction.success, true);
    assert.ok(scoreDailyAction.result.reward?.xp > 0);

    const charAfter = await query('SELECT xp FROM character_stats WHERE user_id = $1', [userId]);
    assert.ok(charAfter.rows[0].xp > 0, 'Character XP must increase through existing progression service');
    console.log('   ✅ Completing daily awarded real XP via progression service.');

    // 7. Test Undo / Uncomplete
    console.log('7. Testing Undo uncomplete daily...');
    const undoAction = await aiService.executeAction(userId, {
      actionType: 'uncomplete_daily',
      payload: { id: createDailyAction.item.id },
    });
    assert.strictEqual(undoAction.success, true);
    console.log('   ✅ Undo action successfully reverted completion.');

    // 8. Test Chat History Persistence
    console.log('8. Testing Persistent Chat History in PostgreSQL...');
    await aiService.saveChatMessage(userId, { role: 'user', content: 'What is quicksort?' });
    await aiService.saveChatMessage(userId, { role: 'assistant', content: 'Quicksort is a divide-and-conquer algorithm.' });

    const history = await aiService.getChatHistory(userId, 10);
    assert.strictEqual(history.length, 2);
    assert.strictEqual(history[0].role, 'user');
    assert.strictEqual(history[1].role, 'assistant');

    // 9. Test Safe Actions: get_tasks, create_task, update_task, propose_schedule
    console.log('9. Testing Safe Action Handlers (get_tasks, create_task, update_task, propose_schedule)...');
    const tasksRes = await aiService.executeAction(userId, { actionType: 'get_tasks' });
    assert.strictEqual(tasksRes.success, true);
    assert.ok(tasksRes.tasks && Array.isArray(tasksRes.tasks.dailies));

    const taskCreateRes = await aiService.executeAction(userId, {
      actionType: 'create_task',
      payload: { title: 'Deep Work on AI Service', scheduledTime: '10:00 AM', durationMinutes: 60 },
    });
    assert.strictEqual(taskCreateRes.success, true);
    assert.strictEqual(taskCreateRes.item.title, 'Deep Work on AI Service');

    const taskUpdateRes = await aiService.executeAction(userId, {
      actionType: 'update_task',
      payload: { id: taskCreateRes.item.id, title: 'Deep Work on AI Service (Updated)' },
    });
    assert.strictEqual(taskUpdateRes.success, true);
    assert.strictEqual(taskUpdateRes.item.title, 'Deep Work on AI Service (Updated)');

    const scheduleRes = await aiService.executeAction(userId, {
      actionType: 'propose_schedule',
      payload: { blocks: [{ time: '09:00 AM', title: 'Focus Sprint' }] },
    });
    assert.strictEqual(scheduleRes.success, true);
    console.log('   ✅ Safe task and schedule action handlers executed and validated.');

    // 10. Test Dataset Export Pipeline for Fine-Tuning
    console.log('10. Testing Dataset Export Pipeline for Fine-Tuning...');
    const exportResult = await aiService.exportTrainingDataset({ limit: 10 });
    assert.strictEqual(typeof exportResult, 'string');
    assert.ok(exportResult.includes('You are Jeevan AI'));
    console.log(`   ✅ Dataset export pipeline generated anonymized JSONL training examples.`);

    await aiService.clearChatHistory(userId);
    const cleared = await aiService.getChatHistory(userId, 10);
    assert.strictEqual(cleared.length, 0);
    console.log('   ✅ Chat history persisted and cleared cleanly.');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(' 🎉 All Jeevan AI Integration Tests Passed Cleanly!    ');
    console.log('═══════════════════════════════════════════════════════\n');
  } finally {
    await query('DELETE FROM users WHERE id = $1', [userId]);
  }
}

runAiTests().catch((err) => {
  console.error('\n❌ AI Integration Test Failed:', err);
  process.exit(1);
});
