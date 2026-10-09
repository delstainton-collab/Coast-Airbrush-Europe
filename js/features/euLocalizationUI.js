// EU Localization, Currency, VAT Toggle & Multi-Language UI Controller
// Extracted per Anti-God Monolith Architecture Skill (Target <= 250 lines)

export class EuLocalizationUI {
  constructor(appRef) {
    this.app = appRef;
  }

  get euLocalization() {
    return this.app.euLocalization;
  }

  get i18n() {
    return this.app.i18n;
  }

  get shopifyCartManager() {
    return this.app.shopifyCartManager;
  }

  setup() {
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
        if (this.app.reviewMode) {
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
        this.app.renderStorefrontGrid();
        this.app.syncFeaturedShowcaseCards();
        this.app.renderCartSummary(this.shopifyCartManager.getCartSummary());
      });
    }

    if (vatToggleExBtn) {
      vatToggleExBtn.addEventListener('click', () => {
        this.euLocalization.setVatDisplayMode('ex');
        updateHeaderFromEU();
        this.app.renderStorefrontGrid();
        this.app.syncFeaturedShowcaseCards();
        if (this.app.activeModalProduct) {
          this.app.openDetailModal(this.app.activeModalProduct.id);
        }
      });
    }

    if (vatToggleIncBtn) {
      vatToggleIncBtn.addEventListener('click', () => {
        this.euLocalization.setVatDisplayMode('inc');
        updateHeaderFromEU();
        this.app.renderStorefrontGrid();
        this.app.syncFeaturedShowcaseCards();
        if (this.app.activeModalProduct) {
          this.app.openDetailModal(this.app.activeModalProduct.id);
        }
      });
    }

    if (unitBtn) {
      unitBtn.addEventListener('click', () => {
        const next = this.euLocalization.unitPreference === 'metric' ? 'imperial' : 'metric';
        this.euLocalization.setUnitPreference(next);
        updateHeaderFromEU();
        this.app.renderStorefrontGrid();
        this.app.syncFeaturedShowcaseCards();
      });
    }

    // EU VAT Validator in Cart Drawer
    this.app.addSafeListener('btn-verify-vat', () => {
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
      this.app.renderCartSummary(this.shopifyCartManager.getCartSummary());
    });

    this.euLocalization.onUpdate(() => {
      const country = this.euLocalization.getCountry();
      if (country && country.currency) {
        this.shopifyCartManager.setCurrency(country.currency);
      }
      updateHeaderFromEU();
      this.app.syncFeaturedShowcaseCards();
      this.app.updateDropdownOptionPrices();
      this.app.renderStorefrontGrid();
      this.app.renderCartSummary(this.shopifyCartManager.getCartSummary());
    });

    this.i18n.onUpdate(() => {
      updateHeaderFromEU();
      applyTranslations();
    });
  }
}
