import { SpreadsheetBatchEngine } from './spreadsheetBatchEngine.js';
import { TrashModal } from './trashModal.js';
import { SpreadsheetCsvService } from './spreadsheetCsvService.js';

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return str.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function escapeHtmlAttr(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export class SpreadsheetEditor {
  constructor(appRef) {
    this.app = appRef;
    this.state = {
      currentPage: 1,
      pageSize: 50,
      sortField: 'sku',
      sortOrder: 'asc',
      searchQuery: '',
      departmentFilter: 'all',
      brandFilter: 'all',
      categoryFilter: 'all',
      stockFilter: 'all',
      modifiedFilter: 'all',
      selectedIds: new Set(),
      stagedEdits: new Map()
    };

    this.batchEngine = new SpreadsheetBatchEngine(this.app);
    this.trashModal = new TrashModal(this.app);
    this.csvService = new SpreadsheetCsvService(this.app);
  }

  get spreadsheetState() {
    return this.state;
  }

  setup() {
    // 1. Search & Filters
    const ssSearch = document.getElementById('admin-ss-search');
    if (ssSearch) {
      ssSearch.addEventListener('input', (e) => {
        this.state.searchQuery = e.target.value.trim().toLowerCase();
        this.state.currentPage = 1;
        this.renderAdminSpreadsheet();
      });
    }

    const ssDept = document.getElementById('admin-ss-filter-department');
    if (ssDept) {
      ssDept.addEventListener('change', (e) => {
        this.state.departmentFilter = e.target.value;
        this.state.currentPage = 1;
        this.renderAdminSpreadsheet();
      });
    }

    const ssBrand = document.getElementById('admin-ss-filter-brand');
    if (ssBrand) {
      ssBrand.addEventListener('change', (e) => {
        this.state.brandFilter = e.target.value;
        this.state.currentPage = 1;
        this.renderAdminSpreadsheet();
      });
    }

    const ssCat = document.getElementById('admin-ss-filter-category');
    if (ssCat) {
      ssCat.addEventListener('change', (e) => {
        this.state.categoryFilter = e.target.value;
        this.state.currentPage = 1;
        this.renderAdminSpreadsheet();
      });
    }

    const ssStock = document.getElementById('admin-ss-filter-stock');
    if (ssStock) {
      ssStock.addEventListener('change', (e) => {
        this.state.stockFilter = e.target.value;
        this.state.currentPage = 1;
        this.renderAdminSpreadsheet();
      });
    }

    const ssModified = document.getElementById('admin-ss-filter-modified');
    if (ssModified) {
      ssModified.addEventListener('change', (e) => {
        this.state.modifiedFilter = e.target.value;
        this.state.currentPage = 1;
        this.renderAdminSpreadsheet();
      });
    }

    const ssPageSize = document.getElementById('admin-ss-page-size');
    if (ssPageSize) {
      ssPageSize.addEventListener('change', (e) => {
        this.state.pageSize = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
        this.state.currentPage = 1;
        this.renderAdminSpreadsheet();
      });
    }

    this.app.addSafeListener('btn-spreadsheet-reset-filters', 'click', () => {
      this.state.searchQuery = '';
      this.state.departmentFilter = 'all';
      this.state.brandFilter = 'all';
      this.state.categoryFilter = 'all';
      this.state.stockFilter = 'all';
      this.state.modifiedFilter = 'all';
      this.state.currentPage = 1;

      if (ssSearch) ssSearch.value = '';
      if (ssDept) ssDept.value = 'all';
      if (ssBrand) ssBrand.value = 'all';
      if (ssCat) ssCat.value = 'all';
      if (ssStock) ssStock.value = 'all';
      if (ssModified) ssModified.value = 'all';

      this.renderAdminSpreadsheet();
    });

    // 2. Column Sorting Headers
    document.querySelectorAll('#admin-panel-spreadsheet th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.getAttribute('data-sort');
        if (this.state.sortField === field) {
          this.state.sortOrder = this.state.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          this.state.sortField = field;
          this.state.sortOrder = 'asc';
        }
        this.renderAdminSpreadsheet();
      });
    });

    // 3. Selection (Select All)
    const selectAllCb = document.getElementById('admin-ss-select-all');
    if (selectAllCb) {
      selectAllCb.addEventListener('change', (e) => {
        const filtered = this.getFilteredSortedSpreadsheetProducts();
        if (e.target.checked) {
          filtered.forEach(p => this.state.selectedIds.add(p.id));
        } else {
          this.state.selectedIds.clear();
        }
        this.renderAdminSpreadsheet();
      });
    }

    // 4. Pagination Buttons
    this.app.addSafeListener('btn-ss-page-first', 'click', () => {
      this.state.currentPage = 1;
      this.renderAdminSpreadsheet();
    });
    this.app.addSafeListener('btn-ss-page-prev', 'click', () => {
      if (this.state.currentPage > 1) {
        this.state.currentPage--;
        this.renderAdminSpreadsheet();
      }
    });
    this.app.addSafeListener('btn-ss-page-next', 'click', () => {
      const filtered = this.getFilteredSortedSpreadsheetProducts();
      const maxPage = this.state.pageSize === 'all' ? 1 : Math.ceil(filtered.length / this.state.pageSize);
      if (this.state.currentPage < maxPage) {
        this.state.currentPage++;
        this.renderAdminSpreadsheet();
      }
    });
    this.app.addSafeListener('btn-ss-page-last', 'click', () => {
      const filtered = this.getFilteredSortedSpreadsheetProducts();
      const maxPage = this.state.pageSize === 'all' ? 1 : Math.ceil(filtered.length / this.state.pageSize);
      this.state.currentPage = maxPage;
      this.renderAdminSpreadsheet();
    });

    // 5. Batch Drawer Toggle
    this.app.addSafeListener('btn-spreadsheet-toggle-batch', 'click', () => {
      const drawer = document.getElementById('spreadsheet-batch-tools-box');
      if (drawer) {
        drawer.classList.toggle('hidden');
      }
    });

    // 6. Batch Actions Execution
    this.app.addSafeListener('btn-batch-apply-pct', 'click', () => {
      const val = parseFloat(document.getElementById('batch-price-pct-input')?.value || 0);
      if (val === 0) {
        this.app.showToast("Please enter a non-zero percentage (e.g. 10 for +10% or -5 for -5%).", "warning");
        return;
      }
      this.applyBatchPricePercentage(val);
    });

    this.app.addSafeListener('btn-batch-sync-gbp-from-eur', 'click', () => {
      const rate = parseFloat(document.getElementById('batch-eur-gbp-rate')?.value || 0.85);
      const rounding = document.getElementById('batch-rounding-select')?.value || 'none';
      this.applyBatchCurrencySync(rate, rounding);
    });

    this.app.addSafeListener('btn-batch-apply-rounding', 'click', () => {
      const rounding = document.getElementById('batch-rounding-select')?.value || 'none';
      if (rounding === 'none') {
        this.app.showToast("Please choose a rounding rule (.95, .99, .50, .00).", "warning");
        return;
      }
      this.applyBatchRounding(rounding);
    });

    this.app.addSafeListener('btn-batch-apply-taxonomy', 'click', () => {
      const dept = document.getElementById('batch-department-select')?.value;
      const category = (document.getElementById('batch-category-input')?.value || '').trim();
      const brand = document.getElementById('batch-brand-select')?.value;
      if (!dept && !category && !brand) {
        this.app.showToast("Please choose at least a Department, Category, or Brand to apply.", "warning");
        return;
      }
      this.applyBatchTaxonomy(dept, category, brand);
    });

    this.app.addSafeListener('btn-batch-stock-in', 'click', () => this.applyBatchStock(true));
    this.app.addSafeListener('btn-batch-stock-out', 'click', () => this.applyBatchStock(false));

    this.app.addSafeListener('btn-batch-apply-badge', 'click', () => {
      const badge = (document.getElementById('batch-badge-input')?.value || '').trim();
      this.applyBatchBadge(badge);
    });

    // Batch Duplicate & Delete
    this.app.addSafeListener('btn-batch-duplicate-selected', 'click', () => this.copySelectedSpreadsheetProducts());
    this.app.addSafeListener('btn-batch-delete-selected', 'click', () => this.deleteSelectedSpreadsheetProducts());

    // Trash & Restoration Modal
    this.app.addSafeListener('btn-spreadsheet-view-trash', 'click', () => this.openTrashModal());
    this.app.addSafeListener('btn-close-trash-modal', 'click', () => this.closeTrashModal());
    this.app.addSafeListener('btn-trash-close', 'click', () => this.closeTrashModal());
    this.app.addSafeListener('btn-trash-restore-all', 'click', () => this.restoreAllTrashProducts());

    // Product Matrix Modal Listeners
    this.app.addSafeListener('btn-matrix-modal-close', 'click', () => this.app.closeProductMatrixModal());
    this.app.addSafeListener('btn-matrix-cancel', 'click', () => this.app.closeProductMatrixModal());
    this.app.addSafeListener('btn-matrix-generate', 'click', () => this.app.generateMatrixCombinations());
    this.app.addSafeListener('btn-matrix-apply-base-price', 'click', () => this.app.applyMatrixBasePriceToAll());
    this.app.addSafeListener('btn-matrix-apply-pct', 'click', () => {
      const pct = parseFloat(document.getElementById('matrix-bulk-pct')?.value || 0);
      if (pct === 0) {
        this.app.showToast("Please enter a non-zero percentage adjustment.", "warning");
        return;
      }
      this.app.applyMatrixPercentageAdjust(pct);
    });
    this.app.addSafeListener('btn-matrix-auto-skus', 'click', () => this.app.autoGenerateMatrixSkus());
    this.app.addSafeListener('btn-matrix-add-row', 'click', () => this.app.addSingleMatrixRow());
    this.app.addSafeListener('btn-matrix-reset-defaults', 'click', () => this.app.resetProductMatrixToDefaults());
    this.app.addSafeListener('btn-matrix-save', 'click', () => this.app.saveProductMatrixFromModal());
    this.app.addSafeListener('btn-open-matrix-from-edit-modal', 'click', () => {
      const idInput = document.getElementById('form-product-id');
      if (idInput && idInput.value) {
        const prodId = idInput.value.trim();
        this.app.closeAdminProductModal();
        this.app.openProductMatrixModal(prodId);
      }
    });

    // 7. Global Save & Discard
    this.app.addSafeListener('btn-spreadsheet-save-all', 'click', () => this.saveSpreadsheetEdits());
    this.app.addSafeListener('btn-spreadsheet-discard', 'click', () => this.discardSpreadsheetEdits());

    // 8. Add Product Row
    this.app.addSafeListener('btn-spreadsheet-add-row', 'click', () => this.addSpreadsheetProductRow());

    // 9. CSV Export & Import
    this.app.addSafeListener('btn-spreadsheet-export-csv', 'click', () => this.exportSpreadsheetCsv());
    this.app.addSafeListener('btn-spreadsheet-import-csv-trigger', 'click', () => {
      const input = document.getElementById('input-spreadsheet-import-file');
      if (input) input.click();
    });

    const csvFileInput = document.getElementById('input-spreadsheet-import-file');
    if (csvFileInput) {
      csvFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        this.importSpreadsheetCsv(file);
        csvFileInput.value = '';
      });
    }
  }

  getProductPricingSummary(p) {
    let pricesEur = [];
    let pricesGbp = [];
    let variantsDetail = [];

    if (p.variantMatrix && Array.isArray(p.variantMatrix.variants) && p.variantMatrix.variants.length > 0) {
      p.variantMatrix.variants.forEach(v => {
        const eur = v.priceEur !== undefined ? parseFloat(v.priceEur) : null;
        const gbp = v.priceGbp !== undefined ? parseFloat(v.priceGbp) : null;
        if (eur !== null && !isNaN(eur)) pricesEur.push(eur);
        if (gbp !== null && !isNaN(gbp)) pricesGbp.push(gbp);
        const optStr = v.options ? Object.values(v.options).join(' / ') : (v.name || v.sku);
        variantsDetail.push({ label: optStr, eur: eur, gbp: gbp });
      });
    } else if (p.packPriceMatrix && Array.isArray(p.packPriceMatrix) && p.packPriceMatrix.length > 0) {
      p.packPriceMatrix.forEach(m => {
        const eur = m.priceEur !== undefined ? parseFloat(m.priceEur) : (m.priceRetailEur !== undefined ? parseFloat(m.priceRetailEur) : null);
        const gbp = m.priceGbp !== undefined ? parseFloat(m.priceGbp) : (m.priceRetailGbp !== undefined ? parseFloat(m.priceRetailGbp) : null);
        if (eur !== null && !isNaN(eur)) pricesEur.push(eur);
        if (gbp !== null && !isNaN(gbp)) pricesGbp.push(gbp);
        variantsDetail.push({ label: m.packSize || 'Pack', eur: eur, gbp: gbp });
      });
    } else if (p.tapePriceMatrix && Array.isArray(p.tapePriceMatrix) && p.tapePriceMatrix.length > 0) {
      p.tapePriceMatrix.forEach(t => {
        const gbp = t.priceGbp !== undefined ? parseFloat(t.priceGbp) : null;
        const eur = t.priceEur !== undefined ? parseFloat(t.priceEur) : (gbp ? parseFloat((gbp / 0.85).toFixed(2)) : null);
        if (eur !== null && !isNaN(eur)) pricesEur.push(eur);
        if (gbp !== null && !isNaN(gbp)) pricesGbp.push(gbp);
        variantsDetail.push({ label: t.width || 'Width', eur: eur, gbp: gbp });
      });
    } else if (p.fullMatrixPricing && Array.isArray(p.fullMatrixPricing) && p.fullMatrixPricing.length > 0) {
      p.fullMatrixPricing.forEach(m => {
        const gbp = m.priceGbp !== undefined ? parseFloat(m.priceGbp) : null;
        const eur = m.priceEur !== undefined ? parseFloat(m.priceEur) : (gbp ? parseFloat((gbp / 0.85).toFixed(2)) : null);
        if (eur !== null && !isNaN(eur)) pricesEur.push(eur);
        if (gbp !== null && !isNaN(gbp)) pricesGbp.push(gbp);
        const label = [m.flakeSize || m.rawFlakeSize, m.packSize || m.rawPackSize].filter(Boolean).join(' - ') || 'Variant';
        variantsDetail.push({ label: label, eur: eur, gbp: gbp });
      });
    }

    const baseEur = (p.priceEur !== undefined && p.priceEur > 0 
      ? parseFloat(p.priceEur) 
      : (this.app.euLocalization?.convertGbpToEur ? this.app.euLocalization.convertGbpToEur(p.priceGbp || p.priceRrpExVat || 0) : 0)) || 0;
    const baseGbp = parseFloat(p.priceGbp !== undefined ? p.priceGbp : (p.priceRrpExVat || 0)) || 0;

    if (pricesEur.length === 0) pricesEur.push(baseEur);
    if (pricesGbp.length === 0) pricesGbp.push(baseGbp);

    const minEur = Math.min(...pricesEur);
    const maxEur = Math.max(...pricesEur);
    const minGbp = Math.min(...pricesGbp);
    const maxGbp = Math.max(...pricesGbp);

    const hasVariablePricing = (variantsDetail.length > 1) && (Math.abs(minEur - maxEur) > 0.01 || Math.abs(minGbp - maxGbp) > 0.01);

    const tooltipLines = variantsDetail.map(v => {
      const eStr = v.eur !== null && !isNaN(v.eur) ? `€${v.eur.toFixed(2)}` : 'N/A';
      const gStr = v.gbp !== null && !isNaN(v.gbp) ? `£${v.gbp.toFixed(2)}` : 'N/A';
      return `${v.label}: ${eStr} / ${gStr}`;
    });

    return {
      hasVariablePricing,
      variantCount: variantsDetail.length,
      variantsDetail,
      tooltip: tooltipLines.join('\n') + '\n(Click to edit individual variant prices in Matrix)',
      minEur,
      maxEur,
      minGbp,
      maxGbp,
      baseEur,
      baseGbp
    };
  }

  getFilteredSortedSpreadsheetProducts() {
    const list = this.app.getEffectiveProducts();
    const staged = this.state.stagedEdits;

    let working = list.map(p => {
      const st = staged.get(p.id);
      if (st) {
        return {
          ...p,
          ...st,
          meta: { ...(p.meta || {}), ...(st.meta || {}) },
          isStagedModified: true
        };
      }
      return {
        ...p,
        isStagedModified: false
      };
    });

    if (this.state.departmentFilter !== 'all') {
      working = working.filter(p => (p.department || '').toLowerCase() === this.state.departmentFilter.toLowerCase());
    }

    if (this.state.brandFilter !== 'all') {
      working = working.filter(p => (p.brand || '').toLowerCase() === this.state.brandFilter.toLowerCase());
    }

    if (this.state.categoryFilter !== 'all') {
      working = working.filter(p => (p.category || '').toLowerCase().includes(this.state.categoryFilter.toLowerCase()));
    }

    if (this.state.stockFilter === 'in_stock') {
      working = working.filter(p => p.inStock !== false);
    } else if (this.state.stockFilter === 'out_stock') {
      working = working.filter(p => p.inStock === false);
    }

    if (this.state.modifiedFilter === 'modified') {
      working = working.filter(p => p.isStagedModified);
    } else if (this.state.modifiedFilter === 'overridden') {
      working = working.filter(p => p.hasOverrides || p.isStagedModified);
    }

    if (this.state.searchQuery) {
      const q = this.state.searchQuery;
      working = working.filter(p => {
        const str = `${p.sku || ''} ${p.name || ''} ${p.department || ''} ${p.brand || ''} ${p.category || ''} ${p.subcategory || ''} ${p.chemistry || ''} ${p.paintStage || ''} ${p.badge || ''} ${p.meta?.recommendedNozzle || ''} ${p.description || ''}`.toLowerCase();
        return str.includes(q);
      });
    }

    const field = this.state.sortField;
    const order = this.state.sortOrder === 'asc' ? 1 : -1;

    working.sort((a, b) => {
      let valA = a[field];
      let valB = b[field];

      if (field === 'priceEur') {
        const summaryA = this.getProductPricingSummary(a);
        const summaryB = this.getProductPricingSummary(b);
        valA = summaryA.minEur;
        valB = summaryB.minEur;
        return (valA - valB) * order;
      }

      if (field === 'priceGbp') {
        const summaryA = this.getProductPricingSummary(a);
        const summaryB = this.getProductPricingSummary(b);
        valA = summaryA.minGbp;
        valB = summaryB.minGbp;
        return (valA - valB) * order;
      }

      valA = (valA || '').toString().toLowerCase();
      valB = (valB || '').toString().toLowerCase();
      if (valA < valB) return -1 * order;
      if (valA > valB) return 1 * order;
      return 0;
    });

    return working;
  }

  renderAdminSpreadsheet() {
    const tbody = document.getElementById('admin-spreadsheet-tbody');
    if (!tbody) return;

    const allProducts = this.app.getEffectiveProducts();
    const filtered = this.getFilteredSortedSpreadsheetProducts();
    const stagedCount = this.state.stagedEdits.size;
    const selectedCount = this.state.selectedIds.size;
    const overridesCount = Object.keys(this.app.adminController.config.productOverrides || {}).length;

    const totalEl = document.getElementById('metric-ss-total-count');
    if (totalEl) totalEl.innerText = `${allProducts.length} Items`;

    const visibleEl = document.getElementById('metric-ss-visible-count');
    if (visibleEl) visibleEl.innerText = `${filtered.length} Items`;

    const selectedEl = document.getElementById('metric-ss-selected-count');
    if (selectedEl) selectedEl.innerText = `${selectedCount} Selected`;

    const overridesEl = document.getElementById('metric-ss-overrides-count');
    if (overridesEl) overridesEl.innerText = `${overridesCount + stagedCount} Active/Staged`;

    const scopeLabel = document.getElementById('batch-scope-label');
    if (scopeLabel) {
      scopeLabel.innerText = selectedCount > 0 
        ? `Selected Rows (${selectedCount})` 
        : `All Filtered Products (${filtered.length})`;
    }

    this.updateTrashBadgeCount();
    const btnBatchDup = document.getElementById('btn-batch-duplicate-selected');
    if (btnBatchDup) {
      btnBatchDup.disabled = selectedCount === 0;
      btnBatchDup.style.opacity = selectedCount === 0 ? '0.5' : '1';
    }
    const btnBatchDel = document.getElementById('btn-batch-delete-selected');
    if (btnBatchDel) {
      btnBatchDel.disabled = selectedCount === 0;
      btnBatchDel.style.opacity = selectedCount === 0 ? '0.5' : '1';
    }

    const unsavedBadge = document.getElementById('ss-unsaved-badge');
    const unsavedCount = document.getElementById('ss-unsaved-count');
    const btnSave = document.getElementById('btn-spreadsheet-save-all');
    const btnDiscard = document.getElementById('btn-spreadsheet-discard');

    if (unsavedBadge) {
      if (stagedCount > 0) {
        unsavedBadge.classList.remove('hidden');
        unsavedBadge.innerText = `⚡ ${stagedCount} Unsaved Edit${stagedCount > 1 ? 's' : ''}`;
      } else {
        unsavedBadge.classList.add('hidden');
      }
    }

    if (unsavedCount) unsavedCount.innerText = stagedCount.toString();
    if (btnSave) btnSave.disabled = stagedCount === 0;
    if (btnDiscard) btnDiscard.disabled = stagedCount === 0;

    const pageSize = this.state.pageSize;
    const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(filtered.length / pageSize));
    if (this.state.currentPage > totalPages) {
      this.state.currentPage = totalPages;
    }
    const curPage = this.state.currentPage;

    let displayList = filtered;
    let startIdx = 0;
    let endIdx = filtered.length;

    if (pageSize !== 'all') {
      startIdx = (curPage - 1) * pageSize;
      endIdx = Math.min(startIdx + pageSize, filtered.length);
      displayList = filtered.slice(startIdx, endIdx);
    }

    const pageInfo = document.getElementById('ss-pagination-info');
    if (pageInfo) {
      pageInfo.innerText = filtered.length > 0 
        ? `Showing ${startIdx + 1} - ${endIdx} of ${filtered.length} products`
        : `Showing 0 products`;
    }

    const pageIndicator = document.getElementById('ss-page-current-indicator');
    if (pageIndicator) pageIndicator.innerText = `${curPage} / ${totalPages}`;

    const btnFirst = document.getElementById('btn-ss-page-first');
    const btnPrev = document.getElementById('btn-ss-page-prev');
    const btnNext = document.getElementById('btn-ss-page-next');
    const btnLast = document.getElementById('btn-ss-page-last');

    if (btnFirst) btnFirst.disabled = curPage <= 1;
    if (btnPrev) btnPrev.disabled = curPage <= 1;
    if (btnNext) btnNext.disabled = curPage >= totalPages;
    if (btnLast) btnLast.disabled = curPage >= totalPages;

    const selectAllCb = document.getElementById('admin-ss-select-all');
    if (selectAllCb) {
      const allSelected = displayList.length > 0 && displayList.every(p => this.state.selectedIds.has(p.id));
      selectAllCb.checked = allSelected;
    }

    const taxonomyDepts = (this.app.adminController.getDepartments() || []).map(d => d.name);
    const customDepts = Array.from(new Set(
      this.app.getEffectiveProducts().map(p => p.department).filter(Boolean)
    ));
    const departments = Array.from(new Set([...taxonomyDepts, ...customDepts]));
    this.app.syncTaxonomyDropdowns(departments);

    tbody.innerHTML = '';

    if (displayList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="19" class="p-8 text-center text-secondary font-mono">
            No products found matching current filters. Try resetting filters or adding a product row.
          </td>
        </tr>
      `;
      return;
    }

    const brands = [
      "Kroma Edge",
      "Flake King",
      "Ace of Shades",
      "VsionAir"
    ];

    displayList.forEach((p, index) => {
      const tr = document.createElement('tr');
      const isSelected = this.state.selectedIds.has(p.id);
      const isStaged = this.state.stagedEdits.has(p.id);
      const hasSavedOverride = Boolean(this.app.adminController.config.productOverrides && this.app.adminController.config.productOverrides[p.id]);

      tr.className = `transition-colors hover:bg-surface-container ${isSelected ? 'bg-primary/10' : (isStaged ? 'bg-amber-950/20' : (hasSavedOverride ? 'bg-amber-950/5' : ''))}`;
      tr.id = `ss-row-${p.id}`;

      const absIndex = startIdx + index + 1;
      const pricingSummary = this.getProductPricingSummary(p);
      const isVariable = pricingSummary.hasVariablePricing;

      const nozzleVal = p.meta?.recommendedNozzle || '0.3mm';
      const psiVal = p.meta?.recommendedPressure || '25 PSI';
      const sgVal = p.meta?.specificGravity !== undefined ? p.meta.specificGravity : 1.0;

      let matrixBadge = '';
      if (p.variantMatrix && p.variantMatrix.variants && p.variantMatrix.variants.length > 0) {
        const varCount = p.variantMatrix.variants.length;
        matrixBadge = `
          <button onclick="window.paintApp.openProductMatrixModal('${p.id}')" class="px-2 py-0.5 rounded ${isVariable ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30' : 'bg-primary/20 text-primary border-primary/50 hover:bg-primary/30'} border font-mono text-[10px] font-bold flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer" title="Manage ${varCount} Variants (${isVariable ? 'Variable Prices' : 'Fixed Price'})">
            <span class="material-symbols-outlined text-[12px]">grid_view</span> ${varCount} Variants
          </button>
        `;
      } else if (p.tapePriceMatrix && p.tapePriceMatrix.length > 0) {
        const count = p.tapePriceMatrix.length;
        matrixBadge = `
          <button onclick="window.paintApp.openProductMatrixModal('${p.id}')" class="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-mono text-[10px] font-bold flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer" title="Manage ${count} Widths (${isVariable ? 'Variable Prices' : 'Fixed Price'})">
            <span class="material-symbols-outlined text-[12px]">grid_view</span> ${count} Widths
          </button>
        `;
      } else if (p.fullMatrixPricing && p.fullMatrixPricing.length > 0) {
        const count = p.fullMatrixPricing.length;
        matrixBadge = `
          <button onclick="window.paintApp.openProductMatrixModal('${p.id}')" class="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 font-mono text-[10px] font-bold flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer" title="Manage ${count} Matrix Combinations (${isVariable ? 'Variable Prices' : 'Fixed Price'})">
            <span class="material-symbols-outlined text-[12px]">grid_view</span> ${count} Matrix
          </button>
        `;
      } else if (p.packPriceMatrix && p.packPriceMatrix.length > 0) {
        const count = p.packPriceMatrix.length;
        matrixBadge = `
          <button onclick="window.paintApp.openProductMatrixModal('${p.id}')" class="px-2 py-0.5 rounded ${isVariable ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 hover:bg-indigo-500/30' : 'bg-primary/20 text-primary border-primary/50 hover:bg-primary/30'} border font-mono text-[10px] font-bold flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer" title="Manage ${count} Pack Sizes (${isVariable ? 'Variable Prices' : 'Fixed Price'})">
            <span class="material-symbols-outlined text-[12px]">grid_view</span> ${count} Packs
          </button>
        `;
      } else if ((p.sizes && p.sizes.length > 0) || (p.packSizes && p.packSizes.length > 0)) {
        const cnt = (p.sizes?.length || 1) * (p.packSizes?.length || 1);
        matrixBadge = `
          <button onclick="window.paintApp.openProductMatrixModal('${p.id}')" class="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-mono text-[10px] font-bold flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer" title="Manage Options & Matrix (${isVariable ? 'Variable Prices' : 'Fixed Price'})">
            <span class="material-symbols-outlined text-[12px]">grid_view</span> ${cnt} Options
          </button>
        `;
      } else {
        matrixBadge = `
          <button onclick="window.paintApp.openProductMatrixModal('${p.id}')" class="px-1.5 py-0.5 rounded border border-dashed border-secondary/40 text-secondary hover:text-white hover:border-primary font-mono text-[10px] flex items-center justify-center gap-0.5 mx-auto transition-colors cursor-pointer" title="Add Variant Matrix">
            <span class="material-symbols-outlined text-[11px]">add</span> Matrix
          </button>
        `;
      }

      let priceEurCellHtml = '';
      let priceGbpCellHtml = '';

      if (isVariable) {
        priceEurCellHtml = `
          <div class="cursor-pointer group py-0.5 px-1 rounded hover:bg-emerald-950/40 border border-transparent hover:border-emerald-500/40 transition-all text-right" onclick="window.paintApp.openProductMatrixModal('${p.id}')" title="${escapeHtmlAttr(pricingSummary.tooltip)}">
            <div class="flex items-center justify-end gap-1">
              <span class="text-[9px] font-mono uppercase text-secondary/80 font-bold">From</span>
              <span class="font-mono text-xs font-bold text-emerald-400 group-hover:text-emerald-300">&euro;${pricingSummary.minEur.toFixed(2)}</span>
            </div>
            <div class="text-[9px] font-mono text-secondary group-hover:text-emerald-400/90 whitespace-nowrap">
              &euro;${pricingSummary.minEur.toFixed(2)} &ndash; ${pricingSummary.maxEur.toFixed(2)}
            </div>
          </div>
        `;
        priceGbpCellHtml = `
          <div class="cursor-pointer group py-0.5 px-1 rounded hover:bg-amber-950/40 border border-transparent hover:border-amber-500/40 transition-all text-right" onclick="window.paintApp.openProductMatrixModal('${p.id}')" title="${escapeHtmlAttr(pricingSummary.tooltip)}">
            <div class="flex items-center justify-end gap-1">
              <span class="text-[9px] font-mono uppercase text-secondary/80 font-bold">From</span>
              <span class="font-mono text-xs font-bold text-amber-400 group-hover:text-amber-300">&pound;${pricingSummary.minGbp.toFixed(2)}</span>
            </div>
            <div class="text-[9px] font-mono text-secondary group-hover:text-amber-400/90 whitespace-nowrap">
              &pound;${pricingSummary.minGbp.toFixed(2)} &ndash; ${pricingSummary.maxGbp.toFixed(2)}
            </div>
          </div>
        `;
      } else {
        priceEurCellHtml = `
          <div class="flex items-center justify-end">
            <span class="text-secondary text-[11px] mr-1">&euro;</span>
            <input type="number" step="0.01" class="ss-cell-input w-20 text-right bg-transparent p-1.5 font-mono text-xs font-bold text-emerald-400 border border-transparent focus:border-primary focus:bg-surface-container rounded transition-all" data-id="${p.id}" data-field="priceEur" value="${pricingSummary.minEur.toFixed(2)}">
          </div>
        `;
        priceGbpCellHtml = `
          <div class="flex items-center justify-end">
            <span class="text-secondary text-[11px] mr-1">&pound;</span>
            <input type="number" step="0.01" class="ss-cell-input w-20 text-right bg-transparent p-1.5 font-mono text-xs font-bold text-amber-400 border border-transparent focus:border-primary focus:bg-surface-container rounded transition-all" data-id="${p.id}" data-field="priceGbp" value="${pricingSummary.minGbp.toFixed(2)}">
          </div>
        `;
      }

      tr.innerHTML = `
        <td class="p-2 text-center border-r border-secondary/30">
          <input type="checkbox" class="ss-row-select cursor-pointer" data-id="${p.id}" ${isSelected ? 'checked' : ''}>
        </td>
        <td class="p-2 text-center text-[10px] text-secondary border-r border-secondary/30">
          ${absIndex}
        </td>
        <td class="p-1 border-r border-secondary/30">
          <input type="text" class="ss-cell-input w-full bg-transparent p-1.5 font-mono text-xs text-white border border-transparent focus:border-primary focus:bg-surface-container rounded transition-all font-bold" data-id="${p.id}" data-field="sku" value="${escapeHtml(p.sku || p.id)}">
        </td>
        <td class="p-1 border-r border-secondary/30">
          <input type="text" class="ss-cell-input w-full bg-transparent p-1.5 font-mono text-xs text-white border border-transparent focus:border-primary focus:bg-surface-container rounded transition-all" data-id="${p.id}" data-field="name" value="${escapeHtml(p.name || '')}">
        </td>
        <td class="p-1 border-r border-secondary/30">
          <select class="ss-cell-input w-full bg-transparent p-1 font-mono text-[11px] text-primary border border-transparent focus:border-primary focus:bg-surface-container rounded transition-all" data-id="${p.id}" data-field="department">
            ${departments.map(d => `<option value="${d}" ${d === p.department ? 'selected' : ''} class="bg-surface text-white">${d}</option>`).join('')}
            ${!departments.includes(p.department) && p.department ? `<option value="${p.department}" selected class="bg-surface text-white">${p.department}</option>` : ''}
          </select>
        </td>
        <td class="p-1 border-r border-secondary/30">
          <select class="ss-cell-input w-full bg-transparent p-1 font-mono text-[11px] text-amber-300 border border-transparent focus:border-primary focus:bg-surface-container rounded transition-all" data-id="${p.id}" data-field="brand">
            ${brands.map(b => `<option value="${b}" ${b === p.brand ? 'selected' : ''} class="bg-surface text-white">${b}</option>`).join('')}
            ${!brands.includes(p.brand) && p.brand ? `<option value="${p.brand}" selected class="bg-surface text-white">${p.brand}</option>` : ''}
          </select>
        </td>
        <td class="p-1 border-r border-secondary/30">
          <input type="text" class="ss-cell-input w-full bg-transparent p-1.5 font-mono text-[11px] text-secondary border border-transparent focus:border-primary focus:bg-surface-container rounded transition-all" data-id="${p.id}" data-field="category" value="${escapeHtml(p.category || '')}">
        </td>
        <td class="p-1 border-r border-secondary/30">
          <input type="text" class="ss-cell-input w-full bg-transparent p-1.5 font-mono text-[11px] text-sky-300 border border-transparent focus:border-primary focus:bg-surface-container rounded transition-all" data-id="${p.id}" data-field="subcategory" value="${escapeHtml(p.subcategory || '')}" placeholder="Subcategory">
        </td>
        <td class="p-1 border-r border-secondary/30">
          <select class="ss-cell-input w-full bg-transparent p-1 font-mono text-[11px] text-amber-300 border border-transparent focus:border-primary focus:bg-surface-container rounded transition-all" data-id="${p.id}" data-field="chemistry">
            <option value="Solvent" ${p.chemistry === 'Solvent' ? 'selected' : ''} class="bg-surface text-white">Solvent</option>
            <option value="Water-Based" ${p.chemistry === 'Water-Based' ? 'selected' : ''} class="bg-surface text-white">Water-Based</option>
            <option value="Dry" ${p.chemistry === 'Dry' ? 'selected' : ''} class="bg-surface text-white">Dry</option>
            <option value="N/A" ${!p.chemistry || p.chemistry === 'N/A' ? 'selected' : ''} class="bg-surface text-white">N/A</option>
          </select>
        </td>
        <td class="p-1 border-r border-secondary/30">
          <select class="ss-cell-input w-full bg-transparent p-1 font-mono text-[11px] text-emerald-300 border border-transparent focus:border-primary focus:bg-surface-container rounded transition-all" data-id="${p.id}" data-field="paintStage">
            <option value="Primer" ${p.paintStage === 'Primer' ? 'selected' : ''} class="bg-surface text-white">Primer</option>
            <option value="Basecoat" ${p.paintStage === 'Basecoat' ? 'selected' : ''} class="bg-surface text-white">Basecoat</option>
            <option value="Intercoat" ${p.paintStage === 'Intercoat' ? 'selected' : ''} class="bg-surface text-white">Intercoat</option>
            <option value="Clearcoat" ${p.paintStage === 'Clearcoat' ? 'selected' : ''} class="bg-surface text-white">Clearcoat</option>
            <option value="FX / Flake" ${p.paintStage === 'FX / Flake' ? 'selected' : ''} class="bg-surface text-white">FX / Flake</option>
            <option value="FX / Specialty" ${p.paintStage === 'FX / Specialty' ? 'selected' : ''} class="bg-surface text-white">FX / Specialty</option>
            <option value="Prep / Masking" ${p.paintStage === 'Prep / Masking' ? 'selected' : ''} class="bg-surface text-white">Prep / Masking</option>
            <option value="N/A" ${!p.paintStage || p.paintStage === 'N/A' ? 'selected' : ''} class="bg-surface text-white">N/A</option>
          </select>
        </td>
        <td class="p-1 border-r border-secondary/30 text-center">
          ${matrixBadge}
        </td>
        <td class="p-1 border-r border-secondary/30 text-right">
          ${priceEurCellHtml}
        </td>
        <td class="p-1 border-r border-secondary/30 text-right">
          ${priceGbpCellHtml}
        </td>
        <td class="p-1 border-r border-secondary/30 text-center">
          <input type="checkbox" class="ss-cell-checkbox cursor-pointer" data-id="${p.id}" data-field="inStock" ${p.inStock !== false ? 'checked' : ''}>
        </td>
        <td class="p-1 border-r border-secondary/30 text-center">
          <input type="checkbox" class="ss-cell-checkbox cursor-pointer" data-id="${p.id}" data-field="isPreOrder" ${p.isPreOrder ? 'checked' : ''}>
        </td>
        <td class="p-1 border-r border-secondary/30">
          <input type="text" class="ss-cell-input w-full bg-transparent p-1.5 font-mono text-[11px] text-white border border-transparent focus:border-primary focus:bg-surface-container rounded transition-all" data-id="${p.id}" data-field="badge" placeholder="e.g. 10% OFF" value="${escapeHtml(p.badge || '')}">
        </td>
        <td class="p-1 border-r border-secondary/30">
          <input type="text" class="ss-cell-input w-full bg-transparent p-1 font-mono text-[10px] text-secondary border border-transparent focus:border-primary focus:bg-surface-container rounded transition-all" data-id="${p.id}" data-field="meta.recommendedNozzle" value="${escapeHtml(nozzleVal)}">
        </td>
        <td class="p-1 border-r border-secondary/30">
          <input type="text" class="ss-cell-input w-full bg-transparent p-1 font-mono text-[10px] text-secondary border border-transparent focus:border-primary focus:bg-surface-container rounded transition-all" data-id="${p.id}" data-field="meta.recommendedPressure" value="${escapeHtml(psiVal)}">
        </td>
        <td class="p-1 border-r border-secondary/30">
          <input type="number" step="0.01" class="ss-cell-input w-full bg-transparent p-1 font-mono text-[10px] text-secondary border border-transparent focus:border-primary focus:bg-surface-container rounded transition-all" data-id="${p.id}" data-field="meta.specificGravity" value="${sgVal}">
        </td>
        <td class="p-1 text-center sticky right-0 bg-surface-container-high border-l border-secondary/40 z-10">
          <div class="flex items-center justify-center gap-1">
            <button onclick="window.paintApp.openAdminProductModal('${p.id}')" class="p-1 text-secondary hover:text-white transition-colors" title="Detailed Product Editor">
              <span class="material-symbols-outlined text-[15px]">edit</span>
            </button>
            <button onclick="window.paintApp.openProductMatrixModal('${p.id}')" class="p-1 text-secondary hover:text-cyan-400 transition-colors" title="Configure Variant Matrix &amp; Pricing">
              <span class="material-symbols-outlined text-[15px]">grid_view</span>
            </button>
            <button onclick="window.paintApp.copySpreadsheetProduct('${p.id}')" class="p-1 text-secondary hover:text-primary transition-colors" title="Duplicate / Copy Product">
              <span class="material-symbols-outlined text-[15px]">content_copy</span>
            </button>
            <button onclick="window.paintApp.deleteSpreadsheetProduct('${p.id}')" class="p-1 text-secondary hover:text-rose-400 transition-colors" title="Delete Product">
              <span class="material-symbols-outlined text-[15px]">delete</span>
            </button>
            <button onclick="window.paintApp.revertSpreadsheetRow('${p.id}')" class="p-1 text-secondary hover:text-amber-400 transition-colors" title="Revert Changes / Overrides">
              <span class="material-symbols-outlined text-[15px]">history</span>
            </button>
            <button onclick="window.paintApp.quickGeminiCopy('${p.id}')" class="p-1 text-secondary hover:text-indigo-400 transition-colors" title="Gemini AI Sales Copy">
              <span class="material-symbols-outlined text-[15px]">auto_awesome</span>
            </button>
          </div>
        </td>
      `;

      tbody.appendChild(tr);
    });

    this.wireSpreadsheetRowEvents();
  }

  wireSpreadsheetRowEvents() {
    document.querySelectorAll('.ss-row-select').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        if (e.target.checked) {
          this.state.selectedIds.add(id);
        } else {
          this.state.selectedIds.delete(id);
        }
        const selCount = this.state.selectedIds.size;
        const selectedEl = document.getElementById('metric-ss-selected-count');
        if (selectedEl) selectedEl.innerText = `${selCount} Selected`;
        const scopeLabel = document.getElementById('batch-scope-label');
        if (scopeLabel) {
          scopeLabel.innerText = selCount > 0 
            ? `Selected Rows (${selCount})` 
            : `All Filtered Products (${this.getFilteredSortedSpreadsheetProducts().length})`;
        }
      });
    });

    document.querySelectorAll('.ss-cell-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const id = e.target.getAttribute('data-id');
        const field = e.target.getAttribute('data-field');
        const val = e.target.value;
        this.onSpreadsheetCellChange(id, field, val, e.target);
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const tr = e.target.closest('tr');
          const nextTr = tr ? tr.nextElementSibling : null;
          if (nextTr) {
            const nextInput = nextTr.querySelector(`[data-field="${e.target.getAttribute('data-field')}"]`);
            if (nextInput) {
              nextInput.focus();
              if (nextInput.select) nextInput.select();
            }
          }
        }
      });
    });

    document.querySelectorAll('.ss-cell-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        const field = e.target.getAttribute('data-field');
        const val = e.target.checked;
        this.onSpreadsheetCellChange(id, field, val, e.target);
      });
    });
  }

  onSpreadsheetCellChange(prodId, fieldPath, newValue, element) {
    if (!this.state.stagedEdits.has(prodId)) {
      this.state.stagedEdits.set(prodId, {});
    }

    const stagedObj = this.state.stagedEdits.get(prodId);

    if (fieldPath.startsWith('meta.')) {
      const metaField = fieldPath.split('.')[1];
      if (!stagedObj.meta) stagedObj.meta = {};
      stagedObj.meta[metaField] = (metaField === 'specificGravity') ? (parseFloat(newValue) || 1.0) : newValue;
    } else if (fieldPath === 'priceEur' || fieldPath === 'priceGbp') {
      stagedObj[fieldPath] = parseFloat(newValue) || 0;
    } else {
      stagedObj[fieldPath] = newValue;
    }

    if (element) {
      element.classList.add('!bg-amber-950/50', '!border-amber-500/80', '!text-amber-200');
    }

    const stagedCount = this.state.stagedEdits.size;
    const unsavedBadge = document.getElementById('ss-unsaved-badge');
    const unsavedCount = document.getElementById('ss-unsaved-count');
    const btnSave = document.getElementById('btn-spreadsheet-save-all');
    const btnDiscard = document.getElementById('btn-spreadsheet-discard');

    if (unsavedBadge) {
      unsavedBadge.classList.remove('hidden');
      unsavedBadge.innerText = `⚡ ${stagedCount} Unsaved Edit${stagedCount > 1 ? 's' : ''}`;
    }
    if (unsavedCount) unsavedCount.innerText = stagedCount.toString();
    if (btnSave) btnSave.disabled = false;
    if (btnDiscard) btnDiscard.disabled = false;
  }

  // Delegation to sub-services
  applyBatchPricePercentage(pct) { return this.batchEngine.applyBatchPricePercentage(pct); }
  applyBatchCurrencySync(rate, rounding) { return this.batchEngine.applyBatchCurrencySync(rate, rounding); }
  applyBatchRounding(rounding) { return this.batchEngine.applyBatchRounding(rounding); }
  roundPriceTo(price, suffix) { return this.batchEngine.roundPriceTo(price, suffix); }
  applyBatchTaxonomy(dept, category, brand) { return this.batchEngine.applyBatchTaxonomy(dept, category, brand); }
  applyBatchStock(inStock) { return this.batchEngine.applyBatchStock(inStock); }
  applyBatchBadge(badgeText) { return this.batchEngine.applyBatchBadge(badgeText); }
  saveSpreadsheetEdits() { return this.batchEngine.saveSpreadsheetEdits(); }
  discardSpreadsheetEdits() { return this.batchEngine.discardSpreadsheetEdits(); }
  revertSpreadsheetRow(prodId) { return this.batchEngine.revertSpreadsheetRow(prodId); }
  copySpreadsheetProduct(productId) { return this.batchEngine.copySpreadsheetProduct(productId); }
  copySelectedSpreadsheetProducts() { return this.batchEngine.copySelectedSpreadsheetProducts(); }
  deleteSpreadsheetProduct(productId) { return this.batchEngine.deleteSpreadsheetProduct(productId); }
  deleteSelectedSpreadsheetProducts() { return this.batchEngine.deleteSelectedSpreadsheetProducts(); }

  openTrashModal() { return this.trashModal.openTrashModal(); }
  closeTrashModal() { return this.trashModal.closeTrashModal(); }
  restoreTrashProduct(productId) { return this.trashModal.restoreTrashProduct(productId); }
  restoreAllTrashProducts() { return this.trashModal.restoreAllTrashProducts(); }
  updateTrashBadgeCount() { return this.trashModal.updateTrashBadgeCount(); }

  addSpreadsheetProductRow() { return this.csvService.addSpreadsheetProductRow(); }
  exportSpreadsheetCsv() { return this.csvService.exportSpreadsheetCsv(); }
  importSpreadsheetCsv(file) { return this.csvService.importSpreadsheetCsv(file); }
  parseCsvString(text) { return this.csvService.parseCsvString(text); }
}
