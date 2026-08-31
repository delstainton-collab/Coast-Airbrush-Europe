// Coast Airbrush Europe - Kroma Edge Technical Specifications & Exact Mixing Formulas
// Sourced directly from official Kroma Edge Technical Data Sheets & Instruction Manuals

export const KROMA_EDGE_TDS = {
  brand: "Kroma Edge",
  tagline: "Beyond Reflection",
  technology: "Self-Organization Technology (Metallic particles rise to surface and align uniformly without plating or polishing)",

  // 1. KROMA EDGE MIRROR SYSTEM (4-Component Chemical Mixture)
  mirrorSystem: {
    name: "Kroma Edge Mirror System",
    mixRatioByParts: "Binder : Reducer : Hardener : Mirror Seeds Formula = 5 : 5 : 2 : 2",
    mixingTip: "Mix Binder and Reducer 1:1 (50/50). Then mix your Reduced Binder at 5:1:1 with Hardener & Mirror Seeds.",
    mixingOrder: [
      { step: 1, component: "Kroma Edge Binder (Resin)", note: "Pour base binder resin first" },
      { step: 2, component: "Reducer / Thinner (100% of Binder weight)", note: "Add to binder and stir" },
      { step: 3, component: "Hardener (20% of Binder+Reducer weight)", note: "Add to mixture and stir thoroughly" },
      { step: 4, component: "Mirror Seeds Formula (Metallic Filler 20% of Step 1 weight)", note: "Shake well before use; metallic filler settles quickly. Stir until uniform." }
    ],
    batchChartWeightGrams: [
      { totalGrams: 14, binder: 5, reducer: 5, hardener: 2, mirrorSeeds: 2, fluidOz: 0.5 },
      { totalGrams: 28, binder: 10, reducer: 10, hardener: 4, mirrorSeeds: 4, fluidOz: 1.0 },
      { totalGrams: 56, binder: 20, reducer: 20, hardener: 8, mirrorSeeds: 8, fluidOz: 2.0 },
      { totalGrams: 140, binder: 50, reducer: 50, hardener: 20, mirrorSeeds: 20, fluidOz: 5.0, label: "Small Kit (140g)" },
      { totalGrams: 420, binder: 150, reducer: 150, hardener: 60, mirrorSeeds: 60, fluidOz: 15.0, label: "Medium Kit (420g)" },
      { totalGrams: 1260, binder: 450, reducer: 450, hardener: 180, mirrorSeeds: 180, fluidOz: 45.0, label: "Large Kit (1260g)" }
    ],
    filmThickness: "15 – 30 µm (0.6 – 1.2 mil). Target: 25 ± 5 µm. Max limit: 40 µm (causes cracking/sagging).",
    potLife: "3 Hours after mixing binder and hardener. (Mix immediately before spraying).",
    criticalRules: {
      mustDo: [
        "Apply ONE continuous wet coat. Coating film MUST remain wet until spraying is completed.",
        "Allow full Self-Organization to complete (cloudiness disappears as metallic mirror aligns).",
        "Minimum application temperature: 68°F (20°C). Below 68°F slows solvent release and causes pinholes.",
        "Always strain paint through ultra-fine ~5µm strainer or Yoshino paper.",
        "Degrease with silicone remover or isopropyl alcohol only."
      ],
      doNotDo: [
        "DO NOT apply mist coats or tack coats (WILL cause pinholes, fish eyes, or loss of reflectivity).",
        "DO NOT apply over insufficiently cured base coats or absorbent substrates (causes shrinkage).",
        "DO NOT apply second coat prematurely (only permitted when mirror self-organization is 100% complete; max 3 coats)."
      ],
      substrateRule: "A Gloss Black ground coat is NOT required! Apply over fully cured primer/sealer, basecoat, or clearcoat sanded with #600–#1000 grit."
    },
    sprayGunRequirements: [
      { area: "4 in x 4 in (Small parts / graphics)", nozzle: "Airbrush Ø 0.3 – 0.5 mm", psi: "25 – 45 PSI" },
      { area: "20 in x 20 in (Tanks / Helmets / Fenders)", nozzle: "Spray Gun Ø 0.6 – 1.4 mm", psi: "Per spray gun mfg spec (higher atomization preferred)" },
      { area: "40 in x 40 in (Large panels / hoods / roofs)", nozzle: "Spray Gun Ø 1.4 – 2.0 mm", psi: "Per spray gun mfg spec" }
    ],
    cureTimes: {
      airCure: "Cure for a minimum of 36 hours at room temp (try not to exceed 48h before clearcoat; after 48h use adhesion promoter).",
      forceCure: "Wait 5 minutes after mirror has fully formed, then force dry at 140°F–160°F (60°C–70°C) for 1–2 hours, followed by 24h at room temperature."
    }
  },

  // 2. KROMA EDGE DEDICATED TOPCOAT CLEAR
  dedicatedTopcoatClear: {
    name: "Kroma Edge Dedicated Topcoat Clear",
    mixRatioByWeight: "Clear Base : Hardener = 10 : 1",
    thinnerRatio: "70% – 100% Thinner relative to Clear Base amount (70–100g Thinner per 100g Clear Base)",
    lineup: [
      { name: "Topcoat Clear 180 SET", totalMixed: "378 g", clearBase: "180 g", hardener: "18 g", thinner: "180 g", coverage: "approx. 1.5 m² (~16 sq ft)" },
      { name: "Topcoat Clear 900 SET", totalMixed: "1,890 g", clearBase: "900 g", hardener: "90 g", thinner: "900 g", coverage: "approx. 6.0 m² (~65 sq ft)" },
      { name: "Topcoat Clear 3600 SET", totalMixed: "7,560 g", clearBase: "3,600 g", hardener: "360 g", thinner: "3,600 g", coverage: "approx. 24.0 m² (~258 sq ft)" }
    ],
    filmThickness: "15 ± 2 µm",
    potLife: "4 Hours",
    cureConditions: "60°C for 1 hour or more, or 20°C for 24 hours or more. Hardens to level suitable for polishing after 60°C 1h + 30 min natural cooling.",
    applicationTechnique: [
      "1. Tack / Dust Coat: Apply fine mist evenly over entire surface so chrome is only slightly wetted (check for zero fisheyes).",
      "2. Flash Interval: Allow approx 5 minutes after tack coat.",
      "3. Full Coat: Apply full wet coat with good flow to bury tack particles and bring out deep gloss.",
      "4. Recovery Note: Finish may appear slightly cloudy immediately after clear application; brightness will gradually recover as drying progresses!",
      "5. ONLY Kroma Edge Dedicated Topcoat Clear is approved. Non-dedicated clears may soften the resin layer and collapse mirror reflection."
    ]
  }
};

export const KROMA_EDGE_CATALOG = {
  brand: "Kroma Edge",
  systemName: "Kroma Edge Self-Organization Mirror Chrome System",
  defaultDensity: 0.95,
  coverageRateSqFtPerGal: 256, // 1 fl oz covers 2 sq ft (128 fl oz = 256 sq ft)
  tds: KROMA_EDGE_TDS,

  mixingSystems: [
    {
      id: "kroma_edge_mirror_chrome",
      name: "Kroma Edge Mirror System (5:5:2:2 by Weight)",
      badge: "4-Part Chrome",
      category: "Mirror Chrome",
      ratioText: "5 Parts Binder : 5 Parts Reducer : 2 Parts Hardener : 2 Parts Mirror Seeds",
      parts: [
        { role: "binder", name: "Kroma Edge Binder (Resin)", ratio: 5, defaultDensity: 0.98 },
        { role: "reducer", name: "Kroma Edge Reducer / Thinner", ratio: 5, defaultDensity: 0.85 },
        { role: "hardener", name: "Kroma Edge Hardener", ratio: 2, defaultDensity: 1.02 },
        { role: "seeds", name: "Mirror Seeds Formula (Metallic Filler)", ratio: 2, defaultDensity: 1.10 }
      ],
      description: "Self-Organization Mirror Chrome. Requires ONE continuous wet coat at >68°F. (Gloss black is NOT required; sand groundcoat with #600-#1000)."
    },
    {
      id: "kroma_edge_dedicated_clear",
      name: "Kroma Edge Dedicated Topcoat Clear (10:1 + 70-100% Thinner)",
      badge: "Topcoat Clear",
      category: "Dedicated Clearcoat",
      ratioText: "10 Parts Clear Base : 1 Part Hardener : 7-10 Parts Thinner",
      parts: [
        { role: "clear", name: "Kroma Clear Base", ratio: 10, defaultDensity: 0.99 },
        { role: "hardener", name: "Dedicated Clear Hardener", ratio: 1, defaultDensity: 1.02 },
        { role: "thinner", name: "Dedicated Clear Thinner", ratio: 8.5, defaultDensity: 0.84 }
      ],
      description: "Non-destructive dedicated clearcoat for Kroma Edge. Prevents particle lifting. Apply fine mist tack coat, wait 5 min, then apply full wet coat."
    },
    }
  ]
};

