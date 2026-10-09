// Coast Airbrush Europe — CRM Client Database Mock Store
// Extracted per Anti-God Monolith Architecture Skill (Law 2)

export const CRM_CLIENTS = {
  apex: {
    id: "apex",
    name: "Apex Custom Paintworks",
    type: "DEALER_T2",
    tierLabel: "DEALER TIER 2",
    badgeClass: "badge-red",
    location: "Unit 4, Silverstone Business Park, UK",
    contact: "Sarah Jensen (Head Painter)",
    email: "sarah.j@apexpaint.co.uk",
    phone: "+44 7911 123456",
    terms: "Net 30 Days",
    credit: "£18,400 / £25,000",
    spendYtd: "£142,100",
    skus: [
      { name: "Kroma Edge Candy Apple (500ml)", code: "KE-CANDY-RD", msrp: 45.0, tierDef: 27.0, customNet: 24.5, baseCost: 14.0 },
      { name: "Medusa Gold Micro Flake (100g)", code: "FK-FLAKE-GLD", msrp: 40.0, tierDef: 24.0, customNet: 21.0, baseCost: 11.5 },
      { name: "Slow Speed Reducer (5L Drum)", code: "KE-RED-SLW-5L", msrp: 90.0, tierDef: 54.0, customNet: 49.0, baseCost: 30.0 },
      { name: "Kroma Edge 2K Diamond Clear (5L)", code: "KE-CLR-2K-5L", msrp: 145.0, tierDef: 87.0, customNet: 78.0, baseCost: 48.0 }
    ]
  },
  nordic: {
    id: "nordic",
    name: "Nordics Paint Logistics B.V.",
    type: "DISTRIBUTOR",
    tierLabel: "MASTER DISTRIBUTOR",
    badgeClass: "badge-gold",
    location: "Havennummer 4022, Rotterdam Port, NL",
    contact: "Lars Lindqvist (Procurement Director)",
    email: "lars.l@nordicpaint.nl",
    phone: "+31 10 987 6543",
    terms: "Net 60 Days / SEPA B2B",
    credit: "€185,000 / €250,000",
    spendYtd: "€880,000",
    skus: [
      { name: "Kroma Edge Candy Apple (Pallet 48pk)", code: "KE-CANDY-PLT", msrp: 2160.0, tierDef: 1036.8, customNet: 980.0, baseCost: 650.0 },
      { name: "Speed Reducers (200L Master Drum)", code: "KE-RED-DRM-200", msrp: 1800.0, tierDef: 864.0, customNet: 810.0, baseCost: 520.0 }
    ]
  },
  dave: {
    id: "dave",
    name: "Dave's Kustom Airbrush Studio",
    type: "END_USER",
    tierLabel: "PRO ARTIST CLUB",
    badgeClass: "badge-chrome",
    location: "Bristol Custom Garages, UK",
    contact: "Dave Miller (Master Airbrush Artist)",
    email: "dave@kustomair.co.uk",
    phone: "+44 7700 900123",
    terms: "Instant Card / Stripe VIP",
    credit: "N/A (Retail VIP)",
    spendYtd: "£14,850",
    skus: [
      { name: "Kroma Edge Candy Apple (500ml)", code: "KE-CANDY-RD", msrp: 45.0, tierDef: 38.25, customNet: 36.0, baseCost: 14.0 },
      { name: "Flake King 1000 Dry Flake Gun", code: "FOM1000", msrp: 108.33, tierDef: 81.24, customNet: 75.0, baseCost: 48.75 }
    ]
  },
  helvetia: {
    id: "helvetia",
    name: "Helvetia Custom Coatings AG",
    type: "DEALER_T2",
    tierLabel: "SWISS EXCLUSIVE DEALER",
    badgeClass: "badge-red",
    location: "Industriestrasse 14, 8005 Zürich, Switzerland 🇨🇭",
    contact: "Marc Oberholzer (Managing Director)",
    email: "marc.o@helvetia-coatings.ch",
    phone: "+41 44 200 4567",
    terms: "Net 30 / CHF Invoicing (0% Export VAT)",
    credit: "CHF 35,000 / CHF 50,000",
    spendYtd: "CHF 194,500",
    vatNumber: "CHE-482.910.123 MWST",
    skus: [
      { name: "Kroma Edge Mirror Chrome (1260g Large Kit)", code: "KE-CHROME-1260", msrp: 295.0, tierDef: 177.0, customNet: 165.0, baseCost: 95.0 },
      { name: "Flake King 1000 Dry Flake Gun", code: "FOM1000", msrp: 108.33, tierDef: 65.0, customNet: 59.0, baseCost: 48.75 },
      { name: "Kroma Edge Dedicated Topcoat Clear (3600 SET)", code: "KE-TOPCOAT-3600", msrp: 420.0, tierDef: 252.0, customNet: 230.0, baseCost: 135.0 },
      { name: "Medusa Gold Micro Flake (1000g Bulk Tub)", code: "FK-FLAKE-GLD-1KG", msrp: 220.0, tierDef: 132.0, customNet: 118.0, baseCost: 65.0 }
    ]
  }
};
