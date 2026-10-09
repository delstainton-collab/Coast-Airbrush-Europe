// Storefront DOM Event Listeners & Change Handlers
// Extracted per Anti-God Monolith Architecture Skill (Laws 1 & 2)

export function setupStorefrontDOMListeners(app) {
  // Event Listeners for mixing inputs
  app.addSafeListener('select-mixing-system', 'change', (e) => app.onSystemChange(e.target.value));
  app.addSafeListener('input-total-volume', 'input', () => app.updateCalculation());
  app.addSafeListener('select-volume-unit', 'change', () => app.updateCalculation());

  // Mix Calculator Direct SDS & TDS Download Buttons
  app.addSafeListener('btn-calc-download-tds', 'click', () => {
    if (app.selectedSystem) app.downloadSystemTDS(app.selectedSystem);
  });
  app.addSafeListener('btn-calc-download-sds', 'click', () => {
    if (app.selectedSystem) app.downloadSystemSDS(app.selectedSystem);
  });

  // Direct and Delegated Variant Change Event Listeners (ensure 100% responsiveness even under strict CSP / theme sandboxing)
  app.addSafeListener('select-size-kroma-mirror-chrome-system', 'change', (e) => {
    app.onProductVariantChange('kroma-mirror-chrome-system', 'size', e.target.value);
  });
  app.addSafeListener('select-size-kroma-mirror-chrome-system', 'input', (e) => {
    app.onProductVariantChange('kroma-mirror-chrome-system', 'size', e.target.value);
  });
  app.addSafeListener('select-size-kroma-dedicated-topcoat-clear', 'change', (e) => {
    app.onProductVariantChange('kroma-dedicated-topcoat-clear', 'size', e.target.value);
  });
  app.addSafeListener('select-size-kroma-dedicated-topcoat-clear', 'input', (e) => {
    app.onProductVariantChange('kroma-dedicated-topcoat-clear', 'size', e.target.value);
  });
  app.addSafeListener('select-width-fk-2366', 'change', (e) => {
    app.onProductVariantChange('fk-2366', 'width', e.target.value);
  });
  app.addSafeListener('select-width-fk-2366', 'input', (e) => {
    app.onProductVariantChange('fk-2366', 'width', e.target.value);
  });
  app.addSafeListener('select-width-fk-2352', 'change', (e) => {
    app.onProductVariantChange('fk-2352', 'width', e.target.value);
  });
  app.addSafeListener('select-width-fk-2352', 'input', (e) => {
    app.onProductVariantChange('fk-2352', 'width', e.target.value);
  });

  // Global Delegated Selector Event Listener
  if (typeof document !== 'undefined') {
    document.addEventListener('change', (e) => {
      const t = e.target;
      if (!t || t.tagName !== 'SELECT') return;
      if (t.id) {
        let m = t.id.match(/^select-size-(.+)$/);
        if (m) {
          app.onProductVariantChange(m[1], 'size', t.value);
          return;
        }
        m = t.id.match(/^select-pack-(.+)$/);
        if (m) {
          app.onProductVariantChange(m[1], 'pack', t.value);
          return;
        }
        m = t.id.match(/^select-width-(.+)$/);
        if (m) {
          app.onProductVariantChange(m[1], 'width', t.value);
          return;
        }
      }
      if (t.dataset && t.dataset.variantProd) {
        app.onProductVariantChange(t.dataset.variantProd, t.dataset.variantKey || 'size', t.value);
      }
    });
  }

  // Export buttons
  app.addSafeListener('btn-export-shopify-permalink', 'click', () => app.checkoutShopify());
  app.addSafeListener('btn-export-csv-bom', 'click', () => app.exportCSV());
  app.addSafeListener('btn-export-json-recipe', 'click', () => app.exportJSON());
  app.addSafeListener('btn-drawer-checkout-shopify', 'click', () => app.checkoutShopify());
  app.addSafeListener('btn-drawer-export-csv', 'click', () => app.exportCSV());
  app.addSafeListener('btn-drawer-export-json', 'click', () => app.exportJSON());

  app.addSafeListener('btn-sidebar-checkout-shopify', 'click', () => app.checkoutShopify());
  app.addSafeListener('btn-sidebar-export-csv', 'click', () => app.exportCSV());
  app.addSafeListener('btn-sidebar-export-json', 'click', () => app.exportJSON());

  app.addSafeListener('btn-add-to-cart', 'click', () => {
    if (app.currentRecipe) {
      const added = app.shopifyCartManager.addRecipeToShopifyCart(app.currentRecipe);
      if (added) {
        app.showToast(`✅ Added ${app.currentRecipe.systemName || 'formulation'} components to cart!`, 'success');
      }
      app.openCartDrawer();
    } else {
      app.showToast("Please calculate or select a formula first.", "warning");
    }
  });

  app.addSafeListener('btn-send-to-scale', 'click', () => {
    app.switchTab('tab-scale', 'view-scale');
    app.initScaleAssistant();
  });

  // Scale Step Navigation
  app.addSafeListener('btn-scale-prev-step', 'click', () => app.prevScaleStep());
  app.addSafeListener('btn-scale-next-step', 'click', () => app.nextScaleStep());

  // Navigation Logo
  app.addSafeListener('nav-logo-btn', 'click', () => app.switchTab('tab-storefront', 'view-storefront'));

  // B2B Dealer & Trade Portal Gate
  app.addSafeListener('btn-b2b-login', 'click', () => app.openTradePortalModal());
}
