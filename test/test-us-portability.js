import assert from "assert";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const themeZipPath = path.join(rootDir, "coast-airbrush-eu-shopify-theme.zip");

console.log("=== Testing Shopify OS 2.0 Theme Portability & Multi-Region Readiness ===");

assert(fs.existsSync(themeZipPath), `Theme zip bundle not found at: ${themeZipPath}`);

function getZipFileContent(filePath) {
  try {
    return execSync(`unzip -p "${themeZipPath}" "${filePath}"`, {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024
    });
  } catch (err) {
    return null;
  }
}

const zipFileListRaw = execSync(`unzip -l "${themeZipPath}"`, { encoding: "utf8" });
const zipEntries = zipFileListRaw
  .split("\n")
  .map((line) => line.trim().split(/\s+/).slice(3).join(" "))
  .filter(Boolean);

// -------------------------------------------------------------------------
// 1. Settings Schema Multi-Region & Customizer Settings
// -------------------------------------------------------------------------
console.log("\n[Test 1] Verifying Multi-Region & International Settings Schema...");
const schemaContent = getZipFileContent("config/settings_schema.json");
assert(schemaContent, "config/settings_schema.json missing from zip");
const schema = JSON.parse(schemaContent);
const allSettings = schema.flatMap((s) => s.settings || []).filter((s) => s.id);

// Check region badge settings
const regionBadgeSetting = allSettings.find((s) => s.id === "region_badge_text");
assert(regionBadgeSetting, "Settings schema must include 'region_badge_text' setting");
const showRegionBadge = allSettings.find((s) => s.id === "show_region_badge");
assert(showRegionBadge, "Settings schema must include 'show_region_badge' setting");

// Check tax & VAT settings
const vatSetting = allSettings.find((s) => s.id === "enable_vat_toggle");
assert(vatSetting, "Settings schema must include 'enable_vat_toggle' setting");
const taxAdvisorySetting = allSettings.find((s) => s.id === "tax_advisory_text");
assert(taxAdvisorySetting, "Settings schema must include 'tax_advisory_text' setting");

// Check US & International logistics
const usHubSetting = allSettings.find((s) => s.id === "us_hub_name" || s.id === "us_hub_address");
assert(usHubSetting, "Settings schema must include US hub options");
const complianceSetting = allSettings.find((s) => s.id === "compliance_statement");
assert(complianceSetting, "Settings schema must include 'compliance_statement' setting");

console.log("✔ Settings schema verified: Regional badge, VAT toggle, tax notice, and US hub settings present.");

// -------------------------------------------------------------------------
// 2. Header Section Dynamic Controls
// -------------------------------------------------------------------------
console.log("\n[Test 2] Verifying sections/header.liquid dynamic region controls...");
const headerContent = getZipFileContent("sections/header.liquid");
assert(headerContent, "sections/header.liquid missing from zip");

// Must NOT contain hardcoded EUROPE without Liquid condition
assert(
  !headerContent.includes('<span class="text-[#dc2626] font-extrabold text-sm md:text-base">EUROPE</span>'),
  "Header logo lockup must NOT have hardcoded 'EUROPE' text without dynamic Liquid setting check"
);
assert(
  headerContent.includes("region_badge_text") || headerContent.includes("settings.region_badge_text"),
  "Header must check 'region_badge_text' setting for region badge"
);
console.log("✔ Header verified: Region badge is fully configurable (can be set to USA or hidden).");

// -------------------------------------------------------------------------
// 3. Announcement Bar Dynamic VAT & Tax Controls
// -------------------------------------------------------------------------
console.log("\n[Test 3] Verifying sections/announcement-bar.liquid VAT & Tax controls...");
const announcementContent = getZipFileContent("sections/announcement-bar.liquid");
assert(announcementContent, "sections/announcement-bar.liquid missing from zip");

assert(
  announcementContent.includes("enable_vat_toggle"),
  "Announcement bar must condition VAT switcher on 'enable_vat_toggle'"
);
assert(
  announcementContent.includes("tax_advisory_text"),
  "Announcement bar must allow configurable tax advisory text"
);
console.log("✔ Announcement bar verified: VAT toggle can be disabled for US stores.");

// -------------------------------------------------------------------------
// 4. Footer Section Dynamic Compliance & Branding
// -------------------------------------------------------------------------
console.log("\n[Test 4] Verifying sections/footer.liquid configurable statements...");
const footerContent = getZipFileContent("sections/footer.liquid");
assert(footerContent, "sections/footer.liquid missing from zip");

assert(
  footerContent.includes("compliance_statement"),
  "Footer must allow customizable safety/compliance statement (UN1263 vs DOT/OSHA)"
);
assert(
  footerContent.includes("copyright_text"),
  "Footer must allow customizable copyright text"
);
console.log("✔ Footer verified: Compliance statement and copyright are fully customizable.");

// -------------------------------------------------------------------------
// 5. Layout Dynamic SEO & Metadata (theme.liquid)
// -------------------------------------------------------------------------
console.log("\n[Test 5] Verifying layout/theme.liquid dynamic SEO and structured data...");
const themeLiquidContent = getZipFileContent("layout/theme.liquid");
assert(themeLiquidContent, "layout/theme.liquid missing from zip");

assert(
  themeLiquidContent.includes("{{ shop.name }}"),
  "theme.liquid title/meta must reference {{ shop.name }}"
);
assert(
  themeLiquidContent.includes("{{ canonical_url }}"),
  "theme.liquid must use {{ canonical_url }} instead of hardcoded coastairbrush.eu URL"
);
assert(
  !themeLiquidContent.includes('<link rel="canonical" href="https://coastairbrush.eu/">'),
  "theme.liquid must NOT have hardcoded canonical link to coastairbrush.eu"
);
assert(
  themeLiquidContent.includes('"@type": "AutoPartsStore"') || themeLiquidContent.includes('"@type": "Organization"'),
  "theme.liquid must contain valid Schema.org organization/store schema"
);
console.log("✔ theme.liquid verified: SEO, canonical tags, and Schema.org are dynamic to shop domain.");

// -------------------------------------------------------------------------
// 6. OS 2.0 Collection Template (templates/collection.json)
// -------------------------------------------------------------------------
console.log("\n[Test 6] Verifying templates/collection.json (No Redirect)...");
assert(
  zipEntries.includes("templates/collection.json"),
  "templates/collection.json must exist in theme zip"
);
assert(
  !zipEntries.includes("templates/collection.liquid"),
  "Obsolete templates/collection.liquid must be removed in favor of OS 2.0 collection.json"
);

const collectionJsonContent = getZipFileContent("templates/collection.json");
const collectionData = JSON.parse(collectionJsonContent);
assert(collectionData.sections && collectionData.order, "collection.json must contain sections and order");

const mainCollectionContent = getZipFileContent("sections/main-collection.liquid");
assert(mainCollectionContent, "sections/main-collection.liquid must exist in theme zip");
assert(
  !mainCollectionContent.includes('window.location.href = "/#storefront"'),
  "Collection page must NOT redirect customers or bots to /#storefront"
);
assert(
  mainCollectionContent.includes("collection.products"),
  "sections/main-collection.liquid must render collection.products"
);
assert(
  mainCollectionContent.includes("{% paginate"),
  "sections/main-collection.liquid must support pagination"
);
console.log("✔ Collection template verified: OS 2.0 collection.json with native grid & pagination.");

// -------------------------------------------------------------------------
// 7. OS 2.0 Cart Template (templates/cart.json)
// -------------------------------------------------------------------------
console.log("\n[Test 7] Verifying templates/cart.json (No Redirect)...");
assert(
  zipEntries.includes("templates/cart.json"),
  "templates/cart.json must exist in theme zip"
);
assert(
  !zipEntries.includes("templates/cart.liquid"),
  "Obsolete templates/cart.liquid must be removed in favor of OS 2.0 cart.json"
);

const cartJsonContent = getZipFileContent("templates/cart.json");
const cartData = JSON.parse(cartJsonContent);
assert(cartData.sections && cartData.order, "cart.json must contain sections and order");

const mainCartContent = getZipFileContent("sections/main-cart.liquid");
assert(mainCartContent, "sections/main-cart.liquid must exist in theme zip");
assert(
  !mainCartContent.includes('window.location.href = "/"'),
  "Cart page must NOT redirect customers to /"
);
assert(
  mainCartContent.includes("cart.items") || mainCartContent.includes("cart.item_count"),
  "sections/main-cart.liquid must render cart line items"
);
assert(
  mainCartContent.includes('name="checkout"'),
  "sections/main-cart.liquid must include native checkout submission"
);
console.log("✔ Cart template verified: OS 2.0 cart.json with full cart line items & checkout form.");

// -------------------------------------------------------------------------
// 8. OS 2.0 Product Template (templates/product.json & blocks)
// -------------------------------------------------------------------------
console.log("\n[Test 8] Verifying templates/product.json with customizable OS 2.0 blocks...");
assert(
  zipEntries.includes("templates/product.json"),
  "templates/product.json must exist in theme zip"
);
assert(
  !zipEntries.includes("templates/product.liquid"),
  "Obsolete templates/product.liquid must be removed in favor of OS 2.0 product.json"
);

const productJsonContent = getZipFileContent("templates/product.json");
const productData = JSON.parse(productJsonContent);
assert(productData.sections && productData.order, "product.json must contain sections and order");

const mainProductContent = getZipFileContent("sections/main-product.liquid");
assert(mainProductContent, "sections/main-product.liquid must exist in theme zip");

// Verify block support including @app block for review apps
assert(
  mainProductContent.includes("{% when '@app' %}"),
  "sections/main-product.liquid must support '@app' block for third-party Shopify apps"
);
assert(
  mainProductContent.includes("form 'product'"),
  "sections/main-product.liquid must render standard Shopify product form"
);

// Verify all 11 specification metafields mapped
const requiredSpecs = [
  "mix_ratio", "pot_life", "flash_off_time", "cure_time",
  "coverage", "film_thickness", "recommended_psi", "recommended_nozzle",
  "voc_compliance", "substrate_material", "particle_size"
];
for (const spec of requiredSpecs) {
  assert(
    mainProductContent.includes(spec),
    `sections/main-product.liquid must map spec metafield '${spec}'`
  );
}
console.log("✔ Product template verified: OS 2.0 product.json with @app blocks, native forms, and 11 TDS specs.");

console.log("\n=================================================================");
console.log("  ALL US PORTABILITY & OS 2.0 READINESS TESTS PASSED! 🎉        ");
console.log("=================================================================");
