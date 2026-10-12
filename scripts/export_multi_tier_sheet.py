#!/usr/bin/env python3
"""
Coast Airbrush Europe - Multi-Tier Pricing & Categorization Master Sheet Generator
Generates a comprehensive CSV sheet ready for Google Sheets containing:
- Categorization: Department (Master Category), Subcategory, Product Type
- Consumer (MSRP) Pricing (ex-VAT and inc-20% VAT)
- Rolled-up BOM Unit Cost (ex-VAT GBP & EUR)
- Dealer (Tier 2) Pricing (ex-VAT), Discount %, Margin % & MOQ/MOV rules
- Distributor (Tier 1) Pricing (ex-VAT), Discount %, Margin % & MOQ/MOV rules
- Authentic SKUs, Code 128 Barcodes, HS Tariff Codes & Weights
Enforces Category Discount Tracks & Strict Margin Floor Protection (Min 25% Dist / Min 35% Dealer).
"""

import csv
import json
import os

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_SRC = os.path.join(ROOT_DIR, "data", "shopify_products_with_hs_codes.csv")
PRICEBOOK_SRC = os.path.join(ROOT_DIR, "data", "b2b_pricebook_secure.json")
OUTPUT_CSV = os.path.join(ROOT_DIR, "data", "coast_master_multi_tier_pricing_sheet.csv")
BOM_RECIPES_PATH = os.path.join(ROOT_DIR, "bom-engine", "data", "product_recipes.json")
BOM_COMPONENTS_PATH = os.path.join(ROOT_DIR, "bom-engine", "data", "components_registry.json")

DEPARTMENT_MAP = {
    "Base Stands & Easels": ("Workstations & Jigs", "Base Stands & Easels"),
    "Basecoats & Binders": ("Solvent Paints", "Base Coat"),
    "Dedicated Clearcoats": ("Solvent Paints", "Clear Coat"),
    "Dry Metal Flake (Glitter)": ("Dry Special FX Products", "Flakes"),
    "Dry Metal Flake Guns": ("Paint & Spray Equipment", "Dry Flake Guns"),
    "Fixings, Knobs & Hardware": ("Workstations & Jigs", "Fixings, Knobs & Hardware"),
    "Flake King Gun Accessories": ("Paint & Spray Equipment", "Dry Flake Guns"),
    "Masking Products": ("Masking Products", "Fine Line Tapes"),
    "Mirror Chrome Systems": ("Solvent Paints", "Base Coat"),
    "Tool & Airbrush Holders": ("Workstations & Jigs", "Tool & Airbrush Holders"),
    "Tool Bars & Lighting Rigs": ("Workstations & Jigs", "Tool Bars & Lighting Rigs"),
    "Work-Holding Jigs": ("Workstations & Jigs", "Work-Holding Jigs")
}

def load_bom_data():
    recipes = {}
    components = {}
    if os.path.exists(BOM_RECIPES_PATH):
        with open(BOM_RECIPES_PATH, "r", encoding="utf-8") as f:
            recipes = json.load(f)
    if os.path.exists(BOM_COMPONENTS_PATH):
        with open(BOM_COMPONENTS_PATH, "r", encoding="utf-8") as f:
            components = json.load(f)

    recipe_cogs = {}
    recipe_retails = {}
    for sku, r in recipes.items():
        mat = 0
        for c in r.get("components", []):
            comp = components.get(c.get("sku"), {})
            unit = comp.get("unitCostGbp", 0)
            q = c.get("qty", 1) * (1 + c.get("scrapFactor", 0))
            mat += q * unit
        labor = (r.get("assemblyTimeMinutes", 0) / 60) * r.get("assemblyLaborRatePerHour", 36)
        recipe_cogs[sku] = round(mat + labor, 2)
        if r.get("retailPriceGbp"):
            recipe_retails[sku] = float(r["retailPriceGbp"])

    spare_cogs = {sku: c.get("unitCostGbp", 0) for sku, c in components.items()}
    return recipe_cogs, spare_cogs, recipe_retails

def calculate_variant_cogs(handle, sku, title, vendor, raw_type, pack, retail_gbp, recipe_cogs, spare_cogs):
    # 1. Exact BOM recipe
    if sku in recipe_cogs:
        return recipe_cogs[sku]
    if handle in recipe_cogs:
        return recipe_cogs[handle]
    # 2. Components registry
    if sku in spare_cogs and spare_cogs[sku] > 0:
        return spare_cogs[sku]
    # 3. Flake King metal flakes
    if "Flake" in raw_type or "Glitter" in raw_type:
        if "30g" in pack:
            return 2.15  # Glass jar + seal + synthetic label + portioning labor + metal flake
        elif "100g" in pack:
            return 4.20  # 100g tub + label + labor + metal flake
        elif "1000g" in pack or "1 Kilo" in pack:
            return 28.50 # 1kg master tub + metal flake
        return round(retail_gbp * 0.35, 2)
    # 4. Kroma Edge Mirror Chrome
    if "Mirror Chrome" in raw_type:
        if "140g" in pack or "Small" in pack:
            return 55.56
        elif "420g" in pack or "Medium" in pack:
            return 148.20
        elif "1260g" in pack or "Large" in pack:
            return 385.00
        elif "2520g" in pack or "Extra Large" in pack:
            return 690.00
        return round(retail_gbp * 0.25, 2)
    # 5. Dedicated Clearcoats
    if "Dedicated Clearcoats" in raw_type or "Clearcoat" in title:
        if "180" in pack:
            return 18.50
        elif "900" in pack:
            return 72.00
        elif "3600" in pack:
            return 245.00
        return round(retail_gbp * 0.28, 2)
    # 6. VsionAir Jigs, Stands & Workstations
    if vendor == "VsionAir":
        if "Jig" in raw_type or "Jig" in title:
            return round(retail_gbp * 0.52, 2)
        elif "Rig" in title or "Lighting" in raw_type:
            return round(retail_gbp * 0.42, 2)
        return round(retail_gbp * 0.40, 2)
    # 7. Masking Tape & Consumables
    if "Masking" in raw_type:
        return round(retail_gbp * 0.38, 2)
    # 8. Aqueous Chemistry (FK50, FK55, FK100)
    if "Basecoats" in raw_type or "Water-Based" in raw_type:
        return round(retail_gbp * 0.28, 2)

    return round(retail_gbp * 0.35, 2)

def get_track_discounts(vendor, raw_type, pack):
    # Track 2: Equipment, Spray Guns, Jigs, Stands & Rigs
    if "Guns" in raw_type or "Jig" in raw_type or "Workstations" in raw_type or "Rig" in raw_type or "Stands" in raw_type or vendor == "VsionAir":
        return 0.20, 0.30
    # Track 3: Small-format Artist Jars & Tapes
    if ("Flake" in raw_type or "Glitter" in raw_type) and ("30g" in pack or "100g" in pack):
        return 0.20, 0.30
    if "Masking" in raw_type:
        return 0.20, 0.30
    # Track 1: High-margin Chemicals, Binders & 1kg Bulk Flakes
    return 0.30, 0.50

def run():
    with open(CSV_SRC, mode="r", encoding="utf-8") as f:
        products = list(csv.DictReader(f))

    recipe_cogs, spare_cogs, recipe_retails = load_bom_data()

    eur_rate = 1.176  # Standard EUR multiplier
    vat_rate = 0.20   # Standard UK 20% VAT

    fieldnames = [
        "Handle",
        "Title",
        "Vendor",
        "Department (Master Category)",
        "Subcategory",
        "Product Type",
        "Variant SKU",
        "Pack Size (Option1)",
        "Barcode (Code 128)",
        "Consumer Retail (ex-VAT GBP)",
        "Consumer Retail (inc-20% VAT GBP)",
        "Consumer Retail (ex-VAT EUR)",
        "Consumer Retail (inc-21% VAT EUR)",
        "Unit Cost (ex-VAT GBP)",
        "Unit Cost (ex-VAT EUR)",
        "Dealer Discount %",
        "Dealer Price (ex-VAT GBP)",
        "Dealer Price (ex-VAT EUR)",
        "Dealer Margin %",
        "Dealer MOQ (Units)",
        "Dealer MOV (Order Minimum ex-VAT GBP)",
        "Distributor Discount %",
        "Distributor Price (ex-VAT GBP)",
        "Distributor Price (ex-VAT EUR)",
        "Distributor Margin %",
        "Distributor MOQ (Units)",
        "Distributor MOV (Order Minimum ex-VAT GBP)",
        "HS Tariff Code",
        "Country of Origin",
        "Weight (Grams)"
    ]

    out_rows = []

    for row in products:
        handle = row.get("Handle", "").strip()
        sku = row.get("Variant SKU", "").strip()
        title = row.get("Title", "").strip()
        vendor = row.get("Vendor", "").strip()
        raw_type = row.get("Type", "").strip()
        pack = row.get("Option1 Value", "").strip()
        dept, subcat = DEPARTMENT_MAP.get(raw_type, ("General Custom Finishing", raw_type))

        retail_str = row.get("Variant Price", "0").strip()
        retail_gbp = float(retail_str) if retail_str else 0.0
        if retail_gbp <= 0 and sku in recipe_retails and recipe_retails[sku] > 0:
            retail_gbp = recipe_retails[sku]
        retail_gbp_inc_vat = round(retail_gbp * (1 + vat_rate), 2)
        retail_eur = round(retail_gbp * eur_rate, 2)
        retail_eur_inc_vat = round(retail_eur * 1.21, 2)

        if retail_gbp <= 0:
            cogs_gbp = 0.0
            cogs_eur = 0.0
            dealer_gbp = 0.0
            dealer_eur = 0.0
            dist_gbp = 0.0
            dist_eur = 0.0
            dealer_pct = 0.0
            dist_pct = 0.0
            dealer_margin_pct = 0.0
            dist_margin_pct = 0.0
        else:
            cogs_gbp = calculate_variant_cogs(handle, sku, title, vendor, raw_type, pack, retail_gbp, recipe_cogs, spare_cogs)
            cogs_eur = round(cogs_gbp * eur_rate, 2)

            target_dealer_disc, target_dist_disc = get_track_discounts(vendor, raw_type, pack)

            dealer_tentative = round(retail_gbp * (1 - target_dealer_disc), 2)
            dist_tentative = round(retail_gbp * (1 - target_dist_disc), 2)

            # Strict Margin Floor Protection: Distributor min 25% margin, Dealer min 35% margin
            min_dist_price = round(cogs_gbp / 0.75, 2)
            min_dealer_price = round(cogs_gbp / 0.65, 2)

            dist_gbp = max(dist_tentative, min_dist_price)
            dealer_gbp = max(dealer_tentative, min_dealer_price)

            # Ensure strict hierarchy: COGS < Dist <= Dealer <= Retail
            if dist_gbp > dealer_gbp:
                dealer_gbp = round(dist_gbp / 0.88, 2)
            if dealer_gbp > retail_gbp:
                dealer_gbp = retail_gbp
            if dist_gbp > dealer_gbp:
                dist_gbp = round(dealer_gbp * 0.90, 2)

            dist_eur = round(dist_gbp * eur_rate, 2)
            dealer_eur = round(dealer_gbp * eur_rate, 2)

            dealer_pct = round((1 - (dealer_gbp / retail_gbp)) * 100, 1)
            dist_pct = round((1 - (dist_gbp / retail_gbp)) * 100, 1)

            dealer_margin_pct = round(((dealer_gbp - cogs_gbp) / dealer_gbp) * 100, 1) if dealer_gbp > 0 else 0.0
            dist_margin_pct = round(((dist_gbp - cogs_gbp) / dist_gbp) * 100, 1) if dist_gbp > 0 else 0.0

        out_rows.append({
            "Handle": handle,
            "Title": title,
            "Vendor": vendor,
            "Department (Master Category)": dept,
            "Subcategory": subcat,
            "Product Type": raw_type,
            "Variant SKU": sku,
            "Pack Size (Option1)": pack,
            "Barcode (Code 128)": sku,
            "Consumer Retail (ex-VAT GBP)": f"{retail_gbp:.2f}",
            "Consumer Retail (inc-20% VAT GBP)": f"{retail_gbp_inc_vat:.2f}",
            "Consumer Retail (ex-VAT EUR)": f"{retail_eur:.2f}",
            "Consumer Retail (inc-21% VAT EUR)": f"{retail_eur_inc_vat:.2f}",
            "Unit Cost (ex-VAT GBP)": f"{cogs_gbp:.2f}",
            "Unit Cost (ex-VAT EUR)": f"{cogs_eur:.2f}",
            "Dealer Discount %": f"{dealer_pct:.1f}%",
            "Dealer Price (ex-VAT GBP)": f"{dealer_gbp:.2f}",
            "Dealer Price (ex-VAT EUR)": f"{dealer_eur:.2f}",
            "Dealer Margin %": f"{dealer_margin_pct:.1f}%",
            "Dealer MOQ (Units)": 6,
            "Dealer MOV (Order Minimum ex-VAT GBP)": "£500.00",
            "Distributor Discount %": f"{dist_pct:.1f}%",
            "Distributor Price (ex-VAT GBP)": f"{dist_gbp:.2f}",
            "Distributor Price (ex-VAT EUR)": f"{dist_eur:.2f}",
            "Distributor Margin %": f"{dist_margin_pct:.1f}%",
            "Distributor MOQ (Units)": 12,
            "Distributor MOV (Order Minimum ex-VAT GBP)": "£2,000.00",
            "HS Tariff Code": row.get("Variant Harmonized System Code", ""),
            "Country of Origin": row.get("Variant Country of Origin", ""),
            "Weight (Grams)": row.get("Variant Grams", "")
        })

    with open(OUTPUT_CSV, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(out_rows)

    print(f"✔ Successfully generated master multi-tier & category sheet with BOM Unit Costs: {OUTPUT_CSV}")
    print(f"  Total Rows: {len(out_rows)}")

if __name__ == "__main__":
    run()
