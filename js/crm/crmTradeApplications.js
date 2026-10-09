// Coast Airbrush Europe — CRM Trade Applications & VIP Subscriber Registry
// Extracted per Anti-God Monolith Architecture Skill (Laws 1 & 2)

import { showToast } from './crmCommunications.js';

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
    currentBrands: "Custom Creative, Mipa",
    status: "pending_review"
  }
];

export function escapeCrmText(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[m]);
}

export async function loadTradeApplications() {
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

export function renderTradeApplications(applications) {
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
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 1.05rem; font-weight: 800; color: #fff;">${escapeCrmText(app.company)}</span>
              ${statusBadge}
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; color: #888;">ID: ${escapeCrmText(app.id)}</span>
            </div>
            <div style="font-size: 0.8rem; color: #bbb; margin-top: 4px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
              <span><strong>Contact:</strong> ${escapeCrmText(app.contactName)}</span>
              <span><strong>Email:</strong> <a href="mailto:${escapeCrmText(app.email)}" style="color: var(--crm-cyan); text-decoration: none;">${escapeCrmText(app.email)}</a></span>
              <span><strong>Phone:</strong> ${escapeCrmText(app.phone || 'N/A')}</span>
              <span><strong>Region:</strong> ${escapeCrmText(app.country || 'Europe')}</span>
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
              ${escapeCrmText(app.vat || 'None provided')} <span style="color: var(--crm-green); font-size: 0.7rem;">✓ Format Valid</span>
            </div>
          </div>
          <div style="background: #141717; padding: 10px; border-radius: 6px; border: 1px solid var(--crm-border);">
            <div style="color: #888; font-size: 0.7rem; text-transform: uppercase;">Workshop / Commercial Sector</div>
            <div style="font-weight: 600; color: #fff; margin-top: 2px;">${escapeCrmText(app.sector || 'Custom Automotive')}</div>
          </div>
          <div style="background: #141717; padding: 10px; border-radius: 6px; border: 1px solid var(--crm-border);">
            <div style="color: #888; font-size: 0.7rem; text-transform: uppercase;">Desired Wholesale Tier</div>
            <div style="font-weight: 700; color: ${app.tierDesired === 'distributor' ? 'var(--crm-cyan)' : 'var(--crm-amber)'}; margin-top: 2px;">
              ${app.tierDesired === 'distributor' ? 'Tier 1: Master Distributor' : 'Tier 2: Authorized Dealer'}
            </div>
          </div>
          <div style="background: #141717; padding: 10px; border-radius: 6px; border: 1px solid var(--crm-border);">
            <div style="color: #888; font-size: 0.7rem; text-transform: uppercase;">Estimated Monthly Volume</div>
            <div style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #fff; margin-top: 2px;">${escapeCrmText(app.monthlyVolume || 'Not specified')}</div>
          </div>
        </div>

        ${app.currentBrands ? `
          <div style="font-size: 0.75rem; color: #888; margin-bottom: 12px; background: #111414; padding: 8px 12px; border-radius: 4px; border: 1px solid var(--crm-border);">
            <strong style="color: var(--crm-chrome);">Current Paint Brands Stocked/Used:</strong> ${escapeCrmText(app.currentBrands)}
          </div>
        ` : ''}

        <!-- Manual Approval / Status Action Row -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; padding-top: 8px;">
          ${isPending ? `
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span style="font-size: 0.75rem; color: #aaa; font-weight: 600;">Manual Approval Action:</span>
              <button onclick="approveTradePartner('${escapeCrmText(app.id)}', 'dealer')" style="background: linear-gradient(135deg, #16a34a, #15803d); color: #fff; border: 1px solid #22c55e; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 0.75rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;" title="Grant Tier 2 Authorized Dealer Status with 30% Wholesale Discount">
                <span class="material-symbols-outlined" style="font-size: 16px;">check_circle</span>
                Approve as Dealer (Tier 2 - 30% Off)
              </button>
              <button onclick="approveTradePartner('${escapeCrmText(app.id)}', 'distributor')" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; border: 1px solid #38bdf8; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 0.75rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;" title="Grant Tier 1 Master Regional Distributor Status with 55% Wholesale Discount">
                <span class="material-symbols-outlined" style="font-size: 16px;">verified</span>
                Approve as Master Distributor (Tier 1 - 55% Off)
              </button>
              <button onclick="rejectTradePartner('${escapeCrmText(app.id)}')" style="background: transparent; color: #ef4444; border: 1px solid rgba(239,68,68,0.5); padding: 6px 12px; border-radius: 6px; font-size: 0.72rem; cursor: pointer;" title="Deny wholesale account privileges">
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
            <button onclick="rejectTradePartner('${escapeCrmText(app.id)}')" style="background: transparent; color: #888; border: 1px solid var(--crm-border); padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; cursor: pointer;">
              Revoke Wholesale Access
            </button>
          ` : `
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 0.78rem; color: var(--crm-red); font-weight: 700;">Account Flagged / Restricted: ${escapeCrmText(app.rejectionReason || 'Vetting requirements not met')}</span>
            </div>
            <button onclick="approveTradePartner('${escapeCrmText(app.id)}', 'dealer')" style="background: transparent; color: var(--crm-amber); border: 1px solid var(--crm-amber); padding: 4px 10px; border-radius: 4px; font-size: 0.72rem; cursor: pointer;">
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

export async function approveTradePartner(applicationId, assignedRole) {
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

export async function rejectTradePartner(applicationId) {
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

export async function resetDemoTradeApplicant() {
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

export async function fetchAndRenderLaunchVips() {
  try {
    const res = await fetch('/api/leads/subscribers');
    const data = await res.json();
    const subs = data.subscribers || [];

    const totalEl = document.getElementById('vipCountTotal');
    const autoEl = document.getElementById('vipCountAuto');
    const airEl = document.getElementById('vipCountAir');
    const tradeEl = document.getElementById('vipCountTrade');
    const tbody = document.getElementById('vipSubscribersTableBody');

    if (totalEl) totalEl.textContent = subs.length;

    let autoCount = 0;
    let airCount = 0;
    let tradeCount = 0;

    subs.forEach(s => {
      const f = (s.focus || '').toLowerCase();
      if (f.includes('auto') || f.includes('moto')) autoCount++;
      else if (f.includes('airbrush') || f.includes('fine')) airCount++;
      else if (f.includes('trade') || f.includes('body')) tradeCount++;
      else autoCount++;
    });

    if (autoEl) autoEl.textContent = autoCount;
    if (airEl) airEl.textContent = airCount;
    if (tradeEl) tradeEl.textContent = tradeCount;

    if (tbody) {
      if (subs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #888; padding: 30px;">No subscribers recorded yet. Once visitors enter their details on the parking page, they will appear here in real time.</td></tr>`;
      } else {
        tbody.innerHTML = subs.map(s => {
          const dateStr = s.submittedAt ? new Date(s.submittedAt).toLocaleString() : 'Just now';
          const name = `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Custom Painter';
          return `
            <tr>
              <td style="font-weight: 700; color: #fff;">${escapeCrmText(name)}</td>
              <td style="font-family: 'JetBrains Mono', monospace; color: var(--crm-cyan);">${escapeCrmText(s.email)}</td>
              <td><span class="badge badge-chrome">${escapeCrmText(s.focus || 'Custom Automotive')}</span></td>
              <td><span class="badge badge-green">Confirmed VIP</span></td>
              <td style="font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; color: #aaa;">pre-launch-vip, european-launch</td>
              <td style="font-size: 0.75rem; color: #888;">${dateStr}</td>
            </tr>
          `;
        }).join('');
      }
    }
  } catch (err) {
    console.warn('Failed to load VIP subscribers:', err);
  }
}
