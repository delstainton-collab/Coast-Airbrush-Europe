import { db } from "../freight-bridge/core/db.js";
import { encryptCredentials } from "../freight-bridge/core/crypto.js";

/**
 * CLI Utility to activate live carrier credentials in the Freight Bridge
 * Usage:
 *   node scripts/activate_carrier.js <carrierId> <accountNumber> <apiKey> [secret] [endpoint]
 * 
 * Example:
 *   node scripts/activate_carrier.js mainfreight-eu MF-ROT-7491-NL live_key_99482 live_secret_123 https://api.mainfreight.com/v1/freight
 */

const [,, carrierId, accountNumber, apiKey, secret, endpoint] = process.argv;

if (!carrierId || !accountNumber || !apiKey) {
  console.log(`
Usage:
  node scripts/activate_carrier.js <carrierId> <accountNumber> <apiKey> [secret] [endpoint]

Supported Carrier IDs:
  - mainfreight-eu
  - mock-ltl

Example:
  node scripts/activate_carrier.js mainfreight-eu MF-ROT-7491-NL live_key_99482 live_secret_123 https://api.mainfreight.com/v1/freight
`);
  process.exit(1);
}

db.init();
const tenantId = "coast-airbrush-europe";
const id = `acc_${tenantId}_${carrierId}`;

const credentials = {
  apiKey,
  secret: secret || "",
  endpoint: endpoint || ""
};

const accountRecord = {
  id,
  tenantId,
  carrierId,
  name: carrierId === "mainfreight-eu" ? "Mainfreight Europe B.V. (Production)" : `${carrierId} (Live)`,
  accountNumber,
  credentialsEncrypted: encryptCredentials(credentials),
  isSandbox: false, // Live production mode
  isActive: true,
  updatedAt: new Date().toISOString()
};

db.saveCarrierAccount(accountRecord);

console.log("==================================================");
console.log(`✔ Carrier "${carrierId}" successfully activated!`);
console.log(`  Account Number: ${accountNumber}`);
console.log(`  Status: ACTIVE (Production Mode, isSandbox=false)`);
console.log(`  Credentials: Encrypted with AES-256-GCM`);
console.log("==================================================");
