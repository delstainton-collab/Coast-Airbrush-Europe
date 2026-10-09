// Coast Airbrush Europe - Admin Authentication, PIN Gate & Master Suite Setup
// Extracted per Anti-God Monolith Architecture Skill (Laws 1 & 2)

export class AdminAuthUI {
  constructor(appRef) {
    this.app = appRef;
  }

  addSafeListener(id, eventOrCallback, maybeCallback) {
    if (this.app && typeof this.app.addSafeListener === 'function') {
      return this.app.addSafeListener(id, eventOrCallback, maybeCallback);
    }
    const el = document.getElementById(id);
    if (!el) return;
    const evt = typeof eventOrCallback === 'string' ? eventOrCallback : 'click';
    const cb = typeof eventOrCallback === 'function' ? eventOrCallback : maybeCallback;
    if (typeof cb === 'function') {
      el.addEventListener(evt, cb);
    }
  }

  showToast(msg, type) {
    if (this.app && typeof this.app.showToast === 'function') {
      this.app.showToast(msg, type);
    }
  }

  switchTab(tabId, viewId) {
    if (this.app && typeof this.app.switchTab === 'function') {
      this.app.switchTab(tabId, viewId);
    }
  }

  setup() {
    // PIN Modal Triggers & Submissions
    this.addSafeListener('btn-admin-auth-close', 'click', () => this.closeAdminAuthModal());
    this.addSafeListener('btn-admin-auth-submit', 'click', () => this.handleAdminPinSubmit());
    this.addSafeListener('btn-admin-auth-fill-default', 'click', () => this.fillDefaultAdminPin());
    this.addSafeListener('btn-admin-auth-toggle-visibility', 'click', () => this.toggleAdminPinVisibility());

    const authModal = document.getElementById('modal-admin-auth');
    if (authModal) {
      authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
          this.closeAdminAuthModal();
        }
      });
    }
    
    const pinInput = document.getElementById('input-admin-pin');
    if (pinInput) {
      pinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleAdminPinSubmit();
      });
    }

    // Global shortcut: Ctrl+Shift+A or Cmd+Shift+A opens Admin
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        this.openAdminAuthModal();
      }
    });

    // Change PIN & Logout
    this.addSafeListener('btn-admin-change-pin', 'click', () => {
      const cur = prompt("Enter current PIN:");
      if (!cur) return;
      const newP = prompt("Enter new PIN (at least 4 characters):");
      if (!newP) return;
      if (this.app.adminController) {
        const res = this.app.adminController.changePin(cur, newP);
        this.showToast(res.message, res.success ? 'success' : 'danger');
      }
    });

    this.addSafeListener('btn-admin-logout', 'click', () => {
      if (this.app.adminController) {
        this.app.adminController.logout();
      }
      this.showToast("🔒 Admin Console Locked.", "info");
      this.switchTab('tab-storefront', 'view-storefront');
    });

    // Backup & Restore
    this.addSafeListener('btn-admin-export-backup', 'click', () => {
      if (this.app.adminController) {
        this.app.adminController.exportConfigJson();
      }
    });

    this.addSafeListener('btn-admin-import-backup-trigger', 'click', () => {
      const fileInput = document.getElementById('input-admin-import-file');
      if (fileInput) fileInput.click();
    });

    const fileInput = document.getElementById('input-admin-import-file');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (this.app.adminController) {
            const res = this.app.adminController.importConfigJson(evt.target.result);
            this.showToast(res.message, res.success ? 'success' : 'danger');
            if (res.success) this.renderAdminAll();
          }
        };
        reader.readAsText(file);
      });
    }

    // Admin Sub-Tab Switching
    const subtabs = [
      { btnId: 'subtab-admin-spreadsheet', panelId: 'admin-panel-spreadsheet' },
      { btnId: 'subtab-admin-taxonomy', panelId: 'admin-panel-taxonomy' },
      { btnId: 'subtab-admin-brands', panelId: 'admin-panel-brands' },
      { btnId: 'subtab-admin-formulas', panelId: 'admin-panel-formulas' },
      { btnId: 'subtab-admin-hero', panelId: 'admin-panel-hero' },
      { btnId: 'subtab-admin-products', panelId: 'admin-panel-products' },
      { btnId: 'subtab-admin-preorders', panelId: 'admin-panel-preorders' },
      { btnId: 'subtab-admin-bundles', panelId: 'admin-panel-bundles' },
      { btnId: 'subtab-admin-printer', panelId: 'admin-panel-printer' },
      { btnId: 'subtab-admin-hazmat', panelId: 'admin-panel-hazmat' },
      { btnId: 'subtab-admin-ai', panelId: 'admin-panel-ai' },
      { btnId: 'subtab-admin-email', panelId: 'admin-panel-email' }
    ];

    subtabs.forEach(st => {
      const btn = document.getElementById(st.btnId);
      if (btn) {
        btn.addEventListener('click', () => {
          subtabs.forEach(s => {
            const b = document.getElementById(s.btnId);
            const p = document.getElementById(s.panelId);
            if (b) {
              if (s.btnId === st.btnId) {
                b.classList.add('active', 'border-primary', 'bg-primary/20', 'text-white');
                b.classList.remove('border-secondary', 'bg-surface', 'text-secondary');
              } else {
                b.classList.remove('active', 'border-primary', 'bg-primary/20', 'text-white');
                b.classList.add('border-secondary', 'bg-surface', 'text-secondary');
              }
            }
            if (p) {
              p.style.display = (s.panelId === st.panelId) ? 'flex' : 'none';
              if (s.panelId === 'admin-panel-bundles' && st.btnId === 'subtab-admin-bundles') {
                if (this.app.renderAdminBundles) this.app.renderAdminBundles();
              }
              if (s.panelId === 'admin-panel-hero' && st.btnId === 'subtab-admin-hero') {
                if (this.app.renderAdminHero) this.app.renderAdminHero();
              }
              if (s.panelId === 'admin-panel-taxonomy' && st.btnId === 'subtab-admin-taxonomy') {
                if (this.app.renderAdminTaxonomy) this.app.renderAdminTaxonomy();
              }
              if (s.panelId === 'admin-panel-brands' && st.btnId === 'subtab-admin-brands') {
                if (this.app.renderAdminBrands) this.app.renderAdminBrands();
              }
            }
          });
        });
      }
    });

    // Taxonomy Manager bindings
    this.addSafeListener('btn-admin-add-department', 'click', () => this.app.openAdminDepartmentModal());
    this.addSafeListener('btn-admin-department-edit-close', 'click', () => this.app.closeAdminDepartmentModal());
    this.addSafeListener('btn-admin-cancel-department', 'click', () => this.app.closeAdminDepartmentModal());
    this.addSafeListener('btn-admin-save-department-submit', 'click', () => this.app.saveAdminDepartmentFromModal());
    this.addSafeListener('btn-batch-goto-taxonomy', 'click', () => {
      const btn = document.getElementById('subtab-admin-taxonomy');
      if (btn) btn.click();
    });

    const deptNameInput = document.getElementById('form-department-name');
    if (deptNameInput) {
      deptNameInput.addEventListener('input', (e) => {
        const idField = document.getElementById('form-department-id');
        if (!idField || !idField.value) {
          const slugField = document.getElementById('form-department-slug');
          if (slugField) {
            slugField.value = 'dept-' + e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          }
        }
      });
    }

    const deptIconInput = document.getElementById('form-department-icon');
    if (deptIconInput) {
      deptIconInput.addEventListener('input', (e) => {
        const glyph = document.getElementById('form-department-icon-preview-glyph');
        if (glyph) glyph.textContent = e.target.value.trim() || 'category';
      });
    }

    // Hero & Landing Designer bindings
    this.addSafeListener('btn-admin-save-hero', 'click', () => this.app.saveHeroFromAdmin());
    this.addSafeListener('btn-admin-reset-hero', 'click', () => this.app.resetHeroFromAdmin());
    this.addSafeListener('btn-admin-add-hero-slide', 'click', () => this.app.addAdminHeroSlide());
    this.addSafeListener('btn-admin-upload-hero-slide', 'click', () => this.app.triggerHeroSlideUpload(null));
    this.addSafeListener('btn-admin-add-hero-jump', 'click', () => this.app.addAdminHeroJump());
    this.addSafeListener('btn-admin-hero-ai-copy', 'click', () => this.app.openHeroAiCopyModal());
    this.addSafeListener('btn-admin-hero-ai-copy-close', 'click', () => this.app.closeHeroAiCopyModal());
    this.addSafeListener('btn-hero-ai-generate-proposals', 'click', () => this.app.generateHeroCopyOptions());
    this.addSafeListener('btn-admin-hero-ai-enhancer-close', 'click', () => this.app.closeHeroAiEnhancer());
    this.addSafeListener('btn-hero-enhance-cancel', 'click', () => this.app.closeHeroAiEnhancer());
    this.addSafeListener('btn-hero-enhance-save', 'click', () => this.app.saveEnhancedSlideImage());
    this.addSafeListener('btn-enhance-view-split', 'click', () => this.app.setEnhancerViewMode('split'));
    this.addSafeListener('btn-enhance-view-enhanced', 'click', () => this.app.setEnhancerViewMode('enhanced'));
    this.addSafeListener('btn-enhance-view-original', 'click', () => this.app.setEnhancerViewMode('original'));

    const heroFileInput = document.getElementById('input-hero-image-upload');
    if (heroFileInput && !heroFileInput.dataset.bound) {
      heroFileInput.dataset.bound = 'true';
      heroFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.app.handleHeroImageUpload(e.target.files[0], this.app._targetUploadSlideIndex);
          e.target.value = '';
        }
      });
    }

    ['slider-finish-specular', 'slider-finish-contrast', 'slider-finish-chroma', 'slider-finish-sharpness', 'slider-finish-bloom'].forEach(id => {
      const slider = document.getElementById(id);
      if (slider && !slider.dataset.bound) {
        slider.dataset.bound = 'true';
        slider.addEventListener('input', () => {
          this.app.updateEnhancerSliderLabels();
          this.app.processEnhancedCanvas();
        });
      }
    });

    // Bundle Configurator bindings
    this.addSafeListener('btn-admin-save-bundle', 'click', () => this.app.saveBundleFromAdmin());
    this.addSafeListener('btn-admin-reset-bundle', 'click', () => this.app.resetBundleFromAdmin());
    this.addSafeListener('btn-admin-add-bundle-slot', 'click', () => this.app.addAdminBundleSlot());

    // View switchers between Card Catalog and Spreadsheet Matrix
    this.addSafeListener('btn-admin-switch-to-spreadsheet', 'click', () => {
      const btn = document.getElementById('subtab-admin-spreadsheet');
      if (btn) btn.click();
    });
    this.addSafeListener('btn-spreadsheet-switch-to-cards', 'click', () => {
      const btn = document.getElementById('subtab-admin-products');
      if (btn) btn.click();
    });

    // Formula Add & Edit Modal bindings
    this.addSafeListener('btn-admin-add-formula', 'click', () => this.app.openAdminFormulaModal());
    this.addSafeListener('btn-admin-formula-edit-close', 'click', () => this.app.closeAdminFormulaModal());
    this.addSafeListener('btn-admin-cancel-formula', 'click', () => this.app.closeAdminFormulaModal());
    this.addSafeListener('btn-admin-save-formula-submit', 'click', () => this.app.saveAdminFormulaFromModal());
    this.addSafeListener('btn-admin-add-component-row', 'click', () => this.app.addComponentRowToModal());

    // Product Fields & Catalog Manager bindings
    this.addSafeListener('btn-admin-add-new-product', 'click', () => this.app.openAdminProductModal());
    this.addSafeListener('btn-admin-product-edit-close', 'click', () => this.app.closeAdminProductModal());
    this.addSafeListener('btn-admin-product-cancel', 'click', () => this.app.closeAdminProductModal());
    this.addSafeListener('btn-admin-product-save', 'click', () => this.app.saveAdminProductFromModal());
    this.addSafeListener('btn-admin-product-delete-permanent', 'click', () => this.app.deleteAdminProductPermanentlyFromModal());
    this.addSafeListener('btn-admin-product-reset-overrides', 'click', () => this.app.resetAdminProductOverridesFromModal());
    this.addSafeListener('btn-admin-product-duplicate-modal', 'click', () => this.app.duplicateAdminProductFromModal());
    this.addSafeListener('btn-admin-product-delete', 'click', () => this.app.resetAdminProductOverridesFromModal());

    // Gemini AI Studio Buttons inside Product Modal
    this.addSafeListener('btn-admin-gemini-copy', 'click', () => this.app.triggerGeminiSalesCopy());
    this.addSafeListener('btn-admin-gemini-video', 'click', () => this.app.triggerGeminiVideoScript());
    this.addSafeListener('btn-admin-gemini-preview-close', 'click', () => this.app.closeGeminiPreviewModal());
    this.addSafeListener('btn-gemini-apply-copy', 'click', () => this.app.applyGeminiSalesCopy());

    // Product Search & Filter bindings
    const prodSearch = document.getElementById('admin-product-search');
    if (prodSearch) {
      prodSearch.addEventListener('input', () => this.app.renderAdminProducts());
    }
    const brandFilter = document.getElementById('admin-product-filter-brand');
    if (brandFilter) {
      brandFilter.addEventListener('change', () => this.app.renderAdminProducts());
    }
    const catFilter = document.getElementById('admin-product-filter-category');
    if (catFilter) {
      catFilter.addEventListener('change', () => this.app.renderAdminProducts());
    }

    // Spreadsheet Suite Setup
    if (this.app.setupAdminSpreadsheet) this.app.setupAdminSpreadsheet();

    // Pre-orders save button
    this.addSafeListener('btn-admin-save-preorders', 'click', () => {
      if (this.app.saveAdminPreorders) this.app.saveAdminPreorders();
    });

    // Citizen Printer Actions
    this.addSafeListener('btn-admin-save-printer', 'click', () => {
      if (this.app.saveAdminPrinterConfig) this.app.saveAdminPrinterConfig();
    });
    this.addSafeListener('btn-admin-download-tspl', 'click', () => {
      if (this.app.downloadAdminTspl) this.app.downloadAdminTspl();
    });
    this.addSafeListener('btn-admin-test-print', 'click', () => {
      if (this.app.triggerAdminTestPrint) this.app.triggerAdminTestPrint();
    });

    // Hazmat save button
    this.addSafeListener('btn-admin-save-hazmat', 'click', () => {
      if (this.app.saveAdminHazmatConfig) this.app.saveAdminHazmatConfig();
    });

    // AI save button
    this.addSafeListener('btn-admin-save-ai', 'click', () => {
      if (this.app.saveAdminAiConfig) this.app.saveAdminAiConfig();
    });

    // Customer Email & AI Communication Hub Bindings
    if (this.app.setupAdminEmailHub) this.app.setupAdminEmailHub();

    // FX Volatility Guard & Dynamic Euro Pricing Setup
    if (this.app.setupFxEngineUI) this.app.setupFxEngineUI();
  }

  openAdminAuthModal() {
    if (this.app.adminController && this.app.adminController.isAuthenticated) {
      const adminView = document.getElementById('view-admin');
      if (adminView) {
        this.switchTab('tab-admin', 'view-admin');
      } else {
        window.location.href = '/?tab=admin';
      }
      return;
    }
    const modal = document.getElementById('modal-admin-auth');
    const err = document.getElementById('admin-pin-error');
    const pin = document.getElementById('input-admin-pin');
    if (modal) {
      if (err) err.classList.add('hidden');
      if (pin) {
        pin.value = '';
        setTimeout(() => pin.focus(), 150);
      }
      modal.classList.add('active');
      modal.classList.add('flex');
    } else {
      window.location.href = '/?tab=admin';
    }
  }

  closeAdminAuthModal() {
    const modal = document.getElementById('modal-admin-auth');
    if (modal) {
      modal.classList.remove('active');
      modal.classList.remove('flex');
    }
  }

  fillDefaultAdminPin() {
    const pin = document.getElementById('input-admin-pin');
    const err = document.getElementById('admin-pin-error');
    if (err) err.classList.add('hidden');
    if (pin) {
      pin.value = 'COAST2026';
      pin.focus();
    }
  }

  toggleAdminPinVisibility() {
    const pin = document.getElementById('input-admin-pin');
    const icon = document.getElementById('icon-admin-pin-visibility');
    if (!pin) return;
    if (pin.type === 'password') {
      pin.type = 'text';
      if (icon) icon.textContent = 'visibility_off';
    } else {
      pin.type = 'password';
      if (icon) icon.textContent = 'visibility';
    }
  }

  handleAdminPinSubmit() {
    const pinInput = document.getElementById('input-admin-pin');
    const err = document.getElementById('admin-pin-error');
    if (!pinInput || !this.app.adminController) return;

    const res = this.app.adminController.login(pinInput.value);
    if (res.success) {
      this.closeAdminAuthModal();
      const adminView = document.getElementById('view-admin');
      if (adminView) {
        this.switchTab('tab-admin', 'view-admin');
        this.showToast("🔓 Master Admin Console Unlocked", "success");
      } else {
        window.location.href = '/?tab=admin';
      }
    } else {
      if (err) {
        err.innerText = res.message;
        err.classList.remove('hidden');
      }
    }
  }

  renderAdminAll() {
    if (this.app.renderAdminSpreadsheet) this.app.renderAdminSpreadsheet();
    if (this.app.renderAdminTaxonomy) this.app.renderAdminTaxonomy();
    if (this.app.renderAdminFormulas) this.app.renderAdminFormulas();
    if (this.app.renderAdminHero) this.app.renderAdminHero();
    if (this.app.renderAdminProducts) this.app.renderAdminProducts();
    if (this.app.renderAdminPreorders) this.app.renderAdminPreorders();
    if (this.app.renderAdminBundles) this.app.renderAdminBundles();
    if (this.app.renderAdminPrinter) this.app.renderAdminPrinter();
    if (this.app.renderAdminHazmat) this.app.renderAdminHazmat();
    if (this.app.renderAdminAI) this.app.renderAdminAI();
    if (this.app.renderAdminEmailHub) this.app.renderAdminEmailHub();
    if (this.app.renderFxStatus) this.app.renderFxStatus();
  }
}
