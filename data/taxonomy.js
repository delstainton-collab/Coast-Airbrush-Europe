/**
 * Coast Airbrush Europe - Master Category Taxonomy
 * 
 * Strict 2-tier departmental hierarchy:
 * 1. Paint & Spray Equipment
 *    - Airbrush
 *    - Spray Guns
 *    - Dry Flake Guns
 *    - Striping Brushes
 * 2. Solvent Paints
 *    - Primer
 *    - Base Coat
 *    - Candies
 *    - Flake
 *    - Clear Coat
 *    - Pin Striping Paint
 * 3. Water Based Paint
 *    - Basecoats
 *    - Candies
 *    - Flakes
 * 4. Dry Special FX Products
 *    - Pearls
 *    - Flakes
 *    - Gold Leaf
 * 5. Masking Products
 *    - Fine Line Tapes
 * 6. Workstations & Jigs
 *    - Work-Holding Jigs
 *    - Tool Bars & Lighting Rigs
 *    - Tool & Airbrush Holders
 *    - Base Stands & Easels
 *    - Fixings, Knobs & Hardware
 *
 * Golden Rule: Categories and subcategories with 0 assigned products
 * are INVISIBLE in customer-facing selectors until products exist.
 */

export const MASTER_TAXONOMY = [
  {
    id: "equipment",
    name: "Paint & Spray Equipment",
    subcategories: [
      {
        id: "airbrush",
        name: "Airbrush",
        matchValues: ["Airbrush", "Airbrushes", "Airbrush Gun", "Iwata Airbrushes"]
      },
      {
        id: "spray-guns",
        name: "Spray Guns",
        matchValues: ["Spray Guns", "Spray Gun", "Mini Spray Gun", "HVLP Spray Guns"]
      },
      {
        id: "dry-flake-guns",
        name: "Dry Flake Guns",
        matchValues: [
          "Dry Metal Flake Guns",
          "Flake King Gun Accessories",
          "Flake Guns",
          "Dry Flake Guns",
          "Flake Guns & Kits",
          "Gun Accessories",
          "Gun Accessories & Jars",
          "flake-guns-all"
        ]
      },
      {
        id: "striping-brushes",
        name: "Striping Brushes",
        matchValues: ["Striping Brushes", "Pinstriping Brushes", "Pinstripe Brush", "Sword Striper", "Scroll Brush"]
      }
    ]
  },
  {
    id: "solvent-paints",
    name: "Solvent Paints",
    subcategories: [
      {
        id: "primer",
        name: "Primer",
        matchValues: ["Primer", "Solvent Primer", "Epoxy Primer", "Hybrid Primer"]
      },
      {
        id: "base-coat",
        name: "Base Coat",
        matchValues: [
          "Base Coat",
          "Basecoats & Binders",
          "Mirror Chrome Systems",
          "Basecoat",
          "Solid & Metallic Basecoats",
          "Sprayable Chrome",
          "Wet Products"
        ]
      },
      {
        id: "candies",
        name: "Candies",
        matchValues: ["Candies", "Candy", "Traditional Candy", "Candy Concentrates"]
      },
      {
        id: "flake",
        name: "Flake",
        matchValues: ["Solvent Flake", "Solvent-Proof Flake"]
      },
      {
        id: "clear-coat",
        name: "Clear Coat",
        matchValues: ["Clear Coat", "Dedicated Clearcoats", "Topcoat Clear", "Show Clear", "2K Clearcoat", "Clearcoats"]
      },
      {
        id: "pinstriping-paint",
        name: "Pin Striping Paint",
        matchValues: ["Pin Striping Paint", "Pinstriping Paint", "Striping Enamel"]
      }
    ]
  },
  {
    id: "water-based-paint",
    name: "Water Based Paint",
    subcategories: [
      {
        id: "wb-basecoats",
        name: "Basecoats",
        matchValues: ["Water Based Basecoat", "Water Based Basecoats", "WB Basecoat", "WB Basecoats", "Waterborne Basecoat"]
      },
      {
        id: "wb-candies",
        name: "Candies",
        matchValues: ["Water Based Candies", "Water Based Candy", "WB Candies", "WB Candy", "Waterborne Candy"]
      },
      {
        id: "wb-flakes",
        name: "Flakes",
        matchValues: ["Water Based Flakes", "WB Flakes", "Waterborne Flakes"]
      }
    ]
  },
  {
    id: "dry-special-fx",
    name: "Dry Special FX Products",
    subcategories: [
      {
        id: "pearls",
        name: "Pearls",
        matchValues: ["Pearls", "Chameleon Pearls", "Dry Pearls", "Effect Pearls", "Hyper-Shift Pearls"]
      },
      {
        id: "dry-flakes",
        name: "Flakes",
        matchValues: [
          "Dry Metal Flake (Glitter)",
          "Dry Metal Flake",
          "Metal Flake",
          "Glitter",
          "Flakes",
          "Metal Flakes"
        ]
      },
      {
        id: "gold-leaf",
        name: "Gold Leaf",
        matchValues: ["Gold Leaf", "Silver Leaf", "Variegated Leaf", "Leafing Size", "Leafing"]
      }
    ]
  },
  {
    id: "masking-products",
    name: "Masking Products",
    subcategories: [
      {
        id: "fine-line-tapes",
        name: "Fine Line Tapes",
        matchValues: ["Masking Products", "Fine Line Tapes", "Tapes", "Precision Masking", "Airbrush Stencils"]
      }
    ]
  },
  {
    id: "workstations-jigs",
    name: "Workstations & Jigs",
    subcategories: [
      {
        id: "work-holding-jigs",
        name: "Work-Holding Jigs",
        matchValues: ["Work-Holding Jigs", "Jigs"]
      },
      {
        id: "tool-bars-lighting",
        name: "Tool Bars & Lighting Rigs",
        matchValues: ["Tool Bars & Lighting Rigs", "Lighting Rigs & Tool Bars", "Lighting Rigs"]
      },
      {
        id: "airbrush-holders",
        name: "Tool & Airbrush Holders",
        matchValues: ["Tool & Airbrush Holders", "Airbrush & Tool Holders", "Airbrush Holders"]
      },
      {
        id: "base-stands-easels",
        name: "Base Stands & Easels",
        matchValues: ["Base Stands & Easels", "Easels", "Stands"]
      },
      {
        id: "hardware-fixings",
        name: "Fixings, Knobs & Hardware",
        matchValues: ["Fixings, Knobs & Hardware", "Hardware", "Fasteners", "VsionAir Fasteners"]
      }
    ]
  }
];

export function findTaxonomyCategory(catId) {
  if (!catId || catId === 'all') return null;
  const lower = catId.toLowerCase();
  for (const dept of MASTER_TAXONOMY) {
    if (dept.id.toLowerCase() === lower || dept.name.toLowerCase() === lower) {
      return { type: 'department', dept };
    }
    for (const sub of dept.subcategories) {
      if (
        sub.id.toLowerCase() === lower || 
        sub.name.toLowerCase() === lower || 
        sub.matchValues.some(v => v.toLowerCase() === lower)
      ) {
        return { type: 'subcategory', dept, sub };
      }
    }
  }
  return null;
}
