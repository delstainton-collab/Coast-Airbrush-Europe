import assert from "assert";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const themeZipPath = path.join(rootDir, "coast-airbrush-eu-shopify-theme.zip");

console.log("=== Testing Shopify OS 2.0 Theme Modular Sections ===");

// 1. Verify Theme Zip exists
assert(fs.existsSync(themeZipPath), `Theme zip bundle not found at: ${themeZipPath}`);

// Helper to extract a file's content from the theme zip
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

// 2. Verify all 7 required sections exist
const requiredSections = [
  "sections/announcement-bar.liquid",
  "sections/header.liquid",
  "sections/hero-carousel.liquid",
  "sections/storefront-catalog.liquid",
  "sections/mixing-calculator.liquid",
  "sections/b2b-trade-portal.liquid",
  "sections/footer.liquid"
];

const zipFileList = execSync(`unzip -l "${themeZipPath}"`, { encoding: "utf8" });
console.log("Scanning theme zip file entries...");

const sectionContents = {};
for (const sec of requiredSections) {
  assert(
    zipFileList.includes(sec),
    `Required section missing from theme zip: ${sec}`
  );
  const content = getZipFileContent(sec);
  assert(content && content.trim().length > 0, `Section file ${sec} is empty`);
  sectionContents[sec] = content;
  console.log(`✔ Found section: ${sec} (${content.length} chars)`);
}

// 3. Extract and validate {% schema %} JSON from each section file
const sectionSchemas = {};
for (const sec of requiredSections) {
  const content = sectionContents[sec];
  const schemaMatch = content.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/);
  assert(schemaMatch, `Missing {% schema %} block in ${sec}`);
  
  let parsedSchema;
  try {
    parsedSchema = JSON.parse(schemaMatch[1]);
  } catch (err) {
    assert.fail(`Invalid JSON in {% schema %} block of ${sec}: ${err.message}`);
  }
  
  assert(typeof parsedSchema === "object" && parsedSchema !== null, `Schema in ${sec} must be an object`);
  assert(typeof parsedSchema.name === "string" && parsedSchema.name.length > 0, `Schema in ${sec} must have a valid string 'name'`);
  assert(Array.isArray(parsedSchema.settings), `Schema in ${sec} must have a 'settings' array`);
  sectionSchemas[sec] = parsedSchema;
  console.log(`✔ Valid schema in ${sec}: "${parsedSchema.name}" (${parsedSchema.settings.length} settings)`);
}

// 4. Verify storefront-catalog.liquid requirements
console.log("\nVerifying storefront-catalog.liquid...");
const catalogContent = sectionContents["sections/storefront-catalog.liquid"];
const catalogSchema = sectionSchemas["sections/storefront-catalog.liquid"];

// 4a. Contains <script id="shopify-catalog-data" type="application/json">
assert(
  catalogContent.includes('<script id="shopify-catalog-data" type="application/json">'),
  "storefront-catalog.liquid must contain <script id=\"shopify-catalog-data\" type=\"application/json\">"
);
assert(
  catalogContent.includes("collections.all.products") || catalogContent.includes("collection.products"),
  "storefront-catalog.liquid script must loop through products"
);
assert(
  catalogContent.includes("metafields.specs") || catalogContent.includes("specs"),
  "storefront-catalog.liquid script must serialize specs metafields"
);
console.log("✔ <script id=\"shopify-catalog-data\"> product serialization verified");

// 4b. Supports dynamic category filter pills: schema block type for custom category pills
const hasCategoryBlock = Array.isArray(catalogSchema.blocks) && catalogSchema.blocks.some(
  (b) => b.type === "category_filter" || b.type === "category_pill" || b.type === "category"
);
assert(hasCategoryBlock, "storefront-catalog.liquid schema must define block type for category filter pills (e.g. 'category_filter')");

// 4c. Renders dynamic category pill container and iterates customizer blocks & collections
assert(
  catalogContent.includes('id="brand-filter-pills"'),
  "storefront-catalog.liquid must contain #brand-filter-pills container"
);
assert(
  catalogContent.includes("for block in section.blocks") || catalogContent.includes("for b in section.blocks"),
  "storefront-catalog.liquid must loop over section.blocks to render category filter pills"
);
assert(
  catalogContent.includes("for col in collections") || catalogContent.includes("for collection in collections"),
  "storefront-catalog.liquid must support rendering dynamic collection pills from collections"
);
console.log("✔ Dynamic category filter pills (customizer blocks + collections) verified");

// 5. Verify hero-carousel.liquid requirements
console.log("\nVerifying hero-carousel.liquid...");
const heroContent = sectionContents["sections/hero-carousel.liquid"];
const heroSchema = sectionSchemas["sections/hero-carousel.liquid"];

// 5a. Block definition with type 'slide'
const hasSlideBlock = Array.isArray(heroSchema.blocks) && heroSchema.blocks.some(
  (b) => b.type === "slide"
);
assert(hasSlideBlock, "hero-carousel.liquid schema must define block type 'slide'");

// 5b. Default slides matching Mechanical Brutalism style in presets
const hasDefaultSlides = Array.isArray(heroSchema.presets) && heroSchema.presets.some(
  (p) => Array.isArray(p.blocks) && p.blocks.some(
    (b) => b.type === "slide" && JSON.stringify(b).includes("kroma-skull-studio-dark.jpg")
  )
);
assert(hasDefaultSlides, "hero-carousel.liquid preset must define default slides including 'kroma-skull-studio-dark.jpg'");

// 5c. Markup iterates blocks
assert(
  heroContent.includes("for block in section.blocks") || heroContent.includes("for b in section.blocks"),
  "hero-carousel.liquid must loop over section.blocks to render slides"
);
assert(
  heroContent.includes("hero-crossfade-container") || heroContent.includes("hero-crossfade-slide"),
  "hero-carousel.liquid must contain hero-crossfade-container or hero-crossfade-slide"
);
console.log("✔ Hero carousel slide blocks and default presets verified");

// 6. Verify announcement-bar.liquid
console.log("\nVerifying announcement-bar.liquid...");
const annContent = sectionContents["sections/announcement-bar.liquid"];
const annSchema = sectionSchemas["sections/announcement-bar.liquid"];
const hasDispatchBadgeSetting = annSchema.settings.some(
  (s) => typeof s.default === "string" && s.default.includes("24/48H RAPID DISPATCH (UK & EU)")
) || annContent.includes("24/48H RAPID DISPATCH (UK & EU)");
assert(hasDispatchBadgeSetting, "announcement-bar.liquid must support 24/48H RAPID DISPATCH (UK & EU) badge");
assert(annContent.includes("top-shipping-banner"), "announcement-bar.liquid must contain #top-shipping-banner");
console.log("✔ Announcement bar dispatch badge and shipping banner verified");

// 7. Verify header.liquid
console.log("\nVerifying header.liquid...");
const headerContent = sectionContents["sections/header.liquid"];
assert(headerContent.includes("master-site-header"), "header.liquid must contain #master-site-header");
assert(headerContent.includes("store-search-input"), "header.liquid must contain #store-search-input");
assert(headerContent.includes("btn-b2b-login") || headerContent.includes("B2B"), "header.liquid must contain B2B trade portal button");
assert(headerContent.includes("linklists[section.settings.menu]") || headerContent.includes("section.settings.menu"), "header.liquid must support menu setting");
console.log("✔ Header layout, search input, B2B button, and menu verified");

// 8. Verify mixing-calculator.liquid
console.log("\nVerifying mixing-calculator.liquid...");
const calcContent = sectionContents["sections/mixing-calculator.liquid"];
const calcSchema = sectionSchemas["sections/mixing-calculator.liquid"];
assert(
  calcContent.includes("view-calculator") || calcContent.includes("mixing-systems-grid") || calcContent.includes("project-estimator-card"),
  "mixing-calculator.liquid must contain mixing calculator elements (#view-calculator, #mixing-systems-grid, or #project-estimator-card)"
);
const hasHeadingSetting = calcSchema.settings.some((s) => s.id === "heading" || s.id === "title");
assert(hasHeadingSetting, "mixing-calculator.liquid schema must provide heading setting");
console.log("✔ Mixing calculator and customizable heading setting verified");

// 9. Verify b2b-trade-portal.liquid
console.log("\nVerifying b2b-trade-portal.liquid...");
const b2bContent = sectionContents["sections/b2b-trade-portal.liquid"];
assert(
  b2bContent.includes("dealers.html") || b2bContent.includes("/pages/dealers") || b2bContent.includes("openTradePortalModal"),
  "b2b-trade-portal.liquid must contain link or modal trigger to trade portal"
);
assert(
  b2bContent.toLowerCase().includes("mov") || b2bContent.toLowerCase().includes("minimum order value") || b2bContent.includes("Tier"),
  "b2b-trade-portal.liquid must display trade MOV threshold info"
);
console.log("✔ B2B trade portal registration and MOV threshold info verified");

// 10. Verify footer.liquid
console.log("\nVerifying footer.liquid...");
const footerContent = sectionContents["sections/footer.liquid"];
assert(footerContent.includes("<footer"), "footer.liquid must contain <footer> tag");
assert(footerContent.includes("UN1263") || footerContent.includes("ADR"), "footer.liquid must contain UN1263 / ADR Hazmat compliance info");
assert(footerContent.includes("Coast Airbrush Europe"), "footer.liquid must contain copyright / brand text");
console.log("✔ Footer logistics details, ADR UN1263 compliance, and copyright verified");

// 11. Visual design tokens retention across the sections
console.log("\nVerifying visual design tokens across sections...");
const combinedSections = Object.values(sectionContents).join("\n");
assert(combinedSections.includes("#dc2626") || combinedSections.includes("primary-container"), "Sections must retain accent red (#dc2626 or primary-container)");
assert(combinedSections.includes("#0b0b0d") || combinedSections.includes("#131315") || combinedSections.includes("surface-container"), "Sections must retain dark chassis/surface tokens");
assert(combinedSections.includes("font-headline") || combinedSections.includes("font-headline-"), "Sections must retain font-headline class");
assert(combinedSections.includes("font-mono") || combinedSections.includes("font-code-spec"), "Sections must retain font-mono / font-code-spec class");
console.log("✔ All visual design tokens (#dc2626, #0b0b0d/#131315, font-headline, font-mono) verified");

console.log("\nALL OS 2.0 THEME MODULAR SECTIONS TESTS PASSED!");
