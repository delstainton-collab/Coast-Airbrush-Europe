import crypto from "crypto";

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  const clientIp = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "local";
  const now = Date.now();
  let record = partnerAttemptTracker.get(clientIp);
  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + WINDOW_MS, lockedUntil: 0 };
    partnerAttemptTracker.set(clientIp, record);
  }

  if (record.lockedUntil > now) {
    const waitMinutes = Math.ceil((record.lockedUntil - now) / 60000);
    return res.status(429).json({
      success: false,
      error: `Too many failed attempts. Access temporarily locked for ${waitMinutes} minute(s).`
    });
  }

  const body = req.body || {};
  const passcode = typeof body === "string" ? JSON.parse(body).passcode : body.passcode;
  const isMatch = verifyPartnerPasscodeTimingSafe(passcode);

  if (isMatch) {
    partnerAttemptTracker.delete(clientIp);
    res.setHeader("Set-Cookie", [
      "coast_partner_access=true; Path=/; Max-Age=2592000; SameSite=Lax",
      "coast_store_preview=true; Path=/; Max-Age=2592000; SameSite=Lax"
    ]);
    return res.status(200).json({
      success: true,
      redirect: "/index.html?preview=true"
    });
  } else {
    record.count += 1;
    if (record.count >= MAX_PARTNER_ATTEMPTS) {
      record.lockedUntil = now + LOCKOUT_MS;
      return res.status(429).json({
        success: false,
        error: "Too many failed attempts. Access temporarily locked for 15 minutes."
      });
    } else {
      const remaining = MAX_PARTNER_ATTEMPTS - record.count;
      return res.status(401).json({
        success: false,
        error: `Invalid access passcode. ${remaining} attempt(s) remaining before temporary lockout. Please contact your Coast Airbrush account manager.`
      });
    }
  }
}
