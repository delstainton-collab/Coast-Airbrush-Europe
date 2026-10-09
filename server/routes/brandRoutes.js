import { getBrandsMaster, getCatalogProducts, sendJson } from "../dataStore.js";

export async function handleBrandRoutes(req, res, safePath) {
  // BRANDS MASTER DIRECTORY & PROFILES
  if (req.method === "GET" && safePath === "/api/brands") {
    try {
      const brands = getBrandsMaster();
      const catalog = getCatalogProducts();

      const enrichedBrands = brands.map(b => {
        const brandKey = b.name.toLowerCase().split(" ")[0];
        const matchingProducts = catalog.filter(p => {
          const pb = (p.brand || "").toLowerCase();
          const pName = (p.name || "").toLowerCase();
          const pDesc = (p.description || "").toLowerCase();
          return pb.includes(brandKey) || pName.includes(brandKey) || pDesc.includes(brandKey) || (b.productIds || []).includes(p.id);
        });

        return {
          ...b,
          totalSkus: matchingProducts.length,
          flagshipSkus: matchingProducts.slice(0, 4).map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            priceGbp: p.priceGbp,
            priceEur: p.priceEur,
            badge: p.badge || null,
            image: p.image
          }))
        };
      });

      sendJson(res, 200, {
        success: true,
        count: enrichedBrands.length,
        brands: enrichedBrands
      });
      return true;
    } catch (e) {
      sendJson(res, 500, { success: false, error: "Failed to load brands directory: " + e.message });
      return true;
    }
  }

  // BRAND DOSSIER BY ID/SLUG
  if (req.method === "GET" && safePath.startsWith("/api/brands/")) {
    try {
      const brandId = safePath.replace("/api/brands/", "").trim().toLowerCase();
      const brands = getBrandsMaster();
      const brand = brands.find(b => 
        b.id.toLowerCase() === brandId || 
        b.slug.toLowerCase() === brandId ||
        b.name.toLowerCase().includes(brandId)
      );

      if (!brand) {
        sendJson(res, 404, { success: false, error: `Brand "${brandId}" not found in master directory.` });
        return true;
      }

      const catalog = getCatalogProducts();
      const brandKey = brand.name.toLowerCase().split(" ")[0];
      const associatedProducts = catalog.filter(p => {
        const pb = (p.brand || "").toLowerCase();
        const pName = (p.name || "").toLowerCase();
        const pDesc = (p.description || "").toLowerCase();
        return pb.includes(brandKey) || pName.includes(brandKey) || pDesc.includes(brandKey) || (brand.productIds || []).includes(p.id);
      });

      sendJson(res, 200, {
        success: true,
        brand,
        products: associatedProducts,
        totalProducts: associatedProducts.length
      });
      return true;
    } catch (e) {
      sendJson(res, 500, { success: false, error: "Failed to load brand dossier: " + e.message });
      return true;
    }
  }

  return false;
}
