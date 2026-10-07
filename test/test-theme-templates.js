import assert from "assert";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const themeZipPath = path.join(rootDir, "coast-airbrush-eu-shopify-theme.zip");

console.log("=== Testing Shopify OS 2.0 Templates (templates/index.json) ===");

// 1. Verify Theme Zip exists
assert(fs.existsSync(themeZipPath), `Theme zip bundle not found at: ${themeZipPath}`);

// Helper to list zip entries
const zipFileListRaw = execSync(`unzip -l "${themeZipPath}"`, { encoding: "utf8" });
const zipEntries = zipFileListRaw
  .split("\n")
  .map((line) => line.trim().split(/\s+/).slice(3).join(" "))
  .filter(Boolean);

// 2. Verify templates/index.json exists in the zip
assert(
  zipEntries.includes("templates/index.json"),
  "templates/index.json must exist in the theme zip"
);
console.log("✔ Verified templates/index.json exists in theme zip");

// 3. Verify templates/index.liquid does NOT exist in the zip
assert(
  !zipEntries.includes("templates/index.liquid"),
  "templates/index.liquid must NOT exist in the theme zip (OS 2.0 templates/index.json takes precedence only when index.liquid is removed)"
);
console.log("✔ Verified templates/index.liquid is omitted from theme zip");

// 4. Extract and parse templates/index.json
let indexJsonContent;
try {
  indexJsonContent = execSync(`unzip -p "${themeZipPath}" "templates/index.json"`, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024
  });
} catch (err) {
  assert.fail(`Failed to extract templates/index.json from zip: ${err.message}`);
}

assert(indexJsonContent && indexJsonContent.trim().length > 0, "templates/index.json is empty");

let indexData;
try {
  indexData = JSON.parse(indexJsonContent);
} catch (err) {
  assert.fail(`templates/index.json is not valid JSON: ${err.message}`);
}

assert(typeof indexData === "object" && indexData !== null, "templates/index.json must be a JSON object");
assert(typeof indexData.sections === "object" && indexData.sections !== null, "templates/index.json must contain a 'sections' object");
assert(Array.isArray(indexData.order), "templates/index.json must contain an 'order' array");

// 5. Verify sections and their types
const expectedSections = {
  announcement_bar: "announcement-bar",
  header: "header",
  hero_carousel: "hero-carousel",
  storefront_catalog: "storefront-catalog",
  mixing_calculator: "mixing-calculator",
  b2b_trade_portal: "b2b-trade-portal",
  footer: "footer"
};

for (const [sectionId, expectedType] of Object.entries(expectedSections)) {
  const section = indexData.sections[sectionId];
  assert(section, `Section '${sectionId}' missing from templates/index.json sections`);
  assert.strictEqual(
    section.type,
    expectedType,
    `Section '${sectionId}' type must be '${expectedType}', got '${section.type}'`
  );
  console.log(`✔ Verified section '${sectionId}' with type '${expectedType}'`);
}

// 6. Verify visual order
const expectedOrder = [
  "announcement_bar",
  "header",
  "hero_carousel",
  "storefront_catalog",
  "mixing_calculator",
  "b2b_trade_portal",
  "footer"
];

assert.deepStrictEqual(
  indexData.order,
  expectedOrder,
  `templates/index.json 'order' must match logical visual order: ${JSON.stringify(expectedOrder)}`
);
console.log("✔ Verified section order:", indexData.order);

// 7. Verify hero_carousel slide blocks
const heroSection = indexData.sections.hero_carousel;
assert(
  typeof heroSection.blocks === "object" && heroSection.blocks !== null,
  "hero_carousel section in index.json must contain a 'blocks' object"
);
const heroBlockKeys = Object.keys(heroSection.blocks);
assert(heroBlockKeys.length >= 3, `hero_carousel must contain slide blocks (found ${heroBlockKeys.length})`);

for (const blockId of heroBlockKeys) {
  const block = heroSection.blocks[blockId];
  assert.strictEqual(block.type, "slide", `Block ${blockId} type must be 'slide'`);
  assert(block.settings, `Block ${blockId} must have settings`);
  assert(
    block.settings.image_filename || block.settings.image,
    `Slide block ${blockId} must specify an image or image_filename`
  );
}
console.log(`✔ Verified hero_carousel contains ${heroBlockKeys.length} configured slide blocks`);

// 8. Verify storefront_catalog filter blocks
const catalogSection = indexData.sections.storefront_catalog;
assert(
  typeof catalogSection.blocks === "object" && catalogSection.blocks !== null,
  "storefront_catalog section in index.json must contain a 'blocks' object"
);
const catalogBlockKeys = Object.keys(catalogSection.blocks);
assert(catalogBlockKeys.length >= 5, `storefront_catalog must contain category filter blocks (found ${catalogBlockKeys.length})`);
for (const blockId of catalogBlockKeys) {
  const block = catalogSection.blocks[blockId];
  assert.strictEqual(block.type, "category_filter", `Block ${blockId} type must be 'category_filter'`);
  assert(block.settings && block.settings.title, `Block ${blockId} must have settings.title`);
}
console.log(`✔ Verified storefront_catalog contains ${catalogBlockKeys.length} configured category filter blocks`);

console.log("\nAll templates/index.json tests PASSED successfully!");
