import fs from "fs";
import path from "path";
import { config } from "../core/config.js";

/**
 * Generate a standard European Bill of Lading (CMR / BOL) document & Pallet Label
 */
export function generateBolDocument(shipmentData) {
  const {
    proNumber,
    orderNumber,
    carrierName,
    bookingId,
    pickupDate,
    origin,
    destination,
    density,
    isHazardous,
    hazmatMatches = [],
    appliedAccessorials = [],
    driverNotes
  } = shipmentData;

  const docDir = config.bolStorageDir;
  if (!fs.existsSync(docDir)) {
    fs.mkdirSync(docDir, { recursive: true });
  }

  const generatedDate = new Date().toISOString().replace("T", " ").substring(0, 19);

  // SVG Barcode representation
  const barcodeSvg = `
    <svg width="280" height="50" xmlns="http://www.w3.org/2000/svg" style="background:#fff;">
      <rect x="0" y="0" width="280" height="50" fill="#ffffff"/>
      <g fill="#000000">
        ${Array.from({ length: 35 })
          .map((_, i) => {
            const x = 10 + i * 7.5;
            const w = (i % 3 === 0 ? 4 : i % 2 === 0 ? 2.5 : 1.5);
            return `<rect x="${x}" y="5" width="${w}" height="32"/>`;
          })
          .join("")}
      </g>
      <text x="140" y="46" font-family="monospace" font-size="11" text-anchor="middle" font-weight="bold">${proNumber}</text>
    </svg>
  `;

  const hazmatNotice = isHazardous
    ? `
    <div style="margin-top:12px; padding:10px 14px; background:#fff2f0; border:2px solid #ff4d4f; border-radius:4px;">
      <strong style="color:#cf1322; font-size:13px;">⚠️ DANGEROUS GOODS DECLARATION (ADR CLASS 3 - UN 1263)</strong>
      <p style="margin:4px 0 0 0; font-size:11px; color:#434343;">
        Contains Flammable Liquid (Paint / Reducer / Solvents). Certified for Carriage under ADR Limited Quantity (LQ) Ground Exemption or ADR 1.1.3.6 transport categories.
        Items: ${hazmatMatches.map(m => `${m.name} (Qty: ${m.qty})`).join(", ") || "Custom solvent paint system"}
      </p>
    </div>
    `
    : "";

  const accessorialBadges = appliedAccessorials
    .map(
      a =>
        `<span style="display:inline-block; margin-right:6px; margin-bottom:4px; padding:3px 8px; background:#e6f7ff; border:1px solid #91d5ff; color:#0050b3; font-size:11px; font-weight:600; border-radius:3px;">${a}</span>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Bill of Lading / CMR - ${proNumber}</title>
  <style>
    @media print {
      body { margin: 0; padding: 10mm; font-size: 11pt; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1f2937; margin: 20px auto; max-width: 820px; line-height: 1.35; }
    .box { border: 1px solid #d1d5db; padding: 12px; border-radius: 4px; margin-bottom: 12px; }
    .header-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 14px; }
    .col-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .col-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #d1d5db; padding: 6px 8px; font-size: 11px; text-align: left; }
    th { background: #f3f4f6; font-weight: 600; }
    .print-btn { background: #111827; color: #fff; padding: 10px 20px; font-weight: bold; border: none; border-radius: 6px; cursor: pointer; margin-bottom: 15px; }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:right;">
    <button class="print-btn" onclick="window.print()">🖨️ Print Freight BOL & Labels</button>
  </div>

  <div class="header-row">
    <div>
      <h1 style="margin:0; font-size:22px; text-transform:uppercase; letter-spacing:1px; color:#111827;">INTERNATIONAL FREIGHT BILL OF LADING</h1>
      <div style="font-size:12px; color:#6b7280;">Uniform European LTL / CMR Consignment Note</div>
      <div style="font-size:12px; font-weight:600; margin-top:4px;">ORDER REF: ${orderNumber || "DIRECT-DISPATCH"}</div>
    </div>
    <div style="text-align:right;">
      ${barcodeSvg}
      <div style="font-size:11px; color:#4b5563; margin-top:4px;">Date: ${generatedDate}</div>
    </div>
  </div>

  <div class="col-2">
    <!-- Shipper / Consignor -->
    <div class="box">
      <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:#4b5563; margin-bottom:4px;">1. SHIPPER (CONSIGNOR)</div>
      <strong style="font-size:14px;">${origin?.company || "Coast Airbrush Europe BV"}</strong><br/>
      ${origin?.name || "Logistics Hub Netherlands"}<br/>
      ${origin?.address1 || "Maasvlakte Haven 42"}<br/>
      ${origin?.postalCode || "3011 AA"} ${origin?.city || "Rotterdam"}, ${origin?.country || "NL"}<br/>
      <small>Phone: ${origin?.phone || "+31 10 555 0199"}</small>
    </div>

    <!-- Consignee -->
    <div class="box">
      <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:#4b5563; margin-bottom:4px;">2. CONSIGNEE (DELIVERY TO)</div>
      <strong style="font-size:14px;">${destination?.company || destination?.name || "Customer Direct"}</strong><br/>
      Attn: ${destination?.name || "Receiving Department"}<br/>
      ${destination?.address1 || ""}<br/>
      ${destination?.postalCode || destination?.postal_code || ""} ${destination?.city || ""}, ${destination?.country || ""}<br/>
      <small>Phone: ${destination?.phone || "On file"}</small>
    </div>
  </div>

  <div class="box">
    <div class="col-4">
      <div><strong>Carrier:</strong><br/>${carrierName || "Coast Freight Network"}</div>
      <div><strong>PRO Number:</strong><br/><span style="font-family:monospace; font-weight:bold;">${proNumber}</span></div>
      <div><strong>Booking Ref:</strong><br/>${bookingId || "N/A"}</div>
      <div><strong>Pickup Scheduled:</strong><br/>${pickupDate || "Immediate"}</div>
    </div>
  </div>

  <div class="box">
    <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:#4b5563;">3. CARGO SPECIFICATIONS & PALLET METRICS</div>
    <table>
      <thead>
        <tr>
          <th>Handling Units</th>
          <th>Packaging Type</th>
          <th>Net Weight</th>
          <th>Tare Weight</th>
          <th>Gross Chargeable</th>
          <th>Volume</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>${density?.palletCount || 1} Pallet(s)</strong></td>
          <td>${density?.palletSpecName || "EUR-EPAL 1 (120x80cm)"}</td>
          <td>${density?.totalNetWeightKg || "N/A"} kg</td>
          <td>${density?.totalTareWeightKg || 25} kg</td>
          <td><strong>${density?.chargeableWeightKg || density?.totalGrossWeightKg || "N/A"} kg</strong></td>
          <td>${density?.volumeM3 || "N/A"} m³</td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top:10px;">
      <strong>Accessorial Services:</strong> ${accessorialBadges || "Standard Freight"}
    </div>

    ${hazmatNotice}

    <div style="margin-top:10px; font-size:12px; background:#f9fafb; padding:8px; border-radius:4px;">
      <strong>Driver Delivery Instructions:</strong><br/>
      ${driverNotes || "Palletized freight. Ensure tail-lift deployment if no dock available at consignee."}
    </div>
  </div>

  <!-- Signatures -->
  <div class="col-4 box" style="margin-top:16px;">
    <div>
      <div style="font-size:10px; font-weight:bold; color:#4b5563;">CONSIGNOR SIGNATURE</div>
      <div style="height:35px; border-bottom:1px dashed #9ca3af; margin-top:20px;"></div>
      <div style="font-size:10px; margin-top:4px;">Coast Airbrush Hub Agent</div>
    </div>
    <div>
      <div style="font-size:10px; font-weight:bold; color:#4b5563;">CARRIER DRIVER SCAN</div>
      <div style="height:35px; border-bottom:1px dashed #9ca3af; margin-top:20px;"></div>
      <div style="font-size:10px; margin-top:4px;">Driver Name & Date</div>
    </div>
    <div>
      <div style="font-size:10px; font-weight:bold; color:#4b5563;">CONSIGNEE RECEIVED</div>
      <div style="height:35px; border-bottom:1px dashed #9ca3af; margin-top:20px;"></div>
      <div style="font-size:10px; margin-top:4px;">Signature & Stamp</div>
    </div>
    <div style="text-align:center;">
      <div style="font-size:10px; font-weight:bold; color:#4b5563;">SECURITY STAMP</div>
      <div style="height:48px; border:2px solid #9ca3af; border-radius:4px; margin-top:8px; display:flex; align-items:center; justify-content:center; color:#6b7280; font-size:9px; font-weight:bold;">
        EURO-CARRIER PASS
      </div>
    </div>
  </div>
</body>
</html>`;

  const fileName = `BOL-${proNumber}.html`;
  const filePath = path.join(docDir, fileName);
  fs.writeFileSync(filePath, html, "utf8");

  return {
    fileName,
    filePath,
    url: `/api/freight/bol/${proNumber}`
  };
}
