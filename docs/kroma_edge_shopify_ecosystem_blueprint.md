# Kroma Edge Master Distribution & Shopify E-Commerce Ecosystem Blueprint
## Coast Airbrush Europe: Technical Architecture, Platform Appraisal & Add-On Stack Analysis

> [!IMPORTANT]
> **Executive Mandate & Dual-Sourcing Update**  
> This master blueprint establishes the distribution model for **Kroma Edge** solvent-based custom paints (manufactured by Signal / Show Up), designs the dual-domain architecture (`coastairbrush.eu` and `coastairbrush.co.uk`), presents an authoritative platform appraisal for Shopify Plus, and defines the complete enterprise add-on tech stack.
>
> **DUAL-SOURCING SUPPLY CHAIN MANDATE**:
> - **Scenario 1 (Large Bulk Pre-Orders)**: Shipped direct from Signal Japan to NL/UK 3PL hubs via bulk ocean cargo. Commercial invoicing via Coast USA, clearing at **0% Preferential Duty** under EU-Japan EPA / UK-Japan CEPA via Signal Japan's REX origin declaration (**Landed Cost: €37.20 / Gross Margin: 68.99%**).
> - **Scenario 2 (Small Pre-Orders / Air Restock)**: Shipped direct from Coast USA warehouse in California via air freight, subject to standard MFN tariffs (6.5% paints, 1.7% hardware) (**Landed Cost: €59.20 / Gross Margin: 50.65%**).

---

## Strategic Architecture Overview

```mermaid
graph TD
    subgraph Manufacturer & Global Sourcing Scenarios
        SignalJapan["🇯🇵 Signal Japan Factory\n(Scenario 1: Large Pre-Orders / 0% REX Duty)"]
        CoastUS_WH["🇺🇸 Coast USA California Warehouse\n(Scenario 2: Small Pre-Orders / Air Restock)"]
    end

    subgraph Master Distribution Hub
        CAE["🎨 Coast Airbrush Europe\n(Exclusive Master Distributor for UK & Europe)"]
    end

    subgraph Multi-Domain E-Commerce Platform
        ShopifyPlus["🛒 Shopify Plus Commerce Engine\n(100% Upfront Payment Gateway Engine)"]
        EU_Domain["🇪🇺 coastairbrush.eu\n(Primary EU Hub / EUR / OSS VAT)"]
        UK_Domain["🇬🇧 coastairbrush.co.uk\n(UK Hub / GBP / UK PVA VAT)"]
    end

    subgraph Specialized Add-On Stack
        Mixer["秤 Custom Digital Paint Mixing Calculator"]
        B2B["🏢 Enterprise B2B Dealer Portal (100% Upfront / VIES)"]
        Hazmat["☣️ Dangerous Goods (UN1263 ADR) Engine"]
        ERP["📦 Katana MRP / Linnworks Dual-Sourcing ERP Sync"]
    end

    subgraph European Distribution Network
        Dealers["🏪 Authorized European Dealers & Jobbers\n(100% Upfront Prepaid)"]
        ProPainters["🏎️ Custom Auto Body Shops & Pro Painters\n(100% Upfront Prepaid)"]
        Retail["🖌️ B2C Fine Artists & Hobbyists\n(100% Upfront Prepaid)"]
    end

    SignalJapan -->|Bulk Ocean Shipment| CAE
    CoastUS_WH -->|Air Replenishment| CAE
    CAE -->|Powers| ShopifyPlus
    ShopifyPlus --> EU_Domain
    ShopifyPlus --> UK_Domain
    ShopifyPlus --> Mixer
    ShopifyPlus --> B2B
    ShopifyPlus --> Hazmat
    ShopifyPlus --> ERP

    EU_Domain -->|Prepaid Wholesale Portal| Dealers
    EU_Domain -->|Prepaid Direct & Dealer Sales| ProPainters
    UK_Domain -->|Prepaid Retail & Pro Sales| Retail
```

---

## Section 1: Kroma Edge Master Distribution Architecture

### 1.1 Dual-Sourcing Fulfillment Matrix

| Operational Metric | Scenario 1: Large Bulk Pre-Orders (Japan Ocean) | Scenario 2: Small Restocks (US Air) |
| :--- | :--- | :--- |
| **Physical Origin** | Signal Japan Factory (Yokohama/Tokyo) | Coast USA Warehouse (California) |
| **Commercial Invoicing** | Coast USA Inc | Coast USA Inc |
| **Inbound Logistics** | Bulk Ocean FCL/LCL (Port of Rotterdam / Felixstowe) | Air Cargo / Express LCL (Schiphol / Heathrow) |
| **Customs Duty Rate** | **0.0% Preferential Tariff** (EU-Japan EPA REX) | **6.5% MFN Tariff** (Solvent Paints HS 3208) |
| **Landed Cost (Paint Kit)**| **€37.20 EUR** | **€59.20 EUR** |
| **Gross Margin (%)** | **68.99%** | **50.65%** |
| **Operational Role** | Primary planned pre-order & seasonal container supply | Rapid backup buffer to eliminate stockout risk |

---

## Section 2: Domain Architecture & Global Multi-Storefront Routing

### 2.1 Multi-Domain Routing Architecture

Managed via **Shopify Markets** with Cloudflare Workers Geo-IP redirection (`coastairbrush.eu` for 27 EU Member States in EUR; `coastairbrush.co.uk` for UK in GBP) with `hreflang` canonicalization (`en-gb`, `en-eu`, `de-de`, `x-default`).

---

## Section 3: Shopify Add-On Stack & ERP Dual-Sourcing Workflow

### 3.1 Katana MRP & Linnworks Procurement Logic

```
                               ┌────────────────────────────────┐
                               │  SHOPIFY PLUS ORDER ENGINE     │
                               └───────────────┬────────────────┘
                                               │
                                               ▼
                               ┌────────────────────────────────┐
                               │ Katana MRP Inventory Analyzer  │
                               └───────────────┬────────────────┘
                                               │
                    ┌──────────────────────────┴──────────────────────────┐
                    ▼                                                     ▼
┌───────────────────────────────────────┐             ┌───────────────────────────────────────┐
│     BATCH SIZE \ge CONTAINER THRESHOLD  │             │     EMERGENCY LOW STOCK TRIGGER       │
└───────────────────┬───────────────────┘             └───────────────────┬───────────────────┘
                    │                                                     │
                    ▼                                                     ▼
┌───────────────────────────────────────┐             ┌───────────────────────────────────────┐
│ Route Purchase Order to Signal Japan  │             │ Route Purchase Order to Coast USA WH  │
│ - Mode: Bulk Ocean Cargo              │             │ - Mode: Air Cargo / Express LCL       │
│ - Tariff: 0.0% EPA REX Statement      │             │ - Tariff: 6.5% MFN Tariff             │
│ - Landed Cost: €37.20 (Margin 69%)    │             │ - Landed Cost: €59.20 (Margin 51%)    │
└───────────────────────────────────────┘             └───────────────────────────────────────┘
```

---

## Technical Integration & Implementation Checklist

> [!CHECKLIST]
> **Shopify & ERP Launch Milestones**
> - [ ] **Signal Japan REX Registration**: Embed Signal Japan REX ID on Katana purchase order templates.
> - [ ] **Katana MRP Sourcing Rules**: Configure automated purchase order routing for Scenario 1 (Japan Ocean) and Scenario 2 (US Air).
> - [ ] **Custom Paint Mixing Calculator**: Deploy mixing ratio calculator extension on `coastairbrush.eu` and `coastairbrush.co.uk`.
> - [ ] **100% Upfront B2B Gateway**: Enforce upfront card/SEPA payment on Shopify Plus B2B portals prior to releasing orders to Dutch/UK 3PLs.
