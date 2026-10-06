import { EventEmitter } from "events";
import { db } from "../core/db.js";
import { CarrierRegistry } from "../adapters/carrierRegistry.js";
import { evaluateFreightRules } from "../engine/freightRuleEngine.js";
import { generateBolDocument } from "./bolGenerator.js";
import { ShopifyClient } from "./shopifyClient.js";
import { ShipmentStatus } from "../core/types.js";

class BookingQueue extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.isProcessing = false;
  }

  /**
   * Enqueue a new freight booking job
   */
  async enqueue(jobData) {
    const jobId = `job_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const job = {
      id: jobId,
      tenantId: jobData.tenantId || "coast-airbrush-europe",
      orderId: jobData.orderId,
      orderNumber: jobData.orderNumber || `#${jobData.orderId}`,
      payload: jobData,
      status: "QUEUED",
      attempts: 0,
      maxAttempts: 3,
      error: null,
      shipmentId: null,
      createdAt: new Date().toISOString()
    };

    db.saveJob(job);
    this.queue.push(job);
    this.emit("job:enqueued", job);

    // Kick processor
    setImmediate(() => this.processNext());
    return job;
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const job = this.queue.shift();
    job.status = "PROCESSING";
    job.attempts += 1;
    db.saveJob(job);
    this.emit("job:processing", job);

    try {
      const result = await this.executeBooking(job);
      job.status = "COMPLETED";
      job.shipmentId = result.shipmentId;
      job.completedAt = new Date().toISOString();
      db.saveJob(job);
      this.emit("job:completed", { job, result });
    } catch (err) {
      console.error(`[BookingQueue] Error processing job ${job.id}:`, err.message);
      job.error = err.message;
      if (job.attempts < job.maxAttempts) {
        job.status = "RETRYING";
        db.saveJob(job);
        // Backoff and re-enqueue
        setTimeout(() => {
          this.queue.push(job);
          this.processNext();
        }, 1000 * job.attempts);
      } else {
        job.status = "FAILED";
        job.failedAt = new Date().toISOString();
        db.saveJob(job);
        this.emit("job:failed", { job, error: err });
      }
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setImmediate(() => this.processNext());
      }
    }
  }

  async executeBooking(job) {
    const { tenantId, payload } = job;
    const rules = db.getShippingRules(tenantId);
    const store = db.getTenant(tenantId);

    // 1. Evaluate rules and pallet density
    const ruleEval = evaluateFreightRules(payload, rules);

    // 2. Select carrier adapter
    const carrierAccounts = db.getCarrierAccounts(tenantId).filter(a => a.isActive);
    if (carrierAccounts.length === 0) {
      throw new Error(`No active carrier accounts configured for tenant: ${tenantId}`);
    }

    const preferredAccount =
      carrierAccounts.find(a => a.carrierId === payload.preferredCarrierId) || carrierAccounts[0];
    const adapter = CarrierRegistry.getAdapter(preferredAccount);

    // 3. Dispatch booking to freight carrier
    const carrierBooking = await adapter.bookShipment({
      shipmentId: job.id,
      origin: ruleEval.origin,
      destination: ruleEval.destination,
      density: ruleEval.density,
      accessorials: ruleEval.appliedAccessorials,
      orderNumber: job.orderNumber
    });

    const proNumber = carrierBooking.proNumber;
    const shipmentId = `shp_${proNumber}`;

    // 4. Generate Bill of Lading (CMR / BOL) PDF/HTML document
    const bolDoc = generateBolDocument({
      proNumber,
      orderNumber: job.orderNumber,
      carrierName: adapter.carrierName,
      bookingId: carrierBooking.bookingId,
      pickupDate: carrierBooking.pickupDate,
      origin: ruleEval.origin,
      destination: ruleEval.destination,
      density: ruleEval.density,
      isHazardous: ruleEval.isHazardous,
      hazmatMatches: ruleEval.hazmatMatches,
      appliedAccessorials: ruleEval.appliedAccessorials,
      driverNotes: carrierBooking.driverNotes
    });

    // 5. Store shipment record in DB
    const shipmentRecord = {
      id: shipmentId,
      tenantId,
      orderId: job.orderId,
      orderNumber: job.orderNumber,
      carrierId: adapter.carrierId,
      carrierName: adapter.carrierName,
      proNumber,
      bookingId: carrierBooking.bookingId,
      status: ShipmentStatus.BOOKED,
      origin: ruleEval.origin,
      destination: ruleEval.destination,
      density: ruleEval.density,
      appliedAccessorials: ruleEval.appliedAccessorials,
      accessorialTotalCents: ruleEval.accessorialTotalCents,
      pickupDate: carrierBooking.pickupDate,
      estimatedDeliveryDate: carrierBooking.estimatedDeliveryDate,
      bolUrl: bolDoc.url,
      bolFilePath: bolDoc.filePath,
      trackingUrl: carrierBooking.trackingUrl,
      createdAt: new Date().toISOString()
    };
    db.saveShipment(shipmentRecord);

    // 6. Push fulfillment update to Shopify Admin API
    const shopifyClient = new ShopifyClient(store?.shopDomain);
    await shopifyClient.createFulfillment(job.orderId, {
      proNumber,
      carrierName: adapter.carrierName,
      trackingUrl: carrierBooking.trackingUrl
    });

    return { shipmentId, proNumber, bolUrl: bolDoc.url };
  }
}

export const bookingQueue = new BookingQueue();
