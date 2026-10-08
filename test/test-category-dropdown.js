import assert from "assert";
import { MASTER_TAXONOMY, findTaxonomyCategory } from "../data/taxonomy.js";
import { ECOM_CATALOG } from "../data/full_ecom_catalog.js";

console.log("=================================================================");
console.log("  Testing Master Category Taxonomy & Dropdown Selector Engine     ");
console.log("=================================================================");

// -------------------------------------------------------------------
// Test 1: Taxonomy Structure & Coverage
// -------------------------------------------------------------------
console.log("\n[Test 1] Verifying 6 Master Departments in Taxonomy...");
const expectedDepts = [
  "Paint & Spray Equipment",
  "Solvent Paints",
  "Water Based Paint",
  "Dry Special FX Products",
  "Masking Products",
  "Workstations & Jigs"
];

assert.strictEqual(MASTER_TAXONOMY.length, 6, "Must define exactly 6 departments in Master Taxonomy");
expectedDepts.forEach((deptName, idx) => {
  assert.strictEqual(MASTER_TAXONOMY[idx].name, deptName, `Department ${idx + 1} must be '${deptName}'`);
});
console.log("✔ All 6 Master Departments correctly defined in MASTER_TAXONOMY.");

// -------------------------------------------------------------------
// Test 2: Golden Rule - 0-Product Categories are Invisible
// -------------------------------------------------------------------
console.log("\n[Test 2] Testing Golden Rule: 0-product categories are invisible...");

// Mock DOM elements
class MockElement {
  constructor(tagName = "div") {
    this.tagName = tagName.toUpperCase();
    this.id = "";
    this.className = "";
    this.innerHTML = "";
    this.value = "";
    this.attributes = {};
    this.listeners = {};
    this.children = [];
  }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] || null; }
  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }
  appendChild(c) { this.children.push(c); return c; }
  removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; }
  remove() {}
  querySelectorAll(sel) { return []; }
  querySelector(sel) { return null; }
}

const mockSelectCat = new MockElement("select");
mockSelectCat.id = "select-shop-category";
const mockSelectBrand = new MockElement("select");
mockSelectBrand.id = "select-shop-brand";

const domElements = new Map([
  ["select-shop-category", mockSelectCat],
  ["select-shop-brand", mockSelectBrand],
  ["brand-filter-pills", new MockElement("div")],
  ["active-filter-chips", new MockElement("div")],
  ["storefront-product-grid", new MockElement("div")]
]);

global.window = {
  location: { search: "" },
  addEventListener: () => {},
  localStorage: { store: {}, getItem() { return null; }, setItem() {} },
  SHOPIFY_VARIANT_MAP: {},
  SHOPIFY_CATALOG: []
};
global.localStorage = global.window.localStorage;
global.document = {
  getElementById: (id) => domElements.get(id) || null,
  querySelectorAll: () => [],
  createElement: (tag) => new MockElement(tag),
  addEventListener: () => {}
};

// Import app
await import("../js/app.js");
const app = global.window.paintApp;
assert(app, "PaintSystemApp instance must be bound to window.paintApp");

app.renderCategoryDropdown();

// Verify Category Dropdown HTML output
const catHtml = mockSelectCat.innerHTML;

// 1. Water Based Paint currently has 0 products in active catalog -> MUST BE INVISIBLE
assert(!catHtml.includes("WATER BASED PAINT"), "Water Based Paint must NOT appear in dropdown while product count is 0");
console.log("✔ Golden Rule verified: 'WATER BASED PAINT' is invisible (0 products).");

// 2. Airbrushes, Spray Guns, Striping Brushes have 0 products -> MUST BE INVISIBLE
assert(!catHtml.includes("Airbrush ("), "Airbrush must NOT appear in dropdown while product count is 0");
assert(!catHtml.includes("Spray Guns ("), "Spray Guns must NOT appear in dropdown while product count is 0");
assert(!catHtml.includes("Striping Brushes ("), "Striping Brushes must NOT appear in dropdown while product count is 0");
console.log("✔ Golden Rule verified: Unstocked equipment (Airbrush, Spray Guns, Striping Brushes) are invisible.");

// 3. Primers, Candies, Pin Striping Paint have 0 products -> MUST BE INVISIBLE
assert(!catHtml.includes("Primer ("), "Primer must NOT appear in dropdown while product count is 0");
assert(!catHtml.includes("Candies ("), "Candies must NOT appear in dropdown while product count is 0");
assert(!catHtml.includes("Pin Striping Paint ("), "Pin Striping Paint must NOT appear in dropdown while product count is 0");
console.log("✔ Golden Rule verified: Unstocked solvent paints (Primer, Candies, Pin Striping) are invisible.");

// 4. Pearls, Gold Leaf have 0 products -> MUST BE INVISIBLE
assert(!catHtml.includes("Pearls ("), "Pearls must NOT appear in dropdown while product count is 0");
assert(!catHtml.includes("Gold Leaf ("), "Gold Leaf must NOT appear in dropdown while product count is 0");
console.log("✔ Golden Rule verified: Unstocked special FX (Pearls, Gold Leaf) are invisible.");

// 5. Active categories MUST be visible
assert(catHtml.includes("Dry Flake Guns"), "Dry Flake Guns must be visible (in-stock products exist)");
assert(catHtml.includes("Base Coat"), "Base Coat must be visible (in-stock products exist)");
assert(catHtml.includes("Clear Coat"), "Clear Coat must be visible (in-stock products exist)");
assert(catHtml.includes("Flakes (36)"), "Flakes must be visible with count (36)");
assert(catHtml.includes("Fine Line Tapes (6)"), "Fine Line Tapes must be visible with count (6)");
assert(catHtml.includes("Work-Holding Jigs (10)"), "Work-Holding Jigs must be visible with count (10)");
console.log("✔ Active categories correctly populated with accurate live product counts.");

// -------------------------------------------------------------------
// Test 3: Brand Dropdown Golden Rule
// -------------------------------------------------------------------
console.log("\n[Test 3] Testing Brand Dropdown Golden Rule...");
const brandHtml = mockSelectBrand.innerHTML;

// Active brands
assert(brandHtml.includes("FLAKE KING (54)"), "Flake King must be visible in brand dropdown (54 items)");
assert(brandHtml.includes("KROMA EDGE (2)"), "Kroma Edge must be visible in brand dropdown (2 items)");
assert(brandHtml.includes("VSIONAIR (69)"), "VsionAir must be visible in brand dropdown (69 items)");

// 0-product brands MUST be invisible
assert(!brandHtml.includes("IWATA"), "Iwata must NOT appear in brand dropdown (0 products)");
assert(!brandHtml.includes("ACE OF SHADES"), "Ace of Shades must NOT appear in brand dropdown (0 products)");
assert(!brandHtml.includes("LUMILOR"), "LumiLor must NOT appear in brand dropdown (0 products)");
assert(!brandHtml.includes("CLEAN ARMOR"), "Clean Armor must NOT appear in brand dropdown (0 products)");
console.log("✔ Brand Dropdown Golden Rule verified: 0-product brands suppressed.");

// -------------------------------------------------------------------
// Test 4: Dynamic Shopify Product Ingestion Updates Visibility Instantly
// -------------------------------------------------------------------
console.log("\n[Test 4] Testing Dynamic Addition (e.g. Water Based Paint arrives)...");
global.window.SHOPIFY_CATALOG = [
  {
    id: "createx-auto-air-01",
    sku: "WB-BASE-01",
    name: "Createx Hyper FX Waterborne Basecoat Black (4oz)",
    category: "Water Based Basecoat",
    brand: "Hyper FX (Powered by Createx)",
    priceEur: 14.50,
    priceGbp: 12.00
  }
];

// Re-render
app.renderCategoryDropdown();
const updatedCatHtml = mockSelectCat.innerHTML;
const updatedBrandHtml = mockSelectBrand.innerHTML;

assert(updatedCatHtml.includes("WATER BASED PAINT"), "Water Based Paint optgroup must immediately appear when product added!");
assert(updatedCatHtml.includes("Basecoats (1)"), "Basecoats (1) must appear under Water Based Paint!");
assert(updatedBrandHtml.includes("HYPER FX (POWERED BY CREATEX) (1)"), "Hyper FX brand must appear in brand dropdown!");
console.log("✔ Dynamic arrival of Water Based Paint immediately makes category and brand visible!");

console.log("\n=================================================================");
console.log("  ALL MASTER CATEGORY TAXONOMY & DROPDOWN TESTS PASSED! 🎉        ");
console.log("=================================================================");
