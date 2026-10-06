import { db } from "../core/db.js";
import { encryptCredentials } from "../core/crypto.js";

export function handleListTenants() {
  return db.listTenants();
}

export function handleGetTenantRules(tenantId) {
  return db.getShippingRules(tenantId);
}

export function handleUpdateTenantRules(tenantId, rulesUpdate) {
  const current = db.getShippingRules(tenantId);
  const merged = { ...current, ...rulesUpdate };
  return db.saveShippingRules(tenantId, merged);
}

export function handleListCarrierAccounts(tenantId) {
  const accounts = db.getCarrierAccounts(tenantId);
  // Redact credentials in response
  return accounts.map(acc => ({
    id: acc.id,
    tenantId: acc.tenantId,
    carrierId: acc.carrierId,
    name: acc.name,
    accountNumber: acc.accountNumber,
    isSandbox: acc.isSandbox,
    isActive: acc.isActive,
    hasCredentials: Boolean(acc.credentialsEncrypted),
    createdAt: acc.createdAt,
    updatedAt: acc.updatedAt
  }));
}

export function handleSaveCarrierAccount(tenantId, accountData) {
  const id = accountData.id || `acc_${tenantId}_${accountData.carrierId}_${Date.now()}`;
  let credentialsEncrypted = accountData.credentialsEncrypted;

  // If plain credentials provided in request, encrypt with AES-256-GCM
  if (accountData.credentials && typeof accountData.credentials === "object") {
    credentialsEncrypted = encryptCredentials(accountData.credentials);
  }

  const account = {
    id,
    tenantId,
    carrierId: accountData.carrierId,
    name: accountData.name || accountData.carrierId,
    accountNumber: accountData.accountNumber || "N/A",
    credentialsEncrypted: credentialsEncrypted || "",
    isSandbox: accountData.isSandbox !== false,
    isActive: accountData.isActive !== false
  };

  return db.saveCarrierAccount(account);
}
