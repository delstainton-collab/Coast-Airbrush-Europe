import assert from "assert";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const themeZipPath = path.join(rootDir, "coast-airbrush-eu-shopify-theme.zip");

console.log("=== Testing Shopify OS 2.0 Theme Settings Schema ===");

// 1. Open and parse config/settings_schema.json from bundled zip
assert(fs.existsSync(themeZipPath), `Theme zip bundle not found at: ${themeZipPath}`);

let schemaContent;
try {
  schemaContent = execSync(`unzip -p "${themeZipPath}" config/settings_schema.json`, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024
  });
} catch (err) {
  assert.fail(`Failed to extract config/settings_schema.json from zip: ${err.message}`);
}

assert(schemaContent && schemaContent.trim().length > 0, "config/settings_schema.json is empty");

let schema;
try {
  schema = JSON.parse(schemaContent);
} catch (err) {
  assert.fail(`config/settings_schema.json is not valid JSON: ${err.message}`);
}

assert(Array.isArray(schema), "Settings schema root must be a JSON array");
console.log(`✔ config/settings_schema.json parsed successfully (${schema.length} top-level sections)`);

// 2. Verify Theme Info
const themeInfo = schema.find((s) => s.name === "theme_info");
assert(themeInfo, "theme_info block missing from schema");
assert.strictEqual(themeInfo.theme_name, "Coast Airbrush Europe");
console.log("✔ theme_info metadata verified");

// 3. Check for mandatory categories
const requiredCategories = [
  "Branding & Logos",
  "Color Scheme",
  "Typography",
  "Header Alerts & Dispatch",
  "Logistics & Warehouses",
  "Social Links"
];

const categoryNames = schema.map((s) => s.name).filter(Boolean);
for (const cat of requiredCategories) {
  const found = schema.find((s) => s.name && s.name.toLowerCase() === cat.toLowerCase());
  assert(found, `Mandatory category '${cat}' missing from settings_schema.json. Found: [${categoryNames.join(", ")}]`);
  assert(Array.isArray(found.settings) && found.settings.length > 0, `Category '${cat}' has no settings defined`);
}
console.log("✔ All mandatory setting categories present with active settings");

// Helper to find setting by ID or matching default
const allSettings = schema.flatMap((s) => s.settings || []).filter((item) => item.id);

// 4. Checks for default styling tokens:
// - Background #0b0b0d
// - Accent Red #dc2626
// - Container surfaces #131315 and borders #242429
const bgSetting = allSettings.find(
  (s) => (s.id && (s.id.includes("bg") || s.id.includes("background"))) &&
         (typeof s.default === "string" && s.default.toLowerCase() === "#0b0b0d")
);
assert(bgSetting, "Default styling token Background '#0b0b0d' missing from theme settings");

const accentSetting = allSettings.find(
  (s) => (s.id && (s.id.includes("accent") || s.id.includes("primary") || s.id.includes("red"))) &&
         (typeof s.default === "string" && s.default.toLowerCase() === "#dc2626")
);
assert(accentSetting, "Default styling token Accent Red '#dc2626' missing from theme settings");

const surfaceSetting = allSettings.find(
  (s) => (s.id && (s.id.includes("surface") || s.id.includes("card") || s.id.includes("container"))) &&
         (typeof s.default === "string" && s.default.toLowerCase() === "#131315")
);
assert(surfaceSetting, "Default styling token Container surface '#131315' missing from theme settings");

const borderSetting = allSettings.find(
  (s) => (s.id && (s.id.includes("border") || s.id.includes("outline"))) &&
         (typeof s.default === "string" && s.default.toLowerCase() === "#242429")
);
assert(borderSetting, "Default styling token Border '#242429' missing from theme settings");
console.log("✔ All core mechanical brutalism color tokens verified (#0b0b0d, #dc2626, #131315, #242429)");

// 5. Check Branding & Logos settings
const brandingCat = schema.find((s) => s.name === "Branding & Logos");
const brandingSettings = brandingCat.settings;
const hasWhiteLogo = brandingSettings.some(
  (s) => s.id && s.id.toLowerCase().includes("white") && s.type === "image_picker"
);
const hasRedLogo = brandingSettings.some(
  (s) => s.id && s.id.toLowerCase().includes("red") && s.type === "image_picker"
);
const hasBlackLogo = brandingSettings.some(
  (s) => s.id && s.id.toLowerCase().includes("black") && s.type === "image_picker"
);
const hasLogoWidth = brandingSettings.some(
  (s) => s.id && s.id.toLowerCase().includes("width") && s.type === "range"
);
const hasFavicon = brandingSettings.some(
  (s) => s.id && s.id.toLowerCase().includes("favicon") && s.type === "image_picker"
);

assert(hasWhiteLogo, "Branding: White logo uploader missing");
assert(hasRedLogo, "Branding: Red logo uploader missing");
assert(hasBlackLogo, "Branding: Black logo uploader missing");
assert(hasLogoWidth, "Branding: Custom logo width range slider missing");
assert(hasFavicon, "Branding: Favicon image picker missing");
console.log("✔ Branding & Logos settings verified (White, Red, Black logos, width slider, favicon)");

// 6. Check Header Alerts & Dispatch settings
const headerCat = schema.find((s) => s.name === "Header Alerts & Dispatch");
const headerSettings = headerCat.settings;
const hasAlertMsg = headerSettings.some(
  (s) => s.id && (s.id.includes("announcement") || s.id.includes("alert")) && (s.type === "text" || s.type === "textarea")
);
const hasAlertLink = headerSettings.some(
  (s) => s.id && (s.id.includes("link") || s.id.includes("url")) && s.type === "url"
);
const hasDispatchBadge = headerSettings.some(
  (s) => typeof s.default === "string" && s.default.includes("24/48H RAPID DISPATCH (UK & EU)")
);
const hasToggle = headerSettings.some(
  (s) => s.type === "checkbox" && s.id && (s.id.includes("enable") || s.id.includes("show"))
);

assert(hasAlertMsg, "Header Alerts: Announcement message setting missing");
assert(hasAlertLink, "Header Alerts: Announcement link setting missing");
assert(hasDispatchBadge, "Header Alerts: Dispatch speed badge default '⚡ 24/48H RAPID DISPATCH (UK & EU)' missing");
assert(hasToggle, "Header Alerts: Announcement bar display toggle missing");
console.log("✔ Header Alerts & Dispatch settings verified (alert msg, link, dispatch badge, display toggle)");

// 7. Check Logistics & Warehouses settings
const logisticsCat = schema.find((s) => s.name === "Logistics & Warehouses");
const logSettings = logisticsCat.settings;
const hasUkHub = logSettings.some(
  (s) => s.id && s.id.includes("uk") && (typeof s.default === "string" && s.default.length > 0)
);
const hasNlHub = logSettings.some(
  (s) => s.id && (s.id.includes("nl") || s.id.includes("netherlands") || s.id.includes("eu")) && (typeof s.default === "string" && s.default.length > 0)
);
const hasEmail = logSettings.some(
  (s) => typeof s.default === "string" && s.default.includes("support@coastairbrush.eu")
);
const hasPhone = logSettings.some(
  (s) => typeof s.default === "string" && s.default.includes("+44 (0) 1268 765 432")
);

assert(hasUkHub, "Logistics: UK Hub address/contact missing");
assert(hasNlHub, "Logistics: Netherlands Hub details missing");
assert(hasEmail, "Logistics: Support email 'support@coastairbrush.eu' missing");
assert(hasPhone, "Logistics: Phone number '+44 (0) 1268 765 432' missing");
console.log("✔ Logistics & Warehouses settings verified (UK hub, NL hub, support email, phone)");

// 8. Check Social Links
const socialCat = schema.find((s) => s.name === "Social Links");
const socialSettings = socialCat.settings;
const hasInsta = socialSettings.some((s) => s.id && s.id.includes("instagram"));
const hasYoutube = socialSettings.some((s) => s.id && s.id.includes("youtube"));
const hasFacebook = socialSettings.some((s) => s.id && s.id.includes("facebook"));
const hasTwitter = socialSettings.some((s) => s.id && (s.id.includes("twitter") || s.id.includes("x")));

assert(hasInsta, "Social Links: Instagram setting missing");
assert(hasYoutube, "Social Links: YouTube setting missing");
assert(hasFacebook, "Social Links: Facebook setting missing");
assert(hasTwitter, "Social Links: Twitter/X setting missing");
console.log("✔ Social Links settings verified (Instagram, YouTube, Facebook, Twitter/X)");

console.log("\nALL OS 2.0 THEME SETTINGS SCHEMA TESTS PASSED!");
