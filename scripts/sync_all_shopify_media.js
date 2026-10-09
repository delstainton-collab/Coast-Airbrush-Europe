#!/usr/bin/env node
/**
 * Coast Airbrush Europe - Comprehensive Shopify Media & Video Sync Engine
 * 
 * Synchronizes:
 *  1. All local high-res product images and remote images directly into Shopify products.
 *  2. Ingests all Flake King & Kroma Edge YouTube demonstration videos directly into
 *     Shopify Product Media (EXTERNAL_VIDEO) so they appear natively in the product gallery.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ECOM_CATALOG } from "../data/full_ecom_catalog.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.dirname(__dirname);

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || "coast-airbrush-eu-dev.myshopify.com";
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || "";
const API_VERSION = "2024-07";

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}

function resolveLocalPath(imgPath) {
  if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) return null;
  const filename = path.basename(imgPath);
  const candidates = [
    path.join(ROOT_DIR, imgPath),
    path.join(ROOT_DIR, "coast-shopify-media-files", filename),
    path.join(ROOT_DIR, "Images", filename),
    path.join(ROOT_DIR, "Images", "kromaedge", filename),
    path.join(ROOT_DIR, "Images", "Promo Images", filename),
    path.join(ROOT_DIR, "assets", "images", filename),
    path.join(ROOT_DIR, "assets", "images", "flakes", filename)
  ];
  return candidates.find(c => fs.existsSync(c)) || null;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function executeShopifyGraphQL(query, variables = {}) {
  const endpoint = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify GraphQL HTTP ${response.status}: ${errorText}`);
  }

  const json = await response.json();
  if (json.errors) {
    throw new Error(`Shopify GraphQL Errors: ${JSON.stringify(json.errors, null, 2)}`);
  }

  // Throttle check
  const throttle = json.extensions?.cost?.throttleStatus;
  if (throttle && throttle.currentlyAvailable < 2000) {
    console.log(`\n  ⏳ API rate limit cooling down (Available: ${throttle.currentlyAvailable})...`);
    await sleep(2500);
  } else {
    await sleep(150);
  }

  return json.data;
}

// Stage upload to Shopify
async function stageUpload(filename, mimeType, fileSize) {
  const mutation = `
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const input = [{
    filename,
    mimeType,
    httpMethod: "POST",
    resource: "PRODUCT_IMAGE",
    fileSize: String(fileSize)
  }];

  const data = await executeShopifyGraphQL(mutation, { input });
  const errors = data.stagedUploadsCreate?.userErrors || [];
  if (errors.length > 0) {
    throw new Error(`Staged upload failed for ${filename}: ${errors[0].message}`);
  }

  return data.stagedUploadsCreate.stagedTargets[0];
}

async function uploadToStage(stagedTarget, filePath) {
  const formData = new FormData();
  for (const param of stagedTarget.parameters) {
    formData.append(param.name, param.value);
  }

  const fileBlob = new Blob([fs.readFileSync(filePath)]);
  formData.append("file", fileBlob, path.basename(filePath));

  const response = await fetch(stagedTarget.url, {
    method: "POST",
    body: formData
  });

  if (!response.ok && response.status !== 201 && response.status !== 204) {
    const errText = await response.text();
    throw new Error(`Stage upload HTTP ${response.status}: ${errText}`);
  }
}

// Fetch all products from Shopify
async function fetchAllShopifyProducts() {
  console.log("Fetching live products from Shopify...");
  const products = [];
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const query = `
      query getProducts($cursor: String) {
        products(first: 50, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            handle
            title
            variants(first: 50) {
              nodes {
                id
                sku
              }
            }
            media(first: 50) {
              nodes {
                id
                mediaContentType
                ... on ExternalVideo {
                  originUrl
                  embedUrl
                }
                ... on MediaImage {
                  image {
                    url
                  }
                }
              }
            }
          }
        }
      }
    `;

    const data = await executeShopifyGraphQL(query, { cursor });
    const productNodes = data.products?.nodes || [];
    products.push(...productNodes);

    hasNextPage = data.products?.pageInfo?.hasNextPage;
    cursor = data.products?.pageInfo?.endCursor;
  }

  console.log(`✓ Fetched ${products.length} existing products from Shopify.`);
  return products;
}

// Attach Media (Images & YouTube Videos) to a Product
async function attachMediaToProduct(productId, mediaItems) {
  const mutation = `
    mutation productCreateMedia($media: [CreateMediaInput!]!, $productId: ID!) {
      productCreateMedia(media: $media, productId: $productId) {
        media {
          id
          status
          mediaContentType
        }
        mediaUserErrors {
          field
          message
        }
      }
    }
  `;

  const data = await executeShopifyGraphQL(mutation, {
    productId,
    media: mediaItems
  });

  const errors = data.productCreateMedia?.mediaUserErrors || [];
  if (errors.length > 0) {
    throw new Error(`Media attachment errors: ${errors.map(e => e.message).join(", ")}`);
  }

  return data.productCreateMedia?.media || [];
}

async function main() {
  console.log("=======================================================================");
  console.log("  Coast Airbrush Europe - Live Shopify Media & Video Sync Engine");
  console.log("=======================================================================");
  console.log(`Store: ${SHOPIFY_STORE_DOMAIN}`);
  console.log("-----------------------------------------------------------------------\n");

  const shopifyProducts = await fetchAllShopifyProducts();

  // Create lookup maps for matching
  const byHandle = new Map();
  const bySku = new Map();
  const byTitle = new Map();

  for (const sp of shopifyProducts) {
    if (sp.handle) byHandle.set(sp.handle.toLowerCase(), sp);
    if (sp.title) byTitle.set(sp.title.toLowerCase().trim(), sp);
    for (const v of sp.variants.nodes) {
      if (v.sku) bySku.set(v.sku.toLowerCase().trim(), sp);
    }
  }

  // Cache of uploaded local files: filename -> resourceUrl
  const uploadedFilesCache = new Map();

  let totalImagesAttached = 0;
  let totalVideosAttached = 0;
  let productsUpdated = 0;

  console.log("\nSynchronizing Media & YouTube Videos per Product...");

  for (let i = 0; i < ECOM_CATALOG.length; i++) {
    const catalogItem = ECOM_CATALOG[i];
    const progress = `[${i + 1}/${ECOM_CATALOG.length}]`;

    // Find matching Shopify product
    let targetShopifyProd = null;
    if (catalogItem.handle) targetShopifyProd = byHandle.get(catalogItem.handle.toLowerCase());
    if (!targetShopifyProd && catalogItem.id) targetShopifyProd = byHandle.get(catalogItem.id.toLowerCase());
    if (!targetShopifyProd && catalogItem.sku) targetShopifyProd = bySku.get(catalogItem.sku.toLowerCase().trim());
    if (!targetShopifyProd && catalogItem.name) targetShopifyProd = byTitle.get(catalogItem.name.toLowerCase().trim());

    if (!targetShopifyProd) {
      console.log(`${progress} ⚠️ Product not found in Shopify: "${catalogItem.name}" (${catalogItem.sku || catalogItem.id})`);
      continue;
    }

    const existingMedia = targetShopifyProd.media?.nodes || [];
    const existingVideoUrls = new Set(
      existingMedia
        .filter(m => m.mediaContentType === "EXTERNAL_VIDEO")
        .map(m => m.originUrl?.toLowerCase())
    );
    const existingImageCount = existingMedia.filter(m => m.mediaContentType === "IMAGE").length;

    const mediaToAttach = [];

    // 1. Process YouTube Videos
    if (catalogItem.videos && catalogItem.videos.length > 0) {
      for (const vid of catalogItem.videos) {
        const normUrl = vid.url.toLowerCase();
        // Check if video already exists on product
        const alreadyExists = Array.from(existingVideoUrls).some(existing => 
          existing.includes(vid.embedId.toLowerCase()) || normUrl.includes(existing) || existing.includes(normUrl)
        );

        if (!alreadyExists) {
          mediaToAttach.push({
            mediaContentType: "EXTERNAL_VIDEO",
            originalSource: vid.url,
            alt: `${vid.title} - ${vid.creator || "Demonstration"}`
          });
        }
      }
    }

    // 2. Process Product Images (if product currently has fewer images than catalog)
    const catalogImages = catalogItem.images && catalogItem.images.length > 0 
      ? catalogItem.images 
      : (catalogItem.image ? [catalogItem.image] : []);

    if (existingImageCount < catalogImages.length) {
      for (const imgRef of catalogImages) {
        if (imgRef.startsWith("http://") || imgRef.startsWith("https://")) {
          // Remote image URL
          mediaToAttach.push({
            mediaContentType: "IMAGE",
            originalSource: imgRef,
            alt: `${catalogItem.name} - View`
          });
        } else {
          // Local image file
          const resolvedPath = resolveLocalPath(imgRef);
          if (resolvedPath) {
            const filename = path.basename(resolvedPath);
            let resourceUrl = uploadedFilesCache.get(filename);

            if (!resourceUrl) {
              const stat = fs.statSync(resolvedPath);
              const mimeType = getMimeType(resolvedPath);
              try {
                const target = await stageUpload(filename, mimeType, stat.size);
                await uploadToStage(target, resolvedPath);
                resourceUrl = target.resourceUrl;
                uploadedFilesCache.set(filename, resourceUrl);
              } catch (uploadErr) {
                console.warn(`    ⚠️ Upload failed for ${filename}: ${uploadErr.message}`);
              }
            }

            if (resourceUrl) {
              mediaToAttach.push({
                mediaContentType: "IMAGE",
                originalSource: resourceUrl,
                alt: `${catalogItem.name} - View`
              });
            }
          }
        }
      }
    }

    // Attach all new media in batches (max 10 per call)
    if (mediaToAttach.length > 0) {
      try {
        const imagesCount = mediaToAttach.filter(m => m.mediaContentType === "IMAGE").length;
        const videosCount = mediaToAttach.filter(m => m.mediaContentType === "EXTERNAL_VIDEO").length;

        process.stdout.write(`${progress} Attaching ${mediaToAttach.length} media to "${catalogItem.name}" (${imagesCount} images, ${videosCount} videos)... `);

        // Attach in chunks of 8 to stay well within Shopify limits
        for (let c = 0; c < mediaToAttach.length; c += 8) {
          const chunk = mediaToAttach.slice(c, c + 8);
          await attachMediaToProduct(targetShopifyProd.id, chunk);
        }

        console.log("✓ Done");
        totalImagesAttached += imagesCount;
        totalVideosAttached += videosCount;
        productsUpdated++;
      } catch (attachErr) {
        console.log(`❌ Failed: ${attachErr.message}`);
      }
    } else {
      console.log(`${progress} ✓ Up to date: "${catalogItem.name}" (${existingImageCount} images, ${existingVideoUrls.size} videos)`);
    }
  }

  console.log("\n=======================================================================");
  console.log("  Sync Summary:");
  console.log(`  ✓ Products Updated:       ${productsUpdated}`);
  console.log(`  ✓ Images Attached:        ${totalImagesAttached}`);
  console.log(`  ✓ YouTube Videos Injected: ${totalVideosAttached}`);
  console.log("=======================================================================");
}

main().catch(err => {
  console.error("\n❌ Fatal Error:", err);
  process.exit(1);
});
