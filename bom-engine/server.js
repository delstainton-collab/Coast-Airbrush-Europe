/**
 * Coast Airbrush Europe - BOM & Manufacturing HTTP API Bridge
 * 
 * Provides REST endpoints for the Workshop Console, Admin, and PIM sync.
 * Designed to be mounted in server.js with zero coupling.
 */

import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { bomEngine } from "./core/bomEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSHOP_HTML_PATH = path.join(__dirname, "ui", "workshop_console.html");

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-store, no-cache, must-revalidate"
  });
  res.end(JSON.stringify(data, null, 2));
}

export async function bomEngineHandler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  // Handle CORS Pre-flight
  if (req.method === "OPTIONS" && pathname.startsWith("/api/bom")) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    });
    res.end();
    return true;
  }

  // Route: Serve workshop console UI
  const cleanPath = pathname.replace(/\/+$/, "") || "/";
  if (cleanPath === "/workshop" || cleanPath === "/bom" || cleanPath === "/workshop.html" || cleanPath === "/bom.html") {
    if (fs.existsSync(WORKSHOP_HTML_PATH)) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      fs.createReadStream(WORKSHOP_HTML_PATH).pipe(res);
      return true;
    }
  }

  // Route: GET /api/bom/summary
  if (req.method === "GET" && pathname === "/api/bom/summary") {
    try {
      const recipes = bomEngine.getAllRecipes();
      const alerts = bomEngine.getReorderAlerts();
      const history = bomEngine.getProductionHistory(5);
      sendJson(res, 200, {
        success: true,
        timestamp: new Date().toISOString(),
        recipes,
        reorderAlerts: alerts,
        recentWorkOrders: history
      });
    } catch (e) {
      sendJson(res, 500, { success: false, error: e.message });
    }
    return true;
  }

  // Route: GET /api/bom/components
  if (req.method === "GET" && pathname === "/api/bom/components") {
    try {
      const components = bomEngine.getAllComponents();
      sendJson(res, 200, { success: true, count: components.length, components });
    } catch (e) {
      sendJson(res, 500, { success: false, error: e.message });
    }
    return true;
  }

  // Route: GET /api/bom/atb/:sku
  if (req.method === "GET" && pathname.startsWith("/api/bom/atb/")) {
    const sku = pathname.replace("/api/bom/atb/", "").trim();
    try {
      const atb = bomEngine.calculateAvailableToBuild(sku);
      sendJson(res, 200, { success: true, atb });
    } catch (e) {
      sendJson(res, 404, { success: false, error: e.message });
    }
    return true;
  }

  // Route: GET /api/bom/cogs/:sku
  if (req.method === "GET" && pathname.startsWith("/api/bom/cogs/")) {
    const sku = pathname.replace("/api/bom/cogs/", "").trim();
    try {
      const cogs = bomEngine.calculateRolledUpCOGS(sku);
      sendJson(res, 200, { success: true, cogs });
    } catch (e) {
      sendJson(res, 404, { success: false, error: e.message });
    }
    return true;
  }

  // Route: GET /api/bom/alerts
  if (req.method === "GET" && pathname === "/api/bom/alerts") {
    try {
      const alerts = bomEngine.getReorderAlerts();
      sendJson(res, 200, { success: true, alerts });
    } catch (e) {
      sendJson(res, 500, { success: false, error: e.message });
    }
    return true;
  }

  // Route: GET /api/bom/history
  if (req.method === "GET" && pathname === "/api/bom/history") {
    try {
      const history = bomEngine.getProductionHistory(50);
      sendJson(res, 200, { success: true, history });
    } catch (e) {
      sendJson(res, 500, { success: false, error: e.message });
    }
    return true;
  }

  // Route: POST /api/bom/assemble
  if (req.method === "POST" && pathname === "/api/bom/assemble") {
    try {
      const body = await parseJsonBody(req);
      const { parentSku, quantity, technician, notes, syncShopify } = body;
      if (!parentSku || !quantity) {
        sendJson(res, 400, { success: false, error: "Missing required fields: 'parentSku' and 'quantity'" });
        return true;
      }

      const result = bomEngine.executeAssemblyOrder(parentSku, quantity, {
        technician: technician || "Workshop Web Console",
        notes: notes || "Workshop batch build",
        syncShopify: Boolean(syncShopify)
      });

      sendJson(res, 200, { success: true, workOrder: result });
    } catch (e) {
      sendJson(res, 400, { success: false, error: e.message });
    }
    return true;
  }

  // Route: POST /api/bom/components/:sku/stock
  if (req.method === "POST" && pathname.startsWith("/api/bom/components/") && pathname.endsWith("/stock")) {
    const sku = pathname.replace("/api/bom/components/", "").replace("/stock", "").trim();
    try {
      const body = await parseJsonBody(req);
      const deltaQty = parseInt(body.deltaQty, 10);
      if (isNaN(deltaQty)) {
        sendJson(res, 400, { success: false, error: "deltaQty must be a valid integer" });
        return true;
      }
      const updated = bomEngine.updateComponentStock(sku, deltaQty, body.reason);
      sendJson(res, 200, { success: true, component: updated });
    } catch (e) {
      sendJson(res, 400, { success: false, error: e.message });
    }
    return true;
  }

  // Not handled by BOM engine
  return false;
}

// Standalone runner when executed directly via `node bom-engine/server.js`
if (process.argv[1] && process.argv[1].endsWith("bom-engine/server.js")) {
  const PORT = process.env.BOM_PORT || 3016;
  const server = http.createServer(async (req, res) => {
    const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = urlObj.pathname.replace(/\/+$/, "") || "/";
    if (pathname === "/" || pathname === "/workshop" || pathname === "/bom") {
      if (fs.existsSync(WORKSHOP_HTML_PATH)) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        return fs.createReadStream(WORKSHOP_HTML_PATH).pipe(res);
      }
    }
    const handled = await bomEngineHandler(req, res);
    if (!handled) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
    }
  });

  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  Coast Airbrush Europe — Workshop BOM & Manufacturing `);
    console.log(`  Console running at: http://localhost:${PORT}/         `);
    console.log(`=======================================================`);
  });
}
