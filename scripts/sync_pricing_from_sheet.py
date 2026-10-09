#!/usr/bin/env python3
"""
Coast Airbrush Europe - Pricing & Categorization Sheet Ingestion Engine
Reads the revised Google Sheet CSV (e.g. data/coast_master_multi_tier_pricing_sheet.csv),
validates all price tiers, categories, and subcategories, and synchronizes:
1. data/shopify_products_with_hs_codes.csv (Shopify native catalog with updated Type and Tags)
2. data/b2b_pricebook_secure.json (Trade Tier 1 & Tier 2 pricing engine)
3. data/shopify_retail_import_ready.csv (1-click upload for Shopify Admin)
"""

import csv
import json
import os
import sys

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_SHEET = os.path.join(ROOT_DIR, "data", "coast_master_multi_tier_pricing_sheet.csv")
SHOPIFY_CSV = os.path.join(ROOT_DIR, "data", "shopify_products_with_hs_codes.csv")
PRICEBOOK_JSON = os.path.join(ROOT_DIR, "data", "b2b_pricebook_secure.json")
EXPORT_READY_CSV = os.path.join(ROOT_DIR, "data", "shopify_retail_import_ready.csv")

def parse_num(val, default=0.0):
    if not val:
        return default
    s = str(val).replace("£", "").replace("€", "").replace("%", "").replace(",", "").strip()
    try:
        return float(s)
    except ValueError:
        return default

def sync(custom_sheet_path=None):
    sheet_path = custom_sheet_path or INPUT_SHEET
    if not os.path.exists(sheet_path):
        print(f"❌ Error: Sheet not found at {sheet_path}")
        sys.exit(1)

    with open(sheet_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        sheet_rows = list(reader)

    print(f"📖 Loaded {len(sheet_rows)} rows from {os.path.basename(sheet_path)}")

    # Index by (Handle, SKU)
    pricing_map = {}
    category_by_handle = {}

    for r in sheet_rows:
        handle = r.get("Handle", "").strip()
        sku = r.get("Variant SKU", "").strip()
        opt1 = r.get("Pack Size (Option1)", "").strip()
        dept = r.get("Department (Master Category)", "").strip()
        subcat = r.get("Subcategory", "").strip()
        prod_type = r.get("Product Type", "").strip() or subcat

        if handle and (dept or subcat or prod_type):
            category_by_handle[handle] = {
                "department": dept,
                "subcategory": subcat,
                "productType": prod_type,
                "vendor": r.get("Vendor", "").strip(),
                "title": r.get("Title", "").strip()
            }

        # Check ex-vat or fallback retail column
        retail_gbp = parse_num(r.get("Consumer Retail (ex-VAT GBP)") or r.get("Consumer Retail Price (GBP)") or r.get("Variant Price", 0))
        if retail_gbp == 0 and r.get("Consumer Retail (inc-20% VAT GBP)"):
            retail_gbp = round(parse_num(r.get("Consumer Retail (inc-20% VAT GBP)")) / 1.20, 2)

        retail_eur = parse_num(r.get("Consumer Retail (ex-VAT EUR)") or r.get("Consumer Retail Price (EUR)"), retail_gbp * 1.176)
        dealer_gbp = parse_num(r.get("Dealer Price (ex-VAT GBP)") or r.get("Dealer Price (GBP)"), retail_gbp * 0.70)
        dealer_eur = parse_num(r.get("Dealer Price (ex-VAT EUR)") or r.get("Dealer Price (EUR)"), dealer_gbp * 1.176)
        dist_gbp = parse_num(r.get("Distributor Price (ex-VAT GBP)") or r.get("Distributor Price (GBP)"), retail_gbp * 0.45)
        dist_eur = parse_num(r.get("Distributor Price (ex-VAT EUR)") or r.get("Distributor Price (EUR)"), dist_gbp * 1.176)

        barcode = r.get("Barcode (Code 128)") or r.get("Barcode") or sku

        key = (handle, sku)
        pricing_map[key] = {
            "retail_gbp": retail_gbp,
            "retail_eur": retail_eur,
            "dealer_gbp": dealer_gbp,
            "dealer_eur": dealer_eur,
            "dist_gbp": dist_gbp,
            "dist_eur": dist_eur,
            "sku": sku,
            "opt1": opt1,
            "handle": handle,
            "barcode": barcode,
            "hs_code": r.get("HS Tariff Code", "").strip(),
            "origin": r.get("Country of Origin", "").strip(),
            "department": dept,
            "subcategory": subcat,
            "productType": prod_type
        }

    # 1. Update shopify_products_with_hs_codes.csv
    if os.path.exists(SHOPIFY_CSV):
        with open(SHOPIFY_CSV, mode="r", encoding="utf-8") as f:
            base_reader = csv.DictReader(f)
            base_fields = base_reader.fieldnames
            base_rows = list(base_reader)

        updated_shopify_rows = []
        for row in base_rows:
            handle = row.get("Handle", "").strip()
            sku = row.get("Variant SKU", "").strip()
            key = (handle, sku)
            match = pricing_map.get(key)
            if not match:
                candidates = [v for k, v in pricing_map.items() if k[0] == handle]
                if len(candidates) == 1:
                    match = candidates[0]

            cat_info = category_by_handle.get(handle, {})

            if match:
                row["Variant Price"] = f"{match['retail_gbp']:.2f}"
                if match['sku']:
                    row["Variant SKU"] = match['sku']
                row["Variant Barcode"] = match['barcode'] if match['barcode'] else row["Variant SKU"]
                if match['hs_code']:
                    row["Variant Harmonized System Code"] = match['hs_code']
                if match['origin']:
                    row["Variant Country of Origin"] = match['origin']

            if cat_info:
                if cat_info.get("productType"):
                    row["Type"] = cat_info["productType"]
                
                # Build rich tags for Shopify automated collections
                tags = [t.strip() for t in row.get("Tags", "").split(",") if t.strip()]
                new_tags = ["Coast Europe"]
                if cat_info.get("vendor"):
                    new_tags.append(cat_info["vendor"])
                if cat_info.get("department") and cat_info["department"] not in new_tags:
                    new_tags.append(cat_info["department"])
                if cat_info.get("subcategory") and cat_info["subcategory"] not in new_tags:
                    new_tags.append(cat_info["subcategory"])
                if cat_info.get("productType") and cat_info["productType"] not in new_tags:
                    new_tags.append(cat_info["productType"])
                
                for t in tags:
                    if t not in new_tags:
                        new_tags.append(t)
                row["Tags"] = ", ".join(new_tags)

            updated_shopify_rows.append(row)

        with open(SHOPIFY_CSV, mode="w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=base_fields)
            writer.writeheader()
            writer.writerows(updated_shopify_rows)

        with open(EXPORT_READY_CSV, mode="w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=base_fields)
            writer.writeheader()
            writer.writerows(updated_shopify_rows)

        print(f"✔ Synchronized {SHOPIFY_CSV} with updated Types, Tags & Prices")
        print(f"✔ Generated 1-click Shopify import file: {EXPORT_READY_CSV}")

    # 2. Update b2b_pricebook_secure.json
    pricebook_data = {
        "version": "2026-10-09",
        "generatedAt": "2026-10-09T10:15:00.000Z",
        "currencyMultiplierGbp": 0.85,
        "defaultDiscounts": {
            "dealer": 0.30,
            "distributor": 0.55
        },
        "skuPricing": {},
        "products": {}
    }

    for (handle, sku), data in pricing_map.items():
        if sku:
            pricebook_data["skuPricing"][sku] = {
                "retailPriceGbp": data["retail_gbp"],
                "retailPriceEur": data["retail_eur"],
                "dealerPriceGbp": data["dealer_gbp"],
                "dealerPriceEur": data["dealer_eur"],
                "distributorPriceGbp": data["dist_gbp"],
                "distributorPriceEur": data["dist_eur"]
            }

        if handle not in pricebook_data["products"]:
            pricebook_data["products"][handle] = {"entries": []}

        pricebook_data["products"][handle]["entries"].append({
            "sku": sku,
            "retailPriceGbp": data["retail_gbp"],
            "retailPriceEur": data["retail_eur"],
            "dealerPriceGbp": data["dealer_gbp"],
            "dealerPriceEur": data["dealer_eur"],
            "distributorPriceGbp": data["dist_gbp"],
            "distributorPriceEur": data["dist_eur"],
            "dealerDiscountPercent": round((1 - (data["dealer_gbp"] / data["retail_gbp"])) * 100, 1) if data["retail_gbp"] > 0 else 30.0,
            "distributorDiscountPercent": round((1 - (data["dist_gbp"] / data["retail_gbp"])) * 100, 1) if data["retail_gbp"] > 0 else 55.0
        })

    with open(PRICEBOOK_JSON, mode="w", encoding="utf-8") as f:
        json.dump(pricebook_data, f, indent=2)
    print(f"✔ Synchronized B2B Trade Pricebook: {PRICEBOOK_JSON}")

if __name__ == "__main__":
    sheet_arg = sys.argv[1] if len(sys.argv) > 1 else None
    sync(sheet_arg)
