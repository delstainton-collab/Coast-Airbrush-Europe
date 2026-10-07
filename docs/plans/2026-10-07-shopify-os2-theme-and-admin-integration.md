# Shopify Online Store 2.0 Theme & Admin Product Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Coast Airbrush Europe storefront into a native Shopify Online Store 2.0 theme retaining 100% of the current "Mechanical Brutalism Chrome & Kustom" look and feel, while enabling full Shopify Admin control over website design (Theme Customizer), product catalog, dynamic categories (add/remove collections), and editable category "Specifications" via Shopify Product Metafields.

**Architecture:** 
1. **Design & Theme Editor**: Refactor the theme bundle generator (`scripts/rebuild_shopify_theme.py`) to emit modular Online Store 2.0 sections (`sections/*.liquid` with comprehensive `{% schema %}` definitions), an editable `templates/index.json`, and a rich `config/settings_schema.json`.
2. **Dynamic Categories**: Enable adding, removing, and reordering categories in Shopify Admin both via Shopify Collections / Product Types and via Theme Customizer collection blocks.
3. **Category Specifications**: Make the product "Specifications" section fully editable in Shopify Admin using standard Shopify Product Metafield Definitions (`specs.*`), dynamically rendering custom spec cards on the product detail page.
4. **Live Product Hydration**: Feed live Shopify products, real numeric variant IDs, inventory, prices, and metafields to `js/app.js` and `product.html` via Liquid serialization, while preserving offline/local fallback.

**Tech Stack:** Shopify Liquid, Shopify Online Store 2.0 (OS 2.0), JSON Schemas, Shopify Product Metafields, JavaScript (ES6 Modules/CommonJS Bundling), Python 3 (Theme Compiler), Tailwind CSS.

---

### Task 1: Global Theme Settings & Strict Visual Styling Fidelity

**Files:**
- Modify: `scripts/rebuild_shopify_theme.py:306-320`
- Test: `test/test-theme-schema.js`

**Step 1: Write test for `settings_schema.json`**
Create `test/test-theme-schema.js`:
- Verifies `config/settings_schema.json` contains valid JSON.
- Checks for default styling tokens:
  - Background `#0b0b0d`
  - Accent Red `#dc2626`
  - Container surfaces `#131315` and borders `#242429`
- Checks for setting categories: Branding & Logos, Color Scheme, Typography, Header Alerts & Dispatch, Logistics & Warehouses, Social Links.

**Step 2: Run test to verify it fails**
Run: `node test/test-theme-schema.js`
Expected: FAIL.

**Step 3: Implement `SETTINGS_SCHEMA_JSON` in `scripts/rebuild_shopify_theme.py`**
- Populate `SETTINGS_SCHEMA_JSON` with theme settings matching all current design parameters and defaults.

**Step 4: Run test to verify it passes**
Run: `npm run build:theme && node test/test-theme-schema.js`
Expected: PASS.

**Step 5: Commit**
```bash
git add scripts/rebuild_shopify_theme.py test/test-theme-schema.js
git commit -m "feat(shopify): configure OS 2.0 theme settings schema preserving mechanical brutalism design tokens"
```

---

### Task 2: Modular OS 2.0 Sections with Customizer Schemas & Dynamic Category Management

**Files:**
- Modify: `scripts/rebuild_shopify_theme.py`
- Create in Theme:
  - `sections/announcement-bar.liquid`
  - `sections/header.liquid`
  - `sections/hero-carousel.liquid`
  - `sections/storefront-catalog.liquid`
  - `sections/mixing-calculator.liquid`
  - `sections/b2b-trade-portal.liquid`
  - `sections/footer.liquid`
- Test: `test/test-theme-sections.js`

**Step 1: Write test for sections, schemas, and category management**
Create `test/test-theme-sections.js`:
- Inspects `coast-airbrush-eu-shopify-theme.zip`.
- Verifies every required section exists with valid `{% schema %}` JSON.
- Specifically verifies `sections/storefront-catalog.liquid` supports:
  - Dynamic category pills derived from Shopify Collections / Product Types.
  - Customizer blocks to add, remove, and reorder category filter pills in the Theme Editor.
- Verifies `sections/hero-carousel.liquid` retains exact layout, CSS classes, typography, and default slides.

**Step 2: Run test to verify it fails**
Run: `node test/test-theme-sections.js`
Expected: FAIL.

**Step 3: Implement the dynamic sections in `scripts/rebuild_shopify_theme.py`**
1. **`sections/announcement-bar.liquid`**:
   - Preserves dark banner styling, dispatch badge (`⚡ 24/48H RAPID DISPATCH (UK & EU)`), editable in customizer.
2. **`sections/header.liquid`**:
   - Preserves logo, navigation menu, quick actions, phone/email, currency switcher.
3. **`sections/hero-carousel.liquid`**:
   - Replaces hardcoded hero with customizable slide blocks (image, badge, headline, subtitle, buttons).
   - Defaults to the current 6 production slides so the look and feel is 100% identical out of the box.
4. **`sections/storefront-catalog.liquid`**:
   - Preserves exact toolbar, search input, sort dropdown, and 4-column responsive product card grid.
   - **Dynamic Categories Feature**: Allows merchants to add/remove categories either via Shopify collection selector blocks in the theme customizer OR automatically populated from active product categories.
   - Injects `<script id="shopify-catalog-data" type="application/json">` with live products and metafields.
5. **`sections/mixing-calculator.liquid`**:
   - Preserves interactive calculator, ratio matrix, surface area selector, and volume sliders.
   - Toggleable and reorderable in Shopify Theme Editor.
6. **`sections/b2b-trade-portal.liquid`**:
   - Preserves B2B trade account registration banner and tiered MOV rules.
7. **`sections/footer.liquid`**:
   - Preserves warehouse addresses, REACH/ADR compliance notices, payment badges, and legal links.

**Step 4: Run test to verify it passes**
Run: `npm run build:theme && node test/test-theme-sections.js`
Expected: PASS.

**Step 5: Commit**
```bash
git add scripts/rebuild_shopify_theme.py test/test-theme-sections.js
git commit -m "feat(shopify): create modular OS 2.0 sections with dynamic categories and customizer blocks"
```

---

### Task 3: Online Store 2.0 JSON Template (`templates/index.json`) & Section Reordering

**Files:**
- Modify: `scripts/rebuild_shopify_theme.py`
- Create in Theme: `templates/index.json`
- Modify in Theme: `layout/theme.liquid`
- Test: `test/test-theme-templates.js`

**Step 1: Write test for OS 2.0 JSON templates**
Create `test/test-theme-templates.js`:
- Verifies `templates/index.json` exists in `coast-airbrush-eu-shopify-theme.zip`.
- Confirms all section keys and order match the standard layout.
- Verifies theme loads seamlessly.

**Step 2: Run test to verify it fails**
Run: `node test/test-theme-templates.js`
Expected: FAIL.

**Step 3: Implement `templates/index.json` in `scripts/rebuild_shopify_theme.py`**
- Generate `templates/index.json` with the full section hierarchy.
- Remove old static `templates/index.liquid`.

**Step 4: Run test to verify it passes**
Run: `npm run build:theme && node test/test-theme-templates.js`
Expected: PASS.

**Step 5: Commit**
```bash
git add scripts/rebuild_shopify_theme.py test/test-theme-templates.js
git commit -m "feat(shopify): configure OS 2.0 templates/index.json for visual section reordering"
```

---

### Task 4: Dynamic Category & Specifications Engine in Frontend JavaScript

**Files:**
- Modify: `js/app.js`
- Modify: `product.html`
- Modify: `scripts/rebuild_shopify_theme.py` (`templates/product.liquid`)
- Test: `test/test-dynamic-specs-and-categories.js`

**Step 1: Write test for dynamic categories and editable specifications**
Create `test/test-dynamic-specs-and-categories.js`:
- Tests dynamic category pill generation: When products with new categories (e.g., `"Airbrush Stencils"`, `"Chameleon Pearls"`) are present, filter pills are automatically created.
- Tests dynamic specifications: When a product has `specs` in its metafields (e.g., `coverage: "12 m²"`, `pot_life: "45 mins"`, `mix_ratio: "4:1:1"`), `renderCategorySpecifications()` renders custom cards for those exact specifications instead of relying on hardcoded static strings.
- Verifies backward compatibility and fallback behavior.

**Step 2: Run test to verify it fails**
Run: `node test/test-dynamic-specs-and-categories.js`
Expected: FAIL.

**Step 3: Implement dynamic categories and editable specifications**
1. **Dynamic Category Filter Pills in `js/app.js`**:
   - Scan active products in `ECOM_CATALOG` / `window.SHOPIFY_CATALOG`.
   - Automatically extract unique categories/brands.
   - Render the filter pill buttons dynamically while preserving the exact CSS styling (`brand-pill px-3 py-1.5 border border-secondary bg-black/60 ...`).
2. **Editable Category Specifications in `product.html`**:
   - Update `renderCategorySpecifications(product)` to dynamically map `product.specs` or `window.SHOPIFY_CURRENT_PRODUCT.specs` into the grid of spec cards.
   - If custom metafields (e.g., `mix_ratio`, `pot_life`, `flash_off_time`, `cure_time`, `coverage`, `film_thickness`, `recommended_psi`, `recommended_nozzle`, `voc_compliance`, `substrate_material`, `particle_size`) are entered in Shopify Admin, render dedicated cards for each spec.
   - Preserve the exact mechanical card styling (`bg-surface-container-low p-space-md rounded-lg border border-surface-container-high shadow-sm ...`).
3. **Shopify Product Liquid Metafields**:
   - In `templates/product.liquid`, serialize all `product.metafields.specs` into `window.SHOPIFY_CURRENT_PRODUCT.specs`.

**Step 4: Run test to verify it passes**
Run: `node test/test-dynamic-specs-and-categories.js`
Expected: PASS.

**Step 5: Commit**
```bash
git add js/app.js product.html scripts/rebuild_shopify_theme.py test/test-dynamic-specs-and-categories.js
git commit -m "feat(storefront): make category specifications and category filter pills fully dynamic and editable"
```

---

### Task 5: End-to-End Build, Test Suite & Shopify Admin Management Guide

**Files:**
- Modify: `package.json`
- Create: `docs/shopify_admin_management_guide.md`
- Run: `npm run build:theme`
- Run: `npm test`

**Step 1: Execute complete theme build**
Run: `npm run build:theme`
Expected: Theme zip and companion media zip successfully built.

**Step 2: Execute entire regression test suite**
Run: `npm test`
Expected: All tests pass (core, freight bridge, BOM engine, 3-tier MOV, and all new theme/spec tests).

**Step 3: Write Shopify Admin Management Guide**
Create `docs/shopify_admin_management_guide.md` covering:
1. Uploading the theme to Shopify Admin.
2. Customizing design, announcement bars, hero slides, and reordering sections in **Theme Editor (Customize)**.
3. Adding and removing categories via **Shopify Collections** and **Product Types**.
4. Managing and editing the **Specifications** cards on products using **Shopify Product Metafields (`specs.*`)**.

**Step 4: Commit**
```bash
git add package.json docs/shopify_admin_management_guide.md
git commit -m "docs(shopify): publish complete Shopify Admin guide for theme, categories, and product specifications"
```
