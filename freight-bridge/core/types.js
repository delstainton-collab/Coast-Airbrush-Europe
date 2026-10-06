/**
 * Shared constants and types for Freight Bridge
 */

export const ShipmentStatus = {
  QUOTE: "QUOTE",
  PENDING_DISPATCH: "PENDING_DISPATCH",
  BOOKED: "BOOKED",
  PICKED_UP: "PICKED_UP",
  IN_TRANSIT: "IN_TRANSIT",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED"
};

export const AccessorialType = {
  LIFTGATE: "LIFTGATE",
  RESIDENTIAL: "RESIDENTIAL",
  INSIDE_DELIVERY: "INSIDE_DELIVERY",
  HAZARDOUS_ADR: "HAZARDOUS_ADR",
  APPOINTMENT_CALL: "APPOINTMENT_CALL",
  TAIL_LIFT_PICKUP: "TAIL_LIFT_PICKUP"
};

export const PalletStandard = {
  EURO_PALLET: {
    name: "EUR-EPAL 1",
    lengthCm: 120,
    widthCm: 80,
    maxHeightCm: 180,
    tareWeightKg: 25,
    maxWeightKg: 1500,
    volumeM3: 1.728
  },
  INDUSTRIAL_PALLET: {
    name: "EUR-EPAL 2 (Industrial / ISO)",
    lengthCm: 120,
    widthCm: 100,
    maxHeightCm: 180,
    tareWeightKg: 30,
    maxWeightKg: 1500,
    volumeM3: 2.16
  }
};

export const DEFAULT_COAST_SHIPPING_RULES = {
  minFreightWeightKg: 30, // Orders >= 30kg qualify or require LTL pallet options
  ltlMandatoryWeightKg: 70, // Over 70kg parcel couriers reject, LTL mandatory
  hazardousKeywords: ["un1263", "solvent", "flammable", "thinner", "clearcoat", "reducer", "automotive lacquer"],
  oversizedKeywords: ["drum", "55-gal", "barrel", "booth", "compressor", "pallet-only", "bulk kit"],
  palletStandard: "EURO_PALLET",
  markupPercent: 15.0, // 15% merchant margin on wholesale freight
  markupFixedCents: 1000, // €10.00 handling surcharge
  accessorials: {
    liftgateDeliveryCents: 3500, // €35.00
    residentialDeliveryCents: 4000, // €40.00
    insideDeliveryCents: 5000, // €50.00
    hazardousAdrCents: 2500, // €25.00
    appointmentCallCents: 1500 // €15.00
  },
  defaultOrigin: {
    company: "Coast Airbrush Europe BV - Bonded Logistics Hub",
    name: "EU Fulfillment Center",
    address1: "Maasvlakte Haven 42",
    city: "Rotterdam",
    province: "South Holland",
    postalCode: "3011 AA",
    country: "NL",
    phone: "+31 10 555 0199",
    email: "logistics@coastairbrush.eu"
  }
};
