import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

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

export function handleStaticRoutes(req, res, safePath) {
  // 1. SECURITY GATE: RESTRICT SENSITIVE FILES
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

  // 2. DEV MODE & PARTNER BACKDOOR GATE
  const host = req.headers.host || "";
  const isLocalHost = host.includes("localhost") || host.includes("127.0.0.1") || host.startsWith("192.168.") || host.startsWith("10.");
  const reqUrl = req.url || "";
  const hasDevQuery = reqUrl.includes("dev=true") ||
                      reqUrl.includes("preview=true") ||
                      reqUrl.includes("partner=") ||
                      reqUrl.includes("access=") ||
                      reqUrl.includes("vip=true") ||
                      reqUrl.includes("key=") ||
                      reqUrl.includes("preview_theme_id") ||
                      reqUrl.includes("preview_token") ||
                      reqUrl.includes("_bt");
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

  const filePath = path.join(rootDir, reqFile);

  if (!filePath.startsWith(rootDir)) {
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
