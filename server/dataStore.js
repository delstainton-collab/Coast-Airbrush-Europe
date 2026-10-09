import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

export const activeSessions = new Map();

export function getAccounts() {
  try {
    const raw = fs.readFileSync(path.join(rootDir, "data", "trade_accounts_secure.json"), "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function getPricebook() {
  try {
    const raw = fs.readFileSync(path.join(rootDir, "data", "b2b_pricebook_secure.json"), "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function getBrandsMaster() {
  try {
    const raw = fs.readFileSync(path.join(rootDir, "data", "brands_master.json"), "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

let cachedCatalog = null;
export function getCatalogProducts() {
  if (cachedCatalog) return cachedCatalog;
  try {
    const raw = fs.readFileSync(path.join(rootDir, "data", "full_ecom_catalog.js"), "utf8");
    const jsonMatch = raw.match(/export\s+const\s+ECOM_CATALOG\s*=\s*(\[[\s\S]*?\]);\s*$/);
    if (jsonMatch) {
      cachedCatalog = JSON.parse(jsonMatch[1]);
      return cachedCatalog;
    }
  } catch (e) {
    console.warn("Failed to parse catalog:", e.message);
  }
  return [];
}

export function parseJsonBody(req) {
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

export function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-store, no-cache, must-revalidate"
  });
  res.end(JSON.stringify(data));
}
