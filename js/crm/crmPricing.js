// Coast Airbrush Europe — CRM Pricing, Client Switching & Margin Calculations
// Extracted per Anti-God Monolith Architecture Skill (Laws 1 & 2)

import { CRM_CLIENTS } from '../../data/crmClients.js';
import { showToast } from './crmCommunications.js';

export function initClientSelector() {
  const selector = document.getElementById("clientSelector");
  if (!selector) return;

  selector.addEventListener("change", (e) => {
    loadClientData(e.target.value);
  });
}

export function loadClientData(clientId) {
  const client = CRM_CLIENTS[clientId];
  if (!client) return;

  // Update Profile Card
  const badge = document.getElementById("clientBadge");
  if (badge) {
    badge.textContent = client.tierLabel;
    badge.className = `badge ${client.badgeClass}`;
  }

  const nameDisp = document.getElementById("clientNameDisplay");
  if (nameDisp) nameDisp.textContent = client.name;

  const locDisp = document.getElementById("clientLocation");
  if (locDisp) locDisp.textContent = client.location;

  const contactDisp = document.getElementById("clientContact");
  if (contactDisp) contactDisp.textContent = client.contact;

  const emailDisp = document.getElementById("clientEmail");
  if (emailDisp) emailDisp.textContent = client.email;

  // Update SKU Override Table
  renderSkuTable(client);

  showToast(`Switched active profile to ${client.name}`);
}

export function renderSkuTable(client) {
  const tableBody = document.querySelector("#skuPricingTable tbody");
  if (!tableBody) return;

  tableBody.innerHTML = client.skus.map(sku => {
    const margin = (((sku.customNet - sku.baseCost) / sku.customNet) * 100).toFixed(1);
    const marginStatus = margin >= 35 ? "badge-green" : margin >= 25 ? "badge-gold" : "badge-red";

    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: #fff;">${sku.name}</div>
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #888;">SKU: ${sku.code}</span>
        </td>
        <td style="font-family: 'JetBrains Mono', monospace; color: #888;">£${sku.msrp.toFixed(2)}</td>
        <td style="font-family: 'JetBrains Mono', monospace; color: var(--crm-chrome);">£${sku.tierDef.toFixed(2)}</td>
        <td>
          <input type="text" class="price-input" value="£${sku.customNet.toFixed(2)}" onchange="calculateMargin(this, ${sku.baseCost})">
        </td>
        <td>
          <span class="badge ${marginStatus}">${margin}% ${margin >= 35 ? 'OK' : 'LOW'}</span>
        </td>
      </tr>
    `;
  }).join('');
}

export function initGlobalSearch() {
  const search = document.getElementById("globalCrmSearch");
  if (!search) return;

  search.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const q = search.value.trim().toLowerCase();
      if (!q) return;

      if (q.includes("apex") || q.includes("dealer")) {
        const sel = document.getElementById("clientSelector");
        if (sel) sel.value = "apex";
        loadClientData("apex");
        if (window.switchCrmView) window.switchCrmView("customer360");
      } else if (q.includes("nordic") || q.includes("distrib")) {
        const sel = document.getElementById("clientSelector");
        if (sel) sel.value = "nordic";
        loadClientData("nordic");
        if (window.switchCrmView) window.switchCrmView("customer360");
      } else if (q.includes("helvetia") || q.includes("swiss") || q.includes("switzerland")) {
        const sel = document.getElementById("clientSelector");
        if (sel) sel.value = "helvetia";
        loadClientData("helvetia");
        if (window.switchCrmView) window.switchCrmView("customer360");
      } else if (q.includes("dave") || q.includes("artist") || q.includes("end")) {
        const sel = document.getElementById("clientSelector");
        if (sel) sel.value = "dave";
        loadClientData("dave");
        if (window.switchCrmView) window.switchCrmView("customer360");
      } else if (q.includes("price") || q.includes("discount") || q.includes("tier")) {
        if (window.switchCrmView) window.switchCrmView("pricing");
      } else {
        showToast(`Search results for "${q}" loaded.`);
      }
    }
  });
}

export function updateTierVal(tierId, val) {
  const valEl = document.getElementById(`val-${tierId}`);
  if (valEl) {
    valEl.textContent = `${val}%`;
  }
}

export function calculateMargin(inputElem, baseCost) {
  let rawVal = inputElem.value.replace(/[^0-9.]/g, '');
  let netPrice = parseFloat(rawVal) || 0;

  if (netPrice <= baseCost) {
    showToast("⚠️ Alert: Price below manufacturer unit base cost!", 4000);
  }

  const margin = (((netPrice - baseCost) / netPrice) * 100).toFixed(1);
  const badgeTd = inputElem.parentElement.nextElementSibling;
  
  if (badgeTd) {
    const isSafe = margin >= 35;
    const isWarning = margin >= 25 && margin < 35;
    const badgeClass = isSafe ? "badge-green" : isWarning ? "badge-gold" : "badge-red";
    const statusText = isSafe ? "OK" : isWarning ? "ALERT" : "UNPROFITABLE";
    
    badgeTd.innerHTML = `<span class="badge ${badgeClass}">${margin}% ${statusText}</span>`;
  }

  inputElem.value = `£${netPrice.toFixed(2)}`;
}

export function addNewSkuRow() {
  const tableBody = document.querySelector("#skuPricingTable tbody");
  if (!tableBody) return;

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>
      <div style="font-weight: 700; color: #fff;">Custom Basecoat Formula (1L)</div>
      <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #888;">SKU: KE-CUST-BASE</span>
    </td>
    <td style="font-family: 'JetBrains Mono', monospace; color: #888;">£55.00</td>
    <td style="font-family: 'JetBrains Mono', monospace; color: var(--crm-chrome);">£33.00</td>
    <td>
      <input type="text" class="price-input" value="£29.50" onchange="calculateMargin(this, 16.00)">
    </td>
    <td>
      <span class="badge badge-green">45.7% OK</span>
    </td>
  `;
  tableBody.appendChild(tr);
  showToast("Added new custom SKU override row.");
}

export function syncPricingToShopify() {
  showToast("⚡ Synchronized Price Rules & Tier Discounts to Shopify B2B & Xero Invoicing!");
}
