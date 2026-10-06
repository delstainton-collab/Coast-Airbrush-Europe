import { calculatePalletDensity } from "./densityCalculator.js";
import { AccessorialType } from "../core/types.js";

/**
 * Evaluates cart line items, address, and tenant freight rules
 */
export function evaluateFreightRules(rateRequest, rules) {
  const items = rateRequest.items || [];
  const destination = rateRequest.destination || {};
  const origin = rateRequest.origin || rules.defaultOrigin;
  const requestedAccessorials = rateRequest.accessorials || [];

  // 1. Calculate physical pallet density and weight
  const density = calculatePalletDensity(items, {
    palletStandard: rules.palletStandard
  });

  // 2. Check for hazardous paint items (UN1263 Class 3)
  const hazardousKeywords = rules.hazardousKeywords || [];
  const hazmatMatches = [];

  for (const item of items) {
    const itemName = (item.name || "").toLowerCase();
    const sku = (item.sku || "").toLowerCase();
    const isHazmat = hazardousKeywords.some(kw => itemName.includes(kw) || sku.includes(kw));
    if (isHazmat) {
      hazmatMatches.push({ name: item.name, sku: item.sku, qty: item.quantity });
    }
  }

  const isHazardous = hazmatMatches.length > 0;

  // 3. Determine if freight is applicable or mandatory
  const minWeight = rules.minFreightWeightKg || 30;
  const mandatoryWeight = rules.ltlMandatoryWeightKg || 70;

  const oversizedKeywords = rules.oversizedKeywords || [];
  const hasOversized = items.some(item => {
    const name = (item.name || "").toLowerCase();
    return oversizedKeywords.some(kw => name.includes(kw));
  });

  const isFreightEligible =
    density.totalNetWeightKg >= minWeight || isHazardous || hasOversized;
  const isFreightMandatory =
    density.totalGrossWeightKg >= mandatoryWeight || hasOversized;

  // 4. Determine required and requested accessorials
  const detectedAccessorials = new Set(requestedAccessorials);

  // Auto-detect residential address if no company name or flagged residential
  const isResidential =
    !destination.company ||
    destination.residential === true ||
    (destination.address1 && destination.address1.toLowerCase().includes("apt"));

  if (isResidential) {
    detectedAccessorials.add(AccessorialType.RESIDENTIAL);
  }

  // Auto-recommend liftgate delivery if heavy (>50kg gross) and residential or no dock specified
  if (density.totalGrossWeightKg >= 50 && (isResidential || !destination.has_loading_dock)) {
    detectedAccessorials.add(AccessorialType.LIFTGATE);
  }

  // Hazardous handling fee
  if (isHazardous) {
    detectedAccessorials.add(AccessorialType.HAZARDOUS_ADR);
  }

  // 5. Calculate accessorial surcharges
  let accessorialTotalCents = 0;
  const accessorialBreakdown = [];
  const ruleFees = rules.accessorials || {};

  if (detectedAccessorials.has(AccessorialType.LIFTGATE)) {
    const fee = ruleFees.liftgateDeliveryCents || 3500;
    accessorialTotalCents += fee;
    accessorialBreakdown.push({ type: AccessorialType.LIFTGATE, feeCents: fee, label: "Tail-lift / Liftgate Delivery" });
  }

  if (detectedAccessorials.has(AccessorialType.RESIDENTIAL)) {
    const fee = ruleFees.residentialDeliveryCents || 4000;
    accessorialTotalCents += fee;
    accessorialBreakdown.push({ type: AccessorialType.RESIDENTIAL, feeCents: fee, label: "Residential / Non-Commercial Surcharge" });
  }

  if (detectedAccessorials.has(AccessorialType.INSIDE_DELIVERY)) {
    const fee = ruleFees.insideDeliveryCents || 5000;
    accessorialTotalCents += fee;
    accessorialBreakdown.push({ type: AccessorialType.INSIDE_DELIVERY, feeCents: fee, label: "Inside Delivery / Hand-Truck Placement" });
  }

  if (detectedAccessorials.has(AccessorialType.HAZARDOUS_ADR)) {
    const fee = ruleFees.hazardousAdrCents || 2500;
    accessorialTotalCents += fee;
    accessorialBreakdown.push({ type: AccessorialType.HAZARDOUS_ADR, feeCents: fee, label: "ADR Class 3 Dangerous Goods Compliance Surcharge" });
  }

  return {
    isFreightEligible,
    isFreightMandatory,
    density,
    isHazardous,
    hazmatMatches,
    origin,
    destination,
    appliedAccessorials: Array.from(detectedAccessorials),
    accessorialTotalCents,
    accessorialBreakdown
  };
}

/**
 * Apply merchant markup / margin rule to carrier quote
 */
export function applyMerchantMarkup(baseWholesaleCents, rules) {
  const markupPercent = typeof rules.markupPercent === "number" ? rules.markupPercent : 15.0;
  const fixedCents = typeof rules.markupFixedCents === "number" ? rules.markupFixedCents : 1000;

  const percentMarginCents = Math.round(baseWholesaleCents * (markupPercent / 100));
  const finalPriceCents = baseWholesaleCents + percentMarginCents + fixedCents;

  return {
    baseWholesaleCents,
    marginCents: percentMarginCents,
    fixedHandlingCents: fixedCents,
    finalCustomerPriceCents: finalPriceCents
  };
}
