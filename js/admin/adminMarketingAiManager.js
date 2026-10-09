export class AdminMarketingAiManager {
  constructor(adminController) {
    this.admin = adminController;
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
      `• **Universal Compatibility:** Works seamlessly across Kroma Edge, Ace of Shades, and professional solvent urethanes.\n\n` +
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
}
