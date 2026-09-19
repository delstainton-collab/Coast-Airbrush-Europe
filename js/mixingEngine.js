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
 * Calculates 3D rectangular box surface area (6 sides: 2(wl + hl + hw))
 * or 5 sides (open bottom) if openBottom is true.
 */
export function calculateBoxSurfaceArea(length, width, height, unit = 'in', openBottom = false) {
  const l = parseFloat(length) || 0;
  const w = parseFloat(width) || 0;
  const h = parseFloat(height) || 0;
  if (l <= 0 || w <= 0) return { sqin: 0, sqft: 0, sqcm: 0, sqm: 0 };

  let areaSqIn = 0;
  if (unit === 'in') {
    areaSqIn = openBottom 
      ? (l * w) + 2 * (h * l) + 2 * (h * w) 
      : 2 * ((w * l) + (h * l) + (h * w));
  } else if (unit === 'ft') {
    const areaSqFt = openBottom 
      ? (l * w) + 2 * (h * l) + 2 * (h * w) 
      : 2 * ((w * l) + (h * l) + (h * w));
    return {
      sqft: Math.round(areaSqFt * 100) / 100,
      sqm: Math.round(areaSqFt * CONVERSIONS.SQFT_TO_SQM * 100) / 100,
      sqin: Math.round(areaSqFt * 144),
      sqcm: Math.round(areaSqFt * 929.03)
    };
  } else if (unit === 'cm') {
    const areaSqCm = openBottom 
      ? (l * w) + 2 * (h * l) + 2 * (h * w) 
      : 2 * ((w * l) + (h * l) + (h * w));
    const areaSqM = areaSqCm / 10000;
    const areaSqFt = areaSqM * CONVERSIONS.SQM_TO_SQFT;
    return {
      sqcm: Math.round(areaSqCm),
      sqm: Math.round(areaSqM * 100) / 100,
      sqft: Math.round(areaSqFt * 100) / 100,
      sqin: Math.round(areaSqFt * 144)
    };
  } else if (unit === 'm') {
    const areaSqM = openBottom 
      ? (l * w) + 2 * (h * l) + 2 * (h * w) 
      : 2 * ((w * l) + (h * l) + (h * w));
    const areaSqFt = areaSqM * CONVERSIONS.SQM_TO_SQFT;
    return {
      sqm: Math.round(areaSqM * 100) / 100,
      sqft: Math.round(areaSqFt * 100) / 100,
      sqcm: Math.round(areaSqM * 10000),
      sqin: Math.round(areaSqFt * 144)
    };
  }

  const sqft = areaSqIn / 144;
  const sqm = sqft * CONVERSIONS.SQFT_TO_SQM;
  return {
    sqin: Math.round(areaSqIn * 10) / 10,
    sqft: Math.round(sqft * 100) / 100,
    sqcm: Math.round(areaSqIn * 6.4516),
    sqm: Math.round(sqm * 100) / 100
  };
}

/**
 * Calculates 2D flat panel surface area (L x W * sides)
 */
export function calculatePanelSurfaceArea(length, width, unit = 'in', sides = 1) {
  const l = parseFloat(length) || 0;
  const w = parseFloat(width) || 0;
  const s = Math.max(1, parseFloat(sides) || 1);
  if (l <= 0 || w <= 0) return { sqin: 0, sqft: 0, sqcm: 0, sqm: 0 };

  if (unit === 'in') {
    const areaSqIn = l * w * s;
    const sqft = areaSqIn / 144;
    return {
      sqin: Math.round(areaSqIn * 10) / 10,
      sqft: Math.round(sqft * 100) / 100,
      sqcm: Math.round(areaSqIn * 6.4516),
      sqm: Math.round(sqft * CONVERSIONS.SQFT_TO_SQM * 100) / 100
    };
  } else if (unit === 'ft') {
    const sqft = l * w * s;
    return {
      sqft: Math.round(sqft * 100) / 100,
      sqm: Math.round(sqft * CONVERSIONS.SQFT_TO_SQM * 100) / 100,
      sqin: Math.round(sqft * 144),
      sqcm: Math.round(sqft * 929.03)
    };
  } else if (unit === 'cm') {
    const sqcm = l * w * s;
    const sqm = sqcm / 10000;
    const sqft = sqm * CONVERSIONS.SQM_TO_SQFT;
    return {
      sqcm: Math.round(sqcm),
      sqm: Math.round(sqm * 100) / 100,
      sqft: Math.round(sqft * 100) / 100,
      sqin: Math.round(sqft * 144)
    };
  } else if (unit === 'm') {
    const sqm = l * w * s;
    const sqft = sqm * CONVERSIONS.SQM_TO_SQFT;
    return {
      sqm: Math.round(sqm * 100) / 100,
      sqft: Math.round(sqft * 100) / 100,
      sqcm: Math.round(sqm * 10000),
      sqin: Math.round(sqft * 144)
    };
  }
}

/**
 * Universal Formula-Driven Paint Coverage & Volume Calculation Engine.
 * Supports:
 *  - Kroma Edge nano-coatings: 1 oz covers 2 sq ft (0.5 oz / sq ft) in 1 continuous wet coat.
 *  - High-Build Primers: 150-200 sq ft/gal in 2-3 coats.
 *  - Epoxy Sealers: 300-350 sq ft/gal in 1 coat.
 *  - Basecoats: 380-420 sq ft/gal in 2-3 coats.
 *  - Candies: 320-360 sq ft/gal in 4-6 coats.
 *  - Clears: 380-450 sq ft/gal in 2 coats.
 */
export function calculateUniversalCoverage({
  system,
  productOverride = null,
  sqft = 0,
  sqm = 0,
  userCoats = null,
  transferEfficiency = null
}) {
  let effectiveSqFt = parseFloat(sqft) || 0;
  if (sqm && sqm > 0) {
    effectiveSqFt = parseFloat(sqm) * CONVERSIONS.SQM_TO_SQFT;
  }
  if (!effectiveSqFt || effectiveSqFt <= 0) effectiveSqFt = 2.0;

  // Resolve active profile with cascading inheritance: productOverride -> system -> default
  const profile = productOverride?.coverageProfile || system?.coverageProfile || {
    type: "basecoat",
    benchmarkUnit: "sqft_per_gal",
    coverageRateSqFtPerGal: 380,
    recommendedCoats: 2,
    minCoats: 1,
    maxCoats: 4,
    wasteBuffer: 1.15,
    defaultTransferEfficiency: 0.65,
    potLifeHours: 4,
    packagingType: "liquid_containers"
  };

  const coats = userCoats || profile.recommendedCoats || 1;
  const eff = transferEfficiency || profile.defaultTransferEfficiency || 0.65;
  const buffer = profile.wasteBuffer || 1.10;

  let totalFlOz = 0;
  let totalMl = 0;

  if (profile.benchmarkUnit === "sqft_per_oz") {
    // Direct benchmark: e.g. Kroma Edge Chrome = 2.0 sq ft per fluid ounce
    const benchmark = profile.benchmarkRate || 2.0;
    totalFlOz = (effectiveSqFt / benchmark) * coats * buffer;
    totalMl = totalFlOz * CONVERSIONS.FLOZ_TO_ML;
  } else {
    // Gallon rate benchmark: e.g. 400 sq ft/gal
    const rate = profile.coverageRateSqFtPerGal || 380;
    const effectiveSqFtPerGal = rate * eff;
    const gallonsNeeded = (effectiveSqFt * coats * buffer) / effectiveSqFtPerGal;
    totalMl = gallonsNeeded * CONVERSIONS.GAL_TO_ML;
    totalFlOz = totalMl * CONVERSIONS.ML_TO_FLOZ;
  }

  // Minimum practical batch: hard to mix less than 14g / 15 mL accurately
  if (totalMl < 15) totalMl = 15;
  if (totalFlOz < 0.5) totalFlOz = 0.5;

  const roundedMl = Math.round(totalMl * 10) / 10;
  const roundedFlOz = Math.round(totalFlOz * 10) / 10;
  const roundedGrams = Math.round(roundedMl * (system?.defaultDensity || 0.95) * 10) / 10;

  // Allocate Package / Kit Tiers
  let recommendedTier = null;
  const tiers = profile.tiers || [];
  if (tiers.length > 0) {
    if (profile.packagingType === "kits_by_weight") {
      // Find smallest kit that accommodates either maxSqFt or maxGrams
      for (const tier of tiers) {
        if (effectiveSqFt <= tier.maxSqFt || roundedGrams <= tier.maxGrams) {
          recommendedTier = tier;
          break;
        }
      }
      if (!recommendedTier && tiers.length > 0) {
        const topTier = tiers[tiers.length - 1];
        const count = Math.ceil(effectiveSqFt / topTier.maxSqFt);
        recommendedTier = {
          name: `${count}x ${topTier.name}`,
          sku: topTier.sku,
          priceEUR: topTier.priceEUR * count,
          desc: `Multi-kit allocation for ${effectiveSqFt.toFixed(1)} sq ft`
        };
      }
    } else {
      // Liquid container packaging (Pints, Quarts, Gallons)
      for (const tier of tiers) {
        if (effectiveSqFt <= tier.maxSqFt || roundedMl <= tier.ml) {
          recommendedTier = tier;
          break;
        }
      }
      if (!recommendedTier && tiers.length > 0) {
        const topTier = tiers[tiers.length - 1];
        const count = Math.ceil(effectiveSqFt / topTier.maxSqFt);
        recommendedTier = {
          name: `${count}x ${topTier.name}`,
          sku: topTier.sku,
          priceEUR: (topTier.priceEUR || 100) * count,
          desc: `Bulk project volume for ${effectiveSqFt.toFixed(1)} sq ft`
        };
      }
    }
  }

  // Companion Product Logic (e.g. Kroma Dedicated Topcoat Clear)
  let companion = null;
  if (profile.requiresCompanion && profile.companionSystemId === "kroma_edge_dedicated_clear") {
    companion = calculateTopcoatClearCoverage(effectiveSqFt);
  }

  return {
    sqft: Math.round(effectiveSqFt * 10) / 10,
    sqm: Math.round(effectiveSqFt * CONVERSIONS.SQFT_TO_SQM * 100) / 100,
    coats: coats,
    totalMl: roundedMl,
    totalFlOz: roundedFlOz,
    totalGrams: roundedGrams,
    profile: profile,
    recommendedTier: recommendedTier,
    companion: companion
  };
}

/**
 * Calculates Dedicated Topcoat Clear requirements for Kroma Edge.
 * Ratio: 10 Parts Base : 1 Part Hardener : 70-100% Thinner
 */
export function calculateTopcoatClearCoverage(sqft, reductionPercent = 100) {
  const effectiveSqFt = parseFloat(sqft) || 2.0;
  // Clear coverage benchmark: ~378g (180 SET) covers ~16 sq ft
  // 1 oz covers ~2 sq ft, plus 10% buffer
  const gramsPerSqFt = (378 / 16); // ~23.6g per sq ft mixed
  const totalGrams = Math.round(effectiveSqFt * gramsPerSqFt * 1.10);

  const reduction = Math.min(Math.max(parseFloat(reductionPercent) || 100, 70), 100);
  // Parts: 10 (base) + 1 (hardener) + (reduction/10) (thinner)
  const thinnerParts = reduction / 10;
  const totalParts = 10 + 1 + thinnerParts;

  const baseGrams = Math.round((totalGrams * (10 / totalParts)) * 10) / 10;
  const hardenerGrams = Math.round((totalGrams * (1 / totalParts)) * 10) / 10;
  const thinnerGrams = Math.round((totalGrams * (thinnerParts / totalParts)) * 10) / 10;

  let recommendedSet = "Topcoat Clear 180 SET (378g)";
  let clearSku = "KE-CLEAR-180";
  let clearPriceEUR = 89.00;

  if (effectiveSqFt > 65) {
    const sets = Math.ceil(effectiveSqFt / 260);
    recommendedSet = sets > 1 ? `${sets}x Topcoat Clear 3600 SET` : "Topcoat Clear 3600 SET (7,560g)";
    clearSku = "KE-CLEAR-3600";
    clearPriceEUR = 695.00 * sets;
  } else if (effectiveSqFt > 16) {
    recommendedSet = "Topcoat Clear 900 SET (1,890g)";
    clearSku = "KE-CLEAR-900";
    clearPriceEUR = 249.00;
  }

  return {
    sqft: Math.round(effectiveSqFt * 10) / 10,
    totalGrams: totalGrams,
    reductionPercent: reduction,
    baseGrams: baseGrams,
    hardenerGrams: hardenerGrams,
    thinnerGrams: thinnerGrams,
    // Cumulative tare targets for digital scale pouring
    scaleTargets: {
      step1Base: baseGrams,
      step2Hardener: Math.round((baseGrams + hardenerGrams) * 10) / 10,
      step3Thinner: Math.round((baseGrams + hardenerGrams + thinnerGrams) * 10) / 10
    },
    recommendedSet: recommendedSet,
    clearSku: clearSku,
    clearPriceEUR: clearPriceEUR
  };
}

/**
 * Backwards Area Calculator: Given target volume in g, mL, or oz,
 * calculates the approximate surface area it will cover.
 */
export function calculateAreaFromVolume(amount, unit = 'ml', system = null) {
  const vol = parseFloat(amount) || 0;
  if (vol <= 0) return { sqft: 0, sqm: 0 };

  let ml = vol;
  if (unit === 'g') ml = vol / (system?.defaultDensity || 0.95);
  else if (unit === 'oz' || unit === 'floz') ml = vol * CONVERSIONS.FLOZ_TO_ML;

  const profile = system?.coverageProfile;
  let sqft = 0;

  if (profile?.benchmarkUnit === "sqft_per_oz") {
    const floz = ml * CONVERSIONS.ML_TO_FLOZ;
    const rate = profile.benchmarkRate || 2.0;
    const buffer = profile.wasteBuffer || 1.10;
    sqft = (floz / buffer) * rate;
  } else {
    const rate = profile?.coverageRateSqFtPerGal || 380;
    const buffer = profile?.wasteBuffer || 1.15;
    const eff = profile?.defaultTransferEfficiency || 0.65;
    const gallons = ml / CONVERSIONS.GAL_TO_ML;
    sqft = (gallons * rate * eff) / buffer;
  }

  return {
    sqft: Math.round(sqft * 10) / 10,
    sqm: Math.round(sqft * CONVERSIONS.SQFT_TO_SQM * 100) / 100
  };
}

/**
 * Calculates required liquid volume (mL) from surface area, theoretical coverage rate, and coat count.
 */
export function calculateRequiredVolume(areaSqFt, coverageRateSqFtPerGal = 400, coats = 2) {
  const sqft = parseFloat(areaSqFt) || 0;
  if (sqft <= 0) return 0;
  const c = parseInt(coats, 10) || 1;
  const rate = parseFloat(coverageRateSqFtPerGal) || 400;
  const gallons = (sqft * c) / rate;
  return Math.round(gallons * CONVERSIONS.GAL_TO_ML);
}

// Backward compatibility alias for existing code references
export function calculateKromaCoverage({ sqft = 0, sqm = 0 }) {
  const res = calculateUniversalCoverage({
    system: {
      coverageProfile: {
        type: "nano_chrome",
        benchmarkUnit: "sqft_per_oz",
        benchmarkRate: 2.0,
        recommendedCoats: 1,
        wasteBuffer: 1.10,
        requiresCompanion: true,
        companionSystemId: "kroma_edge_dedicated_clear"
      }
    },
    sqft,
    sqm
  });

  return {
    sqft: res.sqft,
    sqm: res.sqm,
    chromeFlOz: res.totalFlOz,
    chromeMl: res.totalMl,
    clearMl: res.companion ? Math.round(res.companion.totalGrams) : Math.round(res.totalMl * 1.25),
    recommendedKit: res.recommendedTier ? res.recommendedTier.name : "KromaEdge 140g Kit",
    recommendedClear: res.companion ? res.companion.recommendedSet : "Topcoat Clear 180 SET",
    kitSku: res.recommendedTier ? res.recommendedTier.sku : "KE-MIRROR-140G"
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
