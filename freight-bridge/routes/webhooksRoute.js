import { verifyShopifyHmac } from "../core/crypto.js";
import { bookingQueue } from "../services/bookingQueue.js";
import { evaluateFreightRules } from "../engine/freightRuleEngine.js";
import { db } from "../core/db.js";
import { config } from "../core/config.js";

/**
 * Handle Shopify orders/paid or fulfillments/create Webhook
 */
export async function handleShopifyOrderPaidWebhook(rawBody, headers = {}, queryParams = {}) {
  const tenantId = queryParams.tenant_id || config.defaultTenantId;
  const hmacHeader = headers["x-shopify-hmac-sha256"] || headers["X-Shopify-Hmac-Sha256"];

  // Verify HMAC if provided
  if (hmacHeader) {
    const isValid = verifyShopifyHmac(rawBody, hmacHeader);
    if (!isValid) {
      const err = new Error("Invalid Shopify Webhook HMAC signature");
      err.statusCode = 401;
      throw err;
    }
  }

  let orderData;
  try {
    orderData = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
  } catch (e) {
    const err = new Error("Invalid JSON payload");
    err.statusCode = 400;
    throw err;
  }

  const orderId = orderData.id?.toString() || `sim_${Date.now()}`;
  const orderNumber = orderData.name || orderData.order_number || `#${orderId}`;
  const lineItems = orderData.line_items || [];
  const shippingAddress = orderData.shipping_address || {};

  // Map Shopify line items to our standard format
  const mappedItems = lineItems.map(item => ({
    name: item.name || item.title,
    sku: item.sku || "",
    quantity: item.quantity || 1,
    grams: item.grams || 0,
    price: item.price
  }));

  // Check if order qualifies for LTL freight
  const rules = db.getShippingRules(tenantId);
  const evaluation = evaluateFreightRules({ items: mappedItems, destination: shippingAddress }, rules);

  // If not freight eligible and not forced via query param
  if (!evaluation.isFreightEligible && queryParams.force !== "true") {
    return {
      success: true,
      queued: false,
      message: "Order does not meet freight criteria (standard courier fulfillment applies)",
      orderId,
      orderNumber,
      metrics: {
        weightKg: evaluation.density.totalNetWeightKg,
        isHazardous: evaluation.isHazardous
      }
    };
  }

  // Enqueue asynchronous freight booking job
  const job = await bookingQueue.enqueue({
    tenantId,
    orderId,
    orderNumber,
    items: mappedItems,
    destination: {
      name: `${shippingAddress.first_name || ""} ${shippingAddress.last_name || ""}`.trim() || shippingAddress.name,
      company: shippingAddress.company || "",
      address1: shippingAddress.address1 || "",
      city: shippingAddress.city || "",
      province: shippingAddress.province || "",
      postalCode: shippingAddress.zip || shippingAddress.postal_code || "",
      country: shippingAddress.country_code || shippingAddress.country || "NL",
      phone: shippingAddress.phone || ""
    },
    accessorials: evaluation.appliedAccessorials
  });

  return {
    success: true,
    queued: true,
    jobId: job.id,
    orderId,
    orderNumber,
    message: "Freight booking task queued successfully for background dispatch"
  };
}
