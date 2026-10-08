import assert from 'assert';
import { ECOM_CATALOG } from '../data/full_ecom_catalog.js';
import { BRANDS_MASTER, getBrandById, getBrandByName } from '../data/brands_master.js';

console.log("=================================================================");
console.log("  Testing Brand Showcase Rules & Brand Logo Enforcement          ");
console.log("=================================================================\n");

// [Test 1] Verify Phantom Products are Completely Purged
console.log("[Test 1] Verifying NO phantom products exist in the catalog...");
const phantomIds = [
  "clean-armor-auto-uv-clear-quart",
  "clean-armor-pro-uv-led-curing-lamp",
  "lumilor-pro-starter-bundle",
  "lumilor-lumicolor-phosphor-green",
  "hyper-fx-studio-candy-set",
  "hyper-fx-4050-uvls-clear",
  "aos-trad-candy-kit",
  "aos-super-shine-79-clear",
  "aos-prime-time-epoxy-primer",
  "anest-iwata-supernova-ws400",
  "anest-iwata-lph400-lvlp"
];

phantomIds.forEach(id => {
  const found = ECOM_CATALOG.find(p => p.id === id);
  assert.strictEqual(found, undefined, `Phantom product '${id}' must NOT exist in authentic catalog`);
});
console.log(`✔ All ${phantomIds.length} phantom products confirmed purged from ECOM_CATALOG.`);

// [Test 2] Test Dynamic Brand Product Counting Rule
console.log("\n[Test 2] Testing Brand Product Count Rule...");
function getBrandProductCount(brand, catalog) {
  if (!catalog || !Array.isArray(catalog)) return 0;
  const slug = (brand.slug || brand.id || '').toLowerCase();
  const brandName = (brand.name || '').toLowerCase();
  const filterBrand = (brand.filterBrand || '').toLowerCase();

  return catalog.filter(p => {
    if (p.hideFromStorefront) return false;
    const pb = (p.brand || '').toLowerCase();
    if (slug === 'iwata-atawi' || slug === 'iwata' || slug === 'atawi') {
      return pb.includes('iwata') || pb.includes('atawi');
    }
    if (slug === 'flake-king') {
      return pb === 'flake king' || pb.includes('flake king');
    }
    if (slug === 'vsionair') {
      return pb === 'vsionair' || pb.includes('vsionair');
    }
    if (slug === 'kroma-edge') {
      return pb.includes('kroma');
    }
    if (slug === 'ace-of-shades') {
      return pb.includes('ace of shades');
    }
    if (slug === 'hyper-fx') {
      return pb.includes('hyper fx') || pb.includes('createx');
    }
    if (slug === 'lumilor') {
      return pb.includes('lumilor');
    }
    if (slug === 'clean-armor') {
      return pb.includes('clean armor');
    }
    if (filterBrand && pb.includes(filterBrand)) return true;
    return pb.includes(brandName);
  }).length;
}

const activeBrands = BRANDS_MASTER.filter(b => getBrandProductCount(b, ECOM_CATALOG) > 0);
const zeroCountBrands = BRANDS_MASTER.filter(b => getBrandProductCount(b, ECOM_CATALOG) === 0);

console.log(`  Active Brands with Products (${activeBrands.length}):`, activeBrands.map(b => `${b.name} (${getBrandProductCount(b, ECOM_CATALOG)} SKUs)`));
console.log(`  Suppressed Brands with 0 Products (${zeroCountBrands.length}):`, zeroCountBrands.map(b => b.name));

assert.strictEqual(activeBrands.length, 4, "Exactly 4 brands should have active products (Kroma Edge, Flake King, VsionAir, Iwata/Atawi)");
assert.strictEqual(zeroCountBrands.length, 4, "Exactly 4 brands should have 0 products and be blocked from display (Ace of Shades, Hyper FX, LumiLor, Clean Armor)");

// [Test 3] Verify Brand Logos in Brand Boxes
console.log("\n[Test 3] Verifying Brand Logo paths for active brand boxes...");
activeBrands.forEach(brand => {
  assert(brand.logoImage && brand.logoImage.endsWith('.svg'), `Brand '${brand.name}' must have an SVG logo defined`);
  console.log(`✔ Brand '${brand.name}': Logo verified at '${brand.logoImage}'`);
});

// [Test 4] Verify HTML static markup adherence to the rule
console.log("\n[Test 4] Verifying index.html static markup adherence to the rule...");
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');

// Ensure zero-count brands do not have brand cards in the static HTML grid
const gridStart = html.indexOf('id="brands-showcase-grid"');
const gridEnd = html.indexOf('</section>', gridStart);
const gridHtml = html.substring(gridStart, gridEnd);

assert(!gridHtml.includes("Ace of Shades"), "Ace of Shades box must NOT be displayed in brand grid");
assert(!gridHtml.includes("Hyper FX"), "Hyper FX box must NOT be displayed in brand grid");
assert(!gridHtml.includes("LumiLor"), "LumiLor box must NOT be displayed in brand grid");
assert(!gridHtml.includes("Clean Armor"), "Clean Armor box must NOT be displayed in brand grid");

assert(gridHtml.includes("kroma-edge-logo.svg"), "Kroma Edge logo must be present in brand box");
assert(gridHtml.includes("flake-king-logo.svg"), "Flake King logo must be present in brand box");
assert(gridHtml.includes("vsionair-logo.svg"), "VsionAir logo must be present in brand box");
assert(gridHtml.includes("iwata-atawi-logo.svg"), "Anest Iwata logo must be present in brand box");
console.log("✔ index.html verified: 0-product brands suppressed, active brand boxes contain Brand Logos.");

console.log("\n=================================================================");
console.log("  ALL BRAND SHOWCASE & LOGO TESTS PASSED! 🎉                    ");
console.log("=================================================================");
