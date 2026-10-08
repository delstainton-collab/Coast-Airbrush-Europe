import assert from "assert";
import { Readable } from "stream";
import { freightBridgeHandler } from "../freight-bridge/server.js";
import { db } from "../freight-bridge/core/db.js";
import { bookingQueue } from "../freight-bridge/services/bookingQueue.js";

console.log("=================================================");
console.log("  Running Freight Carrier Bridge End-to-End Suite ");
console.log("=================================================");

db.init();

function dispatch(options) {
  const { method = "GET", url = "/", headers = {}, body = null } = options;
  const req = new Readable({
    read() {
      if (body) {
        this.push(typeof body === "string" ? body : JSON.stringify(body));
      }
      this.push(null);
    }
  });
  req.method = method;
  req.url = url;
  req.headers = headers;

  let statusCode = 200;
  let responseHeaders = {};
  let responseBody = "";

  return new Promise(async (resolve, reject) => {
    const res = {
      writeHead(code, h = {}) {
        statusCode = code;
        responseHeaders = { ...responseHeaders, ...h };
      },
      setHeader(k, v) {
        responseHeaders[k.toLowerCase()] = v;
      },
      end(chunk) {
        if (chunk) responseBody += chunk;
        resolve({
          statusCode,
          headers: responseHeaders,
          body: responseBody,
          json: () => JSON.parse(responseBody),
          text: () => responseBody
        });
      }
    };

    try {
      await freightBridgeHandler(req, res);
    } catch (e) {
      reject(e);
    }
  });
}

// 1. Health check
console.log("\n1. Testing GET /api/freight/health...");
const resHealth = await dispatch({ method: "GET", url: "/api/freight/health" });
assert.strictEqual(resHealth.statusCode, 200);
const healthJson = resHealth.json();
assert.strictEqual(healthJson.status, "healthy");
console.log("✔ Health check passed:", healthJson.service);

// 2. Fetch Rules
console.log("\n2. Testing GET /api/freight/rules...");
const resRules = await dispatch({ method: "GET", url: "/api/freight/rules?tenant_id=coast-airbrush-europe" });
assert.strictEqual(resRules.statusCode, 200);
const rulesJson = resRules.json();
assert(rulesJson.rules.minFreightWeightKg > 0);
console.log(`✔ Freight rules retrieved: Trigger at >= ${rulesJson.rules.minFreightWeightKg}kg, Margin: ${rulesJson.rules.markupPercent}%`);

// 3. Update Rules
console.log("\n3. Testing PUT /api/freight/rules...");
const resUpdateRules = await dispatch({
  method: "PUT",
  url: "/api/freight/rules?tenant_id=coast-airbrush-europe",
  headers: { "Content-Type": "application/json" },
  body: { markupPercent: 18.0 }
});
const updateJson = resUpdateRules.json();
assert.strictEqual(updateJson.rules.markupPercent, 18.0);
console.log("✔ Freight rules updated successfully to 18% margin");

// Restore margin to 15%
await dispatch({
  method: "PUT",
  url: "/api/freight/rules?tenant_id=coast-airbrush-europe",
  headers: { "Content-Type": "application/json" },
  body: { markupPercent: 15.0 }
});

// 4. List Carrier Accounts
console.log("\n4. Testing GET /api/freight/carriers...");
const resCarriers = await dispatch({ method: "GET", url: "/api/freight/carriers?tenant_id=coast-airbrush-europe" });
const carriersJson = resCarriers.json();
assert(carriersJson.carriers.length >= 2);
console.log(`✔ Retrieved ${carriersJson.carriers.length} encrypted carrier accounts`);

// 5. Test Live Shopify CarrierService Rates
console.log("\n5. Testing POST /api/freight/rates (Shopify Checkout)...");
const checkoutPayload = {
  rate: {
    origin: {
      country: "NL",
      postal_code: "3011 AA",
      city: "Rotterdam"
    },
    destination: {
      country: "FR",
      postal_code: "75001",
      city: "Paris",
      address1: "12 Boulevard Saint-Germain",
      residential: true
    },
    items: [
      {
        name: "Kroma Edge UN1263 Reducer Solvent 20L Drum",
        sku: "KE-SOLV-20L",
        quantity: 4,
        grams: 22000,
        price: 25000
      },
      {
        name: "Custom Paint Clearcoat 5L",
        sku: "CAE-UC35",
        quantity: 2,
        grams: 5500,
        price: 11000
      }
    ],
    currency: "EUR"
  }
};

const t0 = Date.now();
const resRates = await dispatch({
  method: "POST",
  url: "/api/freight/rates",
  headers: { "Content-Type": "application/json" },
  body: checkoutPayload
});
const rateLatency = Date.now() - t0;
assert.strictEqual(resRates.statusCode, 200);
const rateData = resRates.json();

assert(rateData.rates.length > 0, "Must return active carrier rates");
assert(rateLatency < 1000, `Rate latency must be <1s (Shopify limit 10s), was ${rateLatency}ms`);
console.log(`✔ Rates computed in ${rateLatency}ms with ${rateData.rates.length} carrier options:`);
for (const r of rateData.rates) {
  console.log(`   - ${r.service_name}: €${(parseInt(r.total_price) / 100).toFixed(2)}`);
}

// 6. Test Webhook Ingestion & Asynchronous Booking
console.log("\n6. Testing POST /api/freight/webhooks/orders-paid...");
const orderWebhookPayload = {
  id: 88472910,
  name: "#CAE-ORDER-884729",
  order_number: 884729,
  line_items: [
    { name: "Kroma Edge UN1263 Flammable Lacquer Drum 20L", quantity: 3, grams: 22000, sku: "KE-LTL-DRUM" }
  ],
  shipping_address: {
    first_name: "Jean",
    last_name: "Dupont",
    company: "Atelier Custom Paris",
    address1: "44 Rue de Rivoli",
    city: "Paris",
    zip: "75004",
    country_code: "FR",
    phone: "+33 1 42 68 00 00"
  }
};

const resWebhook = await dispatch({
  method: "POST",
  url: "/api/freight/webhooks/orders-paid",
  headers: { "Content-Type": "application/json" },
  body: orderWebhookPayload
});
const webhookJson = resWebhook.json();
assert.strictEqual(webhookJson.queued, true);
console.log(`✔ Order webhook accepted and queued: Job ID ${webhookJson.jobId}`);

// Wait for queue processing to complete
console.log("Waiting for background booking worker to finalize dispatch...");
const completedResult = await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error("Queue execution timeout")), 8000);
  bookingQueue.once("job:completed", ({ job, result }) => {
    clearTimeout(timer);
    resolve({ job, result });
  });
});

const proNumber = completedResult.result.proNumber;
console.log(`✔ Freight dispatch finalized! PRO Number: ${proNumber}`);

// 7. Verify Bill of Lading (CMR / BOL) Retrieval
console.log(`\n7. Testing GET /api/freight/bol/${proNumber}...`);
const resBol = await dispatch({
  method: "GET",
  url: `/api/freight/bol/${proNumber}`
});
assert.strictEqual(resBol.statusCode, 200);
const bolHtml = resBol.text();
assert(bolHtml.includes("INTERNATIONAL FREIGHT BILL OF LADING"));
assert(bolHtml.includes(proNumber));
assert(bolHtml.includes("Atelier Custom Paris"));
assert(bolHtml.includes("DANGEROUS GOODS DECLARATION"));
console.log(`✔ Verified Bill of Lading HTML document (${bolHtml.length} bytes)`);

// 8. Test Real-time Tracking Query
console.log(`\n8. Testing GET /api/freight/track/${proNumber}...`);
const resTrack = await dispatch({
  method: "GET",
  url: `/api/freight/track/${proNumber}`
});
assert.strictEqual(resTrack.statusCode, 200);
const trackJson = resTrack.json();
assert.strictEqual(trackJson.proNumber, proNumber);
assert(trackJson.events.length > 0);
console.log(`✔ Live tracking confirmed: Status is ${trackJson.currentStatus}, Milestones: ${trackJson.events.length}`);

// 9. Test Shipment Cancellation
console.log(`\n9. Testing POST /api/freight/shipments/${proNumber}/cancel...`);
const resCancel = await dispatch({
  method: "POST",
  url: `/api/freight/shipments/${proNumber}/cancel`,
  headers: { "Content-Type": "application/json" },
  body: { reason: "End-to-end test verification cancellation" }
});
assert.strictEqual(resCancel.statusCode, 200);
const cancelJson = resCancel.json();
assert.strictEqual(cancelJson.status, "CANCELLED");
console.log("✔ Shipment cancellation verified");

// 10. Dashboard UI Availability
console.log("\n10. Testing GET / (Dashboard UI)...");
const resUi = await dispatch({ method: "GET", url: "/" });
assert.strictEqual(resUi.statusCode, 200);
const uiHtml = resUi.text();
assert(uiHtml.includes("Shopify Freight Carrier Bridge"));
console.log("✔ Operator Dashboard UI successfully served");

console.log("\n=================================================");
console.log("  ALL END-TO-END FREIGHT BRIDGE TESTS PASSED! 🎉  ");
console.log("=================================================\n");
