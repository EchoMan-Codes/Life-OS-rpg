import http from 'http';
import assert from 'assert';
import app from '../app.js';
import { pool } from '../db/pool.js';

let server;
let baseUrl;

function request(method, path, { body, headers = {}, cookie } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqHeaders = { ...headers };
    let reqBody = null;

    if (body) {
      reqBody = JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(reqBody);
    }
    if (cookie) {
      reqHeaders['Cookie'] = cookie;
    }

    const req = http.request(
      url,
      { method, headers: reqHeaders },
      (res) => {
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
      }
    );

    req.on('error', reject);
    if (reqBody) req.write(reqBody);
    req.end();
  });
}

function extractCookie(headers, cookieName = 'rt') {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return null;
  const cookieArr = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const c of cookieArr) {
    if (c.startsWith(`${cookieName}=`)) {
      return c.split(';')[0]; // returns "rt=<value>"
    }
  }
  return null;
}

async function runTests() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log(' Starting Phase 1.2 Backend Auth Integration Test Suite');
  console.log('═══════════════════════════════════════════════════════\n');

  // Start test server on random available port
  server = http.createServer(app);
  await new Promise((res) => server.listen(0, res));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
  console.log(`Test server running at ${baseUrl}`);

  const testEmail = `test_hero_${Date.now()}@lifeos.local`;
  const strongPassword = 'StrongPass!#987654321RPG';
  const weakPassword = 'password';

  try {
    // 1. Health check
    console.log('1. Testing GET /api/v1/health...');
    const health = await request('GET', '/api/v1/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.data.data.status, 'healthy');
    console.log('   ✅ Health check passed.');

    // 2. Weak password rejection
    console.log('2. Testing weak password rejection (score < 2)...');
    const weakReg = await request('POST', '/api/v1/auth/register', {
      body: {
        email: testEmail,
        password: weakPassword,
        displayName: 'Weakling',
      },
    });
    assert.strictEqual(weakReg.status, 400);
    assert.strictEqual(weakReg.data.error.code, 'WEAK_PASSWORD');
    assert.ok(Array.isArray(weakReg.data.error.suggestions));
    console.log(`   ✅ Weak password rejected with code WEAK_PASSWORD and suggestions:`, weakReg.data.error.suggestions);

    // 3. Valid registration
    console.log('3. Testing strong password registration...');
    const reg = await request('POST', '/api/v1/auth/register', {
      body: {
        email: testEmail,
        password: strongPassword,
        displayName: 'RPG Hero',
      },
    });
    assert.strictEqual(reg.status, 201);
    assert.strictEqual(reg.data.data.user.email, testEmail);
    assert.strictEqual(reg.data.data.user.displayName, 'RPG Hero');
    assert.ok(reg.data.data.accessToken);

    const initialCookie = extractCookie(reg.headers, 'rt');
    assert.ok(initialCookie, 'Expected rt cookie in registration response');
    console.log('   ✅ User registered successfully. Access token received.');
    console.log(`   ✅ HttpOnly cookie received: ${initialCookie.slice(0, 16)}...`);

    // 4. Duplicate email rejection
    console.log('4. Testing duplicate email registration...');
    const dupReg = await request('POST', '/api/v1/auth/register', {
      body: {
        email: testEmail,
        password: strongPassword,
        displayName: 'Imposter',
      },
    });
    assert.strictEqual(dupReg.status, 409);
    assert.strictEqual(dupReg.data.error.code, 'EMAIL_EXISTS');
    console.log('   ✅ Duplicate registration rejected with EMAIL_EXISTS.');

    // 5. Login with invalid password
    console.log('5. Testing login with invalid password...');
    const badLogin = await request('POST', '/api/v1/auth/login', {
      body: {
        email: testEmail,
        password: 'WrongPassword123!',
      },
    });
    assert.strictEqual(badLogin.status, 401);
    assert.strictEqual(badLogin.data.error.code, 'INVALID_CREDENTIALS');
    console.log('   ✅ Bad login rejected with INVALID_CREDENTIALS.');

    // 6. Login with valid password
    console.log('6. Testing login with valid password...');
    const login = await request('POST', '/api/v1/auth/login', {
      body: {
        email: testEmail,
        password: strongPassword,
      },
    });
    assert.strictEqual(login.status, 200);
    assert.strictEqual(login.data.data.user.email, testEmail);
    assert.ok(login.data.data.accessToken);
    const loginCookie = extractCookie(login.headers, 'rt');
    assert.ok(loginCookie);
    console.log('   ✅ Login succeeded with new access token and rt cookie.');

    const accessToken = login.data.data.accessToken;

    // 7. Protected route: GET /api/v1/auth/me
    console.log('7. Testing protected route /api/v1/auth/me...');
    // Without token
    const noAuth = await request('GET', '/api/v1/auth/me');
    assert.strictEqual(noAuth.status, 401);
    assert.strictEqual(noAuth.data.error.code, 'UNAUTHORIZED');

    // With invalid token
    const badToken = await request('GET', '/api/v1/auth/me', {
      headers: { Authorization: 'Bearer invalid.token.value' },
    });
    assert.strictEqual(badToken.status, 401);
    assert.strictEqual(badToken.data.error.code, 'INVALID_TOKEN');

    // With valid token
    const me = await request('GET', '/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    assert.strictEqual(me.status, 200);
    assert.strictEqual(me.data.data.user.email, testEmail);
    console.log('   ✅ Protected endpoint /me verified (unauthorized, invalid, and valid cases).');

    // 8. Refresh token rotation (Happy Path)
    console.log('8. Testing refresh token rotation (happy path)...');
    const refresh1 = await request('POST', '/api/v1/auth/refresh', {
      cookie: loginCookie,
    });
    assert.strictEqual(refresh1.status, 200);
    assert.ok(refresh1.data.data.accessToken);
    const rotatedCookie = extractCookie(refresh1.headers, 'rt');
    assert.ok(rotatedCookie);
    assert.notStrictEqual(rotatedCookie, loginCookie, 'Rotated cookie must differ from previous cookie');
    console.log('   ✅ Refresh rotation succeeded. New access token and rotated cookie issued.');

    // 9. Theft Reuse Detection (Replay old cookie!)
    console.log('9. Testing THEFT REUSE DETECTION (replaying rotated cookie)...');
    const reuseAttempt = await request('POST', '/api/v1/auth/refresh', {
      cookie: loginCookie, // Old, now-revoked cookie!
    });
    assert.strictEqual(reuseAttempt.status, 401);
    assert.strictEqual(reuseAttempt.data.error.code, 'SESSION_REVOKED');
    console.log('   ✅ Reuse detected! Server responded 401 SESSION_REVOKED.');

    // 10. Verify that even the newest token was revoked due to theft detection
    console.log('10. Verifying full session revocation after theft detection...');
    const retestNewToken = await request('POST', '/api/v1/auth/refresh', {
      cookie: rotatedCookie,
    });
    assert.strictEqual(retestNewToken.status, 401);
    assert.strictEqual(retestNewToken.data.error.code, 'SESSION_REVOKED');
    console.log('   ✅ All tokens for user were revoked. Theft defense working perfectly.');

    // 11. Logout test with a fresh user
    console.log('11. Testing logout flow...');
    const logoutEmail = `test_logout_${Date.now()}@lifeos.local`;
    const logoutUser = await request('POST', '/api/v1/auth/register', {
      body: {
        email: logoutEmail,
        password: strongPassword,
        displayName: 'Logout Tester',
      },
    });
    const logoutCookie = extractCookie(logoutUser.headers, 'rt');
    const logoutRes = await request('POST', '/api/v1/auth/logout', {
      cookie: logoutCookie,
    });
    assert.strictEqual(logoutRes.status, 200);
    assert.strictEqual(logoutRes.data.data.message, 'Logged out successfully.');

    const tryRefreshAfterLogout = await request('POST', '/api/v1/auth/refresh', {
      cookie: logoutCookie,
    });
    assert.strictEqual(tryRefreshAfterLogout.status, 401);
    console.log('   ✅ Logout verified: refresh token invalidated.');

    // Cleanup test data from DB
    await pool.query('DELETE FROM users WHERE email IN ($1, $2)', [testEmail, logoutEmail]);
    console.log('   ✅ Cleaned up test rows from database.');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(' 🎉 All 11 Backend Auth Integration Tests Passed!       ');
    console.log('═══════════════════════════════════════════════════════\n');
  } finally {
    server.close();
    await pool.end();
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  if (server) server.close();
  pool.end().finally(() => process.exit(1));
});
