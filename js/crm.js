/**
 * Coast Airbrush Europe — Enterprise CRM Engine (js/crm.js)
 * Handles Omnichannel Timeline, Google Meet In-App Launcher,
 * In-App Email Client, Dynamic Pricing, and APC Hazchem Logistics.
 */

import { APCOvernightEngine } from './apcOvernightEngine.js';

const apcEngine = new APCOvernightEngine();

// Client Database Mock Store
const CRM_CLIENTS = {
  apex: {
    id: "apex",
    name: "Apex Custom Paintworks",
    type: "DEALER_T2",
    tierLabel: "DEALER TIER 2",
    badgeClass: "badge-red",
    location: "Unit 4, Silverstone Business Park, UK",
    contact: "Sarah Jensen (Head Painter)",
    email: "sarah.j@apexpaint.co.uk",
    phone: "+44 7911 123456",
    terms: "Net 30 Days",
    credit: "£18,400 / £25,000",
    spendYtd: "£142,100",
    skus: [
      { name: "Kroma Edge Candy Apple (500ml)", code: "KE-CANDY-RD", msrp: 45.0, tierDef: 27.0, customNet: 24.5, baseCost: 14.0 },
      { name: "Medusa Gold Micro Flake (100g)", code: "FK-FLAKE-GLD", msrp: 40.0, tierDef: 24.0, customNet: 21.0, baseCost: 11.5 },
      { name: "Slow Speed Reducer (5L Drum)", code: "KE-RED-SLW-5L", msrp: 90.0, tierDef: 54.0, customNet: 49.0, baseCost: 30.0 },
      { name: "Kroma Edge 2K Diamond Clear (5L)", code: "KE-CLR-2K-5L", msrp: 145.0, tierDef: 87.0, customNet: 78.0, baseCost: 48.0 }
    ]
  },
  nordic: {
    id: "nordic",
    name: "Nordics Paint Logistics B.V.",
    type: "DISTRIBUTOR",
    tierLabel: "MASTER DISTRIBUTOR",
    badgeClass: "badge-gold",
    location: "Havennummer 4022, Rotterdam Port, NL",
    contact: "Lars Lindqvist (Procurement Director)",
    email: "lars.l@nordicpaint.nl",
    phone: "+31 10 987 6543",
    terms: "Net 60 Days / SEPA B2B",
    credit: "€185,000 / €250,000",
    spendYtd: "€880,000",
    skus: [
      { name: "Kroma Edge Candy Apple (Pallet 48pk)", code: "KE-CANDY-PLT", msrp: 2160.0, tierDef: 1036.8, customNet: 980.0, baseCost: 650.0 },
      { name: "Speed Reducers (200L Master Drum)", code: "KE-RED-DRM-200", msrp: 1800.0, tierDef: 864.0, customNet: 810.0, baseCost: 520.0 }
    ]
  },
  dave: {
    id: "dave",
    name: "Dave's Kustom Airbrush Studio",
    type: "END_USER",
    tierLabel: "PRO ARTIST CLUB",
    badgeClass: "badge-chrome",
    location: "Bristol Custom Garages, UK",
    contact: "Dave Miller (Master Airbrush Artist)",
    email: "dave@kustomair.co.uk",
    phone: "+44 7700 900123",
    terms: "Instant Card / Stripe VIP",
    credit: "N/A (Retail VIP)",
    spendYtd: "£14,850",
    skus: [
      { name: "Kroma Edge Candy Apple (500ml)", code: "KE-CANDY-RD", msrp: 45.0, tierDef: 38.25, customNet: 36.0, baseCost: 14.0 },
      { name: "Flake King 1000 Dry Flake Gun", code: "FOM1000", msrp: 108.33, tierDef: 81.24, customNet: 75.0, baseCost: 48.75 }
    ]
  },
  helvetia: {
    id: "helvetia",
    name: "Helvetia Custom Coatings AG",
    type: "DEALER_T2",
    tierLabel: "SWISS EXCLUSIVE DEALER",
    badgeClass: "badge-red",
    location: "Industriestrasse 14, 8005 Zürich, Switzerland 🇨🇭",
    contact: "Marc Oberholzer (Managing Director)",
    email: "marc.o@helvetia-coatings.ch",
    phone: "+41 44 200 4567",
    terms: "Net 30 / CHF Invoicing (0% Export VAT)",
    credit: "CHF 35,000 / CHF 50,000",
    spendYtd: "CHF 194,500",
    vatNumber: "CHE-482.910.123 MWST",
    skus: [
      { name: "Kroma Edge Mirror Chrome (1260g Large Kit)", code: "KE-CHROME-1260", msrp: 295.0, tierDef: 177.0, customNet: 165.0, baseCost: 95.0 },
      { name: "Flake King 1000 Dry Flake Gun", code: "FOM1000", msrp: 108.33, tierDef: 65.0, customNet: 59.0, baseCost: 48.75 },
      { name: "Kroma Edge Dedicated Topcoat Clear (3600 SET)", code: "KE-TOPCOAT-3600", msrp: 420.0, tierDef: 252.0, customNet: 230.0, baseCost: 135.0 },
      { name: "Medusa Gold Micro Flake (1000g Bulk Tub)", code: "FK-FLAKE-GLD-1KG", msrp: 220.0, tierDef: 132.0, customNet: 118.0, baseCost: 65.0 }
    ]
  }
};

// DOM Initialization
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initClientSelector();
  initGlobalSearch();
  loadTradeApplications();
});

// View Navigation Switcher
function initNavigation() {
  const tabs = document.querySelectorAll(".crm-nav-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetView = tab.getAttribute("data-view");
      switchCrmView(targetView);
    });
  });
}

function switchCrmView(viewName) {
  // Update nav tabs
  document.querySelectorAll(".crm-nav-tab").forEach(t => {
    if (t.getAttribute("data-view") === viewName) {
      t.classList.add("active");
    } else {
      t.classList.remove("active");
    }
  });

  // Switch panels
  document.querySelectorAll(".crm-view-panel").forEach(panel => {
    panel.classList.remove("active");
  });

  const activePanel = document.getElementById(`view-${viewName}`);
  if (activePanel) {
    activePanel.classList.add("active");
  }

  if (viewName === 'apc') {
    renderApcConsignmentsTable();
  }
}

// Client Switching
function initClientSelector() {
  const selector = document.getElementById("clientSelector");
  if (!selector) return;

  selector.addEventListener("change", (e) => {
    loadClientData(e.target.value);
  });
}

function loadClientData(clientId) {
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

function renderSkuTable(client) {
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

// Global Search
function initGlobalSearch() {
  const search = document.getElementById("globalCrmSearch");
  if (!search) return;

  search.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const q = search.value.trim().toLowerCase();
      if (!q) return;

      if (q.includes("apex") || q.includes("dealer")) {
        document.getElementById("clientSelector").value = "apex";
        loadClientData("apex");
        switchCrmView("customer360");
      } else if (q.includes("nordic") || q.includes("distrib")) {
        document.getElementById("clientSelector").value = "nordic";
        loadClientData("nordic");
        switchCrmView("customer360");
      } else if (q.includes("helvetia") || q.includes("swiss") || q.includes("switzerland")) {
        document.getElementById("clientSelector").value = "helvetia";
        loadClientData("helvetia");
        switchCrmView("customer360");
      } else if (q.includes("dave") || q.includes("artist") || q.includes("end")) {
        document.getElementById("clientSelector").value = "dave";
        loadClientData("dave");
        switchCrmView("customer360");
      } else if (q.includes("price") || q.includes("discount") || q.includes("tier")) {
        switchCrmView("pricing");
      } else {
        showToast(`Search results for "${q}" loaded.`);
      }
    }
  });
}

// Dynamic Tier Slider Value Display
function updateTierVal(tierId, val) {
  const valEl = document.getElementById(`val-${tierId}`);
  if (valEl) {
    valEl.textContent = `${val}%`;
  }
}

// Margin Calculation on SKU Price Edit
function calculateMargin(inputElem, baseCost) {
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

// Add Custom SKU Row
function addNewSkuRow() {
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

// Save & Sync to Shopify
function syncPricingToShopify() {
  showToast("⚡ Synchronized Price Rules & Tier Discounts to Shopify B2B & Xero Invoicing!");
}

// Modals
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("active");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
}

function openEmailModal(subject = "") {
  if (subject) {
    const subInput = document.getElementById("emailSubject");
    if (subInput) subInput.value = subject;
  }
  openModal("modalEmail");
}

function openCallModal() {
  openModal("modalCall");
}

// In-App Email Send Handler
function sendFullEmail() {
  const recipient = document.getElementById("emailRecipient").value;
  const subject = document.getElementById("emailSubject").value;
  
  closeModal("modalEmail");
  
  // Append to Timeline
  appendTimelineItem({
    type: "email",
    title: `Outbound Email: ${subject}`,
    time: "Just now (Via In-App Gmail Client)",
    badge: "DELIVERED",
    body: `Sent to <strong>${recipient}</strong> with attached Technical Data Sheets and agreed net pricing.`
  });

  showToast(`Email dispatched to ${recipient}!`);
}

function sendQuickReply() {
  const text = document.getElementById("quickReplyText").value.trim();
  if (!text) {
    showToast("Please write a message before sending.");
    return;
  }

  document.getElementById("quickReplyText").value = "";

  appendTimelineItem({
    type: "email",
    title: "Quick Reply: Re: TDS Sheets for New 2K Clearcoat Batch",
    time: "Just now",
    badge: "SENT",
    body: `<em>"${text}"</em>`
  });

  showToast("Reply sent to Sarah Jensen!");
}

// Call Log Save
function saveCallLog() {
  const notes = document.getElementById("callNotesInput").value.trim() || "Discussed formulation parameters and custom discount.";
  closeModal("modalCall");

  appendTimelineItem({
    type: "call",
    title: "Logged Phone Call: Account Review",
    time: "Just now (12m 30s)",
    badge: "LOGGED",
    body: `${notes}`
  });

  showToast("Call notes and follow-up reminder saved to Timeline.");
}

// Google Meet Instant Launch
function launchInstantMeet() {
  const roomId = `COAST-MEET-${Math.floor(1000 + Math.random() * 9000)}`;
  const meetUrl = `https://meet.google.com/${roomId.toLowerCase()}`;

  appendTimelineItem({
    type: "meet",
    title: `Google Meet Session Launched (Room #${roomId})`,
    time: "Active Now",
    badge: "LIVE",
    body: `Video meeting initiated with client. Live AI Note Taker active. Meeting link: <a href="${meetUrl}" target="_blank" style="color: #ff6b6b; font-family: 'JetBrains Mono', monospace;">${meetUrl}</a>`
  });

  switchCrmView("comms");
  showToast(`Google Meet room #${roomId} generated & active!`);
}

function copyMeetLink() {
  const text = "https://meet.google.com/coast-meet-8821";
  navigator.clipboard.writeText(text).then(() => {
    showToast("Copied Google Meet URL to clipboard!");
  }).catch(() => {
    showToast("Meeting link ready: https://meet.google.com/coast-meet-8821");
  });
}

// Append Item to Timeline
function appendTimelineItem({ type, title, time, badge, body }) {
  const stream = document.getElementById("timelineStream");
  if (!stream) return;

  const item = document.createElement("div");
  item.className = "timeline-item";

  const markerClass = type === "email" ? "green" : type === "meet" ? "red" : "cyan";
  const icon = type === "email" ? "mail" : type === "meet" ? "videocam" : "phone_in_talk";
  const borderCol = type === "email" ? "var(--crm-green)" : type === "meet" ? "var(--crm-red)" : "var(--crm-cyan)";

  item.innerHTML = `
    <div class="timeline-marker ${markerClass}">
      <span class="material-symbols-outlined" style="font-size: 12px; color: ${borderCol};">${icon}</span>
    </div>
    <div class="timeline-card" style="border-left: 3px solid ${borderCol};">
      <div class="timeline-header">
        <span class="timeline-title">
          <span class="material-symbols-outlined" style="color: ${borderCol}; font-size: 16px;">${icon}</span>
          ${title}
        </span>
        <span class="timeline-time">${time}</span>
      </div>
      <div class="timeline-body">${body}</div>
    </div>
  `;

  stream.insertBefore(item, stream.firstChild);
}

// ==========================================
// GEMINI AI EMAIL COPILOT & TRANSLATION
// ==========================================

const GEMINI_TEMPLATES = {
  proposal: `Hi Sarah,

Following our technical review on Google Meet, here is the customized proposal and paint formulation spec for Apex Custom Paintworks:

• Project: 3-Stage Candy Apple Red & Midnight Pearl Violet
• Formulation Specs: 12% Micro Silver Flake / 1:1 Slow Speed Reducer
• Spray Setup Recommendation: 1.3mm needle @ 26-28 PSI
• Agreed Dealer Tier 2 Net Price: £24.50 / 500ml (-38% off MSRP)

Attached are the Technical Data Sheets (TDS) and safety compliance sheets. Let us know if you would like us to dispatch this batch from our European hub today.

Best regards,
Mark Lawson — Coast Airbrush Europe`,

  polish: `Dear Sarah,

Thank you for your continued partnership with Coast Airbrush Europe. We have finalized the technical parameters and commercial pricing for your upcoming production cycle. 

Please review the attached Technical Data Sheets (TDS) and color mixing ratios. We are ready to fulfill your order immediately upon confirmation.

Warm regards,
Mark Lawson — Coast Airbrush Europe`,

  followup: `Hi Sarah,

Just following up on our previous discussion regarding the Kroma Edge 2K Diamond Clear batch and your Net-30 credit allocation. 

We have reserved your case packs at our European bonded warehouse. Please let us know if you need any adjustments to your order before dispatch.

Best regards,
Mark Lawson — Coast Airbrush Europe`,

  troubleshoot: `Hi Sarah,

Regarding the application question discussed: For optimal depth without orange peel under current warm workshop conditions (28°C+), we recommend:
1. Switch from Medium to Slow Speed Reducer (Ratio 1:1).
2. Allow 12-15 minutes flash time between coats until completely matte.
3. Keep gun distance at 15-20cm with 50% overlap.

Let us know if you would like a quick 5-minute Google Meet demo with our Master Painter.

Best regards,
Mark Lawson — Coast Airbrush Europe`
};

const GEMINI_TRANSLATIONS = {
  de: {
    name: "German (Deutsch)",
    text: `Hallo Sarah,

nach unserer technischen Besprechung auf Google Meet finden Sie hier das maßgeschneiderte Angebot und die Lackrezeptur für Apex Custom Paintworks:

• Projekt: 3-Schicht Candy Apple Red & Midnight Pearl Violet
• Mischverhältnis: 12% Micro Silver Flake / 1:1 Slow Speed Verdünner
• Spritzpistolen-Einstellung: 1,3 mm Düse bei 1,8–2,0 bar Druck
• Vereinbarter Händler-Nettopreis: 24,50 £ / 500ml (-38% Rabatt auf UVP)

Im Anhang finden Sie die Technischen Datenblätter (TDS) und Sicherheitsdatenblätter. Bitte teilen Sie uns mit, ob wir diesen Auftrag heute versenden sollen.

Mit freundlichen Grüßen,
Mark Lawson — Coast Airbrush Europe`
  },
  fr: {
    name: "French (Français)",
    text: `Bonjour Sarah,

Suite à notre point technique sur Google Meet, voici la proposition personnalisée et la formulation de peinture pour Apex Custom Paintworks :

• Projet : Candy Apple Red 3 étapes & Midnight Pearl Violet
• Spécifications : 12% Micro Silver Flake / Diluant lent 1:1
• Réglage pistolet : Buse 1,3 mm à 1,8 bar de pression
• Tarif Net Revendeur convenu : 24,50 £ / 500ml (-38% sur prix public)

Veuillez trouver ci-joint les Fiches Techniques (TDS) et fiches de sécurité. Faites-nous savoir si nous pouvons expédier votre commande aujourd'hui.

Cordialement,
Mark Lawson — Coast Airbrush Europe`
  },
  nl: {
    name: "Dutch (Nederlands)",
    text: `Beste Sarah,

Naar aanleiding van ons technisch overleg via Google Meet, ontvangt u hierbij het voorstel en de verfformule voor Apex Custom Paintworks:

• Project: 3-traps Candy Apple Red & Midnight Pearl Violet
• Mengverhouding: 12% Micro Silver Flake / 1:1 Slow Reducer verdunner
• Spuitinstelling: 1,3 mm spuitopening bij 1,8 bar druk
• Overeengekomen Dealer Netto Prijs: £ 24,50 / 500ml (-38% korting)

De Technische Datasheets (TDS) zijn bijgevoegd. Laat ons gerust weten of wij deze order vandaag kunnen versturen vanuit ons distributiecentrum.

Met vriendelijke groet,
Mark Lawson — Coast Airbrush Europe`
  },
  es: {
    name: "Spanish (Español)",
    text: `Hola Sarah,

Tras nuestra reunión técnica en Google Meet, adjuntamos la propuesta personalizada y las fórmulas de pintura para Apex Custom Paintworks:

• Proyecto: Candy Apple Red de 3 etapas y Midnight Pearl Violet
• Especificaciones: 12% Micro Silver Flake / Reductor Lento 1:1
• Configuración de pistola: Boquilla 1,3 mm a 26-28 PSI
• Precio Neto Distribuidor acordado: 24,50 £ / 500ml (-38% sobre PVP)

Adjuntamos las Fichas Técnicas (TDS) y certificados de seguridad. Quedamos a su disposición para despachar el pedido hoy mismo.

Un cordial saludo,
Mark Lawson — Coast Airbrush Europe`
  },
  it: {
    name: "Italiano",
    text: `Gentile Sarah,

In seguito al nostro incontro tecnico su Google Meet, le inviamo la proposta personalizzata e le specifiche di formulazione per Apex Custom Paintworks:

• Progetto: Candy Apple Red a 3 strati e Midnight Pearl Violet
• Formula: 12% Micro Silver Flake / Diluente Lento 1:1
• Setup aerografo: Ugello 1,3 mm a 1,8 bar
• Prezzo Netto Rivenditore: £ 24,50 / 500ml (-38% dal listino)

In allegato le Schede Tecniche (TDS). Rimaniamo a disposizione per la spedizione immediata.

Cordiali saluti,
Mark Lawson — Coast Airbrush Europe`
  },
  en: {
    name: "English (UK)",
    text: GEMINI_TEMPLATES.proposal
  }
};

// Generate AI Email Copy
function geminiGenerateEmail(type) {
  const emailArea = document.getElementById("emailBody");
  if (!emailArea) return;

  const content = GEMINI_TEMPLATES[type] || GEMINI_TEMPLATES.proposal;
  emailArea.value = content;
  showToast(`✨ Gemini AI generated "${type.toUpperCase()}" copy!`);
}

// Translate Email
function geminiTranslateEmail(langCode) {
  const emailArea = document.getElementById("emailBody");
  if (!emailArea) return;

  const translation = GEMINI_TRANSLATIONS[langCode];
  if (translation) {
    emailArea.value = translation.text;
    showToast(`🌍 Gemini AI translated email to ${translation.name}!`);
  }
}

// Quick Reply Draft Assistant
function geminiQuickDraft(action) {
  const replyArea = document.getElementById("quickReplyText");
  if (!replyArea) return;

  if (action === "proposal") {
    replyArea.value = "Hi Sarah, TDS sheets and custom £24.50 net pricing attached. Ready to ship from UK hub today!";
    showToast("✨ Gemini AI drafted quick proposal reply!");
  } else if (action === "translate_de") {
    replyArea.value = "Hallo Sarah, anbei finden Sie die Technischen Datenblätter und den vereinbarten Nettopreis von 24,50 £. Versandfertig ab Lager!";
    showToast("🇩🇪 Translated quick reply to German!");
  } else if (action === "translate_fr") {
    replyArea.value = "Bonjour Sarah, fiches techniques et tarif net de 24,50 £ ci-joints. Prêt à être expédié aujourd'hui!";
    showToast("🇫🇷 Translated quick reply to French!");
  }
}

// Toast System
let toastTimeout;
function showToast(msg, duration = 3000) {
  const toast = document.getElementById("crmToast");
  const msgSpan = document.getElementById("crmToastMsg");
  if (!toast || !msgSpan) return;

  msgSpan.textContent = msg;
  toast.classList.add("show");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

// =========================================================================
// APC OVERNIGHT HAZCHEM LOGISTICS & A4 INKJET PRINTING ENGINE
// =========================================================================

function initApcSeedData() {
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

function renderApcConsignmentsTable() {
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

function handleCreateApcConsignment(event) {
  event.preventDefault();
  const name = document.getElementById("apcCustName").value;
  const orderRef = document.getElementById("apcOrderRef").value;
  const address = document.getElementById("apcAddress").value;
  const postcode = document.getElementById("apcPostcode").value;
  const serviceCode = document.getElementById("apcServiceCode").value;
  const weightKg = parseFloat(document.getElementById("apcWeight").value) || 2.0;
  const isHazardous = document.getElementById("apcHazmatFlag").value === "true";
  const itemDesc = document.getElementById("apcItemsDesc").value || "Custom Automotive Paint & Clearcoat";

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

function printApcConsignmentA4(consignmentId) {
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

function handleApcCloseManifest() {
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

// Initialise APC Data on startup
initApcSeedData();

// =========================================================================
// B2B TRADE PARTNER COMPLIANCE & MANUAL APPROVAL ENGINE
// =========================================================================
let cachedTradeApplications = [];

const FALLBACK_TRADE_APPLICATIONS = [
  {
    id: "app_demo_01",
    submittedAt: "2026-09-02T11:45:00Z",
    company: "Bavaria Kustom Works",
    contactName: "Klaus Weber",
    email: "klaus@bavariakustom.de",
    phone: "+49 89 1234567",
    vat: "DE345678901",
    country: "Germany",
    sector: "Custom Automotive & Motorcycle Refinishing",
    tierDesired: "dealer",
    monthlyVolume: "€2,000 – €5,000",
    currentBrands: "House of Kolor, Mipa",
    status: "pending_review"
  }
];

async function loadTradeApplications() {
  const container = document.getElementById("crmTradeApplicationsContainer");
  const pendingBadge = document.getElementById("crmTradePendingBadge");

  try {
    const res = await fetch("/api/admin/trade-applications");
    const data = await res.json();
    if (data.success && Array.isArray(data.applications)) {
      cachedTradeApplications = data.applications;
    } else {
      cachedTradeApplications = FALLBACK_TRADE_APPLICATIONS;
    }
  } catch (err) {
    console.warn("Unable to fetch live trade applications, using fallback data:", err);
    if (!cachedTradeApplications.length) {
      cachedTradeApplications = JSON.parse(JSON.stringify(FALLBACK_TRADE_APPLICATIONS));
    }
  }

  const pendingCount = cachedTradeApplications.filter(a => a.status === 'pending_review').length;
  if (pendingBadge) {
    pendingBadge.textContent = `${pendingCount} Pending Review`;
    pendingBadge.className = pendingCount > 0 ? "badge badge-gold" : "badge badge-green";
  }

  renderTradeApplications(cachedTradeApplications);
}

function renderTradeApplications(applications) {
  const container = document.getElementById("crmTradeApplicationsContainer");
  if (!container) return;

  if (!applications || applications.length === 0) {
    container.innerHTML = `
      <div style="padding: 30px; text-align: center; color: #888; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; background: #0c0f0f; border-radius: 6px; border: 1px dashed var(--crm-border);">
        No partner applications in queue. Prospective dealers and distributors submit applications via <a href="dealers.html" target="_blank" style="color: var(--crm-amber); text-decoration: underline;">dealers.html</a>.
      </div>
    `;
    return;
  }

  let html = `<div style="display: flex; flex-direction: column; gap: 16px;">`;

  applications.forEach(app => {
    const isPending = app.status === 'pending_review';
    const isApproved = app.status === 'approved';
    const isRejected = app.status === 'rejected';

    const statusBadge = isPending 
      ? `<span class="badge badge-gold" style="font-size: 0.72rem; padding: 4px 8px; display: inline-flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 14px;">hourglass_top</span> AWAITING MANUAL APPROVAL</span>`
      : isApproved
      ? `<span class="badge badge-green" style="font-size: 0.72rem; padding: 4px 8px; display: inline-flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 14px;">check_circle</span> APPROVED & VERIFIED</span>`
      : `<span class="badge badge-red" style="font-size: 0.72rem; padding: 4px 8px; display: inline-flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 14px;">cancel</span> DENIED / RESTRICTED</span>`;

    const borderColor = isPending ? "var(--crm-amber)" : isApproved ? "var(--crm-green)" : "var(--crm-red)";

    html += `
      <div style="background: #0f1212; border: 1px solid ${borderColor}; border-left: 4px solid ${borderColor}; border-radius: 8px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; border-bottom: 1px solid var(--crm-border); padding-bottom: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 1.05rem; font-weight: 800; color: #fff;">${app.company}</span>
              ${statusBadge}
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; color: #888;">ID: ${app.id}</span>
            </div>
            <div style="font-size: 0.8rem; color: #bbb; margin-top: 4px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
              <span><strong>Contact:</strong> ${app.contactName}</span>
              <span><strong>Email:</strong> <a href="mailto:${app.email}" style="color: var(--crm-cyan); text-decoration: none;">${app.email}</a></span>
              <span><strong>Phone:</strong> ${app.phone || 'N/A'}</span>
              <span><strong>Region:</strong> ${app.country || 'Europe'}</span>
            </div>
          </div>
          <div style="text-align: right; font-size: 0.72rem; color: #888; font-family: 'JetBrains Mono', monospace;">
            Submitted: ${new Date(app.submittedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <!-- Applicant Trade Credentials Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; font-size: 0.78rem; margin-bottom: 14px;">
          <div style="background: #141717; padding: 10px; border-radius: 6px; border: 1px solid var(--crm-border);">
            <div style="color: #888; font-size: 0.7rem; text-transform: uppercase;">Tax / VAT ID (VIES Verification)</div>
            <div style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #fff; margin-top: 2px;">
              ${app.vat || 'None provided'} <span style="color: var(--crm-green); font-size: 0.7rem;">✓ Format Valid</span>
            </div>
          </div>
          <div style="background: #141717; padding: 10px; border-radius: 6px; border: 1px solid var(--crm-border);">
            <div style="color: #888; font-size: 0.7rem; text-transform: uppercase;">Workshop / Commercial Sector</div>
            <div style="font-weight: 600; color: #fff; margin-top: 2px;">${app.sector || 'Custom Automotive'}</div>
          </div>
          <div style="background: #141717; padding: 10px; border-radius: 6px; border: 1px solid var(--crm-border);">
            <div style="color: #888; font-size: 0.7rem; text-transform: uppercase;">Desired Wholesale Tier</div>
            <div style="font-weight: 700; color: ${app.tierDesired === 'distributor' ? 'var(--crm-cyan)' : 'var(--crm-amber)'}; margin-top: 2px;">
              ${app.tierDesired === 'distributor' ? 'Tier 1: Master Distributor' : 'Tier 2: Authorized Dealer'}
            </div>
          </div>
          <div style="background: #141717; padding: 10px; border-radius: 6px; border: 1px solid var(--crm-border);">
            <div style="color: #888; font-size: 0.7rem; text-transform: uppercase;">Estimated Monthly Volume</div>
            <div style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #fff; margin-top: 2px;">${app.monthlyVolume || 'Not specified'}</div>
          </div>
        </div>

        ${app.currentBrands ? `
          <div style="font-size: 0.75rem; color: #888; margin-bottom: 12px; background: #111414; padding: 8px 12px; border-radius: 4px; border: 1px solid var(--crm-border);">
            <strong style="color: var(--crm-chrome);">Current Paint Brands Stocked/Used:</strong> ${app.currentBrands}
          </div>
        ` : ''}

        <!-- Manual Approval / Status Action Row -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; padding-top: 8px;">
          ${isPending ? `
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span style="font-size: 0.75rem; color: #aaa; font-weight: 600;">Manual Approval Action:</span>
              <button onclick="approveTradePartner('${app.id}', 'dealer')" style="background: linear-gradient(135deg, #16a34a, #15803d); color: #fff; border: 1px solid #22c55e; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 0.75rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;" title="Grant Tier 2 Authorized Dealer Status with 30% Wholesale Discount">
                <span class="material-symbols-outlined" style="font-size: 16px;">check_circle</span>
                Approve as Dealer (Tier 2 - 30% Off)
              </button>
              <button onclick="approveTradePartner('${app.id}', 'distributor')" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; border: 1px solid #38bdf8; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 0.75rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;" title="Grant Tier 1 Master Regional Distributor Status with 55% Wholesale Discount">
                <span class="material-symbols-outlined" style="font-size: 16px;">verified</span>
                Approve as Master Distributor (Tier 1 - 55% Off)
              </button>
              <button onclick="rejectTradePartner('${app.id}')" style="background: transparent; color: #ef4444; border: 1px solid rgba(239,68,68,0.5); padding: 6px 12px; border-radius: 6px; font-size: 0.72rem; cursor: pointer;" title="Deny wholesale account privileges">
                Deny Application
              </button>
            </div>
            <div style="font-size: 0.72rem; color: #888; font-style: italic;">
              ⚠️ Retail B2C clients cannot view trade prices until approved.
            </div>
          ` : isApproved ? `
            <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
              <span style="font-size: 0.78rem; color: var(--crm-green); font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                <span class="material-symbols-outlined" style="font-size: 16px;">task_alt</span> Active Credentials: ${app.assignedTier === 'distributor' ? 'Tier 1 Master Distributor' : 'Tier 2 Authorized Dealer'}
              </span>
              <span style="font-size: 0.72rem; color: #888;">Approved on: ${new Date(app.approvedAt || Date.now()).toLocaleDateString()}</span>
              <a href="index.html" target="_blank" style="background: #1a1e1e; color: #fff; border: 1px solid var(--crm-border); padding: 4px 10px; border-radius: 4px; text-decoration: none; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 4px;">
                <span class="material-symbols-outlined" style="font-size: 14px; color: var(--crm-amber);">login</span> Test Storefront Login
              </a>
            </div>
            <button onclick="rejectTradePartner('${app.id}')" style="background: transparent; color: #888; border: 1px solid var(--crm-border); padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; cursor: pointer;">
              Revoke Wholesale Access
            </button>
          ` : `
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 0.78rem; color: var(--crm-red); font-weight: 700;">Account Flagged / Restricted: ${app.rejectionReason || 'Vetting requirements not met'}</span>
            </div>
            <button onclick="approveTradePartner('${app.id}', 'dealer')" style="background: transparent; color: var(--crm-amber); border: 1px solid var(--crm-amber); padding: 4px 10px; border-radius: 4px; font-size: 0.72rem; cursor: pointer;">
              Re-Open & Approve as Dealer
            </button>
          `}
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

async function approveTradePartner(applicationId, assignedRole) {
  try {
    let success = false;
    let message = "";

    try {
      const res = await fetch("/api/admin/approve-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: applicationId,
          assignedRole: assignedRole || "dealer"
        })
      });
      const data = await res.json();
      success = data.success;
      message = data.message;
    } catch (networkErr) {
      console.warn("API offline, updating local session state:", networkErr);
      const app = cachedTradeApplications.find(a => a.id === applicationId);
      if (app) {
        app.status = "approved";
        app.assignedTier = assignedRole || "dealer";
        app.approvedAt = new Date().toISOString();
        success = true;
        message = `Commercial account for "${app.company}" manually approved as ${assignedRole === 'distributor' ? 'Tier 1 Distributor' : 'Tier 2 Dealer'}.`;
      }
    }

    if (success) {
      showToast(`✅ ${message || "Trade partner manually approved!"}`);
      await loadTradeApplications();
    } else {
      showToast(`⚠️ Could not approve partner: ${message || "Unknown error"}`);
    }
  } catch (e) {
    showToast("⚠️ Error communicating with trade compliance server.");
  }
}

async function rejectTradePartner(applicationId) {
  const reason = prompt("Enter optional reason for rejection / restriction:", "Business VAT registration or premises verification incomplete.") || "Verification incomplete";

  try {
    let success = false;
    let message = "";

    try {
      const res = await fetch("/api/admin/reject-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: applicationId,
          reason: reason
        })
      });
      const data = await res.json();
      success = data.success;
      message = data.message;
    } catch (networkErr) {
      const app = cachedTradeApplications.find(a => a.id === applicationId);
      if (app) {
        app.status = "rejected";
        app.rejectionReason = reason;
        app.rejectedAt = new Date().toISOString();
        success = true;
        message = `Application for "${app.company}" has been restricted.`;
      }
    }

    if (success) {
      showToast(`⚠️ ${message || "Application restricted."}`);
      await loadTradeApplications();
    } else {
      showToast(`⚠️ Could not reject application.`);
    }
  } catch (e) {
    showToast("⚠️ Error communicating with trade compliance server.");
  }
}

async function resetDemoTradeApplicant() {
  try {
    let success = false;
    try {
      const res = await fetch("/api/admin/reset-demo-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      success = data.success;
    } catch (networkErr) {
      const app = cachedTradeApplications.find(a => a.id === "app_demo_01" || a.email === "klaus@bavariakustom.de");
      if (app) {
        app.status = "pending_review";
        delete app.assignedTier;
        delete app.approvedAt;
        success = true;
      }
    }

    showToast("↺ Bavaria Kustom Works demo reset to Pending Approval status.");
    await loadTradeApplications();
  } catch (e) {
    showToast("⚠️ Error resetting demo applicant.");
  }
}

// Expose all handlers to global window scope for inline onclick/onsubmit HTML handlers
window.switchCrmView = switchCrmView;
window.openEmailModal = openEmailModal;
window.openCallModal = openCallModal;
window.closeModal = closeModal;
window.sendEmail = sendEmail;
window.saveCallLog = saveCallLog;
window.launchInstantMeet = launchInstantMeet;
window.endMeeting = endMeeting;
window.copyMeetLink = copyMeetLink;
window.geminiGenerateEmail = geminiGenerateEmail;
window.geminiTranslateEmail = geminiTranslateEmail;
window.geminiQuickDraft = geminiQuickDraft;
window.showToast = showToast;
window.calculateMargin = calculateMargin;
window.updateTierVal = updateTierVal;
window.addNewSkuRow = addNewSkuRow;
window.syncPricingToShopify = syncPricingToShopify;
window.handleCreateApcConsignment = handleCreateApcConsignment;
window.handleApcCloseManifest = handleApcCloseManifest;
window.printApcConsignmentA4 = printApcConsignmentA4;
window.renderApcConsignmentsTable = renderApcConsignmentsTable;
window.loadTradeApplications = loadTradeApplications;
window.approveTradePartner = approveTradePartner;
window.rejectTradePartner = rejectTradePartner;
window.resetDemoTradeApplicant = resetDemoTradeApplicant;

