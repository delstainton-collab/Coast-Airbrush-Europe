import fs from "fs";
import path from "path";
import { config } from "./config.js";
import { encryptCredentials } from "./crypto.js";
import { DEFAULT_COAST_SHIPPING_RULES } from "./types.js";

class FreightBridgeDB {
  constructor() {
    this.filePath = config.dbFilePath;
    this.data = {
      stores: {},
      carrier_accounts: {},
      shipping_rules: {},
      shipments: {},
      jobs: {}
    };
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;

    // Ensure parent dir
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, "utf8");
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error("[FreightBridgeDB] Failed to load DB file, reinitializing fresh:", err.message);
      }
    } else {
      this.seedDefaultTenant();
      this.flush();
    }

    // Ensure default tenant exists
    if (!this.data.stores[config.defaultTenantId]) {
      this.seedDefaultTenant();
      this.flush();
    }

    this.initialized = true;
  }

  seedDefaultTenant() {
    const tenantId = config.defaultTenantId;
    const now = new Date().toISOString();

    this.data.stores[tenantId] = {
      tenantId,
      name: "Coast Airbrush Europe",
      shopDomain: "coast-airbrush-europe.myshopify.com",
      currency: "EUR",
      defaultOrigin: DEFAULT_COAST_SHIPPING_RULES.defaultOrigin,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    this.data.shipping_rules[tenantId] = {
      tenantId,
      ...DEFAULT_COAST_SHIPPING_RULES,
      createdAt: now,
      updatedAt: now
    };

    // Seed Mock LTL Carrier and Mainfreight Europe Sandbox
    const mockCarrierId = `acc_${tenantId}_mock_ltl`;
    this.data.carrier_accounts[mockCarrierId] = {
      id: mockCarrierId,
      tenantId,
      carrierId: "mock-ltl",
      name: "Coast Freight LTL (Autonomous Fleet Simulator)",
      accountNumber: "NL-CAE-8829-LTL",
      credentialsEncrypted: encryptCredentials({
        apiKey: "mock_test_key_8829",
        secret: "mock_secret_991823"
      }),
      isSandbox: true,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    const mainfreightId = `acc_${tenantId}_mainfreight`;
    this.data.carrier_accounts[mainfreightId] = {
      id: mainfreightId,
      tenantId,
      carrierId: "mainfreight-eu",
      name: "Mainfreight Europe B.V. (Logistics Hub)",
      accountNumber: "MF-ROT-7491-NL",
      credentialsEncrypted: encryptCredentials({
        customerCode: "COAST_AIRBRUSH_EU",
        apiKey: "sandbox_mf_live_api_884920",
        endpoint: "https://api-sandbox.mainfreight.com/v1/freight"
      }),
      isSandbox: true,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
  }

  flush() {
    try {
      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), "utf8");
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error("[FreightBridgeDB] Failed to flush data to disk:", err.message);
    }
  }

  // --- Tenants ---
  getTenant(tenantId) {
    this.init();
    return this.data.stores[tenantId] || null;
  }

  listTenants() {
    this.init();
    return Object.values(this.data.stores);
  }

  saveTenant(tenant) {
    this.init();
    const id = tenant.tenantId;
    tenant.updatedAt = new Date().toISOString();
    if (!this.data.stores[id]) {
      tenant.createdAt = tenant.updatedAt;
    }
    this.data.stores[id] = { ...this.data.stores[id], ...tenant };
    this.flush();
    return this.data.stores[id];
  }

  // --- Carrier Accounts ---
  getCarrierAccounts(tenantId) {
    this.init();
    return Object.values(this.data.carrier_accounts).filter(acc => acc.tenantId === tenantId);
  }

  saveCarrierAccount(account) {
    this.init();
    account.updatedAt = new Date().toISOString();
    if (!account.createdAt) account.createdAt = account.updatedAt;
    this.data.carrier_accounts[account.id] = account;
    this.flush();
    return account;
  }

  // --- Shipping Rules ---
  getShippingRules(tenantId) {
    this.init();
    return this.data.shipping_rules[tenantId] || { tenantId, ...DEFAULT_COAST_SHIPPING_RULES };
  }

  saveShippingRules(tenantId, rules) {
    this.init();
    rules.tenantId = tenantId;
    rules.updatedAt = new Date().toISOString();
    this.data.shipping_rules[tenantId] = rules;
    this.flush();
    return rules;
  }

  // --- Shipments ---
  saveShipment(shipment) {
    this.init();
    shipment.updatedAt = new Date().toISOString();
    if (!shipment.createdAt) shipment.createdAt = shipment.updatedAt;
    this.data.shipments[shipment.id] = shipment;
    this.flush();
    return shipment;
  }

  getShipment(id) {
    this.init();
    return this.data.shipments[id] || null;
  }

  getShipmentByPro(proNumber) {
    this.init();
    return Object.values(this.data.shipments).find(s => s.proNumber === proNumber) || null;
  }

  listShipments(tenantId, filter = {}) {
    this.init();
    let list = Object.values(this.data.shipments);
    if (tenantId) {
      list = list.filter(s => s.tenantId === tenantId);
    }
    if (filter.status) {
      list = list.filter(s => s.status === filter.status);
    }
    if (filter.orderId) {
      list = list.filter(s => s.orderId === filter.orderId);
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // --- Jobs ---
  saveJob(job) {
    this.init();
    job.updatedAt = new Date().toISOString();
    if (!job.createdAt) job.createdAt = job.updatedAt;
    this.data.jobs[job.id] = job;
    this.flush();
    return job;
  }

  getJob(id) {
    this.init();
    return this.data.jobs[id] || null;
  }

  listJobs(tenantId) {
    this.init();
    let list = Object.values(this.data.jobs);
    if (tenantId) {
      list = list.filter(j => j.tenantId === tenantId);
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

export const db = new FreightBridgeDB();
