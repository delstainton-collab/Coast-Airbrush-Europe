/**
 * Flake King™ Metal Flake — Technical Data Sheet (TDS) & Wet Spray Mixing Ratios
 * Master Technical Specifications & Application Guidelines
 * Manufacturer: DAS64 Design Ltd. (Flake King), DL12 9DW, United Kingdom
 */

export const FLAKE_KING_TDS = {
  brand: "Flake King",
  productType: "Dry Metal Flake (Glitter) / Polyester Flake",
  material: "Vacuum Metallized Polyethylene Terephthalate (PET) Film with Precision Thermoset Coating",
  toxicity: "Non-Toxic (Formulated without hazardous heavy metals)",
  
  // Physical & Thermal Specifications
  maxTemperature: {
    celsius: 177,
    fahrenheit: 350,
    notes: "Endured continuous exposure to 350°F (177°C) with no loss of colour or reflectivity. Actual limit depends on dwell time, mixing abrasion, and ambient processing temperature."
  },
  
  resistances: {
    waterProof: true,
    solventProof: true,
    testedSolvents: [
      "Water",
      "MEK (Methyl Ethyl Ketone)",
      "MIBK (Methyl Isobutyl Ketone)",
      "Isopropanol / Alcohols",
      "High Flash Naphtha",
      "Solvent-borne Urethanes & Acrylics",
      "Water-based / Aqueous Binder Systems",
      "Vinyls & Resins"
    ],
    lightfastness: {
      location: "Miami, Florida (Semi-tropical maximum UV exposure)",
      duration: "18 continuous months (Unshielded, direct sun/weather exposure with no glass or plastic filters)",
      result: "Zero discernible colour change, zero reduction in brilliance/sparkle"
    },
    adhesionTests: [
      "Cellophane tape strip test (Zero coating peel)",
      "180° fold and crease test (No delamination)",
      "Wrinkle test (No cracking or flake/coating separation)"
    ],
    bleedResistance: "Finest transparent pigments formulated against bleeding or migration into surrounding clearcoat/carrier mediums."
  },

  suspensionProperties: "Significantly lower specific gravity than liquid or gel carriers, ensuring uniform suspension during wet spraying application without rapid hard settling.",

  limitations: [
    "Minute exposed aluminum edge on cut particles: Prolonged contact with strong caustics or alkaline strippers should be monitored.",
    "Concentrated sulfuric acid will cause separation of coating from the foil.",
    "Pre-testing in specific carrier resin/clear system is recommended before full production."
  ],

  manufacturer: {
    company: "DAS64 Design Ltd.",
    address: "Lartington, Barnard Castle, Co. Durham, DL12 9DW, United Kingdom",
    phone: "+44 (0)1833 650 353",
    email: "sales@flakeking.com",
    website: "https://www.flakeking.com"
  }
};

/**
 * Wet Spraying Mixing Ratios & Gun Nozzle Matrix
 * Guideline ratios per 1000ml (1 Litre) of catalysed clearcoat or carrier binder
 */
export const FLAKE_KING_WET_MIX_RATIOS = [
  {
    sizeName: "Ultra Small",
    micron: 50,
    inch: ".002\"",
    minGunNozzle: "Any Size Spray Gun and Airbrush (0.3mm+)",
    ratioGramsPerLiter: 30,
    ratioGramsPer100ml: 3,
    ratioText: "30g per 1000ml clear (3g per 100ml)",
    dryGunRecommendation: "Compatible with Flake King 500 Airbrush Adaptor & 1000 Guns"
  },
  {
    sizeName: "Small",
    micron: 100,
    inch: ".004\"",
    minGunNozzle: "Spray Gun 1.2mm | Airbrush 0.5mm",
    ratioGramsPerLiter: 40,
    ratioGramsPer100ml: 4,
    ratioText: "40g per 1000ml clear (4g per 100ml)",
    dryGunRecommendation: "Compatible with Flake King 500 Airbrush Adaptor & 1000 Guns"
  },
  {
    sizeName: "Medium",
    micron: 200,
    inch: ".008\"",
    minGunNozzle: "Spray Gun 1.4mm (Not recommended for airbrush unless dry via FOM500)",
    ratioGramsPerLiter: 60,
    ratioGramsPer100ml: 6,
    ratioText: "60g per 1000ml clear (6g per 100ml)",
    dryGunRecommendation: "Recommended dry via FOM500 Airbrush Adaptor or FK1000 Gun"
  },
  {
    sizeName: "Large",
    micron: 375,
    inch: ".015\"",
    minGunNozzle: "Spray Gun 1.8mm (Not recommended for airbrush unless dry via FOM500)",
    ratioGramsPerLiter: 80,
    ratioGramsPer100ml: 8,
    ratioText: "80g per 1000ml clear (8g per 100ml)",
    dryGunRecommendation: "Recommended dry via FOM500 Airbrush Adaptor or FK1000 Gun"
  },
  {
    sizeName: "X Large",
    micron: 625,
    inch: ".025\"",
    minGunNozzle: "Spray Gun 2.2mm (Not recommended for airbrush unless dry via FOM500)",
    ratioGramsPerLiter: 100,
    ratioGramsPer100ml: 10,
    ratioText: "100g per 1000ml clear (10g per 100ml)",
    dryGunRecommendation: "Recommended dry via FOM500 Airbrush Adaptor or FK1000 Gun"
  },
  {
    sizeName: "DXL",
    micron: 1025,
    inch: ".040\"",
    minGunNozzle: "2.5mm Spray Gun (Dry application strongly advised over wet)",
    ratioGramsPerLiter: 150,
    ratioGramsPer100ml: 15,
    ratioText: "150g per 1000ml clear (15g per 100ml)",
    dryGunRecommendation: "Dry flake gun strongly recommended (FOM500, 550, or 1000 series)"
  }
];

/**
 * Mix Calculator System Formula definitions for Flake King products
 */
export const FLAKE_KING_MIXING_SYSTEMS = [
  {
    id: "flake_king_wet_002",
    name: "Flake King Wet Spray — Ultra Small (.002\" / 50µm)",
    badge: "50 Micron Flake",
    category: "Metal Flake Wet Mix",
    ratioText: "30g Flake : 1000ml Clear Coat",
    gunRecommendation: "Any Airbrush (0.3mm+) or Spray Gun",
    parts: [
      { role: "clear", name: "2K Catalyzed Clear Coat / Carrier", ratio: 1000, defaultDensity: 0.98 },
      { role: "flake", name: "Flake King .002\" Flake", ratio: 30, defaultDensity: 1.38 }
    ],
    description: "Wet spraying formulation for Ultra Small .002\" (50µm) flake. 30 grams per 1000ml of clear."
  },
  {
    id: "flake_king_wet_004",
    name: "Flake King Wet Spray — Small (.004\" / 100µm)",
    badge: "100 Micron Flake",
    category: "Metal Flake Wet Mix",
    ratioText: "40g Flake : 1000ml Clear Coat",
    gunRecommendation: "Spray Gun 1.2mm / Airbrush 0.5mm",
    parts: [
      { role: "clear", name: "2K Catalyzed Clear Coat / Carrier", ratio: 1000, defaultDensity: 0.98 },
      { role: "flake", name: "Flake King .004\" Flake", ratio: 40, defaultDensity: 1.38 }
    ],
    description: "Wet spraying formulation for Small .004\" (100µm) flake. 40 grams per 1000ml of clear."
  },
  {
    id: "flake_king_wet_008",
    name: "Flake King Wet Spray — Medium (.008\" / 200µm)",
    badge: "200 Micron Flake",
    category: "Metal Flake Wet Mix",
    ratioText: "60g Flake : 1000ml Clear Coat",
    gunRecommendation: "Spray Gun 1.4mm (Airbrush dry only)",
    parts: [
      { role: "clear", name: "2K Catalyzed Clear Coat / Carrier", ratio: 1000, defaultDensity: 0.98 },
      { role: "flake", name: "Flake King .008\" Flake", ratio: 60, defaultDensity: 1.38 }
    ],
    description: "Wet spraying formulation for Medium .008\" (200µm) flake. 60 grams per 1000ml of clear."
  },
  {
    id: "flake_king_wet_015",
    name: "Flake King Wet Spray — Large (.015\" / 375µm)",
    badge: "375 Micron Flake",
    category: "Metal Flake Wet Mix",
    ratioText: "80g Flake : 1000ml Clear Coat",
    gunRecommendation: "Spray Gun 1.8mm (Airbrush dry only)",
    parts: [
      { role: "clear", name: "2K Catalyzed Clear Coat / Carrier", ratio: 1000, defaultDensity: 0.98 },
      { role: "flake", name: "Flake King .015\" Flake", ratio: 80, defaultDensity: 1.38 }
    ],
    description: "Wet spraying formulation for Large .015\" (375µm) flake. 80 grams per 1000ml of clear."
  },
  {
    id: "flake_king_wet_025",
    name: "Flake King Wet Spray — X-Large (.025\" / 625µm)",
    badge: "625 Micron Flake",
    category: "Metal Flake Wet Mix",
    ratioText: "100g Flake : 1000ml Clear Coat",
    gunRecommendation: "Spray Gun 2.2mm (Airbrush dry only)",
    parts: [
      { role: "clear", name: "2K Catalyzed Clear Coat / Carrier", ratio: 1000, defaultDensity: 0.98 },
      { role: "flake", name: "Flake King .025\" Flake", ratio: 100, defaultDensity: 1.38 }
    ],
    description: "Wet spraying formulation for X-Large .025\" (625µm) flake. 100 grams per 1000ml of clear."
  },
  {
    id: "flake_king_wet_040",
    name: "Flake King Wet Spray — DXL (.040\" / 1025µm)",
    badge: "1025 Micron Flake",
    category: "Metal Flake Wet Mix",
    ratioText: "150g Flake : 1000ml Clear Coat",
    gunRecommendation: "Spray Gun 2.5mm (Dry Gun Strongly Recommended)",
    parts: [
      { role: "clear", name: "2K Catalyzed Clear Coat / Carrier", ratio: 1000, defaultDensity: 0.98 },
      { role: "flake", name: "Flake King .040\" Flake", ratio: 150, defaultDensity: 1.38 }
    ],
    description: "Wet spraying formulation for DXL .040\" (1025µm) flake. 150 grams per 1000ml of clear."
  }
];
