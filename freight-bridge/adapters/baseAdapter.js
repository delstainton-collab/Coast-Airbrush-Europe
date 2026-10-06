/**
 * Base Carrier Adapter Interface
 * All freight carrier plugins (Mainfreight, Dachser, Schenker, Mock) must implement this.
 */
export class CarrierAdapter {
  constructor(accountConfig = {}) {
    this.accountConfig = accountConfig;
    this.carrierId = accountConfig.carrierId || "generic-carrier";
    this.carrierName = accountConfig.name || "Generic Freight Carrier";
    this.isSandbox = Boolean(accountConfig.isSandbox);
  }

  /**
   * Fetch live freight quotes from the carrier
   * @param {Object} request
   * @returns {Promise<Array<CarrierRateQuote>>}
   */
  async getRates(request) {
    throw new Error(`getRates() not implemented in ${this.constructor.name}`);
  }

  /**
   * Book shipment and schedule pickup
   * @param {Object} bookingRequest
   * @returns {Promise<ShipmentBookingResult>}
   */
  async bookShipment(bookingRequest) {
    throw new Error(`bookShipment() not implemented in ${this.constructor.name}`);
  }

  /**
   * Query real-time tracking status
   * @param {string} proNumber
   * @returns {Promise<TrackingStatusResult>}
   */
  async trackShipment(proNumber) {
    throw new Error(`trackShipment() not implemented in ${this.constructor.name}`);
  }

  /**
   * Cancel an existing shipment booking
   * @param {string} proNumber
   * @param {string} reason
   * @returns {Promise<ShipmentCancelResult>}
   */
  async cancelShipment(proNumber, reason) {
    throw new Error(`cancelShipment() not implemented in ${this.constructor.name}`);
  }
}
