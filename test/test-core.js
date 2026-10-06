import assert from "assert";
import { encryptCredentials, decryptCredentials, verifyShopifyHmac, generateProNumber } from "../freight-bridge/core/crypto.js";
import { db } from "../freight-bridge/core/db.js";
import { config } from "../freight-bridge/core/config.js";

console.log("=== Testing Freight Bridge Core ===");

// 1. Test AES-256-GCM
const secretPayload = {
  apiKey: "mainfreight_api_key_xyz",
  accountNum: "NL-88392",
  secret: "super_secret_token_123"
};

const encrypted = encryptCredentials(secretPayload);
assert(typeof encrypted === "string" && encrypted.split(":").length === 3, "Encrypted output must be iv:authTag:cipher");
const decrypted = decryptCredentials(encrypted);
assert.deepStrictEqual(decrypted, secretPayload, "Decrypted credentials must match original");
console.log("✔ AES-256-GCM encryption/decryption passed");

// 2. Test Shopify HMAC Verification
import crypto from "crypto";
const testBody = JSON.stringify({ id: 1001, email: "painter@customgarage.de" });
const testSecret = "my_shopify_secret_123";
const validHmac = crypto.createHmac("sha256", testSecret).update(testBody, "utf8").digest("base64");

assert(verifyShopifyHmac(testBody, validHmac, testSecret), "Valid HMAC should pass verification");
assert(!verifyShopifyHmac(testBody, "invalid_hmac_signature", testSecret), "Invalid HMAC must fail verification");
assert(!verifyShopifyHmac(testBody + "tampered", validHmac, testSecret), "Tampered body must fail verification");
console.log("✔ Shopify HMAC verification passed");

// 3. Test PRO Number Generation
const pro = generateProNumber("TEST-LTL");
assert(pro.startsWith("TEST-LTL-"), "PRO number should start with prefix");
console.log(`✔ PRO Number Generation: ${pro}`);

// 4. Test Multi-tenant DB
db.init();
const defaultTenant = db.getTenant(config.defaultTenantId);
assert(defaultTenant, "Default tenant must exist");
assert.strictEqual(defaultTenant.tenantId, "coast-airbrush-europe");

const accounts = db.getCarrierAccounts("coast-airbrush-europe");
assert(accounts.length >= 2, "Must have seeded carrier accounts for Coast Airbrush Europe");

const mockAcc = accounts.find(a => a.carrierId === "mock-ltl");
assert(mockAcc, "Mock LTL carrier account must exist");
const decryptedAccCreds = decryptCredentials(mockAcc.credentialsEncrypted);
assert.strictEqual(decryptedAccCreds.apiKey, "mock_test_key_8829", "Encrypted carrier credentials must decrypt cleanly");
console.log("✔ Multi-tenant database initialization & credential decryption passed");

console.log("All core tests passed successfully! 🎉");
