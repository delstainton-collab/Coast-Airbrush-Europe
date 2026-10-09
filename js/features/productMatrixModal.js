import { ECOM_CATALOG } from '../../data/full_ecom_catalog.js';

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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

export class ProductMatrixModal {
  constructor(appRef) {
    this.app = appRef;
  }

  openProductMatrixModal(productId) {
    const all = this.app.getEffectiveProducts();
    let prod = all.find(p => p.id === productId) || ECOM_CATALOG.find(p => p.id === productId);
    if (!prod) {
      this.app.showToast("Product not found.", "danger");
      return;
    }

    const modal = document.getElementById('modal-product-matrix');
    if (!modal) return;

    // Header info
    const idInput = document.getElementById('matrix-product-id');
    const titleEl = document.getElementById('matrix-modal-title');
    const skuBadge = document.getElementById('matrix-modal-sku-badge');
    const subtitleEl = document.getElementById('matrix-modal-subtitle');

    if (idInput) idInput.value = prod.id;
    if (titleEl) titleEl.innerText = `${prod.name || 'Product Matrix'}`;
    if (skuBadge) skuBadge.innerText = `BASE SKU: ${prod.sku || prod.id}`;
    if (subtitleEl) subtitleEl.innerText = `${prod.department || 'Automotive'} > ${prod.brand || 'Coast'} > ${prod.category || 'General'} | Base Price: £${(prod.priceGbp || 0).toFixed(2)} / €${(prod.priceEur || 0).toFixed(2)}`;

    // Hydrate or normalize matrix data
    const matrixData = this.getNormalizedProductMatrix(prod);

    // Populate axes inputs
    const ax1Name = document.getElementById('matrix-axis-1-name');
    const ax1Vals = document.getElementById('matrix-axis-1-values');
    const ax2Name = document.getElementById('matrix-axis-2-name');
    const ax2Vals = document.getElementById('matrix-axis-2-values');

    if (ax1Name) ax1Name.value = matrixData.axes[0]?.name || (prod.category === 'Masking Products' ? 'Width' : 'Size');
    if (ax1Vals) ax1Vals.value = (matrixData.axes[0]?.values || []).join(', ');
    if (ax2Name) ax2Name.value = matrixData.axes[1]?.name || (matrixData.axes[1] ? 'Pack Size' : '');
    if (ax2Vals) ax2Vals.value = (matrixData.axes[1]?.values || []).join(', ');

    // Render table
    this.renderMatrixModalRows(matrixData.variants || []);

    modal.classList.add('active');
  }

  closeProductMatrixModal() {
    const modal = document.getElementById('modal-product-matrix');
    if (modal) modal.classList.remove('active');
  }

  getNormalizedProductMatrix(prod) {
    // 1. Existing custom variantMatrix
    if (prod.variantMatrix && prod.variantMatrix.variants && prod.variantMatrix.variants.length > 0) {
      return JSON.parse(JSON.stringify(prod.variantMatrix));
    }

    // 2. Existing tapePriceMatrix
    if (prod.tapePriceMatrix && prod.tapePriceMatrix.length > 0) {
      const widths = prod.tapeWidths || prod.tapePriceMatrix.map(t => t.width);
      const variants = prod.tapePriceMatrix.map((t, idx) => ({
        id: `var_${idx + 1}`,
        sku: t.stockCode || `${prod.sku}-${idx + 1}`,
        barcode: t.barcode || (prod.barcode ? `${prod.barcode}` : ''),
        options: { "Width": t.width },
        priceEur: t.priceEur !== undefined ? t.priceEur : (t.priceGbp ? parseFloat((t.priceGbp / 0.85).toFixed(2)) : prod.priceEur || 1.64),
        priceGbp: t.priceGbp !== undefined ? t.priceGbp : prod.priceGbp || 1.40,
        inStock: true
      }));
      return {
        enabled: true,
        axes: [{ name: "Width", values: widths }],
        variants
      };
    }

    // 3. Existing fullMatrixPricing (Flakes)
    if (prod.fullMatrixPricing && prod.fullMatrixPricing.length > 0) {
      const flakeSizes = [...new Set(prod.fullMatrixPricing.map(m => m.flakeSize || m.rawFlakeSize).filter(Boolean))];
      const packSizes = [...new Set(prod.fullMatrixPricing.map(m => m.packSize || m.rawPackSize).filter(Boolean))];
      const variants = prod.fullMatrixPricing.map((m, idx) => ({
        id: `var_${idx + 1}`,
        sku: m.stockCode || `${prod.sku}-${idx + 1}`,
        barcode: m.barcode || '',
        options: { "Particle Size": m.flakeSize, "Pack Size": m.packSize },
        priceEur: m.priceEur !== undefined ? m.priceEur : (m.priceGbp ? parseFloat((m.priceGbp / 0.85).toFixed(2)) : 12.96),
        priceGbp: m.priceGbp !== undefined ? m.priceGbp : 11.08,
        inStock: true
      }));
      return {
        enabled: true,
        axes: [
          { name: "Particle Size", values: flakeSizes },
          { name: "Pack Size", values: packSizes }
        ],
        variants
      };
    }

    // 4. Existing packPriceMatrix
    if (prod.packPriceMatrix && prod.packPriceMatrix.length > 0) {
      const packSizes = prod.packPriceMatrix.map(m => m.packSize);
      const variants = prod.packPriceMatrix.map((m, idx) => ({
        id: `var_${idx + 1}`,
        sku: m.stockCode || `${prod.sku}-${idx + 1}`,
        barcode: m.barcode || '',
        options: { "Pack Size": m.packSize },
        priceEur: m.priceEur !== undefined ? m.priceEur : (m.priceGbp ? parseFloat((m.priceGbp / 0.85).toFixed(2)) : prod.priceEur || 24.00),
        priceGbp: m.priceGbp !== undefined ? m.priceGbp : prod.priceGbp || 20.00,
        inStock: true
      }));
      return {
        enabled: true,
        axes: [{ name: "Pack Size", values: packSizes }],
        variants
      };
    }

    // 5. Sizes & PackSizes combinations
    const sizes = (prod.sizes || []).map(s => String(s).trim()).filter(Boolean);
    const packs = (prod.packSizes || []).map(p => String(p).trim()).filter(Boolean);

    if (sizes.length > 0 || packs.length > 0) {
      const axes = [];
      if (sizes.length > 0) axes.push({ name: "Size", values: sizes });
      if (packs.length > 0) axes.push({ name: "Pack", values: packs });

      const variants = [];
      let idx = 1;
      const sList = sizes.length > 0 ? sizes : ['Standard'];
      const pList = packs.length > 0 ? packs : [''];

      sList.forEach(s => {
        pList.forEach(p => {
          const opts = {};
          if (sizes.length > 0) opts["Size"] = s;
          if (packs.length > 0 && p) opts["Pack"] = p;
          variants.push({
            id: `var_${idx}`,
            sku: `${prod.sku}-${idx}`,
            barcode: '',
            options: opts,
            priceEur: prod.priceEur || 99.00,
            priceGbp: prod.priceGbp || 85.00,
            inStock: true
          });
          idx++;
        });
      });

      return { enabled: true, axes, variants };
    }

    // Default template for simple products
    return {
      enabled: true,
      axes: [
        { name: "Option / Finish", values: ["Standard"] }
      ],
      variants: [
        {
          id: "var_1",
          sku: `${prod.sku || prod.id}-STD`,
          barcode: prod.barcode || '',
          options: { "Option / Finish": "Standard" },
          priceEur: prod.priceEur || 24.00,
          priceGbp: prod.priceGbp || 20.00,
          inStock: true
        }
      ]
    };
  }

  renderMatrixModalRows(variants) {
    const tbody = document.getElementById('matrix-combinations-tbody');
    const countEl = document.getElementById('matrix-variant-count');
    if (!tbody) return;

    if (countEl) countEl.innerText = variants.length.toString();

    if (variants.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="p-6 text-center text-secondary font-mono text-xs">
            No variants configured. Define axes above and click "Generate / Refresh Combinations" or "Add Single Row".
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = variants.map((v, idx) => {
      const optDesc = Object.entries(v.options || {}).map(([k, val]) => `<span class="text-secondary text-[10px]">${escapeHtml(k)}:</span> <strong class="text-white">${escapeHtml(val)}</strong>`).join(' | ') || 'Standard';
      const optDataAttr = escapeHtmlAttr(JSON.stringify(v.options || {}));
      const rowId = v.id || `var_${idx + 1}`;

      return `
        <tr id="matrix-row-${rowId}" data-row-id="${rowId}" data-options='${optDataAttr}' class="hover:bg-surface-container transition-colors">
          <td class="p-2 border-r border-secondary/30 font-mono text-[11px]">
            ${optDesc}
          </td>
          <td class="p-1 border-r border-secondary/30">
            <input type="text" class="matrix-input-sku w-full bg-transparent p-1 font-mono text-xs font-bold text-primary border border-transparent focus:border-primary focus:bg-surface-container rounded" value="${escapeHtml(v.sku || '')}">
          </td>
          <td class="p-1 border-r border-secondary/30">
            <input type="text" class="matrix-input-barcode w-full bg-transparent p-1 font-mono text-[11px] text-zinc-300 border border-transparent focus:border-primary focus:bg-surface-container rounded" placeholder="EAN-13" value="${escapeHtml(v.barcode || '')}">
          </td>
          <td class="p-1 border-r border-secondary/30 text-right">
            <div class="flex items-center justify-end">
              <span class="text-secondary text-[10px] mr-1">&pound;</span>
              <input type="number" step="0.01" class="matrix-input-gbp w-20 text-right bg-transparent p-1 font-mono text-xs font-bold text-amber-400 border border-transparent focus:border-primary focus:bg-surface-container rounded" value="${(parseFloat(v.priceGbp) || 0).toFixed(2)}">
            </div>
          </td>
          <td class="p-1 border-r border-secondary/30 text-right">
            <div class="flex items-center justify-end">
              <span class="text-secondary text-[10px] mr-1">&euro;</span>
              <input type="number" step="0.01" class="matrix-input-eur w-20 text-right bg-transparent p-1 font-mono text-xs font-bold text-emerald-400 border border-transparent focus:border-primary focus:bg-surface-container rounded" value="${(parseFloat(v.priceEur) || 0).toFixed(2)}">
            </div>
          </td>
          <td class="p-1 border-r border-secondary/30 text-center">
            <input type="checkbox" class="matrix-input-stock cursor-pointer" ${v.inStock !== false ? 'checked' : ''}>
          </td>
          <td class="p-1 text-center">
            <button onclick="window.paintApp.deleteMatrixRow('${rowId}')" class="p-1 text-secondary hover:text-rose-400 transition-colors cursor-pointer" title="Delete Combination">
              <span class="material-symbols-outlined text-[15px]">delete</span>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  generateMatrixCombinations() {
    const ax1Name = (document.getElementById('matrix-axis-1-name')?.value || 'Option 1').trim();
    const ax1Vals = (document.getElementById('matrix-axis-1-values')?.value || '').split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    const ax2Name = (document.getElementById('matrix-axis-2-name')?.value || '').trim();
    const ax2Vals = (document.getElementById('matrix-axis-2-values')?.value || '').split(/[\n,]+/).map(s => s.trim()).filter(Boolean);

    if (ax1Vals.length === 0) {
      this.app.showToast("Please enter at least one option value for Axis 1.", "warning");
      return;
    }

    const prodId = document.getElementById('matrix-product-id')?.value;
    const all = this.app.getEffectiveProducts();
    const prod = all.find(p => p.id === prodId) || ECOM_CATALOG.find(p => p.id === prodId) || {};
    const baseSku = (prod.sku || prodId || 'CAE').trim();
    const baseEur = prod.priceEur || 24.00;
    const baseGbp = prod.priceGbp || 20.00;

    const existingMap = new Map();
    document.querySelectorAll('#matrix-combinations-tbody tr[data-options]').forEach(tr => {
      try {
        const opts = JSON.parse(tr.getAttribute('data-options'));
        const key = Object.entries(opts).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${v}`).join('|');
        existingMap.set(key, {
          sku: tr.querySelector('.matrix-input-sku')?.value,
          barcode: tr.querySelector('.matrix-input-barcode')?.value,
          priceEur: parseFloat(tr.querySelector('.matrix-input-eur')?.value || baseEur),
          priceGbp: parseFloat(tr.querySelector('.matrix-input-gbp')?.value || baseGbp),
          inStock: tr.querySelector('.matrix-input-stock')?.checked !== false
        });
      } catch (e) {}
    });

    const newVariants = [];
    let idx = 1;

    const list2 = (ax2Name && ax2Vals.length > 0) ? ax2Vals : [''];

    ax1Vals.forEach(v1 => {
      list2.forEach(v2 => {
        const opts = { [ax1Name]: v1 };
        if (ax2Name && v2) opts[ax2Name] = v2;

        const key = Object.entries(opts).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${v}`).join('|');
        const existing = existingMap.get(key);

        const clean1 = v1.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
        const clean2 = v2 ? v2.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) : '';
        const generatedSku = `${baseSku}-${clean1}${clean2 ? '-' + clean2 : ''}`;

        newVariants.push({
          id: `var_${Date.now()}_${idx}`,
          sku: existing ? existing.sku : generatedSku,
          barcode: existing ? existing.barcode : '',
          options: opts,
          priceEur: existing ? existing.priceEur : baseEur,
          priceGbp: existing ? existing.priceGbp : baseGbp,
          inStock: existing ? existing.inStock : true
        });
        idx++;
      });
    });

    this.renderMatrixModalRows(newVariants);
    this.app.showToast(`✨ Generated ${newVariants.length} matrix combination(s).`, "success");
  }

  applyMatrixBasePriceToAll() {
    const prodId = document.getElementById('matrix-product-id')?.value;
    const all = this.app.getEffectiveProducts();
    const prod = all.find(p => p.id === prodId) || ECOM_CATALOG.find(p => p.id === prodId);
    if (!prod) return;

    const eur = (prod.priceEur || 0).toFixed(2);
    const gbp = (prod.priceGbp || 0).toFixed(2);

    let count = 0;
    document.querySelectorAll('#matrix-combinations-tbody tr').forEach(tr => {
      const eurInput = tr.querySelector('.matrix-input-eur');
      const gbpInput = tr.querySelector('.matrix-input-gbp');
      if (eurInput) eurInput.value = eur;
      if (gbpInput) gbpInput.value = gbp;
      count++;
    });

    this.app.showToast(`Applied base price (£${gbp} / €${eur}) across all ${count} variants.`, 'info');
  }

  applyMatrixPercentageAdjust(pct) {
    let count = 0;
    const multiplier = 1 + (pct / 100);
    document.querySelectorAll('#matrix-combinations-tbody tr').forEach(tr => {
      const eurInput = tr.querySelector('.matrix-input-eur');
      const gbpInput = tr.querySelector('.matrix-input-gbp');
      if (eurInput) {
        const cur = parseFloat(eurInput.value || 0);
        eurInput.value = (cur * multiplier).toFixed(2);
      }
      if (gbpInput) {
        const cur = parseFloat(gbpInput.value || 0);
        gbpInput.value = (cur * multiplier).toFixed(2);
      }
      count++;
    });

    this.app.showToast(`Adjusted prices by ${pct > 0 ? '+' : ''}${pct}% across ${count} variants.`, 'info');
  }

  autoGenerateMatrixSkus() {
    const prodId = document.getElementById('matrix-product-id')?.value;
    const all = this.app.getEffectiveProducts();
    const prod = all.find(p => p.id === prodId) || ECOM_CATALOG.find(p => p.id === prodId);
    const baseSku = (prod?.sku || prodId || 'CAE').trim();

    let count = 0;
    document.querySelectorAll('#matrix-combinations-tbody tr[data-options]').forEach((tr, idx) => {
      try {
        const opts = JSON.parse(tr.getAttribute('data-options'));
        const parts = Object.values(opts).map(val => val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6));
        const skuInput = tr.querySelector('.matrix-input-sku');
        if (skuInput) {
          skuInput.value = `${baseSku}-${parts.join('-') || idx + 1}`;
          count++;
        }
      } catch (e) {}
    });

    this.app.showToast(`Auto-generated ${count} variant SKUs from base SKU.`, 'info');
  }

  addSingleMatrixRow() {
    const tbody = document.getElementById('matrix-combinations-tbody');
    if (!tbody) return;

    const prodId = document.getElementById('matrix-product-id')?.value;
    const all = this.app.getEffectiveProducts();
    const prod = all.find(p => p.id === prodId) || ECOM_CATALOG.find(p => p.id === prodId);
    const baseSku = (prod?.sku || prodId || 'CAE').trim();

    const rowId = `var_custom_${Date.now()}`;
    const tr = document.createElement('tr');
    tr.id = `matrix-row-${rowId}`;
    tr.setAttribute('data-row-id', rowId);
    tr.setAttribute('data-options', JSON.stringify({ "Option": "Custom Variant" }));
    tr.className = 'hover:bg-surface-container transition-colors bg-primary/5';

    tr.innerHTML = `
      <td class="p-2 border-r border-secondary/30 font-mono text-[11px]">
        <input type="text" class="matrix-input-custom-label w-full bg-transparent p-1 text-white border border-secondary/40 rounded text-xs" value="Custom Variant">
      </td>
      <td class="p-1 border-r border-secondary/30">
        <input type="text" class="matrix-input-sku w-full bg-transparent p-1 font-mono text-xs font-bold text-primary border border-secondary/40 rounded" value="${baseSku}-CUSTOM">
      </td>
      <td class="p-1 border-r border-secondary/30">
        <input type="text" class="matrix-input-barcode w-full bg-transparent p-1 font-mono text-[11px] text-zinc-300 border border-secondary/40 rounded" placeholder="EAN-13">
      </td>
      <td class="p-1 border-r border-secondary/30 text-right">
        <div class="flex items-center justify-end">
          <span class="text-secondary text-[10px] mr-1">&pound;</span>
          <input type="number" step="0.01" class="matrix-input-gbp w-20 text-right bg-transparent p-1 font-mono text-xs font-bold text-amber-400 border border-secondary/40 rounded" value="${(prod?.priceGbp || 20.00).toFixed(2)}">
        </div>
      </td>
      <td class="p-1 border-r border-secondary/30 text-right">
        <div class="flex items-center justify-end">
          <span class="text-secondary text-[10px] mr-1">&euro;</span>
          <input type="number" step="0.01" class="matrix-input-eur w-20 text-right bg-transparent p-1 font-mono text-xs font-bold text-emerald-400 border border-secondary/40 rounded" value="${(prod?.priceEur || 24.00).toFixed(2)}">
        </div>
      </td>
      <td class="p-1 border-r border-secondary/30 text-center">
        <input type="checkbox" class="matrix-input-stock cursor-pointer" checked>
      </td>
      <td class="p-1 text-center">
        <button onclick="window.paintApp.deleteMatrixRow('${rowId}')" class="p-1 text-secondary hover:text-rose-400 transition-colors cursor-pointer" title="Delete Combination">
          <span class="material-symbols-outlined text-[15px]">delete</span>
        </button>
      </td>
    `;

    tbody.appendChild(tr);
    const countEl = document.getElementById('matrix-variant-count');
    if (countEl) countEl.innerText = tbody.querySelectorAll('tr').length.toString();
  }

  deleteMatrixRow(rowId) {
    const row = document.getElementById(`matrix-row-${rowId}`);
    if (row) {
      row.remove();
      const countEl = document.getElementById('matrix-variant-count');
      const rows = document.querySelectorAll('#matrix-combinations-tbody tr');
      if (countEl) countEl.innerText = rows.length.toString();
    }
  }

  saveProductMatrixFromModal() {
    const prodId = document.getElementById('matrix-product-id')?.value;
    if (!prodId) return;

    const ax1Name = (document.getElementById('matrix-axis-1-name')?.value || 'Option 1').trim();
    const ax1Vals = (document.getElementById('matrix-axis-1-values')?.value || '').split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    const ax2Name = (document.getElementById('matrix-axis-2-name')?.value || '').trim();
    const ax2Vals = (document.getElementById('matrix-axis-2-values')?.value || '').split(/[\n,]+/).map(s => s.trim()).filter(Boolean);

    const axes = [];
    if (ax1Name && ax1Vals.length > 0) axes.push({ name: ax1Name, values: ax1Vals });
    if (ax2Name && ax2Vals.length > 0) axes.push({ name: ax2Name, values: ax2Vals });

    const rows = document.querySelectorAll('#matrix-combinations-tbody tr[data-row-id]');
    const variants = [];

    rows.forEach((tr, idx) => {
      let options = {};
      try {
        options = JSON.parse(tr.getAttribute('data-options') || '{}');
      } catch (e) {}

      const customLabel = tr.querySelector('.matrix-input-custom-label')?.value;
      if (customLabel) {
        options = { "Option": customLabel.trim() };
      }

      const sku = (tr.querySelector('.matrix-input-sku')?.value || '').trim();
      const barcode = (tr.querySelector('.matrix-input-barcode')?.value || '').trim();
      const priceEur = parseFloat(tr.querySelector('.matrix-input-eur')?.value || 0) || 0;
      const priceGbp = parseFloat(tr.querySelector('.matrix-input-gbp')?.value || 0) || 0;
      const inStock = tr.querySelector('.matrix-input-stock')?.checked !== false;

      variants.push({
        id: tr.getAttribute('data-row-id') || `var_${idx + 1}`,
        sku,
        barcode,
        options,
        priceEur,
        priceGbp,
        inStock
      });
    });

    const matrixData = {
      enabled: variants.length > 0,
      axes,
      variants
    };

    const updatedFields = {
      variantMatrix: matrixData,
      hasOptions: variants.length > 0
    };

    if (ax1Name.toLowerCase() === 'width') {
      updatedFields.tapeWidths = ax1Vals;
      updatedFields.hasTapeOptions = true;
      updatedFields.tapePriceMatrix = variants.map(v => ({
        width: v.options["Width"] || Object.values(v.options)[0] || '',
        priceEur: v.priceEur,
        priceGbp: v.priceGbp,
        stockCode: v.sku,
        barcode: v.barcode
      }));
    }

    this.app.adminController.saveProductOverride(prodId, updatedFields);

    const catIdx = ECOM_CATALOG.findIndex(p => p.id === prodId);
    if (catIdx >= 0) {
      ECOM_CATALOG[catIdx] = {
        ...ECOM_CATALOG[catIdx],
        ...updatedFields
      };
    }

    this.closeProductMatrixModal();
    this.app.renderAdminSpreadsheet();
    this.app.renderAdminProducts();
    this.app.renderStorefrontGrid();
    this.app.showToast(`✅ Product matrix saved with ${variants.length} variant(s)!`, 'success', 4500);
  }

  async resetProductMatrixToDefaults() {
    const prodId = document.getElementById('matrix-product-id')?.value;
    if (!prodId) return;

    const confirmed = await this.app.confirmDialog({
      title: 'Reset Matrix',
      subtitle: 'Restore Factory Matrix',
      message: `Reset custom variant matrix overrides for product "${prodId}" back to original catalog baseline?`,
      confirmText: 'Reset Matrix',
      isDanger: false,
      icon: 'history'
    });

    if (!confirmed) return;

    this.app.adminController.deleteProductMatrix(prodId);

    const all = this.app.getEffectiveProducts();
    const prod = all.find(p => p.id === prodId) || ECOM_CATALOG.find(p => p.id === prodId);
    if (prod && prod.variantMatrix) {
      delete prod.variantMatrix;
    }

    this.openProductMatrixModal(prodId);
    this.app.renderAdminSpreadsheet();
    this.app.renderAdminProducts();
    this.app.renderStorefrontGrid();
    this.app.showToast("Variant matrix reset to factory defaults.", "info");
  }
}
