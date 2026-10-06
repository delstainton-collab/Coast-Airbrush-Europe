import http from "http";
import url from "url";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "./core/config.js";
import { db } from "./core/db.js";
import { handleShopifyRates } from "./routes/ratesRoute.js";
import { handleShopifyOrderPaidWebhook } from "./routes/webhooksRoute.js";
import {
  handleListShipments,
  handleGetShipment,
  handleTrackShipment,
  handleGetBolHtml,
  handleCancelShipment
} from "./routes/shipmentsRoute.js";
import {
  handleListTenants,
  handleGetTenantRules,
  handleUpdateTenantRules,
  handleListCarrierAccounts,
  handleSaveCarrierAccount
} from "./routes/tenantsRoute.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, "public");

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Shopify-Hmac-Sha256",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 5e6) {
        req.destroy();
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve(body);
      }
    });
    req.on("error", reject);
  });
}

/**
 * Main HTTP request dispatcher for Freight Bridge (useable standalone or mounted)
 */
export async function freightBridgeHandler(req, res) {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Shopify-Hmac-Sha256",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
    });
    res.end();
    return true;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;
  const tenantId = query.tenant_id || config.defaultTenantId;

  try {
    // 1. Health check
    if (pathname === "/api/freight/health") {
      sendJson(res, 200, {
        status: "healthy",
        service: "Freight Carrier Bridge Middleware",
        version: "1.0.0",
        uptimeSeconds: Math.round(process.uptime()),
        timestamp: new Date().toISOString()
      });
      return true;
    }

    // 2. Shopify CarrierService Rates: POST /api/freight/rates
    if (req.method === "POST" && (pathname === "/api/freight/rates" || pathname === "/api/carrier-service/rates")) {
      const body = await parseJsonBody(req);
      const start = Date.now();
      const response = await handleShopifyRates(body, query);
      const durationMs = Date.now() - start;
      res.setHeader("X-Response-Time-Ms", durationMs.toString());
      sendJson(res, 200, response);
      return true;
    }

    // 3. Shopify Webhook: POST /api/freight/webhooks/orders-paid
    if (req.method === "POST" && (pathname === "/api/freight/webhooks/orders-paid" || pathname === "/api/webhooks/orders-paid")) {
      const body = await parseJsonBody(req);
      const rawText = typeof body === "string" ? body : JSON.stringify(body);
      const response = await handleShopifyOrderPaidWebhook(rawText, req.headers, query);
      sendJson(res, 200, response);
      return true;
    }

    // 4. Shipments: GET /api/freight/shipments
    if (req.method === "GET" && pathname === "/api/freight/shipments") {
      const shipments = await handleListShipments(tenantId, query);
      sendJson(res, 200, { shipments });
      return true;
    }

    // 5. BOL Document: GET /api/freight/bol/:proNumber
    if (req.method === "GET" && pathname.startsWith("/api/freight/bol/")) {
      const pro = pathname.replace("/api/freight/bol/", "");
      const html = handleGetBolHtml(pro);
      if (!html) {
        sendJson(res, 404, { error: `BOL document for PRO ${pro} not found` });
        return true;
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
      return true;
    }

    // 6. Real-time Tracking: GET /api/freight/track/:proNumber
    if (req.method === "GET" && pathname.startsWith("/api/freight/track/")) {
      const pro = pathname.replace("/api/freight/track/", "");
      const tracking = await handleTrackShipment(pro);
      sendJson(res, 200, tracking);
      return true;
    }

    // 7. Cancel Shipment: POST /api/freight/shipments/:pro/cancel
    if (req.method === "POST" && pathname.includes("/cancel")) {
      const parts = pathname.split("/");
      const pro = parts[parts.indexOf("shipments") + 1];
      const body = await parseJsonBody(req);
      const result = await handleCancelShipment(pro, body.reason);
      sendJson(res, 200, result);
      return true;
    }

    // 8. Tenants: GET /api/freight/tenants
    if (req.method === "GET" && pathname === "/api/freight/tenants") {
      sendJson(res, 200, { tenants: handleListTenants() });
      return true;
    }

    // 9. Shipping Rules: GET/PUT /api/freight/rules
    if (pathname === "/api/freight/rules") {
      if (req.method === "GET") {
        sendJson(res, 200, { rules: handleGetTenantRules(tenantId) });
        return true;
      } else if (req.method === "PUT" || req.method === "POST") {
        const body = await parseJsonBody(req);
        const updated = handleUpdateTenantRules(tenantId, body);
        sendJson(res, 200, { success: true, rules: updated });
        return true;
      }
    }

    // 10. Carrier Accounts: GET/POST /api/freight/carriers
    if (pathname === "/api/freight/carriers") {
      if (req.method === "GET") {
        sendJson(res, 200, { carriers: handleListCarrierAccounts(tenantId) });
        return true;
      } else if (req.method === "POST") {
        const body = await parseJsonBody(req);
        const saved = handleSaveCarrierAccount(tenantId, body);
        sendJson(res, 200, { success: true, carrier: saved });
        return true;
      }
    }

    // 11. Static Dashboard / UI Assets
    if (
      req.method === "GET" &&
      (pathname === "/" ||
        pathname === "/dashboard" ||
        pathname === "/index.html" ||
        pathname === "/freight" ||
        pathname === "/freight-bridge")
    ) {
      const dashboardPath = path.join(PUBLIC_DIR, "index.html");
      if (fs.existsSync(dashboardPath)) {
        const html = fs.readFileSync(dashboardPath, "utf8");
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
        return true;
      }
    }

    // Unmatched freight API route
    if (pathname.startsWith("/api/freight/")) {
      sendJson(res, 404, { error: `Endpoint ${pathname} not found` });
      return true;
    }

    return false;
  } catch (err) {
    console.error(`[FreightBridge] Route error on ${req.method} ${pathname}:`, err);
    sendJson(res, err.statusCode || 500, { error: err.message || "Internal server error" });
    return true;
  }
}

// Standalone runner when executed directly via `node freight-bridge/server.js`
if (process.argv[1] && process.argv[1].endsWith("freight-bridge/server.js")) {
  db.init();
  const server = http.createServer(freightBridgeHandler);
  const PORT = config.port;
  const HOST = config.host;
  server.listen(PORT, HOST, () => {
    console.log(`=======================================================`);
    console.log(`  Coast Airbrush Europe - Freight Carrier Bridge      `);
    console.log(`  SaaS LTL Middleware running on http://${HOST}:${PORT}`);
    console.log(`  Registered in ecosystem.json on Port: ${PORT}       `);
    console.log(`=======================================================`);
  });
}
