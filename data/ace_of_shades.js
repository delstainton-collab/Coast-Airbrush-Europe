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
      ratioText: "4 Parts Prime Time Primer : 1 Part Prime Time Activator (4:1)",
      parts: [
        { role: "primer", name: "Prime Time Epoxy Hybrid Primer", ratio: 4, defaultDensity: 1.25 },
        { role: "activator", name: "Prime Time Activator", ratio: 1, defaultDensity: 0.95 }
      ],
      description: "High-build epoxy hybrid primer system for ultimate adhesion and corrosion resistance."
    },
    {
      id: "aos_trad_candy",
      name: "Traditional Candy Paint System",
      ratioText: "4 Parts Traditional Candy : 1 Part Candy Activator : 1 Part Superducer (4:1:1)",
      parts: [
        { role: "candy", name: "Traditional Candy Base", ratio: 4, defaultDensity: 0.94 },
        { role: "activator", name: "Traditional Candy Activator", ratio: 1, defaultDensity: 0.98 },
        { role: "reducer", name: "Superducer / Reducer", ratio: 1, defaultDensity: 0.82 }
      ],
      description: "Ultra-vivid, deep candy paint system built by custom painters for maximum depth."
    },
    {
      id: "aos_solid_base",
      name: "Ace of Shades Solid & Metallic Basecoats",
      ratioText: "1 Part Solid/Metallic Base : 1 Part Superducer Reducer (1:1)",
      parts: [
        { role: "base", name: "Solid / Fine Metallic Base", ratio: 1, defaultDensity: 0.96 },
        { role: "reducer", name: "Superducer Reducer", ratio: 1, defaultDensity: 0.82 }
      ],
      description: "Custom high-opacity basecoats designed for smooth atomization and fast flash time."
    },
    {
      id: "aos_whoop_ass_clear",
      name: "Whoop Ass Speed Clear / Super Shine 79",
      ratioText: "2 Parts Clearcoat : 1 Part Super-Charger Activator (2:1)",
      parts: [
        { role: "clear", name: "Whoop Ass Speed Clear / Super Shine 79", ratio: 2, defaultDensity: 0.99 },
        { role: "activator", name: "Super-Charger / Foxy Activator", ratio: 1, defaultDensity: 1.01 }
      ],
      description: "Ultra high-gloss, fast drying urethane clearcoat system."
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
