/**
 * Shopify Admin API Client for Freight CarrierService and Fulfillment updates
 */
export class ShopifyClient {
  constructor(shopDomain, accessToken) {
    this.shopDomain = shopDomain || "coast-airbrush-europe.myshopify.com";
    this.accessToken = accessToken || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
    this.isMock = !this.accessToken;
  }

  /**
   * Register or update CarrierService callback with Shopify
   */
  async registerCarrierService(callbackUrl, serviceName = "Coast Airbrush Europe Freight Network") {
    if (this.isMock) {
      return {
        success: true,
        mock: true,
        carrier_service: {
          id: 884920194,
          name: serviceName,
          callback_url: callbackUrl,
          service_discovery: true,
          carrier_service_type: "api",
          admin_graphql_api_id: "gid://shopify/DeliveryCarrierService/884920194"
        }
      };
    }

    const url = `https://${this.shopDomain}/admin/api/2024-01/carrier_services.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.accessToken
      },
      body: JSON.stringify({
        carrier_service: {
          name: serviceName,
          callback_url: callbackUrl,
          service_discovery: true
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to register CarrierService: ${res.status} ${errText}`);
    }

    return await res.json();
  }

  /**
   * Update Shopify Fulfillment with PRO tracking number and carrier name
   */
  async createFulfillment(orderId, trackingDetails) {
    const { proNumber, carrierName, trackingUrl } = trackingDetails;

    if (this.isMock) {
      return {
        success: true,
        mock: true,
        fulfillment: {
          id: Math.floor(Math.random() * 10000000),
          order_id: orderId,
          status: "success",
          tracking_company: carrierName,
          tracking_number: proNumber,
          tracking_numbers: [proNumber],
          tracking_url: trackingUrl,
          tracking_urls: [trackingUrl]
        }
      };
    }

    const url = `https://${this.shopDomain}/admin/api/2024-01/orders/${orderId}/fulfillments.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.accessToken
      },
      body: JSON.stringify({
        fulfillment: {
          message: "Pallet dispatched via Coast Airbrush Europe Freight Network",
          notify_customer: true,
          tracking_info: {
            number: proNumber,
            company: carrierName,
            url: trackingUrl
          }
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to create fulfillment: ${res.status} ${errText}`);
    }

    return await res.json();
  }
}
