import assert from "assert";
import fs from "fs";
import { db } from "../freight-bridge/core/db.js";
import { bookingQueue } from "../freight-bridge/services/bookingQueue.js";
import { ShopifyClient } from "../freight-bridge/services/shopifyClient.js";

console.log("=== Testing Booking Queue, BOL Generator & Shopify Client ===");

db.init();

// 1. Test Shopify Client Mock Registration
const shopify = new ShopifyClient("coast-airbrush-europe.myshopify.com");
const csReg = await shopify.registerCarrierService("https://api.coastairbrush.eu/api/freight/rates");
assert(csReg.success && csReg.carrier_service, "CarrierService registration mock should succeed");
console.log(`✔ Shopify CarrierService client registration: ID ${csReg.carrier_service.id}`);

// 2. Test Booking Queue & BOL generation
const orderPayload = {
  tenantId: "coast-airbrush-europe",
  orderId: "shopify_order_99812",
  orderNumber: "#CAE-EU-10492",
  items: [
    { name: "Kroma Edge UN1263 Reducer Solvent 20L Drum", sku: "KE-SOLV-20L", quantity: 3, grams: 20000, length_cm: 30, width_cm: 30, height_cm: 45 },
    { name: "Kroma Edge Custom Lacquer Pallet Kit", sku: "KE-BULK-PALLET", quantity: 1, grams: 80000, length_cm: 60, width_cm: 40, height_cm: 50 }
  ],
  destination: {
    name: "Marco Rossi",
    company: "Milano Custom Garage SRL",
    address1: "Via Montenapoleone 18",
    city: "Milano",
    postal_code: "20121",
    country: "IT",
    phone: "+39 02 555 1234"
  }
};

console.log("Enqueuing freight booking job...");
const job = await bookingQueue.enqueue(orderPayload);
assert.strictEqual(job.status, "QUEUED");

// Wait for queue worker to process job
await new Promise(resolve => {
  bookingQueue.once("job:completed", ({ job: completedJob, result }) => {
    assert.strictEqual(completedJob.id, job.id);
    assert.strictEqual(completedJob.status, "COMPLETED");
    assert(result.proNumber, "Completed job must have PRO number");
    assert(result.bolUrl, "Completed job must have BOL URL");

    console.log(`✔ Queue completed job ${completedJob.id} -> PRO: ${result.proNumber}`);

    // Verify shipment was saved in DB
    const shipment = db.getShipment(result.shipmentId);
    assert(shipment, "Shipment record must exist in DB");
    assert.strictEqual(shipment.proNumber, result.proNumber);
    assert.strictEqual(shipment.orderNumber, "#CAE-EU-10492");

    // Verify BOL file exists on disk
    assert(fs.existsSync(shipment.bolFilePath), `BOL file must exist at ${shipment.bolFilePath}`);
    const bolHtml = fs.readFileSync(shipment.bolFilePath, "utf8");
    assert(bolHtml.includes(result.proNumber), "BOL HTML must contain PRO number");
    assert(bolHtml.includes("DANGEROUS GOODS DECLARATION"), "BOL HTML must include ADR hazmat declaration");
    assert(bolHtml.includes("EUR-EPAL 1"), "BOL HTML must include Euro pallet packaging spec");
    console.log(`✔ BOL Document verified on disk (${bolHtml.length} bytes HTML with SVG barcode & ADR notice)`);

    resolve();
  });
});

console.log("\nAll service tests passed successfully! 🎉");
