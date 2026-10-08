/**
 * Coast Airbrush Europe - Manufacturing Bill of Materials (BOM) & Assembly Engine
 * 
 * Manages raw hardware, machined components, packaging, assembly recipes,
 * Available-To-Build (ATB) simulations, rolled-up COGS, and production work orders.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENGINE_ROOT = path.dirname(__dirname);
const DATA_DIR = path.join(ENGINE_ROOT, "data");

const REGISTRY_PATH = path.join(DATA_DIR, "components_registry.json");
const RECIPES_PATH = path.join(DATA_DIR, "product_recipes.json");
const HISTORY_PATH = path.join(DATA_DIR, "production_history.json");
const SHOPIFY_MAP_PATH = path.join(path.dirname(ENGINE_ROOT), "data", "shopify_variant_map.json");

export class BomEngine {
  constructor() {
    this.refresh();
  }

  refresh() {
    this.components = this._loadJson(REGISTRY_PATH, {});
    this.recipes = this._loadJson(RECIPES_PATH, {});
    this.history = this._loadJson(HISTORY_PATH, []);
  }

  _loadJson(filePath, fallback) {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
      }
    } catch (err) {
      console.warn(`[BomEngine] Could not load ${filePath}, using fallback:`, err.message);
    }
    return fallback;
  }

  _saveJson(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  }

  // --- Components Registry Access ---

  getAllComponents() {
    this.refresh();
    return Object.values(this.components).map(c => {
      const stock = c.stockQty || 0;
      const threshold = c.reorderThreshold || 0;
      let status = "ok";
      if (stock === 0) status = "out_of_stock";
      else if (stock <= threshold) status = "reorder_needed";

      return {
        ...c,
        status,
        reorderRatio: threshold > 0 ? (stock / threshold) : 1.0
      };
    });
  }

  getComponent(sku) {
    this.refresh();
    return this.components[sku] || null;
  }

  updateComponentStock(sku, deltaQty, reason = "adjustment") {
    this.refresh();
    const comp = this.components[sku];
    if (!comp) throw new Error(`Component SKU '${sku}' not found in registry.`);

    const newStock = (comp.stockQty || 0) + deltaQty;
    if (newStock < 0) {
      throw new Error(`Insufficient stock for component '${sku}'. Current: ${comp.stockQty}, attempted delta: ${deltaQty}`);
    }

    comp.stockQty = newStock;
    this._saveJson(REGISTRY_PATH, this.components);
    return comp;
  }

  // --- Product Recipes & BOM Analytics ---

  getAllRecipes() {
    this.refresh();
    const result = [];
    for (const [sku, recipe] of Object.entries(this.recipes)) {
      const atb = this.calculateAvailableToBuild(sku);
      const cogs = this.calculateRolledUpCOGS(sku);
      result.push({
        ...recipe,
        availableToBuild: atb.availableToBuild,
        totalSellableStock: (recipe.finishedStockQty || 0) + atb.availableToBuild,
        bottleneck: atb.bottleneck,
        cogsSummary: cogs
      });
    }
    return result;
  }

  getRecipe(parentSku) {
    this.refresh();
    return this.recipes[parentSku] || null;
  }

  /**
   * Calculates how many units of a finished good can be assembled right now
   * based on on-hand stock of every required component, hardware, and packaging.
   */
  calculateAvailableToBuild(parentSku) {
    this.refresh();
    const recipe = this.recipes[parentSku];
    if (!recipe) {
      throw new Error(`Product Recipe for SKU '${parentSku}' does not exist.`);
    }

    let minBuildable = Infinity;
    let bottleneckComponent = null;
    const componentBreakdown = [];

    for (const item of recipe.components) {
      const comp = this.components[item.sku];
      if (!comp) {
        throw new Error(`Recipe for '${parentSku}' references missing component SKU '${item.sku}'`);
      }

      const scrapFactor = item.scrapFactor || 0;
      const effectiveQtyPerUnit = item.qty * (1 + scrapFactor);
      const currentStock = comp.stockQty || 0;
      const maxUnitsForThisPart = Math.floor(currentStock / effectiveQtyPerUnit);

      const isBottle = maxUnitsForThisPart < minBuildable;
      if (isBottle) {
        minBuildable = maxUnitsForThisPart;
        bottleneckComponent = {
          sku: comp.sku,
          name: comp.name,
          category: comp.category,
          currentStock,
          requiredPerUnit: item.qty,
          leadTimeDays: comp.leadTimeDays || 7,
          supplier: comp.supplier || "Unknown",
          maxPossible: maxUnitsForThisPart
        };
      }

      componentBreakdown.push({
        sku: comp.sku,
        name: comp.name,
        category: comp.category,
        requiredQty: item.qty,
        scrapFactor,
        effectiveQtyPerUnit,
        currentStock,
        maxPossible: maxUnitsForThisPart,
        unitCostGbp: comp.unitCostGbp,
        unitCostEur: comp.unitCostEur
      });
    }

    const availableToBuild = minBuildable === Infinity ? 0 : minBuildable;
    const currentFinishedStock = recipe.finishedStockQty || 0;

    return {
      parentSku,
      title: recipe.title,
      currentFinishedStock,
      availableToBuild,
      totalPotentialStock: currentFinishedStock + availableToBuild,
      bottleneck: bottleneckComponent,
      componentBreakdown: componentBreakdown.map(c => ({
        ...c,
        isBottleneck: bottleneckComponent ? c.sku === bottleneckComponent.sku : false
      }))
    };
  }

  /**
   * Calculates true rolled-up Cost of Goods Sold (COGS)
   * Materials + Packaging + Direct Assembly Labor.
   */
  calculateRolledUpCOGS(parentSku) {
    this.refresh();
    const recipe = this.recipes[parentSku];
    if (!recipe) {
      throw new Error(`Product Recipe for SKU '${parentSku}' does not exist.`);
    }

    let materialCostGbp = 0;
    let materialCostEur = 0;
    let packagingCostGbp = 0;
    let packagingCostEur = 0;

    const breakdown = [];

    for (const item of recipe.components) {
      const comp = this.components[item.sku];
      if (!comp) continue;

      const scrap = item.scrapFactor || 0;
      const qtyWithScrap = item.qty * (1 + scrap);
      const costGbp = qtyWithScrap * (comp.unitCostGbp || 0);
      const costEur = qtyWithScrap * (comp.unitCostEur || 0);

      if (comp.category === "packaging" || comp.category === "documentation") {
        packagingCostGbp += costGbp;
        packagingCostEur += costEur;
      } else {
        materialCostGbp += costGbp;
        materialCostEur += costEur;
      }

      breakdown.push({
        sku: comp.sku,
        name: comp.name,
        category: comp.category,
        qty: item.qty,
        scrapFactor: scrap,
        unitCostGbp: comp.unitCostGbp,
        unitCostEur: comp.unitCostEur,
        totalCostGbp: Number(costGbp.toFixed(2)),
        totalCostEur: Number(costEur.toFixed(2))
      });
    }

    // Direct Assembly Labor
    const assemblyMinutes = recipe.assemblyTimeMinutes || 0;
    const laborRatePerHour = recipe.assemblyLaborRatePerHour || 36.00;
    const laborCostGbp = (assemblyMinutes / 60) * laborRatePerHour;
    const laborCostEur = laborCostGbp * 1.17; // approximate EUR rate

    const totalCogsGbp = materialCostGbp + packagingCostGbp + laborCostGbp;
    const totalCogsEur = materialCostEur + packagingCostEur + laborCostEur;

    const retailGbp = recipe.retailPriceGbp || 0;
    const retailEur = recipe.retailPriceEur || 0;

    const grossMarginGbp = retailGbp - totalCogsGbp;
    const grossMarginPctGbp = retailGbp > 0 ? (grossMarginGbp / retailGbp) * 100 : 0;

    return {
      parentSku,
      title: recipe.title,
      retailPriceGbp: retailGbp,
      retailPriceEur: retailEur,
      materialsGbp: Number(materialCostGbp.toFixed(2)),
      materialsEur: Number(materialCostEur.toFixed(2)),
      packagingGbp: Number(packagingCostGbp.toFixed(2)),
      packagingEur: Number(packagingCostEur.toFixed(2)),
      laborGbp: Number(laborCostGbp.toFixed(2)),
      laborEur: Number(laborCostEur.toFixed(2)),
      totalCogsGbp: Number(totalCogsGbp.toFixed(2)),
      totalCogsEur: Number(totalCogsEur.toFixed(2)),
      grossMarginGbp: Number(grossMarginGbp.toFixed(2)),
      grossMarginPct: Number(grossMarginPctGbp.toFixed(1)),
      itemizedBreakdown: breakdown
    };
  }

  /**
   * Executes a workshop assembly order:
   * 1. Validates available stock.
   * 2. Deducts required quantities of components from inventory.
   * 3. Increments finished good inventory.
   * 4. Logs to production history audit log.
   */
  executeAssemblyOrder(parentSku, buildQuantity, options = {}) {
    this.refresh();
    const qty = parseInt(buildQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      throw new Error(`Build quantity must be a positive integer.`);
    }

    const atb = this.calculateAvailableToBuild(parentSku);
    if (qty > atb.availableToBuild) {
      const b = atb.bottleneck;
      throw new Error(
        `Cannot build ${qty} units of '${parentSku}'. Maximum buildable right now is ${atb.availableToBuild} units. ` +
        `Bottleneck: ${b.name} (${b.sku}) - only ${b.currentStock} in stock (requires ${b.requiredPerUnit * qty}).`
      );
    }

    const recipe = this.recipes[parentSku];
    const deductedItems = [];

    // Deduct each component
    for (const item of recipe.components) {
      const comp = this.components[item.sku];
      const scrap = item.scrapFactor || 0;
      const totalToDeduct = Math.ceil(qty * item.qty * (1 + scrap));
      comp.stockQty = (comp.stockQty || 0) - totalToDeduct;
      deductedItems.push({
        sku: item.sku,
        name: comp.name,
        quantityDeducted: totalToDeduct,
        remainingStock: comp.stockQty
      });
    }

    // Increment finished goods
    recipe.finishedStockQty = (recipe.finishedStockQty || 0) + qty;

    // Create Work Order Record
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const workOrderId = `WO-${dateStr}-${randomSuffix}`;
    const batchCode = options.batchCode || `BATCH-${parentSku}-${dateStr}`;

    const workOrderRecord = {
      workOrderId,
      timestamp: new Date().toISOString(),
      parentSku,
      productTitle: recipe.title,
      quantityBuilt: qty,
      newFinishedStock: recipe.finishedStockQty,
      technician: options.technician || "Workshop Assembly Bench",
      notes: options.notes || "Standard production run",
      batchCode,
      deductedComponents: deductedItems
    };

    this.history.unshift(workOrderRecord);

    // Persist all databases
    this._saveJson(REGISTRY_PATH, this.components);
    this._saveJson(RECIPES_PATH, this.recipes);
    this._saveJson(HISTORY_PATH, this.history);

    // Optional sync to shopify variant map
    if (options.syncShopify) {
      this.syncFinishedGoodsToShopifyMap(parentSku);
    }

    return {
      success: true,
      workOrderId,
      batchCode,
      parentSku,
      quantityBuilt: qty,
      newFinishedStock: recipe.finishedStockQty,
      deductedComponents: deductedItems
    };
  }

  /**
   * Syncs the latest finished stock level into the Shopify variant map.
   */
  syncFinishedGoodsToShopifyMap(parentSku) {
    try {
      if (!fs.existsSync(SHOPIFY_MAP_PATH)) return;
      const map = JSON.parse(fs.readFileSync(SHOPIFY_MAP_PATH, "utf8"));
      if (map[parentSku] && this.recipes[parentSku]) {
        map[parentSku].inventoryQty = this.recipes[parentSku].finishedStockQty;
        fs.writeFileSync(SHOPIFY_MAP_PATH, JSON.stringify(map, null, 2), "utf8");
        return true;
      }
    } catch (e) {
      console.warn(`[BomEngine] Could not sync to shopify variant map:`, e.message);
    }
    return false;
  }

  /**
   * Returns all components and packaging items that have fallen below
   * their designated minimum safety threshold.
   */
  getReorderAlerts() {
    this.refresh();
    const alerts = [];
    for (const comp of Object.values(this.components)) {
      const stock = comp.stockQty || 0;
      const threshold = comp.reorderThreshold || 0;
      if (stock <= threshold) {
        const deficit = threshold - stock;
        const suggestedReorder = Math.max(threshold * 2, deficit + threshold);
        alerts.push({
          sku: comp.sku,
          name: comp.name,
          category: comp.category,
          stockQty: stock,
          reorderThreshold: threshold,
          leadTimeDays: comp.leadTimeDays || 7,
          supplier: comp.supplier || "General Vendor",
          suggestedReorder,
          urgency: stock === 0 ? "CRITICAL" : "REORDER_NOW"
        });
      }
    }
    return alerts.sort((a, b) => (a.stockQty / a.reorderThreshold) - (b.stockQty / b.reorderThreshold));
  }

  getProductionHistory(limit = 25) {
    this.refresh();
    return this.history.slice(0, limit);
  }
}

export const bomEngine = new BomEngine();
