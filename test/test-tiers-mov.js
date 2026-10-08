import assert from "assert";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

console.log("==================================================");
console.log("  Testing 3-Tier Pricing, MOV & Account Ordering  ");
console.log("==================================================");

// Mock browser localStorage and window for unit testing ShopifyCartManager
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};
global.window = { SHOPIFY_VARIANT_MAP: {} };

const { ShopifyCartManager, TIER_RULES } = await import("../js/shopifyCart.js");

// ----------------------------------------------------
// Part 1: ShopifyCartManager 3-Tier Business Logic
// ----------------------------------------------------
console.log("\n1. Testing Tier Rules & Configuration Definitions...");
assert(TIER_RULES.retail, "Retail tier rule must exist");
assert(TIER_RULES.dealer, "Dealer tier rule must exist");
assert(TIER_RULES.distributor, "Distributor tier rule must exist");

assert.strictEqual(TIER_RULES.retail.movThresholdGbp, 25.00);
assert.strictEqual(TIER_RULES.retail.movThresholdEur, 30.00);
assert.strictEqual(TIER_RULES.retail.smallOrderFeeGbp, 3.95);
assert.strictEqual(TIER_RULES.retail.smallOrderFeeEur, 4.50);

assert.strictEqual(TIER_RULES.dealer.movThresholdGbp, 500.00);
assert.strictEqual(TIER_RULES.dealer.movThresholdEur, 550.00);
assert.strictEqual(TIER_RULES.dealer.isHardMov, true);
assert.strictEqual(TIER_RULES.dealer.defaultMoqConsumables, 6);

assert.strictEqual(TIER_RULES.distributor.movThresholdGbp, 2000.00);
assert.strictEqual(TIER_RULES.distributor.movThresholdEur, 2500.00);
assert.strictEqual(TIER_RULES.distributor.isHardMov, true);
assert.strictEqual(TIER_RULES.distributor.defaultMoqConsumables, 12);
console.log("✔ Tier definitions and thresholds verified.");

console.log("\n2. Testing Tier 3 (Retail / Normal) Small Order Surcharge & Waiver...");
const retailCart = new ShopifyCartManager();
retailCart.clearCart();
retailCart.setTier("retail");
retailCart.setCurrency("GBP");

// Subtotal under £25.00 (e.g. £15.00)
retailCart.addItem({ sku: "TAPE-PRIME-06", priceGbp: 15.00, retailPriceGbp: 15.00, quantity: 1 });
let summary = retailCart.getCartSummary();
assert.strictEqual(summary.hasSmallOrderFee, true, "Should assess small order fee for £15 order");
assert.strictEqual(summary.smallOrderFee, 3.95, "Fee must be £3.95");
assert.strictEqual(summary.movRemaining, 10.00, "Should indicate £10.00 remaining to waive fee");
assert.strictEqual(summary.canCheckout, true, "Retail orders are never hard-blocked from checkout");
console.log("✔ £15.00 retail order correctly incurs £3.95 packaging surcharge (£10 remaining to waive).");

// Add item to reach £25.00 -> Fee waived
retailCart.addItem({ sku: "TAPE-PRIME-12", priceGbp: 10.00, retailPriceGbp: 10.00, quantity: 1 });
summary = retailCart.getCartSummary();
assert.strictEqual(summary.subtotalGbp, 25.00);
assert.strictEqual(summary.hasSmallOrderFee, false, "Small order fee should be waived at £25.00");
assert.strictEqual(summary.smallOrderFee, 0.0, "Fee should be £0.00");
assert.strictEqual(summary.movRemaining, 0.0);
console.log("✔ £25.00 retail order automatically waives small order fee.");

console.log("\n3. Testing Tier 2 (Dealer) Dual Pricing, MOV £500 & Case MOQ 6...");
const dealerCart = new ShopifyCartManager();
dealerCart.clearCart();
dealerCart.setTier("dealer", { company: "Apex Custom Paintworks Ltd", role: "dealer" });
dealerCart.setCurrency("GBP");

// Add 6 units of £50.00 trade item (retail MSRP £85.00) -> Subtotal = £300.00 (< £500.00 MOV)
dealerCart.addItem({
  sku: "KE-CHROME-1L",
  priceGbp: 50.00,
  retailPriceGbp: 85.00,
  quantity: 6,
  moq: 6
});
summary = dealerCart.getCartSummary();
assert.strictEqual(summary.isB2B, true);
assert.strictEqual(summary.subtotalGbp, 300.00);
assert.strictEqual(summary.retailSubtotalGbp, 510.00);
assert.strictEqual(summary.totalSavings, 210.00, "Dealer savings: £510 retail - £300 trade = £210");
assert.strictEqual(summary.isMovMet, false, "£300 is below £500 MOV");
assert.strictEqual(summary.canCheckout, false, "Checkout must be locked when below dealer MOV");
assert.strictEqual(summary.movRemaining, 200.00, "Remaining MOV should be £200.00");
console.log("✔ Dealer cart under MOV correctly locks checkout and computes margin savings (£210 saved).");

// Add additional units to exceed £500 MOV (add 6 more units -> £600.00)
dealerCart.addItem({
  sku: "KE-CHROME-1L",
  priceGbp: 50.00,
  retailPriceGbp: 85.00,
  quantity: 6,
  moq: 6
});
summary = dealerCart.getCartSummary();
assert.strictEqual(summary.subtotalGbp, 600.00);
assert.strictEqual(summary.isMovMet, true, "£600 satisfies £500 MOV");
assert.strictEqual(summary.canCheckout, true, "Checkout must unlock when MOV is satisfied");
assert.strictEqual(summary.movRemaining, 0.0);
console.log("✔ Dealer cart >= £500 MOV unlocks checkout.");

console.log("\n4. Testing Tier 1 (Distributor) MOV £2,000 & Master MOQ 12...");
const distCart = new ShopifyCartManager();
distCart.clearCart();
distCart.setTier("distributor", { company: "Mipa Nordic Logistics B.V.", role: "distributor" });
distCart.setCurrency("GBP");

// Add 12 units of £100 wholesale item (MSRP £220) -> Subtotal £1,200 (< £2,000 MOV)
distCart.addItem({
  sku: "FK-GUN-1000",
  priceGbp: 100.00,
  retailPriceGbp: 220.00,
  quantity: 12,
  moq: 12
});
summary = distCart.getCartSummary();
assert.strictEqual(summary.subtotalGbp, 1200.00);
assert.strictEqual(summary.isMovMet, false, "£1,200 is below £2,000 distributor MOV");
assert.strictEqual(summary.movRemaining, 800.00);
assert.strictEqual(summary.canCheckout, false);
console.log("✔ Distributor cart under £2,000 MOV correctly locked.");

// Add 12 more units -> Subtotal £2,400 (>= £2,000 MOV)
distCart.addItem({
  sku: "FK-GUN-1000",
  priceGbp: 100.00,
  retailPriceGbp: 220.00,
  quantity: 12,
  moq: 12
});
summary = distCart.getCartSummary();
assert.strictEqual(summary.subtotalGbp, 2400.00);
assert.strictEqual(summary.isMovMet, true, "£2,400 satisfies £2,000 distributor MOV");
assert.strictEqual(summary.canCheckout, true);
console.log("✔ Distributor cart >= £2,000 MOV unlocked.");

// ----------------------------------------------------
// Part 2: Server API & Credit Account Ordering Tests
// ----------------------------------------------------
console.log("\n5. Testing Server Endpoints & Account Ordering (In-Memory Handler)...");

process.env.NO_SERVER_LISTEN = "1";
const { appHandler } = await import("../server.js");

function makeMockReq({ method = "GET", url = "/", headers = {}, body = null }) {
  const payload = body ? (typeof body === "string" ? body : JSON.stringify(body)) : "";
  const req = Readable.from(payload ? [Buffer.from(payload)] : []);
  req.method = method;
  req.url = url;
  req.headers = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
  );
  if (payload) {
    req.headers["content-type"] = req.headers["content-type"] || "application/json";
    req.headers["content-length"] = String(Buffer.byteLength(payload));
  }
  return req;
}

class MockResponse {
  constructor() {
    this.statusCode = 200;
    this.headers = {};
    this.body = "";
    this._promise = new Promise(resolve => { this._resolve = resolve; });
  }
  writeHead(status, headers = {}) {
    this.statusCode = status;
    Object.assign(this.headers, headers);
  }
  setHeader(k, v) {
    this.headers[k.toLowerCase()] = v;
  }
  end(chunk) {
    if (chunk) this.body += chunk;
    this._resolve({
      status: this.statusCode,
      headers: this.headers,
      body: this.body,
      json: () => {
        try { return JSON.parse(this.body); }
        catch (e) { return null; }
      }
    });
  }
  waitForEnd() {
    return this._promise;
  }
}

async function request(options) {
  const req = makeMockReq(options);
  const res = new MockResponse();
  await appHandler(req, res);
  return await res.waitForEnd();
}

const ordersFilePath = path.join(ROOT_DIR, "data", "trade_orders.json");

// Backup existing trade orders if file exists
let originalOrdersContent = null;
if (fs.existsSync(ordersFilePath)) {
  originalOrdersContent = fs.readFileSync(ordersFilePath, "utf8");
}

try {
  // 5a. Authenticate as Dealer
  const dealerLoginRes = await request({
    method: "POST",
    url: "/api/auth/trade-login",
    body: { email: "sarah.j@apexpaint.co.uk", password: "ApexCustom2026!" }
  });
  assert.strictEqual(dealerLoginRes.status, 200);
  const dealerSession = dealerLoginRes.json();
  assert(dealerSession.success, "Dealer login must succeed");
  assert.strictEqual(dealerSession.user.role, "dealer");
  assert.strictEqual(dealerSession.user.movGbp, 500.00);
  assert.strictEqual(dealerSession.user.movEur, 550.00);
  assert.strictEqual(dealerSession.user.defaultMoq, 6);
  assert.strictEqual(dealerSession.user.creditTerms, "Net 30 Days");
  console.log("✔ Dealer login returned session with £500 MOV and Net 30 Days terms.");

  // 5b. Attempt order below Dealer MOV (< £500)
  const rejectedOrderRes = await request({
    method: "POST",
    url: "/api/trade/place-account-order",
    headers: {
      "Authorization": `Bearer ${dealerSession.token}`
    },
    body: {
      poNumber: "TEST-UNDER-MOV-PO",
      currency: "GBP",
      subtotal: 350.00,
      totalAmount: 420.00,
      items: [
        { sku: "KE-CHROME-1L", title: "Kroma Edge 1L", quantity: 6, unitPrice: 58.33, lineTotal: 350.00 }
      ]
    }
  });
  assert.strictEqual(rejectedOrderRes.status, 400, "Should reject order under £500 MOV with 400");
  const rejectedBody = rejectedOrderRes.json();
  assert(rejectedBody.error.toLowerCase().includes("minimum order value"), "Error must specify Minimum order value requirement");
  console.log(`✔ Rejected below-MOV account order: "${rejectedBody.error}"`);

  // 5c. Submit order meeting Dealer MOV (>= £500)
  const validOrderRes = await request({
    method: "POST",
    url: "/api/trade/place-account-order",
    headers: {
      "Authorization": `Bearer ${dealerSession.token}`
    },
    body: {
      poNumber: "APEX-PO-2026-999",
      billingNotes: "Deliver to Bay 3 reception.",
      currency: "GBP",
      subtotal: 600.00,
      vatAmount: 120.00,
      totalAmount: 720.00,
      items: [
        { sku: "KE-CHROME-1L", title: "Kroma Edge 1L", quantity: 12, unitPrice: 50.00, lineTotal: 600.00 }
      ]
    }
  });
  assert.strictEqual(validOrderRes.status, 201, "Valid order must return 201 Created");
  const orderBody = validOrderRes.json();
  assert(orderBody.success, "Order must succeed");
  assert(orderBody.order.orderId.startsWith("CAE-PO-"), "Must return CAE-PO-... order number");
  assert.strictEqual(orderBody.order.paymentTerms, "Net 30 Days");
  assert(orderBody.order.dueDate, "Must include dueDate");
  console.log(`✔ Approved dealer account order placed: ${orderBody.order.orderId} (Due: ${orderBody.order.dueDate})`);

  // 5d. Authenticate as Distributor
  const distLoginRes = await request({
    method: "POST",
    url: "/api/auth/trade-login",
    body: { email: "distributor@mipa-nordic.eu", password: "Distributor2026!" }
  });
  assert.strictEqual(distLoginRes.status, 200);
  const distSession = distLoginRes.json();
  assert.strictEqual(distSession.user.role, "distributor");
  assert.strictEqual(distSession.user.movGbp, 2000.00);
  assert.strictEqual(distSession.user.movEur, 2500.00);
  assert.strictEqual(distSession.user.defaultMoq, 12);
  assert(distSession.user.creditTerms.includes("Net 60 Days"), "Must include Net 60 Days terms");
  console.log("✔ Distributor login returned session with £2,000 MOV and Net 60 Days terms.");

  // 5e. Attempt order below Distributor MOV (< €2,500)
  const rejectedDistOrderRes = await request({
    method: "POST",
    url: "/api/trade/place-account-order",
    headers: {
      "Authorization": `Bearer ${distSession.token}`
    },
    body: {
      poNumber: "MIPA-LOW-EUR-PO",
      currency: "EUR",
      subtotal: 1500.00,
      totalAmount: 1500.00,
      items: [
        { sku: "FK-GUN-1000", title: "Flake King Gun", quantity: 12, unitPrice: 125.00, lineTotal: 1500.00 }
      ]
    }
  });
  assert.strictEqual(rejectedDistOrderRes.status, 400, "Should reject distributor order below €2,500 MOV");
  console.log("✔ Distributor order under €2,500 MOV correctly rejected.");

  // 5f. Submit order meeting Distributor MOV (>= €2,500)
  const validDistOrderRes = await request({
    method: "POST",
    url: "/api/trade/place-account-order",
    headers: {
      "Authorization": `Bearer ${distSession.token}`
    },
    body: {
      poNumber: "MIPA-DIST-PALLET-01",
      billingNotes: "Bonded Dutch terminal transshipment",
      currency: "EUR",
      subtotal: 3600.00,
      vatAmount: 0.00,
      totalAmount: 3600.00,
      items: [
        { sku: "FK-GUN-1000", title: "Flake King Gun", quantity: 36, unitPrice: 100.00, lineTotal: 3600.00 }
      ]
    }
  });
  assert.strictEqual(validDistOrderRes.status, 201);
  const distOrderBody = validDistOrderRes.json();
  assert(distOrderBody.success);
  assert(distOrderBody.order.paymentTerms.includes("Net 60 Days"));
  console.log(`✔ Approved distributor account order placed: ${distOrderBody.order.orderId} (Due: ${distOrderBody.order.dueDate})`);

} finally {
  // Restore orders file
  if (originalOrdersContent !== null) {
    fs.writeFileSync(ordersFilePath, originalOrdersContent, "utf8");
  } else if (fs.existsSync(ordersFilePath)) {
    fs.unlinkSync(ordersFilePath);
  }
}

console.log("\n==================================================");
console.log("  ALL 3-TIER MOV & ACCOUNT ORDERING TESTS PASSED! ");
console.log("==================================================\n");
