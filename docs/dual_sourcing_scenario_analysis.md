# Coast Airbrush Europe: Dual-Sourcing & Supply Chain Scenario Analysis Blueprint

> [!IMPORTANT]
> **Executive Mandate & Founder Supply Chain Scenarios**  
> This strategic analysis evaluates two operational supply chain scenarios specified by the founder for Coast Airbrush Europe's product fulfillment:
> 1. **Scenario 1 (Large Bulk Pre-Orders)**: Direct bulk ocean shipment from Signal Japan to Coast Airbrush Europe (NL/UK hubs), commercial invoicing via Coast USA, utilizing Japanese REX origin declarations for 0% Preferential Duty under EU-Japan EPA / UK-Japan CEPA.
> 2. **Scenario 2 (Small Pre-Orders / Rapid Air Replenishment)**: Direct air/LCL shipment from Coast USA warehouse in California, commercial invoicing via Coast USA, subject to standard MFN tariffs (6.5% paints, 1.7% hardware) and air freight surcharges.

---

## Strategic Supply Chain Architecture Comparison

```mermaid
graph TD
    subgraph Scenario 1: Large Bulk Pre-Orders (Direct Japan Ocean)
        JapanFactory["🇯🇵 Signal Japan Factory\n(Physical Manufacturing & Origin)"]
        CoastUS_Billing1["🇺🇸 Coast USA Inc\n(Commercial Invoicing & Intercompany Billing)"]
        JapanREX["📜 REX Origin Statement\n(0% Duty EU-Japan EPA / UK-Japan CEPA)"]
        OceanFreight["🚢 Bulk Ocean Freight (FCL/LCL)\n(Lowest Freight Cost / €2.50-€4.00 per unit)"]
        EU_NL_Hub1["🇳🇱 Netherlands Bonded 3PL Hub\n(Landed Cost: €37.20 / Margin: 69%)"]
    end

    subgraph Scenario 2: Small Pre-Orders (US Air Replenishment)
        USWarehouse["🇺🇸 Coast USA Warehouse (California)\n(Physical Stock Holding & Shipping)"]
        CoastUS_Billing2["🇺🇸 Coast USA Inc\n(Commercial Invoicing & Retail Billing)"]
        US_Tariffs["📜 Standard MFN Tariffs\n(6.5% Paint Duty / 1.7% Hardware Duty)"]
        AirFreight["✈️ Air Cargo / Fast LCL\n(Higher Freight Cost / €12.00-€22.00 per unit + Hazmat)"]
        EU_NL_Hub2["🇳🇱 Netherlands Bonded 3PL Hub\n(Landed Cost: €59.20 / Margin: 51%)"]
    end

    JapanFactory -->|Physical Bulk Shipment| OceanFreight
    JapanFactory -->|Provides REX Statement| JapanREX
    CoastUS_Billing1 -->|Issues Commercial Invoice| EU_NL_Hub1
    JapanREX -->|0% Duty Clearance| EU_NL_Hub1
    OceanFreight -->|Arrives Rotterdam/Felixstowe| EU_NL_Hub1

    USWarehouse -->|Physical Air Freight| AirFreight
    CoastUS_Billing2 -->|Issues Commercial Invoice| EU_NL_Hub2
    US_Tariffs -->|Standard Duty Clearance| EU_NL_Hub2
    AirFreight -->|Arrives Amsterdam/London| EU_NL_Hub2
```

---

## Section 1: Detailed Legal Customs & Tax Analysis

### 1.1 Scenario 1: Tripartite Direct Japan Trade Flow (0% Preferential Duty)

Under Scenario 1, Coast Airbrush Europe executes a **Tripartite International Supply Chain** that optimizes both legal customs tariffs and operational cash flow:

- **Physical Movement**: Goods move directly from Signal Japan's manufacturing facility to the Netherlands Bonded 3PL (Rotterdam) or UK 3PL (Felixstowe).
- **Billing Movement**: Coast USA issues the commercial invoice to Coast Airbrush Europe (or Netherlands BV).
- **Customs & Rules of Origin Compliance**:
  - Under World Customs Organization (WCO) and EU/UK customs law, **Country of Origin is determined by physical manufacturing origin (Japan)**, NOT by the billing entity location (USA).
  - Signal Japan includes its **Registered Exporter (REX) Identification Number** on the commercial shipping documents:
    > *"The exporter of the products covered by this document (REX No. JP-REX-XXXXX) declares that, except where otherwise clearly indicated, these products are of Japanese preferential origin under the EU-Japan EPA / UK-Japan CEPA."*
  - **Customs Duty Result**: Customs authorities in Netherlands and UK apply **0.0% Preferential Duty** on airbrushes, spray guns, and paints originating from Signal Japan.

---

### 1.2 Scenario 2: US Warehouse Direct Replenishment (MFN Tariffs)

Under Scenario 2, smaller pre-order batches or urgent inventory restocks are fulfilled directly from Coast USA's warehouse inventory in California:

- **Physical Movement**: Goods are packed and shipped via air cargo or express LCL sea freight from California to UK/EU hubs or direct end-users.
- **Customs & Rules of Origin Compliance**:
  - The goods are classified as **US Export Origin** (or non-preferential re-export).
  - Applicable Customs Tariffs:
    - **Solvent Paints (HS Code 3208.10/90)**: Standard Most Favored Nation (MFN) tariff rate of **6.5%**.
    - **Airbrushes & Spray Guns (HS Code 8424.20.00)**: Standard MFN tariff rate of **1.7% to 3.7%**.
  - **IATA Hazmat Surcharge**: Air freight shipments of UN1263 Class 3 solvent liquids require UN-certified packaging and dangerous goods declarations, incurring **€8.00 to €15.00 per unit in air Hazmat surcharges**.

---

## Section 2: Comparative Landed Cost & Profitability Engine

### 2.1 Numerical Parameters

- **Base Product 1: Kroma Edge Solvent Custom Paint Kit (Quart Basecoat + Reducer)**
  - Supplier Base Price (FOB): **\$35.00 USD** (\(€32.20 \text{ EUR}\) at 0.92 FX rate). Weight: 1.2 kg. HS Code: 3208.10.
  - Retail Price (excl. VAT): **€119.95 EUR**.
- **Base Product 2: Precision Airbrush / Spray Gun Unit (Kroma / Iwata Spec)**
  - Supplier Base Price (FOB): **\$220.00 USD** (\(€202.40 \text{ EUR}\) at 0.92 FX rate). Weight: 0.6 kg. HS Code: 8424.20.
  - Retail Price (excl. VAT): **€499.00 EUR**.

---

### 2.2 Landed Cost Computation Matrix

| Cost Component | Scenario 1: Paint Kit (Japan Ocean Bulk) | Scenario 2: Paint Kit (US Air Restock) | Scenario 1: Spray Gun (Japan Ocean Bulk) | Scenario 2: Spray Gun (US Air Restock) |
| :--- | :--- | :--- | :--- | :--- |
| **1. Converted Supplier FOB** | €32.20 EUR | €32.20 EUR | €202.40 EUR | €202.40 EUR |
| **2. Inbound Freight (Ocean vs Air)** | €3.00 EUR | €14.00 EUR | €1.50 EUR | €12.00 EUR |
| **3. Dangerous Goods (Hazmat) Surcharge** | €1.50 EUR (Bulk ADR) | €8.00 EUR (IATA Air) | €0.00 EUR | €0.00 EUR |
| **4. Customs Brokerage Entry Fee** | €0.50 EUR | €2.00 EUR | €1.00 EUR | €2.00 EUR |
| **5. Applicable Duty Rate** | **0.0%** (Japan REX EPA) | **6.5%** (US MFN Rate) | **0.0%** (Japan REX EPA) | **1.7%** (US MFN Rate) |
| **6. Calculated Duty Expense** | **€0.00 EUR** | \((€32.20+€14) \times 6.5\% = \mathbf{€3.00\text{ EUR}}\) | **€0.00 EUR** | \((€202.40+€12) \times 1.7\% = \mathbf{€3.64\text{ EUR}}\) |
| **TOTAL LANDED COST PER UNIT** | **€37.20 EUR** | **€59.20 EUR** | **€204.90 EUR** | **€220.04 EUR** |

---

### 2.3 Gross Profit & Margin Comparison Table

| Product & Scenario | Landed Cost (€) | B2C Retail Price (excl. VAT) | Gross Profit (€) | Gross Margin (%) | Margin Delta vs Scenario 1 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Kroma Edge Paint Kit — Scenario 1 (Japan Bulk)** | **€37.20** | **€119.95** | **€82.75** | **68.99%** | **Baseline (Maximum Profit)** |
| **Kroma Edge Paint Kit — Scenario 2 (US Air Restock)** | **€59.20** | **€119.95** | **€60.75** | **50.65%** | **-18.34 percentage points** |
| **Spray Gun Unit — Scenario 1 (Japan Bulk)** | **€204.90** | **€499.00** | **€294.10** | **58.94%** | **Baseline (Maximum Profit)** |
| **Spray Gun Unit — Scenario 2 (US Air Restock)** | **€220.04** | **€499.00** | **€278.96** | **55.90%** | **-3.04 percentage points** |

> [!NOTE]
> **Key Strategic Takeaways**:
> 1. **Paint Profit Sensitivity**: Bulk ocean shipments from Japan (Scenario 1) yield a massive **68.99% gross margin** on paint kits. Shipping small paint batches via US air freight (Scenario 2) reduces margins to 50.65% due to 6.5% customs duty and €8/unit IATA Hazmat surcharges.
> 2. **Hardware Profit Stability**: Airbrush hardware margins remain highly resilient under both scenarios (58.94% vs 55.90%) because hardware is non-hazardous and carries a low 1.7% MFN duty rate.
> 3. **Dual-Sourcing Strategy**: Scenario 1 should serve as the **Primary Planned Supply Chain** for all pre-order releases and core seasonal restocks. Scenario 2 acts as a **Rapid Backup Buffer** to prevent stockouts during unexpected demand spikes.

---

## Section 3: Integration into Master Playbook & Shopify Ecosystem

To operationalize both scenarios across Coast Airbrush Europe's master documents:

1. **`docs/business_tax_strategy_playbook.md` Updates**:
   - Integrated the Tripartite Trade Flow model (Signal Japan physical origin + Coast USA commercial billing + REX 0% duty clearance).
   - Updated Landed Cost Engine formulas to handle dual-sourcing origin inputs (Japan EPA vs US MFN).
2. **`docs/kroma_edge_shopify_ecosystem_blueprint.md` Updates**:
   - Configured Katana MRP / Linnworks to route bulk pre-order procurement to Signal Japan (Scenario 1) while establishing automated reorder points for US warehouse air buffer stock (Scenario 2).
