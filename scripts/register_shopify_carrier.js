/**
 * CLI Utility to register the Freight Carrier Bridge with Shopify's CarrierService API
 * 
 * Usage:
 *   SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxx node scripts/register_shopify_carrier.js
 * 
 * Or with custom URL:
 *   SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxx CALLBACK_URL=https://www.coastairbrush.eu/api/freight/rates node scripts/register_shopify_carrier.js
 */

const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN || "coast-airbrush-europe.myshopify.com";
const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const callbackUrl = process.env.CALLBACK_URL || "https://www.coastairbrush.eu/api/freight/rates";
const serviceName = process.env.SERVICE_NAME || "Coast Airbrush Freight Network (LTL / Pallet)";

if (!accessToken) {
  console.log(`
=======================================================================
  Shopify CarrierService Registration
=======================================================================
To register your live Shopify store, you need an Admin Access Token:
  1. Open Shopify Admin -> Settings -> Apps and sales channels -> Develop apps
  2. Create Custom App "Freight Carrier Bridge"
  3. Grant Admin API Scopes:
     - write_shipping, read_shipping
     - write_orders, read_orders
     - write_fulfillments, read_fulfillments
  4. Click "Install app" and copy the Admin API access token (starts with shpat_...)

Then run:
  SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_your_token node scripts/register_shopify_carrier.js
=======================================================================
`);
  process.exit(1);
}

async function register() {
  console.log(`Connecting to Shopify Store: ${shopDomain}...`);
  console.log(`Registering Callback URL: ${callbackUrl}`);

  const endpoint = `https://${shopDomain}/admin/api/2024-01/carrier_services.json`;

  const payload = {
    carrier_service: {
      name: serviceName,
      callback_url: callbackUrl,
      service_discovery: true,
      active: true,
      format: "json"
    }
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(`❌ Registration Failed (${res.status}):`, JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log("=======================================================================");
    console.log("✔ SUCCESS! CarrierService registered with Shopify.");
    console.log(`  Carrier Service ID: ${data.carrier_service?.id}`);
    console.log(`  Name: ${data.carrier_service?.name}`);
    console.log(`  Callback URL: ${data.carrier_service?.callback_url}`);
    console.log("  Real-time pallet & freight rates are now ACTIVE at checkout!");
    console.log("=======================================================================");
  } catch (err) {
    console.error("Network or execution error:", err.message);
    process.exit(1);
  }
}

register();
