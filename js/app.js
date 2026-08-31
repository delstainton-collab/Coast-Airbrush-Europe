// Coast Airbrush Europe - Master Storefront & Mixing System Controller
import { KROMA_EDGE_CATALOG } from '../data/kroma_edge.js?v=20260831_clean';
import { ECOM_CATALOG } from '../data/full_ecom_catalog.js?v=20260831_clean';
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
    this.currentCatalog.mixingSystems = this.adminController.config.formulas;
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
    this.selectedProductVariants = {};
    this.selectedTrackingOrder = this.agentB.orders[0];
    this.selectedEvalSku = "KE-CHROME-1L";
    this.selectedEvalQty = 50;

    // Apply any saved Admin product overrides to runtime catalog
    const overrides = this.adminController.config.productOverrides || {};
    Object.keys(overrides).forEach(prodId => {
      const idx = ECOM_CATALOG.findIndex(p => p.id === prodId);
      if (idx >= 0) {
        ECOM_CATALOG[idx] = { ...ECOM_CATALOG[idx], ...overrides[prodId] };
      } else {
        ECOM_CATALOG.unshift({ id: prodId, ...overrides[prodId] });
      }
    });

    this.initUI();
  }

  addSafeListener(id, event, callback) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, callback);
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

    // Global Hero & UI Action Bindings
    window.paintApp = this;
    window.addKromaEdgeToCart = (prodId) => this.addProductToCartById(prodId);
    window.addKromaEdgeBundleToCart = () => this.addKromaEdgeBundleToCart();
    window.configureKromaEdgeInMixLab = () => this.configureKromaEdgeInMixLab();
    window.openDetailModal = (prodId) => this.openDetailModal(prodId);
    window.openQuickMixModal = (systemId) => this.openQuickMixModal(systemId);
    window.setCategoryAndScroll = (catId) => this.setCategoryAndScroll(catId);
    window.applyKromaPreset = (panelId) => this.applyKromaPreset(panelId);
    window.calcCustomKromaArea = (val) => this.calcCustomKromaArea(val);
    window.applyEstimatedVolumeToMix = () => this.applyEstimatedVolumeToMix();
    window.setMixVolumePreset = (vol, unit) => this.setMixVolumePreset(vol, unit);
    window.setQuickMixVolumePreset = (vol, unit) => this.setQuickMixVolumePreset(vol, unit);

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
        this.shopifyCartManager.addRecipeToShopifyCart(this.currentRecipe);
        this.openCartDrawer();
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

    // B2B Dealer Login
    this.addSafeListener('btn-b2b-login', 'click', () => this.toggleB2BMode());
    this.addSafeListener('btn-request-invite', 'click', () => {
      alert("⚡ Trade Invite Requested!\nOur European sales team will contact you with dealer credentials.");
    });

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

    // URL Query & Hash Deep Linking (e.g. ?search=Kroma or ?tab=preorders)
    this.handleUrlParameters();
  }

  handleUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    const tabParam = params.get('tab');
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

    const updateHeaderFromEU = () => {
      const country = this.euLocalization.getCountry();
      if (countrySelect) countrySelect.value = country.code;
      if (flagEl) flagEl.textContent = country.flag;
      if (speedText) speedText.textContent = `${country.flag} ${country.code}: ${country.leadTime.split(' ')[0]} ${country.carrier.split(' ')[0]}`;
      if (unitLabel) unitLabel.textContent = this.euLocalization.unitPreference === 'metric' ? 'METRIC (mL/g)' : 'IMPERIAL (oz/qt)';
      if (langSelect) langSelect.value = this.i18n.getLanguage();
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
      if (drawerCheckoutBtn) drawerCheckoutBtn.textContent = t('cart_checkout_btn');

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
    const tabIds = ['tab-storefront', 'tab-forum', 'tab-agent-a', 'tab-agent-b', 'tab-agent-c', 'tab-agent-d', 'tab-calculator', 'tab-scale', 'tab-admin'];
    const viewIds = ['view-storefront', 'view-forum', 'view-agent-a', 'view-agent-b', 'view-agent-c', 'view-agent-d', 'view-calculator', 'view-scale', 'view-admin'];

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
        alert("Please provide both a thread title and spray instructions.");
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
        const link = `https://shop.coastairbrush.eu/cart/add?id=${camp.featuredSku}&quantity=1`;
        navigator.clipboard?.writeText(link);
        alert(`⚡ Direct 1-Click Cart Link Copied to Clipboard!\n\n${link}`);
      });

      container.appendChild(card);
    });
  }

  setupAgentA() {
    const sendBtn = document.getElementById('btn-agent-send');
    const queryInput = document.getElementById('input-agent-query');
    const tempSelect = document.getElementById('agent-shop-temp');
    const msgContainer = document.getElementById('agent-chat-messages');

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

      let htmlBody = result.markdownResponse
        .replace(/^### (.*$)/gim, '<h3 style="color:#38bdf8; font-size:15px; margin:10px 0 4px 0;">$1</h3>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong style="color:#fff;">$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/`([^`]+)`/gim, '<code style="background:#0c0f0f; color:#ffb3ac; padding:2px 6px; border-radius:4px; font-family:monospace;">$1</code>')
        .replace(/^- (.*$)/gim, '<li style="margin-left:20px;">$1</li>');

      let actionButtons = '';
      if (result.kit) {
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

      let cleanHtml = res.markdownResponse
        .replace(/^### (.*$)/gim, '<h4 style="color:#ffb3ac; font-size:12px; font-weight:bold; margin:6px 0 2px 0;">$1</h4>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong style="color:#fff;">$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/`([^`]+)`/gim, '<code style="background:#0c0f0f; color:#38bdf8; padding:1px 4px; font-size:11px;">$1</code>')
        .replace(/^- (.*$)/gim, '<li style="margin-left:12px;">$1</li>');

      const daveBubble = document.createElement('div');
      daveBubble.className = 'bg-surface-container border-l-2 border-primary-container p-3 flex flex-col gap-2';
      daveBubble.innerHTML = `
        <div class="text-on-surface leading-relaxed text-xs">
          ${cleanHtml}
        </div>
        ${res.kit ? `
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
        alert(`Order "${term}" not found. Try demo orders: EU-10492, UK-88214, or EU-10505.`);
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
    if (catId === 'Corroded Metal FX') return product.category === 'Corroded Metal FX';
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
    const isKromaChrome = (prod.name || '').includes('Chrome') || prod.id === 'kroma-chrome-1l';
    const isKromaClear = (prod.name || '').includes('Clear') || prod.id === 'kroma-clearcoat-1l';
    const isKromaPrimer = (prod.name || '').includes('Primer') || prod.id === 'kroma-black-primer-1l';
    const isFlake = prod.category === 'Dry Metal Flake (Glitter)' || (prod.brand || '').includes('Flake King');

    let hazardSection = 'SECTION 2: HAZARDS IDENTIFICATION\nClassification: Flammable Liquid Category 2, Skin Irritant Category 2, Eye Irritation Category 2A, STOT SE 3.\nSignal Word: DANGER\nHazard Statements: H225 Highly flammable liquid and vapour. H315 Causes skin irritation. H319 Causes serious eye irritation. H336 May cause drowsiness or dizziness.\nPrecautionary Statements: P210 Keep away from heat, sparks, open flames. P280 Wear protective gloves, protective clothing, eye protection, respirator.';
    if (isFlake) {
      hazardSection = 'SECTION 2: HAZARDS IDENTIFICATION\nClassification: Non-Hazardous Polymer Dry Particle.\nSignal Word: WARNING (Nuisance Dust)\nHazard Statements: May cause mechanical eye or respiratory irritation.\nPrecautionary Statements: P261 Avoid breathing dust. P280 Wear P2/P3 dust respirator and protective goggles.';
    }

    const sdsText = `================================================================================
SAFETY DATA SHEET (SDS) - EUROPEAN REACH REGULATION (EC) No 1907/2006
COAST AIRBRUSH EUROPE & UK LOGISTICS HUB
================================================================================
PRODUCT IDENTIFIER:
Product Name: ${prod.name}
SKU / Part Number: ${prod.sku || prod.id || 'N/A'}
Brand: ${prod.brand || 'Coast Airbrush Master Series'}
Category: ${prod.category || 'Automotive Refinish Coating'}
Supplier: Coast Airbrush Europe Hub / UK Distribution
Emergency Contact: Europe Chemtrec +44 20 3807 3798 / 112

SECTION 1: RELEVANT IDENTIFIED USES & RESTRICTIONS
Use of Substance: Professional custom airbrushing, automotive refinishing, metal flake application.
REACH Status: 100% REACH Annex XVII Compliant & Zero SVHC (Substances of Very High Concern).
EU VOC Compliance: Directive 2004/42/EC Subcategory B(d) max 420 g/L.

${hazardSection}

SECTION 3: COMPOSITION & COMPONENT INFORMATION
- Binder Resins / Substrates: 40 - 65%
- Solvent Reduction System (Esters/Hydrocarbons): 20 - 45%
- Active Pigments / Metallic Seed Formula: 5 - 20%
- Specific Gravity: 0.85 - 1.15 @ 20°C

SECTION 4: FIRST AID MEASURES
Inhalation: Move subject to fresh air immediately. If breathing is irregular, administer oxygen.
Skin Contact: Wash affected area thoroughly with mild soap and water. Do not use thinners.
Eye Contact: Rinse immediately with copious amounts of clean water for at least 15 minutes.
Ingestion: Do NOT induce vomiting. Seek urgent medical attention.

SECTION 5: FIREFIGHTING & EXTINGUISHING MEDIA
Suitable Media: Carbon Dioxide (CO2), Dry Chemical Powder, Alcohol-Resistant Foam.
Unsuitable Media: Direct high-pressure water jet.

SECTION 6: SAFE HANDLING & STORAGE
Handling: Use spark-proof tools and explosion-proof spray booths. Ground all containers during transfer.
Storage: Store between 15°C - 25°C in tightly sealed original containers away from direct sunlight.
================================================================================
OFFICIAL DIRECTORY CERTIFIED - DISPATCH HUB: UNITED KINGDOM & DIRECT JAPAN/USA
================================================================================`;

    const blob = new Blob([sdsText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SDS_${(prod.sku || prod.id || 'PRODUCT').replace(/[^a-zA-Z0-9_-]/g, '_')}_REACH_EU.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  downloadTDS(prod) {
    if (!prod) return;
    const isKromaChrome = (prod.name || '').includes('Chrome') || prod.id === 'kroma-chrome-1l';
    const isKromaClear = (prod.name || '').includes('Clear') || prod.id === 'kroma-clearcoat-1l';
    const isKromaPrimer = (prod.name || '').includes('Primer') || prod.id === 'kroma-black-primer-1l';
    const isFlake = prod.category === 'Dry Metal Flake (Glitter)' || (prod.brand || '').includes('Flake King');

    let specificTechData = `APPLICATION SPECIFICATIONS:
- Recommended Spray Gun Tip: 1.2mm - 1.4mm HVLP (Paints) / Flake King 500/1000 Dry Gun (Flakes)
- Air Pressure: 1.2 - 1.5 Bar (18 - 22 PSI at gun inlet)
- Mixing Ratio (Standard): 3 : 1 : 2 (Base : Hardener : Reducer)
- Flash-off Between Coats: 10 - 15 Minutes at 20°C (68°F)
- Dust Free Time: 20 Minutes
- Full Cure / Polish Time: 12 - 16 Hours air dry / 30 min bake at 60°C
- Pot Life: 4 Hours at 20°C`;

    if (isKromaChrome) {
      specificTechData = `APPLICATION SPECIFICATIONS (KROMA EDGE SELF-ORGANIZATION MIRROR CHROME):
- Mixing Ratio: 5 : 5 : 2 : 2 by Weight (Binder : Reducer : Hardener : Mirror Seeds)
- Substrate Preparation: Cured primer/sealer sanded with #600-#1000 grit. (GLOSS BLACK NOT REQUIRED).
- Spray Gun / Airbrush: Airbrush 0.3mm-0.5mm @ 25-45 PSI (small parts) or Mini/Full HVLP 0.8mm-1.3mm.
- Application Technique: ONE continuous wet coat at >68°F (20°C). DO NOT mist coat or dust coat!
- Self-Organization Time: 2 - 5 Minutes (Cloudiness transforms into 100% specular mirror finish).
- Pot Life: 3 Hours after mixing.
- Cure Time: Air cure min 36 hours (or 140°F bake for 1-2 hours after mirror forms).
- Topcoat Protection: Dedicated Topcoat Clear (10:1 + 70-100% Thinner) ONLY.`;
    } else if (isKromaClear) {
      specificTechData = `APPLICATION SPECIFICATIONS (KROMA EDGE DEDICATED SPEED CLEAR):
- Mixing Ratio: 2 : 1 by Volume + 10% Thinner (or 10:1 + 70-100% Thinner for Dedicated Mirror Topcoat)
- Application: 1 Fine Mist Tack Coat -> 5 Min Flash -> 1 Full Wet Flow Coat.
- Gun Tip: 1.2mm - 1.4mm HVLP @ 1.8 - 2.2 Bar.
- Dust Free: 15 - 20 Minutes.
- Polish Window: 6 - 8 Hours air dry / 30 min @ 60°C bake.`;
    } else if (isFlake) {
      specificTechData = `APPLICATION SPECIFICATIONS (FLAKE KING DRY FLAKE APPLICATION):
- Gun Application: Flake King 500 (Airbrush mount) or Flake King 1000 (Full gun mount).
- Operating PSI: 10 - 15 PSI (Gentle fluidization without overspray bounce).
- Carrier / Wet Layer: Apply dry flake directly over wet clearcoat / intercoat (S2-SG100 or 2K Clear).
- Burial: Apply 2-3 coats of high-solids clear to bury flake edges, block sand with P600, final flow clear.`;
    }

    const tdsText = `================================================================================
TECHNICAL DATA SHEET (TDS) - REFINISH & MIXING SPECIFICATION
COAST AIRBRUSH EUROPE & UK DISTRIBUTION HUB
================================================================================
PRODUCT: ${prod.name}
SKU / PART: ${prod.sku || prod.id || 'N/A'}
BRAND: ${prod.brand || 'Coast Master Series'}
CATEGORY: ${prod.category || 'Automotive Coating'}

${specificTechData}

STORAGE & LOGISTICS:
- European Central Hub: Dispatched from UK warehouse (0% Export VAT for EU B2B).
- Storage: 15°C - 25°C in sealed original containers. Shelf life 24 months.
- Safety: Consult SDS before spraying. Use approved NIOSH/CE respiratory protection.
================================================================================`;

    const blob = new Blob([tdsText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TDS_${(prod.sku || prod.id || 'PRODUCT').replace(/[^a-zA-Z0-9_-]/g, '_')}_SPECS.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  downloadSystemTDS(system) {
    if (!system) return;
    const virtualProd = {
      id: system.id,
      sku: system.id.toUpperCase().replace(/_/g, '-'),
      name: system.name,
      brand: system.name.includes('Shimrin') ? 'House of Kolor' : 'Kroma Edge',
      category: 'Paint System Formula'
    };
    this.downloadTDS(virtualProd);
  }

  downloadSystemSDS(system) {
    if (!system) return;
    const virtualProd = {
      id: system.id,
      sku: system.id.toUpperCase().replace(/_/g, '-'),
      name: system.name,
      brand: system.name.includes('Shimrin') ? 'House of Kolor' : 'Kroma Edge',
      category: 'Paint System Formula'
    };
    this.downloadSDS(virtualProd);
  }

  setupDetailModal() {
    const modal = document.getElementById('modal-product-detail');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeDetailModal();
      });
    }

    this.addSafeListener('btn-detail-add-cart', () => {
      if (this.activeModalProduct) {
        const prod = this.activeModalProduct;
        const currentSelection = this.selectedProductVariants[prod.id] || {};
        const prices = this.getProductCalculatedPrice(prod, currentSelection.pack, currentSelection.size);
        const variantDesc = [currentSelection.size, currentSelection.pack].filter(Boolean).join(' / ') || 'Standard';

        this.shopifyCartManager.addItem({
          sku: prod.sku,
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

    // Auto-display on first visit if not dismissed
    const isDismissed = localStorage.getItem('coast_eu_welcome_dismissed') === 'true';
    if (!isDismissed) {
      setTimeout(() => {
        this.openWelcomeModal();
      }, 600);
    }
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

      // Sync foreground stage showcase images
      stageImages.forEach((img, idx) => {
        if (idx === currentSlide) {
          img.classList.add('active');
        } else {
          img.classList.remove('active');
        }
      });

      // Sync interactive thumbnail buttons
      thumbs.forEach((t, idx) => {
        if (idx === currentSlide) {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
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

      // Sync specimen label & badge
      if (showcaseLabel && slides[currentSlide]) {
        const label = slides[currentSlide].getAttribute('data-label') || `SPECIMEN 0${currentSlide + 1}`;
        showcaseLabel.textContent = label;
      }
      if (stageBadge && slides[currentSlide]) {
        const badge = slides[currentSlide].getAttribute('data-badge') || 'KromaEdge Specular Chrome';
        stageBadge.innerHTML = `<span class="material-symbols-outlined text-primary text-[14px]">verified</span><span>${badge}</span>`;
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

  openDetailModal(productOrId) {
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
      const descEl = document.getElementById('detail-desc');
      if (descEl) descEl.textContent = product.description || 'Professional grade automotive formulation engineered for show-quality kustom finishes.';
      
      // Check & setup variants for modal
      const isFlake = product.category === 'Dry Metal Flake (Glitter)' || product.category === 'Metal Flake';
      const isTape = product.hasTapeOptions || product.category === 'Masking Products' || (product.name || '').includes('Tape');
      const sizeLabel = isTape ? 'Tape Width / Roll Size' : (isFlake ? 'Flake Dimension (Micron)' : 'Product Size');

      let validSizes = (product.sizes || []).map(s => isFlake ? this.formatFlakeDimension(s) : String(s).trim()).filter(Boolean);
      let validPacks = (product.packSizes || []).map(p => isFlake ? this.formatFlakePackSize(p) : String(p).trim()).filter(Boolean);

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
      const prices = this.getProductCalculatedPrice(product, currentSelection.pack, currentSelection.size) || {
        formattedPrimary: `€${(product.priceEur || 24).toFixed(2)}`,
        formattedSecondary: `£${((product.priceEur || 24) * 0.86).toFixed(2)} GBP`
      };

      const priceEl = document.getElementById('detail-price');
      if (priceEl && prices) priceEl.textContent = prices.formattedPrimary;
      const priceSubEl = document.getElementById('detail-price-sub');
      if (priceSubEl && prices) priceSubEl.textContent = prices.formattedSecondary;

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
                  const showPrice = validPacks.length <= 1 && optPrice ? ` (${optPrice.formattedPrimary})` : '';
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
                  return `<option value="${this.escapeHtmlAttr(p)}" ${p === currentSelection.pack ? 'selected' : ''}>${p} (${optPrice ? optPrice.formattedPrimary : ''})</option>`;
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
        if (tipEl) tipEl.textContent = 'Flake King 500 / 1000 Dry Gun (Direct Mount)';
        if (psiEl) psiEl.textContent = '10 - 15 PSI (Gentle Dry Fluidization)';
        if (ratioEl) ratioEl.textContent = 'Dry Application over Wet Mid-Coat / Clear';
        if (vocEl) vocEl.textContent = '0 g/L (100% Dry Solvent-Proof Polymer)';
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
        stockBadge.className = isPreOrder ? 'metal-spec-plate-red text-[10px] font-bold text-amber-300' : 'metal-spec-plate text-[10px] font-bold text-emerald-400';
      }
      const addCartBtn = document.getElementById('btn-detail-add-cart');
      if (addCartBtn) {
        addCartBtn.textContent = isPreOrder ? '🛒 PRE-ORDER NOW • SECURE BATCH 1 ALLOCATION' : '+ ADD TO PROJECT CART';
      }

      const imgEl = document.getElementById('detail-img');
      if (imgEl) {
        imgEl.src = product.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
        imgEl.onerror = () => {
          imgEl.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
        };
      }

      modal.classList.add('active');
    } catch (err) {
      console.error('Error opening detail modal:', err);
    }
  }

  closeDetailModal() {
    const modal = document.getElementById('modal-product-detail');
    if (modal) modal.classList.remove('active');
  }

  toggleB2BMode() {
    this.isB2BMode = !this.isB2BMode;
    const btn = document.getElementById('btn-b2b-login');
    if (btn) {
      if (this.isB2BMode) {
        btn.classList.add('bg-primary-container', 'text-white');
        btn.innerHTML = `<span class="material-symbols-outlined text-[14px]">verified</span> B2B ACTIVE (30% OFF)`;
        alert("🏢 B2B Wholesale Pricing Activated (30% Discount across catalog).");
      } else {
        btn.classList.remove('bg-primary-container', 'text-white');
        btn.innerHTML = `<span class="material-symbols-outlined text-[14px]">apartment</span> DEALER LOGIN`;
      }
    }
    this.renderStorefrontGrid();
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

  getProductCalculatedPrice(prod, selectedPack, selectedSize) {
    let priceEur = prod.priceEur || 24.00;

    // Check fullMatrixPricing (matching both pack size and flake particle size)
    if (prod.fullMatrixPricing && prod.fullMatrixPricing.length > 0) {
      const match = prod.fullMatrixPricing.find(m => {
        const pSize = m.rawPackSize || m.packSize || '';
        const fSize = m.rawFlakeSize || m.flakeSize || '';
        const matchPack = !selectedPack || this.matchPackToken(selectedPack, pSize) || this.matchPackToken(selectedPack, m.packSize);
        const matchSize = !selectedSize || this.matchFlakeSizeToken(selectedSize, fSize) || this.matchFlakeSizeToken(selectedSize, m.flakeSize);
        return matchPack && matchSize;
      });
      if (match && match.priceEur) {
        priceEur = match.priceEur;
      } else if (prod.packPriceMatrix && (selectedPack || selectedSize)) {
        const packMatch = prod.packPriceMatrix.find(m => 
          (selectedPack && (this.matchPackToken(selectedPack, m.packSize) || selectedPack === m.packSize)) ||
          (selectedSize && (this.matchPackToken(selectedSize, m.packSize) || selectedSize === m.packSize))
        );
        if (packMatch && packMatch.priceEur) {
          priceEur = packMatch.priceEur;
        }
      }
    } else if (prod.packPriceMatrix && (selectedPack || selectedSize)) {
      const match = prod.packPriceMatrix.find(m => 
        (selectedPack && (this.matchPackToken(selectedPack, m.packSize) || selectedPack === m.packSize)) ||
        (selectedSize && (this.matchPackToken(selectedSize, m.packSize) || selectedSize === m.packSize))
      );
      if (match && match.priceEur) {
        priceEur = match.priceEur;
      }
    }

    const multiplier = this.isB2BMode ? 0.70 : 1.0;
    const finalEur = priceEur * multiplier;
    const country = this.euLocalization.getCountry();
    const finalLocal = finalEur * country.rateToEur;

    return {
      priceEur: finalEur,
      priceLocal: finalLocal,
      currencySymbol: country.symbol,
      currencyCode: country.currency,
      formattedPrimary: `${country.symbol}${finalLocal.toFixed(2)}`,
      formattedSecondary: country.currency !== 'EUR' ? `€${finalEur.toFixed(2)} EUR` : `$${(finalEur * 1.08).toFixed(2)} USD`
    };
  }

  renderStorefrontGrid() {
    const container = document.getElementById('storefront-product-grid');
    if (!container) return;
    container.innerHTML = '';

    let filtered = [...ECOM_CATALOG];

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
      countBadge.textContent = `Showing ${filtered.length} of ${ECOM_CATALOG.length} products (${brandText} > ${catText})`;
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
        const sizeLabel = isTape ? 'Tape Width / Roll Size' : (isFlake ? 'Flake Dimension (Micron)' : 'Product Size');

        let validSizes = (prod.sizes || []).map(s => isFlake ? this.formatFlakeDimension(s) : String(s).trim()).filter(Boolean);
        let validPacks = (prod.packSizes || []).map(p => isFlake ? this.formatFlakePackSize(p) : String(p).trim()).filter(Boolean);

        if (isFlake && validPacks.length === 0) {
          validPacks = [
            '30g Jar (Direct Gun Mount - 500/550)',
            '100g Jar (Direct Gun Mount - 1000/1050)',
            '1000g (1 Kilo Trade Pack)'
          ];
        }

        if (!this.selectedProductVariants[prod.id]) {
          this.selectedProductVariants[prod.id] = {
            size: validSizes[0] || '',
            pack: validPacks[0] || ''
          };
        }

        const currentSelection = this.selectedProductVariants[prod.id] || { size: '', pack: '' };
        const prices = this.getProductCalculatedPrice(prod, currentSelection.pack, currentSelection.size) || {
          priceEur: prod.priceEur || 24,
          priceLocal: prod.priceEur || 24,
          currencySymbol: '€',
          currencyCode: 'EUR',
          formattedPrimary: `€${(prod.priceEur || 24).toFixed(2)}`,
          formattedSecondary: `£${((prod.priceEur || 24) * 0.86).toFixed(2)} GBP`
        };
        const reviewData = this.getProductReviewData(prod) || { rating: '4.9', count: 24, quote: '', author: '' };

        const isPreOrder = Boolean(prod.isPreOrder || (prod.badge && (prod.badge.includes('EARLY BIRD') || prod.badge.includes('PRE-ORDER') || prod.badge.includes('BATCH 1'))) || prod.id.startsWith('preorder_'));
        const subCategoryLabel = isFlake ? this.getFlakeSubcategory(prod) : null;
        const badgeText = this.isB2BMode 
          ? '🏢 30% B2B TRADE' 
          : (isPreOrder ? `⏳ ${prod.badge || 'PRE-ORDER'}` : (isFlake && subCategoryLabel ? `✨ ${subCategoryLabel.toUpperCase()}` : (prod.badge || 'IN STOCK')));

        let variantControls = '';
        if (validSizes.length > 1 || (validSizes.length === 1 && validPacks.length === 0)) {
          variantControls += `
            <div class="mb-2">
              <label class="font-label-xs text-[10px] text-secondary uppercase block mb-1 font-bold">${sizeLabel}:</label>
              <select id="select-size-${prod.id}" class="mech-select !py-1 !px-2 text-xs" onchange="window.paintApp.onProductVariantChange('${prod.id}', 'size', this.value)">
                ${validSizes.map(s => {
                  const optPrice = this.getProductCalculatedPrice(prod, currentSelection.pack, s);
                  const showPrice = validPacks.length <= 1 && optPrice ? ` (${optPrice.formattedPrimary})` : '';
                  return `<option value="${this.escapeHtmlAttr(s)}" ${s === currentSelection.size ? 'selected' : ''}>${s}${showPrice}</option>`;
                }).join('')}
              </select>
            </div>
          `;
        }

        if (validPacks.length > 1 || (validPacks.length === 1 && validSizes.length === 0)) {
          variantControls += `
            <div class="mb-2">
              <label class="font-label-xs text-[10px] text-secondary uppercase block mb-1 font-bold">Pack Size / Volume:</label>
              <select id="select-pack-${prod.id}" class="mech-select !py-1 !px-2 text-xs" onchange="window.paintApp.onProductVariantChange('${prod.id}', 'pack', this.value)">
                ${validPacks.map(p => {
                  const optPrice = this.getProductCalculatedPrice(prod, p, currentSelection.size);
                  return `<option value="${this.escapeHtmlAttr(p)}" ${p === currentSelection.pack ? 'selected' : ''}>${p} (${optPrice ? optPrice.formattedPrimary : ''})</option>`;
                }).join('')}
              </select>
            </div>
          `;
        }

        const fallbackImg = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
        const card = document.createElement('div');
        card.className = 'industrial-card group overflow-hidden flex flex-col justify-between glow-hover';
        card.innerHTML = `
          <div>
            <div class="h-48 bg-surface-dim relative border-b-2 border-secondary overflow-hidden product-studio-stage flex items-center justify-center p-3">
              <img class="w-full h-full object-contain filter contrast-110 group-hover:scale-105 transition-transform duration-500 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]" src="${prod.image || fallbackImg}" alt="${prod.name}" onerror="this.onerror=null; this.src='${fallbackImg}'">
              <div class="absolute top-2 left-2 flex gap-1">
                <span class="metal-spec-plate text-[10px] font-bold">${(prod.brand || 'COAST').toUpperCase()}</span>
              </div>
              <div class="absolute bottom-2 right-2">
                <span class="${isPreOrder ? 'metal-spec-plate-red' : 'metal-spec-plate'} text-[10px] font-bold">${badgeText}</span>
              </div>
            </div>

            <div class="p-4 bg-surface-container-low">
              <div class="font-mono text-[11px] text-secondary mb-1">SKU: ${prod.sku || 'N/A'}</div>
              <h4 class="font-headline text-lg uppercase text-on-surface mb-1 line-clamp-1 group-hover:text-primary transition-colors">${prod.name}</h4>
              
              <!-- Review Stars & Verified Painter Badge -->
              <div class="flex items-center gap-1.5 my-2">
                <span class="text-amber-400 text-xs">★★★★★</span>
                <span class="font-mono text-xs font-bold text-on-surface">${reviewData.rating}</span>
                <span class="text-[10px] text-secondary">(${reviewData.count})</span>
                <span class="ml-auto text-[9px] font-mono text-emerald-400 border border-emerald-800/60 bg-emerald-950/40 px-1.5 py-0.5 rounded font-bold">✓ PRO VERIFIED</span>
              </div>

              <p class="font-body-md text-xs text-on-surface-variant line-clamp-2 mb-3 leading-relaxed">${prod.description || 'Authentic formulation manufactured for pro custom airbrushing & custom paint.'}</p>
              ${variantControls}
            </div>
          </div>

          <div class="p-4 pt-0 bg-surface-container-low">
            <div class="flex items-center justify-between border-t-2 border-secondary pt-3 mb-3">
              <div>
                <span id="price-eur-${prod.id}" class="font-headline text-2xl text-primary font-bold block">${prices.formattedPrimary}</span>
                <span id="price-gbp-${prod.id}" class="font-mono text-[11px] text-secondary">${prices.formattedSecondary}</span>
              </div>
              <button onclick="window.paintApp.openDetailModal('${prod.id}')" class="text-secondary hover:text-primary font-label-xs text-xs uppercase flex items-center gap-0.5 font-bold cursor-pointer">
                Details <span class="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>

            <div class="grid grid-cols-1 gap-2">
              <button onclick="window.paintApp.addProductToCartById('${prod.id}')" class="mech-button-primary !w-full !justify-center !text-xs !py-2.5">
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
    const prices = this.getProductCalculatedPrice(prod, currentSelection.pack, currentSelection.size);
    
    // Storefront Card Price Elements
    const eurEl = document.getElementById(`price-eur-${prodId}`);
    const gbpEl = document.getElementById(`price-gbp-${prodId}`);
    if (eurEl && prices) {
      eurEl.textContent = prices.formattedPrimary;
    }
    if (gbpEl && prices) {
      gbpEl.textContent = prices.formattedSecondary;
    }

    // Modal Price Elements (if modal is open for this product)
    if (this.activeModalProduct && this.activeModalProduct.id === prodId) {
      const modalPriceEl = document.getElementById('detail-price');
      const modalPriceSubEl = document.getElementById('detail-price-sub');
      if (modalPriceEl && prices) modalPriceEl.textContent = prices.formattedPrimary;
      if (modalPriceSubEl && prices) modalPriceSubEl.textContent = prices.formattedSecondary;
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
        const optPrice = this.getProductCalculatedPrice(prod, p, currentSelection.size);
        return `<option value="${this.escapeHtmlAttr(p)}" ${p === currentSelection.pack ? 'selected' : ''}>${p} (${optPrice ? optPrice.formattedPrimary : ''})</option>`;
      }).join('');

      if (storePackSelect) storePackSelect.innerHTML = optionsHtml;
      if (modalPackSelect && this.activeModalProduct && this.activeModalProduct.id === prodId) {
        modalPackSelect.innerHTML = optionsHtml;
      }
    }
  }

  addProductToCartById(prodId) {
    const prod = ECOM_CATALOG.find(p => p.id === prodId);
    if (!prod) return;

    const variant = this.selectedProductVariants[prodId] || {};
    const prices = this.getProductCalculatedPrice(prod, variant.pack, variant.size);
    const variantDesc = [variant.size, variant.pack].filter(Boolean).join(' / ') || 'Standard';

    this.shopifyCartManager.addItem({
      sku: prod.sku,
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
      alert("✅ Mix Complete! All scale target weights reached.");
    }
  }

  renderCartSummary(summary) {
    const countBadge = document.getElementById('header-cart-count');
    const subtotalEl = document.getElementById('cart-drawer-subtotal');
    const vatLabelEl = document.getElementById('cart-drawer-vat-label');
    const vatAmountEl = document.getElementById('cart-drawer-vat-amount');
    const carrierEl = document.getElementById('cart-drawer-carrier');
    const totalEl = document.getElementById('cart-drawer-total');
    const convertedTotalEl = document.getElementById('cart-drawer-converted-total');
    const itemsContainer = document.getElementById('cart-drawer-items');

    const country = this.euLocalization.getCountry();
    const taxData = this.euLocalization.calculateTaxAndTotal(summary.subtotal);

    if (countBadge) countBadge.textContent = summary.itemCount;
    if (subtotalEl) subtotalEl.textContent = `€${taxData.subtotalEur.toFixed(2)}`;
    
    if (vatLabelEl) {
      vatLabelEl.textContent = taxData.isVatExempt 
        ? `VAT (0% Intra-EU Reverse-Charge):` 
        : `VAT (${taxData.vatRatePercent}% ${country.code}):`;
    }
    if (vatAmountEl) {
      vatAmountEl.textContent = `€${taxData.vatAmountEur.toFixed(2)}`;
    }

    if (carrierEl) {
      carrierEl.textContent = `${country.carrier} (Free > €150)`;
    }

    if (totalEl) {
      if (country.currency === 'EUR') {
        totalEl.textContent = `€${taxData.totalEur.toFixed(2)}`;
        if (convertedTotalEl) convertedTotalEl.textContent = `(${(taxData.totalEur * 1.08).toFixed(2)} USD Est.)`;
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
  }

  removeItem(index) {
    this.shopifyCartManager.removeItem(index);
  }

  checkoutShopify() {
    const summary = this.shopifyCartManager.getCartSummary();
    if (summary.items.length === 0) {
      alert("Please add items to your cart before proceeding to checkout.");
      return;
    }
    const permalink = this.shopifyCartManager.generateShopifyCartPermalink();
    window.open(permalink, '_blank');
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
      alert(res.message);
    });

    this.addSafeListener('btn-admin-logout', 'click', () => {
      this.adminController.logout();
      alert("🔒 Admin Console Locked.");
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
          alert(res.message);
          if (res.success) this.renderAdminAll();
        };
        reader.readAsText(file);
      });
    }

    // Admin Sub-Tab Switching
    const subtabs = [
      { btnId: 'subtab-admin-formulas', panelId: 'admin-panel-formulas' },
      { btnId: 'subtab-admin-products', panelId: 'admin-panel-products' },
      { btnId: 'subtab-admin-preorders', panelId: 'admin-panel-preorders' },
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
            if (p) p.style.display = (s.panelId === st.panelId) ? 'flex' : 'none';
          });
        });
      }
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
    this.addSafeListener('btn-admin-product-delete', 'click', () => this.deleteAdminProductFromModal());

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
    this.renderAdminFormulas();
    this.renderAdminProducts();
    this.renderAdminPreorders();
    this.renderAdminPrinter();
    this.renderAdminHazmat();
    this.renderAdminAI();
    this.renderAdminEmailHub();
  }

  // =========================================================================
  // ADMIN PRODUCT FIELDS & CATALOG MANAGER
  // =========================================================================
  getEffectiveProducts() {
    const overrides = this.adminController.config.productOverrides || {};
    return ECOM_CATALOG.map(p => {
      const o = overrides[p.id] || {};
      return {
        ...p,
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
        const full = `${p.name || ''} ${p.sku || ''} ${p.brand || ''} ${p.category || ''} ${p.description || ''}`.toLowerCase();
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
      p = all.find(item => item.id === productId);
    }

    if (p) {
      if (title) title.innerText = `Edit Product Fields: ${p.name}`;
      if (idInput) idInput.value = p.id;
      if (nameInput) nameInput.value = p.name || '';
      if (skuInput) skuInput.value = p.sku || '';
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
    } else {
      const newId = `custom_prod_${Date.now()}`;
      if (title) title.innerText = "Create New Product";
      if (idInput) idInput.value = newId;
      if (nameInput) nameInput.value = '';
      if (skuInput) skuInput.value = `CAE-${Date.now().toString().slice(-4)}`;
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
      alert("Please provide a product title.");
      return;
    }

    const productId = idInput.value.trim();
    const sizes = (sizesInput ? sizesInput.value : '').split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    const packSizes = (packSizesInput ? packSizesInput.value : '').split(/[\n,]+/).map(p => p.trim()).filter(Boolean);

    const updatedFields = {
      name: nameInput.value.trim(),
      sku: skuInput ? skuInput.value.trim() : '',
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
    
    // Also sync in-memory ECOM_CATALOG runtime copy if matching
    const catIdx = ECOM_CATALOG.findIndex(p => p.id === productId);
    if (catIdx >= 0) {
      ECOM_CATALOG[catIdx] = { ...ECOM_CATALOG[catIdx], ...updatedFields };
    } else {
      ECOM_CATALOG.unshift({ id: productId, ...updatedFields });
    }

    this.closeAdminProductModal();
    this.renderAdminProducts();
    this.renderCatalog();
    alert("✅ Product fields saved and synchronized across store!");
  }

  deleteAdminProductFromModal() {
    const idInput = document.getElementById('form-product-id');
    if (!idInput) return;
    const prodId = idInput.value.trim();
    if (confirm(`Reset overrides for product "${prodId}" back to factory defaults?`)) {
      this.adminController.deleteProductOverride(prodId);
      this.closeAdminProductModal();
      this.renderAdminProducts();
      this.renderCatalog();
      alert("✅ Product reset to original catalog defaults.");
    }
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
    alert("✨ Gemini AI copy successfully applied to product fields!");
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
      alert("Please provide both a System ID and Name.");
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
    alert("✅ Formula saved successfully!");
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
    alert("✅ Pre-Order packages saved and synchronized!");
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
    alert("✅ Citizen Thermal Printer configuration updated!");
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
    alert(`🖨️ [Citizen CL-S621 WebUSB Test Stream Sent]\n\nCommand Payload:\n${cmd.slice(0, 150)}...\n\nStatus: Print Job Dispatched Successfully.`);
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
    alert("✅ ADR Hazmat & Freight parameters saved!");
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
    alert("✅ AI Specialist Agent thresholds updated!");
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
      this.renderCatalog();
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
      alert("⚠️ Please provide both a subject line and email body before dispatching.");
      return;
    }

    if (isSingle) {
      const singleSelect = document.getElementById('select-email-single-customer');
      const email = singleSelect ? singleSelect.value : '';
      const customer = this.adminController.getAllCustomers().find(c => c.email.toLowerCase() === email.toLowerCase());

      if (!customer) {
        alert("⚠️ Please select a recipient.");
        return;
      }

      if (confirm(`Send direct email to ${customer.name} (${customer.email})?`)) {
        const res = this.adminController.sendDirectEmail(customer, { subject, body, mode: "Simulated Delivery" });
        alert(`✅ Direct Email dispatched successfully to ${customer.email}!\n\nSubject: ${res.renderedSubject}`);
        this.renderAdminDispatchLogs();
      }
    } else {
      const segSelect = document.getElementById('select-email-target-segment');
      const segment = segSelect ? segSelect.value : 'all';
      const targetCustomers = this.adminController.getCustomersBySegment(segment);

      if (targetCustomers.length === 0) {
        alert("⚠️ No matching recipients found in selected segment.");
        return;
      }

      if (confirm(`🚀 DISPATCH BLANKET BROADCAST?\n\nAudience: ${segment.toUpperCase().replace('_', ' ')}\nTotal Recipients: ${targetCustomers.length} accounts\nSubject: ${subject}`)) {
        const res = this.adminController.sendBlanketCampaign(segment, { subject, body, title: subject.slice(0, 45) });
        alert(`✅ Blanket Campaign dispatched to ${res.recipientsSent} accounts successfully!\n\nSimulated campaign tracking initialized.`);
        this.renderEmailMetricsRibbon();
        this.renderAdminCampaignAnalytics();
        this.renderAdminDispatchLogs();
      }
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
    alert(`🧪 Test Email dispatched to ${adminTestRecipient.email}!\n\nSubject: ${res.renderedSubject}\n\nCheck the Dispatch Logs table below.`);
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
      alert("⚠️ Provide subject and body content before saving as template.");
      return;
    }

    const tplName = prompt("Enter a name for this custom email template:", subject.slice(0, 40));
    if (!tplName) return;

    const newTpl = {
      id: `tpl-custom-${Date.now()}`,
      name: tplName,
      targetSegment: segment,
      subject: subject,
      body: body
    };

    this.adminController.saveEmailTemplate(newTpl);
    alert(`💾 Template '${tplName}' saved to Admin Configuration!`);

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


