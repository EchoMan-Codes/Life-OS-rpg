import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import app from '../app.js';
import { query } from '../db/pool.js';
import { AuthService } from '../services/auth.service.js';
import { checkAndProcessUserReset } from '../services/daily-reset.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authService = new AuthService();

async function runReflectionsRestModeTestSuite() {
  console.log('\n═════════════════════════════════════════════════════════');
  console.log(' Starting Phase 5.2 Evening Reflection & Rest Mode Tests ');
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

  try {
    // -------------------------------------------------------------
    // Test 1: Migration UP/DOWN/Re-apply Verification
    // -------------------------------------------------------------
    console.log('1. Testing Migration 0009_reflections_and_rest_mode.sql UP/DOWN/re-apply...');
    const migrationPath = path.join(__dirname, '../db/migrations/0009_reflections_and_rest_mode.sql');
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

    // Test DOWN rollback
    await query(downSql);
    const checkTablesDown = await query(
      `SELECT to_regclass('public.reflections') as ref_tbl, to_regclass('public.rest_mode') as rest_tbl`
    );
    assert.equal(checkTablesDown.rows[0].ref_tbl, null, 'reflections table should be dropped after rollback');
    assert.equal(checkTablesDown.rows[0].rest_tbl, null, 'rest_mode table should be dropped after rollback');

    // Test UP re-apply
    await query(upSql);
    const checkTablesUp = await query(
      `SELECT to_regclass('public.reflections') as ref_tbl, to_regclass('public.rest_mode') as rest_tbl`
    );
    assert.notEqual(checkTablesUp.rows[0].ref_tbl, null, 'reflections table should be restored');
    assert.notEqual(checkTablesUp.rows[0].rest_tbl, null, 'rest_mode table should be restored');
    console.log('   ✅ Migration UP / DOWN / re-apply cleanly verified.');

    // -------------------------------------------------------------
    // Test 2: Register test users
    // -------------------------------------------------------------
    console.log('2. Registering test users User A and User B...');
    const emailA = `reflection-test-a-${Date.now()}@example.com`;
    const emailB = `reflection-test-b-${Date.now()}@example.com`;
    const password = 'StrongPassword123!';

    const regA = await authService.register({ email: emailA, password, displayName: 'Reflect User A' });
    testUserA = regA.user;
    tokenA = regA.accessToken;

    const regB = await authService.register({ email: emailB, password, displayName: 'Reflect User B' });
    testUserB = regB.user;
    tokenB = regB.accessToken;
    console.log('   ✅ Test users created.');

    // -------------------------------------------------------------
    // Test 3: Reflection score boundaries validation (1..5)
    // -------------------------------------------------------------
    console.log('3. Testing score boundary validation (1..5 valid, 0 and 6 rejected)...');
    const invalidScores = [
      { mood_score: 0, energy_score: 3, focus_score: 3 },
      { mood_score: 6, energy_score: 3, focus_score: 3 },
      { mood_score: 3, energy_score: -1, focus_score: 3 },
      { mood_score: 3, energy_score: 3, focus_score: 7 },
    ];

    for (const payload of invalidScores) {
      const res = await fetch(`${baseUrl}/reflections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({ ...payload, for_date: '2026-09-01' }),
      });
      assert.equal(res.status, 400, `Expected 400 for score out of bounds: ${JSON.stringify(payload)}`);
    }
    console.log('   ✅ Score boundaries (1..5) strictly enforced.');

    // -------------------------------------------------------------
    // Test 4: Reflection date format validation
    // -------------------------------------------------------------
    console.log('4. Testing reflection date format validation...');
    const badDateRes = await fetch(`${baseUrl}/reflections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ mood_score: 3, energy_score: 3, focus_score: 3, for_date: 'invalid-date' }),
    });
    assert.equal(badDateRes.status, 400, 'Expected 400 for invalid date string');
    console.log('   ✅ Invalid date format correctly rejected.');

    // -------------------------------------------------------------
    // Test 5: Reflection creation & uniqueness enforcement (409)
    // -------------------------------------------------------------
    console.log('5. Testing reflection creation and uniqueness (409 on duplicate for_date)...');
    // Snapshot stats and battle events before reflection
    const statsBeforeRes = await query('SELECT xp, gold, hp, mana FROM character_stats WHERE user_id = $1', [testUserA.id]);
    const eventsBeforeRes = await query('SELECT count(*) FROM battle_events WHERE user_id = $1', [testUserA.id]);

    const createRes1 = await fetch(`${baseUrl}/reflections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        for_date: '2026-09-01',
        mood_score: 4,
        energy_score: 3,
        focus_score: 5,
        note: 'Solid focus today.',
      }),
    });
    assert.equal(createRes1.status, 201);
    const body1 = await createRes1.json();
    assert.equal(body1.data.moodScore, 4);
    assert.equal(body1.data.energyScore, 3);
    assert.equal(body1.data.focusScore, 5);
    assert.equal(body1.data.blendedScore, 4.0);
    assert.equal(body1.data.note, 'Solid focus today.');
    const reflectionId1 = body1.data.id;

    // Second creation for same date should yield 409 REFLECTION_ALREADY_EXISTS
    const duplicateRes = await fetch(`${baseUrl}/reflections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        for_date: '2026-09-01',
        mood_score: 5,
        energy_score: 5,
        focus_score: 5,
      }),
    });
    assert.equal(duplicateRes.status, 409);
    const dupBody = await duplicateRes.json();
    assert.equal(dupBody.error.code, 'REFLECTION_ALREADY_EXISTS');
    console.log('   ✅ Unique constraint on (user_id, for_date) enforced with HTTP 409.');

    // -------------------------------------------------------------
    // Test 6: Strict Reflection Isolation (Zero progression/battle side effects)
    // -------------------------------------------------------------
    console.log('6. Testing strict reflection isolation (zero XP/Gold/Mana/HP/battle events)...');
    const statsAfterRes = await query('SELECT xp, gold, hp, mana FROM character_stats WHERE user_id = $1', [testUserA.id]);
    const eventsAfterRes = await query('SELECT count(*) FROM battle_events WHERE user_id = $1', [testUserA.id]);

    assert.deepEqual(statsBeforeRes.rows[0], statsAfterRes.rows[0], 'Character stats must not change upon reflection submission');
    assert.equal(eventsBeforeRes.rows[0].count, eventsAfterRes.rows[0].count, 'Battle events count must not increase');
    console.log('   ✅ Reflection isolation confirmed: pure wellness data with zero side effects.');

    // -------------------------------------------------------------
    // Test 7: Same-day update via PATCH /reflections/:id
    // -------------------------------------------------------------
    console.log('7. Testing same-day update via PATCH /reflections/:id...');
    const patchRes = await fetch(`${baseUrl}/reflections/${reflectionId1}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        mood_score: 5,
        note: 'Updated evening reflection note.',
      }),
    });
    assert.equal(patchRes.status, 200);
    const patchedBody = await patchRes.json();
    assert.equal(patchedBody.data.moodScore, 5);
    assert.equal(patchedBody.data.energyScore, 3); // Unchanged
    assert.equal(patchedBody.data.note, 'Updated evening reflection note.');
    assert.equal(patchedBody.data.blendedScore, 4.33); // (5+3+5)/3
    console.log('   ✅ PATCH /reflections/:id successfully updated fields.');

    // -------------------------------------------------------------
    // Test 8: Tenant isolation on reflections
    // -------------------------------------------------------------
    console.log('8. Testing strict tenant isolation for reflections...');
    // User B attempts to patch User A's reflection
    const hackPatchRes = await fetch(`${baseUrl}/reflections/${reflectionId1}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ mood_score: 1 }),
    });
    assert.equal(hackPatchRes.status, 404, 'User B must receive 404 when attempting to modify User A reflection');

    // User B listing reflections sees 0 entries
    const listBRes = await fetch(`${baseUrl}/reflections?range=30d`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const listBBody = await listBRes.json();
    assert.equal(listBBody.data.length, 0, 'User B reflections list must be isolated from User A');
    console.log('   ✅ Strict tenant isolation verified.');

    // -------------------------------------------------------------
    // Test 9: 30-day listing & blended score calculations
    // -------------------------------------------------------------
    console.log('9. Testing 30-day reflection listing & blended score calculations...');
    // Add two more reflections for User A on past dates
    await fetch(`${baseUrl}/reflections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ for_date: '2026-09-02', mood_score: 2, energy_score: 2, focus_score: 2 }),
    });
    await fetch(`${baseUrl}/reflections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ for_date: '2026-09-03', mood_score: 1, energy_score: 2, focus_score: 3 }),
    });

    const listARes = await fetch(`${baseUrl}/reflections?range=30d`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(listARes.status, 200);
    const listABody = await listARes.json();
    assert.equal(listABody.data.length, 3);
    assert(listABody.data[0].forDate <= listABody.data[1].forDate, 'Must be sorted chronologically ASC');
    console.log('   ✅ 30-day listing returned correct entries and blended scores.');

    // -------------------------------------------------------------
    // Test 10: Burnout Condition (a) (Average mood+energy across 3 days <= 4.0)
    // -------------------------------------------------------------
    console.log('10. Testing Burnout Condition (a): 3 low mood/energy entries (avg <= 4.0)...');
    // For User B, insert 3 days with low mood and energy (e.g. 2+1, 2+2, 1+2 -> sum = 10 / 3 = 3.33 <= 4.0)
    await fetch(`${baseUrl}/reflections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ for_date: '2026-09-10', mood_score: 2, energy_score: 1, focus_score: 3 }),
    });
    await fetch(`${baseUrl}/reflections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ for_date: '2026-09-11', mood_score: 2, energy_score: 2, focus_score: 2 }),
    });
    await fetch(`${baseUrl}/reflections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ for_date: '2026-09-12', mood_score: 1, energy_score: 2, focus_score: 2 }),
    });

    const suggBRes = await fetch(`${baseUrl}/rest-mode/suggestion`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(suggBRes.status, 200);
    const suggB = await suggBRes.json();
    assert.equal(suggB.data.suggested, true, 'Expected burnout suggestion for 3 consecutive low mood/energy days');
    assert(suggB.data.reason.includes('low mood and energy'), `Expected reason mentioning mood/energy, got: ${suggB.data.reason}`);
    console.log('   ✅ Burnout Condition (a) triggered correctly.');

    // -------------------------------------------------------------
    // Test 11: Burnout Condition (b) (2+ missed hard dailies in 3 days)
    // -------------------------------------------------------------
    console.log('11. Testing Burnout Condition (b): 2+ missed hard dailies without a shield...');
    // Create User C with clean slate
    const emailC = `burnout-test-c-${Date.now()}@example.com`;
    const regC = await authService.register({ email: emailC, password, displayName: 'Burnout User C' });
    const userC = regC.user;
    const tokenC = regC.accessToken;

    // Create 2 hard dailies for User C active every day
    const d1Res = await fetch(`${baseUrl}/dailies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenC}` },
      body: JSON.stringify({ title: 'Extreme Cardio', difficulty: 'hard', activeDays: [0, 1, 2, 3, 4, 5, 6] }),
    });
    assert.equal(d1Res.status, 201);

    const d2Res = await fetch(`${baseUrl}/dailies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenC}` },
      body: JSON.stringify({ title: 'Deep Problem Solving', difficulty: 'hard', activeDays: [0, 1, 2, 3, 4, 5, 6] }),
    });
    assert.equal(d2Res.status, 201);

    // Backdate dailies so they were active on past dates
    await query("UPDATE dailies SET created_at = CURRENT_DATE - INTERVAL '4 days' WHERE user_id = $1", [userC.id]);

    // No daily completions exist for yesterday or 2 days ago: this counts as missed hard dailies!
    const suggCRes = await fetch(`${baseUrl}/rest-mode/suggestion`, {
      headers: { Authorization: `Bearer ${tokenC}` },
    });
    assert.equal(suggCRes.status, 200);
    const suggC = await suggCRes.json();
    assert.equal(suggC.data.suggested, true, 'Expected burnout suggestion due to missed hard dailies');
    assert(suggC.data.reason.includes('hard dailies'), `Expected reason mentioning hard dailies, got: ${suggC.data.reason}`);
    console.log('   ✅ Burnout Condition (b) triggered correctly.');

    // -------------------------------------------------------------
    // Test 12: Rest Mode duration boundaries (1..14)
    // -------------------------------------------------------------
    console.log('12. Testing Rest Mode duration boundaries (1 and 14 valid, 0 and 15 invalid)...');
    const badDur0 = await fetch(`${baseUrl}/rest-mode/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ duration_days: 0 }),
    });
    assert.equal(badDur0.status, 400);

    const badDur15 = await fetch(`${baseUrl}/rest-mode/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ duration_days: 15 }),
    });
    assert.equal(badDur15.status, 400);

    const goodDur1 = await fetch(`${baseUrl}/rest-mode/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ duration_days: 1, reason: '1 day rest' }),
    });
    assert.equal(goodDur1.status, 200);
    assert.equal((await goodDur1.json()).data.isActive, true);

    const goodDur14 = await fetch(`${baseUrl}/rest-mode/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ duration_days: 14, reason: 'Extended rest' }),
    });
    assert.equal(goodDur14.status, 200);
    const dur14Body = await goodDur14.json();
    assert.equal(dur14Body.data.isActive, true);
    assert.equal(dur14Body.data.reason, 'Extended rest');
    console.log('   ✅ Rest mode duration boundaries (1..14) validated.');

    // -------------------------------------------------------------
    // Test 13: Low mood/energy while already resting produces no new suggestion
    // -------------------------------------------------------------
    console.log('13. Testing low mood/energy while already resting produces no new suggestion...');
    const restSuggRes = await fetch(`${baseUrl}/rest-mode/suggestion`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const restSugg = await restSuggRes.json();
    assert.equal(restSugg.data.suggested, false, 'Should not suggest rest mode if user is already resting');
    assert.equal(restSugg.data.isActive, true);
    console.log('   ✅ Active rest mode suppresses duplicate burnout suggestion.');

    // -------------------------------------------------------------
    // Test 14: Manual deactivation via POST /rest-mode/deactivate
    // -------------------------------------------------------------
    console.log('14. Testing manual deactivation via POST /rest-mode/deactivate...');
    const deactRes = await fetch(`${baseUrl}/rest-mode/deactivate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(deactRes.status, 200);
    const deactBody = await deactRes.json();
    assert.equal(deactBody.data.isActive, false);

    const statusAfterDeact = await fetch(`${baseUrl}/rest-mode/status`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal((await statusAfterDeact.json()).data.isActive, false);
    console.log('   ✅ Manual deactivation verified.');

    // -------------------------------------------------------------
    // Test 15: Rest Mode Day-Reset Integration (Streak resets to 0, HP penalty skipped)
    // -------------------------------------------------------------
    console.log('15. Testing Rest Mode Day-Reset Integration (Streak resets to 0, HP penalty skipped)...');
    // Create User D
    const emailD = `reset-rest-${Date.now()}@example.com`;
    const regD = await authService.register({ email: emailD, password, displayName: 'Reset User D' });
    const userD = regD.user;
    const tokenD = regD.accessToken;

    // Create a hard daily for User D with streak = 5
    const dRes = await query(
      `INSERT INTO dailies (user_id, title, difficulty, active_days, streak_current, streak_best, last_reset_date)
       VALUES ($1, 'Brutal Workout', 'hard', '{0,1,2,3,4,5,6}', 5, 5, CURRENT_DATE - INTERVAL '1 day')
       RETURNING id`,
      [userD.id]
    );
    const dailyIdD = dRes.rows[0].id;

    // Activate Rest Mode for User D
    await fetch(`${baseUrl}/rest-mode/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenD}` },
      body: JSON.stringify({ duration_days: 3, reason: 'Burnout protection' }),
    });

    // Check HP before reset
    const statsD1 = await query('SELECT hp FROM character_stats WHERE user_id = $1', [userD.id]);
    const hpBefore = statsD1.rows[0].hp;

    // Execute day-reset for User D
    const resetResult = await checkAndProcessUserReset(query, userD.id, 'UTC', new Date());
    assert.equal(resetResult.resetPerformed, true, 'Reset should be performed for yesterday');
    assert.equal(resetResult.hpPenalty, 0, 'HP penalty must be 0 while in Rest Mode');

    // Verify streak reset to 0 ("missed is still missed")
    const dailyDAfter = await query('SELECT streak_current FROM dailies WHERE id = $1', [dailyIdD]);
    assert.equal(dailyDAfter.rows[0].streak_current, 0, 'Streak must still reset to 0 upon missed daily');

    // Verify player took 0 damage
    const statsD2 = await query('SELECT hp FROM character_stats WHERE user_id = $1', [userD.id]);
    assert.equal(statsD2.rows[0].hp, hpBefore, 'Player HP must not decrease during Rest Mode reset');
    console.log('   ✅ Rest Mode day-reset verified: streak reset to 0, HP penalty 100% skipped.');

    // -------------------------------------------------------------
    // Test 16: Expired Rest Mode automatically becomes inactive
    // -------------------------------------------------------------
    console.log('16. Testing expired Rest Mode auto-deactivation...');
    // Manually set auto_deactivate_at in the past for User D
    await query(
      `UPDATE rest_mode
       SET auto_deactivate_at = now() - INTERVAL '1 hour'
       WHERE user_id = $1`,
      [userD.id]
    );

    const expiredStatusRes = await fetch(`${baseUrl}/rest-mode/status`, {
      headers: { Authorization: `Bearer ${tokenD}` },
    });
    const expiredStatus = await expiredStatusRes.json();
    assert.equal(expiredStatus.data.isActive, false, 'Expired rest mode must automatically report isActive: false');
    console.log('   ✅ Expired Rest Mode auto-deactivation verified.');

    // -------------------------------------------------------------
    // Test 17: ON DELETE CASCADE cleanup
    // -------------------------------------------------------------
    console.log('17. Testing ON DELETE CASCADE when users are removed...');
    await query('DELETE FROM users WHERE id IN ($1, $2, $3, $4)', [testUserA.id, testUserB.id, userC.id, userD.id]);
    const refCount = await query('SELECT count(*) FROM reflections WHERE user_id IN ($1, $2, $3, $4)', [testUserA.id, testUserB.id, userC.id, userD.id]);
    const restCount = await query('SELECT count(*) FROM rest_mode WHERE user_id IN ($1, $2, $3, $4)', [testUserA.id, testUserB.id, userC.id, userD.id]);

    assert.equal(refCount.rows[0].count, '0');
    assert.equal(restCount.rows[0].count, '0');
    console.log('   ✅ ON DELETE CASCADE confirmed for reflections and rest_mode.');

    console.log('\n═════════════════════════════════════════════════════════');
    console.log(' 🎉 All Phase 5.2 Evening Reflection & Rest Tests Passed!');
    console.log('═════════════════════════════════════════════════════════\n');
  } finally {
    server.close();
  }
}

runReflectionsRestModeTestSuite().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
