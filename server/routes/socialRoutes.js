import { parseJsonBody, sendJson } from "../dataStore.js";

export async function handleSocialRoutes(req, res, safePath) {
  if (req.method === "POST" && safePath === "/api/social/dm") {
    try {
      const { message } = await parseJsonBody(req);
      const text = (message || "").toLowerCase();

      let matched = {
        keyword: "CHROME",
        sku: "KE-CHROME-1L",
        name: "Kroma Edge Mirror Spray Chrome 2K System (1 Litre)",
        priceUSD: 145.00,
        priceEUR: 135.00,
        priceGBP: 115.00,
        dispatchHub: "Netherlands 3PL & UK Hub (24h Dispatch)",
        videoUrl: "/assets/videos/kroma-edge-mirror-chrome.mp4"
      };

      if (text.includes("gun") || text.includes("flake") || text.includes("dry") || text.includes("1000")) {
        matched = {
          keyword: "GUN",
          sku: "FK-1000-GUN",
          name: "Flake King 1000 Professional Dry Flake Gun",
          priceUSD: 219.00,
          priceEUR: 205.00,
          priceGBP: 175.00,
          dispatchHub: "UK & Netherlands Hub (In Stock)",
          videoUrl: "/assets/videos/flake-king-dry-gun-demo.mp4"
        };
      } else if (text.includes("tape") || text.includes("peel") || text.includes("masking") || text.includes("line")) {
        matched = {
          keyword: "TAPE",
          sku: "FK-TAPE-SET",
          name: "Flake King Prime Green & Orange Fine Line Mixed Pack",
          priceUSD: 28.50,
          priceEUR: 26.50,
          priceGBP: 22.50,
          dispatchHub: "UK & Netherlands Hub (In Stock)",
          videoUrl: "/assets/videos/fine-line-tape-peel.mp4"
        };
      } else if (text.includes("mix") || text.includes("candy") || text.includes("ratio") || text.includes("reducer")) {
        matched = {
          keyword: "MIX",
          sku: "KE-CANDY-RED-QT",
          name: "Kroma Edge Kandy Apple Red + High-Gloss Reducer Pack",
          priceUSD: 85.00,
          priceEUR: 79.00,
          priceGBP: 68.00,
          dispatchHub: "ADR LQ Hazmat Ground Freight Certified",
          videoUrl: "/assets/videos/candy-mixing-tips.mp4"
        };
      } else if (text.includes("iwata") || text.includes("needle") || text.includes("bubble") || text.includes("packing")) {
        matched = {
          keyword: "IWATA",
          sku: "IW-ECL-HPCS",
          name: "Anest Iwata Eclipse HP-CS + OEM PTFE Packing Kit",
          priceUSD: 179.00,
          priceEUR: 169.00,
          priceGBP: 145.00,
          dispatchHub: "Official European Iwata Distributor",
          videoUrl: "/assets/videos/iwata-bubbling-needle-packing.mp4"
        };
      } else if (text.includes("clean armor") || text.includes("clean armour") || text.includes("uv-900") || text.includes("uv clear") || text.includes("uv cure")) {
        matched = {
          keyword: "CLEAN_ARMOR",
          sku: "CA-UV900-CLEAR-1L",
          name: "Clean Armor UV 900 High-Gloss Clearcoat (100% Solids, Zero VOC, 120s UV Cure)",
          priceUSD: 199.00,
          priceEUR: 185.00,
          priceGBP: 158.00,
          dispatchHub: "Netherlands & UK Hubs (ADR Hazmat Exempt — 100% Solids)",
          videoUrl: "/assets/videos/clean-armor-120s-uv-cure.mp4"
        };
      } else if (text.includes("lumilor") || text.includes("light up") || text.includes("electric paint") || text.includes("electroluminescent")) {
        matched = {
          keyword: "LUMILOR",
          sku: "LL-STARTER-KIT-4OZ",
          name: "LumiLor Patented Electric Light Up Paint Starter Kit (Backplane, Dielectric, Luminescent, Conductive + Inverter)",
          priceUSD: 595.00,
          priceEUR: 545.00,
          priceGBP: 465.00,
          dispatchHub: "Official Master European Distributor (Direct Dispatch)",
          videoUrl: "/assets/videos/lumilor-field-emission-demo.mp4"
        };
      } else if (text.includes("ace of shades") || text.includes("super shine") || text.includes("solvent candy") || text.includes("shade")) {
        matched = {
          keyword: "ACE_OF_SHADES",
          sku: "AOS-SS79-CLEAR",
          name: "Ace of Shades Super Shine '79 High-Solids Solvent Clearcoat (By Custom – For Custom)",
          priceUSD: 125.00,
          priceEUR: 115.00,
          priceGBP: 98.00,
          dispatchHub: "UK Central Distribution Center (ADR LQ Hazmat Certified)",
          videoUrl: "/assets/videos/ace-of-shades-depth-demo.mp4"
        };
      } else if (text.includes("hyper fx") || text.includes("createx") || text.includes("waterbased") || text.includes("water-based") || text.includes("candy2o")) {
        matched = {
          keyword: "HYPER_FX",
          sku: "HFX-PRIMARY-SET-4OZ",
          name: "Hyper FX Premier Custom Waterbased Paint Master Set (Coast Airbrush Formulation Powered by Createx)",
          priceUSD: 158.00,
          priceEUR: 145.00,
          priceGBP: 125.00,
          dispatchHub: "UK & Netherlands Hub (REACH 2026 Guaranteed)",
          videoUrl: "/assets/videos/hyper-fx-waterbased-flow.mp4"
        };
      } else if (text.includes("vsionair") || text.includes("tri-stand") || text.includes("workstation") || text.includes("turntable") || text.includes("rig")) {
        matched = {
          keyword: "VSIONAIR",
          sku: "VA-TRISTAND-PRO",
          name: "VsionAir Modular All-Angle Tri-Stand Workstation System (360° Rotating Quick-Release Rigs)",
          priceUSD: 410.00,
          priceEUR: 375.00,
          priceGBP: 320.00,
          dispatchHub: "UK & Netherlands Hub (Factory Direct Stock)",
          videoUrl: "/assets/videos/vsionair-modular-workstation.mp4"
        };
      } else if (text.includes("tds") || text.includes("sheet") || text.includes("guide") || text.includes("data")) {
        sendJson(res, 200, {
          success: true,
          type: "download",
          replyMessage: "Here is your direct access to the official Flake King & Kroma Edge Technical Data Sheet (TDS) and Mixing Guide: https://coastairbrush.eu/assets/docs/KROMA_EDGE_MIRROR_SYSTEM_TDS.pdf",
          downloadUrl: "/assets/docs/KROMA_EDGE_MIRROR_SYSTEM_TDS.pdf"
        });
        return true;
      }

      const permalink = `https://coastairbrush.eu/cart/add?id=${matched.sku}&quantity=1&ref=agent_c_social`;

      sendJson(res, 200, {
        success: true,
        keyword: matched.keyword,
        productName: matched.name,
        featuredSku: matched.sku,
        directCheckoutLink: permalink,
        pricing: {
          usd: matched.priceUSD,
          eur: matched.priceEUR,
          gbp: matched.priceGBP
        },
        dispatch: matched.dispatchHub,
        videoUrl: matched.videoUrl,
        replyMessage: `Hey there! 🎨 That finish was created using the **${matched.name}**.\n\n` +
                      `📦 **European Stock**: In stock at our Netherlands & UK hubs for immediate dispatch across 27 EU states & UK (0% US import duty).\n` +
                      `💳 **1-Click Checkout**: [Tap here to buy directly](${permalink})\n\n` +
                      `Need nozzle sizing or compressor PSI setup? Reply here anytime!`
      });
      return true;
    } catch (e) {
      sendJson(res, 400, { success: false, error: "Invalid webhook payload" });
      return true;
    }
  }

  return false;
}
