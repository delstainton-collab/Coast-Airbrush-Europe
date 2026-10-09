import { ECOM_CATALOG } from '../../../data/full_ecom_catalog.js';

export class SpreadsheetCsvService {
  constructor(appRef) {
    this.app = appRef;
  }

  get spreadsheetState() {
    return this.app.spreadsheetState;
  }

  addSpreadsheetProductRow() {
    const newId = `custom_prod_${Date.now()}`;
    const newProduct = {
      id: newId,
      sku: `CAE-${Date.now().toString().slice(-4)}`,
      name: 'New Custom Formula / Finish',
      department: 'Automotive & Custom Paint',
      brand: 'Kroma Edge',
      category: 'Mirror Chrome Systems',
      priceEur: 99.00,
      priceGbp: 85.00,
      inStock: true,
      isPreOrder: false,
      badge: 'NEW RELEASE',
      image: 'assets/images/kroma-helmet-mirror.jpg',
      description: 'Custom formulation added via Master Spreadsheet Editor.',
      sizes: ['500mL', '1 Litre'],
      packSizes: ['Standard Kit'],
      hasOptions: true,
      meta: {
        specificGravity: 0.98,
        recommendedNozzle: '0.3mm - 0.5mm',
        recommendedPressure: '20-25 PSI'
      }
    };

    // Stage it immediately
    this.spreadsheetState.stagedEdits.set(newId, newProduct);
    ECOM_CATALOG.unshift(newProduct);
    this.spreadsheetState.currentPage = 1;
    this.app.renderAdminSpreadsheet();

    setTimeout(() => {
      const row = document.getElementById(`ss-row-${newId}`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const firstInput = row.querySelector('.ss-cell-input');
        if (firstInput) firstInput.focus();
      }
    }, 150);
  }

  exportSpreadsheetCsv() {
    const list = this.app.getFilteredSortedSpreadsheetProducts();
    if (list.length === 0) {
      this.app.showToast("No products to export.", "warning");
      return;
    }

    const headers = [
      "ID",
      "SKU",
      "Name",
      "Department",
      "Brand",
      "Category",
      "Price_EUR",
      "Price_GBP",
      "In_Stock",
      "Is_PreOrder",
      "Badge",
      "Recommended_Nozzle",
      "Recommended_PSI",
      "Specific_Gravity",
      "Description",
      "Image"
    ];

    const rows = [headers.join(',')];

    list.forEach(p => {
      const row = [
        `"${(p.id || '').replace(/"/g, '""')}"`,
        `"${(p.sku || '').replace(/"/g, '""')}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.department || '').replace(/"/g, '""')}"`,
        `"${(p.brand || '').replace(/"/g, '""')}"`,
        `"${(p.category || '').replace(/"/g, '""')}"`,
        (p.priceEur !== undefined ? p.priceEur : 0).toFixed(2),
        (p.priceGbp !== undefined ? p.priceGbp : 0).toFixed(2),
        p.inStock !== false ? "TRUE" : "FALSE",
        p.isPreOrder ? "TRUE" : "FALSE",
        `"${(p.badge || '').replace(/"/g, '""')}"`,
        `"${(p.meta?.recommendedNozzle || '0.3mm').replace(/"/g, '""')}"`,
        `"${(p.meta?.recommendedPressure || '25 PSI').replace(/"/g, '""')}"`,
        (p.meta?.specificGravity !== undefined ? p.meta.specificGravity : 1.0).toFixed(2),
        `"${(p.description || '').replace(/"/g, '""')}"`,
        `"${(p.image || '').replace(/"/g, '""')}"`
      ];
      rows.push(row.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(rows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `coast_airbrush_catalog_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  importSpreadsheetCsv(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = this.parseCsvString(text);
        if (lines.length < 2) {
          this.app.showToast("CSV file appears to be empty or missing header.", "danger");
          return;
        }

        const headers = lines[0].map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
        const idIdx = headers.indexOf('id');
        const skuIdx = headers.indexOf('sku');
        const nameIdx = headers.indexOf('name');
        const deptIdx = headers.indexOf('department');
        const brandIdx = headers.indexOf('brand');
        const catIdx = headers.indexOf('category');
        const eurIdx = headers.findIndex(h => h.includes('eur'));
        const gbpIdx = headers.findIndex(h => h.includes('gbp'));
        const stockIdx = headers.findIndex(h => h.includes('stock'));
        const preIdx = headers.findIndex(h => h.includes('preorder'));
        const badgeIdx = headers.indexOf('badge');
        const nozzleIdx = headers.findIndex(h => h.includes('nozzle'));
        const psiIdx = headers.findIndex(h => h.includes('psi'));
        const sgIdx = headers.findIndex(h => h.includes('gravity') || h.includes('specific'));

        let updatedCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i];
          if (!row || row.length === 0 || (row.length === 1 && !row[0])) continue;

          const rowId = idIdx >= 0 ? row[idIdx] : null;
          const rowSku = skuIdx >= 0 ? row[skuIdx] : null;

          let targetProd = null;
          if (rowId) {
            targetProd = ECOM_CATALOG.find(p => p.id === rowId);
          }
          if (!targetProd && rowSku) {
            targetProd = ECOM_CATALOG.find(p => p.sku === rowSku);
          }

          const prodKey = targetProd ? targetProd.id : (rowId || `custom_prod_${Date.now()}_${i}`);
          const st = this.spreadsheetState.stagedEdits.get(prodKey) || {};

          if (nameIdx >= 0 && row[nameIdx]) st.name = row[nameIdx];
          if (skuIdx >= 0 && row[skuIdx]) st.sku = row[skuIdx];
          if (deptIdx >= 0 && row[deptIdx]) st.department = row[deptIdx];
          if (brandIdx >= 0 && row[brandIdx]) st.brand = row[brandIdx];
          if (catIdx >= 0 && row[catIdx]) st.category = row[catIdx];
          if (eurIdx >= 0 && row[eurIdx] !== '') st.priceEur = parseFloat(row[eurIdx]) || 0;
          if (gbpIdx >= 0 && row[gbpIdx] !== '') st.priceGbp = parseFloat(row[gbpIdx]) || 0;
          if (stockIdx >= 0 && row[stockIdx] !== '') {
            const sVal = row[stockIdx].toLowerCase();
            st.inStock = sVal === 'true' || sVal === '1' || sVal === 'yes' || sVal === 'in stock';
          }
          if (preIdx >= 0 && row[preIdx] !== '') {
            const pVal = row[preIdx].toLowerCase();
            st.isPreOrder = pVal === 'true' || pVal === '1' || pVal === 'yes';
          }
          if (badgeIdx >= 0 && row[badgeIdx]) st.badge = row[badgeIdx];

          if (!st.meta) st.meta = {};
          if (nozzleIdx >= 0 && row[nozzleIdx]) st.meta.recommendedNozzle = row[nozzleIdx];
          if (psiIdx >= 0 && row[psiIdx]) st.meta.recommendedPressure = row[psiIdx];
          if (sgIdx >= 0 && row[sgIdx]) st.meta.specificGravity = parseFloat(row[sgIdx]) || 1.0;

          this.spreadsheetState.stagedEdits.set(prodKey, st);
          updatedCount++;
        }

        this.app.renderAdminSpreadsheet();
        this.app.showToast(`📥 Successfully imported CSV! ${updatedCount} products staged for review. Click "SAVE ALL CHANGES" to commit.`, 'success');
      } catch (err) {
        this.app.showToast("Error parsing CSV file: " + err.message, 'danger');
      }
    };
    reader.readAsText(file);
  }

  parseCsvString(text) {
    const lines = [];
    let row = [];
    let inQuotes = false;
    let field = '';

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];

      if (c === '"') {
        if (inQuotes && next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push(field);
        field = '';
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && next === '\n') i++;
        row.push(field);
        lines.push(row);
        row = [];
        field = '';
      } else {
        field += c;
      }
    }
    if (field || row.length > 0) {
      row.push(field);
      lines.push(row);
    }
    return lines;
  }
}
