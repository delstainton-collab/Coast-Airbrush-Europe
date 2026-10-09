import { ECOM_CATALOG } from '../../../data/full_ecom_catalog.js';

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export class SpreadsheetBatchEngine {
  constructor(appRef) {
    this.app = appRef;
  }

  get spreadsheetState() {
    return this.app.spreadsheetState;
  }

  applyBatchPricePercentage(pct) {
    const targetProducts = this.spreadsheetState.selectedIds.size > 0 
      ? this.app.getEffectiveProducts().filter(p => this.spreadsheetState.selectedIds.has(p.id))
      : this.app.getFilteredSortedSpreadsheetProducts();

    if (targetProducts.length === 0) {
      this.app.showToast("No products available to modify.", "warning");
      return;
    }

    targetProducts.forEach(p => {
      const st = this.spreadsheetState.stagedEdits.get(p.id) || {};
      const curEur = (st.priceEur !== undefined) ? st.priceEur : (p.priceEur || 0);
      const curGbp = (st.priceGbp !== undefined) ? st.priceGbp : (p.priceGbp || 0);

      const newEur = Math.round(curEur * (1 + pct / 100) * 100) / 100;
      const newGbp = Math.round(curGbp * (1 + pct / 100) * 100) / 100;

      this.spreadsheetState.stagedEdits.set(p.id, {
        ...st,
        priceEur: Math.max(0, newEur),
        priceGbp: Math.max(0, newGbp)
      });
    });

    this.app.renderAdminSpreadsheet();
    this.app.showToast(`Applied ${pct > 0 ? '+' : ''}${pct}% price adjustment across ${targetProducts.length} product(s). Click "SAVE ALL CHANGES" to commit.`, 'info');
  }

  applyBatchCurrencySync(rate, rounding) {
    const targetProducts = this.spreadsheetState.selectedIds.size > 0 
      ? this.app.getEffectiveProducts().filter(p => this.spreadsheetState.selectedIds.has(p.id))
      : this.app.getFilteredSortedSpreadsheetProducts();

    if (targetProducts.length === 0) {
      this.app.showToast("No products available to modify.", "warning");
      return;
    }

    targetProducts.forEach(p => {
      const st = this.spreadsheetState.stagedEdits.get(p.id) || {};
      const curEur = (st.priceEur !== undefined) ? st.priceEur : (p.priceEur || 0);
      let calculatedGbp = curEur * rate;

      if (rounding !== 'none') {
        calculatedGbp = this.roundPriceTo(calculatedGbp, rounding);
      } else {
        calculatedGbp = Math.round(calculatedGbp * 100) / 100;
      }

      this.spreadsheetState.stagedEdits.set(p.id, {
        ...st,
        priceGbp: Math.max(0, calculatedGbp)
      });
    });

    this.app.renderAdminSpreadsheet();
    this.app.showToast(`Calculated GBP prices from EUR (rate: ${rate}) across ${targetProducts.length} product(s).`, 'info');
  }

  applyBatchRounding(rounding) {
    const targetProducts = this.spreadsheetState.selectedIds.size > 0 
      ? this.app.getEffectiveProducts().filter(p => this.spreadsheetState.selectedIds.has(p.id))
      : this.app.getFilteredSortedSpreadsheetProducts();

    targetProducts.forEach(p => {
      const st = this.spreadsheetState.stagedEdits.get(p.id) || {};
      const curEur = (st.priceEur !== undefined) ? st.priceEur : (p.priceEur || 0);
      const curGbp = (st.priceGbp !== undefined) ? st.priceGbp : (p.priceGbp || 0);

      this.spreadsheetState.stagedEdits.set(p.id, {
        ...st,
        priceEur: this.roundPriceTo(curEur, rounding),
        priceGbp: this.roundPriceTo(curGbp, rounding)
      });
    });

    this.app.renderAdminSpreadsheet();
    this.app.showToast(`Applied ${rounding} rounding across ${targetProducts.length} product(s).`, 'info');
  }

  roundPriceTo(price, suffix) {
    if (price <= 0) return 0;
    const integerPart = Math.floor(price);
    if (suffix === '.95') return integerPart + 0.95;
    if (suffix === '.99') return integerPart + 0.99;
    if (suffix === '.50') return integerPart + 0.50;
    if (suffix === '.00') return Math.round(price);
    return Math.round(price * 100) / 100;
  }

  applyBatchTaxonomy(dept, category, brand) {
    const targetProducts = this.spreadsheetState.selectedIds.size > 0 
      ? this.app.getEffectiveProducts().filter(p => this.spreadsheetState.selectedIds.has(p.id))
      : this.app.getFilteredSortedSpreadsheetProducts();

    targetProducts.forEach(p => {
      const st = this.spreadsheetState.stagedEdits.get(p.id) || {};
      if (dept) st.department = dept;
      if (category) st.category = category;
      if (brand) st.brand = brand;
      this.spreadsheetState.stagedEdits.set(p.id, st);
    });

    this.app.renderAdminSpreadsheet();
    this.app.showToast(`Updated Taxonomy for ${targetProducts.length} product(s).`, 'info');
  }

  applyBatchStock(inStock) {
    const targetProducts = this.spreadsheetState.selectedIds.size > 0 
      ? this.app.getEffectiveProducts().filter(p => this.spreadsheetState.selectedIds.has(p.id))
      : this.app.getFilteredSortedSpreadsheetProducts();

    targetProducts.forEach(p => {
      const st = this.spreadsheetState.stagedEdits.get(p.id) || {};
      st.inStock = inStock;
      this.spreadsheetState.stagedEdits.set(p.id, st);
    });

    this.app.renderAdminSpreadsheet();
    this.app.showToast(`Marked ${targetProducts.length} product(s) as ${inStock ? 'IN STOCK' : 'OUT OF STOCK'}.`, 'info');
  }

  applyBatchBadge(badgeText) {
    const targetProducts = this.spreadsheetState.selectedIds.size > 0 
      ? this.app.getEffectiveProducts().filter(p => this.spreadsheetState.selectedIds.has(p.id))
      : this.app.getFilteredSortedSpreadsheetProducts();

    targetProducts.forEach(p => {
      const st = this.spreadsheetState.stagedEdits.get(p.id) || {};
      st.badge = badgeText;
      this.spreadsheetState.stagedEdits.set(p.id, st);
    });

    this.app.renderAdminSpreadsheet();
    this.app.showToast(`Applied promotional badge "${badgeText}" to ${targetProducts.length} product(s).`, 'info');
  }

  saveSpreadsheetEdits() {
    const staged = this.spreadsheetState.stagedEdits;
    if (staged.size === 0) return;

    const overridesMap = {};
    for (const [prodId, fields] of staged.entries()) {
      overridesMap[prodId] = fields;
    }

    this.app.adminController.saveProductOverridesBulk(overridesMap);

    for (const [prodId, fields] of staged.entries()) {
      const catIdx = ECOM_CATALOG.findIndex(p => p.id === prodId);
      if (catIdx >= 0) {
        ECOM_CATALOG[catIdx] = { 
          ...ECOM_CATALOG[catIdx], 
          ...fields,
          meta: { ...(ECOM_CATALOG[catIdx].meta || {}), ...(fields.meta || {}) }
        };
      } else {
        ECOM_CATALOG.unshift({ id: prodId, ...fields });
      }
    }

    this.spreadsheetState.stagedEdits.clear();
    this.app.renderAdminSpreadsheet();
    this.app.renderAdminProducts();
    this.app.renderStorefrontGrid();
    this.app.showToast(`✅ Successfully saved and synchronized all product changes across Coast Airbrush Europe!`, 'success');
  }

  async discardSpreadsheetEdits() {
    const count = this.spreadsheetState.stagedEdits.size;
    if (count === 0) return;

    const confirmed = await this.app.confirmDialog({
      title: 'Discard Changes',
      subtitle: 'Spreadsheet Modifications',
      message: `Discard all pending unsaved spreadsheet modifications across <strong class="text-amber-400">${count} product(s)</strong>?`,
      confirmText: 'Discard Changes',
      isDanger: true,
      icon: 'undo'
    });

    if (confirmed) {
      this.spreadsheetState.stagedEdits.clear();
      this.app.renderAdminSpreadsheet();
      this.app.showToast("Pending spreadsheet modifications discarded.", "info");
    }
  }

  revertSpreadsheetRow(prodId) {
    if (this.spreadsheetState.stagedEdits.has(prodId)) {
      this.spreadsheetState.stagedEdits.delete(prodId);
    }
    if (this.app.adminController.config.productOverrides && this.app.adminController.config.productOverrides[prodId]) {
      this.app.adminController.deleteProductOverride(prodId);
    }
    this.app.renderAdminSpreadsheet();
    this.app.renderAdminProducts();
    this.app.renderStorefrontGrid();
    this.app.showToast(`Reverted changes for row.`, "info");
  }

  copySpreadsheetProduct(productId) {
    const all = this.app.getEffectiveProducts();
    let original = all.find(p => p.id === productId);
    if (!original) {
      original = ECOM_CATALOG.find(p => p.id === productId);
    }
    if (!original) {
      this.app.showToast("Product not found to duplicate.", "danger");
      return;
    }

    const staged = this.spreadsheetState.stagedEdits.get(productId) || {};
    const baseObj = {
      ...original,
      ...staged,
      meta: { ...(original.meta || {}), ...(staged.meta || {}) }
    };

    const newId = `custom_prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    let baseSku = (baseObj.sku || `CAE-${Date.now().toString().slice(-4)}`).trim();
    let newSku;
    if (baseSku.includes('-COPY')) {
      const match = baseSku.match(/-COPY-?(\d+)?$/);
      const copyNum = match && match[1] ? parseInt(match[1], 10) + 1 : 2;
      newSku = baseSku.replace(/-COPY-?(\d+)?$/, `-COPY-${copyNum}`);
    } else {
      newSku = `${baseSku}-COPY`;
    }

    let baseName = (baseObj.name || 'Custom Product').trim();
    let newName;
    if (baseName.includes('(Copy')) {
      const match = baseName.match(/\(Copy\s*(\d+)?\)$/);
      const copyNum = match && match[1] ? parseInt(match[1], 10) + 1 : 2;
      newName = baseName.replace(/\(Copy\s*(\d+)?\)$/, `(Copy ${copyNum})`);
    } else {
      newName = `${baseName} (Copy)`;
    }

    const clonedProduct = {
      ...baseObj,
      id: newId,
      sku: newSku,
      name: newName,
      department: baseObj.department || 'Automotive & Custom Paint',
      brand: baseObj.brand || 'Kroma Edge',
      category: baseObj.category || 'General',
      priceEur: parseFloat(baseObj.priceEur || 0) || 0,
      priceGbp: parseFloat(baseObj.priceGbp || 0) || 0,
      inStock: baseObj.inStock !== false,
      isPreOrder: Boolean(baseObj.isPreOrder),
      badge: baseObj.badge ? `${baseObj.badge}` : 'COPY',
      image: baseObj.image || 'assets/images/kroma-helmet-mirror.jpg',
      description: baseObj.description || '',
      sizes: Array.isArray(baseObj.sizes) ? [...baseObj.sizes] : ['500mL', '1 Litre'],
      packSizes: Array.isArray(baseObj.packSizes) ? [...baseObj.packSizes] : ['Standard Kit'],
      hasOptions: Boolean(baseObj.hasOptions),
      meta: {
        specificGravity: baseObj.meta?.specificGravity !== undefined ? baseObj.meta.specificGravity : 0.98,
        recommendedNozzle: baseObj.meta?.recommendedNozzle || '0.3mm - 0.5mm',
        recommendedPressure: baseObj.meta?.recommendedPressure || '20-25 PSI'
      }
    };

    this.spreadsheetState.stagedEdits.set(newId, clonedProduct);
    ECOM_CATALOG.unshift(clonedProduct);
    
    this.spreadsheetState.currentPage = 1;
    this.app.renderAdminSpreadsheet();

    setTimeout(() => {
      const row = document.getElementById(`ss-row-${newId}`);
      if (row) {
        row.classList.add('row-highlight-pulse');
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const nameInput = row.querySelector('[data-field="name"]');
        if (nameInput) {
          nameInput.focus();
          if (nameInput.select) nameInput.select();
        }
      }
    }, 150);

    this.app.showToast(`📋 Duplicated "${baseName}". Staged as unsaved edit.`, 'success', 4500);
  }

  copySelectedSpreadsheetProducts() {
    const selectedIds = Array.from(this.spreadsheetState.selectedIds);
    if (selectedIds.length === 0) {
      this.app.showToast("Please check at least one product row to duplicate.", "warning");
      return;
    }

    let count = 0;
    selectedIds.forEach(id => {
      this.copySpreadsheetProduct(id);
      count++;
    });

    this.spreadsheetState.selectedIds.clear();
    this.app.renderAdminSpreadsheet();
    this.app.showToast(`📋 Successfully duplicated ${count} product(s). Click "SAVE ALL CHANGES" when ready.`, 'success', 4500);
  }

  async deleteSpreadsheetProduct(productId) {
    const all = this.app.getEffectiveProducts();
    let product = all.find(p => p.id === productId) || ECOM_CATALOG.find(p => p.id === productId);
    
    if (!product && this.spreadsheetState.stagedEdits.has(productId)) {
      product = this.spreadsheetState.stagedEdits.get(productId);
    }
    if (!product) {
      this.app.showToast("Product not found.", "danger");
      return;
    }

    const confirmed = await this.app.confirmDialog({
      title: 'Delete Product',
      subtitle: 'Catalog Deletion Confirmation',
      message: `Are you sure you want to delete this product from Coast Airbrush Europe? It will be removed from all active store pages and catalog grids.`,
      itemDetails: `
        <div class="font-bold text-white text-xs mb-1">${escapeHtml(product.name || 'Unnamed Product')}</div>
        <div class="text-zinc-400 text-[11px]">SKU: <span class="text-primary font-bold">${escapeHtml(product.sku || product.id)}</span> | Dept: ${escapeHtml(product.department || 'Automotive')}</div>
        <div class="text-emerald-400 mt-1 font-bold text-[11px]">&euro;${(product.priceEur || 0).toFixed(2)} / &pound;${(product.priceGbp || 0).toFixed(2)}</div>
      `,
      confirmText: 'Delete Product',
      isDanger: true,
      icon: 'delete'
    });

    if (!confirmed) return;

    this.spreadsheetState.stagedEdits.delete(productId);
    this.spreadsheetState.selectedIds.delete(productId);

    const catIdx = ECOM_CATALOG.findIndex(p => p.id === productId);
    if (catIdx >= 0) {
      ECOM_CATALOG.splice(catIdx, 1);
    }

    this.app.adminController.deleteProduct(productId, product);

    this.app.renderAdminSpreadsheet();
    this.app.renderAdminProducts();
    this.app.renderStorefrontGrid();
    this.app.updateTrashBadgeCount();
    this.app.showToast(`🗑️ Deleted product "${product.name}". Moved to Trash.`, 'danger', 4000);
  }

  async deleteSelectedSpreadsheetProducts() {
    const selectedIds = Array.from(this.spreadsheetState.selectedIds);
    if (selectedIds.length === 0) {
      this.app.showToast("Please check at least one product row to delete.", "warning");
      return;
    }

    const confirmed = await this.app.confirmDialog({
      title: 'Bulk Delete Products',
      subtitle: 'Multiple Catalog Deletions',
      message: `Are you sure you want to remove <strong class="text-rose-400">${selectedIds.length} selected product(s)</strong> from Coast Airbrush Europe?`,
      confirmText: `Delete ${selectedIds.length} Products`,
      isDanger: true,
      icon: 'delete_sweep'
    });

    if (!confirmed) return;

    const all = this.app.getEffectiveProducts();
    const itemsToDelete = [];

    selectedIds.forEach(id => {
      const p = all.find(item => item.id === id) || ECOM_CATALOG.find(item => item.id === id) || { id };
      itemsToDelete.push(p);

      this.spreadsheetState.stagedEdits.delete(id);
      this.spreadsheetState.selectedIds.delete(id);

      const catIdx = ECOM_CATALOG.findIndex(item => item.id === id);
      if (catIdx >= 0) {
        ECOM_CATALOG.splice(catIdx, 1);
      }
    });

    this.app.adminController.deleteProductsBulk(itemsToDelete);

    this.app.renderAdminSpreadsheet();
    this.app.renderAdminProducts();
    this.app.renderStorefrontGrid();
    this.app.updateTrashBadgeCount();
    this.app.showToast(`🗑️ Deleted ${itemsToDelete.length} products from catalog.`, 'danger', 4000);
  }
}
