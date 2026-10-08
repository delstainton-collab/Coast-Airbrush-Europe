#!/usr/bin/env node
/**
 * Coast Airbrush Europe - Automated Shopify Media Uploader
 * 
 * Batch-uploads all media assets (images, swatches, TDS PDFs) from 
 * `coast-shopify-media-files/` directly into Shopify Admin > Content > Files
 * via the Shopify GraphQL Staged Upload API.
 * 
 * Usage:
 *   # Preview what will be uploaded:
 *   node scripts/upload_media_to_shopify.js --dry-run
 * 
 *   # Live Upload:
 *   SHOPIFY_STORE_DOMAIN=your-store.myshopify.com SHOPIFY_ADMIN_TOKEN=shpat_xxxx node scripts/upload_media_to_shopify.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.dirname(__dirname);
const MEDIA_DIR = path.join(ROOT_DIR, "coast-shopify-media-files");

const ARGS = process.argv.slice(2);
const IS_DRY_RUN = ARGS.includes("--dry-run") || !process.env.SHOPIFY_ADMIN_TOKEN;

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || "";
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

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
    return "IMAGE";
  }
  return "FILE";
}

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
  return json.data;
}

async function stageUpload(file) {
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
    filename: file.filename,
    mimeType: file.mimeType,
    httpMethod: "POST",
    resource: file.contentType === "IMAGE" ? "IMAGE" : "FILE",
    fileSize: String(file.fileSize)
  }];

  const data = await executeShopifyGraphQL(mutation, { input });
  const errors = data.stagedUploadsCreate?.userErrors || [];
  if (errors.length > 0) {
    throw new Error(`Staged upload failed for ${file.filename}: ${errors[0].message}`);
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

async function registerFileInShopify(file, resourceUrl) {
  const mutation = `
    mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          id
          fileStatus
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const filesInput = [{
    originalSource: resourceUrl,
    contentType: file.contentType
  }];

  const data = await executeShopifyGraphQL(mutation, { files: filesInput });
  const errors = data.fileCreate?.userErrors || [];
  if (errors.length > 0) {
    throw new Error(`File registration failed for ${file.filename}: ${errors[0].message}`);
  }

  return data.fileCreate.files[0];
}

async function main() {
  console.log("==========================================================");
  console.log("Coast Airbrush Europe - Shopify Media Asset Uploader");
  console.log("==========================================================");

  if (!fs.existsSync(MEDIA_DIR)) {
    console.error(`❌ Media directory not found: ${MEDIA_DIR}`);
    process.exit(1);
  }

  const allEntries = fs.readdirSync(MEDIA_DIR)
    .filter(name => !name.startsWith(".") && !name.startsWith("._"));

  const files = allEntries.map(filename => {
    const filePath = path.join(MEDIA_DIR, filename);
    const stat = fs.statSync(filePath);
    return {
      filename,
      filePath,
      fileSize: stat.size,
      mimeType: getMimeType(filename),
      contentType: getContentType(filename)
    };
  }).filter(f => f.mimeType !== "application/octet-stream");

  console.log(`Found ${files.length} media assets ready for upload:`);
  const imageCount = files.filter(f => f.contentType === "IMAGE").length;
  const docCount = files.filter(f => f.contentType === "FILE").length;
  const totalMb = (files.reduce((acc, f) => acc + f.fileSize, 0) / (1024 * 1024)).toFixed(2);

  console.log(`  - Images (JPG/PNG/WEBP): ${imageCount}`);
  console.log(`  - Documents (PDF TDS/SDS): ${docCount}`);
  console.log(`  - Total Payload Size: ${totalMb} MB`);

  if (IS_DRY_RUN) {
    console.log("\n[DRY RUN MODE] No changes sent to Shopify.");
    console.log("To run live against your store, execute:");
    console.log("  SHOPIFY_STORE_DOMAIN=your-store.myshopify.com SHOPIFY_ADMIN_TOKEN=shpat_xxxx node scripts/upload_media_to_shopify.js\n");
    console.log("Sample files prepared for upload:");
    files.slice(0, 10).forEach(f => {
      console.log(`  ✓ ${f.filename.padEnd(45)} | ${f.contentType.padEnd(6)} | ${(f.fileSize / 1024).toFixed(1)} KB`);
    });
    console.log(`  ... and ${files.length - 10} more files.\n`);
    console.log("TIP: You can also upload these instantly without code by dragging the folder:");
    console.log(`  ${MEDIA_DIR}`);
    console.log("  into Shopify Admin > Content > Files in your browser.");
    return;
  }

  console.log(`\nConnecting to Shopify Admin: ${SHOPIFY_STORE_DOMAIN}...`);
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const progress = `[${i + 1}/${files.length}]`;
    try {
      process.stdout.write(`  ${progress} Uploading ${file.filename}... `);
      const stage = await stageUpload(file);
      await uploadToStage(stage, file.filePath);
      await registerFileInShopify(file, stage.resourceUrl);
      console.log("✓ Success");
      successCount++;
    } catch (err) {
      console.log(`❌ Failed: ${err.message}`);
      failureCount++;
    }
  }

  console.log("\n==========================================================");
  console.log(`Upload Complete: ${successCount} succeeded, ${failureCount} failed.`);
  console.log("==========================================================");
}

main().catch(err => {
  console.error("Fatal error during media sync:", err);
  process.exit(1);
});
