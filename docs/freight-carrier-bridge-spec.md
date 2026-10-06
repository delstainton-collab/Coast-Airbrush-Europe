# Shopify Freight Carrier Integration & SaaS Blueprint
**Project:** Coast Airbrush Europe  
**Target:** Shopify Storefront & B2B Freight Logistics  
**Architecture:** Standalone Middleware / SaaS-Ready Microservice  

---

## 1. Executive Summary

This specification outlines the architecture for a freight middleware layer connecting Shopify (starting with Coast Airbrush Europe) to an LTL / freight carrier API.

While initially deployed for Coast Airbrush Europe, the system is architected from Day 1 with multi-tenancy and a carrier adapter pattern so it can seamlessly expand into a commercial SaaS product for other merchants.

---

## 2. Shopify Integration Points

### A. Real-Time Checkout Rates (`CarrierService` API)
- **Trigger:** Shopify checkout invokes the registered callback URL with destination address, cart line items, total weight, and dimensions.
- **Processing:**
  - Evaluates freight rules (e.g., minimum total weight, hazardous materials/paint restrictions, pallet density).
  - Calculates accessorial fees (liftgate, residential delivery, inside delivery).
  - Queries carrier API for live quotes.
  - Applies merchant markup/margin rules.
- **Latency Budget:** Must return rate responses in **< 3 seconds** (Shopify times out at 10s).

### B. Order Fulfillment & Dispatch (`orders/paid` or `fulfillments/create` Webhooks)
- **Trigger:** An order is paid, confirmed, or tagged for dispatch.
- **Processing:**
  - Queues an asynchronous booking task (via Redis / BullMQ).
  - Dispatches pickup request to freight carrier.
  - Generates and stores Bill of Lading (BOL) PDF and pallet shipping labels.
  - Updates Shopify Fulfillment via GraphQL Admin API with carrier name, PRO/tracking number, and tracking URL.

---

## 3. SaaS-Ready Multi-Tenant Architecture

```
                    ┌─────────────────────────┐
                    │      Shopify Store      │
                    │  (Coast Airbrush Europe)│
                    └───────────┬─────────────┘
                                │
                        HTTPS / Webhooks
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                 Freight Bridge Middleware                   │
│                                                             │
│  ┌────────────────────┐            ┌─────────────────────┐  │
│  │ Shopify Auth &     │            │ Freight Rule Engine │  │
│  │ Webhook Ingestion  │            │ (Density, Access.)  │  │
│  └─────────┬──────────┘            └──────────┬──────────┘  │
│            │                                  │             │
│            ▼                                  ▼             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │             Carrier Abstraction Adapter               │  │
│  │  - getRates()        - bookShipment()                 │  │
│  │  - trackShipment()   - cancelShipment()               │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│            ┌───────────────────────────┐                    │
│            │ Carrier-Specific Plugins  │                    │
│            │ (Carrier A, Carrier B...) │                    │
│            └─────────────┬─────────────┘                    │
└──────────────────────────┼──────────────────────────────────┘
                           │
                           ▼
                  [ Freight Carrier API ]
```

### Key Multi-Tenant Principles:
1. **Tenant ID Isolation:** All database tables (`stores`, `carrier_accounts`, `shipments`, `shipping_rules`) include `shop_id` / `tenant_id`.
2. **Adapter Pattern:** Standardized `CarrierAdapter` interface decoupling Shopify logic from any single carrier's API schema.
3. **Encrypted Credentials:** Carrier API keys, account numbers, and contracts are encrypted per tenant in PostgreSQL.
4. **Decoupled Job Queue:** Slow or flaky freight carrier SOAP/REST endpoints run inside background workers, preventing webhook dropouts.

---

## 4. Next Implementation Steps for Coast Airbrush Europe
1. Confirm the specific freight carrier or logistics broker API credentials.
2. Define freight thresholds (e.g. hazardous paint limits, heavy bulk drums, pallet requirements).
3. Decide deployment model (embedded into the existing Node.js server or standalone microservice registered on the next available port in `ecosystem.json`).
