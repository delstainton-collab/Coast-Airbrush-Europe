import assert from "assert";
import { db } from "../freight-bridge/core/db.js";
import { CarrierRegistry } from "../freight-bridge/adapters/carrierRegistry.js";

console.log("=== Testing Carrier Adapters & Registry ===");

db.init();
const accounts = db.getCarrierAccounts("coast-airbrush-europe");
assert(accounts.length >= 2, "Seeded accounts must exist");

for (const account of accounts) {
  console.log(`\nTesting Carrier Plugin: ${account.carrierId} (${account.name})`);
  const adapter = CarrierRegistry.getAdapter(account);
  assert(adapter, `Adapter for ${account.carrierId} must instantiate`);

  // 1. Test getRates
  const rateRequest = {
    origin: { country: "NL", city: "Rotterdam", postalCode: "3011 AA" },
    destination: { country: "DE", city: "Munich", postalCode: "80331" },
    density: { palletCount: 2, chargeableWeightKg: 250 },
    appliedAccessorials: ["LIFTGATE"]
  };

  const rates = await adapter.getRates(rateRequest);
  assert(Array.isArray(rates) && rates.length > 0, "Rates must return non-empty array");
  console.log(`✔ Rates returned: ${rates.length} service option(s)`);
  for (const r of rates) {
    console.log(`   - [${r.serviceCode}] ${r.serviceName}: €${r.baseCostCents / 100} (${r.transitDays}d transit)`);
    assert(r.baseCostCents > 0, "Base cost must be positive");
    assert(r.currency === "EUR", "Currency must be EUR");
  }

  // 2. Test bookShipment
  const booking = await adapter.bookShipment({
    shipmentId: "test_shp_1",
    origin: rateRequest.origin,
    destination: rateRequest.destination,
    packages: [{ type: "EURO_PALLET", weightKg: 250 }]
  });

  assert(booking.success === true, "Booking must succeed");
  assert(booking.proNumber, "Must have generated PRO number");
  console.log(`✔ Booking succeeded! PRO: ${booking.proNumber}, Status: ${booking.status}`);

  // 3. Test trackShipment
  const tracking = await adapter.trackShipment(booking.proNumber);
  assert(tracking.proNumber === booking.proNumber, "Tracking PRO number must match");
  assert(Array.isArray(tracking.events) && tracking.events.length > 0, "Must have tracking events");
  console.log(`✔ Tracking query returned ${tracking.events.length} event(s), status: ${tracking.currentStatus}`);

  // 4. Test cancelShipment
  const cancel = await adapter.cancelShipment(booking.proNumber, "Automated test cleanup");
  assert(cancel.success === true, "Cancellation must succeed");
  console.log(`✔ Cancellation succeeded: ${cancel.message}`);
}

console.log("\nAll carrier adapter tests passed successfully! 🎉");
