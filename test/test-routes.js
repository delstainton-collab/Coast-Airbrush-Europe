import assert from "assert";
import { db } from "../freight-bridge/core/db.js";
import { handleShopifyRates } from "../freight-bridge/routes/ratesRoute.js";
import { handleShopifyOrderPaidWebhook } from "../freight-bridge/routes/webhooksRoute.js";
import { handleListShipments, handleTrackShipment } from "../freight-bridge/routes/shipmentsRoute.js";

console.log("=== Testing Freight Bridge HTTP Routes & Handlers ===");

db.init();

// 1. Test Shopify CarrierService Rate Calculation
const shopifyRatePayload = {
  rate: {
    origin: {
      country: "NL",
      postal_code: "3011 AA",
      city: "Rotterdam"
    },
    destination: {
      country: "DE",
      postal_code: "80331",
      city: "Munich",
      company: "Bavaria Airbrush Customs",
      address1: "Leopoldstrasse 12"
    },
    items: [
      {
        name: "House of Kolor Kandy Basecoat 20L Drum",
        sku: "HOK-KBC-20L",
        quantity: 2,
        grams: 22000,
        price: 34000
      },
      {
        name: "Kroma Edge UN1263 Reducer Solvent 5L",
        sku: "KE-SOLV-5L",
        quantity: 4,
        grams: 5000,
        price: 6500
      }
    ],
    currency: "EUR"
  }
};

const t0 = Date.now();
const rateResponse = await handleShopifyRates(shopifyRatePayload);
const elapsedMs = Date.now() - t0;

assert(rateResponse.rates && Array.isArray(rateResponse.rates), "Must return rates array");
assert(rateResponse.rates.length > 0, "Must return at least 1 freight quote for heavy hazardous order");
assert(elapsedMs < 1000, `Rate response must be fast (<1000ms), took ${elapsedMs}ms`);

console.log(`✔ Shopify CarrierService returned ${rateResponse.rates.length} freight quotes in ${elapsedMs}ms (< 3s SLA)`);
for (const rate of rateResponse.rates) {
  console.log(`   - ${rate.service_name} (${rate.service_code}): €${(parseInt(rate.total_price, 10) / 100).toFixed(2)} [${rate.currency}]`);
  assert(rate.total_price && !isNaN(parseInt(rate.total_price, 10)), "Rate total_price must be numeric string");
}

// 2. Test Non-Eligible Cart Fallback
const lightPayload = {
  rate: {
    items: [{ name: "Fine Detail Nozzle 0.2mm", grams: 50, quantity: 1 }],
    destination: { country: "NL" }
  }
};
const lightResponse = await handleShopifyRates(lightPayload);
assert.strictEqual(lightResponse.rates.length, 0, "Light non-freight cart must return 0 freight rates");
console.log("✔ Non-freight parcel properly filtered out (Shopify falls back to parcel couriers)");

// 3. Test Webhook Ingestion
const webhookOrder = {
  id: "order_mock_991823",
  name: "#CAE-EU-991823",
  order_number: 991823,
  line_items: [
    { title: "Kroma Edge 20L Flammable Paint Drum", quantity: 2, grams: 22000, sku: "KE-DRUM-20L" }
  ],
  shipping_address: {
    first_name: "Hans",
    last_name: "Gruber",
    company: "Gruber Automotive Paint",
    address1: "Industriestrasse 4",
    city: "Stuttgart",
    zip: "70173",
    country_code: "DE",
    phone: "+49 711 555 4321"
  }
};

const webhookRes = await handleShopifyOrderPaidWebhook(JSON.stringify(webhookOrder));
assert.strictEqual(webhookRes.success, true);
assert.strictEqual(webhookRes.queued, true);
assert(webhookRes.jobId, "Must return job ID immediately");
console.log(`✔ Webhook ingested and dispatched to queue with job ID: ${webhookRes.jobId}`);

// 4. Test Shipment Query
const shipments = await handleListShipments("coast-airbrush-europe");
assert(shipments.length > 0, "Must list shipments in DB");
console.log(`✔ Retrieved ${shipments.length} active shipment record(s)`);

console.log("\nAll route and handler tests passed successfully! 🎉");
