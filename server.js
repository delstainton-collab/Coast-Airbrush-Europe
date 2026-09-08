import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

const server = http.createServer(async (req, res) => {
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
          paymentTerms: user.paymentTerms
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
          sku: "HOK-KK01-QT",
          name: "House of Kolor Kandy Apple Red + RU311 Reducer Pack",
          priceUSD: 85.00,
          priceEUR: 79.00,
          priceGBP: 68.00,
          dispatchHub: "ADR LQ Hazmat Ground Freight Certified",
          videoUrl: "/assets/videos/hok-candy-mixing-tips.mp4"
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
  // SECURITY GATE: RESTRICT DIRECT ACCESS TO SENSITIVE FILES
  // ==========================================
  if (
    safePath.includes("_secure") ||
    safePath.includes("trade_accounts") ||
    safePath.includes("b2b_pricebook") ||
    safePath.includes("trade_applications") ||
    safePath.startsWith("/docs/")
  ) {
    res.writeHead(403, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "403 Forbidden: Confidential trade resource." }));
    return;
  }

  // ==========================================
  // STATIC FILE SERVING
  // ==========================================
  let reqFile = safePath === "/" || safePath === "\\" ? "/index.html" : safePath;
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

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*"
    });

    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Coast Airbrush secure server running at http://localhost:${PORT}/`);
});
