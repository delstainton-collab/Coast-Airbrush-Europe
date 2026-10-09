import { ECOM_CATALOG } from '../../../data/full_ecom_catalog.js';

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export class TrashModal {
  constructor(appRef) {
    this.app = appRef;
  }

  openTrashModal() {
    const modal = document.getElementById('modal-deleted-products');
    const container = document.getElementById('trash-products-list-container');
    if (!modal || !container) return;

    const records = this.app.adminController.getDeletedProductRecords();
    const deletedIds = this.app.adminController.getDeletedProductIds();
    
    const items = deletedIds.map(id => records[id] || { id, name: id, sku: id, department: 'Deleted' });

    if (items.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-secondary font-mono text-xs">
          <span class="material-symbols-outlined text-[32px] mb-2 opacity-50 block">delete_sweep</span>
          <p>Trash is empty. No deleted catalog products.</p>
        </div>
      `;
    } else {
      container.innerHTML = `
        <table class="w-full text-left font-mono text-xs border-collapse">
          <thead class="bg-surface-container-high text-[11px] uppercase font-bold text-secondary sticky top-0 border-b border-secondary/40">
            <tr>
              <th class="p-2.5">SKU</th>
              <th class="p-2.5">Product Name</th>
              <th class="p-2.5">Department</th>
              <th class="p-2.5 text-right">Price</th>
              <th class="p-2.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-secondary/20">
            ${items.map(item => `
              <tr class="hover:bg-surface-container transition-colors">
                <td class="p-2 font-bold text-primary">${escapeHtml(item.sku || item.id)}</td>
                <td class="p-2 text-white">${escapeHtml(item.name || 'Unnamed Product')}</td>
                <td class="p-2 text-zinc-400 text-[11px]">${escapeHtml(item.department || '-')}</td>
                <td class="p-2 text-right text-emerald-400 font-bold">&euro;${(item.priceEur || 0).toFixed(2)}</td>
                <td class="p-2 text-center">
                  <button onclick="window.paintApp.restoreTrashProduct('${item.id}')" class="px-2 py-1 text-[11px] font-mono border border-emerald-500/60 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/50 rounded transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer">
                    <span class="material-symbols-outlined text-[12px]">history</span> Restore
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    modal.classList.add('active');
  }

  closeTrashModal() {
    const modal = document.getElementById('modal-deleted-products');
    if (modal) modal.classList.remove('active');
  }

  restoreTrashProduct(productId) {
    const restored = this.app.adminController.restoreProduct(productId);
    if (restored) {
      if (!ECOM_CATALOG.some(p => p.id === restored.id)) {
        ECOM_CATALOG.unshift(restored);
      }
    }
    this.openTrashModal();
    this.app.renderAdminSpreadsheet();
    this.app.renderAdminProducts();
    this.app.renderStorefrontGrid();
    this.updateTrashBadgeCount();
    this.app.showToast(`✅ Restored product "${restored?.name || productId}" back to catalog!`, 'success');
  }

  restoreAllTrashProducts() {
    const restoredList = this.app.adminController.restoreAllDeletedProducts();
    restoredList.forEach(item => {
      if (!ECOM_CATALOG.some(p => p.id === item.id)) {
        ECOM_CATALOG.unshift(item);
      }
    });
    this.openTrashModal();
    this.app.renderAdminSpreadsheet();
    this.app.renderAdminProducts();
    this.app.renderStorefrontGrid();
    this.updateTrashBadgeCount();
    this.app.showToast(`✅ Restored all products back to catalog!`, 'success');
  }

  updateTrashBadgeCount() {
    const badge = document.getElementById('ss-trash-count');
    if (badge) {
      badge.innerText = this.app.adminController.getDeletedProductIds().length.toString();
    }
  }
}
