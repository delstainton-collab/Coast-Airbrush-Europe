#!/usr/bin/env python3
"""
Coast Airbrush Europe - Multi-Tier Pricing & Categorization Master Sheet Generator
Generates a comprehensive CSV sheet ready for Google Sheets containing:
- Categorization: Department (Master Category), Subcategory, Product Type
- Consumer (MSRP) Pricing (ex-VAT and inc-20% VAT)
- Dealer (Tier 2) Pricing (ex-VAT) & MOQ/MOV rules
- Distributor (Tier 1) Pricing (ex-VAT) & MOQ/MOV rules
- Authentic SKUs, Code 128 Barcodes, HS Tariff Codes & Weights
"""

import csv
import json
import os

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_SRC = os.path.join(ROOT_DIR, "data", "shopify_products_with_hs_codes.csv")
PRICEBOOK_SRC = os.path.join(ROOT_DIR, "data", "b2b_pricebook_secure.json")
OUTPUT_CSV = os.path.join(ROOT_DIR, "data", "coast_master_multi_tier_pricing_sheet.csv")

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

def run():
    with open(CSV_SRC, mode="r", encoding="utf-8") as f:
        products = list(csv.DictReader(f))

    pricebook = {}
    if os.path.exists(PRICEBOOK_SRC):
        with open(PRICEBOOK_SRC, mode="r", encoding="utf-8") as f:
            pricebook = json.load(f)

    default_dealer_disc = pricebook.get("defaultDiscounts", {}).get("dealer", 0.30)
    default_dist_disc = pricebook.get("defaultDiscounts", {}).get("distributor", 0.55)
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
        "Dealer Discount %",
        "Dealer Price (ex-VAT GBP)",
        "Dealer Price (ex-VAT EUR)",
        "Dealer MOQ (Units)",
        "Dealer MOV (Order Minimum ex-VAT GBP)",
        "Distributor Discount %",
        "Distributor Price (ex-VAT GBP)",
        "Distributor Price (ex-VAT EUR)",
        "Distributor MOQ (Units)",
        "Distributor MOV (Order Minimum ex-VAT GBP)",
        "HS Tariff Code",
        "Country of Origin",
        "Weight (Grams)"
    ]

    out_rows = []

    for row in products:
        handle = row.get("Handle", "")
        sku = row.get("Variant SKU", "")
        raw_type = row.get("Type", "").strip()
        dept, subcat = DEPARTMENT_MAP.get(raw_type, ("General Custom Finishing", raw_type))

        retail_str = row.get("Variant Price", "0").strip()
        retail_gbp = float(retail_str) if retail_str else 0.0
        retail_gbp_inc_vat = round(retail_gbp * (1 + vat_rate), 2)
        retail_eur = round(retail_gbp * eur_rate, 2)
        retail_eur_inc_vat = round(retail_eur * 1.21, 2)

        # Look up custom override in pricebook if available
        custom_entry = None
        prod_data = pricebook.get("products", {}).get(handle, {})
        for entry in prod_data.get("entries", []):
            if entry.get("sku") == sku or (not sku and len(prod_data.get("entries", [])) == 1):
                custom_entry = entry
                break

        if custom_entry:
            dealer_gbp = float(custom_entry.get("dealerPriceGbp", round(retail_gbp * (1 - default_dealer_disc), 2)))
            dealer_eur = float(custom_entry.get("dealerPriceEur", round(dealer_gbp * eur_rate, 2)))
            dist_gbp = float(custom_entry.get("distributorPriceGbp", round(retail_gbp * (1 - default_dist_disc), 2)))
            dist_eur = float(custom_entry.get("distributorPriceEur", round(dist_gbp * eur_rate, 2)))
            dealer_pct = round((1 - (dealer_gbp / retail_gbp)) * 100, 1) if retail_gbp > 0 else 30.0
            dist_pct = round((1 - (dist_gbp / retail_gbp)) * 100, 1) if retail_gbp > 0 else 55.0
        else:
            dealer_gbp = round(retail_gbp * (1 - default_dealer_disc), 2)
            dealer_eur = round(retail_gbp * (1 - default_dealer_disc) * eur_rate, 2)
            dist_gbp = round(retail_gbp * (1 - default_dist_disc), 2)
            dist_eur = round(retail_gbp * (1 - default_dist_disc) * eur_rate, 2)
            dealer_pct = round(default_dealer_disc * 100, 1)
            dist_pct = round(default_dist_disc * 100, 1)

        out_rows.append({
            "Handle": handle,
            "Title": row.get("Title", ""),
            "Vendor": row.get("Vendor", ""),
            "Department (Master Category)": dept,
            "Subcategory": subcat,
            "Product Type": raw_type,
            "Variant SKU": sku,
            "Pack Size (Option1)": row.get("Option1 Value", ""),
            "Barcode (Code 128)": sku,
            "Consumer Retail (ex-VAT GBP)": f"{retail_gbp:.2f}",
            "Consumer Retail (inc-20% VAT GBP)": f"{retail_gbp_inc_vat:.2f}",
            "Consumer Retail (ex-VAT EUR)": f"{retail_eur:.2f}",
            "Consumer Retail (inc-21% VAT EUR)": f"{retail_eur_inc_vat:.2f}",
            "Dealer Discount %": f"{dealer_pct}%",
            "Dealer Price (ex-VAT GBP)": f"{dealer_gbp:.2f}",
            "Dealer Price (ex-VAT EUR)": f"{dealer_eur:.2f}",
            "Dealer MOQ (Units)": 6,
            "Dealer MOV (Order Minimum ex-VAT GBP)": "£500.00",
            "Distributor Discount %": f"{dist_pct}%",
            "Distributor Price (ex-VAT GBP)": f"{dist_gbp:.2f}",
            "Distributor Price (ex-VAT EUR)": f"{dist_eur:.2f}",
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

    print(f"✔ Successfully generated master multi-tier & category sheet: {OUTPUT_CSV}")
    print(f"  Total Rows: {len(out_rows)}")

if __name__ == "__main__":
    run()
