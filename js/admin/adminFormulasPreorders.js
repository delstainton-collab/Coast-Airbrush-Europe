// Admin Formulas & Preorders Management Engine
// Extracted per Anti-God Monolith Architecture Skill (Laws 1 & 2)

export class AdminFormulasPreorders {
  constructor(appRef) {
    this.app = appRef;
  }

  renderAdminFormulas() {
    const container = document.getElementById('admin-formulas-grid');
    if (!container) return;
    container.innerHTML = '';

    const formulas = this.app.adminController.config.formulas;
    formulas.forEach(f => {
      const card = document.createElement('div');
      card.className = 'industrial-card p-5 flex flex-col justify-between border-2 border-secondary/70 hover:border-primary transition-all';
      
      const compList = (f.components || []).map(c => 
        `<div class="flex justify-between items-center py-1 border-b border-secondary/30 text-[11px] font-mono">
          <span class="text-white font-medium">${c.name}</span>
          <span class="text-primary font-bold">${c.parts} pt (${c.specificGravity || 1.0} g/mL)</span>
        </div>`
      ).join('');

      card.innerHTML = `
        <div>
          <div class="flex justify-between items-start mb-2">
            <span class="metal-spec-plate-red text-[10px] font-bold">${f.id}</span>
            <span class="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 border border-emerald-500/40">${f.ratioLabel || f.ratioText || '1 : 1'}</span>
          </div>
          <h4 class="font-headline text-base uppercase text-white font-bold mb-1">${f.name}</h4>
          <p class="font-mono text-[11px] text-secondary mb-3 leading-relaxed">${f.description || f.notes || 'No description provided.'}</p>
          
          <div class="bg-surface-dim p-2.5 rounded border border-secondary mb-3">
            <div class="font-mono text-[10px] text-secondary uppercase font-bold mb-1">Components Breakdown:</div>
            ${compList}
          </div>

          <div class="grid grid-cols-2 gap-2 text-[10px] font-mono text-secondary mb-4">
            <div>Nozzle: <span class="text-white">${f.recommendedNozzle || '0.3mm - 0.5mm'}</span></div>
            <div>Pressure: <span class="text-white">${f.recommendedPressure || '20-25 PSI'}</span></div>
          </div>
        </div>

        <div class="flex gap-2 pt-3 border-t border-secondary/40">
          <button onclick="window.paintApp.openAdminFormulaModal('${f.id}')" class="flex-1 font-mono text-xs border border-secondary bg-surface-container py-1.5 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-1">
            <span class="material-symbols-outlined text-[14px]">edit</span> EDIT
          </button>
          <button onclick="window.paintApp.deleteAdminFormula('${f.id}')" class="font-mono text-xs border border-rose-500/60 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50 py-1.5 px-3 transition-all flex items-center justify-center">
            <span class="material-symbols-outlined text-[14px]">delete</span>
          </button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  openAdminFormulaModal(formulaId = null) {
    const modal = document.getElementById('modal-admin-formula-edit');
    const title = document.getElementById('modal-formula-edit-title');
    const idInput = document.getElementById('form-formula-id');
    const sysIdInput = document.getElementById('form-formula-system-id');
    const nameInput = document.getElementById('form-formula-name');
    const ratioInput = document.getElementById('form-formula-ratio-label');
    const nozzleInput = document.getElementById('form-formula-nozzle');
    const pressureInput = document.getElementById('form-formula-pressure');
    const notesInput = document.getElementById('form-formula-notes');
    const compContainer = document.getElementById('form-components-container');

    if (!modal || !compContainer) return;
    compContainer.innerHTML = '';

    if (formulaId) {
      const f = this.app.adminController.config.formulas.find(item => item.id === formulaId);
      if (f) {
        if (title) title.innerText = `Edit Formula: ${f.name}`;
        if (idInput) idInput.value = f.id;
        if (sysIdInput) { sysIdInput.value = f.id; sysIdInput.disabled = true; }
        if (nameInput) nameInput.value = f.name || '';
        if (ratioInput) ratioInput.value = f.ratioLabel || f.ratioText || '';
        if (nozzleInput) nozzleInput.value = f.recommendedNozzle || '';
        if (pressureInput) pressureInput.value = f.recommendedPressure || '';
        if (notesInput) notesInput.value = f.description || f.notes || '';

        (f.components || []).forEach(c => this.addComponentRowToModal(c));
      }
    } else {
      if (title) title.innerText = "Add New Mixing Formula";
      if (idInput) idInput.value = '';
      if (sysIdInput) { sysIdInput.value = `formula_${Date.now()}`; sysIdInput.disabled = false; }
      if (nameInput) nameInput.value = '';
      if (ratioInput) ratioInput.value = '4 : 1 : 1';
      if (nozzleInput) nozzleInput.value = '0.3mm - 0.5mm';
      if (pressureInput) pressureInput.value = '20 - 25 PSI';
      if (notesInput) notesInput.value = '';

      this.addComponentRowToModal({ name: 'Base Component', parts: 4, specificGravity: 0.98, productSku: 'KE-BASE-1L' });
      this.addComponentRowToModal({ name: 'Reducer / Solvent', parts: 1, specificGravity: 0.88, productSku: 'RU-311-1L' });
    }

    modal.classList.add('active');
  }

  addComponentRowToModal(comp = { name: '', parts: 1, specificGravity: 1.0, productSku: '' }) {
    const container = document.getElementById('form-components-container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'grid grid-cols-12 gap-2 items-center bg-surface-dim p-2 rounded border border-secondary/40 comp-row';
    row.innerHTML = `
      <div class="col-span-4">
        <input type="text" class="mech-input w-full !py-1 text-xs comp-name" placeholder="Component Name" value="${comp.name || ''}">
      </div>
      <div class="col-span-2">
        <input type="number" step="0.1" class="mech-input w-full !py-1 text-xs comp-parts" placeholder="Parts" value="${comp.parts || 1}">
      </div>
      <div class="col-span-2">
        <input type="number" step="0.01" class="mech-input w-full !py-1 text-xs comp-sg" placeholder="g/mL" value="${comp.specificGravity || 1.0}">
      </div>
      <div class="col-span-3">
        <input type="text" class="mech-input w-full !py-1 text-xs comp-sku" placeholder="SKU" value="${comp.productSku || ''}">
      </div>
      <div class="col-span-1 text-right">
        <button type="button" onclick="this.closest('.comp-row').remove()" class="text-rose-400 hover:text-rose-300 font-bold p-1">
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    `;
    container.appendChild(row);
  }

  closeAdminFormulaModal() {
    const modal = document.getElementById('modal-admin-formula-edit');
    if (modal) modal.classList.remove('active');
  }

  saveAdminFormulaFromModal() {
    const sysIdInput = document.getElementById('form-formula-system-id');
    const nameInput = document.getElementById('form-formula-name');
    const ratioInput = document.getElementById('form-formula-ratio-label');
    const nozzleInput = document.getElementById('form-formula-nozzle');
    const pressureInput = document.getElementById('form-formula-pressure');
    const notesInput = document.getElementById('form-formula-notes');

    if (!sysIdInput || !nameInput || !sysIdInput.value.trim() || !nameInput.value.trim()) {
      this.app.showToast("Please provide both a System ID and Name.", "warning");
      return;
    }

    const compRows = document.querySelectorAll('.comp-row');
    const components = [];
    compRows.forEach(r => {
      const name = r.querySelector('.comp-name').value.trim();
      const parts = parseFloat(r.querySelector('.comp-parts').value) || 1;
      const sg = parseFloat(r.querySelector('.comp-sg').value) || 1.0;
      const sku = r.querySelector('.comp-sku').value.trim();
      if (name) {
        components.push({
          id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          name: name,
          parts: parts,
          specificGravity: sg,
          productSku: sku || 'KE-BASE-1L'
        });
      }
    });

    const newFormula = {
      id: sysIdInput.value.trim(),
      name: nameInput.value.trim(),
      ratioLabel: ratioInput ? ratioInput.value.trim() : 'Standard',
      ratioText: ratioInput ? ratioInput.value.trim() : 'Standard',
      description: notesInput ? notesInput.value.trim() : '',
      recommendedNozzle: nozzleInput ? nozzleInput.value.trim() : '0.3mm - 0.5mm',
      recommendedPressure: pressureInput ? pressureInput.value.trim() : '20-25 PSI',
      components: components
    };

    this.app.adminController.saveFormula(newFormula);
    this.closeAdminFormulaModal();
    this.renderAdminFormulas();
    this.app.showToast("✅ Formula saved successfully!", 'success');
  }

  deleteAdminFormula(formulaId) {
    if (confirm(`Are you sure you want to delete formula "${formulaId}"?`)) {
      this.app.adminController.deleteFormula(formulaId);
      this.renderAdminFormulas();
    }
  }

  renderAdminPreorders() {
    const container = document.getElementById('admin-preorders-container');
    if (!container) return;
    container.innerHTML = '';

    const tiers = this.app.adminController.config.preorders;
    tiers.forEach((t, index) => {
      const card = document.createElement('div');
      card.className = 'industrial-card p-5 space-y-4 border-2 border-secondary/70';
      card.innerHTML = `
        <div class="flex justify-between items-center pb-2 border-b border-secondary">
          <span class="metal-spec-plate-red text-[10px] font-bold">${t.id}</span>
          <span class="font-mono text-xs text-primary font-bold">Tier ${index + 1}</span>
        </div>

        <div>
          <label class="block font-mono text-[10px] text-secondary uppercase font-bold mb-1">Package Name:</label>
          <input type="text" class="mech-input w-full !py-1 text-xs pre-name" value="${t.name}">
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-mono text-[10px] text-secondary uppercase font-bold mb-1">Price (&euro; EUR):</label>
            <input type="number" class="mech-input w-full !py-1 text-xs pre-price-eur" value="${t.priceEUR || 249}">
          </div>
          <div>
            <label class="block font-mono text-[10px] text-secondary uppercase font-bold mb-1">Price ($ USD):</label>
            <input type="number" class="mech-input w-full !py-1 text-xs pre-price-usd" value="${t.priceUSD || 270}">
          </div>
        </div>

        <div>
          <label class="block font-mono text-[10px] text-secondary uppercase font-bold mb-1">Badge Text:</label>
          <input type="text" class="mech-input w-full !py-1 text-xs pre-badge" value="${t.badge || ''}">
        </div>

        <div>
          <label class="block font-mono text-[10px] text-secondary uppercase font-bold mb-1">Delivery Batch Milestone:</label>
          <input type="text" class="mech-input w-full !py-1 text-xs pre-batch" value="${t.deliveryBatch || ''}">
        </div>

        <div>
          <label class="block font-mono text-[10px] text-secondary uppercase font-bold mb-1">Perks (one per line):</label>
          <textarea rows="4" class="mech-input w-full !py-1 text-xs pre-perks">${(t.perks || []).join('\n')}</textarea>
        </div>
      `;
      container.appendChild(card);
    });
  }

  saveAdminPreorders() {
    const cards = document.querySelectorAll('#admin-preorders-container .industrial-card');
    const updatedTiers = [];
    const originalTiers = this.app.adminController.config.preorders;

    cards.forEach((c, idx) => {
      const orig = originalTiers[idx] || {};
      const name = c.querySelector('.pre-name').value;
      const eur = parseFloat(c.querySelector('.pre-price-eur').value) || 0;
      const usd = parseFloat(c.querySelector('.pre-price-usd').value) || 0;
      const badge = c.querySelector('.pre-badge').value;
      const batch = c.querySelector('.pre-batch').value;
      const perksText = c.querySelector('.pre-perks').value;
      const perks = perksText.split('\n').map(p => p.trim()).filter(p => p.length > 0);

      updatedTiers.push({
        ...orig,
        name: name,
        priceEUR: eur,
        priceUSD: usd,
        badge: badge,
        deliveryBatch: batch,
        perks: perks
      });
    });

    this.app.adminController.config.preorders = updatedTiers;
    this.app.adminController.saveConfig();
    this.app.showToast("✅ Pre-Order packages saved and synchronized!", 'success');
  }
}
