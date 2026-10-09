// Admin Taxonomy (Departments & Categories) UI Controller
// Extracted per Anti-God Monolith Architecture Skill (Laws 2 & 3)

export class AdminTaxonomyUI {
  constructor(appRef) {
    this.app = appRef;
  }

  escapeHtml(str) {
    return this.app.escapeHtml ? this.app.escapeHtml(str) : String(str || '');
  }

  getDefaultDepartmentForProduct(prod) {
    if (!prod) return 'Automotive & Custom Paint';
    if (prod.department) return prod.department;
    const cat = prod.category || '';
    if (cat === 'Dry Metal Flake (Glitter)' || cat === 'Metal Flake') return 'Dry Metal Flake Systems';
    if (cat === 'Dry Metal Flake Guns' || cat === 'Flake King Gun Accessories') return 'Spray Equipment & Guns';
    if (cat === 'Masking Products') return 'Masking & Workshop Tools';
    if (prod.brand === 'VsionAir') return 'Airbrush & Studio Prep';
    if (cat === 'Mirror Chrome Systems' || cat === 'Topcoat Clears & Thinners' || cat === 'Kroma Basecoats') return 'Automotive & Custom Paint';
    return 'Automotive & Custom Paint';
  }

  renderAdminTaxonomy() {
    const grid = document.getElementById('admin-departments-grid');
    if (!grid) return;

    const departments = this.app.adminController.getDepartments();
    const effectiveProducts = this.app.getEffectiveProducts();

    // Metrics
    const totalDeptsEl = document.getElementById('metric-total-departments');
    const totalCatsEl = document.getElementById('metric-total-categories');
    const totalProductsEl = document.getElementById('metric-total-assigned-products');

    const totalCats = departments.reduce((acc, d) => acc + (d.categories || []).length, 0);
    const assignedProductsCount = effectiveProducts.filter(p => {
      const dept = p.department || this.getDefaultDepartmentForProduct(p);
      return Boolean(dept);
    }).length;

    if (totalDeptsEl) totalDeptsEl.textContent = departments.length;
    if (totalCatsEl) totalCatsEl.textContent = totalCats;
    if (totalProductsEl) totalProductsEl.textContent = assignedProductsCount;

    // Render department cards
    grid.innerHTML = '';
    departments.forEach(dept => {
      const deptProducts = effectiveProducts.filter(p => {
        const prodDept = p.department || this.getDefaultDepartmentForProduct(p);
        return (prodDept || '').toLowerCase() === dept.name.toLowerCase();
      });

      const card = document.createElement('div');
      card.className = 'industrial-card p-5 border-2 border-secondary/50 flex flex-col justify-between gap-4 bg-surface-container hover:border-primary/60 transition-all shadow-md';
      card.id = `dept-card-${dept.id}`;

      const categories = dept.categories || [];
      const catsHtml = categories.length > 0
        ? categories.map(cat => {
            const catCount = deptProducts.filter(p => (p.category || '').toLowerCase() === cat.toLowerCase()).length;
            return `
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/60 border border-secondary/60 text-[11px] font-mono text-zinc-200">
                <span>${this.escapeHtml(cat)}</span>
                <span class="text-[9px] px-1.5 py-0.2 bg-primary/20 text-primary rounded font-bold" title="${catCount} products in this category">${catCount}</span>
                <button type="button" onclick="window.paintApp.removeTaxonomyCategory('${this.escapeHtml(dept.id)}', '${this.escapeHtml(cat)}')" class="text-zinc-500 hover:text-rose-400 font-bold ml-0.5 cursor-pointer" title="Remove category tag">&times;</button>
              </span>
            `;
          }).join('')
        : `<div class="text-[11px] text-zinc-500 italic py-1">No categories assigned yet. Add one below.</div>`;

      card.innerHTML = `
        <div class="space-y-3">
          <!-- Card Header -->
          <div class="flex items-start justify-between gap-3 border-b border-secondary/40 pb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded bg-primary/20 text-primary border border-primary/50 flex items-center justify-center flex-shrink-0">
                <span class="material-symbols-outlined text-xl">${this.escapeHtml(dept.icon || 'category')}</span>
              </div>
              <div>
                <h4 class="font-headline text-base uppercase text-white font-bold tracking-wide">${this.escapeHtml(dept.name)}</h4>
                <div class="text-[10px] font-mono text-zinc-400">ID: <span class="text-zinc-300 font-bold">${this.escapeHtml(dept.id)}</span></div>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/40 text-[10px] font-mono font-bold whitespace-nowrap">
              ${deptProducts.length} Product${deptProducts.length === 1 ? '' : 's'}
            </span>
          </div>

          <!-- Description -->
          <p class="text-xs text-zinc-300 font-sans leading-relaxed min-h-[36px]">
            ${this.escapeHtml(dept.description || 'No description provided.')}
          </p>

          <!-- Category Tags Area -->
          <div>
            <div class="text-[10px] font-mono uppercase text-secondary font-bold mb-1.5 flex items-center justify-between">
              <span>Categories (${categories.length}):</span>
            </div>
            <div class="flex flex-wrap gap-1.5 mb-3">
              ${catsHtml}
            </div>

            <!-- Inline Add Category Input -->
            <div class="flex items-center gap-1.5 pt-1">
              <input type="text" id="input-add-cat-${dept.id}" placeholder="+ Add category tag..." class="mech-input !py-1 !px-2 text-[11px] font-mono flex-1">
              <button type="button" onclick="window.paintApp.addTaxonomyCategory('${this.escapeHtml(dept.id)}')" class="px-2.5 py-1 bg-surface border border-secondary hover:border-primary text-zinc-200 hover:text-white text-[11px] font-mono font-bold rounded cursor-pointer transition-colors">
                Add
              </button>
            </div>
          </div>
        </div>

        <!-- Card Footer Actions -->
        <div class="pt-3 border-t border-secondary/40 flex items-center justify-between gap-2">
          <button type="button" onclick="window.paintApp.filterSpreadsheetByDept('${this.escapeHtml(dept.name)}')" class="text-[11px] font-mono text-primary hover:underline flex items-center gap-1 cursor-pointer" title="View products in Spreadsheet Matrix">
            <span class="material-symbols-outlined text-[13px]">table_rows</span> View Products
          </button>
          <div class="flex items-center gap-1.5">
            <button type="button" onclick="window.paintApp.openAdminDepartmentModal('${this.escapeHtml(dept.id)}')" class="px-2.5 py-1 bg-surface border border-secondary hover:border-primary text-zinc-200 hover:text-white text-xs font-mono font-bold rounded cursor-pointer transition-colors flex items-center gap-1">
              <span class="material-symbols-outlined text-[13px]">edit</span> Edit
            </button>
            <button type="button" onclick="window.paintApp.deleteAdminDepartment('${this.escapeHtml(dept.id)}')" class="px-2.5 py-1 bg-rose-950/40 border border-rose-500/60 hover:bg-rose-900/60 text-rose-300 text-xs font-mono font-bold rounded cursor-pointer transition-colors flex items-center gap-1" title="Delete department">
              <span class="material-symbols-outlined text-[13px]">delete</span>
            </button>
          </div>
        </div>
      `;

      grid.appendChild(card);

      const catInput = card.querySelector(`#input-add-cat-${dept.id}`);
      if (catInput) {
        catInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.addTaxonomyCategory(dept.id);
          }
        });
      }
    });

    const allDeptNames = departments.map(d => d.name);
    this.syncTaxonomyDropdowns(allDeptNames);
  }

  syncTaxonomyDropdowns(departments) {
    const batchDept = document.getElementById('batch-department-select');
    if (batchDept) {
      const currentVal = batchDept.value;
      let opts = '<option value="">-- Choose Department --</option>';
      departments.forEach(d => {
        opts += `<option value="${this.escapeHtml(d)}" ${d === currentVal ? 'selected' : ''}>${this.escapeHtml(d)}</option>`;
      });
      batchDept.innerHTML = opts;
    }

    const filterDept = document.getElementById('admin-ss-filter-department');
    if (filterDept) {
      const currentVal = (this.app.spreadsheetState && this.app.spreadsheetState.departmentFilter) ? this.app.spreadsheetState.departmentFilter : 'all';
      let opts = '<option value="all">All Departments</option>';
      departments.forEach(d => {
        opts += `<option value="${this.escapeHtml(d)}" ${d === currentVal ? 'selected' : ''}>${this.escapeHtml(d)}</option>`;
      });
      filterDept.innerHTML = opts;
    }

    // Sync datalists for autocomplete suggestions
    const dlDepts = document.getElementById('datalist-departments');
    if (dlDepts) {
      dlDepts.innerHTML = departments.map(d => `<option value="${this.escapeHtml(d)}">`).join('');
    }

    const dlCats = document.getElementById('datalist-categories');
    if (dlCats) {
      const allCats = Array.from(new Set([
        ...this.app.adminController.getAllCategories(),
        ...this.app.getEffectiveProducts().map(p => p.category).filter(Boolean)
      ])).sort();
      dlCats.innerHTML = allCats.map(c => `<option value="${this.escapeHtml(c)}">`).join('');
    }
  }

  openAdminDepartmentModal(deptId = null) {
    const modal = document.getElementById('modal-admin-department-edit');
    const title = document.getElementById('modal-department-edit-title');
    const idInput = document.getElementById('form-department-id');
    const nameInput = document.getElementById('form-department-name');
    const iconInput = document.getElementById('form-department-icon');
    const iconGlyph = document.getElementById('form-department-icon-preview-glyph');
    const slugInput = document.getElementById('form-department-slug');
    const descInput = document.getElementById('form-department-description');
    const catsInput = document.getElementById('form-department-categories');

    if (!modal) return;

    if (deptId) {
      const dept = this.app.adminController.getDepartment(deptId);
      if (dept) {
        if (title) title.textContent = `Edit Department: ${dept.name}`;
        if (idInput) idInput.value = dept.id;
        if (nameInput) nameInput.value = dept.name;
        if (iconInput) iconInput.value = dept.icon || 'category';
        if (iconGlyph) iconGlyph.textContent = dept.icon || 'category';
        if (slugInput) slugInput.value = dept.id;
        if (descInput) descInput.value = dept.description || '';
        if (catsInput) catsInput.value = (dept.categories || []).join(', ');
      }
    } else {
      if (title) title.textContent = 'Create New Department';
      if (idInput) idInput.value = '';
      if (nameInput) nameInput.value = '';
      if (iconInput) iconInput.value = 'category';
      if (iconGlyph) iconGlyph.textContent = 'category';
      if (slugInput) slugInput.value = '';
      if (descInput) descInput.value = '';
      if (catsInput) catsInput.value = '';
    }

    modal.classList.add('active');
  }

  closeAdminDepartmentModal() {
    const modal = document.getElementById('modal-admin-department-edit');
    if (modal) modal.classList.remove('active');
  }

  saveAdminDepartmentFromModal() {
    const idInput = document.getElementById('form-department-id');
    const nameInput = document.getElementById('form-department-name');
    const iconInput = document.getElementById('form-department-icon');
    const descInput = document.getElementById('form-department-description');
    const catsInput = document.getElementById('form-department-categories');

    if (!nameInput || !nameInput.value.trim()) {
      this.app.showToast("Please provide a department name.", "warning");
      return;
    }

    const name = nameInput.value.trim();
    const existingId = idInput ? idInput.value.trim() : '';
    const id = existingId || ('dept-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    const icon = (iconInput ? iconInput.value.trim() : '') || 'category';
    const description = (descInput ? descInput.value.trim() : '') || '';
    const categories = (catsInput ? catsInput.value : '')
      .split(/[\n,]+/)
      .map(c => c.trim())
      .filter(Boolean);

    const deptObj = {
      id,
      name,
      icon,
      description,
      categories
    };

    this.app.adminController.saveDepartment(deptObj);
    this.closeAdminDepartmentModal();
    this.renderAdminTaxonomy();
    if (this.app.renderAdminSpreadsheet) this.app.renderAdminSpreadsheet();
    if (this.app.renderCategoryButtons) this.app.renderCategoryButtons();
    this.app.showToast(`Department "${name}" saved successfully!`, 'success');
  }

  deleteAdminDepartment(deptId) {
    const dept = this.app.adminController.getDepartment(deptId);
    if (!dept) return;

    if (!confirm(`Are you sure you want to delete the department "${dept.name}"? Products currently assigned to it will retain their text label until reassigned.`)) {
      return;
    }

    this.app.adminController.deleteDepartment(deptId);
    this.renderAdminTaxonomy();
    if (this.app.renderAdminSpreadsheet) this.app.renderAdminSpreadsheet();
    if (this.app.renderCategoryButtons) this.app.renderCategoryButtons();
    this.app.showToast(`Department "${dept.name}" removed.`, 'info');
  }

  addTaxonomyCategory(deptId) {
    const input = document.getElementById(`input-add-cat-${deptId}`);
    if (!input || !input.value.trim()) return;
    const cat = input.value.trim();

    const success = this.app.adminController.addCategoryToDepartment(deptId, cat);
    if (success) {
      input.value = '';
      this.renderAdminTaxonomy();
      if (this.app.renderCategoryButtons) this.app.renderCategoryButtons();
      this.app.showToast(`Category "${cat}" added.`, 'success');
    } else {
      this.app.showToast(`Category "${cat}" already exists in this department.`, 'warning');
    }
  }

  removeTaxonomyCategory(deptId, category) {
    if (!confirm(`Remove category "${category}" from this department?`)) return;
    const success = this.app.adminController.removeCategoryFromDepartment(deptId, category);
    if (success) {
      this.renderAdminTaxonomy();
      if (this.app.renderCategoryButtons) this.app.renderCategoryButtons();
      this.app.showToast(`Category "${category}" removed.`, 'info');
    }
  }

  filterSpreadsheetByDept(deptName) {
    const btn = document.getElementById('subtab-admin-spreadsheet');
    if (btn) btn.click();
    const filterEl = document.getElementById('admin-ss-filter-department');
    if (filterEl) {
      filterEl.value = deptName;
      if (this.app.spreadsheetState) {
        this.app.spreadsheetState.departmentFilter = deptName;
        this.app.spreadsheetState.currentPage = 1;
      }
      if (this.app.renderAdminSpreadsheet) this.app.renderAdminSpreadsheet();
    }
  }
}
