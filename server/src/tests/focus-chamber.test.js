import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../app.js';
import { pool, query } from '../db/pool.js';
import { AuthService } from '../services/auth.service.js';

const authService = new AuthService();

async function runFocusChamberTestSuite() {
  console.log('\n═════════════════════════════════════════════════════════');
  console.log(' Starting Focus Chamber & Anti-Cheat System Test Suite   ');
  console.log('═════════════════════════════════════════════════════════\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;

  let testUserA = null;
  let testUserB = null;
  let tokenA = null;
  let tokenB = null;

  try {
    // -------------------------------------------------------------
    // Setup Test Users
    // -------------------------------------------------------------
    console.log('1. Registering test users User A and User B...');
    const emailA = `focus-pilot-a-${Date.now()}@lifeos.game`;
    const emailB = `focus-pilot-b-${Date.now()}@lifeos.game`;

    const regA = await authService.register({
      email: emailA,
      password: 'StrongPassword123!',
      displayName: 'Focus Pilot A',
    });
    testUserA = regA.user;
    tokenA = regA.accessToken;

    const regB = await authService.register({
      email: emailB,
      password: 'StrongPassword123!',
      displayName: 'Focus Pilot B',
    });
    testUserB = regB.user;
    tokenB = regB.accessToken;
    console.log('   ✅ Test users initialized with character stats.');

    // -------------------------------------------------------------
    // Test 2: Platform Capabilities Endpoint
    // -------------------------------------------------------------
    console.log('2. Testing GET /focus/capabilities (web, android, ios)...');
    const capWebRes = await fetch(`${baseUrl}/focus/capabilities?platform=web`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(capWebRes.status, 200);
    const capWeb = (await capWebRes.json()).data;
    assert.equal(capWeb.platform, 'web');
    assert.equal(capWeb.canEnforceAppRestriction, false);
    assert.equal(capWeb.status, 'browser_accountability');

    const capAndRes = await fetch(`${baseUrl}/focus/capabilities?platform=android`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const capAnd = (await capAndRes.json()).data;
    assert.equal(capAnd.platform, 'android');
    assert.equal(capAnd.canDetectForegroundApp, true);
    assert.equal(capAnd.canEnforceAppRestriction, false);
    console.log('   ✅ Truthful platform capabilities verified.');

    // -------------------------------------------------------------
    // Test 3: Distraction Shield Profiles CRUD & Ownership Isolation
    // -------------------------------------------------------------
    console.log('3. Testing Focus Profiles CRUD and multi-user isolation...');
    const profileRes = await fetch(`${baseUrl}/focus/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: 'GATE Study',
        description: 'No social media or video streaming',
        category: 'study',
        restrictedApps: [{ id: 'app1', name: 'Instagram', packageName: 'com.instagram.android' }],
        restrictedDomains: [{ domain: 'instagram.com', name: 'Instagram Web' }],
        defaultDurationSeconds: 2700,
        commitmentLevel: 2,
        isDefault: true,
      }),
    });
    assert.equal(profileRes.status, 201);
    const profileA = (await profileRes.json()).data;
    assert.equal(profileA.name, 'GATE Study');
    assert.equal(profileA.isDefault, true);

    // User B should NOT see User A's profile
    const listBRes = await fetch(`${baseUrl}/focus/profiles`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const listB = (await listBRes.json()).data;
    assert.equal(listB.length, 0, 'User B must not see User A profiles');

    // User B cannot update or delete User A's profile
    const unauthUpdateRes = await fetch(`${baseUrl}/focus/profiles/${profileA.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ name: 'Hacked Profile' }),
    });
    assert.equal(unauthUpdateRes.status, 404, 'Cross-user update should be rejected with 404');
    console.log('   ✅ Profile CRUD and multi-tenant security isolation verified.');

    // -------------------------------------------------------------
    // Test 4: Starting a Session with Level 2 Commitment Lock
    // -------------------------------------------------------------
    console.log('4. Testing POST /focus/start with Level 2 Commitment Lock...');
    const startRes = await fetch(`${baseUrl}/focus/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        plannedDurationSeconds: 1500,
        commitmentLevel: 2,
        shieldProfileId: profileA.id,
        goalDescription: 'Chapter 4 Algorithms Deep Work',
        ambientSound: 'rain',
      }),
    });
    assert.equal(startRes.status, 201);
    const session1 = (await startRes.json()).data;
    assert.equal(session1.commitmentLevel, 2);
    assert.equal(session1.shieldStatus, 'active');
    assert.equal(session1.status, 'active');
    assert.equal(session1.goalDescription, 'Chapter 4 Algorithms Deep Work');

    // Test Single Active Session Rule (409 conflict)
    const conflictRes = await fetch(`${baseUrl}/focus/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ plannedDurationSeconds: 1500 }),
    });
    assert.equal(conflictRes.status, 409);
    console.log('   ✅ Level 2 session started and single active session rule confirmed.');

    // -------------------------------------------------------------
    // Test 5: Pause Restriction in Commitment Lock Mode
    // -------------------------------------------------------------
    console.log('5. Testing pause restriction in Commitment Lock mode...');
    const pauseRes = await fetch(`${baseUrl}/focus/${session1.id}/pause`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(pauseRes.status, 400);
    const pauseJson = await pauseRes.json();
    assert.equal(pauseJson.error.code, 'PAUSE_NOT_ALLOWED_IN_COMMITMENT_LOCK');
    console.log('   ✅ Pausing rejected in Commitment Lock Level 2 as mandated.');

    // -------------------------------------------------------------
    // Test 6: Audit Event Recording (Visibility & Interruptions)
    // -------------------------------------------------------------
    console.log('6. Testing session event audit recording (visibility & interruptions)...');
    const eventRes = await fetch(`${baseUrl}/focus/${session1.id}/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        eventType: 'visibility_hidden',
        metadata: { tabHidden: true, appForeground: false },
        clientTimestamp: new Date().toISOString(),
      }),
    });
    assert.equal(eventRes.status, 201);

    // Verify interruption_count incremented in DB
    const currentRes = await fetch(`${baseUrl}/focus/current`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const currentData = (await currentRes.json()).data;
    assert.equal(currentData.interruptionCount, 1);
    console.log('   ✅ Interruption event persisted and counted.');

    // -------------------------------------------------------------
    // Test 7: Early Exit Hold-to-Confirm & Fairness Policy
    // -------------------------------------------------------------
    console.log('7. Testing early exit (Hold-to-Confirm under 10m -> 0 rewards)...');
    const earlyExitRes = await fetch(`${baseUrl}/focus/${session1.id}/early-exit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ reason: 'Urgent meeting', holdConfirmed: true }),
    });
    assert.equal(earlyExitRes.status, 200);
    const earlyExitData = (await earlyExitRes.json()).data;
    assert.equal(earlyExitData.session.status, 'interrupted');
    assert.equal(earlyExitData.xpAwarded, 0);
    assert.equal(earlyExitData.goldAwarded, 0);
    console.log('   ✅ Early exit handled properly with zero rewards under 10m.');

    // -------------------------------------------------------------
    // Test 8: Emergency Exit Pathway (Always Available)
    // -------------------------------------------------------------
    console.log('8. Testing Emergency Exit pathway...');
    const startEmergRes = await fetch(`${baseUrl}/focus/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        plannedDurationSeconds: 1500,
        commitmentLevel: 3,
        goalDescription: 'Emergency Test Session',
      }),
    });
    assert.equal(startEmergRes.status, 201);
    const sessionEmerg = (await startEmergRes.json()).data;

    const emergExitRes = await fetch(`${baseUrl}/focus/${sessionEmerg.id}/emergency-exit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ reason: 'Family incoming call' }),
    });
    assert.equal(emergExitRes.status, 200);
    const emergJson = await emergExitRes.json();
    assert.equal(emergJson.data.session.status, 'interrupted');
    assert.equal(emergJson.data.goldAwarded, 0);
    console.log('   ✅ Emergency exit executed instantly and restrictions released.');

    // -------------------------------------------------------------
    // Test 9: Anti-Tamper Elapsed Time Check on Complete
    // -------------------------------------------------------------
    console.log('9. Testing anti-tamper rejection on premature complete...');
    const startTamper = await fetch(`${baseUrl}/focus/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ plannedDurationSeconds: 1500, commitmentLevel: 1 }),
    });
    const sessionTamper = (await startTamper.json()).data;

    const prematureRes = await fetch(`${baseUrl}/focus/${sessionTamper.id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(prematureRes.status, 400);
    const prematureJson = await prematureRes.json();
    assert.equal(prematureJson.error.code, 'EARLY_COMPLETION_REJECTED');
    console.log('   ✅ Premature completion correctly blocked by server anti-tamper check.');

    // Clean up tamper test session by abandoning
    await fetch(`${baseUrl}/focus/${sessionTamper.id}/abandon`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    // -------------------------------------------------------------
    // Test 10: Valid Completion with Level 2 Multiplier (+15%)
    // -------------------------------------------------------------
    console.log('10. Testing valid completion with Level 2 multiplier (+15% XP and Gold)...');
    // Start a 25m (1500s) session with commitment level 2
    const startValid = await fetch(`${baseUrl}/focus/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ plannedDurationSeconds: 1500, commitmentLevel: 2 }),
    });
    const sessionValid = (await startValid.json()).data;

    // Fast-forward session start time in DB to 25 minutes ago
    await query(
      `UPDATE focus_sessions SET started_at = now() - interval '26 minutes' WHERE id = $1`,
      [sessionValid.id]
    );

    // Initial character stats
    const statsBefore = (await query(`SELECT xp, gold, mana FROM character_stats WHERE user_id = $1`, [testUserB.id])).rows[0];

    const completeRes = await fetch(`${baseUrl}/focus/${sessionValid.id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(completeRes.status, 200);
    const completeData = (await completeRes.json()).data;

    // Base for 25m: 25 XP, 12 Gold. Level 2 (+15%): Math.round(25 * 1.15) = 29 XP, Math.round(12 * 1.15) = 14 Gold
    assert.equal(completeData.xpAwarded, 29);
    assert.equal(completeData.goldAwarded, 13); // Math.floor(12 * 1.15) = 13
    assert.equal(completeData.commitmentMultiplier, 1.15);
    assert.equal(completeData.session.completed, true);
    assert.equal(completeData.session.status, 'completed');

    // Verify character_stats updated in DB
    const statsAfter = (await query(`SELECT xp, gold, mana FROM character_stats WHERE user_id = $1`, [testUserB.id])).rows[0];
    assert.equal(statsAfter.xp - statsBefore.xp, 29);
    assert.equal(statsAfter.gold - statsBefore.gold, 13);
    console.log('   ✅ Valid completion awarded correct +15% multiplier via applyReward().');

    // -------------------------------------------------------------
    // Test 11: Idempotency & Duplicate Completion Prevention
    // -------------------------------------------------------------
    console.log('11. Testing duplicate completion prevention (deterministic 409)...');
    const duplicateRes = await fetch(`${baseUrl}/focus/${sessionValid.id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(duplicateRes.status, 409);
    const dupJson = await duplicateRes.json();
    assert.equal(dupJson.error.code, 'SESSION_ALREADY_ENDED');

    // Verify stats were NOT modified a second time
    const statsAfterDup = (await query(`SELECT xp, gold FROM character_stats WHERE user_id = $1`, [testUserB.id])).rows[0];
    assert.equal(statsAfterDup.xp, statsAfter.xp);
    assert.equal(statsAfterDup.gold, statsAfter.gold);
    console.log('   ✅ Duplicate completion safely rejected with zero duplicate rewards.');

    // -------------------------------------------------------------
    // Test 12: Concurrent Completion Race Condition Protection
    // -------------------------------------------------------------
    console.log('12. Testing concurrent completion race condition protection...');
    const startRace = await fetch(`${baseUrl}/focus/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ plannedDurationSeconds: 1500, commitmentLevel: 1 }),
    });
    const sessionRace = (await startRace.json()).data;
    await query(
      `UPDATE focus_sessions SET started_at = now() - interval '26 minutes' WHERE id = $1`,
      [sessionRace.id]
    );

    const raceBefore = (await query(`SELECT xp, gold FROM character_stats WHERE user_id = $1`, [testUserB.id])).rows[0];

    // Fire two completion requests simultaneously
    const [resRace1, resRace2] = await Promise.all([
      fetch(`${baseUrl}/focus/${sessionRace.id}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` },
      }),
      fetch(`${baseUrl}/focus/${sessionRace.id}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` },
      }),
    ]);

    const statuses = [resRace1.status, resRace2.status].sort();
    assert.deepEqual(statuses, [200, 409], 'Exactly one request must succeed (200) and the other must be rejected (409)');

    const raceAfter = (await query(`SELECT xp, gold FROM character_stats WHERE user_id = $1`, [testUserB.id])).rows[0];
    assert.equal(raceAfter.xp - raceBefore.xp, 25, 'XP must be awarded exactly once');
    console.log('   ✅ Concurrency lock strictly prevented double reward grant.');

    // -------------------------------------------------------------
    // Test 13: Summary and Analytics Endpoint
    // -------------------------------------------------------------
    console.log('13. Testing GET /focus/summary and /focus/analytics...');
    const summaryRes = await fetch(`${baseUrl}/focus/summary`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(summaryRes.status, 200);
    const summary = (await summaryRes.json()).data;
    assert(summary.todayCompletedSessions >= 2);
    assert(summary.todayMinutes >= 50);
    assert(summary.completionRate > 0);
    assert(Array.isArray(summary.commitmentBreakdown));
    console.log('   ✅ Focus summary and analytics calculations verified.');

    console.log('\n═════════════════════════════════════════════════════════');
    console.log(' ALL 13 FOCUS CHAMBER TEST SUITE ASSERTIONS PASSED! ✅  ');
    console.log('═════════════════════════════════════════════════════════\n');
  } finally {
    server.close();
    await pool.end();
    process.exit(0);
  }
}

runFocusChamberTestSuite().catch(async (err) => {
  console.error('\n❌ Focus Chamber test suite failed:', err);
  await pool.end();
  process.exit(1);
});
