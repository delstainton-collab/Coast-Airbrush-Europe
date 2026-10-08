import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../..");

export const config = {
  // Service configuration
  port: parseInt(process.env.FREIGHT_BRIDGE_PORT || process.env.PORT || "3015", 10),
  host: process.env.FREIGHT_BRIDGE_HOST || "0.0.0.0",
  env: process.env.NODE_ENV || "development",

  // Master key for AES-256-GCM tenant credential encryption (32 bytes hex)
  encryptionKeyHex:
    process.env.FREIGHT_ENCRYPTION_KEY ||
    "c8a7b9e4d1f23568901234567890abcdef1234567890abcdef1234567890abcd",

  // Default Tenant: Coast Airbrush Europe
  defaultTenantId: "coast-airbrush-europe",

  // Storage path for SQLite/JSON multi-tenant persistent data
  dbFilePath: path.join(ROOT_DIR, "data", "freight_bridge_db.json"),

  // Document storage for Bills of Lading and pallet labels
  bolStorageDir: path.join(ROOT_DIR, "data", "bol_documents"),

  // Shopify timeout budget for CarrierService rates is 10s; our SLA is < 3s
  rateTimeoutMs: 2500,

  // Shopify webhook HMAC secret fallback for dev/sandbox verification
  shopifyWebhookSecret:
    process.env.SHOPIFY_WEBHOOK_SECRET || "cae_sandbox_secret_9948210375"
};
