// Ace of Shades Custom Paint System Catalog & Formulas
export const ACE_OF_SHADES_CATALOG = {
  brand: "Ace of Shades Paint",
  systemName: "Ace of Shades Custom Automotive Coatings",
  defaultDensity: 0.95,
  coverageRateSqFtPerGal: 380,

  mixingSystems: [
    {
      id: "aos_prime_time",
      name: "Prime Time Epoxy Hybrid Primer Kit",
      badge: "4:1 Epoxy Primer",
      category: "Primer / Sealer",
      ratioText: "4 Parts Prime Time Primer : 1 Part Prime Time Activator (4:1)",
      parts: [
        { role: "primer", name: "Prime Time Epoxy Hybrid Primer", ratio: 4, defaultDensity: 1.25 },
        { role: "activator", name: "Prime Time Activator", ratio: 1, defaultDensity: 0.95 }
      ],
      description: "High-build epoxy hybrid primer system for ultimate adhesion and corrosion resistance.",
      coverageProfile: {
        type: "primer",
        benchmarkUnit: "sqft_per_gal",
        coverageRateSqFtPerGal: 200, // High-build default
        recommendedCoats: 2,
        minCoats: 1,
        maxCoats: 3,
        coatNote: "1 Coat for Sealer Mode (~320 sq ft/gal) | 2-3 Coats for High-Build Sanding Surfacer (~180-200 sq ft/gal)",
        targetDftMicrons: "50-75 µm",
        potLifeHours: 4,
        wasteBuffer: 1.15,
        packagingType: "liquid_containers",
        tiers: [
          { name: "Quart Kit (Primer + Activator)", maxSqFt: 50, ml: 946, priceEUR: 99.00, sku: "AOS-PT-QT", desc: "For motorcycles, parts & panels" },
          { name: "Gallon Kit (Primer + Activator)", maxSqFt: 200, ml: 3785, priceEUR: 289.00, sku: "AOS-PT-GAL", desc: "For complete body resprays & restoration" }
        ]
      }
    },
    {
      id: "aos_trad_candy",
      name: "Traditional Candy Paint System",
      badge: "4:1:1 Candy",
      category: "Candy Paint",
      ratioText: "4 Parts Traditional Candy : 1 Part Candy Activator : 1 Part Superducer (4:1:1)",
      parts: [
        { role: "candy", name: "Traditional Candy Base", ratio: 4, defaultDensity: 0.94 },
        { role: "activator", name: "Traditional Candy Activator", ratio: 1, defaultDensity: 0.98 },
        { role: "reducer", name: "Superducer / Reducer", ratio: 1, defaultDensity: 0.82 }
      ],
      description: "Ultra-vivid, deep candy paint system built by custom painters for maximum depth.",
      coverageProfile: {
        type: "candy",
        benchmarkUnit: "sqft_per_gal",
        coverageRateSqFtPerGal: 340,
        recommendedCoats: 4,
        minCoats: 3,
        maxCoats: 6,
        coatNote: "Translucent build coats (4 coats standard for maximum depth)",
        targetDftMicrons: "40-60 µm",
        potLifeHours: 4,
        wasteBuffer: 1.15,
        packagingType: "liquid_containers",
        tiers: [
          { name: "Quart Can (946 mL)", maxSqFt: 60, ml: 946, priceEUR: 149.00, sku: "AOS-TC-QT", desc: "For complete custom motorcycle candy job" },
          { name: "Gallon Can (3.78 L)", maxSqFt: 240, ml: 3785, priceEUR: 495.00, sku: "AOS-TC-GAL", desc: "For vehicle body custom candy respray" }
        ]
      }
    },
    {
      id: "aos_solid_base",
      name: "Ace of Shades Solid & Metallic Basecoats",
      badge: "1:1 Basecoat",
      category: "Basecoat",
      ratioText: "1 Part Solid/Metallic Base : 1 Part Superducer Reducer (1:1)",
      parts: [
        { role: "base", name: "Solid / Fine Metallic Base", ratio: 1, defaultDensity: 0.96 },
        { role: "reducer", name: "Superducer Reducer", ratio: 1, defaultDensity: 0.82 }
      ],
      description: "Custom high-opacity basecoats designed for smooth atomization and fast flash time.",
      coverageProfile: {
        type: "basecoat",
        benchmarkUnit: "sqft_per_gal",
        coverageRateSqFtPerGal: 380,
        recommendedCoats: 2,
        minCoats: 2,
        maxCoats: 4,
        targetDftMicrons: "25-35 µm",
        potLifeHours: 8,
        wasteBuffer: 1.15,
        packagingType: "liquid_containers",
        tiers: [
          { name: "Pint Can (473 mL)", maxSqFt: 45, ml: 473, priceEUR: 65.00, sku: "AOS-SB-PT", desc: "For motorcycle tank, fenders & parts" },
          { name: "Quart Can (946 mL)", maxSqFt: 90, ml: 946, priceEUR: 119.00, sku: "AOS-SB-QT", desc: "For full motorcycle sets and panels" }
        ]
      }
    },
    {
      id: "aos_whoop_ass_clear",
      name: "Whoop Ass Speed Clear / Super Shine 79",
      badge: "2:1 Speed Clear",
      category: "Topcoat Clear",
      ratioText: "2 Parts Clearcoat : 1 Part Super-Charger Activator (2:1)",
      parts: [
        { role: "clear", name: "Whoop Ass Speed Clear / Super Shine 79", ratio: 2, defaultDensity: 0.99 },
        { role: "activator", name: "Super-Charger / Foxy Activator", ratio: 1, defaultDensity: 1.01 }
      ],
      description: "Ultra high-gloss, fast drying urethane clearcoat system.",
      coverageProfile: {
        type: "clearcoat",
        benchmarkUnit: "sqft_per_gal",
        coverageRateSqFtPerGal: 400,
        recommendedCoats: 2,
        minCoats: 2,
        maxCoats: 3,
        targetDftMicrons: "50-60 µm",
        potLifeHours: 2,
        wasteBuffer: 1.15,
        packagingType: "liquid_containers",
        tiers: [
          { name: "Quart Kit (Clear + Activator)", maxSqFt: 90, ml: 946, priceEUR: 149.00, sku: "AOS-CLR-QT", desc: "Rapid cure speed clear for panels and bikes" },
          { name: "Gallon Kit (Clear + Activator)", maxSqFt: 360, ml: 3785, priceEUR: 495.00, sku: "AOS-CLR-GAL", desc: "Complete vehicle ultra high gloss finish" }
        ]
      }
    }
  ],

  products: [
    { sku: "AOS-PT-QT", name: "Prime Time Epoxy Hybrid Primer", category: "Primer", hex: "#475569", priceUSD: 79.99, sizes: ["Quart", "Gallon"] },
    { sku: "AOS-PT-ACT", name: "Prime Time Activator", category: "Activator", hex: "#94a3b8", priceUSD: 39.99, sizes: ["Pint", "Quart"] },
    { sku: "AOS-TC-RED", name: "Traditional Candy - Ruby Red", category: "Candy Paint", hex: "#be123c", priceUSD: 89.99, sizes: ["Quart", "Gallon"] },
    { sku: "AOS-TC-BLU", name: "Traditional Candy - Cobalt Blue", category: "Candy Paint", hex: "#1d4ed8", priceUSD: 89.99, sizes: ["Quart", "Gallon"] },
    { sku: "AOS-TC-PUR", name: "Traditional Candy - Royal Purple", category: "Candy Paint", hex: "#6d28d9", priceUSD: 89.99, sizes: ["Quart", "Gallon"] },
    { sku: "AOS-SB-BLK", name: "Solid Base - Pitch Black", category: "Basecoat", hex: "#020617", priceUSD: 69.99, sizes: ["Quart", "Gallon"] },
    { sku: "AOS-SB-WHT", name: "Solid Base - Pure White", category: "Basecoat", hex: "#f8fafc", priceUSD: 69.99, sizes: ["Quart", "Gallon"] },
    { sku: "AOS-FM-SIL", name: "Fine Metallic Base - Liquid Silver", category: "Metallic Base", hex: "#94a3b8", priceUSD: 74.99, sizes: ["Quart", "Gallon"] },
    { sku: "AOS-SUP-RED", name: "Superducer High Temp Reducer", category: "Reducer", hex: "#cbd5e1", priceUSD: 32.99, sizes: ["Quart", "Gallon"] },
    { sku: "AOS-WAS-CLR", name: "Whoop Ass Speed Clear", category: "Clearcoat", hex: "#38bdf8", priceUSD: 129.99, sizes: ["Quart", "Gallon"] }
  ]
};
