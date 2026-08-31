// Coast Airbrush Europe - Master Admin Controller & Add-On Management Suite
import { KROMA_EDGE_CATALOG } from '../data/kroma_edge.js';
import { PREORDER_PACKAGES } from './forumPreorderEngine.js';

const STORAGE_KEY = 'coast_admin_config_v1';
const DEFAULT_PIN = 'COAST2026';

export class AdminController {
  constructor(appRef) {
    this.app = appRef;
    this.isAuthenticated = false;
    this.activeSubTab = 'formulas';
    this.config = this.loadConfig();
  }

  loadConfig() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
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
      customProductFields: [
        { key: "specificGravity", label: "Specific Gravity (g/mL)", type: "number", default: 1.0 },
        { key: "recommendedNozzle", label: "Recommended Nozzle (mm)", type: "text", default: "0.3mm - 0.5mm" },
        { key: "recommendedPressure", label: "Recommended PSI", type: "text", default: "20-25 PSI" },
        { key: "hazmatUnCode", label: "Hazmat UN Code", type: "text", default: "UN1263 Class 3" },
        { key: "flashTimeMin", label: "Flash Time (mins)", type: "number", default: 10 }
      ],
      formulas: JSON.parse(JSON.stringify(KROMA_EDGE_CATALOG.mixingSystems)),
      preorders: JSON.parse(JSON.stringify(PREORDER_PACKAGES)),
      printer: {
        model: 'Citizen CL-S621 / CL-E300',
        dpi: 203,
        labelWidthMm: 100,
        labelHeightMm: 150,
        enableGhsHazard: true,
        hazmatCode: 'UN1263 CLASS 3 FLAMMABLE LIQUID',
        tsplTemplate: `SIZE 4,6
GAP 0.12,0
DIRECTION 1
CLS
BOX 20,20,780,1180,4
TEXT 40,40,"3",0,1,1,"COAST AIRBRUSH EUROPE - MIX LAB"
TEXT 40,80,"2",0,1,1,"BATCH: {BATCH_ID}  |  ORDER: {ORDER_ID}"
TEXT 40,120,"2",0,1,1,"SYSTEM: {SYSTEM_NAME}"
BARCODE 40,170,"128",80,1,0,2,4,"{SKU}-{BATCH_ID}"
TEXT 40,280,"2",0,1,1,"{COMPONENTS_BREAKDOWN}"
TEXT 40,1050,"2",0,1,1,"{HAZMAT_NOTICE}"
PRINT 1,1`
      },
      hazmat: {
        maxInnerVolumeMl: 5000,
        maxOuterGrossKg: 30,
        ukSurchargeEur: 8.50,
        euMainlandSurchargeEur: 12.00,
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
    if (this.app) {
      this.app.onAdminConfigUpdated(this.config);
    }
  }

  login(enteredPin) {
    if (enteredPin === this.config.auth.pin) {
      this.isAuthenticated = true;
      this.config.auth.lastLogin = new Date().toISOString();
      this.saveConfig();
      return { success: true };
    }
    return { success: false, message: "Invalid Master PIN. Default is COAST2026" };
  }

  logout() {
    this.isAuthenticated = false;
  }

  changePin(currentPin, newPin) {
    if (currentPin !== this.config.auth.pin) {
      return { success: false, message: "Current PIN is incorrect." };
    }
    if (!newPin || newPin.length < 4) {
      return { success: false, message: "New PIN must be at least 4 characters." };
    }
    this.config.auth.pin = newPin;
    this.saveConfig();
    return { success: true, message: "Master PIN updated successfully!" };
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

  deleteProductOverride(productId) {
    if (this.config.productOverrides && this.config.productOverrides[productId]) {
      delete this.config.productOverrides[productId];
      this.saveConfig();
    }
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

  resetToFactoryDefaults() {
    localStorage.removeItem(STORAGE_KEY);
    this.config = this.loadConfig();
    this.saveConfig();
  }
}
