// Coast Airbrush Europe — CRM Communications, Modals, Timeline & Gemini AI Hub
// Extracted per Anti-God Monolith Architecture Skill (Laws 1 & 2)

let toastTimeout;
export function showToast(msg, duration = 3000) {
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

export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("active");
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
}

export function openEmailModal(subject = "") {
  if (subject) {
    const subInput = document.getElementById("emailSubject");
    if (subInput) subInput.value = subject;
  }
  openModal("modalEmail");
}

export function openCallModal() {
  openModal("modalCall");
}

export function sendFullEmail() {
  const recipient = document.getElementById("emailRecipient")?.value || "";
  const subject = document.getElementById("emailSubject")?.value || "";
  
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

export const sendEmail = sendFullEmail;

export function sendQuickReply() {
  const replyInput = document.getElementById("quickReplyText");
  const text = replyInput?.value.trim();
  if (!text) {
    showToast("Please write a message before sending.");
    return;
  }

  replyInput.value = "";

  appendTimelineItem({
    type: "email",
    title: "Quick Reply: Re: TDS Sheets for New 2K Clearcoat Batch",
    time: "Just now",
    badge: "SENT",
    body: `<em>"${text}"</em>`
  });

  showToast("Reply sent to Sarah Jensen!");
}

export function saveCallLog() {
  const notes = document.getElementById("callNotesInput")?.value.trim() || "Discussed formulation parameters and custom discount.";
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

export function launchInstantMeet() {
  const roomId = `COAST-MEET-${Math.floor(1000 + Math.random() * 9000)}`;
  const meetUrl = `https://meet.google.com/${roomId.toLowerCase()}`;

  appendTimelineItem({
    type: "meet",
    title: `Google Meet Session Launched (Room #${roomId})`,
    time: "Active Now",
    badge: "LIVE",
    body: `Video meeting initiated with client. Live AI Note Taker active. Meeting link: <a href="${meetUrl}" target="_blank" style="color: #ff6b6b; font-family: 'JetBrains Mono', monospace;">${meetUrl}</a>`
  });

  if (window.switchCrmView) window.switchCrmView("comms");
  showToast(`Google Meet room #${roomId} generated & active!`);
}

export function endMeeting() {
  showToast("Google Meet session concluded & AI summary generated!");
}

export function copyMeetLink() {
  const text = "https://meet.google.com/coast-meet-8821";
  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast("Copied Google Meet URL to clipboard!");
    }).catch(() => {
      showToast("Meeting link ready: https://meet.google.com/coast-meet-8821");
    });
  } else {
    showToast("Meeting link ready: https://meet.google.com/coast-meet-8821");
  }
}

export function appendTimelineItem({ type, title, time, badge, body }) {
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

export function geminiGenerateEmail(type) {
  const emailArea = document.getElementById("emailBody");
  if (!emailArea) return;

  const content = GEMINI_TEMPLATES[type] || GEMINI_TEMPLATES.proposal;
  emailArea.value = content;
  showToast(`✨ Gemini AI generated "${type.toUpperCase()}" copy!`);
}

export function geminiTranslateEmail(langCode) {
  const emailArea = document.getElementById("emailBody");
  if (!emailArea) return;

  const translation = GEMINI_TRANSLATIONS[langCode];
  if (translation) {
    emailArea.value = translation.text;
    showToast(`🌍 Gemini AI translated email to ${translation.name}!`);
  }
}

export function geminiQuickDraft(action) {
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
