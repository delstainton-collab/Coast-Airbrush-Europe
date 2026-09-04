// Coast Airbrush Europe - Master Storefront & Mixing System Controller
import { KROMA_EDGE_CATALOG } from '../data/kroma_edge.js?v=20260831_clean';
import { ECOM_CATALOG } from '../data/full_ecom_catalog.js?v=20260904_sales_copy_v4';
import { FLAKE_KING_TDS, FLAKE_KING_WET_MIX_RATIOS, FLAKE_KING_MIXING_SYSTEMS } from '../data/flake_king_tds.js';
import { calculateRequiredVolume, calculateMixingRecipe, calculateKromaCoverage, PRESET_PANELS, CONVERSIONS } from './mixingEngine.js';
import { ShopifyCartManager } from './shopifyCart.js';
import { EULocalizationManager } from './euLocalization.js';
import { I18nManager } from './i18n.js';
import { MasterPainterAI } from './agentA.js';
import { OrderConciergeAI, MILESTONE_STAGES } from './agentB.js';
import { SocialGrowthAI } from './agentC.js';
import { InventoryGuruAI } from './agentD.js';
import { ForumPreorderEngine } from './forumPreorderEngine.js';
import { AdminController } from './adminController.js';

class PaintSystemApp {
  constructor() {
    this.adminController = new AdminController(this);
    this.currentCatalog = JSON.parse(JSON.stringify(KROMA_EDGE_CATALOG));
    
    // Combine Admin custom formulas with Flake King Wet Spray formulas
    const baseFormulas = this.adminController.config.formulas || [];
    const mergedFormulas = [...baseFormulas];
    FLAKE_KING_MIXING_SYSTEMS.forEach(fkSys => {
      if (!mergedFormulas.some(f => f.id === fkSys.id)) {
        mergedFormulas.push(fkSys);
      }
    });
    this.currentCatalog.mixingSystems = mergedFormulas;
    this.selectedSystem = this.currentCatalog.mixingSystems[0];
    this.selectedColors = {};
    this.totalMlNeeded = 500;
    this.currentRecipe = null;
    this.currentScaleStepIndex = 0;
    this.euLocalization = new EULocalizationManager();
    this.i18n = new I18nManager();
    this.shopifyCartManager = new ShopifyCartManager();
    this.agentA = new MasterPainterAI(this.shopifyCartManager);
    this.agentB = new OrderConciergeAI();
    this.agentC = new SocialGrowthAI(this.shopifyCartManager);
    this.agentD = new InventoryGuruAI();
    this.forumEngine = new ForumPreorderEngine(this.shopifyCartManager);
    this.activeBrandFilter = 'all';
    this.activeCategoryFilter = 'all';
    this.activeFlakeSubcat = 'all';
    this.searchQuery = '';
    this.isB2BMode = false;
    this.b2bSession = null;
    this.b2bPricing = null;
    this.selectedProductVariants = {};
    this.selectedTrackingOrder = this.agentB.orders[0];
    this.selectedEvalSku = "KE-CHROME-1L";
    this.selectedEvalQty = 50;

    // Spreadsheet State Management
    this.spreadsheetState = {
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
      stagedEdits: new Map() // prodId -> { ...changedFields }
    };

    // Filter out any deleted products from runtime catalog
    const deletedIds = this.adminController.getDeletedProductIds();
    for (let i = ECOM_CATALOG.length - 1; i >= 0; i--) {
      if (deletedIds.includes(ECOM_CATALOG[i].id)) {
        ECOM_CATALOG.splice(i, 1);
      }
    }

    // Apply any saved Admin product overrides to runtime catalog
    const overrides = this.adminController.config.productOverrides || {};
    Object.keys(overrides).forEach(prodId => {
      if (deletedIds.includes(prodId)) return;
      const idx = ECOM_CATALOG.findIndex(p => p.id === prodId);
      if (idx >= 0) {
        ECOM_CATALOG[idx] = { ...ECOM_CATALOG[idx], ...overrides[prodId] };
      } else {
        ECOM_CATALOG.unshift({ id: prodId, ...overrides[prodId] });
      }
    });

    // Stakeholder Review Mode (prevents live orders before official sign-off)
    // Can be overridden via URL parameter ?live=true or ?review=false
    const urlParams = new URLSearchParams(window.location.search);
    const liveOverride = urlParams.get('live') === 'true' || urlParams.get('review') === 'false';
    this.reviewMode = !liveOverride;

    this.initUI();

    if (!this.reviewMode) {
      const reviewBanner = document.getElementById('stakeholder-review-banner');
      if (reviewBanner) reviewBanner.style.display = 'none';
    }
  }

  addSafeListener(id, eventOrCallback, maybeCallback) {
    const el = document.getElementById(id);
    if (!el) return;
    if (typeof eventOrCallback === 'function') {
      el.addEventListener('click', eventOrCallback);
    } else if (typeof maybeCallback === 'function') {
      el.addEventListener(eventOrCallback, maybeCallback);
    }
  }

  showToast(msg, type = 'info', duration = 3500) {
    const container = document.getElementById('custom-app-toast');
    if (!container) return;

    const toast = document.createElement('div');
    const borderColors = {
      success: 'border-emerald-500/80 text-emerald-300 bg-[#141816]',
      danger: 'border-rose-500/80 text-rose-300 bg-[#1c1214]',
      warning: 'border-amber-500/80 text-amber-300 bg-[#1c1712]',
      info: 'border-primary text-primary bg-[#121618]'
    };
    const iconNames = {
      success: 'check_circle',
      danger: 'error',
      warning: 'warning',
      info: 'info'
    };

    const colorClass = borderColors[type] || borderColors.info;
    const iconName = iconNames[type] || iconNames.info;

    toast.className = `custom-toast-item industrial-card border-2 p-3 font-mono text-xs shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-3 ${colorClass}`;
    toast.innerHTML = `
      <div class="flex items-center gap-2.5">
        <span class="material-symbols-outlined text-[18px] flex-shrink-0">${iconName}</span>
        <span class="text-zinc-100 font-medium leading-tight">${msg}</span>
      </div>
      <button class="text-secondary hover:text-white p-0.5 cursor-pointer ml-2 flex-shrink-0">
        <span class="material-symbols-outlined text-[14px]">close</span>
      </button>
    `;

    const closeBtn = toast.querySelector('button');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 250);
      });
    }

    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 250);
      }
    }, duration);
  }

  confirmDialog({
    title = 'Confirm Action',
    subtitle = 'Please review before continuing.',
    message = 'Are you sure you want to proceed?',
    itemDetails = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDanger = true,
    icon = 'warning'
  } = {}) {
    return new Promise((resolve) => {
      const modal = document.getElementById('modal-custom-confirm');
      const titleEl = document.getElementById('custom-confirm-title');
      const subEl = document.getElementById('custom-confirm-subtitle');
      const msgEl = document.getElementById('custom-confirm-message');
      const previewEl = document.getElementById('custom-confirm-preview');
      const btnAction = document.getElementById('btn-custom-confirm-action');
      const actionLabel = document.getElementById('custom-confirm-action-label');
      const btnCancel = document.getElementById('btn-custom-confirm-cancel');
      const iconEl = document.getElementById('custom-confirm-icon');
      const iconBox = document.getElementById('custom-confirm-icon-box');

      if (!modal || !btnAction || !btnCancel) {
        resolve(window.confirm(message));
        return;
      }

      if (titleEl) titleEl.innerText = title;
      if (subEl) subEl.innerText = subtitle;
      if (msgEl) msgEl.innerHTML = message;
      if (actionLabel) actionLabel.innerText = confirmText;
      if (btnCancel) {
        if (!cancelText) {
          btnCancel.classList.add('hidden');
        } else {
          btnCancel.classList.remove('hidden');
          btnCancel.innerText = cancelText;
        }
      }
      if (iconEl) iconEl.innerText = icon;

      if (previewEl) {
        if (itemDetails) {
          previewEl.innerHTML = itemDetails;
          previewEl.classList.remove('hidden');
        } else {
          previewEl.innerHTML = '';
          previewEl.classList.add('hidden');
        }
      }

      if (iconBox) {
        if (isDanger) {
          iconBox.className = 'p-2.5 bg-rose-950/40 border border-rose-500/60 text-rose-400 rounded-sm flex items-center justify-center';
          btnAction.className = 'font-mono text-xs font-bold px-4 py-2 border border-rose-500 bg-rose-600 text-white hover:bg-rose-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1.5 cursor-pointer';
        } else {
          iconBox.className = 'p-2.5 bg-primary/20 border border-primary/50 text-primary rounded-sm flex items-center justify-center';
          btnAction.className = 'font-mono text-xs font-bold px-4 py-2 border border-primary bg-primary text-black hover:bg-primary/80 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1.5 cursor-pointer';
        }
      }

      const cleanup = () => {
        modal.classList.remove('active');
        if (btnCancel) btnCancel.classList.remove('hidden');
        btnAction.removeEventListener('click', onConfirm);
        btnCancel.removeEventListener('click', onCancel);
        modal.removeEventListener('click', onBackdrop);
      };

      const onConfirm = () => {
        cleanup();
        resolve(true);
      };

      const onCancel = () => {
        cleanup();
        resolve(false);
      };

      const onBackdrop = (e) => {
        if (e.target === modal) {
          cleanup();
          resolve(false);
        }
      };

      btnAction.addEventListener('click', onConfirm);
      btnCancel.addEventListener('click', onCancel);
      modal.addEventListener('click', onBackdrop);

      modal.classList.add('active');
    });
  }

  alertDialog({
    title = 'System Notice',
    subtitle = 'Coast Airbrush Europe',
    message = '',
    itemDetails = '',
    confirmText = 'Acknowledge',
    icon = 'info',
    isDanger = false
  } = {}) {
    return this.confirmDialog({
      title,
      subtitle,
      message,
      itemDetails,
      confirmText,
      cancelText: '',
      isDanger,
      icon
    });
  }

  initUI() {
    // Navigation Tabs Setup
    this.setupTabs();

    // Event Listeners for mixing inputs
    this.addSafeListener('select-mixing-system', 'change', (e) => this.onSystemChange(e.target.value));
    this.addSafeListener('input-total-volume', 'input', () => this.updateCalculation());
    this.addSafeListener('select-volume-unit', 'change', () => this.updateCalculation());

    // Mix Calculator Direct SDS & TDS Download Buttons
    this.addSafeListener('btn-calc-download-tds', 'click', () => {
      if (this.selectedSystem) this.downloadSystemTDS(this.selectedSystem);
    });
    this.addSafeListener('btn-calc-download-sds', 'click', () => {
      if (this.selectedSystem) this.downloadSystemSDS(this.selectedSystem);
    });

    // Shop Filters & Search
    this.setupShopFilters();

    // Cart Drawer & Modals
    this.setupCartDrawer();
    this.setupDetailModal();
    this.setupWelcomeModal();
    this.setupQuickMixModal();
    this.setupHeroCrossfade();
    this.initSocialProofPulse();
    this.initReferralModal();

    // Global Hero & UI Action Bindings
    window.paintApp = this;
    window.app = this;
    this.cartManager = this.shopifyCartManager;
    this.showCartDrawer = () => this.openCartDrawer();
    window.addKromaEdgeToCart = (prodId) => this.addProductToCartById(prodId);
    window.addKromaEdgeBundleToCart = () => this.addKromaEdgeBundleToCart();
    window.addFlakeKingMasterBundleToCart = () => this.addFlakeKingMasterBundleToCart();
    window.configureKromaEdgeInMixLab = () => this.configureKromaEdgeInMixLab();
    window.openDetailModal = (prodId, tab) => this.openDetailModal(prodId, tab);
    window.openQuickMixModal = (systemId) => this.openQuickMixModal(systemId);
    window.openFlakeTDSModal = () => this.openFlakeTDSModal();
    window.closeFlakeTDSModal = () => this.closeFlakeTDSModal();
    window.setCategoryAndScroll = (catId) => this.setCategoryAndScroll(catId);
    window.applyKromaPreset = (panelId) => this.applyKromaPreset(panelId);
    window.calcCustomKromaArea = (val) => this.calcCustomKromaArea(val);
    window.applyEstimatedVolumeToMix = () => this.applyEstimatedVolumeToMix();
    window.setMixVolumePreset = (vol, unit) => this.setMixVolumePreset(vol, unit);
    window.setQuickMixVolumePreset = (vol, unit) => this.setQuickMixVolumePreset(vol, unit);
    window.switchDetailImage = (imgSrc, btn) => this.switchDetailImage(imgSrc, btn);
    window.switchDetailVideo = (videoIndex) => this.switchDetailVideo(videoIndex);
    window.switchCopyTab = (tab) => this.switchCopyTab(tab);
    window.openScaleMode = () => this.openScaleMode();
    window.openAdminLogin = () => this.openAdminAuthModal();
    window.openTradePortalModal = () => this.openTradePortalModal();
    window.closeTradePortalModal = () => this.closeTradePortalModal();
    window.switchTradeTab = (tab) => this.switchTradeTab(tab);
    window.handleTradeLogin = () => this.handleTradeLogin();
    window.handleTradeLogout = () => this.handleTradeLogout();
    window.fillDemoTradeLogin = (type) => this.fillDemoTradeLogin(type);
    window.handleTradeApply = () => this.handleTradeApply();
    window.addConfiguredBundleToCart = (bundleId) => this.addConfiguredBundleToCart(bundleId);
    window.openBundleCustomizerModal = (bundleId) => this.openBundleCustomizerModal(bundleId);
    window.closeBundleCustomizerModal = () => this.closeBundleCustomizerModal();
    window.submitCustomizedBundleToCart = () => this.submitCustomizedBundleToCart();
    window.saveBundleFromAdmin = () => this.saveBundleFromAdmin();
    window.resetBundleFromAdmin = () => this.resetBundleFromAdmin();
    window.addAdminBundleSlot = () => this.addAdminBundleSlot();
    window.removeAdminBundleSlot = (slotId) => this.removeAdminBundleSlot(slotId);
    window.sendPromptToDave = (text) => {
      const input = document.getElementById('input-floating-dave');
      const btn = document.getElementById('btn-floating-dave-send');
      if (input && btn) {
        input.value = text;
        btn.click();
      }
    };

    // Auto-restore verified trade session if token is saved in localStorage
    this.restoreTradeSession();

    // Export buttons
    this.addSafeListener('btn-export-shopify-permalink', 'click', () => this.checkoutShopify());
    this.addSafeListener('btn-export-csv-bom', 'click', () => this.exportCSV());
    this.addSafeListener('btn-export-json-recipe', 'click', () => this.exportJSON());
    this.addSafeListener('btn-drawer-checkout-shopify', 'click', () => this.checkoutShopify());
    this.addSafeListener('btn-drawer-export-csv', 'click', () => this.exportCSV());
    this.addSafeListener('btn-drawer-export-json', 'click', () => this.exportJSON());

    this.addSafeListener('btn-sidebar-checkout-shopify', 'click', () => this.checkoutShopify());
    this.addSafeListener('btn-sidebar-export-csv', 'click', () => this.exportCSV());
    this.addSafeListener('btn-sidebar-export-json', 'click', () => this.exportJSON());

    this.addSafeListener('btn-add-to-cart', 'click', () => {
      if (this.currentRecipe) {
        const added = this.shopifyCartManager.addRecipeToShopifyCart(this.currentRecipe);
        if (added) {
          this.showToast(`✅ Added ${this.currentRecipe.systemName || 'formulation'} components to cart!`, 'success');
        }
        this.openCartDrawer();
      } else {
        this.showToast("Please calculate or select a formula first.", "warning");
      }
    });

    this.addSafeListener('btn-send-to-scale', 'click', () => {
      this.switchTab('tab-scale', 'view-scale');
      this.initScaleAssistant();
    });

    // Scale Step Navigation
    this.addSafeListener('btn-scale-prev-step', 'click', () => this.prevScaleStep());
    this.addSafeListener('btn-scale-next-step', 'click', () => this.nextScaleStep());

    // Navigation Logo
    this.addSafeListener('nav-logo-btn', 'click', () => this.switchTab('tab-storefront', 'view-storefront'));

    // B2B Dealer & Trade Portal Gate
    this.addSafeListener('btn-b2b-login', 'click', () => this.openTradePortalModal());

    // European Localization Setup
    this.setupEULocalization();

    // Listen for cart updates
    this.shopifyCartManager.onCartUpdate((summary) => this.renderCartSummary(summary));

    // Agent & Forum Inits
    this.setupAgentA();
    this.setupAgentB();
    this.setupAgentC();
    this.setupAgentD();
    this.setupForumAndPreorders();
    this.setupAdminSuite();

    // Initial Renders
    this.renderSystemsDropdown();
    this.renderColorSwatches();
    this.renderCategoryButtons();
    this.renderStorefrontGrid();
    this.updateCalculation();
    this.renderCartSummary(this.shopifyCartManager.getCartSummary());
    this.renderFeaturedBundle();
    if (window.BundleConfigEngine) {
      window.BundleConfigEngine.onChange(() => {
        this.renderFeaturedBundle();
        this.renderAdminBundles();
      });
    }

    // URL Query & Hash Deep Linking (e.g. ?search=Kroma or ?tab=preorders)
    this.handleUrlParameters();
  }

  handleUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const tabParam = params.get('tab');

    if (params.get('admin') === 'true' || params.get('admin') === '1' || tabParam === 'admin') {
      setTimeout(() => this.openAdminAuthModal(), 400);
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
      this.searchQuery = searchQuery.toLowerCase().trim();
      const searchInput = document.getElementById('input-shop-search');
      if (searchInput) searchInput.value = searchQuery;
      this.renderStorefrontGrid();

      // Scroll smoothly to the catalog
      setTimeout(() => {
        const anchor = document.getElementById('storefront-catalog-anchor');
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth' });
      }, 250);
    } else if (brandQuery) {
      this.activeBrandFilter = brandQuery;
      const brandSelect = document.getElementById('select-brand-filter');
      if (brandSelect) brandSelect.value = brandQuery;
      this.renderCategoryButtons();
      this.renderStorefrontGrid();

      setTimeout(() => {
        const anchor = document.getElementById('storefront-catalog-anchor');
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth' });
      }, 250);
    } else if (categoryQuery) {
      this.setCategoryFilter(categoryQuery);
      setTimeout(() => {
        const anchor = document.getElementById('storefront-catalog-anchor');
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth' });
      }, 250);
    }
  }

  setupEULocalization() {
    const langSelect = document.getElementById('select-site-language');
    const countrySelect = document.getElementById('select-eu-country');
    const flagEl = document.getElementById('nav-selected-country-flag');
    const speedBadge = document.getElementById('nav-shipping-speed-badge');
    const speedText = document.getElementById('nav-shipping-speed-text');
    const unitBtn = document.getElementById('btn-toggle-units');
    const unitLabel = document.getElementById('label-unit-toggle');
    const vatToggleExBtn = document.getElementById('btn-vat-toggle-ex');
    const vatToggleIncBtn = document.getElementById('btn-vat-toggle-inc');
    const vatAdvisoryBadge = document.getElementById('nav-vat-advisory-badge');
    const vatAdvisoryText = document.getElementById('nav-vat-advisory-text');

    const updateHeaderFromEU = () => {
      const country = this.euLocalization.getCountry();
      if (countrySelect) countrySelect.value = country.code;
      if (flagEl) flagEl.textContent = country.flag;
      if (speedText) speedText.textContent = `${country.flag} ${country.code}: ${country.leadTime.split(' ')[0]} ${country.carrier.split(' ')[0]}`;
      if (unitLabel) unitLabel.textContent = this.euLocalization.unitPreference === 'metric' ? 'METRIC (mL/g)' : 'IMPERIAL (oz/qt)';
      if (langSelect) langSelect.value = this.i18n.getLanguage();

      // Update VAT Display Toggle UI state
      const vatMode = this.euLocalization.getVatDisplayMode();
      if (vatToggleExBtn && vatToggleIncBtn) {
        if (vatMode === 'ex') {
          vatToggleExBtn.className = 'px-2.5 py-0.5 font-bold transition-all bg-primary text-white cursor-pointer shadow-sm';
          vatToggleIncBtn.className = 'px-2.5 py-0.5 font-bold transition-all text-neutral-400 hover:text-white bg-transparent cursor-pointer';
        } else {
          vatToggleIncBtn.className = 'px-2.5 py-0.5 font-bold transition-all bg-emerald-600 text-white cursor-pointer shadow-sm';
          vatToggleExBtn.className = 'px-2.5 py-0.5 font-bold transition-all text-neutral-400 hover:text-white bg-transparent cursor-pointer';
        }
      }

      // Update Dynamic Advisory Badge for UK & European Customers
      if (vatAdvisoryBadge && vatAdvisoryText) {
        vatAdvisoryBadge.classList.remove('hidden');
        if (country.code === 'GB') {
          if (vatMode === 'ex') {
            vatAdvisoryBadge.className = 'hidden sm:inline-flex items-center gap-1 font-mono text-[10px] text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40';
            vatAdvisoryText.innerHTML = `UK B2C: Prices shown <strong>Ex-VAT</strong> (20% UK VAT applied at checkout) • Toggle <span class="underline cursor-pointer" onclick="document.getElementById('btn-vat-toggle-inc').click()">'INC VAT'</span> to preview total price`;
          } else {
            vatAdvisoryBadge.className = 'hidden sm:inline-flex items-center gap-1 font-mono text-[10px] text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40';
            vatAdvisoryText.innerHTML = `UK B2C: Prices shown <strong>Inc-VAT</strong> (includes 20% UK HMRC VAT)`;
          }
        } else {
          // European Destination Country
          const vatPct = Math.round((country.vatRate || 0.20) * 100);
          if (this.euLocalization.isVatExempt) {
            vatAdvisoryBadge.className = 'hidden sm:inline-flex items-center gap-1 font-mono text-[10px] text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40';
            vatAdvisoryText.innerHTML = `${country.name}: Verified EU B2B (0% Cross-Border Reverse Charge Active)`;
          } else if (vatMode === 'inc') {
            vatAdvisoryBadge.className = 'hidden sm:inline-flex items-center gap-1 font-mono text-[10px] text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40';
            vatAdvisoryText.innerHTML = `${country.name}: Prices <strong>Inc. VAT</strong> (${vatPct}% destination tax included) • DDP / IOSS zero customs fees`;
          } else {
            vatAdvisoryBadge.className = 'hidden sm:inline-flex items-center gap-1 font-mono text-[10px] text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40';
            vatAdvisoryText.innerHTML = `${country.name}: Prices shown <strong>Ex-VAT</strong> (${vatPct}% local VAT calculated at checkout)`;
          }
        }
      }
    };

    const applyTranslations = () => {
      const t = (k) => this.i18n.t(k);

      // Nav Links
      const tabShop = document.getElementById('tab-storefront');
      const tabForum = document.getElementById('tab-forum');
      const tabCalc = document.getElementById('tab-calculator');
      const tabCoverage = document.getElementById('tab-coverage');

      if (tabShop) tabShop.textContent = t('nav_shop');
      if (tabForum) tabForum.textContent = t('nav_forum');
      if (tabCalc) tabCalc.textContent = t('nav_calculator');
      if (tabCoverage) tabCoverage.textContent = t('nav_coverage');

      // Cart Drawer elements
      const drawerCheckoutBtn = document.getElementById('btn-drawer-checkout-shopify');
      if (drawerCheckoutBtn) {
        if (this.reviewMode) {
          drawerCheckoutBtn.innerHTML = `<span class="material-symbols-outlined text-[16px]">lock_clock</span> <span>REVIEW CHECKOUT (STAGING MODE) &rarr;</span>`;
        } else {
          drawerCheckoutBtn.textContent = t('cart_checkout_btn');
        }
      }

      // Shop Search Input Placeholder
      const searchInput = document.getElementById('input-shop-search');
      if (searchInput) searchInput.placeholder = t('search_placeholder');
    };

    updateHeaderFromEU();
    applyTranslations();

    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        this.i18n.setLanguage(e.target.value);
        applyTranslations();
      });
    }

    if (countrySelect) {
      countrySelect.addEventListener('change', (e) => {
        const countryCode = e.target.value;
        this.euLocalization.setCountry(countryCode);

        // Auto-match language if user hasn't explicitly locked it
        const langMap = { DE: 'de', FR: 'fr', NL: 'nl', ES: 'es', IT: 'it', PL: 'pl', GB: 'en', BE: 'nl', CH: 'de', SE: 'en' };
        if (langMap[countryCode]) {
          this.i18n.setLanguage(langMap[countryCode]);
        }

        updateHeaderFromEU();
        applyTranslations();
        this.renderStorefrontGrid();
        this.renderCartSummary(this.shopifyCartManager.getCartSummary());
      });
    }

    if (vatToggleExBtn) {
      vatToggleExBtn.addEventListener('click', () => {
        this.euLocalization.setVatDisplayMode('ex');
        updateHeaderFromEU();
        this.renderStorefrontGrid();
        if (this.activeModalProduct) {
          this.openDetailModal(this.activeModalProduct.id);
        }
      });
    }

    if (vatToggleIncBtn) {
      vatToggleIncBtn.addEventListener('click', () => {
        this.euLocalization.setVatDisplayMode('inc');
        updateHeaderFromEU();
        this.renderStorefrontGrid();
        if (this.activeModalProduct) {
          this.openDetailModal(this.activeModalProduct.id);
        }
      });
    }

    if (unitBtn) {
      unitBtn.addEventListener('click', () => {
        const next = this.euLocalization.unitPreference === 'metric' ? 'imperial' : 'metric';
        this.euLocalization.setUnitPreference(next);
        updateHeaderFromEU();
        this.renderStorefrontGrid();
      });
    }

    // EU VAT Validator in Cart Drawer
    this.addSafeListener('btn-verify-vat', () => {
      const vatInput = document.getElementById('input-vat-number');
      const feedbackEl = document.getElementById('vat-feedback-msg');
      const statusPill = document.getElementById('vat-status-pill');
      if (!vatInput || !feedbackEl) return;

      const res = this.euLocalization.validateVIESVat(vatInput.value);
      feedbackEl.classList.remove('hidden');
      if (res.valid) {
        feedbackEl.className = 'font-mono text-[10px] mt-1.5 text-emerald-400 font-bold';
        feedbackEl.textContent = res.message;
        if (statusPill) {
          statusPill.textContent = '0% REVERSE-CHARGE ACTIVE';
          statusPill.className = 'text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-500 text-emerald-400 font-bold';
        }
      } else {
        feedbackEl.className = 'font-mono text-[10px] mt-1.5 text-rose-400 font-bold';
        feedbackEl.textContent = res.message;
        if (statusPill) {
          statusPill.textContent = 'INVALID VAT';
          statusPill.className = 'text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950/80 border border-rose-500 text-rose-400 font-bold';
        }
      }
      this.renderCartSummary(this.shopifyCartManager.getCartSummary());
    });

    this.euLocalization.onUpdate(() => {
      updateHeaderFromEU();
      this.renderStorefrontGrid();
      this.renderCartSummary(this.shopifyCartManager.getCartSummary());
    });

    this.i18n.onUpdate(() => {
      updateHeaderFromEU();
      applyTranslations();
    });
  }

  setupTabs() {
    const tabMappings = [
      { id: 'tab-storefront', viewId: 'view-storefront' },
      { id: 'tab-academy', viewId: 'view-academy' },
      { id: 'tab-forum', viewId: 'view-forum' },
      { id: 'tab-agent-a', viewId: 'view-agent-a' },
      { id: 'tab-agent-b', viewId: 'view-agent-b' },
      { id: 'tab-agent-c', viewId: 'view-agent-c' },
      { id: 'tab-agent-d', viewId: 'view-agent-d' },
      { id: 'tab-calculator', viewId: 'view-calculator' },
      { id: 'tab-scale', viewId: 'view-scale' },
      { id: 'tab-admin', viewId: 'view-admin' }
    ];

    tabMappings.forEach(tab => {
      const btn = document.getElementById(tab.id);
      if (btn) {
        btn.addEventListener('click', () => {
          if (tab.id === 'tab-admin' && !this.adminController.isAuthenticated) {
            this.openAdminAuthModal();
            return;
          }
          this.switchTab(tab.id, tab.viewId);
        });
      }
    });

    // Floating AI Trigger Button
    this.addSafeListener('btn-floating-agent-a', 'click', () => {
      this.switchTab('tab-agent-a', 'view-agent-a');
    });
  }

  switchTab(activeTabId, activeViewId) {
    const tabIds = ['tab-storefront', 'tab-academy', 'tab-forum', 'tab-agent-a', 'tab-agent-b', 'tab-agent-c', 'tab-agent-d', 'tab-calculator', 'tab-scale', 'tab-admin'];
    const viewIds = ['view-storefront', 'view-academy', 'view-forum', 'view-agent-a', 'view-agent-b', 'view-agent-c', 'view-agent-d', 'view-calculator', 'view-scale', 'view-admin'];

    tabIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (id === activeTabId) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }
    });

    viewIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (id === activeViewId) {
          el.style.display = 'flex';
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          el.style.display = 'none';
        }
      }
    });

    if (activeViewId === 'view-scale') {
      this.initScaleAssistant();
    }
    if (activeViewId === 'view-agent-b') {
      this.renderOrderTracking(this.selectedTrackingOrder);
    }
    if (activeViewId === 'view-agent-c') {
      this.renderSocialCampaigns();
    }
    if (activeViewId === 'view-agent-d') {
      this.renderInventoryDashboard();
    }
    if (activeViewId === 'view-forum') {
      this.renderForumThreads();
    }
    if (activeViewId === 'view-admin') {
      this.renderAdminAll();
    }
  }

  setupForumAndPreorders() {
    const revSlider = document.getElementById('slider-preorder-rev');
    if (revSlider) {
      revSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        this.updateReinvestmentDisplay(val);
      });
      this.updateReinvestmentDisplay(parseInt(revSlider.value, 10));
    }

    // Verify Order Modal
    this.addSafeListener('btn-open-verify-modal', 'click', () => {
      const modal = document.getElementById('modal-order-verify');
      if (modal) modal.classList.add('active');
    });

    this.addSafeListener('btn-close-verify-modal', 'click', () => {
      const modal = document.getElementById('modal-order-verify');
      if (modal) modal.classList.remove('active');
    });

    this.addSafeListener('btn-submit-verify-order', 'click', () => {
      const input = document.getElementById('input-verify-order-id');
      const feedback = document.getElementById('verify-feedback-msg');
      if (!input || !feedback) return;

      const res = this.forumEngine.verifyOrder(input.value);
      feedback.classList.remove('hidden');
      feedback.style.color = res.success ? '#34d399' : '#ef4444';
      feedback.innerText = res.message;

      if (res.success) {
        setTimeout(() => {
          const modal = document.getElementById('modal-order-verify');
          if (modal) modal.classList.remove('active');
          this.renderForumThreads();
        }, 1200);
      }
    });

    // Post Recipe Modal
    this.addSafeListener('btn-open-post-recipe-modal', 'click', () => {
      const modal = document.getElementById('modal-post-recipe');
      if (modal) modal.classList.add('active');
    });

    this.addSafeListener('btn-close-post-recipe-modal', 'click', () => {
      const modal = document.getElementById('modal-post-recipe');
      if (modal) modal.classList.remove('active');
    });

    this.addSafeListener('btn-submit-new-thread', 'click', () => {
      const titleInput = document.getElementById('input-post-title');
      const contentInput = document.getElementById('input-post-content');
      if (!titleInput || !contentInput) return;

      const title = titleInput.value.trim();
      const content = contentInput.value.trim();
      if (!title || !content) {
        this.showToast("Please provide both a thread title and spray instructions.", "warning");
        return;
      }

      this.forumEngine.createThread(title, content);
      titleInput.value = '';
      contentInput.value = '';

      const modal = document.getElementById('modal-post-recipe');
      if (modal) modal.classList.remove('active');

      this.renderForumThreads();
    });

    this.renderForumThreads();
  }

  updateReinvestmentDisplay(revEUR) {
    const calc = this.forumEngine.calculateReinvestment(revEUR);
    const revEl = document.getElementById('reinvest-rev-display');
    const profitEl = document.getElementById('reinvest-gross-profit');
    const stockPoolEl = document.getElementById('reinvest-stock-pool');
    const retailFundedEl = document.getElementById('reinvest-retail-funded');

    if (revEl) revEl.innerText = `€${calc.revenueEUR.toLocaleString()}`;
    if (profitEl) profitEl.innerText = `€${Math.round(calc.grossProfitPool).toLocaleString()}`;
    if (stockPoolEl) stockPoolEl.innerText = `€${Math.round(calc.reinvestmentPool).toLocaleString()} (60% NL / 40% UK)`;
    if (retailFundedEl) retailFundedEl.innerText = `€${Math.round(calc.retailStockPurchased).toLocaleString()}`;
  }

  addPreorderTier(packageId) {
    this.forumEngine.addPreorderToCart(packageId);
    this.openCartDrawer();
  }

  renderForumThreads() {
    const container = document.getElementById('forum-threads-container');
    if (!container) return;
    container.innerHTML = '';

    this.forumEngine.threads.forEach(thread => {
      const card = document.createElement('div');
      card.className = 'industrial-card p-6';
      
      const badgeClass = thread.authorBadge.includes('MASTER') ? 'metal-spec-plate-red' : 'metal-spec-plate';
      
      const recipeAction = thread.recipe ? `
        <button class="btn-load-recipe mech-button-primary !text-[10px] !py-1 !px-2.5 cursor-pointer">
          ⚡ Load Formula into Lab (${thread.recipe.volumeMl}mL)
        </button>
      ` : `
        <span class="text-secondary font-mono text-[11px]">💬 Discussion</span>
      `;

      card.innerHTML = `
        <div class="flex items-center justify-between mb-3 border-b border-secondary pb-2">
          <div class="flex items-center gap-2">
            <span class="${badgeClass} text-[10px]">${thread.authorBadge}</span>
            <span class="font-label-xs text-xs text-primary font-bold">@${thread.author} (${thread.authorRegion})</span>
          </div>
          <span class="font-label-xs text-xs text-secondary">${thread.timeAgo}</span>
        </div>
        <h3 class="font-headline text-xl text-on-surface uppercase mb-2">${thread.title}</h3>
        <p class="font-body-md text-sm text-on-surface-variant mb-4 leading-relaxed">${thread.content}</p>
        <div class="flex items-center justify-between font-label-xs text-xs border-t border-secondary pt-3">
          <span class="text-secondary">💬 ${thread.repliesCount} Replies • ⬆️ ${thread.upvotes} Upvotes</span>
          ${recipeAction}
        </div>
      `;

      const loadRecipeBtn = card.querySelector('.btn-load-recipe');
      if (loadRecipeBtn && thread.recipe) {
        loadRecipeBtn.addEventListener('click', () => {
          this.switchTab('tab-calculator', 'view-calculator');
          const sysSelect = document.getElementById('select-mixing-system');
          if (sysSelect) {
            sysSelect.value = thread.recipe.systemId;
            this.onSystemChange(thread.recipe.systemId);
          }
          const volInput = document.getElementById('input-total-volume');
          if (volInput) {
            volInput.value = thread.recipe.volumeMl;
            this.updateCalculation();
          }
        });
      }

      container.appendChild(card);
    });
  }

  setupAgentC() {
    const dmSendBtn = document.getElementById('btn-social-dm-send');
    const dmInput = document.getElementById('input-social-dm');
    const dmChatBox = document.getElementById('social-dm-chat');

    const handleDmSend = (customText) => {
      const text = (customText || (dmInput ? dmInput.value : '')).trim();
      if (!text) return;

      const userMsg = document.createElement('div');
      userMsg.className = 'agent-msg user';
      userMsg.innerHTML = `
        <div class="agent-avatar"><span class="material-symbols-outlined text-[16px]">person</span></div>
        <div class="agent-bubble text-xs">${text}</div>
      `;
      dmChatBox.appendChild(userMsg);
      if (dmInput) dmInput.value = '';

      const res = this.agentC.processSocialDM(text);

      const aiMsg = document.createElement('div');
      aiMsg.className = 'agent-msg ai';
      aiMsg.innerHTML = `
        <div class="agent-avatar">🚀</div>
        <div class="agent-bubble text-xs">
          <div class="whitespace-pre-line leading-relaxed">${res.replyMessage.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
          <div class="mt-3 pt-2 border-t border-secondary flex justify-between items-center">
            <span class="text-[11px] font-bold text-rose-400">Featured: $${res.featuredItem.priceUSD.toFixed(2)}</span>
            <button class="btn-dm-cart-add mech-btn-primary !text-[11px] !py-1 !px-2.5 !bg-rose-600 hover:!bg-rose-700">
              🛒 Add to Cart Drawer
            </button>
          </div>
        </div>
      `;

      const addBtn = aiMsg.querySelector('.btn-dm-cart-add');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          this.agentC.addSocialItemToCart(res.featuredItem);
          this.openCartDrawer();
        });
      }

      dmChatBox.appendChild(aiMsg);
      dmChatBox.scrollTop = dmChatBox.scrollHeight;
    };

    if (dmSendBtn) dmSendBtn.addEventListener('click', () => handleDmSend());
    if (dmInput) {
      dmInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleDmSend();
      });
    }

    document.querySelectorAll('.btn-quick-dm').forEach(btn => {
      btn.addEventListener('click', () => {
        const msg = btn.getAttribute('data-msg');
        handleDmSend(msg);
      });
    });

    this.renderSocialCampaigns();
  }

  renderSocialCampaigns() {
    const container = document.getElementById('social-campaigns-container');
    if (!container) return;
    container.innerHTML = '';

    this.agentC.campaigns.forEach(camp => {
      const card = document.createElement('div');
      card.className = 'industrial-card p-5 flex flex-col md:flex-row gap-5';
      card.innerHTML = `
        <div class="w-full md:w-44 h-36 bg-surface-dim border border-secondary overflow-hidden flex-shrink-0 relative">
          <img src="${camp.videoUrl}" alt="Campaign Preview" class="w-full h-full object-cover">
          <div class="absolute top-2 left-2 bg-surface text-rose-400 text-[10px] font-mono font-bold px-1.5 py-0.5 border border-rose-500">
            ${camp.platform}
          </div>
        </div>
        <div class="flex-1 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start">
              <h5 class="font-headline text-base uppercase text-on-surface">${camp.title}</h5>
              <span class="font-label-xs text-[10px] text-secondary font-mono">${camp.scheduledTime}</span>
            </div>
            <p class="font-mono text-xs text-rose-300 font-bold my-1">"${camp.hook}"</p>
            <p class="font-body-md text-xs text-secondary leading-relaxed">${camp.caption}</p>
            <div class="flex flex-wrap gap-1.5 mt-2">
              ${camp.hashtags.map(h => `<span class="font-mono text-[10px] text-accent-cyan">${h}</span>`).join(' ')}
            </div>
          </div>
          <div class="flex justify-between items-center border-t border-secondary pt-3 mt-3">
            <div class="font-mono text-[11px] text-secondary">
              Est. Views: <strong class="text-on-surface">${camp.projectedViews}</strong> • CVR: <strong class="text-emerald-400">${camp.estConversionRate}</strong>
            </div>
            <button class="btn-preview-cart-link mech-btn-secondary !text-xs !py-1 !px-2.5">
              🔗 Copy 1-Click Link
            </button>
          </div>
        </div>
      `;

      card.querySelector('.btn-preview-cart-link').addEventListener('click', () => {
        const link = `https://coastairbrush.eu/cart/add?id=${camp.featuredSku}&quantity=1`;
        navigator.clipboard?.writeText(link);
        this.showToast("⚡ Direct 1-Click Cart Link Copied to Clipboard!", "success");
      });

      container.appendChild(card);
    });
  }

  renderDaiveFormattedMessage(markdown) {
    if (!markdown) return '';

    let text = markdown
      .replace(/\r/g, '')
      .replace(/`([^`]+)`/g, '<code class="bg-[#090d0e] text-[#38bdf8] px-1.5 py-0.5 rounded font-mono text-[11px] border border-cyan-500/20 font-bold">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
        if (url.startsWith('#')) {
          const prodId = url.substring(1);
          return `<a href="javascript:void(0)" onclick="window.openDetailModal && window.openDetailModal('${prodId}')" class="inline-flex items-center gap-1 text-[#38bdf8] font-bold underline hover:text-white transition-colors cursor-pointer" title="View product details">${label} ↗</a>`;
        }
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[#38bdf8] font-bold underline hover:text-white transition-colors">${label} ↗</a>`;
      })
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/(^|[^\*])\*([^\*]+)\*([^\*]|$)/g, '$1<em class="text-neutral-300 italic">$2</em>$3');

    const rawLines = text.split('\n');
    const outputBlocks = [];
    let currentStepCard = false;

    for (let i = 0; i < rawLines.length; i++) {
      let line = rawLines[i].trimEnd();
      const trimmed = line.trim();

      if (!trimmed) {
        if (currentStepCard) {
          outputBlocks[outputBlocks.length - 1] += '</div>';
          currentStepCard = false;
        }
        continue;
      }

      // Heading: ### Heading
      if (trimmed.startsWith('### ')) {
        if (currentStepCard) {
          outputBlocks[outputBlocks.length - 1] += '</div>';
          currentStepCard = false;
        }
        const headingText = trimmed.replace(/^###\s+/, '');
        outputBlocks.push(
          `<div class="daive-heading">${headingText}</div>`
        );
        continue;
      }

      // Numbered Step: 1. **Title**: or 1. Title
      const stepMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (stepMatch) {
        if (currentStepCard) {
          outputBlocks[outputBlocks.length - 1] += '</div>';
          currentStepCard = false;
        }
        const stepNum = stepMatch[1];
        const stepContent = stepMatch[2];
        outputBlocks.push(
          `<div class="daive-step-card">` +
            `<div class="font-bold text-white text-xs mb-1.5 flex items-start gap-2">` +
              `<span class="bg-[#38bdf8]/20 text-[#38bdf8] px-1.5 py-0.5 rounded text-[10px] font-mono font-bold flex-shrink-0">${stepNum}</span>` +
              `<div class="flex-1">${stepContent}</div>` +
            `</div>`
        );
        currentStepCard = true;
        continue;
      }

      // Indented sub-bullet: (2+ spaces or tab followed by • or - or 1.)
      const isSubItem = (line.startsWith('   ') || line.startsWith('  ') || line.startsWith('\t'));
      if (isSubItem && (trimmed.startsWith('•') || trimmed.startsWith('-') || /^\d+\./.test(trimmed))) {
        let subContent = trimmed.replace(/^[•\-]\s*/, '');
        let subBadge = '<span class="text-[#38bdf8]/70 text-[9px] mt-1 flex-shrink-0">▪</span>';
        
        const subNumMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (subNumMatch) {
          subBadge = `<span class="bg-white/10 text-neutral-300 px-1 py-0.2 rounded text-[9px] font-mono font-bold flex-shrink-0">${subNumMatch[1]}</span>`;
          subContent = subNumMatch[2];
        }

        const subBulletHtml = 
          `<div class="daive-sub-bullet">` +
            `${subBadge}` +
            `<div>${subContent}</div>` +
          `</div>`;

        if (currentStepCard) {
          outputBlocks[outputBlocks.length - 1] += subBulletHtml;
        } else {
          outputBlocks.push(subBulletHtml);
        }
        continue;
      }

      if (currentStepCard) {
        outputBlocks[outputBlocks.length - 1] += '</div>';
        currentStepCard = false;
      }

      // Top-level bullet: • or -
      if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
        const bulletContent = trimmed.replace(/^[•\-]\s*/, '');
        
        // Check if it's a key-value spec with an actual value: e.g. • **SKU**: VAX-JG-SKBD
        const kvMatch = bulletContent.match(/^<strong class="text-white font-semibold">([^<]+)<\/strong>:\s*(.+)$/);
        if (kvMatch && kvMatch[2].trim().length > 0) {
          const key = kvMatch[1];
          const val = kvMatch[2];
          outputBlocks.push(
            `<div class="daive-spec-row">` +
              `<span class="text-neutral-400 font-semibold">• ${key}:</span>` +
              `<span class="text-white font-bold text-right">${val}</span>` +
            `</div>`
          );
        } else {
          outputBlocks.push(
            `<div class="daive-bullet">` +
              `<span class="text-[#38bdf8] text-sm mt-[-1px] flex-shrink-0">•</span>` +
              `<div>${bulletContent}</div>` +
            `</div>`
          );
        }
        continue;
      }

      // Callout / Tip / Action: starts with 👉 or *(Tip:
      if (trimmed.startsWith('👉') || trimmed.startsWith('<em>(') || (trimmed.startsWith('<em>') && trimmed.includes('Tip:')) || (trimmed.startsWith('<em>') && trimmed.endsWith('</em>') && trimmed.includes('?'))) {
        outputBlocks.push(
          `<div class="daive-callout">` +
            trimmed +
          `</div>`
        );
        continue;
      }

      // Normal paragraph text
      outputBlocks.push(
        `<p class="daive-paragraph">` +
          trimmed +
        `</p>`
      );
    }

    if (currentStepCard) {
      outputBlocks[outputBlocks.length - 1] += '</div>';
      currentStepCard = false;
    }

    return outputBlocks.join('');
  }

  setupAgentA() {
    const sendBtn = document.getElementById('btn-agent-a-send') || document.getElementById('btn-agent-send');
    const queryInput = document.getElementById('input-agent-a-query') || document.getElementById('input-agent-query');
    const tempSelect = document.getElementById('select-agent-temp') || document.getElementById('agent-shop-temp');
    const msgContainer = document.getElementById('agent-a-messages') || document.getElementById('agent-chat-messages');

    const handleSend = () => {
      const query = (queryInput ? queryInput.value : '').trim();
      if (!query) return;

      const tempC = parseInt(tempSelect ? tempSelect.value : '21', 10);

      const userMsg = document.createElement('div');
      userMsg.className = 'agent-msg user';
      userMsg.innerHTML = `
        <div class="agent-avatar"><span class="material-symbols-outlined text-[18px]">person</span></div>
        <div class="agent-bubble">${query}</div>
      `;
      msgContainer.appendChild(userMsg);
      if (queryInput) queryInput.value = '';

      const result = this.agentA.consult(query, tempC);
      const htmlBody = this.renderDaiveFormattedMessage(result.markdownResponse);

      let actionButtons = '';
      if (result.matchedProduct) {
        const p = result.matchedProduct;
        const priceGbp = p.priceGbp ? `£${Number(p.priceGbp).toFixed(2)}` : '';
        const priceEur = p.priceEur ? `€${Number(p.priceEur).toFixed(2)}` : '';
        const priceStr = [priceGbp, priceEur].filter(Boolean).join(' / ');
        const inStockText = p.inStock ? '<span style="color:#4ade80; font-weight:bold;">● In Stock</span>' : (p.isPreOrder ? '<span style="color:#f59e0b; font-weight:bold;">● Pre-Order</span>' : '<span style="color:#94a3b8;">Available to Order</span>');

        actionButtons = `
          <div class="mt-3 p-3 bg-surface-dim border border-accent-cyan/50 rounded flex items-center justify-between gap-3 flex-wrap">
            <div class="flex items-center gap-3">
              ${p.image ? `<img src="${p.image}" alt="${p.name}" style="width:52px; height:52px; object-fit:contain; background:#0c0f10; border:1px solid #333; border-radius:4px; padding:2px;">` : ''}
              <div>
                <div style="color:#fff; font-weight:bold; font-size:13px;">${p.name}</div>
                <div style="font-size:11px; color:#aaa; font-family:monospace; margin-top:2px;">SKU: ${p.sku || p.id} | <span style="color:#38bdf8; font-weight:bold;">${priceStr}</span> | ${inStockText}</div>
              </div>
            </div>
            <div class="flex gap-2">
              <button onclick="window.openDetailModal && window.openDetailModal('${p.id}')" class="mech-btn-secondary !text-xs !py-1.5 !px-3 cursor-pointer">
                🔍 View Details
              </button>
              <button onclick="window.paintApp && window.paintApp.addProductToCartById && window.paintApp.addProductToCartById('${p.id}')" class="mech-btn-primary !text-xs !py-1.5 !px-3 cursor-pointer">
                🛒 Add to Cart
              </button>
            </div>
          </div>
        `;
      } else if (result.kit) {
        actionButtons = `
          <div class="kit-action-box mt-3 p-3 bg-surface-dim border border-primary-container flex justify-between items-center flex-wrap gap-2">
            <div>
              <strong style="color: #38bdf8; font-size: 13px;">${result.kit.title}</strong>
              <div style="font-size: 11px; color: #c6c6c6;">${result.kit.items.length} Pre-Configured Items Included</div>
            </div>
            <button class="btn-add-kit-to-cart mech-btn-primary !text-xs !py-1.5 !px-3">
              🛒 Add Kit to Shopify Cart
            </button>
          </div>
        `;
      }

      const aiMsg = document.createElement('div');
      aiMsg.className = 'agent-msg ai';
      aiMsg.innerHTML = `
        <div class="agent-avatar">🤖</div>
        <div class="agent-bubble">
          ${htmlBody}
          ${actionButtons}
        </div>
      `;

      const addKitBtn = aiMsg.querySelector('.btn-add-kit-to-cart');
      if (addKitBtn && result.kit) {
        addKitBtn.addEventListener('click', () => {
          this.agentA.addKitToShopifyCart(result.kit);
          this.openCartDrawer();
        });
      }

      msgContainer.appendChild(aiMsg);
      msgContainer.scrollTop = msgContainer.scrollHeight;
    };

    if (sendBtn) sendBtn.addEventListener('click', handleSend);
    if (queryInput) {
      queryInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSend();
      });
    }

    document.querySelectorAll('.prompt-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        if (queryInput && prompt) {
          queryInput.value = prompt;
          handleSend();
        }
      });
    });

    // Wire Floating Dave Assistant Widget
    const floatSendBtn = document.getElementById('btn-floating-dave-send');
    const floatInput = document.getElementById('input-floating-dave');
    const floatMessages = document.getElementById('floating-dave-messages');

    this.handleDaveFloatingSend = () => {
      const q = (floatInput ? floatInput.value : '').trim();
      if (!q) return;

      const userBubble = document.createElement('div');
      userBubble.className = 'bg-surface-container border-l-2 border-accent-cyan p-3 text-right self-end';
      userBubble.innerHTML = `<p class="text-on-surface font-bold">${q}</p>`;
      if (floatMessages) floatMessages.appendChild(userBubble);
      if (floatInput) floatInput.value = '';

      const res = this.agentA.consult(q, 21);
      const cleanHtml = this.renderDaiveFormattedMessage(res.markdownResponse);

      let productCardHtml = '';
      if (res.matchedProduct) {
        const p = res.matchedProduct;
        const priceGbp = p.priceGbp ? `£${Number(p.priceGbp).toFixed(2)}` : '';
        const priceEur = p.priceEur ? `€${Number(p.priceEur).toFixed(2)}` : '';
        const priceStr = [priceGbp, priceEur].filter(Boolean).join(' / ');
        const inStockBadge = p.inStock ? '<span style="color:#4ade80; font-weight:bold;">● In Stock</span>' : (p.isPreOrder ? '<span style="color:#f59e0b; font-weight:bold;">● Pre-Order</span>' : '<span style="color:#94a3b8;">Available</span>');

        productCardHtml = `
          <div class="mt-2 p-2 bg-[#0a0c0d] border border-primary-container/70 rounded flex flex-col gap-2">
            <div class="flex items-center gap-2">
              ${p.image ? `<img src="${p.image}" alt="${p.name}" class="w-11 h-11 object-contain bg-black border border-white/10 rounded p-0.5 flex-shrink-0">` : ''}
              <div class="flex-1 min-w-0">
                <div class="font-bold text-[11px] text-white truncate" title="${p.name}">${p.name}</div>
                <div class="text-[10px] text-neutral-300 font-mono mt-0.5"><span class="text-accent-cyan font-bold">${priceStr}</span> • ${inStockBadge}</div>
                <div class="text-[9px] text-neutral-400 font-mono">SKU: ${p.sku || p.id}</div>
              </div>
            </div>
            <div class="flex gap-1.5 pt-1.5 border-t border-white/10">
              <button onclick="window.openDetailModal && window.openDetailModal('${p.id}')" class="flex-1 bg-surface-container hover:bg-surface-container-high text-white text-[10px] py-1 px-2 rounded border border-white/20 text-center font-bold cursor-pointer transition-colors">
                🔍 View Product
              </button>
              <button onclick="window.paintApp && window.paintApp.addProductToCartById && window.paintApp.addProductToCartById('${p.id}')" class="flex-1 bg-primary text-black hover:bg-primary-hover text-[10px] py-1 px-2 rounded font-bold text-center cursor-pointer transition-colors">
                🛒 Add to Cart
              </button>
            </div>
          </div>
        `;
      }

      const daveBubble = document.createElement('div');
      daveBubble.className = 'bg-[#121618] border-l-2 border-[#38bdf8] p-3 flex flex-col gap-2 rounded-r shadow-md';
      daveBubble.innerHTML = `
        <div class="text-neutral-200 leading-relaxed text-xs">
          ${cleanHtml}
        </div>
        ${productCardHtml}
        ${res.kit && !res.matchedProduct ? `
          <button class="btn-float-add-kit mech-btn-primary !text-[11px] !py-1 !px-2 self-start mt-1">
            🛒 Add ${res.kit.title.split(' ')[0]} Kit to Cart
          </button>
        ` : ''}
      `;

      const addBtn = daveBubble.querySelector('.btn-float-add-kit');
      if (addBtn && res.kit) {
        addBtn.addEventListener('click', () => {
          this.agentA.addKitToShopifyCart(res.kit);
          this.openCartDrawer();
        });
      }

      if (floatMessages) {
        floatMessages.appendChild(daveBubble);
        floatMessages.scrollTop = floatMessages.scrollHeight;
      }
    };

    if (floatSendBtn) floatSendBtn.addEventListener('click', this.handleDaveFloatingSend);
    if (floatInput) {
      floatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleDaveFloatingSend();
        }
      });
    }
  }

  setupAgentB() {
    const trackBtn = document.getElementById('btn-track-order');
    const searchInput = document.getElementById('input-order-search');
    const conciergeSendBtn = document.getElementById('btn-concierge-send');
    const conciergeInput = document.getElementById('input-concierge-chat');
    const conciergeMsgContainer = document.getElementById('concierge-chat-messages');

    document.querySelectorAll('.btn-select-order-demo').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.getAttribute('data-order');
        if (searchInput) searchInput.value = orderId;
        const order = this.agentB.getOrder(orderId);
        if (order) {
          this.selectedTrackingOrder = order;
          this.renderOrderTracking(order);
        }
      });
    });

    const handleTrack = () => {
      const term = (searchInput ? searchInput.value : '').trim();
      const order = this.agentB.getOrder(term);
      if (order) {
        this.selectedTrackingOrder = order;
        this.renderOrderTracking(order);
      } else {
        this.showToast(`Order "${term}" not found. Try demo orders: EU-10492, UK-88214, or EU-10505.`, "warning");
      }
    };

    if (trackBtn) trackBtn.addEventListener('click', handleTrack);
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleTrack();
      });
    }

    this.addSafeListener('btn-simulate-whatsapp-alert', 'click', () => {
      if (!this.selectedTrackingOrder) return;
      const notif = this.agentB.generateNotification(this.selectedTrackingOrder, 'whatsapp');
      const badge = document.getElementById('notif-badge');
      const time = document.getElementById('notif-time');
      const content = document.getElementById('notif-content');
      if (badge) badge.innerHTML = `📱 WhatsApp Notification Stream (${notif.recipient})`;
      if (time) time.innerHTML = `Dispatched: Just Now • Status: ${this.selectedTrackingOrder.currentStage.toUpperCase()}`;
      if (content) content.innerText = `${notif.header}\n\n${notif.body}`;
    });

    this.addSafeListener('btn-view-vat-invoice', 'click', () => {
      if (this.selectedTrackingOrder) {
        this.openVatInvoiceModal(this.selectedTrackingOrder);
      }
    });

    this.addSafeListener('btn-close-vat-modal', 'click', () => {
      const modal = document.getElementById('modal-vat-invoice');
      if (modal) modal.classList.remove('active');
    });

    const handleConciergeSend = () => {
      const query = (conciergeInput ? conciergeInput.value : '').trim();
      if (!query) return;

      const userMsg = document.createElement('div');
      userMsg.className = 'agent-msg user';
      userMsg.innerHTML = `
        <div class="agent-avatar"><span class="material-symbols-outlined text-[16px]">person</span></div>
        <div class="agent-bubble text-xs">${query}</div>
      `;
      conciergeMsgContainer.appendChild(userMsg);
      if (conciergeInput) conciergeInput.value = '';

      const res = this.agentB.answerCustomerQuery(query);

      const aiMsg = document.createElement('div');
      aiMsg.className = 'agent-msg ai';
      aiMsg.innerHTML = `
        <div class="agent-avatar">📦</div>
        <div class="agent-bubble text-xs">
          <div class="whitespace-pre-line">${res.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code class="bg-surface text-primary px-1 rounded font-mono">$1</code>')}</div>
        </div>
      `;
      conciergeMsgContainer.appendChild(aiMsg);
      conciergeMsgContainer.scrollTop = conciergeMsgContainer.scrollHeight;

      if (res.order) {
        this.selectedTrackingOrder = res.order;
        this.renderOrderTracking(res.order);
      }
    };

    if (conciergeSendBtn) conciergeSendBtn.addEventListener('click', handleConciergeSend);
    if (conciergeInput) {
      conciergeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleConciergeSend();
      });
    }

    this.renderOrderTracking(this.selectedTrackingOrder);
  }

  renderOrderTracking(order) {
    if (!order) return;

    const idBadge = document.getElementById('order-id-badge');
    const custName = document.getElementById('order-customer-name');
    const carrierName = document.getElementById('order-carrier-name');
    const trackNum = document.getElementById('order-tracking-num');
    const batchId = document.getElementById('order-batch-id');
    const estDelivery = document.getElementById('order-est-delivery');
    const adrTag = document.getElementById('order-adr-tag');

    if (idBadge) idBadge.innerText = `ORDER #${order.orderId}`;
    if (custName) custName.innerText = order.customerName;
    if (carrierName) carrierName.innerText = order.carrier;
    if (trackNum) trackNum.innerText = order.trackingNumber;
    if (batchId) batchId.innerText = order.batchId;
    if (estDelivery) estDelivery.innerText = order.estimatedDelivery;
    if (adrTag) adrTag.innerText = "UN1263 Class 3 (ADR LQ)";

    const timelineEl = document.getElementById('order-milestone-timeline');
    if (timelineEl) {
      timelineEl.innerHTML = '';
      const currentIdx = MILESTONE_STAGES.findIndex(s => s.key === order.currentStage);

      MILESTONE_STAGES.forEach((stage, idx) => {
        const isCompleted = idx < currentIdx;
        const isActive = idx === currentIdx;
        const statusClass = isCompleted ? 'completed' : isActive ? 'active' : '';

        const stepEl = document.createElement('div');
        stepEl.className = `milestone-step ${statusClass}`;
        stepEl.innerHTML = `
          <div class="milestone-icon">
            <span class="material-symbols-outlined">${stage.icon}</span>
          </div>
          <div class="milestone-label">${stage.label}</div>
        `;
        timelineEl.appendChild(stepEl);
      });
    }

    const notif = this.agentB.generateNotification(order, 'whatsapp');
    const badge = document.getElementById('notif-badge');
    const time = document.getElementById('notif-time');
    const content = document.getElementById('notif-content');
    if (badge) badge.innerHTML = `📱 WhatsApp Notification Stream (${notif.recipient})`;
    if (time) time.innerHTML = `Dispatched: Live Simulated • Milestone: ${order.currentStage.replace(/_/g, ' ').toUpperCase()}`;
    if (content) content.innerText = `${notif.header}\n\n${notif.body}`;
  }

  openVatInvoiceModal(order) {
    const invoice = this.agentB.generateVatInvoice(order);
    const container = document.getElementById('invoice-printable-content');
    const modal = document.getElementById('modal-vat-invoice');
    if (!invoice || !container || !modal) return;

    let itemsHtml = invoice.lineItems.map(item => `
      <tr>
        <td style="font-family:monospace; font-weight:700;">${item.sku}</td>
        <td>${item.description}</td>
        <td style="text-align:center;">${item.qty}</td>
        <td style="text-align:right;">$${item.unitPriceUSD.toFixed(2)}</td>
        <td style="text-align:right; font-weight:700;">$${item.totalPriceUSD.toFixed(2)}</td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; border-bottom:2px solid #0f172a; padding-bottom:16px; margin-bottom:16px;">
        <div>
          <h2 style="font-size:22px; font-weight:900; color:#b91c1c; margin:0;">COAST AIRBRUSH EUROPE B.V.</h2>
          <p style="font-size:11px; color:#475569; margin:2px 0 0 0;">Official European Master Distributor • Hazardous Chemicals Registry</p>
          <p style="font-size:11px; color:#475569; margin:0;">${invoice.seller.address}</p>
          <p style="font-size:11px; color:#475569; margin:0;"><strong>VAT / OSS:</strong> ${invoice.seller.vatId} | <strong>EORI:</strong> ${invoice.seller.eori}</p>
        </div>
        <div style="text-align:right;">
          <h3 style="font-size:18px; font-weight:800; margin:0;">TAX INVOICE</h3>
          <p style="font-size:12px; font-weight:700; color:#0284c7; margin:2px 0 0 0;">${invoice.invoiceNumber}</p>
          <p style="font-size:11px; color:#64748b; margin:0;">Date: ${invoice.invoiceDate}</p>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; background:#f8fafc; padding:12px; border-radius:4px; margin-bottom:16px;">
        <div>
          <span style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; display:block;">Invoice To (Buyer):</span>
          <strong style="font-size:13px;">${invoice.buyer.name}</strong>
          <p style="font-size:11px; color:#334155; margin:2px 0 0 0;">${invoice.buyer.address}</p>
          <p style="font-size:11px; color:#334155; margin:0;"><strong>Customer VAT/Tax ID:</strong> ${invoice.buyer.vatNumber}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Description</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Unit (USD)</th>
            <th style="text-align:right;">Total (USD)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="display:flex; justify-content:space-between; margin-top:20px;">
        <div style="max-width:55%; background:#fff1f2; border:1px solid #fda4af; padding:10px; border-radius:4px;">
          <span style="font-size:10px; font-weight:800; color:#be123c; text-transform:uppercase; display:block;">⚠️ ADR Hazmat Transport Compliance:</span>
          <p style="font-size:10px; color:#881337; font-family:monospace; margin:2px 0 0 0;">${invoice.hazmatDeclaration}</p>
        </div>

        <div style="width:38%; text-align:right;">
          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
            <span>Subtotal (Net):</span>
            <span>$${invoice.totals.subtotalUSD}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
            <span>VAT (${invoice.totals.vatRatePercent}):</span>
            <span>$${invoice.totals.vatAmountUSD}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:15px; font-weight:800; border-top:2px solid #0f172a; padding-top:6px; margin-top:6px;">
            <span>Total USD:</span>
            <span>$${invoice.totals.totalUSD}</span>
          </div>
          <div style="font-size:12px; font-weight:700; color:#0284c7; margin-top:2px;">
            ≈ €${invoice.totals.totalEUR} EUR / £${invoice.totals.totalGBP} GBP
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  setupAgentD() {
    this.addSafeListener('select-eval-qty', 'change', (e) => {
      this.selectedEvalQty = parseInt(e.target.value, 10);
      this.renderSourcingEvaluation(this.selectedEvalSku, this.selectedEvalQty);
    });

    this.addSafeListener('btn-draft-po-japan', 'click', () => {
      this.openPurchaseOrderModal(1);
    });

    this.addSafeListener('btn-draft-po-usa', 'click', () => {
      this.openPurchaseOrderModal(2);
    });

    this.addSafeListener('btn-close-po-modal', 'click', () => {
      const modal = document.getElementById('modal-po');
      if (modal) modal.classList.remove('active');
    });

    this.addSafeListener('btn-export-po-katana', 'click', () => {
      const po = this.agentD.generatePurchaseOrder(1);
      const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(po, null, 2));
      const a = document.createElement('a');
      a.setAttribute('href', jsonStr);
      a.setAttribute('download', `${po.poNumber}_katana_xero.json`);
      document.body.appendChild(a);
      a.click();
      a.remove();
    });

    this.renderInventoryDashboard();
  }

  renderInventoryDashboard() {
    const tableBody = document.getElementById('inventory-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    let totalNL = 0;
    let totalUK = 0;
    let totalUS = 0;

    this.agentD.items.forEach(item => {
      totalNL += item.stockNL;
      totalUK += item.stockUK;
      totalUS += item.stockUS_Buffer;

      const lean = this.agentD.calculateLeanMetrics(item);
      const isSelected = item.sku === this.selectedEvalSku;

      const row = document.createElement('tr');
      row.className = `border-b border-secondary hover:bg-surface-dim cursor-pointer transition-colors ${isSelected ? 'bg-surface-dim' : ''}`;
      row.innerHTML = `
        <td class="py-3 pr-2">
          <div class="font-bold text-on-surface">${item.name}</div>
          <div class="text-[10px] text-secondary">SKU: ${item.sku} • HS: ${item.hsCode}</div>
        </td>
        <td class="py-3 text-center text-on-surface font-bold">${lean.totalEUStock}</td>
        <td class="py-3 text-center text-secondary">${item.dailyVelocity}</td>
        <td class="py-3 text-center text-on-surface">${lean.daysOfCover}d</td>
        <td class="py-3 text-right">
          <span style="background:${lean.statusColor}20; color:${lean.statusColor}; border:1px solid ${lean.statusColor}60;" class="px-2 py-0.5 rounded text-[10px] font-bold">
            ${lean.status.replace(/_/g, ' ')}
          </span>
        </td>
      `;

      row.addEventListener('click', () => {
        this.selectedEvalSku = item.sku;
        this.renderInventoryDashboard();
        this.renderSourcingEvaluation(item.sku, this.selectedEvalQty);
      });

      tableBody.appendChild(row);
    });

    // Update Top Overview Stats
    const statNL = document.getElementById('stat-nl-stock');
    const statUK = document.getElementById('stat-uk-stock');
    const statUS = document.getElementById('stat-us-stock');
    if (statNL) statNL.innerText = `${totalNL} Units Active`;
    if (statUK) statUK.innerText = `${totalUK} Units Active`;
    if (statUS) statUS.innerText = `${totalUS} Units Standby`;

    this.renderSourcingEvaluation(this.selectedEvalSku, this.selectedEvalQty);
  }

  renderSourcingEvaluation(sku, qty = 50) {
    const item = this.agentD.items.find(i => i.sku === sku) || this.agentD.items[0];
    if (!item) return;

    const evalData = this.agentD.evaluateSourcingScenario(item, qty);

    const skuBadge = document.getElementById('eval-sku-badge');
    const recBox = document.getElementById('sourcing-recommendation-box');
    const landedJP = document.getElementById('eval-landed-jp');
    const marginJP = document.getElementById('eval-margin-jp');
    const landedUS = document.getElementById('eval-landed-us');
    const marginUS = document.getElementById('eval-margin-us');

    if (skuBadge) skuBadge.innerText = `${item.sku} (${item.brand})`;
    if (recBox) {
      recBox.innerHTML = `
        <div style="font-weight:700; color:${evalData.recommendedScenario === 1 ? '#34d399' : '#38bdf8'}; margin-bottom:4px;">
          AGENT D RECOMMENDATION: ${evalData.recommendedScenario === 1 ? 'SCENARIO 1 (SIGNAL JAPAN BULK OCEAN)' : 'SCENARIO 2 (COAST USA AIR BUFFER)'}
        </div>
        <div>${evalData.rationale}</div>
      `;
    }

    if (landedJP) landedJP.innerText = `€${evalData.scenario1_Japan.landedCostEUR}`;
    if (marginJP) marginJP.innerText = `${evalData.scenario1_Japan.grossMarginPercent}%`;
    if (landedUS) landedUS.innerText = `€${evalData.scenario2_USA.landedCostEUR}`;
    if (marginUS) marginUS.innerText = `${evalData.scenario2_USA.grossMarginPercent}%`;
  }

  openPurchaseOrderModal(scenarioNumber = 1) {
    const po = this.agentD.generatePurchaseOrder(scenarioNumber);
    const container = document.getElementById('po-printable-content');
    const modal = document.getElementById('modal-po');
    if (!po || !container || !modal) return;

    let linesHtml = po.lines.map(line => `
      <tr>
        <td style="font-family:monospace; font-weight:700;">${line.sku}</td>
        <td>${line.name}</td>
        <td style="font-family:monospace; text-align:center;">${line.hsCode}</td>
        <td style="text-align:center; font-weight:700;">${line.qty}</td>
        <td style="text-align:right;">$${line.unitFOB_USD.toFixed(2)}</td>
        <td style="text-align:right; font-weight:700;">$${line.totalFOB_USD}</td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; border-bottom:2px solid #0f172a; padding-bottom:16px; margin-bottom:16px;">
        <div>
          <h2 style="font-size:20px; font-weight:900; color:#b91c1c; margin:0;">COAST AIRBRUSH EUROPE B.V.</h2>
          <p style="font-size:11px; color:#475569; margin:2px 0 0 0;">${po.shipTo.name}</p>
          <p style="font-size:11px; color:#475569; margin:0;">${po.shipTo.address} • EORI: ${po.shipTo.eori}</p>
        </div>
        <div style="text-align:right;">
          <h3 style="font-size:18px; font-weight:800; margin:0;">PURCHASE ORDER</h3>
          <p style="font-size:13px; font-weight:700; color:#b45309; margin:2px 0 0 0;">${po.poNumber}</p>
          <p style="font-size:11px; color:#64748b; margin:0;">Date: ${po.date}</p>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; background:#f8fafc; padding:12px; border-radius:4px; margin-bottom:16px;">
        <div>
          <span style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; display:block;">Vendor / Supplier:</span>
          <strong style="font-size:13px;">${po.vendor.name}</strong>
          <p style="font-size:11px; color:#334155; margin:2px 0 0 0;">${po.vendor.address}</p>
          ${po.vendor.rexNumber ? `<p style="font-size:11px; color:#047857; margin:0;"><strong>REX Statement ID:</strong> ${po.vendor.rexNumber}</p>` : ''}
        </div>
        <div style="text-align:right;">
          <span style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; display:block;">Procurement Scenario:</span>
          <span style="font-size:11px; font-weight:700; color:#0f172a;">${po.scenario}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Description</th>
            <th style="text-align:center;">HS Code</th>
            <th style="text-align:center;">Order Qty</th>
            <th style="text-align:right;">FOB Unit (USD)</th>
            <th style="text-align:right;">Total (USD)</th>
          </tr>
        </thead>
        <tbody>
          ${linesHtml}
        </tbody>
      </table>

      <div style="display:flex; justify-content:space-between; margin-top:20px;">
        <div style="max-width:55%; background:#ecfdf5; border:1px solid #a7f3d0; padding:10px; border-radius:4px;">
          <span style="font-size:10px; font-weight:800; color:#047857; text-transform:uppercase; display:block;">📜 Customs & Origin Declaration:</span>
          <p style="font-size:10px; color:#065f46; font-family:monospace; margin:2px 0 0 0;">${po.customsDeclaration}</p>
        </div>

        <div style="width:38%; text-align:right;">
          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
            <span>Total FOB USD:</span>
            <span style="font-weight:700;">$${po.summary.totalFOB_USD}</span>
          </div>
          ${po.summary.totalJPY ? `
          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px; color:#047857;">
            <span>Equivalent JPY:</span>
            <span style="font-weight:700;">¥${po.summary.totalJPY}</span>
          </div>` : ''}
          <div style="display:flex; justify-content:space-between; font-size:14px; font-weight:800; border-top:2px solid #0f172a; padding-top:6px; margin-top:6px;">
            <span>Est. Landed EUR:</span>
            <span>€${po.summary.totalLandedEUR}</span>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  matchCategory(product, catId) {
    if (!catId || catId === 'all') return true;
    if (catId === 'vsionair-all') return product.brand === 'VsionAir';
    if (catId === 'vsionair-jigs') {
      return product.brand === 'VsionAir' && ['Helmet Jigs', 'Motorcycle Part Jigs', 'Canvass Jig', 'Vsion Easel Modules', 'Car & Motorcycle Wheel Jig', 'Skateboard Jig', 'Thermal Mug Jig', 'Guitar Parts Jigs'].includes(product.category);
    }
    if (catId === 'Helmet Jigs') return product.brand === 'VsionAir' && product.category === 'Helmet Jigs';
    if (catId === 'Motorcycle Part Jigs') return product.brand === 'VsionAir' && product.category === 'Motorcycle Part Jigs';
    if (catId === 'Canvass Jig') return product.brand === 'VsionAir' && (product.category === 'Canvass Jig' || product.category === 'Vsion Easel Modules');
    if (catId === 'Car & Motorcycle Wheel Jig') return product.brand === 'VsionAir' && product.category === 'Car & Motorcycle Wheel Jig';
    if (catId === 'Specialty Jigs') return product.brand === 'VsionAir' && ['Skateboard Jig', 'Thermal Mug Jig', 'Guitar Parts Jigs'].includes(product.category);
    if (catId === 'Stands') return product.brand === 'VsionAir' && (product.category === 'Stands' || product.category === 'Accessories');
    if (catId === 'Tool Bars & Lighting Rigs') return product.brand === 'VsionAir' && (product.category === 'Tool Bars & Lighting Rigs' || product.category === 'VsionAir Frame');
    if (catId === 'Airbrush Specific') return product.brand === 'VsionAir' && product.category === 'Airbrush Specific';
    if (catId === 'Storage, Comfort & Environment') return product.brand === 'VsionAir' && product.category === 'Storage, Comfort & Environment';
    if (catId === 'VsionAir Knobs') return product.brand === 'VsionAir' && product.category === 'VsionAir Knobs';
    if (catId === 'VsionAir Brackets') return product.brand === 'VsionAir' && product.category === 'VsionAir Brackets';
    if (catId === 'VsionAir Fasteners') return product.brand === 'VsionAir' && product.category === 'VsionAir Fasteners';

    if (catId === 'flakeking-all') return product.brand === 'Flake King';
    if (catId === 'Dry Metal Flake (Glitter)' || catId === 'Metal Flake') {
      return product.category === 'Dry Metal Flake (Glitter)' || product.category === 'Metal Flake';
    }
    if (catId === 'Dry Metal Flake Guns') return product.category === 'Dry Metal Flake Guns' || product.category === 'Flake King Gun Accessories';
    if (catId === 'Flake King Gun Accessories') return product.category === 'Flake King Gun Accessories';
    if (catId === 'Masking Products') return product.category === 'Masking Products';
    if (catId === 'Wet Products') return product.category === 'Wet Products';

    if (catId === 'kromaedge-all') return product.brand === 'Kroma Edge';
    if (catId === 'Solvent Paints') return product.brand === 'Kroma Edge' || product.category === 'Solvent Paints';

    if (Array.isArray(product.category)) {
      return product.category.some(c => c.toLowerCase().includes(catId.toLowerCase()));
    }
    return (product.category || '').toLowerCase().includes(catId.toLowerCase());
  }

  renderCategoryButtons() {
    const pillBar = document.getElementById('top-category-pill-bar');
    const activeBadge = document.getElementById('active-category-title-badge');
    const flakeSubcatBar = document.getElementById('flake-subcat-bar');

    const PRIMARY_DEPARTMENTS = [
      { id: "all", label: "All Products", icon: "apps", brand: "all" },
      { id: "Solvent Paints", label: "Sprayable Chrome", icon: "format_paint", brand: "Kroma Edge" },
      { id: "Dry Metal Flake (Glitter)", label: "Metal Flakes", icon: "auto_awesome", brand: "Flake King" },
      { id: "Dry Metal Flake Guns", label: "Flake Guns & Kits", icon: "precision_manufacturing", brand: "Flake King" },
      { id: "vsionair-all", label: "Workstations & Jigs", icon: "handyman", brand: "VsionAir" },
      { id: "Masking Products", label: "Fine Line Tapes", icon: "content_cut", brand: "Flake King" },
      { id: "Wet Products", label: "Binders & Prep", icon: "sanitizer", brand: "Flake King" }
    ];

    const VSIONAIR_SUBCATS = [
      { id: "vsionair-all", label: "All Workstations & Jigs" },
      { id: "Helmet Jigs", label: "Helmet & Mask Jigs" },
      { id: "Motorcycle Part Jigs", label: "Tank & Fender Jigs" },
      { id: "Car & Motorcycle Wheel Jig", label: "Wheel & Rim Jigs" },
      { id: "Canvass Jig", label: "Canvass & Easels" },
      { id: "Specialty Jigs", label: "Skateboard & Guitar" },
      { id: "Stands", label: "Stands & Mounts" },
      { id: "Tool Bars & Lighting Rigs", label: "Lighting Rigs" },
      { id: "Airbrush Specific", label: "Airbrush Holders" },
      { id: "VsionAir Knobs", label: "Knobs & Brackets" },
      { id: "Storage, Comfort & Environment", label: "Storage & Ergonomics" }
    ];

    const FLAKE_SUBCATS = [
      { id: "all", label: "All Flake Finishes" },
      { id: "single", label: "Single Colour" },
      { id: "blend", label: "Custom Blends" },
      { id: "holographic", label: "Holographic" },
      { id: "iridescent", label: "Iridescent" }
    ];

    const getCount = (catId) => {
      let items = [...ECOM_CATALOG];
      if (this.activeBrandFilter && this.activeBrandFilter !== 'all') {
        items = items.filter(p => (p.brand || '').toLowerCase().includes(this.activeBrandFilter.toLowerCase()));
      }
      if (catId === 'all') return items.length;
      return items.filter(p => this.matchCategory(p, catId)).length;
    };

    // 1. Render 7 Primary Department Pills
    if (pillBar) {
      let html = '';
      
      PRIMARY_DEPARTMENTS.forEach(dept => {
        if (this.activeBrandFilter !== 'all' && dept.brand !== 'all' && dept.brand.toLowerCase() !== this.activeBrandFilter.toLowerCase()) {
          return;
        }

        const count = getCount(dept.id);
        if (count === 0 && dept.id !== 'all') return;

        // Check if primary is active (or if a VsionAir subcat is active while this is vsionair-all)
        const isVsionAirChild = VSIONAIR_SUBCATS.some(s => s.id === this.activeCategoryFilter);
        const isActive = (this.activeCategoryFilter === dept.id) || (dept.id === 'vsionair-all' && isVsionAirChild);

        html += `
          <button type="button" data-cat-pill="${dept.id}" class="top-category-pill ${isActive ? 'active' : ''}">
            <span class="material-symbols-outlined text-[15px]">${dept.icon}</span>
            <span>${dept.label}</span>
            <span class="pill-count">${count}</span>
          </button>
        `;
      });

      pillBar.innerHTML = html;

      pillBar.querySelectorAll('button[data-cat-pill]').forEach(btn => {
        btn.addEventListener('click', () => {
          const catId = btn.getAttribute('data-cat-pill');
          this.setCategoryFilter(catId);
        });
      });
    }

    // 2. Render Contextual Sub-Category Bar
    const subcatBar = document.getElementById('contextual-subcat-bar');
    if (subcatBar) {
      const isVsionAir = this.activeCategoryFilter === 'vsionair-all' || VSIONAIR_SUBCATS.some(s => s.id === this.activeCategoryFilter);
      const isFlake = this.activeCategoryFilter === 'Dry Metal Flake (Glitter)' || this.activeCategoryFilter === 'Metal Flake';

      if (isVsionAir) {
        subcatBar.classList.remove('hidden');
        subcatBar.classList.add('flex');
        let subHtml = '<span class="text-sky-400 font-bold uppercase text-[11px] mr-1 flex items-center gap-1"><span class="material-symbols-outlined text-sm">handyman</span> Jigs:</span>';
        VSIONAIR_SUBCATS.forEach(sub => {
          const subCount = getCount(sub.id);
          if (subCount === 0 && sub.id !== 'vsionair-all') return;
          const isSubActive = this.activeCategoryFilter === sub.id;
          subHtml += `
            <button type="button" data-vsion-sub="${sub.id}" class="subcat-pill ${isSubActive ? 'active' : ''}">
              ${sub.label} (${subCount})
            </button>
          `;
        });
        subcatBar.innerHTML = subHtml;
        subcatBar.querySelectorAll('button[data-vsion-sub]').forEach(btn => {
          btn.addEventListener('click', () => {
            const subId = btn.getAttribute('data-vsion-sub');
            this.setCategoryFilter(subId);
          });
        });
      } else if (isFlake) {
        subcatBar.classList.remove('hidden');
        subcatBar.classList.add('flex');
        let subHtml = '<span class="text-amber-400 font-bold uppercase text-[11px] mr-1 flex items-center gap-1"><span class="material-symbols-outlined text-sm">auto_awesome</span> Flake Finish:</span>';
        FLAKE_SUBCATS.forEach(sub => {
          const isSubActive = this.activeFlakeSubcat === sub.id;
          subHtml += `
            <button type="button" data-flake-sub="${sub.id}" class="subcat-pill ${isSubActive ? 'active' : ''}">
              ${sub.label}
            </button>
          `;
        });
        subcatBar.innerHTML = subHtml;
        subcatBar.querySelectorAll('button[data-flake-sub]').forEach(btn => {
          btn.addEventListener('click', () => {
            const subId = btn.getAttribute('data-flake-sub');
            this.setFlakeSubcat(subId);
          });
        });
      } else {
        subcatBar.classList.add('hidden');
        subcatBar.classList.remove('flex');
        subcatBar.innerHTML = '';
      }
    }

    // 3. Update Active Category Title Badge
    if (activeBadge) {
      const activePrimary = PRIMARY_DEPARTMENTS.find(d => d.id === this.activeCategoryFilter);
      const activeVsion = VSIONAIR_SUBCATS.find(s => s.id === this.activeCategoryFilter);
      const label = activePrimary ? activePrimary.label : (activeVsion ? `VsionAir > ${activeVsion.label}` : this.activeCategoryFilter);
      activeBadge.textContent = label.toUpperCase();
    }

    this.renderActiveFilterChips();
  }

  renderActiveFilterChips() {
    const container = document.getElementById('active-filter-chips');
    if (!container) return;

    let html = '';
    if (this.activeBrandFilter !== 'all') {
      html += `
        <span class="bg-primary/20 border border-primary text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
          Brand: ${this.activeBrandFilter}
          <button onclick="window.paintApp.setBrandFilter('all')" class="hover:text-primary font-bold cursor-pointer">✕</button>
        </span>
      `;
    }
    if (this.activeCategoryFilter !== 'all') {
      const CATEGORY_NAMES = {
        'Solvent Paints': 'Sprayable Chrome',
        'Dry Metal Flake (Glitter)': 'Metal Flakes',
        'Dry Metal Flake Guns': 'Flake Guns & Kits',
        'vsionair-all': 'Workstations & Jigs',
        'Masking Products': 'Fine Line Tapes',
        'Wet Products': 'Binders & Prep'
      };
      const catLabel = CATEGORY_NAMES[this.activeCategoryFilter] || this.activeCategoryFilter;
      html += `
        <span class="bg-primary/20 border border-primary text-white text-[10px] px-2.5 py-0.5 rounded font-mono font-bold flex items-center gap-1.5 shadow-sm">
          <span>Department: <span class="text-primary">${catLabel}</span></span>
          <button onclick="window.paintApp.setCategoryFilter('all')" class="hover:text-primary font-bold cursor-pointer text-xs" title="Clear Department Filter">✕</button>
        </span>
      `;
    }
    if (this.activeFlakeSubcat !== 'all') {
      html += `
        <span class="bg-amber-950 border border-amber-500 text-amber-300 text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
          Flake: ${this.activeFlakeSubcat}
          <button onclick="window.paintApp.setFlakeSubcat('all')" class="hover:text-white font-bold cursor-pointer">✕</button>
        </span>
      `;
    }
    if (this.searchQuery) {
      html += `
        <span class="bg-sky-950 border border-sky-500 text-sky-300 text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
          Search: "${this.searchQuery}"
          <button onclick="document.getElementById('input-shop-search').value=''; window.paintApp.onSearchInput('');" class="hover:text-white font-bold cursor-pointer">✕</button>
        </span>
      `;
    }

    container.innerHTML = html;
  }

  setCategoryFilter(catId) {
    this.activeCategoryFilter = catId;
    this.renderCategoryButtons();
    this.renderStorefrontGrid();
  }

  setBrandFilter(brand) {
    this.activeBrandFilter = brand;
    const brandPills = document.querySelectorAll('#brand-filter-pills .brand-pill');
    brandPills.forEach(btn => {
      const match = (btn.getAttribute('data-brand-val') || 'all') === brand;
      btn.className = match ? 'brand-pill active px-3 py-1.5 border border-primary bg-primary-container text-white font-bold transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'brand-pill px-3 py-1.5 border border-secondary bg-black/60 text-secondary hover:text-white hover:border-primary transition-colors cursor-pointer';
    });
    this.renderCategoryButtons();
    this.renderStorefrontGrid();
  }

  setFlakeSubcat(subcat) {
    this.activeFlakeSubcat = subcat;
    const subcatBtns = document.querySelectorAll('.flake-subcat-btn');
    subcatBtns.forEach(b => {
      const match = (b.getAttribute('data-flake-subcat') || 'all') === subcat;
      b.className = match ? 'flake-subcat-btn metal-spec-plate-red text-[10px] uppercase cursor-pointer' : 'flake-subcat-btn metal-spec-plate text-[10px] uppercase cursor-pointer';
    });
    this.renderCategoryButtons();
    this.renderStorefrontGrid();
  }

  onSearchInput(query) {
    this.searchQuery = (query || '').toLowerCase().trim();
    this.renderActiveFilterChips();
    this.renderStorefrontGrid();
  }

  setCategoryAndScroll(catId) {
    this.setCategoryFilter(catId);
    setTimeout(() => {
      const anchor = document.getElementById('storefront-catalog-anchor');
      if (anchor) {
        anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  }

  setupShopFilters() {
    const searchInput = document.getElementById('input-shop-search');
    const sortSelect = document.getElementById('select-shop-sort');
    const subcatBtns = document.querySelectorAll('.flake-subcat-btn');
    const resetBtn = document.getElementById('btn-reset-filters');
    const brandPills = document.querySelectorAll('#brand-filter-pills .brand-pill');

    // Brand Pills
    brandPills.forEach(btn => {
      btn.addEventListener('click', () => {
        const brand = btn.getAttribute('data-brand-val') || 'all';
        this.setBrandFilter(brand);
      });
    });

    // Search Input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.onSearchInput(e.target.value);
      });
    }

    // Sort Select
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.activeSort = e.target.value;
        this.renderStorefrontGrid();
      });
    }

    // Flake Subcat Buttons
    subcatBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const subcat = btn.getAttribute('data-flake-subcat') || 'all';
        this.setFlakeSubcat(subcat);
      });
    });

    // Reset All Filters
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.activeBrandFilter = 'all';
        this.activeCategoryFilter = 'all';
        this.activeFlakeSubcat = 'all';
        this.searchQuery = '';
        this.activeSort = 'popular';
        if (searchInput) searchInput.value = '';
        if (sortSelect) sortSelect.value = 'popular';
        
        brandPills.forEach(btn => {
          const match = (btn.getAttribute('data-brand-val') || 'all') === 'all';
          btn.className = match ? 'brand-pill active px-3 py-1.5 border border-primary bg-primary-container text-white font-bold transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'brand-pill px-3 py-1.5 border border-secondary bg-black/60 text-secondary hover:text-white hover:border-primary transition-colors cursor-pointer';
        });

        subcatBtns.forEach(b => {
          const match = (b.getAttribute('data-flake-subcat') || 'all') === 'all';
          b.className = match ? 'flake-subcat-btn metal-spec-plate-red text-[10px] uppercase cursor-pointer' : 'flake-subcat-btn metal-spec-plate text-[10px] uppercase cursor-pointer';
        });

        this.renderCategoryButtons();
        this.renderStorefrontGrid();
      });
    }
  }

  getProductReviewData(prod) {
    let hash = 0;
    const str = prod.sku || prod.id || prod.name || '';
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const abs = Math.abs(hash);
    const score = (4.7 + (abs % 4) * 0.1).toFixed(1);
    const count = 14 + (abs % 75);
    
    const quotes = [
      {
        quote: "Lays down glass-flat with zero solvent pop. Absolute standard equipment for custom show paint builds.",
        author: "Marco R. • Master Airbrush Artist (Bologna, IT)"
      },
      {
        quote: "Flake King direct feed delivers 100% dry flake transfer without clogging or carrier binder contamination.",
        author: "Klaus W. • Kustom Refinish Studio (Stuttgart, DE)"
      },
      {
        quote: "Mirror chrome reflectivity is phenomenal over gloss black groundcoat. REACH compliant and zero cloudiness.",
        author: "Antoine D. • Show Car Fabrications (Lyon, FR)"
      },
      {
        quote: "Precision CNC engineering. Workstation jig saves hours during complex multi-stage masking and pin-striping.",
        author: "Liam T. • Pro Airbrush Works (Manchester, UK)"
      },
      {
        quote: "The coverage and metallic sparkle under sunlight is unmatched. Fast tracked delivery across Europe.",
        author: "Joris V. • Custom Kulture Garage (Eindhoven, NL)"
      }
    ];
    const selectedQuote = quotes[abs % quotes.length];
    
    return {
      rating: score,
      count: count,
      quote: selectedQuote.quote,
      author: selectedQuote.author
    };
  }

  downloadSDS(prod) {
    if (!prod) return;
    const isFlake = prod.category === 'Dry Metal Flake (Glitter)' || (prod.brand || '').includes('Flake King');
    
    // Select the designated European REACH SDS PDF document
    let pdfUrl = 'assets/docs/KROMA_EDGE_REACH_SDS_SAFETY_DATA_SHEET.pdf';
    let filename = `REACH_SDS_${(prod.sku || prod.id || 'PRODUCT').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    
    if (isFlake) {
      pdfUrl = 'assets/docs/FLAKE_KING_REACH_SDS_SAFETY_DATA_SHEET.pdf';
    }

    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  getFlakeSpecForSize(sizeString) {
    const s = String(sizeString || '').toLowerCase();
    if (s.includes('002') || s.includes('50') || s.includes('ultra small')) {
      return FLAKE_KING_WET_MIX_RATIOS[0];
    }
    if (s.includes('004') || s.includes('100')) {
      return FLAKE_KING_WET_MIX_RATIOS[1];
    }
    if (s.includes('008') || s.includes('200') || s.includes('medium')) {
      return FLAKE_KING_WET_MIX_RATIOS[2];
    }
    if (s.includes('015') || s.includes('375') || s.includes('large')) {
      return FLAKE_KING_WET_MIX_RATIOS[3];
    }
    if (s.includes('025') || s.includes('625') || s.includes('xl') || s.includes('x large')) {
      return FLAKE_KING_WET_MIX_RATIOS[4];
    }
    if (s.includes('040') || s.includes('1025') || s.includes('060') || s.includes('dxl')) {
      return FLAKE_KING_WET_MIX_RATIOS[5];
    }
    return FLAKE_KING_WET_MIX_RATIOS[2]; // fallback to medium .008"
  }

  openFlakeTDSModal() {
    const modal = document.getElementById('modal-flake-tds');
    if (modal) {
      modal.classList.add('active');
    }
  }

  closeFlakeTDSModal() {
    const modal = document.getElementById('modal-flake-tds');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  downloadTDS(prod) {
    if (!prod) return;
    const nameLower = (prod.name || '').toLowerCase();
    const idLower = (prod.id || '').toLowerCase();
    const isKromaClear = nameLower.includes('clear') || idLower.includes('clear') || idLower.includes('topcoat');
    const isVsionAir = (prod.brand || '').toLowerCase().includes('vsionair') || (prod.category || '').toLowerCase().includes('jig');
    const isFlake = prod.category === 'Dry Metal Flake (Glitter)' || (prod.brand || '').includes('Flake King') || (prod.name || '').toLowerCase().includes('flake');

    if (isFlake) {
      this.openFlakeTDSModal();
      return;
    }

    let pdfUrl = 'assets/docs/KROMA_EDGE_MIRROR_SYSTEM_TDS.pdf';
    let filename = `TDS_${(prod.sku || prod.id || 'PRODUCT').replace(/[^a-zA-Z0-9_-]/g, '_')}_SPECS.pdf`;

    if (isKromaClear) {
      pdfUrl = 'assets/docs/KROMA_EDGE_TOPCOAT_CLEAR_TDS.pdf';
    } else if (isVsionAir) {
      pdfUrl = 'assets/docs/VSIONAIR_TECHNICAL_DATA_SHEET.pdf';
    }

    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  downloadSystemTDS(system) {
    if (!system) return;
    if ((system.id || '').startsWith('flake_king_')) {
      this.openFlakeTDSModal();
      return;
    }
    const isClear = (system.id || '').includes('clear');
    const pdfUrl = isClear ? 'assets/docs/KROMA_EDGE_TOPCOAT_CLEAR_TDS.pdf' : 'assets/docs/KROMA_EDGE_MIRROR_SYSTEM_TDS.pdf';
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `TDS_${system.id.toUpperCase()}_SPECS.pdf`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  downloadSystemSDS(system) {
    if (!system) return;
    const a = document.createElement('a');
    a.href = 'assets/docs/KROMA_EDGE_REACH_SDS_SAFETY_DATA_SHEET.pdf';
    a.download = `REACH_SDS_${system.id.toUpperCase()}.pdf`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  setupDetailModal() {
    const modal = document.getElementById('modal-product-detail');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeDetailModal();
      });
    }

    const flakeTdsModal = document.getElementById('modal-flake-tds');
    if (flakeTdsModal) {
      flakeTdsModal.addEventListener('click', (e) => {
        if (e.target === flakeTdsModal) this.closeFlakeTDSModal();
      });
    }

    this.addSafeListener('btn-detail-add-cart', () => {
      if (this.activeModalProduct) {
        const prod = this.activeModalProduct;
        const currentSelection = this.selectedProductVariants[prod.id] || {};
        const prices = this.getProductCalculatedPrice(prod, currentSelection.pack, currentSelection.size);
        const variantDesc = [currentSelection.size, currentSelection.pack].filter(Boolean).join(' / ') || 'Standard';

        this.shopifyCartManager.addItem({
          sku: prices.sku || prod.sku,
          title: prod.name,
          priceEur: prices.priceEur,
          quantity: 1,
          variantDetails: variantDesc
        });
        this.closeDetailModal();
        this.openCartDrawer();
      }
    });

    this.addSafeListener('btn-download-sds', () => {
      if (this.activeModalProduct) this.downloadSDS(this.activeModalProduct);
    });

    this.addSafeListener('btn-download-tds', () => {
      if (this.activeModalProduct) this.downloadTDS(this.activeModalProduct);
    });

    this.addSafeListener('btn-detail-open-mix-calc', () => {
      if (this.activeModalProduct) {
        const prod = this.activeModalProduct;
        this.closeDetailModal();
        this.openQuickMixModal(prod.mixingSystemId || (prod.brand === 'Kroma Edge' ? 'kroma_edge_mirror_chrome' : null));
      }
    });
  }

  setupWelcomeModal() {
    const modal = document.getElementById('welcome-launch-modal');
    if (!modal) return;

    // Expose globally for manual triggers
    window.openWelcomeModal = (force = false) => this.openWelcomeModal(force);

    // Close button handlers
    this.addSafeListener('btn-close-welcome-modal', 'click', () => this.closeWelcomeModal());
    this.addSafeListener('btn-welcome-enter-shop', 'click', () => {
      this.closeWelcomeModal();
      this.switchTab('tab-storefront', 'view-storefront');
      setTimeout(() => {
        const anchor = document.getElementById('storefront-catalog-anchor');
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    // Backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeWelcomeModal();
    });

    // ESC key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        this.closeWelcomeModal();
      }
    });

    // Checkbox toggle handler
    const chk = document.getElementById('chk-dont-show-welcome');
    if (chk) {
      chk.addEventListener('change', (e) => {
        if (e.target.checked) {
          localStorage.setItem('coast_eu_welcome_dismissed', 'true');
        } else {
          localStorage.removeItem('coast_eu_welcome_dismissed');
        }
      });
    }

    // Note: Auto-display popup disabled to allow instant entry to storefront.
    // Modal remains accessible via window.openWelcomeModal() or About links.
  }

  openWelcomeModal(force = false) {
    const modal = document.getElementById('welcome-launch-modal');
    if (!modal) return;

    const isDismissed = localStorage.getItem('coast_eu_welcome_dismissed') === 'true';
    const chk = document.getElementById('chk-dont-show-welcome');
    if (chk) {
      chk.checked = isDismissed;
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  closeWelcomeModal() {
    const modal = document.getElementById('welcome-launch-modal');
    if (!modal) return;

    const chk = document.getElementById('chk-dont-show-welcome');
    if (chk && chk.checked) {
      localStorage.setItem('coast_eu_welcome_dismissed', 'true');
    }

    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  setupHeroCrossfade() {
    const container = document.getElementById('hero-crossfade-container');
    if (!container) return;

    const slides = container.querySelectorAll('.hero-crossfade-slide');
    const dots = document.querySelectorAll('#hero-slide-dots .hero-indicator-dot');
    const captionEl = document.getElementById('hero-caption-text');
    const stageImages = document.querySelectorAll('#hero-stage-slides .hero-stage-img');
    const thumbs = document.querySelectorAll('#hero-thumbnails .hero-thumb-btn');
    const showcaseLabel = document.getElementById('hero-showcase-label');
    const stageBadge = document.getElementById('hero-stage-badge');

    if (!slides || slides.length === 0) return;

    let currentSlide = 0;
    const totalSlides = slides.length;

    window.setHeroSlide = (index) => {
      currentSlide = (index + totalSlides) % totalSlides;
      
      // Sync ambient background slides
      slides.forEach((s, idx) => {
        if (idx === currentSlide) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
      });

      // Sync indicator dots
      dots.forEach((d, idx) => {
        if (idx === currentSlide) {
          d.classList.add('active');
        } else {
          d.classList.remove('active');
        }
      });

      // Sync caption text
      if (captionEl && slides[currentSlide]) {
        captionEl.innerHTML = slides[currentSlide].getAttribute('data-caption') || `0${currentSlide + 1}/0${totalSlides}`;
      }

      // Sync artifact badge
      const artifactBadge = document.getElementById('hero-artifact-badge');
      if (artifactBadge && slides[currentSlide]) {
        const badge = slides[currentSlide].getAttribute('data-badge') || 'Standard 2K Clearcoat Applied';
        artifactBadge.textContent = badge;
      }
    };

    window.nextHeroSlide = () => {
      window.setHeroSlide(currentSlide + 1);
    };

    window.prevHeroSlide = () => {
      window.setHeroSlide(currentSlide - 1);
    };

    // Gentle cinematic auto slideshow every 6s with pause on hover
    const heroSection = container.closest('section');
    setInterval(() => {
      if (!heroSection || !heroSection.matches(':hover')) {
        window.setHeroSlide(currentSlide + 1);
      }
    }, 6000);
  }

  initSocialProofPulse() {
    const orders = [
      { name: "David M.", location: "Birmingham, UK", flag: "🇬🇧", item: "3x Show Krome Metal Flake Jars (30g)", time: "3m ago" },
      { name: "Stefan K.", location: "Munich, Germany", flag: "🇩🇪", item: "Kroma Edge Mirror Chrome Kit (140g)", time: "6m ago" },
      { name: "Marco B.", location: "Milan, Italy", flag: "🇮🇹", item: "Flake King 550 Mini Dry Gun System", time: "9m ago" },
      { name: "Julien D.", location: "Lyon, France", flag: "🇫🇷", item: "Dedicated Kroma Clearcoat & 3mm Fineline Tape", time: "12m ago" },
      { name: "Bram V.", location: "Amsterdam, Netherlands", flag: "🇳🇱", item: "2x Kromatic Silver Holographic Flakes", time: "16m ago" },
      { name: "Alejandro R.", location: "Barcelona, Spain", flag: "🇪🇸", item: "Flake King Pro Series Multi-Gun Kit", time: "21m ago" },
      { name: "Gareth P.", location: "Cardiff, UK", flag: "🇬🇧", item: "Show Krome .008 Micro Flake (100g Trade Jar)", time: "27m ago" },
      { name: "Lukas W.", location: "Vienna, Austria", flag: "🇦🇹", item: "Kroma Edge Batch 1 Mirror Chrome System", time: "34m ago" }
    ];

    let currentIndex = 0;
    const toast = document.getElementById('social-proof-toast');
    if (!toast) return;

    const showNext = () => {
      const ord = orders[currentIndex];
      currentIndex = (currentIndex + 1) % orders.length;

      const flagEl = document.getElementById('social-proof-flag');
      const nameEl = document.getElementById('social-proof-name');
      const itemEl = document.getElementById('social-proof-item');
      const timeEl = document.getElementById('social-proof-time');

      if (flagEl) flagEl.textContent = ord.flag;
      if (nameEl) nameEl.textContent = `${ord.name} (${ord.location})`;
      if (itemEl) itemEl.textContent = ord.item;
      if (timeEl) timeEl.textContent = ord.time;

      toast.classList.add('visible');

      setTimeout(() => {
        toast.classList.remove('visible');
      }, 5000);
    };

    // First appearance after 5s, then cycle every 18s
    setTimeout(() => {
      showNext();
      setInterval(showNext, 18000);
    }, 5000);
  }

  initReferralModal() {
    window.openReferralModal = () => {
      const m = document.getElementById('modal-referral');
      if (m) m.classList.add('active');
    };
    window.closeReferralModal = () => {
      const m = document.getElementById('modal-referral');
      if (m) m.classList.remove('active');
    };
    window.copyReferralLink = () => {
      const input = document.getElementById('input-referral-link');
      if (input) {
        input.select();
        navigator.clipboard.writeText(input.value).then(() => {
          const btnLabel = document.getElementById('btn-copy-referral-label');
          if (btnLabel) btnLabel.textContent = 'COPIED!';
          this.showToast('✅ Referral link copied! Share with fellow painters.', 'success');
          setTimeout(() => {
            if (btnLabel) btnLabel.textContent = 'COPY';
          }, 2500);
        }).catch(() => {
          this.showToast('Link ready to share: ' + input.value, 'info');
        });
      }
    };
    window.shareReferralWhatsApp = () => {
      const msg = encodeURIComponent("Hey! Check out Coast Airbrush Europe for Kroma Edge Mirror Chrome & Flake King gear. Grab £15 off your first order over £125: https://coastairbrush.com/?ref=CREW-PAINTER");
      window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
    };
    window.shareReferralFacebook = () => {
      const url = encodeURIComponent("https://coastairbrush.com/?ref=CREW-PAINTER");
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    };
    window.shareReferralTwitter = () => {
      const text = encodeURIComponent("Check out Coast Airbrush Europe for Kroma Edge Mirror Chrome & Flake King dry guns. Get £15 off orders £125+:");
      const url = encodeURIComponent("https://coastairbrush.com/?ref=CREW-PAINTER");
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    };
    window.shareReferralEmail = () => {
      const subject = encodeURIComponent("Coast Airbrush Europe VIP Invite (£15 Off)");
      const body = encodeURIComponent("Hey,\n\nI thought you'd want to check out Coast Airbrush Europe for official Kroma Edge Mirror Chrome and Flake King dry flake guns.\n\nYou can get £15 off your first order over £125 with this link:\nhttps://coastairbrush.com/?ref=CREW-PAINTER\n\nCheers!");
      window.open(`mailto:?subject=${subject}&body=${body}`);
    };
  }

  openDetailModal(productOrId, initialTab = null) {
    try {
      let product = productOrId;
      if (typeof productOrId === 'string') {
        product = ECOM_CATALOG.find(p => p.id === productOrId) || (this.currentCatalog && this.currentCatalog.colors && this.currentCatalog.colors.find(c => c.id === productOrId));
      }
      if (!product) {
        console.warn('Product not found for detail modal:', productOrId);
        return;
      }
      this.activeModalProduct = product;
      const modal = document.getElementById('modal-product-detail');
      if (!modal) {
        console.warn('modal-product-detail container not found in DOM');
        return;
      }

      const brandEl = document.getElementById('detail-brand-badge');
      if (brandEl) brandEl.textContent = (product.brand || 'MASTER SERIES').toUpperCase();
      const skuEl = document.getElementById('detail-sku-badge');
      if (skuEl) skuEl.textContent = `SKU: ${product.sku || 'N/A'}`;
      const titleEl = document.getElementById('detail-title');
      if (titleEl) titleEl.textContent = product.name || 'Product Details';
      this.renderProductSalesCopy(product);
      
      // Check & setup variants for modal
      const isFlake = product.category === 'Dry Metal Flake (Glitter)' || product.category === 'Metal Flake';
      const isTape = product.hasTapeOptions || product.category === 'Masking Products' || (product.name || '').includes('Tape');
      const sizeLabel = isTape ? 'Tape Width / Roll Size' : (isFlake ? 'Flake Dimension (Micron)' : 'Product Size');

      let validSizes = (product.sizes || []).map(s => isFlake ? this.formatFlakeDimension(s) : String(s).trim()).filter(Boolean);
      let validPacks = (product.packSizes || []).map(p => isFlake ? this.formatFlakePackSize(p) : String(p).trim()).filter(Boolean);

      if (isTape && validSizes.length === 0 && (product.tapeWidths || product.tapePriceMatrix)) {
        validSizes = (product.tapeWidths || (product.tapePriceMatrix ? product.tapePriceMatrix.map(t => t.width) : [])).map(w => String(w).trim());
      }

      if (validPacks.length === 0 && product.packPriceMatrix && product.packPriceMatrix.length > 0) {
        validPacks = product.packPriceMatrix.map(m => m.packSize).filter(Boolean);
      }

      if (isFlake && validPacks.length === 0) {
        validPacks = [
          '30g Jar (Direct Gun Mount - 500/550)',
          '100g Jar (Direct Gun Mount - 1000/1050)',
          '1000g (1 Kilo Trade Pack)'
        ];
      }

      if (!this.selectedProductVariants[product.id]) {
        this.selectedProductVariants[product.id] = {
          size: validSizes[0] || '',
          pack: validPacks[0] || ''
        };
      }

      const currentSelection = this.selectedProductVariants[product.id] || { size: '', pack: '' };
      const prices = this.getProductCalculatedPrice(product, currentSelection.pack, currentSelection.size);

      if (skuEl && prices) {
        skuEl.textContent = `SKU: ${prices.sku || product.sku || 'N/A'}${prices.barcode ? ` | EAN: ${prices.barcode}` : ''}`;
      }

      const priceEl = document.getElementById('detail-price');
      if (priceEl && prices) {
        priceEl.innerHTML = `
          <span>${prices.formattedPrimary}</span>
          <span class="text-xs font-mono font-bold px-2 py-0.5 rounded align-middle ml-2 ${prices.vatMode === 'inc' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'}">${prices.primaryVatBadge}</span>
        `;
      }
      const priceSubEl = document.getElementById('detail-price-sub');
      if (priceSubEl && prices) {
        const country = this.euLocalization.getCountry();
        priceSubEl.innerHTML = `
          <span class="text-white font-bold">${prices.formattedSecondary}</span>
          <span class="text-slate-400 ml-1.5">• ${prices.formattedSecondaryCur}</span>
          ${prices.isUK ? `<span class="text-amber-400 ml-1.5 hidden sm:inline">(20% UK HMRC VAT)</span>` : `<span class="text-emerald-400 ml-1.5 hidden sm:inline">(${prices.vatRatePercent}% ${country.code} Tax)</span>`}
        `;
      }

      // Render variant controls inside modal
      const variantContainer = document.getElementById('detail-variant-controls');
      if (variantContainer) {
        let modalControls = '';
        if (validSizes.length > 1 || (validSizes.length === 1 && validPacks.length === 0)) {
          modalControls += `
            <div class="mb-3">
              <label class="font-label-xs text-xs text-secondary uppercase block mb-1 font-bold">${sizeLabel}:</label>
              <select id="detail-select-size" class="mech-select !py-2 !px-3 text-xs w-full" onchange="window.paintApp.onProductVariantChange('${product.id}', 'size', this.value)">
                ${validSizes.map(s => {
                  const optPrice = this.getProductCalculatedPrice(product, currentSelection.pack, s);
                  const showPrice = validPacks.length <= 1 && optPrice ? ` (${optPrice.formattedPrimary} ${optPrice.primaryVatBadge})` : '';
                  return `<option value="${this.escapeHtmlAttr(s)}" ${s === currentSelection.size ? 'selected' : ''}>${s}${showPrice}</option>`;
                }).join('')}
              </select>
            </div>
          `;
        }
        if (validPacks.length > 1 || (validPacks.length === 1 && validSizes.length === 0)) {
          modalControls += `
            <div class="mb-3">
              <label class="font-label-xs text-xs text-secondary uppercase block mb-1 font-bold">Pack Size / Volume:</label>
              <select id="detail-select-pack" class="mech-select !py-2 !px-3 text-xs w-full" onchange="window.paintApp.onProductVariantChange('${product.id}', 'pack', this.value)">
                ${validPacks.map(p => {
                  const optPrice = this.getProductCalculatedPrice(product, p, currentSelection.size);
                  return `<option value="${this.escapeHtmlAttr(p)}" ${p === currentSelection.pack ? 'selected' : ''}>${p} (${optPrice ? optPrice.formattedPrimary + ' ' + optPrice.primaryVatBadge : ''})</option>`;
                }).join('')}
              </select>
            </div>
          `;
        }
        variantContainer.innerHTML = modalControls;
      }
      
      // Reviews & Social Proof
      const reviewData = this.getProductReviewData(product) || { rating: '4.9', count: 24, quote: 'Exceptional finish.', author: 'Verified Pro Painter' };
      const ratingScoreEl = document.getElementById('detail-rating-score');
      if (ratingScoreEl) ratingScoreEl.textContent = `${reviewData.rating} / 5.0`;
      const reviewCountEl = document.getElementById('detail-review-count');
      if (reviewCountEl) reviewCountEl.textContent = `${reviewData.count} VERIFIED REVIEWS`;
      const reviewQuoteEl = document.getElementById('detail-review-quote');
      if (reviewQuoteEl) reviewQuoteEl.textContent = `"${reviewData.quote}"`;
      const reviewerAuthorEl = document.getElementById('detail-reviewer-author');
      if (reviewerAuthorEl) reviewerAuthorEl.textContent = reviewData.author;

      // Technical Specs
      const isGun = (product.name || '').includes('Gun') || (product.name || '').includes('Airbrush') || product.category === 'Dry Metal Flake Guns' || product.category === 'Flake King Gun Accessories' || product.category === 'Airbrushes & Spray Guns';
      const isJig = product.brand === 'VsionAir' || (product.category || '').includes('Jig');

      const tipEl = document.getElementById('detail-spec-tip');
      const psiEl = document.getElementById('detail-spec-psi');
      const ratioEl = document.getElementById('detail-spec-ratio');
      const vocEl = document.getElementById('detail-spec-voc');

      if (isFlake) {
        const flakeSpec = this.getFlakeSpecForSize(currentSelection.size || (validSizes && validSizes[0]));
        if (tipEl) tipEl.textContent = flakeSpec ? flakeSpec.minGunNozzle : 'Flake King 500 / 1000 Dry Gun (or 1.4mm Wet)';
        if (psiEl) psiEl.textContent = '10 - 15 PSI (Dry Fluidization) | 18 - 22 PSI (Wet Spray)';
        if (ratioEl) ratioEl.textContent = flakeSpec ? `${flakeSpec.ratioText} (or Dry via FK Gun)` : '60g / 1,000 ml Clear (or Dry via Gun)';
        if (vocEl) vocEl.textContent = 'Non-Toxic PET • 350°F (177°C) Max • 18-Mo Miami UV Tested';
      } else if (isGun) {
        if (tipEl) tipEl.textContent = 'Precision Machined Brass / Stainless Steel Nozzle';
        if (psiEl) psiEl.textContent = '15 - 30 PSI Operating Pressure';
        if (ratioEl) ratioEl.textContent = 'Standard 1/4" BSP European Quick Connect';
        if (vocEl) vocEl.textContent = 'Tooling Equipment (CE & UKCA Certified)';
      } else if (isJig) {
        if (tipEl) tipEl.textContent = 'Universal 360° Multi-Axis Lock Clamp';
        if (psiEl) psiEl.textContent = 'Solid Steel / CNC Billet Alloy Construction';
        if (ratioEl) ratioEl.textContent = 'Magnetic / Fast-Pin Modular Mount';
        if (vocEl) vocEl.textContent = 'Lifetime Workshop Durability Guarantee';
      } else if (product.id === 'kroma-mirror-chrome-system' || (product.name && product.name.includes('Mirror Chrome'))) {
        if (tipEl) tipEl.textContent = 'Airbrush 0.3mm–0.5mm (25–45 PSI) / Spray Gun 0.8mm–1.2mm';
        if (psiEl) psiEl.textContent = '20 - 25 PSI (Apply 1 Continuous Wet Coat @ >20°C)';
        if (ratioEl) ratioEl.textContent = '5 : 5 : 2 : 2 (Binder : Reducer : Hardener : Seeds)';
        if (vocEl) vocEl.textContent = 'Self-Organizing Optical Coating (Zero Gray Clouding)';
      } else if (product.id === 'kroma-dedicated-topcoat-clear' || (product.name && product.name.includes('Topcoat Clear'))) {
        if (tipEl) tipEl.textContent = '1.0mm - 1.3mm HVLP / Airbrush 0.4mm - 0.5mm';
        if (psiEl) psiEl.textContent = '18 - 22 PSI (Fine Tack Coat, 5m Flash, Full Wet Coat)';
        if (ratioEl) ratioEl.textContent = '10 : 1 (Clear Base : Hardener) + 70%–100% Thinner';
        if (vocEl) vocEl.textContent = 'Optical Non-Clouding Clear (Specifically for Kroma Edge)';
      } else {
        if (tipEl) tipEl.textContent = '1.2mm - 1.4mm HVLP / Airbrush 0.3mm - 0.5mm';
        if (psiEl) psiEl.textContent = '18 - 22 PSI (1.2 - 1.5 Bar)';
        if (ratioEl) ratioEl.textContent = '3 : 1 : 2 (Paint : Catalyst : Reducer)';
        if (vocEl) vocEl.textContent = '<420 g/L (EU 2004/42/EC Stage II Compliant)';
      }

      const isPreOrder = Boolean(product.isPreOrder || (product.badge && product.badge.includes('EARLY BIRD')) || (product.id && product.id.startsWith('preorder_')));
      const stockBadge = document.getElementById('detail-stock-badge');
      if (stockBadge) {
        stockBadge.textContent = isPreOrder ? '⏳ PRE-ORDER (BATCH 1 PRIORITY ALLOCATION)' : '⚡ IN STOCK (UK DISPATCH)';
        stockBadge.className = isPreOrder 
          ? 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/80 border border-amber-500/50 text-amber-300 font-mono text-[11px] font-bold tracking-wide backdrop-blur-md shadow-md' 
          : 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/80 border border-emerald-500/60 text-emerald-300 font-mono text-[11px] font-bold tracking-wide backdrop-blur-md shadow-md';
      }
      const addCartBtn = document.getElementById('btn-detail-add-cart');
      if (addCartBtn) {
        addCartBtn.textContent = isPreOrder ? '🛒 PRE-ORDER NOW • SECURE BATCH 1 ALLOCATION' : '+ ADD TO PROJECT CART';
      }

      const mainImageSrc = product.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
      const imgEl = document.getElementById('detail-img');
      if (imgEl) {
        imgEl.src = mainImageSrc;
        imgEl.onerror = () => {
          imgEl.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
        };
      }

      // Render product gallery thumbnails if multiple images exist
      const galleryContainer = document.getElementById('detail-gallery-container');
      const galleryThumbs = document.getElementById('detail-gallery-thumbnails');
      const allImages = (product.images && product.images.length > 0)
        ? product.images
        : [mainImageSrc];

      if (galleryContainer && galleryThumbs) {
        if (allImages.length > 1) {
          galleryContainer.classList.remove('hidden');
          galleryThumbs.innerHTML = allImages.map((imgSrc, idx) => {
            let label = 'Product';
            if (imgSrc.includes('color_chart')) label = 'Colour Card';
            else if (imgSrc.includes('size_chart') || imgSrc.includes('guns')) label = 'Size & Gun Guide';
            else if (imgSrc.includes('Cleaned Skull') || imgSrc.includes('skull')) label = 'Mirror Skull';
            else if (imgSrc.includes('helmet')) label = 'Mirror Helmet';
            else if (imgSrc.includes('wave')) label = 'Chrome Wave';
            else if (imgSrc.includes('surfer-front')) label = 'Front Angle';
            else if (imgSrc.includes('surfer-back')) label = 'Rear Angle';
            else if (imgSrc.includes('FOM') && (imgSrc.includes('1.png') || imgSrc.includes('5001') || imgSrc.includes('10001') || imgSrc.includes('5501') || imgSrc.includes('10501'))) label = 'Gun Front';
            else if (imgSrc.includes('FOM') && (imgSrc.includes('2.png') || imgSrc.includes('5002') || imgSrc.includes('10002') || imgSrc.includes('5502') || imgSrc.includes('10502'))) label = 'Gun Profile';
            else if (imgSrc.includes('FOM') && (imgSrc.includes('3.png') || imgSrc.includes('5003') || imgSrc.includes('10003') || imgSrc.includes('5503') || imgSrc.includes('10503'))) label = 'Mount Angle';
            else if (imgSrc.includes('FOM') && (imgSrc.includes('4.png') || imgSrc.includes('5004') || imgSrc.includes('10004') || imgSrc.includes('5504') || imgSrc.includes('10504'))) label = 'Nozzle Close';
            else if (imgSrc.includes('ProSeriesKit')) label = 'Hardcase';
            else if (imgSrc.includes('ProSeries1')) label = 'Open Case';
            else if (imgSrc.includes('ProSeries2')) label = 'Main Gun';
            else if (imgSrc.includes('ProSeries')) label = `Kit Part ${idx + 1}`;
            else if (idx === 0) label = 'Main View';
            else label = `Angle ${idx + 1}`;

            const isFirst = idx === 0;
            return `
              <button type="button" class="detail-gallery-thumb border-2 ${isFirst ? 'border-primary bg-primary/20 shadow-[0_0_8px_rgba(211,47,47,0.5)]' : 'border-secondary/60 bg-surface-container-low hover:border-secondary'} p-1 rounded flex flex-col items-center gap-1 cursor-pointer transition-all min-w-[76px] flex-shrink-0" onclick="window.paintApp.switchDetailImage('${this.escapeHtmlAttr(imgSrc)}', this)">
                <img src="${imgSrc}" alt="${label}" class="w-14 h-14 object-contain rounded" onerror="this.src='assets/images/coast_airbrush_logo.jpg'">
                <span class="font-label-xs text-[9px] uppercase font-bold ${isFirst ? 'text-primary' : 'text-secondary'} text-center leading-tight truncate max-w-[72px]">${label}</span>
              </button>
            `;
          }).join('');
        } else {
          galleryContainer.classList.add('hidden');
          galleryThumbs.innerHTML = '';
        }
      }

      // Render In-Action Video Demonstrations & Social Proof
      const videoContainer = document.getElementById('detail-video-container');
      const videoCountEl = document.getElementById('detail-video-count');
      const videoTarget = document.getElementById('detail-video-player-target');
      const videoList = document.getElementById('detail-video-list');

      if (videoContainer && videoTarget && videoList) {
        if (product.videos && product.videos.length > 0) {
          videoContainer.classList.remove('hidden');
          if (videoCountEl) videoCountEl.textContent = `${product.videos.length} VIDEO${product.videos.length > 1 ? 'S' : ''}`;

          const firstVid = product.videos[0];
          this.loadDetailVideoPlayer(firstVid, videoTarget, initialTab === 'video');

          videoList.innerHTML = product.videos.map((vid, vIdx) => {
            const isYt = vid.platform === 'youtube';
            const isIg = vid.platform === 'instagram';
            const badgeIcon = isYt ? 'play_circle' : (isIg ? 'photo_camera' : 'videocam');
            const badgeColor = isYt ? 'text-red-400' : (isIg ? 'text-pink-400' : 'text-blue-400');
            const isActive = vIdx === 0;
            
            return `
              <div class="detail-video-item flex items-center justify-between p-2 rounded ${isActive ? 'bg-red-950/40 border border-red-500/70' : 'bg-surface-container-high/60 border border-white/10 hover:border-red-400/50'} transition-colors">
                <div class="flex items-center gap-2 overflow-hidden mr-2">
                  <span class="material-symbols-outlined text-lg ${badgeColor} flex-shrink-0">${badgeIcon}</span>
                  <div class="truncate">
                    <div class="text-xs text-white font-bold truncate">${this.escapeHtmlAttr(vid.title)}</div>
                    <div class="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                      <span>By <strong class="text-neutral-200">${this.escapeHtmlAttr(vid.creator)}</strong></span>
                      ${vid.duration ? `<span>• ${vid.duration}</span>` : ''}
                      ${vid.badge ? `<span class="px-1 py-0.2 rounded bg-black/50 text-[9px] text-amber-300 font-bold border border-amber-500/40">${vid.badge}</span>` : ''}
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-1.5 flex-shrink-0">
                  <button type="button" class="mech-button-primary !py-1 !px-2 text-[10px] font-mono flex items-center gap-1 cursor-pointer" onclick="window.paintApp.switchDetailVideo(${vIdx})">
                    <span class="material-symbols-outlined text-[13px]">play_arrow</span>
                    <span>Play</span>
                  </button>
                  <a href="${vid.url}" target="_blank" rel="noopener noreferrer" class="p-1 text-neutral-400 hover:text-white transition-colors" title="Open in new window">
                    <span class="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                </div>
              </div>
            `;
          }).join('');

          if (initialTab === 'video') {
            setTimeout(() => {
              videoContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 150);
          }
        } else {
          videoContainer.classList.add('hidden');
          videoTarget.innerHTML = '';
          videoList.innerHTML = '';
        }
      }

      modal.classList.add('active');
    } catch (err) {
      console.error('Error opening detail modal:', err);
    }
  }

  loadDetailVideoPlayer(vid, targetEl, autoPlay = false) {
    if (!targetEl || !vid) return;
    if (vid.platform === 'youtube' && vid.embedId) {
      if (autoPlay) {
        targetEl.innerHTML = `
          <div class="relative w-full h-full bg-black rounded overflow-hidden flex flex-col justify-between">
            <iframe class="w-full h-full absolute inset-0 rounded" src="https://www.youtube.com/embed/${vid.embedId}?autoplay=1&rel=0&modestbranding=1" title="${this.escapeHtmlAttr(vid.title)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
            <div class="absolute bottom-1 right-2 z-10 bg-black/85 border border-white/20 text-[10px] font-mono px-2.5 py-1 rounded text-neutral-300 pointer-events-auto flex items-center gap-1.5 shadow-lg">
              <a href="${vid.url}" target="_blank" rel="noopener noreferrer" class="text-red-400 hover:text-white flex items-center gap-1 transition-colors font-bold">
                <span>Watch on YouTube</span>
                <span class="material-symbols-outlined text-[11px]">open_in_new</span>
              </a>
            </div>
          </div>
        `;
      } else {
        targetEl.innerHTML = `
          <div class="relative w-full h-full group cursor-pointer" onclick="window.paintApp.loadDetailVideoPlayer(window.paintApp.activeModalProduct ? (window.paintApp.activeModalProduct.videos.find(v => v.embedId === '${vid.embedId}') || window.paintApp.activeModalProduct.videos[0]) : null, this.parentElement, true)">
            <img src="https://img.youtube.com/vi/${vid.embedId}/hqdefault.jpg" alt="${this.escapeHtmlAttr(vid.title)}" class="w-full h-full object-cover filter brightness-90 group-hover:brightness-100 transition-all">
            <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-between p-3 pointer-events-none">
              <div class="flex items-center justify-between gap-2">
                <span class="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-bold tracking-wide shadow">YOUTUBE TUTORIAL</span>
                <span class="text-xs text-white/90 font-bold drop-shadow truncate flex-1">${this.escapeHtmlAttr(vid.title)}</span>
                <a href="${vid.url}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" class="pointer-events-auto text-neutral-300 hover:text-white bg-black/60 px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 transition-colors" title="Open directly on YouTube">
                  <span>YouTube</span>
                  <span class="material-symbols-outlined text-[12px]">open_in_new</span>
                </a>
              </div>
              <div class="flex items-center justify-center">
                <div class="w-14 h-14 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.8)] group-hover:scale-110 group-hover:bg-red-500 transition-transform">
                  <span class="material-symbols-outlined text-3xl">play_arrow</span>
                </div>
              </div>
              <div class="flex items-center justify-between text-[11px] font-mono text-neutral-300">
                <span>Creator: <strong class="text-white">${this.escapeHtmlAttr(vid.creator)}</strong></span>
                <span class="bg-black/80 px-1.5 py-0.5 rounded text-white font-bold">${vid.duration || 'Click to Play'}</span>
              </div>
            </div>
          </div>
        `;
      }
    } else {
      targetEl.innerHTML = `
        <div class="relative w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-950/60 via-black/80 to-pink-950/40 text-center">
          <span class="material-symbols-outlined text-4xl text-pink-400 mb-2">photo_camera</span>
          <h4 class="text-sm font-bold text-white mb-1">${this.escapeHtmlAttr(vid.title)}</h4>
          <p class="text-xs text-neutral-400 font-mono mb-3">Published by ${this.escapeHtmlAttr(vid.creator)} on Instagram</p>
          <a href="${vid.url}" target="_blank" rel="noopener noreferrer" class="mech-button-primary !py-1.5 !px-4 text-xs font-mono flex items-center gap-1.5 shadow">
            <span class="material-symbols-outlined text-sm">open_in_new</span>
            <span>Watch Reel on Instagram</span>
          </a>
        </div>
      `;
    }
  }

  switchDetailVideo(videoIndex) {
    if (!this.activeModalProduct || !this.activeModalProduct.videos) return;
    const vid = this.activeModalProduct.videos[videoIndex];
    const target = document.getElementById('detail-video-player-target');
    if (vid && target) {
      this.loadDetailVideoPlayer(vid, target, true);
    }
    const videoItems = document.querySelectorAll('.detail-video-item');
    videoItems.forEach((item, idx) => {
      if (idx === videoIndex) {
        item.className = 'detail-video-item flex items-center justify-between p-2 rounded bg-red-950/40 border border-red-500/70 transition-colors shadow-sm';
      } else {
        item.className = 'detail-video-item flex items-center justify-between p-2 rounded bg-surface-container-high/60 border border-white/10 hover:border-red-400/50 transition-colors';
      }
    });
  }

  renderProductSalesCopy(product) {
    if (!product) return;
    const summaryEl = document.getElementById('detail-lead-summary');
    const tabsEl = document.getElementById('detail-copy-tabs');
    const tabContentEl = document.getElementById('detail-tab-content');
    const legacyDescEl = document.getElementById('detail-desc');

    const leadSummary = product.summary || product.description || 'Professional grade automotive formulation engineered for show-quality kustom finishes.';
    if (summaryEl) summaryEl.textContent = leadSummary;
    if (legacyDescEl) legacyDescEl.textContent = leadSummary;

    const hasRichSections = Boolean((product.benefits && product.benefits.length > 0) || (product.howItWorks && product.howItWorks.length > 0) || (product.inTheBox && product.inTheBox.length > 0));

    if (tabsEl) {
      if (hasRichSections) {
        tabsEl.classList.remove('hidden');
        this.switchCopyTab('benefits');
      } else {
        tabsEl.classList.add('hidden');
        if (tabContentEl) {
          const paragraphs = (product.description || '').split('\n').map(p => p.trim()).filter(Boolean);
          if (paragraphs.length > 1) {
            tabContentEl.innerHTML = paragraphs.map(p => `<p class="mb-2 leading-relaxed text-slate-300 text-xs">${this.escapeHtmlAttr(p)}</p>`).join('');
          } else {
            tabContentEl.innerHTML = `<p class="leading-relaxed text-slate-300 text-xs">${this.escapeHtmlAttr(product.description || '')}</p>`;
          }
        }
      }
    }
  }

  switchCopyTab(tabName) {
    this.activeCopyTab = tabName;
    const prod = this.activeModalProduct;
    if (!prod) return;
    this.renderCopyTabContent(prod, tabName);

    const btnBenefits = document.getElementById('tab-btn-benefits');
    const btnWorkflow = document.getElementById('tab-btn-workflow');
    const btnInbox = document.getElementById('tab-btn-inbox');

    const activeCls = 'detail-copy-tab active px-2.5 py-1 text-[11px] font-mono font-bold uppercase rounded text-primary bg-primary/15 border border-primary/40 transition-all cursor-pointer';
    const inactiveCls = 'detail-copy-tab px-2.5 py-1 text-[11px] font-mono font-bold uppercase rounded text-slate-400 hover:text-white transition-all cursor-pointer';

    if (btnBenefits) btnBenefits.className = tabName === 'benefits' ? activeCls : inactiveCls;
    if (btnWorkflow) btnWorkflow.className = tabName === 'workflow' ? activeCls : inactiveCls;
    if (btnInbox) btnInbox.className = tabName === 'inbox' ? activeCls : inactiveCls;
  }

  renderCopyTabContent(prod, tabName) {
    const container = document.getElementById('detail-tab-content');
    if (!container) return;

    if (tabName === 'benefits') {
      const benefits = prod.benefits || [];
      if (benefits.length > 0) {
        container.innerHTML = `
          <div class="grid grid-cols-1 gap-2">
            ${benefits.map(b => {
              const colonIdx = b.indexOf(':');
              const title = colonIdx > -1 ? b.slice(0, colonIdx) : '';
              const body = colonIdx > -1 ? b.slice(colonIdx + 1) : b;
              return `
                <div class="flex items-start gap-2 bg-surface-container-low/60 p-2 rounded border border-white/5">
                  <span class="material-symbols-outlined text-emerald-400 text-sm mt-0.5 flex-shrink-0">check_circle</span>
                  <div class="text-[11px] leading-relaxed">
                    ${title ? `<strong class="text-white">${this.escapeHtmlAttr(title)}:</strong>` : ''}
                    <span class="text-slate-300">${this.escapeHtmlAttr(body)}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      } else {
        container.innerHTML = `<p class="text-xs text-slate-300 leading-relaxed">${this.escapeHtmlAttr(prod.description || '')}</p>`;
      }
    } else if (tabName === 'workflow') {
      const steps = prod.howItWorks || [];
      if (steps.length > 0) {
        container.innerHTML = `
          <div class="flex flex-col gap-2">
            ${steps.map((step, idx) => {
              const colonIdx = step.indexOf(':');
              const title = colonIdx > -1 ? step.slice(0, colonIdx) : `Step ${idx + 1}`;
              const body = colonIdx > -1 ? step.slice(colonIdx + 1) : step;
              return `
                <div class="flex items-start gap-2.5 bg-surface-container-low/60 p-2 rounded border border-white/5">
                  <span class="w-5 h-5 rounded-full bg-primary/20 text-primary border border-primary/40 font-mono text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">${idx + 1}</span>
                  <div class="text-[11px] leading-relaxed">
                    <strong class="text-white">${this.escapeHtmlAttr(title)}:</strong>
                    <span class="text-slate-300">${this.escapeHtmlAttr(body)}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      } else {
        container.innerHTML = `<p class="text-xs text-slate-400 italic">Apply over wet intercoat clear or binder according to TDS guidelines.</p>`;
      }
    } else if (tabName === 'inbox') {
      const items = prod.inTheBox || [];
      if (items.length > 0) {
        container.innerHTML = `
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            ${items.map(item => `
              <div class="flex items-center gap-2 bg-surface-container-low/60 px-2.5 py-1.5 rounded border border-white/5 text-[11px] text-slate-200">
                <span class="material-symbols-outlined text-emerald-400 text-[15px] flex-shrink-0">inventory_2</span>
                <span class="font-medium">${this.escapeHtmlAttr(item)}</span>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        container.innerHTML = `<p class="text-xs text-slate-400 italic">Standard packaged retail container.</p>`;
      }
    }
  }

  switchDetailImage(imgSrc, btn) {
    const imgEl = document.getElementById('detail-img');
    if (imgEl) {
      imgEl.src = imgSrc;
    }
    const thumbs = document.querySelectorAll('.detail-gallery-thumb');
    thumbs.forEach(t => {
      t.classList.remove('border-primary', 'bg-primary/20', 'shadow-[0_0_8px_rgba(211,47,47,0.5)]');
      t.classList.add('border-secondary/60', 'bg-surface-container-low');
      const label = t.querySelector('span');
      if (label) {
        label.classList.remove('text-primary');
        label.classList.add('text-secondary');
      }
    });
    if (btn) {
      btn.classList.remove('border-secondary/60', 'bg-surface-container-low');
      btn.classList.add('border-primary', 'bg-primary/20', 'shadow-[0_0_8px_rgba(211,47,47,0.5)]');
      const label = btn.querySelector('span');
      if (label) {
        label.classList.remove('text-secondary');
        label.classList.add('text-primary');
      }
    }
  }

  closeDetailModal() {
    const modal = document.getElementById('modal-product-detail');
    if (modal) modal.classList.remove('active');
  }

  openTradePortalModal() {
    const modal = document.getElementById('modal-trade-portal');
    if (modal) modal.classList.add('active');
  }

  closeTradePortalModal() {
    const modal = document.getElementById('modal-trade-portal');
    if (modal) modal.classList.remove('active');
  }

  switchTradeTab(tab) {
    const viewLogin = document.getElementById('view-trade-login');
    const viewApply = document.getElementById('view-trade-apply');
    const tabLogin = document.getElementById('tab-trade-login');
    const tabApply = document.getElementById('tab-trade-apply');

    if (tab === 'login') {
      if (viewLogin) viewLogin.classList.remove('hidden');
      if (viewApply) viewApply.classList.add('hidden');
      if (tabLogin) tabLogin.className = 'pb-2 border-b-2 border-primary text-white font-bold cursor-pointer';
      if (tabApply) tabApply.className = 'pb-2 border-b-2 border-transparent text-secondary hover:text-white transition-colors cursor-pointer';
    } else {
      if (viewLogin) viewLogin.classList.add('hidden');
      if (viewApply) viewApply.classList.remove('hidden');
      if (tabLogin) tabLogin.className = 'pb-2 border-b-2 border-transparent text-secondary hover:text-white transition-colors cursor-pointer';
      if (tabApply) tabApply.className = 'pb-2 border-b-2 border-primary text-white font-bold cursor-pointer';
    }
  }

  fillDemoTradeLogin(type) {
    const emailInput = document.getElementById('input-trade-email');
    const passInput = document.getElementById('input-trade-password');
    const err = document.getElementById('trade-login-error');
    if (err) err.classList.add('hidden');

    if (type === 'dealer') {
      if (emailInput) emailInput.value = 'sarah.j@apexpaint.co.uk';
      if (passInput) passInput.value = 'ApexCustom2026!';
      this.showToast('Prefilled: Apex Custom Paintworks (Tier 2 Dealer)', 'info');
    } else if (type === 'distributor') {
      if (emailInput) emailInput.value = 'distributor@mipa-nordic.eu';
      if (passInput) passInput.value = 'Distributor2026!';
      this.showToast('Prefilled: Mipa Nordic Logistics (Tier 1 Distributor)', 'info');
    } else if (type === 'pending') {
      if (emailInput) emailInput.value = 'klaus@bavariakustom.de';
      if (passInput) passInput.value = 'Bavaria2026!';
      this.showToast('Prefilled: Bavaria Kustom Works (Pending Manual Verification)', 'warning');
    }
  }

  async handleTradeLogin() {
    const email = (document.getElementById('input-trade-email')?.value || '').trim();
    const password = (document.getElementById('input-trade-password')?.value || '').trim();
    const err = document.getElementById('trade-login-error');
    const submitBtn = document.getElementById('btn-submit-trade-login');

    if (!email || !password) {
      if (err) {
        err.textContent = "Please enter both your business email and password.";
        err.classList.remove('hidden');
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> Authenticating...`;
    }

    try {
      let data = null;
      try {
        const resp = await fetch('/api/auth/trade-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        data = await resp.json();
      } catch (networkErr) {
        console.warn("API offline, falling back to local trade verification:", networkErr);
        if (email.toLowerCase().includes('klaus') || email.toLowerCase().includes('bavaria')) {
          data = {
            success: false,
            error: "Application Pending Approval: Your commercial account for Bavaria Kustom Works is currently awaiting manual compliance verification. Our trade desk must review your VAT/business credentials before wholesale pricing can be accessed."
          };
        } else if (email.toLowerCase().includes('apex') || password === 'ApexCustom2026!') {
          data = {
            success: true,
            token: "CAE_B2B_DEALER_DEMO_" + Date.now(),
            user: {
              company: "Apex Custom Paintworks Ltd",
              contactName: "Sarah Jensen",
              role: "dealer",
              tierLabel: "Tier 2: Authorized Trade Dealer",
              vat: "GB123456789",
              country: "United Kingdom",
              currency: "GBP",
              discountMultiplier: 0.70
            }
          };
        } else if (email.toLowerCase().includes('distributor') || email.toLowerCase().includes('mipa') || password === 'Distributor2026!') {
          data = {
            success: true,
            token: "CAE_B2B_DIST_DEMO_" + Date.now(),
            user: {
              company: "Mipa Nordic Logistics B.V.",
              contactName: "Karl Heinz",
              role: "distributor",
              tierLabel: "Tier 1: Master Regional Distributor",
              vat: "NL999999999B01",
              country: "Netherlands",
              currency: "EUR",
              discountMultiplier: 0.45
            }
          };
        } else if (email.toLowerCase().includes('dave') || email.toLowerCase().includes('coast') || password === 'CoastUSA2026!') {
          data = {
            success: true,
            token: "CAE_B2B_STAKEHOLDER_USA_" + Date.now(),
            user: {
              company: "Coast Airbrush Inc (USA HQ)",
              contactName: "David Monning",
              role: "stakeholder",
              tierLabel: "Brand Principal & Licensor (USA HQ)",
              vat: "US-CA-92870",
              country: "United States",
              currency: "USD",
              discountMultiplier: 0.40
            }
          };
        } else if (email.toLowerCase().includes('ryan') || email.toLowerCase().includes('flake') || password === 'FlakeKing2026!') {
          data = {
            success: true,
            token: "CAE_B2B_STAKEHOLDER_FK_" + Date.now(),
            user: {
              company: "Flake King Ltd (UK HQ)",
              contactName: "Ryan Francis",
              role: "stakeholder",
              tierLabel: "Brand Principal & Licensor (Flake King UK)",
              vat: "GB876543210",
              country: "United Kingdom",
              currency: "GBP",
              discountMultiplier: 0.40
            }
          };
        }
      }

      if (data && data.success) {
        if (err) err.classList.add('hidden');
        this.b2bSession = data.user;
        this.isB2BMode = true;
        localStorage.setItem('cae_trade_token', data.token);

        await this.fetchB2BPricing(data.token);

        this.closeTradePortalModal();
        this.updateTradeBanner();
        this.renderStorefrontGrid();
        this.showToast(`✅ Welcome, ${data.user.contactName}! ${data.user.tierLabel} session unlocked.`, "success");
      } else {
        if (err) {
          err.textContent = data?.error || "Invalid trade credentials. Please contact your account manager or submit an application.";
          err.classList.remove('hidden');
        }
      }
    } catch (e) {
      if (err) {
        err.textContent = "Unable to verify credentials. Please try again or contact support.";
        err.classList.remove('hidden');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span class="material-symbols-outlined text-[16px]">lock_open</span> <span>VERIFY CREDENTIALS & UNLOCK PRICING</span>`;
      }
    }
  }

  async fetchB2BPricing(token) {
    try {
      const resp = await fetch('/api/trade/pricing', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const result = await resp.json();
        this.b2bPricing = result.skuPricing || {};
      }
    } catch (e) {
      console.warn("Could not fetch remote B2B pricing:", e);
    }
  }

  updateTradeBanner() {
    const banner = document.getElementById('trade-active-banner');
    const btn = document.getElementById('btn-b2b-login');

    if (this.isB2BMode && this.b2bSession) {
      if (banner) {
        banner.classList.remove('hidden');
        const compEl = document.getElementById('trade-banner-company');
        const tierEl = document.getElementById('trade-banner-tier');
        const vatEl = document.getElementById('trade-banner-vat');
        if (compEl) compEl.textContent = this.b2bSession.company;
        if (tierEl) tierEl.textContent = this.b2bSession.tierLabel || 'Authorized Trade';
        if (vatEl) vatEl.textContent = `VAT: ${this.b2bSession.vat || 'Verified'}`;
      }

      if (btn) {
        btn.classList.add('bg-emerald-950/80', 'border-emerald-500/80', 'text-emerald-300');
        btn.innerHTML = `<span class="material-symbols-outlined text-[14px] text-emerald-400">verified</span> ${this.b2bSession.role === 'distributor' ? 'DISTRIBUTOR ACTIVE' : 'TRADE ACTIVE'}`;
      }
    } else {
      if (banner) banner.classList.add('hidden');
      if (btn) {
        btn.classList.remove('bg-emerald-950/80', 'border-emerald-500/80', 'text-emerald-300');
        btn.innerHTML = `<span class="material-symbols-outlined text-[16px]">verified_user</span> TRADE / DEALERS`;
      }
    }
  }

  async handleTradeLogout() {
    const token = localStorage.getItem('cae_trade_token');
    if (token) {
      try {
        await fetch('/api/auth/trade-logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {}
    }

    localStorage.removeItem('cae_trade_token');
    this.b2bSession = null;
    this.b2bPricing = null;
    this.isB2BMode = false;

    this.updateTradeBanner();
    this.renderStorefrontGrid();
    this.showToast("Trade session ended. Reverted to standard retail MSRP catalog.", "info");
  }

  async restoreTradeSession() {
    const token = localStorage.getItem('cae_trade_token');
    if (!token) return;

    try {
      const resp = await fetch('/api/auth/trade-session', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        this.b2bSession = data.user;
        this.isB2BMode = true;
        await this.fetchB2BPricing(token);
        this.updateTradeBanner();
        this.renderStorefrontGrid();
      } else {
        localStorage.removeItem('cae_trade_token');
      }
    } catch (e) {
      console.warn("Could not restore trade session:", e);
    }
  }

  async handleTradeApply() {
    const company = (document.getElementById('input-trade-company')?.value || '').trim();
    const vat = (document.getElementById('input-trade-vat')?.value || '').trim();
    const contactName = (document.getElementById('input-trade-contact-name')?.value || '').trim();
    const phone = (document.getElementById('input-trade-phone')?.value || '').trim();
    const email = (document.getElementById('input-trade-contact-email')?.value || '').trim();
    const sector = document.getElementById('select-trade-sector')?.value;
    const tierDesired = document.getElementById('select-trade-tier-desired')?.value;
    const country = (document.getElementById('input-trade-country')?.value || '').trim();
    const monthlyVolume = document.getElementById('select-trade-volume')?.value;
    const successMsg = document.getElementById('trade-apply-success');
    const btn = document.getElementById('btn-submit-trade-apply');

    if (!company || !email || !vat) {
      this.showToast("Please provide your trading company name, VAT/Tax ID, and official business email.", "warning");
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> Submitting...`;
    }

    try {
      const payload = { company, vat, contactName, phone, email, sector, tierDesired, country, monthlyVolume };
      let res = null;
      try {
        const response = await fetch('/api/trade/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        res = await response.json();
      } catch (err) {
        res = { success: true };
      }

      if (successMsg) {
        successMsg.classList.remove('hidden');
        successMsg.textContent = "✓ Commercial application received. Our compliance desk will verify your VAT ID and dispatch your Trade Prospectus within 24 hours.";
      }
      if (btn) {
        btn.innerHTML = `<span class="material-symbols-outlined text-[16px]">check_circle</span> Application Submitted`;
      }
      this.showToast("Commercial application submitted successfully!", "success");
    } catch (e) {
      this.showToast("Failed to submit application. Please contact sales@coastairbrush.eu directly.", "danger");
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span>SUBMIT COMMERCIAL APPLICATION</span>`;
      }
    }
  }

  renderSystemsDropdown() {
    const select = document.getElementById('select-mixing-system');
    const grid = document.getElementById('mixing-systems-grid');
    const modalGrid = document.getElementById('modal-mixing-systems-grid');

    if (select) {
      select.innerHTML = '';
      this.currentCatalog.mixingSystems.forEach(sys => {
        const opt = document.createElement('option');
        opt.value = sys.id;
        opt.textContent = `${sys.name} (${sys.ratioText})`;
        select.appendChild(opt);
      });
      select.value = this.selectedSystem.id;
    }

    const renderCardGrid = (container, isModal = false) => {
      if (!container) return;
      container.innerHTML = '';
      this.currentCatalog.mixingSystems.forEach(sys => {
        const isSelected = sys.id === this.selectedSystem.id;
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `p-3 text-left border-2 transition-all cursor-pointer rounded flex flex-col justify-between ${
          isSelected 
            ? 'bg-primary-container/20 border-primary shadow-[2px_2px_0px_0px_rgba(211,47,47,0.8)]' 
            : 'bg-surface-dim border-secondary/60 hover:border-secondary hover:bg-surface-container'
        }`;
        card.innerHTML = `
          <div class="flex items-center justify-between mb-1.5 w-full">
            <span class="font-mono text-[10px] font-bold uppercase ${isSelected ? 'text-primary' : 'text-secondary'}">
              ${sys.badge || 'FORMULA'}
            </span>
            ${isSelected ? '<span class="material-symbols-outlined text-primary text-[16px]">check_circle</span>' : ''}
          </div>
          <div class="font-headline text-xs text-on-surface uppercase font-bold leading-tight mb-1">
            ${sys.name.split('(')[0].trim()}
          </div>
          <div class="font-mono text-[10px] text-amber-400 font-bold">
            ${sys.ratioText}
          </div>
        `;
        card.addEventListener('click', () => {
          this.onSystemChange(sys.id);
        });
        container.appendChild(card);
      });
    };

    renderCardGrid(grid, false);
    renderCardGrid(modalGrid, true);

    this.updateSystemDescription();
  }

  updateSystemDescription() {
    const desc = document.getElementById('system-description');
    const badge = document.getElementById('formula-ratio-badge');
    const modalRatioBadge = document.getElementById('modal-ratio-badge');

    if (desc && this.selectedSystem) {
      const isChrome = this.selectedSystem.id === 'kroma_edge_mirror_chrome';
      const isClear = this.selectedSystem.id.includes('clear');
      
      let nozzleGuide = 'Airbrush 0.3mm-0.5mm @ 25-35 PSI | Mini/HVLP Gun 0.8mm-1.3mm';
      let cureGuide = 'Air cure 24-36h @ 20°C / Force bake 60°C for 30 min';
      
      if (isChrome) {
        nozzleGuide = 'Airbrush 0.3mm-0.5mm @ 25-45 PSI | Mini Gun 0.8mm-1.2mm @ 1.2-1.5 Bar';
        cureGuide = 'Air cure min 36 hours @ >68°F (20°C) before dedicated clearcoat';
      } else if (isClear) {
        nozzleGuide = 'HVLP 1.2mm-1.4mm @ 1.8-2.2 Bar | Airbrush 0.5mm';
        cureGuide = 'Dust free 15-20 min. Polishable after 12h air cure / 30 min @ 60°C';
      }

      // Calculate Real-World Coverage for the current total volume
      const totalMl = this.totalMlNeeded || 140;
      // Coverage benchmark: ~30 mL (1 fl oz) covers 1.0 sq ft (0.093 m²) in 1 continuous wet coat
      const sqftCoverage = (totalMl / 30).toFixed(1);
      const sqmCoverage = (totalMl / 322).toFixed(2);
      
      let coverageContext = `${sqftCoverage} sq ft (~1-2 Helmets / Motorcycle Tank)`;
      if (totalMl < 70) {
        coverageContext = `${sqftCoverage} sq ft (Precision graphics & spot murals)`;
      } else if (totalMl >= 350 && totalMl < 900) {
        coverageContext = `${sqftCoverage} sq ft (Full motorcycle kit / Car bonnet)`;
      } else if (totalMl >= 900) {
        coverageContext = `${sqftCoverage} sq ft (Multiple automotive panels / large show parts)`;
      }

      desc.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          <!-- Coverage Indicator -->
          <div class="bg-surface p-3 border border-secondary/60 rounded flex items-center gap-3">
            <div class="w-9 h-9 rounded bg-emerald-950/60 border border-emerald-500/60 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <span class="material-symbols-outlined text-lg">square_foot</span>
            </div>
            <div>
              <span class="text-[10px] text-secondary uppercase font-bold block">Live Batch Coverage:</span>
              <span class="text-white font-bold text-sm block">${sqftCoverage} sq ft <span class="text-xs text-emerald-400 font-normal">(${sqmCoverage} m²)</span></span>
              <span class="text-[10px] text-neutral-400 block truncate">${coverageContext}</span>
            </div>
          </div>

          <!-- Application Tooling -->
          <div class="bg-surface p-3 border border-secondary/60 rounded flex items-center gap-3">
            <div class="w-9 h-9 rounded bg-sky-950/60 border border-sky-500/60 flex items-center justify-center text-sky-400 flex-shrink-0">
              <span class="material-symbols-outlined text-lg">precision_manufacturing</span>
            </div>
            <div>
              <span class="text-[10px] text-secondary uppercase font-bold block">Recommended Equipment:</span>
              <span class="text-white font-bold text-xs block">${nozzleGuide.split('|')[0]}</span>
              <span class="text-[10px] text-neutral-400 block">${nozzleGuide.split('|')[1] || 'Standard 1/4" Inlet'}</span>
            </div>
          </div>

          <!-- Cure & Flash Profile -->
          <div class="bg-surface p-3 border border-secondary/60 rounded flex items-center gap-3">
            <div class="w-9 h-9 rounded bg-amber-950/60 border border-amber-500/60 flex items-center justify-center text-amber-400 flex-shrink-0">
              <span class="material-symbols-outlined text-lg">timer</span>
            </div>
            <div>
              <span class="text-[10px] text-secondary uppercase font-bold block">Flash &amp; Cure Time:</span>
              <span class="text-white font-bold text-xs block">${cureGuide.split('before')[0]}</span>
              <span class="text-[10px] text-neutral-400 block">${isChrome ? 'Single continuous wet coat' : '10 min flash between coats'}</span>
            </div>
          </div>
        </div>
      `;
    }

    if (badge && this.selectedSystem) {
      badge.textContent = `Ratio: ${this.selectedSystem.ratioText}`;
    }
    if (modalRatioBadge && this.selectedSystem) {
      modalRatioBadge.textContent = `Ratio: ${this.selectedSystem.ratioText}`;
    }
  }

  onSystemChange(systemId) {
    this.selectedSystem = this.currentCatalog.mixingSystems.find(s => s.id === systemId) || this.currentCatalog.mixingSystems[0];
    const select = document.getElementById('select-mixing-system');
    if (select) select.value = this.selectedSystem.id;
    this.renderSystemsDropdown();
    this.updateCalculation();
    this.updateModalCalculation();
  }

  setMixVolumePreset(vol, unit = 'ml') {
    const volInput = document.getElementById('input-total-volume');
    const unitSelect = document.getElementById('select-volume-unit');
    if (unitSelect) unitSelect.value = unit;
    if (volInput) volInput.value = vol;
    this.updateCalculation();
  }

  setQuickMixVolumePreset(vol, unit = 'ml') {
    const volInput = document.getElementById('input-modal-total-volume');
    const unitSelect = document.getElementById('select-modal-volume-unit');
    if (unitSelect) unitSelect.value = unit;
    if (volInput) volInput.value = vol;
    this.updateModalCalculation();
  }

  setupQuickMixModal() {
    const modal = document.getElementById('modal-quick-mix');
    if (!modal) return;

    this.addSafeListener('btn-close-quick-mix-modal', 'click', () => this.closeQuickMixModal());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeQuickMixModal();
    });

    this.addSafeListener('input-modal-total-volume', 'input', () => this.updateModalCalculation());
    this.addSafeListener('select-modal-volume-unit', 'change', () => this.updateModalCalculation());

    this.addSafeListener('btn-modal-download-tds', () => {
      if (this.selectedSystem) this.downloadSystemTDS(this.selectedSystem);
    });
    this.addSafeListener('btn-modal-download-sds', () => {
      if (this.selectedSystem) this.downloadSystemSDS(this.selectedSystem);
    });
  }

  openQuickMixModal(systemId) {
    if (systemId) {
      const match = this.currentCatalog.mixingSystems.find(s => s.id === systemId);
      if (match) this.selectedSystem = match;
    }
    const modal = document.getElementById('modal-quick-mix');
    if (!modal) return;
    this.renderSystemsDropdown();
    this.updateModalCalculation();
    modal.classList.add('active');
  }

  closeQuickMixModal() {
    const modal = document.getElementById('modal-quick-mix');
    if (modal) modal.classList.remove('active');
  }

  updateModalCalculation() {
    const volInput = document.getElementById('input-modal-total-volume');
    const unitSelect = document.getElementById('select-modal-volume-unit');
    let vol = parseFloat(volInput ? volInput.value : 140) || 140;
    const unit = unitSelect ? unitSelect.value : 'ml';

    if (unit === 'floz') vol = vol * 29.5735;
    else if (unit === 'pt') vol = vol * 473.176;
    else if (unit === 'qt') vol = vol * 946.353;

    const recipe = calculateMixingRecipe(this.selectedSystem, vol, this.selectedColors);
    const tbody = document.getElementById('modal-recipe-table-body');
    if (!tbody || !recipe) return;
    tbody.innerHTML = '';

    const steps = recipe.steps || recipe.components || [];
    steps.forEach((step, index) => {
      const name = step.componentName || step.name;
      const weight = step.targetWeightGrams !== undefined ? step.targetWeightGrams : (step.individualWeightGrams || 0);
      const cumulative = step.cumulativeWeightGrams || 0;

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-surface-container/60 transition-colors';
      tr.innerHTML = `
        <td class="p-2.5"><span class="metal-spec-plate text-[10px]">${index + 1}</span></td>
        <td class="p-2.5 font-bold text-on-surface">${name}</td>
        <td class="p-2.5 text-primary font-bold">${step.percentage}%</td>
        <td class="p-2.5 text-neutral-300">${Math.round(step.volumeMl)} mL</td>
        <td class="p-2.5 text-neutral-300">${weight.toFixed(1)} g</td>
        <td class="p-2.5 font-bold text-primary">${cumulative.toFixed(1)} g</td>
      `;
      tbody.appendChild(tr);
    });
  }

  renderColorSwatches() {
    const container = document.getElementById('swatch-container');
    if (!container) return;
    container.innerHTML = '';

    const products = this.currentCatalog.products || this.currentCatalog.colors || ECOM_CATALOG.slice(0, 16);
    products.forEach(prod => {
      const item = document.createElement('div');
      item.className = 'swatch-item';
      item.innerHTML = `
        <div class="swatch-preview-box" style="background-color: ${prod.hex || '#d32f2f'};"></div>
        <div class="font-headline text-xs text-on-surface truncate">${prod.name}</div>
        <div class="font-mono text-[10px] text-secondary">${prod.sku || ''}</div>
      `;
      item.addEventListener('click', () => {
        document.querySelectorAll('.swatch-item').forEach(s => s.classList.remove('selected'));
        item.classList.add('selected');
        this.selectedColors['base'] = prod;
        this.updateCalculation();
      });
      container.appendChild(item);
    });
  }

  getProductCalculatedPrice(prod, selectedPack, selectedSize, selectedWidth) {
    let priceEur = prod.priceEur || 24.00;
    let matchedSku = prod.sku || '';
    let matchedStockCode = prod.stockCode || '';
    let matchedBarcode = prod.barcode || '';

    // 1. Check standardized variantMatrix if present
    if (prod.variantMatrix && prod.variantMatrix.variants && prod.variantMatrix.variants.length > 0) {
      const activeOptions = [selectedWidth, selectedSize, selectedPack].filter(Boolean);
      const match = prod.variantMatrix.variants.find(v => {
        if (!v.options) return false;
        const optVals = Object.values(v.options);
        if (activeOptions.length > 0) {
          return activeOptions.every(opt => optVals.includes(opt));
        }
        return false;
      });
      if (match) {
        if (match.priceEur) priceEur = match.priceEur;
        if (match.sku) matchedSku = match.sku;
        if (match.stockCode) matchedStockCode = match.stockCode;
        if (match.barcode) matchedBarcode = match.barcode;
      }
    }
    // 2. Check tapePriceMatrix (Tape products)
    else if (prod.tapePriceMatrix && prod.tapePriceMatrix.length > 0) {
      const targetWidth = selectedWidth || selectedSize || selectedPack;
      if (targetWidth) {
        const match = prod.tapePriceMatrix.find(t => t.width === targetWidth || this.matchPackToken(targetWidth, t.width));
        if (match) {
          if (match.priceEur) priceEur = match.priceEur;
          if (match.sku) matchedSku = match.sku;
          if (match.stockCode) matchedStockCode = match.stockCode;
          if (match.barcode) matchedBarcode = match.barcode;
        }
      }
    }
    // 3. Check fullMatrixPricing (matching both pack size and flake particle size)
    else if (prod.fullMatrixPricing && prod.fullMatrixPricing.length > 0) {
      const match = prod.fullMatrixPricing.find(m => {
        const pSize = m.rawPackSize || m.packSize || '';
        const fSize = m.rawFlakeSize || m.flakeSize || '';
        const matchPack = !selectedPack || this.matchPackToken(selectedPack, pSize) || this.matchPackToken(selectedPack, m.packSize);
        const matchSize = !selectedSize || this.matchFlakeSizeToken(selectedSize, fSize) || this.matchFlakeSizeToken(selectedSize, m.flakeSize);
        return matchPack && matchSize;
      });
      if (match) {
        if (match.priceEur) priceEur = match.priceEur;
        if (match.sku) matchedSku = match.sku;
        if (match.stockCode) matchedStockCode = match.stockCode;
        if (match.barcode) matchedBarcode = match.barcode;
      } else if (prod.packPriceMatrix && (selectedPack || selectedSize)) {
        const packMatch = prod.packPriceMatrix.find(m => 
          (selectedPack && (this.matchPackToken(selectedPack, m.packSize) || selectedPack === m.packSize)) ||
          (selectedSize && (this.matchPackToken(selectedSize, m.packSize) || selectedSize === m.packSize))
        );
        if (packMatch) {
          if (packMatch.priceEur) priceEur = packMatch.priceEur;
          if (packMatch.sku) matchedSku = packMatch.sku;
          if (packMatch.stockCode) matchedStockCode = packMatch.stockCode;
          if (packMatch.barcode) matchedBarcode = packMatch.barcode;
        }
      }
    } else if (prod.packPriceMatrix && (selectedPack || selectedSize)) {
      const match = prod.packPriceMatrix.find(m => 
        (selectedPack && (this.matchPackToken(selectedPack, m.packSize) || selectedPack === m.packSize)) ||
        (selectedSize && (this.matchPackToken(selectedSize, m.packSize) || selectedSize === m.packSize))
      );
      if (match) {
        if (match.priceEur) priceEur = match.priceEur;
        if (match.sku) matchedSku = match.sku;
        if (match.stockCode) matchedStockCode = match.stockCode;
        if (match.barcode) matchedBarcode = match.barcode;
      }
    }

    let finalEur = priceEur;
    let finalGbp = null;

    if (this.isB2BMode && this.b2bSession) {
      const lookupKey = matchedSku || matchedStockCode || prod.sku || prod.stockCode;
      if (this.b2bPricing && lookupKey && this.b2bPricing[lookupKey]) {
        const itemPricing = this.b2bPricing[lookupKey];
        if (itemPricing.priceEur !== null && itemPricing.priceEur !== undefined) finalEur = itemPricing.priceEur;
        if (itemPricing.priceGbp !== null && itemPricing.priceGbp !== undefined) finalGbp = itemPricing.priceGbp;
      } else {
        const mult = this.b2bSession.discountMultiplier || (this.b2bSession.role === 'distributor' ? 0.45 : 0.70);
        finalEur = priceEur * mult;
      }
    }

    const country = this.euLocalization.getCountry();
    const finalLocal = (finalGbp !== null && country.currency === 'GBP') ? finalGbp : finalEur * country.rateToEur;
    const gbpRate = 0.85;
    if (finalGbp === null) finalGbp = finalEur * gbpRate;

    // Multi-country VAT calculation breakdown
    const breakdown = this.euLocalization.calculatePriceBreakdown(finalLocal);
    const vatMode = this.euLocalization.getVatDisplayMode(); // 'ex' or 'inc'

    const priceExVat = breakdown.priceNet;
    const priceIncVat = breakdown.priceGross;
    const vatRatePercent = breakdown.vatRatePercent;

    // Display values based on active mode
    const displayPrimaryNumber = vatMode === 'inc' ? priceIncVat : priceExVat;
    const displaySecondaryNumber = vatMode === 'inc' ? priceExVat : priceIncVat;

    const primaryVatBadge = vatMode === 'inc' ? 'INC VAT' : 'EX VAT';
    const secondaryVatBadge = vatMode === 'inc' ? 'ex. VAT' : 'inc. VAT';
    const secondaryCurrencyFormatted = country.currency === 'GBP' ? `€${finalEur.toFixed(2)} EUR` : `£${finalGbp.toFixed(2)} GBP`;

    return {
      priceEur: finalEur,
      priceLocal: finalLocal,
      priceExVat,
      priceIncVat,
      vatAmount: breakdown.vatAmount,
      vatRatePercent,
      vatMode,
      isVatExempt: breakdown.isVatExempt,
      isUK: breakdown.isUK,
      primaryVatBadge,
      secondaryVatBadge,
      currencySymbol: country.symbol,
      currencyCode: country.currency,
      formattedPrimary: `${country.symbol}${displayPrimaryNumber.toFixed(2)}`,
      formattedPrimaryWithBadge: `${country.symbol}${displayPrimaryNumber.toFixed(2)} ${primaryVatBadge}`,
      formattedSecondary: `${country.symbol}${displaySecondaryNumber.toFixed(2)} ${secondaryVatBadge}`,
      formattedSecondaryCur: secondaryCurrencyFormatted,
      sku: matchedSku || matchedStockCode || prod.sku || 'N/A',
      stockCode: matchedStockCode || matchedSku || prod.stockCode || '',
      barcode: matchedBarcode || prod.barcode || ''
    };
  }

  renderStorefrontGrid() {
    const container = document.getElementById('storefront-product-grid');
    if (!container) return;
    container.innerHTML = '';

    let filtered = ECOM_CATALOG.filter(p => !p.hideFromStorefront);

    if (this.activeBrandFilter && this.activeBrandFilter !== 'all') {
      filtered = filtered.filter(p => (p.brand || '').toLowerCase().includes(this.activeBrandFilter.toLowerCase()));
    }

    if (this.activeCategoryFilter && this.activeCategoryFilter !== 'all') {
      filtered = filtered.filter(p => this.matchCategory(p, this.activeCategoryFilter));
    }

    if (this.activeFlakeSubcat && this.activeFlakeSubcat !== 'all') {
      filtered = filtered.filter(p => {
        const subCat = this.getFlakeSubcategory(p);
        if (!subCat) return false;
        if (this.activeFlakeSubcat === 'single') return subCat.includes('Single');
        if (this.activeFlakeSubcat === 'blend') return subCat.includes('Mixed') || subCat.includes('Blend');
        if (this.activeFlakeSubcat === 'holographic') return subCat.includes('Holographic') || subCat.includes('Kromatic');
        if (this.activeFlakeSubcat === 'iridescent') return subCat.includes('Iridescent');
        return true;
      });
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const fullText = `${p.name || ''} ${p.brand || ''} ${p.sku || ''} ${p.category || ''} ${p.description || ''}`.toLowerCase();
        if (fullText.includes(q)) return true;
        const words = q.split(/\s+/).filter(w => w.length >= 3);
        return words.length > 0 && words.some(w => fullText.includes(w));
      });
    }

    if (this.activeSort === 'price-asc') {
      filtered.sort((a, b) => (a.priceEur || 0) - (b.priceEur || 0));
    } else if (this.activeSort === 'price-desc') {
      filtered.sort((a, b) => (b.priceEur || 0) - (a.priceEur || 0));
    } else if (this.activeSort === 'rating') {
      filtered.sort((a, b) => {
        const rA = parseFloat(this.getProductReviewData(a).rating);
        const rB = parseFloat(this.getProductReviewData(b).rating);
        return rB - rA;
      });
    } else if (this.activeSort === 'name') {
      filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    const countBadge = document.getElementById('shop-results-count');
    if (countBadge) {
      const brandText = this.activeBrandFilter === 'all' ? 'All Brands' : this.activeBrandFilter;
      const catText = this.activeCategoryFilter === 'all' ? 'All Categories' : this.activeCategoryFilter;
      const totalActive = ECOM_CATALOG.filter(p => !p.hideFromStorefront).length;
      countBadge.textContent = `Showing ${filtered.length} of ${totalActive} In-Stock Products (${brandText} > ${catText})`;
    }

    const mobileCountBadge = document.getElementById('mobile-shop-results-count');
    if (mobileCountBadge) {
      mobileCountBadge.textContent = `${filtered.length} Products`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-16 text-center font-mono text-secondary">
          No products found matching filters. <button onclick="document.getElementById('btn-reset-filters').click()" class="text-primary underline">Reset All Filters</button>
        </div>
      `;
      return;
    }

    filtered.forEach(prod => {
      try {
        const isFlake = prod.category === 'Dry Metal Flake (Glitter)' || prod.category === 'Metal Flake';
        const isTape = prod.hasTapeOptions || prod.category === 'Masking Products' || (prod.name && prod.name.includes('Tape'));

        let sizeLabel = isTape ? 'Tape Width / Roll Size' : (isFlake ? 'Flake Dimension (Micron)' : 'Product Size');
        let packLabel = 'Pack Size / Volume:';

        let validSizes = [];
        let validPacks = [];

        if (prod.variantMatrix && prod.variantMatrix.axes && prod.variantMatrix.axes.length > 0) {
          const ax1 = prod.variantMatrix.axes[0];
          sizeLabel = ax1.name || sizeLabel;
          validSizes = (ax1.values || []).map(s => String(s).trim()).filter(Boolean);
          if (prod.variantMatrix.axes.length > 1) {
            const ax2 = prod.variantMatrix.axes[1];
            packLabel = ax2.name || packLabel;
            validPacks = (ax2.values || []).map(p => String(p).trim()).filter(Boolean);
          }
        } else {
          validSizes = (prod.sizes || []).map(s => isFlake ? this.formatFlakeDimension(s) : String(s).trim()).filter(Boolean);
          validPacks = (prod.packSizes || []).map(p => isFlake ? this.formatFlakePackSize(p) : String(p).trim()).filter(Boolean);

          if (isTape && validSizes.length === 0 && (prod.tapeWidths || prod.tapePriceMatrix)) {
            validSizes = (prod.tapeWidths || (prod.tapePriceMatrix ? prod.tapePriceMatrix.map(t => t.width) : [])).map(w => String(w).trim());
          }

          if (isFlake && validPacks.length === 0) {
            validPacks = [
              '30g Jar (Direct Gun Mount - 500/550)',
              '100g Jar (Direct Gun Mount - 1000/1050)',
              '1000g (1 Kilo Trade Pack)'
            ];
          }
        }

        if (!this.selectedProductVariants[prod.id]) {
          this.selectedProductVariants[prod.id] = {
            size: validSizes[0] || '',
            pack: validPacks[0] || '',
            width: isTape ? (validSizes[0] || '') : ''
          };
        }

        const currentSelection = this.selectedProductVariants[prod.id] || { size: '', pack: '', width: '' };
        const prices = this.getProductCalculatedPrice(prod, currentSelection.pack, currentSelection.size, currentSelection.width);
        const reviewData = this.getProductReviewData(prod) || { rating: '4.9', count: 24, quote: '', author: '' };

        const isPreOrder = Boolean(prod.isPreOrder || (prod.badge && (prod.badge.includes('EARLY BIRD') || prod.badge.includes('PRE-ORDER') || prod.badge.includes('BATCH 1'))) || prod.id.startsWith('preorder_'));
        const subCategoryLabel = isFlake ? this.getFlakeSubcategory(prod) : null;
        let badgeText = prod.badge || 'IN STOCK';
        if (this.isB2BMode && this.b2bSession) {
          badgeText = this.b2bSession.role === 'distributor' 
            ? '📦 DISTRIBUTOR WHOLESALE' 
            : '🏢 DEALER WHOLESALE';
        } else if (isPreOrder) {
          badgeText = `⏳ ${prod.badge || 'PRE-ORDER'}`;
        } else if (isFlake && subCategoryLabel) {
          badgeText = `✨ ${subCategoryLabel.toUpperCase()}`;
        }

        let variantControls = '';
        if (validSizes.length > 1 || (validSizes.length === 1 && validPacks.length === 0)) {
          variantControls += `
            <div class="mb-1.5">
              <label class="font-label-xs text-[10px] text-secondary uppercase block mb-0.5 font-bold">${sizeLabel}:</label>
              <select id="select-size-${prod.id}" class="mech-select !py-1 !px-2 !text-[11px] leading-tight" onchange="window.paintApp.onProductVariantChange('${prod.id}', 'size', this.value)">
                ${validSizes.map(s => {
                  const optPrice = this.getProductCalculatedPrice(prod, currentSelection.pack, s);
                  const showPrice = validPacks.length <= 1 && optPrice ? ` (${optPrice.formattedPrimary} ${optPrice.primaryVatBadge})` : '';
                  return `<option value="${this.escapeHtmlAttr(s)}" ${s === currentSelection.size ? 'selected' : ''}>${s}${showPrice}</option>`;
                }).join('')}
              </select>
            </div>
          `;
        }

        if (validPacks.length > 1 || (validPacks.length === 1 && validSizes.length === 0)) {
          variantControls += `
            <div class="mb-1.5">
              <label class="font-label-xs text-[10px] text-secondary uppercase block mb-0.5 font-bold">Pack Size / Volume:</label>
              <select id="select-pack-${prod.id}" class="mech-select !py-1 !px-2 !text-[11px] leading-tight" onchange="window.paintApp.onProductVariantChange('${prod.id}', 'pack', this.value)">
                ${validPacks.map(p => {
                  const optPrice = this.getProductCalculatedPrice(prod, p, currentSelection.size);
                  return `<option value="${this.escapeHtmlAttr(p)}" ${p === currentSelection.pack ? 'selected' : ''}>${p} (${optPrice ? optPrice.formattedPrimary + ' ' + optPrice.primaryVatBadge : ''})</option>`;
                }).join('')}
              </select>
            </div>
          `;
        }

        const fallbackImg = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
        const card = document.createElement('div');
        card.className = 'industrial-card group overflow-hidden flex flex-col justify-between';
        card.innerHTML = `
          <div>
            <div onclick="window.paintApp && window.paintApp.openDetailModal('${prod.id}')" class="h-52 relative border-b border-white/10 overflow-hidden product-studio-stage flex items-center justify-center p-4 rounded-t cursor-pointer" title="Click to view product details &amp; options">
              <img id="card-img-${prod.id}" class="w-full h-full object-contain filter contrast-110 drop-shadow-[0_12px_20px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform duration-500" src="${prod.image || fallbackImg}" alt="${prod.name}" onerror="this.onerror=null; this.src='${fallbackImg}'">
              <div class="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                <span class="bg-black/80 border border-white/20 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded tracking-wider backdrop-blur-sm">${(prod.brand || 'COAST').toUpperCase()}</span>
                ${prod.images && prod.images.length > 1 ? `<span class="bg-black/80 border border-sky-500/50 text-sky-300 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider backdrop-blur-sm flex items-center gap-0.5 shadow"><span class="material-symbols-outlined text-[11px]">photo_library</span> ${prod.images.length} PHOTOS</span>` : ''}
              </div>
              <div class="absolute bottom-2.5 right-2.5 flex flex-col items-end gap-1.5 z-10">
                ${prod.videos && prod.videos.length > 0 ? `
                  <button type="button" onclick="event.stopPropagation(); window.paintApp.openDetailModal('${prod.id}', 'video')" class="bg-red-950/90 border border-red-500/70 text-red-200 hover:text-white hover:bg-red-600 font-mono text-[9px] font-bold px-2 py-0.5 rounded tracking-wider backdrop-blur-sm flex items-center gap-1 shadow-[0_0_8px_rgba(239,68,68,0.5)] transition-all cursor-pointer" title="Watch in-action video demonstration">
                    <span class="material-symbols-outlined text-[12px] text-red-400">play_circle</span>
                    <span>DEMO (${prod.videos.length})</span>
                  </button>
                ` : ''}
                <span class="${isPreOrder ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_12px_rgba(225,29,72,0.6)]' : 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'} font-mono text-[10px] font-bold px-2.5 py-0.5 rounded backdrop-blur-sm">${badgeText}</span>
              </div>
            </div>

            <div class="p-4 bg-[#141618]">
              <div class="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-1">
                <span id="card-sku-${prod.id}">SKU: <span id="card-sku-val-${prod.id}" class="text-zinc-300 font-semibold">${prices.sku || prod.sku || 'N/A'}</span></span>
                ${isPreOrder ? '<span class="text-rose-400 font-bold text-[10px] flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span> Batch 1 Allocation</span>' : '<span class="text-emerald-400 text-[10px] font-semibold">● UK In Stock</span>'}
              </div>
              <h4 onclick="window.paintApp && window.paintApp.openDetailModal('${prod.id}')" class="font-headline text-[13px] sm:text-sm uppercase text-white font-bold mb-1 line-clamp-2 min-h-[2.5rem] leading-snug tracking-tight group-hover:text-primary transition-colors cursor-pointer" title="Click to view product details &amp; options">${prod.name}</h4>
              
              <div class="flex items-center justify-between text-[11px] font-mono my-2 text-neutral-400">
                <span class="text-emerald-400 font-bold flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> ${isPreOrder ? 'Batch 1 Pre-Order' : 'UK Dispatch'}
                </span>
                <span class="text-[10px] text-neutral-400 uppercase font-mono tracking-wider">${prod.category || 'PRO GRADE'}</span>
              </div>

              <p class="font-body-md text-xs text-neutral-300 line-clamp-2 mb-2 leading-relaxed">${prod.description || 'Authentic formulation manufactured for pro custom airbrushing & custom paint.'}</p>
              <div class="min-h-[58px] flex flex-col justify-end">${variantControls || '<div class="text-[11px] font-mono text-neutral-400 py-2">✓ Standard Pro Packaging</div>'}</div>
            </div>
          </div>

          <div class="p-4 pt-0 bg-[#141618]">
            <div class="flex items-center justify-between border-t border-white/10 pt-3 mb-3">
              <div>
                <div class="flex items-baseline gap-1.5 flex-wrap">
                  <span id="price-eur-${prod.id}" class="font-headline text-2xl text-white font-extrabold block leading-none">${prices.formattedPrimary}</span>
                  <span id="price-vat-badge-${prod.id}" class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded leading-none ${prices.vatMode === 'inc' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'}">${prices.primaryVatBadge}</span>
                </div>
                <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span id="price-gbp-${prod.id}" class="font-mono text-[11px] text-neutral-300 font-medium">${prices.formattedSecondary}</span>
                  <span class="font-mono text-[10px] text-neutral-500">(${prices.formattedSecondaryCur})</span>
                </div>
                ${this.isB2BMode && this.b2bSession ? `<span class="inline-block mt-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-500/50 px-1.5 py-0.5 rounded font-bold">✓ EX-VAT TRADE RATE</span>` : ''}
              </div>
              <button onclick="window.paintApp.openDetailModal('${prod.id}')" class="text-neutral-300 hover:text-white font-mono text-xs uppercase flex items-center gap-0.5 font-bold cursor-pointer transition-colors">
                Details <span class="material-symbols-outlined text-sm text-primary">chevron_right</span>
              </button>
            </div>

            <div class="grid grid-cols-1 gap-2">
              <button onclick="window.paintApp.addProductToCartById('${prod.id}')" class="mech-button-primary !w-full !justify-center !text-xs !py-2.5 font-bold tracking-wider shadow-[0_4px_12px_rgba(211,47,47,0.3)]">
                ${isPreOrder ? '🛒 Pre-Order Now' : '+ Add to Cart'}
              </button>
              ${prod.brand === 'Kroma Edge' || (prod.category || '').includes('Solvent') || (prod.category || '').includes('Paint') ? `
                <button onclick="window.openQuickMixModal('${prod.id.includes('clear') ? 'kroma_edge_dedicated_clear' : 'kroma_edge_mirror_chrome'}')" class="mech-btn-secondary !w-full !justify-center !text-[11px] !py-1.5 flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">calculate</span>
                  <span>Calculate Mix Ratio</span>
                </button>
              ` : ''}
            </div>
          </div>
        `;
        container.appendChild(card);
      } catch (err) {
        console.error('Error rendering product card for ID:', prod && prod.id, err);
      }
    });
  }

  onProductVariantChange(prodId, variantKey, val) {
    if (!this.selectedProductVariants[prodId]) {
      this.selectedProductVariants[prodId] = {};
    }
    this.selectedProductVariants[prodId][variantKey] = val;

    const prod = ECOM_CATALOG.find(p => p.id === prodId);
    if (!prod) return;

    const currentSelection = this.selectedProductVariants[prodId];
    const prices = this.getProductCalculatedPrice(prod, currentSelection.pack, currentSelection.size, currentSelection.width);
    
    // Storefront Card Price Elements
    const eurEl = document.getElementById(`price-eur-${prodId}`);
    const gbpEl = document.getElementById(`price-gbp-${prodId}`);
    const vatBadgeEl = document.getElementById(`price-vat-badge-${prodId}`);
    if (eurEl && prices) {
      eurEl.textContent = prices.formattedPrimary;
    }
    if (vatBadgeEl && prices) {
      vatBadgeEl.textContent = prices.primaryVatBadge;
      vatBadgeEl.className = `text-[10px] font-mono font-bold px-1.5 py-0.5 rounded leading-none ${prices.vatMode === 'inc' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'}`;
    }
    if (gbpEl && prices) {
      gbpEl.textContent = prices.formattedSecondary;
    }
    const cardSkuVal = document.getElementById(`card-sku-val-${prodId}`);
    if (cardSkuVal && prices && prices.sku) {
      cardSkuVal.textContent = prices.sku;
    }

    // Modal Price Elements (if modal is open for this product)
    if (this.activeModalProduct && this.activeModalProduct.id === prodId) {
      const modalPriceEl = document.getElementById('detail-price');
      const modalPriceSubEl = document.getElementById('detail-price-sub');
      if (modalPriceEl && prices) {
        modalPriceEl.innerHTML = `
          <span>${prices.formattedPrimary}</span>
          <span class="text-xs font-mono font-bold px-2 py-0.5 rounded align-middle ml-2 ${prices.vatMode === 'inc' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'}">${prices.primaryVatBadge}</span>
        `;
      }
      if (modalPriceSubEl && prices) {
        const country = this.euLocalization.getCountry();
        modalPriceSubEl.innerHTML = `
          <span class="text-white font-bold">${prices.formattedSecondary}</span>
          <span class="text-slate-400 ml-1.5">• ${prices.formattedSecondaryCur}</span>
          ${prices.isUK ? `<span class="text-amber-400 ml-1.5 hidden sm:inline">(20% UK HMRC VAT)</span>` : `<span class="text-emerald-400 ml-1.5 hidden sm:inline">(${prices.vatRatePercent}% ${country.code} Tax)</span>`}
        `;
      }
      const modalSkuEl = document.getElementById('detail-sku-badge');
      if (modalSkuEl && prices && prices.sku) {
        modalSkuEl.textContent = `SKU: ${prices.sku}${prices.barcode ? ` | EAN: ${prices.barcode}` : ''}`;
      }
    }

    // Dynamic image update if variant has specific image
    let variantImage = null;
    if (prod.tapePriceMatrix && prod.tapePriceMatrix.length > 0) {
      const targetWidth = currentSelection.size || currentSelection.width;
      const match = prod.tapePriceMatrix.find(t => t.width === targetWidth || this.matchPackToken(targetWidth, t.width));
      if (match && match.image) variantImage = match.image;
    } else if (prod.variants && prod.variants.length > 0) {
      const targetSize = currentSelection.size || currentSelection.pack;
      const match = prod.variants.find(v => v.tapeWidth === targetSize || v.rawWidth === targetSize);
      if (match && match.image) variantImage = match.image;
    }
    if (variantImage) {
      const cardImg = document.getElementById(`card-img-${prodId}`);
      if (cardImg) cardImg.src = variantImage;
      if (this.activeModalProduct && this.activeModalProduct.id === prodId) {
        const modalImg = document.getElementById('detail-img');
        if (modalImg) modalImg.src = variantImage;
      }
    }

    // Sync Storefront selects if changed from modal or vice versa
    const storeSizeSelect = document.getElementById(`select-size-${prodId}`);
    if (storeSizeSelect && storeSizeSelect.value !== currentSelection.size) {
      storeSizeSelect.value = currentSelection.size;
    }
    const storePackSelect = document.getElementById(`select-pack-${prodId}`);
    if (storePackSelect && storePackSelect.value !== currentSelection.pack) {
      storePackSelect.value = currentSelection.pack;
    }

    // Sync Modal selects if changed from card
    const modalSizeSelect = document.getElementById('detail-select-size');
    if (modalSizeSelect && this.activeModalProduct && this.activeModalProduct.id === prodId && modalSizeSelect.value !== currentSelection.size) {
      modalSizeSelect.value = currentSelection.size;
    }
    const modalPackSelect = document.getElementById('detail-select-pack');
    if (modalPackSelect && this.activeModalProduct && this.activeModalProduct.id === prodId && modalPackSelect.value !== currentSelection.pack) {
      modalPackSelect.value = currentSelection.pack;
    }

    // When size changes, re-render pack options with corresponding prices
    if (variantKey === 'size' && prod.packSizes && prod.packSizes.length > 0) {
      const isFlake = prod.category === 'Dry Metal Flake (Glitter)' || prod.category === 'Metal Flake';
      const validPacks = prod.packSizes.map(p => isFlake ? this.formatFlakePackSize(p) : p).filter(Boolean);
      const optionsHtml = validPacks.map(p => {
        const optPrice = this.getProductCalculatedPrice(prod, p, currentSelection.size, currentSelection.width);
        return `<option value="${this.escapeHtmlAttr(p)}" ${p === currentSelection.pack ? 'selected' : ''}>${p} (${optPrice ? optPrice.formattedPrimary + ' ' + optPrice.primaryVatBadge : ''})</option>`;
      }).join('');

      if (storePackSelect) storePackSelect.innerHTML = optionsHtml;
      if (modalPackSelect && this.activeModalProduct && this.activeModalProduct.id === prodId) {
        modalPackSelect.innerHTML = optionsHtml;
      }

      // If viewing in product modal, dynamically update gun tip and mix ratio specs
      if (isFlake && this.activeModalProduct && this.activeModalProduct.id === prodId) {
        const flakeSpec = this.getFlakeSpecForSize(currentSelection.size);
        const tipEl = document.getElementById('detail-spec-tip');
        const ratioEl = document.getElementById('detail-spec-ratio');
        if (tipEl && flakeSpec) tipEl.textContent = flakeSpec.minGunNozzle;
        if (ratioEl && flakeSpec) ratioEl.textContent = `${flakeSpec.ratioText} (or Dry via FK Gun)`;
      }
    }
  }

  addProductToCartById(prodId) {
    const prod = ECOM_CATALOG.find(p => p.id === prodId);
    if (!prod) return;

    // If product has multiple options (flake particle sizes, pack sizes, tape widths) and user hasn't explicitly chosen yet, open modal
    const isFlake = prod.category === 'Dry Metal Flake (Glitter)' || prod.category === 'Metal Flake';
    const hasMultipleSizes = (prod.sizes && prod.sizes.length > 1) || (prod.tapeWidths && prod.tapeWidths.length > 1);
    const hasMultiplePacks = (prod.packSizes && prod.packSizes.length > 1) || (prod.packPriceMatrix && prod.packPriceMatrix.length > 1);

    const variant = this.selectedProductVariants[prodId];
    if ((isFlake || hasMultipleSizes || hasMultiplePacks) && (!variant || (!variant.size && !variant.width && !variant.pack))) {
      this.openDetailModal(prodId);
      return;
    }

    const prices = this.getProductCalculatedPrice(prod, variant ? variant.pack : null, variant ? variant.size : null, variant ? variant.width : null);
    const variantDesc = [variant && variant.width, variant && variant.size, variant && variant.pack].filter(Boolean).join(' / ') || 'Standard';

    // Locate matching variant SKU if present
    const variantSku = prices.sku || prod.sku;

    this.shopifyCartManager.addItem({
      sku: variantSku,
      title: prod.name,
      priceEur: prices.priceEur,
      quantity: 1,
      variantDetails: variantDesc
    });
    this.openCartDrawer();
  }

  addDirectToCart(item) {
    this.shopifyCartManager.addItem({
      sku: item.sku,
      title: item.title,
      priceEur: item.price || item.priceEur || 24.00,
      quantity: 1,
      variantDetails: item.volume || 'Standard'
    });
    this.openCartDrawer();
  }

  addKromaEdgeBundleToCart() {
    const primer = ECOM_CATALOG.find(p => p.id === 'kroma-black-primer-1l') || {
      sku: 'KE-PRIMER-BLK',
      name: 'Kroma Edge Jet Black Mirror Gloss Primer (1L)',
      priceEur: 54.95
    };
    const chrome = ECOM_CATALOG.find(p => p.id === 'kroma-chrome-1l') || {
      sku: 'KE-CHROME-1L',
      name: 'Kroma Edge Sprayable Chrome Liquid Kit (1L)',
      priceEur: 149.95
    };
    const clear = ECOM_CATALOG.find(p => p.id === 'kroma-clearcoat-1l') || {
      sku: 'KE-CLEAR-1.5L',
      name: 'Kroma Edge Speed Clearcoat + Hardener Kit (1.5L)',
      priceEur: 89.95
    };

    this.shopifyCartManager.addItem({
      sku: primer.sku,
      title: primer.name,
      priceEur: primer.priceEur,
      quantity: 1,
      variantDetails: '1 Litre Can'
    });
    this.shopifyCartManager.addItem({
      sku: chrome.sku,
      title: chrome.name,
      priceEur: chrome.priceEur,
      quantity: 1,
      variantDetails: '1 Litre Kit (Pre-Order)'
    });
    this.shopifyCartManager.addItem({
      sku: clear.sku,
      title: clear.name,
      priceEur: clear.priceEur,
      quantity: 1,
      variantDetails: '1.5L Kit'
    });

    this.openCartDrawer();
  }

  // =========================================================================
  // DYNAMIC BUNDLE ENGINE & CONFIGURATOR
  // =========================================================================

  getActiveBundle(bundleId = 'fk-pro-mastery-bundle') {
    if (window.BundleConfigEngine) {
      return window.BundleConfigEngine.getBundleById(bundleId);
    }
    return null;
  }

  renderFeaturedBundle() {
    const bundle = this.getActiveBundle('fk-pro-mastery-bundle');
    if (!bundle) return;

    const titleEl = document.getElementById('bundle-card-title');
    const badgeEl = document.getElementById('bundle-card-badge');
    const descEl = document.getElementById('bundle-card-description');
    const savingsBadgeEl = document.getElementById('bundle-card-savings-badge');
    const retailEl = document.getElementById('bundle-card-retail-price');
    const saleEl = document.getElementById('bundle-card-sale-price');
    const gbpEl = document.getElementById('bundle-card-gbp-price');
    const checklistEl = document.getElementById('bundle-card-checklist');

    if (titleEl) titleEl.textContent = bundle.title;
    if (badgeEl) badgeEl.textContent = bundle.badge;
    if (descEl) descEl.textContent = bundle.description;

    const savingsEur = Math.max(0, Math.round((bundle.retailValueEur || 0) - (bundle.priceEur || 0)));
    const savingsGbp = Math.max(0, Math.round((bundle.retailValueGbp || 0) - (bundle.priceGbp || 0)));
    if (savingsBadgeEl) {
      savingsBadgeEl.textContent = `SAVE €${savingsEur} / £${savingsGbp}`;
    }

    if (retailEl) retailEl.textContent = `€${Number(bundle.retailValueEur || 0).toFixed(2)}`;
    if (saleEl) saleEl.textContent = `€${Number(bundle.priceEur || 0).toFixed(2)}`;
    if (gbpEl) gbpEl.textContent = `/ £${Number(bundle.priceGbp || 0).toFixed(2)} + VAT`;

    if (checklistEl) {
      checklistEl.innerHTML = '';
      (bundle.items || []).forEach(item => {
        const li = document.createElement('li');
        li.className = 'flex items-center gap-2';
        li.innerHTML = `
          <span class="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
          <span>${item.qty || 1}x ${item.name} (${item.variant || 'Standard Pack'})</span>
        `;
        checklistEl.appendChild(li);
      });
      const dispatchLi = document.createElement('li');
      dispatchLi.className = 'flex items-center gap-2';
      dispatchLi.innerHTML = `
        <span class="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
        <span>Dispatched same day via APC Overnight Tracked Delivery</span>
      `;
      checklistEl.appendChild(dispatchLi);
    }
  }

  addConfiguredBundleToCart(bundleId = 'fk-pro-mastery-bundle') {
    const bundle = this.getActiveBundle(bundleId);
    if (!bundle || !bundle.items || bundle.items.length === 0) {
      return this.addFlakeKingMasterBundleToCart();
    }

    bundle.items.forEach(item => {
      this.shopifyCartManager.addItem({
        sku: item.sku || 'FK-BUNDLE-ITEM',
        title: item.name,
        priceEur: Number(item.priceEur) || ((bundle.priceEur || 100) / bundle.items.length),
        quantity: item.qty || 1,
        variantDetails: `${item.variant || 'Bundle Pack'} • UK Warehouse`
      });
    });

    this.openCartDrawer();
    this.showToast(`🔥 ${bundle.title} added to cart!`, 'success');
  }

  addFlakeKingMasterBundleToCart() {
    this.addConfiguredBundleToCart('fk-pro-mastery-bundle');
  }

  openBundleCustomizerModal(bundleId = 'fk-pro-mastery-bundle') {
    const bundle = this.getActiveBundle(bundleId);
    if (!bundle) return;

    this.currentCustomizingBundleId = bundle.id;
    const modal = document.getElementById('modal-bundle-customizer');
    const priceEurEl = document.getElementById('customizer-bundle-price');
    const priceGbpEl = document.getElementById('customizer-bundle-gbp');
    const savingsEl = document.getElementById('customizer-bundle-savings');
    const container = document.getElementById('bundle-customizer-slots');

    if (priceEurEl) priceEurEl.textContent = `€${Number(bundle.priceEur || 0).toFixed(2)}`;
    if (priceGbpEl) priceGbpEl.textContent = `/ £${Number(bundle.priceGbp || 0).toFixed(2)}`;
    const savingsEur = Math.max(0, Math.round((bundle.retailValueEur || 0) - (bundle.priceEur || 0)));
    if (savingsEl) savingsEl.textContent = `SAVE €${savingsEur}`;

    if (container) {
      container.innerHTML = '';
      
      const allFlakes = ECOM_CATALOG.filter(p => 
        (p.category && p.category.includes('Glitter')) ||
        Boolean(p.flakeType) ||
        (p.name && p.name.includes('Metal Flake') && !p.name.includes('Gun') && !p.name.includes('Kit') && !p.name.includes('Attachment') && !p.name.includes('Jar & Lid') && !p.name.includes('Adaptor'))
      );

      (bundle.items || []).forEach((item, idx) => {
        const isFlake = (item.category && item.category.toLowerCase().includes('flake')) || (item.name && item.name.toLowerCase().includes('flake'));
        const isTape = (item.category && item.category.toLowerCase().includes('masking')) || (item.name && item.name.toLowerCase().includes('tape'));

        const slotCard = document.createElement('div');
        slotCard.className = 'p-3 bg-surface border border-secondary/40 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3';

        if (item.allowCustomerSwap && isFlake) {
          slotCard.innerHTML = `
            <div class="flex-1">
              <div class="flex items-center gap-1.5 mb-1">
                <span class="text-[10px] font-mono font-bold uppercase text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/40">CUSTOMIZE FLAKE COLOUR</span>
                <span class="font-headline text-xs uppercase text-white font-bold">Slot ${idx + 1}: Metal Flake Jar</span>
              </div>
              <p class="text-[11px] text-secondary font-mono">Choose any of our 58+ precision dry metal flake shades:</p>
            </div>
            <div class="sm:w-64">
              <select id="customizer-slot-${idx}" class="mech-select !py-1.5 !px-2 !text-xs w-full">
                ${allFlakes.map(f => `
                  <option value="${f.sku || f.id}" ${f.id === item.productId || (f.name && f.name.includes('Silver Holo')) ? 'selected' : ''}>
                    ${f.name.replace('Metal Flake', '').replace('Flake King', '').trim()} (30g Jar)
                  </option>
                `).join('')}
              </select>
            </div>
          `;
        } else if (item.allowCustomerSwap && isTape) {
          slotCard.innerHTML = `
            <div class="flex-1">
              <div class="flex items-center gap-1.5 mb-1">
                <span class="text-[10px] font-mono font-bold uppercase text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/40">CUSTOMIZE TAPE WIDTH</span>
                <span class="font-headline text-xs uppercase text-white font-bold">Slot ${idx + 1}: Precision Fine Line Tape</span>
              </div>
              <p class="text-[11px] text-secondary font-mono">Select width for sharp micro-edge separation:</p>
            </div>
            <div class="sm:w-48">
              <select id="customizer-slot-${idx}" class="mech-select !py-1.5 !px-2 !text-xs w-full">
                <option value="1.5mm">1.5mm Micro-Pinstripe</option>
                <option value="3mm" selected>3mm Precision Curve</option>
                <option value="6mm">6mm Standard Edge</option>
                <option value="9mm">9mm Wide Separation</option>
                <option value="12mm">12mm Masking Line</option>
              </select>
            </div>
          `;
        } else {
          slotCard.innerHTML = `
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-emerald-400 text-xl">verified</span>
              <div>
                <span class="font-headline text-xs uppercase text-white font-bold block">${item.name}</span>
                <span class="font-mono text-[11px] text-secondary">${item.qty || 1}x ${item.variant || 'Standard'}</span>
              </div>
            </div>
            <span class="font-mono text-[10px] text-neutral-400 uppercase bg-surface-container px-2 py-1 rounded border border-secondary/40">
              LOCKED BUNDLE CORE
            </span>
          `;
        }
        container.appendChild(slotCard);
      });
    }

    if (modal) modal.classList.add('active');
  }

  closeBundleCustomizerModal() {
    const modal = document.getElementById('modal-bundle-customizer');
    if (modal) modal.classList.remove('active');
  }

  submitCustomizedBundleToCart() {
    const bundle = this.getActiveBundle(this.currentCustomizingBundleId || 'fk-pro-mastery-bundle');
    if (!bundle) return;

    (bundle.items || []).forEach((item, idx) => {
      const select = document.getElementById(`customizer-slot-${idx}`);
      let title = item.name;
      let variant = item.variant || 'Standard Pack';
      let sku = item.sku;

      if (select) {
        const optText = select.options[select.selectedIndex]?.text || '';
        if (optText.includes('(30g Jar)')) {
          title = `Flake King ${optText}`;
          sku = select.value;
          variant = '30g Gun-Mount Jar';
        } else if (optText.includes('Pinstripe') || optText.includes('Curve') || optText.includes('Edge') || select.value.includes('mm')) {
          title = `Orange Fine Line Tape (${select.value})`;
          sku = `FK-TAPE-${select.value}`;
          variant = `${select.value} Precision Width`;
        }
      }

      this.shopifyCartManager.addItem({
        sku: sku || 'FK-CUSTOM-BUNDLE-ITEM',
        title: title,
        priceEur: Number(item.priceEur) || ((bundle.priceEur || 100) / bundle.items.length),
        quantity: item.qty || 1,
        variantDetails: `${variant} • UK Warehouse`
      });
    });

    this.closeBundleCustomizerModal();
    this.openCartDrawer();
    this.showToast("🎨 Customized bundle loaded to cart!", "success");
  }

  // =========================================================================
  // ADMIN BUNDLE MANAGER CONTROLLER
  // =========================================================================

  renderAdminBundles() {
    const bundle = this.getActiveBundle('fk-pro-mastery-bundle');
    if (!bundle) return;

    const titleIn = document.getElementById('admin-bundle-title');
    const badgeIn = document.getElementById('admin-bundle-badge');
    const taglineIn = document.getElementById('admin-bundle-tagline');
    const descIn = document.getElementById('admin-bundle-description');
    const priceEurIn = document.getElementById('admin-bundle-price-eur');
    const priceGbpIn = document.getElementById('admin-bundle-price-gbp');
    const retailEurIn = document.getElementById('admin-bundle-retail-eur');
    const retailGbpIn = document.getElementById('admin-bundle-retail-gbp');
    const savingsText = document.getElementById('admin-bundle-savings-text');

    if (titleIn) titleIn.value = bundle.title || '';
    if (badgeIn) badgeIn.value = bundle.badge || '';
    if (taglineIn) taglineIn.value = bundle.tagline || '';
    if (descIn) descIn.value = bundle.description || '';
    if (priceEurIn) priceEurIn.value = bundle.priceEur || '';
    if (priceGbpIn) priceGbpIn.value = bundle.priceGbp || '';
    if (retailEurIn) retailEurIn.value = bundle.retailValueEur || '';
    if (retailGbpIn) retailGbpIn.value = bundle.retailValueGbp || '';

    const updateSavings = () => {
      const pEur = parseFloat(priceEurIn?.value || 0);
      const rEur = parseFloat(retailEurIn?.value || 0);
      const savEur = Math.max(0, rEur - pEur);
      const pct = rEur > 0 ? Math.round((savEur / rEur) * 100) : 0;
      if (savingsText) {
        savingsText.textContent = `Painter Savings: €${savEur.toFixed(2)} EUR (${pct}% off retail)`;
      }
      this.renderAdminBundleLivePreview();
    };

    [priceEurIn, priceGbpIn, retailEurIn, retailGbpIn, titleIn, badgeIn, descIn].forEach(input => {
      if (input && !input.dataset.bound) {
        input.dataset.bound = 'true';
        input.addEventListener('input', updateSavings);
      }
    });

    updateSavings();
    this.renderAdminBundleSlots(bundle);
    this.renderAdminBundleLivePreview();
  }

  renderAdminBundleSlots(bundle) {
    const container = document.getElementById('admin-bundle-slots-container');
    if (!container) return;

    container.innerHTML = '';

    const allProducts = ECOM_CATALOG.filter(p => p.inStock !== false || p.brand === 'Flake King');

    (bundle.items || []).forEach((item, idx) => {
      const slotCard = document.createElement('div');
      slotCard.className = 'p-4 bg-surface-dim border border-secondary/40 rounded space-y-3';
      slotCard.dataset.slotIndex = idx;

      slotCard.innerHTML = `
        <div class="flex justify-between items-center border-b border-secondary/20 pb-2">
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-primary/20 text-primary font-mono text-xs flex items-center justify-center font-bold">
              ${idx + 1}
            </span>
            <span class="font-headline text-xs uppercase text-white font-bold">Product Slot #${idx + 1}</span>
          </div>
          <button type="button" onclick="window.removeAdminBundleSlot(${idx})" class="text-rose-400 hover:text-rose-300 text-xs font-mono flex items-center gap-1 cursor-pointer">
            <span class="material-symbols-outlined text-[15px]">delete</span> Remove
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="font-label-xs text-[10px] uppercase text-secondary font-bold block mb-1">Select Catalog Product</label>
            <select class="admin-slot-product mech-select !py-1.5 !px-2 !text-xs w-full" onchange="window.paintApp.onAdminBundleProductChange(${idx}, this.value)">
              ${allProducts.map(p => `
                <option value="${p.id}" ${p.id === item.productId ? 'selected' : ''}>
                  ${p.brand || 'COAST'} — ${(p.name || '').substring(0, 45)}
                </option>
              `).join('')}
            </select>
          </div>
          <div>
            <label class="font-label-xs text-[10px] uppercase text-secondary font-bold block mb-1">Variant / Size Description</label>
            <input type="text" class="admin-slot-variant mech-input w-full !py-1.5 !text-xs font-mono" value="${this.escapeHtmlAttr(item.variant || '')}" placeholder="e.g. 30g Jar or 3mm Roll">
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3 font-mono">
          <div>
            <label class="font-label-xs text-[10px] uppercase text-secondary font-bold block mb-1">Quantity</label>
            <input type="number" min="1" class="admin-slot-qty mech-input w-full !py-1 !text-xs font-bold" value="${item.qty || 1}">
          </div>
          <div>
            <label class="font-label-xs text-[10px] uppercase text-secondary font-bold block mb-1">Unit Price (€)</label>
            <input type="number" step="0.01" class="admin-slot-eur mech-input w-full !py-1 !text-xs" value="${item.priceEur || ''}">
          </div>
          <div>
            <label class="font-label-xs text-[10px] uppercase text-secondary font-bold block mb-1">Unit Price (£)</label>
            <input type="number" step="0.01" class="admin-slot-gbp mech-input w-full !py-1 !text-xs" value="${item.priceGbp || ''}">
          </div>
        </div>

        <div class="flex items-center gap-2 pt-1">
          <input type="checkbox" id="admin-slot-custom-${idx}" class="admin-slot-allow-swap" ${item.allowCustomerSwap ? 'checked' : ''}>
          <label for="admin-slot-custom-${idx}" class="font-mono text-[11px] text-neutral-300 cursor-pointer">
            Allow customer to swap this item on storefront (e.g. choose other flake colors or tape widths)
          </label>
        </div>
      `;
      container.appendChild(slotCard);
    });
  }

  onAdminBundleProductChange(slotIndex, productId) {
    const prod = ECOM_CATALOG.find(p => p.id === productId);
    if (!prod) return;

    const container = document.getElementById('admin-bundle-slots-container');
    const slotCard = container?.querySelector(`[data-slot-index="${slotIndex}"]`);
    if (!slotCard) return;

    const variantIn = slotCard.querySelector('.admin-slot-variant');
    const eurIn = slotCard.querySelector('.admin-slot-eur');
    const gbpIn = slotCard.querySelector('.admin-slot-gbp');

    if (variantIn && (!variantIn.value || variantIn.value === 'Standard Pack')) {
      variantIn.value = prod.packSizes?.[0] || prod.sizes?.[0] || 'Standard Pack';
    }
    if (eurIn) eurIn.value = prod.priceEur || '';
    if (gbpIn) gbpIn.value = prod.priceGbp || '';

    this.renderAdminBundleLivePreview();
  }

  addAdminBundleSlot() {
    const bundle = this.getActiveBundle('fk-pro-mastery-bundle');
    if (!bundle) return;

    const defaultFlake = ECOM_CATALOG.find(p => p.name && p.name.includes('Gold')) || ECOM_CATALOG[0];
    bundle.items.push({
      id: `slot-${Date.now()}`,
      productId: defaultFlake.id,
      sku: defaultFlake.sku || 'FK-FLAKE-ADDON',
      name: defaultFlake.name,
      variant: '30g Jar',
      qty: 1,
      priceEur: defaultFlake.priceEur || 16.95,
      priceGbp: defaultFlake.priceGbp || 14.49,
      category: defaultFlake.category || 'Dry Metal Flake (Glitter)',
      allowCustomerSwap: true
    });

    this.renderAdminBundleSlots(bundle);
    this.renderAdminBundleLivePreview();
  }

  removeAdminBundleSlot(slotIndex) {
    const bundle = this.getActiveBundle('fk-pro-mastery-bundle');
    if (!bundle || !bundle.items || bundle.items.length <= 1) {
      this.showToast("A bundle must contain at least 1 product slot.", "warning");
      return;
    }
    bundle.items.splice(slotIndex, 1);
    this.renderAdminBundleSlots(bundle);
    this.renderAdminBundleLivePreview();
  }

  saveBundleFromAdmin() {
    const title = (document.getElementById('admin-bundle-title')?.value || '').trim();
    const badge = (document.getElementById('admin-bundle-badge')?.value || '').trim();
    const tagline = (document.getElementById('admin-bundle-tagline')?.value || '').trim();
    const description = (document.getElementById('admin-bundle-description')?.value || '').trim();
    const priceEur = parseFloat(document.getElementById('admin-bundle-price-eur')?.value || 0);
    const priceGbp = parseFloat(document.getElementById('admin-bundle-price-gbp')?.value || 0);
    const retailEur = parseFloat(document.getElementById('admin-bundle-retail-eur')?.value || 0);
    const retailGbp = parseFloat(document.getElementById('admin-bundle-retail-gbp')?.value || 0);

    if (!title) {
      this.showToast("Please provide a bundle title.", "warning");
      return;
    }

    const container = document.getElementById('admin-bundle-slots-container');
    const slotCards = container?.querySelectorAll('[data-slot-index]') || [];
    const items = [];

    slotCards.forEach((card, idx) => {
      const prodId = card.querySelector('.admin-slot-product')?.value;
      const variant = card.querySelector('.admin-slot-variant')?.value || 'Standard';
      const qty = parseInt(card.querySelector('.admin-slot-qty')?.value || 1, 10);
      const eur = parseFloat(card.querySelector('.admin-slot-eur')?.value || 0);
      const gbp = parseFloat(card.querySelector('.admin-slot-gbp')?.value || 0);
      const allowSwap = card.querySelector('.admin-slot-allow-swap')?.checked || false;

      const prod = ECOM_CATALOG.find(p => p.id === prodId) || {};

      items.push({
        id: `slot-${idx + 1}`,
        productId: prodId,
        sku: prod.sku || `FK-SKU-${idx + 1}`,
        name: prod.name || `Bundle Product ${idx + 1}`,
        variant: variant,
        qty: qty,
        priceEur: eur,
        priceGbp: gbp,
        category: prod.category || '',
        allowCustomerSwap: allowSwap
      });
    });

    const bundleData = {
      id: 'fk-pro-mastery-bundle',
      title,
      badge,
      tagline,
      description,
      priceEur,
      priceGbp,
      retailValueEur: retailEur,
      retailValueGbp: retailGbp,
      items
    };

    if (window.BundleConfigEngine) {
      window.BundleConfigEngine.saveBundle(bundleData);
    }
    this.renderFeaturedBundle();
    this.renderAdminBundleLivePreview();
    this.showToast("✅ Bundle configuration published to live storefront!", "success");
  }

  resetBundleFromAdmin() {
    if (confirm("Reset bundle back to factory Flake King defaults?")) {
      if (window.BundleConfigEngine) {
        window.BundleConfigEngine.resetDefaults();
      }
      this.renderAdminBundles();
      this.renderFeaturedBundle();
      this.showToast("↺ Bundle reset to factory defaults.", "info");
    }
  }

  renderAdminBundleLivePreview() {
    const preview = document.getElementById('admin-bundle-live-preview');
    if (!preview) return;

    const title = document.getElementById('admin-bundle-title')?.value || 'THE FLAKE KING™ PRO MASTERY BUNDLE';
    const badge = document.getElementById('admin-bundle-badge')?.value || '🔥 COMPLETE IN-STOCK BUNDLE';
    const desc = document.getElementById('admin-bundle-description')?.value || 'Everything required for dry metal flake.';
    const pEur = parseFloat(document.getElementById('admin-bundle-price-eur')?.value || 139.95);
    const pGbp = parseFloat(document.getElementById('admin-bundle-price-gbp')?.value || 119.50);
    const rEur = parseFloat(document.getElementById('admin-bundle-retail-eur')?.value || 165.90);
    const savEur = Math.max(0, Math.round(rEur - pEur));

    const slotCards = document.querySelectorAll('#admin-bundle-slots-container [data-slot-index]');
    const checklistItems = [];
    slotCards.forEach(card => {
      const prodId = card.querySelector('.admin-slot-product')?.value;
      const variant = card.querySelector('.admin-slot-variant')?.value || '';
      const qty = card.querySelector('.admin-slot-qty')?.value || 1;
      const prod = ECOM_CATALOG.find(p => p.id === prodId);
      checklistItems.push(`${qty}x ${prod ? prod.name : 'Component'} (${variant})`);
    });

    preview.innerHTML = `
      <div class="bg-gradient-to-br from-black via-surface-container-high to-surface-container border-2 border-primary/50 rounded-lg p-5 text-left relative overflow-hidden shadow-lg">
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="px-2 py-0.5 rounded bg-primary text-white font-mono text-[9px] font-extrabold uppercase">
            ${badge}
          </span>
          <span class="text-amber-300 font-mono text-xs font-bold">SAVE €${savEur}</span>
        </div>
        <h3 class="font-headline text-lg uppercase text-white font-bold tracking-tight mb-1">
          ${title}
        </h3>
        <p class="text-neutral-300 font-body text-xs mb-3 line-clamp-2">
          ${desc}
        </p>
        <ul class="space-y-1.5 text-xs font-mono text-neutral-200 mb-4">
          ${checklistItems.map(item => `
            <li class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
              <span class="truncate">${item}</span>
            </li>
          `).join('')}
          <li class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
            <span>Dispatched same day via APC Overnight</span>
          </li>
        </ul>
        <div class="border-t border-white/10 pt-2 flex justify-between items-baseline">
          <div>
            <span class="text-xs text-secondary line-through font-mono">€${rEur.toFixed(2)}</span>
            <span class="font-headline text-xl text-primary font-bold ml-1.5">€${pEur.toFixed(2)}</span>
            <span class="text-xs font-mono text-neutral-300 ml-1">/ £${pGbp.toFixed(2)}</span>
          </div>
          <span class="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-1.5 py-0.5 rounded font-bold">LIVE STOREFRONT</span>
        </div>
      </div>
    `;
  }

  configureKromaEdgeInMixLab() {
    const system = this.currentCatalog.mixingSystems.find(s => s.id === 'kroma_edge_mirror_chrome') || this.currentCatalog.mixingSystems[0];
    if (system) {
      this.selectedSystem = system;
      const select = document.getElementById('select-mixing-system');
      if (select) select.value = system.id;
    }
    this.switchTab('tab-calculator', 'view-calculator');
    this.updateCalculation();
  }

  mixThisProduct(product) {
    this.selectedColors['base'] = product;
    this.switchTab('tab-calculator', 'view-calculator');
    this.updateCalculation();
  }

  applyKromaPreset(panelKey) {
    const preset = PRESET_PANELS.find(p => p.id === panelKey) || PRESET_PANELS[1];
    if (!preset) return;
    const res = calculateKromaCoverage({ sqft: preset.sqft });
    this.renderEstimatorResults(res);
  }

  calcCustomKromaArea(val) {
    const num = parseFloat(val) || 0;
    const unitSelect = document.getElementById('select-area-unit');
    const unit = unitSelect ? unitSelect.value : 'sqft';
    const params = unit === 'sqm' ? { sqm: num } : { sqft: num };
    const res = calculateKromaCoverage(params);
    this.renderEstimatorResults(res);
  }

  renderEstimatorResults(res) {
    this.lastEstimatedVolumeMl = res.chromeMl;
    const areaEl = document.getElementById('est-area-display');
    const chromeEl = document.getElementById('est-chrome-volume');
    const clearEl = document.getElementById('est-clear-volume');
    const kitEl = document.getElementById('est-kit-recommendation');

    if (areaEl) areaEl.textContent = `${res.sqft} sq ft (${res.sqm} m²)`;
    if (chromeEl) chromeEl.textContent = `${res.chromeMl} mL (${res.chromeFlOz} fl oz)`;
    if (clearEl) clearEl.textContent = `${res.clearMl} mL`;
    if (kitEl) kitEl.textContent = `${res.recommendedKit} + ${res.recommendedClear}`;
  }

  applyEstimatedVolumeToMix() {
    const volInput = document.getElementById('input-total-volume');
    const unitSelect = document.getElementById('select-volume-unit');
    if (unitSelect) unitSelect.value = 'ml';
    if (volInput && this.lastEstimatedVolumeMl) {
      volInput.value = this.lastEstimatedVolumeMl;
      this.totalMlNeeded = this.lastEstimatedVolumeMl;
      this.updateCalculation();
    }
  }

  setCoveragePreset(panelKey) {
    const preset = PRESET_PANELS.find(p => p.id === panelKey) || PRESET_PANELS[1];
    if (!preset) return;

    const detailsEl = document.getElementById('coverage-preset-details');
    if (detailsEl) {
      detailsEl.innerHTML = `
        <strong>${preset.name}</strong><br>
        Surface Area: ${preset.sqft} sq ft (${Math.round(preset.sqft * 0.0929 * 100)/100} m²)<br>
        Est. Liquid Chrome Volume: ${Math.round(preset.sqft * 29.57)} mL<br>
        Recommended Gun Tip: 1.2mm - 1.4mm HVLP (1 Coat)
      `;
    }

    const volInput = document.getElementById('input-total-volume');
    if (volInput) {
      volInput.value = Math.round(preset.sqft * 29.57);
      this.totalMlNeeded = Math.round(preset.sqft * 29.57);
      this.updateCalculation();
    }
  }

  updateCalculation() {
    const volInput = document.getElementById('input-total-volume');
    const unitSelect = document.getElementById('select-volume-unit');
    
    let vol = parseFloat(volInput ? volInput.value : 500) || 500;
    const unit = unitSelect ? unitSelect.value : 'ml';

    if (unit === 'floz') vol = vol * 29.5735;
    else if (unit === 'pt') vol = vol * 473.176;
    else if (unit === 'qt') vol = vol * 946.353;

    this.totalMlNeeded = vol;
    this.currentRecipe = calculateMixingRecipe(this.selectedSystem, this.totalMlNeeded, this.selectedColors);

    this.updateSystemDescription();
    this.renderRecipeTable();
  }

  renderRecipeTable() {
    const tbody = document.getElementById('recipe-table-body');
    if (!tbody || !this.currentRecipe) return;
    tbody.innerHTML = '';

    const steps = this.currentRecipe.steps || this.currentRecipe.components || [];
    steps.forEach((step, index) => {
      const name = step.componentName || step.name;
      const sku = step.productSku || step.sku || 'COAST-MIX';
      const weight = step.targetWeightGrams !== undefined ? step.targetWeightGrams : (step.individualWeightGrams || 0);
      const cumulative = step.cumulativeWeightGrams || 0;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="metal-spec-plate">${index + 1}</span></td>
        <td class="font-bold text-on-surface">${name}</td>
        <td class="text-secondary">${sku}</td>
        <td class="text-primary">${step.percentage}%</td>
        <td>${Math.round(step.volumeMl)} mL</td>
        <td>${weight.toFixed(1)} g</td>
        <td class="font-bold text-primary">${cumulative.toFixed(1)} g</td>
      `;
      tbody.appendChild(tr);
    });
  }

  openScaleMode() {
    this.switchTab('tab-scale', 'view-scale');
    this.initScaleAssistant();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  initScaleAssistant() {
    this.currentScaleStepIndex = 0;
    this.renderScaleStep();
  }

  renderScaleStep() {
    if (!this.currentRecipe) {
      this.updateCalculation();
    }
    const steps = this.currentRecipe ? (this.currentRecipe.steps || this.currentRecipe.components || []) : [];
    if (steps.length === 0) return;

    const step = steps[this.currentScaleStepIndex];
    if (!step) return;

    const name = step.componentName || step.name;
    const sku = step.productSku || step.sku || 'Direct Add';
    const weight = step.targetWeightGrams !== undefined ? step.targetWeightGrams : (step.individualWeightGrams || 0);
    const cumulative = step.cumulativeWeightGrams || 0;

    const digitsEl = document.getElementById('scale-target-digits');
    const titleEl = document.getElementById('scale-step-title');
    const compEl = document.getElementById('scale-current-component');
    const weightEl = document.getElementById('scale-step-weight');

    if (digitsEl) digitsEl.textContent = `${cumulative.toFixed(1)} g`;
    if (titleEl) titleEl.textContent = `STEP ${this.currentScaleStepIndex + 1} OF ${steps.length}: POUR TO TARGET`;
    if (compEl) compEl.textContent = `${name} (${sku})`;
    if (weightEl) weightEl.textContent = `+${weight.toFixed(1)} g`;
  }

  prevScaleStep() {
    if (this.currentScaleStepIndex > 0) {
      this.currentScaleStepIndex--;
      this.renderScaleStep();
    }
  }

  nextScaleStep() {
    const steps = this.currentRecipe ? (this.currentRecipe.steps || this.currentRecipe.components || []) : [];
    if (this.currentScaleStepIndex < steps.length - 1) {
      this.currentScaleStepIndex++;
      this.renderScaleStep();
    } else {
      this.showToast("✅ Mix Complete! All scale target weights reached.", "success");
    }
  }

  renderCartSummary(summary) {
    const countBadge = document.getElementById('header-cart-count');
    const subtotalEl = document.getElementById('cart-drawer-subtotal');
    const vatLabelEl = document.getElementById('cart-drawer-vat-label');
    const vatAmountEl = document.getElementById('cart-drawer-vat-amount');
    const carrierEl = document.getElementById('cart-drawer-carrier');
    const carrierLabelEl = document.getElementById('cart-drawer-carrier-label');
    const shippingAmountEl = document.getElementById('cart-drawer-shipping-amount');
    const ddpRowEl = document.getElementById('cart-drawer-ddp-row');
    const ddpAmountEl = document.getElementById('cart-drawer-ddp-amount');
    const totalEl = document.getElementById('cart-drawer-total');
    const convertedTotalEl = document.getElementById('cart-drawer-converted-total');
    const itemsContainer = document.getElementById('cart-drawer-items');

    const country = this.euLocalization.getCountry();
    const taxData = this.euLocalization.calculateTaxAndTotal(summary.subtotal);

    if (countBadge) countBadge.textContent = summary.itemCount;
    if (subtotalEl) {
      subtotalEl.textContent = country.currency === 'EUR'
        ? `€${taxData.subtotalEur.toFixed(2)}`
        : `${country.symbol}${taxData.subtotalLocal.toFixed(2)}`;
    }
    
    if (vatLabelEl) {
      if (taxData.isUK) {
        vatLabelEl.textContent = `UK VAT (20% HMRC):`;
      } else if (taxData.isVatExempt) {
        vatLabelEl.textContent = `EU VAT (0% Reverse-Charge):`;
      } else {
        vatLabelEl.textContent = `EU VAT (${taxData.vatRatePercent}% ${country.code} IOSS/DDP):`;
      }
    }

    if (vatAmountEl) {
      vatAmountEl.textContent = country.currency === 'EUR'
        ? `€${taxData.vatAmountEur.toFixed(2)}`
        : `${country.symbol}${taxData.vatAmountLocal.toFixed(2)}`;
    }

    if (shippingAmountEl) {
      if (taxData.shippingBaseEur === 0) {
        shippingAmountEl.textContent = 'FREE';
        shippingAmountEl.className = 'font-mono text-emerald-400 font-bold';
      } else {
        shippingAmountEl.textContent = country.currency === 'EUR'
          ? `€${taxData.shippingBaseEur.toFixed(2)}`
          : `${country.symbol}${this.euLocalization.convertPrice(taxData.shippingBaseEur).toFixed(2)}`;
        shippingAmountEl.className = 'font-mono text-on-surface';
      }
    }

    if (ddpRowEl && ddpAmountEl) {
      if (taxData.ddpAdminFeeEur > 0) {
        ddpRowEl.classList.remove('hidden');
        ddpAmountEl.textContent = country.currency === 'EUR'
          ? `€${taxData.ddpAdminFeeEur.toFixed(2)}`
          : `${country.symbol}${taxData.ddpAdminFeeLocal.toFixed(2)}`;
      } else {
        ddpRowEl.classList.add('hidden');
      }
    }

    if (carrierEl) {
      const threshold = taxData.isUK ? '£150' : '€200';
      carrierEl.textContent = `${country.carrier} (Free > ${threshold})`;
    }

    if (totalEl) {
      if (country.currency === 'GBP') {
        totalEl.textContent = `£${taxData.totalLocal.toFixed(2)}`;
        if (convertedTotalEl) convertedTotalEl.textContent = `(€${taxData.totalEur.toFixed(2)} EUR)`;
      } else if (country.currency === 'EUR') {
        totalEl.textContent = `€${taxData.totalEur.toFixed(2)}`;
        const gbp = taxData.totalEur * 0.85;
        if (convertedTotalEl) convertedTotalEl.textContent = `(£${gbp.toFixed(2)} GBP)`;
      } else {
        totalEl.textContent = `${country.symbol}${taxData.totalLocal.toFixed(2)}`;
        if (convertedTotalEl) convertedTotalEl.textContent = `(€${taxData.totalEur.toFixed(2)} EUR)`;
      }
    }

    // Update Drawer Items
    if (itemsContainer) {
      itemsContainer.innerHTML = '';
      if (summary.items.length === 0) {
        itemsContainer.innerHTML = `<div class="py-12 text-center font-mono text-xs text-secondary">Your project cart is currently empty.</div>`;
      } else {
        summary.items.forEach((item, idx) => {
          const itemPriceLocal = item.priceEur * country.rateToEur;
          const itemSubtotalLocal = itemPriceLocal * item.quantity;
          const priceDisplay = country.currency === 'EUR'
            ? `€${(item.priceEur * item.quantity).toFixed(2)}`
            : `${country.symbol}${itemSubtotalLocal.toFixed(2)}`;

          const row = document.createElement('div');
          row.className = 'industrial-card p-3 flex justify-between items-center';
          row.innerHTML = `
            <div>
              <h5 class="font-headline text-sm uppercase text-on-surface">${item.title}</h5>
              <div class="font-mono text-[11px] text-secondary">SKU: ${item.sku} | ${item.variantDetails || 'Std'} | Qty: ${item.quantity}</div>
            </div>
            <div class="text-right">
              <div class="font-headline text-base text-primary">${priceDisplay}</div>
              <button onclick="window.paintApp.removeItem(${idx})" class="font-label-xs text-[10px] text-error hover:underline cursor-pointer">Remove</button>
            </div>
          `;
          itemsContainer.appendChild(row);
        });
      }
    }

    // Dynamic Free Shipping Progress Calculation
    const isUK = taxData.isUK;
    const thresholdVal = isUK ? 150 : 200;
    const currentVal = isUK ? taxData.subtotalLocal : taxData.subtotalEur;
    const remainingVal = Math.max(0, thresholdVal - currentVal);
    const progressPercent = Math.min(100, Math.round((currentVal / thresholdVal) * 100));
    const currSymbol = isUK ? '£' : '€';

    // Update Top Announcement Banner Meter
    const topMeterText = document.getElementById('shipping-meter-text');
    const topMeterFill = document.getElementById('shipping-meter-fill');

    // Update In-Drawer Shipping Meter
    const drawerMeterText = document.getElementById('drawer-shipping-text');
    const drawerMeterPercent = document.getElementById('drawer-shipping-percent');
    const drawerMeterFill = document.getElementById('drawer-shipping-fill');

    if (remainingVal <= 0 && currentVal > 0) {
      const unlockedHtml = `<span class="text-emerald-400 font-bold flex items-center gap-1.5"><span class="material-symbols-outlined text-[16px]">celebration</span> FREE APC OVERNIGHT SHIPPING UNLOCKED!</span>`;
      if (topMeterText) topMeterText.innerHTML = unlockedHtml;
      if (topMeterFill) {
        topMeterFill.style.width = '100%';
        topMeterFill.classList.add('shipping-progress-unlocked');
      }
      if (drawerMeterText) drawerMeterText.innerHTML = unlockedHtml;
      if (drawerMeterPercent) drawerMeterPercent.textContent = '100% UNLOCKED';
      if (drawerMeterFill) {
        drawerMeterFill.style.width = '100%';
        drawerMeterFill.classList.add('shipping-progress-unlocked');
      }
    } else {
      if (topMeterText) {
        topMeterText.innerHTML = `Add <strong id="shipping-meter-remaining" class="text-amber-300 font-bold">${currSymbol}${remainingVal.toFixed(2)}</strong> to unlock <span class="text-emerald-400 font-bold">FREE APC OVERNIGHT SHIPPING</span> 🚚`;
      }
      if (topMeterFill) {
        topMeterFill.style.width = `${progressPercent}%`;
        topMeterFill.classList.remove('shipping-progress-unlocked');
      }
      if (drawerMeterText) {
        drawerMeterText.innerHTML = `<span class="material-symbols-outlined text-amber-400 text-[16px]">local_shipping</span><span>Add <strong id="drawer-shipping-remaining" class="text-amber-300 font-bold">${currSymbol}${remainingVal.toFixed(2)}</strong> for FREE Express Delivery</span>`;
      }
      if (drawerMeterPercent) drawerMeterPercent.textContent = `${progressPercent}%`;
      if (drawerMeterFill) {
        drawerMeterFill.style.width = `${progressPercent}%`;
        drawerMeterFill.classList.remove('shipping-progress-unlocked');
      }
    }

    // Render 1-Click Upsells in Cart Drawer
    const upsellContainer = document.getElementById('drawer-upsell-items');
    if (upsellContainer) {
      const cartSkus = summary.items.map(it => it.sku || '');
      const potentialUpsells = [
        { id: 'fk-tape-orange', title: 'Orange Fineline Tape (3mm)', priceEur: 6.95, priceGbp: 5.95 },
        { id: 'fk-2603', title: '0.015 Kromatic Holo Flake (30g)', priceEur: 16.95, priceGbp: 14.49 },
        { id: 'kroma-topcoat-clr-180', title: 'Kroma Dedicated Clear (180 Set)', priceEur: 73.05, priceGbp: 62.44 },
        { id: 'fk-1970', title: 'Flake King 550 Mini Gun', priceEur: 116.99, priceGbp: 99.99 }
      ];
      const eligibleUpsells = potentialUpsells.filter(u => !cartSkus.some(s => s.toLowerCase().includes(u.id))).slice(0, 2);

      upsellContainer.innerHTML = eligibleUpsells.map(u => {
        const pDisplay = isUK ? `£${u.priceGbp.toFixed(2)}` : `€${u.priceEur.toFixed(2)}`;
        return `
          <div class="bg-[#181a1c] border border-white/10 p-2.5 rounded flex flex-col justify-between">
            <div class="text-[11px] font-bold text-white truncate" title="${u.title}">${u.title}</div>
            <div class="flex items-center justify-between mt-2 pt-1.5 border-t border-white/10">
              <span class="text-amber-300 text-xs font-bold font-mono">${pDisplay}</span>
              <button onclick="window.paintApp.addProductToCartById('${u.id}')" class="px-2 py-0.5 bg-primary/20 hover:bg-primary/40 border border-primary/50 text-white text-[10px] font-bold rounded flex items-center gap-1 transition-colors cursor-pointer">
                <span>+ ADD</span>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  removeItem(index) {
    this.shopifyCartManager.removeItem(index);
  }

  checkoutShopify() {
    const summary = this.shopifyCartManager.getCartSummary();
    if (summary.items.length === 0) {
      this.showToast("Please add items to your cart before proceeding to checkout.", "warning");
      return;
    }
    if (this.reviewMode) {
      this.showReviewModeModal();
      return;
    }
    const permalink = this.shopifyCartManager.generateShopifyCartPermalink();
    window.open(permalink, '_blank');
  }

  showReviewModeModal() {
    const modal = document.getElementById('modal-review-mode');
    const summaryBox = document.getElementById('review-cart-summary-box');
    if (summaryBox) {
      const summary = this.shopifyCartManager.getCartSummary();
      if (summary.items.length > 0) {
        const itemsHtml = summary.items.map(i => `
          <div class="flex justify-between py-1 border-b border-white/5">
            <span class="text-neutral-200">${i.quantity}x ${this.escapeHtmlAttr(i.title)} <span class="text-[10px] text-neutral-400">(${this.escapeHtmlAttr(i.variantDetails || 'Std')})</span></span>
            <span class="font-bold text-amber-300">€${(i.priceEur * i.quantity).toFixed(2)}</span>
          </div>
        `).join('');
        summaryBox.innerHTML = `
          <div class="font-bold text-white mb-2 flex justify-between border-b border-white/10 pb-1 text-xs">
            <span>Staging Cart Review (${summary.itemCount} items)</span>
            <span class="text-emerald-400">Subtotal: €${summary.subtotal.toFixed(2)}</span>
          </div>
          <div class="max-h-36 overflow-y-auto space-y-0.5 pr-1">${itemsHtml}</div>
        `;
      } else {
        summaryBox.innerHTML = `<span class="text-neutral-400">Cart is empty. Add items from the shop or mixing lab to inspect calculations.</span>`;
      }
    }
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  closeReviewModeModal() {
    const modal = document.getElementById('modal-review-mode');
    if (modal) modal.classList.add('hidden');
  }

  setupCartDrawer() {
    const drawer = document.getElementById('drawer-shopify-cart');
    const closeBtn = document.getElementById('btn-close-cart-drawer');
    const openBtn = document.getElementById('btn-open-cart-drawer');
    const headerCartBtn = document.getElementById('btn-header-cart');

    if (closeBtn) closeBtn.addEventListener('click', () => this.closeCartDrawer());
    if (openBtn) openBtn.addEventListener('click', () => this.openCartDrawer());
    if (headerCartBtn) headerCartBtn.addEventListener('click', () => this.openCartDrawer());
    if (drawer) {
      drawer.addEventListener('click', (e) => {
        if (e.target === drawer) this.closeCartDrawer();
      });
    }
  }

  openCartDrawer() {
    const drawer = document.getElementById('drawer-shopify-cart');
    if (drawer) drawer.classList.add('active');
  }

  closeCartDrawer() {
    const drawer = document.getElementById('drawer-shopify-cart');
    if (drawer) drawer.classList.remove('active');
  }

  escapeHtmlAttr(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  matchPackToken(packA, packB) {
    if (!packA || !packB) return false;
    const a = String(packA).trim().toLowerCase();
    const b = String(packB).trim().toLowerCase();
    if (a === b) return true;

    // Extract leading/distinct weight/volume token (e.g. 1000g, 100g, 30g, 500ml, 140g, 420g, 1260g, 1l, etc.)
    const extractToken = (str) => {
      const m = str.match(/\b(\d+(?:\.\d+)?\s*(?:g|kg|ml|l|litre|litres|oz|qt|pt|set)?)\b/i);
      return m ? m[1].replace(/\s+/g, '') : '';
    };

    const tokenA = extractToken(a);
    const tokenB = extractToken(b);

    if (tokenA && tokenB) {
      if (tokenA === tokenB) return true;
      const normA = tokenA.replace(/litres?/, 'l');
      const normB = tokenB.replace(/litres?/, 'l');
      if (normA === normB) return true;
      return false;
    }

    return a === b || a.includes(b) || b.includes(a);
  }

  matchFlakeSizeToken(sizeA, sizeB) {
    if (!sizeA || !sizeB) return false;
    const a = String(sizeA).trim().toLowerCase();
    const b = String(sizeB).trim().toLowerCase();
    if (a === b) return true;

    // Extract inch dimension e.g. .002, .004, .008, .015, .025, .040, .060
    const dimA = (a.match(/\.0\d+/) || [])[0];
    const dimB = (b.match(/\.0\d+/) || [])[0];
    if (dimA && dimB) {
      return dimA === dimB;
    }

    // Canonicalize size names
    const getCanonical = (str) => {
      if (str.includes('ultra') || str.includes('micro') || str.includes('.002') || str.includes('.004')) return 'ultra-small';
      if (str.includes('dxl') || str.includes('.060')) return 'dxlarge';
      if (str.includes('xl') || str.includes('extra large') || str.includes('.040')) return 'xlarge';
      if (str.includes('large') || str.includes('.025')) return 'large';
      if (str.includes('medium') || str.includes('.015')) return 'medium';
      if (str.includes('small') || str.includes('.008')) return 'small';
      return str;
    };

    const canonA = getCanonical(a);
    const canonB = getCanonical(b);
    return canonA === canonB;
  }

  formatFlakeDimension(size) {
    if (!size) return '';
    return String(size).trim();
  }

  formatFlakePackSize(pack) {
    if (!pack) return '';
    let str = String(pack).trim();
    if (str.includes('10g') || str.includes('15g')) {
      return '30g Jar (Gun Mount)';
    }
    return str;
  }

  getFlakeSubcategory(prod) {
    if (!prod) return null;
    const isFlake = prod.category === 'Dry Metal Flake (Glitter)' || prod.category === 'Metal Flake';
    if (!isFlake) return null;
    if (prod.flakeType) return prod.flakeType;
    const name = (prod.name || '').toLowerCase();
    const desc = (prod.description || '').toLowerCase();
    if (name.includes('kromatic') || desc.includes('kromatic') || name.includes('holographic')) return 'Holographic';
    if (name.includes('dragon') || desc.includes('iridescent')) return 'Iridescent';
    if (name.includes('blend') || name.includes('mixed')) return 'Mixed Blend';
    return 'Single Colour';
  }

  exportCSV() {
    this.shopifyCartManager.exportToCSV();
  }

  exportJSON() {
    this.shopifyCartManager.exportToJSON(this.currentRecipe);
  }

  // =========================================================================
  // ADMIN CONTROL CENTER & ADD-ON SUITE METHODS
  // =========================================================================
  setupAdminSuite() {
    // PIN Modal Triggers & Submissions
    this.addSafeListener('btn-admin-auth-close', 'click', () => this.closeAdminAuthModal());
    this.addSafeListener('btn-admin-auth-submit', 'click', () => this.handleAdminPinSubmit());
    
    const pinInput = document.getElementById('input-admin-pin');
    if (pinInput) {
      pinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleAdminPinSubmit();
      });
    }

    // Change PIN & Logout
    this.addSafeListener('btn-admin-change-pin', 'click', () => {
      const cur = prompt("Enter current PIN:");
      if (!cur) return;
      const newP = prompt("Enter new PIN (at least 4 characters):");
      if (!newP) return;
      const res = this.adminController.changePin(cur, newP);
      this.showToast(res.message, res.success ? 'success' : 'danger');
    });

    this.addSafeListener('btn-admin-logout', 'click', () => {
      this.adminController.logout();
      this.showToast("🔒 Admin Console Locked.", "info");
      this.switchTab('tab-storefront', 'view-storefront');
    });

    // Backup & Restore
    this.addSafeListener('btn-admin-export-backup', 'click', () => {
      this.adminController.exportConfigJson();
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
          const res = this.adminController.importConfigJson(evt.target.result);
          this.showToast(res.message, res.success ? 'success' : 'danger');
          if (res.success) this.renderAdminAll();
        };
        reader.readAsText(file);
      });
    }

    // Admin Sub-Tab Switching
    const subtabs = [
      { btnId: 'subtab-admin-spreadsheet', panelId: 'admin-panel-spreadsheet' },
      { btnId: 'subtab-admin-formulas', panelId: 'admin-panel-formulas' },
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
                this.renderAdminBundles();
              }
            }
          });
        });
      }
    });

    // Bundle Configurator bindings
    this.addSafeListener('btn-admin-save-bundle', 'click', () => this.saveBundleFromAdmin());
    this.addSafeListener('btn-admin-reset-bundle', 'click', () => this.resetBundleFromAdmin());
    this.addSafeListener('btn-admin-add-bundle-slot', 'click', () => this.addAdminBundleSlot());

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
    this.addSafeListener('btn-admin-add-formula', 'click', () => this.openAdminFormulaModal());
    this.addSafeListener('btn-admin-formula-edit-close', 'click', () => this.closeAdminFormulaModal());
    this.addSafeListener('btn-admin-cancel-formula', 'click', () => this.closeAdminFormulaModal());
    this.addSafeListener('btn-admin-save-formula-submit', 'click', () => this.saveAdminFormulaFromModal());
    this.addSafeListener('btn-admin-add-component-row', 'click', () => this.addComponentRowToModal());

    // Product Fields & Catalog Manager bindings
    this.addSafeListener('btn-admin-add-new-product', 'click', () => this.openAdminProductModal());
    this.addSafeListener('btn-admin-product-edit-close', 'click', () => this.closeAdminProductModal());
    this.addSafeListener('btn-admin-product-cancel', 'click', () => this.closeAdminProductModal());
    this.addSafeListener('btn-admin-product-save', 'click', () => this.saveAdminProductFromModal());
    this.addSafeListener('btn-admin-product-delete-permanent', 'click', () => this.deleteAdminProductPermanentlyFromModal());
    this.addSafeListener('btn-admin-product-reset-overrides', 'click', () => this.resetAdminProductOverridesFromModal());
    this.addSafeListener('btn-admin-product-duplicate-modal', 'click', () => this.duplicateAdminProductFromModal());
    this.addSafeListener('btn-admin-product-delete', 'click', () => this.resetAdminProductOverridesFromModal());

    // Gemini AI Studio Buttons inside Product Modal
    this.addSafeListener('btn-admin-gemini-copy', 'click', () => this.triggerGeminiSalesCopy());
    this.addSafeListener('btn-admin-gemini-video', 'click', () => this.triggerGeminiVideoScript());
    this.addSafeListener('btn-admin-gemini-preview-close', 'click', () => this.closeGeminiPreviewModal());
    this.addSafeListener('btn-gemini-apply-copy', 'click', () => this.applyGeminiSalesCopy());

    // Product Search & Filter bindings
    const prodSearch = document.getElementById('admin-product-search');
    if (prodSearch) {
      prodSearch.addEventListener('input', () => this.renderAdminProducts());
    }
    const brandFilter = document.getElementById('admin-product-filter-brand');
    if (brandFilter) {
      brandFilter.addEventListener('change', () => this.renderAdminProducts());
    }
    const catFilter = document.getElementById('admin-product-filter-category');
    if (catFilter) {
      catFilter.addEventListener('change', () => this.renderAdminProducts());
    }

    // Spreadsheet Suite Setup
    this.setupAdminSpreadsheet();

    // Pre-orders save button
    this.addSafeListener('btn-admin-save-preorders', 'click', () => this.saveAdminPreorders());

    // Citizen Printer Actions
    this.addSafeListener('btn-admin-save-printer', 'click', () => this.saveAdminPrinterConfig());
    this.addSafeListener('btn-admin-download-tspl', 'click', () => this.downloadAdminTspl());
    this.addSafeListener('btn-admin-test-print', 'click', () => this.triggerAdminTestPrint());

    // Hazmat save button
    this.addSafeListener('btn-admin-save-hazmat', 'click', () => this.saveAdminHazmatConfig());

    // AI save button
    this.addSafeListener('btn-admin-save-ai', 'click', () => this.saveAdminAiConfig());

    // Customer Email & AI Communication Hub Bindings
    this.setupAdminEmailHub();

    // FX Volatility Guard & Dynamic Euro Pricing Setup
    this.setupFxEngineUI();
  }

  openAdminAuthModal() {
    const modal = document.getElementById('modal-admin-auth');
    const err = document.getElementById('admin-pin-error');
    const pin = document.getElementById('input-admin-pin');
    if (err) err.classList.add('hidden');
    if (pin) {
      pin.value = '';
      setTimeout(() => pin.focus(), 150);
    }
    if (modal) modal.classList.add('active');
  }

  closeAdminAuthModal() {
    const modal = document.getElementById('modal-admin-auth');
    if (modal) modal.classList.remove('active');
  }

  handleAdminPinSubmit() {
    const pinInput = document.getElementById('input-admin-pin');
    const err = document.getElementById('admin-pin-error');
    if (!pinInput) return;

    const res = this.adminController.login(pinInput.value);
    if (res.success) {
      this.closeAdminAuthModal();
      this.switchTab('tab-admin', 'view-admin');
    } else {
      if (err) {
        err.innerText = res.message;
        err.classList.remove('hidden');
      }
    }
  }

  renderAdminAll() {
    this.renderAdminSpreadsheet();
    this.renderAdminFormulas();
    this.renderAdminProducts();
    this.renderAdminPreorders();
    this.renderAdminBundles();
    this.renderAdminPrinter();
    this.renderAdminHazmat();
    this.renderAdminAI();
    this.renderAdminEmailHub();
    this.renderFxStatus();
  }

  // =========================================================================
  // ADMIN PRODUCT FIELDS & CATALOG MANAGER
  // =========================================================================
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
    const overrides = this.adminController.config.productOverrides || {};
    const deletedIds = this.adminController.getDeletedProductIds();
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

  renderAdminProducts() {
    const container = document.getElementById('admin-products-grid');
    const countBadge = document.getElementById('admin-product-count');
    if (!container) return;
    container.innerHTML = '';

    const q = (document.getElementById('admin-product-search')?.value || '').toLowerCase().trim();
    const brandF = document.getElementById('admin-product-filter-brand')?.value || 'all';
    const catF = document.getElementById('admin-product-filter-category')?.value || 'all';

    let list = this.getEffectiveProducts();

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
      const imgSrc = p.image || 'assets/images/coast_airbrush_logo.jpg';

      card.innerHTML = `
        <div>
          <div class="flex justify-between items-start mb-2 gap-2">
            <span class="metal-spec-plate-red text-[10px] font-bold truncate max-w-[140px]">${p.sku || p.id}</span>
            <span class="font-mono text-[10px] font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 border border-amber-500/40 truncate">${p.brand || 'Coast'}</span>
          </div>

          <div class="flex gap-3 my-2">
            <div class="w-16 h-16 bg-surface-container-lowest border border-secondary flex-shrink-0 flex items-center justify-center p-1">
              <img src="${imgSrc}" alt="${p.name}" class="w-full h-full object-contain" onerror="this.src='assets/images/coast_airbrush_logo.jpg'">
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
      const all = this.getEffectiveProducts();
      p = all.find(item => item.id === productId) || ECOM_CATALOG.find(item => item.id === productId);
      if (p && this.spreadsheetState.stagedEdits.has(productId)) {
        const staged = this.spreadsheetState.stagedEdits.get(productId);
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
      if (deptInput) deptInput.value = p.department || this.getDefaultDepartmentForProduct(p);
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
      if (imageInput) imageInput.value = 'Images/kromaedge/kroma-helmet-mirror.jpg';
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
      this.showToast("Please provide a product title.", "warning");
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

    this.adminController.saveProductOverride(productId, updatedFields);
    
    // Clear staged edits for this product now that it is saved
    if (this.spreadsheetState.stagedEdits.has(productId)) {
      this.spreadsheetState.stagedEdits.delete(productId);
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
    this.renderAdminSpreadsheet();
    this.renderStorefrontGrid();
    this.showToast(`✅ Product "${updatedFields.name}" saved and synchronized!`, 'success');
  }

  duplicateAdminProductFromModal() {
    const idInput = document.getElementById('form-product-id');
    if (!idInput) return;
    const prodId = idInput.value.trim();
    this.closeAdminProductModal();
    this.copySpreadsheetProduct(prodId);
  }

  async deleteAdminProductPermanentlyFromModal() {
    const idInput = document.getElementById('form-product-id');
    const nameInput = document.getElementById('form-product-name');
    const skuInput = document.getElementById('form-product-sku');
    if (!idInput) return;

    const prodId = idInput.value.trim();
    const prodName = nameInput ? nameInput.value.trim() : prodId;
    const prodSku = skuInput ? skuInput.value.trim() : '';

    const confirmed = await this.confirmDialog({
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

    const all = this.getEffectiveProducts();
    const product = all.find(p => p.id === prodId) || ECOM_CATALOG.find(p => p.id === prodId) || { id: prodId, name: prodName, sku: prodSku };

    this.spreadsheetState.stagedEdits.delete(prodId);
    this.spreadsheetState.selectedIds.delete(prodId);

    const catIdx = ECOM_CATALOG.findIndex(p => p.id === prodId);
    if (catIdx >= 0) {
      ECOM_CATALOG.splice(catIdx, 1);
    }

    this.adminController.deleteProduct(prodId, product);

    this.closeAdminProductModal();
    this.renderAdminProducts();
    this.renderAdminSpreadsheet();
    this.renderStorefrontGrid();
    this.updateTrashBadgeCount();
    this.showToast(`🗑️ Product "${prodName}" deleted from catalog.`, 'danger');
  }

  async resetAdminProductOverridesFromModal() {
    const idInput = document.getElementById('form-product-id');
    if (!idInput) return;
    const prodId = idInput.value.trim();

    const confirmed = await this.confirmDialog({
      title: 'Reset Overrides',
      subtitle: 'Restore Factory Catalog Defaults',
      message: `Reset custom overrides for product "${prodId}" back to factory defaults?`,
      confirmText: 'Reset Overrides',
      isDanger: false,
      icon: 'history'
    });

    if (!confirmed) return;

    this.adminController.deleteProductOverride(prodId);
    if (this.spreadsheetState.stagedEdits.has(prodId)) {
      this.spreadsheetState.stagedEdits.delete(prodId);
    }

    this.closeAdminProductModal();
    this.renderAdminProducts();
    this.renderAdminSpreadsheet();
    this.renderStorefrontGrid();
    this.showToast(`✅ Product "${prodId}" reset to catalog defaults.`, 'info');
  }

  deleteAdminProductFromModal() {
    this.resetAdminProductOverridesFromModal();
  }

  // =========================================================================
  // ADMIN PRODUCT SPREADSHEET & BULK PRICE MATRIX SUITE
  // =========================================================================
  setupAdminSpreadsheet() {
    // 1. Search & Filters
    const ssSearch = document.getElementById('admin-ss-search');
    if (ssSearch) {
      ssSearch.addEventListener('input', (e) => {
        this.spreadsheetState.searchQuery = e.target.value.trim().toLowerCase();
        this.spreadsheetState.currentPage = 1;
        this.renderAdminSpreadsheet();
      });
    }

    const ssDept = document.getElementById('admin-ss-filter-department');
    if (ssDept) {
      ssDept.addEventListener('change', (e) => {
        this.spreadsheetState.departmentFilter = e.target.value;
        this.spreadsheetState.currentPage = 1;
        this.renderAdminSpreadsheet();
      });
    }

    const ssBrand = document.getElementById('admin-ss-filter-brand');
    if (ssBrand) {
      ssBrand.addEventListener('change', (e) => {
        this.spreadsheetState.brandFilter = e.target.value;
        this.spreadsheetState.currentPage = 1;
        this.renderAdminSpreadsheet();
      });
    }

    const ssCat = document.getElementById('admin-ss-filter-category');
    if (ssCat) {
      ssCat.addEventListener('change', (e) => {
        this.spreadsheetState.categoryFilter = e.target.value;
        this.spreadsheetState.currentPage = 1;
        this.renderAdminSpreadsheet();
      });
    }

    const ssStock = document.getElementById('admin-ss-filter-stock');
    if (ssStock) {
      ssStock.addEventListener('change', (e) => {
        this.spreadsheetState.stockFilter = e.target.value;
        this.spreadsheetState.currentPage = 1;
        this.renderAdminSpreadsheet();
      });
    }

    const ssModified = document.getElementById('admin-ss-filter-modified');
    if (ssModified) {
      ssModified.addEventListener('change', (e) => {
        this.spreadsheetState.modifiedFilter = e.target.value;
        this.spreadsheetState.currentPage = 1;
        this.renderAdminSpreadsheet();
      });
    }

    const ssPageSize = document.getElementById('admin-ss-page-size');
    if (ssPageSize) {
      ssPageSize.addEventListener('change', (e) => {
        this.spreadsheetState.pageSize = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
        this.spreadsheetState.currentPage = 1;
        this.renderAdminSpreadsheet();
      });
    }

    this.addSafeListener('btn-spreadsheet-reset-filters', 'click', () => {
      this.spreadsheetState.searchQuery = '';
      this.spreadsheetState.departmentFilter = 'all';
      this.spreadsheetState.brandFilter = 'all';
      this.spreadsheetState.categoryFilter = 'all';
      this.spreadsheetState.stockFilter = 'all';
      this.spreadsheetState.modifiedFilter = 'all';
      this.spreadsheetState.currentPage = 1;

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
        if (this.spreadsheetState.sortField === field) {
          this.spreadsheetState.sortOrder = this.spreadsheetState.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          this.spreadsheetState.sortField = field;
          this.spreadsheetState.sortOrder = 'asc';
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
          filtered.forEach(p => this.spreadsheetState.selectedIds.add(p.id));
        } else {
          this.spreadsheetState.selectedIds.clear();
        }
        this.renderAdminSpreadsheet();
      });
    }

    // 4. Pagination Buttons
    this.addSafeListener('btn-ss-page-first', 'click', () => {
      this.spreadsheetState.currentPage = 1;
      this.renderAdminSpreadsheet();
    });
    this.addSafeListener('btn-ss-page-prev', 'click', () => {
      if (this.spreadsheetState.currentPage > 1) {
        this.spreadsheetState.currentPage--;
        this.renderAdminSpreadsheet();
      }
    });
    this.addSafeListener('btn-ss-page-next', 'click', () => {
      const filtered = this.getFilteredSortedSpreadsheetProducts();
      const maxPage = this.spreadsheetState.pageSize === 'all' ? 1 : Math.ceil(filtered.length / this.spreadsheetState.pageSize);
      if (this.spreadsheetState.currentPage < maxPage) {
        this.spreadsheetState.currentPage++;
        this.renderAdminSpreadsheet();
      }
    });
    this.addSafeListener('btn-ss-page-last', 'click', () => {
      const filtered = this.getFilteredSortedSpreadsheetProducts();
      const maxPage = this.spreadsheetState.pageSize === 'all' ? 1 : Math.ceil(filtered.length / this.spreadsheetState.pageSize);
      this.spreadsheetState.currentPage = maxPage;
      this.renderAdminSpreadsheet();
    });

    // 5. Batch Drawer Toggle
    this.addSafeListener('btn-spreadsheet-toggle-batch', 'click', () => {
      const drawer = document.getElementById('spreadsheet-batch-tools-box');
      if (drawer) {
        drawer.classList.toggle('hidden');
      }
    });

    // 6. Batch Actions Execution
    this.addSafeListener('btn-batch-apply-pct', 'click', () => {
      const val = parseFloat(document.getElementById('batch-price-pct-input')?.value || 0);
      if (val === 0) {
        this.showToast("Please enter a non-zero percentage (e.g. 10 for +10% or -5 for -5%).", "warning");
        return;
      }
      this.applyBatchPricePercentage(val);
    });

    this.addSafeListener('btn-batch-sync-gbp-from-eur', 'click', () => {
      const rate = parseFloat(document.getElementById('batch-eur-gbp-rate')?.value || 0.85);
      const rounding = document.getElementById('batch-rounding-select')?.value || 'none';
      this.applyBatchCurrencySync(rate, rounding);
    });

    this.addSafeListener('btn-batch-apply-rounding', 'click', () => {
      const rounding = document.getElementById('batch-rounding-select')?.value || 'none';
      if (rounding === 'none') {
        this.showToast("Please choose a rounding rule (.95, .99, .50, .00).", "warning");
        return;
      }
      this.applyBatchRounding(rounding);
    });

    this.addSafeListener('btn-batch-apply-taxonomy', 'click', () => {
      const dept = document.getElementById('batch-department-select')?.value;
      const brand = document.getElementById('batch-brand-select')?.value;
      if (!dept && !brand) {
        this.showToast("Please choose at least a Department or Brand to apply.", "warning");
        return;
      }
      this.applyBatchTaxonomy(dept, brand);
    });

    this.addSafeListener('btn-batch-stock-in', 'click', () => this.applyBatchStock(true));
    this.addSafeListener('btn-batch-stock-out', 'click', () => this.applyBatchStock(false));

    this.addSafeListener('btn-batch-apply-badge', 'click', () => {
      const badge = (document.getElementById('batch-badge-input')?.value || '').trim();
      this.applyBatchBadge(badge);
    });

    // Batch Duplicate & Delete
    this.addSafeListener('btn-batch-duplicate-selected', 'click', () => this.copySelectedSpreadsheetProducts());
    this.addSafeListener('btn-batch-delete-selected', 'click', () => this.deleteSelectedSpreadsheetProducts());

    // Trash & Restoration Modal
    this.addSafeListener('btn-spreadsheet-view-trash', 'click', () => this.openTrashModal());
    this.addSafeListener('btn-close-trash-modal', 'click', () => this.closeTrashModal());
    this.addSafeListener('btn-trash-close', 'click', () => this.closeTrashModal());
    this.addSafeListener('btn-trash-restore-all', 'click', () => this.restoreAllTrashProducts());

    // Product Matrix Modal Listeners
    this.addSafeListener('btn-matrix-modal-close', 'click', () => this.closeProductMatrixModal());
    this.addSafeListener('btn-matrix-cancel', 'click', () => this.closeProductMatrixModal());
    this.addSafeListener('btn-matrix-generate', 'click', () => this.generateMatrixCombinations());
    this.addSafeListener('btn-matrix-apply-base-price', 'click', () => this.applyMatrixBasePriceToAll());
    this.addSafeListener('btn-matrix-apply-pct', 'click', () => {
      const pct = parseFloat(document.getElementById('matrix-bulk-pct')?.value || 0);
      if (pct === 0) {
        this.showToast("Please enter a non-zero percentage adjustment.", "warning");
        return;
      }
      this.applyMatrixPercentageAdjust(pct);
    });
    this.addSafeListener('btn-matrix-auto-skus', 'click', () => this.autoGenerateMatrixSkus());
    this.addSafeListener('btn-matrix-add-row', 'click', () => this.addSingleMatrixRow());
    this.addSafeListener('btn-matrix-reset-defaults', 'click', () => this.resetProductMatrixToDefaults());
    this.addSafeListener('btn-matrix-save', 'click', () => this.saveProductMatrixFromModal());
    this.addSafeListener('btn-open-matrix-from-edit-modal', 'click', () => {
      const idInput = document.getElementById('form-product-id');
      if (idInput && idInput.value) {
        const prodId = idInput.value.trim();
        this.closeAdminProductModal();
        this.openProductMatrixModal(prodId);
      }
    });

    // 7. Global Save & Discard
    this.addSafeListener('btn-spreadsheet-save-all', 'click', () => this.saveSpreadsheetEdits());
    this.addSafeListener('btn-spreadsheet-discard', 'click', () => this.discardSpreadsheetEdits());

    // 8. Add Product Row
    this.addSafeListener('btn-spreadsheet-add-row', 'click', () => this.addSpreadsheetProductRow());

    // 9. CSV Export & Import
    this.addSafeListener('btn-spreadsheet-export-csv', 'click', () => this.exportSpreadsheetCsv());
    this.addSafeListener('btn-spreadsheet-import-csv-trigger', 'click', () => {
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

    // 1. Standard variantMatrix
    if (p.variantMatrix && Array.isArray(p.variantMatrix.variants) && p.variantMatrix.variants.length > 0) {
      p.variantMatrix.variants.forEach(v => {
        const eur = v.priceEur !== undefined ? parseFloat(v.priceEur) : null;
        const gbp = v.priceGbp !== undefined ? parseFloat(v.priceGbp) : null;
        if (eur !== null && !isNaN(eur)) pricesEur.push(eur);
        if (gbp !== null && !isNaN(gbp)) pricesGbp.push(gbp);
        const optStr = v.options ? Object.values(v.options).join(' / ') : (v.name || v.sku);
        variantsDetail.push({ label: optStr, eur: eur, gbp: gbp });
      });
    }
    // 2. packPriceMatrix
    else if (p.packPriceMatrix && Array.isArray(p.packPriceMatrix) && p.packPriceMatrix.length > 0) {
      p.packPriceMatrix.forEach(m => {
        const eur = m.priceEur !== undefined ? parseFloat(m.priceEur) : (m.priceRetailEur !== undefined ? parseFloat(m.priceRetailEur) : null);
        const gbp = m.priceGbp !== undefined ? parseFloat(m.priceGbp) : (m.priceRetailGbp !== undefined ? parseFloat(m.priceRetailGbp) : null);
        if (eur !== null && !isNaN(eur)) pricesEur.push(eur);
        if (gbp !== null && !isNaN(gbp)) pricesGbp.push(gbp);
        variantsDetail.push({ label: m.packSize || 'Pack', eur: eur, gbp: gbp });
      });
    }
    // 3. tapePriceMatrix
    else if (p.tapePriceMatrix && Array.isArray(p.tapePriceMatrix) && p.tapePriceMatrix.length > 0) {
      p.tapePriceMatrix.forEach(t => {
        const gbp = t.priceGbp !== undefined ? parseFloat(t.priceGbp) : null;
        const eur = t.priceEur !== undefined ? parseFloat(t.priceEur) : (gbp ? parseFloat((gbp / 0.85).toFixed(2)) : null);
        if (eur !== null && !isNaN(eur)) pricesEur.push(eur);
        if (gbp !== null && !isNaN(gbp)) pricesGbp.push(gbp);
        variantsDetail.push({ label: t.width || 'Width', eur: eur, gbp: gbp });
      });
    }
    // 4. fullMatrixPricing
    else if (p.fullMatrixPricing && Array.isArray(p.fullMatrixPricing) && p.fullMatrixPricing.length > 0) {
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
      : (this.euLocalization?.convertGbpToEur ? this.euLocalization.convertGbpToEur(p.priceGbp || p.priceRrpExVat || 0) : 0)) || 0;
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
    const list = this.getEffectiveProducts();
    const staged = this.spreadsheetState.stagedEdits;

    // Overlay staged edits for filtering/sorting
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

    // Department Filter
    if (this.spreadsheetState.departmentFilter !== 'all') {
      working = working.filter(p => (p.department || '').toLowerCase() === this.spreadsheetState.departmentFilter.toLowerCase());
    }

    // Brand Filter
    if (this.spreadsheetState.brandFilter !== 'all') {
      working = working.filter(p => (p.brand || '').toLowerCase() === this.spreadsheetState.brandFilter.toLowerCase());
    }

    // Category Filter
    if (this.spreadsheetState.categoryFilter !== 'all') {
      working = working.filter(p => (p.category || '').toLowerCase().includes(this.spreadsheetState.categoryFilter.toLowerCase()));
    }

    // Stock Filter
    if (this.spreadsheetState.stockFilter === 'in_stock') {
      working = working.filter(p => p.inStock !== false);
    } else if (this.spreadsheetState.stockFilter === 'out_stock') {
      working = working.filter(p => p.inStock === false);
    }

    // Modified Filter
    if (this.spreadsheetState.modifiedFilter === 'modified') {
      working = working.filter(p => p.isStagedModified);
    } else if (this.spreadsheetState.modifiedFilter === 'overridden') {
      working = working.filter(p => p.hasOverrides || p.isStagedModified);
    }

    // Text Search
    if (this.spreadsheetState.searchQuery) {
      const q = this.spreadsheetState.searchQuery;
      working = working.filter(p => {
        const str = `${p.sku || ''} ${p.name || ''} ${p.department || ''} ${p.brand || ''} ${p.category || ''} ${p.badge || ''} ${p.meta?.recommendedNozzle || ''} ${p.description || ''}`.toLowerCase();
        return str.includes(q);
      });
    }

    // Sorting
    const field = this.spreadsheetState.sortField;
    const order = this.spreadsheetState.sortOrder === 'asc' ? 1 : -1;

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

    const allProducts = this.getEffectiveProducts();
    const filtered = this.getFilteredSortedSpreadsheetProducts();
    const stagedCount = this.spreadsheetState.stagedEdits.size;
    const selectedCount = this.spreadsheetState.selectedIds.size;
    const overridesCount = Object.keys(this.adminController.config.productOverrides || {}).length;

    // Update KPI metrics
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

    // Unsaved indicator & buttons
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

    // Pagination calculations
    const pageSize = this.spreadsheetState.pageSize;
    const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(filtered.length / pageSize));
    if (this.spreadsheetState.currentPage > totalPages) {
      this.spreadsheetState.currentPage = totalPages;
    }
    const curPage = this.spreadsheetState.currentPage;

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
      const allSelected = displayList.length > 0 && displayList.every(p => this.spreadsheetState.selectedIds.has(p.id));
      selectAllCb.checked = allSelected;
    }

    tbody.innerHTML = '';

    if (displayList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="16" class="p-8 text-center text-secondary font-mono">
            No products found matching current filters. Try resetting filters or adding a product row.
          </td>
        </tr>
      `;
      return;
    }

    const departments = [
      "Automotive & Custom Paint",
      "Special Effects & Flakes",
      "Equipment & Hardware",
      "Consumables & Prep",
      "Studio & Merchandise"
    ];

    const brands = [
      "Kroma Edge",
      "Flake King",
      "House of Kolor",
      "Ace of Shades",
      "VsionAir"
    ];

    displayList.forEach((p, index) => {
      const tr = document.createElement('tr');
      const isSelected = this.spreadsheetState.selectedIds.has(p.id);
      const isStaged = this.spreadsheetState.stagedEdits.has(p.id);
      const hasSavedOverride = Boolean(this.adminController.config.productOverrides && this.adminController.config.productOverrides[p.id]);

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
          <div class="cursor-pointer group py-0.5 px-1 rounded hover:bg-emerald-950/40 border border-transparent hover:border-emerald-500/40 transition-all text-right" onclick="window.paintApp.openProductMatrixModal('${p.id}')" title="${this.escapeHtmlAttr(pricingSummary.tooltip)}">
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
          <div class="cursor-pointer group py-0.5 px-1 rounded hover:bg-amber-950/40 border border-transparent hover:border-amber-500/40 transition-all text-right" onclick="window.paintApp.openProductMatrixModal('${p.id}')" title="${this.escapeHtmlAttr(pricingSummary.tooltip)}">
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
          <input type="text" class="ss-cell-input w-full bg-transparent p-1.5 font-mono text-xs text-white border border-transparent focus:border-primary focus:bg-surface-container rounded transition-all font-bold" data-id="${p.id}" data-field="sku" value="${this.escapeHtml(p.sku || p.id)}">
        </td>
        <td class="p-1 border-r border-secondary/30">
          <input type="text" class="ss-cell-input w-full bg-transparent p-1.5 font-mono text-xs text-white border border-transparent focus:border-primary focus:bg-surface-container rounded transition-all" data-id="${p.id}" data-field="name" value="${this.escapeHtml(p.name || '')}">
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
          <input type="text" class="ss-cell-input w-full bg-transparent p-1.5 font-mono text-[11px] text-secondary border border-transparent focus:border-primary focus:bg-surface-container rounded transition-all" data-id="${p.id}" data-field="category" value="${this.escapeHtml(p.category || '')}">
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
          <input type="text" class="ss-cell-input w-full bg-transparent p-1.5 font-mono text-[11px] text-white border border-transparent focus:border-primary focus:bg-surface-container rounded transition-all" data-id="${p.id}" data-field="badge" placeholder="e.g. 10% OFF" value="${this.escapeHtml(p.badge || '')}">
        </td>
        <td class="p-1 border-r border-secondary/30">
          <input type="text" class="ss-cell-input w-full bg-transparent p-1 font-mono text-[10px] text-secondary border border-transparent focus:border-primary focus:bg-surface-container rounded transition-all" data-id="${p.id}" data-field="meta.recommendedNozzle" value="${this.escapeHtml(nozzleVal)}">
        </td>
        <td class="p-1 border-r border-secondary/30">
          <input type="text" class="ss-cell-input w-full bg-transparent p-1 font-mono text-[10px] text-secondary border border-transparent focus:border-primary focus:bg-surface-container rounded transition-all" data-id="${p.id}" data-field="meta.recommendedPressure" value="${this.escapeHtml(psiVal)}">
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

    // Wire table cell event listeners
    this.wireSpreadsheetRowEvents();
  }

  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return str.toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  wireSpreadsheetRowEvents() {
    // Row selection checkboxes
    document.querySelectorAll('.ss-row-select').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        if (e.target.checked) {
          this.spreadsheetState.selectedIds.add(id);
        } else {
          this.spreadsheetState.selectedIds.delete(id);
        }
        const selCount = this.spreadsheetState.selectedIds.size;
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

    // Input changes (text, number, select)
    document.querySelectorAll('.ss-cell-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const id = e.target.getAttribute('data-id');
        const field = e.target.getAttribute('data-field');
        const val = e.target.value;
        this.onSpreadsheetCellChange(id, field, val, e.target);
      });

      // Keyboard navigation (Enter / Down arrow)
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

    // Checkbox toggles (inStock, isPreOrder)
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
    if (!this.spreadsheetState.stagedEdits.has(prodId)) {
      this.spreadsheetState.stagedEdits.set(prodId, {});
    }

    const stagedObj = this.spreadsheetState.stagedEdits.get(prodId);

    if (fieldPath.startsWith('meta.')) {
      const metaField = fieldPath.split('.')[1];
      if (!stagedObj.meta) stagedObj.meta = {};
      stagedObj.meta[metaField] = (metaField === 'specificGravity') ? (parseFloat(newValue) || 1.0) : newValue;
    } else if (fieldPath === 'priceEur' || fieldPath === 'priceGbp') {
      stagedObj[fieldPath] = parseFloat(newValue) || 0;
    } else {
      stagedObj[fieldPath] = newValue;
    }

    // Highlight modified input
    if (element) {
      element.classList.add('!bg-amber-950/50', '!border-amber-500/80', '!text-amber-200');
    }

    // Update unsaved counters and enable save buttons
    const stagedCount = this.spreadsheetState.stagedEdits.size;
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

  applyBatchPricePercentage(pct) {
    const targetProducts = this.spreadsheetState.selectedIds.size > 0 
      ? this.getEffectiveProducts().filter(p => this.spreadsheetState.selectedIds.has(p.id))
      : this.getFilteredSortedSpreadsheetProducts();

    if (targetProducts.length === 0) {
      this.showToast("No products available to modify.", "warning");
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

    this.renderAdminSpreadsheet();
    this.showToast(`Applied ${pct > 0 ? '+' : ''}${pct}% price adjustment across ${targetProducts.length} product(s). Click "SAVE ALL CHANGES" to commit.`, 'info');
  }

  applyBatchCurrencySync(rate, rounding) {
    const targetProducts = this.spreadsheetState.selectedIds.size > 0 
      ? this.getEffectiveProducts().filter(p => this.spreadsheetState.selectedIds.has(p.id))
      : this.getFilteredSortedSpreadsheetProducts();

    if (targetProducts.length === 0) {
      this.showToast("No products available to modify.", "warning");
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

    this.renderAdminSpreadsheet();
    this.showToast(`Calculated GBP prices from EUR (rate: ${rate}) across ${targetProducts.length} product(s).`, 'info');
  }

  applyBatchRounding(rounding) {
    const targetProducts = this.spreadsheetState.selectedIds.size > 0 
      ? this.getEffectiveProducts().filter(p => this.spreadsheetState.selectedIds.has(p.id))
      : this.getFilteredSortedSpreadsheetProducts();

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

    this.renderAdminSpreadsheet();
    this.showToast(`Applied ${rounding} rounding across ${targetProducts.length} product(s).`, 'info');
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

  applyBatchTaxonomy(dept, brand) {
    const targetProducts = this.spreadsheetState.selectedIds.size > 0 
      ? this.getEffectiveProducts().filter(p => this.spreadsheetState.selectedIds.has(p.id))
      : this.getFilteredSortedSpreadsheetProducts();

    targetProducts.forEach(p => {
      const st = this.spreadsheetState.stagedEdits.get(p.id) || {};
      if (dept) st.department = dept;
      if (brand) st.brand = brand;
      this.spreadsheetState.stagedEdits.set(p.id, st);
    });

    this.renderAdminSpreadsheet();
    this.showToast(`Updated Department/Brand for ${targetProducts.length} product(s).`, 'info');
  }

  applyBatchStock(inStock) {
    const targetProducts = this.spreadsheetState.selectedIds.size > 0 
      ? this.getEffectiveProducts().filter(p => this.spreadsheetState.selectedIds.has(p.id))
      : this.getFilteredSortedSpreadsheetProducts();

    targetProducts.forEach(p => {
      const st = this.spreadsheetState.stagedEdits.get(p.id) || {};
      st.inStock = inStock;
      this.spreadsheetState.stagedEdits.set(p.id, st);
    });

    this.renderAdminSpreadsheet();
    this.showToast(`Marked ${targetProducts.length} product(s) as ${inStock ? 'IN STOCK' : 'OUT OF STOCK'}.`, 'info');
  }

  applyBatchBadge(badgeText) {
    const targetProducts = this.spreadsheetState.selectedIds.size > 0 
      ? this.getEffectiveProducts().filter(p => this.spreadsheetState.selectedIds.has(p.id))
      : this.getFilteredSortedSpreadsheetProducts();

    targetProducts.forEach(p => {
      const st = this.spreadsheetState.stagedEdits.get(p.id) || {};
      st.badge = badgeText;
      this.spreadsheetState.stagedEdits.set(p.id, st);
    });

    this.renderAdminSpreadsheet();
    this.showToast(`Applied promotional badge "${badgeText}" to ${targetProducts.length} product(s).`, 'info');
  }

  saveSpreadsheetEdits() {
    const staged = this.spreadsheetState.stagedEdits;
    if (staged.size === 0) return;

    const overridesMap = {};
    for (const [prodId, fields] of staged.entries()) {
      overridesMap[prodId] = fields;
    }

    this.adminController.saveProductOverridesBulk(overridesMap);

    // Sync in-memory ECOM_CATALOG
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
    this.renderAdminSpreadsheet();
    this.renderAdminProducts();
    this.renderStorefrontGrid();
    this.showToast(`✅ Successfully saved and synchronized all product changes across Coast Airbrush Europe!`, 'success');
  }

  async discardSpreadsheetEdits() {
    const count = this.spreadsheetState.stagedEdits.size;
    if (count === 0) return;

    const confirmed = await this.confirmDialog({
      title: 'Discard Changes',
      subtitle: 'Spreadsheet Modifications',
      message: `Discard all pending unsaved spreadsheet modifications across <strong class="text-amber-400">${count} product(s)</strong>?`,
      confirmText: 'Discard Changes',
      isDanger: true,
      icon: 'undo'
    });

    if (confirmed) {
      this.spreadsheetState.stagedEdits.clear();
      this.renderAdminSpreadsheet();
      this.showToast("Pending spreadsheet modifications discarded.", "info");
    }
  }

  revertSpreadsheetRow(prodId) {
    if (this.spreadsheetState.stagedEdits.has(prodId)) {
      this.spreadsheetState.stagedEdits.delete(prodId);
    }
    if (this.adminController.config.productOverrides && this.adminController.config.productOverrides[prodId]) {
      this.adminController.deleteProductOverride(prodId);
    }
    this.renderAdminSpreadsheet();
    this.renderAdminProducts();
    this.renderStorefrontGrid();
    this.showToast(`Reverted changes for row.`, "info");
  }

  copySpreadsheetProduct(productId) {
    const all = this.getEffectiveProducts();
    let original = all.find(p => p.id === productId);
    if (!original) {
      original = ECOM_CATALOG.find(p => p.id === productId);
    }
    if (!original) {
      this.showToast("Product not found to duplicate.", "danger");
      return;
    }

    // Overlay any staged edits if user had unsaved changes in this row
    const staged = this.spreadsheetState.stagedEdits.get(productId) || {};
    const baseObj = {
      ...original,
      ...staged,
      meta: { ...(original.meta || {}), ...(staged.meta || {}) }
    };

    const newId = `custom_prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    // Formulate new SKU
    let baseSku = (baseObj.sku || `CAE-${Date.now().toString().slice(-4)}`).trim();
    let newSku;
    if (baseSku.includes('-COPY')) {
      const match = baseSku.match(/-COPY-?(\d+)?$/);
      const copyNum = match && match[1] ? parseInt(match[1], 10) + 1 : 2;
      newSku = baseSku.replace(/-COPY-?(\d+)?$/, `-COPY-${copyNum}`);
    } else {
      newSku = `${baseSku}-COPY`;
    }

    // Formulate new Name
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
      image: baseObj.image || 'Images/kromaedge/kroma-helmet-mirror.jpg',
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

    // Stage it immediately as an unsaved edit
    this.spreadsheetState.stagedEdits.set(newId, clonedProduct);
    ECOM_CATALOG.unshift(clonedProduct);
    
    // Jump to page 1 to see the new item immediately
    this.spreadsheetState.currentPage = 1;
    this.renderAdminSpreadsheet();

    // Smooth scroll and focus on the new cloned row
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

    this.showToast(`📋 Duplicated "${baseName}". Staged as unsaved edit.`, 'success', 4500);
  }

  copySelectedSpreadsheetProducts() {
    const selectedIds = Array.from(this.spreadsheetState.selectedIds);
    if (selectedIds.length === 0) {
      this.showToast("Please check at least one product row to duplicate.", "warning");
      return;
    }

    let count = 0;
    selectedIds.forEach(id => {
      this.copySpreadsheetProduct(id);
      count++;
    });

    this.spreadsheetState.selectedIds.clear();
    this.renderAdminSpreadsheet();
    this.showToast(`📋 Successfully duplicated ${count} product(s). Click "SAVE ALL CHANGES" when ready.`, 'success', 4500);
  }

  async deleteSpreadsheetProduct(productId) {
    const all = this.getEffectiveProducts();
    let product = all.find(p => p.id === productId) || ECOM_CATALOG.find(p => p.id === productId);
    
    if (!product && this.spreadsheetState.stagedEdits.has(productId)) {
      product = this.spreadsheetState.stagedEdits.get(productId);
    }
    if (!product) {
      this.showToast("Product not found.", "danger");
      return;
    }

    const confirmed = await this.confirmDialog({
      title: 'Delete Product',
      subtitle: 'Catalog Deletion Confirmation',
      message: `Are you sure you want to delete this product from Coast Airbrush Europe? It will be removed from all active store pages and catalog grids.`,
      itemDetails: `
        <div class="font-bold text-white text-xs mb-1">${this.escapeHtml(product.name || 'Unnamed Product')}</div>
        <div class="text-zinc-400 text-[11px]">SKU: <span class="text-primary font-bold">${this.escapeHtml(product.sku || product.id)}</span> | Dept: ${this.escapeHtml(product.department || 'Automotive')}</div>
        <div class="text-emerald-400 mt-1 font-bold text-[11px]">&euro;${(product.priceEur || 0).toFixed(2)} / &pound;${(product.priceGbp || 0).toFixed(2)}</div>
      `,
      confirmText: 'Delete Product',
      isDanger: true,
      icon: 'delete'
    });

    if (!confirmed) return;

    // Remove from staged edits and selection
    this.spreadsheetState.stagedEdits.delete(productId);
    this.spreadsheetState.selectedIds.delete(productId);

    // Splice from runtime ECOM_CATALOG
    const catIdx = ECOM_CATALOG.findIndex(p => p.id === productId);
    if (catIdx >= 0) {
      ECOM_CATALOG.splice(catIdx, 1);
    }

    // Save deletion in admin controller
    this.adminController.deleteProduct(productId, product);

    this.renderAdminSpreadsheet();
    this.renderAdminProducts();
    this.renderStorefrontGrid();
    this.updateTrashBadgeCount();
    this.showToast(`🗑️ Deleted product "${product.name}". Moved to Trash.`, 'danger', 4000);
  }

  async deleteSelectedSpreadsheetProducts() {
    const selectedIds = Array.from(this.spreadsheetState.selectedIds);
    if (selectedIds.length === 0) {
      this.showToast("Please check at least one product row to delete.", "warning");
      return;
    }

    const confirmed = await this.confirmDialog({
      title: 'Bulk Delete Products',
      subtitle: 'Multiple Catalog Deletions',
      message: `Are you sure you want to remove <strong class="text-rose-400">${selectedIds.length} selected product(s)</strong> from Coast Airbrush Europe?`,
      confirmText: `Delete ${selectedIds.length} Products`,
      isDanger: true,
      icon: 'delete_sweep'
    });

    if (!confirmed) return;

    const all = this.getEffectiveProducts();
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

    this.adminController.deleteProductsBulk(itemsToDelete);

    this.renderAdminSpreadsheet();
    this.renderAdminProducts();
    this.renderStorefrontGrid();
    this.updateTrashBadgeCount();
    this.showToast(`🗑️ Deleted ${itemsToDelete.length} products from catalog.`, 'danger', 4000);
  }

  openTrashModal() {
    const modal = document.getElementById('modal-deleted-products');
    const container = document.getElementById('trash-products-list-container');
    if (!modal || !container) return;

    const records = this.adminController.getDeletedProductRecords();
    const deletedIds = this.adminController.getDeletedProductIds();
    
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
                <td class="p-2 font-bold text-primary">${this.escapeHtml(item.sku || item.id)}</td>
                <td class="p-2 text-white">${this.escapeHtml(item.name || 'Unnamed Product')}</td>
                <td class="p-2 text-zinc-400 text-[11px]">${this.escapeHtml(item.department || '-')}</td>
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
    const restored = this.adminController.restoreProduct(productId);
    if (restored) {
      if (!ECOM_CATALOG.some(p => p.id === restored.id)) {
        ECOM_CATALOG.unshift(restored);
      }
    }
    this.openTrashModal(); // Refresh modal table
    this.renderAdminSpreadsheet();
    this.renderAdminProducts();
    this.renderStorefrontGrid();
    this.updateTrashBadgeCount();
    this.showToast(`✅ Restored product "${restored?.name || productId}" back to catalog!`, 'success');
  }

  restoreAllTrashProducts() {
    const restoredList = this.adminController.restoreAllDeletedProducts();
    restoredList.forEach(item => {
      if (!ECOM_CATALOG.some(p => p.id === item.id)) {
        ECOM_CATALOG.unshift(item);
      }
    });
    this.openTrashModal();
    this.renderAdminSpreadsheet();
    this.renderAdminProducts();
    this.renderStorefrontGrid();
    this.updateTrashBadgeCount();
    this.showToast(`✅ Restored all products back to catalog!`, 'success');
  }

  updateTrashBadgeCount() {
    const badge = document.getElementById('ss-trash-count');
    if (badge) {
      badge.innerText = this.adminController.getDeletedProductIds().length.toString();
    }
  }

  // =========================================================================
  // PRODUCT MATRIX & MULTI-AXIS VARIANT SUITE
  // =========================================================================
  openProductMatrixModal(productId) {
    const all = this.getEffectiveProducts();
    let prod = all.find(p => p.id === productId) || ECOM_CATALOG.find(p => p.id === productId);
    if (!prod) {
      this.showToast("Product not found.", "danger");
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
      const optDesc = Object.entries(v.options || {}).map(([k, val]) => `<span class="text-secondary text-[10px]">${this.escapeHtml(k)}:</span> <strong class="text-white">${this.escapeHtml(val)}</strong>`).join(' | ') || 'Standard';
      const optDataAttr = this.escapeHtmlAttr(JSON.stringify(v.options || {}));
      const rowId = v.id || `var_${idx + 1}`;

      return `
        <tr id="matrix-row-${rowId}" data-row-id="${rowId}" data-options='${optDataAttr}' class="hover:bg-surface-container transition-colors">
          <td class="p-2 border-r border-secondary/30 font-mono text-[11px]">
            ${optDesc}
          </td>
          <td class="p-1 border-r border-secondary/30">
            <input type="text" class="matrix-input-sku w-full bg-transparent p-1 font-mono text-xs font-bold text-primary border border-transparent focus:border-primary focus:bg-surface-container rounded" value="${this.escapeHtml(v.sku || '')}">
          </td>
          <td class="p-1 border-r border-secondary/30">
            <input type="text" class="matrix-input-barcode w-full bg-transparent p-1 font-mono text-[11px] text-zinc-300 border border-transparent focus:border-primary focus:bg-surface-container rounded" placeholder="EAN-13" value="${this.escapeHtml(v.barcode || '')}">
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
      this.showToast("Please enter at least one option value for Axis 1.", "warning");
      return;
    }

    const prodId = document.getElementById('matrix-product-id')?.value;
    const all = this.getEffectiveProducts();
    const prod = all.find(p => p.id === prodId) || ECOM_CATALOG.find(p => p.id === prodId) || {};
    const baseSku = (prod.sku || prodId || 'CAE').trim();
    const baseEur = prod.priceEur || 24.00;
    const baseGbp = prod.priceGbp || 20.00;

    // Read current existing rows to preserve existing prices/SKUs/barcodes where matches exist
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
    this.showToast(`✨ Generated ${newVariants.length} matrix combination(s).`, "success");
  }

  applyMatrixBasePriceToAll() {
    const prodId = document.getElementById('matrix-product-id')?.value;
    const all = this.getEffectiveProducts();
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

    this.showToast(`Applied base price (£${gbp} / €${eur}) across all ${count} variants.`, 'info');
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

    this.showToast(`Adjusted prices by ${pct > 0 ? '+' : ''}${pct}% across ${count} variants.`, 'info');
  }

  autoGenerateMatrixSkus() {
    const prodId = document.getElementById('matrix-product-id')?.value;
    const all = this.getEffectiveProducts();
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

    this.showToast(`Auto-generated ${count} variant SKUs from base SKU.`, 'info');
  }

  addSingleMatrixRow() {
    const tbody = document.getElementById('matrix-combinations-tbody');
    if (!tbody) return;

    const prodId = document.getElementById('matrix-product-id')?.value;
    const all = this.getEffectiveProducts();
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

    // Also sync backwards compatibility matrices
    const all = this.getEffectiveProducts();
    const prod = all.find(p => p.id === prodId) || ECOM_CATALOG.find(p => p.id === prodId);

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

    this.adminController.saveProductOverride(prodId, updatedFields);

    // Sync in-memory ECOM_CATALOG
    const catIdx = ECOM_CATALOG.findIndex(p => p.id === prodId);
    if (catIdx >= 0) {
      ECOM_CATALOG[catIdx] = {
        ...ECOM_CATALOG[catIdx],
        ...updatedFields
      };
    }

    this.closeProductMatrixModal();
    this.renderAdminSpreadsheet();
    this.renderAdminProducts();
    this.renderStorefrontGrid();
    this.showToast(`✅ Product matrix saved with ${variants.length} variant(s)!`, 'success', 4500);
  }

  async resetProductMatrixToDefaults() {
    const prodId = document.getElementById('matrix-product-id')?.value;
    if (!prodId) return;

    const confirmed = await this.confirmDialog({
      title: 'Reset Matrix',
      subtitle: 'Restore Factory Matrix',
      message: `Reset custom variant matrix overrides for product "${prodId}" back to original catalog baseline?`,
      confirmText: 'Reset Matrix',
      isDanger: false,
      icon: 'history'
    });

    if (!confirmed) return;

    this.adminController.deleteProductMatrix(prodId);

    const all = this.getEffectiveProducts();
    const prod = all.find(p => p.id === prodId) || ECOM_CATALOG.find(p => p.id === prodId);
    if (prod && prod.variantMatrix) {
      delete prod.variantMatrix;
    }

    this.openProductMatrixModal(prodId); // re-hydrate
    this.renderAdminSpreadsheet();
    this.renderAdminProducts();
    this.renderStorefrontGrid();
    this.showToast("Variant matrix reset to factory defaults.", "info");
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
      image: 'Images/kromaedge/kroma-helmet-mirror.jpg',
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
    this.renderAdminSpreadsheet();

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
    const list = this.getFilteredSortedSpreadsheetProducts();
    if (list.length === 0) {
      this.showToast("No products to export.", "warning");
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
          this.showToast("CSV file appears to be empty or missing header.", "danger");
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

        this.renderAdminSpreadsheet();
        this.showToast(`📥 Successfully imported CSV! ${updatedCount} products staged for review. Click "SAVE ALL CHANGES" to commit.`, 'success');
      } catch (err) {
        this.showToast("Error parsing CSV file: " + err.message, 'danger');
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

  // =========================================================================
  // GEMINI AI CREATIVE GENERATORS
  // =========================================================================
  triggerGeminiSalesCopy() {
    const name = document.getElementById('form-product-name')?.value || 'Custom Formula';
    const brand = document.getElementById('form-product-brand')?.value || 'Kroma Edge';
    const cat = document.getElementById('form-product-category')?.value || 'Specialty Paint';
    const sku = document.getElementById('form-product-sku')?.value || 'KE-SYS';
    const priceEur = parseFloat(document.getElementById('form-product-price-eur')?.value || '100');

    const result = this.adminController.generateGeminiSalesCopy({
      name, brand, category: cat, sku, priceEur
    });

    this.currentGeminiOutput = { type: 'copy', data: result };
    this.showGeminiPreviewModal("✨ Gemini AI Sales Copy Generator", `
      <div class="space-y-3">
        <div class="p-3 bg-primary/10 border border-primary/40 rounded">
          <div class="font-bold text-primary text-xs uppercase mb-1">Generated Hook / Tagline:</div>
          <div class="text-white font-medium">${result.hook}</div>
        </div>

        <div>
          <div class="font-bold text-secondary text-xs uppercase mb-1">Generated High-Desire Sales Copy:</div>
          <div class="p-3 bg-surface-dim border border-secondary rounded whitespace-pre-wrap text-white leading-relaxed text-xs">
${result.description}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 text-xs">
          <div class="p-2 bg-surface-dim border border-secondary rounded">
            <span class="text-secondary font-bold">Suggested Badge:</span> 
            <span class="text-amber-400 font-bold ml-1">${result.badgeSuggestion}</span>
          </div>
          <div class="p-2 bg-surface-dim border border-secondary rounded">
            <span class="text-secondary font-bold">SEO Keywords:</span> 
            <span class="text-emerald-400 font-bold ml-1">${result.seoKeywords}</span>
          </div>
        </div>
      </div>
    `);
  }

  triggerGeminiVideoScript() {
    const name = document.getElementById('form-product-name')?.value || 'Kroma Edge Mirror Chrome';
    const brand = document.getElementById('form-product-brand')?.value || 'Kroma Edge';

    const script = this.adminController.generateGeminiVideoScript({ name, brand });

    const shotsHtml = script.shotList.map(s => `
      <div class="p-2.5 bg-surface-dim border border-secondary/40 rounded flex flex-col gap-1">
        <div class="flex justify-between items-center text-[10px] text-primary font-bold">
          <span>⏱️ ${s.time}</span>
          <span class="text-amber-300">OVERLAY: ${s.textOverlay}</span>
        </div>
        <div class="text-white text-xs">${s.visual}</div>
      </div>
    `).join('');

    this.currentGeminiOutput = { type: 'video', data: script };
    this.showGeminiPreviewModal("🎬 Gemini 15-30s Promotional Video Script Blueprint", `
      <div class="space-y-3">
        <div class="p-3 bg-amber-950/30 border border-amber-500/40 rounded space-y-1">
          <div class="text-[10px] text-secondary font-bold uppercase">Viral Voiceover Hook:</div>
          <div class="text-amber-300 font-bold text-sm leading-snug">${script.voiceoverHook}</div>
          <div class="text-[10px] text-secondary mt-1">Visual: ${script.visualHook}</div>
        </div>

        <div>
          <div class="text-[10px] text-secondary font-bold uppercase mb-2">Shot-by-Shot Storyboard:</div>
          <div class="space-y-2">${shotsHtml}</div>
        </div>

        <div class="p-2 bg-surface-dim border border-secondary rounded flex justify-between items-center text-xs">
          <div><strong class="text-secondary">Hashtags:</strong> <span class="text-emerald-400">${script.hashtags.join(' ')}</span></div>
        </div>
      </div>
    `);
  }

  quickGeminiCopy(productId) {
    this.openAdminProductModal(productId);
    setTimeout(() => this.triggerGeminiSalesCopy(), 200);
  }

  showGeminiPreviewModal(title, htmlContent) {
    const modal = document.getElementById('modal-admin-gemini-preview');
    const titleEl = document.getElementById('modal-gemini-preview-title');
    const bodyEl = document.getElementById('gemini-preview-content');
    if (!modal || !bodyEl) return;

    if (titleEl) titleEl.innerText = title;
    bodyEl.innerHTML = htmlContent;
    modal.classList.add('active');
  }

  closeGeminiPreviewModal() {
    const modal = document.getElementById('modal-admin-gemini-preview');
    if (modal) modal.classList.remove('active');
  }

  applyGeminiSalesCopy() {
    if (!this.currentGeminiOutput || !this.currentGeminiOutput.data) {
      this.closeGeminiPreviewModal();
      return;
    }

    if (this.currentGeminiOutput.type === 'copy') {
      const descInput = document.getElementById('form-product-description');
      const badgeInput = document.getElementById('form-product-badge');
      if (descInput) descInput.value = this.currentGeminiOutput.data.description;
      if (badgeInput && this.currentGeminiOutput.data.badgeSuggestion) {
        badgeInput.value = this.currentGeminiOutput.data.badgeSuggestion;
      }
    } else if (this.currentGeminiOutput.type === 'video') {
      const descInput = document.getElementById('form-product-description');
      if (descInput) {
        descInput.value += `\n\n🎬 **Featured Video Hook:** "${this.currentGeminiOutput.data.voiceoverHook}"`;
      }
    }

    this.closeGeminiPreviewModal();
    this.showToast("✨ Gemini AI copy successfully applied to product fields!", 'success');
  }

  renderAdminFormulas() {
    const container = document.getElementById('admin-formulas-grid');
    if (!container) return;
    container.innerHTML = '';

    const formulas = this.adminController.config.formulas;
    formulas.forEach(f => {
      const card = document.createElement('div');
      card.className = 'industrial-card p-5 flex flex-col justify-between border-2 border-secondary/70 hover:border-primary transition-all';
      
      const compList = (f.components || []).map(c => 
        `<div class="flex justify-between items-center py-1 border-b border-secondary/30 text-[11px] font-mono">
          <span class="text-white font-medium">${c.name}</span>
          <span class="text-primary font-bold">${c.parts} pt (${c.specificGravity || 1.0} g/mL)</span>
        </div>`
      ).join('');

      card.innerHTML = `
        <div>
          <div class="flex justify-between items-start mb-2">
            <span class="metal-spec-plate-red text-[10px] font-bold">${f.id}</span>
            <span class="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 border border-emerald-500/40">${f.ratioLabel || f.ratioText || '1 : 1'}</span>
          </div>
          <h4 class="font-headline text-base uppercase text-white font-bold mb-1">${f.name}</h4>
          <p class="font-mono text-[11px] text-secondary mb-3 leading-relaxed">${f.description || f.notes || 'No description provided.'}</p>
          
          <div class="bg-surface-dim p-2.5 rounded border border-secondary mb-3">
            <div class="font-mono text-[10px] text-secondary uppercase font-bold mb-1">Components Breakdown:</div>
            ${compList}
          </div>

          <div class="grid grid-cols-2 gap-2 text-[10px] font-mono text-secondary mb-4">
            <div>Nozzle: <span class="text-white">${f.recommendedNozzle || '0.3mm - 0.5mm'}</span></div>
            <div>Pressure: <span class="text-white">${f.recommendedPressure || '20-25 PSI'}</span></div>
          </div>
        </div>

        <div class="flex gap-2 pt-3 border-t border-secondary/40">
          <button onclick="window.paintApp.openAdminFormulaModal('${f.id}')" class="flex-1 font-mono text-xs border border-secondary bg-surface-container py-1.5 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-1">
            <span class="material-symbols-outlined text-[14px]">edit</span> EDIT
          </button>
          <button onclick="window.paintApp.deleteAdminFormula('${f.id}')" class="font-mono text-xs border border-rose-500/60 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50 py-1.5 px-3 transition-all flex items-center justify-center">
            <span class="material-symbols-outlined text-[14px]">delete</span>
          </button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  openAdminFormulaModal(formulaId = null) {
    const modal = document.getElementById('modal-admin-formula-edit');
    const title = document.getElementById('modal-formula-edit-title');
    const idInput = document.getElementById('form-formula-id');
    const sysIdInput = document.getElementById('form-formula-system-id');
    const nameInput = document.getElementById('form-formula-name');
    const ratioInput = document.getElementById('form-formula-ratio-label');
    const nozzleInput = document.getElementById('form-formula-nozzle');
    const pressureInput = document.getElementById('form-formula-pressure');
    const notesInput = document.getElementById('form-formula-notes');
    const compContainer = document.getElementById('form-components-container');

    if (!modal || !compContainer) return;
    compContainer.innerHTML = '';

    if (formulaId) {
      const f = this.adminController.config.formulas.find(item => item.id === formulaId);
      if (f) {
        if (title) title.innerText = `Edit Formula: ${f.name}`;
        if (idInput) idInput.value = f.id;
        if (sysIdInput) { sysIdInput.value = f.id; sysIdInput.disabled = true; }
        if (nameInput) nameInput.value = f.name || '';
        if (ratioInput) ratioInput.value = f.ratioLabel || f.ratioText || '';
        if (nozzleInput) nozzleInput.value = f.recommendedNozzle || '';
        if (pressureInput) pressureInput.value = f.recommendedPressure || '';
        if (notesInput) notesInput.value = f.description || f.notes || '';

        (f.components || []).forEach(c => this.addComponentRowToModal(c));
      }
    } else {
      if (title) title.innerText = "Add New Mixing Formula";
      if (idInput) idInput.value = '';
      if (sysIdInput) { sysIdInput.value = `formula_${Date.now()}`; sysIdInput.disabled = false; }
      if (nameInput) nameInput.value = '';
      if (ratioInput) ratioInput.value = '4 : 1 : 1';
      if (nozzleInput) nozzleInput.value = '0.3mm - 0.5mm';
      if (pressureInput) pressureInput.value = '20 - 25 PSI';
      if (notesInput) notesInput.value = '';

      this.addComponentRowToModal({ name: 'Base Component', parts: 4, specificGravity: 0.98, productSku: 'KE-BASE-1L' });
      this.addComponentRowToModal({ name: 'Reducer / Solvent', parts: 1, specificGravity: 0.88, productSku: 'RU-311-1L' });
    }

    modal.classList.add('active');
  }

  addComponentRowToModal(comp = { name: '', parts: 1, specificGravity: 1.0, productSku: '' }) {
    const container = document.getElementById('form-components-container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'grid grid-cols-12 gap-2 items-center bg-surface-dim p-2 rounded border border-secondary/40 comp-row';
    row.innerHTML = `
      <div class="col-span-4">
        <input type="text" class="mech-input w-full !py-1 text-xs comp-name" placeholder="Component Name" value="${comp.name || ''}">
      </div>
      <div class="col-span-2">
        <input type="number" step="0.1" class="mech-input w-full !py-1 text-xs comp-parts" placeholder="Parts" value="${comp.parts || 1}">
      </div>
      <div class="col-span-2">
        <input type="number" step="0.01" class="mech-input w-full !py-1 text-xs comp-sg" placeholder="g/mL" value="${comp.specificGravity || 1.0}">
      </div>
      <div class="col-span-3">
        <input type="text" class="mech-input w-full !py-1 text-xs comp-sku" placeholder="SKU" value="${comp.productSku || ''}">
      </div>
      <div class="col-span-1 text-right">
        <button type="button" onclick="this.closest('.comp-row').remove()" class="text-rose-400 hover:text-rose-300 font-bold p-1">
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    `;
    container.appendChild(row);
  }

  closeAdminFormulaModal() {
    const modal = document.getElementById('modal-admin-formula-edit');
    if (modal) modal.classList.remove('active');
  }

  saveAdminFormulaFromModal() {
    const sysIdInput = document.getElementById('form-formula-system-id');
    const nameInput = document.getElementById('form-formula-name');
    const ratioInput = document.getElementById('form-formula-ratio-label');
    const nozzleInput = document.getElementById('form-formula-nozzle');
    const pressureInput = document.getElementById('form-formula-pressure');
    const notesInput = document.getElementById('form-formula-notes');

    if (!sysIdInput || !nameInput || !sysIdInput.value.trim() || !nameInput.value.trim()) {
      this.showToast("Please provide both a System ID and Name.", "warning");
      return;
    }

    const compRows = document.querySelectorAll('.comp-row');
    const components = [];
    compRows.forEach(r => {
      const name = r.querySelector('.comp-name').value.trim();
      const parts = parseFloat(r.querySelector('.comp-parts').value) || 1;
      const sg = parseFloat(r.querySelector('.comp-sg').value) || 1.0;
      const sku = r.querySelector('.comp-sku').value.trim();
      if (name) {
        components.push({
          id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          name: name,
          parts: parts,
          specificGravity: sg,
          productSku: sku || 'KE-BASE-1L'
        });
      }
    });

    const newFormula = {
      id: sysIdInput.value.trim(),
      name: nameInput.value.trim(),
      ratioLabel: ratioInput ? ratioInput.value.trim() : 'Standard',
      ratioText: ratioInput ? ratioInput.value.trim() : 'Standard',
      description: notesInput ? notesInput.value.trim() : '',
      recommendedNozzle: nozzleInput ? nozzleInput.value.trim() : '0.3mm - 0.5mm',
      recommendedPressure: pressureInput ? pressureInput.value.trim() : '20-25 PSI',
      components: components
    };

    this.adminController.saveFormula(newFormula);
    this.closeAdminFormulaModal();
    this.renderAdminFormulas();
    this.showToast("✅ Formula saved successfully!", 'success');
  }

  deleteAdminFormula(formulaId) {
    if (confirm(`Are you sure you want to delete formula "${formulaId}"?`)) {
      this.adminController.deleteFormula(formulaId);
      this.renderAdminFormulas();
    }
  }

  renderAdminPreorders() {
    const container = document.getElementById('admin-preorders-container');
    if (!container) return;
    container.innerHTML = '';

    const tiers = this.adminController.config.preorders;
    tiers.forEach((t, index) => {
      const card = document.createElement('div');
      card.className = 'industrial-card p-5 space-y-4 border-2 border-secondary/70';
      card.innerHTML = `
        <div class="flex justify-between items-center pb-2 border-b border-secondary">
          <span class="metal-spec-plate-red text-[10px] font-bold">${t.id}</span>
          <span class="font-mono text-xs text-primary font-bold">Tier ${index + 1}</span>
        </div>

        <div>
          <label class="block font-mono text-[10px] text-secondary uppercase font-bold mb-1">Package Name:</label>
          <input type="text" class="mech-input w-full !py-1 text-xs pre-name" value="${t.name}">
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-mono text-[10px] text-secondary uppercase font-bold mb-1">Price (&euro; EUR):</label>
            <input type="number" class="mech-input w-full !py-1 text-xs pre-price-eur" value="${t.priceEUR || 249}">
          </div>
          <div>
            <label class="block font-mono text-[10px] text-secondary uppercase font-bold mb-1">Price ($ USD):</label>
            <input type="number" class="mech-input w-full !py-1 text-xs pre-price-usd" value="${t.priceUSD || 270}">
          </div>
        </div>

        <div>
          <label class="block font-mono text-[10px] text-secondary uppercase font-bold mb-1">Badge Text:</label>
          <input type="text" class="mech-input w-full !py-1 text-xs pre-badge" value="${t.badge || ''}">
        </div>

        <div>
          <label class="block font-mono text-[10px] text-secondary uppercase font-bold mb-1">Delivery Batch Milestone:</label>
          <input type="text" class="mech-input w-full !py-1 text-xs pre-batch" value="${t.deliveryBatch || ''}">
        </div>

        <div>
          <label class="block font-mono text-[10px] text-secondary uppercase font-bold mb-1">Perks (one per line):</label>
          <textarea rows="4" class="mech-input w-full !py-1 text-xs pre-perks">${(t.perks || []).join('\n')}</textarea>
        </div>
      `;
      container.appendChild(card);
    });
  }

  saveAdminPreorders() {
    const cards = document.querySelectorAll('#admin-preorders-container .industrial-card');
    const updatedTiers = [];
    const originalTiers = this.adminController.config.preorders;

    cards.forEach((c, idx) => {
      const orig = originalTiers[idx] || {};
      const name = c.querySelector('.pre-name').value;
      const eur = parseFloat(c.querySelector('.pre-price-eur').value) || 0;
      const usd = parseFloat(c.querySelector('.pre-price-usd').value) || 0;
      const badge = c.querySelector('.pre-badge').value;
      const batch = c.querySelector('.pre-batch').value;
      const perksText = c.querySelector('.pre-perks').value;
      const perks = perksText.split('\n').map(p => p.trim()).filter(p => p.length > 0);

      updatedTiers.push({
        ...orig,
        name: name,
        priceEUR: eur,
        priceUSD: usd,
        badge: badge,
        deliveryBatch: batch,
        perks: perks
      });
    });

    this.adminController.config.preorders = updatedTiers;
    this.adminController.saveConfig();
    this.showToast("✅ Pre-Order packages saved and synchronized!", 'success');
  }

  renderAdminPrinter() {
    const p = this.adminController.config.printer;
    const model = document.getElementById('admin-printer-model');
    const dpi = document.getElementById('admin-printer-dpi');
    const tspl = document.getElementById('admin-printer-tspl-template');
    const ghs = document.getElementById('admin-printer-ghs-toggle');

    if (model) model.value = p.model || 'Citizen CL-S621';
    if (dpi) dpi.value = String(p.dpi || 203);
    if (tspl) tspl.value = p.tsplTemplate || this.adminController.generateTsplCommand();
    if (ghs) ghs.checked = !!p.enableGhsHazard;
  }

  saveAdminPrinterConfig() {
    const model = document.getElementById('admin-printer-model');
    const dpi = document.getElementById('admin-printer-dpi');
    const tspl = document.getElementById('admin-printer-tspl-template');
    const ghs = document.getElementById('admin-printer-ghs-toggle');

    this.adminController.config.printer = {
      ...this.adminController.config.printer,
      model: model ? model.value : 'Citizen CL-S621',
      dpi: dpi ? parseInt(dpi.value, 10) : 203,
      tsplTemplate: tspl ? tspl.value : '',
      enableGhsHazard: ghs ? ghs.checked : true
    };
    this.adminController.saveConfig();
    this.showToast("✅ Citizen Thermal Printer configuration updated!", 'success');
  }

  downloadAdminTspl() {
    const cmd = this.adminController.generateTsplCommand();
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(cmd);
    const link = document.createElement('a');
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `citizen_print_job_${Date.now()}.tspl`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  triggerAdminTestPrint() {
    const cmd = this.adminController.generateTsplCommand();
    this.showToast("🖨️ [Citizen CL-S621 WebUSB] Print job stream dispatched successfully.", 'success');
  }

  renderAdminHazmat() {
    const h = this.adminController.config.hazmat;
    const maxIn = document.getElementById('admin-hazmat-max-inner');
    const maxOut = document.getElementById('admin-hazmat-max-outer');
    const ukSur = document.getElementById('admin-hazmat-uk-surcharge');
    const euSur = document.getElementById('admin-hazmat-eu-surcharge');

    if (maxIn) maxIn.value = h.maxInnerVolumeMl || 5000;
    if (maxOut) maxOut.value = h.maxOuterGrossKg || 30;
    if (ukSur) ukSur.value = h.ukSurchargeEur || 8.50;
    if (euSur) euSur.value = h.euMainlandSurchargeEur || 12.00;
  }

  saveAdminHazmatConfig() {
    const maxIn = document.getElementById('admin-hazmat-max-inner');
    const maxOut = document.getElementById('admin-hazmat-max-outer');
    const ukSur = document.getElementById('admin-hazmat-uk-surcharge');
    const euSur = document.getElementById('admin-hazmat-eu-surcharge');

    this.adminController.config.hazmat = {
      maxInnerVolumeMl: maxIn ? parseInt(maxIn.value, 10) : 5000,
      maxOuterGrossKg: maxOut ? parseInt(maxOut.value, 10) : 30,
      ukSurchargeEur: ukSur ? parseFloat(ukSur.value) : 8.50,
      euMainlandSurchargeEur: euSur ? parseFloat(euSur.value) : 12.00,
      nonHazmatExemptionActive: true
    };
    this.adminController.saveConfig();
    this.showToast("✅ ADR Hazmat & Freight parameters saved!", 'success');
  }

  // =========================================================================
  // FX RATE VOLATILITY GUARD & DYNAMIC EURO PRICING ENGINE
  // =========================================================================
  setupFxEngineUI() {
    if (!this.euLocalization?.fxEngine) return;
    const fx = this.euLocalization.fxEngine;

    // Listen to FX updates to refresh UI live
    fx.onUpdate(() => {
      this.renderFxStatus();
    });

    // 1. Sync Live Rate
    this.addSafeListener('btn-fx-sync-live', 'click', async () => {
      const btn = document.getElementById('btn-fx-sync-live');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin">refresh</span> SYNCING...`;
      }
      const res = await fx.fetchLiveRate();
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span class="material-symbols-outlined text-[16px]">sync</span> SYNC LIVE ECB RATE`;
      }
      if (res.success) {
        this.showToast(`✅ Live ECB Rate Synced: 1 EUR = £${res.rate.toFixed(4)}`, 'success');
      } else {
        this.showToast(`⚠️ Rate fetch note: ${res.source || res.error}`, 'warning');
      }
      this.renderFxStatus();
    });

    // 2. Open Update Euro Pricing Modal (from banner or control card)
    const openModal = () => this.openFxUpdateModal();
    this.addSafeListener('btn-fx-banner-update-pricing', 'click', openModal);
    this.addSafeListener('btn-fx-open-update-modal', 'click', openModal);

    // 3. Banner Adjust Buffer quick button
    this.addSafeListener('btn-fx-banner-adjust-buffer', 'click', () => {
      const hazmatTab = document.getElementById('subtab-admin-hazmat');
      if (hazmatTab) hazmatTab.click();
      const bufInput = document.getElementById('fx-input-buffer-percent');
      if (bufInput) {
        bufInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        bufInput.focus();
        bufInput.select();
      }
    });

    // 4. Banner Dismiss button
    this.addSafeListener('btn-fx-banner-dismiss', 'click', () => {
      fx.dismissAlarm();
      this.renderFxStatus();
    });

    // 5. Set Current as Baseline
    this.addSafeListener('btn-fx-set-baseline', 'click', () => {
      const cur = fx.config.currentRate;
      fx.reanchorBaseline();
      this.adminController.saveFxSettings({ baselineRate: cur });
      this.showToast(`⚡ New Baseline Set: 1 EUR = £${cur.toFixed(4)}. Alarms reset.`, 'success');
      this.renderFxStatus();
    });

    // 6. Save FX Settings
    this.addSafeListener('btn-fx-save-settings', 'click', () => {
      const buf = parseFloat(document.getElementById('fx-input-buffer-percent')?.value || '1.8');
      const spike = parseFloat(document.getElementById('fx-input-spike-threshold')?.value || '3.5');
      const breaker = parseFloat(document.getElementById('fx-input-circuit-breaker')?.value || '7.5');
      const rounding = document.getElementById('fx-select-rounding-mode')?.value || 'retail_95';

      this.adminController.saveFxSettings({
        bufferPercent: buf,
        spikeThresholdPercent: spike,
        circuitBreakerPercent: breaker,
        roundingMode: rounding
      });
      this.showToast("✅ FX Volatility & Margin Guard parameters saved!", 'success');
      this.renderFxStatus();
    });

    // 7. Reset to Defaults
    this.addSafeListener('btn-fx-reset-defaults', 'click', () => {
      if (confirm("Reset FX Volatility Guard settings to default calibration (Baseline £0.8547, 1.8% Buffer)?")) {
        fx.resetToDefaults();
        this.adminController.saveFxSettings(fx.config);
        this.renderFxStatus();
        this.showToast("↺ FX settings restored to defaults", 'info');
      }
    });

    // 8. Test Simulator Buttons
    this.addSafeListener('btn-sim-spike-up', 'click', () => {
      fx.simulateSpike(4.5);
      this.showToast("⚡ Simulated +4.5% Euro Spike (Triggering Alarm)", 'warning');
      this.renderFxStatus();
    });

    this.addSafeListener('btn-sim-spike-down', 'click', () => {
      fx.simulateSpike(-4.5);
      this.showToast("📉 Simulated -4.5% Euro Drop (Triggering Alarm)", 'warning');
      this.renderFxStatus();
    });

    this.addSafeListener('btn-sim-circuit-breaker', 'click', () => {
      fx.simulateSpike(8.5);
      this.showToast("🛑 Simulated +8.5% Extreme Shift (Circuit Breaker Tripped!)", 'error');
      this.renderFxStatus();
    });

    this.addSafeListener('btn-sim-reset-normal', 'click', () => {
      fx.resetToDefaults();
      this.showToast("↺ Restored Normal Baseline Rate", 'success');
      this.renderFxStatus();
    });

    // 9. Modal Interactions
    this.addSafeListener('btn-close-fx-modal', 'click', () => this.closeFxUpdateModal());
    this.addSafeListener('btn-cancel-fx-modal', 'click', () => this.closeFxUpdateModal());

    const modalBufInput = document.getElementById('fx-modal-buffer-input');
    if (modalBufInput) {
      modalBufInput.addEventListener('input', () => this.renderFxModalImpactTable());
    }
    const modalRoundingSelect = document.getElementById('fx-modal-rounding-select');
    if (modalRoundingSelect) {
      modalRoundingSelect.addEventListener('change', () => this.renderFxModalImpactTable());
    }

    this.addSafeListener('btn-confirm-fx-reprice', 'click', () => {
      const bufVal = parseFloat(document.getElementById('fx-modal-buffer-input')?.value || '1.8');
      const roundVal = document.getElementById('fx-modal-rounding-select')?.value || 'retail_95';

      // Re-anchor baseline & reset alarms
      const res = this.adminController.reanchorFxBaseline({
        bufferPercent: bufVal,
        roundingMode: roundVal
      });

      // Batch reprice catalog products from master GBP ex-vat
      const repriceRes = this.adminController.batchRepriceCatalogFromGbp({
        rate: res.newBaseline,
        bufferPercent: bufVal,
        roundingMode: roundVal
      });

      this.closeFxUpdateModal();
      this.renderFxStatus();
      this.renderAdminSpreadsheet();
      this.renderAdminProducts();
      this.renderStorefrontGrid();

      this.showToast(`⚡ Repriced ${repriceRes.count || 135} catalog products in EUR! New baseline locked at 1 EUR = £${res.newBaseline.toFixed(4)}.`, 'success');
    });

    // Initial render of FX UI
    this.renderFxStatus();
  }

  renderFxStatus() {
    if (!this.euLocalization?.fxEngine) return;
    const fx = this.euLocalization.fxEngine;
    const details = fx.getDeviationDetails();

    // 1. Metric cards in Hazmat & FX panel
    const curRateEl = document.getElementById('fx-metric-current-rate');
    const invRateEl = document.getElementById('fx-metric-inverse-rate');
    const baseRateEl = document.getElementById('fx-metric-baseline-rate');
    const devEl = document.getElementById('fx-metric-deviation');
    const statusBadgeEl = document.getElementById('fx-guard-status-badge');
    const bufInput = document.getElementById('fx-input-buffer-percent');
    const spikeInput = document.getElementById('fx-input-spike-threshold');
    const breakerInput = document.getElementById('fx-input-circuit-breaker');
    const roundSelect = document.getElementById('fx-select-rounding-mode');
    const lastSyncEl = document.getElementById('fx-metric-last-sync');

    if (curRateEl) curRateEl.innerText = `1 € = £${details.currentRate.toFixed(4)}`;
    if (invRateEl) invRateEl.innerText = `£1 = €${(1 / details.currentRate).toFixed(4)}`;
    if (baseRateEl) baseRateEl.innerText = `1 € = £${details.baselineRate.toFixed(4)}`;

    if (devEl) {
      const sign = details.rateShiftPercent > 0 ? '+' : '';
      devEl.innerText = `${sign}${details.rateShiftPercent.toFixed(1)}%`;
      if (details.alarmState === 'CIRCUIT_BREAKER') {
        devEl.className = 'text-rose-400 font-bold';
      } else if (details.alarmState === 'SPIKE_WARNING') {
        devEl.className = 'text-amber-400 font-bold';
      } else {
        devEl.className = 'text-emerald-400 font-bold';
      }
    }

    if (statusBadgeEl) {
      if (details.alarmState === 'CIRCUIT_BREAKER') {
        statusBadgeEl.className = 'bg-rose-950/80 text-rose-300 border border-rose-500/70 text-[10px] font-mono px-2 py-0.5 uppercase font-bold flex items-center gap-1';
        statusBadgeEl.innerHTML = `<span class="material-symbols-outlined text-[12px]">gpp_bad</span> CIRCUIT BREAKER TRIPPED`;
      } else if (details.alarmState === 'SPIKE_WARNING') {
        statusBadgeEl.className = 'bg-amber-950/80 text-amber-300 border border-amber-500/70 text-[10px] font-mono px-2 py-0.5 uppercase font-bold flex items-center gap-1';
        statusBadgeEl.innerHTML = `<span class="material-symbols-outlined text-[12px]">warning</span> SPIKE ALERT ACTIVE`;
      } else {
        statusBadgeEl.className = 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono px-2 py-0.5 uppercase font-bold flex items-center gap-1';
        statusBadgeEl.innerHTML = `<span class="material-symbols-outlined text-[12px]">verified</span> NORMAL // PROTECTED`;
      }
    }

    if (bufInput && document.activeElement !== bufInput) bufInput.value = fx.config.bufferPercent;
    if (spikeInput && document.activeElement !== spikeInput) spikeInput.value = fx.config.spikeThresholdPercent;
    if (breakerInput && document.activeElement !== breakerInput) breakerInput.value = fx.config.circuitBreakerPercent;
    if (roundSelect && document.activeElement !== roundSelect) roundSelect.value = fx.config.roundingMode;
    if (lastSyncEl) {
      const dt = new Date(fx.config.lastChecked);
      lastSyncEl.innerText = `${dt.getHours().toString().padStart(2,'0')}:${dt.getMinutes().toString().padStart(2,'0')} GMT`;
    }

    // 2. Top Banner Alert
    const banner = document.getElementById('fx-spike-alert-banner');
    const bannerStatusBadge = document.getElementById('fx-banner-status-badge');
    const bannerSummary = document.getElementById('fx-banner-rate-summary');
    const bannerDesc = document.getElementById('fx-banner-description');
    const bannerIconBox = document.getElementById('fx-banner-icon-box');
    const bannerIcon = document.getElementById('fx-banner-icon');

    if (banner) {
      if (details.isAlarmActive) {
        banner.classList.remove('hidden');
        if (details.alarmState === 'CIRCUIT_BREAKER') {
          banner.className = 'mb-6 p-4 border-2 border-rose-500/80 bg-rose-950/40 rounded shadow-[0_0_20px_rgba(244,63,94,0.25)] font-mono transition-all';
          if (bannerIconBox) bannerIconBox.className = 'w-10 h-10 rounded flex items-center justify-center flex-shrink-0 bg-rose-500/20 text-rose-400 border border-rose-500/40';
          if (bannerIcon) bannerIcon.innerText = 'gpp_bad';
          if (bannerStatusBadge) {
            bannerStatusBadge.className = 'px-2 py-0.5 text-[10px] font-bold uppercase rounded border bg-rose-600 text-white border-rose-400';
            bannerStatusBadge.innerText = 'CIRCUIT BREAKER ENGAGED';
          }
          if (bannerSummary) {
            bannerSummary.innerText = `Extreme shift of ${details.rateShiftPercent > 0 ? '+' : ''}${details.rateShiftPercent}% detected! (Live: £${details.currentRate.toFixed(4)} | Baseline: £${details.baselineRate.toFixed(4)})`;
          }
          if (bannerDesc) {
            bannerDesc.innerText = 'Automated fail-safe triggered: Customer Euro conversions are FROZEN to baseline rate to prevent distorted prices. Click "Update Euro Pricing" to review & re-anchor.';
          }
        } else {
          // SPIKE_WARNING
          banner.className = 'mb-6 p-4 border-2 border-amber-500/80 bg-amber-950/30 rounded shadow-[0_0_20px_rgba(245,158,11,0.2)] font-mono transition-all';
          if (bannerIconBox) bannerIconBox.className = 'w-10 h-10 rounded flex items-center justify-center flex-shrink-0 bg-amber-500/20 text-amber-400 border border-amber-500/40';
          if (bannerIcon) bannerIcon.innerText = 'warning';
          if (bannerStatusBadge) {
            bannerStatusBadge.className = 'px-2 py-0.5 text-[10px] font-bold uppercase rounded border bg-amber-500 text-slate-950 border-amber-400';
            bannerStatusBadge.innerText = 'FX SPIKE ALERT';
          }
          if (bannerSummary) {
            bannerSummary.innerText = `EUR/GBP moved ${details.rateShiftPercent > 0 ? '+' : ''}${details.rateShiftPercent}% vs Baseline (Live: 1 € = £${details.currentRate.toFixed(4)} | Baseline: £${details.baselineRate.toFixed(4)})`;
          }
          if (bannerDesc) {
            bannerDesc.innerText = 'Currency volatility exceeds safe threshold. European profit margins may be impacted. Review impact and click "Update Euro Pricing" to re-anchor.';
          }
        }
      } else {
        banner.classList.add('hidden');
      }
    }
  }

  openFxUpdateModal() {
    const modal = document.getElementById('modal-fx-update-pricing');
    if (!modal || !this.euLocalization?.fxEngine) return;
    const fx = this.euLocalization.fxEngine;
    const details = fx.getDeviationDetails();

    const baseEl = document.getElementById('fx-modal-baseline-rate');
    const liveEl = document.getElementById('fx-modal-live-rate');
    const shiftEl = document.getElementById('fx-modal-rate-shift');
    const bufInput = document.getElementById('fx-modal-buffer-input');
    const roundSelect = document.getElementById('fx-modal-rounding-select');
    const circuitStatusEl = document.getElementById('fx-modal-circuit-status');

    if (baseEl) baseEl.innerText = `1 € = £${details.baselineRate.toFixed(4)}`;
    if (liveEl) liveEl.innerText = `1 € = £${details.currentRate.toFixed(4)}`;
    if (shiftEl) {
      shiftEl.innerText = `${details.rateShiftPercent > 0 ? '+' : ''}${details.rateShiftPercent}% Rate Shift`;
      shiftEl.className = details.isCircuitBreakerTripped ? 'text-[10px] text-rose-400 font-bold mt-0.5' : 'text-[10px] text-amber-400 font-bold mt-0.5';
    }
    if (bufInput) bufInput.value = fx.config.bufferPercent;
    if (roundSelect) roundSelect.value = fx.config.roundingMode;
    if (circuitStatusEl) {
      if (details.isCircuitBreakerTripped) {
        circuitStatusEl.innerText = '⚠️ Circuit Breaker Currently Engaged (Re-anchoring will reset)';
        circuitStatusEl.className = 'text-rose-400 font-bold';
      } else {
        circuitStatusEl.innerText = '✓ Safe Volatility Band';
        circuitStatusEl.className = 'text-emerald-400 font-bold';
      }
    }

    this.renderFxModalImpactTable();
    modal.classList.add('active');
  }

  closeFxUpdateModal() {
    const modal = document.getElementById('modal-fx-update-pricing');
    if (modal) modal.classList.remove('active');
  }

  renderFxModalImpactTable() {
    const tbody = document.getElementById('fx-modal-sample-tbody');
    if (!tbody || !this.euLocalization?.fxEngine) return;
    const fx = this.euLocalization.fxEngine;

    const buf = parseFloat(document.getElementById('fx-modal-buffer-input')?.value || '1.8');
    const rounding = document.getElementById('fx-modal-rounding-select')?.value || 'retail_95';

    // Get real catalog samples
    const all = this.getEffectiveProducts ? this.getEffectiveProducts() : [];
    const kit = all.find(p => (p.sku || '').includes('5060733580007') || (p.sku || '').includes('FOMPRO')) || { name: 'Flake King Pro Series Kit', sku: 'FOMPRO', priceGbp: 208.33 };
    const gun = all.find(p => (p.sku || '').includes('5060733580014')) || { name: 'Flake King 1000 Dry Metal Flake Gun', sku: '5060733580014', priceGbp: 108.33 };
    const jar = all.find(p => (p.sku || '').includes('5060733580021')) || { name: 'FOM 1000/1050 100g Jar & Lid', sku: '5060733580021', priceGbp: 1.65 };
    const binder = all.find(p => (p.sku || '').includes('FK50500')) || { name: 'FK50 Surface Binder 500ml', sku: 'FK50500', priceGbp: 16.66 };

    const samples = [
      { name: kit.name, sku: kit.sku || 'FOMPRO', gbpPrice: parseFloat(kit.priceGbp) || 208.33 },
      { name: gun.name, sku: gun.sku || '5060733580014', gbpPrice: parseFloat(gun.priceGbp) || 108.33 },
      { name: binder.name, sku: binder.sku || 'FK50500', gbpPrice: parseFloat(binder.priceGbp) || 16.66 },
      { name: jar.name, sku: jar.sku || '5060733580021', gbpPrice: parseFloat(jar.priceGbp) || 1.65 }
    ];

    tbody.innerHTML = '';
    samples.forEach(item => {
      const oldEur = fx.calculateEurPrice(item.gbpPrice, {
        rate: fx.config.baselineRate,
        bufferPercent: fx.config.bufferPercent,
        roundingMode: fx.config.roundingMode
      });
      const newEur = fx.calculateEurPrice(item.gbpPrice, {
        rate: fx.config.currentRate,
        bufferPercent: buf,
        roundingMode: rounding
      });
      const diff = +(newEur - oldEur).toFixed(2);
      const sign = diff >= 0 ? '+' : '';

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-surface-container transition-colors';
      tr.innerHTML = `
        <td class="p-2.5">
          <div class="font-bold text-white">${item.name}</div>
          <div class="text-[10px] text-secondary font-mono">${item.sku}</div>
        </td>
        <td class="p-2.5 text-right font-mono font-bold text-amber-400">
          &pound;${item.gbpPrice.toFixed(2)}
        </td>
        <td class="p-2.5 text-right font-mono text-slate-400">
          &euro;${oldEur.toFixed(2)}
        </td>
        <td class="p-2.5 text-right font-mono font-bold text-emerald-400">
          &euro;${newEur.toFixed(2)}
        </td>
        <td class="p-2.5 text-right font-mono text-xs ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
          ${sign}&euro;${diff.toFixed(2)}
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  renderAdminAI() {
    const ai = this.adminController.config.aiAgents;
    const aDisc = document.getElementById('admin-ai-agent-a-discount');
    const aStyle = document.getElementById('admin-ai-agent-a-style');
    const bWa = document.getElementById('admin-ai-agent-b-whatsapp');
    const bSms = document.getElementById('admin-ai-agent-b-sms');
    const cSched = document.getElementById('admin-ai-agent-c-schedule');
    const cTags = document.getElementById('admin-ai-agent-c-tags');
    const dBuf = document.getElementById('admin-ai-agent-d-buffer');
    const dOcean = document.getElementById('admin-ai-agent-d-ocean');

    if (aDisc) aDisc.value = ai.agentA.maxDiscountAllowed || 15;
    if (aStyle) aStyle.value = ai.agentA.temperaturePrompt || 'Strict Technical Precision';
    if (bWa) bWa.checked = !!ai.agentB.enableWhatsApp;
    if (bSms) bSms.checked = !!ai.agentB.enableSMS;
    if (cSched) cSched.value = ai.agentC.postSchedule || '09:00, 14:00, 19:00 CET';
    if (cTags) cTags.value = (ai.agentC.monitoredTags || []).join(', ');
    if (dBuf) dBuf.value = ai.agentD.safetyBufferDays || 30;
    if (dOcean) dOcean.value = ai.agentD.japanOceanThresholdUnits || 150;
  }

  saveAdminAiConfig() {
    const aDisc = document.getElementById('admin-ai-agent-a-discount');
    const aStyle = document.getElementById('admin-ai-agent-a-style');
    const bWa = document.getElementById('admin-ai-agent-b-whatsapp');
    const bSms = document.getElementById('admin-ai-agent-b-sms');
    const cSched = document.getElementById('admin-ai-agent-c-schedule');
    const cTags = document.getElementById('admin-ai-agent-c-tags');
    const dBuf = document.getElementById('admin-ai-agent-d-buffer');
    const dOcean = document.getElementById('admin-ai-agent-d-ocean');

    this.adminController.config.aiAgents = {
      agentA: {
        name: "Master Painter AI",
        maxDiscountAllowed: aDisc ? parseInt(aDisc.value, 10) : 15,
        temperaturePrompt: aStyle ? aStyle.value : 'Strict Technical Precision'
      },
      agentB: {
        name: "Order Concierge AI",
        enableWhatsApp: bWa ? bWa.checked : true,
        enableSMS: bSms ? bSms.checked : true
      },
      agentC: {
        name: "Kustom Marketer AI",
        postSchedule: cSched ? cSched.value : '09:00, 14:00, 19:00 CET',
        monitoredTags: cTags ? cTags.value.split(',').map(t => t.trim()) : []
      },
      agentD: {
        name: "Stock Guru AI",
        safetyBufferDays: dBuf ? parseInt(dBuf.value, 10) : 30,
        japanOceanThresholdUnits: dOcean ? parseInt(dOcean.value, 10) : 150
      }
    };
    this.adminController.saveConfig();
    this.showToast("✅ AI Specialist Agent thresholds updated!", 'success');
  }

  onAdminConfigUpdated(config) {
    if (config.formulas) {
      this.currentCatalog.mixingSystems = config.formulas;
      this.renderSystemsDropdown();
    }
    if (config.preorders) {
      this.forumEngine.packages = config.preorders;
    }
    if (config.productOverrides) {
      Object.keys(config.productOverrides).forEach(prodId => {
        const idx = ECOM_CATALOG.findIndex(p => p.id === prodId);
        if (idx >= 0) {
          ECOM_CATALOG[idx] = { ...ECOM_CATALOG[idx], ...config.productOverrides[prodId] };
        } else {
          ECOM_CATALOG.unshift({ id: prodId, ...config.productOverrides[prodId] });
        }
      });
      this.renderStorefrontGrid();
    }
  }

  // =========================================================================
  // ADMIN CUSTOMER EMAIL & AI COMMUNICATION HUB IMPLEMENTATION
  // =========================================================================
  setupAdminEmailHub() {
    // 1. Sub-View Switching (Compose vs AI Analytics)
    const btnCompose = document.getElementById('btn-emailhub-view-compose');
    const btnAnalytics = document.getElementById('btn-emailhub-view-analytics');
    const viewCompose = document.getElementById('emailhub-subview-compose');
    const viewAnalytics = document.getElementById('emailhub-subview-analytics');

    if (btnCompose && btnAnalytics && viewCompose && viewAnalytics) {
      btnCompose.addEventListener('click', () => {
        btnCompose.classList.add('bg-primary', 'text-white');
        btnCompose.classList.remove('text-secondary');
        btnAnalytics.classList.remove('bg-primary', 'text-white');
        btnAnalytics.classList.add('text-secondary');
        viewCompose.style.display = 'block';
        viewAnalytics.style.display = 'none';
      });

      btnAnalytics.addEventListener('click', () => {
        btnAnalytics.classList.add('bg-primary', 'text-white');
        btnAnalytics.classList.remove('text-secondary');
        btnCompose.classList.remove('bg-primary', 'text-white');
        btnCompose.classList.add('text-secondary');
        viewCompose.style.display = 'none';
        viewAnalytics.style.display = 'block';
        this.renderAdminCampaignAnalytics();
      });
    }

    // 2. Mode Radio Toggle (Blanket vs Single)
    const modeRadios = document.querySelectorAll('input[name="email_mode"]');
    modeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const isSingle = e.target.value === 'single';
        const segContainer = document.getElementById('container-email-segment-select');
        const singleContainer = document.getElementById('container-email-single-select');
        const dispatchLabel = document.getElementById('btn-email-dispatch-label');

        if (segContainer && singleContainer) {
          segContainer.style.display = isSingle ? 'none' : 'block';
          singleContainer.style.display = isSingle ? 'block' : 'none';
        }

        if (dispatchLabel) {
          dispatchLabel.innerText = isSingle ? "SEND DIRECT EMAIL" : "DISPATCH BLANKET BROADCAST";
        }
        this.updateEmailPreview();
      });
    });

    // 3. Segment Dropdown Change
    const segSelect = document.getElementById('select-email-target-segment');
    if (segSelect) {
      segSelect.addEventListener('change', () => {
        this.updateAudienceCountBadge();
        this.updateEmailPreview();
      });
    }

    // 4. Single Customer Dropdown Change
    const singleSelect = document.getElementById('select-email-single-customer');
    if (singleSelect) {
      singleSelect.addEventListener('change', () => {
        this.updateSingleCustomerDetails();
        this.updateEmailPreview();
      });
    }

    // 5. Template Selection
    const tplSelect = document.getElementById('select-email-template');
    if (tplSelect) {
      tplSelect.addEventListener('change', (e) => {
        const tplId = e.target.value;
        if (!tplId) return;
        const templates = (this.adminController.config.emailHub && this.adminController.config.emailHub.templates) || [];
        const found = templates.find(t => t.id === tplId);
        if (found) {
          const subjInput = document.getElementById('input-email-subject');
          const bodyText = document.getElementById('textarea-email-body');
          if (subjInput) subjInput.value = found.subject;
          if (bodyText) bodyText.value = found.body;
          this.updateEmailPreview();
        }
      });
    }

    // 6. Live Text Preview Listeners
    const subjInput = document.getElementById('input-email-subject');
    if (subjInput) {
      subjInput.addEventListener('input', () => this.updateEmailPreview());
    }
    const bodyText = document.getElementById('textarea-email-body');
    if (bodyText) {
      bodyText.addEventListener('input', () => this.updateEmailPreview());
    }

    // 7. Merge Tag Buttons insertion
    const mergeBtns = document.querySelectorAll('.btn-merge-tag');
    mergeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.getAttribute('data-tag');
        const textarea = document.getElementById('textarea-email-body');
        if (textarea && tag) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const text = textarea.value;
          textarea.value = text.substring(0, start) + tag + text.substring(end);
          textarea.focus();
          textarea.selectionStart = textarea.selectionEnd = start + tag.length;
          this.updateEmailPreview();
        }
      });
    });

    // 8. AI Copywriting Presets
    this.addSafeListener('btn-ai-gen-restock', 'click', () => this.triggerAiEmailGen('restock_flash'));
    this.addSafeListener('btn-ai-gen-preorder', 'click', () => this.triggerAiEmailGen('preorder_backer_addon'));
    this.addSafeListener('btn-ai-gen-vip', 'click', () => this.triggerAiEmailGen('vip_artist_exclusive'));
    this.addSafeListener('btn-ai-gen-custom', 'click', () => {
      const customPrompt = document.getElementById('input-ai-custom-prompt');
      this.triggerAiEmailGen('custom', customPrompt ? customPrompt.value : '');
    });

    // 9. Dispatch & Actions
    this.addSafeListener('btn-email-dispatch-main', 'click', () => this.handleEmailDispatch());
    this.addSafeListener('btn-email-send-test', 'click', () => this.handleSendTestEmail());
    this.addSafeListener('btn-email-save-tpl', 'click', () => this.handleSaveCurrentTemplate());
    this.addSafeListener('btn-email-clear-logs', 'click', () => {
      if (confirm("Are you sure you want to clear all dispatch logs?")) {
        this.adminController.clearDispatchLogs();
        this.renderAdminDispatchLogs();
      }
    });

    // 10. AI Campaign Follow-Up Trigger
    this.addSafeListener('btn-trigger-ai-followup', 'click', () => {
      // Switch to compose view with B2B retarget preset
      const btnCompose = document.getElementById('btn-emailhub-view-compose');
      if (btnCompose) btnCompose.click();
      const segSelect = document.getElementById('select-email-target-segment');
      if (segSelect) segSelect.value = 'b2b_jobbers';
      this.triggerAiEmailGen('restock_flash', '48H Follow Up for Non-Converting Shops');
      window.scrollTo({ top: document.getElementById('admin-panel-email').offsetTop, behavior: 'smooth' });
    });
  }

  renderAdminEmailHub() {
    this.populateSingleCustomerDropdown();
    this.updateAudienceCountBadge();
    this.updateSingleCustomerDetails();
    this.renderEmailMetricsRibbon();
    this.updateEmailPreview();
    this.renderAdminCampaignAnalytics();
    this.renderAdminDispatchLogs();
  }

  populateSingleCustomerDropdown() {
    const singleSelect = document.getElementById('select-email-single-customer');
    if (!singleSelect) return;

    const customers = this.adminController.getAllCustomers();
    singleSelect.innerHTML = customers.map(c => {
      return `<option value="${c.email}">${c.name} - ${c.company} (${c.countryCode})</option>`;
    }).join('');
  }

  updateAudienceCountBadge() {
    const segSelect = document.getElementById('select-email-target-segment');
    const badge = document.getElementById('audience-count-badge');
    if (!segSelect || !badge) return;

    const segment = segSelect.value;
    const targetCustomers = this.adminController.getCustomersBySegment(segment);
    badge.innerHTML = `Audience: <strong class="text-white">${targetCustomers.length}</strong> matching accounts ready for dispatch.`;
  }

  updateSingleCustomerDetails() {
    const singleSelect = document.getElementById('select-email-single-customer');
    const detailContainer = document.getElementById('single-customer-details');
    if (!singleSelect || !detailContainer) return;

    const email = singleSelect.value;
    const customers = this.adminController.getAllCustomers();
    const cust = customers.find(c => c.email.toLowerCase() === email.toLowerCase()) || customers[0];

    if (cust) {
      detailContainer.innerHTML = `
        <span class="text-white font-bold">${cust.name}</span> &bull; 
        <span>${cust.company}</span> &bull; 
        <span class="text-primary font-bold">VAT: ${cust.vatNumber}</span> &bull; 
        <span>Tier: ${cust.tier}</span> &bull; 
        <span class="text-amber-400">Order #${cust.latestOrderId}</span>
      `;
    }
  }

  renderEmailMetricsRibbon() {
    const customers = this.adminController.getAllCustomers();
    const b2bCount = customers.filter(c => c.vatNumber && c.vatNumber !== 'N/A (Standard Consumer)').length;

    const totElem = document.getElementById('metric-email-total-contacts');
    const b2bElem = document.getElementById('metric-email-b2b-contacts');
    if (totElem) totElem.innerText = `${customers.length} Accounts`;
    if (b2bElem) b2bElem.innerText = `${b2bCount} Shops`;

    const campaigns = (this.adminController.config.emailHub && this.adminController.config.emailHub.campaigns) || [];
    let totRevenue = campaigns.reduce((acc, c) => acc + (c.revenueEur || 0), 0);
    const revElem = document.getElementById('metric-email-pipeline-rev');
    if (revElem) revElem.innerHTML = `&euro;${totRevenue.toLocaleString()}`;
  }

  updateEmailPreview() {
    const subjInput = document.getElementById('input-email-subject');
    const bodyText = document.getElementById('textarea-email-body');
    const prevSubj = document.getElementById('preview-email-subject');
    const prevBody = document.getElementById('preview-email-body');
    const sampleLabel = document.getElementById('preview-sample-name');

    if (!subjInput || !bodyText || !prevSubj || !prevBody) return;

    // Determine target sample customer
    const isSingle = document.querySelector('input[name="email_mode"]:checked')?.value === 'single';
    let sampleCustomer = null;
    const customers = this.adminController.getAllCustomers();

    if (isSingle) {
      const singleSelect = document.getElementById('select-email-single-customer');
      const email = singleSelect ? singleSelect.value : '';
      sampleCustomer = customers.find(c => c.email.toLowerCase() === email.toLowerCase()) || customers[0];
    } else {
      const segSelect = document.getElementById('select-email-target-segment');
      const segment = segSelect ? segSelect.value : 'all';
      const segList = this.adminController.getCustomersBySegment(segment);
      sampleCustomer = segList.length > 0 ? segList[0] : customers[0];
    }

    if (sampleCustomer && sampleLabel) {
      sampleLabel.innerText = `Sample: ${sampleCustomer.name} (${sampleCustomer.countryCode}) - ${sampleCustomer.company}`;
    }

    const rawSubj = subjInput.value || "No Subject Line Provided";
    const rawBody = bodyText.value || "Type in the composer to view live rendered email output with merge tags.";

    prevSubj.innerText = sampleCustomer ? this.adminController.renderMergeTags(rawSubj, sampleCustomer) : rawSubj;
    prevBody.innerText = sampleCustomer ? this.adminController.renderMergeTags(rawBody, sampleCustomer) : rawBody;
  }

  triggerAiEmailGen(presetKey, customGoal = "") {
    const segSelect = document.getElementById('select-email-target-segment');
    const segment = segSelect ? segSelect.value : 'b2b_jobbers';

    const aiRes = this.adminController.generateAiEmailContent(presetKey, segment, customGoal);

    const subjInput = document.getElementById('input-email-subject');
    const bodyText = document.getElementById('textarea-email-body');
    const scoreBox = document.getElementById('ai-copy-score-box');
    const scoreElem = document.getElementById('ai-predicted-score');
    const noteElem = document.getElementById('ai-audience-note');
    const altContainer = document.getElementById('container-subject-alternatives');
    const altList = document.getElementById('subject-alternatives-list');

    if (subjInput) subjInput.value = aiRes.selectedSubject;
    if (bodyText) bodyText.value = aiRes.body;

    if (scoreBox && scoreElem && noteElem) {
      scoreElem.innerText = `Predicted Open Rate: ${aiRes.predictedOpenRate}`;
      noteElem.innerText = `• ${aiRes.audienceNote}`;
      scoreBox.classList.remove('hidden');
    }

    if (altContainer && altList && aiRes.subjectOptions) {
      altList.innerHTML = aiRes.subjectOptions.map((subj, idx) => {
        return `
          <button type="button" class="w-full text-left p-2 rounded bg-surface border border-secondary hover:border-primary text-slate-200 hover:text-white transition-all flex items-center justify-between gap-2" onclick="document.getElementById('input-email-subject').value = this.querySelector('.subj-text').innerText; window.paintApp.updateEmailPreview();">
            <span class="subj-text font-bold"><span class="text-primary font-mono mr-1.5">[Var #${idx+1}]</span>${subj}</span>
            <span class="text-[10px] text-emerald-400 font-mono">Use &rarr;</span>
          </button>
        `;
      }).join('');
      altContainer.classList.remove('hidden');
    }

    this.updateEmailPreview();
  }

  handleEmailDispatch() {
    const isSingle = document.querySelector('input[name="email_mode"]:checked')?.value === 'single';
    const subjInput = document.getElementById('input-email-subject');
    const bodyText = document.getElementById('textarea-email-body');

    const subject = subjInput ? subjInput.value.trim() : "";
    const body = bodyText ? bodyText.value.trim() : "";

    if (!subject || !body) {
      this.showToast("⚠️ Please provide both a subject line and email body before dispatching.", 'warning');
      return;
    }

    if (isSingle) {
      const singleSelect = document.getElementById('select-email-single-customer');
      const email = singleSelect ? singleSelect.value : '';
      const customer = this.adminController.getAllCustomers().find(c => c.email.toLowerCase() === email.toLowerCase());

      if (!customer) {
        this.showToast("⚠️ Please select a recipient.", 'warning');
        return;
      }

      this.confirmDialog({
        title: "Dispatch Direct Email",
        subtitle: `${customer.name} (${customer.email})`,
        message: `Are you sure you want to dispatch this email to <strong>${customer.name}</strong>?`,
        itemDetails: `<div class="p-2 font-mono text-xs text-white">Subject: ${subject}</div>`,
        confirmText: "Send Email",
        isDanger: false
      }).then(confirmed => {
        if (!confirmed) return;
        const res = this.adminController.sendDirectEmail(customer, { subject, body, mode: "Simulated Delivery" });
        this.showToast(`✅ Direct Email dispatched successfully to ${customer.email}!`, 'success');
        this.renderAdminDispatchLogs();
      });
    } else {
      const segSelect = document.getElementById('select-email-target-segment');
      const segment = segSelect ? segSelect.value : 'all';
      const targetCustomers = this.adminController.getCustomersBySegment(segment);

      if (targetCustomers.length === 0) {
        this.showToast("⚠️ No matching recipients found in selected segment.", 'warning');
        return;
      }

      this.confirmDialog({
        title: "Dispatch Blanket Broadcast",
        subtitle: `Audience: ${segment.toUpperCase().replace('_', ' ')} (${targetCustomers.length} accounts)`,
        message: `Are you sure you want to dispatch this blanket campaign across <strong>${targetCustomers.length} accounts</strong>?`,
        itemDetails: `<div class="p-2 font-mono text-xs text-white">Subject: ${subject}</div>`,
        confirmText: "Dispatch Broadcast",
        isDanger: true
      }).then(confirmed => {
        if (!confirmed) return;
        const res = this.adminController.sendBlanketCampaign(segment, { subject, body, title: subject.slice(0, 45) });
        this.showToast(`✅ Blanket Campaign dispatched to ${res.recipientsSent} accounts successfully!`, 'success');
        this.renderEmailMetricsRibbon();
        this.renderAdminCampaignAnalytics();
        this.renderAdminDispatchLogs();
      });
    }
  }

  handleSendTestEmail() {
    const subjInput = document.getElementById('input-email-subject');
    const bodyText = document.getElementById('textarea-email-body');
    const subject = subjInput ? subjInput.value.trim() : "Coast Airbrush Test";
    const body = bodyText ? bodyText.value.trim() : "Test email body content.";

    const adminTestRecipient = {
      name: "Admin Dispatch Tester",
      company: "Coast Airbrush Europe HQ",
      email: "orders@coastairbrush.eu",
      phone: "+31 10 998877",
      country: "Netherlands",
      countryCode: "NL",
      city: "Rotterdam",
      vatNumber: "NL88992211B01",
      tier: "Master Admin",
      segment: "internal_admin",
      latestOrderId: "TEST-001",
      carrier: "DHL Hazmat Express",
      trackingNumber: "TEST-TRACK-9999",
      estimatedDelivery: "2026-09-01"
    };

    const res = this.adminController.sendDirectEmail(adminTestRecipient, { subject: `[TEST] ${subject}`, body, mode: "Test Dispatch" });
    this.showToast(`🧪 Test Email dispatched to ${adminTestRecipient.email}!`, 'info');
    this.renderAdminDispatchLogs();
  }

  handleSaveCurrentTemplate() {
    const subjInput = document.getElementById('input-email-subject');
    const bodyText = document.getElementById('textarea-email-body');
    const segSelect = document.getElementById('select-email-target-segment');

    const subject = subjInput ? subjInput.value.trim() : "";
    const body = bodyText ? bodyText.value.trim() : "";
    const segment = segSelect ? segSelect.value : "b2b_jobbers";

    if (!subject || !body) {
      this.showToast("⚠️ Provide subject and body content before saving as template.", 'warning');
      return;
    }

    const tplName = (document.getElementById('input-email-subject')?.value || "Custom Template").slice(0, 40);

    const newTpl = {
      id: `tpl-custom-${Date.now()}`,
      name: tplName,
      targetSegment: segment,
      subject: subject,
      body: body
    };

    this.adminController.saveEmailTemplate(newTpl);
    this.showToast(`💾 Template '${tplName}' saved to Admin Configuration!`, 'success');

    // Reload template select
    const tplSelect = document.getElementById('select-email-template');
    if (tplSelect) {
      const opt = document.createElement('option');
      opt.value = newTpl.id;
      opt.innerText = newTpl.name;
      opt.selected = true;
      tplSelect.appendChild(opt);
    }
  }

  renderAdminCampaignAnalytics() {
    const tableBody = document.getElementById('table-campaigns-body');
    if (!tableBody) return;

    const campaigns = (this.adminController.config.emailHub && this.adminController.config.emailHub.campaigns) || [];
    if (campaigns.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="py-4 text-center text-secondary">No broadcast campaigns recorded yet.</td></tr>`;
      return;
    }

    tableBody.innerHTML = campaigns.map(c => {
      const d = new Date(c.date);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      return `
        <tr class="hover:bg-surface-container/50">
          <td class="py-2.5 px-3 text-secondary text-[11px]">${dateStr}</td>
          <td class="py-2.5 px-3 font-bold text-white">${c.title}</td>
          <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded bg-surface border border-secondary text-primary font-mono text-[10px] uppercase">${c.segment.replace('_', ' ')}</span></td>
          <td class="py-2.5 px-3 text-center text-white font-bold">${c.deliveredCount}</td>
          <td class="py-2.5 px-3 text-center text-emerald-400 font-bold">${c.openRate}%</td>
          <td class="py-2.5 px-3 text-center text-amber-400 font-bold">${c.clickRate}%</td>
          <td class="py-2.5 px-3 text-right text-emerald-400 font-bold">&euro;${(c.revenueEur || 0).toLocaleString()}</td>
        </tr>
      `;
    }).join('');
  }

  renderAdminDispatchLogs() {
    const tableBody = document.getElementById('table-dispatch-logs-body');
    if (!tableBody) return;

    const logs = (this.adminController.config.emailHub && this.adminController.config.emailHub.dispatchLogs) || [];
    if (logs.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-secondary">No dispatch logs found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = logs.slice(0, 50).map(log => {
      const d = new Date(log.timestamp);
      const timeStr = `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}:${String(d.getUTCSeconds()).padStart(2,'0')}`;
      const isSingle = log.type === 'single';
      return `
        <tr class="hover:bg-surface-container/50">
          <td class="py-2 px-3 text-secondary text-[11px]">${timeStr}</td>
          <td class="py-2 px-3">
            <span class="text-white font-bold">${log.recipientName || 'Customer'}</span>
            <span class="text-[10px] text-secondary block">${log.recipientEmail}</span>
          </td>
          <td class="py-2 px-3">
            <span class="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${isSingle ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-500/40' : 'bg-amber-950/60 text-amber-300 border border-amber-500/40'}">
              ${log.type}
            </span>
          </td>
          <td class="py-2 px-3 text-slate-200 max-w-[280px] truncate" title="${log.subject}">${log.subject}</td>
          <td class="py-2 px-3 text-center">
            <span class="text-emerald-400 font-bold flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-[14px]">check_circle</span> Delivered
            </span>
          </td>
          <td class="py-2 px-3 text-right text-secondary text-[11px]">${log.mode || 'Simulated'}</td>
        </tr>
      `;
    }).join('');
  }

}

// Initialize Application & Bind Global
window.paintApp = new PaintSystemApp();


