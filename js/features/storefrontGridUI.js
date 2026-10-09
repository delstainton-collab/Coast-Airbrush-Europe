// Storefront Product Grid & Variant Engine Controller
// Extracted per Anti-God Monolith Architecture Skill (Laws 2 & 3)

import { ECOM_CATALOG } from '../../data/full_ecom_catalog.js';

export class StorefrontGridUI {
  constructor(appRef) {
    this.app = appRef;
  }

  get selectedProductVariants() { return this.app.selectedProductVariants; }
  get activeBrandFilter() { return this.app.activeBrandFilter; }
  get activeCategoryFilter() { return this.app.activeCategoryFilter; }
  get activeFlakeSubcat() { return this.app.activeFlakeSubcat; }
  get searchQuery() { return this.app.searchQuery; }
  get activeSort() { return this.app.activeSort; }
  get isB2BMode() { return this.app.isB2BMode; }
  get b2bSession() { return this.app.b2bSession; }
  get b2bPricing() { return this.app.b2bPricing; }
  get euLocalization() { return this.app.euLocalization; }
  get shopifyCartManager() { return this.app.shopifyCartManager; }
  get activeModalProduct() { return this.app.productDetailModal?.activeModalProduct || this.app.activeModalProduct; }

  getAssetUrl(path) {
    return this.app.getAssetUrl ? this.app.getAssetUrl(path) : path;
  }

  escapeHtml(str) {
    return this.app.escapeHtml ? this.app.escapeHtml(str) : String(str || '');
  }

  escapeHtmlAttr(str) {
    return this.app.escapeHtmlAttr ? this.app.escapeHtmlAttr(str) : String(str || '');
  }

  calculateDisplayPrice(prod, selectedPack, selectedSize, selectedWidth) {
    return this.getProductCalculatedPrice(prod, selectedPack, selectedSize, selectedWidth);
  }

  getProductCalculatedPrice(prod, selectedPack, selectedSize, selectedWidth) {
    let priceEur = prod.priceEur || 24.00;
    let finalGbp = prod.priceGbp !== undefined ? prod.priceGbp : null;
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
        if (match.priceGbp) finalGbp = match.priceGbp;
        if (match.sku) matchedSku = match.sku;
        if (match.stockCode) matchedStockCode = match.stockCode;
        if (match.barcode) matchedBarcode = match.barcode;
      }
    }
    // 2. Check tapePriceMatrix (Tape products)
    else if (prod.tapePriceMatrix && prod.tapePriceMatrix.length > 0) {
      const targetWidth = selectedWidth || selectedSize || selectedPack;
      if (targetWidth) {
        const match = prod.tapePriceMatrix.find(t => t.width === targetWidth || this.app.matchPackToken(targetWidth, t.width));
        if (match) {
          if (match.priceEur) priceEur = match.priceEur;
          if (match.priceGbp) finalGbp = match.priceGbp;
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
        const matchPack = !selectedPack || this.app.matchPackToken(selectedPack, pSize) || this.app.matchPackToken(selectedPack, m.packSize);
        const matchSize = !selectedSize || this.app.matchFlakeSizeToken(selectedSize, fSize) || this.app.matchFlakeSizeToken(selectedSize, m.flakeSize);
        return matchPack && matchSize;
      });
      if (match) {
        if (match.priceEur) priceEur = match.priceEur;
        if (match.priceGbp) finalGbp = match.priceGbp;
        if (match.sku) matchedSku = match.sku;
        if (match.stockCode) matchedStockCode = match.stockCode;
        if (match.barcode) matchedBarcode = match.barcode;
      } else if (prod.packPriceMatrix && (selectedPack || selectedSize)) {
        const packMatch = prod.packPriceMatrix.find(m => 
          (selectedPack && (this.app.matchPackToken(selectedPack, m.packSize) || selectedPack === m.packSize)) ||
          (selectedSize && (this.app.matchPackToken(selectedSize, m.packSize) || selectedSize === m.packSize))
        );
        if (packMatch) {
          if (packMatch.priceEur) priceEur = packMatch.priceEur;
          if (packMatch.priceGbp) finalGbp = packMatch.priceGbp;
          if (packMatch.sku) matchedSku = packMatch.sku;
          if (packMatch.stockCode) matchedStockCode = packMatch.stockCode;
          if (packMatch.barcode) matchedBarcode = packMatch.barcode;
        }
      }
    } else if (prod.packPriceMatrix && (selectedPack || selectedSize)) {
      const match = prod.packPriceMatrix.find(m => 
        (selectedPack && (this.app.matchPackToken(selectedPack, m.packSize) || selectedPack === m.packSize)) ||
        (selectedSize && (this.app.matchPackToken(selectedSize, m.packSize) || selectedSize === m.packSize))
      );
      if (match) {
        if (match.priceEur) priceEur = match.priceEur;
        if (match.priceGbp) finalGbp = match.priceGbp;
        if (match.sku) matchedSku = match.sku;
        if (match.stockCode) matchedStockCode = match.stockCode;
        if (match.barcode) matchedBarcode = match.barcode;
      }
    }

    const retailPriceEur = priceEur;
    const retailPriceGbp = (finalGbp !== null) ? finalGbp : priceEur * 0.85;

    let finalEur = priceEur;

    if (this.isB2BMode && this.b2bSession) {
      const lookupKey = matchedSku || matchedStockCode || prod.sku || prod.stockCode;
      if (this.b2bPricing && lookupKey && this.b2bPricing[lookupKey]) {
        const itemPricing = this.b2bPricing[lookupKey];
        if (itemPricing.priceEur !== null && itemPricing.priceEur !== undefined) finalEur = itemPricing.priceEur;
        if (itemPricing.priceGbp !== null && itemPricing.priceGbp !== undefined) finalGbp = itemPricing.priceGbp;
      } else {
        const mult = this.b2bSession.discountMultiplier || (this.b2bSession.role === 'distributor' ? 0.45 : 0.70);
        finalEur = priceEur * mult;
        if (finalGbp !== null) finalGbp = finalGbp * mult;
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
    let secondaryCurrencyFormatted = '';
    if (country.currency === 'GBP') {
      secondaryCurrencyFormatted = `€${finalEur.toFixed(2)} EUR`;
    } else if (country.currency === 'USD') {
      secondaryCurrencyFormatted = `€${finalEur.toFixed(2)} / £${finalGbp.toFixed(2)}`;
    } else {
      secondaryCurrencyFormatted = `£${finalGbp.toFixed(2)} GBP`;
    }

    const isB2B = Boolean(this.isB2BMode && this.b2bSession);
    const tierRole = this.b2bSession ? this.b2bSession.role : 'retail';

    // Calculate full retail MSRP in local currency (anchor for transparent margin display)
    const retailLocal = (country.currency === 'GBP') ? retailPriceGbp : retailPriceEur * country.rateToEur;
    const retailBreakdown = this.euLocalization.calculatePriceBreakdown(retailLocal);
    const retailDisplayNumber = vatMode === 'inc' ? retailBreakdown.priceGross : retailBreakdown.priceNet;
    const retailFormatted = `${country.symbol}${retailDisplayNumber.toFixed(2)}`;

    // Margin & Savings calculations
    const savingsLocal = Math.max(0, retailDisplayNumber - displayPrimaryNumber);
    const savingsFormatted = `${country.symbol}${savingsLocal.toFixed(2)}`;
    const marginPercent = retailDisplayNumber > 0 ? Math.round(((retailDisplayNumber - displayPrimaryNumber) / retailDisplayNumber) * 100) : 0;

    // Minimum Order Quantity (MOQ) logic
    const isHardware = (prod.name || '').includes('Gun') || (prod.name || '').includes('Airbrush') || prod.category === 'Dry Metal Flake Guns' || prod.category === 'Airbrushes & Spray Guns' || prod.category === 'VsionAir Workstations';
    let moq = 1;
    let moqLabel = 'Single Unit';
    if (tierRole === 'distributor') {
      moq = isHardware ? 2 : 12;
      moqLabel = isHardware ? '2 Units (Master Pack)' : '12 Units (Master Case)';
    } else if (tierRole === 'dealer') {
      moq = isHardware ? 1 : 6;
      moqLabel = isHardware ? '1 Unit' : '6 Units (Inner Pack)';
    }

    return {
      priceEur: finalEur,
      priceGbp: finalGbp,
      finalGbp,
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
      isB2B,
      tierRole,
      retailPriceEur,
      retailPriceGbp,
      retailLocal,
      retailFormatted,
      savingsLocal,
      savingsFormatted,
      marginPercent,
      moq,
      moqLabel,
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
      filtered = filtered.filter(p => this.app.matchCategory(p, this.activeCategoryFilter));
    }

    if (this.activeFlakeSubcat && this.activeFlakeSubcat !== 'all') {
      filtered = filtered.filter(p => {
        const subCat = (this.app.getFlakeSubcategory(p) || '').toLowerCase();
        if (!subCat) return false;
        const target = this.activeFlakeSubcat.toLowerCase();
        if (target === 'single') return subCat.includes('single');
        if (target === 'mixed' || target === 'blend') return subCat.includes('mixed') || subCat.includes('blend');
        if (target === 'kromatic' || target === 'holographic') return subCat.includes('kromatic') || subCat.includes('holographic');
        if (target === 'iridescent') return subCat.includes('iridescent');
        return subCat === target;
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
        const rA = parseFloat(this.app.getProductReviewData(a).rating);
        const rB = parseFloat(this.app.getProductReviewData(b).rating);
        return rB - rA;
      });
    } else if (this.activeSort === 'name') {
      filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else {
      // Default / Popular sort: prioritize actual spray guns over accessories when viewing all gun hardware
      if (this.activeCategoryFilter === 'flake-guns-all' || (this.activeBrandFilter === 'Flake King' && this.activeCategoryFilter === 'all')) {
        filtered.sort((a, b) => {
          const aIsGun = a.category === 'Dry Metal Flake Guns' ? 1 : 0;
          const bIsGun = b.category === 'Dry Metal Flake Guns' ? 1 : 0;
          if (aIsGun !== bIsGun) return bIsGun - aIsGun;
          return 0;
        });
      }
    }

    const countBadge = document.getElementById('shop-results-count');
    if (countBadge) {
      const brandText = this.activeBrandFilter === 'all' ? 'All Brands' : this.activeBrandFilter;
      const catText = this.activeCategoryFilter === 'all' ? 'All Categories' : this.activeCategoryFilter;
      const totalActive = ECOM_CATALOG.filter(p => !p.hideFromStorefront).length;
      const brandSuffix = (this.activeBrandFilter === 'VsionAir' || this.activeCategoryFilter === 'vsionair-all') ? 'Coming Soon Products' : 'Products';
      countBadge.textContent = `Showing ${filtered.length} of ${totalActive} ${brandSuffix} (${brandText} > ${catText})`;
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
          validSizes = (prod.sizes || []).map(s => isFlake ? this.app.formatFlakeDimension(s) : String(s).trim()).filter(Boolean);
          validPacks = (prod.packSizes || []).map(p => isFlake ? this.app.formatFlakePackSize(p) : String(p).trim()).filter(Boolean);

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
        const reviewData = this.app.getProductReviewData(prod) || { rating: '4.9', count: 24, quote: '', author: '' };

        const isComingSoon = Boolean(prod.isComingSoon || prod.brand === 'VsionAir' || (prod.badge && prod.badge.includes('COMING SOON')));
        const isPreOrder = !isComingSoon && Boolean(prod.isPreOrder || (prod.badge && (prod.badge.includes('EARLY BIRD') || prod.badge.includes('PRE-ORDER') || prod.badge.includes('BATCH 1'))) || prod.id.startsWith('preorder_'));
        const subCategoryLabel = isFlake ? this.app.getFlakeSubcategory(prod) : null;
        let badgeText = prod.badge || 'IN STOCK';
        if (this.isB2BMode && this.b2bSession) {
          badgeText = this.b2bSession.role === 'distributor' 
            ? '📦 DISTRIBUTOR WHOLESALE' 
            : '🏢 DEALER WHOLESALE';
        } else if (isComingSoon) {
          badgeText = '⏳ COMING SOON';
        } else if (isPreOrder) {
          badgeText = `⏳ ${prod.badge || 'PRE-ORDER'}`;
        } else if (isFlake && subCategoryLabel) {
          badgeText = `✨ ${subCategoryLabel.toUpperCase()}`;
        }

        let variantControls = '';

        if (validSizes.length > 1) {
          variantControls += `
            <div class="mb-2">
              <label class="block text-[10px] font-mono text-secondary mb-1 uppercase tracking-wider">${sizeLabel}:</label>
              <select id="select-size-${prod.id}" data-select-size="${prod.id}" class="w-full bg-surface-dim border border-secondary text-white text-xs font-mono py-1.5 px-2 rounded focus:border-primary focus:outline-none transition-colors" onchange="window.paintApp.onProductVariantChange('${prod.id}', 'size', this.value)">
                ${validSizes.map(s => {
                  return `<option value="${this.escapeHtmlAttr(s)}" ${s === currentSelection.size ? 'selected' : ''}>${s}</option>`;
                }).join('')}
              </select>
            </div>
          `;
        }

        if (validPacks.length > 1) {
          variantControls += `
            <div class="mb-2">
              <label class="block text-[10px] font-mono text-secondary mb-1 uppercase tracking-wider">${packLabel}</label>
              <select id="select-pack-${prod.id}" data-select-pack="${prod.id}" class="w-full bg-surface-dim border border-secondary text-white text-xs font-mono py-1.5 px-2 rounded focus:border-primary focus:outline-none transition-colors" onchange="window.paintApp.onProductVariantChange('${prod.id}', 'pack', this.value)">
                ${validPacks.map(p => {
                  const optPrice = this.getProductCalculatedPrice(prod, p, currentSelection.size, currentSelection.width);
                  return `<option value="${this.escapeHtmlAttr(p)}" ${p === currentSelection.pack ? 'selected' : ''}>${p} (${optPrice ? optPrice.formattedPrimary + ' ' + optPrice.primaryVatBadge : ''})</option>`;
                }).join('')}
              </select>
            </div>
          `;
        }

        const card = document.createElement('div');
        card.className = 'industrial-card p-4 flex flex-col justify-between group hover:border-primary transition-all';
        
        const imgSrc = this.getAssetUrl(prod.image) || this.getAssetUrl('assets/images/coast_airbrush_logo.jpg');

        card.innerHTML = `
          <div>
            <div class="flex justify-between items-start mb-2 gap-2">
              <span class="metal-spec-plate-red text-[10px] font-bold truncate max-w-[140px]"><span id="card-sku-val-${prod.id}">${prices.sku}</span></span>
              <span class="badge ${isComingSoon ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50' : (isPreOrder ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50' : (prod.inStock ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50' : 'bg-rose-950/80 text-rose-300 border border-rose-500/50'))} text-[10px] font-mono font-bold px-2 py-0.5 rounded leading-none whitespace-nowrap">
                ${badgeText}
              </span>
            </div>

            <div class="w-full h-44 bg-surface-container-lowest border border-secondary mb-3 flex items-center justify-center p-2 relative overflow-hidden group-hover:border-primary/50 transition-colors">
              <img id="card-img-${prod.id}" data-card-img="${prod.id}" src="${imgSrc}" alt="${this.escapeHtml(prod.name)}" class="max-h-full max-w-full object-contain filter drop-shadow group-hover:scale-105 transition-transform duration-300" onerror="this.src='${this.getAssetUrl('assets/images/coast_airbrush_logo.jpg')}'">
              <div class="absolute bottom-1 right-1 text-[9px] font-mono bg-black/80 px-1 py-0.5 rounded border border-white/10 text-zinc-400">
                ${this.escapeHtml(prod.brand || 'Coast')}
              </div>
            </div>

            <div class="flex items-center gap-1 mb-1 text-[11px] font-mono">
              <span class="text-amber-400">★</span>
              <span class="font-bold text-white">${reviewData.rating}</span>
              <span class="text-secondary text-[10px]">(${reviewData.count})</span>
            </div>

            <h4 class="font-headline text-sm font-bold text-white uppercase line-clamp-2 mb-2" title="${this.escapeHtml(prod.name)}">${this.escapeHtml(prod.name)}</h4>
            <div class="text-[10px] font-mono text-secondary mb-3 truncate">${this.escapeHtml(prod.category || 'General')}</div>

            ${variantControls}

            <div class="p-2.5 bg-surface-dim rounded border border-secondary/40 mb-3 space-y-1">
              <div class="flex items-baseline justify-between">
                <span class="text-base font-bold font-mono text-primary" id="price-eur-${prod.id}">${prices.formattedPrimary}</span>
                <span id="price-vat-badge-${prod.id}" class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded leading-none ${prices.vatMode === 'inc' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'}">
                  ${prices.primaryVatBadge}
                </span>
              </div>
              <div class="text-[11px] font-mono text-secondary" id="price-gbp-${prod.id}">
                ${prices.formattedSecondary}
              </div>
              ${prices.isB2B ? `
                <div class="text-[10px] font-mono text-emerald-400 font-bold pt-1 border-t border-secondary/30 flex justify-between">
                  <span>MSRP: ${prices.retailFormatted}</span>
                  <span>Save ${prices.savingsFormatted} (${prices.marginPercent}%)</span>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="flex gap-2 pt-3 border-t border-secondary/40 mt-auto">
            <button type="button" onclick="window.paintApp.openDetailModal('${prod.id}')" class="flex-1 font-mono text-xs border border-secondary hover:border-primary text-zinc-200 hover:text-white py-2 px-2 rounded font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer">
              <span class="material-symbols-outlined text-[14px]">info</span> DETAILS
            </button>
            <button type="button" onclick="window.paintApp.addProductToCartById('${prod.id}')" class="flex-1 font-mono text-xs border border-primary bg-primary hover:bg-primary-hover text-black py-2 px-2 rounded font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer shadow-md">
              <span class="material-symbols-outlined text-[14px]">shopping_cart</span> ADD
            </button>
          </div>
        `;

        container.appendChild(card);
      } catch (err) {
        console.error(`Error rendering product card for ${prod.id}:`, err);
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

    // For tape products, width and size are synonymous
    const isTape = Boolean(prod.tapePriceMatrix || prod.tapeWidths || (prod.category && prod.category.includes('Masking')));
    if (isTape) {
      if (variantKey === 'width' || variantKey === 'size') {
        this.selectedProductVariants[prodId].width = val;
        this.selectedProductVariants[prodId].size = val;
      }
    }

    const currentSelection = this.selectedProductVariants[prodId];
    const prices = this.getProductCalculatedPrice(prod, currentSelection.pack, currentSelection.size, currentSelection.width);
    
    // Helper to set select value with token fuzzy matching if exact string doesn't match
    const setSelectVal = (sel, targetVal) => {
      if (!sel || !targetVal) return;
      if (sel.value === targetVal) return;
      // 1. Direct match attempt
      sel.value = targetVal;
      if (sel.value === targetVal) return;
      // 2. Fuzzy option match attempt
      for (let i = 0; i < sel.options.length; i++) {
        const opt = sel.options[i];
        if (opt.value === targetVal || this.app.matchPackToken(opt.value, targetVal)) {
          sel.selectedIndex = i;
          return;
        }
      }
    };

    // 1. Sync ALL select inputs across hero cards, catalog grid, and modal
    const targetSize = currentSelection.size || (isTape ? currentSelection.width : '');
    const sizeSelects = document.querySelectorAll(`select[id="select-size-${prodId}"], select[data-select-size="${prodId}"], select[data-variant-prod="${prodId}"][data-variant-key="size"], select#detail-select-size`);
    sizeSelects.forEach(sel => {
      setSelectVal(sel, targetSize);
    });

    const packSelects = document.querySelectorAll(`select[id="select-pack-${prodId}"], select[data-select-pack="${prodId}"], select[data-variant-prod="${prodId}"][data-variant-key="pack"], select#detail-select-pack`);
    packSelects.forEach(sel => {
      setSelectVal(sel, currentSelection.pack);
    });

    const targetWidth = currentSelection.width || (isTape ? currentSelection.size : '');
    const widthSelects = document.querySelectorAll(`select[id="select-width-${prodId}"], select[data-select-width="${prodId}"], select[data-variant-prod="${prodId}"][data-variant-key="width"]`);
    widthSelects.forEach(sel => {
      setSelectVal(sel, targetWidth);
    });

    // If coming soon or VsionAir, do not inject prices into DOM
    if (prod && (prod.isComingSoon || prod.brand === 'VsionAir')) {
      return;
    }

    // 2. Update ALL primary price elements across the DOM
    const primaryEls = document.querySelectorAll(`[id="price-eur-${prodId}"], [data-price-eur="${prodId}"], [data-price-primary="${prodId}"], .price-eur-${prodId}`);
    primaryEls.forEach(el => {
      el.textContent = prices.formattedPrimary;
    });

    // 3. Update ALL secondary price elements across the DOM
    let secondaryText = prices.formattedSecondary;
    if (prodId === 'kroma-mirror-chrome-system' || prodId === 'kroma-dedicated-topcoat-clear') {
      const country = this.euLocalization.getCountry();
      const gbpVal = (prices.finalGbp !== null && prices.finalGbp !== undefined) ? prices.finalGbp : (prices.priceEur * 0.85);
      if (country.currency === 'GBP') {
        secondaryText = `€${prices.priceEur.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR • ${prices.primaryVatBadge}`;
      } else if (country.currency === 'USD') {
        secondaryText = `€${prices.priceEur.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / £${gbpVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Export Ex-VAT)`;
      } else {
        secondaryText = `£${gbpVal.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} + VAT`;
      }
    }
    const secondaryEls = document.querySelectorAll(`[id="price-gbp-${prodId}"], [data-price-gbp="${prodId}"], [data-price-secondary="${prodId}"], .price-gbp-${prodId}`);
    secondaryEls.forEach(el => {
      el.textContent = secondaryText;
    });

    // 4. Update ALL VAT badge elements across the DOM
    const vatBadgeEls = document.querySelectorAll(`[id="price-vat-badge-${prodId}"], [data-price-vat-badge="${prodId}"], .price-vat-badge-${prodId}`);
    vatBadgeEls.forEach(el => {
      el.textContent = prices.primaryVatBadge;
      el.className = `text-[10px] font-mono font-bold px-1.5 py-0.5 rounded leading-none ${prices.vatMode === 'inc' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'}`;
    });

    // 5. Update ALL SKU elements across the DOM
    if (prices.sku) {
      const skuEls = document.querySelectorAll(`[id="card-sku-val-${prodId}"], [data-sku-val="${prodId}"], .card-sku-val-${prodId}`);
      skuEls.forEach(el => {
        el.textContent = prices.sku;
      });
    }

    // 6. Modal Price Elements (if modal is open for this product)
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

    // 7. Dynamic image update if variant has specific image
    let variantImage = null;
    if (prod.tapePriceMatrix && prod.tapePriceMatrix.length > 0) {
      const targetWidth = currentSelection.size || currentSelection.width;
      const match = prod.tapePriceMatrix.find(t => t.width === targetWidth || this.app.matchPackToken(targetWidth, t.width));
      if (match && match.image) variantImage = this.getAssetUrl(match.image);
    } else if (prod.variants && prod.variants.length > 0) {
      const targetSize = currentSelection.size || currentSelection.pack;
      const match = prod.variants.find(v => v.tapeWidth === targetSize || v.rawWidth === targetSize);
      if (match && match.image) variantImage = this.getAssetUrl(match.image);
    }
    if (variantImage) {
      const cardImages = document.querySelectorAll(`[id="card-img-${prodId}"], [data-card-img="${prodId}"]`);
      cardImages.forEach(img => {
        img.src = variantImage;
      });
      if (this.activeModalProduct && this.activeModalProduct.id === prodId) {
        const modalImg = document.getElementById('detail-img');
        if (modalImg) modalImg.src = variantImage;
      }
    }

    // When size changes, re-render pack options with corresponding prices
    if (variantKey === 'size' && prod.packSizes && prod.packSizes.length > 0) {
      const isFlake = prod.category === 'Dry Metal Flake (Glitter)' || prod.category === 'Metal Flake';
      const validPacks = prod.packSizes.map(p => isFlake ? this.app.formatFlakePackSize(p) : p).filter(Boolean);
      const optionsHtml = validPacks.map(p => {
        const optPrice = this.getProductCalculatedPrice(prod, p, currentSelection.size, currentSelection.width);
        return `<option value="${this.escapeHtmlAttr(p)}" ${p === currentSelection.pack ? 'selected' : ''}>${p} (${optPrice ? optPrice.formattedPrimary + ' ' + optPrice.primaryVatBadge : ''})</option>`;
      }).join('');

      const allStorePackSelects = document.querySelectorAll(`select[id="select-pack-${prodId}"], select[data-select-pack="${prodId}"]`);
      allStorePackSelects.forEach(sel => {
        sel.innerHTML = optionsHtml;
      });
      const modalPackSelect = document.getElementById('detail-select-pack');
      if (modalPackSelect && this.activeModalProduct && this.activeModalProduct.id === prodId) {
        modalPackSelect.innerHTML = optionsHtml;
      }

      // If viewing in product modal, dynamically update gun tip and mix ratio specs
      if (isFlake && this.activeModalProduct && this.activeModalProduct.id === prodId) {
        const flakeSpec = this.app.getFlakeSpecForSize(currentSelection.size);
        const tipEl = document.getElementById('detail-spec-tip');
        const ratioEl = document.getElementById('detail-spec-ratio');
        if (tipEl && flakeSpec) tipEl.textContent = flakeSpec.minGunNozzle;
        if (ratioEl && flakeSpec) ratioEl.textContent = `${flakeSpec.ratioText} (or Dry via FK Gun)`;
      }
    }

    // When pack changes, re-render size options with corresponding prices
    if (variantKey === 'pack' && prod.sizes && prod.sizes.length > 0) {
      const isFlake = prod.category === 'Dry Metal Flake (Glitter)' || prod.category === 'Metal Flake';
      const validSizes = prod.sizes.map(s => isFlake ? this.app.formatFlakeDimension(s) : s).filter(Boolean);
      const optionsHtml = validSizes.map(s => {
        const optPrice = this.getProductCalculatedPrice(prod, currentSelection.pack, s, currentSelection.width);
        return `<option value="${this.escapeHtmlAttr(s)}" ${s === currentSelection.size ? 'selected' : ''}>${s} — ${optPrice ? optPrice.formattedPrimary + ' (' + optPrice.primaryVatBadge + ')' : ''}</option>`;
      }).join('');

      const allStoreSizeSelects = document.querySelectorAll(`select[id="select-size-${prodId}"], select[data-select-size="${prodId}"]`);
      allStoreSizeSelects.forEach(sel => {
        sel.innerHTML = optionsHtml;
      });
      const modalSizeSelect = document.getElementById('detail-select-size');
      if (modalSizeSelect && this.activeModalProduct && this.activeModalProduct.id === prodId) {
        modalSizeSelect.innerHTML = optionsHtml;
      }
    }

    this.app.updateDropdownOptionPrices(prodId);
  }

  addProductToCartById(prodId) {
    const prod = ECOM_CATALOG.find(p => p.id === prodId);
    if (!prod) return;

    if (prod.isComingSoon || prod.brand === 'VsionAir') {
      this.app.showToast('⚠️ VsionAir™ hardware is reserved as Coming Soon. Register interest or request a quote in the specifications view.', 'warning', 4500);
      this.app.openDetailModal(prodId);
      return;
    }

    // If product has multiple options (flake particle sizes, pack sizes, tape widths) and user hasn't explicitly chosen yet, open modal
    const isFlake = prod.category === 'Dry Metal Flake (Glitter)' || prod.category === 'Metal Flake';
    const hasMultipleSizes = (prod.sizes && prod.sizes.length > 1) || (prod.tapeWidths && prod.tapeWidths.length > 1);
    const hasMultiplePacks = (prod.packSizes && prod.packSizes.length > 1) || (prod.packPriceMatrix && prod.packPriceMatrix.length > 1);

    const variant = this.selectedProductVariants[prodId];
    if ((isFlake || hasMultipleSizes || hasMultiplePacks) && (!variant || (!variant.size && !variant.width && !variant.pack))) {
      this.app.openDetailModal(prodId);
      return;
    }

    const prices = this.getProductCalculatedPrice(prod, variant ? variant.pack : null, variant ? variant.size : null, variant ? variant.width : null);
    const variantDesc = [variant && variant.width, variant && variant.size, variant && variant.pack].filter(Boolean).join(' / ') || 'Standard';

    // Locate matching variant SKU if present
    const variantSku = prices.sku || prod.sku;
    const addQty = prices.moq || 1;

    this.shopifyCartManager.addItem({
      sku: variantSku,
      title: prod.name,
      priceEur: prices.priceEur,
      priceGbp: prices.priceGbp,
      retailPriceEur: prices.retailPriceEur,
      retailPriceGbp: prices.retailPriceGbp,
      quantity: addQty,
      moq: prices.moq || 1,
      variantDetails: variantDesc
    });
    this.app.openCartDrawer();
  }

  addDirectToCart(item) {
    this.shopifyCartManager.addItem({
      sku: item.sku,
      title: item.title,
      priceEur: item.price || item.priceEur || 24.00,
      quantity: 1,
      variantDetails: item.volume || 'Standard'
    });
    this.app.openCartDrawer();
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

    this.app.openCartDrawer();
  }
}
