# Design System: Coast Airbrush Europe Storefront
**Project ID:** 9459186287002627515
**Theme Name:** Precision Performance Engineering

## 1. Visual Theme & Atmosphere
The visual theme embodies **Precision Performance Engineering**. This design system targets demanding technical professionals, master airbrush artisans, custom automotive painters, and precision industrial fabricators across the UK and European Union. 

The atmosphere communicates mechanical mastery, aerospace tolerance, and high-performance instrumentation. It merges the exacting fidelity of modern corporate design with the visceral power of dark automotive luxury. Every layout line, hairline separation, and panel follows strict geometric rigor. The UI feels like an anodized aluminum control rack or custom engine management console with instrument-grade contrast, tactical technicality, and deliberate restraint.

## 2. Color Palette & Roles
- **Pitch Obsidian Canvas (`#0B0B0D` / `#131315`)**: Root background ground plane. Absorbs light, anchoring all content in a glare-free, high-performance viewport.
- **Deep Structural Surface (`#141418` / `#1C1B1D`)**: Surface Elevation 1. Applied to product cards, spec panels, technical matrices, and containers.
- **Elevated Instrument Cluster (`#1C1C22` / `#201F21` / `#2A2A2C`)**: Surface Elevation 2. Applied to elevated card states, hover targets, and interactive modules.
- **Brushed Alloy Borders & Partitions (`#27272A` / `#3F3F46`)**: Subdued brushed alloy borders providing clean 1px architectural definition without visual clutter.
- **High-Octane Crimson (`#DC2626`)**: Primary accent. Applied strictly to primary actions, live low-stock telemetry, and exclusive certification seals.
- **Hydraulic Crimson Hover (`#B91C1C` / `#BF0715`)**: Deepened hydraulic crimson for depressed or hovered touch targets.
- **Machined White (`#FFFFFF` / `#E5E1E4`)**: Primary typography for headlines, numbers, and primary UI states.
- **Precision Silver (`#D1D5DB` / `#C0C7D3`)**: Secondary typography for long-form descriptions, specifications, and technical metadata.
- **Anodized Gray (`#9CA3AF` / `#6B7280`)**: Muted typography for inactive states, SKU labels, unit labels, and structural grid borders.
- **Aero Blue Telemetry (`#90CDFF` / `#0078B2`)**: Tertiary technical accent for ADR certification, Hazmat indicators, and calibration badges.

## 3. Typography Rules
- **Primary Font Family:** Inter (neutral, mechanical geometry that remains legible at both display scales and microscopic hardware specifications).
- **Display Hero (`display-hero`):** Inter 56px, 800 weight, line-height 64px, tracking `-0.03em`. Evokes forged steel badges and automotive instrument headers.
- **Headline XL (`headline-xl`):** Inter 40px, 700 weight, line-height 48px, tracking `-0.025em`.
- **Headline LG (`headline-lg`):** Inter 30px, 700 weight, line-height 38px, tracking `-0.02em`.
- **Headline MD (`headline-md`):** Inter 22px, 600 weight, line-height 28px, tracking `-0.015em`.
- **Headline SM (`headline-sm`):** Inter 18px, 600 weight, line-height 24px, tracking `-0.01em`.
- **Body LG (`body-lg`):** Inter 16px, 400 weight, line-height 24px, tracking `0em`.
- **Body MD (`body-md`):** Inter 14px, 400 weight, line-height 20px, tracking `0em`.
- **Body SM (`body-sm`):** Inter 12px, 400 weight, line-height 16px, tracking `0.01em`.
- **Technical Badges & Micro-Labels (`label-caps`):** Inter 11px, 700 weight, line-height 14px, tracking `+0.08em`, uppercase. Recreates laser-etched equipment markings.
- **Code & Tolerance Specs (`code-spec`):** Inter / monospace 12px, 500 weight, line-height 16px, tracking `+0.04em`.

## 4. Component Stylings
* **Buttons:**
  - *Primary CTA:* Background `#DC2626`, text `#FFFFFF`, radius 4px (`rounded`), height 44px (11 in Tailwind), font weight 600, uppercase tracking `0.04em`. Hover: `#B91C1C`. Active: Scale to 98% with border `#EF4444`.
  - *Secondary (Billet Steel):* Background `#141418`, 1px border `#3F3F46`, text `#FFFFFF`. Hover: Border `#9CA3AF`, background `#1C1C22`.
  - *Ghost Action:* Background transparent, text `#9CA3AF`, 1px transparent border. Hover: Text `#FFFFFF`, border `#27272A`.
* **Cards / Containers:**
  - Enclosed in `#141418` / `#1C1B1D` with a crisp 1px `#27272A` border.
  - Engineered 4px corner radius (`rounded` / `rounded-lg` max 8px).
  - Internal padding defaults to `1.5rem` (24px).
  - Hover shifts border to `#3F3F46` with subtle directional rim glow: `box-shadow: 0 1px 0 0 rgba(255, 255, 255, 0.05) inset`.
  - Soft pill shapes are prohibited to maintain strict industrial rigor.
* **Inputs & Forms:**
  - Background `#0B0B0D` / `#131315`, border 1px `#27272A`, radius 4px, text `#FFFFFF`, height 40px, padding `0 12px`.
  - Focus: Border shifts instantly to `#DC2626` with no soft outer halo. Placeholder in `#6B7280` / `#9CA3AF`.
* **Telemetry HUD & Badges:**
  - Translucent glass HUD (`rgba(14, 14, 16, 0.90)` with `backdrop-blur-md`).
  - Pulsing live indicators (e.g. 6px `#DC2626` pulsing core dot).
  - Border stroke 1px `#27272A` or `#3F3F46`.

## 5. Layout Principles
- **Desktop Reference:** Strict 1440px max-width container with 32px (`2rem`) outer margin and 24px (`1.5rem`) gutters.
- **Rhythm:** Strict 8px baseline rhythm (4px micro increments: 4px, 8px, 16px, 24px, 40px).
- **Asymmetric Split:** 7/5 column split for hero and PDP (7 columns for high-resolution imagery/macro views, 5 columns for technical ordering panels and specs).
- **Depth & Elevation:** Tonal stacking (`#0B0B0D` canvas → `#141418` containers → `#1C1C22` elevated interactive elements) with metallic rim illumination instead of muddy drop shadows.
