process.env.NO_SERVER_LISTEN = "true";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Writable } from "node:stream";
import { EventEmitter } from "node:events";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.dirname(__dirname);

const { appHandler } = await import("../server.js");

class MockResponse extends Writable {
  constructor() {
    super();
    this.statusCode = 200;
    this.headers = {};
    this.body = "";
  }
  writeHead(status, headers = {}) {
    this.statusCode = status;
    Object.assign(this.headers, headers);
    return this;
  }
  setHeader(key, value) {
    this.headers[key] = value;
  }
  getHeader(key) {
    return this.headers[key];
  }
  _write(chunk, encoding, callback) {
    this.body += chunk.toString();
    callback();
  }
}

function mockRequest(url, headers = {}) {
  const req = new EventEmitter();
  req.url = url;
  req.method = "GET";
  req.headers = { host: "coastairbrush.eu", ...headers };
  req.on = function(event, listener) {
    EventEmitter.prototype.on.call(this, event, listener);
    if (event === "end") {
      process.nextTick(listener);
    }
    return this;
  };
  return req;
}

describe("Partner & VIP Backdoor Access Suite", () => {

  it("1. landing.html contains secure partner modal and does not leak credentials", () => {
    const landingHtml = fs.readFileSync(path.join(ROOT_DIR, "landing.html"), "utf8");
    
    // Modal existence
    assert.ok(landingHtml.includes('id="partner-backdoor-modal"'), "Modal container exists");
    assert.ok(landingHtml.includes('id="partner-passcode-input"'), "Passcode input exists");
    assert.ok(landingHtml.includes('id="btn-partner-unlock"'), "Unlock button exists");
    assert.ok(landingHtml.includes('openPartnerBackdoorModal()'), "Trigger function exists");
    
    // Security checks: Passcode and bypass URL are NOT revealed to users
    assert.ok(!landingHtml.includes("e.g. COAST2026"), "Passcode hint removed from placeholder");
    assert.ok(!landingHtml.includes("https://coastairbrush.eu/?partner=vip"), "Bypass link removed from modal");
    assert.ok(landingHtml.includes("Enter authorized partner passcode"), "Secure placeholder used");

    // Cryptographic security
    assert.ok(landingHtml.includes("AUTHORIZED_HASHES") || landingHtml.includes("/api/auth/partner-verify"), "Secured with hashes or server verification");

    // Header & Footer backdoor triggers
    assert.ok(landingHtml.includes('openPartnerBackdoorModal()'), "Backdoor trigger wired in UI");
    assert.ok(landingHtml.includes('id="unlocked-storefront-btn"'), "Unlocked storefront quick-enter button exists");

    // Auto-bypass script checks
    assert.ok(landingHtml.includes("partnerKey || isDevOrPreview"), "Auto-bypass checks partner and preview query params");
    assert.ok(landingHtml.includes("coast_partner_access"), "Persists coast_partner_access cookie & storage");
  });

  it("2. index.html and all sub-pages have upgraded pre-launch holding gate", () => {
    const pages = [
      "index.html",
      "product.html",
      "about.html",
      "dealers.html",
      "support.html",
      "shipping.html",
      "privacy.html",
      "crm.html",
      "preview_compromises.html"
    ];

    for (const page of pages) {
      const content = fs.readFileSync(path.join(ROOT_DIR, page), "utf8");
      assert.ok(content.includes("PRE-LAUNCH HOLDING GATE & DEV/PARTNER MODE ACCESS"), `${page} has upgraded pre-launch header`);
      assert.ok(content.includes("hasPartnerParam"), `${page} checks partner parameter`);
      assert.ok(content.includes("isShopify"), `${page} checks Shopify environment`);
      assert.ok(content.includes("coast_partner_access"), `${page} checks partner cookie/storage`);
    }

    // index.html specific checks
    const indexHtml = fs.readFileSync(path.join(ROOT_DIR, "index.html"), "utf8");
    assert.ok(indexHtml.includes("exitPartnerPreview"), "index.html defines exitPartnerPreview()");
    assert.ok(indexHtml.includes("Exit Preview"), "index.html has Exit Preview button in dev-mode-bar");
  });

  it("3. vercel.json redirect rules exempt partner queries and preview cookies", () => {
    const vercelConfig = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "vercel.json"), "utf8"));
    assert.ok(Array.isArray(vercelConfig.redirects), "redirects array exists");

    for (const rule of vercelConfig.redirects) {
      if (rule.destination === "/landing.html") {
        const missingKeys = rule.missing.map(m => m.key);
        assert.ok(missingKeys.includes("partner"), `Rule for ${rule.source} exempts partner query`);
        assert.ok(missingKeys.includes("access"), `Rule for ${rule.source} exempts access query`);
        assert.ok(missingKeys.includes("coast_store_preview"), `Rule for ${rule.source} exempts coast_store_preview cookie`);
        assert.ok(missingKeys.includes("coast_partner_access"), `Rule for ${rule.source} exempts coast_partner_access cookie`);
      }
    }
  });

  it("4. server.js static router allows partner query access and sets 30-day cookies", async () => {
    // Test A: Request with partner query bypasses landing and sets cookies
    const reqA = mockRequest("/?partner=vip");
    const resA = new MockResponse();
    await new Promise(resolve => {
      resA.on("finish", resolve);
      appHandler(reqA, resA);
    });

    assert.equal(resA.statusCode, 200);
    assert.ok(resA.body.includes("Coast Airbrush Europe"), "Serves storefront page");
    const setCookies = resA.headers["Set-Cookie"] || [];
    const cookieStr = Array.isArray(setCookies) ? setCookies.join("; ") : setCookies;
    assert.ok(cookieStr.includes("coast_partner_access=true"), "Sets coast_partner_access cookie");
    assert.ok(cookieStr.includes("Max-Age=2592000"), "Cookie has 30-day Max-Age (2592000s)");

    // Test B: Request with access query bypasses landing
    const reqB = mockRequest("/?access=coast2026");
    const resB = new MockResponse();
    await new Promise(resolve => {
      resB.on("finish", resolve);
      appHandler(reqB, resB);
    });
    assert.equal(resB.statusCode, 200);
    assert.ok(resB.body.includes("Coast Airbrush Europe"));

    // Test C: Request with partner cookie bypasses landing
    const reqC = mockRequest("/", { cookie: "coast_partner_access=true" });
    const resC = new MockResponse();
    await new Promise(resolve => {
      resC.on("finish", resolve);
      appHandler(reqC, resC);
    });
    assert.equal(resC.statusCode, 200);
    assert.ok(resC.body.includes("Coast Airbrush Europe"));

    // Test D: Request WITHOUT bypass query or cookie in production mode bounces to landing.html
    const reqD = mockRequest("/", { host: "coastairbrush.eu" });
    const resD = new MockResponse();
    // Simulate non-dev environment
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      await new Promise(resolve => {
        resD.on("finish", resolve);
        appHandler(reqD, resD);
      });
      assert.equal(resD.statusCode, 200);
      assert.ok(resD.body.includes("Stay Ahead of the Launch") || resD.body.includes("welcome-card"), "Serves landing.html to public");
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });

  it("5. Shopify theme zip contains enhanced partner password template", () => {
    const themeZipPath = path.join(ROOT_DIR, "coast-airbrush-eu-shopify-theme.zip");
    assert.ok(fs.existsSync(themeZipPath), "Theme zip exists");
    assert.ok(fs.statSync(themeZipPath).size > 1000000, "Theme zip has valid size (>1MB)");

    const rebuildScript = fs.readFileSync(path.join(ROOT_DIR, "scripts", "rebuild_shopify_theme.py"), "utf8");
    assert.ok(rebuildScript.includes("Trade Partner &amp; VIP Storefront Access"), "Theme script includes VIP access button in password template");
    assert.ok(rebuildScript.includes("Enter Storefront Password"), "Theme script provides clear placeholder");
  });

  it("6. server endpoint POST /api/auth/partner-verify securely validates passcodes with rate limiting", async () => {
    function mockPostRequest(url, body, ip = "127.0.0.1") {
      const req = new EventEmitter();
      req.url = url;
      req.method = "POST";
      req.headers = { host: "coastairbrush.eu", "content-type": "application/json", "x-forwarded-for": ip };
      req.on = function(event, listener) {
        EventEmitter.prototype.on.call(this, event, listener);
        if (event === "data") {
          process.nextTick(() => listener(Buffer.from(JSON.stringify(body))));
        } else if (event === "end") {
          process.nextTick(listener);
        }
        return this;
      };
      return req;
    }

    // A: Valid passcode COAST2026 succeeds and sets 30-day cookie
    const reqA = mockPostRequest("/api/auth/partner-verify", { passcode: "COAST2026" }, "10.0.0.1");
    const resA = new MockResponse();
    await new Promise(resolve => {
      resA.on("finish", resolve);
      appHandler(reqA, resA);
    });
    assert.equal(resA.statusCode, 200);
    const jsonA = JSON.parse(resA.body);
    assert.equal(jsonA.success, true);
    assert.ok(resA.headers["Set-Cookie"].some(c => c.includes("coast_partner_access=true")));

    // B: Invalid passcode returns 401
    const reqB = mockPostRequest("/api/auth/partner-verify", { passcode: "WRONG_CODE" }, "10.0.0.2");
    const resB = new MockResponse();
    await new Promise(resolve => {
      resB.on("finish", resolve);
      appHandler(reqB, resB);
    });
    assert.equal(resB.statusCode, 401);
    const jsonB = JSON.parse(resB.body);
    assert.equal(jsonB.success, false);

    // C: Rate limiting after 5 failures triggers 429 lockout
    const testIp = "10.0.0.99";
    for (let i = 0; i < 4; i++) {
      const req = mockPostRequest("/api/auth/partner-verify", { passcode: "BAD" }, testIp);
      const res = new MockResponse();
      await new Promise(r => { res.on("finish", r); appHandler(req, res); });
      assert.equal(res.statusCode, 401);
    }
    const req5 = mockPostRequest("/api/auth/partner-verify", { passcode: "BAD" }, testIp);
    const res5 = new MockResponse();
    await new Promise(r => { res5.on("finish", r); appHandler(req5, res5); });
    assert.equal(res5.statusCode, 429);
    assert.ok(JSON.parse(res5.body).error.includes("locked"));
  });

});
