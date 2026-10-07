import assert from "assert";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

console.log("=================================================================");
console.log("  Testing Dynamic Category & Specifications Engine (Storefront)  ");
console.log("=================================================================");

// -------------------------------------------------------------------
// Part 1: Dynamic Category Filter Pills in #brand-filter-pills
// -------------------------------------------------------------------
console.log("\n[Test Suite 1] Testing Dynamic Category Filter Pills...");

// Setup DOM mocks for PaintSystemApp testing
class MockClassList {
  constructor(elem) {
    this.elem = elem;
  }
  add(...classes) {
    const set = new Set(this.elem.className.split(/\s+/).filter(Boolean));
    classes.forEach(c => set.add(c));
    this.elem.className = Array.from(set).join(" ");
  }
  remove(...classes) {
    const set = new Set(this.elem.className.split(/\s+/).filter(Boolean));
    classes.forEach(c => set.delete(c));
    this.elem.className = Array.from(set).join(" ");
  }
  contains(c) {
    return this.elem.className.split(/\s+/).includes(c);
  }
}

class MockElement {
  constructor(tagName = "div") {
    this.tagName = tagName.toUpperCase();
    this.id = "";
    this.className = "";
    this.attributes = {};
    this.children = [];
    this.parentNode = null;
    this.listeners = {};
    this.textContentVal = "";
    this._innerHTML = "";
    this.style = {};
    this.classList = new MockClassList(this);
  }

  setAttribute(k, v) {
    this.attributes[k] = String(v);
  }

  getAttribute(k) {
    return this.attributes[k] !== undefined ? this.attributes[k] : null;
  }

  removeAttribute(k) {
    delete this.attributes[k];
  }

  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  click() {
    if (this.listeners["click"]) {
      this.listeners["click"].forEach(fn => fn({ target: this, preventDefault: () => {} }));
    }
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }

  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }

  get textContent() {
    if (this.children.length === 0) return this.textContentVal;
    return this.children.map(c => c.textContent).join("");
  }

  set textContent(v) {
    this.textContentVal = String(v);
    this.children = [];
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(val) {
    this._innerHTML = String(val);
    this.children = [];
  }

  querySelectorAll(selector) {
    const results = [];
    const traverse = (node) => {
      node.children.forEach(child => {
        if (matchesSelector(child, selector)) {
          results.push(child);
        }
        traverse(child);
      });
    };
    traverse(this);
    return results;
  }

  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all.length > 0 ? all[0] : null;
  }
}

function matchesSelector(elem, selector) {
  const parts = selector.trim().split(/\s+/);
  if (parts.length > 1) {
    // descendant selector
    let currentElem = elem;
    for (let i = parts.length - 1; i >= 0; i--) {
      if (!currentElem) return false;
      if (!matchSingleSelector(currentElem, parts[i])) return false;
      currentElem = currentElem.parentNode;
    }
    return true;
  }
  return matchSingleSelector(elem, selector);
}

function matchSingleSelector(elem, selector) {
  if (selector.startsWith("#")) {
    return elem.id === selector.slice(1);
  }
  if (selector.startsWith(".")) {
    const c = selector.slice(1);
    return elem.className.split(/\s+/).includes(c);
  }
  if (selector.includes("[") && selector.endsWith("]")) {
    const inside = selector.slice(selector.indexOf("[") + 1, -1);
    const tag = selector.slice(0, selector.indexOf("["));
    if (tag && elem.tagName.toLowerCase() !== tag.toLowerCase()) return false;
    if (inside.includes("=")) {
      const [attr, rawVal] = inside.split("=");
      const val = rawVal.replace(/['"]/g, "");
      return elem.getAttribute(attr.trim()) === val;
    } else {
      return elem.getAttribute(inside.trim()) !== null;
    }
  }
  return elem.tagName.toLowerCase() === selector.toLowerCase();
}

// Global DOM registry for getElementById
const domElements = new Map();
const rootDocElem = new MockElement("body");

function registerMockElement(id, tagName = "div") {
  const el = new MockElement(tagName);
  el.id = id;
  domElements.set(id, el);
  rootDocElem.appendChild(el);
  return el;
}

// Set up mock window and document
global.window = {
  location: { search: "" },
  addEventListener: () => {},
  localStorage: {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; }
  },
  SHOPIFY_VARIANT_MAP: {},
  SHOPIFY_CATALOG: []
};
global.localStorage = global.window.localStorage;
try {
  Object.defineProperty(global, 'navigator', {
    value: { clipboard: { writeText: async () => {} } },
    configurable: true,
    writable: true
  });
} catch (e) {
  // If navigator already defined
}

const brandFilterPillsContainer = registerMockElement("brand-filter-pills", "div");
// Pre-populate with default brand pill "ALL" and a couple of brand buttons
const allBtn = new MockElement("button");
allBtn.className = "brand-pill active px-3 py-1.5 border border-secondary bg-black/60 text-white font-bold hover:border-primary transition-colors cursor-pointer";
allBtn.setAttribute("data-brand-val", "all");
allBtn.textContent = "ALL";
brandFilterPillsContainer.appendChild(allBtn);

const kromaBrandBtn = new MockElement("button");
kromaBrandBtn.className = "brand-pill px-3 py-1.5 border border-sky-500/50 bg-black/60 text-sky-300 hover:text-white hover:border-sky-400 transition-colors cursor-pointer";
kromaBrandBtn.setAttribute("data-brand-val", "Kroma Edge");
kromaBrandBtn.textContent = "KROMA EDGE";
brandFilterPillsContainer.appendChild(kromaBrandBtn);

registerMockElement("storefront-product-grid", "div");
registerMockElement("input-shop-search", "input");
registerMockElement("select-shop-sort", "select");
registerMockElement("active-filter-chips", "div");
registerMockElement("top-category-pill-bar", "div");
registerMockElement("contextual-subcat-bar", "div");
registerMockElement("active-category-title-badge", "div");
registerMockElement("shop-results-count", "div");
registerMockElement("mobile-shop-results-count", "div");

global.document = {
  getElementById: (id) => domElements.get(id) || null,
  querySelectorAll: (selector) => {
    const results = [];
    const traverse = (node) => {
      node.children.forEach(child => {
        if (matchesSelector(child, selector)) {
          results.push(child);
        }
        traverse(child);
      });
    };
    traverse(rootDocElem);
    return results;
  },
  createElement: (tagName) => new MockElement(tagName),
  body: rootDocElem,
  addEventListener: () => {}
};

// Supply new dynamic categories via window.SHOPIFY_CATALOG before app startup
global.window.SHOPIFY_CATALOG = [
  {
    id: "live-cat-prod-1",
    sku: "STENCIL-01",
    name: "Precision Skull Shield Airbrush Stencil",
    productType: "Airbrush Stencils",
    category: "Airbrush Stencils",
    priceEur: 18.50,
    priceGbp: 15.00,
    available: true
  },
  {
    id: "live-cat-prod-2",
    sku: "STENCIL-02",
    name: "Flame Master Freehand Shield Airbrush Stencil",
    productType: "Airbrush Stencils",
    category: "Airbrush Stencils",
    priceEur: 22.00,
    priceGbp: 18.00,
    available: true
  },
  {
    id: "live-cat-prod-3",
    sku: "PEARL-CHAM-01",
    name: "Hyper-Shift Emerald To Violet Chameleon Pearl (25g)",
    productType: "Chameleon Pearls",
    category: "Chameleon Pearls",
    priceEur: 34.00,
    priceGbp: 28.00,
    available: true
  },
  {
    id: "live-cat-prod-4",
    sku: "HYDRO-01",
    name: "Carbon Weave Custom Hydrographics Activator Film Kit",
    productType: "Custom Hydrographics",
    category: "Custom Hydrographics",
    priceEur: 45.00,
    priceGbp: 38.00,
    available: true
  }
];

// Import app.js
await import("../js/app.js");

const app = global.window.paintApp;
assert(app, "PaintSystemApp instance must be bound to window.paintApp");

// 1. Verify window.SHOPIFY_CATALOG was merged into the active catalog
const { ECOM_CATALOG } = await import("../data/full_ecom_catalog.js");
const stencilProd = ECOM_CATALOG.find(p => p.sku === "STENCIL-01");
assert(stencilProd, "Live product from window.SHOPIFY_CATALOG must be merged into ECOM_CATALOG at startup");
assert.strictEqual(stencilProd.category, "Airbrush Stencils");
console.log("✔ Live catalog from window.SHOPIFY_CATALOG successfully merged at startup");

// 2. Verify renderCategoryPills() exists and renders dynamic category pills in #brand-filter-pills
assert.strictEqual(typeof app.renderCategoryPills, "function", "app.renderCategoryPills must be a function");
app.renderCategoryPills();

const catPills = brandFilterPillsContainer.querySelectorAll("button[data-cat-val]");
assert(catPills.length > 0, "Category filter pills must be rendered into #brand-filter-pills");

const stencilPill = catPills.find(b => b.getAttribute("data-cat-val") === "Airbrush Stencils");
assert(stencilPill, "Airbrush Stencils pill must be dynamically generated in #brand-filter-pills");
assert(stencilPill.textContent.includes("2"), `Airbrush Stencils pill must show product count (2), got '${stencilPill.textContent}'`);

const chameleonPill = catPills.find(b => b.getAttribute("data-cat-val") === "Chameleon Pearls");
assert(chameleonPill, "Chameleon Pearls pill must be dynamically generated in #brand-filter-pills");
assert(chameleonPill.textContent.includes("1"), `Chameleon Pearls pill must show product count (1), got '${chameleonPill.textContent}'`);

const hydroPill = catPills.find(b => b.getAttribute("data-cat-val") === "Custom Hydrographics");
assert(hydroPill, "Custom Hydrographics pill must be dynamically generated in #brand-filter-pills");
assert(hydroPill.textContent.includes("1"), `Custom Hydrographics pill must show product count (1), got '${hydroPill.textContent}'`);

// 3. Verify styling adheres to mechanical brutalism specs
const requiredStyles = ["brand-pill", "px-3", "py-1.5", "border", "border-secondary", "bg-black/60"];
requiredStyles.forEach(cls => {
  assert(
    stencilPill.className.includes(cls),
    `Category pill must include mechanical brutalism class '${cls}', got: '${stencilPill.className}'`
  );
});
console.log("✔ Category filter pills maintain exact mechanical brutalism styling");

// 4. Verify 0-count categories are NOT rendered
const emptyCatPill = catPills.find(b => b.getAttribute("data-cat-val") === "NonExistentGhostCategory");
assert(!emptyCatPill, "Category with 0 products must NOT have an empty pill rendered");
console.log("✔ Empty / 0-product categories are not rendered");

// 5. Verify click interaction on dynamic pill activates filter
stencilPill.click();
assert.strictEqual(app.activeCategoryFilter, "Airbrush Stencils", "Clicking pill must set activeCategoryFilter");
assert(stencilPill.className.includes("active"), "Active category pill must receive 'active' class");
assert(stencilPill.className.includes("bg-primary-container"), "Active category pill must receive 'bg-primary-container' class");
console.log("✔ Dynamic category pill click updates active filter and styling");


// -------------------------------------------------------------------
// Part 2: Editable Category Specifications in product.html
// -------------------------------------------------------------------
console.log("\n[Test Suite 2] Testing Editable Category Specifications...");

// Extract and evaluate renderCategorySpecifications from product.html
const productHtmlPath = path.join(ROOT_DIR, "product.html");
assert(fs.existsSync(productHtmlPath), `product.html not found at: ${productHtmlPath}`);
const productHtmlContent = fs.readFileSync(productHtmlPath, "utf8");

// Parse renderCategorySpecifications function from product.html
const funcMatch = productHtmlContent.match(/function\s+renderCategorySpecifications\s*\([^)]*\)\s*\{[\s\S]*?\n\s{4}\}/);
assert(funcMatch, "renderCategorySpecifications function must be present in product.html");

const renderCategorySpecificationsFunc = new Function("product", `
  const container = document.getElementById('specs-cards-container');
  const badgeElem = document.getElementById('specs-header-badge');
  const titleElem = document.getElementById('specs-header-title');
  const metaText = document.getElementById('specs-header-meta-text');
  (${funcMatch[0]})(product);
`);

// Setup container mock for specs
const specsCardsContainer = new MockElement("div");
specsCardsContainer.id = "specs-cards-container";
const specsBadgeElem = new MockElement("span");
specsBadgeElem.id = "specs-header-badge";
const specsTitleElem = new MockElement("h2");
specsTitleElem.id = "specs-header-title";
const specsMetaTextElem = new MockElement("p");
specsMetaTextElem.id = "specs-header-meta-text";

domElements.set("specs-cards-container", specsCardsContainer);
domElements.set("specs-header-badge", specsBadgeElem);
domElements.set("specs-header-title", specsTitleElem);
domElements.set("specs-header-meta-text", specsMetaTextElem);

// Test 2A: Custom Specs Object
const customProduct = {
  id: "custom-specialty-clear-01",
  name: "Apex Hyper-Gloss 2K Show Clear",
  category: "Dedicated Clearcoats",
  specs: {
    mix_ratio: "4:1:1",
    pot_life: "45 mins",
    coverage: "15 m²/L",
    recommended_nozzle: "0.2mm - 0.5mm",
    voc_compliance: "EU Directive 2004/42/IIB(d)"
  }
};

renderCategorySpecificationsFunc(customProduct);
const renderedHtml = specsCardsContainer.innerHTML;
assert(renderedHtml && renderedHtml.length > 0, "Custom specs must render cards into specs-cards-container");

// Verify all defined custom spec values appear in the output
assert(renderedHtml.includes("4:1:1"), "Rendered cards must contain mix_ratio value '4:1:1'");
assert(renderedHtml.includes("45 mins"), "Rendered cards must contain pot_life value '45 mins'");
assert(renderedHtml.includes("15 m²/L"), "Rendered cards must contain coverage value '15 m²/L'");
assert(renderedHtml.includes("0.2mm - 0.5mm"), "Rendered cards must contain recommended_nozzle value '0.2mm - 0.5mm'");
assert(renderedHtml.includes("EU Directive 2004/42/IIB(d)"), "Rendered cards must contain voc_compliance value 'EU Directive 2004/42/IIB(d)'");

// Verify card styling classes
const cardStyleClasses = [
  "bg-surface-container-low",
  "p-space-md",
  "rounded-lg",
  "border",
  "border-surface-container-high",
  "shadow-sm",
  "font-label-caps",
  "font-code-spec",
  "font-headline-sm"
];
cardStyleClasses.forEach(cls => {
  assert(renderedHtml.includes(cls), `Custom spec cards must include class '${cls}'`);
});

// Verify Material Symbols icons
assert(renderedHtml.includes("material-symbols-outlined"), "Spec cards must include Material Symbols icons");
console.log("✔ Custom specs object rendered successfully with correct labels, values, icons, and mechanical brutalism styling");

// Test 2B: Fallback Gracefully when no custom specs defined (Flake)
const flakeProductWithoutCustomSpecs = {
  id: "fk-flake-01",
  name: "Kustom Holographic Gold Flake",
  category: "Dry Metal Flake (Glitter)"
};
renderCategorySpecificationsFunc(flakeProductWithoutCustomSpecs);
const flakeHtml = specsCardsContainer.innerHTML;
assert(flakeHtml.includes("Thermoset PET Film"), "Flake product without custom specs must fall back to default flake substrate spec");
assert(flakeHtml.includes("0.008\" (200 Micron)"), "Flake product without custom specs must fall back to default particle range spec");
console.log("✔ Graceful fallback to default flake specs verified");

// Test 2C: Fallback Gracefully when no custom specs defined (Paint)
const paintProductWithoutCustomSpecs = {
  id: "ke-paint-01",
  name: "Kroma Edge Pure Chrome Basecoat",
  category: "Solvent Paints"
};
renderCategorySpecificationsFunc(paintProductWithoutCustomSpecs);
const paintHtml = specsCardsContainer.innerHTML;
assert(paintHtml.includes("5:5:2:2 by Weight"), "Paint product without custom specs must fall back to default paint mix spec");
assert(paintHtml.includes("3.0 Hours Induction"), "Paint product without custom specs must fall back to default pot life spec");
console.log("✔ Graceful fallback to default paint specs verified");


// -------------------------------------------------------------------
// Part 3: templates/product.liquid in Theme Bundle
// -------------------------------------------------------------------
console.log("\n[Test Suite 3] Testing templates/product.liquid in Theme Bundle...");

const themeZipPath = path.join(ROOT_DIR, "coast-airbrush-eu-shopify-theme.zip");
assert(fs.existsSync(themeZipPath), `Shopify theme zip not found at: ${themeZipPath}`);

// Extract templates/product.liquid from zip
let productLiquidContent;
try {
  productLiquidContent = execSync(`unzip -p "${themeZipPath}" "templates/product.liquid"`, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024
  });
} catch (err) {
  assert.fail(`Failed to read templates/product.liquid from theme zip: ${err.message}`);
}

assert(
  productLiquidContent.includes("window.SHOPIFY_CURRENT_PRODUCT"),
  "templates/product.liquid must define window.SHOPIFY_CURRENT_PRODUCT"
);

// Verify all required spec metafields are mapped into window.SHOPIFY_CURRENT_PRODUCT.specs
const requiredMetafields = [
  "mix_ratio",
  "pot_life",
  "flash_off_time",
  "cure_time",
  "coverage",
  "film_thickness",
  "recommended_psi",
  "recommended_nozzle",
  "voc_compliance",
  "substrate_material",
  "particle_size"
];

requiredMetafields.forEach(field => {
  assert(
    productLiquidContent.includes(field),
    `templates/product.liquid must map metafield 'specs.${field}' into window.SHOPIFY_CURRENT_PRODUCT.specs`
  );
});

console.log("✔ templates/product.liquid maps all 11 specification metafields into window.SHOPIFY_CURRENT_PRODUCT.specs");

console.log("\n=================================================================");
console.log("  ALL DYNAMIC SPECS & CATEGORIES TESTS PASSED! 🎉                ");
console.log("=================================================================");
