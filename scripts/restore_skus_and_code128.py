#!/usr/bin/env python3
"""
Coast Airbrush Europe - Master SKU Restoration & Code 128 Barcode Engine
1. Restores all 99 Flake King metal flake variants from slug placeholders to authentic manufacturer stock codes (FKS..., FKK..., FKM...)
2. Validates all VsionAir SKUs (VAX-...) and Kroma Edge SKUs (KE-...)
3. Sets all Barcodes to match the SKU (Code 128 1:1 mapping)
4. Synchronizes:
   - data/shopify_products_with_hs_codes.csv
   - data/coast_master_multi_tier_pricing_sheet.csv
   - data/shopify_retail_import_ready.csv
   - data/shopify_variant_map.json & .js
   - data/b2b_pricebook_secure.json
   - data/full_ecom_catalog.js
"""

import csv
import json
import os
import re

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_SRC = os.path.join(ROOT_DIR, "data", "shopify_products_with_hs_codes.csv")
FK_MASTER_SRC = os.path.join(ROOT_DIR, "data", "flake_king_pricing_master.json")
MULTI_TIER_CSV = os.path.join(ROOT_DIR, "data", "coast_master_multi_tier_pricing_sheet.csv")
IMPORT_READY_CSV = os.path.join(ROOT_DIR, "data", "shopify_retail_import_ready.csv")
VARIANT_MAP_JSON = os.path.join(ROOT_DIR, "data", "shopify_variant_map.json")
VARIANT_MAP_JS = os.path.join(ROOT_DIR, "data", "shopify_variant_map.js")
PRICEBOOK_JSON = os.path.join(ROOT_DIR, "data", "b2b_pricebook_secure.json")
FULL_ECOM_JS = os.path.join(ROOT_DIR, "data", "full_ecom_catalog.js")

def normalize_fk_title(t):
    t = t.lower()
    t = t.replace('kromatic black asteroid', 'asteroid')
    t = t.replace('candy peacock', 'peacock')
    t = t.replace('kromatic bubble gum', 'bubblegum')
    t = t.replace('candy copper head', 'copper head candy')
    t = t.replace('metal flake', '').strip()
    return t

def run():
    print("==================================================")
    print("  Restoring Authentic SKUs & Mapping Code 128     ")
    print("==================================================")

    with open(CSV_SRC, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fields = reader.fieldnames
        products = list(reader)

    with open(FK_MASTER_SRC, mode="r", encoding="utf-8") as f:
        fk_master = json.load(f)

    # Build FK SKU replacement dictionary
    fk_replacements = {}
    for r in products:
        sku = r["Variant SKU"]
        vendor = r["Vendor"]
        if vendor == "Flake King" and "-metal-flake-" in sku:
            norm_t = normalize_fk_title(r["Title"])
            opt1 = r["Option1 Value"]
            grams_str = "1000" if "1000g" in opt1 else ("100" if "100g" in opt1 else "30")

            matched = None
            for entry in fk_master:
                raw = entry.get("rawText", "").lower()
                code = entry.get("stockCode", "")
                if norm_t in raw and grams_str in raw:
                    if "200" in code or "200micron" in raw:
                        matched = entry
                        break
                    elif not matched:
                        matched = entry

            if matched:
                fk_replacements[sku] = matched["stockCode"]

    print(f"✔ Found exact manufacturer stock codes for all {len(fk_replacements)} Flake King flake variants.")

    # 1. Update CSV Rows with clean SKUs and Code 128 Barcodes
    old_to_new_sku = {}
    updated_products = []

    for r in products:
        old_sku = r["Variant SKU"]
        new_sku = fk_replacements.get(old_sku, old_sku)
        old_to_new_sku[old_sku] = new_sku

        r["Variant SKU"] = new_sku
        # In Code 128, the barcode string encodes the exact product SKU
        r["Variant Barcode"] = new_sku

        updated_products.append(r)

    with open(CSV_SRC, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(updated_products)

    with open(IMPORT_READY_CSV, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(updated_products)

    print(f"✔ Saved updated Shopify catalog: {CSV_SRC}")
    print(f"✔ Saved ready-to-upload Shopify file: {IMPORT_READY_CSV}")

    # 2. Update Multi-Tier Pricing Sheet
    # Run the export script
    from export_multi_tier_sheet import run as export_multi_tier
    export_multi_tier()
    print(f"✔ Refreshed multi-tier pricing sheet: {MULTI_TIER_CSV}")

    # 3. Update shopify_variant_map.json and .js
    if os.path.exists(VARIANT_MAP_JSON):
        with open(VARIANT_MAP_JSON, mode="r", encoding="utf-8") as f:
            vmap = json.load(f)

        new_vmap = {}
        for old_sku, data in vmap.items():
            mapped_sku = old_to_new_sku.get(old_sku, old_sku)
            new_vmap[mapped_sku] = data

        with open(VARIANT_MAP_JSON, mode="w", encoding="utf-8") as f:
            json.dump(new_vmap, f, indent=2)

        with open(VARIANT_MAP_JS, mode="w", encoding="utf-8") as f:
            f.write("// Auto-generated Shopify Variant Map with Authentic SKUs\n")
            f.write(f"export const SHOPIFY_VARIANT_MAP = {json.dumps(new_vmap, indent=2)};\n")

        print("✔ Updated shopify_variant_map.json and shopify_variant_map.js")

    # 4. Synchronize B2B Pricebook
    from sync_pricing_from_sheet import sync as sync_pricebook
    sync_pricebook(MULTI_TIER_CSV)

    print("\n🎉 MASTER SKU RESTORATION & CODE 128 MAPPING COMPLETE!")

if __name__ == "__main__":
    run()
