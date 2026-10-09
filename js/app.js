// Coast Airbrush Europe - Master Storefront & Mixing System Controller
import { KROMA_EDGE_CATALOG } from '../data/kroma_edge.js';
import { ECOM_CATALOG } from '../data/full_ecom_catalog.js';
import { FLAKE_KING_MIXING_SYSTEMS } from '../data/flake_king_tds.js';
import { ShopifyCartManager } from './shopifyCart.js';
import { EULocalizationManager } from './euLocalization.js';
import { I18nManager } from './i18n.js';
import { MasterPainterAI } from './agentA.js';
import { OrderConciergeAI } from './agentB.js';
import { SocialGrowthAI } from './agentC.js';
import { InventoryGuruAI } from './agentD.js';
import { ForumPreorderEngine } from './forumPreorderEngine.js';
import { AdminController } from './adminController.js?v=20260908d';
import { HeroCanvasEnhancer } from './features/heroCanvasEnhancer.js';
import { MarketingEmailHub } from './features/marketingEmailHub.js';
import { BrandsShowcase } from './features/brandsShowcase.js';
import { BundleConfigurator } from './features/bundleConfigurator.js';
import { ProductMatrixModal } from './features/productMatrixModal.js';
import { SpreadsheetEditor } from './features/spreadsheet/spreadsheetEditor.js';
import { QuickMixModal } from './features/quickMixModal.js';
import { ProjectEstimator } from './features/projectEstimator.js';
import { CartDrawerUI } from './features/cartDrawerUI.js';
import { GeminiModal } from './features/adminOperations/geminiModal.js';
import { AdminHardwareHazmat } from './features/adminOperations/adminHardwareHazmat.js';
import { AdminFxEngineUI } from './features/adminOperations/adminFxEngineUI.js';
import { AdminAiSpecialists } from './features/adminOperations/adminAiSpecialists.js';
import { ProductDetailModal } from './features/productDetailModal.js';
import { TradePortalModal } from './features/tradePortalModal.js';
import { DepartmentViews } from './features/departmentViews.js';
import { AdminFormulasPreorders } from './admin/adminFormulasPreorders.js';
import { AdminTaxonomyUI } from './admin/adminTaxonomyUI.js';
import { AdminProductUI } from './admin/adminProductUI.js';
import { AdminAuthUI } from './admin/adminAuthUI.js';
import { StorefrontAiAgentsUI } from './features/storefrontAiAgentsUI.js';
import { StorefrontGridUI } from './features/storefrontGridUI.js';
import { StorefrontFiltersUI } from './features/storefrontFiltersUI.js';
import { HeroEditorUI } from './features/heroEditorUI.js';
import { MixingScaleUI } from './features/mixingScaleUI.js';
import { TdsSafetyUI } from './features/tdsSafetyUI.js';
import { OnboardingHeroUI } from './features/onboardingHeroUI.js';
import { DialogsUI } from './features/dialogsUI.js';
import { ForumPreorderUI } from './features/forumPreorderUI.js';
import { NavigationTabsUI } from './features/navigationTabsUI.js';
import { EuLocalizationUI } from './features/euLocalizationUI.js';
import { StorefrontShowcaseUI } from './features/storefrontShowcaseUI.js';
import { bindGlobalWindowActions } from './features/globalWindowBindings.js';
import { setupStorefrontDOMListeners } from './features/storefrontDOMListeners.js';
import { registerAppDelegators } from './features/appDelegators.js';

// Asset URL resolution helper for Shopify CDN and Local Development
export function getAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//') || path.startsWith('data:')) {
    return path;
  }
  let filename = path.split('/').pop().split('?')[0];
  if (path.includes('Cleaned Skull Image') || filename.includes('Cleaned Skull Image')) {
    filename = 'kroma-skull-mirror.jpg';
  }
  
  const assetRoot = typeof window !== 'undefined' && window.SHOPIFY_ASSET_URL_ROOT;
  const fileRoot = typeof window !== 'undefined' && window.SHOPIFY_FILE_URL_ROOT;

  // Core theme branding, icons, and hero cockpit imagery live in the Shopify theme assets directory
  const themeAssets = [
    'coast_logo_white.png',
    'coast_logo_black.png',
    'coast_logo_red.png',
    'coast_airbrush_logo.jpg',
    'favicon.svg',
    'favicon.ico',
    'apple-touch-icon.png',
    'icon-192.png',
    'icon-512.png',
    'coast-storefront-bundle.js',
    'styles.css',
    'full_ecom_catalog.js',
    'kroma-skull-studio-dark.jpg',
    'kroma-detail-skull.jpg',
    'flake-buggy-studio.jpg',
    'flake_buggy_hero.jpg',
    'fk100-prime-black-base.jpg',
    'flake-king-orange-mixed-set.jpg',
    'kroma-helmet-mirror.jpg',
    'kroma-detail-helmet.jpg'
  ];

  if (themeAssets.includes(filename)) {
    if (assetRoot) return assetRoot + filename;
    return path;
  }

  // All product photography, swatch cards, charts, and technical PDFs live on Shopify Files CDN
  if (fileRoot) {
    return fileRoot + filename;
  }
  if (assetRoot) {
    return assetRoot + filename;
  }
  return path;
}

if (typeof window !== 'undefined') {
  window.getAssetUrl = getAssetUrl;
  window.onProductVariantChange = (prodId, key, val) => {
    if (window.paintApp && typeof window.paintApp.onProductVariantChange === 'function') {
      window.paintApp.onProductVariantChange(prodId, key, val);
    }
  };
  window.renderCategoryPills = () => {
    if (window.paintApp && typeof window.paintApp.renderCategoryPills === 'function') {
      window.paintApp.renderCategoryPills();
    }
  };
}

class PaintSystemApp {
  constructor() {
    window.paintApp = this;
    window.app = this;
    this.storefrontFiltersUI = new StorefrontFiltersUI(this);
    this.syncShopifyCatalog();
    this.adminController = new AdminController(this);
    this.heroEditorUI = new HeroEditorUI(this);
    this.heroCanvasEnhancer = new HeroCanvasEnhancer(this);
    this.marketingEmailHub = new MarketingEmailHub(this);
    this.brandsShowcase = new BrandsShowcase(this);
    this.bundleConfigurator = new BundleConfigurator(this);
    this.productMatrixModal = new ProductMatrixModal(this);
    this.spreadsheetEditor = new SpreadsheetEditor(this);
    this.spreadsheetState = this.spreadsheetEditor.state;
    this.mixingScaleUI = new MixingScaleUI(this);
    this.quickMixModal = new QuickMixModal(this);
    this.projectEstimator = new ProjectEstimator(this);
    this.cartDrawerUI = new CartDrawerUI(this);
    this.geminiModal = new GeminiModal(this);
    this.adminHardwareHazmat = new AdminHardwareHazmat(this);
    this.adminFxEngineUI = new AdminFxEngineUI(this);
    this.adminAiSpecialists = new AdminAiSpecialists(this);
    this.productDetailModal = new ProductDetailModal(this);
    this.tradePortalModal = new TradePortalModal(this);
    this.departmentViews = new DepartmentViews(this);
    this.adminFormulasPreorders = new AdminFormulasPreorders(this);
    this.adminTaxonomyUI = new AdminTaxonomyUI(this);
    this.adminProductUI = new AdminProductUI(this);
    this.adminAuthUI = new AdminAuthUI(this);
    this.storefrontAiAgentsUI = new StorefrontAiAgentsUI(this);
    this.storefrontGridUI = new StorefrontGridUI(this);
    this.tdsSafetyUI = new TdsSafetyUI(this);
    this.onboardingHeroUI = new OnboardingHeroUI(this);
    this.dialogsUI = new DialogsUI(this);
    this.forumPreorderUI = new ForumPreorderUI(this);
    this.navigationTabsUI = new NavigationTabsUI(this);
    this.euLocalizationUI = new EuLocalizationUI(this);
    this.storefrontShowcaseUI = new StorefrontShowcaseUI(this);
    this.currentCatalog = JSON.parse(JSON.stringify(KROMA_EDGE_CATALOG));
    
    // Combine Admin custom formulas with Flake King Wet Spray formulas (Active Retail lines)
    const baseFormulas = (this.adminController.config.formulas || []).filter(f => !f.id.startsWith('s2_') && !f.id.startsWith('aos_'));
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
    const initialCountry = this.euLocalization.getCountry();
    if (initialCountry && initialCountry.currency) {
      this.shopifyCartManager.setCurrency(initialCountry.currency);
    }
    this.agentA = new MasterPainterAI(this.shopifyCartManager);
    this.agentB = new OrderConciergeAI();
    this.agentC = new SocialGrowthAI(this.shopifyCartManager);
    this.agentD = new InventoryGuruAI();
    this.forumEngine = new ForumPreorderEngine(this.shopifyCartManager);
    this.activeBrandFilter = 'all';
    this.activeCategoryFilter = 'all';
    this.activeFlakeSubcat = 'all';
    this.deptFlakeState = { subcat: 'all', viewMode: 'curated' };
    this.deptGunsState = { subcat: 'featured', viewMode: 'featured' };
    this.deptTapesState = { subcat: 'featured', viewMode: 'featured' };
    this.searchQuery = '';
    this.isB2BMode = false;
    this.b2bSession = null;
    this.b2bPricing = null;
    this.selectedProductVariants = {};
    this.selectedTrackingOrder = this.agentB.orders[0];
    this.selectedEvalSku = "KE-CHROME-1L";
    this.selectedEvalQty = 50;

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

    // Storefront Operational Mode: Live production storefront by default.
    // Review/staging mode can be explicitly previewed via URL parameter ?review=true or ?staging=true
    const urlParams = new URLSearchParams(window.location.search);
    this.reviewMode = urlParams.get('review') === 'true' || urlParams.get('staging') === 'true';

    this.initUI();
    this.renderCategoryPills();

    if (!this.reviewMode) {
      const reviewBanner = document.getElementById('stakeholder-review-banner');
      if (reviewBanner) reviewBanner.style.display = 'none';
    }
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

  getAssetUrl(path) { return getAssetUrl(path); }

  escapeHtmlAttr(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
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
    return this.dialogsUI.showToast(msg, type, duration);
  }

  confirmDialog(options = {}) {
    return this.dialogsUI.confirmDialog(options);
  }

  alertDialog(options = {}) {
    return this.dialogsUI.alertDialog(options);
  }

  initUI() {
    // Global Hero & UI Action Bindings (bound immediately so they are available without delay)
    bindGlobalWindowActions(this);

    // Initial Brand Showcase Rendering
    try { this.renderBrandsShowcase(); } catch (e) { console.warn('renderBrandsShowcase error:', e); }

    // Navigation Tabs Setup
    try { this.setupTabs(); } catch (e) { console.warn('setupTabs error:', e); }

    // Shop Filters & Search
    try { this.setupShopFilters(); } catch (e) { console.warn('setupShopFilters error:', e); }

    // Cart Drawer & Modals
    try { this.setupCartDrawer(); } catch (e) { console.warn('setupCartDrawer error:', e); }
    try { this.setupDetailModal(); } catch (e) { console.warn('setupDetailModal error:', e); }
    try { this.setupWelcomeModal(); } catch (e) { console.warn('setupWelcomeModal error:', e); }
    try { this.setupQuickMixModal(); } catch (e) { console.warn('setupQuickMixModal error:', e); }
    try { this.renderStorefrontHero(); } catch (e) { console.warn('renderStorefrontHero error:', e); }
    try { this.setupHeroCrossfade(); } catch (e) { console.warn('setupHeroCrossfade error:', e); }
    try { this.setupProjectEstimator(); } catch (e) { console.warn('setupProjectEstimator error:', e); }
    try { this.initSocialProofPulse(); } catch (e) { console.warn('initSocialProofPulse error:', e); }
    try { this.initReferralModal(); } catch (e) { console.warn('initReferralModal error:', e); }

    // Storefront DOM Event Listeners & Change Handlers
    setupStorefrontDOMListeners(this);

    // Initial sync of featured hero showcase cards with active localization & selection
    this.syncFeaturedShowcaseCards();

    // Auto-restore verified trade session if token is saved in localStorage
    this.restoreTradeSession();

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
    this.syncFeaturedShowcaseCards();
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

    if (window._pendingAdminLogin) {
      window._pendingAdminLogin = false;
      setTimeout(() => this.openAdminAuthModal(), 100);
    }
  }

  exportCSV() {
    this.shopifyCartManager.exportToCSV();
  }

  exportJSON() {
    this.shopifyCartManager.exportToJSON(this.currentRecipe);
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
    if (config.hero) {
      this.renderStorefrontHero();
      this.setupHeroCrossfade();
    }
  }
}

// Register all delegated sub-module methods to prototype
registerAppDelegators(PaintSystemApp.prototype);

// Initialize Application & Bind Global
window.paintApp = new PaintSystemApp();
