/**
 * Coast Airbrush Europe — Enterprise CRM Engine (js/crm.js)
 * Handles Omnichannel Timeline, Google Meet In-App Launcher,
 * In-App Email Client, and Dynamic Pricing & Custom SKU Overrides.
 */

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
      { name: "Flake King 1000 Dry Flake Gun", code: "FK-GUN-1000", msrp: 189.0, tierDef: 160.65, customNet: 155.0, baseCost: 95.0 }
    ]
  }
};

// DOM Initialization
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initClientSelector();
  initGlobalSearch();
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
