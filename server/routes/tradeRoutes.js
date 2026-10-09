import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { activeSessions, getAccounts, getPricebook, parseJsonBody, sendJson } from "../dataStore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

// In-memory rate limiting tracker for partner passcode attempts: ip -> { count, resetAt, lockedUntil }
const partnerAttemptTracker = new Map();
const MAX_PARTNER_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const WINDOW_MS = 15 * 60 * 1000;

export const AUTHORIZED_PARTNER_PASSCODES = [
  "COAST2026",
  "COASTVIP",
  "PARTNER",
  "PARTNER2026",
  "PREVIEW",
  "DEV",
  "KROMAEDGE"
];

function verifyPartnerPasscodeTimingSafe(inputPasscode) {
  const normalized = (inputPasscode || "").trim().toUpperCase();
  if (!normalized) return false;
  const inputHash = crypto.createHash("sha256").update(normalized).digest();

  const allowedCodes = process.env.PARTNER_PASSCODES
    ? process.env.PARTNER_PASSCODES.split(",").map(c => c.trim().toUpperCase())
    : AUTHORIZED_PARTNER_PASSCODES;

  let matched = false;
  for (const validCode of allowedCodes) {
    const validHash = crypto.createHash("sha256").update(validCode).digest();
    if (crypto.timingSafeEqual(inputHash, validHash)) {
      matched = true;
    }
  }
  return matched;
}

export function resetPartnerRateLimitingForTesting() {
  partnerAttemptTracker.clear();
}

export async function handleTradeRoutes(req, res, safePath) {
  // 0. SECURE PARTNER PASSCODE VERIFICATION (PRE-LAUNCH GATE)
  if (req.method === "POST" && (safePath === "/api/auth/partner-verify" || safePath === "/api/partner/verify")) {
    const clientIp = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "local";
    const now = Date.now();
    let record = partnerAttemptTracker.get(clientIp);
    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + WINDOW_MS, lockedUntil: 0 };
      partnerAttemptTracker.set(clientIp, record);
    }

    if (record.lockedUntil > now) {
      const waitMinutes = Math.ceil((record.lockedUntil - now) / 60000);
      sendJson(res, 429, {
        success: false,
        error: `Too many failed attempts. Access temporarily locked for ${waitMinutes} minute(s).`
      });
      return true;
    }

    try {
      const body = await parseJsonBody(req);
      const passcode = body ? body.passcode : "";
      const isMatch = verifyPartnerPasscodeTimingSafe(passcode);

      if (isMatch) {
        partnerAttemptTracker.delete(clientIp);
        res.setHeader("Set-Cookie", [
          "coast_partner_access=true; Path=/; Max-Age=2592000; SameSite=Lax",
          "coast_store_preview=true; Path=/; Max-Age=2592000; SameSite=Lax"
        ]);
        sendJson(res, 200, {
          success: true,
          redirect: "/index.html?preview=true"
        });
        return true;
      } else {
        record.count += 1;
        if (record.count >= MAX_PARTNER_ATTEMPTS) {
          record.lockedUntil = now + LOCKOUT_MS;
          sendJson(res, 429, {
            success: false,
            error: "Too many failed attempts. Access temporarily locked for 15 minutes."
          });
        } else {
          const remaining = MAX_PARTNER_ATTEMPTS - record.count;
          sendJson(res, 401, {
            success: false,
            error: `Invalid access passcode. ${remaining} attempt(s) remaining before temporary lockout. Please contact your Coast Airbrush account manager.`
          });
        }
        return true;
      }
    } catch (e) {
      sendJson(res, 400, { success: false, error: "Invalid request payload" });
      return true;
    }
  }
  // 1. B2B TRADE LOGIN
  if (req.method === "POST" && safePath === "/api/auth/trade-login") {
    try {
      const { email, password } = await parseJsonBody(req);
      const accounts = getAccounts();
      const user = accounts.find(
        a => a.email.toLowerCase() === (email || "").trim().toLowerCase() && a.password === password
      );

      if (!user) {
        sendJson(res, 401, {
          success: false,
          error: "Invalid trade credentials. Please contact your account manager or submit an application."
        });
        return true;
      }

      if (!user.approved) {
        sendJson(res, 403, {
          success: false,
          error: `Application Pending Approval: Your commercial account for "${user.company}" is currently awaiting manual compliance verification. Our trade desk must review your VAT/business credentials before wholesale pricing can be accessed.`
        });
        return true;
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

      sendJson(res, 200, {
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
      return true;
    } catch (e) {
      sendJson(res, 400, { success: false, error: "Invalid request payload" });
      return true;
    }
  }

  // 2. GET TIER-SPECIFIC PRICING
  if (req.method === "GET" && safePath === "/api/trade/pricing") {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const session = activeSessions.get(token);

    if (!session) {
      sendJson(res, 401, {
        success: false,
        error: "Unauthorized. Trade pricing is restricted exclusively to authenticated commercial partners."
      });
      return true;
    }

    const pricebook = getPricebook();
    if (!pricebook) {
      sendJson(res, 500, { success: false, error: "Pricebook service unavailable" });
      return true;
    }

    const role = session.role;
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

    sendJson(res, 200, {
      success: true,
      role: session.role,
      tierLabel: session.tierLabel,
      company: session.company,
      defaultMultiplier: session.discountMultiplier,
      skuPricing: sanitizedPricing
    });
    return true;
  }

  // 3. TRADE APPLICATION INTAKE
  if (req.method === "POST" && safePath === "/api/trade/apply") {
    try {
      const appData = await parseJsonBody(req);
      if (!appData.company || !appData.email) {
        sendJson(res, 400, { success: false, error: "Company name and contact email are required." });
        return true;
      }

      const appsFile = path.join(rootDir, "data", "trade_applications.json");
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

      sendJson(res, 200, {
        success: true,
        message: "Your application has been received. Our trade team will verify your business credentials within 24 hours.",
        applicationId: newApp.id
      });
      return true;
    } catch (e) {
      sendJson(res, 400, { success: false, error: "Failed to process application." });
      return true;
    }
  }

  // 4. CHECK SESSION VALIDITY
  if (req.method === "GET" && safePath === "/api/auth/trade-session") {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const session = activeSessions.get(token);

    if (!session) {
      sendJson(res, 401, { success: false, error: "No active trade session" });
      return true;
    }

    sendJson(res, 200, { success: true, user: session });
    return true;
  }

  // 5. TRADE LOGOUT
  if (req.method === "POST" && safePath === "/api/auth/trade-logout") {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (token) activeSessions.delete(token);
    sendJson(res, 200, { success: true, message: "Logged out successfully" });
    return true;
  }

  // 6. PLACE ORDER ON CREDIT ACCOUNT
  if (req.method === "POST" && safePath === "/api/trade/place-account-order") {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const session = activeSessions.get(token);

    if (!session) {
      sendJson(res, 401, {
        success: false,
        error: "Unauthorized: Active commercial trade session required to place orders on account."
      });
      return true;
    }

    try {
      const payload = await parseJsonBody(req);
      const items = Array.isArray(payload.items) ? payload.items : [];
      const poNumber = (payload.poNumber || "").trim();
      const notes = (payload.notes || "").trim();
      const currency = (payload.currency || session.currency || "GBP").toUpperCase();
      const isGbp = currency === "GBP";

      if (items.length === 0) {
        sendJson(res, 400, { success: false, error: "Cart is empty. Please add items to place a trade order." });
        return true;
      }

      if (!poNumber) {
        sendJson(res, 400, { success: false, error: "An Internal Purchase Order (PO) Number is mandatory for billing on credit accounts." });
        return true;
      }

      const computedSubtotal = items.reduce((sum, item) => {
        const itemPrice = isGbp
          ? (item.priceGbp ?? item.unitPrice ?? item.price ?? (item.priceEur ? item.priceEur * 0.85 : 0))
          : (item.priceEur ?? item.unitPrice ?? item.price ?? (item.priceGbp ? item.priceGbp / 0.85 : 0));
        return sum + (Number(itemPrice || 0) * Number(item.quantity || 1));
      }, 0);
      const verifiedSubtotal = computedSubtotal > 0 ? computedSubtotal : Number(payload.subtotal || 0);

      const role = session.role;
      let movThreshold = 0;
      if (role === "dealer") {
        movThreshold = isGbp ? 500.0 : 550.0;
        if (!Number.isFinite(verifiedSubtotal) || verifiedSubtotal < movThreshold) {
          sendJson(res, 400, {
            success: false,
            error: `Minimum Order Value not reached. Authorized Dealers require a minimum spend of ${isGbp ? '£500.00' : '€550.00'} ex-VAT. Current subtotal: ${isGbp ? '£' : '€'}${verifiedSubtotal.toFixed(2)}.`
          });
          return true;
        }
      } else if (role === "distributor") {
        movThreshold = isGbp ? 2000.0 : 2500.0;
        if (!Number.isFinite(verifiedSubtotal) || verifiedSubtotal < movThreshold) {
          sendJson(res, 400, {
            success: false,
            error: `Minimum Order Value not reached. Master Distributors require a minimum spend of ${isGbp ? '£2,000.00' : '€2,500.00'} ex-VAT. Current subtotal: ${isGbp ? '£' : '€'}${verifiedSubtotal.toFixed(2)}.`
          });
          return true;
        }
      }

      const now = new Date();
      const termsDays = session.paymentTerms && session.paymentTerms.includes("60") ? 60 : 30;
      const dueDate = new Date(now.getTime() + termsDays * 24 * 60 * 60 * 1000);

      const isUK = session.country && (session.country.toLowerCase().includes("united kingdom") || session.country.toLowerCase() === "uk");
      const vatRate = isUK ? 0.20 : 0.0;
      const vatAmount = verifiedSubtotal * vatRate;
      const shippingAmount = 0.0;
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

      const ordersFile = path.join(rootDir, "data", "trade_orders.json");
      let allOrders = [];
      try {
        allOrders = JSON.parse(fs.readFileSync(ordersFile, "utf8"));
      } catch (e) {
        allOrders = [];
      }
      allOrders.unshift(orderRecord);
      fs.writeFileSync(ordersFile, JSON.stringify(allOrders, null, 2));

      sendJson(res, 201, {
        success: true,
        message: `Order ${orderRecord.orderId} successfully placed on your commercial account under terms: ${orderRecord.paymentTerms}.`,
        order: orderRecord
      });
      return true;
    } catch (err) {
      console.error("Failed to place account order:", err);
      sendJson(res, 500, { success: false, error: "Failed to process commercial purchase order: " + err.message });
      return true;
    }
  }

  return false;
}
