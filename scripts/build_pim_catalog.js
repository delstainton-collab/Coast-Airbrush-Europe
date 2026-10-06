import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.dirname(__dirname);

// CSV parser supporting quoted newlines and commas
function parseCsv(csvText) {
  const rows = [];
  let currentRow = [];
  let currentField = "";
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentField);
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      currentRow.push(currentField);
      if (currentRow.some(f => f.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some(f => f.trim().length > 0)) {
      rows.push(currentRow);
    }
  }
  return rows;
}

function determineCategory(handle, type, vendor) {
  const h = handle.toLowerCase();
  const t = type.toLowerCase();

  if (h.includes("kroma") || h.includes("prime-black-base") || h.includes("thinner") || h.includes("surface-binder") || t.includes("basecoat") || t.includes("clearcoat") || t.includes("paint") || t.includes("chrome system")) {
    return "paint_system";
  }
  if (t.includes("tape") || t.includes("masking") || h.includes("tape") || h.includes("masking")) {
    return "masking_products";
  }
  if (t.includes("gun") || t.includes("accessories") || h.includes("gun") || h.includes("nozzle") || h.includes("jar") || h.includes("kit")) {
    return "spray_hardware";
  }
  return "metal_flake";
}

function getSpecsForProduct(category, handle, title, bodyHtml) {
  const h = handle.toLowerCase();

  if (category === "paint_system") {
    if (h.includes("kroma-mirror")) {
      return {
        mix_ratio: "5:5:2:2 (Binder : Reducer : Hardener : Mirror Seeds)",
        pot_life: "3 Hours @ 20°C (Mix immediately prior to spray)",
        flash_off_time: "Continuous wet coat; align metallic layer (no flash coat needed)",
        cure_time: "36h room temp or 2h @ 60–70°C force cure",
        coverage: "Small Kit: 0.8 m² | Med: 2.4 m² | Large: 7.2 m² | XL: 14.5 m²",
        film_thickness: "15–30 µm (Target: 25 µm)",
        recommended_psi: "20–25 PSI (Airbrush 0.3–0.5mm, Mini gun 0.8–1.2mm)",
        recommended_nozzle: "Airbrush Ø 0.3–0.5mm / Mini Gun Ø 0.8–1.2mm",
        adr_hazmat_class: "UN1263 Class 3 Flammable Liquid (ADR Limited Quantity)",
        voc_compliance: "EU VOC Compliant / REACH 2026 Guaranteed",
        tds_document_url: "https://coastairbrush.eu/assets/docs/KROMA_EDGE_MIRROR_SYSTEM_TDS.pdf"
      };
    }
    if (h.includes("topcoat-clear")) {
      return {
        mix_ratio: "10:1 (Clear Base : Hardener) + 70–100% Dedicated Thinner",
        pot_life: "4 Hours @ 20°C",
        flash_off_time: "5 minutes tack coat before full wet coat",
        cure_time: "24h air dry or 45 mins @ 60°C",
        coverage: "180 SET: 1.5 m² | 900 SET: 6.0 m² | 3600 SET: 24.0 m²",
        film_thickness: "25–35 µm",
        recommended_psi: "22–26 PSI",
        recommended_nozzle: "0.8–1.2mm",
        adr_hazmat_class: "UN1263 Class 3 Flammable Liquid",
        voc_compliance: "EU VOC Compliant",
        tds_document_url: "https://coastairbrush.eu/assets/docs/KROMA_EDGE_MIRROR_SYSTEM_TDS.pdf"
      };
    }
    // Surface binders / basecoats
    return {
      mix_ratio: "Ready for use or thin with FK55 (up to 10% by volume)",
      pot_life: "Indefinite prior to contamination (Single-component aqueous)",
      flash_off_time: "10–15 mins @ 20°C until tack-ready for dry flake",
      cure_time: "Air dry 1–2 hours before clearcoat locking",
      coverage: "Approx. 8–10 m² per Litre",
      film_thickness: "15–20 µm per coat",
      recommended_psi: "15–25 PSI",
      recommended_nozzle: "1.0–1.4mm",
      adr_hazmat_class: "Non-Hazmat Aqueous Formulation (Zero ADR Restrictions)",
      voc_compliance: "Ultra-Low VOC / REACH Compliant",
      tds_document_url: "https://coastairbrush.eu/assets/docs/KROMA_EDGE_MIRROR_SYSTEM_TDS.pdf"
    };
  }

  if (category === "metal_flake") {
    let micron = "50µm (.002\") to 400µm (.015\")";
    if (bodyHtml.includes(".002")) micron = ".002″ (50µm) to .040″ (1000µm)";
    else if (bodyHtml.includes(".004")) micron = ".004″ (100µm) to .015″ (400µm)";
    else if (bodyHtml.includes(".008")) micron = ".008″ (200µm) to .015″ (400µm)";

    return {
      flake_material: "Automotive Grade Vacuum-Metallized PET Film with Thermoset Coating",
      micron_range: micron,
      max_temp_c: "177°C (350°F) Continuous Exposure",
      solvent_resistance: "Fully resistant to MEK, 2K Urethane, Alcohols & Waterborne binders",
      application_method: "Dry spray via Flake King 500/1000 into wet FK50 binder, or wet suspended",
      lightfastness: "18 Months direct Florida sun exposure with zero color fade",
      tds_document_url: "https://coastairbrush.eu/assets/docs/KROMA_EDGE_MIRROR_SYSTEM_TDS.pdf"
    };
  }

  if (category === "spray_hardware") {
    const isPro = h.includes("pro") || h.includes("550");
    const isGun1000 = h.includes("1000");
    return {
      feed_type: isGun1000 ? "Venturi Agitation Dry Application" : (isPro ? "Modular Dry Venturi System" : "Direct Airbrush Attachment"),
      operating_psi: "10–25 PSI (Clean, moisture-free compressed air)",
      body_material: "CNC Machined Aircraft Billet Aluminium (Red Anodized)",
      air_inlet_fitting: "1/4\" BSP standard airline coupler / 1/8\" BSP mini",
      warranty_period: "2-Year European Manufacturer Warranty"
    };
  }

  if (category === "masking_products") {
    const isWashi = h.includes("flat-line") || title.includes("Flat Line");
    const isCrepe = h.includes("crepe") || title.includes("Crepe");
    return {
      backing_material: isWashi ? "Japanese Washi Rice Paper (Ultra-Flat)" : (isCrepe ? "Impregnated Crepe Paper" : "Thermally Stabilized Precision PVC"),
      adhesive_type: "Clean-Release Solvent-Resistant Acrylic",
      temp_rating: isWashi ? "110°C (230°F)" : (isCrepe ? "80°C (176°F)" : "138°C (280°F) for 45 mins"),
      clean_removal: "Leaves zero adhesive residue on OEM clear, primer, or graphics"
    };
  }

  return {};
}

function run() {
  const csvPath = path.join(ROOT_DIR, "data", "shopify_products_with_hs_codes.csv");
  const rawCsv = fs.readFileSync(csvPath, "utf8");
  const rows = parseCsv(rawCsv);

  if (rows.length < 2) {
    console.error("CSV empty or invalid");
    process.exit(1);
  }

  const header = rows[0];
  const colIndex = {};
  header.forEach((h, i) => {
    colIndex[h.trim()] = i;
  });

  const productsByHandle = new Map();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const handle = row[colIndex["Handle"]]?.trim();
    if (!handle) continue;

    if (!productsByHandle.has(handle)) {
      const title = row[colIndex["Title"]] || "";
      const bodyHtml = row[colIndex["Body (HTML)"]] || "";
      const vendor = row[colIndex["Vendor"]] || "Coast Airbrush Europe";
      const productType = row[colIndex["Type"]] || "Custom Paint";
      const tags = (row[colIndex["Tags"]] || "").split(",").map(t => t.trim()).filter(Boolean);
      const category = determineCategory(handle, productType, vendor);

      const option1Name = row[colIndex["Option1 Name"]] || "Title";
      const option2Name = row[colIndex["Option2 Name"]] || "";
      const options = [option1Name];
      if (option2Name) options.push(option2Name);

      const imageSrc = row[colIndex["Image Src"]] || "";
      const images = imageSrc ? [imageSrc] : [];

      const specs = getSpecsForProduct(category, handle, title, bodyHtml);

      productsByHandle.set(handle, {
        id: handle,
        handle: handle,
        title: title,
        vendor: vendor,
        category: category,
        productType: productType,
        tags: tags,
        descriptionHtml: bodyHtml,
        options: options,
        images: images,
        specs: specs,
        variants: []
      });
    }

    const prod = productsByHandle.get(handle);

    // Add extra images if present
    const rowImg = row[colIndex["Image Src"]];
    if (rowImg && !prod.images.includes(rowImg)) {
      prod.images.push(rowImg);
    }

    const opt1Val = row[colIndex["Option1 Value"]] || "Default Title";
    const opt2Val = row[colIndex["Option2 Value"]] || "";
    const sku = row[colIndex["Variant SKU"]] || `${handle}-var-${prod.variants.length + 1}`;
    const price = parseFloat(row[colIndex["Variant Price"]] || "0");
    const grams = parseInt(row[colIndex["Variant Grams"]] || "500", 10);
    const hsCode = row[colIndex["Variant Harmonized System Code"]] || "3208.90.19";
    const coo = row[colIndex["Variant Country of Origin"]] || "GB";
    const barcode = row[colIndex["Variant Barcode"]] || "";
    const inventoryQty = parseInt(row[colIndex["Variant Inventory Qty"]] || "50", 10);

    const optionValues = { [prod.options[0]]: opt1Val };
    if (prod.options[1] && opt2Val) {
      optionValues[prod.options[1]] = opt2Val;
    }

    const priceGbp = price;
    const priceEur = Math.round(price * 1.1765 * 100) / 100;

    prod.variants.push({
      title: opt1Val + (opt2Val ? ` / ${opt2Val}` : ""),
      sku: sku,
      priceGbp: priceGbp,
      priceEur: priceEur,
      compareAtPriceGbp: null,
      barcode: barcode,
      hsCode: hsCode,
      countryOfOrigin: coo,
      weightGrams: grams,
      inventoryQty: inventoryQty,
      optionValues: optionValues
    });
  }

  const masterList = Array.from(productsByHandle.values());
  const outPath = path.join(ROOT_DIR, "data", "pim_master_catalog.json");
  fs.writeFileSync(outPath, JSON.stringify(masterList, null, 2), "utf8");

  console.log(`Successfully compiled Master PIM Catalog:`);
  console.log(`- Total Products: ${masterList.length}`);
  console.log(`- Total Variants: ${masterList.reduce((acc, p) => acc + p.variants.length, 0)}`);
  
  const categoryCounts = {};
  masterList.forEach(p => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });
  console.log("- Products by Category:", categoryCounts);
  console.log(`- Saved to: ${outPath}`);
}

run();
