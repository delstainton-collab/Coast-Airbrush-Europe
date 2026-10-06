import { PalletStandard } from "../core/types.js";

/**
 * Standard European Road Freight Density Ratio:
 * 1 cubic meter (m³) = 333 kg chargeable weight.
 */
const ROAD_FREIGHT_VOLUMETRIC_RATIO = 333.33;

/**
 * Calculate pallet packing, volumetric weight, and pallet count
 */
export function calculatePalletDensity(items = [], options = {}) {
  const palletType = options.palletStandard || "EURO_PALLET";
  const palletSpec = PalletStandard[palletType] || PalletStandard.EURO_PALLET;

  let totalNetGrams = 0;
  let totalVolumeCm3 = 0;

  for (const item of items) {
    const qty = Math.max(1, parseInt(item.quantity || 1, 10));
    const grams = parseFloat(item.grams || item.weight_in_grams || 0);
    totalNetGrams += grams * qty;

    // Dimensions: default estimate if not provided (assume 1 liter / 1kg paint can ≈ 15cm x 15cm x 20cm = 4500 cm³)
    let l = item.length_cm || 15;
    let w = item.width_cm || 15;
    let h = item.height_cm || 20;

    // If dimensions provided in inches/mm, handle fallback
    if (item.properties && item.properties._dimensions_cm) {
      const parts = item.properties._dimensions_cm.split("x").map(Number);
      if (parts.length === 3) [l, w, h] = parts;
    }

    const itemVolumeCm3 = l * w * h;
    totalVolumeCm3 += itemVolumeCm3 * qty;
  }

  const totalNetWeightKg = Math.max(0.1, totalNetGrams / 1000);
  const totalVolumeM3 = Math.max(0.05, totalVolumeCm3 / 1_000_000);

  // Pallet capacity constraints
  const maxPalletVolumeM3 = palletSpec.volumeM3; // 1.728 m³ for Euro pallet
  const maxPalletPayloadKg = palletSpec.maxWeightKg - palletSpec.tareWeightKg; // e.g. 1475 kg

  // Calculate pallets needed by weight and volume
  const palletsByWeight = Math.ceil(totalNetWeightKg / maxPalletPayloadKg);
  const palletsByVolume = Math.ceil(totalVolumeM3 / maxPalletVolumeM3);
  const palletCount = Math.max(1, Math.max(palletsByWeight, palletsByVolume));

  // Gross weight includes the wood tare weight of each pallet base (25kg per EPAL)
  const totalTareWeightKg = palletCount * palletSpec.tareWeightKg;
  const totalGrossWeightKg = Math.round((totalNetWeightKg + totalTareWeightKg) * 100) / 100;

  // Volumetric weight comparison
  const volumetricWeightKg = Math.round(totalVolumeM3 * ROAD_FREIGHT_VOLUMETRIC_RATIO * 100) / 100;
  const chargeableWeightKg = Math.max(totalGrossWeightKg, volumetricWeightKg);

  return {
    palletType,
    palletSpecName: palletSpec.name,
    palletCount,
    totalNetWeightKg: Math.round(totalNetWeightKg * 100) / 100,
    totalTareWeightKg,
    totalGrossWeightKg,
    volumetricWeightKg,
    chargeableWeightKg,
    volumeM3: Math.round(totalVolumeM3 * 1000) / 1000
  };
}
