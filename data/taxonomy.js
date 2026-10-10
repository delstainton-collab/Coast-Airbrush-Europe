/**
 * Coast Airbrush Europe - Master Category Taxonomy
 * 
 * Future-Proof 5-Department Architecture:
 * 1. Spray Equipment (spray-equipment)
 *    - Airbrushes
 *    - Spray Guns
 *    - Dry Flake Guns & Kits
 *    - Gun Accessories & Jars
 *    - Striping Brushes & Pinstriping
 * 2. Paints & Coatings (paints-coatings)
 *    - Solvent Primers
 *    - Solvent Basecoats
 *    - Clearcoats & Topcoats
 *    - Intercoats & Binders
 *    - Solvent Candies & Dyes
 *    - Spray-On Mirror Chrome
 *    - Waterborne Primers
 *    - Waterborne Basecoats
 *    - Waterborne Clears & Topcoats
 *    - Waterborne Candies
 * 3. Flakes & Special FX (flakes-special-fx)
 *    - Candy Color Flakes
 *    - Kromatic Shift Flakes
 *    - Specialty & Show Krome
 *    - Pearls & Chameleons
 *    - Gold & Metal Leaf
 * 4. Workstations, Stands & Jigs (workstations-jigs)
 *    - Work-Holding Jigs & Arms
 *    - Tool & Airbrush Holders
 *    - Tool Bars & Lighting Rigs
 *    - Base Stands & Easels
 *    - Fixings, Knobs & Hardware
 * 5. Masking & Prep (masking-prep)
 *    - Fine Line Masking Tapes
 *    - Surface Cleaners & Degreasers
 *    - Abrasives & Scuff Pads
 *
 * Golden Rule: Categories and subcategories with 0 assigned products
 * are INVISIBLE in customer-facing selectors until inventory exists.
 */

export const MASTER_TAXONOMY = [
  {
    id: "spray-equipment",
    name: "Spray Equipment",
    description: "Professional airbrushes, automotive spray guns, and dry flake dispersal equipment",
    icon: "precision_manufacturing",
    subcategories: [
      {
        id: "airbrushes",
        name: "Airbrushes",
        matchValues: ["Airbrush", "Airbrushes", "Airbrush Gun", "Iwata Airbrushes", "Custom Micron", "Eclipse Airbrushes"]
      },
      {
        id: "spray-guns",
        name: "Spray Guns",
        matchValues: ["Spray Guns", "Spray Gun", "Mini Spray Gun", "HVLP Spray Guns", "Touch-Up Guns"]
      },
      {
        id: "dry-flake-guns",
        name: "Dry Flake Guns & Kits",
        matchValues: [
          "Dry Metal Flake Guns",
          "Dry Flake Guns",
          "Dry Flake Guns & Kits",
          "Flake Guns",
          "Flake Guns & Kits",
          "flake-guns-all"
        ]
      },
      {
        id: "gun-accessories",
        name: "Gun Accessories & Jars",
        matchValues: [
          "Flake King Gun Accessories",
          "Gun Accessories",
          "Gun Accessories & Jars",
          "Flake Jars",
          "Adapters & Lids"
        ]
      },
      {
        id: "striping-brushes",
        name: "Striping Brushes & Pinstriping",
        matchValues: ["Striping Brushes", "Pinstriping Brushes", "Pinstripe Brush", "Sword Striper", "Scroll Brush"]
      }
    ]
  },
  {
    id: "paints-coatings",
    name: "Paints & Coatings",
    description: "Solvent and waterborne primers, basecoats, clears, candies, and special effect paint systems",
    icon: "format_paint",
    subcategories: [
      // Solvent Systems
      {
        id: "solvent-primers",
        name: "Solvent Primers",
        chemistry: "Solvent",
        paintStage: "Primer",
        matchValues: ["Solvent Primer", "Solvent Primers", "Primer", "2K Primer", "Epoxy Primer", "Urethane Primer"]
      },
      {
        id: "solvent-basecoats",
        name: "Solvent Basecoats",
        chemistry: "Solvent",
        paintStage: "Basecoat",
        matchValues: [
          "Solvent Basecoats",
          "Solvent Basecoat",
          "Prime Black Solvent Basecoat",
          "Solid & Metallic Basecoats",
          "Base Coat",
          "Basecoat"
        ]
      },
      {
        id: "solvent-clears",
        name: "Clearcoats & Topcoats",
        chemistry: "Solvent",
        paintStage: "Clearcoat",
        matchValues: [
          "Dedicated Clearcoats",
          "Topcoat Clear",
          "Clear Coat",
          "Show Clear",
          "2K Clearcoat",
          "Clearcoats",
          "Hydrophobic Topcoat Clear"
        ]
      },
      {
        id: "solvent-intercoats",
        name: "Intercoats & Binders",
        chemistry: "Solvent",
        paintStage: "Intercoat",
        matchValues: [
          "Basecoats & Binders",
          "Clear Intercoat Binders",
          "Intercoat Clear",
          "Flake Binder Resin",
          "Resins & Binders",
          "Wet Products"
        ]
      },
      {
        id: "solvent-candies",
        name: "Solvent Candies & Dyes",
        chemistry: "Solvent",
        paintStage: "FX / Flake",
        matchValues: ["Solvent Candies", "Solvent Candy", "Candies", "Candy", "Candy Concentrates", "Candy Dyes"]
      },
      {
        id: "chrome-systems",
        name: "Spray-On Mirror Chrome",
        chemistry: "Solvent",
        paintStage: "FX / Specialty",
        matchValues: [
          "Mirror Chrome Systems",
          "Spray-On Mirror Chrome",
          "Sprayable Chrome",
          "100% Mirror Chrome"
        ]
      },
      // Water-Based Systems
      {
        id: "wb-primers",
        name: "Waterborne Primers",
        chemistry: "Water-Based",
        paintStage: "Primer",
        matchValues: ["Waterborne Primers", "Waterborne Primer", "Water Based Primer", "WB Primer", "WB Primers"]
      },
      {
        id: "wb-basecoats",
        name: "Waterborne Basecoats",
        chemistry: "Water-Based",
        paintStage: "Basecoat",
        matchValues: [
          "Water Based Basecoat",
          "Water Based Basecoats",
          "WB Basecoat",
          "WB Basecoats",
          "Waterborne Basecoat",
          "Waterborne Basecoats",
          "Prime Black Waterborne Base",
          "Prime Black Base",
          "FK100 Prime Black Base",
          "FK100"
        ]
      },
      {
        id: "wb-binders",
        name: "Waterborne Binders & Thinners",
        chemistry: "Water-Based",
        paintStage: "Intercoat / Reducer",
        matchValues: [
          "Waterborne Binders & Thinners",
          "Waterborne Binders",
          "Waterborne Binder",
          "Waterborne Thinners",
          "Waterborne Thinner",
          "Water Based Binder",
          "Water Based Thinner",
          "FK50 Surface Binder",
          "FK55 Thinner",
          "FK50",
          "FK55",
          "WB Binders"
        ]
      },
      {
        id: "wb-clears",
        name: "Waterborne Clears & Topcoats",
        chemistry: "Water-Based",
        paintStage: "Clearcoat",
        matchValues: ["Waterborne Clears", "Waterborne Clear", "WB Clear", "Water Based Clear", "Water Based Clearcoat"]
      },
      {
        id: "wb-candies",
        name: "Waterborne Candies",
        chemistry: "Water-Based",
        paintStage: "FX / Flake",
        matchValues: ["Water Based Candies", "Water Based Candy", "WB Candies", "WB Candy", "Waterborne Candy", "Waterborne Candies"]
      }
    ]
  },
  {
    id: "flakes-special-fx",
    name: "Flakes & Special FX",
    description: "Solvent-proof dry metal flakes, color-shifting pigments, pearls, and leafing materials",
    icon: "auto_awesome",
    subcategories: [
      {
        id: "candy-flakes",
        name: "Candy Color Flakes",
        chemistry: "Dry",
        paintStage: "FX / Flake",
        matchValues: [
          "Candy Color Flakes",
          "Candy Flakes",
          "flake-candy",
          "Standard Flakes"
        ]
      },
      {
        id: "kromatic-flakes",
        name: "Kromatic Shift Flakes",
        chemistry: "Dry",
        paintStage: "FX / Flake",
        matchValues: [
          "Kromatic Shift Flakes",
          "Kromatic Flakes",
          "flake-kromatic",
          "Chameleon Flakes",
          "Iridescent Flakes"
        ]
      },
      {
        id: "specialty-flakes",
        name: "Specialty & Show Krome",
        chemistry: "Dry",
        paintStage: "FX / Flake",
        matchValues: [
          "Specialty & Show Krome",
          "Specialty Flakes",
          "flake-specialty",
          "Holographic Flakes",
          "Dry Metal Flake (Glitter)",
          "Dry Metal Flake",
          "Metal Flake",
          "Metal Flakes",
          "Flakes",
          "Glitter"
        ]
      },
      {
        id: "pearls",
        name: "Pearls & Chameleons",
        chemistry: "Dry",
        paintStage: "FX / Flake",
        matchValues: ["Pearls", "Chameleon Pearls", "Dry Pearls", "Effect Pearls", "Hyper-Shift Pearls", "Interference Pearls"]
      },
      {
        id: "gold-leaf",
        name: "Gold & Metal Leaf",
        chemistry: "Dry",
        paintStage: "FX / Flake",
        matchValues: ["Gold Leaf", "Silver Leaf", "Variegated Leaf", "Leafing Size", "Leafing"]
      }
    ]
  },
  {
    id: "workstations-jigs",
    name: "Workstations, Stands & Jigs",
    description: "Modular workpiece holding jigs, magnetic holders, studio lighting rigs, and base stands",
    icon: "handyman",
    subcategories: [
      {
        id: "work-holding-jigs",
        name: "Work-Holding Jigs & Arms",
        matchValues: [
          "Work-Holding Jigs",
          "Work-Holding Jigs & Arms",
          "Jigs",
          "Helmet Jigs",
          "Motorcycle Part Jigs",
          "Canvass Jig",
          "Vsion Easel Modules",
          "Car & Motorcycle Wheel Jig",
          "Skateboard Jig",
          "Thermal Mug Jig",
          "Guitar Parts Jigs",
          "Specialty Jigs"
        ]
      },
      {
        id: "airbrush-holders",
        name: "Tool & Airbrush Holders",
        matchValues: [
          "Tool & Airbrush Holders",
          "Airbrush & Tool Holders",
          "Airbrush Holders",
          "Airbrush Specific",
          "Storage, Comfort & Environment"
        ]
      },
      {
        id: "tool-bars-lighting",
        name: "Tool Bars & Lighting Rigs",
        matchValues: [
          "Tool Bars & Lighting Rigs",
          "Lighting Rigs & Tool Bars",
          "Lighting Rigs",
          "VsionAir Frame"
        ]
      },
      {
        id: "base-stands-easels",
        name: "Base Stands & Easels",
        matchValues: [
          "Base Stands & Easels",
          "Easels",
          "Stands",
          "Accessories"
        ]
      },
      {
        id: "hardware-fixings",
        name: "Fixings, Knobs & Hardware",
        matchValues: [
          "Fixings, Knobs & Hardware",
          "Hardware",
          "Fasteners",
          "VsionAir Fasteners",
          "VsionAir Knobs",
          "VsionAir Brackets"
        ]
      }
    ]
  },
  {
    id: "masking-prep",
    name: "Masking & Prep",
    description: "Fine line precision tapes, surface degreasers, and surface preparation consumables",
    icon: "content_cut",
    subcategories: [
      {
        id: "fine-line-tapes",
        name: "Fine Line Masking Tapes",
        matchValues: [
          "Masking Products",
          "Fine Line Tapes",
          "Fine Line Masking Tapes",
          "Tapes",
          "Precision Masking",
          "Prime Green Precision Tape",
          "Prime Orange High-Temp Tape"
        ]
      },
      {
        id: "surface-prep",
        name: "Surface Cleaners & Degreasers",
        matchValues: ["Surface Cleaners", "Surface Prep", "Cleaners & Degreasers", "Panel Wipe", "Tack Cloths"]
      },
      {
        id: "abrasives",
        name: "Abrasives & Scuff Pads",
        matchValues: ["Abrasives", "Sandpaper", "Scuff Pads", "Finishing Compounds"]
      }
    ]
  }
];

export function findTaxonomyCategory(catId) {
  if (!catId || catId === 'all') return null;
  const lower = catId.toLowerCase();

  // Legacy department ID aliases mapping to new 5 departments
  const legacyDeptMap = {
    'equipment': 'spray-equipment',
    'solvent-paints': 'paints-coatings',
    'water-based-paint': 'paints-coatings',
    'dry-special-fx': 'flakes-special-fx',
    'masking-products': 'masking-prep'
  };

  const resolvedId = legacyDeptMap[lower] || lower;

  for (const dept of MASTER_TAXONOMY) {
    if (dept.id.toLowerCase() === resolvedId || dept.name.toLowerCase() === lower) {
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
