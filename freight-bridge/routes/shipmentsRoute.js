import fs from "fs";
import { db } from "../core/db.js";
import { CarrierRegistry } from "../adapters/carrierRegistry.js";
import { ShipmentStatus } from "../core/types.js";

export async function handleListShipments(tenantId, filters = {}) {
  return db.listShipments(tenantId, filters);
}

export async function handleGetShipment(idOrPro) {
  let shipment = db.getShipment(idOrPro);
  if (!shipment) {
    shipment = db.getShipmentByPro(idOrPro);
  }
  return shipment;
}

export async function handleTrackShipment(proNumber) {
  const shipment = db.getShipmentByPro(proNumber);
  if (!shipment) {
    const err = new Error(`Shipment with PRO number ${proNumber} not found`);
    err.statusCode = 404;
    throw err;
  }

  // Find carrier account to use adapter's real-time track
  const accounts = db.getCarrierAccounts(shipment.tenantId);
  const account = accounts.find(a => a.carrierId === shipment.carrierId) || accounts[0];

  if (account) {
    const adapter = CarrierRegistry.getAdapter(account);
    const tracking = await adapter.trackShipment(proNumber);
    return {
      ...tracking,
      shipment
    };
  }

  return {
    proNumber,
    carrierName: shipment.carrierName,
    currentStatus: shipment.status,
    events: []
  };
}

export function handleGetBolHtml(proNumber) {
  const shipment = db.getShipmentByPro(proNumber);
  if (!shipment || !shipment.bolFilePath) {
    return null;
  }

  if (fs.existsSync(shipment.bolFilePath)) {
    return fs.readFileSync(shipment.bolFilePath, "utf8");
  }

  return null;
}

export async function handleCancelShipment(proNumber, reason = "User requested cancellation") {
  const shipment = db.getShipmentByPro(proNumber);
  if (!shipment) {
    const err = new Error(`Shipment ${proNumber} not found`);
    err.statusCode = 404;
    throw err;
  }

  const accounts = db.getCarrierAccounts(shipment.tenantId);
  const account = accounts.find(a => a.carrierId === shipment.carrierId) || accounts[0];

  let carrierResult = { success: true };
  if (account) {
    const adapter = CarrierRegistry.getAdapter(account);
    carrierResult = await adapter.cancelShipment(proNumber, reason);
  }

  shipment.status = ShipmentStatus.CANCELLED;
  shipment.cancelledAt = new Date().toISOString();
  shipment.cancellationReason = reason;
  db.saveShipment(shipment);

  return {
    success: true,
    proNumber,
    status: ShipmentStatus.CANCELLED,
    carrierResult
  };
}
