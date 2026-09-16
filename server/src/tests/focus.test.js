import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import app from '../app.js';
import { query } from '../db/pool.js';
import { AuthService } from '../services/auth.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authService = new AuthService();

async function runFocusTestSuite() {
  console.log('\n═════════════════════════════════════════════════════════');
  console.log(' Starting Phase 5.1 Deep Work Focus Chamber Test Suite   ');
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
    console.log('1. Testing Migration 0008_focus_sessions.sql UP/DOWN/re-apply...');
    const migrationPath = path.join(__dirname, '../db/migrations/0008_focus_sessions.sql');
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
    const tableCheckDown = await query(
      `SELECT to_regclass('public.focus_sessions') as tbl`
    );
    assert.equal(tableCheckDown.rows[0].tbl, null, 'focus_sessions table should be dropped after rollback');

    // Test UP re-apply
    await query(upSql);
    const tableCheckUp = await query(
      `SELECT to_regclass('public.focus_sessions') as tbl`
    );
    assert.notEqual(tableCheckUp.rows[0].tbl, null, 'focus_sessions table should exist after re-applying UP');

    const indexCheck = await query(
      `SELECT indexname FROM pg_indexes WHERE indexname = 'idx_focus_sessions_active_user'`
    );
    assert.equal(indexCheck.rows.length, 1, 'Partial unique index idx_focus_sessions_active_user must exist');
    console.log('   ✅ Migration UP / DOWN / re-apply and partial unique index cleanly verified.');

    // -------------------------------------------------------------
    // Setup Test Users
    // -------------------------------------------------------------
    console.log('2. Registering test users User A and User B...');
    const emailA = `focus-hero-a-${Date.now()}@lifeos.game`;
    const emailB = `focus-hero-b-${Date.now()}@lifeos.game`;

    const regA = await authService.register({
      email: emailA,
      password: 'StrongPassword123!',
      displayName: 'Focus Hero A',
    });
    testUserA = regA.user;
    tokenA = regA.accessToken;

    const regB = await authService.register({
      email: emailB,
      password: 'StrongPassword123!',
      displayName: 'Focus Hero B',
    });
    testUserB = regB.user;
    tokenB = regB.accessToken;
    console.log('   ✅ Test users created with auto-initialized stats.');

    // -------------------------------------------------------------
    // Test 3: Duration Preset Validation
    // -------------------------------------------------------------
    console.log('3. Testing duration preset validation (15m=900, 25m=1500, 50m=3000)...');
    // Invalid duration: 60s
    const resInvalid1 = await fetch(`${baseUrl}/focus/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ plannedDurationSeconds: 60 }),
    });
    assert.equal(resInvalid1.status, 400);

    // Invalid duration: 1800s (30m)
    const resInvalid2 = await fetch(`${baseUrl}/focus/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ plannedDurationSeconds: 1800 }),
    });
    assert.equal(resInvalid2.status, 400);

    // Valid duration: 900s (15m)
    const resValid = await fetch(`${baseUrl}/focus/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ plannedDurationSeconds: 900, ambientSound: 'rain' }),
    });
    assert.equal(resValid.status, 201);
    const validJson = await resValid.json();
    assert.equal(validJson.data.plannedDurationSeconds, 900);
    assert.equal(validJson.data.ambientSound, 'rain');
    assert.equal(validJson.data.completed, false);
    const session1 = validJson.data;
    console.log('   ✅ Duration preset validation verified (only 900, 1500, 3000 accepted).');

    // -------------------------------------------------------------
    // Test 4: One Active Session Rule & Deterministic 409 Conflict
    // -------------------------------------------------------------
    console.log('4. Testing single active session rule (deterministic 409 ACTIVE_SESSION_EXISTS)...');
    const resConflict = await fetch(`${baseUrl}/focus/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ plannedDurationSeconds: 1500 }),
    });
    assert.equal(resConflict.status, 409);
    const conflictJson = await resConflict.json();
    assert.equal(conflictJson.error.code, 'ACTIVE_SESSION_EXISTS');
    assert(conflictJson.error.details && conflictJson.error.details.session);
    assert.equal(conflictJson.error.details.session.id, session1.id);
    console.log('   ✅ Starting a second session rejected with 409 ACTIVE_SESSION_EXISTS without silent abandonment.');

    // -------------------------------------------------------------
    // Test 5: Server-Authoritative Anti-Tamper Check (Early Completion Rejection)
    // -------------------------------------------------------------
    console.log('5. Testing server-authoritative anti-tamper check (rejection of early complete)...');
    const resEarly = await fetch(`${baseUrl}/focus/${session1.id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(resEarly.status, 400);
    const earlyJson = await resEarly.json();
    assert.equal(earlyJson.error.code, 'EARLY_COMPLETION_REJECTED');
    console.log('   ✅ Early completion attempt immediately rejected by server-side elapsed check.');

    // -------------------------------------------------------------
    // Test 6: Reconnect & Server Synchronized Timing (GET /focus/current)
    // -------------------------------------------------------------
    console.log('6. Testing GET /focus/current server-synchronized timing...');
    const resCurrent = await fetch(`${baseUrl}/focus/current`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(resCurrent.status, 200);
    const currentJson = await resCurrent.json();
    assert(currentJson.data);
    assert.equal(currentJson.data.id, session1.id);
    assert(typeof currentJson.data.remainingSeconds === 'number');
    assert(typeof currentJson.data.elapsedSeconds === 'number');
    assert(currentJson.data.serverTime);
    console.log('   ✅ GET /focus/current accurately returns active session with server clock synchronization.');

    // -------------------------------------------------------------
    // Test 7: Valid Completion & Mana Regeneration Clamping
    // -------------------------------------------------------------
    console.log('7. Testing valid session completion & actual Mana restored calculation...');
    // Set character mana to 10 and max_mana to 50
    await query(
      `UPDATE character_stats SET mana = 10, max_mana = 50 WHERE user_id = $1`,
      [testUserA.id]
    );

    // Fast-forward session1 started_at by 905 seconds in the database to simulate completed time
    await query(
      `UPDATE focus_sessions
       SET started_at = now() - interval '905 seconds'
       WHERE id = $1`,
      [session1.id]
    );

    // Complete session: 15 min (900s) grants Math.round(15 * 1.5) = 23 Mana
    const resComplete = await fetch(`${baseUrl}/focus/${session1.id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(resComplete.status, 200);
    const completeJson = await resComplete.json();
    assert.equal(completeJson.data.theoreticalMana, 23);
    assert.equal(completeJson.data.manaRegenerated, 23);
    assert.equal(completeJson.data.maxManaCapped, false);
    assert.equal(completeJson.data.character.mana, 33); // 10 + 23 = 33

    // Verify DB focus_sessions row updated
    const dbSession = await query(`SELECT * FROM focus_sessions WHERE id = $1`, [session1.id]);
    assert.equal(dbSession.rows[0].completed, true);
    assert.notEqual(dbSession.rows[0].ended_at, null);
    assert.equal(dbSession.rows[0].mana_regenerated, 23);

    // Verify GET /focus/current is now null
    const resCurrentAfter = await fetch(`${baseUrl}/focus/current`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal((await resCurrentAfter.json()).data, null);
    console.log('   ✅ Session completed: 23 Mana awarded and recorded in character_stats.');

    // -------------------------------------------------------------
    // Test 8: Max Mana Clamping (Near Cap Test)
    // -------------------------------------------------------------
    console.log('8. Testing actual Mana restored when clamped at maxMana...');
    // Set character mana to 45 (out of 50 max)
    await query(
      `UPDATE character_stats SET mana = 45, max_mana = 50 WHERE user_id = $1`,
      [testUserA.id]
    );

    // Start a 25m session (theoretical reward = 38 mana)
    const res25 = await fetch(`${baseUrl}/focus/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ plannedDurationSeconds: 1500 }),
    });
    const session25 = (await res25.json()).data;

    // Fast-forward started_at
    await query(
      `UPDATE focus_sessions
       SET started_at = now() - interval '1505 seconds'
       WHERE id = $1`,
      [session25.id]
    );

    const resComplete25 = await fetch(`${baseUrl}/focus/${session25.id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(resComplete25.status, 200);
    const complete25Json = await resComplete25.json();
    assert.equal(complete25Json.data.theoreticalMana, 38);
    // Mana was 45, max is 50 -> actual restored is 5!
    assert.equal(complete25Json.data.manaRegenerated, 5);
    assert.equal(complete25Json.data.maxManaCapped, true);
    assert.equal(complete25Json.data.character.mana, 50);
    console.log('   ✅ Actual Mana restored capped at 5 (clamped to maxMana=50, not theoretical 38).');

    // -------------------------------------------------------------
    // Test 9: Concurrency Protection & Double-Reward Prevention
    // -------------------------------------------------------------
    console.log('9. Testing race condition safety: 5 concurrent /complete requests on same session...');
    // Start session 3 (50m)
    const res50 = await fetch(`${baseUrl}/focus/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ plannedDurationSeconds: 3000 }),
    });
    const session50 = (await res50.json()).data;

    // Fast-forward
    await query(
      `UPDATE focus_sessions
       SET started_at = now() - interval '3005 seconds'
       WHERE id = $1`,
      [session50.id]
    );

    // Reset mana to 0
    await query(
      `UPDATE character_stats SET mana = 0, max_mana = 100 WHERE user_id = $1`,
      [testUserA.id]
    );

    // Fire 5 concurrent completion requests
    const completePromises = Array.from({ length: 5 }).map(() =>
      fetch(`${baseUrl}/focus/${session50.id}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
      })
    );
    const completeResults = await Promise.all(completePromises);
    const statuses = completeResults.map((r) => r.status);

    const successCount = statuses.filter((s) => s === 200).length;
    const conflictCount = statuses.filter((s) => s === 409).length;

    assert.equal(successCount, 1, 'Exactly one concurrent completion request must succeed');
    assert.equal(conflictCount, 4, 'All subsequent concurrent completion requests must return 409');

    const finalManaRes = await query(
      `SELECT mana FROM character_stats WHERE user_id = $1`,
      [testUserA.id]
    );
    // 50 min grants 75 mana
    assert.equal(finalManaRes.rows[0].mana, 75, 'Mana must be awarded exactly once');
    console.log('   ✅ Concurrency protection verified: Exactly one /complete succeeded, zero double-reward.');

    // -------------------------------------------------------------
    // Test 10: Session Abandonment Flow (Zero Reward, Zero Penalty)
    // -------------------------------------------------------------
    console.log('10. Testing session abandonment (zero reward, zero HP penalty)...');
    const resAbandonStart = await fetch(`${baseUrl}/focus/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ plannedDurationSeconds: 900 }),
    });
    const sessionAbandon = (await resAbandonStart.json()).data;

    const statsBeforeAbandon = await query(
      `SELECT hp, mana, xp, gold FROM character_stats WHERE user_id = $1`,
      [testUserA.id]
    );

    const resAbandon = await fetch(`${baseUrl}/focus/${sessionAbandon.id}/abandon`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(resAbandon.status, 200);
    const abandonJson = await resAbandon.json();
    assert.equal(abandonJson.data.completed, false);
    assert.notEqual(abandonJson.data.endedAt, null);
    assert.equal(abandonJson.data.manaRegenerated, 0);

    const statsAfterAbandon = await query(
      `SELECT hp, mana, xp, gold FROM character_stats WHERE user_id = $1`,
      [testUserA.id]
    );
    assert.deepEqual(statsAfterAbandon.rows[0], statsBeforeAbandon.rows[0], 'Stats must remain completely unchanged');

    // Attempting to abandon again must return 409
    const resAbandonAgain = await fetch(`${baseUrl}/focus/${sessionAbandon.id}/abandon`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(resAbandonAgain.status, 409);
    console.log('   ✅ Abandonment verified: ended with 0 mana, 0 HP penalty, and duplicate abandon rejected.');

    // -------------------------------------------------------------
    // Test 11: Strict Tenant Isolation
    // -------------------------------------------------------------
    console.log('11. Testing strict tenant isolation...');
    // Start session for User A
    const resIsoA = await fetch(`${baseUrl}/focus/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ plannedDurationSeconds: 900 }),
    });
    const sessionIsoA = (await resIsoA.json()).data;

    // User B tries to complete User A's session -> 404
    const resBComplete = await fetch(`${baseUrl}/focus/${sessionIsoA.id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(resBComplete.status, 404);

    // User B tries to abandon User A's session -> 404
    const resBAbandon = await fetch(`${baseUrl}/focus/${sessionIsoA.id}/abandon`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(resBAbandon.status, 404);

    // User B checks current session -> null
    const resBCurrent = await fetch(`${baseUrl}/focus/current`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal((await resBCurrent.json()).data, null);
    console.log('   ✅ Strict tenant isolation confirmed (User B receives 404 for all User A sessions).');

    // -------------------------------------------------------------
    // Test 12: Cascade Deletion on User Delete
    // -------------------------------------------------------------
    console.log('12. Testing ON DELETE CASCADE on focus_sessions when user is removed...');
    await query(`DELETE FROM users WHERE id = $1`, [testUserA.id]);
    await query(`DELETE FROM users WHERE id = $1`, [testUserB.id]);

    const remainingSessions = await query(
      `SELECT count(*) as count FROM focus_sessions WHERE user_id IN ($1, $2)`,
      [testUserA.id, testUserB.id]
    );
    assert.equal(parseInt(remainingSessions.rows[0].count, 10), 0);
    console.log('   ✅ Focus sessions automatically cleaned up via ON DELETE CASCADE.');

    console.log('\n═════════════════════════════════════════════════════════');
    console.log(' 🎉 All Phase 5.1 Deep Work Focus Tests Passed!         ');
    console.log('═════════════════════════════════════════════════════════\n');
  } finally {
    server.close();
  }
}

runFocusTestSuite().catch((err) => {
  console.error('\n❌ Focus test suite failed:', err);
  process.exit(1);
});
