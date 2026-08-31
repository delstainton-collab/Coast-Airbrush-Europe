// Coast Airbrush Europe - Agent A: Technical Sales & Paint Advisor AI ("The Master Painter")

import { KROMA_EDGE_CATALOG } from '../data/kroma_edge.js';
import { recommendContainerPack } from './mixingEngine.js';

export const KNOWLEDGE_BASE = {
  substrates: {
    aluminum: {
      name: "Bare Aluminum",
      prepSteps: [
        "Degrease thoroughly with solvent wax & grease remover (Surface Klean).",
        "Scuff with 3M maroon/grey Scotch-Brite or sand with P320-P400 grit.",
        "Apply self-etching or direct-to-metal (DTM) epoxy primer (Kroma Edge DTM 2K Epoxy Series).",
        "Allow 60-90 min cure before applying basecoat or primer surfacer."
      ],
      recommendedPrimer: "Kroma Edge 2K DTM Epoxy Hybrid Primer (4:1)"
    },
    steel: {
      name: "Bare Steel / Metal",
      prepSteps: [
        "Clean surface with solvent degreaser.",
        "Sand to bare metal using P180-P240 grit dry, remove all oxidation/rust.",
        "Apply Kroma Edge DTS Hybrid Epoxy Primer (Direct to Substrate).",
        "Block sand with P400-P600 if leveling is required, then seal before basecoat."
      ],
      recommendedPrimer: "Kroma Edge DTS Hybrid Epoxy Primer / Sealer"
    },
    plastic: {
      name: "Raw Plastic / ABS / Polycarbonate",
      prepSteps: [
        "Wash with warm soapy water, then treat with anti-static plastic cleaner.",
        "Scuff thoroughly with grey ultra-fine Scotch-Brite pad.",
        "Apply universal adhesion promoter in 1 medium wet coat (5-10 min flash).",
        "Topcoat with Kroma Edge Jet Black Primer or direct basecoat within 30 minutes."
      ],
      recommendedPrimer: "Universal Adhesion Promoter + Kroma Edge Jet Black Primer"
    },
    fiberglass: {
      name: "Fiberglass / Gelcoat",
      prepSteps: [
        "Clean with solvent degreaser to remove mold release agents.",
        "Dry sand with P240-P320 grit to remove all gloss.",
        "Apply 2 coats of Kroma Edge Direct-to-Substrate Primer Surfacer to fill pinholes.",
        "Guide coat and block sand with P400 wet/dry before basecoat."
      ],
      recommendedPrimer: "Kroma Edge High-Build Surfacer (4:1)"
    },
    oem_paint: {
      name: "Existing OEM Paint / Clearcoat",
      prepSteps: [
        "Degrease with waterborne and solvent-borne surface cleaners.",
        "Uniformly scuff with P600-P800 grit wet paper or gold fine scuff pad (zero gloss spots).",
        "Apply Kroma Edge epoxy hybrid sealer.",
        "Flash 30 minutes, then apply basecoat directly."
      ],
      recommendedPrimer: "Kroma Edge Epoxy Sealer"
    },
    chrome: {
      name: "Chrome / Polished Metal",
      prepSteps: [
        "Chrome cannot be painted directly without mechanical keying or stripping.",
        "Sand blast with fine aluminum oxide or aggressively scuff with P180/P240.",
        "Apply 2 full wet coats of Adhesion Promoter followed immediately by Kroma Edge DTS Epoxy Primer."
      ],
      recommendedPrimer: "Adhesion Promoter + Kroma Edge DTS Primer"
    }
  },

  equipment: {
    micro_airbrush: {
      name: "Precision Micro Airbrush (0.18mm - 0.23mm Matched Head)",
      needleRange: "0.18mm - 0.23mm",
      recommendedPsi: "12 - 20 PSI (0.8 - 1.4 Bar)",
      bestFor: ["Ultra-fine hairline detail", "Portraits", "Precision shading & pinstriping shadow"],
      viscosityNotes: "Requires 100% reduction or pre-reduced illustration pigments. Never spray metallic or heavy flake through <0.3mm."
    },
    general_airbrush: {
      name: "General Custom Airbrush (0.35mm - 0.50mm Dual-Action)",
      needleRange: "0.35mm - 0.50mm",
      recommendedPsi: "20 - 35 PSI (1.4 - 2.4 Bar)",
      bestFor: ["Airbrush murals", "Solid/Metallic basecoats", "Pearls & effects", "Mini flake (<0.004)"],
      viscosityNotes: "Standard custom workhorse. Reduce basecoats appropriately for seamless atomization."
    },
    mini_spraygun: {
      name: "Spot & Touch-Up Mini Spray Gun (0.8mm - 1.2mm Mini Gun)",
      needleRange: "0.8mm - 1.2mm",
      recommendedPsi: "15 - 22 PSI at gun inlet (1.0 - 1.5 Bar)",
      bestFor: ["Motorcycle tanks & helmets", "Flake King wet flake", "Panel blends", "Spot clearcoating", "Liquid Chrome"],
      viscosityNotes: "Ideal for midcoats and liquid chrome application on bike parts and guitars. Fan pattern 5-15 cm."
    },
    full_spraygun: {
      name: "Full Size HVLP / Compliant Spray Gun (1.3mm - 1.4mm)",
      needleRange: "1.3mm - 1.4mm",
      recommendedPsi: "26 - 29 PSI inlet (1.8 - 2.0 Bar)",
      bestFor: ["Complete car & truck bodies", "Large bonnets/roofs", "2K Speed Clearcoat"],
      viscosityNotes: "For high solids clears and large surface area metallic bases. High CFM compressor required."
    }
  },

  reducersByTemp: [
    { maxTempC: 18, code: "KE-RED-FAST", name: "Fast Urethane Reducer", desc: "Cool weather application (10°C - 18°C / 50°F - 65°F). Accelerates flash off." },
    { maxTempC: 27, code: "KE-RED-MED", name: "Medium Urethane Reducer", desc: "Standard shop temperature (18°C - 27°C / 65°F - 80°F). Balanced flow & leveling." },
    { maxTempC: 35, code: "KE-RED-SLOW", name: "Slow Urethane Reducer", desc: "Warm shop temperature (27°C - 35°C / 80°F - 95°F). Prevents dry spray on large panels." },
    { maxTempC: 99, code: "KE-RED-RET", name: "High-Temp Retarder", desc: "High heat (>35°C / >95°F) or large multi-panel show cars for maximum gloss & open time." }
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
        { sku: "KE-CHROME-140G", name: "Kroma Edge Mirror System 140g Set", priceUSD: 149.95, qty: 1 },
        { sku: "KE-CLEAR-180SET", name: "Kroma Edge Dedicated Topcoat Clear 180 Set", priceUSD: 89.95, qty: 1 }
      ]
    },
    {
      id: "chameleon-pearl-helmet",
      title: "Kroma Edge Holographic / Chameleon Helmet Kit",
      description: "Hyper-shift color changing pearl over Jet Black ground coat for helmets & test panels.",
      surface: "Full Face Motorcycle Helmet (3.5 sq ft)",
      steps: [
        "1. Base Ground Coat: Kroma Edge Jet Black Primer (2 coats)",
        "2. Effect Layer: Kroma Edge Nebula Purple-to-Cyan Pearl in Binder (2 medium coats)",
        "3. Topcoat: Kroma Edge 2K Speed Clear (2 coats)"
      ],
      equipment: "Dual-Action Airbrush (0.35mm) or Mini Spray Gun (0.8mm) @ 22 PSI",
      items: [
        { sku: "KE-PRIMER-BLK", name: "Jet Black Mirror Gloss Primer (1L)", priceUSD: 54.95, qty: 1 },
        { sku: "KE-PEARL-NEB", name: "Kroma Edge Nebula Color-Shift Pearl 25g", priceUSD: 28.50, qty: 1 },
        { sku: "KE-CLEAR-1.5L", name: "Kroma Edge Speed Clearcoat Kit (1.5L)", priceUSD: 89.95, qty: 1 }
      ]
    },
    {
      id: "flake-king-metalflake-special",
      title: "Flake King 500 Gun + 5 Flake Custom Starter Kit",
      description: "Dry flake spray system setup with 5 best-selling 0.015\" hex flakes and custom intercoat clear.",
      surface: "Custom Choppers, Skateboards & Bass Guitars",
      steps: [
        "1. Base Coat: Jet Black or color-matched base",
        "2. Flake Application: Spray dry flake with Flake King 500 over wet intercoat clear",
        "3. Lock Down: 3 coats of binder / intercoat to bury flake edges",
        "4. Final Finish: Block sand flat with P600 and apply high-solids Show Clear"
      ],
      equipment: "Flake King 500 Dry Flake Gun (0.015\" and 0.008\" flakes) @ 25-30 PSI",
      items: [
        { sku: "FK-500-GUN", name: "Flake King 500 Dry Flake Spray Gun", priceUSD: 189.00, qty: 1 },
        { sku: "FK-MICRO-SILVER", name: "Flake King 0.015 Holographic Silver 100g", priceUSD: 24.00, qty: 1 },
        { sku: "FK-MICRO-GOLD", name: "Flake King 0.015 Aztec Gold 100g", priceUSD: 24.00, qty: 1 },
        { sku: "FK-MICRO-RED", name: "Flake King 0.015 Cherry Red 100g", priceUSD: 24.00, qty: 1 },
        { sku: "KE-CLEAR-1.5L", name: "Kroma Edge Speed Clearcoat Kit (1.5L)", priceUSD: 89.95, qty: 1 }
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
  getEquipmentMatch(paintType = "candy", surfaceType = "helmet") {
    const paintLower = (paintType || "").toLowerCase();
    const surfaceLower = (surfaceType || "").toLowerCase();

    if (paintLower.includes("dry flake") || paintLower.includes("flake king") || paintLower.includes("flake")) {
      if (surfaceLower.includes("500") || surfaceLower.includes("airbrush")) {
        return {
          setup: "Flake King 500 Dry Flake Gun (Airbrush-Driven)",
          nozzle: "Standard Flake King Venturi Barrel (Push-Fit / Click Adapter Mount)",
          psi: "10 - 15 PSI (0.7 - 1.0 Bar)",
          notes: "The 500 and 550 share the exact same venturi dry flake barrel. The 500 connects directly onto the front of your airbrush via a precision push-fit / click-lock adapter, utilizing the airbrush trigger to drive airflow."
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
          notes: "The 500 and 550 use identical venturi barrels: choose the 500 if you want to connect via push-fit / click adapter directly to your airbrush, or the 550 if you prefer a standalone dedicated handle and trigger. (For full vehicle roofs, use the larger Flake King 1000 at 15-20 PSI)."
        };
      }
    }

    if (paintLower.includes("clear") || surfaceLower.includes("car") || surfaceLower.includes("truck")) {
      return {
        setup: KNOWLEDGE_BASE.equipment.full_spraygun.name,
        nozzle: "1.3mm - 1.4mm",
        psi: "26 - 29 PSI (1.8 - 2.0 Bar)",
        notes: "Optimal atomization for high-solids polyurethane show clears without orange peel."
      };
    }

    if (surfaceLower.includes("helmet") || surfaceLower.includes("tank") || surfaceLower.includes("motorcycle") || paintLower.includes("candy") || paintLower.includes("pearl")) {
      return {
        setup: KNOWLEDGE_BASE.equipment.mini_spraygun.name,
        nozzle: "0.8mm - 1.0mm (or 0.5mm airbrush for fine graphics)",
        psi: "18 - 24 PSI (1.2 - 1.6 Bar)",
        notes: "Perfect for motorcycle parts and spot blending candy coats with seamless overlap."
      };
    }

    return {
      setup: KNOWLEDGE_BASE.equipment.general_airbrush.name,
      nozzle: "0.35mm - 0.50mm",
      psi: "20 - 30 PSI (1.4 - 2.1 Bar)",
      notes: "Standard airbrush setup for custom graphics and urethane basecoat application."
    };
  }

  /**
   * Main query parser & intelligent advisor engine.
   */
  consult(userQuery, shopTempC = 22) {
    const q = (userQuery || "").toLowerCase();
    const optimalReducer = this.getOptimalReducer(shopTempC);
    
    // 1. Check Coverage / Quantity questions (e.g. 140g KromaEdge kit, 100g jar of .025 flake, paint needed for motorcycle)
    const isCoverageQuery = q.includes("coverage") || q.includes("how much") || q.includes("how many") || q.includes("how far") || q.includes("how big") || q.includes("100g") || q.includes("140g") || q.includes("420g") || q.includes("1260g") || q.includes("30g") || q.includes("sq ft") || q.includes("square");
    const isChromeQuery = q.includes("kroma") || q.includes("krome") || q.includes("kromedge") || q.includes("kromaedge") || q.includes("kromeedge") || (q.includes("chrome") && !q.includes("prep chrome"));

    if (isCoverageQuery) {
      let coverageDetails = "";
      let matchedKit = null;

      if (isChromeQuery || q.includes("140") || q.includes("420") || q.includes("1260")) {
        // Kroma Edge Mirror System Coverage (Strict Benchmark: 1 oz mixed covers 2 sq ft)
        matchedKit = KNOWLEDGE_BASE.sampleKits[0];
        coverageDetails = `### 🌟 Kroma Edge Mirror System: **Coverage & Kit Yield**\n\n` +
          `**Standard Coverage Benchmark**: **1 fl oz of mixed KromaEdge covers 2 sq ft** (\`0.5 fl oz per sq ft\`).\n` +
          `Applied as **ONE continuous wet coat** (target film thickness: \`25 ± 5 µm\` / 1 mil) with **no mist/tack coats**.\n\n` +
          `• **140g Small Set (5 fl oz mixed / 147 mL)**:\n` +
          `  - **Coverage**: **10 sq ft** (\`~0.93 m²\`).\n` +
          `  - **Ideal For**: **1 full motorcycle gas tank** (~6 sq ft with reserve) OR **1 electric guitar body** OR **2 racing helmets**.\n` +
          `  - **Matching Clear**: Pairs with **Topcoat Clear 180 SET** (\`378g\` mixed).\n\n` +
          `• **420g Medium Set (15 fl oz mixed / 440 mL)**:\n` +
          `  - **Coverage**: **30 sq ft** (\`~2.8 m²\`).\n` +
          `  - **Ideal For**: Complete custom motorcycle tins (tank, front & rear fenders, side covers) or multiple projects.\n` +
          `  - **Matching Clear**: Pairs with **Topcoat Clear 900 SET** (\`1,890g\` mixed).\n\n` +
          `• **1260g Large Production Set (45 fl oz mixed / 1.32 L)**:\n` +
          `  - **Coverage**: **90 sq ft** (\`~8.4 m²\`).\n` +
          `  - **Ideal For**: Full automotive hoods, roofs, lowrider panels, or commercial production.\n` +
          `  - **Matching Clear**: Pairs with **Topcoat Clear 3600 SET** (\`7,560g\` mixed).\n\n` +
          `*(Tip: Gloss black is NOT required! Spray directly over cured sealer or base sanded with #600–#1000 grit.)*`;
      } else if (q.includes("flake") || q.includes(".025") || q.includes(".015") || q.includes(".008")) {
        const is025 = q.includes(".025");
        const is008 = q.includes(".008");
        const sizeLabel = is025 ? '.025" Large Hex Flake' : is008 ? '.008" Micro Hex Flake' : '.015" Medium Hex Flake';

        coverageDetails = `### 📐 Flake Coverage Calculation: **100g Jar (${sizeLabel})**\n\n` +
          `When applied dry with a Flake King gun over wet intercoat clear/binder:\n\n` +
          `• **Solid / Full Coverage (Edge-to-Edge)**: **~12 – 16 sq ft** (~1.1 – 1.5 m²).\n` +
          `  *Perfect for: 1 large motorcycle gas tank + set of front/rear fenders, or 3-4 full face helmets.*\n` +
          `• **Medium / Graphic Panel Infill**: **~25 – 35 sq ft** (~2.3 – 3.2 m²).\n` +
          `  *Covers graphic panels, flames, lace patterns, or chopper tins with base color showing through.*\n` +
          `• **Light Dusting / Pearl-Style Accent**: **~60+ sq ft**.\n\n` +
          `*Note: Large .025" flake has fewer flakes per gram than .008" micro flake, so edge-to-edge solid coverage consumes ~100g per 12-14 sq ft.*`;
      } else {
        coverageDetails = `### 📐 Custom Paint Surface Coverage Guidelines\n\n` +
          `• **1 Quart (946mL) Ready-to-Spray**: Covers **~75 – 100 sq ft** (2 medium wet coats).\n` +
          `• **Full Motorcycle (Tank + Fenders / 14 sq ft)**: Requires **~350mL – 500mL** RTS basecoat and **500mL** 2K clear.\n` +
          `• **Car Hood / Bonnet (22 sq ft)**: Requires **~650mL – 750mL** RTS basecoat.`;
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

    // 2. Check Kroma Edge specific questions
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
        `• **Curing & Topcoat Clear**:\n` +
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

    // 3. Check Substrate questions
    let detectedSubstrate = null;
    if (q.includes("aluminum") || q.includes("aluminium")) detectedSubstrate = KNOWLEDGE_BASE.substrates.aluminum;
    else if (q.includes("steel") || q.includes("bare metal") || q.includes("iron")) detectedSubstrate = KNOWLEDGE_BASE.substrates.steel;
    else if (q.includes("plastic") || q.includes("abs") || q.includes("bumper")) detectedSubstrate = KNOWLEDGE_BASE.substrates.plastic;
    else if (q.includes("fiberglass") || q.includes("gelcoat") || q.includes("carbon")) detectedSubstrate = KNOWLEDGE_BASE.substrates.fiberglass;
    else if (q.includes("chrome")) detectedSubstrate = KNOWLEDGE_BASE.substrates.chrome;
    else if (q.includes("existing paint") || q.includes("oem") || q.includes("clearcoat")) detectedSubstrate = KNOWLEDGE_BASE.substrates.oem_paint;

    // 3. Check Equipment matching (only when equipment/tool/PSI specifically requested)
    let equipmentAdvice = null;
    if (q.includes("needle") || q.includes("psi") || q.includes("pressure") || q.includes("which gun") || q.includes("what gun") || q.includes("airbrush") || q.includes("iwata") || q.includes("difference between")) {
      let paint = "candy";
      if (q.includes("flake") || q.includes(".025") || q.includes(".015") || q.includes(".008")) paint = "dry flake";
      if (q.includes("clear")) paint = "clear";
      if (q.includes("pearl")) paint = "pearl";
      equipmentAdvice = this.getEquipmentMatch(paint, q);
    }

    // 4. Check Pre-made Kit Match
    let matchedKit = null;
    if (q.includes("candy") || q.includes("apple red") || q.includes("kandy")) {
      matchedKit = KNOWLEDGE_BASE.sampleKits[0];
    } else if (q.includes("chameleon") || q.includes("shift") || q.includes("pearl") || q.includes("kroma")) {
      matchedKit = KNOWLEDGE_BASE.sampleKits[1];
    } else if (q.includes("kit") || q.includes("starter") || q.includes("bundle")) {
      matchedKit = KNOWLEDGE_BASE.sampleKits[2];
    }

    // Compose rich structured AI response
    let responseText = "";
    let actionKit = matchedKit;

    if (detectedSubstrate) {
      responseText += `### 🛠️ Substrate Preparation Protocol: **${detectedSubstrate.name}**\n\n`;
      detectedSubstrate.prepSteps.forEach(step => {
        responseText += `- ${step}\n`;
      });
      responseText += `\n**Recommended Primer/Sealer System**: \`${detectedSubstrate.recommendedPrimer}\`\n\n`;
    }

    if (equipmentAdvice) {
      responseText += `### 🎯 Spray Gun & Air Pressure Recommendation\n\n`;
      responseText += `- **Recommended Tool**: ${equipmentAdvice.setup}\n`;
      responseText += `- **Needle / Fluid Tip**: \`${equipmentAdvice.nozzle}\`\n`;
      responseText += `- **Operating Air Pressure**: \`${equipmentAdvice.psi}\`\n`;
      responseText += `- **Technique Tip**: ${equipmentAdvice.notes}\n\n`;
    }

    // Include dynamic ambient temperature reducer advice if relevant
    if (q.includes("reducer") || q.includes("temp") || q.includes("temperature") || (!detectedSubstrate && !equipmentAdvice)) {
      responseText += `### 🌡️ Ambient Shop Temperature Formula Advice (${shopTempC}°C / ${Math.round(shopTempC * 1.8 + 32)}°F)\n\n`;
      responseText += `For your current shop temperature of **${shopTempC}°C**, your optimal reducer is **${optimalReducer.code} (${optimalReducer.name})**.\n*${optimalReducer.desc}*\n\n`;
    }

    if (matchedKit) {
      responseText += `### 📦 Recommended Complete Formulation Kit: **${matchedKit.title}**\n\n`;
      responseText += `*${matchedKit.description}*\n\n`;
      responseText += `**Step-by-Step Application:**\n`;
      matchedKit.steps.forEach(s => { responseText += `- ${s}\n`; });
    } else if (!detectedSubstrate && !equipmentAdvice) {
      // General custom paint consultation
      responseText += `### 🎨 Custom Formulation & Tech Advisory\n\n`;
      responseText += `Here is the recommended professional formulation for **${userQuery}**:\n\n`;
      responseText += `- **Base Stage**: Apply 2 medium wet coats of Solid/Metallic Ground Coat (flash 10-15 min between coats).\n`;
      responseText += `- **Effect Stage**: Intercoat clear mixed with Kandy / Pearls (ratio 4:1:1 with ${optimalReducer.code}).\n`;
      responseText += `- **Final Clear**: 2K High Solids Show Clearcoat (2 full wet coats for deep gloss & UV protection).\n`;
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
          "Consulted by": "Agent A (Master Painter AI)"
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
