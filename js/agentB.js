// Coast Airbrush Europe - Agent B: Autonomous Order & Logistics AI Agent ("The Order Concierge")

export const MOCK_ORDERS = [
  {
    orderId: "EU-10492",
    customerName: "Klaus Schneider (Custom Kolors Germany)",
    customerEmail: "klaus@customkolors.de",
    customerPhone: "+49 170 8291034",
    shippingAddress: {
      street: "Industriestrasse 14",
      city: "Stuttgart",
      postalCode: "70565",
      country: "Germany",
      countryCode: "DE",
      vatNumber: "DE318294012"
    },
    orderDate: "2026-08-28T09:15:00Z",
    currentStage: "customs_cleared", // stages: order_received, solvent_mixed, picked_packed_adr, dispatched, customs_cleared, out_for_delivery, delivered
    carrier: "DHL Express Hazmat ADR",
    trackingNumber: "DHL-EU-884920194DE",
    estimatedDelivery: "2026-08-31",
    vatRate: 0.19, // 19% German VAT (EU OSS)
    items: [
      { sku: "KE-CHROME-1L", name: "Kroma Edge Liquid Chrome (1L)", qty: 2, priceUSD: 145.00 },
      { sku: "KE-PRIMER-BLK", name: "Jet Black Mirror Gloss Primer (1L)", qty: 2, priceUSD: 54.95 },
      { sku: "KE-CLEAR-1.5L", name: "Kroma Edge Speed Clearcoat Kit (1.5L)", qty: 4, priceUSD: 89.95 }
    ],
    batchId: "B-2026-0829",
    adrClassification: "UN1263 PAINT RELATED MATERIAL, Class 3, PG II, (D/E), LIMITED QUANTITY (ADR 3.4)"
  },
  {
    orderId: "UK-88214",
    customerName: "Liam Evans (Speed & Chrome UK)",
    customerEmail: "liam@speedandchrome.co.uk",
    customerPhone: "+44 7700 900482",
    shippingAddress: {
      street: "Unit 4, Silverstone Business Park",
      city: "Towcester",
      postalCode: "NN12 8TJ",
      country: "United Kingdom",
      countryCode: "GB",
      vatNumber: "GB948201844"
    },
    orderDate: "2026-08-29T14:30:00Z",
    currentStage: "dispatched",
    carrier: "DPD UK Hazmat Express",
    trackingNumber: "DPD-UK-9948201849",
    estimatedDelivery: "2026-09-01",
    vatRate: 0.20, // 20% UK Postponed VAT Accounting (PVA)
    items: [
      { sku: "FK-500-GUN", name: "Flake King 500 Dry Flake Spray Gun", qty: 1, priceUSD: 189.00 },
      { sku: "FK-MICRO-SILVER", name: "Flake King 0.015 Holographic Silver 100g", qty: 3, priceUSD: 24.00 },
      { sku: "KE-CLEAR-1.5L", name: "Kroma Edge Speed Clearcoat Kit (1.5L)", qty: 1, priceUSD: 89.95 }
    ],
    batchId: "B-2026-0829-UK",
    adrClassification: "UN1263 PAINT, Class 3, PG II, LIMITED QUANTITY"
  },
  {
    orderId: "EU-10505",
    customerName: "Mathieu Dubois (Atelier Airbrush France)",
    customerEmail: "mathieu@atelier-airbrush.fr",
    customerPhone: "+33 6 12 34 56 78",
    shippingAddress: {
      street: "88 Rue de la République",
      city: "Lyon",
      postalCode: "69002",
      country: "France",
      countryCode: "FR",
      vatNumber: "FR82910482910"
    },
    orderDate: "2026-08-30T08:00:00Z",
    currentStage: "solvent_mixed",
    carrier: "PostNL / DPD Europe",
    trackingNumber: "NL-POST-77382910FR",
    estimatedDelivery: "2026-09-02",
    vatRate: 0.20, // 20% French VAT (EU OSS)
    items: [
      { sku: "KE-PRIMER-BLK", name: "Jet Black Mirror Gloss Primer (1L)", qty: 1, priceUSD: 54.95 },
      { sku: "KE-PEARL-NEB", name: "Kroma Edge Nebula Color-Shift Pearl 25g", qty: 2, priceUSD: 28.50 },
      { sku: "KE-CLEAR-1.5L", name: "Kroma Edge Speed Clearcoat Kit (1.5L)", qty: 1, priceUSD: 89.95 }
    ],
    batchId: "B-2026-0830-FR",
    adrClassification: "UN1263 PAINT RELATED MATERIAL, Class 3, PG II, LIMITED QUANTITY"
  }
];

export const MILESTONE_STAGES = [
  { key: "order_received", label: "Order Received", icon: "receipt_long", desc: "Payment verified & entered production queue" },
  { key: "solvent_mixed", label: "Solvent Batch Mixed", icon: "science", desc: "Precision gram-weighed & lab batch labeled" },
  { key: "picked_packed_adr", label: "Picked & Packed (ADR LQ)", icon: "inventory_2", desc: "Hazard compliant limited quantity packaging verified" },
  { key: "dispatched", label: "Dispatched from Hub", icon: "local_shipping", desc: "Handed over to carrier network" },
  { key: "customs_cleared", label: "EU / UK Customs Cleared", icon: "verified", desc: "VAT declaration & cross-border transit processed" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: "near_me", desc: "Courier on route to destination" },
  { key: "delivered", label: "Delivered", icon: "check_circle", desc: "Signed and received by customer" }
];

export class OrderConciergeAI {
  constructor() {
    this.orders = [...MOCK_ORDERS];
  }

  getOrder(orderId) {
    if (!orderId) return null;
    const cleanId = orderId.toUpperCase().replace("#", "").trim();
    return this.orders.find(o => o.orderId === cleanId || o.trackingNumber.includes(cleanId)) || null;
  }

  /**
   * Generates a proactive multi-channel notification simulation (WhatsApp, SMS, Email).
   */
  generateNotification(order, channel = "whatsapp") {
    if (!order) return null;

    const currentStageObj = MILESTONE_STAGES.find(s => s.key === order.currentStage) || MILESTONE_STAGES[0];
    const totalAmount = order.items.reduce((sum, item) => sum + (item.priceUSD * item.qty), 0);

    if (channel === "whatsapp") {
      return {
        channel: "WhatsApp",
        recipient: order.customerPhone,
        header: `*Coast Airbrush Europe - Live Order Update (#${order.orderId})*`,
        body: `Hello ${order.customerName},\n\nYour order status has updated to: *${currentStageObj.label}* ✅\n\n📌 *Details:* ${currentStageObj.desc}\n🚚 *Carrier:* ${order.carrier}\n📦 *Tracking:* \`${order.trackingNumber}\`\n⏱️ *Est. Delivery:* ${order.estimatedDelivery}\n\nTap here to view real-time GPS tracking or download your EU OSS / UK PVA VAT Invoice: https://coastairbrush.eu/track/${order.orderId}`
      };
    } else if (channel === "sms") {
      return {
        channel: "SMS",
        recipient: order.customerPhone,
        header: `COAST AIRBRUSH ALERT: #${order.orderId}`,
        body: `Your order is now: ${currentStageObj.label}. Carrier: ${order.carrier}. Tracking: ${order.trackingNumber}. Track live: https://coastairbrush.eu/track/${order.orderId}`
      };
    } else {
      return {
        channel: "Email",
        recipient: order.customerEmail,
        header: `Your Coast Airbrush Europe Order #${order.orderId} Update: ${currentStageObj.label}`,
        body: `Dear ${order.customerName},\n\nWe are pleased to inform you that your custom paint order (#${order.orderId}) is now: ${currentStageObj.label}.\n\nMilestone Note: ${currentStageObj.desc}\nCarrier: ${order.carrier}\nTracking Reference: ${order.trackingNumber}\nADR Classification: ${order.adrClassification}\n\nThank you for choosing Coast Airbrush Europe.`
      };
    }
  }

  /**
   * Generates a fully compliant commercial VAT Invoice (Sufio / Xero format).
   */
  generateVatInvoice(order) {
    if (!order) return null;

    const subtotalUSD = order.items.reduce((sum, i) => sum + (i.priceUSD * i.qty), 0);
    const vatUSD = subtotalUSD * order.vatRate;
    const totalUSD = subtotalUSD + vatUSD;
    
    // Exchange rates approx for EU & UK display
    const eurRate = 0.92;
    const gbpRate = 0.79;

    return {
      invoiceNumber: `INV-CAE-${order.orderId}`,
      invoiceDate: new Date(order.orderDate).toLocaleDateString("en-GB"),
      seller: {
        company: "Coast Airbrush Europe B.V.",
        address: "Distributieweg 44, 2645 EJ Delfgauw, Netherlands",
        eori: "NL861928401B01",
        vatId: "NL861928401B01 / UK PVA: GB992810284"
      },
      buyer: {
        name: order.customerName,
        address: `${order.shippingAddress.street}, ${order.shippingAddress.postalCode} ${order.shippingAddress.city}, ${order.shippingAddress.country}`,
        vatNumber: order.shippingAddress.vatNumber || "N/A"
      },
      lineItems: order.items.map(item => ({
        sku: item.sku,
        description: item.name,
        qty: item.qty,
        unitPriceUSD: item.priceUSD,
        totalPriceUSD: item.priceUSD * item.qty
      })),
      totals: {
        subtotalUSD: subtotalUSD.toFixed(2),
        vatRatePercent: (order.vatRate * 100).toFixed(0) + "%",
        vatAmountUSD: vatUSD.toFixed(2),
        totalUSD: totalUSD.toFixed(2),
        totalEUR: (totalUSD * eurRate).toFixed(2),
        totalGBP: (totalUSD * gbpRate).toFixed(2)
      },
      hazmatDeclaration: order.adrClassification
    };
  }

  /**
   * Handles natural language inquiries from customers.
   */
  answerCustomerQuery(query) {
    const q = (query || "").toLowerCase();
    
    // Check if query contains an order number
    const match = q.match(/(eu-\d+|uk-\d+|\b\d{5}\b)/i);
    let order = null;
    if (match) {
      order = this.getOrder(match[0]);
    }

    if (q.includes("where") || q.includes("status") || q.includes("track") || q.includes("package")) {
      if (order) {
        const stage = MILESTONE_STAGES.find(s => s.key === order.currentStage);
        return {
          order: order,
          text: `Order **#${order.orderId}** for *${order.customerName}* is currently at milestone: **${stage.label}**.\n\n` +
                `- **Carrier**: ${order.carrier}\n` +
                `- **Tracking Number**: \`${order.trackingNumber}\`\n` +
                `- **Estimated Delivery**: ${order.estimatedDelivery}\n` +
                `- **ADR Compliance**: ${order.adrClassification}`
        };
      }
      return {
        order: null,
        text: `Please provide your Order Number (e.g. \`EU-10492\` or \`UK-88214\`) so I can check real-time satellite tracking and customs clearance status for you.`
      };
    }

    if (q.includes("invoice") || q.includes("vat") || q.includes("tax") || q.includes("receipt")) {
      if (order) {
        return {
          order: order,
          text: `I have retrieved the commercial VAT invoice for **#${order.orderId}** (EU OSS / UK PVA Compliant). You can click the **Download Commercial VAT Invoice** button below to view or print it.`
        };
      }
      return {
        order: null,
        text: `To retrieve your EU OSS / UK PVA VAT invoice, please specify your order number (e.g. \`EU-10492\`).`
      };
    }

    if (q.includes("address") || q.includes("change") || q.includes("shipping")) {
      if (order) {
        if (order.currentStage === "dispatched" || order.currentStage === "customs_cleared" || order.currentStage === "out_for_delivery") {
          return {
            order: order,
            text: `⚠️ Order **#${order.orderId}** has already reached stage: **${order.currentStage.replace(/_/g, " ").toUpperCase()}**. ` +
                  `Because it has left our distribution hub, address changes must be requested directly via your carrier (${order.carrier}) using tracking number \`${order.trackingNumber}\`.`
          };
        } else {
          return {
            order: order,
            text: `✅ Order **#${order.orderId}** is still in mixing & packaging at our hub. Our AI Concierge has routed your address modification request to dispatch prior to carrier handover.`
          };
        }
      }
    }

    return {
      order: order,
      text: `Hello! I am **Agent B ("The Order Concierge")**. I can track your shipment across European carriers (DPD, DHL Express, PostNL), provide customs status, simulate WhatsApp/SMS alerts, and generate official EU OSS / UK PVA VAT invoices. How can I help you today?`
    };
  }
}
