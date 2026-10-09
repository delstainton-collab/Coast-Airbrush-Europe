// Coast Airbrush Europe — APC Overnight Hazchem Logistics & A4 Inkjet Printing
// Extracted per Anti-God Monolith Architecture Skill (Laws 1 & 2)

import { APCOvernightEngine } from '../apcOvernightEngine.js';
import { showToast } from './crmCommunications.js';

export const apcEngine = new APCOvernightEngine();

export function initApcSeedData() {
  if (apcEngine.consignments.length === 0) {
    // Seed standard UK trade orders for demo & instant testing
    apcEngine.createConsignment({
      orderNumber: "CA-8891",
      customerName: "Sarah Jensen",
      company: "Apex Custom Paintworks",
      addressLine1: "Unit 4, Silverstone Business Park",
      city: "Towcester",
      postcode: "NN12 8TN",
      phone: "+44 7911 123456",
      email: "sarah.j@apexpaint.co.uk",
      subtotalGbp: 185.00,
      totalGbp: 185.00,
      serviceCode: "ND16",
      items: [
        { sku: "KE-CLR-2K-5L", title: "Kroma Edge 2K Diamond Clear (5L Set)", quantity: 1, priceEur: 145.00 },
        { sku: "KE-RED-SLW-5L", title: "Kroma Edge Slow Speed Reducer (1L)", quantity: 1, priceEur: 35.00 }
      ]
    });

    apcEngine.createConsignment({
      orderNumber: "CA-8892",
      customerName: "Dave Miller",
      company: "Dave's Kustom Airbrush Studio",
      addressLine1: "Unit 8, St Andrews Road",
      city: "Bristol",
      postcode: "BS11 9HS",
      phone: "+44 7700 900123",
      email: "dave@kustomair.co.uk",
      subtotalGbp: 98.00,
      totalGbp: 106.50,
      serviceCode: "ND16",
      items: [
        { sku: "FOM1000", title: "Flake King 1000 Dry Flake Gun", quantity: 1, priceEur: 92.00 },
        { sku: "FK-FLAKE-GLD", title: "Medusa Gold Micro Flake (100g Jar)", quantity: 2, priceEur: 24.00 }
      ]
    });
  }
}

export function renderApcConsignmentsTable() {
  const tbody = document.getElementById("apcConsignmentsBody");
  const readyCountEl = document.getElementById("apc-ready-count");
  const totalWeightEl = document.getElementById("apc-total-weight");
  const lqCountEl = document.getElementById("apc-lq-count");

  if (!tbody) return;

  const consignments = apcEngine.consignments;
  let readyCount = 0;
  let totalWeight = 0;
  let lqCount = 0;

  if (consignments.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; color: #888; padding: 24px;">
          No APC consignments registered yet. Create a consignment above to test.
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = consignments.map(c => {
      const isUnmanifested = !c.manifestId;
      if (isUnmanifested) {
        readyCount++;
        totalWeight += c.weightKg;
        if (c.hazard.isHazardous) lqCount++;
      }

      const statusBadge = isUnmanifested 
        ? `<span class="badge badge-gold">PACKED / READY</span>`
        : `<span class="badge badge-green">MANIFESTED (${c.manifestId})</span>`;

      const hazBadge = c.hazard.isHazardous
        ? `<span class="badge badge-red" style="font-size:0.68rem;">⚠️ UN1263 LQ</span>`
        : `<span class="badge badge-chrome" style="font-size:0.68rem;">📦 STD PARCEL</span>`;

      return `
        <tr>
          <td>
            <div style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #fff;">${c.consignmentNumber}</div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; color: #888;">Bar: ${c.barcodeNumber}</div>
          </td>
          <td style="font-family: 'JetBrains Mono', monospace; color: var(--crm-chrome); font-weight: bold;">${c.orderNumber}</td>
          <td>
            <div style="font-weight: 600; color: #fff;">${c.customer.name}</div>
            <div style="font-size: 0.72rem; color: #888;">${c.customer.company || c.customer.city}</div>
          </td>
          <td style="font-family: 'JetBrains Mono', monospace; font-weight: bold; color: #fff;">${c.customer.postcode}</td>
          <td><span class="badge badge-chrome">${c.serviceCode}</span></td>
          <td style="font-family: 'JetBrains Mono', monospace; color: #fff;">${c.weightKg} kg</td>
          <td>${hazBadge}</td>
          <td>${statusBadge}</td>
          <td style="text-align: right;">
            <div style="display: flex; gap: 6px; justify-content: flex-end;">
              <button class="btn-red" style="padding: 4px 10px; font-size: 0.72rem;" onclick="printApcConsignmentA4('${c.id}')">
                <span class="material-symbols-outlined" style="font-size: 14px;">print</span>
                🖨️ Print A4 Inkjet
              </button>
              <a href="${c.trackingUrl}" target="_blank" class="btn-chrome" style="padding: 4px 8px; font-size: 0.72rem; text-decoration: none;">
                <span class="material-symbols-outlined" style="font-size: 14px;">radar</span>
              </a>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  if (readyCountEl) readyCountEl.textContent = readyCount;
  if (totalWeightEl) totalWeightEl.textContent = `${totalWeight.toFixed(1)} kg`;
  if (lqCountEl) lqCountEl.textContent = lqCount;
}

export function handleCreateApcConsignment(event) {
  if (event && event.preventDefault) event.preventDefault();
  const name = document.getElementById("apcCustName")?.value || "";
  const orderRef = document.getElementById("apcOrderRef")?.value || "";
  const address = document.getElementById("apcAddress")?.value || "";
  const postcode = document.getElementById("apcPostcode")?.value || "";
  const serviceCode = document.getElementById("apcServiceCode")?.value || "ND16";
  const weightKg = parseFloat(document.getElementById("apcWeight")?.value) || 2.0;
  const isHazardous = document.getElementById("apcHazmatFlag")?.value === "true";
  const itemDesc = document.getElementById("apcItemsDesc")?.value || "Custom Automotive Paint & Clearcoat";

  const consignment = apcEngine.createConsignment({
    orderNumber: orderRef,
    customerName: name,
    addressLine1: address,
    postcode: postcode,
    serviceCode: serviceCode,
    weightKg: weightKg,
    subtotalGbp: 120.00,
    totalGbp: 128.50,
    items: [
      {
        sku: isHazardous ? "KE-2K-CLR" : "FK-TOOL-1000",
        title: itemDesc,
        quantity: 1,
        priceEur: 110.00
      }
    ]
  });

  renderApcConsignmentsTable();
  showToast(`⚡ Created APC Consignment ${consignment.consignmentNumber}! Opening A4 print sheet...`);
  printApcConsignmentA4(consignment.id);
}

export function printApcConsignmentA4(consignmentId) {
  const c = apcEngine.consignments.find(item => item.id === consignmentId);
  if (!c) {
    showToast("⚠️ Consignment not found.", 4000);
    return;
  }

  const html = apcEngine.generateA4PrintableHTML(c);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    showToast("⚠️ Popup blocked. Please allow popups for Coast Airbrush CRM to print.", 5000);
  }
}

export function handleApcCloseManifest() {
  const result = apcEngine.closeDailyManifest();
  if (!result.success) {
    showToast(`⚠️ ${result.message}`, 4500);
    return;
  }

  renderApcConsignmentsTable();
  showToast(result.message, 5000);

  // Open Driver Manifest Printable Page
  const manifestHTML = apcEngine.generateManifestPrintableHTML(result.manifest);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(manifestHTML);
    printWindow.document.close();
  }
}
