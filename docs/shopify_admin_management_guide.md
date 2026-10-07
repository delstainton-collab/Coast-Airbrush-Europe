# Coast Airbrush Europe: Shopify Admin Management Guide
## Complete Merchant Guide for Online Store 2.0 Design, Product Catalogs & Technical Specifications

> **Theme Package**: `coast-airbrush-eu-shopify-theme.zip`  
> **Companion Media Files**: `coast-shopify-media-files.zip`  
> **Architecture**: Shopify Online Store 2.0 (OS 2.0) Native Theme  
> **Design Aesthetic**: Mechanical Brutalism "Chrome & Kustom"

---

## 1. Quick Start: Installing the Theme in Shopify

1. Log into your Shopify Admin (`https://your-store.myshopify.com/admin`).
2. Go to **Online Store → Themes**.
3. Under **Theme library**, click **Add theme → Upload zip file**.
4. Upload `coast-airbrush-eu-shopify-theme.zip`.
5. Go to **Content → Files** in Shopify Admin:
   - Click **Upload files** and select the images extracted from `coast-shopify-media-files.zip`.
6. Click **Customize** on the uploaded theme to open the Shopify Theme Editor.

---

## 2. Managing Website Design via the Theme Customizer

Open **Online Store → Themes → Customize** to visually edit your store without touching code.

### 2.1 Global Theme Settings (Sidebar Gear Icon ⚙️)
Click the **Theme settings** tab in the left sidebar to control global styling tokens:

* **Branding & Logos**:
  - `Logo (White)`: Displayed in dark headers and footers.
  - `Logo (Red Accent)`: Used in brand cards and featured callouts.
  - `Logo (Black)`: Used in print invoices and light badges.
  - `Logo width (desktop)`: Slider from 80px to 320px.
  - `Favicon`: Custom browser tab icon.
* **Color Scheme**:
  - `Chassis Background`: Default `#0b0b0d`.
  - `Surface Container`: Default `#131315`.
  - `Primary Red Accent`: Default `#dc2626` (Racing Red).
  - `Industrial Border`: Default `#242429`.
  - `Primary Text`: Default `#ffffff`.
  - `Secondary Text`: Default `#9ca3af`.
* **Header Alerts & Dispatch**:
  - `Show announcement bar`: Checkbox toggle.
  - `Dispatch Speed Badge`: Default `⚡ 24/48H RAPID DISPATCH (UK & EU)`.
  - `Announcement text`: Custom promotional message.
  - `Announcement link`: URL link.
* **Logistics & Warehouses**:
  - `UK Fulfillment Hub`: Address displayed in trust badges and footer.
  - `Netherlands Bonded Hub`: EU bonded warehouse details.
  - `Support phone`: Support desk contact number.
  - `Support email`: Support and orders email.
* **Social Links**:
  - Direct URL fields for Instagram, YouTube, Facebook, and Twitter/X.

---

### 2.2 Modular Homepage Sections & Reordering
In the Theme Editor's **Sections** panel, you can drag, drop, reorder, show, or hide sections:

1. **Announcement Bar (`announcement-bar`)**:
   - Customize dispatch speed badge and promotional messages.
2. **Header (`header`)**:
   - Select navigation menu (`Main Menu`).
   - Upload custom header logo or override logo width.
   - Toggle currency selector and B2B trade login buttons.
3. **Hero Carousel (`hero-carousel`)**:
   - **Add, remove, or reorder slides** using blocks:
     - Slide Image (desktop and mobile).
     - Pre-title Badge (e.g., `OFFICIAL EUROPEAN MASTER DISTRIBUTOR`).
     - Headline (e.g., `SIGNAL SHOW UP KROMA EDGE`).
     - Subtitle / Description.
     - Button 1 Label & Link (e.g., `Explore Formulas &rarr;`).
     - Button 2 Label & Link (e.g., `B2B Wholesale Portal`).
     - Slide Text Alignment (`Left`, `Center`, `Right`).
4. **Storefront Catalog (`storefront-catalog`)**:
   - Select which collection powers the catalog (defaults to `All`).
   - Toggle search bar, sort dropdown, and result counter.
   - Set products per page.
5. **Mixing Calculator (`mixing-calculator`)**:
   - Toggle the interactive custom paint ratio and surface area calculator.
   - Edit section title and subtitle.
6. **B2B Trade Portal (`b2b-trade-portal`)**:
   - Edit wholesale partner benefits, MOV criteria (£500 / €550), and registration CTA.
7. **Footer (`footer`)**:
   - Edit warehouse addresses, ADR UN1263 compliance notices, and copyright text.

---

## 3. Managing Products & Live Catalog Sync

All product data, pricing, inventory, and variants are managed under **Shopify Admin → Products**.

### 3.1 Creating or Updating Products
* **Product Title & Description**: Updates live on both the homepage grid and dedicated product pages.
* **Pricing (`Price` & `Compare-at price`)**: Entered in GBP or EUR. Supports automatic Shopify multi-currency conversion.
* **Product Category & Product Type**:
  - Example: `Mirror Chrome Systems`, `Dry Metal Flake (Glitter)`, `Dry Metal Flake Guns`, `Masking Products`.
  - The storefront catalog dynamically indexes these types for search and filtering.
* **Images**: Product images upload directly to Shopify and render in the 4-column responsive grid and detail page galleries.
* **Variants**: Add pack sizes (e.g., `500ml Kit`, `1L Kit`, `100g Jar`, `30g Jar`) with dedicated SKUs and prices. The storefront's buy box dynamically generates pack buttons matching the active variant SKUs.

---

## 4. Adding, Removing, and Reordering Categories

You have two complementary ways to control categories:

### Method A: Via Shopify Collections (Automatic)
1. Go to **Products → Collections** in Shopify Admin.
2. Click **Create collection** (e.g., `Chameleon Pearls` or `Airbrush Stencils`).
3. Set collection conditions (e.g., `Product tag is equal to pearls` or `Product type is equal to Stencils`).
4. The storefront catalog automatically creates filter pills with product counts for any active category with in-stock products.
5. If you delete a collection or set its products to draft, the category filter pill disappears automatically.

### Method B: Via Theme Editor (Curated Pills)
1. Go to **Online Store → Themes → Customize**.
2. Click on the **Storefront Catalog** section.
3. In the sidebar under **Blocks**, click **Add Category Filter Pill**.
4. Enter the **Display Label** (e.g., `CHAMELEON PEARLS`) and matching **Category/Collection Value**.
5. Drag blocks up or down to reorder the category pills on the toolbar.

---

## 5. Managing Category "Specifications" via Shopify Product Metafields

On individual product pages, the **Bench Specifications** section displays technical lab parameters (e.g., Mix Ratios, VOC Compliance, Theoretical Coverage, Pot Life, Flash-Off Time, Nozzle Apertures).

### 5.1 Setting Up Product Metafield Definitions
If not already configured, set up the following definitions in **Settings → Custom Data → Products**:

| Namespace and Key | Name | Type | Description |
| :--- | :--- | :--- | :--- |
| `specs.mix_ratio` | Mix Ratio | Single line text | Exact mixing ratio (e.g. `5:5:2:2`) |
| `specs.pot_life` | Pot Life | Single line text | Usable working time after activation |
| `specs.flash_off_time` | Flash-Off Time | Single line text | Interval between coats |
| `specs.cure_time` | Cure Schedule | Single line text | Air cure and force cure schedule |
| `specs.coverage` | Theoretical Coverage | Single line text | Coverage area (e.g. `12 - 15 m² per Kit`) |
| `specs.film_thickness` | Dry Film Thickness | Single line text | Target film thickness (e.g. `15 - 20 µm`) |
| `specs.recommended_psi` | Operating Pressure (PSI) | Single line text | Spray atomization pressure (e.g. `18 - 22 PSI`) |
| `specs.recommended_nozzle` | Recommended Nozzle | Single line text | Nozzle aperture (e.g. `0.2mm - 0.5mm`) |
| `specs.voc_compliance` | VOC / REACH Status | Single line text | European compliance (e.g. `REACH Compliant / Low VOC`) |
| `specs.substrate_material` | Substrate Material | Single line text | Substrate type (e.g. `Thermoset PET Film`) |
| `specs.particle_size` | Particle Precision | Single line text | Particle size (e.g. `0.008" (200 Micron)`) |

> [!TIP]
> You can automatically create all 11 definitions and sync your catalog by running:
> ```bash
> SHOPIFY_ADMIN_TOKEN=shpat_your_token SHOPIFY_STORE_DOMAIN=your-store.myshopify.com node scripts/shopify_pim_sync.js --sync
> ```

### 5.2 Editing Specifications on Any Product
1. Open any product in **Shopify Admin → Products**.
2. Scroll to the bottom to the **Metafields** section.
3. Fill in the values for **Mix Ratio**, **Theoretical Coverage**, **Operating Pressure**, etc.
4. Click **Save**.
5. When visitors open that product, the **Bench Specifications** section dynamically displays formatted mechanical cards with icons matching the exact design tokens of the site.

---

## 6. Developer Build Commands

To recompile the theme package after any local code changes:

```bash
# Rebuild Shopify theme package and media zip
npm run build:theme

# Run the complete test suite (Freight, BOM, Theme Schemas, Sections, Templates & Dynamic Specs)
npm test
```
