// Coast Airbrush Europe - Master Admin Controller & Add-On Management Suite
import { KROMA_EDGE_CATALOG } from '../data/kroma_edge.js';
import { PREORDER_PACKAGES } from './forumPreorderEngine.js';
import { DEFAULT_HERO_CONFIG } from '../data/hero_config.js?v=20260908b';

export const DEFAULT_TAXONOMY_CONFIG = {
  departments: [
    {
      id: "dept-auto-paint",
      name: "Automotive & Custom Paint",
      icon: "format_paint",
      description: "Solvent paints, mirror chrome, basecoats, reducers and clears",
      categories: ["Mirror Chrome Systems", "Solvent Paints", "Dedicated Clearcoats", "Basecoats", "Reducers & Thinners"]
    },
    {
      id: "dept-special-effects",
      name: "Special Effects & Flakes",
      icon: "auto_awesome",
      description: "Dry metal flakes, holographic flakes, pearls, and kromatic pigments",
      categories: ["Dry Metal Flake (Glitter)", "Kromatic Flakes", "Iridescent Flakes", "Special Effects"]
    },
    {
      id: "dept-equipment",
      name: "Equipment & Hardware",
      icon: "precision_manufacturing",
      description: "Flake King guns, airbrushes, jigs, stands, and spray equipment",
      categories: ["Dry Metal Flake Guns", "Flake King Gun Accessories", "Workstations & Jigs", "Helmet Jigs", "Motorcycle Part Jigs", "Stands"]
    },
    {
      id: "dept-consumables",
      name: "Consumables & Prep",
      icon: "content_cut",
      description: "Fine line masking tapes, surface prep, tack cloths, and cleaners",
      categories: ["Masking Products", "Basecoats & Binders", "Surface Cleaners", "Abrasives"]
    },
    {
      id: "dept-studio",
      name: "Studio & Merchandise",
      icon: "palette",
      description: "Apparel, swag, studio tools, and instructional materials",
      categories: ["Apparel & Merch", "Studio Accessories", "Reference Guides"]
    }
  ]
};

const STORAGE_KEY = 'coast_admin_config_v1';
const DEFAULT_PIN = 'COAST2026';

export class AdminController {
  constructor(appRef) {
    this.app = appRef;
    this.isAuthenticated = false;
    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('coast_admin_authenticated') === 'true') {
        this.isAuthenticated = true;
      }
    } catch (e) {}
    this.activeSubTab = 'formulas';
    this.config = this.loadConfig();
  }

  loadConfig() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.auth || typeof parsed.auth !== 'object') {
          parsed.auth = { pin: DEFAULT_PIN, lastLogin: null };
        }
        if (!parsed.auth.pin || typeof parsed.auth.pin !== 'string' || !parsed.auth.pin.trim()) {
          parsed.auth.pin = DEFAULT_PIN;
        }
        if (!parsed.deletedProductIds) {
          parsed.deletedProductIds = [];
        }
        if (!parsed.hero) {
          parsed.hero = JSON.parse(JSON.stringify(DEFAULT_HERO_CONFIG));
        }
        if (!parsed.taxonomy || !parsed.taxonomy.departments || !Array.isArray(parsed.taxonomy.departments)) {
          parsed.taxonomy = JSON.parse(JSON.stringify(DEFAULT_TAXONOMY_CONFIG));
        }
        return parsed;
      } catch (e) {
        console.error("Failed to parse admin config, resetting to default", e);
      }
    }

    return {
      auth: {
        pin: DEFAULT_PIN,
        lastLogin: null
      },
      productOverrides: {},
      deletedProductIds: [],
      taxonomy: JSON.parse(JSON.stringify(DEFAULT_TAXONOMY_CONFIG)),
      customProductFields: [
        { key: "specificGravity", label: "Specific Gravity (g/mL)", type: "number", default: 1.0 },
        { key: "recommendedNozzle", label: "Recommended Nozzle (mm)", type: "text", default: "0.3mm - 0.5mm" },
        { key: "recommendedPressure", label: "Recommended PSI", type: "text", default: "20-25 PSI" },
        { key: "hazmatUnCode", label: "Hazmat UN Code", type: "text", default: "UN1263 Class 3" },
        { key: "flashTimeMin", label: "Flash Time (mins)", type: "number", default: 10 }
      ],
      formulas: JSON.parse(JSON.stringify(KROMA_EDGE_CATALOG.mixingSystems)),
      preorders: JSON.parse(JSON.stringify(PREORDER_PACKAGES)),
      hero: JSON.parse(JSON.stringify(DEFAULT_HERO_CONFIG)),
      printer: {
        model: 'Standard Inkjet Printer (A4 Combined Shipping Sheet)',
        dpi: 300,
        paperSize: 'A4 Portrait',
        labelWidthMm: 194,
        labelHeightMm: 275,
        enableGhsHazard: true,
        hazmatCode: 'UN1263 CLASS 3 FLAMMABLE LIQUID (ADR LQ)',
        format: 'A4_COMBINED_INKJET'
      },
      hazmat: {
        preferredUkCarrier: 'APC Overnight (Depot 128)',
        maxInnerVolumeMl: 5000,
        maxOuterGrossKg: 30,
        ukBaseFreightGbp: 7.95,
        ukFreeDeliveryThresholdGbp: 150.00,
        lqHazardSurchargeGbp: 1.25,
        fuelSurchargePercent: 9.5,
        nonHazmatExemptionActive: true
      },
      aiAgents: {
        agentA: {
          name: "Master Painter AI",
          maxDiscountAllowed: 15,
          temperaturePrompt: "Strict Technical Precision",
          apiKey: ""
        },
        agentB: {
          name: "Order Concierge AI",
          enableWhatsApp: true,
          enableSMS: true,
          enableEmail: true,
          statusIntervalHours: 24
        },
        agentC: {
          name: "Kustom Marketer AI",
          postSchedule: "09:00, 14:00, 19:00 CET",
          monitoredTags: ["#HouseOfKolor", "#KromaEdge", "#AirbrushArt", "#CustomPaint"]
        },
        agentD: {
          name: "Stock Guru AI",
          safetyBufferDays: 30,
          japanOceanThresholdUnits: 150,
          californiaAirBufferThresholdUnits: 25
        }
      },
      emailHub: {
        senderProfile: {
          fromName: "Dave 'Coast' Stainton - Coast Airbrush Europe",
          fromEmail: "orders@coastairbrush.eu",
          replyTo: "support@coastairbrush.eu"
        },
        apiEndpoint: "https://api.coastairbrush.eu/v1/email/dispatch",
        apiKey: "",
        templates: [
          {
            id: "tpl-b2b-restock",
            name: "B2B Shop Restock & Bulk PVA Invoicing Notice",
            targetSegment: "b2b_jobbers",
            subject: "⚡ Weekly Shop Restock: Solvent Clearcoats, Primers & Zero-VAT Invoicing (DE/FR/NL/UK)",
            body: "Hi {{customer_name}},\n\nWe are preparing our weekly bonded hazardous dispatch run from Rotterdam and our UK logistics hubs.\n\nAs a registered commercial account (VAT/Tax ID: {{vat_number}}), your account is enabled for 0% EU Intra-Community Reverse Charge and UK Postponed VAT Accounting.\n\n🔥 **Current Stock Availability For Your Shop:**\n• Kroma Edge Speed Clearcoat (1.5L Kits) – In Stock\n• Jet Black Mirror Gloss Primer (1L & 5L) – High Inventory\n• Flake King 500 Dry Metal Flake Spray Guns – Ready to Ship\n\nNeed to add custom mixed solvent formulas to your standing weekly pallet? Click below to review your trade prices or reply with your PO.\n\nBest regards,\n**Coast Airbrush Europe Commercial Team**"
          },
          {
            id: "tpl-preorder-update",
            name: "Pre-Order Ocean Container & Add-On Flake Alert",
            targetSegment: "preorder_backers",
            subject: "📦 Ocean Container Update for Order #{{latest_order_id}} + Backer-Only Add-On Flakes",
            body: "Hello {{customer_name}},\n\nHere is your real-time manufacturing and ocean freight update for your pre-order tier (**{{tier}}**):\n\n🚢 **Logistics Milestone:** Our ocean vessel from Signal Japan & California is on schedule for Rotterdam port customs clearance.\n📦 **Your Associated Pre-Order:** #{{latest_order_id}}\n\n🎨 **Exclusive Backer Add-On Perk:**\nBefore your container shipment is finalized and packed under ADR Limited Quantity rules, you can bundle our **Flake King Holographic Micro-Flakes (0.015)** or extra 1L Reducer solvent with **FREE combined shipping**.\n\nTap here to manage your pre-order preferences or claim your 15% backer perk coupon: `BACKER-VIP-15`.\n\nStay creative,\n**Dave 'Coast' Stainton**"
          },
          {
            id: "tpl-artist-vip",
            name: "Master Painter VIP Exclusive Candy Drop",
            targetSegment: "master_painters",
            subject: "👑 VIP Artist Drop: Limited Batch Micro Pearls & Chrome Formula Unlocked",
            body: "Hey {{customer_name}},\n\nAs one of our verified **{{tier}}** artists, you have first access to our fresh master batch of Kroma Edge Liquid Chrome and custom House of Kolor Shimrin2 color blends.\n\n✨ **Formulation Highlights:**\n• Ultra-high refraction index for mirror-finish reflection.\n• Precision calibrated for 0.2mm - 0.4mm Iwata and Custom Micron airbrushes.\n• Zero clouding when locked down under our Speed Clear.\n\nUse your VIP Studio code `MASTERARTIST` for priority dispatch and free sample pigment vials on orders placed this week.\n\nKeep laid out,\n**Coast Airbrush Europe Custom Lab**"
          },
          {
            id: "tpl-adr-tracking",
            name: "Single Order ADR Hazmat Tracking & Invoice Delivery",
            targetSegment: "single_customer",
            subject: "🚚 Dispatch & Tracking Confirmation for Order #{{latest_order_id}} (ADR Class 3)",
            body: "Dear {{customer_name}},\n\nYour custom solvent paint order **#{{latest_order_id}}** has been packaged according to ADR Section 3.4 Limited Quantity regulations and handed to **{{carrier}}**.\n\n📦 **Tracking Number:** `{{tracking_number}}`\n⏱️ **Estimated Delivery:** {{estimated_delivery}}\n📍 **Destination:** {{customer_city}}, {{customer_country}}\n\nYour official EU OSS / UK PVA commercial tax invoice has been generated and filed with your customs declaration.\n\nThank you for choosing Coast Airbrush Europe!"
          }
        ],
        campaigns: [
          {
            id: "cmp-20260825-01",
            date: "2026-08-25T11:20:00Z",
            title: "EU B2B Autumn Primer & Clear Restock",
            type: "blanket",
            segment: "b2b_jobbers",
            subject: "⚡ Weekly Shop Restock: Solvent Clearcoats & Primers",
            recipientCount: 42,
            deliveredCount: 42,
            openRate: 64.3,
            clickRate: 31.0,
            conversions: 11,
            revenueEur: 8420.00,
            aiSummary: "Exceptional performance among German and French body shops. Highest conversion on 1.5L Speed Clearcoat kits. Recommended next step: Follow-up with shops that clicked but didn't check out."
          },
          {
            id: "cmp-20260828-02",
            date: "2026-08-28T16:45:00Z",
            title: "Pre-Order Batch 1 Ocean Transit Notice",
            type: "blanket",
            segment: "preorder_backers",
            subject: "🚢 Batch 1 Shipping Progress: Container In Transit",
            recipientCount: 28,
            deliveredCount: 28,
            openRate: 82.1,
            clickRate: 46.4,
            conversions: 8,
            revenueEur: 1980.00,
            aiSummary: "High engagement from pre-order backers. 8 customers added Flake King sprayers and micro-flake jars to their existing container shipment."
          }
        ],
        dispatchLogs: [
          {
            id: "log-101",
            timestamp: "2026-08-30T10:14:22Z",
            type: "single",
            recipientEmail: "klaus@customkolors.de",
            recipientName: "Klaus Schneider",
            subject: "ADR Tracking Notice - Order #EU-10492",
            status: "Delivered",
            mode: "Simulated Delivery",
            segment: "EU B2B Jobbers"
          },
          {
            id: "log-102",
            timestamp: "2026-08-29T17:02:11Z",
            type: "single",
            recipientEmail: "liam@speedandchrome.co.uk",
            recipientName: "Liam Evans",
            subject: "Customs Cleared UK PVA Invoice #UK-88214",
            status: "Delivered",
            mode: "Simulated Delivery",
            segment: "UK PVA Garages"
          }
        ]
      }
    };
  }

  saveConfig() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    if (this.app && typeof this.app.onAdminConfigUpdated === 'function') {
      this.app.onAdminConfigUpdated(this.config);
    }
  }

  login(enteredPin) {
    const cleanPin = (enteredPin || '').trim().toUpperCase();
    const currentPin = ((this.config && this.config.auth && this.config.auth.pin) || DEFAULT_PIN).trim().toUpperCase();
    const defaultPinUpper = DEFAULT_PIN.toUpperCase();

    // Valid if matches configured PIN or master override PIN COAST2026
    if (cleanPin && (cleanPin === currentPin || cleanPin === defaultPinUpper)) {
      this.isAuthenticated = true;
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('coast_admin_authenticated', 'true');
        }
      } catch (e) {}

      if (!this.config.auth) {
        this.config.auth = { pin: DEFAULT_PIN, lastLogin: null };
      }
      this.config.auth.lastLogin = new Date().toISOString();
      this.saveConfig();
      return { success: true };
    }
    return { success: false, message: "Invalid Master PIN. Default is COAST2026" };
  }

  logout() {
    this.isAuthenticated = false;
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('coast_admin_authenticated');
      }
    } catch (e) {}
  }

  changePin(currentPin, newPin) {
    const cleanCur = (currentPin || '').trim().toUpperCase();
    const configuredCur = ((this.config && this.config.auth && this.config.auth.pin) || DEFAULT_PIN).trim().toUpperCase();
    const defaultPinUpper = DEFAULT_PIN.toUpperCase();

    if (cleanCur !== configuredCur && cleanCur !== defaultPinUpper) {
      return { success: false, message: "Current PIN is incorrect." };
    }
    const cleanNew = (newPin || '').trim();
    if (!cleanNew || cleanNew.length < 4) {
      return { success: false, message: "New PIN must be at least 4 characters." };
    }
    if (!this.config.auth) {
      this.config.auth = { pin: DEFAULT_PIN, lastLogin: null };
    }
    this.config.auth.pin = cleanNew;
    this.saveConfig();
    return { success: true, message: `Master PIN updated successfully to "${cleanNew}"!` };
  }

  // Formula CRUD
  saveFormula(formulaData) {
    const idx = this.config.formulas.findIndex(f => f.id === formulaData.id);
    if (idx >= 0) {
      this.config.formulas[idx] = formulaData;
    } else {
      this.config.formulas.push(formulaData);
    }
    this.saveConfig();
  }

  deleteFormula(formulaId) {
    this.config.formulas = this.config.formulas.filter(f => f.id !== formulaId);
    this.saveConfig();
  }

  // Pre-Orders CRUD
  savePreorderTier(tierData) {
    const idx = this.config.preorders.findIndex(p => p.id === tierData.id);
    if (idx >= 0) {
      this.config.preorders[idx] = tierData;
    } else {
      this.config.preorders.push(tierData);
    }
    this.saveConfig();
  }

  deletePreorderTier(tierId) {
    this.config.preorders = this.config.preorders.filter(p => p.id !== tierId);
    this.saveConfig();
  }

  // =========================================================================
  // TAXONOMY (DEPARTMENTS & CATEGORIES) CRUD
  // =========================================================================
  getTaxonomy() {
    if (!this.config.taxonomy || !Array.isArray(this.config.taxonomy.departments)) {
      this.config.taxonomy = JSON.parse(JSON.stringify(DEFAULT_TAXONOMY_CONFIG));
      this.saveConfig();
    }
    return this.config.taxonomy;
  }

  getDepartments() {
    return this.getTaxonomy().departments;
  }

  getDepartment(deptId) {
    return this.getDepartments().find(d => d.id === deptId || d.name.toLowerCase() === (deptId || '').toLowerCase());
  }

  saveDepartment(deptData) {
    const tax = this.getTaxonomy();
    if (!deptData.id) {
      deptData.id = 'dept-' + deptData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    const idx = tax.departments.findIndex(d => d.id === deptData.id || d.name.toLowerCase() === deptData.name.toLowerCase());
    if (idx >= 0) {
      tax.departments[idx] = {
        ...tax.departments[idx],
        ...deptData,
        categories: Array.isArray(deptData.categories) ? deptData.categories : (tax.departments[idx].categories || [])
      };
    } else {
      tax.departments.push({
        id: deptData.id,
        name: deptData.name.trim(),
        icon: deptData.icon || 'category',
        description: deptData.description || '',
        categories: Array.isArray(deptData.categories) ? deptData.categories : []
      });
    }
    this.saveConfig();
    return deptData;
  }

  deleteDepartment(deptId) {
    const tax = this.getTaxonomy();
    tax.departments = tax.departments.filter(d => d.id !== deptId && d.name !== deptId);
    this.saveConfig();
  }

  addCategoryToDepartment(deptId, categoryName) {
    const trimmed = (categoryName || '').trim();
    if (!trimmed) return false;
    const dept = this.getDepartment(deptId);
    if (!dept) return false;
    if (!dept.categories) dept.categories = [];
    if (!dept.categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      dept.categories.push(trimmed);
      this.saveConfig();
      return true;
    }
    return false;
  }

  removeCategoryFromDepartment(deptId, categoryName) {
    const dept = this.getDepartment(deptId);
    if (!dept || !dept.categories) return false;
    dept.categories = dept.categories.filter(c => c.toLowerCase() !== categoryName.toLowerCase());
    this.saveConfig();
    return true;
  }

  getAllCategories() {
    const depts = this.getDepartments();
    const set = new Set();
    depts.forEach(d => {
      (d.categories || []).forEach(c => set.add(c));
    });
    return Array.from(set).sort();
  }

  // Hero & Landing Section Configurator
  saveHeroConfig(heroData) {
    this.config.hero = JSON.parse(JSON.stringify(heroData));
    this.saveConfig();
    return this.config.hero;
  }

  resetHeroConfig() {
    this.config.hero = JSON.parse(JSON.stringify(DEFAULT_HERO_CONFIG));
    this.saveConfig();
    return this.config.hero;
  }

  // Product Fields & Catalog Overrides
  saveProductOverride(productId, productFields) {
    if (!this.config.productOverrides) {
      this.config.productOverrides = {};
    }
    this.config.productOverrides[productId] = {
      ...(this.config.productOverrides[productId] || {}),
      ...productFields,
      updatedAt: new Date().toISOString()
    };
    this.saveConfig();
    return this.config.productOverrides[productId];
  }

  saveProductOverridesBulk(overridesMap) {
    if (!this.config.productOverrides) {
      this.config.productOverrides = {};
    }
    const timestamp = new Date().toISOString();
    for (const [productId, fields] of Object.entries(overridesMap)) {
      this.config.productOverrides[productId] = {
        ...(this.config.productOverrides[productId] || {}),
        ...fields,
        updatedAt: timestamp
      };
    }
    this.saveConfig();
    return this.config.productOverrides;
  }

  deleteProductOverride(productId) {
    if (this.config.productOverrides && this.config.productOverrides[productId]) {
      delete this.config.productOverrides[productId];
      this.saveConfig();
    }
  }

  saveProductMatrix(productId, matrixData) {
    if (!this.config.productOverrides) {
      this.config.productOverrides = {};
    }
    const current = this.config.productOverrides[productId] || {};
    this.config.productOverrides[productId] = {
      ...current,
      variantMatrix: matrixData,
      hasOptions: Boolean(matrixData && matrixData.variants && matrixData.variants.length > 0),
      updatedAt: new Date().toISOString()
    };
    this.saveConfig();
    return this.config.productOverrides[productId];
  }

  deleteProductMatrix(productId) {
    if (this.config.productOverrides && this.config.productOverrides[productId]) {
      delete this.config.productOverrides[productId].variantMatrix;
      this.saveConfig();
    }
  }

  deleteProduct(productId, productSnapshot = null) {
    if (!this.config.deletedProductIds) {
      this.config.deletedProductIds = [];
    }
    if (!this.config.deletedProductRecords) {
      this.config.deletedProductRecords = {};
    }
    if (!this.config.deletedProductIds.includes(productId)) {
      this.config.deletedProductIds.push(productId);
    }
    if (productSnapshot) {
      this.config.deletedProductRecords[productId] = {
        ...productSnapshot,
        deletedAt: new Date().toISOString()
      };
    }
    if (this.config.productOverrides && this.config.productOverrides[productId]) {
      delete this.config.productOverrides[productId];
    }
    this.saveConfig();
    return this.config.deletedProductIds;
  }

  deleteProductsBulk(items) {
    if (!this.config.deletedProductIds) {
      this.config.deletedProductIds = [];
    }
    if (!this.config.deletedProductRecords) {
      this.config.deletedProductRecords = {};
    }
    items.forEach(item => {
      const id = typeof item === 'string' ? item : item.id;
      const snapshot = typeof item === 'object' ? item : null;
      if (!this.config.deletedProductIds.includes(id)) {
        this.config.deletedProductIds.push(id);
      }
      if (snapshot) {
        this.config.deletedProductRecords[id] = {
          ...snapshot,
          deletedAt: new Date().toISOString()
        };
      }
      if (this.config.productOverrides && this.config.productOverrides[id]) {
        delete this.config.productOverrides[id];
      }
    });
    this.saveConfig();
    return this.config.deletedProductIds;
  }

  restoreProduct(productId) {
    let restoredRecord = null;
    if (this.config.deletedProductIds) {
      this.config.deletedProductIds = this.config.deletedProductIds.filter(id => id !== productId);
    }
    if (this.config.deletedProductRecords && this.config.deletedProductRecords[productId]) {
      restoredRecord = { ...this.config.deletedProductRecords[productId] };
      delete this.config.deletedProductRecords[productId];
    }
    this.saveConfig();
    return restoredRecord;
  }

  restoreAllDeletedProducts() {
    const records = Object.values(this.config.deletedProductRecords || {});
    this.config.deletedProductIds = [];
    this.config.deletedProductRecords = {};
    this.saveConfig();
    return records;
  }

  getDeletedProductIds() {
    return this.config.deletedProductIds || [];
  }

  getDeletedProductRecords() {
    return this.config.deletedProductRecords || {};
  }

  resetAllProductOverrides() {
    this.config.productOverrides = {};
    this.saveConfig();
  }

  saveCustomField(fieldDef) {
    if (!this.config.customProductFields) {
      this.config.customProductFields = [];
    }
    const idx = this.config.customProductFields.findIndex(f => f.key === fieldDef.key);
    if (idx >= 0) {
      this.config.customProductFields[idx] = fieldDef;
    } else {
      this.config.customProductFields.push(fieldDef);
    }
    this.saveConfig();
  }

  deleteCustomField(fieldKey) {
    if (this.config.customProductFields) {
      this.config.customProductFields = this.config.customProductFields.filter(f => f.key !== fieldKey);
      this.saveConfig();
    }
  }

  // Gemini AI Creative Suite (Sales Copy, Promo Video Scripts, Media Enhancements)
  generateGeminiSalesCopy(product) {
    const brand = product.brand || 'Coast Airbrush Europe';
    const name = product.name || 'Custom Finish';
    const cat = product.category || 'Specialty Paint';
    const sku = product.sku || '';

    const hooks = [
      `Transform ordinary surfaces into extraordinary show-stoppers with ${name}.`,
      `Engineered for precision atomization, maximum depth, and relentless durability.`,
      `The secret weapon used by world-class custom builders and airbrush artists.`
    ];

    const copyBody = `Unleash professional-grade performance with the **${name}** from **${brand}** (${cat}). Specifically formulated for maximum optical clarity, smooth leveling, and seamless solvent compatibility. Whether you're laying down mirror-grade chrome reflections, ultra-clean line fades, or multi-dimensional pearls, this formula delivers unrivaled coverage and zero-clouding integrity.\n\n` +
      `🔥 **Key Technical Highlights:**\n` +
      `• **Flawless Atomization:** Optimized for fine nozzle setups (0.2mm - 1.2mm) with consistent flow.\n` +
      `• **High Solid Content:** Rich pigment density reduces required coats while increasing UV & chemical resistance.\n` +
      `• **Pan-European Stock:** Fast UK & EU bonded 24h dispatch with ADR Limited Quantity compliance.\n` +
      `• **Universal Compatibility:** Works seamlessly across House of Kolor, Kroma Edge, and solvent urethanes.\n\n` +
      `*Part Number: ${sku} | Master Distributor: Coast Airbrush Europe*`;

    const seoKeywords = `${brand}, ${name}, ${cat}, custom paint, airbrush supply UK, custom car paint EU, urethane clearcoat, Kroma Edge chrome`;

    return {
      hook: hooks[Math.floor(Math.random() * hooks.length)],
      description: copyBody,
      badgeSuggestion: product.priceEur > 100 ? "PRO GRADE MASTERCLASS" : "ARTIST FAVORITE",
      seoKeywords: seoKeywords
    };
  }

  generateGeminiVideoScript(product) {
    const name = product.name || 'Kroma Edge Special Formula';
    const brand = product.brand || 'Coast Airbrush Europe';

    return {
      platform: "TikTok / Instagram Reels / YouTube Shorts",
      targetDuration: "20 - 30 Seconds",
      visualHook: `[0:00 - 0:03] CLOSE-UP 4K: Spray gun laying down wet coat of ${name} under studio spotlight. Instant mirror gloss reflection appears.`,
      voiceoverHook: `"If you're still doing 5 coats of clear just to get real depth, stop scrolling right now."`,
      shotList: [
        { time: "0:03 - 0:08", visual: "Macro angle showing zero orange peel and perfect metallic/flake orientation.", textOverlay: "ZERO CLOUDING • TRUE MIRROR REFLECTION" },
        { time: "0:08 - 0:15", visual: "Artist peeling masking tape away to reveal laser-sharp graphics and candy fade.", textOverlay: "PRO GRADE SOLVENT COMPATIBILITY" },
        { time: "0:15 - 0:22", visual: "Side-by-side comparison on a finished chopper tank and scale helmet.", textOverlay: `Available exclusively via Coast Airbrush Europe` },
        { time: "0:22 - 0:28", visual: "Product tin on turntable with direct URL: coastairbrush.eu", textOverlay: "Tap link in bio to order • EU & UK 24h Dispatch 🚀" }
      ],
      callToAction: `Order ${name} today at coastairbrush.eu or tap the cart link below!`,
      hashtags: [`#${brand.replace(/\s+/g, '')}`, "#CustomPaint", "#AirbrushArt", "#LowriderPaint", "#KromaEdge", "#KustomKulture"]
    };
  }

  // =========================================================================
  // AI HERO & LANDING COPYWRITING SUITE
  // =========================================================================
  generateHeroAiCopy({ tone = 'kustom_kulture', focus = 'all', customPrompt = '' } = {}) {
    const suites = {
      kustom_kulture: [
        {
          id: 'kk-1',
          name: 'Raw Garage Thunder',
          headlinePrefix: 'THE OFFICIAL EUROPEAN HUB FOR',
          headlineAccent: 'PURE KUSTOM KULTURE, CHROME & DRY FLAKE',
          subheadline: 'Zero compromises. High-velocity Flake King guns and mirror liquid finishes shipped across Europe.',
          description: 'Direct factory-authorized European distribution from our UK logistics center. High-pressure flake atomization, self-organizing liquid mirror chrome, next-day tracked APC Overnight & DHL Express, and genuine garage support before and after every order.',
          pillStatus: '✦ OFFICIAL EUROPEAN MASTER HUB',
          pillLocation: 'PLACENTIA, CA AUTHORIZED',
          trustLine: 'UK Bonded Dispatch • Tracked APC Overnight & DHL Express • 100% REACH & VOC Certified • Zero US Customs',
          tradeBadge: '💼 TRADE & WHOLESALE:',
          tradeText: 'Custom Bodyshops & Builders —',
          tradeLinkText: 'Unlock Trade Accounts & Reverse-Charge VAT'
        },
        {
          id: 'kk-2',
          name: 'Chopper & Lowrider Mastery',
          headlinePrefix: 'UNLEASH AMERICAN KUSTOM HERITAGE ACROSS',
          headlineAccent: 'EUROPEAN CHOPPERS, LOWRIDERS & SHOW CARS',
          subheadline: 'Engineered for extreme metallic flake density, razor-sharp tape graphics, and liquid mirror reflection.',
          description: 'No more waiting on ocean freight or paying exorbitant US import duties. Get California custom paint technology delivered to your booth tomorrow with tracked express fulfillment, REACH-certified solvent chemistry, and zero gray haze.',
          pillStatus: '🔥 FACTORY AUTHORIZED EUROPE',
          pillLocation: 'UK & NETHERLANDS LOGISTICS',
          trustLine: 'Direct Factory Distribution • Same-Day Dispatch • Certified ADR Limited Quantity • Zero US Import Tariffs',
          tradeBadge: '⚡ SHOP DISCOUNTS:',
          tradeText: 'Professional Spray Painters —',
          tradeLinkText: 'Apply for Bodyshop Volume Pricing'
        }
      ],
      master_refinisher: [
        {
          id: 'mr-1',
          name: 'Precision Refinisher Standards',
          headlinePrefix: 'THE EUROPEAN MASTER HUB FOR',
          headlineAccent: 'KROMA EDGE CHROME, FLAKE KING & VSIONAIR',
          subheadline: 'Engineered for automotive refinishers, custom shops & airbrush artists across Europe.',
          description: 'Direct European bonded dispatch from our UK logistics center. Zero US import customs, next-day tracked APC & DHL Express, full EU REACH & VOC regulatory compliance, and factory-authorized technical support.',
          pillStatus: '✦ OFFICIAL EUROPEAN MASTER HUB',
          pillLocation: 'PLACENTIA, CA AUTHORIZED',
          trustLine: 'Dispatched from UK Hub • Tracked APC Overnight & DHL Express • 100% REACH & VOC Certified • Zero US Customs',
          tradeBadge: '💼 TRADE & WHOLESALE:',
          tradeText: 'Bodyshops, Retailers & Importers —',
          tradeLinkText: 'Apply for Trade Pricing & Net Ex-VAT Billing'
        },
        {
          id: 'mr-2',
          name: 'Specular Optical Clarity',
          headlinePrefix: 'ADVANCED METALLIC SELF-ORGANIZATION FOR',
          headlineAccent: '99.4% SPECULAR CHROME & SHOW FINISHES',
          subheadline: 'Calibrated for standard 2K clearcoats with zero clouding, zero gray haze, and OEM durability.',
          description: 'Kroma Edge liquid chrome features self-aligning metallic platelets that lock under standard clearcoats without dulling. Paired with Flake King dry application systems for 70% clearcoat savings and flawless edge-to-edge leveling.',
          pillStatus: '💎 SPECULAR FINISH VERIFIED',
          pillLocation: 'TECHNICAL LAB VALIDATED',
          trustLine: '100% Optical Reflection Guarantee • Standard 2K Clear Compatible • Fast European Delivery • VOC Compliant',
          tradeBadge: '🔬 COMMERCIAL LABS:',
          tradeText: 'Industrial & Bodyshop Restock —',
          tradeLinkText: 'Request Technical Data Sheets & Wholesale Pricing'
        }
      ],
      trade_logistics: [
        {
          id: 'tl-1',
          name: 'Pan-European Bonded Logistics',
          headlinePrefix: 'EUROPEAN COMMERCIAL HEADQUARTERS FOR',
          headlineAccent: 'BONDED HAZMAT PAINT, CLEARCOATS & FLAKE GUNS',
          subheadline: 'Streamlined logistics with 0% EU Intra-Community Reverse Charge and UK Postponed VAT Accounting.',
          description: 'Save days of transit and thousands in customs brokerage. We stock full inventory in UK and Rotterdam bonded warehouses with ADR Limited Quantity hazardous freight certification, next-day tracked APC Overnight, and automated business invoicing.',
          pillStatus: '🇪🇺 PAN-EUROPEAN BONDED HUB',
          pillLocation: 'UK & ROTTERDAM WAREHOUSES',
          trustLine: 'APC Overnight & DHL Express • ADR Class 3 Certified • Postponed VAT Accounting • Zero Import Hassles',
          tradeBadge: '📦 B2B TRADE DESK:',
          tradeText: 'Garages, Distributors & Jobbers —',
          tradeLinkText: 'Activate Instant 0% VAT Invoicing'
        },
        {
          id: 'tl-2',
          name: 'Next-Day Express Refill',
          headlinePrefix: 'DIRECT EUROPEAN WAREHOUSE FULFILLMENT',
          headlineAccent: 'NEXT-DAY SOLVENT SUPPLIES FOR PRO REFINISH SHOPS',
          subheadline: 'Reliable weekly replenishment of Kroma Edge Speed Clear, reducers, and dry flake guns across DE, FR, NL & UK.',
          description: 'Keep your paint booths producing without supply chain delays. Direct factory distributor pricing on certified Kroma Edge systems, Flake King 550 & 1000 guns, and precision fine line masking tapes with immediate EU OSS compliance.',
          pillStatus: '⚡ 24H BONDED DISPATCH',
          pillLocation: 'DEPOT 128 LOGISTICS CENTER',
          trustLine: 'Same-Day Hazardous Packaging • 24/48h European Delivery • Full REACH SDS Compliance • Dedicated Account Rep',
          tradeBadge: '💼 COMMERCIAL FLEET:',
          tradeText: 'Production Paint Facilities —',
          tradeLinkText: 'Open a Standing Restock Account'
        }
      ],
      vip_launch: [
        {
          id: 'vl-1',
          name: 'VIP European Rollout',
          headlinePrefix: 'EXCLUSIVE EUROPEAN VIP ACCESS & PRE-ORDER FOR',
          headlineAccent: 'KROMA EDGE SPRAYABLE CHROME & FLAKE KING 2026',
          subheadline: 'Priority ocean container allocations, zero US import tariffs, and exclusive master artist perks.',
          description: 'The first shipment of Kroma Edge and Flake King equipment is clearing bonded port customs. Lock in your pre-order tier today for guaranteed batch 1 dispatch, complimentary backer add-on flakes, and VIP studio lifetime pricing.',
          pillStatus: '⭐ VIP PRE-ORDER PORTAL',
          pillLocation: 'BATCH 1 ALLOCATION OPEN',
          trustLine: 'Guaranteed Container Allocation • Free Combined Shipping Perks • 15% Backer Reward Code • Zero Customs',
          tradeBadge: '👑 ARTIST ACCESS:',
          tradeText: 'Custom Painters & Studios —',
          tradeLinkText: 'Secure Batch 1 Allocation Before Container Sells Out'
        }
      ]
    };

    return suites[tone] || suites.kustom_kulture;
  }

  polishHeroField(field, currentValue, tone = 'kustom_kulture') {
    const clean = (currentValue || '').trim();
    const polishLibrary = {
      prefix: {
        kustom_kulture: [
          'THE OFFICIAL EUROPEAN HUB FOR',
          'RAW AMERICAN KUSTOM HERITAGE FOR',
          'EUROPE\'S ULTIMATE GARAGE HEADQUARTERS FOR'
        ],
        master_refinisher: [
          'THE EUROPEAN MASTER HUB FOR',
          'PRECISION AUTOMOTIVE REFINISHING FOR',
          'ADVANCED OPTICAL COATINGS & FINISHES FOR'
        ],
        trade_logistics: [
          'EUROPEAN COMMERCIAL HEADQUARTERS FOR',
          'DIRECT BONDED FACTORY LOGISTICS FOR',
          'PAN-EUROPEAN WHOLESALE DISTRIBUTION FOR'
        ],
        vip_launch: [
          'EXCLUSIVE EUROPEAN VIP ACCESS & PRE-ORDER FOR',
          'OFFICIAL 2026 CONTINENTAL LAUNCH OF',
          'PRIORITY REFINISHER ALLOCATION FOR'
        ]
      },
      accent: {
        kustom_kulture: [
          'KROMA EDGE CHROME, FLAKE KING & VSIONAIR',
          'UNCOMPROMISING LIQUID CHROME & DRY FLAKE GUNS',
          'HIGH-OCTANE CHROME REFLECTIONS & METAL FLAKES'
        ],
        master_refinisher: [
          'KROMA EDGE CHROME, FLAKE KING & VSIONAIR',
          '99.4% SPECULAR MIRROR REFLECTIONS & 2K CLEARS',
          'SELF-ORGANIZING LIQUID CHROME & PRECISION JIGS'
        ],
        trade_logistics: [
          'BONDED HAZMAT PAINT, CLEARCOATS & FLAKE GUNS',
          'ZERO-DUTY EUROPEAN PAINT REPLENISHMENT',
          'ADR LIMITED QUANTITY LIQUID CHROME & REDUCERS'
        ],
        vip_launch: [
          'KROMA EDGE SPRAYABLE CHROME & FLAKE KING 2026',
          'BATCH 1 LIQUID MIRROR CHROME & FLAKE GUNS',
          'EXCLUSIVE EUROPEAN VIP ALLOCATION TIERS'
        ]
      },
      subheadline: {
        kustom_kulture: [
          'Engineered for automotive refinishers, custom shops & airbrush artists across Europe.',
          'Zero compromises. High-velocity Flake King guns and mirror liquid finishes shipped across Europe.',
          'Extreme flake density, razor-sharp tape graphics, and liquid mirror reflection for show-winning builds.'
        ],
        master_refinisher: [
          'Engineered for automotive refinishers, custom shops & airbrush artists across Europe.',
          'Calibrated for standard 2K clearcoats with zero clouding, zero gray haze, and OEM durability.',
          'Advanced metallic self-organization yielding 99.4% specular reflection without gray clouding.'
        ],
        trade_logistics: [
          'Streamlined logistics with 0% EU Intra-Community Reverse Charge and UK Postponed VAT Accounting.',
          'Next-day solvent paint, clears, and equipment replenishment directly from our UK & Rotterdam hubs.',
          'Automated commercial tax invoicing, REACH compliance, and ADR Class 3 certified dispatch.'
        ],
        vip_launch: [
          'Priority ocean container allocations, zero US import tariffs, and exclusive master artist perks.',
          'Lock in guaranteed Batch 1 dispatch and early-bird trade pricing before container capacity is reached.',
          'Direct European launch access with factory warranties and zero overseas import delays.'
        ]
      },
      description: {
        kustom_kulture: [
          'Direct European bonded dispatch from our UK logistics center. Zero US import customs, next-day tracked APC & DHL Express, full EU REACH & VOC regulatory compliance, and factory-authorized technical support.',
          'No more waiting on ocean freight or paying exorbitant US import duties. Get California custom paint technology delivered to your booth tomorrow with tracked express fulfillment and zero gray haze.',
          'High-pressure dry flake guns, self-organizing liquid chrome, and precision fine line masking tapes stocked and ready to ship from our European warehouse directly to your shop.'
        ],
        master_refinisher: [
          'Direct European bonded dispatch from our UK logistics center. Zero US import customs, next-day tracked APC & DHL Express, full EU REACH & VOC regulatory compliance, and factory-authorized technical support.',
          'Kroma Edge liquid chrome features self-aligning metallic platelets that lock under standard clearcoats without dulling. Paired with Flake King dry application systems for 70% clearcoat savings and flawless edge-to-edge leveling.',
          'Formulated specifically for professional spray environments. Certified REACH & VOC compliant chemistry engineered to withstand thermal cycles and UV exposure under 2K polyurethane clears.'
        ],
        trade_logistics: [
          'Direct European bonded dispatch from our UK logistics center. Zero US import customs, next-day tracked APC & DHL Express, full EU REACH & VOC regulatory compliance, and factory-authorized technical support.',
          'Save days of transit and thousands in customs brokerage. We stock full inventory in UK and Rotterdam bonded warehouses with ADR Limited Quantity hazardous freight certification and automated business invoicing.',
          'Reliable weekly shop replenishment. Orders placed before 14:00 ship same-day under ADR Limited Quantity protocols with live tracking and automated VAT-exempt commercial invoices.'
        ],
        vip_launch: [
          'The first shipment of Kroma Edge and Flake King equipment is clearing bonded port customs. Lock in your pre-order tier today for guaranteed batch 1 dispatch, complimentary backer add-on flakes, and VIP studio lifetime pricing.',
          'Direct European launch rollout. Early-bird reservation secures your production allocation with zero US import customs and tracked delivery straight to your spray booth.',
          'Priority VIP access for European custom artists. Full warranty protection, direct technical phone support from master painters, and exclusive access to limited-run pigments.'
        ]
      }
    };

    const target = polishLibrary[field]?.[tone] || polishLibrary[field]?.kustom_kulture || [];
    if (target.length === 0) return clean;
    const filtered = target.filter(opt => opt.toLowerCase() !== clean.toLowerCase());
    return filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : target[0];
  }

  // Generate Citizen TSPL Raw Print Command
  generateTsplCommand(batchId = "B-2026-0831", orderId = "EU-10492", system = null) {
    const sys = system || this.config.formulas[0];
    let compBreakdown = "";
    if (sys && sys.components) {
      compBreakdown = sys.components.map(c => `- ${c.name}: ${c.parts} part(s) [${c.specificGravity} g/mL]`).join("\\n");
    }

    const tspl = `SIZE 4,6
GAP 0.12,0
DIRECTION 1
CLS
BOX 20,20,780,1180,4
TEXT 40,40,"3",0,1,1,"COAST AIRBRUSH EUROPE - CUSTOM MIX"
TEXT 40,80,"2",0,1,1,"ORDER: #${orderId} | BATCH: ${batchId}"
TEXT 40,120,"2",0,1,1,"SYSTEM: ${sys ? sys.name : 'Custom Formula'}"
BARCODE 40,160,"128",80,1,0,2,4,"${sys ? sys.id : 'KE'}-${batchId}"
TEXT 40,270,"2",0,1,1,"RATIO: ${sys ? sys.ratioLabel : 'Standard'}"
TEXT 40,310,"2",0,1,1,"NOZZLE: ${sys ? sys.recommendedNozzle : '0.3mm - 0.5mm'}"
TEXT 40,350,"2",0,1,1,"PRESSURE: ${sys ? sys.recommendedPressure : '20-25 PSI'}"
TEXT 40,410,"2",0,1,1,"COMPONENTS / DENSITIES:"
${compBreakdown}
${this.config.printer.enableGhsHazard ? `TEXT 40,1080,"2",0,1,1,"[!] ${this.config.printer.hazmatCode}"` : ''}
PRINT 1,1`;

    return tspl;
  }

  exportConfigJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `coast_airbrush_admin_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  importConfigJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.formulas || !parsed.preorders) {
        return { success: false, message: "Invalid configuration format." };
      }
      this.config = parsed;
      this.saveConfig();
      return { success: true, message: "Configuration successfully imported & restored!" };
    } catch (e) {
      return { success: false, message: "JSON parsing error: " + e.message };
    }
  }

  // =========================================================================
  // CUSTOMER EMAIL & AI COMMUNICATION HUB METHODS
  // =========================================================================

  /**
   * Aggregates customers across Agent B orders, forum pre-orders, and custom accounts.
   */
  getAllCustomers() {
    const customerMap = new Map();

    // 1. From MOCK_ORDERS (Agent B)
    if (this.app && this.app.agentB && this.app.agentB.orders) {
      this.app.agentB.orders.forEach(ord => {
        if (ord.customerEmail) {
          const isB2B = Boolean(ord.shippingAddress && ord.shippingAddress.vatNumber);
          const isUK = ord.shippingAddress && ord.shippingAddress.countryCode === 'GB';
          const isEU = ord.shippingAddress && ord.shippingAddress.countryCode !== 'GB';
          
          let seg = 'retail_hobbyists';
          if (isB2B && isEU) seg = 'b2b_jobbers';
          else if (isB2B && isUK) seg = 'uk_garages';

          customerMap.set(ord.customerEmail.toLowerCase(), {
            id: ord.orderId || `CUST-${Math.random().toString(36).substr(2, 6)}`,
            name: ord.customerName ? ord.customerName.replace(/\s*\([^)]*\)/, '') : 'Valued Customer',
            company: ord.customerName && ord.customerName.includes('(') ? ord.customerName.match(/\((.*?)\)/)[1] : (isB2B ? 'Registered Commercial Shop' : 'Studio / Individual'),
            email: ord.customerEmail.toLowerCase(),
            phone: ord.customerPhone || 'N/A',
            country: ord.shippingAddress ? ord.shippingAddress.country : 'European Union',
            countryCode: ord.shippingAddress ? ord.shippingAddress.countryCode : 'EU',
            city: ord.shippingAddress ? ord.shippingAddress.city : 'Central Hub',
            vatNumber: ord.shippingAddress && ord.shippingAddress.vatNumber ? ord.shippingAddress.vatNumber : 'N/A (Standard Consumer)',
            tier: isB2B ? 'Commercial B2B Jobber' : 'Custom Builder',
            segment: seg,
            latestOrderId: ord.orderId || 'EU-10492',
            carrier: ord.carrier || 'DHL Express ADR',
            trackingNumber: ord.trackingNumber || 'DHL-EU-884920194DE',
            estimatedDelivery: ord.estimatedDelivery || '2026-09-02',
            source: 'Verified Order'
          });
        }
      });
    }

    // 2. Default Seed Customers if sparse
    const defaultRoster = [
      {
        id: "CUST-DE-101",
        name: "Klaus Schneider",
        company: "Custom Kolors Germany",
        email: "klaus@customkolors.de",
        phone: "+49 170 8291034",
        country: "Germany",
        countryCode: "DE",
        city: "Stuttgart",
        vatNumber: "DE318294012",
        tier: "Master Painter",
        segment: "b2b_jobbers",
        latestOrderId: "EU-10492",
        carrier: "DHL Express Hazmat ADR",
        trackingNumber: "DHL-EU-884920194DE",
        estimatedDelivery: "2026-08-31",
        source: "EU B2B Jobber"
      },
      {
        id: "CUST-GB-102",
        name: "Liam Evans",
        company: "Speed & Chrome UK",
        email: "liam@speedandchrome.co.uk",
        phone: "+44 7700 900482",
        country: "United Kingdom",
        countryCode: "GB",
        city: "Towcester",
        vatNumber: "GB948201844",
        tier: "Verified Builder",
        segment: "uk_garages",
        latestOrderId: "UK-88214",
        carrier: "DPD UK Hazmat Express",
        trackingNumber: "DPD-UK-9948201849",
        estimatedDelivery: "2026-09-01",
        source: "UK PVA Account"
      },
      {
        id: "CUST-FR-103",
        name: "Mathieu Dubois",
        company: "Atelier Airbrush France",
        email: "mathieu@atelier-airbrush.fr",
        phone: "+33 6 12 34 56 78",
        country: "France",
        countryCode: "FR",
        city: "Lyon",
        vatNumber: "FR82910482910",
        tier: "Verified Builder",
        segment: "b2b_jobbers",
        latestOrderId: "EU-10505",
        carrier: "PostNL / DPD Europe",
        trackingNumber: "NL-POST-77382910FR",
        estimatedDelivery: "2026-09-02",
        source: "EU B2B Jobber"
      },
      {
        id: "CUST-SE-104",
        name: "Stefan Lindqvist",
        company: "Kustom Garage Stockholm",
        email: "stefan@kustomgarage.se",
        phone: "+46 70 123 4567",
        country: "Sweden",
        countryCode: "SE",
        city: "Stockholm",
        vatNumber: "SE556123456701",
        tier: "Master Painter",
        segment: "master_painters",
        latestOrderId: "EU-10512",
        carrier: "DHL Freight Hazmat",
        trackingNumber: "DHL-SE-492019482SE",
        estimatedDelivery: "2026-09-03",
        source: "Master Artist VIP"
      },
      {
        id: "CUST-NL-105",
        name: "Jan Van Der Berg",
        company: "Rotterdam Lowrider Studio",
        email: "jan@rotterdamkustoms.nl",
        phone: "+31 6 55512345",
        country: "Netherlands",
        countryCode: "NL",
        city: "Rotterdam",
        vatNumber: "NL812345678B01",
        tier: "Founding Backer",
        segment: "preorder_backers",
        latestOrderId: "PO-B1-042",
        carrier: "PostNL Cargo",
        trackingNumber: "NL-CARGO-8849201NL",
        estimatedDelivery: "2026-09-05",
        source: "Pre-Order Backer Tier 3"
      },
      {
        id: "CUST-BE-106",
        name: "Luc Claes",
        company: "Airbrush Creations Antwerp",
        email: "luc@airbrushcreations.be",
        phone: "+32 470 123456",
        country: "Belgium",
        countryCode: "BE",
        city: "Antwerp",
        vatNumber: "BE0123456789",
        tier: "Master Painter",
        segment: "master_painters",
        latestOrderId: "EU-10520",
        carrier: "DPD Belgium ADR",
        trackingNumber: "DPD-BE-9948201BE",
        estimatedDelivery: "2026-09-04",
        source: "Master Artist VIP"
      },
      {
        id: "CUST-UK-107",
        name: "Marcus Ward",
        company: "Ward Kustom Choppers",
        email: "marcus@wardchoppers.co.uk",
        phone: "+44 7800 112233",
        country: "United Kingdom",
        countryCode: "GB",
        city: "Birmingham",
        vatNumber: "GB123456789",
        tier: "Pre-Order Backer",
        segment: "preorder_backers",
        latestOrderId: "PO-B1-089",
        carrier: "DPD UK Hazmat",
        trackingNumber: "DPD-UK-1122334455",
        estimatedDelivery: "2026-09-06",
        source: "Pre-Order Backer Tier 2"
      },
      {
        id: "CUST-IT-108",
        name: "Marco Rossi",
        company: "Milano Airbrush Studio",
        email: "marco.rossi@airbrushmilano.it",
        phone: "+39 340 1234567",
        country: "Italy",
        countryCode: "IT",
        city: "Milan",
        vatNumber: "IT01234567890",
        tier: "Retail Builder",
        segment: "retail_hobbyists",
        latestOrderId: "EU-10531",
        carrier: "DHL Express Italy",
        trackingNumber: "DHL-IT-77382910IT",
        estimatedDelivery: "2026-09-07",
        source: "Direct Retail"
      }
    ];

    defaultRoster.forEach(c => {
      if (!customerMap.has(c.email.toLowerCase())) {
        customerMap.set(c.email.toLowerCase(), c);
      }
    });

    return Array.from(customerMap.values());
  }

  getCustomersBySegment(segment) {
    const all = this.getAllCustomers();
    if (!segment || segment === 'all') return all;
    if (segment === 'b2b_jobbers') return all.filter(c => c.segment === 'b2b_jobbers' || c.vatNumber !== 'N/A (Standard Consumer)');
    if (segment === 'uk_garages') return all.filter(c => c.countryCode === 'GB');
    if (segment === 'master_painters') return all.filter(c => c.segment === 'master_painters' || c.tier.includes('Master'));
    if (segment === 'preorder_backers') return all.filter(c => c.segment === 'preorder_backers' || c.latestOrderId.startsWith('PO-'));
    if (segment === 'retail_hobbyists') return all.filter(c => c.segment === 'retail_hobbyists' || c.vatNumber === 'N/A (Standard Consumer)');
    return all;
  }

  renderMergeTags(templateText, customer) {
    if (!templateText) return "";
    return templateText
      .replace(/\{\{customer_name\}\}/gi, customer.name || 'Valued Painter')
      .replace(/\{\{customer_company\}\}/gi, customer.company || 'Custom Shop')
      .replace(/\{\{customer_email\}\}/gi, customer.email || 'customer@example.com')
      .replace(/\{\{customer_city\}\}/gi, customer.city || 'Central')
      .replace(/\{\{customer_country\}\}/gi, customer.country || 'Europe')
      .replace(/\{\{vat_number\}\}/gi, customer.vatNumber || 'N/A')
      .replace(/\{\{tier\}\}/gi, customer.tier || 'Master Painter')
      .replace(/\{\{latest_order_id\}\}/gi, customer.latestOrderId || 'EU-10492')
      .replace(/\{\{carrier\}\}/gi, customer.carrier || 'DHL Express ADR')
      .replace(/\{\{tracking_number\}\}/gi, customer.trackingNumber || 'DHL-EU-884920194DE')
      .replace(/\{\{estimated_delivery\}\}/gi, customer.estimatedDelivery || '2026-09-02');
  }

  // =========================================================================
  // AI COPYWRITING & CAMPAIGN OPTIMIZATION GENERATOR
  // =========================================================================
  generateAiEmailContent(presetKey, targetSegment, customGoal = "") {
    const isB2B = targetSegment === 'b2b_jobbers' || targetSegment === 'uk_garages';
    const isPreorder = targetSegment === 'preorder_backers';
    const isArtist = targetSegment === 'master_painters';

    let subjectOptions = [];
    let generatedBody = "";
    let audienceNote = "";
    let predictedOpenRate = "58% - 74%";

    if (presetKey === 'restock_flash') {
      subjectOptions = [
        "⚡ [48H FLASH RESTOCK] Kroma Edge Speed Clear & High-Solid Primer Pallets (EU / UK Dispatch)",
        "📦 Stock Alert for {{customer_company}}: Solvent Reducers, Speed Clears & VAT-Free Reorder",
        "🔥 Priority Allocation for {{customer_name}}: Claim Your Solvent Batch Before Weekend Dispatch"
      ];
      generatedBody = `Hi {{customer_name}},\n\nWe are preparing this week's bonded solvent pallet dispatches from our Rotterdam and UK hubs.\n\n` +
        `As a key commercial account (**{{customer_company}}** | VAT: \`{{vat_number}}\`), we have reserved priority allocation for your shop across our high-demand consumable lines:\n\n` +
        `• **Kroma Edge Speed Clearcoat (1.5L Complete Kits):** Rapid 15-min air dry, mirror depth, zero solvent dieback.\n` +
        `• **Jet Black Mirror Gloss Primer (1L & 5L):** High-build leveling formulation for flawless base prep.\n` +
        `• **Fast / Medium / Slow Reducers:** Fully stocked for variable temperature booth spraying.\n\n` +
        `💡 *Commercial Tax Note:* All EU Intra-Community B2B orders process under 0% Reverse Charge OSS VAT; UK commercial garages utilize Postponed VAT Accounting (PVA).\n\n` +
        `👉 **1-Click Restock Link:** Reply directly with your required quantities or tap below to lock in your trade order.\n\n` +
        `Best regards,\n**Coast Airbrush Europe Supply Logistics**`;
      audienceNote = "Tone: High urgency, commercial margin focus, inventory certainty, VAT compliance clarity.";
      predictedOpenRate = "68.5%";
    } else if (presetKey === 'preorder_backer_addon') {
      subjectOptions = [
        "🚢 Ocean Container Milestone Update + Backer-Only Free Shipping on Flake Guns & Pearls",
        "📦 Pre-Order #{{latest_order_id}} Progress: Yokohama to Rotterdam Port Clearance Schedule",
        "🎁 Backer VIP Perk: Add Flake King Spray Guns to Order #{{latest_order_id}} with Zero Extra Shipping"
      ];
      generatedBody = `Hello {{customer_name}},\n\nHere is your official logistics milestone report for your **{{tier}}** pre-order (**#{{latest_order_id}}**):\n\n` +
        `🌊 **Ocean Freight Status:** The bulk shipping container carrying our Signal Japan Kroma Edge and California House of Kolor inventory is navigating on schedule toward Rotterdam Port.\n` +
        `⏱️ **Target Port Customs Clearance:** September 14, 2026.\n` +
        `📦 **Final Mile Carrier:** Handing off to DHL Hazmat ADR (EU) & DPD Express (UK) for insured ground transit.\n\n` +
        `✨ **Exclusive Backer Add-On Window (Save on Freight):**\n` +
        `Because your master parcel is already booked, you can add any of the following items to your crate with **100% FREE COMBINED HAZMAT FREIGHT**:\n` +
        `1. *Flake King 500 Dry Flake Gun* (Save €25 on hazmat surcharge)\n` +
        `2. *Holographic & Kameleon Flake Starter Packs (100g jars)*\n` +
        `3. *Spare 1L Reducer & Airbrush Cleaning Stations*\n\n` +
        `Use your secret backer checkout code: \`BACKER-COMBO-FREE\`\n\n` +
        `Thanks for standing with Coast Airbrush Europe from day one!\n\n` +
        `Warm regards,\n**Dave 'Coast' Stainton & The European Crew**`;
      audienceNote = "Tone: Transparent, reassuring, logistics-backed, high-converting add-on incentive.";
      predictedOpenRate = "79.2%";
    } else if (presetKey === 'vip_artist_exclusive') {
      subjectOptions = [
        "👑 [Master Artist Exclusive] Limited Batch Liquid Chrome & House of Kolor Pearls Unlocked",
        "🎨 Special Formulation Alert for {{customer_name}}: Micro-Refraction Pearls Ready for Spray",
        "💎 Secret Studio Vault: Custom Micron Tuned Formulas for {{customer_company}}"
      ];
      generatedBody = `Hey {{customer_name}},\n\nAs one of our verified **{{tier}}** artists, you know that true mirror chrome and candy depth depend on exact pigment purity.\n\n` +
        `We have just finalized a limited micro-batch of our **Kroma Edge Liquid Chrome Special Edition** alongside rare House of Kolor Shimrin2 candy concentrates.\n\n` +
        `🔬 **What makes this batch special for custom work:**\n` +
        `• Ultra-fine particle suspension designed specifically for 0.18mm - 0.35mm precision nozzles.\n` +
        `• Zero graininess under high-intensity spotlighting.\n` +
        `• Formulated to lock cleanly under 2K Speed Clears without lifting or graying.\n\n` +
        `Because this batch is strictly capped at 50 numbered liters across Europe, we have opened a 72-hour priority reservation window for verified studio painters.\n\n` +
        `Use VIP code: \`MASTERPIECE2026\` for instant express dispatch and complimentary swatch test cards.\n\n` +
        `Keep laying it down,\n**Coast Airbrush Europe Mix Lab**`;
      audienceNote = "Tone: Elite craftsmanship, exclusivity, technical precision, passion for custom paint.";
      predictedOpenRate = "72.4%";
    } else {
      // General / Custom Goal Prompt
      subjectOptions = [
        `🔥 Essential Paint Update & Trade Notice for {{customer_name}}`,
        `📦 Special Announcement from Coast Airbrush Europe for {{customer_company}}`,
        `⚡ European Custom Paint Alert: New Formulas & 24H Logistics Dispatches`
      ];
      generatedBody = `Dear {{customer_name}},\n\n` +
        (customGoal ? `In response to ${customGoal}:\n\n` : '') +
        `We are writing to update you on our latest solvent formulas, inventory availability, and express pan-European delivery routes for **{{customer_company}}**.\n\n` +
        `Whether you require ADR Class 3 compliant clearcoats, high-sparkle dry metal flakes, or specialized airbrush accessories, our team is equipped to support your projects with 24-hour bonded dispatch.\n\n` +
        `Please let us know how we can support your upcoming spray jobs.\n\n` +
        `Kind regards,\n**Coast Airbrush Europe Team**`;
      audienceNote = "Tone: Professional, direct, custom tailored to your specified goal.";
      predictedOpenRate = "61.0%";
    }

    return {
      selectedSubject: subjectOptions[0],
      subjectOptions: subjectOptions,
      body: generatedBody,
      predictedOpenRate: predictedOpenRate,
      audienceNote: audienceNote
    };
  }

  // =========================================================================
  // AI CAMPAIGN DOCTOR & PERFORMANCE DIAGNOSTICS
  // =========================================================================
  generateAiCampaignDiagnostics(campaignId) {
    const cmp = (this.config.emailHub.campaigns || []).find(c => c.id === campaignId) || this.config.emailHub.campaigns[0];
    if (!cmp) return null;

    let diagnosis = {
      score: "A- (91/100)",
      headline: `High Engagement Across ${cmp.segment.toUpperCase().replace('_', ' ')}`,
      strengths: [
        `Open rate of ${cmp.openRate}% exceeds industry automotive benchmark by +38.5%.`,
        `Generated €${(cmp.revenueEur || 0).toLocaleString()} in direct attributed sales within 48 hours of broadcast.`,
        `Zero spam complaints and 100% clean delivery with no bounce errors.`
      ],
      opportunities: [
        `${cmp.recipientCount - cmp.conversions} recipients opened the email but did not complete checkout.`,
        `Subject line variation #2 had a higher engagement index on mobile devices.`
      ],
      aiActionableRecommendation: `Trigger an automated AI 48-Hour Follow-Up targeted strictly at the ${cmp.recipientCount - cmp.conversions} non-converting recipients with a 5% instant checkout nudge: code 'RESTOCK-FAST'.`
    };

    return diagnosis;
  }

  // =========================================================================
  // DISPATCH & LOGGING ENGINE
  // =========================================================================
  sendDirectEmail(customer, emailData) {
    const mergedSubject = this.renderMergeTags(emailData.subject, customer);
    const mergedBody = this.renderMergeTags(emailData.body, customer);

    const logEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      timestamp: new Date().toISOString(),
      type: "single",
      recipientEmail: customer.email,
      recipientName: customer.name,
      recipientCompany: customer.company,
      subject: mergedSubject,
      bodyPreview: mergedBody.slice(0, 140) + '...',
      status: "Delivered",
      mode: emailData.mode || "Simulated Delivery",
      segment: customer.segment
    };

    if (!this.config.emailHub.dispatchLogs) {
      this.config.emailHub.dispatchLogs = [];
    }
    this.config.emailHub.dispatchLogs.unshift(logEntry);
    this.saveConfig();

    return {
      success: true,
      log: logEntry,
      renderedSubject: mergedSubject,
      renderedBody: mergedBody
    };
  }

  sendBlanketCampaign(segment, emailData) {
    const targetCustomers = this.getCustomersBySegment(segment);
    const now = new Date().toISOString();
    const campaignId = `cmp-${Date.now()}`;

    // Create logs for each
    const logs = targetCustomers.map(cust => {
      return {
        id: `log-${Date.now()}-${Math.floor(Math.random()*10000)}`,
        timestamp: now,
        type: "blanket",
        campaignId: campaignId,
        recipientEmail: cust.email,
        recipientName: cust.name,
        recipientCompany: cust.company,
        subject: this.renderMergeTags(emailData.subject, cust),
        bodyPreview: this.renderMergeTags(emailData.body, cust).slice(0, 140) + '...',
        status: "Delivered",
        mode: emailData.mode || "Simulated Delivery",
        segment: segment
      };
    });

    if (!this.config.emailHub.dispatchLogs) {
      this.config.emailHub.dispatchLogs = [];
    }
    this.config.emailHub.dispatchLogs.unshift(...logs);

    // Track Campaign
    const simOpenRate = 65 + Math.round(Math.random() * 18);
    const simClickRate = Math.round(simOpenRate * 0.45);
    const simConversions = Math.max(1, Math.round(targetCustomers.length * 0.28));
    const simRevenue = simConversions * (segment === 'b2b_jobbers' ? 780 : 240);

    const newCampaign = {
      id: campaignId,
      date: now,
      title: emailData.title || emailData.subject.slice(0, 40),
      type: "blanket",
      segment: segment,
      subject: emailData.subject,
      recipientCount: targetCustomers.length,
      deliveredCount: targetCustomers.length,
      openRate: simOpenRate,
      clickRate: simClickRate,
      conversions: simConversions,
      revenueEur: simRevenue,
      aiSummary: `Dispatched to ${targetCustomers.length} verified accounts in '${segment}'. Expected €${simRevenue} in trade reorders.`
    };

    if (!this.config.emailHub.campaigns) {
      this.config.emailHub.campaigns = [];
    }
    this.config.emailHub.campaigns.unshift(newCampaign);
    this.saveConfig();

    return {
      success: true,
      campaign: newCampaign,
      recipientsSent: targetCustomers.length
    };
  }

  saveEmailTemplate(templateData) {
    if (!this.config.emailHub.templates) {
      this.config.emailHub.templates = [];
    }
    const idx = this.config.emailHub.templates.findIndex(t => t.id === templateData.id);
    if (idx >= 0) {
      this.config.emailHub.templates[idx] = templateData;
    } else {
      this.config.emailHub.templates.push(templateData);
    }
    this.saveConfig();
  }

  deleteEmailTemplate(templateId) {
    if (this.config.emailHub.templates) {
      this.config.emailHub.templates = this.config.emailHub.templates.filter(t => t.id !== templateId);
      this.saveConfig();
    }
  }

  clearDispatchLogs() {
    if (this.config.emailHub) {
      this.config.emailHub.dispatchLogs = [];
      this.saveConfig();
    }
  }

  // FX Volatility & Margin Guard Management
  saveFxSettings(settings = {}) {
    if (!this.config.fx) {
      this.config.fx = {};
    }
    this.config.fx = {
      ...this.config.fx,
      ...settings,
      updatedAt: new Date().toISOString()
    };
    this.saveConfig();

    if (this.app?.euLocalization?.fxEngine) {
      this.app.euLocalization.fxEngine.updateConfig(settings);
    }
    return this.config.fx;
  }

  reanchorFxBaseline(options = {}) {
    if (!this.app?.euLocalization?.fxEngine) {
      return { success: false, message: "FX Engine not initialized" };
    }
    const res = this.app.euLocalization.fxEngine.reanchorBaseline(options);
    this.saveFxSettings({
      baselineRate: res.newBaseline,
      bufferPercent: res.bufferPercent,
      roundingMode: res.roundingMode
    });
    return res;
  }

  batchRepriceCatalogFromGbp(options = {}) {
    if (!this.app?.euLocalization?.fxEngine) {
      return { success: 0 };
    }
    const fx = this.app.euLocalization.fxEngine;
    const products = this.app.getEffectiveProducts ? this.app.getEffectiveProducts() : [];
    const bulkMap = {};
    let count = 0;

    products.forEach(p => {
      const gbpBase = parseFloat(p.priceGbp) || parseFloat(p.priceRrpExVat) || 0;
      if (gbpBase > 0) {
        const newEur = fx.calculateEurPrice(gbpBase, options);
        bulkMap[p.id] = { priceEur: newEur };
        // Update in-memory runtime catalog as well
        p.priceEur = newEur;
        count++;
      }
    });

    if (Object.keys(bulkMap).length > 0) {
      this.saveProductOverridesBulk(bulkMap);
    }

    return {
      success: true,
      count,
      rateUsed: options.rate || fx.getEffectiveRate(),
      bufferUsed: options.bufferPercent !== undefined ? options.bufferPercent : fx.config.bufferPercent
    };
  }

  resetToFactoryDefaults() {
    localStorage.removeItem(STORAGE_KEY);
    this.config = this.loadConfig();
    this.saveConfig();
  }
}
