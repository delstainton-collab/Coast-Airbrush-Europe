import assert from 'assert';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { authMiddleware, setupAuthRoutes } = require('/Volumes/Media SSD/Antigravtiy Mission Control/auth.js');

console.log("=================================================");
console.log("🛡️  TESTING DAS64 MISSION CONTROL AUTH GATE");
console.log("=================================================\n");

// Mock Express App
const routes = new Map();
const mockApp = {
  post: (path, handler) => routes.set(`POST:${path}`, handler),
  get: (path, handler) => routes.set(`GET:${path}`, handler),
  use: () => {}
};

setupAuthRoutes(mockApp);

// Test 1: Route Setup
console.log("[Test 1] Verifying Auth Route Handlers...");
assert(routes.has('POST:/api/auth/login'), 'POST /api/auth/login must be registered');
assert(routes.has('POST:/api/auth/logout'), 'POST /api/auth/logout must be registered');
assert(routes.has('GET:/api/auth/status'), 'GET /api/auth/status must be registered');
console.log("  ✓ All authentication endpoints registered.");

// Test 2: Invalid Login Attempt
console.log("\n[Test 2] Testing Invalid Password...");
let resStatus = null;
let resJson = null;
const mockRes = {
  status: (s) => { resStatus = s; return mockRes; },
  json: (j) => { resJson = j; },
  cookie: () => {},
  clearCookie: () => {}
};

routes.get('POST:/api/auth/login')({
  body: { password: 'wrongpassword' },
  headers: {},
  socket: { remoteAddress: '127.0.0.1' }
}, mockRes);

assert.strictEqual(resStatus, 401, 'Should return 401 for wrong password');
assert.strictEqual(resJson.error, 'Invalid access key. Access denied.');
console.log("  ✓ Successfully rejected incorrect password with 401.");

// Test 3: Valid Login Attempt
console.log("\n[Test 3] Testing Valid Password...");
let setCookieName = null;
let setCookieVal = null;
const mockResSuccess = {
  status: (s) => { resStatus = s; return mockResSuccess; },
  json: (j) => { resJson = j; },
  cookie: (name, val) => { setCookieName = name; setCookieVal = val; }
};

routes.get('POST:/api/auth/login')({
  body: { password: 'das64control', rememberMe: true },
  headers: {},
  socket: { remoteAddress: '127.0.0.1' }
}, mockResSuccess);

assert.strictEqual(resJson.success, true, 'Login should succeed');
assert.strictEqual(setCookieName, 'mc_session', 'Should set mc_session cookie');
assert(setCookieVal && setCookieVal.includes(':'), 'Session token should be HMAC-signed');
console.log(`  ✓ Login successful. Session token generated: ${setCookieVal.slice(0, 20)}...`);

// Test 4: Middleware Unauthenticated Guard
console.log("\n[Test 4] Testing Auth Middleware Unauthenticated Bouncing...");
let redirectedUrl = null;
const mockResRedirect = {
  redirect: (url) => { redirectedUrl = url; },
  status: (s) => { resStatus = s; return mockResRedirect; },
  json: (j) => { resJson = j; }
};

authMiddleware({
  path: '/',
  headers: {}
}, mockResRedirect, () => {
  assert.fail('Should not call next() for unauthenticated browser visit');
});

assert.strictEqual(redirectedUrl, '/login.html', 'Should redirect unauthenticated browser to /login.html');
console.log("  ✓ Unauthenticated browser request correctly redirected to /login.html.");

// Test 5: API Unauthenticated 401 Guard
console.log("\n[Test 5] Testing Auth Middleware API 401 Guard...");
authMiddleware({
  path: '/api/projects',
  headers: {}
}, mockResRedirect, () => {
  assert.fail('Should not call next() for unauthenticated API call');
});

assert.strictEqual(resStatus, 401, 'Should return 401 for unauthenticated API');
assert(resJson.authRequired === true, 'JSON should indicate authRequired');
console.log("  ✓ Unauthenticated API call correctly blocked with 401 JSON.");

// Test 6: Authenticated Session Pass-Through
console.log("\n[Test 6] Testing Valid Session Cookie Pass-Through...");
let passedThrough = false;
authMiddleware({
  path: '/',
  headers: {
    cookie: `mc_session=${setCookieVal}`
  }
}, mockResRedirect, () => {
  passedThrough = true;
});

assert(passedThrough === true, 'Valid cookie should allow access through to dashboard');
console.log("  ✓ Valid session cookie correctly authorized and granted access!");

console.log("\n=================================================");
console.log("✅ ALL DAS64 AUTH GATE TESTS PASSED (6/6)");
console.log("=================================================\n");
