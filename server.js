import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { freightBridgeHandler } from "./freight-bridge/server.js";
import { bomEngineHandler } from "./bom-engine/server.js";
import { handleTradeRoutes } from "./server/routes/tradeRoutes.js";
import { handleAdminTradeRoutes } from "./server/routes/adminTradeRoutes.js";
import { handleBrandRoutes } from "./server/routes/brandRoutes.js";
import { handleLeadRoutes } from "./server/routes/leadRoutes.js";
import { handleSocialRoutes } from "./server/routes/socialRoutes.js";
import { handleStaticRoutes } from "./server/routes/staticRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

export async function appHandler(req, res) {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    });
    res.end();
    return;
  }

  const [rawUrlPath] = req.url.split("?");
  const safePath = path.normalize(decodeURIComponent(rawUrlPath));

  // 1. FREIGHT CARRIER BRIDGE & SHOPIFY CARRIERSERVICE
  if (
    safePath.startsWith("/api/freight") ||
    safePath.startsWith("/api/carrier-service") ||
    safePath === "/freight" ||
    safePath === "/freight-bridge" ||
    safePath === "/freight/dashboard"
  ) {
    const handled = await freightBridgeHandler(req, res);
    if (handled) return;
  }

  // 2. WORKSHOP BOM & MANUFACTURING ENGINE
  const normBomPath = safePath.replace(/\/+$/, "") || "/";
  if (
    normBomPath.startsWith("/api/bom") ||
    normBomPath === "/workshop" ||
    normBomPath === "/bom" ||
    normBomPath === "/workshop.html" ||
    normBomPath === "/bom.html" ||
    normBomPath.includes("workshop_console")
  ) {
    if (["/workshop", "/bom", "/workshop.html", "/bom.html"].includes(normBomPath) || normBomPath.includes("workshop_console")) {
      const workshopHtmlPath = path.join(__dirname, "bom-engine", "ui", "workshop_console.html");
      if (fs.existsSync(workshopHtmlPath)) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        return fs.createReadStream(workshopHtmlPath).pipe(res);
      }
    }
    const handled = await bomEngineHandler(req, res);
    if (handled) return;
  }

  // 3. MODULAR SUB-DOMAIN ROUTE HANDLERS
  if (await handleTradeRoutes(req, res, safePath)) return;
  if (await handleAdminTradeRoutes(req, res, safePath)) return;
  if (await handleBrandRoutes(req, res, safePath)) return;
  if (await handleLeadRoutes(req, res, safePath)) return;
  if (await handleSocialRoutes(req, res, safePath)) return;

  // 4. STATIC FILE SERVING, PARTNER BACKDOOR & PRE-LAUNCH GATE
  handleStaticRoutes(req, res, safePath);
}

const server = http.createServer(appHandler);

if (!process.env.NO_SERVER_LISTEN) {
  server.listen(PORT, () => {
    console.log(`Coast Airbrush secure server running at http://localhost:${PORT}/`);
  });
}

export { server };
