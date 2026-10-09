// Admin Product Cards & Modal Form UI Controller
// Extracted per Anti-God Monolith Architecture Skill (Laws 1 & 2)

import { ECOM_CATALOG } from '../../data/full_ecom_catalog.js';

export class AdminProductUI {
  constructor(appRef) {
    this.app = appRef;
  }

  getAssetUrl(path) {
    return this.app.getAssetUrl ? this.app.getAssetUrl(path) : path;
  }

  escapeHtml(str) {
    return this.app.escapeHtml ? this.app.escapeHtml(str) : String(str || '');
  }

  renderAdminProducts() {
    const container = document.getElementById('admin-products-grid');
    const countBadge = document.getElementById('admin-product-count');
    if (!container) return;
    container.innerHTML = '';

    const q = (document.getElementById('admin-product-search')?.value || '').toLowerCase().trim();
    const brandF = document.getElementById('admin-product-filter-brand')?.value || 'all';
    const catF = document.getElementById('admin-product-filter-category')?.value || 'all';

    let list = this.app.getEffectiveProducts();

    if (brandF !== 'all') {
      list = list.filter(p => (p.brand || '').toLowerCase() === brandF.toLowerCase());
    }

    if (catF !== 'all') {
      list = list.filter(p => (p.category || '').toLowerCase().includes(catF.toLowerCase()));
    }

    if (q) {
      list = list.filter(p => {
        const full = `${p.name || ''} ${p.sku || ''} ${p.brand || ''} ${p.category || ''} ${p.department || ''} ${p.description || ''}`.toLowerCase();
        return full.includes(q);
      });
    }

    if (countBadge) {
      countBadge.innerText = `${list.length} Products`;
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-12 text-center font-mono text-secondary">
          No products found matching filters.
        </div>
      `;
      return;
    }

    list.slice(0, 48).forEach(p => {
      const card = document.createElement('div');
      card.className = 'industrial-card p-5 flex flex-col justify-between border-2 ' + 
        (p.hasOverrides ? 'border-amber-500/80 bg-amber-950/10' : 'border-secondary/70 hover:border-primary') + ' transition-all';
      
      const badge = p.badge || (p.inStock ? 'IN STOCK' : 'OUT OF STOCK');
      const imgSrc = this.getAssetUrl(p.image) || this.getAssetUrl('assets/images/coast_airbrush_logo.jpg');

      card.innerHTML = `
        <div>
          <div class="flex justify-between items-start mb-2 gap-2">
            <span class="metal-spec-plate-red text-[10px] font-bold truncate max-w-[140px]">${p.sku || p.id}</span>
            <span class="font-mono text-[10px] font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 border border-amber-500/40 truncate">${p.brand || 'Coast'}</span>
          </div>

          <div class="flex gap-3 my-2">
            <div class="w-16 h-16 bg-surface-container-lowest border border-secondary flex-shrink-0 flex items-center justify-center p-1">
              <img src="${imgSrc}" alt="${p.name}" class="w-full h-full object-contain" onerror="this.src='${this.getAssetUrl('assets/images/coast_airbrush_logo.jpg')}'">
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-headline text-xs uppercase text-white font-bold line-clamp-2 mb-1">${p.name}</h4>
              <div class="font-mono text-[10px] text-primary/80 font-bold truncate">${p.department || 'Automotive & Custom Paint'}</div>
              <div class="font-mono text-[10px] text-secondary truncate">${p.category || 'General'}</div>
              <div class="font-mono text-xs font-bold text-primary mt-1">&euro;${(p.priceEur || 0).toFixed(2)} / &pound;${(p.priceGbp || 0).toFixed(2)}</div>
            </div>
          </div>

          <div class="p-2 bg-surface-dim rounded border border-secondary/40 text-[10px] font-mono text-secondary mb-3 space-y-1">
            <div class="flex justify-between">
              <span>Status:</span>
              <span class="${p.inStock ? 'text-emerald-400' : 'text-rose-400'} font-bold">${p.inStock ? 'In Stock' : 'Out of Stock'}</span>
            </div>
            <div class="flex justify-between">
              <span>Badge:</span>
              <span class="text-white truncate max-w-[160px]">${badge}</span>
            </div>
            ${p.meta ? `<div class="flex justify-between"><span>Nozzle / PSI:</span> <span class="text-white">${p.meta.recommendedNozzle || '0.3mm'} / ${p.meta.recommendedPressure || '25 PSI'}</span></div>` : ''}
          </div>

          <p class="font-mono text-[11px] text-secondary line-clamp-2 mb-3">${p.description || 'No description provided.'}</p>
        </div>

        <div class="flex gap-2 pt-3 border-t border-secondary/40">
          <button onclick="window.paintApp.openAdminProductModal('${p.id}')" class="flex-1 font-mono text-xs border border-primary bg-primary/20 text-white font-bold py-1.5 hover:bg-primary/30 transition-all flex items-center justify-center gap-1">
            <span class="material-symbols-outlined text-[14px]">edit_note</span> EDIT FIELDS
          </button>
          <button onclick="window.paintApp.quickGeminiCopy('${p.id}')" class="font-mono text-xs border border-amber-500/60 bg-amber-950/30 text-amber-300 hover:bg-amber-900/50 py-1.5 px-2.5 transition-all flex items-center justify-center" title="Quick Gemini Copy">
            <span class="material-symbols-outlined text-[14px]">auto_awesome</span>
          </button>
        </div>
      `;

      container.appendChild(card);
    });
  }

  openAdminProductModal(productId = null) {
    const modal = document.getElementById('modal-admin-product-edit');
    const title = document.getElementById('modal-product-edit-title');
    const idInput = document.getElementById('form-product-id');
    const nameInput = document.getElementById('form-product-name');
    const skuInput = document.getElementById('form-product-sku');
    const deptInput = document.getElementById('form-product-department');
    const brandInput = document.getElementById('form-product-brand');
    const catInput = document.getElementById('form-product-category');
    const priceEurInput = document.getElementById('form-product-price-eur');
    const priceGbpInput = document.getElementById('form-product-price-gbp');
    const badgeInput = document.getElementById('form-product-badge');
    const imageInput = document.getElementById('form-product-image');
    const inStockInput = document.getElementById('form-product-instock');
    const isPreOrderInput = document.getElementById('form-product-ispreorder');
    const descInput = document.getElementById('form-product-description');
    const sizesInput = document.getElementById('form-product-sizes');
    const packSizesInput = document.getElementById('form-product-packsizes');
    const sgInput = document.getElementById('form-product-meta-sg');
    const nozzleInput = document.getElementById('form-product-meta-nozzle');
    const psiInput = document.getElementById('form-product-meta-psi');

    if (!modal) return;

    let p = null;
    if (productId) {
      const all = this.app.getEffectiveProducts();
      p = all.find(item => item.id === productId) || ECOM_CATALOG.find(item => item.id === productId);
      if (p && this.app.spreadsheetState.stagedEdits.has(productId)) {
        const staged = this.app.spreadsheetState.stagedEdits.get(productId);
        p = {
          ...p,
          ...staged,
          meta: { ...(p.meta || {}), ...(staged.meta || {}) }
        };
      }
    }

    const btnReset = document.getElementById('btn-admin-product-reset-overrides');
    const btnDel = document.getElementById('btn-admin-product-delete-permanent');
    const btnDup = document.getElementById('btn-admin-product-duplicate-modal');

    if (p) {
      if (title) title.innerText = `Edit Product Fields: ${p.name}`;
      if (idInput) idInput.value = p.id;
      if (nameInput) nameInput.value = p.name || '';
      if (skuInput) skuInput.value = p.sku || '';
      if (deptInput) deptInput.value = p.department || this.app.getDefaultDepartmentForProduct(p);
      if (brandInput) brandInput.value = p.brand || '';
      if (catInput) catInput.value = p.category || '';
      if (priceEurInput) priceEurInput.value = p.priceEur || 0;
      if (priceGbpInput) priceGbpInput.value = p.priceGbp || 0;
      if (badgeInput) badgeInput.value = p.badge || '';
      if (imageInput) imageInput.value = p.image || '';
      if (inStockInput) inStockInput.checked = p.inStock !== false;
      if (isPreOrderInput) isPreOrderInput.checked = Boolean(p.isPreOrder);
      if (descInput) descInput.value = p.description || '';
      if (sizesInput) sizesInput.value = (p.sizes || []).join(', ');
      if (packSizesInput) packSizesInput.value = (p.packSizes || []).join(', ');
      if (sgInput) sgInput.value = p.meta?.specificGravity || 1.0;
      if (nozzleInput) nozzleInput.value = p.meta?.recommendedNozzle || '0.3mm - 0.5mm';
      if (psiInput) psiInput.value = p.meta?.recommendedPressure || '20-25 PSI';

      if (btnReset) btnReset.style.display = p.hasOverrides ? 'inline-flex' : 'none';
      if (btnDel) btnDel.style.display = 'inline-flex';
      if (btnDup) btnDup.style.display = 'inline-flex';
    } else {
      const newId = `custom_prod_${Date.now()}`;
      if (title) title.innerText = "Create New Product";
      if (idInput) idInput.value = newId;
      if (nameInput) nameInput.value = '';
      if (skuInput) skuInput.value = `CAE-${Date.now().toString().slice(-4)}`;
      if (deptInput) deptInput.value = 'Automotive & Custom Paint';
      if (brandInput) brandInput.value = 'Kroma Edge';
      if (catInput) catInput.value = 'Mirror Chrome Systems';
      if (priceEurInput) priceEurInput.value = '99.00';
      if (priceGbpInput) priceGbpInput.value = '85.00';
      if (badgeInput) badgeInput.value = 'NEW RELEASE';
      if (imageInput) imageInput.value = 'assets/images/kroma-helmet-mirror.jpg';
      if (inStockInput) inStockInput.checked = true;
      if (isPreOrderInput) isPreOrderInput.checked = false;
      if (descInput) descInput.value = '';
      if (sizesInput) sizesInput.value = '500mL, 1 Litre';
      if (packSizesInput) packSizesInput.value = 'Standard Kit';
      if (sgInput) sgInput.value = 0.98;
      if (nozzleInput) nozzleInput.value = '0.3mm - 0.5mm';
      if (psiInput) psiInput.value = '20-25 PSI';

      if (btnReset) btnReset.style.display = 'none';
      if (btnDel) btnDel.style.display = 'none';
      if (btnDup) btnDup.style.display = 'none';
    }

    modal.classList.add('active');
  }

  closeAdminProductModal() {
    const modal = document.getElementById('modal-admin-product-edit');
    if (modal) modal.classList.remove('active');
  }

  saveAdminProductFromModal() {
    const idInput = document.getElementById('form-product-id');
    const nameInput = document.getElementById('form-product-name');
    const skuInput = document.getElementById('form-product-sku');
    const deptInput = document.getElementById('form-product-department');
    const brandInput = document.getElementById('form-product-brand');
    const catInput = document.getElementById('form-product-category');
    const priceEurInput = document.getElementById('form-product-price-eur');
    const priceGbpInput = document.getElementById('form-product-price-gbp');
    const badgeInput = document.getElementById('form-product-badge');
    const imageInput = document.getElementById('form-product-image');
    const inStockInput = document.getElementById('form-product-instock');
    const isPreOrderInput = document.getElementById('form-product-ispreorder');
    const descInput = document.getElementById('form-product-description');
    const sizesInput = document.getElementById('form-product-sizes');
    const packSizesInput = document.getElementById('form-product-packsizes');
    const sgInput = document.getElementById('form-product-meta-sg');
    const nozzleInput = document.getElementById('form-product-meta-nozzle');
    const psiInput = document.getElementById('form-product-meta-psi');

    if (!idInput || !nameInput || !nameInput.value.trim()) {
      this.app.showToast("Please provide a product title.", "warning");
      return;
    }

    const productId = idInput.value.trim();
    const sizes = (sizesInput ? sizesInput.value : '').split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    const packSizes = (packSizesInput ? packSizesInput.value : '').split(/[\n,]+/).map(p => p.trim()).filter(Boolean);

    const updatedFields = {
      name: nameInput.value.trim(),
      sku: skuInput ? skuInput.value.trim() : '',
      department: deptInput ? deptInput.value.trim() : 'Automotive & Custom Paint',
      brand: brandInput ? brandInput.value.trim() : 'Coast Airbrush',
      category: catInput ? catInput.value.trim() : 'General',
      priceEur: parseFloat(priceEurInput ? priceEurInput.value : 0) || 0,
      priceGbp: parseFloat(priceGbpInput ? priceGbpInput.value : 0) || 0,
      badge: badgeInput ? badgeInput.value.trim() : '',
      image: imageInput ? imageInput.value.trim() : '',
      inStock: inStockInput ? inStockInput.checked : true,
      isPreOrder: isPreOrderInput ? isPreOrderInput.checked : false,
      description: descInput ? descInput.value.trim() : '',
      sizes: sizes,
      packSizes: packSizes,
      hasOptions: sizes.length > 0 || packSizes.length > 0,
      meta: {
        specificGravity: parseFloat(sgInput ? sgInput.value : 1.0) || 1.0,
        recommendedNozzle: nozzleInput ? nozzleInput.value.trim() : '0.3mm - 0.5mm',
        recommendedPressure: psiInput ? psiInput.value.trim() : '20-25 PSI'
      }
    };

    this.app.adminController.saveProductOverride(productId, updatedFields);
    
    // Clear staged edits for this product now that it is saved
    if (this.app.spreadsheetState.stagedEdits.has(productId)) {
      this.app.spreadsheetState.stagedEdits.delete(productId);
    }

    // Also sync in-memory ECOM_CATALOG runtime copy if matching
    const catIdx = ECOM_CATALOG.findIndex(p => p.id === productId);
    if (catIdx >= 0) {
      ECOM_CATALOG[catIdx] = { 
        ...ECOM_CATALOG[catIdx], 
        ...updatedFields,
        meta: { ...(ECOM_CATALOG[catIdx].meta || {}), ...(updatedFields.meta || {}) }
      };
    } else {
      ECOM_CATALOG.unshift({ id: productId, ...updatedFields });
    }

    this.closeAdminProductModal();
    this.renderAdminProducts();
    this.app.renderAdminSpreadsheet();
    this.app.renderStorefrontGrid();
    this.app.showToast(`✅ Product "${updatedFields.name}" saved and synchronized!`, 'success');
  }

  duplicateAdminProductFromModal() {
    const idInput = document.getElementById('form-product-id');
    if (!idInput) return;
    const prodId = idInput.value.trim();
    this.closeAdminProductModal();
    this.app.copySpreadsheetProduct(prodId);
  }

  async deleteAdminProductPermanentlyFromModal() {
    const idInput = document.getElementById('form-product-id');
    const nameInput = document.getElementById('form-product-name');
    const skuInput = document.getElementById('form-product-sku');
    if (!idInput) return;

    const prodId = idInput.value.trim();
    const prodName = nameInput ? nameInput.value.trim() : prodId;
    const prodSku = skuInput ? skuInput.value.trim() : '';

    const confirmed = await this.app.confirmDialog({
      title: 'Delete Product',
      subtitle: 'Catalog Deletion Confirmation',
      message: `Are you sure you want to permanently delete this product from Coast Airbrush Europe?`,
      itemDetails: `
        <div class="font-bold text-white text-xs mb-1">${this.escapeHtml(prodName)}</div>
        <div class="text-zinc-400 text-[11px]">SKU: <span class="text-primary font-bold">${this.escapeHtml(prodSku || prodId)}</span></div>
      `,
      confirmText: 'Delete Product',
      isDanger: true,
      icon: 'delete'
    });

    if (!confirmed) return;

    const all = this.app.getEffectiveProducts();
    const product = all.find(p => p.id === prodId) || ECOM_CATALOG.find(p => p.id === prodId) || { id: prodId, name: prodName, sku: prodSku };

    this.app.spreadsheetState.stagedEdits.delete(prodId);
    this.app.spreadsheetState.selectedIds.delete(prodId);

    const catIdx = ECOM_CATALOG.findIndex(p => p.id === prodId);
    if (catIdx >= 0) {
      ECOM_CATALOG.splice(catIdx, 1);
    }

    this.app.adminController.deleteProduct(prodId, product);

    this.closeAdminProductModal();
    this.renderAdminProducts();
    this.app.renderAdminSpreadsheet();
    this.app.renderStorefrontGrid();
    this.app.updateTrashBadgeCount();
    this.app.showToast(`🗑️ Product "${prodName}" deleted from catalog.`, 'danger');
  }

  async resetAdminProductOverridesFromModal() {
    const idInput = document.getElementById('form-product-id');
    if (!idInput) return;
    const prodId = idInput.value.trim();

    const confirmed = await this.app.confirmDialog({
      title: 'Reset Overrides',
      subtitle: 'Restore Factory Catalog Defaults',
      message: `Reset custom overrides for product "${prodId}" back to factory defaults?`,
      confirmText: 'Reset Overrides',
      isDanger: false,
      icon: 'history'
    });

    if (!confirmed) return;

    this.app.adminController.deleteProductOverride(prodId);
    if (this.app.spreadsheetState.stagedEdits.has(prodId)) {
      this.app.spreadsheetState.stagedEdits.delete(prodId);
    }

    this.closeAdminProductModal();
    this.renderAdminProducts();
    this.app.renderAdminSpreadsheet();
    this.app.renderStorefrontGrid();
    this.app.showToast(`✅ Product "${prodId}" reset to catalog defaults.`, 'info');
  }

  deleteAdminProductFromModal() {
    this.resetAdminProductOverridesFromModal();
  }

  getDefaultDepartmentForProduct(p) {
    if (p && p.department) return p.department;
    const cat = ((p && p.category) || '').toLowerCase();
    const brand = ((p && p.brand) || '').toLowerCase();
    const name = ((p && p.name) || '').toLowerCase();

    if (cat.includes('gun') || cat.includes('accessories') || cat.includes('hardware') || cat.includes('equipment') || name.includes('gun') || name.includes('airbrush')) {
      return 'Equipment & Hardware';
    }
    if (cat.includes('flake') || cat.includes('glitter') || cat.includes('pearl') || cat.includes('special effects') || brand.includes('flake king')) {
      return 'Special Effects & Flakes';
    }
    if (cat.includes('masking') || cat.includes('prep') || cat.includes('tape') || cat.includes('film') || cat.includes('sand') || cat.includes('solvent') || cat.includes('reducer') || cat.includes('cleaner')) {
      return 'Consumables & Prep';
    }
    if (cat.includes('merch') || cat.includes('apparel') || cat.includes('shirt') || cat.includes('hat') || cat.includes('art') || cat.includes('book')) {
      return 'Studio & Merchandise';
    }
    return 'Automotive & Custom Paint';
  }

  getEffectiveProducts() {
    const adminController = this.app.adminController;
    const overrides = (adminController && adminController.config && adminController.config.productOverrides) || {};
    const deletedIds = (adminController && typeof adminController.getDeletedProductIds === 'function') ? adminController.getDeletedProductIds() : [];
    return ECOM_CATALOG
      .filter(p => !deletedIds.includes(p.id))
      .map(p => {
        const o = overrides[p.id] || {};
        const baseDept = p.department || this.getDefaultDepartmentForProduct(p);
        return {
          ...p,
          department: o.department || baseDept,
          ...o,
          originalProduct: p,
          hasOverrides: Object.keys(o).length > 0
        };
      });
  }
}
