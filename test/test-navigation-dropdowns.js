import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ECOM_CATALOG } from '../data/full_ecom_catalog.js';
import { MASTER_TAXONOMY } from '../data/taxonomy.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("=================================================================");
console.log("  Testing Navigation Subcategory Dropdown Menus                  ");
console.log("=================================================================\n");

// 1. Verify index.html contains dropdown menus with subcategories
console.log("[Test 1] Verifying index.html navigation dropdowns...");
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');

const expectedSubcats = [
  { label: "Work-Holding Jigs", count: 10, dept: "VsionAir" },
  { label: "Tool & Airbrush Holders", count: 18, dept: "VsionAir" },
  { label: "Tool Bars & Lighting Rigs", count: 9, dept: "VsionAir" },
  { label: "Base Stands & Easels", count: 7, dept: "VsionAir" },
  { label: "Fixings, Knobs & Hardware", count: 25, dept: "VsionAir" },
  { label: "Dry Flake Guns & Kits", count: 5, dept: "Flake King" },
  { label: "Gun Accessories & Jars", count: 4, dept: "Flake King" },
  { label: "Candy Color Flakes", count: 19, dept: "Flake King" },
  { label: "Kromatic Shift Flakes", count: 9, dept: "Flake King" },
  { label: "Specialty & Show Krome", count: 8, dept: "Flake King" },
  { label: "Spray-On Mirror Chrome", count: 1, dept: "Kroma Edge" },
  { label: "Hydrophobic Topcoat Clear", count: 1, dept: "Kroma Edge" },
  { label: "Prime Black Solvent Basecoat", count: 1, dept: "Flake King" },
  { label: "Clear Intercoat Binders", count: 2, dept: "Flake King" },
  { label: "Prime Green Precision Tape", count: 3, dept: "Flake King" },
  { label: "Prime Orange High-Temp Tape", count: 3, dept: "Flake King" }
];

expectedSubcats.forEach(sub => {
  const labelHtml = sub.label.replace(/&/g, '&amp;');
  const found = html.includes(sub.label) || html.includes(labelHtml);
  assert(
    found,
    `index.html navigation must include subcategory dropdown item '${sub.label}'`
  );
  console.log(`✔ Verified subcategory in index.html: '${sub.label}' (${sub.count} SKUs, ${sub.dept})`);
});

// 2. Verify Shopify Theme header.liquid contains nested link support and dropdowns
console.log("\n[Test 2] Verifying Shopify header.liquid nested link & dropdown support...");
const headerLiquid = fs.readFileSync(path.join(__dirname, '../coast-airbrush-eu-shopify-theme/sections/header.liquid'), 'utf-8');

assert(
  headerLiquid.includes('link.links') && headerLiquid.includes('child_link in link.links'),
  "header.liquid must support multi-level child links (link.links) for Shopify OS 2.0 theme editor"
);
console.log("✔ Verified Shopify OS 2.0 multi-level nested menus (link.links) in header.liquid");

expectedSubcats.forEach(sub => {
  const labelHtml = sub.label.replace(/&/g, '&amp;');
  const found = headerLiquid.includes(sub.label) || headerLiquid.includes(labelHtml);
  assert(
    found,
    `header.liquid fallback menu must include subcategory dropdown item '${sub.label}'`
  );
});
console.log("✔ Verified all active subcategories present in header.liquid fallback menu");

// 3. Verify CSS rules for dropdown animation & interaction
console.log("\n[Test 3] Verifying CSS dropdown styling in styles.css...");
const css = fs.readFileSync(path.join(__dirname, '../css/styles.css'), 'utf-8');
assert(css.includes('.nav-dropdown-wrapper'), "styles.css must define .nav-dropdown-wrapper");
assert(css.includes('.nav-dropdown-menu'), "styles.css must define .nav-dropdown-menu");
assert(css.includes('.dropdown-chevron'), "styles.css must define .dropdown-chevron");
console.log("✔ Verified CSS dropdown rules (.nav-dropdown-wrapper, .nav-dropdown-menu, .dropdown-chevron)");

console.log("\n=================================================================");
console.log("  ALL NAVIGATION SUBCATEGORY DROPDOWN TESTS PASSED! 🎉           ");
console.log("=================================================================\n");
