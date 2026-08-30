// Coast Airbrush Europe - Agent D: Inventory Forecasting & Lean Stock AI ("The Stock Guru")

export const INVENTORY_CATALOG = [
  {
    sku: "KE-PRIMER-BLK",
    name: "Jet Black Mirror Gloss Primer (1L)",
    brand: "Kroma Edge",
    category: "Solvent Paints",
    hsCode: "3208.10.90",
    fobCostUSD: 24.00,
    retailPriceUSD: 54.95,
    stockNL: 14,
    stockUK: 8,
    stockUS_Buffer: 60,
    dailyVelocity: 1.2, // units sold per day across Europe
    moqSignalJapan: 50,
    moqCoastUSA: 6,
    weightKg: 1.1,
    isHazmat: true
  },
  {
    sku: "KE-CHROME-1L",
    name: "Kroma Edge Mirror Spray Chrome System (1 Litre)",
    brand: "Kroma Edge",
    category: "Solvent Paints",
    hsCode: "3208.90.19",
    fobCostUSD: 55.00,
    retailPriceUSD: 145.00,
    stockNL: 4,  // Critical low
    stockUK: 2,
    stockUS_Buffer: 40,
    dailyVelocity: 0.9,
    moqSignalJapan: 30,
    moqCoastUSA: 4,
    weightKg: 1.3,
    isHazmat: true
  },
  {
    sku: "FK-500-GUN",
    name: "Flake King 500 Dry Flake Spray Gun",
    brand: "Flake King",
    category: "Hardware",
    hsCode: "8424.20.00",
    fobCostUSD: 88.00,
    retailPriceUSD: 189.00,
    stockNL: 12,
    stockUK: 9,
    stockUS_Buffer: 25,
    dailyVelocity: 0.5,
    moqSignalJapan: 20,
    moqCoastUSA: 2,
    weightKg: 0.8,
    isHazmat: false
  },
  {
    sku: "PRO-AIRBRUSH-035",
    name: "Coast Pro Precision Dual-Action Airbrush (0.35mm)",
    brand: "Coast Airbrush",
    category: "Hardware",
    hsCode: "8424.20.00",
    fobCostUSD: 95.00,
    retailPriceUSD: 198.00,
    stockNL: 18,
    stockUK: 11,
    stockUS_Buffer: 50,
    dailyVelocity: 0.8,
    moqSignalJapan: 25,
    moqCoastUSA: 3,
    weightKg: 0.5,
    isHazmat: false
  },
  {
    sku: "KE-CLEAR-1.5L",
    name: "Kroma Edge Speed Clearcoat + Hardener Kit (1.5L)",
    brand: "Kroma Edge",
    category: "Solvent Paints",
    hsCode: "3208.10.90",
    fobCostUSD: 38.00,
    retailPriceUSD: 89.95,
    stockNL: 6, // Low
    stockUK: 4,
    stockUS_Buffer: 80,
    dailyVelocity: 1.5,
    moqSignalJapan: 60,
    moqCoastUSA: 6,
    weightKg: 1.2,
    isHazmat: true
  }
];

export class InventoryGuruAI {
  constructor() {
    this.items = JSON.parse(JSON.stringify(INVENTORY_CATALOG));
    this.holdingCostAnnualPercent = 0.15; // 15% annual carrying cost of capital
    this.eurExchangeRate = 0.92;
    this.jpyExchangeRate = 152.5;
  }

  /**
   * Calculates monthly dynamic lean metrics for an item.
   */
  calculateLeanMetrics(item, daysBuffer = 30) {
    const totalEUStock = item.stockNL + item.stockUK;
    const daysOfCover = item.dailyVelocity > 0 ? (totalEUStock / item.dailyVelocity) : 999;
    
    // Safety buffer dynamically adjusted for monthly sales velocity
    const targetSafetyStock = Math.ceil(item.dailyVelocity * daysBuffer);
    const reorderPoint = Math.ceil(item.dailyVelocity * 45 + targetSafetyStock); // 45 day ocean lead time
    const urgentAirReorderPoint = Math.ceil(item.dailyVelocity * 7 + (targetSafetyStock * 0.5)); // 7 day air lead time

    let status = "OPTIMAL";
    let statusColor = "#34d399"; // Emerald

    if (totalEUStock <= urgentAirReorderPoint) {
      status = "CRITICAL_STOCKOUT_RISK";
      statusColor = "#ef4444"; // Red
    } else if (totalEUStock <= reorderPoint) {
      status = "REORDER_RECOMMENDED";
      statusColor = "#f59e0b"; // Amber
    }

    return {
      sku: item.sku,
      name: item.name,
      totalEUStock,
      daysOfCover: Math.round(daysOfCover * 10) / 10,
      targetSafetyStock,
      reorderPoint,
      urgentAirReorderPoint,
      status,
      statusColor
    };
  }

  /**
   * Comparative Landed Cost & Sourcing Routing Decision Matrix:
   * Scenario 1 (Signal Japan Ocean with 0% REX Preferential Duty) vs.
   * Scenario 2 (Coast USA California Air Buffer with 6.5% MFN Duty + Hazmat).
   */
  evaluateSourcingScenario(item, quantity = 50) {
    // --- SCENARIO 1: SIGNAL JAPAN (BULK OCEAN) ---
    const oceanFreightPerUnitUSD = item.weightKg * 3.20; // Ocean freight per kg
    const customsDutyRateJapan = 0.00; // 0% REX Preferential Duty under EU-Japan EPA
    const dutyAmountJapanUSD = item.fobCostUSD * customsDutyRateJapan;
    const landedCostJapanUSD = item.fobCostUSD + oceanFreightPerUnitUSD + dutyAmountJapanUSD;
    const landedCostJapanEUR = landedCostJapanUSD * this.eurExchangeRate;
    const retailEUR = item.retailPriceUSD * this.eurExchangeRate;
    const grossMarginPercentJapan = Math.round(((retailEUR - landedCostJapanEUR) / retailEUR) * 1000) / 10;
    const leadTimeJapanDays = 45;

    // --- SCENARIO 2: COAST USA (EXPRESS AIR BUFFER) ---
    const airFreightPerUnitUSD = item.weightKg * 14.50; // Express air freight per kg
    const airHazmatSurchargeUSD = item.isHazmat ? 9.50 : 0.00;
    const customsDutyRateUSA = item.category === "Solvent Paints" ? 0.065 : 0.017; // 6.5% paints, 1.7% hardware
    const dutyAmountUSAUSD = (item.fobCostUSD + airFreightPerUnitUSD) * customsDutyRateUSA;
    const landedCostUSAUSD = item.fobCostUSD + airFreightPerUnitUSD + airHazmatSurchargeUSD + dutyAmountUSAUSD;
    const landedCostUSAEUR = landedCostUSAUSD * this.eurExchangeRate;
    const grossMarginPercentUSA = Math.round(((retailEUR - landedCostUSAEUR) / retailEUR) * 1000) / 10;
    const leadTimeUSADays = 7;

    // Recommendation Engine
    let recommendedScenario = 1;
    let rationale = "";

    const leanMetrics = this.calculateLeanMetrics(item);
    if (leanMetrics.daysOfCover < 14) {
      recommendedScenario = 2;
      rationale = `⚠️ URGENT: Only ${leanMetrics.daysOfCover} days of inventory remaining in Europe! Route via Scenario 2 (US Air Buffer, 7-day ETA) to prevent total stockout, despite higher landed cost.`;
    } else {
      recommendedScenario = 1;
      rationale = `✅ OPTIMAL: Healthy runway of ${leanMetrics.daysOfCover} days allows Scenario 1 (Signal Japan Ocean). Saves ${(landedCostUSAEUR - landedCostJapanEUR).toFixed(2)}€ per unit with 0% REX tariff and yields ${grossMarginPercentJapan}% gross margin.`;
    }

    return {
      sku: item.sku,
      name: item.name,
      quantity,
      recommendedScenario,
      rationale,
      scenario1_Japan: {
        supplier: "Signal Japan Factory (REX ID: JP-REX-849201)",
        shippingMode: "Bulk Ocean Freight (FCL/LCL via Rotterdam)",
        leadTimeDays: leadTimeJapanDays,
        fobUnitUSD: item.fobCostUSD,
        dutyRate: "0.0% (EU-Japan EPA / UK-Japan CEPA)",
        freightPerUnitUSD: oceanFreightPerUnitUSD.toFixed(2),
        landedCostUSD: landedCostJapanUSD.toFixed(2),
        landedCostEUR: landedCostJapanEUR.toFixed(2),
        grossMarginPercent: grossMarginPercentJapan,
        totalOrderUSD: (landedCostJapanUSD * quantity).toFixed(2),
        totalOrderJPY: Math.round(landedCostJapanUSD * quantity * this.jpyExchangeRate).toLocaleString()
      },
      scenario2_USA: {
        supplier: "Coast USA Warehouse (California)",
        shippingMode: "Express Air Cargo (IATA Hazmat Certified)",
        leadTimeDays: leadTimeUSADays,
        fobUnitUSD: item.fobCostUSD,
        dutyRate: `${(customsDutyRateUSA * 100).toFixed(1)}% MFN Tariff`,
        freightAndHazmatUSD: (airFreightPerUnitUSD + airHazmatSurchargeUSD).toFixed(2),
        landedCostUSD: landedCostUSAUSD.toFixed(2),
        landedCostEUR: landedCostUSAEUR.toFixed(2),
        grossMarginPercent: grossMarginPercentUSA,
        totalOrderUSD: (landedCostUSAUSD * quantity).toFixed(2)
      }
    };
  }

  /**
   * Generates a formal Purchase Order (PO) exportable to Katana MRP / Linnworks / Xero.
   */
  generatePurchaseOrder(scenarioNumber, selectedSkus = []) {
    const poNumber = `PO-${scenarioNumber === 1 ? 'JP' : 'US'}-${Date.now().toString().slice(-6)}`;
    const isJapan = scenarioNumber === 1;

    const targetItems = selectedSkus.length > 0
      ? this.items.filter(i => selectedSkus.includes(i.sku))
      : this.items;

    const poLines = targetItems.map(item => {
      const qty = isJapan ? item.moqSignalJapan : item.moqCoastUSA;
      const evaluation = this.evaluateSourcingScenario(item, qty);
      const chosen = isJapan ? evaluation.scenario1_Japan : evaluation.scenario2_USA;

      return {
        sku: item.sku,
        name: item.name,
        hsCode: item.hsCode,
        qty: qty,
        unitFOB_USD: item.fobCostUSD,
        totalFOB_USD: (item.fobCostUSD * qty).toFixed(2),
        landedUnitEUR: chosen.landedCostEUR,
        totalLandedEUR: (parseFloat(chosen.landedCostEUR) * qty).toFixed(2)
      };
    });

    const totalUSD = poLines.reduce((sum, l) => sum + parseFloat(l.totalFOB_USD), 0);
    const totalEUR = poLines.reduce((sum, l) => sum + parseFloat(l.totalLandedEUR), 0);

    return {
      poNumber: poNumber,
      date: new Date().toISOString().split('T')[0],
      scenario: isJapan ? "Scenario 1: Signal Japan Direct Ocean (0% REX Origin)" : "Scenario 2: Coast USA California Air Buffer",
      vendor: isJapan ? {
        name: "Signal Japan Co., Ltd.",
        address: "3-12-8 Higashi-Shimbashi, Minato-ku, Tokyo, Japan",
        rexNumber: "JP-REX-849201"
      } : {
        name: "Coast Airbrush Inc.",
        address: "1592 N Batavia St, Orange, CA 92867, USA",
        einNumber: "US-95-4819201"
      },
      shipTo: {
        name: "Coast Airbrush Europe B.V. (Netherlands Bonded 3PL)",
        address: "Distributieweg 44, 2645 EJ Delfgauw, Netherlands",
        eori: "NL861928401B01"
      },
      lines: poLines,
      summary: {
        totalFOB_USD: totalUSD.toFixed(2),
        totalLandedEUR: totalEUR.toFixed(2),
        totalJPY: isJapan ? Math.round(totalUSD * this.jpyExchangeRate).toLocaleString() : null
      },
      customsDeclaration: isJapan
        ? "The exporter of the products covered by this document (REX No: JP-REX-849201) declares that, except where otherwise clearly indicated, these products are of Japanese preferential origin under EU-Japan EPA / UK-Japan CEPA (0% Customs Duty)."
        : "Standard commercial export under US Export Administration Regulations. Subject to EU MFN Common Customs Tariff."
    };
  }
}
