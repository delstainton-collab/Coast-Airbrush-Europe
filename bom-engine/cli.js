#!/usr/bin/env node
/**
 * Coast Airbrush Europe - BOM & Workshop CLI Tool
 * 
 * Usage:
 *   node bom-engine/cli.js --summary
 *   node bom-engine/cli.js --atb <SKU>
 *   node bom-engine/cli.js --cogs <SKU>
 *   node bom-engine/cli.js --reorder
 *   node bom-engine/cli.js --build <SKU> <QTY> [--tech="Name"]
 */

import { bomEngine } from "./core/bomEngine.js";

const args = process.argv.slice(2);

function formatCurrency(val, symbol = "£") {
  return `${symbol}${(val || 0).toFixed(2)}`;
}

if (args.includes("--summary") || args.length === 0) {
  console.log("\n=============================================================");
  console.log("🏭 COAST AIRBRUSH EUROPE — WORKSHOP BOM & PRODUCTION STATUS");
  console.log("=============================================================\n");
  const recipes = bomEngine.getAllRecipes();
  console.log("MANUFACTURED PRODUCTS & KITS:");
  console.log("-------------------------------------------------------------");
  recipes.forEach(r => {
    const b = r.bottleneck;
    console.log(`• [${r.parentSku}] ${r.title} (${r.brand})`);
    console.log(`  Finished On-Shelf: ${r.finishedStockQty} | Available To Build: ${r.availableToBuild} | Total Potential: ${r.totalSellableStock}`);
    console.log(`  Landed COGS: ${formatCurrency(r.cogsSummary.totalCogsGbp)} (Margin: ${r.cogsSummary.grossMarginPct}%)`);
    if (b) {
      console.log(`  ⚠️  Bottleneck: ${b.name} (${b.sku}) - ${b.currentStock} in stock (Supplier: ${b.supplier})`);
    }
    console.log("");
  });

  const alerts = bomEngine.getReorderAlerts();
  if (alerts.length > 0) {
    console.log("⚠️  RAW MATERIALS & PACKAGING REORDER ALERTS:");
    console.log("-------------------------------------------------------------");
    alerts.forEach(a => {
      console.log(`  [${a.urgency}] ${a.name} (${a.sku}) - Stock: ${a.stockQty} (Threshold: ${a.reorderThreshold}, Lead Time: ${a.leadTimeDays}d)`);
      console.log(`    -> Suggested Order: ${a.suggestedReorder} units from ${a.supplier}`);
    });
  }
  console.log("");
  process.exit(0);
}

const atbIdx = args.indexOf("--atb");
if (atbIdx !== -1 && args[atbIdx + 1]) {
  const sku = args[atbIdx + 1];
  try {
    const atb = bomEngine.calculateAvailableToBuild(sku);
    console.log(`\n📦 AVAILABLE TO BUILD ANALYSIS FOR: ${atb.title} [${atb.parentSku}]`);
    console.log(`----------------------------------------------------------------`);
    console.log(`Finished Stock on Shelf : ${atb.currentFinishedStock}`);
    console.log(`Available To Build (ATB): ${atb.availableToBuild}`);
    console.log(`Total Sellable Potential: ${atb.totalPotentialStock}`);
    if (atb.bottleneck) {
      console.log(`Primary Bottleneck      : ${atb.bottleneck.name} (${atb.bottleneck.sku})`);
    }
    console.log("\nCOMPONENT BREAKDOWN:");
    console.log("SKU               | Qty Req | On Hand | Max Possible | Status");
    console.log("----------------------------------------------------------------");
    atb.componentBreakdown.forEach(c => {
      const bottleFlag = c.isBottleneck ? "⚠️ BOTTLENECK" : "OK";
      console.log(`${c.sku.padEnd(17)} | ${String(c.requiredQty).padStart(7)} | ${String(c.currentStock).padStart(7)} | ${String(c.maxPossible).padStart(12)} | ${bottleFlag}`);
    });
    console.log("");
  } catch (err) {
    console.error("Error:", err.message);
  }
  process.exit(0);
}

const cogsIdx = args.indexOf("--cogs");
if (cogsIdx !== -1 && args[cogsIdx + 1]) {
  const sku = args[cogsIdx + 1];
  try {
    const cogs = bomEngine.calculateRolledUpCOGS(sku);
    console.log(`\n💰 ROLLED-UP COGS BREAKDOWN: ${cogs.title} [${cogs.parentSku}]`);
    console.log(`----------------------------------------------------------------`);
    console.log(`Retail Price        : £${cogs.retailPriceGbp} / €${cogs.retailPriceEur}`);
    console.log(`Raw Materials Cost  : £${cogs.materialsGbp} / €${cogs.materialsEur}`);
    console.log(`Packaging & Manuals : £${cogs.packagingGbp} / €${cogs.packagingEur}`);
    console.log(`Direct Assembly     : £${cogs.laborGbp} / €${cogs.laborEur}`);
    console.log(`Total Landed COGS   : £${cogs.totalCogsGbp} / €${cogs.totalCogsEur}`);
    console.log(`Gross Profit / Unit : £${cogs.grossMarginGbp} (${cogs.grossMarginPct}%)`);
    console.log("\nITEMIZED PARTS:");
    cogs.itemizedBreakdown.forEach(i => {
      console.log(`  • ${i.name} (${i.sku}): ${i.qty}x @ £${i.unitCostGbp} = £${i.totalCostGbp}`);
    });
    console.log("");
  } catch (err) {
    console.error("Error:", err.message);
  }
  process.exit(0);
}

const buildIdx = args.indexOf("--build");
if (buildIdx !== -1 && args[buildIdx + 1] && args[buildIdx + 2]) {
  const sku = args[buildIdx + 1];
  const qty = parseInt(args[buildIdx + 2], 10);
  const techArg = args.find(a => a.startsWith("--tech="));
  const technician = techArg ? techArg.split("=")[1] : "CLI Workshop Tech";

  try {
    console.log(`\n⚙️  EXECUTING WORK ORDER: Building ${qty}x [${sku}]...`);
    const result = bomEngine.executeAssemblyOrder(sku, qty, {
      technician,
      notes: "Triggered via bom-engine CLI",
      syncShopify: true
    });
    console.log(`✅ WORK ORDER COMPLETED: ${result.workOrderId}`);
    console.log(`Batch Code       : ${result.batchCode}`);
    console.log(`Quantity Built   : ${result.quantityBuilt}`);
    console.log(`New Finished Qty : ${result.newFinishedStock}`);
    console.log("Components Deducted:");
    result.deductedComponents.forEach(d => {
      console.log(`  - ${d.name} (${d.sku}): -${d.quantityDeducted} (Remaining: ${d.remainingStock})`);
    });
    console.log("");
  } catch (err) {
    console.error("❌ Assembly Order Failed:", err.message);
  }
  process.exit(0);
}

const reorderIdx = args.indexOf("--reorder");
if (reorderIdx !== -1) {
  const alerts = bomEngine.getReorderAlerts();
  console.log(`\n📋 CURRENT REORDER ALERTS (${alerts.length} ITEMS):`);
  console.log("----------------------------------------------------------------");
  alerts.forEach(a => {
    console.log(`[${a.urgency}] ${a.name} (${a.sku})`);
    console.log(`  Stock: ${a.stockQty} / Min Threshold: ${a.reorderThreshold} | Lead Time: ${a.leadTimeDays} days`);
    console.log(`  Supplier: ${a.supplier} | Reorder Qty: ${a.suggestedReorder}`);
    console.log("");
  });
  process.exit(0);
}
