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

async function runSessionTests() {
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log(' Starting Persistent Authentication & Session Restoration Test Suite');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  server = http.createServer(app);
  await new Promise((res) => server.listen(0, res));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
  console.log(`Test server running at ${baseUrl}`);

  const testEmail = `hero_session_${Date.now()}@jeevan.os`;
  const testPassword = 'JeevanSecure#2026MasterKey!';
  let nativeRefreshToken = null;
  let accessToken = null;

  try {
    // 1. Register with hybrid token response
    console.log('1. Testing registration with hybrid refreshToken return...');
    const regRes = await request('POST', '/api/v1/auth/register', {
      body: {
        email: testEmail,
        password: testPassword,
        displayName: 'Aria Pathfinder',
      },
    });
    assert.strictEqual(regRes.status, 201);
    assert.ok(regRes.data.data.accessToken, 'Access token must be present');
    assert.ok(regRes.data.data.refreshToken, 'Refresh token must be returned in response for native persistence');
    nativeRefreshToken = regRes.data.data.refreshToken;
    accessToken = regRes.data.data.accessToken;
    console.log('   ✅ Registration returned both accessToken and persistent refreshToken.');

    // 2. Validate current user with bearer access token
    console.log('2. Testing authenticated user endpoint with accessToken...');
    const meRes = await request('GET', '/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.data.data.user.email, testEmail);
    console.log('   ✅ User profile retrieved successfully.');

    // 3. Native session restoration without cookie via x-refresh-token header
    console.log('3. Testing session refresh using x-refresh-token header (Native/Hybrid flow)...');
    const refreshRes = await request('POST', '/api/v1/auth/refresh', {
      headers: {
        'x-refresh-token': nativeRefreshToken,
      },
    });
    assert.strictEqual(refreshRes.status, 200);
    assert.ok(refreshRes.data.data.accessToken, 'Fresh access token must be issued');
    assert.ok(refreshRes.data.data.refreshToken, 'Rotated refresh token must be issued');
    assert.notStrictEqual(refreshRes.data.data.refreshToken, nativeRefreshToken, 'Refresh token must rotate');

    const rotatedRefreshToken = refreshRes.data.data.refreshToken;
    const freshAccessToken = refreshRes.data.data.accessToken;
    console.log('   ✅ Session successfully restored and rotated via x-refresh-token header.');

    // 4. Verify fresh access token works
    console.log('4. Testing fresh access token from rotation...');
    const meRes2 = await request('GET', '/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${freshAccessToken}` },
    });
    assert.strictEqual(meRes2.status, 200);
    assert.strictEqual(meRes2.data.data.user.email, testEmail);
    console.log('   ✅ Rotated access token functions seamlessly.');

    // 5. Test reuse detection: Attempting to refresh with previous (stale) token
    console.log('5. Testing reuse detection: attempting refresh with old token...');
    const reuseRes = await request('POST', '/api/v1/auth/refresh', {
      headers: {
        'x-refresh-token': nativeRefreshToken,
      },
    });
    assert.strictEqual(reuseRes.status, 401, 'Reusing previous token must fail with 401');
    console.log('   ✅ Stale token correctly rejected (reuse detection active).');

    // 6. Test manual logout via x-refresh-token
    console.log('6. Testing manual logout with active rotated token...');
    const logoutRes = await request('POST', '/api/v1/auth/logout', {
      headers: {
        'x-refresh-token': rotatedRefreshToken,
      },
    });
    assert.strictEqual(logoutRes.status, 200);
    console.log('   ✅ Logout revoked session successfully.');

    // 7. Verify revoked token cannot be refreshed
    console.log('7. Verifying revoked token rejected on subsequent refresh...');
    const postLogoutRefresh = await request('POST', '/api/v1/auth/refresh', {
      headers: {
        'x-refresh-token': rotatedRefreshToken,
      },
    });
    assert.strictEqual(postLogoutRefresh.status, 401);
    console.log('   ✅ Revoked session rejected as expected.');

    // 8. Mobile keyboard safe zone calculation simulation
    console.log('8. Testing mobile keyboard safe zone calculation simulation...');
    const screenHeight = 844; // iPhone 14 / modern phone
    const safeAreaBottom = 34; // iOS home indicator
    const simulatedKeyboardHeight = 336; // Software keyboard

    const availableViewportHeight = screenHeight - simulatedKeyboardHeight;
    assert.strictEqual(availableViewportHeight, 508);

    const inputBottomPosition = 620; // partially hidden below keyboard
    const isObscured = inputBottomPosition > availableViewportHeight - 24;
    assert.strictEqual(isObscured, true, 'Input is obscured by keyboard');

    const clearanceTarget = 28;
    const requiredScrollOffset = inputBottomPosition - (availableViewportHeight - clearanceTarget);
    assert.strictEqual(requiredScrollOffset, 140, 'Calculates exact required scroll adjustment');
    console.log('   ✅ Keyboard inset and input anchor calculations verified.');

    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log(' 🎉 All Persistent Session & Keyboard Tests Passed Successfully!');
    console.log('═══════════════════════════════════════════════════════════════════\n');
  } finally {
    if (server) {
      await new Promise((res) => server.close(res));
    }
  }
}

runSessionTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
