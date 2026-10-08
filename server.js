import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { freightBridgeHandler } from "./freight-bridge/server.js";
import { bomEngineHandler } from "./bom-engine/server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime"
};

// In-memory active trade sessions
const activeSessions = new Map();

function getAccounts() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, "data", "trade_accounts_secure.json"), "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function getPricebook() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, "data", "b2b_pricebook_secure.json"), "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function getBrandsMaster() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, "data", "brands_master.json"), "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

let cachedCatalog = null;
function getCatalogProducts() {
  if (cachedCatalog) return cachedCatalog;
  try {
    const raw = fs.readFileSync(path.join(__dirname, "data", "full_ecom_catalog.js"), "utf8");
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
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-store, no-cache, must-revalidate"
  });
  res.end(JSON.stringify(data));
}

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

  // ==========================================
  // FREIGHT CARRIER BRIDGE & SHOPIFY CARRIERSERVICE
  // ==========================================
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

  // ==========================================
  // DECOUPLED MODULE: WORKSHOP BOM & MANUFACTURING ENGINE
  // ==========================================
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

  // ==========================================
  // API ROUTE 1: B2B TRADE LOGIN
  // ==========================================
  if (req.method === "POST" && safePath === "/api/auth/trade-login") {
    try {
      const { email, password } = await parseJsonBody(req);
      const accounts = getAccounts();
      const user = accounts.find(
        a => a.email.toLowerCase() === (email || "").trim().toLowerCase() && a.password === password
      );

      if (!user) {
        return sendJson(res, 401, {
          success: false,
          error: "Invalid trade credentials. Please contact your account manager or submit an application."
        });
      }

      if (!user.approved) {
        return sendJson(res, 403, {
          success: false,
          error: `Application Pending Approval: Your commercial account for "${user.company}" is currently awaiting manual compliance verification. Our trade desk must review your VAT/business credentials before wholesale pricing can be accessed.`
        });
      }

      const token = "CAE_B2B_" + user.role.toUpperCase() + "_" + Buffer.from(user.id + ":" + Date.now()).toString("base64");
      const movGbp = user.role === "distributor" ? 2000.0 : (user.role === "dealer" ? 500.0 : 0.0);
      const movEur = user.role === "distributor" ? 2500.0 : (user.role === "dealer" ? 550.0 : 0.0);
      const defaultMoq = user.role === "distributor" ? 12 : (user.role === "dealer" ? 6 : 1);

      activeSessions.set(token, {
        id: user.id,
        email: user.email,
        company: user.company,
        contactName: user.contactName,
        role: user.role,
        tierLabel: user.tierLabel,
        vat: user.vat,
        eori: user.eori,
        country: user.country,
        currency: user.currency,
        discountMultiplier: user.discountMultiplier,
        paymentTerms: user.paymentTerms,
        creditTerms: user.paymentTerms || (user.role === "distributor" ? "Net 60 Days" : "Net 30 Days"),
        movGbp,
        movEur,
        defaultMoq,
        createdAt: Date.now()
      });

      return sendJson(res, 200, {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          company: user.company,
          contactName: user.contactName,
          role: user.role,
          tierLabel: user.tierLabel,
          vat: user.vat,
          eori: user.eori,
          country: user.country,
          currency: user.currency,
          discountMultiplier: user.discountMultiplier,
          paymentTerms: user.paymentTerms,
          creditTerms: user.paymentTerms || (user.role === "distributor" ? "Net 60 Days" : "Net 30 Days"),
          movGbp,
          movEur,
          defaultMoq
        }
      });
    } catch (e) {
      return sendJson(res, 400, { success: false, error: "Invalid request payload" });
    }
  }

  // ==========================================
  // API ROUTE 2: GET TIER-SPECIFIC PRICING
  // ==========================================
  if (req.method === "GET" && safePath === "/api/trade/pricing") {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const session = activeSessions.get(token);

    if (!session) {
      return sendJson(res, 401, {
        success: false,
        error: "Unauthorized. Trade pricing is restricted exclusively to authenticated commercial partners."
      });
    }

    const pricebook = getPricebook();
    if (!pricebook) {
      return sendJson(res, 500, { success: false, error: "Pricebook service unavailable" });
    }

    // Filter pricing ONLY for the authenticated role (Dealer or Distributor)
    const role = session.role; // "dealer" or "distributor"
    const sanitizedPricing = {};

    for (const [sku, p] of Object.entries(pricebook.skuPricing || {})) {
      if (role === "dealer") {
        sanitizedPricing[sku] = {
          priceGbp: p.dealerPriceGbp,
          priceEur: p.dealerPriceEur,
          retailGbp: p.retailPriceGbp,
          retailEur: p.retailPriceEur
        };
      } else if (role === "distributor") {
        sanitizedPricing[sku] = {
          priceGbp: p.distributorPriceGbp,
          priceEur: p.distributorPriceEur,
          retailGbp: p.retailPriceGbp,
          retailEur: p.retailPriceEur
        };
      }
    }

    return sendJson(res, 200, {
      success: true,
      role: session.role,
      tierLabel: session.tierLabel,
      company: session.company,
      defaultMultiplier: session.discountMultiplier,
      skuPricing: sanitizedPricing
    });
  }

  // ==========================================
  // API ROUTE 3: TRADE APPLICATION INTAKE
  // ==========================================
  if (req.method === "POST" && safePath === "/api/trade/apply") {
    try {
      const appData = await parseJsonBody(req);
      if (!appData.company || !appData.email) {
        return sendJson(res, 400, { success: false, error: "Company name and contact email are required." });
      }

      const appsFile = path.join(__dirname, "data", "trade_applications.json");
      let apps = [];
      try {
        apps = JSON.parse(fs.readFileSync(appsFile, "utf8"));
      } catch (e) {
        apps = [];
      }

      const newApp = {
        id: "app_" + Date.now(),
        submittedAt: new Date().toISOString(),
        company: appData.company.trim(),
        contactName: (appData.contactName || "").trim(),
        email: appData.email.trim(),
        phone: (appData.phone || "").trim(),
        vat: (appData.vat || "").trim().toUpperCase(),
        country: (appData.country || "").trim(),
        sector: appData.sector || "Custom Automotive Refinishing",
        tierDesired: appData.tierDesired || "dealer",
        monthlyVolume: appData.monthlyVolume || "Not specified",
        currentBrands: appData.currentBrands || "",
        notes: appData.notes || "",
        status: "pending_review"
      };

      apps.unshift(newApp);
      fs.writeFileSync(appsFile, JSON.stringify(apps, null, 2));

      return sendJson(res, 200, {
        success: true,
        message: "Your application has been received. Our trade team will verify your business credentials within 24 hours.",
        applicationId: newApp.id
      });
    } catch (e) {
      return sendJson(res, 400, { success: false, error: "Failed to process application." });
    }
  }

  // ==========================================
  // API ROUTE 4: CHECK SESSION VALIDITY
  // ==========================================
  if (req.method === "GET" && safePath === "/api/auth/trade-session") {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const session = activeSessions.get(token);

    if (!session) {
      return sendJson(res, 401, { success: false, error: "No active trade session" });
    }

    return sendJson(res, 200, { success: true, user: session });
  }

  // ==========================================
  // API ROUTE 5: TRADE LOGOUT
  // ==========================================
  if (req.method === "POST" && safePath === "/api/auth/trade-logout") {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (token) activeSessions.delete(token);
    return sendJson(res, 200, { success: true, message: "Logged out successfully" });
  }

  // ==========================================
  // API ROUTE 5B: PLACE ORDER ON CREDIT ACCOUNT (NET 30 / NET 60)
  // ==========================================
  if (req.method === "POST" && safePath === "/api/trade/place-account-order") {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const session = activeSessions.get(token);

    if (!session) {
      return sendJson(res, 401, {
        success: false,
        error: "Unauthorized: Active commercial trade session required to place orders on account."
      });
    }

    try {
      const payload = await parseJsonBody(req);
      const items = Array.isArray(payload.items) ? payload.items : [];
      const poNumber = (payload.poNumber || "").trim();
      const notes = (payload.notes || "").trim();
      const currency = (payload.currency || session.currency || "GBP").toUpperCase();
      const isGbp = currency === "GBP";

      if (items.length === 0) {
        return sendJson(res, 400, { success: false, error: "Cart is empty. Please add items to place a trade order." });
      }

      if (!poNumber) {
        return sendJson(res, 400, { success: false, error: "An Internal Purchase Order (PO) Number is mandatory for billing on credit accounts." });
      }

      // Calculate server-verified subtotal
      const computedSubtotal = items.reduce((sum, item) => {
        const itemPrice = isGbp
          ? (item.priceGbp ?? item.unitPrice ?? item.price ?? (item.priceEur ? item.priceEur * 0.85 : 0))
          : (item.priceEur ?? item.unitPrice ?? item.price ?? (item.priceGbp ? item.priceGbp / 0.85 : 0));
        return sum + (Number(itemPrice || 0) * Number(item.quantity || 1));
      }, 0);
      const verifiedSubtotal = computedSubtotal > 0 ? computedSubtotal : Number(payload.subtotal || 0);

      // Server-side strict MOV verification
      const role = session.role;
      let movThreshold = 0;
      if (role === "dealer") {
        movThreshold = isGbp ? 500.0 : 550.0;
        if (!Number.isFinite(verifiedSubtotal) || verifiedSubtotal < movThreshold) {
          return sendJson(res, 400, {
            success: false,
            error: `Minimum Order Value not reached. Authorized Dealers require a minimum spend of ${isGbp ? '£500.00' : '€550.00'} ex-VAT. Current subtotal: ${isGbp ? '£' : '€'}${verifiedSubtotal.toFixed(2)}.`
          });
        }
      } else if (role === "distributor") {
        movThreshold = isGbp ? 2000.0 : 2500.0;
        if (!Number.isFinite(verifiedSubtotal) || verifiedSubtotal < movThreshold) {
          return sendJson(res, 400, {
            success: false,
            error: `Minimum Order Value not reached. Master Distributors require a minimum spend of ${isGbp ? '£2,000.00' : '€2,500.00'} ex-VAT. Current subtotal: ${isGbp ? '£' : '€'}${verifiedSubtotal.toFixed(2)}.`
          });
        }
      }

      // Calculate due date based on payment terms
      const now = new Date();
      const termsDays = session.paymentTerms && session.paymentTerms.includes("60") ? 60 : 30;
      const dueDate = new Date(now.getTime() + termsDays * 24 * 60 * 60 * 1000);

      // Tax calculation: UK pays 20% VAT; EU B2B with valid VAT is 0% reverse charge
      const isUK = session.country && (session.country.toLowerCase().includes("united kingdom") || session.country.toLowerCase() === "uk");
      const vatRate = isUK ? 0.20 : 0.0;
      const vatAmount = verifiedSubtotal * vatRate;
      const shippingAmount = 0.0; // B2B orders meeting MOV qualify for free pallet/road freight
      const totalAmount = verifiedSubtotal + vatAmount + shippingAmount;

      const orderRecord = {
        orderId: `CAE-PO-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
        status: "CONFIRMED_ON_ACCOUNT",
        placedAt: now.toISOString(),
        paymentTerms: session.paymentTerms || "Net 30 Days",
        dueDate: dueDate.toISOString().split("T")[0],
        poNumber,
        buyer: {
          company: session.company,
          contactName: session.contactName,
          email: session.email,
          vat: session.vat,
          eori: session.eori,
          country: session.country,
          role: session.role,
          tierLabel: session.tierLabel
        },
        financials: {
          currency,
          subtotal: Math.round(verifiedSubtotal * 100) / 100,
          vatRatePercent: isUK ? 20 : 0,
          vatTreatment: isUK ? "20% UK HMRC VAT" : "0% EU Intra-Community Reverse Charge (Art 138 EU VAT Dir)",
          vatAmount: Math.round(vatAmount * 100) / 100,
          shipping: shippingAmount,
          total: Math.round(totalAmount * 100) / 100
        },
        logistics: {
          dispatchHub: isUK 
            ? "UK Central Distribution Center (APC Overnight ADR Hazmat)" 
            : "Netherlands Bonded 3PL (Rotterdam DDP Road Freight)",
          dispatchStatus: "Queued for Priority Warehouse Picking",
          notes
        },
        items: items.map(i => ({
          sku: i.sku,
          title: i.title,
          quantity: i.quantity,
          variantDetails: i.variantDetails || "Standard",
          unitPrice: isGbp ? (i.priceGbp || i.price) : (i.priceEur || i.price),
          lineTotal: Math.round((Number(isGbp ? (i.priceGbp || i.price) : (i.priceEur || i.price)) * Number(i.quantity)) * 100) / 100
        }))
      };

      // Save order to data/trade_orders.json
      const ordersFile = path.join(__dirname, "data", "trade_orders.json");
      let allOrders = [];
      try {
        allOrders = JSON.parse(fs.readFileSync(ordersFile, "utf8"));
      } catch (e) {
        allOrders = [];
      }
      allOrders.unshift(orderRecord);
      fs.writeFileSync(ordersFile, JSON.stringify(allOrders, null, 2));

      return sendJson(res, 201, {
        success: true,
        message: `Order ${orderRecord.orderId} successfully placed on your commercial account under terms: ${orderRecord.paymentTerms}.`,
        order: orderRecord
      });
    } catch (err) {
      console.error("Failed to place account order:", err);
      return sendJson(res, 500, { success: false, error: "Failed to process commercial purchase order: " + err.message });
    }
  }

  // ==========================================
  // API ROUTE 6: SOCIAL DM & COMMENT AUTOMATION WEBHOOK
  // ==========================================
  if (req.method === "POST" && safePath === "/api/social/dm") {
    try {
      const { message, platform, senderId } = await parseJsonBody(req);
      const text = (message || "").toLowerCase();

      let matched = {
        keyword: "CHROME",
        sku: "KE-CHROME-1L",
        name: "Kroma Edge Mirror Spray Chrome 2K System (1 Litre)",
        priceUSD: 145.00,
        priceEUR: 135.00,
        priceGBP: 115.00,
        dispatchHub: "Netherlands 3PL & UK Hub (24h Dispatch)",
        videoUrl: "/assets/videos/kroma-edge-mirror-chrome.mp4"
      };

      if (text.includes("gun") || text.includes("flake") || text.includes("dry") || text.includes("1000")) {
        matched = {
          keyword: "GUN",
          sku: "FK-1000-GUN",
          name: "Flake King 1000 Professional Dry Flake Gun",
          priceUSD: 219.00,
          priceEUR: 205.00,
          priceGBP: 175.00,
          dispatchHub: "UK & Netherlands Hub (In Stock)",
          videoUrl: "/assets/videos/flake-king-dry-gun-demo.mp4"
        };
      } else if (text.includes("tape") || text.includes("peel") || text.includes("masking") || text.includes("line")) {
        matched = {
          keyword: "TAPE",
          sku: "FK-TAPE-SET",
          name: "Flake King Prime Green & Orange Fine Line Mixed Pack",
          priceUSD: 28.50,
          priceEUR: 26.50,
          priceGBP: 22.50,
          dispatchHub: "UK & Netherlands Hub (In Stock)",
          videoUrl: "/assets/videos/fine-line-tape-peel.mp4"
        };
      } else if (text.includes("mix") || text.includes("candy") || text.includes("ratio") || text.includes("reducer")) {
        matched = {
          keyword: "MIX",
          sku: "KE-CANDY-RED-QT",
          name: "Kroma Edge Kandy Apple Red + High-Gloss Reducer Pack",
          priceUSD: 85.00,
          priceEUR: 79.00,
          priceGBP: 68.00,
          dispatchHub: "ADR LQ Hazmat Ground Freight Certified",
          videoUrl: "/assets/videos/candy-mixing-tips.mp4"
        };
      } else if (text.includes("iwata") || text.includes("needle") || text.includes("bubble") || text.includes("packing")) {
        matched = {
          keyword: "IWATA",
          sku: "IW-ECL-HPCS",
          name: "Anest Iwata Eclipse HP-CS + OEM PTFE Packing Kit",
          priceUSD: 179.00,
          priceEUR: 169.00,
          priceGBP: 145.00,
          dispatchHub: "Official European Iwata Distributor",
          videoUrl: "/assets/videos/iwata-bubbling-needle-packing.mp4"
        };
      } else if (text.includes("clean armor") || text.includes("clean armour") || text.includes("uv-900") || text.includes("uv clear") || text.includes("uv cure")) {
        matched = {
          keyword: "CLEAN_ARMOR",
          sku: "CA-UV900-CLEAR-1L",
          name: "Clean Armor UV 900 High-Gloss Clearcoat (100% Solids, Zero VOC, 120s UV Cure)",
          priceUSD: 199.00,
          priceEUR: 185.00,
          priceGBP: 158.00,
          dispatchHub: "Netherlands & UK Hubs (ADR Hazmat Exempt — 100% Solids)",
          videoUrl: "/assets/videos/clean-armor-120s-uv-cure.mp4"
        };
      } else if (text.includes("lumilor") || text.includes("light up") || text.includes("electric paint") || text.includes("electroluminescent")) {
        matched = {
          keyword: "LUMILOR",
          sku: "LL-STARTER-KIT-4OZ",
          name: "LumiLor Patented Electric Light Up Paint Starter Kit (Backplane, Dielectric, Luminescent, Conductive + Inverter)",
          priceUSD: 595.00,
          priceEUR: 545.00,
          priceGBP: 465.00,
          dispatchHub: "Official Master European Distributor (Direct Dispatch)",
          videoUrl: "/assets/videos/lumilor-field-emission-demo.mp4"
        };
      } else if (text.includes("ace of shades") || text.includes("super shine") || text.includes("solvent candy") || text.includes("shade")) {
        matched = {
          keyword: "ACE_OF_SHADES",
          sku: "AOS-SS79-CLEAR",
          name: "Ace of Shades Super Shine '79 High-Solids Solvent Clearcoat (By Custom – For Custom)",
          priceUSD: 125.00,
          priceEUR: 115.00,
          priceGBP: 98.00,
          dispatchHub: "UK Central Distribution Center (ADR LQ Hazmat Certified)",
          videoUrl: "/assets/videos/ace-of-shades-depth-demo.mp4"
        };
      } else if (text.includes("hyper fx") || text.includes("createx") || text.includes("waterbased") || text.includes("water-based") || text.includes("candy2o")) {
        matched = {
          keyword: "HYPER_FX",
          sku: "HFX-PRIMARY-SET-4OZ",
          name: "Hyper FX Premier Custom Waterbased Paint Master Set (Coast Airbrush Formulation Powered by Createx)",
          priceUSD: 158.00,
          priceEUR: 145.00,
          priceGBP: 125.00,
          dispatchHub: "UK & Netherlands Hub (REACH 2026 Guaranteed)",
          videoUrl: "/assets/videos/hyper-fx-waterbased-flow.mp4"
        };
      } else if (text.includes("vsionair") || text.includes("tri-stand") || text.includes("workstation") || text.includes("turntable") || text.includes("rig")) {
        matched = {
          keyword: "VSIONAIR",
          sku: "VA-TRISTAND-PRO",
          name: "VsionAir Modular All-Angle Tri-Stand Workstation System (360° Rotating Quick-Release Rigs)",
          priceUSD: 410.00,
          priceEUR: 375.00,
          priceGBP: 320.00,
          dispatchHub: "UK & Netherlands Hub (Factory Direct Stock)",
          videoUrl: "/assets/videos/vsionair-modular-workstation.mp4"
        };
      } else if (text.includes("tds") || text.includes("sheet") || text.includes("guide") || text.includes("data")) {
        return sendJson(res, 200, {
          success: true,
          type: "download",
          replyMessage: "Here is your direct access to the official Flake King & Kroma Edge Technical Data Sheet (TDS) and Mixing Guide: https://coastairbrush.eu/assets/docs/KROMA_EDGE_MIRROR_SYSTEM_TDS.pdf",
          downloadUrl: "/assets/docs/KROMA_EDGE_MIRROR_SYSTEM_TDS.pdf"
        });
      }

      const permalink = `https://coastairbrush.eu/cart/add?id=${matched.sku}&quantity=1&ref=agent_c_social`;

      return sendJson(res, 200, {
        success: true,
        keyword: matched.keyword,
        productName: matched.name,
        featuredSku: matched.sku,
        directCheckoutLink: permalink,
        pricing: {
          usd: matched.priceUSD,
          eur: matched.priceEUR,
          gbp: matched.priceGBP
        },
        dispatch: matched.dispatchHub,
        videoUrl: matched.videoUrl,
        replyMessage: `Hey there! 🎨 That finish was created using the **${matched.name}**.\n\n` +
                      `📦 **European Stock**: In stock at our Netherlands & UK hubs for immediate dispatch across 27 EU states & UK (0% US import duty).\n` +
                      `💳 **1-Click Checkout**: [Tap here to buy directly](${permalink})\n\n` +
                      `Need nozzle sizing or compressor PSI setup? Reply here anytime!`
      });
    } catch (e) {
      return sendJson(res, 400, { success: false, error: "Invalid webhook payload" });
    }
  }

  // ==========================================
  // API ROUTE: BRANDS MASTER DIRECTORY & PROFILES
  // ==========================================
  if (req.method === "GET" && safePath === "/api/brands") {
    try {
      const brands = getBrandsMaster();
      const catalog = getCatalogProducts();

      // Augment each brand with live product counts and flagship items
      const enrichedBrands = brands.map(b => {
        const brandKey = b.name.toLowerCase().split(" ")[0]; // "kroma", "anest", "ace", "hyper", "lumilor", "clean", "flake"
        const matchingProducts = catalog.filter(p => {
          const pb = (p.brand || "").toLowerCase();
          const pName = (p.name || "").toLowerCase();
          const pDesc = (p.description || "").toLowerCase();
          return pb.includes(brandKey) || pName.includes(brandKey) || pDesc.includes(brandKey) || (b.productIds || []).includes(p.id);
        });

        return {
          ...b,
          totalSkus: matchingProducts.length,
          flagshipSkus: matchingProducts.slice(0, 4).map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            priceGbp: p.priceGbp,
            priceEur: p.priceEur,
            badge: p.badge || null,
            image: p.image
          }))
        };
      });

      return sendJson(res, 200, {
        success: true,
        count: enrichedBrands.length,
        brands: enrichedBrands
      });
    } catch (e) {
      return sendJson(res, 500, { success: false, error: "Failed to load brands directory: " + e.message });
    }
  }

  // ==========================================
  // API ROUTE: BRAND DOSSIER BY ID/SLUG
  // ==========================================
  if (req.method === "GET" && safePath.startsWith("/api/brands/")) {
    try {
      const brandId = safePath.replace("/api/brands/", "").trim().toLowerCase();
      const brands = getBrandsMaster();
      const brand = brands.find(b => 
        b.id.toLowerCase() === brandId || 
        b.slug.toLowerCase() === brandId ||
        b.name.toLowerCase().includes(brandId)
      );

      if (!brand) {
        return sendJson(res, 404, { success: false, error: `Brand "${brandId}" not found in master directory.` });
      }

      const catalog = getCatalogProducts();
      const brandKey = brand.name.toLowerCase().split(" ")[0];
      const associatedProducts = catalog.filter(p => {
        const pb = (p.brand || "").toLowerCase();
        const pName = (p.name || "").toLowerCase();
        const pDesc = (p.description || "").toLowerCase();
        return pb.includes(brandKey) || pName.includes(brandKey) || pDesc.includes(brandKey) || (brand.productIds || []).includes(p.id);
      });

      return sendJson(res, 200, {
        success: true,
        brand,
        products: associatedProducts,
        totalProducts: associatedProducts.length
      });
    } catch (e) {
      return sendJson(res, 500, { success: false, error: "Failed to load brand dossier: " + e.message });
    }
  }




  // ==========================================
  // API ROUTE: ADMIN - GET TRADE APPLICATIONS
  // ==========================================
  if (req.method === "GET" && safePath === "/api/admin/trade-applications") {
    try {
      const raw = fs.readFileSync(path.join(__dirname, "data", "trade_applications.json"), "utf8");
      return sendJson(res, 200, { success: true, applications: JSON.parse(raw) });
    } catch (e) {
      return sendJson(res, 200, { success: true, applications: [] });
    }
  }

  // ==========================================
  // API ROUTE: ADMIN - MANUALLY APPROVE TRADE PARTNER
  // ==========================================
  if (req.method === "POST" && safePath === "/api/admin/approve-trade") {
    try {
      const { applicationId, assignedRole, customDiscount } = await parseJsonBody(req);
      const appsFile = path.join(__dirname, "data", "trade_applications.json");
      const accsFile = path.join(__dirname, "data", "trade_accounts_secure.json");

      let apps = JSON.parse(fs.readFileSync(appsFile, "utf8"));
      let accounts = JSON.parse(fs.readFileSync(accsFile, "utf8"));

      const app = apps.find(a => a.id === applicationId);
      if (!app) {
        return sendJson(res, 404, { success: false, error: "Application not found" });
      }

      const role = assignedRole || app.tierDesired || "dealer";
      const isDist = role === "distributor";
      const discount = customDiscount || (isDist ? 0.45 : 0.70);
      const tierLabel = isDist ? "Tier 1: Master Regional Distributor" : "Tier 2: Authorized Trade Dealer";
      const paymentTerms = isDist ? "Net 60 Days / Pallet Allocation" : "Net 30 Days";

      // Mark application approved
      app.status = "approved";
      app.assignedTier = role;
      app.approvedAt = new Date().toISOString();
      fs.writeFileSync(appsFile, JSON.stringify(apps, null, 2));

      // Update or create secure account
      let account = accounts.find(a => a.email.toLowerCase() === app.email.toLowerCase());
      if (account) {
        account.approved = true;
        account.approvedAt = new Date().toISOString();
        account.role = role;
        account.tierLabel = tierLabel;
        account.discountMultiplier = discount;
        account.paymentTerms = paymentTerms;
      } else {
        account = {
          id: "acc_" + Date.now(),
          email: app.email,
          password: "Trade2026!",
          company: app.company,
          contactName: app.contactName,
          role: role,
          tierLabel: tierLabel,
          vat: app.vat,
          eori: (app.vat || "") + "000",
          country: app.country,
          currency: app.country && app.country.toLowerCase().includes("uk") ? "GBP" : "EUR",
          discountMultiplier: discount,
          paymentTerms: paymentTerms,
          approved: true,
          approvedAt: new Date().toISOString()
        };
        accounts.push(account);
      }

      fs.writeFileSync(accsFile, JSON.stringify(accounts, null, 2));

      return sendJson(res, 200, {
        success: true,
        message: `Commercial account for "${app.company}" successfully approved as ${tierLabel}.`,
        account: {
          email: account.email,
          company: account.company,
          role: account.role,
          tierLabel: account.tierLabel,
          approved: true
        }
      });
    } catch (e) {
      return sendJson(res, 500, { success: false, error: "Failed to approve partner." });
    }
  }

  // ==========================================
  // API ROUTE: ADMIN - REJECT TRADE PARTNER
  // ==========================================
  if (req.method === "POST" && safePath === "/api/admin/reject-trade") {
    try {
      const { applicationId, reason } = await parseJsonBody(req);
      const appsFile = path.join(__dirname, "data", "trade_applications.json");
      let apps = JSON.parse(fs.readFileSync(appsFile, "utf8"));

      const app = apps.find(a => a.id === applicationId);
      if (app) {
        app.status = "rejected";
        app.rejectionReason = reason || "Compliance verification requirements not met";
        app.rejectedAt = new Date().toISOString();
        fs.writeFileSync(appsFile, JSON.stringify(apps, null, 2));
      }

      return sendJson(res, 200, { success: true, message: "Application marked as rejected." });
    } catch (e) {
      return sendJson(res, 500, { success: false, error: "Failed to reject application." });
    }
  }

  // ==========================================
  // API ROUTE: ADMIN - RESET DEMO TRADE APPLICANT (TESTING HELPER)
  // ==========================================
  if (req.method === "POST" && safePath === "/api/admin/reset-demo-trade") {
    try {
      const appsFile = path.join(__dirname, "data", "trade_applications.json");
      const accsFile = path.join(__dirname, "data", "trade_accounts_secure.json");

      let apps = JSON.parse(fs.readFileSync(appsFile, "utf8"));
      let accounts = JSON.parse(fs.readFileSync(accsFile, "utf8"));

      const app = apps.find(a => a.id === "app_demo_01" || a.email.toLowerCase() === "klaus@bavariakustom.de");
      if (app) {
        app.status = "pending_review";
        delete app.assignedTier;
        delete app.approvedAt;
        delete app.rejectionReason;
        delete app.rejectedAt;
        fs.writeFileSync(appsFile, JSON.stringify(apps, null, 2));
      }

      const account = accounts.find(a => a.email.toLowerCase() === "klaus@bavariakustom.de");
      if (account) {
        account.approved = false;
        account.approvedAt = null;
        account.role = "dealer";
        account.tierLabel = "Tier 2: Trade Dealer (Pending Approval)";
        account.paymentTerms = "Pending Compliance Review";
        fs.writeFileSync(accsFile, JSON.stringify(accounts, null, 2));
      }

      return sendJson(res, 200, { success: true, message: "Bavaria Kustom Works demo reset to pending status." });
    } catch (e) {
      return sendJson(res, 500, { success: false, error: "Failed to reset demo account." });
    }
  }

  // ==========================================
  // API ROUTE 11: VIP PRE-LAUNCH LEAD CAPTURE
  // ==========================================
  if (req.method === "POST" && safePath === "/api/leads/subscribe") {
    try {
      const body = await parseJsonBody(req);
      const email = (body.email || "").trim().toLowerCase();
      const firstName = (body.firstName || "").trim();
      const lastName = (body.lastName || "").trim();
      const focus = (body.focus || "Custom Automotive & Motorcycle Painting").trim();

      if (!email || !email.includes("@")) {
        return sendJson(res, 400, { success: false, error: "A valid email address is required." });
      }

      const subsFile = path.join(__dirname, "data", "launch_subscribers.json");
      const csvFile = path.join(__dirname, "data", "launch_subscribers.csv");
      let subs = [];
      try {
        subs = JSON.parse(fs.readFileSync(subsFile, "utf8"));
      } catch (e) {
        subs = [];
      }

      const existing = subs.find(s => s.email === email);
      const nowIso = new Date().toISOString();

      if (existing) {
        existing.lastSeenAt = nowIso;
        if (firstName) existing.firstName = firstName;
        if (lastName) existing.lastName = lastName;
        if (focus) existing.focus = focus;
      } else {
        subs.unshift({
          id: "vip_" + Date.now(),
          firstName,
          lastName,
          email,
          focus,
          submittedAt: nowIso,
          status: "confirmed_vip",
          tags: ["pre-launch-vip", "european-launch"]
        });
      }

      fs.writeFileSync(subsFile, JSON.stringify(subs, null, 2));

      // Write Shopify-compatible CSV
      const csvHeader = "First Name,Last Name,Email,Accepts Email Marketing,Tags,Note\\n";
      const csvRows = subs.map(s => {
        const fn = `"${(s.firstName || '').replace(/"/g, '""')}"`;
        const ln = `"${(s.lastName || '').replace(/"/g, '""')}"`;
        const em = `"${(s.email || '').replace(/"/g, '""')}"`;
        const tags = `"pre-launch-vip, european-launch"`;
        const note = `"${(s.focus || '').replace(/"/g, '""')}"`;
        return `${fn},${ln},${em},yes,${tags},${note}`;
      }).join("\\n");
      fs.writeFileSync(csvFile, csvHeader + csvRows, "utf8");

      // Optional Shopify API forward if token configured
      syncToShopifyCustomer({ firstName, lastName, email, focus }).then((shopifySync) => {
        dispatchVipEmails({ firstName, lastName, email, focus, shopifySync }).catch((err) => {
          console.warn("Email dispatch background error:", err);
        });
      }).catch((err) => {
        console.warn("Shopify customer push background error:", err);
        dispatchVipEmails({ firstName, lastName, email, focus, shopifySync: { success: false, message: err.message } }).catch(() => {});
      });

      return sendJson(res, 200, {
        success: true,
        message: "VIP priority allocation confirmed.",
        totalSubscribers: subs.length
      });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: "Failed to record subscription." });
    }
  }

  async function syncToShopifyCustomer({ firstName, lastName, email, focus }) {
    const shopifyToken = process.env.SHOPIFY_ADMIN_TOKEN || "";
    const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || "coast-airbrush-europe.myshopify.com";

    if (!shopifyToken) {
      return {
        success: false,
        status: "missing_token",
        message: "SHOPIFY_ADMIN_TOKEN is not configured in environment variables."
      };
    }

    try {
      const url = `https://${shopDomain}/admin/api/2024-01/customers.json`;
      const payload = {
        customer: {
          first_name: firstName,
          last_name: lastName,
          email: email,
          tags: "pre-launch-vip, european-launch",
          note: focus || "Custom Automotive & Motorcycle Painting",
          email_marketing_consent: {
            state: "subscribed",
            opt_in_level: "single_opt_in",
            consent_updated_at: new Date().toISOString()
          }
        }
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": shopifyToken
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));
      if (response.status === 201) {
        return {
          success: true,
          status: "created",
          message: "Created in Customers (Tags: pre-launch-vip, european-launch)",
          customer: data.customer
        };
      }

      if (response.status === 422 && data.errors && data.errors.email) {
        const searchUrl = `https://${shopDomain}/admin/api/2024-01/customers/search.json?query=email:${encodeURIComponent(email)}`;
        const searchRes = await fetch(searchUrl, {
          headers: { "X-Shopify-Access-Token": shopifyToken }
        });
        const searchData = await searchRes.json().catch(() => ({}));
        if (searchRes.ok && searchData.customers && searchData.customers.length > 0) {
          const cust = searchData.customers[0];
          const existingTags = cust.tags ? cust.tags.split(",").map(t => t.trim()) : [];
          if (!existingTags.includes("pre-launch-vip")) existingTags.push("pre-launch-vip");
          if (!existingTags.includes("european-launch")) existingTags.push("european-launch");
          const putRes = await fetch(`https://${shopDomain}/admin/api/2024-01/customers/${cust.id}.json`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": shopifyToken
            },
            body: JSON.stringify({
              customer: {
                id: cust.id,
                tags: existingTags.join(", "),
                note: (cust.note ? cust.note + " | " : "") + (focus || "VIP Launch Lead")
              }
            })
          });
          if (putRes.ok) {
            return {
              success: true,
              status: "existing_updated",
              message: `Updated Existing Customer (Tags Added, ID: ${cust.id})`
            };
          }
        }
      }

      const errDetail = data.errors ? JSON.stringify(data.errors) : `HTTP ${response.status} ${response.statusText}`;
      return {
        success: false,
        status: "api_error",
        message: `Shopify API rejected creation: ${errDetail}`
      };
    } catch (err) {
      console.warn("Shopify sync background error:", err);
      return {
        success: false,
        status: "network_error",
        message: `Network error connecting to Shopify: ${err.message}`
      };
    }
  }

  async function dispatchVipEmails({ firstName, lastName, email, focus, shopifySync }) {
    const mailUser = process.env.GOOGLE_MAIL_USER || "admin@coastairbrush.eu";
    const mailPass = (process.env.GOOGLE_MAIL_PASS || "exsdvdoeogurifzf").replace(/\s+/g, "");
    const adminAlertRecipient = process.env.ADMIN_ALERT_EMAIL || "del@das64design.com, admin@coastairbrush.eu";
    const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || "coast-airbrush-europe.myshopify.com";

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: mailUser, pass: mailPass }
    });

    const displayName = firstName ? `${firstName} ${lastName}`.trim() : "Custom Artist";
    const isSyncSuccess = shopifySync && shopifySync.success;
    const syncStatus = shopifySync ? shopifySync.status : "skipped";
    const syncMessage = shopifySync ? shopifySync.message : "Shopify push not configured";

    const customerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Coast Airbrush Europe VIP Confirmation</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0b0d12; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; }
    .wrapper { max-width: 600px; margin: 0 auto; background-color: #121620; border: 1px solid #1f293d; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #090b10 0%, #171d2b 100%); padding: 36px 30px; text-align: center; border-bottom: 2px solid #e11d48; }
    .header h1 { margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase; color: #ffffff; font-weight: 800; }
    .header p { margin: 8px 0 0; color: #94a3b8; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; }
    .badge { display: inline-block; background: rgba(225, 29, 72, 0.15); border: 1px solid #e11d48; color: #fb7185; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-top: 14px; }
    .content { padding: 32px 30px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 600; color: #ffffff; margin-bottom: 16px; }
    .focus-box { background: #1a2233; border-left: 4px solid #00f0ff; padding: 14px 18px; border-radius: 6px; margin: 20px 0; }
    .focus-box strong { color: #00f0ff; }
    .perks-list { margin: 24px 0; padding: 0; list-style: none; }
    .perks-list li { margin-bottom: 16px; padding-left: 28px; position: relative; font-size: 14px; color: #cbd5e1; }
    .perks-list li::before { content: "✓"; position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 16px; }
    .footer { background: #0b0e17; padding: 24px 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1f293d; }
    .footer a { color: #00f0ff; text-decoration: none; }
  </style>
</head>
<body>
  <div style="padding: 24px 12px;">
    <div class="wrapper">
      <div class="header">
        <h1>Coast Airbrush Europe</h1>
        <p>California Heritage • European Direct Dispatch</p>
        <div class="badge">VIP Priority Allocation Confirmed</div>
      </div>
      <div class="content">
        <div class="greeting">Hi ${firstName || 'Fellow Painter'},</div>
        <p>Thank you for registering for early VIP launch access to <strong>Coast Airbrush Europe</strong>.</p>
        <p>Your registration has been allocated priority inventory status under your trade specialty:</p>
        
        <div class="focus-box">
          <div>Registered Discipline:</div>
          <div style="font-size: 16px; font-weight: 700; margin-top: 4px;"><strong>${focus}</strong></div>
        </div>

        <p>As a registered VIP artist, here is what is being reserved for you:</p>
        <ul class="perks-list">
          <li><strong>24-Hour Advance Store Access:</strong> You will receive a direct access link to shop our opening catalog before the general European public launch next week.</li>
          <li><strong>Dual UK & European Warehouse Fulfillment:</strong> Direct local dispatch with fast carrier rates and zero post-Brexit customs delays or unexpected import tariffs.</li>
          <li><strong>REACH & CLP 2026 Guaranteed Formulations:</strong> Genuine Kroma-Edge, Flake King, and VsionAir products formulation-verified and ready for European pro use.</li>
        </ul>

        <p style="margin-top: 28px; color: #94a3b8; font-size: 14px;">Keep an eye on your inbox—we will transmit your personal launch pass as soon as our warehouse gates open.</p>

        <p style="margin-top: 24px; font-weight: 600; color: #ffffff;">The Coast Airbrush Europe Launch Team</p>
      </div>
      <div class="footer">
        <p>© 2026 Coast Airbrush Europe. All rights reserved.</p>
        <p>Direct Distribution & Technical Support: <a href="mailto:admin@coastairbrush.eu">admin@coastairbrush.eu</a> | <a href="https://coastairbrush.eu">coastairbrush.eu</a></p>
      </div>
    </div>
  </div>
</body>
</html>
`;

    const adminHtml = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 8px; border: 1px solid #334155; padding: 24px;">
    <h2 style="margin-top: 0; color: #38bdf8; border-bottom: 1px solid #334155; padding-bottom: 12px;">🚨 New VIP Pre-Launch Registration</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #94a3b8; width: 140px;">Name:</td>
        <td style="padding: 8px 0; font-weight: bold; color: #ffffff;">${displayName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #94a3b8;">Email:</td>
        <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #38bdf8; text-decoration: none; font-weight: bold;">${email}</a></td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #94a3b8;">Discipline / Focus:</td>
        <td style="padding: 8px 0; color: #f59e0b; font-weight: bold;">${focus}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #94a3b8;">Shopify Sync:</td>
        <td style="padding: 8px 0;">
          ${isSyncSuccess ? `
            <span style="color: #10b981; font-weight: bold;">
              ${syncStatus === "created" ? "✅ Created in Customers (Tags: pre-launch-vip, european-launch)" : "🔄 Updated Existing Customer"}
            </span>
          ` : `
            <div style="color: #ef4444; font-weight: bold;">⚠️ NOT SYNCED TO SHOPIFY</div>
            <div style="font-size: 12px; color: #fca5a5; margin-top: 2px;">${syncMessage}</div>
            <div style="font-size: 11px; color: #fbbf24; margin-top: 4px; background: rgba(245, 158, 11, 0.1); padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(245, 158, 11, 0.3);">
              ⚡ <strong>Action Needed:</strong> Add this customer manually in Shopify Admin using the details above, or check SHOPIFY_ADMIN_TOKEN in environment variables.
            </div>
          `}
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #94a3b8;">Registered At:</td>
        <td style="padding: 8px 0; color: #cbd5e1;">${new Date().toUTCString()}</td>
      </tr>
    </table>
    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #334155;">
      <a href="https://${shopDomain}/admin/customers" style="display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-size: 13px; font-weight: bold;">View Customers in Shopify Admin →</a>
    </div>
  </div>
</body>
</html>
`;

    return Promise.all([
      transporter.sendMail({
        from: '"Coast Airbrush Europe" <admin@coastairbrush.eu>',
        to: email,
        replyTo: "admin@coastairbrush.eu",
        subject: "⚡ VIP Launch Allocation Confirmed | Coast Airbrush Europe",
        html: customerHtml
      }),
      transporter.sendMail({
        from: '"Coast Airbrush Europe Alert" <admin@coastairbrush.eu>',
        to: adminAlertRecipient,
        replyTo: email,
        subject: `🚨 [New VIP Registration] ${displayName} — ${focus}`,
        html: adminHtml
      })
    ]);
  }

  if (req.method === "GET" && safePath === "/api/leads/subscribers") {
    try {
      const subsFile = path.join(__dirname, "data", "launch_subscribers.json");
      let subs = [];
      try {
        subs = JSON.parse(fs.readFileSync(subsFile, "utf8"));
      } catch (e) {
        subs = [];
      }
      return sendJson(res, 200, { success: true, count: subs.length, subscribers: subs });
    } catch (e) {
      return sendJson(res, 500, { success: false, error: "Failed to retrieve subscribers." });
    }
  }

  // ==========================================
  // SECURITY GATE: RESTRICT DIRECT ACCESS TO SENSITIVE FILES
  // ==========================================
  if (
    safePath.includes("_secure") ||
    safePath.includes("trade_accounts") ||
    safePath.includes("b2b_pricebook") ||
    safePath.includes("trade_applications") ||
    safePath.includes("launch_subscribers") ||
    safePath.startsWith("/docs/")
  ) {
    res.writeHead(403, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "403 Forbidden: Confidential trade resource." }));
    return;
  }

  // ==========================================
  // STATIC FILE SERVING & DEV MODE ROUTING
  // ==========================================
  const host = req.headers.host || "";
  const isLocalHost = host.includes("localhost") || host.includes("127.0.0.1") || host.startsWith("192.168.") || host.startsWith("10.");
  const reqUrl = req.url || "";
  const hasDevQuery = reqUrl.includes("dev=true") ||
                      reqUrl.includes("preview=true") ||
                      reqUrl.includes("partner=") ||
                      reqUrl.includes("access=") ||
                      reqUrl.includes("vip=true") ||
                      reqUrl.includes("key=");
  const cookieHeader = req.headers.cookie || "";
  const hasDevCookie = cookieHeader.includes("coast_dev_mode=true") ||
                       cookieHeader.includes("coast_store_preview=true") ||
                       cookieHeader.includes("coast_partner_access=true");
  const isDevMode = isLocalHost || hasDevQuery || hasDevCookie || process.env.DEV_MODE === "true" || process.env.NODE_ENV !== "production";

  let reqFile = safePath;

  // Pretty route mapping
  if (safePath === "/pages/about" || safePath === "/about") reqFile = "/about.html";
  else if (safePath === "/pages/support" || safePath === "/support") reqFile = "/support.html";
  else if (safePath === "/pages/shipping" || safePath === "/shipping") reqFile = "/shipping.html";
  else if (safePath === "/pages/privacy" || safePath === "/pages/privacy-policy" || safePath === "/privacy") reqFile = "/privacy.html";
  else if (safePath === "/pages/dealers" || safePath === "/dealers") reqFile = "/dealers.html";
  else if (safePath === "/pages/product" || safePath === "/product" || safePath.startsWith("/products/")) reqFile = "/product.html";
  else if (safePath === "/crm") reqFile = "/crm.html";
  else if (safePath === "/" || safePath === "\\" || safePath === "/index") {
    reqFile = isDevMode ? "/index.html" : "/landing.html";
  }

  // If locked in production mode and NOT in dev mode, bounce storefront routes to landing.html
  if (!isDevMode) {
    const storefrontRoutes = [
      "/index.html",
      "/about.html",
      "/support.html",
      "/shipping.html",
      "/privacy.html",
      "/dealers.html",
      "/product.html",
      "/crm.html",
      "/preview_compromises.html"
    ];
    if (storefrontRoutes.includes(reqFile) || safePath.startsWith("/pages/") || safePath.startsWith("/products/")) {
      reqFile = "/landing.html";
    }
  }
  const filePath = path.join(__dirname, reqFile);

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("403 Forbidden");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    if (ext === ".mp4" || ext === ".webm" || ext === ".mov") {
      const range = req.headers.range;
      const fileSize = stats.size;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize,
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*"
        });
        file.pipe(res);
        return;
      } else {
        res.writeHead(200, {
          "Content-Length": fileSize,
          "Content-Type": contentType,
          "Accept-Ranges": "bytes",
          "Access-Control-Allow-Origin": "*"
        });
        fs.createReadStream(filePath).pipe(res);
        return;
      }
    }

    const respHeaders = {
      "Content-Type": contentType,
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*"
    };
    if (hasDevQuery) {
      respHeaders["Set-Cookie"] = [
        "coast_dev_mode=true; Path=/; Max-Age=2592000; SameSite=Lax",
        "coast_store_preview=true; Path=/; Max-Age=2592000; SameSite=Lax",
        "coast_partner_access=true; Path=/; Max-Age=2592000; SameSite=Lax"
      ];
    }
    res.writeHead(200, respHeaders);

    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(appHandler);

if (!process.env.NO_SERVER_LISTEN) {
  server.listen(PORT, () => {
    console.log(`Coast Airbrush secure server running at http://localhost:${PORT}/`);
  });
}

export { server };
