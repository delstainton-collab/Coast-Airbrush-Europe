import { ECOM_CATALOG } from '../../data/full_ecom_catalog.js';

export function escapeHtmlAttr(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export class BundleConfigurator {
  constructor(appRef) {
    this.app = appRef;
    this.currentCustomizingBundleId = 'fk-pro-mastery-bundle';
    this.customizerAllFlakes = [];
    this.customizerCalculatedValues = null;

    // Expose global window helper for inline HTML onclick handlers
    window.removeAdminBundleSlot = (idx) => this.removeAdminBundleSlot(idx);
  }

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
      this.app.shopifyCartManager.addItem({
        sku: item.sku || 'FK-BUNDLE-ITEM',
        title: item.name,
        priceEur: Number(item.priceEur) || ((bundle.priceEur || 100) / bundle.items.length),
        quantity: item.qty || 1,
        variantDetails: `${item.variant || 'Bundle Pack'} • UK Warehouse`
      });
    });

    this.app.openCartDrawer();
    this.app.showToast(`🔥 ${bundle.title} added to cart!`, 'success');
  }

  addFlakeKingMasterBundleToCart() {
    this.addConfiguredBundleToCart('fk-pro-mastery-bundle');
  }

  getFlakeTierInfo(product) {
    if (!product) {
      return { tier: 1, name: 'Standard Classic', deltaGbp: 0, deltaEur: 0, badge: 'Standard [Included]' };
    }
    const nameLower = (product.name || '').toLowerCase();
    const skuLower = (product.sku || product.id || '').toLowerCase();

    // Tier 3: Holographic / Kromatic / Specialty Rainbow
    const isTier3 = nameLower.includes('kromatic') || 
                    nameLower.includes('holo') || 
                    nameLower.includes('prismatic') ||
                    skuLower.includes('kromatic') ||
                    skuLower.includes('holo');
    if (isTier3) {
      return { 
        tier: 3, 
        name: 'Kromatic Holographic', 
        deltaGbp: 12.00, 
        deltaEur: 14.00, 
        badge: 'HOLO TIER (+£12 / +€14)'
      };
    }

    // Tier 2: Ultra-Small / Micro .002" Hex
    const isTier2 = nameLower.includes('.002') || 
                    nameLower.includes('ultra small') || 
                    nameLower.includes('ultra-small') || 
                    nameLower.includes('micro') ||
                    skuLower.includes('002');
    if (isTier2) {
      return { 
        tier: 2, 
        name: 'Ultra-Small .002"', 
        deltaGbp: 5.00, 
        deltaEur: 6.00, 
        badge: 'ULTRA-SMALL (+£5 / +€6)'
      };
    }

    // Tier 1: Standard Classics (Show Krome .015, Elvis Gold, Gun Metal, etc.)
    return { 
      tier: 1, 
      name: 'Standard Metallic', 
      deltaGbp: 0, 
      deltaEur: 0, 
      badge: 'STANDARD [INCLUDED]'
    };
  }

  openBundleCustomizerModal(bundleId = 'fk-pro-mastery-bundle') {
    const bundle = this.getActiveBundle(bundleId);
    if (!bundle) return;

    this.currentCustomizingBundleId = bundle.id;
    const modal = document.getElementById('modal-bundle-customizer');
    const container = document.getElementById('bundle-customizer-slots');

    this.customizerAllFlakes = ECOM_CATALOG.filter(p => 
      (p.category && p.category.includes('Glitter')) ||
      Boolean(p.flakeType) ||
      (p.name && p.name.includes('Metal Flake') && !p.name.includes('Gun') && !p.name.includes('Kit') && !p.name.includes('Attachment') && !p.name.includes('Jar & Lid') && !p.name.includes('Adaptor'))
    );

    const tier1Flakes = this.customizerAllFlakes.filter(f => this.getFlakeTierInfo(f).tier === 1);
    const tier3Flakes = this.customizerAllFlakes.filter(f => this.getFlakeTierInfo(f).tier === 3);

    const renderFlakeOptions = (defaultSelectedSku) => `
      <optgroup label="✨ TIER 1: STANDARD METALLIC CLASSICS [INCLUDED]">
        ${tier1Flakes.map(f => {
          const val = f.sku || f.id;
          const isSel = defaultSelectedSku ? (val === defaultSelectedSku) : (f.name.includes('Show Krome') && !f.name.includes('Kromatic'));
          return `<option value="${val}" ${isSel ? 'selected' : ''}>${f.name.replace('Metal Flake', '').replace('Flake King', '').trim()} — [Included]</option>`;
        }).join('')}
      </optgroup>
      <optgroup label="🌈 TIER 3: KROMATIC HOLOGRAPHIC SERIES (+£12.00 / +€14.00)">
        ${tier3Flakes.map(f => {
          const val = f.sku || f.id;
          const isSel = defaultSelectedSku ? (val === defaultSelectedSku) : false;
          return `<option value="${val}" ${isSel ? 'selected' : ''}>${f.name.replace('Metal Flake', '').replace('Flake King', '').trim()} — [+£12 / +€14]</option>`;
        }).join('')}
      </optgroup>
    `;

    const renderSizeOptions = (defaultSize = '0.015') => `
      <option value="0.015" ${defaultSize === '0.015' ? 'selected' : ''}>Medium .015" (Optimal Gun Flow) — [Included]</option>
      <option value="0.008" ${defaultSize === '0.008' ? 'selected' : ''}>Small .008" (Fine Grain) — [Included]</option>
      <option value="0.002" ${defaultSize === '0.002' ? 'selected' : ''}>Ultra-Small .002" (Micro Dust Finish) — [+£5.00 / +€6.00 Upgrade]</option>
      <option value="0.025" ${defaultSize === '0.025' ? 'selected' : ''}>Large .025" (Heavy Sparkle) — [Included]</option>
    `;

    if (container) {
      container.innerHTML = `
        <!-- Slot 1: Gun (Core Hardware) -->
        <div class="p-3 bg-surface border border-secondary/40 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-emerald-400 text-xl flex-shrink-0">verified</span>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-headline text-xs uppercase text-white font-bold block">Flake King 550 Mini Dry Metal Flake Gun</span>
                <span class="font-mono text-[9px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/40 font-bold">RRP £99.99 / €116.99</span>
              </div>
              <span class="font-mono text-[11px] text-secondary">Standard 1/4" Airbrush Fitting • Direct-Mount Jar Thread • 100% Contamination-Free</span>
            </div>
          </div>
          <span class="font-mono text-[10px] text-neutral-400 uppercase bg-surface-container px-2 py-1 rounded border border-secondary/40 whitespace-nowrap">
            LOCKED BUNDLE CORE
          </span>
        </div>

        <!-- Slot 2: Primary Flake Selection -->
        <div class="p-3 bg-surface border border-secondary/40 rounded space-y-2.5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-secondary/20 pb-1.5">
            <div class="flex items-center gap-1.5">
              <span class="w-5 h-5 rounded-full bg-primary/20 text-primary font-mono text-[11px] flex items-center justify-center font-bold">1</span>
              <span class="font-headline text-xs uppercase text-white font-bold">Primary Flake Finish (30g Gun-Mount Jar)</span>
            </div>
            <span class="text-[10px] font-mono text-emerald-400">Standard classics included • Holo &amp; Ultra upgrades available</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div class="sm:col-span-7">
              <label class="font-label-xs text-[10px] uppercase text-secondary font-bold block mb-1">Select Flake Color Shade:</label>
              <select id="customizer-slot-flake-1" class="mech-select !py-1.5 !px-2 !text-xs w-full">
                ${renderFlakeOptions()}
              </select>
            </div>
            <div class="sm:col-span-5">
              <label class="font-label-xs text-[10px] uppercase text-secondary font-bold block mb-1">Particle Size:</label>
              <select id="customizer-slot-flake-1-size" class="mech-select !py-1.5 !px-2 !text-xs w-full">
                ${renderSizeOptions('0.015')}
              </select>
            </div>
          </div>
        </div>

        <!-- Upsell Card: Add 2nd Flake Color Duo -->
        <div class="p-3.5 bg-gradient-to-r from-amber-950/40 via-surface to-amber-950/40 border-2 border-amber-500/60 rounded-md shadow-sm space-y-3">
          <label class="flex items-start gap-2.5 cursor-pointer select-none">
            <input type="checkbox" id="customizer-upsell-flake2-toggle" class="mt-1 w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer">
            <div class="flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-headline text-xs uppercase text-amber-300 font-bold tracking-wide flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm text-amber-400">add_circle</span> Add 2nd Flake Jar (Base + Accent Duo)
                </span>
                <span class="text-[9px] font-mono text-emerald-400 bg-emerald-950/90 border border-emerald-500/50 px-1.5 py-0.5 rounded font-bold">SAVE 25%</span>
                <span class="text-[10px] font-mono text-amber-200">From only <strong class="text-white">+£12.00 / +€14.00</strong></span>
              </div>
              <p class="text-[11px] text-neutral-300 font-body mt-0.5 leading-snug">
                Pro custom jobs almost always blend 2 complementary colors (e.g. Silver base with Gold, Blue or Holo highlights). Add a second 30g jar now at 25% off with zero additional postage.
              </p>
            </div>
          </label>

          <div id="customizer-upsell-flake2-body" class="hidden pt-2.5 border-t border-amber-500/30 space-y-2.5 bg-black/20 p-2.5 rounded">
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div class="sm:col-span-7">
                <label class="font-label-xs text-[10px] uppercase text-amber-300 font-bold block mb-1">Select 2nd Accent Flake:</label>
                <select id="customizer-slot-flake-2" class="mech-select !py-1.5 !px-2 !text-xs w-full">
                  ${renderFlakeOptions('kromatic-elvis-gold-metal-flake')}
                </select>
              </div>
              <div class="sm:col-span-5">
                <label class="font-label-xs text-[10px] uppercase text-amber-300 font-bold block mb-1">2nd Flake Particle Size:</label>
                <select id="customizer-slot-flake-2-size" class="mech-select !py-1.5 !px-2 !text-xs w-full">
                  ${renderSizeOptions('0.015')}
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Slot 3: Masking Tape -->
        <div class="p-3 bg-surface border border-secondary/40 rounded space-y-2">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-secondary/20 pb-1.5">
            <div class="flex items-center gap-1.5">
              <span class="w-5 h-5 rounded-full bg-primary/20 text-primary font-mono text-[11px] flex items-center justify-center font-bold">2</span>
              <span class="font-headline text-xs uppercase text-white font-bold">Orange Fine Line Masking Tape (55m Roll)</span>
            </div>
            <span class="text-[10px] font-mono text-neutral-400">Micro-edge curve separation • Zero bleed</span>
          </div>

          <div>
            <label class="font-label-xs text-[10px] uppercase text-secondary font-bold block mb-1">Select Precision Width:</label>
            <select id="customizer-slot-tape" class="mech-select !py-1.5 !px-2 !text-xs w-full">
              <option value="3mm" selected>3mm (Precision Curve &amp; Flow Lines) — [Included]</option>
              <option value="6mm">6mm (Standard Edge &amp; Bodylines) — [Included]</option>
              <option value="1.5mm">1.5mm (Micro-Pinstripe &amp; Tight Fillets) — [+£1.00 / +€1.20]</option>
              <option value="9mm">9mm (Wide Separation) — [+£1.50 / +€1.80]</option>
              <option value="12mm">12mm (Heavy Base Masking) — [+£2.00 / +€2.40]</option>
            </select>
          </div>
        </div>
      `;

      const elementsToWatch = [
        'customizer-slot-flake-1',
        'customizer-slot-flake-1-size',
        'customizer-slot-tape',
        'customizer-slot-flake-2',
        'customizer-slot-flake-2-size'
      ];

      elementsToWatch.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', () => this.recalculateCustomizerPrice());
      });

      const upsellToggle = document.getElementById('customizer-upsell-flake2-toggle');
      if (upsellToggle) {
        upsellToggle.addEventListener('change', () => {
          const body = document.getElementById('customizer-upsell-flake2-body');
          if (body) {
            if (upsellToggle.checked) {
              body.classList.remove('hidden');
            } else {
              body.classList.add('hidden');
            }
          }
          this.recalculateCustomizerPrice();
        });
      }
    }

    this.recalculateCustomizerPrice();
    if (modal) modal.classList.add('active');
  }

  recalculateCustomizerPrice() {
    const baseEur = 129.95;
    const baseGbp = 109.95;
    const gunRrpEur = 116.99;
    const gunRrpGbp = 99.99;

    // Flake 1
    const flake1Select = document.getElementById('customizer-slot-flake-1');
    const flake1SizeSelect = document.getElementById('customizer-slot-flake-1-size');
    const flake1Id = flake1Select?.value || '';
    const flake1Prod = (this.customizerAllFlakes || []).find(p => (p.sku || p.id) === flake1Id) || {};
    const flake1Tier = this.getFlakeTierInfo(flake1Prod);

    let flake1UpgradeEur = flake1Tier.deltaEur;
    let flake1UpgradeGbp = flake1Tier.deltaGbp;
    let flake1RrpEur = flake1Tier.tier === 3 ? 23.94 : 16.95;
    let flake1RrpGbp = flake1Tier.tier === 3 ? 20.46 : 14.49;

    const flake1Size = flake1SizeSelect?.value || '0.015';
    if (flake1Size === '0.002') {
      flake1UpgradeEur += 6.00;
      flake1UpgradeGbp += 5.00;
      flake1RrpEur = Math.max(flake1RrpEur, 19.95);
      flake1RrpGbp = Math.max(flake1RrpGbp, 17.49);
    }

    // Tape
    const tapeSelect = document.getElementById('customizer-slot-tape');
    const tapeVal = tapeSelect?.value || '3mm';
    let tapeUpgradeEur = 0;
    let tapeUpgradeGbp = 0;
    let tapeRrpEur = 6.95;
    let tapeRrpGbp = 5.95;

    if (tapeVal === '1.5mm') {
      tapeUpgradeEur = 1.20;
      tapeUpgradeGbp = 1.00;
      tapeRrpEur = 7.95;
      tapeRrpGbp = 6.95;
    } else if (tapeVal === '9mm') {
      tapeUpgradeEur = 1.80;
      tapeUpgradeGbp = 1.50;
      tapeRrpEur = 8.65;
      tapeRrpGbp = 7.45;
    } else if (tapeVal === '12mm') {
      tapeUpgradeEur = 2.40;
      tapeUpgradeGbp = 2.00;
      tapeRrpEur = 9.25;
      tapeRrpGbp = 7.95;
    }

    // Optional 2nd Flake Upsell
    const upsellToggle = document.getElementById('customizer-upsell-flake2-toggle');
    const hasUpsell = upsellToggle?.checked || false;
    let upsellEur = 0;
    let upsellGbp = 0;
    let upsellRrpEur = 0;
    let upsellRrpGbp = 0;

    if (hasUpsell) {
      const flake2Select = document.getElementById('customizer-slot-flake-2');
      const flake2SizeSelect = document.getElementById('customizer-slot-flake-2-size');
      const flake2Id = flake2Select?.value || '';
      const flake2Prod = (this.customizerAllFlakes || []).find(p => (p.sku || p.id) === flake2Id) || {};
      const flake2Tier = this.getFlakeTierInfo(flake2Prod);

      upsellEur = 14.00;
      upsellGbp = 12.00;
      upsellRrpEur = flake2Tier.tier === 3 ? 23.94 : (flake2Prod.priceEur || 16.95);
      upsellRrpGbp = flake2Tier.tier === 3 ? 20.46 : (flake2Prod.priceGbp || 14.49);

      if (flake2Tier.tier === 3) {
        upsellEur += 8.00;
        upsellGbp += 8.00;
      }

      const flake2Size = flake2SizeSelect?.value || '0.015';
      if (flake2Size === '0.002') {
        upsellEur += 5.00;
        upsellGbp += 4.00;
        upsellRrpEur = Math.max(upsellRrpEur, 19.95);
        upsellRrpGbp = Math.max(upsellRrpGbp, 17.49);
      }
    }

    const totalBundleEur = baseEur + flake1UpgradeEur + tapeUpgradeEur + upsellEur;
    const totalBundleGbp = baseGbp + flake1UpgradeGbp + tapeUpgradeGbp + upsellGbp;

    const totalRrpEur = gunRrpEur + flake1RrpEur + tapeRrpEur + upsellRrpEur;
    const totalRrpGbp = gunRrpGbp + flake1RrpGbp + tapeRrpGbp + upsellRrpGbp;

    const savingsEur = Math.max(0, totalRrpEur - totalBundleEur);
    const savingsGbp = Math.max(0, totalRrpGbp - totalBundleGbp);
    const savingsPct = totalRrpEur > 0 ? Math.round((savingsEur / totalRrpEur) * 100) : 10;

    this.customizerCalculatedValues = {
      totalBundleEur,
      totalBundleGbp,
      flake1UpgradeEur,
      flake1UpgradeGbp,
      tapeUpgradeEur,
      tapeUpgradeGbp,
      upsellEur,
      upsellGbp,
      hasUpsell,
      flake1Prod,
      flake1Size,
      tapeVal
    };

    const priceEurEl = document.getElementById('customizer-bundle-price');
    const priceGbpEl = document.getElementById('customizer-bundle-gbp');
    const retailEl = document.getElementById('customizer-bundle-retail');
    const savingsEl = document.getElementById('customizer-bundle-savings');
    const btnLabelEl = document.getElementById('btn-custom-bundle-label');

    if (priceEurEl) priceEurEl.textContent = `€${totalBundleEur.toFixed(2)}`;
    if (priceGbpEl) priceGbpEl.textContent = `/ £${totalBundleGbp.toFixed(2)}`;
    if (retailEl) retailEl.textContent = `€${totalRrpEur.toFixed(2)} / £${totalRrpGbp.toFixed(2)}`;
    if (savingsEl) {
      savingsEl.textContent = `SAVE €${savingsEur.toFixed(2)} / £${savingsGbp.toFixed(2)} (${savingsPct}% OFF)`;
    }
    if (btnLabelEl) {
      btnLabelEl.textContent = hasUpsell ? `ADD PRO DUO KIT TO CART (€${totalBundleEur.toFixed(2)})` : `ADD CUSTOM KIT TO CART (€${totalBundleEur.toFixed(2)})`;
    }
  }

  closeBundleCustomizerModal() {
    const modal = document.getElementById('modal-bundle-customizer');
    if (modal) modal.classList.remove('active');
  }

  submitCustomizedBundleToCart() {
    const calc = this.customizerCalculatedValues;
    if (!calc) return;

    // 1. Core Hardware: Flake King 550 Mini Gun
    this.app.shopifyCartManager.addItem({
      sku: 'FOM550',
      title: 'Flake King 550 Mini Dry Metal Flake Gun',
      priceEur: 112.95,
      quantity: 1,
      variantDetails: 'Standard 1/4" Airbrush Fitting • Pro Kit Core'
    });

    // 2. Primary Flake Jar
    const flake1Select = document.getElementById('customizer-slot-flake-1');
    const flake1Id = flake1Select?.value || 'fk-2610';
    const flake1Prod = (this.customizerAllFlakes || []).find(p => (p.sku || p.id) === flake1Id) || {};
    const flake1Size = calc.flake1Size || '0.015';
    const flake1Tier = this.getFlakeTierInfo(flake1Prod);
    const flake1PriceEur = Number((10.95 + (calc.flake1UpgradeEur || 0)).toFixed(2));

    this.app.shopifyCartManager.addItem({
      sku: flake1Prod.sku || flake1Id,
      title: `Flake King ${flake1Prod.name || 'Show Krome Metal Flake'} (${flake1Size}")`,
      priceEur: flake1PriceEur,
      quantity: 1,
      variantDetails: `30g Gun-Mount Jar • ${flake1Tier.badge} • Custom Pro Kit`
    });

    // 3. Precision Masking Tape
    const tapeVal = calc.tapeVal || '3mm';
    const tapePriceEur = Number((6.05 + (calc.tapeUpgradeEur || 0)).toFixed(2));

    this.app.shopifyCartManager.addItem({
      sku: `FK-TAPE-${tapeVal.toUpperCase()}`,
      title: `Orange Fine Line Masking Tape (${tapeVal})`,
      priceEur: tapePriceEur,
      quantity: 1,
      variantDetails: `${tapeVal} Precision Width x 55m • Custom Pro Kit`
    });

    // 4. Optional 2nd Flake Jar (if selected)
    if (calc.hasUpsell) {
      const flake2Select = document.getElementById('customizer-slot-flake-2');
      const flake2SizeSelect = document.getElementById('customizer-slot-flake-2-size');
      const flake2Id = flake2Select?.value || 'fk-2319';
      const flake2Prod = (this.customizerAllFlakes || []).find(p => (p.sku || p.id) === flake2Id) || {};
      const flake2Size = flake2SizeSelect?.value || '0.015';
      const flake2PriceEur = Number((calc.upsellEur || 14.00).toFixed(2));

      this.app.shopifyCartManager.addItem({
        sku: flake2Prod.sku || flake2Id,
        title: `Flake King ${flake2Prod.name || 'Elvis Gold Metal Flake'} (${flake2Size}")`,
        priceEur: flake2PriceEur,
        quantity: 1,
        variantDetails: `30g Gun-Mount Jar • Pro Duo Add-on Flake`
      });
    }

    this.closeBundleCustomizerModal();
    this.app.openCartDrawer();
    this.app.showToast(calc.hasUpsell ? "🔥 Flake King Pro Duo Kit added to cart!" : "🎨 Custom Pro Flake Kit loaded to cart!", "success");
  }

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
            <input type="text" class="admin-slot-variant mech-input w-full !py-1.5 !text-xs font-mono" value="${escapeHtmlAttr(item.variant || '')}" placeholder="e.g. 30g Jar or 3mm Roll">
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
      this.app.showToast("A bundle must contain at least 1 product slot.", "warning");
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
      this.app.showToast("Please provide a bundle title.", "warning");
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
    this.app.showToast("✅ Bundle configuration published to live storefront!", "success");
  }

  resetBundleFromAdmin() {
    if (confirm("Reset bundle back to factory Flake King defaults?")) {
      if (window.BundleConfigEngine) {
        window.BundleConfigEngine.resetDefaults();
      }
      this.renderAdminBundles();
      this.renderFeaturedBundle();
      this.app.showToast("↺ Bundle reset to factory defaults.", "info");
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
}
