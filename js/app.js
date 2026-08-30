// Coast Airbrush Europe - Master Storefront & Mixing System Controller
import { KROMA_EDGE_CATALOG } from '../data/kroma_edge.js';
import { ECOM_CATALOG } from '../data/full_ecom_catalog.js';
import { calculateRequiredVolume, calculateMixingRecipe, PRESET_PANELS, CONVERSIONS } from './mixingEngine.js';
import { ShopifyCartManager } from './shopifyCart.js';
import { EULocalizationManager } from './euLocalization.js';
import { I18nManager } from './i18n.js';
import { MasterPainterAI } from './agentA.js';
import { OrderConciergeAI, MILESTONE_STAGES } from './agentB.js';
import { SocialGrowthAI } from './agentC.js';
import { InventoryGuruAI } from './agentD.js';
import { ForumPreorderEngine } from './forumPreorderEngine.js';

class PaintSystemApp {
  constructor() {
    this.currentCatalog = KROMA_EDGE_CATALOG;
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

    // Shop Filters & Search
    this.setupShopFilters();

    // Cart Drawer & Modals
    this.setupCartDrawer();
    this.setupDetailModal();

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
      const tabBtn = document.getElementById(`tab-${tabParam}`);
      if (tabBtn) tabBtn.click();
    } else if (hash === '#preorders' || hash === '#pre-orders') {
      const preTab = document.getElementById('tab-preorders');
      if (preTab) preTab.click();
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
      const tabPreorders = document.getElementById('tab-preorders');
      const tabForum = document.getElementById('tab-forum');
      const tabCalc = document.getElementById('tab-calculator');
      const tabCoverage = document.getElementById('tab-coverage');

      if (tabShop) tabShop.textContent = t('nav_shop');
      if (tabPreorders) tabPreorders.textContent = t('nav_preorders');
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
      { id: 'tab-preorders', viewId: 'view-preorders' },
      { id: 'tab-forum', viewId: 'view-forum' },
      { id: 'tab-agent-a', viewId: 'view-agent-a' },
      { id: 'tab-agent-b', viewId: 'view-agent-b' },
      { id: 'tab-agent-c', viewId: 'view-agent-c' },
      { id: 'tab-agent-d', viewId: 'view-agent-d' },
      { id: 'tab-calculator', viewId: 'view-calculator' },
      { id: 'tab-scale', viewId: 'view-scale' },
      { id: 'tab-coverage', viewId: 'view-coverage' }
    ];

    tabMappings.forEach(tab => {
      const btn = document.getElementById(tab.id);
      if (btn) {
        btn.addEventListener('click', () => {
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
    const tabIds = ['tab-storefront', 'tab-preorders', 'tab-forum', 'tab-agent-a', 'tab-agent-b', 'tab-agent-c', 'tab-agent-d', 'tab-calculator', 'tab-scale', 'tab-coverage'];
    const viewIds = ['view-storefront', 'view-preorders', 'view-forum', 'view-agent-a', 'view-agent-b', 'view-agent-c', 'view-agent-d', 'view-calculator', 'view-scale', 'view-coverage'];

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
    if (activeViewId === 'view-preorders') {
      const revSlider = document.getElementById('slider-preorder-rev');
      if (revSlider) {
        this.updateReinvestmentDisplay(parseInt(revSlider.value, 10));
      }
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
      return product.category === 'Dry Metal Flake (Glitter)' || product.category === 'Metal Flake' || (product.sizes && product.sizes.length > 0 && product.brand === 'Flake King' && !product.name.includes('Gun') && !product.name.includes('Nozzle') && !product.name.includes('Tape'));
    }
    if (catId === 'Dry Metal Flake Guns') return product.category === 'Dry Metal Flake Guns';
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
    const sidebarList = document.getElementById('sidebar-category-list');
    const mobileList = document.getElementById('mobile-category-list');
    if (!sidebarList && !mobileList) return;

    const CATEGORY_GROUPS = [
      {
        group: "VsionAir Workstations (www.vsionair.com)",
        brand: "VsionAir",
        items: [
          { id: "vsionair-all", label: "All VsionAir Products", icon: "apps", isSubcat: false },
          { id: "vsionair-jigs", label: "Jigs & Workpiece Mounts", icon: "handyman", isSubcat: false },
          { id: "Helmet Jigs", label: "Helmet & Mask Jigs", icon: "sports_motorsports", isSubcat: true },
          { id: "Motorcycle Part Jigs", label: "Motorcycle Tank & Fender Jigs", icon: "two_wheeler", isSubcat: true },
          { id: "Canvass Jig", label: "Canvass & Easel Jigs", icon: "palette", isSubcat: true },
          { id: "Car & Motorcycle Wheel Jig", label: "Wheel & Rim Jigs", icon: "tire_repair", isSubcat: true },
          { id: "Specialty Jigs", label: "Skateboard, Guitar & Mug Jigs", icon: "skateboarding", isSubcat: true },
          { id: "Stands", label: "Stands & Base Workstations", icon: "desktop_windows", isSubcat: false },
          { id: "Tool Bars & Lighting Rigs", label: "Tool Bars & Lighting Rigs", icon: "lightbulb", isSubcat: false },
          { id: "Airbrush Specific", label: "Airbrush Specific Holders", icon: "water_drop", isSubcat: false },
          { id: "Storage, Comfort & Environment", label: "Storage, Pots & Organisers", icon: "inventory_2", isSubcat: false },
          { id: "VsionAir Knobs", label: "Knobs & Clamping Handles", icon: "tune", isSubcat: false },
          { id: "VsionAir Brackets", label: "Mounting Brackets", icon: "straighten", isSubcat: false },
          { id: "VsionAir Fasteners", label: "Precision Fasteners & Bolts", icon: "build", isSubcat: false }
        ]
      },
      {
        group: "Flake King Kustom Finishes",
        brand: "Flake King",
        items: [
          { id: "flakeking-all", label: "All Flake King Products", icon: "apps", isSubcat: false },
          { id: "Dry Metal Flake (Glitter)", label: "Dry Metal Flakes (Glitters)", icon: "auto_awesome", isSubcat: false },
          { id: "Dry Metal Flake Guns", label: "Dry Flake Guns & Kits", icon: "precision_manufacturing", isSubcat: false },
          { id: "Flake King Gun Accessories", label: "Gun Accessories & Nozzles", icon: "build", isSubcat: false },
          { id: "Corroded Metal FX", label: "Corroded Metal FX Series", icon: "grain", isSubcat: false },
          { id: "Masking Products", label: "Fine Line Masking Tapes", icon: "content_cut", isSubcat: false },
          { id: "Wet Products", label: "Wet Binders & Surface Prep", icon: "sanitizer", isSubcat: false }
        ]
      },
      {
        group: "Kroma Edge Chrome & Paints",
        brand: "Kroma Edge",
        items: [
          { id: "kromaedge-all", label: "All Kroma Edge Paints", icon: "apps", isSubcat: false },
          { id: "Solvent Paints", label: "Liquid Chrome, Primers & Clears", icon: "format_paint", isSubcat: false }
        ]
      }
    ];

    const getCount = (catId) => {
      let items = [...ECOM_CATALOG];
      if (this.activeBrandFilter && this.activeBrandFilter !== 'all') {
        items = items.filter(p => (p.brand || '').toLowerCase().includes(this.activeBrandFilter.toLowerCase()));
      }
      return items.filter(p => this.matchCategory(p, catId)).length;
    };

    const renderListHTML = () => {
      let html = '';

      // Header label update
      const countHeader = document.getElementById('sidebar-category-header-count');
      const mobileCountHeader = document.getElementById('mobile-category-header-count');
      const labelText = this.activeBrandFilter === 'VsionAir' ? '14 VSIONAIR CATS' : (this.activeBrandFilter === 'Flake King' ? '7 FLAKE KING CATS' : (this.activeBrandFilter === 'Kroma Edge' ? '2 KROMA CATS' : 'CATEGORIES'));
      if (countHeader) countHeader.textContent = labelText;
      if (mobileCountHeader) mobileCountHeader.textContent = labelText;

      // All Categories Button at top
      const allCount = getCount('all');
      const isAllActive = this.activeCategoryFilter === 'all';
      html += `
        <button type="button" data-category="all" class="category-btn ${isAllActive ? 'active' : ''} mb-2" title="All Products (${allCount} items)">
          <span class="flex items-center gap-1.5 truncate">
            <span class="material-symbols-outlined text-[15px] ${isAllActive ? 'text-white' : 'text-primary'}">apps</span>
            <span class="truncate font-bold uppercase">All Products (All Brands)</span>
          </span>
          <span class="category-count-badge font-mono">${allCount}</span>
        </button>
      `;

      // Filter groups based on active brand if selected
      const visibleGroups = CATEGORY_GROUPS.filter(g => {
        if (!this.activeBrandFilter || this.activeBrandFilter === 'all') return true;
        return (g.brand || '').toLowerCase() === this.activeBrandFilter.toLowerCase();
      });

      visibleGroups.forEach(group => {
        html += `
          <div class="category-group-header">
            <span>${group.group}</span>
          </div>
        `;

        group.items.forEach(cat => {
          const count = getCount(cat.id);
          const isActive = this.activeCategoryFilter === cat.id;
          const subClass = cat.isSubcat ? 'is-subcat' : '';
          const activeClass = isActive ? 'active' : '';
          html += `
            <button type="button" data-category="${cat.id}" class="category-btn ${subClass} ${activeClass}" title="${cat.label} (${count} products)">
              <span class="flex items-center gap-1.5 truncate">
                <span class="material-symbols-outlined text-[15px] ${isActive ? 'text-white' : 'text-primary'}">${cat.icon}</span>
                <span class="truncate ${cat.isSubcat ? 'text-[10px]' : ''}">${cat.label}</span>
              </span>
              <span class="category-count-badge font-mono">${count}</span>
            </button>
          `;
        });
      });

      return html;
    };

    if (sidebarList) {
      sidebarList.innerHTML = renderListHTML();
      sidebarList.querySelectorAll('button[data-category]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const cat = btn.getAttribute('data-category');
          this.setCategoryFilter(cat);
        });
      });
    }

    if (mobileList) {
      mobileList.innerHTML = renderListHTML();
      mobileList.querySelectorAll('button[data-category]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const cat = btn.getAttribute('data-category');
          this.setCategoryFilter(cat);
        });
      });
    }
  }

  setCategoryFilter(catId) {
    this.activeCategoryFilter = catId;
    const catSelect = document.getElementById('select-category-filter');
    const mobileCatSelect = document.getElementById('select-mobile-category-filter');
    if (catSelect) catSelect.value = catId;
    if (mobileCatSelect) mobileCatSelect.value = catId;

    this.updateCategoryButtonsActive();

    // Update mobile active badge count
    const mobileBadge = document.getElementById('mobile-filter-badge-count');
    if (mobileBadge) {
      let activeCount = 0;
      if (this.activeBrandFilter !== 'all') activeCount++;
      if (this.activeCategoryFilter !== 'all') activeCount++;
      if (this.activeFlakeSubcat !== 'all') activeCount++;
      if (this.searchQuery) activeCount++;
      mobileBadge.textContent = activeCount > 0 ? `${activeCount} ACTIVE` : 'ALL';
    }

    this.renderStorefrontGrid();
  }

  updateCategoryButtonsActive() {
    const allCategoryButtons = document.querySelectorAll('#sidebar-category-list button[data-category], #mobile-category-list button[data-category]');
    allCategoryButtons.forEach(btn => {
      const cat = btn.getAttribute('data-category');
      const isActive = this.activeCategoryFilter === cat;
      if (isActive) {
        btn.classList.add('active');
        const icon = btn.querySelector('.material-symbols-outlined');
        if (icon) {
          icon.classList.remove('text-primary');
          icon.classList.add('text-white');
        }
      } else {
        btn.classList.remove('active');
        const icon = btn.querySelector('.material-symbols-outlined');
        if (icon) {
          icon.classList.remove('text-white');
          icon.classList.add('text-primary');
        }
      }
    });
  }

  setupShopFilters() {
    const searchInput = document.getElementById('input-shop-search');
    const mobileSearchInput = document.getElementById('input-mobile-shop-search');
    const brandSelect = document.getElementById('select-brand-filter');
    const mobileBrandSelect = document.getElementById('select-mobile-brand-filter');
    const categorySelect = document.getElementById('select-category-filter');
    const mobileCategorySelect = document.getElementById('select-mobile-category-filter');
    const sortSelect = document.getElementById('select-shop-sort');
    const mobileSortSelect = document.getElementById('select-mobile-shop-sort');
    const subcatBtns = document.querySelectorAll('.flake-subcat-btn');
    const mobileSubcatBtns = document.querySelectorAll('.flake-subcat-btn-mobile');
    const resetBtn = document.getElementById('btn-reset-filters');
    const mobileResetBtn = document.getElementById('btn-mobile-reset-filters');
    const mobileApplyBtn = document.getElementById('btn-mobile-apply-filters');
    const openMobileBtn = document.getElementById('btn-open-mobile-filters');
    const closeMobileBtn = document.getElementById('btn-close-mobile-filters');
    const mobileDrawer = document.getElementById('drawer-mobile-filters');

    const syncFiltersAndRender = () => {
      if (brandSelect && mobileBrandSelect) mobileBrandSelect.value = brandSelect.value;
      if (categorySelect && mobileCategorySelect) mobileCategorySelect.value = categorySelect.value;
      if (sortSelect && mobileSortSelect) mobileSortSelect.value = sortSelect.value;
      if (searchInput && mobileSearchInput) mobileSearchInput.value = searchInput.value;

      // Update mobile active badge count
      const mobileBadge = document.getElementById('mobile-filter-badge-count');
      if (mobileBadge) {
        let activeCount = 0;
        if (this.activeBrandFilter !== 'all') activeCount++;
        if (this.activeCategoryFilter !== 'all') activeCount++;
        if (this.activeFlakeSubcat !== 'all') activeCount++;
        if (this.searchQuery) activeCount++;
        mobileBadge.textContent = activeCount > 0 ? `${activeCount} ACTIVE` : 'ALL';
      }

      this.renderCategoryButtons();
      this.renderStorefrontGrid();
    };

    if (openMobileBtn) {
      openMobileBtn.addEventListener('click', () => {
        if (mobileDrawer) mobileDrawer.classList.add('active');
      });
    }
    if (closeMobileBtn) {
      closeMobileBtn.addEventListener('click', () => {
        if (mobileDrawer) mobileDrawer.classList.remove('active');
      });
    }
    if (mobileDrawer) {
      mobileDrawer.addEventListener('click', (e) => {
        if (e.target === mobileDrawer) mobileDrawer.classList.remove('active');
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        if (mobileSearchInput) mobileSearchInput.value = e.target.value;
        syncFiltersAndRender();
      });
    }
    if (mobileSearchInput) {
      mobileSearchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        if (searchInput) searchInput.value = e.target.value;
        syncFiltersAndRender();
      });
    }

    if (brandSelect) {
      brandSelect.addEventListener('change', (e) => {
        this.activeBrandFilter = e.target.value;
        if (mobileBrandSelect) mobileBrandSelect.value = e.target.value;
        syncFiltersAndRender();
      });
    }
    if (mobileBrandSelect) {
      mobileBrandSelect.addEventListener('change', (e) => {
        this.activeBrandFilter = e.target.value;
        if (brandSelect) brandSelect.value = e.target.value;
        syncFiltersAndRender();
      });
    }

    if (categorySelect) {
      categorySelect.addEventListener('change', (e) => {
        this.setCategoryFilter(e.target.value);
      });
    }
    if (mobileCategorySelect) {
      mobileCategorySelect.addEventListener('change', (e) => {
        this.setCategoryFilter(e.target.value);
      });
    }

    const setSubcat = (val) => {
      this.activeFlakeSubcat = val;
      subcatBtns.forEach(b => {
        const match = (b.getAttribute('data-flake-subcat') || 'all') === val;
        b.className = match ? 'flake-subcat-btn metal-spec-plate-red text-[10px] uppercase cursor-pointer' : 'flake-subcat-btn metal-spec-plate text-[10px] uppercase cursor-pointer';
      });
      mobileSubcatBtns.forEach(b => {
        const match = (b.getAttribute('data-flake-subcat') || 'all') === val;
        b.className = match ? 'flake-subcat-btn-mobile metal-spec-plate-red text-[10px] uppercase cursor-pointer' : 'flake-subcat-btn-mobile metal-spec-plate text-[10px] uppercase cursor-pointer';
      });
      syncFiltersAndRender();
    };

    subcatBtns.forEach(btn => {
      btn.addEventListener('click', () => setSubcat(btn.getAttribute('data-flake-subcat') || 'all'));
    });
    mobileSubcatBtns.forEach(btn => {
      btn.addEventListener('click', () => setSubcat(btn.getAttribute('data-flake-subcat') || 'all'));
    });

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.activeSort = e.target.value;
        if (mobileSortSelect) mobileSortSelect.value = e.target.value;
        syncFiltersAndRender();
      });
    }
    if (mobileSortSelect) {
      mobileSortSelect.addEventListener('change', (e) => {
        this.activeSort = e.target.value;
        if (sortSelect) sortSelect.value = e.target.value;
        syncFiltersAndRender();
      });
    }

    const doReset = () => {
      this.activeBrandFilter = 'all';
      this.activeCategoryFilter = 'all';
      this.activeFlakeSubcat = 'all';
      this.searchQuery = '';
      this.activeSort = 'popular';
      if (brandSelect) brandSelect.value = 'all';
      if (mobileBrandSelect) mobileBrandSelect.value = 'all';
      if (categorySelect) categorySelect.value = 'all';
      if (mobileCategorySelect) mobileCategorySelect.value = 'all';
      if (sortSelect) sortSelect.value = 'popular';
      if (mobileSortSelect) mobileSortSelect.value = 'popular';
      if (searchInput) searchInput.value = '';
      if (mobileSearchInput) mobileSearchInput.value = '';
      setSubcat('all');
      this.renderCategoryButtons();
    };

    if (resetBtn) resetBtn.addEventListener('click', doReset);
    if (mobileResetBtn) mobileResetBtn.addEventListener('click', doReset);
    if (mobileApplyBtn) {
      mobileApplyBtn.addEventListener('click', () => {
        if (mobileDrawer) mobileDrawer.classList.remove('active');
        const anchor = document.getElementById('storefront-catalog-anchor');
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth' });
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
    const sdsText = `================================================================================
SAFETY DATA SHEET (SDS) - EUROPEAN REACH REGULATION (EC) No 1907/2006
COAST AIRBRUSH EUROPE / KROMA EDGE / FLAKE KING MASTER SERIES
================================================================================
PRODUCT IDENTIFIER:
Product Name: ${prod.name}
SKU / Part Number: ${prod.sku || 'N/A'}
Brand: ${prod.brand || 'Coast Airbrush Europe'}
Manufacturer / Distributor: Coast Airbrush Europe Ltd (UK Logistics Hub)
Emergency EU Response: Chemtrec EU +44 20 3807 3798 / 112

SECTION 1: IDENTIFICATION & USE
Identified Uses: Professional automotive custom coating, dry glitter application, or precision refinish tooling.
REACH Status: 100% REACH Directive 1907/2006/EC & SVHC Compliant.
VOC Limit: Max 420 g/L (Directive 2004/42/EC Stage II Category B(d)).

SECTION 2: HAZARDS IDENTIFICATION
Classification: Non-flammable dry metal flake / Low VOC urethane system / Workshop tooling.
Precautionary Statements: Use in well-ventilated spray booth with appropriate PPE (P2/P3 respirator and nitrile gloves).

SECTION 3: COMPOSITION & INGREDIENT SPECS
Precision Polymer/Aluminum Substrate: >99.0%
Specialized Light-Fast Colorants & Interferences: <1.0%

SECTION 4: FIRST AID MEASURES
Inhalation: Move to fresh air.
Skin Contact: Wash thoroughly with soap and water.
Eye Contact: Rinse cautiously with water for several minutes.

SECTION 5: HANDLING & STORAGE
Store in cool, dry location (15°C - 25°C). Keep container tightly closed after use.
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
    const tdsText = `================================================================================
TECHNICAL DATA SHEET (TDS) - TECHNICAL REFINISH SPECIFICATION
COAST AIRBRUSH EUROPE - MASTER SERIES SPECIFICATION
================================================================================
PRODUCT: ${prod.name}
SKU: ${prod.sku || 'N/A'}
BRAND: ${prod.brand || 'Coast Master Series'}

APPLICATION SPECIFICATIONS:
- Recommended Spray Gun Tip: 1.2mm - 1.4mm HVLP (Paints) / Flake King 500/1000 Dry Gun (Flakes)
- Air Pressure: 1.2 - 1.5 Bar (18 - 22 PSI at gun inlet)
- Mixing Ratio (Standard): 3 : 1 : 2 (Base : Hardener : Reducer)
- Flash-off Between Coats: 10 - 15 Minutes at 20°C (68°F)
- Dust Free Time: 20 Minutes
- Full Cure / Polish Time: 12 - 16 Hours air dry / 30 min bake at 60°C
- Pot Life: 4 Hours at 20°C

STORAGE & LOGISTICS:
- Shelf Life: 24 Months in sealed original packaging.
- European Warehouse: Dispatched via DPD / DHL Express across EU & UK.
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

  setupDetailModal() {
    const modal = document.getElementById('modal-product-detail');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeDetailModal();
      });
    }

    this.addSafeListener('btn-detail-add-cart', () => {
      if (this.activeModalProduct) {
        this.addDirectToCart({
          sku: this.activeModalProduct.sku,
          title: this.activeModalProduct.name,
          price: this.activeModalProduct.priceEur,
          volume: 'Standard'
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
  }

  openDetailModal(productOrId) {
    let product = productOrId;
    if (typeof productOrId === 'string') {
      product = ECOM_CATALOG.find(p => p.id === productOrId) || (this.currentCatalog.colors && this.currentCatalog.colors.find(c => c.id === productOrId));
    }
    if (!product) return;
    this.activeModalProduct = product;
    const modal = document.getElementById('modal-product-detail');
    if (!modal) return;

    const brandEl = document.getElementById('detail-brand-badge');
    if (brandEl) brandEl.textContent = (product.brand || 'MASTER SERIES').toUpperCase();
    const skuEl = document.getElementById('detail-sku-badge');
    if (skuEl) skuEl.textContent = `SKU: ${product.sku || 'N/A'}`;
    const titleEl = document.getElementById('detail-title');
    if (titleEl) titleEl.textContent = product.name;
    const priceEl = document.getElementById('detail-price');
    if (priceEl) priceEl.textContent = `€${(product.priceEur || 24.00).toFixed(2)}`;
    const priceSubEl = document.getElementById('detail-price-sub');
    if (priceSubEl) priceSubEl.textContent = `£${((product.priceEur || 24.00) * 0.86).toFixed(2)} GBP`;
    const descEl = document.getElementById('detail-desc');
    if (descEl) descEl.textContent = product.description || 'Professional grade automotive formulation engineered for show-quality kustom finishes.';
    
    // Reviews & Social Proof
    const reviewData = this.getProductReviewData(product);
    const ratingScoreEl = document.getElementById('detail-rating-score');
    if (ratingScoreEl) ratingScoreEl.textContent = `${reviewData.rating} / 5.0`;
    const reviewCountEl = document.getElementById('detail-review-count');
    if (reviewCountEl) reviewCountEl.textContent = `${reviewData.count} VERIFIED REVIEWS`;
    const reviewQuoteEl = document.getElementById('detail-review-quote');
    if (reviewQuoteEl) reviewQuoteEl.textContent = `"${reviewData.quote}"`;
    const reviewerAuthorEl = document.getElementById('detail-reviewer-author');
    if (reviewerAuthorEl) reviewerAuthorEl.textContent = reviewData.author;

    // Technical Specs
    const isFlake = product.category === 'Dry Metal Flake (Glitter)' || product.category === 'Metal Flake';
    const isGun = (product.name || '').includes('Gun') || product.category === 'Dry Metal Flake Guns' || product.category === 'Airbrushes & Spray Guns';
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

    const imgEl = document.getElementById('detail-img');
    if (imgEl) {
      imgEl.src = product.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
      imgEl.onerror = () => {
        imgEl.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
      };
    }

    modal.classList.add('active');
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
    if (!select) return;
    select.innerHTML = '';
    this.currentCatalog.mixingSystems.forEach(sys => {
      const opt = document.createElement('option');
      opt.value = sys.id;
      opt.textContent = sys.name;
      select.appendChild(opt);
    });
    select.value = this.selectedSystem.id;
    this.updateSystemDescription();
  }

  updateSystemDescription() {
    const desc = document.getElementById('system-description');
    if (desc) {
      desc.innerHTML = `<strong>${this.selectedSystem.name}</strong><br>${this.selectedSystem.description}<br><span class="text-primary font-bold">Ratio: ${this.selectedSystem.ratioText}</span>`;
    }
    const badge = document.getElementById('formula-ratio-badge');
    if (badge) {
      badge.textContent = `Ratio: ${this.selectedSystem.ratioText}`;
    }
  }

  onSystemChange(systemId) {
    this.selectedSystem = this.currentCatalog.mixingSystems.find(s => s.id === systemId) || this.currentCatalog.mixingSystems[0];
    this.updateSystemDescription();
    this.updateCalculation();
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
        const pSize = (m.rawPackSize || m.packSize || '').toLowerCase();
        const fSize = (m.rawFlakeSize || m.flakeSize || '').toLowerCase();
        const selP = (selectedPack || '').toLowerCase();
        const selS = (selectedSize || '').toLowerCase();

        const matchPack = !selectedPack || selP.includes(pSize.split(' ')[0]) || pSize.includes(selP.split(' ')[0]);
        const matchSize = !selectedSize || selS.includes(fSize.split(' ')[0]) || fSize.includes(selS.split(' ')[0]);
        return matchPack && matchSize;
      });
      if (match && match.priceEur) {
        priceEur = match.priceEur;
      } else if (prod.packPriceMatrix && selectedPack) {
        const packMatch = prod.packPriceMatrix.find(m => selectedPack.includes(m.packSize) || m.packSize.includes(selectedPack.split(' ')[0]));
        if (packMatch && packMatch.priceEur) {
          priceEur = packMatch.priceEur;
        }
      }
    } else if (prod.packPriceMatrix && selectedPack) {
      const match = prod.packPriceMatrix.find(m => selectedPack.includes(m.packSize) || m.packSize.includes(selectedPack.split(' ')[0]));
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
      const isFlake = prod.category === 'Dry Metal Flake (Glitter)' || prod.category === 'Metal Flake' || (prod.sizes && prod.sizes.length > 0 && prod.brand === 'Flake King' && !prod.name.includes('Gun') && !prod.name.includes('Nozzle') && !prod.name.includes('Tape'));
      const isTape = prod.hasTapeOptions || prod.category === 'Masking Products' || prod.name.includes('Tape');
      const sizeLabel = isTape ? 'Tape Width / Roll Size' : (isFlake ? 'Flake Dimension (Micron)' : 'Product Size');

      let validSizes = (prod.sizes || []).map(s => isFlake ? this.formatFlakeDimension(s) : s).filter(Boolean);
      let validPacks = (prod.packSizes || []).map(p => isFlake ? this.formatFlakePackSize(p) : p).filter(Boolean);

      if (isFlake && validPacks.length === 0) {
        validPacks = [
          '15g/30g Jar (Direct Gun Mount - 500/550)',
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

      const currentSelection = this.selectedProductVariants[prod.id];
      const prices = this.getProductCalculatedPrice(prod, currentSelection.pack, currentSelection.size);
      const reviewData = this.getProductReviewData(prod);

      const subCategoryLabel = isFlake ? this.getFlakeSubcategory(prod) : null;
      const badgeText = this.isB2BMode 
        ? '🏢 30% B2B TRADE' 
        : (isFlake ? `✨ ${subCategoryLabel.toUpperCase()}` : (prod.badge || 'IN STOCK'));

      let variantControls = '';
      if (validSizes.length > 0) {
        variantControls += `
          <div class="mb-2">
            <label class="font-label-xs text-[10px] text-secondary uppercase block mb-1 font-bold">${sizeLabel}:</label>
            <select class="mech-select !py-1 !px-2 text-xs" onchange="window.paintApp.onProductVariantChange('${prod.id}', 'size', this.value)">
              ${validSizes.map(s => `<option value="${s}" ${s === currentSelection.size ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
        `;
      }

      if (validPacks.length > 0) {
        variantControls += `
          <div class="mb-2">
            <label class="font-label-xs text-[10px] text-secondary uppercase block mb-1 font-bold">Pack Size / Volume:</label>
            <select class="mech-select !py-1 !px-2 text-xs" onchange="window.paintApp.onProductVariantChange('${prod.id}', 'pack', this.value)">
              ${validPacks.map(p => `<option value="${p}" ${p === currentSelection.pack ? 'selected' : ''}>${p}</option>`).join('')}
            </select>
          </div>
        `;
      }

      const card = document.createElement('div');
      card.className = 'industrial-card group overflow-hidden flex flex-col justify-between glow-hover';
      card.innerHTML = `
        <div>
          <div class="h-48 bg-surface-dim relative border-b-2 border-secondary overflow-hidden product-studio-stage flex items-center justify-center p-3">
            <img class="w-full h-full object-contain filter contrast-110 group-hover:scale-105 transition-transform duration-500 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]" src="${prod.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'}" alt="${prod.name}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'">
            <div class="absolute top-2 left-2 flex gap-1">
              <span class="metal-spec-plate text-[10px] font-bold">${(prod.brand || 'COAST').toUpperCase()}</span>
            </div>
            <div class="absolute bottom-2 right-2">
              <span class="metal-spec-plate-red text-[10px] font-bold">${badgeText}</span>
            </div>
          </div>

          <div class="p-4 bg-surface-container-low">
            <div class="font-mono text-[11px] text-secondary mb-1">SKU: ${prod.sku}</div>
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
              + Add to Cart
            </button>
          </div>
        </div>
      `;
      container.appendChild(card);
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
    const eurEl = document.getElementById(`price-eur-${prodId}`);
    const gbpEl = document.getElementById(`price-gbp-${prodId}`);
    if (eurEl) eurEl.textContent = prices.formattedPrimary;
    if (gbpEl) gbpEl.textContent = prices.formattedSecondary;
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

  mixThisProduct(product) {
    this.selectedColors['base'] = product;
    this.switchTab('tab-calculator', 'view-calculator');
    this.updateCalculation();
  }

  setCoveragePreset(panelKey) {
    const preset = PRESET_PANELS[panelKey];
    if (!preset) return;

    const detailsEl = document.getElementById('coverage-preset-details');
    if (detailsEl) {
      detailsEl.innerHTML = `
        <strong>${preset.name}</strong><br>
        Surface Area: ${preset.sqMeters} m² (${preset.sqFeet} sq ft)<br>
        Est. Basecoat Volume: ${preset.basecoatMl} mL<br>
        Est. Clearcoat Volume: ${preset.clearcoatMl} mL<br>
        Recommended Gun Tip: 1.3mm - 1.4mm HVLP
      `;
    }

    const volInput = document.getElementById('input-total-volume');
    if (volInput) {
      volInput.value = preset.basecoatMl;
      this.totalMlNeeded = preset.basecoatMl;
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

  exportCSV() {
    this.shopifyCartManager.exportToCSV();
  }

  exportJSON() {
    this.shopifyCartManager.exportToJSON(this.currentRecipe);
  }
}

// Initialize Application & Bind Global
window.addEventListener('DOMContentLoaded', () => {
  window.paintApp = new PaintSystemApp();
});

