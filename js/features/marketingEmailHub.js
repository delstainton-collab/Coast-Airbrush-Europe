// Master Customer Email & AI Marketing Communication Hub
// Extracted per Anti-God Monolith Architecture Skill (Laws 2 & 4)

export class MarketingEmailHub {
  constructor(appRef) {
    this.app = appRef;
  }

  populateSingleCustomerDropdown() {
    const singleSelect = document.getElementById('select-email-single-customer');
    if (!singleSelect) return;

    const customers = this.app.adminController.getAllCustomers();
    singleSelect.innerHTML = customers.map(c => {
      return `<option value="${c.email}">${c.name} - ${c.company} (${c.countryCode})</option>`;
    }).join('');
  }

  updateAudienceCountBadge() {
    const segSelect = document.getElementById('select-email-target-segment');
    const badge = document.getElementById('audience-count-badge');
    if (!segSelect || !badge) return;

    const segment = segSelect.value;
    const targetCustomers = this.app.adminController.getCustomersBySegment(segment);
    badge.innerHTML = `Audience: <strong class="text-white">${targetCustomers.length}</strong> matching accounts ready for dispatch.`;
  }

  updateSingleCustomerDetails() {
    const singleSelect = document.getElementById('select-email-single-customer');
    const detailContainer = document.getElementById('single-customer-details');
    if (!singleSelect || !detailContainer) return;

    const email = singleSelect.value;
    const customers = this.app.adminController.getAllCustomers();
    const cust = customers.find(c => c.email.toLowerCase() === email.toLowerCase()) || customers[0];

    if (cust) {
      detailContainer.innerHTML = `
        <span class="text-white font-bold">${cust.name}</span> &bull; 
        <span>${cust.company}</span> &bull; 
        <span class="text-primary font-bold">VAT: ${cust.vatNumber}</span> &bull; 
        <span>Tier: ${cust.tier}</span> &bull; 
        <span class="text-amber-400">Order #${cust.latestOrderId}</span>
      `;
    }
  }

  renderMetricsRibbon() {
    const customers = this.app.adminController.getAllCustomers();
    const b2bCount = customers.filter(c => c.vatNumber && c.vatNumber !== 'N/A (Standard Consumer)').length;

    const totElem = document.getElementById('metric-email-total-contacts');
    const b2bElem = document.getElementById('metric-email-b2b-contacts');
    if (totElem) totElem.innerText = `${customers.length} Accounts`;
    if (b2bElem) b2bElem.innerText = `${b2bCount} Shops`;

    const campaigns = (this.app.adminController.config.emailHub && this.app.adminController.config.emailHub.campaigns) || [];
    let totRevenue = campaigns.reduce((acc, c) => acc + (c.revenueEur || 0), 0);
    const revElem = document.getElementById('metric-email-pipeline-rev');
    if (revElem) revElem.innerHTML = `&euro;${totRevenue.toLocaleString()}`;
  }

  updatePreview() {
    const segSelect = document.getElementById('select-email-target-segment');
    const subjInput = document.getElementById('input-email-subject');
    const bodyText = document.getElementById('textarea-email-body');
    const previewTo = document.getElementById('preview-email-to');
    const previewSubj = document.getElementById('preview-email-subject');
    const previewBody = document.getElementById('preview-email-body-content');

    if (!previewTo || !previewSubj || !previewBody) return;

    const isSingle = document.querySelector('input[name="email_mode"]:checked')?.value === 'single';
    let sampleCustomer;

    if (isSingle) {
      const singleSelect = document.getElementById('select-email-single-customer');
      const email = singleSelect ? singleSelect.value : '';
      sampleCustomer = this.app.adminController.getAllCustomers().find(c => c.email.toLowerCase() === email.toLowerCase()) || this.app.adminController.getAllCustomers()[0];
      previewTo.innerText = `${sampleCustomer.name} <${sampleCustomer.email}> (${sampleCustomer.company})`;
    } else {
      const segment = segSelect ? segSelect.value : 'all';
      const targetCustomers = this.app.adminController.getCustomersBySegment(segment);
      sampleCustomer = targetCustomers[0] || this.app.adminController.getAllCustomers()[0];
      previewTo.innerText = `Segment: ${segment.toUpperCase()} (${targetCustomers.length} accounts, e.g. ${sampleCustomer ? sampleCustomer.company : 'Sample'})`;
    }

    const rawSubj = subjInput ? subjInput.value : '';
    const rawBody = bodyText ? bodyText.value : '';

    if (sampleCustomer) {
      previewSubj.innerText = this.app.adminController.mergeCustomerVariables(rawSubj, sampleCustomer);
      previewBody.innerHTML = this.app.adminController.mergeCustomerVariables(rawBody, sampleCustomer).replace(/\n/g, '<br>');
    } else {
      previewSubj.innerText = rawSubj;
      previewBody.innerHTML = rawBody.replace(/\n/g, '<br>');
    }
  }

  triggerAiGen(presetKey, customGoal = "") {
    const segSelect = document.getElementById('select-email-target-segment');
    const segment = segSelect ? segSelect.value : 'b2b_jobbers';

    const aiRes = this.app.adminController.generateAiEmailContent(presetKey, segment, customGoal);

    const subjInput = document.getElementById('input-email-subject');
    const bodyText = document.getElementById('textarea-email-body');
    const scoreBox = document.getElementById('ai-copy-score-box');
    const scoreElem = document.getElementById('ai-predicted-score');
    const noteElem = document.getElementById('ai-audience-note');
    const altContainer = document.getElementById('container-subject-alternatives');
    const altList = document.getElementById('subject-alternatives-list');

    if (subjInput) subjInput.value = aiRes.selectedSubject;
    if (bodyText) bodyText.value = aiRes.body;

    if (scoreBox && scoreElem && noteElem) {
      scoreElem.innerText = `Predicted Open Rate: ${aiRes.predictedOpenRate}`;
      noteElem.innerText = `• ${aiRes.audienceNote}`;
      scoreBox.classList.remove('hidden');
    }

    if (altContainer && altList && aiRes.subjectOptions) {
      altList.innerHTML = aiRes.subjectOptions.map((subj, idx) => {
        return `
          <button type="button" class="w-full text-left p-2 rounded bg-surface border border-secondary hover:border-primary text-slate-200 hover:text-white transition-all flex items-center justify-between gap-2" onclick="document.getElementById('input-email-subject').value = this.querySelector('.subj-text').innerText; window.paintApp.updateEmailPreview();">
            <span class="subj-text font-bold"><span class="text-primary font-mono mr-1.5">[Var #${idx+1}]</span>${subj}</span>
            <span class="text-[10px] text-emerald-400 font-mono">Use &rarr;</span>
          </button>
        `;
      }).join('');
      altContainer.classList.remove('hidden');
    }

    this.updatePreview();
  }

  handleDispatch() {
    const isSingle = document.querySelector('input[name="email_mode"]:checked')?.value === 'single';
    const subjInput = document.getElementById('input-email-subject');
    const bodyText = document.getElementById('textarea-email-body');

    const subject = subjInput ? subjInput.value.trim() : "";
    const body = bodyText ? bodyText.value.trim() : "";

    if (!subject || !body) {
      this.app.showToast("⚠️ Please provide both a subject line and email body before dispatching.", 'warning');
      return;
    }

    if (isSingle) {
      const singleSelect = document.getElementById('select-email-single-customer');
      const email = singleSelect ? singleSelect.value : '';
      const customer = this.app.adminController.getAllCustomers().find(c => c.email.toLowerCase() === email.toLowerCase());

      if (!customer) {
        this.app.showToast("⚠️ Please select a recipient.", 'warning');
        return;
      }

      this.app.confirmDialog({
        title: "Dispatch Direct Email",
        subtitle: `${customer.name} (${customer.email})`,
        message: `Are you sure you want to dispatch this email to <strong>${customer.name}</strong>?`,
        itemDetails: `<div class="p-2 font-mono text-xs text-white">Subject: ${subject}</div>`,
        confirmText: "Send Email",
        isDanger: false
      }).then(confirmed => {
        if (!confirmed) return;
        this.app.adminController.sendDirectEmail(customer, { subject, body, mode: "Simulated Delivery" });
        this.app.showToast(`✅ Direct Email dispatched successfully to ${customer.email}!`, 'success');
        this.renderDispatchLogs();
      });
    } else {
      const segSelect = document.getElementById('select-email-target-segment');
      const segment = segSelect ? segSelect.value : 'all';
      const targetCustomers = this.app.adminController.getCustomersBySegment(segment);

      if (targetCustomers.length === 0) {
        this.app.showToast("⚠️ No matching recipients found in selected segment.", 'warning');
        return;
      }

      this.app.confirmDialog({
        title: "Dispatch Blanket Broadcast",
        subtitle: `Audience: ${segment.toUpperCase().replace('_', ' ')} (${targetCustomers.length} accounts)`,
        message: `Are you sure you want to dispatch this blanket campaign across <strong>${targetCustomers.length} accounts</strong>?`,
        itemDetails: `<div class="p-2 font-mono text-xs text-white">Subject: ${subject}</div>`,
        confirmText: "Dispatch Broadcast",
        isDanger: true
      }).then(confirmed => {
        if (!confirmed) return;
        const res = this.app.adminController.sendBlanketCampaign(segment, { subject, body, title: subject.slice(0, 45) });
        this.app.showToast(`✅ Blanket Campaign dispatched to ${res.recipientsSent} accounts successfully!`, 'success');
        this.renderMetricsRibbon();
        this.renderCampaignAnalytics();
        this.renderDispatchLogs();
      });
    }
  }

  handleSendTestEmail() {
    const subjInput = document.getElementById('input-email-subject');
    const bodyText = document.getElementById('textarea-email-body');
    const subject = subjInput ? subjInput.value.trim() : "Coast Airbrush Test";
    const body = bodyText ? bodyText.value.trim() : "Test email body content.";

    const adminTestRecipient = {
      name: "Admin Dispatch Tester",
      company: "Coast Airbrush Europe HQ",
      email: "orders@coastairbrush.eu",
      phone: "+31 10 998877",
      country: "Netherlands",
      countryCode: "NL",
      city: "Rotterdam",
      vatNumber: "NL88992211B01",
      tier: "Master Admin",
      segment: "internal_admin",
      latestOrderId: "TEST-001",
      carrier: "DHL Hazmat Express",
      trackingNumber: "TEST-TRACK-9999",
      estimatedDelivery: "2026-09-01"
    };

    this.app.adminController.sendDirectEmail(adminTestRecipient, { subject: `[TEST] ${subject}`, body, mode: "Test Dispatch" });
    this.app.showToast(`🧪 Test Email dispatched to ${adminTestRecipient.email}!`, 'info');
    this.renderDispatchLogs();
  }

  handleSaveCurrentTemplate() {
    const subjInput = document.getElementById('input-email-subject');
    const bodyText = document.getElementById('textarea-email-body');
    const segSelect = document.getElementById('select-email-target-segment');

    const subject = subjInput ? subjInput.value.trim() : "";
    const body = bodyText ? bodyText.value.trim() : "";
    const segment = segSelect ? segSelect.value : "b2b_jobbers";

    if (!subject || !body) {
      this.app.showToast("⚠️ Provide subject and body content before saving as template.", 'warning');
      return;
    }

    const tplName = (document.getElementById('input-email-subject')?.value || "Custom Template").slice(0, 40);

    const newTpl = {
      id: `tpl-custom-${Date.now()}`,
      name: tplName,
      targetSegment: segment,
      subject: subject,
      body: body
    };

    this.app.adminController.saveEmailTemplate(newTpl);
    this.app.showToast(`💾 Template '${tplName}' saved to Admin Configuration!`, 'success');

    const tplSelect = document.getElementById('select-email-template');
    if (tplSelect) {
      const opt = document.createElement('option');
      opt.value = newTpl.id;
      opt.innerText = newTpl.name;
      opt.selected = true;
      tplSelect.appendChild(opt);
    }
  }

  renderCampaignAnalytics() {
    const tableBody = document.getElementById('table-campaigns-body');
    if (!tableBody) return;

    const campaigns = (this.app.adminController.config.emailHub && this.app.adminController.config.emailHub.campaigns) || [];
    if (campaigns.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="py-4 text-center text-secondary">No broadcast campaigns recorded yet.</td></tr>`;
      return;
    }

    tableBody.innerHTML = campaigns.map(c => {
      const d = new Date(c.date);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      return `
        <tr class="hover:bg-surface-container/50">
          <td class="py-2.5 px-3 text-secondary text-[11px]">${dateStr}</td>
          <td class="py-2.5 px-3 font-bold text-white">${c.title}</td>
          <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded bg-surface border border-secondary text-primary font-mono text-[10px] uppercase">${c.segment.replace('_', ' ')}</span></td>
          <td class="py-2.5 px-3 text-center text-white font-bold">${c.deliveredCount}</td>
          <td class="py-2.5 px-3 text-center text-emerald-400 font-bold">${c.openRate}%</td>
          <td class="py-2.5 px-3 text-center text-amber-400 font-bold">${c.clickRate}%</td>
          <td class="py-2.5 px-3 text-right text-emerald-400 font-bold">&euro;${(c.revenueEur || 0).toLocaleString()}</td>
        </tr>
      `;
    }).join('');
  }

  renderDispatchLogs() {
    const tableBody = document.getElementById('table-dispatch-logs-body');
    if (!tableBody) return;

    const logs = (this.app.adminController.config.emailHub && this.app.adminController.config.emailHub.dispatchLogs) || [];
    if (logs.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-secondary">No dispatch logs found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = logs.slice(0, 50).map(log => {
      const d = new Date(log.timestamp);
      const timeStr = `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}:${String(d.getUTCSeconds()).padStart(2,'0')}`;
      const isSingle = log.type === 'single';
      return `
        <tr class="hover:bg-surface-container/50">
          <td class="py-2 px-3 text-secondary text-[11px]">${timeStr}</td>
          <td class="py-2 px-3">
            <span class="text-white font-bold">${log.recipientName || 'Customer'}</span>
            <span class="text-[10px] text-secondary block">${log.recipientEmail}</span>
          </td>
          <td class="py-2 px-3">
            <span class="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${isSingle ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-500/40' : 'bg-amber-950/60 text-amber-300 border border-amber-500/40'}">
              ${log.type}
            </span>
          </td>
          <td class="py-2 px-3 text-slate-200 max-w-[280px] truncate" title="${log.subject}">${log.subject}</td>
          <td class="py-2 px-3 text-center">
            <span class="text-emerald-400 font-bold flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-[14px]">check_circle</span> Delivered
            </span>
          </td>
          <td class="py-2 px-3 text-right text-secondary text-[11px]">${log.mode || 'Simulated'}</td>
        </tr>
      `;
    }).join('');
  }

  setup() {
    // 1. Sub-View Switching (Compose vs AI Analytics)
    const btnCompose = document.getElementById('btn-emailhub-view-compose');
    const btnAnalytics = document.getElementById('btn-emailhub-view-analytics');
    const viewCompose = document.getElementById('emailhub-subview-compose');
    const viewAnalytics = document.getElementById('emailhub-subview-analytics');

    if (btnCompose && btnAnalytics && viewCompose && viewAnalytics) {
      btnCompose.addEventListener('click', () => {
        btnCompose.classList.add('bg-primary', 'text-white');
        btnCompose.classList.remove('text-secondary');
        btnAnalytics.classList.remove('bg-primary', 'text-white');
        btnAnalytics.classList.add('text-secondary');
        viewCompose.style.display = 'block';
        viewAnalytics.style.display = 'none';
      });

      btnAnalytics.addEventListener('click', () => {
        btnAnalytics.classList.add('bg-primary', 'text-white');
        btnAnalytics.classList.remove('text-secondary');
        btnCompose.classList.remove('bg-primary', 'text-white');
        btnCompose.classList.add('text-secondary');
        viewCompose.style.display = 'none';
        viewAnalytics.style.display = 'block';
        this.renderCampaignAnalytics();
      });
    }

    // 2. Mode Radio Toggle (Blanket vs Single)
    const modeRadios = document.querySelectorAll('input[name="email_mode"]');
    modeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const isSingle = e.target.value === 'single';
        const segContainer = document.getElementById('container-email-segment-select');
        const singleContainer = document.getElementById('container-email-single-select');
        const dispatchLabel = document.getElementById('btn-email-dispatch-label');

        if (segContainer && singleContainer) {
          segContainer.style.display = isSingle ? 'none' : 'block';
          singleContainer.style.display = isSingle ? 'block' : 'none';
        }

        if (dispatchLabel) {
          dispatchLabel.innerText = isSingle ? "SEND DIRECT EMAIL" : "DISPATCH BLANKET BROADCAST";
        }
        this.updatePreview();
      });
    });

    // 3. Segment Dropdown Change
    const segSelect = document.getElementById('select-email-target-segment');
    if (segSelect) {
      segSelect.addEventListener('change', () => {
        this.updateAudienceCountBadge();
        this.updatePreview();
      });
    }

    // 4. Single Customer Dropdown Change
    const singleSelect = document.getElementById('select-email-single-customer');
    if (singleSelect) {
      singleSelect.addEventListener('change', () => {
        this.updateSingleCustomerDetails();
        this.updatePreview();
      });
    }

    // 5. Template Selection
    const tplSelect = document.getElementById('select-email-template');
    if (tplSelect) {
      tplSelect.addEventListener('change', (e) => {
        const tplId = e.target.value;
        if (!tplId) return;
        const templates = (this.app.adminController.config.emailHub && this.app.adminController.config.emailHub.templates) || [];
        const found = templates.find(t => t.id === tplId);
        if (found) {
          const subjInput = document.getElementById('input-email-subject');
          const bodyText = document.getElementById('textarea-email-body');
          if (subjInput) subjInput.value = found.subject;
          if (bodyText) bodyText.value = found.body;
          this.updatePreview();
        }
      });
    }

    // 6. Live Text Preview Listeners
    const subjInput = document.getElementById('input-email-subject');
    if (subjInput) {
      subjInput.addEventListener('input', () => this.updatePreview());
    }
    const bodyText = document.getElementById('textarea-email-body');
    if (bodyText) {
      bodyText.addEventListener('input', () => this.updatePreview());
    }

    // 7. Merge Tag Buttons insertion
    const mergeBtns = document.querySelectorAll('.btn-merge-tag');
    mergeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.getAttribute('data-tag');
        const textarea = document.getElementById('textarea-email-body');
        if (textarea && tag) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const text = textarea.value;
          textarea.value = text.substring(0, start) + tag + text.substring(end);
          textarea.focus();
          textarea.selectionStart = textarea.selectionEnd = start + tag.length;
          this.updatePreview();
        }
      });
    });

    // 8. AI Copywriting Presets
    this.app.addSafeListener('btn-ai-gen-restock', 'click', () => this.triggerAiGen('restock_flash'));
    this.app.addSafeListener('btn-ai-gen-preorder', 'click', () => this.triggerAiGen('preorder_backer_addon'));
    this.app.addSafeListener('btn-ai-gen-vip', 'click', () => this.triggerAiGen('vip_artist_exclusive'));
    this.app.addSafeListener('btn-ai-gen-custom', 'click', () => {
      const customPrompt = document.getElementById('input-ai-custom-prompt');
      this.triggerAiGen('custom', customPrompt ? customPrompt.value : '');
    });

    // 9. Dispatch & Actions
    this.app.addSafeListener('btn-email-dispatch-main', 'click', () => this.handleDispatch());
    this.app.addSafeListener('btn-email-send-test', 'click', () => this.handleSendTestEmail());
    this.app.addSafeListener('btn-email-save-tpl', 'click', () => this.handleSaveCurrentTemplate());
    this.app.addSafeListener('btn-email-clear-logs', 'click', () => {
      if (confirm("Are you sure you want to clear all dispatch logs?")) {
        this.app.adminController.clearDispatchLogs();
        this.renderDispatchLogs();
      }
    });

    // 10. AI Campaign Follow-Up Trigger
    this.app.addSafeListener('btn-trigger-ai-followup', 'click', () => {
      const btnCompose = document.getElementById('btn-emailhub-view-compose');
      if (btnCompose) btnCompose.click();
      const segSelect = document.getElementById('select-email-target-segment');
      if (segSelect) segSelect.value = 'b2b_jobbers';
      this.triggerAiGen('restock_flash', '48H Follow Up for Non-Converting Shops');
      window.scrollTo({ top: document.getElementById('admin-panel-email').offsetTop, behavior: 'smooth' });
    });
  }

  render() {
    this.populateSingleCustomerDropdown();
    this.updateAudienceCountBadge();
    this.updateSingleCustomerDetails();
    this.renderMetricsRibbon();
    this.updatePreview();
    this.renderCampaignAnalytics();
    this.renderDispatchLogs();
  }
}

