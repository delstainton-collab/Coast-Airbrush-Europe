// Master Product Detail Modal & Media Showcase Controller
// Extracted per Anti-God Monolith Architecture Skill (Law 1: 1 Modal = 1 File)

import { ECOM_CATALOG } from '../../data/full_ecom_catalog.js';
import { isKromaEdgeSolventItem, renderKromaEuPdpNotice } from './kromaEuWaitlist.js';

export class ProductDetailModal {
  constructor(appRef) {
    this.app = appRef;
    this.activeModalProduct = null;
    this.activeCopyTab = 'benefits';
  }

  getAssetUrl(path) {
    return this.app.getAssetUrl ? this.app.getAssetUrl(path) : path;
  }

  escapeHtmlAttr(str) {
    return this.app.escapeHtmlAttr ? this.app.escapeHtmlAttr(str) : String(str || '').replace(/"/g, '&quot;');
  }

  open(productOrId, initialTab = null) {
    try {
      let product = productOrId;
      if (typeof productOrId === 'string') {
        product = ECOM_CATALOG.find(p => p.id === productOrId) || (this.app.currentCatalog && this.app.currentCatalog.colors && this.app.currentCatalog.colors.find(c => c.id === productOrId));
      }
      if (!product) {
        console.warn('Product not found for detail modal:', productOrId);
        return;
      }
      this.activeModalProduct = product;
      this.app.activeModalProduct = product;
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
      this.renderSalesCopy(product);

      // KromaEdge EU ADR Hazmat Compliance & Waitlist Notice
      const country = this.app.euLocalization ? this.app.euLocalization.getCountry() : { code: 'GB', name: 'United Kingdom' };
      const isKroma = isKromaEdgeSolventItem(product);
      const isNonUk = country.code !== 'GB';

      let kromaNoticeEl = document.getElementById('detail-kroma-eu-notice');
      if (!kromaNoticeEl) {
        kromaNoticeEl = document.createElement('div');
        kromaNoticeEl.id = 'detail-kroma-eu-notice';
        const copyWrapper = document.getElementById('detail-sales-copy-wrapper');
        if (copyWrapper && copyWrapper.parentNode) {
          copyWrapper.parentNode.insertBefore(kromaNoticeEl, copyWrapper.nextSibling);
        }
      }

      if (kromaNoticeEl) {
        if (isKroma && isNonUk) {
          kromaNoticeEl.innerHTML = renderKromaEuPdpNotice(country);
          kromaNoticeEl.classList.remove('hidden');
        } else {
          kromaNoticeEl.innerHTML = '';
          kromaNoticeEl.classList.add('hidden');
        }
      }
      
      // Check & setup variants for modal
      const isFlake = product.category === 'Dry Metal Flake (Glitter)' || product.category === 'Metal Flake';
      const isTape = product.hasTapeOptions || product.category === 'Masking Products' || (product.name || '').includes('Tape');
      const sizeLabel = isTape ? 'Tape Width / Roll Size' : (isFlake ? 'Flake Dimension (Micron)' : 'Product Size');

      let validSizes = (product.sizes || []).map(s => isFlake ? this.app.formatFlakeDimension(s) : String(s).trim()).filter(Boolean);
      let validPacks = (product.packSizes || []).map(p => isFlake ? this.app.formatFlakePackSize(p) : String(p).trim()).filter(Boolean);

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

      if (!this.app.selectedProductVariants[product.id]) {
        this.app.selectedProductVariants[product.id] = {
          size: validSizes[0] || '',
          pack: validPacks[0] || ''
        };
      }

      const currentSelection = this.app.selectedProductVariants[product.id] || { size: '', pack: '' };
      const prices = this.app.getProductCalculatedPrice(product, currentSelection.pack, currentSelection.size);

      if (skuEl && prices) {
        skuEl.textContent = `SKU: ${prices.sku || product.sku || 'N/A'}${prices.barcode ? ` | EAN: ${prices.barcode}` : ''}`;
      }

      const isComingSoonProd = Boolean(product.isComingSoon || product.brand === 'VsionAir' || (product.badge && product.badge.includes('COMING SOON')));
      const priceEl = document.getElementById('detail-price');
      if (priceEl) {
        if (isComingSoonProd) {
          priceEl.innerHTML = `
            <div class="flex items-baseline gap-2 flex-wrap">
              <span class="font-headline text-2xl sm:text-3xl text-amber-400 font-extrabold tracking-wide">PRICE ON APPLICATION (POA)</span>
              <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40">2026 ALLOCATION</span>
            </div>
          `;
        } else if (prices) {
          if (prices.isB2B) {
            priceEl.innerHTML = `
              <div class="flex items-baseline gap-2 flex-wrap">
                <span class="text-emerald-400 font-extrabold font-headline">${prices.formattedPrimary}</span>
                <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">${prices.tierRole === 'distributor' ? 'DISTRIBUTOR EX-VAT' : 'DEALER EX-VAT'}</span>
              </div>
            `;
          } else {
            priceEl.innerHTML = `
              <span>${prices.formattedPrimary}</span>
              <span class="text-xs font-mono font-bold px-2 py-0.5 rounded align-middle ml-2 ${prices.vatMode === 'inc' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'}">${prices.primaryVatBadge}</span>
            `;
          }
        }
      }
      const priceSubEl = document.getElementById('detail-price-sub');
      if (priceSubEl) {
        if (isComingSoonProd) {
          priceSubEl.innerHTML = `
            <span class="text-neutral-400 text-xs font-mono">Automated checkout paused • Direct engineering allocation &amp; manual quotations available</span>
          `;
        } else if (prices) {
          const country = this.app.euLocalization.getCountry();
          if (prices.isB2B) {
            priceSubEl.innerHTML = `
              <div class="space-y-1 font-mono text-xs">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-neutral-400">Retail MSRP: <span class="line-through text-neutral-300 font-bold">${prices.retailFormatted}</span></span>
                  <span class="bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 text-[10px] font-bold px-2 py-0.5 rounded">Save ${prices.marginPercent}% (${prices.savingsFormatted}/unit)</span>
                </div>
                <div class="text-amber-300 flex items-center gap-1.5 pt-0.5">
                  <span class="material-symbols-outlined text-[15px]">inventory_2</span>
                  <span>Minimum Order Quantity: <strong class="text-white">${prices.moqLabel}</strong></span>
                </div>
              </div>
            `;
          } else {
            priceSubEl.innerHTML = `
              <span class="text-white font-bold">${prices.formattedSecondary}</span>
              <span class="text-slate-400 ml-1.5">• ${prices.formattedSecondaryCur}</span>
              ${prices.isUK ? `<span class="text-amber-400 ml-1.5 hidden sm:inline">(20% UK HMRC VAT)</span>` : `<span class="text-emerald-400 ml-1.5 hidden sm:inline">(${prices.vatRatePercent}% ${country.code} Tax)</span>`}
            `;
          }
        }
      }

      // Render variant controls inside modal
      const variantContainer = document.getElementById('detail-variant-controls');
      if (variantContainer) {
        let modalControls = '';
        if (validSizes.length > 1 || (validSizes.length === 1 && validPacks.length === 0)) {
          modalControls += `
            <div class="mb-3">
              <label class="font-label-xs text-xs text-secondary uppercase block mb-1 font-bold">${sizeLabel}:</label>
              <select id="detail-select-size" data-variant-prod="${product.id}" data-variant-key="size" data-select-size="${product.id}" class="mech-select !py-2 !px-3 text-xs w-full" onchange="window.paintApp && window.paintApp.onProductVariantChange ? window.paintApp.onProductVariantChange('${product.id}', 'size', this.value) : (window.onProductVariantChange ? window.onProductVariantChange('${product.id}', 'size', this.value) : null)">
                ${validSizes.map(s => {
                  const optPrice = this.app.getProductCalculatedPrice(product, currentSelection.pack, s);
                  const showPrice = optPrice ? ` — ${optPrice.formattedPrimary} (${optPrice.primaryVatBadge})` : '';
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
              <select id="detail-select-pack" data-variant-prod="${product.id}" data-variant-key="pack" data-select-pack="${product.id}" class="mech-select !py-2 !px-3 text-xs w-full" onchange="window.paintApp && window.paintApp.onProductVariantChange ? window.paintApp.onProductVariantChange('${product.id}', 'pack', this.value) : (window.onProductVariantChange ? window.onProductVariantChange('${product.id}', 'pack', this.value) : null)">
                ${validPacks.map(p => {
                  const optPrice = this.app.getProductCalculatedPrice(product, p, currentSelection.size);
                  return `<option value="${this.escapeHtmlAttr(p)}" ${p === currentSelection.pack ? 'selected' : ''}>${p} — ${optPrice ? optPrice.formattedPrimary + ' (' + optPrice.primaryVatBadge + ')' : ''}</option>`;
                }).join('')}
              </select>
            </div>
          `;
        }
        if (product.id === 'kroma-mirror-chrome-system') {
          modalControls += `
            <div class="mt-2.5 p-3 rounded bg-surface-container border border-white/10 text-[11px] font-mono text-neutral-300 space-y-1.5 shadow-sm">
              <div class="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span class="material-symbols-outlined text-[15px]">speed</span>
                <span>REAL-WORLD PROJECT COVERAGE ESTIMATOR:</span>
              </div>
              <p class="text-neutral-300 leading-relaxed">
                • <strong>Small Kit (140g)</strong>: Covers 7–10 sq ft (easily 2 full motorcycle tanks or 4 racing helmets)<br>
                • <strong>Medium Kit (420g)</strong>: Covers 22–30 sq ft (full bike tank + fenders + tins)
              </p>
              <div class="flex items-center gap-1.5 pt-1 text-[10px] text-amber-300 font-semibold border-t border-white/10">
                <span class="material-symbols-outlined text-[13px]">verified</span>
                <span>Zero black basecoat or flame needed • Free 1-on-1 booth calibration with DAiVE</span>
              </div>
            </div>
          `;
        }
        variantContainer.innerHTML = modalControls;
      }
      
      // Reviews & Social Proof
      const reviewData = this.app.getProductReviewData(product) || { rating: '4.9', count: 24, quote: 'Exceptional finish.', author: 'Verified Pro Painter' };
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
        const flakeSpec = this.app.getFlakeSpecForSize(currentSelection.size || (validSizes && validSizes[0]));
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

      const isComingSoon = Boolean(product.isComingSoon || product.brand === 'VsionAir' || (product.badge && product.badge.includes('COMING SOON')));
      const isPreOrder = !isComingSoon && Boolean(product.isPreOrder || (product.badge && product.badge.includes('EARLY BIRD')) || (product.id && product.id.startsWith('preorder_')));
      const stockBadge = document.getElementById('detail-stock-badge');
      if (stockBadge) {
        if (isKroma && isNonUk) {
          stockBadge.textContent = '🇬🇧 UK DISPATCH ONLY • 🇪🇺 EU PHASE 2 ONBOARDING';
          stockBadge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/80 border border-amber-500/70 text-amber-300 font-mono text-[11px] font-bold tracking-wide backdrop-blur-md shadow-md';
        } else if (isComingSoon) {
          stockBadge.textContent = '⏳ COMING SOON • 2026 DIRECT ALLOCATION';
          stockBadge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/80 border border-amber-500/60 text-amber-300 font-mono text-[11px] font-bold tracking-wide backdrop-blur-md shadow-md';
        } else {
          stockBadge.textContent = isPreOrder ? '⏳ PRE-ORDER (BATCH 1 PRIORITY ALLOCATION)' : '⚡ IN STOCK (UK DISPATCH)';
          stockBadge.className = isPreOrder 
            ? 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/80 border border-amber-500/50 text-amber-300 font-mono text-[11px] font-bold tracking-wide backdrop-blur-md shadow-md' 
            : 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/80 border border-emerald-500/60 text-emerald-300 font-mono text-[11px] font-bold tracking-wide backdrop-blur-md shadow-md';
        }
      }
      const addCartBtn = document.getElementById('btn-detail-add-cart');
      if (addCartBtn) {
        if (isKroma && isNonUk) {
          addCartBtn.textContent = '🛒 ADD (UK ADDRESS / FREIGHT FORWARDERS ONLY)';
          addCartBtn.className = 'mech-button-primary !w-full !justify-center !text-sm !py-3.5 font-bold tracking-wider !bg-amber-600 hover:!bg-amber-500 !text-black border border-amber-400 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.4)]';
        } else if (isComingSoon) {
          addCartBtn.textContent = '✉ REQUEST ALLOCATION QUOTE / REGISTER INTEREST';
          addCartBtn.className = 'mech-button-primary !w-full !justify-center !text-sm !py-3.5 font-bold tracking-wider opacity-90 hover:opacity-100 !bg-amber-600 hover:!bg-amber-500 !text-black border border-amber-400 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.4)]';
        } else if (prices && prices.isB2B) {
          addCartBtn.textContent = `+ ADD CASE PACK (${prices.moq} UNITS)`;
          addCartBtn.className = 'mech-button-primary !w-full !justify-center !text-sm !py-3.5 font-bold tracking-wider !bg-emerald-600 hover:!bg-emerald-500 shadow-[0_4px_14px_rgba(16,185,129,0.35)] cursor-pointer';
        } else {
          addCartBtn.textContent = isPreOrder ? '🛒 PRE-ORDER NOW • SECURE BATCH 1 ALLOCATION' : '+ ADD TO PROJECT CART';
          addCartBtn.className = 'mech-button-primary !w-full !justify-center !text-sm !py-3.5 font-bold tracking-wider';
        }
      }

      const mixCalcBtn = document.getElementById('btn-detail-open-mix-calc');
      if (mixCalcBtn) {
        if (product.brand === 'VsionAir' || isComingSoon) {
          mixCalcBtn.classList.add('hidden');
        } else {
          mixCalcBtn.classList.remove('hidden');
        }
      }

      const mainImageSrc = this.getAssetUrl(product.image) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
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
        ? product.images.map(img => this.getAssetUrl(img))
        : [mainImageSrc];

      if (galleryContainer && galleryThumbs) {
        if (allImages.length > 1) {
          galleryContainer.classList.remove('hidden');
          galleryThumbs.innerHTML = allImages.map((imgSrc, idx) => {
            let label = 'Product';
            if (imgSrc.includes('_swatch')) label = 'Flame Swatch';
            else if (imgSrc.includes('color_chart')) label = 'Colour Card';
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
                <img src="${imgSrc}" alt="${label}" class="w-14 h-14 object-contain rounded" onerror="this.src='${this.getAssetUrl('assets/images/coast_airbrush_logo.jpg')}'">
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
          this.loadVideoPlayer(firstVid, videoTarget, initialTab === 'video');

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

      const pdpLink = document.getElementById('btn-detail-view-full-pdp');
      if (pdpLink && product) {
        const prodHandle = product.handle || (product.id ? String(product.id).toLowerCase().replace(/[^a-z0-9]+/g, '-') : '');
        const isShopify = (typeof window.Shopify !== 'undefined') || window.SHOPIFY_CURRENT_PRODUCT || window.location.pathname.includes('/products/');
        const isPreview = (typeof window !== 'undefined' && (
          window.location.search.includes('preview=true') || 
          window.location.search.includes('partner=true') || 
          (typeof sessionStorage !== 'undefined' && (sessionStorage.getItem('coast_store_preview') === 'true' || sessionStorage.getItem('coast_partner_access') === 'true')) ||
          (typeof document !== 'undefined' && document.cookie.includes('coast_store_preview=true'))
        ));
        const previewParam = isPreview ? (isShopify ? '?preview=true' : '&preview=true') : '';
        if (isShopify && prodHandle) {
          pdpLink.href = `/products/${encodeURIComponent(prodHandle)}${previewParam}`;
        } else {
          pdpLink.href = `product.html?id=${encodeURIComponent(product.id || prodHandle)}${previewParam}`;
        }
      }

      modal.classList.add('active');
      document.body.classList.add('modal-open');
    } catch (err) {
      console.error('Error opening detail modal:', err);
    }
  }

  loadVideoPlayer(vid, targetEl, autoPlay = false) {
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

  switchVideo(videoIndex) {
    if (!this.activeModalProduct || !this.activeModalProduct.videos) return;
    const vid = this.activeModalProduct.videos[videoIndex];
    const target = document.getElementById('detail-video-player-target');
    if (vid && target) {
      this.loadVideoPlayer(vid, target, true);
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

  renderSalesCopy(product) {
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

  switchImage(imgSrc, btn) {
    const imgEl = document.getElementById('detail-img');
    if (imgEl) {
      imgEl.src = this.getAssetUrl(imgSrc);
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

  close() {
    const modal = document.getElementById('modal-product-detail');
    if (modal) modal.classList.remove('active');
    if (!document.querySelector('.modal-overlay.active')) {
      document.body.classList.remove('modal-open');
    }
  }
}
