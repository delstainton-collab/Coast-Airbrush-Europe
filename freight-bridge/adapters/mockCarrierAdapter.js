import { CarrierAdapter } from "./baseAdapter.js";
import { generateProNumber } from "../core/crypto.js";
import { ShipmentStatus } from "../core/types.js";

const EUROPEAN_ZONE_RATES = {
  // Base cost per pallet in cents, transit days
  ZONE_1: { countries: ["NL", "BE", "LU"], basePalletCents: 6500, perKgCents: 15, days: 1 },
  ZONE_2: { countries: ["DE", "FR"], basePalletCents: 9500, perKgCents: 20, days: 2 },
  ZONE_3: { countries: ["AT", "DK", "GB", "UK"], basePalletCents: 13500, perKgCents: 25, days: 3 },
  ZONE_4: { countries: ["IT", "ES", "PL", "CZ", "SE"], basePalletCents: 17500, perKgCents: 30, days: 4 },
  ZONE_5: { countries: ["PT", "IE", "FI", "GR", "RO", "HU", "CH", "NO"], basePalletCents: 22000, perKgCents: 35, days: 5 }
};

function getDestinationZone(countryCode = "NL") {
  const code = countryCode.toUpperCase();
  for (const [zoneKey, zone] of Object.entries(EUROPEAN_ZONE_RATES)) {
    if (zone.countries.includes(code)) {
      return { zoneKey, ...zone };
    }
  }
  // Default to Zone 4 for other European countries
  return { zoneKey: "ZONE_4", ...EUROPEAN_ZONE_RATES.ZONE_4 };
}

export class MockLtlCarrierAdapter extends CarrierAdapter {
  constructor(accountConfig = {}) {
    super({
      carrierId: "mock-ltl",
      name: "Coast Freight LTL Autonomous Fleet",
      ...accountConfig
    });
  }

  async getRates(request) {
    const { destination, density, appliedAccessorials = [] } = request;
    const destCountry = (destination && destination.country) || "NL";
    const zone = getDestinationZone(destCountry);

    const palletCount = density?.palletCount || 1;
    const chargeableWeight = density?.chargeableWeightKg || 100;

    // Calculate base line-haul wholesale cost
    const lineHaulWholesaleCents =
      palletCount * zone.basePalletCents + Math.round(chargeableWeight * zone.perKgCents);

    const today = new Date();
    const addDays = (d, count) => {
      const copy = new Date(d);
      copy.setDate(copy.getDate() + count);
      return copy.toISOString().split("T")[0];
    };

    const rates = [];

    // Service 1: Standard Euro Pallet Freight
    rates.push({
      carrierId: this.carrierId,
      carrierName: this.carrierName,
      serviceCode: "CAE_LTL_STD",
      serviceName: "Coast Freight LTL - Standard European Road",
      description: `Guaranteed European LTL ground delivery on ${palletCount} EUR-pallet(s). Tail-lift equipped.`,
      transitDays: zone.days + 1,
      minDeliveryDate: addDays(today, zone.days + 1),
      maxDeliveryDate: addDays(today, zone.days + 2),
      baseCostCents: lineHaulWholesaleCents,
      currency: "EUR"
    });

    // Service 2: Priority Express LTL
    rates.push({
      carrierId: this.carrierId,
      carrierName: this.carrierName,
      serviceCode: "CAE_LTL_EXP",
      serviceName: "Coast Freight Express - Priority Dedicated Slot",
      description: "Direct scheduled dispatch with automated driver call & priority hub transit.",
      transitDays: Math.max(1, zone.days),
      minDeliveryDate: addDays(today, Math.max(1, zone.days)),
      maxDeliveryDate: addDays(today, Math.max(1, zone.days) + 1),
      baseCostCents: Math.round(lineHaulWholesaleCents * 1.35),
      currency: "EUR"
    });

    // Service 3: Economy Groupage (for non-urgent delivery)
    rates.push({
      carrierId: this.carrierId,
      carrierName: this.carrierName,
      serviceCode: "CAE_LTL_ECO",
      serviceName: "Coast Freight Economy - Consolidation Network",
      description: "Cost-effective consolidated freight network for non-urgent shipments.",
      transitDays: zone.days + 3,
      minDeliveryDate: addDays(today, zone.days + 3),
      maxDeliveryDate: addDays(today, zone.days + 5),
      baseCostCents: Math.round(lineHaulWholesaleCents * 0.85),
      currency: "EUR"
    });

    return rates;
  }

  async bookShipment(bookingRequest) {
    const proNumber = generateProNumber("CAE-FLEET");
    const bookingId = `BK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const today = new Date();
    const pickupDate = new Date(today.getTime() + 24 * 3600 * 1000).toISOString().split("T")[0];

    return {
      success: true,
      carrierId: this.carrierId,
      carrierName: this.carrierName,
      bookingId,
      proNumber,
      status: ShipmentStatus.BOOKED,
      pickupDate,
      estimatedDeliveryDate: new Date(today.getTime() + 72 * 3600 * 1000).toISOString().split("T")[0],
      trackingUrl: `http://localhost:3015/api/freight/track/${proNumber}`,
      driverNotes: "Rotterdam Bonded Hub pickup bay 4. Tail-lift required at delivery."
    };
  }

  async trackShipment(proNumber) {
    const now = new Date();
    return {
      proNumber,
      carrierId: this.carrierId,
      carrierName: this.carrierName,
      currentStatus: ShipmentStatus.IN_TRANSIT,
      origin: "Rotterdam Bonded Hub, NL",
      destination: "European Customer Site",
      events: [
        {
          timestamp: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
          status: ShipmentStatus.BOOKED,
          location: "Rotterdam, NL",
          description: "Shipment booking confirmed & pallet bay assigned"
        },
        {
          timestamp: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
          status: ShipmentStatus.PICKED_UP,
          location: "Maasvlakte Logistics Hub, Rotterdam",
          description: "Driver collected and scanned pallets into line-haul network"
        },
        {
          timestamp: now.toISOString(),
          status: ShipmentStatus.IN_TRANSIT,
          location: "Venlo Cross-Dock Facility, NL",
          description: "In transit to destination delivery terminal"
        }
      ]
    };
  }

  async cancelShipment(proNumber, reason = "Merchant requested cancellation") {
    return {
      success: true,
      carrierId: this.carrierId,
      proNumber,
      status: ShipmentStatus.CANCELLED,
      cancelledAt: new Date().toISOString(),
      message: `Shipment ${proNumber} cancelled successfully. Reason: ${reason}`
    };
  }
}
