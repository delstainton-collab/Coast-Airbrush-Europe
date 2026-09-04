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
  { id: "helmet", name: "Full Face Racing Helmet (2.5 sq ft / 0.23 m²)", sqft: 2.5 },
  { id: "mc_tank", name: "Motorcycle Gas Tank (6.0 sq ft / 0.56 m²)", sqft: 6.0 },
  { id: "mc_full", name: "Complete Motorcycle Set (15.0 sq ft / 1.4 m²)", sqft: 15.0 },
  { id: "hood", name: "Car Hood / Bonnet (22.0 sq ft / 2.05 m²)", sqft: 22.0 },
  { id: "guitar", name: "Electric Guitar Body (3.5 sq ft / 0.33 m²)", sqft: 3.5 },
  { id: "full_car", name: "Full Mid-Size Vehicle Respray (140 sq ft / 13.0 m²)", sqft: 140.0 }
];

/**
 * Calculates exact KromaEdge sprayable chrome and clearcoat volume requirements.
 * Benchmark: 1 fl oz of mixed KromaEdge Chrome covers 2 square feet (0.5 fl oz per sq ft).
 */
export function calculateKromaCoverage({ sqft = 0, sqm = 0 }) {
  let effectiveSqFt = sqft;
  if (sqm && sqm > 0) {
    effectiveSqFt = sqm * CONVERSIONS.SQM_TO_SQFT;
  }
  if (!effectiveSqFt || effectiveSqFt <= 0) effectiveSqFt = 2.0;

  // 1 fl oz mixed covers 2 sq ft (0.5 fl oz / ~14.78 mL per sq ft)
  const chromeFlOz = Math.round((effectiveSqFt / 2.0) * 10) / 10;
  const chromeMl = Math.round(chromeFlOz * CONVERSIONS.FLOZ_TO_ML);

  // Dedicated clearcoat volume needed
  const clearMl = Math.round(chromeMl * 1.25);

  // Recommended kit sizes based on 1oz = 2 sq ft:
  // 140g (5oz) covers up to 10 sq ft
  // 420g (15oz) covers up to 30 sq ft
  // 1260g (45oz) covers up to 90 sq ft
  // 2520g (90oz) covers up to 180 sq ft
  // 10080g (360oz) covers up to 700 sq ft
  let recommendedKit = "KromaEdge 140g / 5oz Kit (covers up to 10 sq ft)";
  let recommendedClear = "Topcoat Clear 180 SET (378g)";
  let kitSku = "KE-MIRROR-140G";
  
  if (chromeFlOz > 90 || effectiveSqFt > 180) {
    recommendedKit = "KromaEdge 10080g / 360oz Ultra Large Kit (covers up to 700 sq ft)";
    recommendedClear = "Topcoat Clear 3600 SET (x3)";
    kitSku = "KE-MIRROR-10080G";
  } else if (chromeFlOz > 45 || effectiveSqFt > 90) {
    recommendedKit = "KromaEdge 2520g / 90oz Extra Large Kit (covers up to 180 sq ft)";
    recommendedClear = "Topcoat Clear 3600 SET (7,560g)";
    kitSku = "KE-MIRROR-2520G";
  } else if (chromeFlOz > 15 || effectiveSqFt > 30) {
    recommendedKit = "KromaEdge 1260g / 45oz Large Kit (covers up to 90 sq ft)";
    recommendedClear = "Topcoat Clear 3600 SET / 900 SET";
    kitSku = "KE-MIRROR-1260G";
  } else if (chromeFlOz > 5 || effectiveSqFt > 10) {
    recommendedKit = "KromaEdge 420g / 15oz Medium Kit (covers up to 30 sq ft)";
    recommendedClear = "Topcoat Clear 900 SET (1,890g)";
    kitSku = "KE-MIRROR-420G";
  }

  return {
    sqft: Math.round(effectiveSqFt * 10) / 10,
    sqm: Math.round(effectiveSqFt * CONVERSIONS.SQFT_TO_SQM * 100) / 100,
    chromeFlOz: chromeFlOz,
    chromeMl: chromeMl,
    clearMl: clearMl,
    recommendedKit: recommendedKit,
    recommendedClear: recommendedClear,
    kitSku: kitSku
  };
}

/**
 * Calculates total required liquid volume based on surface area and coats.
 */
export function calculateRequiredVolume({ sqft, coats = 2, transferEfficiency = 0.65, coverageRateSqFtPerGal = 400 }) {
  if (!sqft || sqft <= 0) return { ml: 250, floz: 8.45, quarts: 0.26 };

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
