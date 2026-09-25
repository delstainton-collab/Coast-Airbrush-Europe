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
      { totalGrams: 140, binder: 50, reducer: 50, hardener: 20, mirrorSeeds: 20, fluidOz: 5.0, label: "Small Kit (140g / 5 oz)" },
      { totalGrams: 420, binder: 150, reducer: 150, hardener: 60, mirrorSeeds: 60, fluidOz: 15.0, label: "Medium Kit (420g / 15 oz)" },
      { totalGrams: 1260, binder: 450, reducer: 450, hardener: 180, mirrorSeeds: 180, fluidOz: 45.0, label: "Large Kit (1260g / 45 oz)" },
      { totalGrams: 2520, binder: 900, reducer: 900, hardener: 360, mirrorSeeds: 360, fluidOz: 90.0, label: "Extra Large Kit (2520g / 90 oz)" },
      { totalGrams: 10080, binder: 3600, reducer: 3600, hardener: 1440, mirrorSeeds: 1440, fluidOz: 360.0, label: "Ultra Large Kit (10080g / 360 oz)" }
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
      description: "Self-Organization Mirror Chrome. Requires ONE continuous wet coat at >68°F. (Gloss black is NOT required; sand groundcoat with #600-#1000).",
      coverageProfile: {
        type: "nano_chrome",
        benchmarkUnit: "sqft_per_oz",
        benchmarkRate: 2.0, // 1 fl oz covers 2.0 sq ft
        coverageRateSqFtPerGal: 256,
        recommendedCoats: 1,
        lockCoats: true,
        coatNote: "Strictly 1 continuous wet coat (Max 3 coats permitted only after complete flash)",
        targetDftMicrons: "15-30 µm",
        potLifeHours: 3,
        wasteBuffer: 1.10, // 10% in-cup / booth waste
        requiresCompanion: true,
        companionSystemId: "kroma_edge_dedicated_clear",
        packagingType: "kits_by_weight",
        tiers: [
          { name: "Small Kit (140g / 5 oz)", maxSqFt: 10, maxGrams: 140, priceGBP: 235.00, priceEUR: 276.47, sku: "KE-MIRROR-140G", desc: "Covers up to 10 sq ft (1-2 Racing Helmets, Motorcycle Tank, Guitar Body)" },
          { name: "Medium Kit (420g / 15 oz)", maxSqFt: 30, maxGrams: 440, priceGBP: 640.00, priceEUR: 752.94, sku: "KE-MIRROR-420G", desc: "Covers up to 30 sq ft (Complete Motorcycle Tank + Fenders + Side Covers)" },
          { name: "Large Kit (1,260g / 45 oz)", maxSqFt: 90, maxGrams: 1360, priceGBP: 1450.00, priceEUR: 1705.88, sku: "KE-MIRROR-1260G", desc: "Covers up to 90 sq ft (Complete Bike, Automotive Hood/Bonnet, Sculptures)" },
          { name: "X-Large Kit (2,520g / 90 oz)", maxSqFt: 180, maxGrams: 2700, priceGBP: 2550.00, priceEUR: 3000.00, sku: "KE-MIRROR-2520G", desc: "Covers up to 180 sq ft (Multiple Automotive Panels, Complete Chopper)" },
          { name: "Ultra XL Kit (10,080g / 360 oz)", maxSqFt: 700, maxGrams: 10080, priceGBP: 9250.00, priceEUR: 10882.35, sku: "KE-MIRROR-10080G", desc: "Covers up to 700 sq ft (Full Vehicle Respray, Commercial / Studio Volumes)" }
        ]
      },
      applicationGuide: [
        {
          step: 1,
          title: "Surface Preparation",
          badge: "CRITICAL FOUNDATION",
          summary: "Ensure the surface is completely smooth, clean, and free of dust or oils. A flawless base is critical for self-organization.",
          points: [
            "Apply over fully cured primer/sealer, base coat, or clear coat then sand with #600–#1000 grit.",
            "★ A Gloss Black Groundcoat is NOT Required! (Works over smooth cured colored or neutral bases).",
            "DO NOT apply over absorbent substrates or insufficiently cured coats (causes shrinkage).",
            "Degrease strictly with silicone remover or isopropyl alcohol (IPA) only. Use low-lint wipes.",
            "Always strain paint using ultra-fine ~5 µm strainer or Yoshino paper."
          ],
          alert: null
        },
        {
          step: 2,
          title: "Exact Mixing Protocol",
          badge: "ORDER MATTERS",
          summary: "Strictly follow the exact mixing order to ensure the mirror seeds activate correctly.",
          points: [
            "Step 1: Combine Binder (5 parts) and Reducer (5 parts) 1:1 first.",
            "Step 2: Add Hardener (2 parts) to the reduced binder and stir thoroughly.",
            "Step 3: Shake Mirror Seed container vigorously, then add Mirror Seed (2 parts) last.",
            "Mix thoroughly but gently. Do not whip air bubbles into the liquid."
          ],
          alert: {
            type: "warning",
            title: "3-HOUR POT LIFE WARNING",
            text: "Once hardener is added, the mixture must be sprayed within 3 hours before it begins curing in your gun. Do not mix more than you can spray in one session."
          }
        },
        {
          step: 3,
          title: "Spray Technique & Application",
          badge: "1 COAT ONLY",
          summary: "Self-organizing nanoparticles rise to the surface while the resin layer settles underneath.",
          points: [
            "MUST: Apply ONE continuous wet coat. The coating film MUST remain wet until spraying is completed.",
            "DO NOT: Apply mist coats or tack coats (causes pinholes, dry spray, or permanent loss of reflectivity).",
            "Film Thickness: 15–30 µm (0.6 - 1.2 mil). Exceeding 40 µm WILL cause solvent cracking or sagging.",
            "Environmental: Minimum application temperature is 68°F (20°C). Below 68°F slows solvent release.",
            "Gun Setup: Mini/HVLP 0.8–1.3mm @ 1.2–1.5 Bar | Airbrush 0.3–0.5mm @ 25–45 PSI."
          ],
          alert: null
        },
        {
          step: 4,
          title: "Curing & Mirror Stabilization",
          badge: "SOLVENT RELEASE",
          summary: "Allow the 2K system to cure fully before attempting to clearcoat.",
          points: [
            "Air Cure: Minimum of 36 hours at room temperature (>68°F / 20°C). Try not to exceed 48 hours before clear; after 48 hours apply adhesion promoter.",
            "Force Cure: Wait 5 minutes after mirror has formed. Force dry at 140°F–160°F (60°C–70°C) for 1–2 hours, followed by 24h at room temperature."
          ],
          alert: {
            type: "danger",
            title: "CLOUDINESS WARNING",
            text: "Applying Topcoat before Kroma Edge is 100% fully cured WILL cause solvent penetration into the resin layer, resulting in irreversible hazing and cloudiness."
          }
        }
      ]
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
      description: "Non-destructive dedicated clearcoat for Kroma Edge. Prevents particle lifting. Apply fine mist tack coat, wait 5 min, then apply full wet coat.",
      coverageProfile: {
        type: "dedicated_clear",
        benchmarkUnit: "sqft_per_gal",
        coverageRateSqFtPerGal: 380,
        recommendedCoats: 2,
        lockCoats: false,
        coatNote: "Step 1 Fine Mist Tack Coat + Step 2 Full Wet Flow Coat",
        targetDftMicrons: "15 ± 2 µm",
        potLifeHours: 4,
        wasteBuffer: 1.10,
        requiresCompanion: false,
        packagingType: "kits_by_weight",
        tiers: [
          { name: "Topcoat Clear 180 SET (378g)", maxSqFt: 16, maxGrams: 378, priceGBP: 65.00, priceEUR: 76.47, sku: "KE-CLEAR-180", desc: "Covers ~16 sq ft (1.5 m²). Exact companion for Small 140g Chrome Kit." },
          { name: "Topcoat Clear 900 SET (1,890g)", maxSqFt: 65, maxGrams: 1890, priceGBP: 285.00, priceEUR: 335.29, sku: "KE-CLEAR-900", desc: "Covers ~65 sq ft (6.0 m²). Companion for Medium & Large Chrome Kits." },
          { name: "Topcoat Clear 3600 SET (7,560g)", maxSqFt: 260, maxGrams: 7560, priceGBP: 1050.00, priceEUR: 1235.29, sku: "KE-CLEAR-3600", desc: "Covers ~260 sq ft (24.0 m²). Companion for XL & Multi-panel projects." }
        ]
      },
      applicationGuide: [
        {
          step: 5,
          title: "Topcoat Clear Mixing & Reduction",
          badge: "10:1 RATIO",
          summary: "Use ONLY Kroma Edge Dedicated Topcoat Clear. Non-dedicated clears may reactivate the chrome resin.",
          points: [
            "Mix Ratio: 10 parts Base : 1 part Hardener : 70%–100% Dedicated Thinner.",
            "Reduction Slider: Use 70% thinner for higher film build; 100% thinner for maximum flow and glass leveling.",
            "Pot Life: 4 hours usable bench time after mixing.",
            "Shelf Life: Use within 3 months after opening container."
          ],
          alert: null
        },
        {
          step: 6,
          title: "Tack Coat (Dust Coat) First Pass",
          badge: "FINE MIST ONLY",
          summary: "The tack coat locks down the microscopic metallic particles without dissolving the mirror layer.",
          points: [
            "Apply as a fine, dry mist evenly over the entire chrome surface.",
            "Apply very thinly so the chrome surface is only slightly wetted.",
            "Inspect immediately for zero defects or fisheyes.",
            "Note: Overly coarse droplets will imprint on the final surface texture."
          ],
          alert: null
        },
        {
          step: 7,
          title: "Full Flow Coat Second Pass",
          badge: "FULL GLOSS BURIAL",
          summary: "Bury the tack coat particles and achieve deep optical clarity.",
          points: [
            "Allow an interval of approximately 5 minutes after the tack coat.",
            "Apply enough material with uniform flow to bring out deep gloss and bury tack particles.",
            "Warning: This clear flows exceptionally well—watch edges carefully to prevent runs.",
            "If slight orange-peel develops, allow to flash dry to the touch and apply one light leveling coat."
          ],
          alert: null
        },
        {
          step: 8,
          title: "Final Drying & Brightness Recovery",
          badge: "MIRROR RECOVERY",
          summary: "Brightness will recover as the dedicated clear flashes off and hardens.",
          points: [
            "Do not panic if chrome looks slightly muted when clear is wet; optical brilliance recovers during curing.",
            "Air Dry: 20°C (68°F) for 24 hours or more before handling.",
            "Force Dry: 60°C (140°F) for 1 hour or more. Polishable after 1h bake + 30 min cooling."
          ],
          alert: null
        }
      ]
    }
  ]
};

