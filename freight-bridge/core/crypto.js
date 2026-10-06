import crypto from "crypto";
import { config } from "./config.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits recommended for GCM

function getMasterKeyBuffer() {
  const hex = config.encryptionKeyHex;
  const buf = Buffer.from(hex, "hex");
  if (buf.length !== 32) {
    // Fallback sha256 to ensure exact 32 bytes
    return crypto.createHash("sha256").update(hex).digest();
  }
  return buf;
}

/**
 * Encrypt sensitive credentials (e.g. carrier API keys) using AES-256-GCM
 */
export function encryptCredentials(plainData) {
  const plainText = typeof plainData === "string" ? plainData : JSON.stringify(plainData);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getMasterKeyBuffer(), iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypt credentials previously encrypted with encryptCredentials
 */
export function decryptCredentials(encryptedString) {
  if (!encryptedString || typeof encryptedString !== "string") {
    return null;
  }

  const parts = encryptedString.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format; expected iv:authTag:ciphertext");
  }

  const [ivHex, authTagHex, cipherText] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, getMasterKeyBuffer(), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted;
  }
}

/**
 * Verify Shopify Webhook HMAC-SHA256 signature
 */
export function verifyShopifyHmac(rawBody, headerHmac, secretKey = config.shopifyWebhookSecret) {
  if (!rawBody || !headerHmac) {
    return false;
  }

  try {
    const generatedHmac = crypto
      .createHmac("sha256", secretKey)
      .update(rawBody, "utf8")
      .digest("base64");

    const a = Buffer.from(generatedHmac, "utf8");
    const b = Buffer.from(headerHmac, "utf8");

    if (a.length !== b.length) {
      return false;
    }

    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Generate unique PRO / Tracking Number
 */
export function generateProNumber(prefix = "CAE-LTL") {
  const year = new Date().getFullYear().toString().slice(-2);
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${year}-${rand}`;
}
