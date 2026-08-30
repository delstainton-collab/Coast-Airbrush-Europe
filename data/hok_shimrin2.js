// House of Kolor Shimrin 2 (S2) System Catalog & Formula Specifications
export const HOK_SHIMRIN2_CATALOG = {
  brand: "House of Kolor",
  systemName: "Shimrin 2 (S2) Universal Basecoat System",
  defaultDensity: 0.94, // g/mL default for basecoats
  coverageRateSqFtPerGal: 400, // at 1 mil DFT theoretical
  
  mixingSystems: [
    {
      id: "s2_solid",
      name: "Shimrin 2 Solid Basecoat System (S2-25 / S2-26)",
      ratioText: "2 Parts Basecoat : 1 Part Reducer (2:1)",
      parts: [
        { role: "base", name: "S2 Solid Basecoat", ratio: 2, defaultDensity: 0.96 },
        { role: "reducer", name: "RU Series Reducer", ratio: 1, defaultDensity: 0.82 }
      ],
      description: "Standard high-opacity solid basecoat formula for foundational colors."
    },
    {
      id: "s2_fx_karrier",
      name: "Shimrin 2 FX Karrier Base + Effect Pac (3:1:2)",
      ratioText: "3 Parts Karrier Base : 1 Part Effect Pac : 2 Parts Reducer (3:1:2)",
      parts: [
        { role: "karrier", name: "S2 Karrier Base (S2-00 to S2-18)", ratio: 3, defaultDensity: 0.92 },
        { role: "effect", name: "S2-FX Effect Pac / Pearl / Flake", ratio: 1, defaultDensity: 1.05 },
        { role: "reducer", name: "RU Series Reducer", ratio: 2, defaultDensity: 0.82 }
      ],
      description: "Custom pearl, metallic, and shift effect system."
    },
    {
      id: "s2_kandy_base",
      name: "Shimrin 2 Kandy Basecoat (KBC)",
      ratioText: "8 Parts S2-00 Trans Nebulae : 1 Part KK Kandy Koncentrate : 0.5 Part S2-FX Pearl + 50% Reducer",
      parts: [
        { role: "trans_base", name: "S2-00 Trans Nebulae", ratio: 8, defaultDensity: 0.90 },
        { role: "kandy_koncentrate", name: "KK Series Kandy Koncentrate", ratio: 1, defaultDensity: 0.98 },
        { role: "effect", name: "S2-FX Kosmic Pearl (Optional)", ratio: 0.5, defaultDensity: 1.05 },
        { role: "reducer", name: "RU Series Reducer", ratio: 4.75, defaultDensity: 0.82 }
      ],
      description: "Deep, rich translucent candy finish with optional pearl shimmer."
    },
    {
      id: "s2_graphic_kolor",
      name: "Shimrin 2 Graphic Kolor (S2-SG)",
      ratioText: "2 Parts S2-SG Graphic Kolor : 1 Part RU Reducer (2:1)",
      parts: [
        { role: "base", name: "S2-SG Graphic Kolor", ratio: 2, defaultDensity: 0.94 },
        { role: "reducer", name: "RU Series Reducer", ratio: 1, defaultDensity: 0.82 }
      ],
      description: "High-pigment graphic colors for artwork, striping, and airbrushing."
    },
    {
      id: "s2_intercoat",
      name: "S2-SG100 / SG102 Intercoat Clear",
      ratioText: "2 Parts Intercoat : 1 Part RU Reducer (2:1)",
      parts: [
        { role: "base", name: "S2-SG100 Intercoat Clear", ratio: 2, defaultDensity: 0.91 },
        { role: "reducer", name: "RU Series Reducer", ratio: 1, defaultDensity: 0.82 }
      ],
      description: "Protective clear layer applied over basecoat to lock in artwork and tape lines."
    },
    {
      id: "s2_show_klear",
      name: "USC01 Kosmic Urethane Show Klear",
      ratioText: "2 Parts USC01 : 1 Part KU150 Katalyst : 10% RU Reducer (2:1:0.3)",
      parts: [
        { role: "base", name: "USC01 Kosmic Urethane Show Klear", ratio: 2, defaultDensity: 0.98 },
        { role: "katalyst", name: "KU150 / KU152 Katalyst", ratio: 1, defaultDensity: 1.02 },
        { role: "reducer", name: "RU Series Reducer (10%)", ratio: 0.3, defaultDensity: 0.82 }
      ],
      description: "Ultra high-gloss show clearcoat topcoat."
    }
  ],

  products: [
    // FX Karrier Bases
    { sku: "HOK-S2-00", name: "S2-00 Trans Nebulae", category: "FX Karrier Base", hex: "#e0e7ff", priceUSD: 68.50, sizes: ["Pint", "Quart", "Gallon"] },
    { sku: "HOK-S2-01", name: "S2-01 Solar Gold", category: "FX Karrier Base", hex: "#f5b700", priceUSD: 74.99, sizes: ["Pint", "Quart", "Gallon"] },
    { sku: "HOK-S2-02", name: "S2-02 Sunset Orange", category: "FX Karrier Base", hex: "#f97316", priceUSD: 74.99, sizes: ["Pint", "Quart", "Gallon"] },
    { sku: "HOK-S2-03", name: "S2-03 Galaxy Gray", category: "FX Karrier Base", hex: "#64748b", priceUSD: 69.99, sizes: ["Pint", "Quart", "Gallon"] },
    { sku: "HOK-S2-04", name: "S2-04 Planet Green", category: "FX Karrier Base", hex: "#10b981", priceUSD: 74.99, sizes: ["Pint", "Quart", "Gallon"] },
    { sku: "HOK-S2-05", name: "S2-05 Stratosphere Blue", category: "FX Karrier Base", hex: "#2563eb", priceUSD: 74.99, sizes: ["Pint", "Quart", "Gallon"] },
    { sku: "HOK-S2-08", name: "S2-08 Eclipse Orange", category: "FX Karrier Base", hex: "#ea580c", priceUSD: 76.50, sizes: ["Pint", "Quart", "Gallon"] },
    { sku: "HOK-S2-09", name: "S2-09 Astro Red", category: "FX Karrier Base", hex: "#dc2626", priceUSD: 78.00, sizes: ["Pint", "Quart", "Gallon"] },
    { sku: "HOK-S2-10", name: "S2-10 Cosmic Purple", category: "FX Karrier Base", hex: "#7c3aed", priceUSD: 78.00, sizes: ["Pint", "Quart", "Gallon"] },
    { sku: "HOK-S2-11", name: "S2-11 Mayan Magenta", category: "FX Karrier Base", hex: "#db2777", priceUSD: 78.00, sizes: ["Pint", "Quart", "Gallon"] },
    { sku: "HOK-S2-13", name: "S2-13 Orion Silver", category: "FX Karrier Base", hex: "#cbd5e1", priceUSD: 79.99, sizes: ["Pint", "Quart", "Gallon"] },

    // Solid Basecoats
    { sku: "HOK-S2-25", name: "S2-25 Jet Black Basecoat", category: "Solid Basecoat", hex: "#0f172a", priceUSD: 64.99, sizes: ["Pint", "Quart", "Gallon"] },
    { sku: "HOK-S2-26", name: "S2-26 Bright White Basecoat", category: "Solid Basecoat", hex: "#f8fafc", priceUSD: 64.99, sizes: ["Pint", "Quart", "Gallon"] },

    // Graphic Kolors
    { sku: "HOK-S2-SG01", name: "S2-SG01 Maroon", category: "Graphic Kolor", hex: "#881337", priceUSD: 42.00, sizes: ["4 oz", "Pint", "Quart"] },
    { sku: "HOK-S2-SG02", name: "S2-SG02 Sunburst Yellow", category: "Graphic Kolor", hex: "#eab308", priceUSD: 42.00, sizes: ["4 oz", "Pint", "Quart"] },
    { sku: "HOK-S2-SG03", name: "S2-SG03 Passion Blue", category: "Graphic Kolor", hex: "#1d4ed8", priceUSD: 42.00, sizes: ["4 oz", "Pint", "Quart"] },
    { sku: "HOK-S2-SG04", name: "S2-SG04 Emerald Green", category: "Graphic Kolor", hex: "#047857", priceUSD: 42.00, sizes: ["4 oz", "Pint", "Quart"] },

    // Effect Pacs
    { sku: "HOK-S2-FX01", name: "S2-FX01 White Kosmic Spark", category: "Effect Pac", hex: "#f1f5f9", priceUSD: 38.50, sizes: ["4 oz", "Pint"] },
    { sku: "HOK-S2-FX02", name: "S2-FX02 Gold Kosmic Spark", category: "Effect Pac", hex: "#fbbf24", priceUSD: 38.50, sizes: ["4 oz", "Pint"] },
    { sku: "HOK-S2-FX03", name: "S2-FX03 Red Kosmic Spark", category: "Effect Pac", hex: "#ef4444", priceUSD: 38.50, sizes: ["4 oz", "Pint"] },
    { sku: "HOK-S2-FX04", name: "S2-FX04 Blue Kosmic Spark", category: "Effect Pac", hex: "#3b82f6", priceUSD: 38.50, sizes: ["4 oz", "Pint"] },

    // Kandy Koncentrates
    { sku: "HOK-KK01", name: "KK01 Brandywine Kandy Koncentrate", category: "Kandy Koncentrate", hex: "#581c87", priceUSD: 49.99, sizes: ["4 oz", "Pint"] },
    { sku: "HOK-KK03", name: "KK03 Wild Cherry Kandy Koncentrate", category: "Kandy Koncentrate", hex: "#9f1239", priceUSD: 49.99, sizes: ["4 oz", "Pint"] },
    { sku: "HOK-KK04", name: "KK04 Oriental Blue Kandy Koncentrate", category: "Kandy Koncentrate", hex: "#1e3a8a", priceUSD: 49.99, sizes: ["4 oz", "Pint"] },
    { sku: "HOK-KK06", name: "KK06 Tangerine Kandy Koncentrate", category: "Kandy Koncentrate", hex: "#c2410c", priceUSD: 49.99, sizes: ["4 oz", "Pint"] },
    { sku: "HOK-KK11", name: "KK11 Apple Red Kandy Koncentrate", category: "Kandy Koncentrate", hex: "#b91c1c", priceUSD: 49.99, sizes: ["4 oz", "Pint"] },

    // Reducers & Intercoats
    { sku: "HOK-RU310", name: "RU310 Fast Reducer (65°F - 75°F)", category: "Reducer", hex: "#94a3b8", priceUSD: 34.50, sizes: ["Quart", "Gallon"] },
    { sku: "HOK-RU311", name: "RU311 Medium Reducer (75°F - 85°F)", category: "Reducer", hex: "#64748b", priceUSD: 34.50, sizes: ["Quart", "Gallon"] },
    { sku: "HOK-RU312", name: "RU312 Slow Reducer (85°F - 95°F)", category: "Reducer", hex: "#475569", priceUSD: 34.50, sizes: ["Quart", "Gallon"] },
    { sku: "HOK-SG100", name: "S2-SG100 Intercoat Clear", category: "Intercoat", hex: "#e2e8f0", priceUSD: 58.00, sizes: ["Quart", "Gallon"] },
    { sku: "HOK-USC01", name: "USC01 Kosmic Urethane Show Klear", category: "Clearcoat", hex: "#38bdf8", priceUSD: 145.00, sizes: ["Quart", "Gallon"] }
  ]
};
