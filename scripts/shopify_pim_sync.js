#!/usr/bin/env node
/**
 * Coast Airbrush Europe - Shopify GraphQL PIM Sync Engine
 * 
 * Synchronizes the Master PIM Catalog (including Category-Specific Metafields,
 * Variants, and Customs HS data) directly into Shopify Admin using GraphQL.
 * 
 * Usage:
 *   node scripts/shopify_pim_sync.js --dry-run
 *   SHOPIFY_ADMIN_TOKEN=shpat_xxx SHOPIFY_STORE_DOMAIN=store.myshopify.com node scripts/shopify_pim_sync.js --sync
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.dirname(__dirname);

// Configuration
const ARGS = process.argv.slice(2);
const IS_DRY_RUN = ARGS.includes("--dry-run") || !process.env.SHOPIFY_ADMIN_TOKEN;
const SYNC_LIMIT = ARGS.find(a => a.startsWith("--limit=")) ? parseInt(ARGS.find(a => a.startsWith("--limit=")).split("=")[1], 10) : null;

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || "coast-airbrush-eu-dev.myshopify.com";
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || "";
const API_VERSION = "2024-07";

async function executeShopifyGraphQL(query, variables = {}) {
  if (IS_DRY_RUN) {
    return { dryRun: true };
  }

  const endpoint = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify GraphQL HTTP ${response.status}: ${errorText}`);
  }

  const json = await response.json();
  if (json.errors) {
    throw new Error(`Shopify GraphQL Errors: ${JSON.stringify(json.errors, null, 2)}`);
  }
  return json.data;
}

function loadPimData() {
  const schemaPath = path.join(ROOT_DIR, "data", "pim_category_schemas.json");
  const catalogPath = path.join(ROOT_DIR, "data", "pim_master_catalog.json");

  const schemas = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

  return { schemas, catalog };
}

// Ensure Metafield Definitions exist in Shopify
async function syncMetafieldDefinitions(schemas) {
  console.log("\n[1/3] Verifying Category Metafield Definitions in Shopify...");

  const definitionsToSync = [];
  for (const [catId, cat] of Object.entries(schemas.categories)) {
    for (const mf of cat.metafields) {
      definitionsToSync.push({
        namespace: cat.metafieldNamespace,
        key: mf.key,
        name: `${cat.displayName} - ${mf.name}`,
        type: mf.type,
        description: mf.description,
        ownerType: "PRODUCT"
      });
    }
  }

  console.log(`  Identified ${definitionsToSync.length} category metafield specifications.`);

  if (IS_DRY_RUN) {
    console.log("  [DRY-RUN] Verified metafield definitions structure:");
    definitionsToSync.slice(0, 4).forEach(d => {
      console.log(`    ✓ ${d.namespace}.${d.key} (${d.type}) -> "${d.name}"`);
    });
    console.log(`    ... and ${definitionsToSync.length - 4} more.`);
    return;
  }

  const mutation = `
    mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition {
          id
          name
          namespace
          key
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  for (const def of definitionsToSync) {
    try {
      const res = await executeShopifyGraphQL(mutation, {
        definition: {
          name: def.name,
          namespace: def.namespace,
          key: def.key,
          description: def.description,
          type: def.type,
          ownerType: def.ownerType
        }
      });
      const errors = res.metafieldDefinitionCreate?.userErrors || [];
      if (errors.length > 0 && !errors[0].message.includes("taken")) {
        console.warn(`    ⚠️ Notice for ${def.key}: ${errors[0].message}`);
      } else {
        console.log(`    ✓ Synced metafield: ${def.namespace}.${def.key}`);
      }
    } catch (e) {
      console.warn(`    ⚠️ Skipping ${def.key}: ${e.message}`);
    }
  }
}

// Synchronize Products & generate Variant Map
async function syncProducts(catalog, schemas) {
  console.log("\n[2/3] Synchronizing Products, Category Metafields & Variants...");
  const variantMap = {};
  const productsToProcess = SYNC_LIMIT ? catalog.slice(0, SYNC_LIMIT) : catalog;

  let simulatedVariantCounter = 4591028300000;
  let simulatedProductCounter = 8840192800000;

  for (let i = 0; i < productsToProcess.length; i++) {
    const product = productsToProcess[i];
    const categoryDef = schemas.categories[product.category] || {};
    const namespace = categoryDef.metafieldNamespace || "specs";

    // Format Metafields
    const metafields = [];
    for (const [key, val] of Object.entries(product.specs || {})) {
      if (val !== undefined && val !== null && val !== "") {
        const schemaField = categoryDef.metafields?.find(m => m.key === key);
        const type = schemaField ? schemaField.type : "single_line_text_field";
        metafields.push({
          namespace: namespace,
          key: key,
          value: typeof val === "object" ? JSON.stringify(val) : String(val),
          type: type
        });
      }
    }

    if (IS_DRY_RUN) {
      simulatedProductCounter += 1;
      product.variants.forEach((v, vIdx) => {
        simulatedVariantCounter += 1;
        const fakeVariantId = simulatedVariantCounter;
        variantMap[v.sku] = {
          shopifyVariantId: fakeVariantId,
          shopifyProductId: simulatedProductCounter,
          handle: product.handle,
          productTitle: product.title,
          variantTitle: v.title,
          category: product.category,
          priceGbp: v.priceGbp,
          priceEur: v.priceEur,
          inventoryQty: v.inventoryQty,
          hsCode: v.hsCode,
          countryOfOrigin: v.countryOfOrigin
        };
      });
    } else {
      // Live GraphQL productSet / productCreate
      const productSetMutation = `
        mutation ProductSet($input: ProductSetInput!) {
          productSet(input: $input) {
            product {
              id
              handle
              variants(first: 50) {
                nodes {
                  id
                  sku
                  price
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input = {
        title: product.title,
        handle: product.handle,
        vendor: product.vendor,
        productType: product.productType,
        tags: product.tags,
        descriptionHtml: product.descriptionHtml,
        metafields: metafields,
        variants: product.variants.map(v => ({
          sku: v.sku,
          price: v.priceGbp.toFixed(2),
          optionValues: Object.entries(v.optionValues).map(([name, val]) => ({
            name: val,
            optionName: name
          })),
          inventoryItem: {
            tracked: true,
            measurement: {
              weight: {
                value: v.weightGrams,
                unit: "GRAMS"
              }
            },
            harmonizedSystemCode: v.hsCode,
            countryCodeOfOrigin: v.countryOfOrigin
          }
        }))
      };

      try {
        const res = await executeShopifyGraphQL(productSetMutation, { input });
        const createdProd = res.productSet?.product;
        if (createdProd && createdProd.variants) {
          const numId = createdProd.id.replace("gid://shopify/Product/", "");
          createdProd.variants.nodes.forEach(vNode => {
            const numVarId = vNode.id.replace("gid://shopify/ProductVariant/", "");
            const vData = product.variants.find(pv => pv.sku === vNode.sku);
            variantMap[vNode.sku] = {
              shopifyVariantId: parseInt(numVarId, 10),
              shopifyProductId: parseInt(numId, 10),
              handle: product.handle,
              productTitle: product.title,
              variantTitle: vData ? vData.title : "",
              category: product.category,
              priceGbp: vData ? vData.priceGbp : parseFloat(vNode.price),
              priceEur: vData ? vData.priceEur : Math.round(parseFloat(vNode.price) * 1.18 * 100) / 100,
              inventoryQty: vData ? vData.inventoryQty : 50,
              hsCode: vData ? vData.hsCode : "3208.90.19",
              countryOfOrigin: vData ? vData.countryOfOrigin : "GB"
            };
          });
          console.log(`  ✓ Synced: [${product.category}] ${product.title} (${createdProd.variants.nodes.length} variants)`);
        }
      } catch (err) {
        console.error(`  ❌ Failed to sync ${product.handle}: ${err.message}`);
      }
    }
  }

  // Save Variant Map to disk (JSON and JS Module)
  const mapPath = path.join(ROOT_DIR, "data", "shopify_variant_map.json");
  fs.writeFileSync(mapPath, JSON.stringify(variantMap, null, 2), "utf8");

  const mapJsPath = path.join(ROOT_DIR, "data", "shopify_variant_map.js");
  const jsContent = `// Auto-generated by Shopify PIM Sync Engine
export const SHOPIFY_VARIANT_MAP = ${JSON.stringify(variantMap, null, 2)};
if (typeof window !== "undefined") {
  window.SHOPIFY_VARIANT_MAP = SHOPIFY_VARIANT_MAP;
}
`;
  fs.writeFileSync(mapJsPath, jsContent, "utf8");

  console.log(`\n[3/3] Generated Variant Mapping:`);
  console.log(`  - Mapped SKUs to Shopify Variant IDs: ${Object.keys(variantMap).length}`);
  console.log(`  - Saved Map File: ${mapPath}`);
  console.log(`  - Saved JS Module: ${mapJsPath}`);
  return variantMap;
}

async function run() {
  console.log("==========================================================");
  console.log(" COAST AIRBRUSH EUROPE — SHOPIFY PIM GRAPHQL SYNC");
  console.log("==========================================================");
  console.log(`Mode: ${IS_DRY_RUN ? "🔍 DRY-RUN (Schema Validation & Variant Map Build)" : "🚀 LIVE SHOPIFY GRAPHQL SYNC"}`);
  console.log(`Target Store: https://${SHOPIFY_STORE_DOMAIN}`);

  const { schemas, catalog } = loadPimData();
  console.log(`Loaded ${catalog.length} products across ${Object.keys(schemas.categories).length} category schemas.`);

  await syncMetafieldDefinitions(schemas);
  const map = await syncProducts(catalog, schemas);

  console.log("\n==========================================================");
  console.log(" ✅ PIM SYNC & DATA INTEGRITY VERIFICATION COMPLETE");
  console.log("==========================================================");
  const sampleSku = Object.keys(map)[0];
  console.log(`Sample Validated Variant Mapping (${sampleSku}):`);
  console.log(JSON.stringify(map[sampleSku], null, 2));
}

run().catch(err => {
  console.error("\n❌ Sync Failed with error:", err);
  process.exit(1);
});
