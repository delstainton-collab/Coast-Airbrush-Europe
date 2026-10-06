# Freight Carrier Bridge Implementation Plan

## Goal
Build a SaaS-ready, multi-tenant freight carrier bridge middleware connecting Shopify (Coast Airbrush Europe) to LTL/freight carrier APIs with real-time checkout rates, automated booking, and BOL generation.

## Tasks
- [x] Task 1: Initialize architecture & multi-tenant storage with AES-256-GCM encryption (`freight-bridge/core/`) → Verify: `node test/test-core.js` passes.
- [x] Task 2: Build Pallet Density Calculator & ADR Hazmat Freight Rule Engine (`freight-bridge/engine/`) → Verify: rule engine calculates pallet requirements and accessorial fees correctly.
- [x] Task 3: Build Carrier Adapter interface, Mock LTL Carrier, and Mainfreight Europe adapter (`freight-bridge/adapters/`) → Verify: `getRates()` and `bookShipment()` return structured carrier responses.
- [x] Task 4: Implement Asynchronous Booking Queue & PDF/HTML Bill of Lading (BOL) generator (`freight-bridge/services/`) → Verify: queued jobs generate BOL with PRO number.
- [x] Task 5: Build Shopify CarrierService API rate handler & order fulfillment webhooks (`freight-bridge/routes/`) → Verify: POST `/api/freight/rates` returns Shopify-compliant rates in < 500ms.
- [x] Task 6: Build Merchant & Operator Management Dashboard UI (`freight-bridge/public/`) → Verify: web UI loads on designated port with rate simulator, shipment tracker, and BOL viewer.
- [x] Task 7: Integrate with `server.js`, register microservice on port 3015 in `ecosystem.json`, and run end-to-end test suite → Verify: all tests pass and live server endpoints respond.

## Done When
- [x] Shopify CarrierService returns valid pallet/LTL freight rates based on cart weight, density, and hazmat restrictions.
- [x] Webhook listener ingests paid orders and queues asynchronous freight dispatch.
- [x] BOL documents and tracking numbers are generated and recorded per tenant.
- [x] Multi-tenant isolation and encrypted carrier credentials are fully functional.
- [x] Registered in `ecosystem.json` and integrated with automated test verification.
