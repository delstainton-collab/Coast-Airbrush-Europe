import assert from "assert";
import { calculatePalletDensity } from "../freight-bridge/engine/densityCalculator.js";
import { evaluateFreightRules, applyMerchantMarkup } from "../freight-bridge/engine/freightRuleEngine.js";
import { DEFAULT_COAST_SHIPPING_RULES, AccessorialType } from "../freight-bridge/core/types.js";

console.log("=== Testing Pallet Density & Freight Rule Engine ===");

// 1. Density test: 200kg of paint cans
const itemsHeavy = [
  { name: "Kroma Edge Clearcoat 5L Drum", sku: "KE-UC35-5L", quantity: 8, grams: 5500, length_cm: 20, width_cm: 20, height_cm: 30 }
];
// 8 * 5.5kg = 44kg
const densityHeavy = calculatePalletDensity(itemsHeavy);
assert.strictEqual(densityHeavy.palletCount, 1);
assert.strictEqual(densityHeavy.totalNetWeightKg, 44);
assert.strictEqual(densityHeavy.totalGrossWeightKg, 44 + 25); // 69kg including 25kg Euro pallet tare
console.log(`✔ Pallet density calculation: ${densityHeavy.totalGrossWeightKg}kg gross on ${densityHeavy.palletCount} Euro pallet`);

// 2. Freight Rule Engine: Small non-freight cart
const smallCart = {
  items: [{ name: "Anest Iwata Custom Micron Airbrush", sku: "IW-CM-C-PLUS", quantity: 1, grams: 450 }],
  destination: { country: "DE", city: "Berlin", postal_code: "10115", company: "Studio Art" }
};
const evalSmall = evaluateFreightRules(smallCart, DEFAULT_COAST_SHIPPING_RULES);
assert.strictEqual(evalSmall.isFreightEligible, false, "Small airbrush should not trigger mandatory freight");
console.log("✔ Small parcel correctly evaluated as non-freight");

// 3. Freight Rule Engine: Heavy + Hazardous Order
const hazmatCart = {
  items: [
    { name: "Kroma Edge UN1263 Reducer Solvent 20L Drum", sku: "KE-SOLV-20L", quantity: 4, grams: 21000, length_cm: 30, width_cm: 30, height_cm: 45 }
  ],
  destination: { country: "FR", city: "Lyon", postal_code: "69001", address1: "14 Rue Victor Hugo" } // residential, no company
};
const evalHazmat = evaluateFreightRules(hazmatCart, DEFAULT_COAST_SHIPPING_RULES);
assert.strictEqual(evalHazmat.isFreightEligible, true);
assert.strictEqual(evalHazmat.isFreightMandatory, true);
assert.strictEqual(evalHazmat.isHazardous, true);
assert(evalHazmat.appliedAccessorials.includes(AccessorialType.HAZARDOUS_ADR), "Must include ADR hazmat fee");
assert(evalHazmat.appliedAccessorials.includes(AccessorialType.RESIDENTIAL), "Must detect residential address");
assert(evalHazmat.appliedAccessorials.includes(AccessorialType.LIFTGATE), "Must auto-apply liftgate for heavy residential");
console.log(`✔ Hazardous heavy freight correctly evaluated: Accessorials total €${evalHazmat.accessorialTotalCents / 100}`);

// 4. Test Markup Calculation
const markup = applyMerchantMarkup(10000, { markupPercent: 15.0, markupFixedCents: 1000 });
// wholesale = 100.00 EUR (10000 cents)
// 15% margin = 15.00 EUR (1500 cents)
// fixed = 10.00 EUR (1000 cents)
// total = 125.00 EUR (12500 cents)
assert.strictEqual(markup.marginCents, 1500);
assert.strictEqual(markup.finalCustomerPriceCents, 12500);
console.log(`✔ Merchant markup verified: €${markup.baseWholesaleCents / 100} -> €${markup.finalCustomerPriceCents / 100}`);

console.log("All engine tests passed successfully! 🎉");
