// Storefront Hero Showcase Cards, Option Pricing & URL Deep Linking Controller
// Extracted per Anti-God Monolith Architecture Skill (Target <= 250 lines)

import { ECOM_CATALOG } from '../../data/full_ecom_catalog.js';

export class StorefrontShowcaseUI {
  constructor(appRef) {
    this.app = appRef;
  }

  handleUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const tabParam = params.get('tab');

    if (params.get('admin') === 'true' || params.get('admin') === '1' || tabParam === 'admin' || hash === '#admin') {
      if (this.app.adminController && this.app.adminController.isAuthenticated) {
        this.app.switchTab('tab-admin', 'view-admin');
      } else {
        this.app.openAdminAuthModal();
      }
      return;
    }

    if (tabParam) {
      if (tabParam === 'preorders' || tabParam === 'pre-orders') {
        const storeTab = document.getElementById('tab-storefront');
        if (storeTab) storeTab.click();
      } else {
        const tabBtn = document.getElementById(`tab-${tabParam}`);
        if (tabBtn) tabBtn.click();
      }
    } else if (hash === '#preorders' || hash === '#pre-orders') {
      const storeTab = document.getElementById('tab-storefront');
      if (storeTab) storeTab.click();
    } else if (hash === '#forum') {
      const forumTab = document.getElementById('tab-forum');
      if (forumTab) forumTab.click();
    }

    const searchQuery = params.get('search');
    const brandQuery = params.get('brand');
    const categoryQuery = params.get('category');

    if (searchQuery) {
      this.app.searchQuery = searchQuery.toLowerCase().trim();
      const searchInput = document.getElementById('input-shop-search');
      if (searchInput) searchInput.value = searchQuery;
      this.app.renderStorefrontGrid();

      // Scroll smoothly to the catalog
      setTimeout(() => {
        const anchor = document.getElementById('storefront-catalog-anchor');
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth' });
      }, 250);
    } else if (brandQuery) {
      this.app.activeBrandFilter = brandQuery;
      const brandSelect = document.getElementById('select-brand-filter');
      if (brandSelect) brandSelect.value = brandQuery;
      this.app.renderCategoryButtons();
      this.app.renderStorefrontGrid();

      setTimeout(() => {
        const anchor = document.getElementById('storefront-catalog-anchor');
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth' });
      }, 250);
    } else if (categoryQuery) {
      this.app.setCategoryFilter(categoryQuery);
      setTimeout(() => {
        const anchor = document.getElementById('storefront-catalog-anchor');
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth' });
      }, 250);
    }
  }

  syncFeaturedShowcaseCards() {
    try {
      const kromaSelect = document.getElementById('select-size-kroma-mirror-chrome-system');
      const kromaVal = (this.app.selectedProductVariants['kroma-mirror-chrome-system'] && this.app.selectedProductVariants['kroma-mirror-chrome-system'].size) || (kromaSelect ? kromaSelect.value : null);
      if (kromaVal) {
        this.app.onProductVariantChange('kroma-mirror-chrome-system', 'size', kromaVal);
      }
      const clearSelect = document.getElementById('select-size-kroma-dedicated-topcoat-clear');
      const clearVal = (this.app.selectedProductVariants['kroma-dedicated-topcoat-clear'] && this.app.selectedProductVariants['kroma-dedicated-topcoat-clear'].size) || (clearSelect ? clearSelect.value : null);
      if (clearVal) {
        this.app.onProductVariantChange('kroma-dedicated-topcoat-clear', 'size', clearVal);
      } else {
        const clearProd = ECOM_CATALOG.find(p => p.id === 'kroma-dedicated-topcoat-clear');
        if (clearProd) {
          const cPrices = this.app.getProductCalculatedPrice(clearProd);
          const clearEurEls = document.querySelectorAll('[id="price-eur-kroma-dedicated-topcoat-clear"], [data-price-eur="kroma-dedicated-topcoat-clear"]');
          const clearGbpEls = document.querySelectorAll('[id="price-gbp-kroma-dedicated-topcoat-clear"], [data-price-gbp="kroma-dedicated-topcoat-clear"]');
          if (cPrices) {
            clearEurEls.forEach(el => el.textContent = cPrices.formattedPrimary);
            clearGbpEls.forEach(el => el.textContent = cPrices.formattedSecondary);
          }
        }
      }
      const fk2366Select = document.getElementById('select-width-fk-2366');
      const fk2366Val = (this.app.selectedProductVariants['fk-2366'] && this.app.selectedProductVariants['fk-2366'].width) || (fk2366Select ? fk2366Select.value : null);
      if (fk2366Val) {
        this.app.onProductVariantChange('fk-2366', 'width', fk2366Val);
      }
      const fk2352Select = document.getElementById('select-width-fk-2352');
      const fk2352Val = (this.app.selectedProductVariants['fk-2352'] && this.app.selectedProductVariants['fk-2352'].width) || (fk2352Select ? fk2352Select.value : null);
      if (fk2352Val) {
        this.app.onProductVariantChange('fk-2352', 'width', fk2352Val);
      }

      this.updateDropdownOptionPrices();

      this.app.renderDeptFlakesGrid();
      this.app.renderDeptGunsGrid();
      this.app.renderDeptTapesGrid();

      // Dynamic currency update for Hero Split Cockpit cards & Master Kit CTA
      const activeCountry = this.app.euLocalization.getCountry();
      const isEur = activeCountry.currency === 'EUR';
      const kromaCockpitEl = document.getElementById('cockpit-price-kroma');
      const gunsCockpitEl = document.getElementById('cockpit-price-guns');
      if (kromaCockpitEl) {
        kromaCockpitEl.textContent = isEur ? 'Kits from €76.47' : 'Kits from £65.00';
      }
      if (gunsCockpitEl) {
        gunsCockpitEl.textContent = isEur ? 'Guns from €97.50' : 'Guns from £83.33';
      }
      const masterKitBtnText = document.getElementById('btn-master-kit-text');
      if (masterKitBtnText) {
        masterKitBtnText.textContent = isEur ? 'ADD MASTER KIT • €243.75' : 'ADD MASTER KIT • £208.33';
      }
    } catch (err) {
      console.warn('Error syncing featured showcase cards:', err);
    }
  }

  updateDropdownOptionPrices(targetProdId = null) {
    try {
      // 1. Kroma Mirror Chrome System
      if (!targetProdId || targetProdId === 'kroma-mirror-chrome-system') {
        const chromeSelect = document.getElementById('select-size-kroma-mirror-chrome-system');
        const chromeProd = ECOM_CATALOG.find(p => p.id === 'kroma-mirror-chrome-system');
        if (chromeSelect && chromeProd) {
          const coverageMap = {
            'Small Kit (140g / 5 oz)': 'Small Kit (140g / 5 oz) • 7–10 sq ft',
            'Medium Kit (420g / 15 oz)': 'Medium Kit (420g / 15 oz) • 22–30 sq ft',
            'Large Kit (1260g / 45 oz)': 'Large Kit (1260g / 45 oz) • 68–90 sq ft',
            'Extra Large Kit (2520g / 90 oz)': 'Extra Large Kit (2520g / 90 oz) • 135–180 sq ft',
            'Ultra Large Kit (10080g / 360 oz)': 'Ultra Large Kit (10kg / 360 oz) • Factory Run'
          };
          Array.from(chromeSelect.options).forEach(opt => {
            const rawVal = opt.value;
            const base = coverageMap[rawVal] || rawVal.split(' — ')[0];
            const p = this.app.getProductCalculatedPrice(chromeProd, null, rawVal);
            if (p) {
              const sec = p.formattedSecondaryCur ? ` / ${p.formattedSecondaryCur}` : '';
              opt.textContent = `${base} — ${p.formattedPrimary} ${p.primaryVatBadge}${sec}`;
            }
          });
        }
      }

      // 2. Kroma Dedicated Topcoat Clear
      if (!targetProdId || targetProdId === 'kroma-dedicated-topcoat-clear') {
        const clearSelect = document.getElementById('select-size-kroma-dedicated-topcoat-clear');
        const clearProd = ECOM_CATALOG.find(p => p.id === 'kroma-dedicated-topcoat-clear');
        if (clearSelect && clearProd) {
          const clearMap = {
            'Topcoat Clear 180 SET (1.5 m²)': 'Topcoat Clear 180 SET • 378g (~1.5 m²)',
            'Topcoat Clear 900 SET (6.0 m²)': 'Topcoat Clear 900 SET • 1,890g (~6.0 m²)',
            'Topcoat Clear 3600 SET (24.0 m²)': 'Topcoat Clear 3600 SET • 7,560g (~24 m²)'
          };
          Array.from(clearSelect.options).forEach(opt => {
            const rawVal = opt.value;
            const base = clearMap[rawVal] || rawVal.split(' — ')[0];
            const p = this.app.getProductCalculatedPrice(clearProd, null, rawVal);
            if (p) {
              const sec = p.formattedSecondaryCur ? ` / ${p.formattedSecondaryCur}` : '';
              opt.textContent = `${base} — ${p.formattedPrimary} ${p.primaryVatBadge}${sec}`;
            }
          });
        }
      }

      // 3. Fine Line Tapes (fk-2366 & fk-2352)
      ['fk-2366', 'fk-2352'].forEach(tapeId => {
        if (!targetProdId || targetProdId === tapeId) {
          const tapeSelect = document.getElementById(`select-width-${tapeId}`);
          const tapeProd = ECOM_CATALOG.find(p => p.id === tapeId);
          if (tapeSelect && tapeProd) {
            Array.from(tapeSelect.options).forEach(opt => {
              const rawVal = opt.value;
              const base = rawVal.split(' — ')[0].trim();
              const p = this.app.getProductCalculatedPrice(tapeProd, null, null, rawVal);
              if (p) {
                const sec = p.formattedSecondaryCur ? ` / ${p.formattedSecondaryCur}` : '';
                opt.textContent = `${base} — ${p.formattedPrimary} ${p.primaryVatBadge}${sec}`;
              }
            });
          }
        }
      });

      // 4. Any other select elements with data-variant-prod (shop grid, modal)
      const selector = targetProdId 
        ? `select[data-variant-prod="${targetProdId}"]`
        : 'select[data-variant-prod]';
      const selects = document.querySelectorAll(selector);
      selects.forEach(sel => {
        const prodId = sel.dataset.variantProd;
        if (['kroma-mirror-chrome-system', 'kroma-dedicated-topcoat-clear', 'fk-2366', 'fk-2352'].includes(prodId) && sel.id.startsWith('select-')) {
          return;
        }
        const prod = ECOM_CATALOG.find(p => p.id === prodId);
        if (!prod) return;
        const cur = this.app.selectedProductVariants[prodId] || {};
        const key = sel.dataset.variantKey || 'size';

        Array.from(sel.options).forEach(opt => {
          const rawVal = opt.value;
          let baseLabel = opt.textContent.split(' — ')[0].split(' (')[0].trim();
          if (!baseLabel) baseLabel = rawVal;
          let p = null;
          if (key === 'size') {
            p = this.app.getProductCalculatedPrice(prod, cur.pack, rawVal, cur.width);
          } else if (key === 'pack') {
            p = this.app.getProductCalculatedPrice(prod, rawVal, cur.size, cur.width);
          } else if (key === 'width') {
            p = this.app.getProductCalculatedPrice(prod, cur.pack, cur.size, rawVal);
          }
          if (p) {
            opt.textContent = `${baseLabel} — ${p.formattedPrimary} (${p.primaryVatBadge})`;
          }
        });
      });
    } catch (err) {
      console.warn('Error updating dropdown option prices:', err);
    }
  }
}
