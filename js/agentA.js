import { ECOM_CATALOG } from '../data/full_ecom_catalog.js';

export const KNOWLEDGE_BASE = {
  // Products explicitly carried on Coast Airbrush Europe storefront
  catalogBrands: [
    {
      brand: "Kroma Edge",
      tagline: "Self-Organizing Mirror Chrome System & Dedicated Clearcoats",
      products: ["Kroma Edge Self-Organizing Mirror Chrome System (140g, 420g, 1260g, 2520g, 10080g)", "Kroma Edge Dedicated Topcoat Clear System (180 SET, 900 SET, 3600 SET)"]
    },
    {
      brand: "Flake King",
      tagline: "Dry Metal Flake Application Guns, Precision Fine Line Tapes & Metal Flakes",
      products: ["Flake King 500 Airbrush Attachment", "Flake King 550 Mini Gun", "Flake King 1000 / 1050 Guns", "Flake King Pro Series Kit", "FK50 Surface Binders", "Precision Fine Line Tapes", "Show Krome & Holographic Metal Flakes (.002 to .060)"]
    },
    {
      brand: "VsionAir",
      tagline: "Modular Artist Workstations, Positioning Jigs & Lighting Rigs",
      products: ["VsionAir Modular Workstation Frames", "Helmet Jigs (Goalie Mask & Full Face)", "Motorcycle Tank & Fender Jigs", "Canvass & Easel Jigs", "Guitar & Wheel Jigs", "Tool Bars & Lighting Rigs"]
    }
  ],

  substrates: {
    aluminum: {
      name: "Bare Aluminum",
      prepSteps: [
        "Degrease thoroughly with solvent wax & grease remover (Surface Klean).",
        "Scuff with 3M maroon/grey Scotch-Brite or sand with P320-P400 grit.",
        "Apply direct-to-metal (DTM) 2K epoxy primer.",
        "Allow 60-90 min cure before applying basecoat or Kroma Edge Chrome."
      ],
      recommendedPrimer: "2K DTM Epoxy Hybrid Primer (4:1)"
    },
    steel: {
      name: "Bare Steel / Metal",
      prepSteps: [
        "Clean surface with solvent degreaser.",
        "Sand to bare metal using P180-P240 grit dry, remove all oxidation/rust.",
        "Apply Direct-to-Substrate (DTS) Hybrid Epoxy Primer / Sealer.",
        "Block sand with P400-P600 if leveling is required, then seal before effect coat."
      ],
      recommendedPrimer: "DTS Hybrid Epoxy Primer / Sealer"
    },
    plastic: {
      name: "Raw Plastic / ABS / Polycarbonate / 3D Print Resin",
      prepSteps: [
        "Wash with warm soapy water, then treat with anti-static plastic cleaner.",
        "Scuff thoroughly with grey ultra-fine Scotch-Brite pad.",
        "Apply universal adhesion promoter in 1 medium wet coat (5-10 min flash).",
        "Apply 2K primer or seal with #600–#1000 grit finish before Kroma Edge."
      ],
      recommendedPrimer: "Universal Adhesion Promoter + 2K Sealer"
    },
    fiberglass: {
      name: "Fiberglass / Gelcoat / Carbon Fiber",
      prepSteps: [
        "Clean with solvent degreaser to remove mold release agents.",
        "Dry sand with P240-P320 grit to remove all gloss.",
        "Apply 2 coats of 2K Primer Surfacer to fill pinholes.",
        "Guide coat and block sand with P400-P600 wet/dry before base or effect coat."
      ],
      recommendedPrimer: "2K High-Build Surfacer (4:1)"
    },
    chrome: {
      name: "Existing Chrome / Polished Metal",
      prepSteps: [
        "Chrome cannot be coated directly without mechanical keying or stripping.",
        "Sand blast with fine aluminum oxide or aggressively scuff with P180/P240.",
        "Apply 2 full wet coats of Adhesion Promoter followed by 2K Epoxy Primer."
      ],
      recommendedPrimer: "Adhesion Promoter + 2K Epoxy Primer"
    },
    oem_paint: {
      name: "Existing OEM Paint / Sanded Clearcoat",
      prepSteps: [
        "Degrease with waterborne and solvent-borne surface cleaners.",
        "Uniformly scuff with P600-P1000 grit wet paper or gold fine scuff pad (zero gloss spots).",
        "Apply 2K sealer or spray Kroma Edge Chrome directly over #600-#1000 prepped ground coat."
      ],
      recommendedPrimer: "2K Urethane Sealer"
    }
  },

  equipment: {
    micro_airbrush: {
      name: "Precision Micro Airbrush (0.18mm - 0.23mm Matched Head)",
      needleRange: "0.18mm - 0.23mm",
      recommendedPsi: "12 - 20 PSI (0.8 - 1.4 Bar)",
      bestFor: ["Ultra-fine hairline detail", "Portraits", "Precision shading & pinstriping shadow"],
      viscosityNotes: "Requires 100% reduction. For metal flake, use Flake King 500 dry flake attachment instead of spraying flake through fluid nozzle."
    },
    general_airbrush: {
      name: "General Custom Airbrush (0.35mm - 0.50mm Dual-Action)",
      needleRange: "0.35mm - 0.50mm",
      recommendedPsi: "20 - 35 PSI (1.4 - 2.4 Bar)",
      bestFor: ["Kroma Edge Mirror Chrome (small parts/scale models)", "Airbrush murals", "Pearls & effects", "Flake King 500 dry gun host"],
      viscosityNotes: "Standard airbrush workhorse. Kroma Edge sprays through 0.3-0.5mm @ 25-45 PSI for small components."
    },
    mini_spraygun: {
      name: "Spot & Touch-Up Mini Spray Gun (0.8mm - 1.2mm Mini Gun)",
      needleRange: "0.8mm - 1.2mm",
      recommendedPsi: "15 - 22 PSI at gun inlet (1.0 - 1.5 Bar)",
      bestFor: ["Motorcycle tanks & helmets", "Kroma Edge Mirror Chrome (medium parts)", "Kroma Edge Dedicated Topcoat Clear", "Flake King 550 standalone gun"],
      viscosityNotes: "Ideal for motorcycle tins, helmets, and guitar bodies held in VsionAir jigs."
    },
    full_spraygun: {
      name: "Full Size HVLP / Compliant Spray Gun (1.3mm - 1.4mm)",
      needleRange: "1.3mm - 1.4mm",
      recommendedPsi: "26 - 29 PSI inlet (1.8 - 2.0 Bar)",
      bestFor: ["Complete car panels, roofs & hoods", "Kroma Edge Large Set (1260g)", "Kroma Edge Dedicated Topcoat Clear 3600 SET"],
      viscosityNotes: "For full automotive panels and high-volume clearcoat applications."
    }
  },

  reducersByTemp: [
    { maxTempC: 18, code: "KE-RED-FAST", name: "Fast Reducer", desc: "Cool weather application (10°C - 18°C / 50°F - 65°F). Accelerates flash off." },
    { maxTempC: 27, code: "KE-RED-MED", name: "Medium Reducer", desc: "Standard shop temperature (18°C - 27°C / 65°F - 80°F). Balanced flow & leveling." },
    { maxTempC: 35, code: "KE-RED-SLOW", name: "Slow Reducer", desc: "Warm shop temperature (27°C - 35°C / 80°F - 95°F). Prevents dry spray on large panels." },
    { maxTempC: 99, code: "KE-RED-RET", name: "High-Temp Retarder", desc: "High heat (>35°C / >95°F) for maximum gloss & open time." }
  ],

  sampleKits: [
    {
      id: "kroma-edge-mirror-system",
      title: "Kroma Edge Self-Organization Mirror System Kit",
      description: "Official 4-component Self-Organization mirror chrome system with dedicated topcoat clear.",
      surface: "Motorcycle Gas Tanks, Fenders, Wheels & Guitars",
      steps: [
        "1. Substrate: Apply over cured primer/sealer or basecoat sanded with #600–#1000 grit. (A Gloss Black is NOT required!)",
        "2. Mix Ratio (5:5:2:2): Mix Binder (50g) + Reducer (50g), then add Hardener (20g) and Mirror Seeds Formula (20g).",
        "3. Application: Apply ONE continuous wet coat at >68°F (20°C). DO NOT apply mist coats or tack coats.",
        "4. Curing: Air cure for min 36 hours (or force dry 140°F for 1-2 hours after mirror forms).",
        "5. Topcoat: Apply Kroma Edge Dedicated Topcoat Clear (10:1 + 70-100% thinner) with fine mist tack coat, 5 min flash, then full wet coat."
      ],
      equipment: "Airbrush Ø 0.3-0.5mm @ 25-45 PSI (small parts) or Spray Gun Ø 0.6-1.4mm",
      items: [
        { sku: "KE-MIRROR-SYS", name: "Kroma Edge Mirror System 140g Set", priceUSD: 149.95, qty: 1 },
        { sku: "KE-TOPCOAT-CLR", name: "Kroma Edge Dedicated Topcoat Clear 180 Set", priceUSD: 89.95, qty: 1 }
      ]
    },
    {
      id: "flake-king-metalflake-special",
      title: "Flake King Pro Series Dry Flake Kit",
      description: "Complete dry metal flake application setup with interchangeable 500, 550, and 1000 gun assemblies.",
      surface: "Custom Choppers, Helmets, Skateboards & Bass Guitars",
      steps: [
        "1. Ground Coat: Apply color-matched base or sealer.",
        "2. Wet Binder: Spray wet intercoat clear or binder over the panel.",
        "3. Flake Application: Spray dry flake with Flake King 500/550/1000 gun directly into the wet binder at 10-15 PSI.",
        "4. Lock Down: Apply 2-3 coats of clear to bury flake edges, then block sand flat and topcoat."
      ],
      equipment: "Flake King 500 (Airbrush Attachment) / 550 (Mini Gun) / 1000 (Full-Size) @ 10-15 PSI",
      items: [
        { sku: "5060733580007-1", name: "Flake King Pro Series Kit", priceUSD: 208.33, qty: 1 },
        { sku: "show-krome-metal-flake-1", name: "Show Krome Metal Flake 100g", priceUSD: 33.63, qty: 1 }
      ]
    },
    {
      id: "vsionair-workstation-kit",
      title: "VsionAir Modular Workstation & Jig System",
      description: "Ergonomic hands-free positioning jig system for custom painting helmets, motorcycle tanks, and panels.",
      surface: "Helmets, Tanks, Fenders & Airbrush Art",
      steps: [
        "1. Mount: Secure the VsionAir base frame to your workbench or mobile stand.",
        "2. Attach: Click the appropriate 360° rotational jig (Helmet Jig, Tank Jig, or Wheel Jig) into the tool bar.",
        "3. Adjust: Set friction tension with VsionAir M6 wing knobs for effortless 360° rotation while painting.",
        "4. Paint: Spray evenly without touching wet edges or awkward handling angles."
      ],
      equipment: "VsionAir Frame + Rotational Helmet/Tank Jigs + Lighting Bar",
      items: [
        { sku: "VAX-JG-GLMSK", name: "VsionAir Goalie / Helmet Jig", priceUSD: 145.00, qty: 1 },
        { sku: "VAX-LCT-RIG-1500", name: "VAX Lighting & Tool Bar Rig 1.5m", priceUSD: 195.00, qty: 1 }
      ]
    }
  ]
};

export class MasterPainterAI {
  constructor(cartManager) {
    this.cartManager = cartManager;
    this.history = [];
  }

  /**
   * Evaluates shop ambient temperature and returns optimal reducer.
   */
  getOptimalReducer(tempCelsius = 21) {
    for (const r of KNOWLEDGE_BASE.reducersByTemp) {
      if (tempCelsius <= r.maxTempC) {
        return r;
      }
    }
    return KNOWLEDGE_BASE.reducersByTemp[KNOWLEDGE_BASE.reducersByTemp.length - 1];
  }

  /**
   * Matches spray equipment based on viscosity and surface.
   */
  getEquipmentMatch(paintType = "chrome", surfaceType = "helmet") {
    const paintLower = (paintType || "").toLowerCase();
    const surfaceLower = (surfaceType || "").toLowerCase();

    if (paintLower.includes("dry flake") || paintLower.includes("flake king") || paintLower.includes("flake") || surfaceLower.includes("flake")) {
      if (surfaceLower.includes("500") || surfaceLower.includes("airbrush")) {
        return {
          setup: "Flake King 500 Dry Flake Gun (Airbrush-Driven)",
          nozzle: "Standard Flake King Venturi Barrel (Push-Fit / Click Adapter Mount)",
          psi: "10 - 15 PSI (0.7 - 1.0 Bar)",
          notes: "The 500 connects directly onto the front of your airbrush via a precision push-fit / click-lock adapter, utilizing the airbrush trigger to drive airflow through the venturi dry barrel."
        };
      } else if (surfaceLower.includes("550") || surfaceLower.includes("handle") || surfaceLower.includes("mini")) {
        return {
          setup: "Flake King 550 Dry Flake Gun (Dedicated Handle & Trigger)",
          nozzle: "Standard Flake King Venturi Barrel (Dedicated Handle)",
          psi: "10 - 15 PSI (0.7 - 1.0 Bar)",
          notes: "The 550 shares the exact same venturi barrel as the 500, but comes equipped with its own dedicated blowgun handle and trigger with a direct 1/4\" air line connection (no airbrush needed)."
        };
      } else if (surfaceLower.includes("1000") || surfaceLower.includes(".025") || surfaceLower.includes("roof") || surfaceLower.includes("car") || surfaceLower.includes("large")) {
        return {
          setup: "Flake King 1000 Dry Flake Gun (Full-Size Dedicated Gun)",
          nozzle: "Large-Bore Venturi Delivery Barrel",
          psi: "15 - 20 PSI (1.0 - 1.4 Bar)",
          notes: "Designed for full vehicle panels (car roofs, hoods, full lowriders) and heavy .025\" flake volume where maximum surface area coverage is needed before the wet binder flashes."
        };
      } else {
        return {
          setup: "Flake King 500 / 550 Dry Flake Gun System",
          nozzle: "Standard Flake King Venturi Barrel",
          psi: "10 - 15 PSI (0.7 - 1.0 Bar)",
          notes: "The 500 and 550 use identical venturi barrels: choose the 500 to click directly onto your airbrush, or the 550 for a standalone handle and trigger. (For full roofs, use the Flake King 1000 at 15-20 PSI)."
        };
      }
    }

    if (paintLower.includes("kroma") || paintLower.includes("chrome")) {
      if (surfaceLower.includes("large") || surfaceLower.includes("roof") || surfaceLower.includes("hood") || surfaceLower.includes("car")) {
        return {
          setup: "Full Size HVLP Spray Gun (1.4mm - 2.0mm)",
          nozzle: "1.4mm - 2.0mm Fluid Nozzle",
          psi: "Per gun manufacturer spec (High Atomization)",
          notes: "Apply ONE continuous wet coat at >68°F (20°C). DO NOT apply mist or tack coats. Spray until mirror self-organizes."
        };
      } else if (surfaceLower.includes("tank") || surfaceLower.includes("helmet") || surfaceLower.includes("fender") || surfaceLower.includes("guitar")) {
        return {
          setup: "Spot / Mini Spray Gun (0.6mm - 1.4mm) or Precision Airbrush (0.5mm)",
          nozzle: "0.6mm - 1.2mm Mini Gun",
          psi: "18 - 24 PSI (1.2 - 1.6 Bar)",
          notes: "Ideal for motorcycle tins, helmets, and guitar bodies held in VsionAir jigs. Single wet pass, no flash off between passes."
        };
      } else {
        return {
          setup: "Airbrush (Ø 0.3mm - 0.5mm) or Mini Spray Gun",
          nozzle: "0.3mm - 0.5mm Airbrush",
          psi: "25 - 45 PSI (1.7 - 3.1 Bar)",
          notes: "For small parts, graphics, and models. Apply one continuous wet coat."
        };
      }
    }

    if (paintLower.includes("vsionair") || surfaceLower.includes("jig") || surfaceLower.includes("stand") || surfaceLower.includes("workstation")) {
      return {
        setup: "VsionAir Modular Workstation System",
        nozzle: "360° Rotational Quick-Release Mount",
        psi: "N/A (Holding / Workstation Rig)",
        notes: "Allows 360-degree rotation of motorcycle tanks, helmets, and panels without touching wet surfaces."
      };
    }

    return {
      setup: KNOWLEDGE_BASE.equipment.general_airbrush.name,
      nozzle: "0.35mm - 0.50mm",
      psi: "20 - 30 PSI (1.4 - 2.1 Bar)",
      notes: "Standard airbrush setup for store-carried custom coatings and Flake King airbrush adapters."
    };
  }

  /**
   * Intelligently resolves customer queries to specific catalog products
   */
  findCatalogMatch(query) {
    const q = (query || '').toLowerCase().trim();
    if (!q) return null;

    const specificAliases = [
      { keys: ['skateboard', 'skate board', 'skbd', 'deck jig'], id: 'va-312' },
      { keys: ['goalie', 'ice hockey', 'glmsk', 'goalie mask'], id: 'va-635' },
      { keys: ['motorcycle helmet jig', 'full face helmet jig', 'hlmt', 'helmet jig'], id: 'va-306' },
      { keys: ['tank rotisserie', 'mctnk', 'gas tank jig', 'tank jig'], id: 'va-304' },
      { keys: ['fender jig', 'mudguard jig', 'mcfdr'], id: 'va-302' },
      { keys: ['guitar jig', 'electric guitar jig', 'gtr'], id: 'va-297' },
      { keys: ['wheel jig', 'car wheel jig', 'whl'], id: 'va-308' },
      { keys: ['thermal mug', 'mug jig', 'tm jig'], id: 'va-310' },
      { keys: ['tri-stand', 'tri stand', 'tristand'], id: 'va-255' },
      { keys: ['desk mount clamp', 'dm2'], id: 'va-260' },
      { keys: ['desk mount', 'dm1'], id: 'va-256' },
      { keys: ['flake king 500', 'fk 500', 'fk500', 'airbrush attachment'], id: 'fk-2603' },
      { keys: ['flake king 550', 'fk 550', 'fk550', 'mini gun'], id: 'fk-1970' },
      { keys: ['flake king 1000', 'fk 1000', 'fk1000'], id: 'fk-2602' },
      { keys: ['pro series kit', 'flake king kit', 'pro series'], id: '5060733580007-1' },
      { keys: ['kroma edge mirror', 'mirror chrome system', 'mirror seeds'], id: 'kroma-mirror-chrome-system' },
      { keys: ['dedicated topcoat', 'kroma clear', 'topcoat clear'], id: 'kroma-dedicated-topcoat-clear' },
      { keys: ['surface binder', 'fk50 binder', 'fk50'], id: 'fk-2599' }
    ];

    for (const alias of specificAliases) {
      if (alias.keys.some(k => q.includes(k))) {
        const item = ECOM_CATALOG.find(p => p.id === alias.id);
        if (item) return item;
      }
    }

    const stopWords = new Set([
      'do', 'you', 'have', 'a', 'an', 'the', 'is', 'there', 'any', 'in', 'stock',
      'can', 'i', 'get', 'buy', 'sell', 'carry', 'looking', 'for', 'please', 'we',
      'of', 'and', 'or', 'what', 'which', 'about', 'with', 'on', 'your', 'store',
      'shop', 'website', 'item', 'product'
    ]);
    const tokens = q.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(t => t.length > 2 && !stopWords.has(t));
    if (tokens.length === 0) return null;

    let bestScore = 0;
    let bestProduct = null;

    for (const p of ECOM_CATALOG) {
      const pName = (p.name || '').toLowerCase();
      const pSku = (p.sku || '').toLowerCase();
      const pCat = (p.category || '').toLowerCase();
      
      let score = 0;
      for (const token of tokens) {
        if (pSku.includes(token)) score += 5;
        if (pName.includes(token)) score += 3;
        if (pCat.includes(token)) score += 2;
      }
      if (score > bestScore) {
        bestScore = score;
        bestProduct = p;
      }
    }

    return bestScore >= 4 ? bestProduct : null;
  }

  /**
   * Checks if query specifically names this target product
   */
  isSpecificProductQuery(q, matchedProduct) {
    if (!matchedProduct) return false;
    const cleanQ = q.toLowerCase();
    const cleanSku = (matchedProduct.sku || '').toLowerCase();

    if (cleanSku && cleanQ.includes(cleanSku)) return true;
    if (cleanQ.includes('skateboard') && matchedProduct.id === 'va-312') return true;
    if (cleanQ.includes('goalie') && matchedProduct.id === 'va-635') return true;
    if (cleanQ.includes('tank jig') && matchedProduct.id === 'va-304') return true;
    if (cleanQ.includes('fender jig') && matchedProduct.id === 'va-302') return true;
    if (cleanQ.includes('guitar jig') && matchedProduct.id === 'va-297') return true;
    if (cleanQ.includes('wheel jig') && matchedProduct.id === 'va-308') return true;
    if (cleanQ.includes('mug jig') && matchedProduct.id === 'va-310') return true;
    if (cleanQ.includes('tri-stand') && matchedProduct.id === 'va-255') return true;
    if (cleanQ.includes('desk mount') && (matchedProduct.id === 'va-256' || matchedProduct.id === 'va-260')) return true;
    if (cleanQ.includes('500') && matchedProduct.id === 'fk-2603') return true;
    if (cleanQ.includes('550') && matchedProduct.id === 'fk-1970') return true;
    if (cleanQ.includes('1000') && matchedProduct.id === 'fk-2602') return true;

    return false;
  }

  /**
   * Generates a direct Yes affirmation with product details and link
   */
  generateDirectProductResponse(userQuery, matchedProduct, shopTempC, optimalReducer, q) {
    const priceGbpStr = matchedProduct.priceGbp ? `£${Number(matchedProduct.priceGbp).toFixed(2)}` : '';
    const priceEurStr = matchedProduct.priceEur ? `€${Number(matchedProduct.priceEur).toFixed(2)}` : '';
    const priceDisplay = [priceGbpStr, priceEurStr].filter(Boolean).join(' / ') || 'Consult Store';
    const stockStatus = matchedProduct.inStock ? "In Stock (Ready to dispatch from UK warehouse)" : (matchedProduct.isPreOrder ? "Batch 1 Pre-Order Allocation" : "Available to Order");
    const cleanShortName = matchedProduct.name.replace(/\(.*?\)/g, '').trim();

    let responseText = `### ✅ Yes, we do!\n\n` +
      `We carry the **${matchedProduct.name}** on our store.\n\n` +
      `• **SKU**: \`${matchedProduct.sku || matchedProduct.id}\`\n` +
      `• **Price**: **${priceDisplay}**\n` +
      `• **Availability**: **${stockStatus}**\n\n`;

    if (matchedProduct.id === 'va-312') {
      responseText += `• **Key Advantages for Skateboard Decks**:\n` +
        `  - **360° Hands-Free Rotation**: Securely clamp your deck and lock it at any working angle so you can paint edges, top, and bottom without touching wet clear.\n` +
        `  - **Full Process Coverage**: Engineered for surface prep, priming, sanding, basecoating, metal flaking, airbrush artwork, leafing, pinstriping, and clear coating.\n` +
        `  - **Universal Stand Fit**: Clicks right into both the **VsionAir Tri-Stand** and **Desk Mount Stand**.\n\n`;
    } else if (matchedProduct.id === 'va-635') {
      responseText += `• **Key Advantages for Goalie Masks**:\n` +
        `  - **360° Multi-Axis Positioning**: Rotate and lock your mask into any position for effortless spraying from crown to chin.\n` +
        `  - **Magnetic Backplate Extension**: Features a dedicated VFrame extension with Neodymium magnet mount to align rear headplate graphics seamlessly.\n` +
        `  - **Universal Stand Fit**: Mounts into both the VsionAir Tri-Stand and Desk Mount Stand.\n\n`;
    } else if (matchedProduct.id === 'va-304') {
      responseText += `• **Key Advantages for Motorcycle Tanks**:\n` +
        `  - **360° Rotisserie Action**: Smoothly spins fuel tanks around their center of balance so you can coat underside seams and topside in one wet pass.\n` +
        `  - **Expandable Gripper Bungs**: Universal rubber expanders fit chopper, cafe racer, and sportbike tanks.\n\n`;
    } else if (matchedProduct.id === 'fk-2603') {
      responseText += `• **Key Flake King 500 Features**:\n` +
        `  - **Airbrush Push-Fit Mount**: Mounts directly to the front of your airbrush and uses airbrush airflow to spray dry flake into wet clear.\n` +
        `  - **Zero Gun Clogs**: Eliminates flakes from clogging your paint gun fluid passages.\n\n`;
    } else if (matchedProduct.description) {
      const cleanDesc = matchedProduct.description.split('\n')[0].replace(/\r/g, '');
      if (cleanDesc) {
        responseText += `• **Product Overview**: ${cleanDesc}\n\n`;
      }
    }

    responseText += `👉 **[View ${cleanShortName} & Order Now](#${matchedProduct.id})**`;

    const result = {
      timestamp: new Date().toISOString(),
      userQuery: userQuery,
      shopTempC: shopTempC,
      optimalReducer: optimalReducer,
      detectedSubstrate: null,
      equipmentAdvice: this.getEquipmentMatch(matchedProduct.brand || "vsionair", q),
      matchedProduct: matchedProduct,
      kit: {
        title: matchedProduct.name,
        items: [{
          sku: matchedProduct.sku || matchedProduct.id,
          name: matchedProduct.name,
          priceUSD: matchedProduct.priceEur || matchedProduct.priceGbp || 50,
          qty: 1
        }]
      },
      markdownResponse: responseText
    };

    this.history.push(result);
    return result;
  }

  /**
   * Generates a polite No response for uncarried items with available scope
   */
  generateUnavailableProductResponse(userQuery, shopTempC, optimalReducer) {
    const notFoundText = `### ℹ️ Not Currently Carried\n\n` +
      `**No, we do not currently carry that item.**\n\n` +
      `Coast Airbrush Europe specializes strictly in our 3 core professional systems:\n` +
      `1. 🪞 **Kroma Edge Mirror Chrome**: 5:5:2:2 self-organizing mirror system & 10:1 dedicated topcoat clears.\n` +
      `2. ✨ **Flake King Dry Systems**: 500, 550, 1000 dry metal flake guns, polyester flakes (.002″ to .060″), FK50 binders & precision tapes.\n` +
      `3. 🛠️ **VsionAir Modular Workstations**: 360° rotational jigs (Skateboard, Helmet, Motorcycle Tank/Fender, Guitar, Wheel) & rigs.\n\n` +
      `*Looking for a specific jig or paint setup? Let me know what you're working on and I'll recommend the closest match!*`;

    const result = {
      timestamp: new Date().toISOString(),
      userQuery: userQuery,
      shopTempC: shopTempC,
      optimalReducer: optimalReducer,
      detectedSubstrate: null,
      equipmentAdvice: null,
      matchedProduct: null,
      kit: null,
      markdownResponse: notFoundText
    };

    this.history.push(result);
    return result;
  }

  /**
   * Main query parser & intelligent advisor engine.
   * Strictly scopes responses to products listed in the website catalog:
   * 1. Kroma Edge (Mirror Chrome & Dedicated Topcoats)
   * 2. Flake King (Dry Flake Guns, Flakes & Precision Tapes)
   * 3. VsionAir (Modular Workstations, Jigs & Rigs)
   */
  consult(userQuery, shopTempC = 22) {
    const q = (userQuery || "").toLowerCase();
    const optimalReducer = this.getOptimalReducer(shopTempC);

    // Check query types
    const isCatalogScopeQuery = q.includes("product") || q.includes("catalog") || q.includes("store") || q.includes("website") || q.includes("what do you sell") || q.includes("available") || q.includes("brand") || q.includes("scope");
    const isCoverageQuery = q.includes("coverage") || q.includes("how much") || q.includes("how many") || q.includes("how far") || q.includes("how big") || q.includes("100g") || q.includes("140g") || q.includes("420g") || q.includes("1260g") || q.includes("2520g") || q.includes("10080g") || q.includes("30g") || q.includes("sq ft") || q.includes("square");
    const isChromeQuery = q.includes("kroma") || q.includes("krome") || q.includes("kromedge") || q.includes("kromaedge") || q.includes("kromeedge") || (q.includes("chrome") && !q.includes("prep chrome"));
    const isFlakeQuery = q.includes("flake") || q.includes("glitter") || q.includes("flake king") || q.includes("500") || q.includes("550") || q.includes("1000") || q.includes("1050") || q.includes(".025") || q.includes(".015") || q.includes(".008") || q.includes(".002") || q.includes(".040") || q.includes(".060") || q.includes("corroded") || q.includes("patina");
    const isVsionAirQuery = q.includes("vsion") || q.includes("vsionair") || q.includes("jig") || q.includes("workstation") || q.includes("stand") || q.includes("rig") || q.includes("easel") || q.includes("holder") || q.includes("mount") || q.includes("rotat");
    const isEquipmentQuery = q.includes("needle") || q.includes("psi") || q.includes("pressure") || q.includes("which gun") || q.includes("what gun") || q.includes("airbrush") || q.includes("iwata") || q.includes("difference between");
    const isSubstrateQuery = q.includes("aluminum") || q.includes("aluminium") || q.includes("steel") || q.includes("bare metal") || q.includes("plastic") || q.includes("abs") || q.includes("fiberglass") || q.includes("gelcoat") || q.includes("carbon") || (q.includes("chrome") && q.includes("prep")) || q.includes("existing paint") || q.includes("oem");

    const isFisheyeQuery = q.includes("fisheye") || q.includes("fish eye") || q.includes("solvent pop") || q.includes("pinhole");
    const isCloudyQuery = (q.includes("cloudy") || q.includes("haze") || q.includes("gray") || q.includes("loss of reflection")) && !q.includes("how much");
    const isPreorderTimelineQuery = q.includes("timeline") || q.includes("pre-order allocation") || q.includes("preorder allocation") || q.includes("batch 1") || q.includes("when will it dispatch") || q.includes("how does pre-order");

    // 0A. Fisheye & Solvent Pop Troubleshooting Guide
    if (isFisheyeQuery) {
      const fisheyeResponse = `### 🛡️ DAiVE Troubleshooting: **Preventing Fisheyes & Solvent Pop**\n\n` +
        `Fisheyes and pinholes in custom automotive coatings almost always stem from 3 preventable variables:\n\n` +
        `1. **Oil / Moisture in Airline (Most Common)**:\n` +
        `   • Install a dedicated desiccant filter & water separator directly at your gun handle.\n` +
        `   • Purge airline daily; never use shop airlines shared with pneumatic oilers/impact wrenches.\n\n` +
        `2. **Improper Degreasing / Cleaner Contamination**:\n` +
        `   • **Rule**: Degrease with **Silicone Remover or Pure Isopropyl Alcohol (IPA) ONLY**.\n` +
        `   • Never wipe surfaces with aggressive lacquer thinner, acetone, or silicone-based detailing sprays prior to spraying.\n` +
        `   • Use the two-cloth method: 1 wet cloth to wipe on, 1 clean microfiber to dry immediately before evaporation.\n\n` +
        `3. **Spraying Too Cold (<20°C / 68°F) or Mist-Coating Kroma Edge**:\n` +
        `   • Kroma Edge **MUST be sprayed at ≥20°C (68°F)**. In cold booths, slow solvent evaporation traps gas under the film.\n` +
        `   • **Never apply mist or tack coats of Kroma Edge**! Apply **ONE continuous wet coat** with generous overlap.\n\n` +
        `*Need booth advice for your specific compressor or temperature? Let me know your shop setup!*`;

      const result = {
        timestamp: new Date().toISOString(),
        userQuery: userQuery,
        shopTempC: shopTempC,
        optimalReducer: optimalReducer,
        detectedSubstrate: null,
        equipmentAdvice: null,
        kit: KNOWLEDGE_BASE.sampleKits[0],
        markdownResponse: fisheyeResponse
      };
      this.history.push(result);
      return result;
    }

    // 0B. Chrome Clouding & Haze Troubleshooting Guide
    if (isCloudyQuery) {
      const hazeResponse = `### ✨ DAiVE Troubleshooting: **Eliminating Chrome Cloudiness & Haze**\n\n` +
        `To achieve true **99.4% specular liquid reflection** with Kroma Edge without gray clouding, follow these strict rules:\n\n` +
        `1. **Apply ONE Continuous Wet Coat (Never Multiple Light Passes)**:\n` +
        `   • Kroma Edge relies on **Self-Organization Technology**—metallic nano-platelets rise and align on the liquid surface.\n` +
        `   • If you mist or spray dry passes, the platelets freeze in random angular orientations, creating a dull, cloudy gray finish.\n\n` +
        `2. **Use ONLY Kroma Edge Dedicated Topcoat Clear**:\n` +
        `   • Standard automotive 2K clears contain aggressive solvents that re-dissolve the mirror resin and collapse platelet alignment.\n` +
        `   • Kroma Edge Dedicated Topcoat Clear is specially formulated with low turbidity.\n` +
        `   • **Ratio**: \`10 : 1\` (Clear Base : Hardener) + **70%–100% Dedicated Thinner**.\n\n` +
        `3. **Correct Clear Application Method**:\n` +
        `   • Coat 1: Super-fine mist / tack coat. Allow **5 minutes flash interval**.\n` +
        `   • Coat 2: Full wet coat with good flow. *(Note: May appear slightly hazy when freshly cleared; full mirror clarity restores as solvents flash off!).*\n\n` +
        `4. **Allow Full 36h Cure Before Clear**:\n` +
        `   • Air cure for a minimum of 36 hours at room temperature, or force-cure at 60°C for 1–2 hours after the mirror has formed.`;

      const result = {
        timestamp: new Date().toISOString(),
        userQuery: userQuery,
        shopTempC: shopTempC,
        optimalReducer: optimalReducer,
        detectedSubstrate: null,
        equipmentAdvice: null,
        kit: KNOWLEDGE_BASE.sampleKits[0],
        markdownResponse: hazeResponse
      };
      this.history.push(result);
      return result;
    }

    // 0C. Pre-Order Allocation & Delivery Timeline Guide
    if (isPreorderTimelineQuery) {
      const preorderResponse = `### 📦 European Pre-Order Allocation & Delivery Timeline\n\n` +
        `To ensure guaranteed manufacturing runs directly from **Signal Japan** at 0% REX tariff and maintain our zero-debt organic growth model, Kroma Edge is released in dedicated allocations:\n\n` +
        `• **Batch 1 Allocation**: **500 Complete Kits Total** (Currently **78% Reserved / 110 Units Left**).\n` +
        `• **Target Dispatch Date**: **October 2026**.\n` +
        `• **How it works**:\n` +
        `  1. Your 100% upfront pre-order secures your serialized kit from the ocean production run.\n` +
        `  2. Automated milestone alerts notify you when production completes in Japan, when the container clears Rotterdam, and when your APC/DHL tracking number generates.\n` +
        `  3. **Backer Bonus**: Pre-order customers unlock **15% OFF all in-stock Flake King guns and flakes** with free combined shipping!\n\n` +
        `• **Flake King Products**: 100% in stock right now in the UK warehouse, dispatched same-day via APC Overnight.\n\n` +
        `*Click below to lock in your Batch 1 Kroma Edge kit before allocation caps close!*`;

      const result = {
        timestamp: new Date().toISOString(),
        userQuery: userQuery,
        shopTempC: shopTempC,
        optimalReducer: optimalReducer,
        detectedSubstrate: null,
        equipmentAdvice: null,
        kit: KNOWLEDGE_BASE.sampleKits[0],
        markdownResponse: preorderResponse
      };
      this.history.push(result);
      return result;
    }

    // Check if user is asking for product availability or asking "do you have / sell / carry"
    const isAvailabilityQuery = 
      q.includes("do you have") || 
      q.includes("do you carry") || 
      q.includes("do you sell") || 
      q.includes("can i get") || 
      q.includes("can i buy") || 
      q.includes("is there a") || 
      q.includes("are there any") || 
      q.includes("have you got") || 
      q.includes("looking for") || 
      q.includes("in stock") || 
      q.includes("where can i find") || 
      q.includes("how much is") || 
      q.includes("price of") ||
      q.includes("cost of");

    // 0D. Direct Product Availability & Catalog Lookup
    const matchedProduct = this.findCatalogMatch(q);
    if (matchedProduct && (isAvailabilityQuery || this.isSpecificProductQuery(q, matchedProduct))) {
      return this.generateDirectProductResponse(userQuery, matchedProduct, shopTempC, optimalReducer, q);
    }

    if (isAvailabilityQuery && !matchedProduct && !isCatalogScopeQuery && !isCoverageQuery && !isChromeQuery && !isFlakeQuery && !isVsionAirQuery) {
      return this.generateUnavailableProductResponse(userQuery, shopTempC, optimalReducer);
    }

    // 1. Catalog Scope Query (explaining exactly what products DAiVE handles)
    if (isCatalogScopeQuery && !isChromeQuery && !isFlakeQuery && !isVsionAirQuery) {
      let catalogScopeResponse = `### 📋 Coast Airbrush Europe: **Official Product Lines & Support Scope**\n\n` +
        `DAiVE provides technical support, mixing ratios, application specs, and support scope for the 3 core product lines carried on our store:\n\n` +
        `1. 🪞 **Kroma Edge Mirror Chrome & Topcoats**\n` +
        `   • *Kroma Edge Self-Organizing Mirror Chrome System* (\`140g\`, \`420g\`, \`1260g\`, \`2520g\`, \`10080g\` sets)\n` +
        `   • *Kroma Edge Dedicated Topcoat Clear System* (\`180 SET\`, \`900 SET\`, \`3600 SET\`)\n` +
        `   • Self-organizing 5:5:2:2 ratio, 1 continuous wet coat, no gloss black required.\n\n` +
        `2. ✨ **Flake King Dry Flake Guns, Glitter & Precision Tapes**\n` +
        `   • *Flake King Guns*: Flake King 500 (airbrush mount), 550 (mini gun), 1000 / 1050 (full-size), and Pro Series Kit.\n` +
        `   • *Flakes*: Show Krome, Holographic & Master Polyester Flakes in .002″, .004″, .008″, .015″, .025″, .040″, .060″.\n` +
        `   • *Precision Tapes & Binders*: FK50 Surface Binder (500ml), Fine Line Masking Tapes (Green, Orange, Flat Line, Crepe).\n\n` +
        `3. 🛠️ **VsionAir Modular Workstations & Jigs**\n` +
        `   • *Hands-Free Positioning Jigs*: Helmet Jigs (Goalie Mask & Full Face), Motorcycle Tank & Fender Jigs, Canvass Jigs, Guitar Jigs, and Wheel Jigs.\n` +
        `   • *Modular Rigging*: Workstation Frames, Tool Bars, Lighting Rigs, and Knobs/Fasteners for 360° rotation while painting.\n\n` +
        `*Select any product above or ask a technical question to get exact specs and 1-click cart kits!*`;

      const consultationResult = {
        timestamp: new Date().toISOString(),
        userQuery: userQuery,
        shopTempC: shopTempC,
        optimalReducer: optimalReducer,
        detectedSubstrate: null,
        equipmentAdvice: null,
        kit: KNOWLEDGE_BASE.sampleKits[0],
        markdownResponse: catalogScopeResponse
      };
      this.history.push(consultationResult);
      return consultationResult;
    }

    // 2. Check Coverage / Quantity questions for website products
    if (isCoverageQuery) {
      let coverageDetails = "";
      let matchedKit = null;

      if (isChromeQuery || q.includes("140") || q.includes("420") || q.includes("1260") || q.includes("2520") || q.includes("10080")) {
        matchedKit = KNOWLEDGE_BASE.sampleKits[0];
        coverageDetails = `### 🌟 Kroma Edge Mirror System: **Coverage & Kit Yield**\n\n` +
          `**Official TDS Benchmark**: **1 fl oz of mixed KromaEdge covers 2 sq ft** (\`0.5 fl oz per sq ft\`).\n` +
          `Applied as **ONE continuous wet coat** (target film thickness: \`25 ± 5 µm\` / 1 mil) with **no mist/tack coats**.\n\n` +
          `• **140g Small Set (5 fl oz mixed / 147 mL)**:\n` +
          `  - **Coverage**: **7–10 sq ft** (\`~0.5–0.93 m²\`).\n` +
          `  - **Ideal For**: **1 full motorcycle gas tank** (~6 sq ft with reserve) OR **1 electric guitar body** OR **2 racing helmets**.\n` +
          `  - **Matching Clear**: Pairs with **Topcoat Clear 180 SET** (\`378g\` mixed).\n\n` +
          `• **420g Medium Set (15 fl oz mixed / 440 mL)**:\n` +
          `  - **Coverage**: **22–30 sq ft** (\`~1.5–2.8 m²\`).\n` +
          `  - **Ideal For**: Complete custom motorcycle tins (tank, front & rear fenders, side covers) or multiple projects.\n` +
          `  - **Matching Clear**: Pairs with **Topcoat Clear 900 SET** (\`1,890g\` mixed).\n\n` +
          `• **1260g Large Production Set (45 fl oz mixed / 1.32 L)**:\n` +
          `  - **Coverage**: **68–90 sq ft** (\`~4.0–8.4 m²\`).\n` +
          `  - **Ideal For**: Full automotive hoods, roofs, lowrider panels, or commercial batch production.\n` +
          `  - **Matching Clear**: Pairs with **Topcoat Clear 3600 SET** (\`7,560g\` mixed).\n\n` +
          `• **2520g Extra Large Set (90 fl oz mixed / 2.65 L)**:\n` +
          `  - **Coverage**: **135–180 sq ft** (\`~8.0–16.7 m²\`).\n` +
          `  - **Ideal For**: Complete car bodies, automotive sides/shells, or fleet production batches.\n` +
          `  - **Matching Clear**: Pairs with **Topcoat Clear 3600 SET** (x1–x2).\n\n` +
          `• **10080g Ultra Large Industrial Set (360 fl oz mixed / 10.6 L)**:\n` +
          `  - **Coverage**: **500–700 sq ft** (\`~32–65 m²\`).\n` +
          `  - **Ideal For**: Full architectural installations, OEM manufacturing, boat hulls, or mass production lines.\n` +
          `  - **Matching Clear**: Pairs with multiple **Topcoat Clear 3600 SETs**.\n\n` +
          `*(Tip: Gloss black is NOT required! Spray directly over cured sealer or base sanded with #600–#1000 grit.)*`;
      } else if (isFlakeQuery) {
        const is025 = q.includes(".025");
        const is008 = q.includes(".008");
        const is002 = q.includes(".002");
        const sizeLabel = is025 ? '.025" Large Hex Flake' : is008 ? '.008" Micro Hex Flake' : is002 ? '.002" Ultra-Small Flake' : '.015" Medium Hex Flake';

        matchedKit = KNOWLEDGE_BASE.sampleKits[1];
        coverageDetails = `### 📐 Flake King Flake Coverage Calculation: **100g Jar (${sizeLabel})**\n\n` +
          `When applied dry with a Flake King 500 / 550 / 1000 gun over wet intercoat clear/binder:\n\n` +
          `• **Solid / Full Coverage (Edge-to-Edge)**: **~12 – 16 sq ft** (~1.1 – 1.5 m²).\n` +
          `  *Covers: 1 large motorcycle gas tank + set of front/rear fenders, or 3-4 full face helmets.*\n` +
          `• **Medium / Graphic Panel Infill**: **~25 – 35 sq ft** (~2.3 – 3.2 m²).\n` +
          `  *Covers graphic panels, flames, lace patterns, or chopper tins with base color showing through.*\n` +
          `• **Light Dusting / Pearl-Style Accent**: **~60+ sq ft**.\n\n` +
          `*Note: Large .025" flake has fewer flakes per gram than .008" micro flake, so edge-to-edge solid coverage consumes ~100g per 12-14 sq ft.*`;
      } else {
        coverageDetails = `### 📐 Store Product Coverage Guide\n\n` +
          `• **Kroma Edge Chrome (140g Set)**: Covers **10 sq ft** (1 tank or 2 helmets).\n` +
          `• **Kroma Edge Chrome (420g Set)**: Covers **30 sq ft** (Full motorcycle tins).\n` +
          `• **Flake King 100g Jar (.015 Flake)**: Covers **12–16 sq ft** full solid dry flake or **35 sq ft** panel infill.\n` +
          `• **Kroma Dedicated Clear (180 SET)**: Covers **~16 sq ft** (1.5 m²).\n` +
          `• **Kroma Dedicated Clear (900 SET)**: Covers **~65 sq ft** (6.0 m²).`;
      }

      const consultationResult = {
        timestamp: new Date().toISOString(),
        userQuery: userQuery,
        shopTempC: shopTempC,
        optimalReducer: optimalReducer,
        detectedSubstrate: null,
        equipmentAdvice: null,
        kit: matchedKit,
        markdownResponse: coverageDetails
      };
      this.history.push(consultationResult);
      return consultationResult;
    }

    // 3. Check Kroma Edge specific questions
    if (isChromeQuery) {
      let chromeTdsResponse = `### 🌟 KROMA EDGE — Beyond Reflection (Official TDS)\n\n` +
        `Kroma Edge utilizes **Self-Organization Technology**, where metallic particles rise to the surface of the wet film and align uniformly without plating or polishing.\n\n` +
        `• **Mixing Ratio (by Weight / Parts)**: \`5 : 5 : 2 : 2\`\n` +
        `  - **Binder (Resin)**: 50 g\n` +
        `  - **Reducer / Thinner**: 50 g *(Mix Binder & Reducer 1:1 first)*\n` +
        `  - **Hardener**: 20 g\n` +
        `  - **Mirror Seeds Formula (Metallic Filler)**: 20 g *(Shake well before mixing)*\n\n` +
        `• **Crucial Application Rules**:\n` +
        `  - **Coverage Benchmark**: **1 fl oz mixed covers 2 sq ft** (\`140g / 5oz set = 10 sq ft\`).\n` +
        `  - **MUST apply ONE continuous wet coat** at >68°F (20°C). Film must remain wet until spraying is done.\n` +
        `  - **DO NOT apply mist coats or tack coats** (will cause pinholes or loss of reflectivity).\n` +
        `  - **Gloss black is NOT required!** Apply over cured primer/sealer or basecoat sanded with #600–#1000 grit.\n` +
        `  - **Max film thickness**: 40 µm (target: 25 ± 5 µm / 1 mil).\n\n` +
        `• **Curing & Dedicated Topcoat Clear**:\n` +
        `  - Air cure minimum **36 hours** at room temp, or force cure **140°F (60°C) for 1–2 hours** after mirror forms.\n` +
        `  - **Dedicated Topcoat Clear Ratio**: \`10 : 1\` (Clear Base : Hardener) + **70%–100% Thinner**.\n` +
        `  - Apply fine mist tack coat, flash 5 minutes, then apply full wet coat.`;

      const consultationResult = {
        timestamp: new Date().toISOString(),
        userQuery: userQuery,
        shopTempC: shopTempC,
        optimalReducer: optimalReducer,
        detectedSubstrate: null,
        equipmentAdvice: null,
        kit: KNOWLEDGE_BASE.sampleKits[0],
        markdownResponse: chromeTdsResponse
      };
      this.history.push(consultationResult);
      return consultationResult;
    }

    // 4. Check Flake King specific questions (Guns, Flakes, Masking Tapes)
    if (isFlakeQuery) {
      let flakeResponse = "";
      if (q.includes("corroded") || q.includes("patina") || q.includes("rust")) {
        flakeResponse = `### ℹ️ Flake King Product Notice: **Corroded Metal FX Discontinued**\n\n` +
          `Please note that the **Flake King Corroded Metal FX line** (including Vintage Iron, Corroded Coppa, Corrosion Activators, and Patina Kits) has been **officially discontinued** and is no longer manufactured.\n\n` +
          `• **Recommended Active Alternatives on Our Store**:\n` +
          `  - **Flake King Dry Metal Flakes**: 34+ vibrant colors in .002″ to .060″ for high-impact sparkle and custom metallic effects.\n` +
          `  - **Flake King Dry Guns**: Flake King 500, 550, 1000, 1050, and Pro Series Kit.\n` +
          `  - **FK50 Surface Binder**: Dedicated 500ml wet carrier to lock down dry flakes.\n` +
          `  - **Kroma Edge Mirror Chrome**: Spray-applied liquid mirror chrome for real metal reflection.\n\n` +
          `*Feel free to ask about our dry flake application guns, particle sizes, or masking tapes!*`;
      } else {
        const eq = this.getEquipmentMatch("dry flake", q);
        flakeResponse = `### ✨ Flake King Dry Metal Flake System (Official Store Guide)\n\n` +
          `Flake King dry guns spray dry glitter/flake directly onto a wet carrier/binder coat, eliminating gun clogging and uneven flake distribution.\n\n` +
          `• **Flake King Gun Lineup on Our Store**:\n` +
          `  - **Flake King 500**: Push-fit adapter connects directly to your airbrush front (driven by airbrush airflow).\n` +
          `  - **Flake King 550**: Same precision venturi barrel with dedicated handle, trigger, and 1/4" air connection.\n` +
          `  - **Flake King 1000 / 1050**: High-volume gun with large-bore barrel for car roofs, full bodies, and heavy .025" flake.\n` +
          `  - **Pro Series Kit**: Rugged flight case with components to assemble 500, 550, or 1000 configurations.\n\n` +
          `• **Operating Specs**:\n` +
          `  - **Air Pressure**: \`${eq.psi}\` (10 - 15 PSI for 500/550, 15 - 20 PSI for 1000)\n` +
          `  - **Technique**: Spray dry flake evenly over wet binder/intercoat clear; allow binder to grab flake; bury with 2-3 coats of clear; block sand flat.\n` +
          `  - **Flake Sizes Available**: .002″, .004″, .008″, .015″, .025″, .040″, .060″ in 30g, 100g, and 1kg jars.`;
      }

      const consultationResult = {
        timestamp: new Date().toISOString(),
        userQuery: userQuery,
        shopTempC: shopTempC,
        optimalReducer: optimalReducer,
        detectedSubstrate: null,
        equipmentAdvice: this.getEquipmentMatch("dry flake", q),
        kit: KNOWLEDGE_BASE.sampleKits[1],
        markdownResponse: flakeResponse
      };
      this.history.push(consultationResult);
      return consultationResult;
    }

    // 5. Check VsionAir Workstations & Jigs
    if (isVsionAirQuery) {
      let vsionResponse = `### 🛠️ VsionAir Modular Workstation & Jig Systems\n\n` +
        `VsionAir products provide professional, hands-free 360-degree rotational mounting so artists can spray without touching wet edges.\n\n` +
        `• **Positioning Jigs Available on Our Store**:\n` +
        `  - **Helmet Jigs**: [Ice Hockey Goalie Mask Jig (VAX-JG-GLMSK)](#va-635) • [Motorcycle Helmet Jig (VAX-JG-HLMT)](#va-306)\n` +
        `  - **Motorcycle Part Jigs**: [Tank Rotisserie Jig (VAX-JG-MCTNK)](#va-304) • [Fender Jig Set (VAX-JG-MCFDR)](#va-302)\n` +
        `  - **Specialty Jigs**: [Skateboard Deck Jig (VAX-JG-SKBD)](#va-312) • [Electric Guitar Jig (VAX-JG-GTR)](#va-297) • [Wheel Jig (VAX-Jg-WHL)](#va-308) • [Thermal Mug Jig (VAX-JG-TM)](#va-310)\n` +
        `  - **Stands & Rigging**: [VsionAir Tri-Stand (VAX-TRI)](#va-255) • [Desk Mount Clamp (VAX-DM1)](#va-256) • [Tool Bar Rig 1.2m (VAX-LCT-RIG-1200)](#va-284)\n\n` +
        `• **Key Setup Benefit**: Quick-release M6/M10 friction knobs allow smooth tilting and locked rotation during basecoat, flake, and clear passes.\n\n` +
        `*Click any jig above to open full specs, dimensions, and add directly to your cart!*`;

      const consultationResult = {
        timestamp: new Date().toISOString(),
        userQuery: userQuery,
        shopTempC: shopTempC,
        optimalReducer: optimalReducer,
        detectedSubstrate: null,
        equipmentAdvice: this.getEquipmentMatch("vsionair", q),
        kit: KNOWLEDGE_BASE.sampleKits[2],
        markdownResponse: vsionResponse
      };
      this.history.push(consultationResult);
      return consultationResult;
    }

    // 6. Check Substrate questions for our coatings
    let detectedSubstrate = null;
    if (q.includes("aluminum") || q.includes("aluminium")) detectedSubstrate = KNOWLEDGE_BASE.substrates.aluminum;
    else if (q.includes("steel") || q.includes("bare metal") || q.includes("iron")) detectedSubstrate = KNOWLEDGE_BASE.substrates.steel;
    else if (q.includes("plastic") || q.includes("abs") || q.includes("bumper") || q.includes("3d print")) detectedSubstrate = KNOWLEDGE_BASE.substrates.plastic;
    else if (q.includes("fiberglass") || q.includes("gelcoat") || q.includes("carbon")) detectedSubstrate = KNOWLEDGE_BASE.substrates.fiberglass;
    else if (q.includes("chrome")) detectedSubstrate = KNOWLEDGE_BASE.substrates.chrome;
    else if (q.includes("existing paint") || q.includes("oem") || q.includes("clearcoat")) detectedSubstrate = KNOWLEDGE_BASE.substrates.oem_paint;

    // 7. Check Equipment matching
    let equipmentAdvice = null;
    if (isEquipmentQuery) {
      let paint = "chrome";
      if (q.includes("flake") || q.includes(".025") || q.includes(".015") || q.includes(".008")) paint = "dry flake";
      if (q.includes("vsionair") || q.includes("jig")) paint = "vsionair";
      equipmentAdvice = this.getEquipmentMatch(paint, q);
    }

    // 8. Compose structured AI response
    let responseText = "";
    let actionKit = null;

    if (detectedSubstrate) {
      responseText += `### 🛠️ Substrate Preparation Protocol: **${detectedSubstrate.name}**\n\n`;
      detectedSubstrate.prepSteps.forEach(step => {
        responseText += `- ${step}\n`;
      });
      responseText += `\n**Recommended Groundcoat for Kroma Edge / Flake**: Sand substrate to \`#600–#1000 grit\` (Gloss black is NOT required for Kroma Edge).\n\n`;
    }

    if (equipmentAdvice) {
      responseText += `### 🎯 Spray Tool & Air Pressure Setup\n\n`;
      responseText += `- **Recommended Tool**: ${equipmentAdvice.setup}\n`;
      responseText += `- **Needle / Fluid Tip**: \`${equipmentAdvice.nozzle}\`\n`;
      responseText += `- **Operating Air Pressure**: \`${equipmentAdvice.psi}\`\n`;
      responseText += `- **Application Technique**: ${equipmentAdvice.notes}\n\n`;
    }

    // Include dynamic ambient temperature reducer advice if relevant
    if (q.includes("reducer") || q.includes("temp") || q.includes("temperature")) {
      responseText += `### 🌡️ Ambient Shop Temperature Reducer Guidance (${shopTempC}°C / ${Math.round(shopTempC * 1.8 + 32)}°F)\n\n`;
      responseText += `For your shop temperature of **${shopTempC}°C**, use **${optimalReducer.code} (${optimalReducer.name})**.\n*${optimalReducer.desc}*\n\n`;
    }

    if (!detectedSubstrate && !equipmentAdvice && !q.includes("reducer") && !q.includes("temp")) {
      // Focused store product advisory fallback
      responseText += `### 🎨 Coast Airbrush Product Advisory with DAiVE\n\n`;
      responseText += `I am calibrated specifically to help you with the products carried on our website:\n\n`;
      responseText += `- **🪞 Kroma Edge Mirror Chrome**: 5:5:2:2 Self-Organizing Mirror Chrome and 10:1 Dedicated Topcoat Clear.\n`;
      responseText += `- **✨ Flake King Systems**: Flake King 500, 550, 1000 dry flake guns, polyester flakes (.002–.060), FK50 Binders & Precision Tapes.\n`;
      responseText += `- **🛠️ VsionAir Workstations**: 360° rotational helmet, tank, fender, and guitar positioning jigs & rigs.\n\n`;
      responseText += `*Ask me about mixing ratios, temperature reducers, nozzle sizes, PSI, or substrate preparation for any of these products!*`;
      actionKit = KNOWLEDGE_BASE.sampleKits[0];
    } else {
      actionKit = detectedSubstrate ? KNOWLEDGE_BASE.sampleKits[0] : KNOWLEDGE_BASE.sampleKits[1];
    }

    const consultationResult = {
      timestamp: new Date().toISOString(),
      userQuery: userQuery,
      shopTempC: shopTempC,
      optimalReducer: optimalReducer,
      detectedSubstrate: detectedSubstrate,
      equipmentAdvice: equipmentAdvice,
      kit: actionKit,
      markdownResponse: responseText
    };

    this.history.push(consultationResult);
    return consultationResult;
  }

  /**
   * One-click adds a complete formulation kit to the Shopify cart drawer.
   */
  addKitToShopifyCart(kit) {
    if (!kit || !kit.items) return { success: false, count: 0 };
    
    kit.items.forEach(item => {
      this.cartManager.addItem({
        sku: item.sku,
        name: item.name,
        containerLabel: item.sku.includes("-QT") ? "Quart" : item.sku.includes("-PT") ? "Pint" : "Each",
        quantity: item.qty || 1,
        unitPriceUSD: item.priceUSD,
        properties: {
          "Formulation Kit": kit.title,
          "Consulted by": "DAiVE (Coast Airbrush Technical Support)"
        }
      });
    });

    return {
      success: true,
      count: kit.items.length,
      totalUSD: kit.items.reduce((sum, i) => sum + (i.priceUSD * i.qty), 0)
    };
  }
}
