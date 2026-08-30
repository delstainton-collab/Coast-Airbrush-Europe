// Coast Airbrush Europe - Owner's Verified Forum & Pre-Order Launch Engine

export const VERIFIED_ORDERS_DB = [
  { orderId: "EU-10492", region: "EU", customerName: "Klaus Schneider", tier: "Master Painter", verified: true },
  { orderId: "UK-88214", region: "UK", customerName: "Liam Evans", tier: "Verified Builder", verified: true },
  { orderId: "EU-10505", region: "EU", customerName: "Mathieu Dubois", tier: "Verified Builder", verified: true },
  { orderId: "US-94812", region: "US", customerName: "Dave 'Coast' Stainton", tier: "Founder / Master Painter", verified: true },
  { orderId: "US-88301", region: "US", customerName: "Chip Foose Fan Club", tier: "Verified Builder", verified: true }
];

export const PREORDER_PACKAGES = [
  {
    id: "preorder_tier1",
    name: "Tier 1: Founding Painter B2C Package",
    badge: "15% EARLY BIRD DISCOUNT",
    priceEUR: 249.00,
    priceUSD: 270.00,
    depositPercent: 100,
    deliveryBatch: "Batch 1 (October 2026)",
    perks: [
      "2x Kroma Edge Solvent Basecoat/Clear Quarts",
      "1x High-Grade Urethane Reducer Quart",
      "1x Flake King 100g Holographic Flake",
      "Free Limited Edition Coast Europe Shop Apron & Stir Scale",
      "Exclusive Lifetime Verified Builder Forum Badge"
    ],
    sku: "PREORDER-TIER1-B2C"
  },
  {
    id: "preorder_tier2",
    name: "Tier 2: B2B Bodyshop Priority Allocation",
    badge: "WHOLESALE PRIORITY STOCK",
    priceEUR: 890.00,
    priceUSD: 968.00,
    depositPercent: 100,
    deliveryBatch: "Batch 1 Priority (October 2026)",
    perks: [
      "6x Kroma Edge Solvent Basecoats & Primers",
      "2x Kroma 2K Polyurethane Speed Clear Kits",
      "Free Countertop Acrylic Display Rack",
      "Priority UK / NL Bonded 3PL Next-Day Dispatch Guarantee",
      "Dedicated B2B Technical Advisor Account"
    ],
    sku: "PREORDER-TIER2-B2B"
  },
  {
    id: "preorder_tier3",
    name: "Tier 3: Master Custom Pro Painter Suite",
    badge: "ULTIMATE COLLECTOR SUITE",
    priceEUR: 1450.00,
    priceUSD: 1575.00,
    depositPercent: 100,
    deliveryBatch: "VIP Batch 1 (Early Access)",
    perks: [
      "Complete Kroma Edge Sprayable Mirror Chrome 1L Kit",
      "1x Flake King 500 Dry Flake Spray Gun + 5 Flake Jars",
      "1x Pro Precision Dual-Action Airbrush (0.35mm)",
      "4x Kroma Color-Shift Pearls & Liquid Clears",
      "Free Masterclass Access with Coast US Artists"
    ],
    sku: "PREORDER-TIER3-PRO"
  }
];

export const FORUM_THREADS = [
  {
    id: "thread_001",
    author: "MarcusKustoms_UK",
    authorBadge: "VERIFIED BUILDER",
    authorRegion: "UK",
    timeAgo: "2 hours ago",
    title: "Trick for sprayable liquid chrome over high gloss black",
    content: "When laying down Kroma Edge Sprayable Chrome, let your 2K gloss black cure for at least 48 hours. Use a 0.8mm mini gun at 18 PSI with 2 mist coats. Do NOT heavy-wet it! It mirrors up instantly.",
    upvotes: 42,
    repliesCount: 18,
    recipe: null
  },
  {
    id: "thread_002",
    author: "Dave_Coast_Original",
    authorBadge: "MASTER PAINTER",
    authorRegion: "US",
    timeAgo: "Yesterday",
    title: "Kroma Edge 2K Speed Clearcoat Weight Matrix Breakdown",
    content: "Uploaded the exact weight matrix for spraying motorcycle tanks with Kroma 2K Polyurethane Speed Clearcoat. Ratio is 2 : 1 : 0.3 with precision scale targets. Click below to load this into your Mixing Calculator with 1 click!",
    upvotes: 98,
    repliesCount: 34,
    recipe: {
      systemId: "ke_speed_clear",
      systemName: "Kroma 2K Polyurethane Speed Clearcoat (2:1:0.3)",
      volumeMl: 600,
      notes: "Show quality deep gloss seal for chrome, flake, and graphics"
    }
  }
];

export class ForumPreorderEngine {
  constructor(cartManager) {
    this.cartManager = cartManager;
    this.verifiedUser = null;
    this.threads = [...FORUM_THREADS];
  }

  /**
   * Verifies US or EU order number to unlock Verified Builder rights.
   */
  verifyOrder(orderId) {
    if (!orderId) return { success: false, message: "Please enter an order number." };
    const cleanId = orderId.toUpperCase().replace("#", "").trim();
    const found = VERIFIED_ORDERS_DB.find(o => o.orderId === cleanId);

    if (found) {
      this.verifiedUser = found;
      return {
        success: true,
        user: found,
        message: `✅ Order Verified (${found.region})! Welcome ${found.customerName}. Badge unlocked: [${found.tier}].`
      };
    } else {
      // Simulate successful verification for demonstration if formatted properly
      if (cleanId.startsWith("EU-") || cleanId.startsWith("UK-") || cleanId.startsWith("US-")) {
        const newUser = {
          orderId: cleanId,
          region: cleanId.slice(0, 2),
          customerName: "Verified Custom Painter",
          tier: "Verified Builder",
          verified: true
        };
        this.verifiedUser = newUser;
        return {
          success: true,
          user: newUser,
          message: `✅ Order Verified! Unlocked Verified Builder posting access.`
        };
      }
      return {
        success: false,
        message: `Order #${cleanId} not found in US or EU database. Use demo orders: EU-10492, UK-88214, or US-94812.`
      };
    }
  }

  /**
   * Mathematical 75% Gross Profit Reinvestment Calculator:
   * Reinvests 75% of pre-order gross profits into UK and Netherlands stock.
   */
  calculateReinvestment(totalPreorderRevenueEUR = 100000) {
    const cogsPercent = 0.40; // 40% COGS to manufacturers
    const grossProfitPercent = 0.60; // 60% Gross Profit
    const reinvestmentRate = 0.75; // 75% Reinvestment commitment
    const reserveRate = 0.25; // 25% OpEx Buffer

    const initialCOGS = totalPreorderRevenueEUR * cogsPercent;
    const grossProfitPool = totalPreorderRevenueEUR * grossProfitPercent;
    const reinvestmentPool = grossProfitPool * reinvestmentRate;
    const reserveBuffer = grossProfitPool * reserveRate;

    // Wholesale purchasing multiplier: €1 wholesale cost yields ~€2.50 retail stock
    const retailStockPurchased = reinvestmentPool * 2.5;

    // 60/40 Split between Netherlands 3PL (Pan-EU OSS) and UK Silverstone Hub
    const netherlandsAllocation = reinvestmentPool * 0.60;
    const ukAllocation = reinvestmentPool * 0.40;

    return {
      revenueEUR: totalPreorderRevenueEUR,
      initialCOGS: initialCOGS,
      grossProfitPool: grossProfitPool,
      reinvestmentPool: reinvestmentPool,
      reserveBuffer: reserveBuffer,
      retailStockPurchased: retailStockPurchased,
      netherlandsAllocation: netherlandsAllocation,
      ukAllocation: ukAllocation
    };
  }

  /**
   * Adds pre-order tier package directly to Shopify cart drawer.
   */
  addPreorderToCart(packageId) {
    const pkg = PREORDER_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return;

    this.cartManager.addItem({
      sku: pkg.sku,
      name: pkg.name,
      containerLabel: "Pre-Order Package",
      quantity: 1,
      unitPriceUSD: pkg.priceUSD,
      properties: {
        "Campaign": "Official European Launch Pre-Order",
        "Delivery Batch": pkg.deliveryBatch,
        "Badge": pkg.badge
      }
    });
  }

  /**
   * Posts a new verified forum thread.
   */
  createThread(title, content, recipe = null) {
    const authorName = this.verifiedUser ? this.verifiedUser.customerName : "Anonymous Painter";
    const authorBadge = this.verifiedUser ? this.verifiedUser.tier : "Guest Member";
    const authorRegion = this.verifiedUser ? this.verifiedUser.region : "EU";

    const newThread = {
      id: `thread_${Date.now()}`,
      author: authorName,
      authorBadge: authorBadge,
      authorRegion: authorRegion,
      timeAgo: "Just now",
      title: title,
      content: content,
      upvotes: 1,
      repliesCount: 0,
      recipe: recipe
    };

    this.threads.unshift(newThread);
    return newThread;
  }
}
