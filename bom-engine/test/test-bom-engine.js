/**
 * Automated Test Suite for Coast Airbrush Europe BOM & Manufacturing Engine
 */

import assert from "assert";
import { BomEngine } from "../core/bomEngine.js";

async function runTests() {
  console.log("=================================================");
  console.log("🏭 COAST AIRBRUSH EUROPE: BOM ENGINE TEST SUITE");
  console.log("=================================================\n");

  const engine = new BomEngine();

  // Test 1: Components and Recipes Load Correctly
  console.log("[Test 1] Verifying Data Loading...");
  const components = engine.getAllComponents();
  const recipes = engine.getAllRecipes();
  assert(components.length > 15, `Expected > 15 components, found ${components.length}`);
  assert(recipes.length >= 5, `Expected >= 5 recipes, found ${recipes.length}`);
  console.log(`  ✓ Loaded ${components.length} registered components and ${recipes.length} BOM recipes.`);

  // Test 2: Calculate Available To Build (VsionAir Goalie Mask Jig)
  console.log("\n[Test 2] Testing Available-To-Build (ATB) for VsionAir Goalie Mask Jig...");
  const vaxAtb = engine.calculateAvailableToBuild("VAX-JG-GLMSK");
  assert(typeof vaxAtb.availableToBuild === "number", "availableToBuild should be a number");
  assert(vaxAtb.bottleneck !== null, "Should identify a bottleneck component");
  console.log(`  ✓ Current Finished Stock: ${vaxAtb.currentFinishedStock}`);
  console.log(`  ✓ Available-To-Build: ${vaxAtb.availableToBuild} units`);
  console.log(`  ✓ Total Sellable Potential: ${vaxAtb.totalPotentialStock} units`);
  console.log(`  ✓ Bottleneck Component: ${vaxAtb.bottleneck.name} (SKU: ${vaxAtb.bottleneck.sku}, Stock: ${vaxAtb.bottleneck.currentStock}, Max Units: ${vaxAtb.bottleneck.maxPossible})`);

  // Test 3: Calculate Available To Build (Flake King 1000)
  console.log("\n[Test 3] Testing ATB for Flake King 1000 Dry Gun...");
  const fkAtb = engine.calculateAvailableToBuild("FOM1000");
  assert(typeof fkAtb.availableToBuild === "number", "availableToBuild should be a number");
  assert(fkAtb.bottleneck !== null, "Should identify a bottleneck component");
  console.log(`  ✓ Flake King 1000 ATB: ${fkAtb.availableToBuild} units (Bottleneck: ${fkAtb.bottleneck.name})`);

  // Test 4: Rolled-up COGS & Gross Margin Calculation
  console.log("\n[Test 4] Testing Rolled-Up COGS & Margin Roll-up...");
  const cogs = engine.calculateRolledUpCOGS("FOM1000");
  assert(cogs.totalCogsGbp > 0, "Total COGS should be greater than 0");
  assert(cogs.grossMarginPct > 0, "Gross margin should be positive");
  console.log(`  ✓ Retail Price: £${cogs.retailPriceGbp}`);
  console.log(`  ✓ Materials Cost: £${cogs.materialsGbp}`);
  console.log(`  ✓ Packaging & Docs: £${cogs.packagingGbp}`);
  console.log(`  ✓ Direct Assembly Labor: £${cogs.laborGbp}`);
  console.log(`  ✓ Total Landed COGS: £${cogs.totalCogsGbp}`);
  console.log(`  ✓ Gross Margin: £${cogs.grossMarginGbp} (${cogs.grossMarginPct}%)`);
  assert(cogs.grossMarginPct > 50, `Expected gross margin > 50%, got ${cogs.grossMarginPct}%`);

  // Test 5: Reorder Alerts
  console.log("\n[Test 5] Checking Low-Stock Reorder Alerts...");
  const alerts = engine.getReorderAlerts();
  console.log(`  ✓ Found ${alerts.length} components needing reorder:`);
  alerts.forEach(a => {
    console.log(`    - [${a.urgency}] ${a.name} (${a.sku}): Stock ${a.stockQty} <= Threshold ${a.reorderThreshold} (Supplier: ${a.supplier})`);
  });

  // Test 6: Assembly Execution & Stock Mutation
  console.log("\n[Test 6] Testing Assembly Order Execution (Building 2x Flake King 500)...");
  const beforeRecipe = engine.getRecipe("FOM500");
  const beforeStock = beforeRecipe.finishedStockQty;
  const jarBefore = engine.getComponent("FK-JAR-30").stockQty;

  const result = engine.executeAssemblyOrder("FOM500", 2, {
    technician: "Unit Test Automated Bench",
    notes: "Automated test production run"
  });

  assert(result.success === true, "Assembly execution should succeed");
  const afterRecipe = engine.getRecipe("FOM500");
  const jarAfter = engine.getComponent("FK-JAR-30").stockQty;

  assert.strictEqual(afterRecipe.finishedStockQty, beforeStock + 2, "Finished stock should increase by 2");
  assert(jarAfter < jarBefore, "Component jar stock should have decreased");
  console.log(`  ✓ Work Order Generated: ${result.workOrderId}`);
  console.log(`  ✓ Finished Stock: ${beforeStock} -> ${afterRecipe.finishedStockQty}`);
  console.log(`  ✓ 30g Jar Component Stock: ${jarBefore} -> ${jarAfter}`);

  // Test 7: Over-Assembly Prevention Guard
  console.log("\n[Test 7] Testing Over-Assembly Stock Guard...");
  let errorCaught = false;
  try {
    engine.executeAssemblyOrder("FOM500", 99999);
  } catch (err) {
    errorCaught = true;
    console.log(`  ✓ Successfully blocked excessive build: "${err.message}"`);
  }
  assert(errorCaught, "Should throw error when attempting to build more than Available-To-Build");

  console.log("\n=================================================");
  console.log("✅ ALL BOM ENGINE TESTS PASSED SUCCESSFULLY (7/7)");
  console.log("=================================================\n");
}

runTests().catch(err => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
