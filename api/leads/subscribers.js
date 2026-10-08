import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export default async function handler(req, res) {
  // CORS Preflight
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const subscribersMap = new Map();

    // 1. Read from local JSON storage if available
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const subsFile = path.resolve(__dirname, "../../data/launch_subscribers.json");

      if (fs.existsSync(subsFile)) {
        const fileContent = fs.readFileSync(subsFile, "utf8");
        const localSubs = JSON.parse(fileContent);
        if (Array.isArray(localSubs)) {
          for (const s of localSubs) {
            if (s.email) {
              subscribersMap.set(s.email.toLowerCase(), s);
            }
          }
        }
      }
    } catch (fsErr) {
      console.warn("Local subscribers file read note:", fsErr.message);
    }

    // 2. Query Shopify Admin API if token configured
    const shopifyToken = process.env.SHOPIFY_ADMIN_TOKEN || "";
    const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || "coast-airbrush-europe.myshopify.com";

    if (shopifyToken) {
      try {
        const searchUrl = `https://${shopDomain}/admin/api/2024-01/customers/search.json?query=tag:pre-launch-vip`;
        const sRes = await fetch(searchUrl, {
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": shopifyToken
          }
        });

        if (sRes.ok) {
          const sData = await sRes.json();
          if (sData.customers && Array.isArray(sData.customers)) {
            for (const c of sData.customers) {
              const emailKey = (c.email || "").toLowerCase();
              if (emailKey) {
                subscribersMap.set(emailKey, {
                  id: "shopify_" + c.id,
                  firstName: c.first_name || "",
                  lastName: c.last_name || "",
                  email: c.email,
                  focus: c.note || "Custom Automotive & Motorcycle Painting",
                  submittedAt: c.created_at || new Date().toISOString(),
                  status: "confirmed_vip",
                  tags: c.tags ? c.tags.split(",").map(t => t.trim()) : ["pre-launch-vip"]
                });
              }
            }
          }
        }
      } catch (shopErr) {
        console.warn("Shopify subscribers fetch warning:", shopErr.message);
      }
    }

    const merged = Array.from(subscribersMap.values());
    return res.status(200).json({
      success: true,
      count: merged.length,
      subscribers: merged
    });
  } catch (err) {
    console.error("Failed to retrieve subscribers:", err);
    return res.status(500).json({ success: false, error: "Failed to retrieve subscribers." });
  }
}
