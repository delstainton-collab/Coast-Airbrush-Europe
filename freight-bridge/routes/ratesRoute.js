import { db } from "../core/db.js";
import { config } from "../core/config.js";
import { evaluateFreightRules, applyMerchantMarkup } from "../engine/freightRuleEngine.js";
import { CarrierRegistry } from "../adapters/carrierRegistry.js";

/**
 * Handle Shopify CarrierService Rate Request (POST /api/freight/rates)
 */
export async function handleShopifyRates(reqBody, queryParams = {}) {
  const tenantId = queryParams.tenant_id || config.defaultTenantId;
  const rules = db.getShippingRules(tenantId);

  const ratePayload = reqBody.rate || reqBody;
  const items = ratePayload.items || [];
  const destination = ratePayload.destination || {};
  const origin = ratePayload.origin || rules.defaultOrigin;
  const currency = ratePayload.currency || rules.currency || "EUR";

  // 1. Evaluate freight eligibility, density, hazmat and accessorials
  const evaluation = evaluateFreightRules({ items, destination, origin }, rules);

  // If order does not qualify for LTL freight, return empty rates array
  // (Shopify will fall back to standard parcel courier rates)
  if (!evaluation.isFreightEligible) {
    return {
      rates: [],
      metadata: {
        isFreightEligible: false,
        reason: `Cart net weight ${evaluation.density.totalNetWeightKg}kg < threshold ${rules.minFreightWeightKg}kg and no hazardous paint drum flags`
      }
    };
  }

  // 2. Query all active carriers for this tenant in parallel with SLA timeout
  const carrierAccounts = db.getCarrierAccounts(tenantId).filter(a => a.isActive);
  if (carrierAccounts.length === 0) {
    return { rates: [] };
  }

  const queryCarriersPromise = Promise.allSettled(
    carrierAccounts.map(async account => {
      const adapter = CarrierRegistry.getAdapter(account);
      const carrierQuotes = await adapter.getRates({
        origin: evaluation.origin,
        destination: evaluation.destination,
        density: evaluation.density,
        appliedAccessorials: evaluation.appliedAccessorials
      });
      return carrierQuotes;
    })
  );

  // Timeout guard (2.5 seconds)
  const timeoutPromise = new Promise(resolve => setTimeout(() => resolve([]), config.rateTimeoutMs));

  const results = await Promise.race([queryCarriersPromise, timeoutPromise]);
  const allQuotes = [];

  if (Array.isArray(results)) {
    for (const r of results) {
      if (r && r.status === "fulfilled" && Array.isArray(r.value)) {
        allQuotes.push(...r.value);
      }
    }
  }

  // 3. Transform quotes into Shopify CarrierService format with margin and accessorials
  const shopifyRates = allQuotes.map(quote => {
    // Add carrier base wholesale + accessorial total fees
    const wholesaleTotalCents = quote.baseCostCents + evaluation.accessorialTotalCents;
    const pricing = applyMerchantMarkup(wholesaleTotalCents, rules);

    // Format delivery dates
    const minDateStr = quote.minDeliveryDate ? `${quote.minDeliveryDate} 12:00:00 +0000` : undefined;
    const maxDateStr = quote.maxDeliveryDate ? `${quote.maxDeliveryDate} 18:00:00 +0000` : undefined;

    return {
      service_name: quote.serviceName,
      service_code: quote.serviceCode,
      total_price: pricing.finalCustomerPriceCents.toString(), // Shopify expects price in cents as string
      currency: quote.currency || currency,
      min_delivery_date: minDateStr,
      max_delivery_date: maxDateStr,
      description: `${quote.description} Includes tail-lift & pallet packaging.`
    };
  });

  return {
    rates: shopifyRates,
    metadata: {
      isFreightEligible: true,
      palletCount: evaluation.density.palletCount,
      chargeableWeightKg: evaluation.density.chargeableWeightKg,
      isHazardous: evaluation.isHazardous,
      accessorials: evaluation.appliedAccessorials,
      accessorialTotalCents: evaluation.accessorialTotalCents
    }
  };
}
