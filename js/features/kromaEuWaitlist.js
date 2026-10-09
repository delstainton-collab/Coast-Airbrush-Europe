// Coast Airbrush Europe - KromaEdge European Hazmat Compliance & Priority Allocation Manager
// Manages UN1263 Class 3 solvent restrictions into mainland Europe

/**
 * Checks if a cart line item or product is a KromaEdge solvent product
 */
export function isKromaEdgeSolventItem(item) {
  if (!item) return false;
  const brand = (item.brand || "").toLowerCase();
  const id = (item.id || "").toLowerCase();
  const sku = (item.sku || "").toLowerCase();
  const title = (item.title || item.name || "").toLowerCase();

  // Kroma Edge mirror chrome, clears, and dedicated solvent components
  if (brand.includes("kroma edge") || brand === "kroma") return true;
  if (id.startsWith("kroma-") || id.includes("kroma-mirror") || id.includes("kroma-dedicated") || id.includes("kroma-edge")) return true;
  if (sku.startsWith("ke-") || sku.startsWith("kroma-")) return true;
  if (title.includes("kroma edge")) return true;

  return false;
}

/**
 * Registers an email for the KromaEdge European Priority Dispatch List
 */
export async function registerKromaEuWaitlist(email, countryCode = "EU", countryName = "Europe") {
  if (!email || !email.includes("@")) {
    return { success: false, message: "Please provide a valid email address." };
  }

  const cleanEmail = email.trim().toLowerCase();
  const payload = {
    email: cleanEmail,
    focus: `KromaEdge European Phase 2 Dispatch (${countryName} - ${countryCode})`,
    tags: ["kroma-edge-eu-waitlist", "adr-solvent-phase-2", countryCode.toUpperCase()]
  };

  // 1. LocalStorage persistence (instant offline guarantee)
  try {
    const existing = JSON.parse(localStorage.getItem("coast_kroma_eu_waitlist") || "[]");
    if (!existing.some(e => e.email === cleanEmail)) {
      existing.push({
        email: cleanEmail,
        countryCode,
        countryName,
        registeredAt: new Date().toISOString()
      });
      localStorage.setItem("coast_kroma_eu_waitlist", JSON.stringify(existing));
    }
  } catch (err) {
    console.warn("Could not save to localStorage", err);
  }

  // 2. Server API sync via /api/leads/subscribe
  try {
    const res = await fetch("/api/leads/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      return { success: true, message: `Spot reserved! You are on the priority allocation list for KromaEdge in ${countryName}.` };
    }
  } catch (apiErr) {
    console.info("Saved to local waitlist queue (API offline).", apiErr);
  }

  return { success: true, message: `Spot reserved! You are on the priority allocation list for KromaEdge in ${countryName}.` };
}

/**
 * Renders the KromaEdge EU Compliance & Waitlist Banner HTML for PDP / Modals
 */
export function renderKromaEuPdpNotice(country) {
  const cName = country ? country.name : "Europe";
  const cCode = country ? country.code : "EU";

  return `
    <div id="kroma-eu-compliance-box" class="p-4 rounded bg-[#131518] border-2 border-amber-500/50 text-xs font-mono space-y-3 shadow-lg my-4">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider">
          <span class="material-symbols-outlined text-[18px]">science</span>
          <span>ADR Class 3 Solvent Notice (${cName})</span>
        </div>
        <span class="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold">
          UK DISPATCH ACTIVE • EU ONBOARDING
        </span>
      </div>

      <p class="text-neutral-200 text-xs leading-relaxed font-body">
        <strong>KromaEdge Self-Organizing Mirror Chrome</strong> is formulated with pure optical volatile solvents classified as <strong>UN1263 Class 3 (Flammable Liquid)</strong>. Under European road safety protocols, chemical transport into ${cName} requires certified ADR dangerous goods courier contracts with specialized spill containment.
      </p>

      <div class="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-neutral-300 text-[11px] leading-relaxed">
        <span class="text-emerald-400 font-bold">✅ Good news for European painters:</span>
        All our <strong>Flake King dry flakes</strong>, <strong>FK50 water-based binders</strong>, and <strong>spray equipment</strong> ship to ${cName} daily with full DDP tracked delivery!
      </div>

      <!-- VIP European Allocation Form -->
      <div class="pt-2 border-t border-white/10 space-y-2">
        <div class="text-[11px] text-white font-bold uppercase flex items-center gap-1.5">
          <span class="material-symbols-outlined text-amber-400 text-[14px]">notifications_active</span>
          <span>Join the KromaEdge European Phase 2 Dispatch List:</span>
        </div>
        <form onsubmit="event.preventDefault(); window.paintApp && window.paintApp.submitKromaWaitlistFromPdp(this, '${cCode}', '${cName}')" class="flex gap-2">
          <input type="email" required placeholder="painter@bodyshop.${cCode.toLowerCase()}" class="flex-1 bg-surface-dim border border-neutral-700 focus:border-amber-400 rounded px-3 py-2 text-white text-xs placeholder:text-neutral-500 outline-none">
          <button type="submit" class="bg-amber-600 hover:bg-amber-500 text-black font-bold px-4 py-2 rounded uppercase text-xs transition-colors shrink-0 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.3)]">
            Reserve Priority
          </button>
        </form>
        <div class="text-[10px] text-neutral-400">Receive guaranteed batch reservation and launch courier perks when ${cName} routes open.</div>
      </div>
    </div>
  `;
}
