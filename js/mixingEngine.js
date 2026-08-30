// Coast Airbrush Europe - Core Mixing & Volume Calculation Engine

export const CONVERSIONS = {
  SQFT_TO_SQM: 0.092903,
  SQM_TO_SQFT: 10.7639,
  GAL_TO_ML: 3785.41,
  QT_TO_ML: 946.353,
  PT_TO_ML: 473.176,
  FLOZ_TO_ML: 29.5735,
  OZ_TO_GRAMS: 28.3495,
  ML_TO_FLOZ: 0.033814,
  GRAMS_TO_OZ: 0.035274
};

export const PRESET_PANELS = [
  { id: "custom", name: "Custom Dimensions / Sq Ft", sqft: 0 },
  { id: "airbrush_panel", name: "Airbrush Test Panel (12\" x 12\")", sqft: 1 },
  { id: "helmet", name: "Full Face Motorcycle Helmet", sqft: 3.5 },
  { id: "mc_tank", name: "Motorcycle Gas Tank", sqft: 6 },
  { id: "mc_fender", name: "Motorcycle Fender Set", sqft: 8 },
  { id: "hood", name: "Car Hood / Bonnet", sqft: 22 },
  { id: "roof", name: "Car Roof", sqft: 25 },
  { id: "full_car", name: "Full Mid-Size Car Body", sqft: 140 },
  { id: "full_truck", name: "Full Pickup Truck Body", sqft: 180 }
];

/**
 * Calculates total required liquid volume based on surface area and coats.
 */
export function calculateRequiredVolume({ sqft, coats = 2, transferEfficiency = 0.65, coverageRateSqFtPerGal = 400 }) {
  if (!sqft || sqft <= 0) return { ml: 250, floz: 8.45, quarts: 0.26 };

  // Theoretical coverage per gallon at 1 mil DFT
  const sqftPerGalEffective = coverageRateSqFtPerGal * transferEfficiency;
  const gallonsNeeded = (sqft * coats) / sqftPerGalEffective;
  const mlNeeded = gallonsNeeded * CONVERSIONS.GAL_TO_ML;
  const flozNeeded = mlNeeded * CONVERSIONS.ML_TO_FLOZ;
  const quartsNeeded = mlNeeded / CONVERSIONS.QT_TO_ML;

  return {
    ml: Math.round(mlNeeded * 10) / 10,
    floz: Math.round(flozNeeded * 10) / 10,
    quarts: Math.round(quartsNeeded * 100) / 100
  };
}

/**
 * Calculates component volumes, percentages, individual weights, and cumulative scale targets.
 */
export function calculateMixingRecipe(system, totalMl, customComponents = []) {
  if (!system || !system.parts) return null;

  const totalParts = system.parts.reduce((sum, p) => sum + p.ratio, 0);
  let cumulativeWeightGrams = 0;

  const components = system.parts.map((part, index) => {
    const fraction = part.ratio / totalParts;
    const percentage = Math.round(fraction * 1000) / 10;
    const volumeMl = Math.round(totalMl * fraction * 10) / 10;
    const volumeFlOz = Math.round(volumeMl * CONVERSIONS.ML_TO_FLOZ * 10) / 10;
    
    const density = part.defaultDensity || 0.95;
    const individualWeightGrams = Math.round(volumeMl * density * 10) / 10;
    const individualWeightOz = Math.round(individualWeightGrams * CONVERSIONS.GRAMS_TO_OZ * 10) / 10;

    cumulativeWeightGrams = Math.round((cumulativeWeightGrams + individualWeightGrams) * 10) / 10;
    const cumulativeWeightOz = Math.round(cumulativeWeightGrams * CONVERSIONS.GRAMS_TO_OZ * 10) / 10;

    // Selected product binding if available
    const selectedProduct = customComponents[index] || null;

    return {
      stepIndex: index + 1,
      role: part.role,
      name: selectedProduct ? selectedProduct.name : part.name,
      sku: selectedProduct ? selectedProduct.sku : `PART-${part.role.toUpperCase()}`,
      ratioParts: part.ratio,
      percentage: percentage,
      volumeMl: volumeMl,
      volumeFlOz: volumeFlOz,
      densityGml: density,
      individualWeightGrams: individualWeightGrams,
      individualWeightOz: individualWeightOz,
      cumulativeWeightGrams: cumulativeWeightGrams,
      cumulativeWeightOz: cumulativeWeightOz,
      selectedProduct: selectedProduct
    };
  });

  return {
    systemId: system.id,
    systemName: system.name,
    ratioText: system.ratioText,
    totalVolumeMl: totalMl,
    totalVolumeFlOz: Math.round(totalMl * CONVERSIONS.ML_TO_FLOZ * 10) / 10,
    totalWeightGrams: cumulativeWeightGrams,
    totalWeightOz: Math.round(cumulativeWeightGrams * CONVERSIONS.GRAMS_TO_OZ * 10) / 10,
    components: components
  };
}

/**
 * Smart Pack Size Container Allocator for E-Commerce Carts.
 */
export function recommendContainerPack(sku, name, volumeMlNeeded, basePriceUSD = 49.99) {
  const containerSizes = [
    { label: "Gallon", ml: CONVERSIONS.GAL_TO_ML, factor: 3.4 },
    { label: "Quart", ml: CONVERSIONS.QT_TO_ML, factor: 1.0 },
    { label: "Pint", ml: CONVERSIONS.PT_TO_ML, factor: 0.6 },
    { label: "4 oz", ml: 118.29, factor: 0.25 }
  ];

  let remainingMl = volumeMlNeeded;
  const recommendedItems = [];

  for (const container of containerSizes) {
    if (remainingMl >= container.ml * 0.75) {
      const count = Math.floor(remainingMl / container.ml) || 1;
      recommendedItems.push({
        sku: `${sku}-${container.label.toUpperCase().replace(/\s+/g, '')}`,
        name: `${name} (${container.label})`,
        containerLabel: container.label,
        quantity: count,
        unitPriceUSD: Math.round(basePriceUSD * container.factor * 100) / 100,
        subtotalUSD: Math.round(basePriceUSD * container.factor * count * 100) / 100
      });
      remainingMl -= count * container.ml;
      if (remainingMl <= 0) break;
    }
  }

  if (recommendedItems.length === 0) {
    recommendedItems.push({
      sku: `${sku}-4OZ`,
      name: `${name} (4 oz)`,
      containerLabel: "4 oz",
      quantity: 1,
      unitPriceUSD: Math.round(basePriceUSD * 0.25 * 100) / 100,
      subtotalUSD: Math.round(basePriceUSD * 0.25 * 100) / 100
    });
  }

  return recommendedItems;
}
