// Coast Airbrush Europe - Hero Showcase & Hero Admin Editor
// Extracted per Anti-God Monolith Architecture Skill (Laws 2 & 4)

import { DEFAULT_HERO_CONFIG } from '../../data/hero_config.js?v=20260908d';

export class HeroEditorUI {
  constructor(appRef) {
    this.app = appRef;
    this._targetUploadSlideIndex = null;
  }

  escapeHtml(str) {
    if (this.app && typeof this.app.escapeHtml === 'function') {
      return this.app.escapeHtml(str);
    }
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  escapeHtmlAttr(str) {
    if (this.app && typeof this.app.escapeHtmlAttr === 'function') {
      return this.app.escapeHtmlAttr(str);
    }
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  getAssetUrl(path) {
    if (this.app && typeof this.app.getAssetUrl === 'function') {
      return this.app.getAssetUrl(path);
    }
    if (typeof window !== 'undefined' && typeof window.getAssetUrl === 'function') {
      return window.getAssetUrl(path);
    }
    return path || '';
  }

  getActiveHeroConfig() {
    if (this.app.adminController && this.app.adminController.config && this.app.adminController.config.hero) {
      return this.app.adminController.config.hero;
    }
    return JSON.parse(JSON.stringify(DEFAULT_HERO_CONFIG));
  }

  renderStorefrontHero() {
    const config = this.getActiveHeroConfig();

    // 1. Authority Pill
    const pillStatus = document.getElementById('hero-pill-status');
    const pillLocation = document.getElementById('hero-pill-location');
    if (pillStatus && config.authorityPill?.statusText) {
      pillStatus.textContent = config.authorityPill.statusText;
    }
    if (pillLocation && config.authorityPill?.locationText) {
      pillLocation.textContent = config.authorityPill.locationText;
    }

    // 2. Headlines & Copy
    const headlinePrefix = document.getElementById('hero-headline-prefix');
    const headlineAccent = document.getElementById('hero-headline-accent');
    const subheadline = document.getElementById('hero-subheadline');
    const description = document.getElementById('hero-description');

    if (headlinePrefix && config.headline?.prefixText) {
      headlinePrefix.textContent = config.headline.prefixText;
    }
    if (headlineAccent && config.headline?.accentText) {
      headlineAccent.textContent = config.headline.accentText;
    }
    if (subheadline && config.subheadline) {
      subheadline.textContent = config.subheadline;
    }
    if (description && config.description) {
      description.textContent = config.description;
    }

    // 3. Quick Department Jump Buttons
    const jumpContainer = document.getElementById('hero-jump-buttons-container');
    if (jumpContainer && Array.isArray(config.quickJumpButtons) && config.quickJumpButtons.length > 0) {
      jumpContainer.innerHTML = config.quickJumpButtons.map(btn => {
        let classes = 'bg-surface-container border border-white/20 hover:border-white text-neutral-200 hover:text-white font-mono text-xs uppercase px-3.5 py-2.5 rounded transition-all flex items-center gap-1.5 hover:bg-white/5';
        if (btn.style === 'candy') {
          classes = 'mech-btn-candy !py-2.5 !px-4 text-xs tracking-wider flex items-center gap-1.5 rounded shadow-[0_0_14px_rgba(211,47,47,0.45)]';
        } else if (btn.style === 'amber') {
          classes = 'bg-surface-container border border-amber-500/70 hover:border-amber-400 text-white font-mono text-xs uppercase px-3.5 py-2.5 rounded transition-all flex items-center gap-1.5 hover:bg-amber-500/10';
        } else if (btn.style === 'rose') {
          classes = 'bg-surface-container border border-rose-500/60 hover:border-rose-400 text-rose-300 hover:text-white font-mono text-xs uppercase px-3.5 py-2.5 rounded transition-all flex items-center gap-1.5 hover:bg-rose-500/10';
        }

        const iconHtml = btn.icon ? `<span class="material-symbols-outlined text-sm ${btn.style === 'rose' ? 'text-rose-400' : ''}">${this.escapeHtml(btn.icon)}</span>` : '';
        const badgeHtml = btn.badge ? `<span class="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">${this.escapeHtml(btn.badge)}</span>` : '';

        return `<a href="${this.escapeHtmlAttr(btn.target || '#')}" class="${classes}">
          <span>${this.escapeHtml(btn.label || '')}</span>
          ${iconHtml}
          ${badgeHtml}
        </a>`;
      }).join('');
    }

    // 4. B2B Trade Banner
    const tradeBadge = document.getElementById('hero-trade-badge');
    const tradeText = document.getElementById('hero-trade-text');
    const tradeLinkText = document.getElementById('hero-trade-link-text');
    const tradeLink = document.getElementById('hero-trade-link');

    if (tradeBadge && config.tradeCallout?.badge) tradeBadge.textContent = config.tradeCallout.badge;
    if (tradeText && config.tradeCallout?.text) tradeText.textContent = config.tradeCallout.text;
    if (tradeLinkText && config.tradeCallout?.linkText) tradeLinkText.textContent = config.tradeCallout.linkText;
    if (tradeLink && config.tradeCallout?.linkUrl) tradeLink.href = config.tradeCallout.linkUrl;

    // 5. Trust Line
    const trustLine = document.getElementById('hero-trust-line');
    if (trustLine && config.trustLine) {
      trustLine.textContent = config.trustLine;
    }

    // 6. Slides
    const slidesContainer = document.getElementById('hero-crossfade-container');
    if (slidesContainer && Array.isArray(config.slides) && config.slides.length > 0) {
      slidesContainer.innerHTML = config.slides.map((s, idx) => {
        const activeClass = idx === 0 ? ' active' : '';
        const imgUrl = this.getAssetUrl(s.image);
        return `<div class="hero-crossfade-slide${activeClass}" style="background-image: url('${imgUrl}'); background-position: ${s.position || 'center right 15%'};" data-caption="${this.escapeHtmlAttr(s.caption || '')}" data-badge="${this.escapeHtmlAttr(s.badge || '')}"></div>`;
      }).join('');
    }

    // 7. Synchronize Dots
    const dotsContainer = document.getElementById('hero-slide-dots');
    if (dotsContainer && Array.isArray(config.slides)) {
      dotsContainer.innerHTML = config.slides.map((_, idx) => {
        const activeClass = idx === 0 ? ' active' : '';
        return `<button class="hero-indicator-dot${activeClass} w-2 h-2 rounded-full bg-white/30 transition-all cursor-pointer hover:bg-white/70" onclick="window.setHeroSlide(${idx})" title="Slide ${idx + 1}"></button>`;
      }).join('');
    }
  }

  renderAdminHero() {
    const config = this.getActiveHeroConfig();

    const pPrefix = document.getElementById('admin-hero-headline-prefix');
    const pAccent = document.getElementById('admin-hero-headline-accent');
    const pSubhead = document.getElementById('admin-hero-subheadline');
    const pDesc = document.getElementById('admin-hero-description');
    const pPillStat = document.getElementById('admin-hero-pill-status');
    const pPillLoc = document.getElementById('admin-hero-pill-location');
    const pTrust = document.getElementById('admin-hero-trust-line');
    const pTradeBadge = document.getElementById('admin-hero-trade-badge');
    const pTradeText = document.getElementById('admin-hero-trade-text');
    const pTradeLink = document.getElementById('admin-hero-trade-link-text');

    if (pPrefix) pPrefix.value = config.headline?.prefixText || '';
    if (pAccent) pAccent.value = config.headline?.accentText || '';
    if (pSubhead) pSubhead.value = config.subheadline || '';
    if (pDesc) pDesc.value = config.description || '';
    if (pPillStat) pPillStat.value = config.authorityPill?.statusText || '';
    if (pPillLoc) pPillLoc.value = config.authorityPill?.locationText || '';
    if (pTrust) pTrust.value = config.trustLine || '';
    if (pTradeBadge) pTradeBadge.value = config.tradeCallout?.badge || '';
    if (pTradeText) pTradeText.value = config.tradeCallout?.text || '';
    if (pTradeLink) pTradeLink.value = config.tradeCallout?.linkText || '';

    [pPrefix, pAccent, pSubhead, pDesc, pPillStat, pPillLoc, pTrust, pTradeBadge, pTradeText, pTradeLink].forEach(input => {
      if (input && !input.dataset.bound) {
        input.dataset.bound = 'true';
        input.addEventListener('input', () => this.renderAdminHeroLivePreview());
      }
    });

    this.renderAdminHeroSlides(config);
    this.renderAdminHeroJumps(config);
    this.renderAdminHeroLivePreview();
  }

  renderAdminHeroSlides(config) {
    const container = document.getElementById('admin-hero-slides-container');
    if (!container) return;

    const slides = config.slides || [];
    container.innerHTML = '';

    slides.forEach((slide, idx) => {
      const card = document.createElement('div');
      card.className = 'p-3.5 bg-surface-dim border border-secondary/30 rounded space-y-3';
      card.dataset.slideIndex = idx;

      const imgUrl = this.getAssetUrl(slide.image);
      const isFirst = idx === 0;
      const isLast = idx === slides.length - 1;

      card.innerHTML = `
        <div class="flex justify-between items-center border-b border-white/10 pb-2">
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-primary/20 text-primary font-mono text-xs flex items-center justify-center font-bold">
              ${idx + 1}
            </span>
            <span class="font-headline text-xs uppercase text-white font-bold">Slide #${idx + 1}: ${this.escapeHtml(slide.badge || 'Finish Specimen')}</span>
          </div>
          <div class="flex items-center gap-1">
            <button type="button" onclick="window.moveAdminHeroSlide(${idx}, -1)" class="p-1 text-secondary hover:text-white ${isFirst ? 'opacity-30 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}" title="Move Up">
              <span class="material-symbols-outlined text-[16px]">arrow_upward</span>
            </button>
            <button type="button" onclick="window.moveAdminHeroSlide(${idx}, 1)" class="p-1 text-secondary hover:text-white ${isLast ? 'opacity-30 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}" title="Move Down">
              <span class="material-symbols-outlined text-[16px]">arrow_downward</span>
            </button>
            <button type="button" onclick="window.removeAdminHeroSlide(${idx})" class="p-1 text-rose-400 hover:text-rose-300 ml-1 cursor-pointer" title="Remove Slide">
              <span class="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div class="sm:col-span-3 flex flex-col gap-1.5">
            <div class="w-full h-20 rounded bg-black border border-white/10 overflow-hidden relative group">
              <img src="${imgUrl}" alt="${this.escapeHtmlAttr(slide.badge || '')}" class="w-full h-full object-cover" onerror="this.src='assets/images/kroma-skull-mirror.jpg'">
              <span class="absolute bottom-1 right-1 text-[9px] font-mono bg-black/80 px-1 rounded text-neutral-300">Preview</span>
            </div>
            <div class="grid grid-cols-2 gap-1">
              <button type="button" onclick="window.triggerHeroSlideUpload(${idx})" class="w-full py-1 px-1 rounded bg-surface-dim hover:bg-surface-container-high border border-secondary/40 text-[9px] font-mono text-white flex items-center justify-center gap-0.5 cursor-pointer" title="Upload custom photo">
                <span class="material-symbols-outlined text-[13px] text-primary">upload</span> Upload
              </button>
              <button type="button" onclick="window.openHeroAiEnhancer(${idx})" class="w-full py-1 px-1 rounded bg-primary/20 hover:bg-primary/30 border border-primary/50 text-[9px] font-mono text-primary font-bold flex items-center justify-center gap-0.5 cursor-pointer shadow-sm" title="AI specular enhancement">
                <span class="material-symbols-outlined text-[13px]">auto_awesome</span> AI Finish
              </button>
            </div>
          </div>
          <div class="sm:col-span-9 space-y-2">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label class="font-label-xs text-[9px] uppercase text-secondary font-bold block mb-0.5">Asset Path / URL</label>
                <input type="text" class="admin-slide-image mech-input w-full !text-xs font-mono !py-1" value="${this.escapeHtmlAttr(slide.image || '')}">
              </div>
              <div>
                <label class="font-label-xs text-[9px] uppercase text-primary font-bold block mb-0.5">Finish Badge Text</label>
                <input type="text" class="admin-slide-badge mech-input w-full !text-xs font-mono !py-1" value="${this.escapeHtmlAttr(slide.badge || '')}">
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div class="sm:col-span-2">
                <label class="font-label-xs text-[9px] uppercase text-secondary font-bold block mb-0.5">Slide Caption Text</label>
                <input type="text" class="admin-slide-caption mech-input w-full !text-xs font-mono !py-1" value="${this.escapeHtmlAttr(slide.caption || '')}">
              </div>
              <div>
                <label class="font-label-xs text-[9px] uppercase text-secondary font-bold block mb-0.5">Focal Alignment</label>
                <input type="text" class="admin-slide-position mech-input w-full !text-xs font-mono !py-1" value="${this.escapeHtmlAttr(slide.position || 'center right 15%')}">
              </div>
            </div>
          </div>
        </div>
      `;

      card.querySelectorAll('input').forEach(inp => {
        inp.addEventListener('input', () => this.renderAdminHeroLivePreview());
      });

      container.appendChild(card);
    });
  }

  renderAdminHeroJumps(config) {
    const container = document.getElementById('admin-hero-jumps-container');
    if (!container) return;

    const jumps = config.quickJumpButtons || [];
    container.innerHTML = '';

    jumps.forEach((btn, idx) => {
      const row = document.createElement('div');
      row.className = 'p-3 bg-surface-dim border border-secondary/30 rounded flex flex-wrap sm:flex-nowrap items-center gap-2.5';
      row.dataset.jumpIndex = idx;

      row.innerHTML = `
        <span class="w-5 h-5 rounded-full bg-white/10 text-neutral-300 font-mono text-xs flex items-center justify-center font-bold flex-shrink-0">
          ${idx + 1}
        </span>
        <div class="flex-grow grid grid-cols-1 sm:grid-cols-4 gap-2 w-full">
          <div class="sm:col-span-2">
            <input type="text" class="admin-jump-label mech-input w-full !text-xs font-mono !py-1" value="${this.escapeHtmlAttr(btn.label || '')}" placeholder="Button Label">
          </div>
          <div>
            <input type="text" class="admin-jump-target mech-input w-full !text-xs font-mono !py-1" value="${this.escapeHtmlAttr(btn.target || '')}" placeholder="Anchor / Link">
          </div>
          <div>
            <select class="admin-jump-style mech-select w-full !text-xs !py-1">
              <option value="candy" ${btn.style === 'candy' ? 'selected' : ''}>Candy Red</option>
              <option value="amber" ${btn.style === 'amber' ? 'selected' : ''}>Flake Amber</option>
              <option value="rose" ${btn.style === 'rose' ? 'selected' : ''}>Rose Video</option>
              <option value="neutral" ${(!btn.style || btn.style === 'neutral') ? 'selected' : ''}>Neutral Dark</option>
            </select>
          </div>
        </div>
        <button type="button" onclick="window.removeAdminHeroJump(${idx})" class="text-rose-400 hover:text-rose-300 p-1 flex-shrink-0 cursor-pointer" title="Remove Button">
          <span class="material-symbols-outlined text-[16px]">delete</span>
        </button>
      `;

      row.querySelectorAll('input, select').forEach(inp => {
        inp.addEventListener('input', () => this.renderAdminHeroLivePreview());
        inp.addEventListener('change', () => this.renderAdminHeroLivePreview());
      });

      container.appendChild(row);
    });
  }

  collectHeroDataFromInputs() {
    const config = this.getActiveHeroConfig();
    const prefix = document.getElementById('admin-hero-headline-prefix')?.value || config.headline.prefixText;
    const accent = document.getElementById('admin-hero-headline-accent')?.value || config.headline.accentText;
    const subheadline = document.getElementById('admin-hero-subheadline')?.value || config.subheadline;
    const description = document.getElementById('admin-hero-description')?.value || config.description;
    const statusText = document.getElementById('admin-hero-pill-status')?.value || config.authorityPill.statusText;
    const locationText = document.getElementById('admin-hero-pill-location')?.value || config.authorityPill.locationText;
    const trustLine = document.getElementById('admin-hero-trust-line')?.value || config.trustLine;
    const tradeBadge = document.getElementById('admin-hero-trade-badge')?.value || config.tradeCallout.badge;
    const tradeText = document.getElementById('admin-hero-trade-text')?.value || config.tradeCallout.text;
    const tradeLinkText = document.getElementById('admin-hero-trade-link-text')?.value || config.tradeCallout.linkText;

    const slideCards = document.querySelectorAll('#admin-hero-slides-container [data-slide-index]');
    const slides = [];
    slideCards.forEach((card, i) => {
      slides.push({
        id: `slide-${i + 1}`,
        image: card.querySelector('.admin-slide-image')?.value || 'assets/images/kroma-skull-mirror.jpg',
        badge: card.querySelector('.admin-slide-badge')?.value || 'Finish Specimen',
        caption: card.querySelector('.admin-slide-caption')?.value || '',
        position: card.querySelector('.admin-slide-position')?.value || 'center right 15%'
      });
    });

    const jumpCards = document.querySelectorAll('#admin-hero-jumps-container [data-jump-index]');
    const quickJumpButtons = [];
    jumpCards.forEach((card, i) => {
      quickJumpButtons.push({
        id: `jump-${i + 1}`,
        label: card.querySelector('.admin-jump-label')?.value || 'Department',
        target: card.querySelector('.admin-jump-target')?.value || '#storefront-catalog-anchor',
        style: card.querySelector('.admin-jump-style')?.value || 'neutral',
        icon: 'arrow_downward'
      });
    });

    return {
      authorityPill: { statusText, locationText },
      headline: { prefixText: prefix, accentText: accent },
      subheadline,
      description,
      trustLine,
      tradeCallout: {
        badge: tradeBadge,
        text: tradeText,
        linkText: tradeLinkText,
        linkUrl: 'dealers.html'
      },
      quickJumpButtons: quickJumpButtons.length > 0 ? quickJumpButtons : config.quickJumpButtons,
      slides: slides.length > 0 ? slides : config.slides
    };
  }

  addAdminHeroSlide() {
    const data = this.collectHeroDataFromInputs();
    data.slides.push({
      id: `slide-${Date.now()}`,
      image: 'assets/images/kroma-skull-mirror.jpg',
      badge: 'Specular Mirror 2K',
      caption: `0${data.slides.length + 1}/0${data.slides.length + 1} • Custom Finish Specimen`,
      position: 'center right 15%'
    });
    if (this.app.adminController && this.app.adminController.config) {
      this.app.adminController.config.hero = data;
    }
    this.renderAdminHeroSlides(data);
    this.renderAdminHeroLivePreview();
  }

  removeAdminHeroSlide(idx) {
    const data = this.collectHeroDataFromInputs();
    if (data.slides.length <= 1) {
      if (this.app.showToast) this.app.showToast("At least one slide is required in the showcase.", "warning");
      return;
    }
    data.slides.splice(idx, 1);
    if (this.app.adminController && this.app.adminController.config) {
      this.app.adminController.config.hero = data;
    }
    this.renderAdminHeroSlides(data);
    this.renderAdminHeroLivePreview();
  }

  moveAdminHeroSlide(idx, direction) {
    const data = this.collectHeroDataFromInputs();
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= data.slides.length) return;
    const temp = data.slides[idx];
    data.slides[idx] = data.slides[targetIdx];
    data.slides[targetIdx] = temp;
    if (this.app.adminController && this.app.adminController.config) {
      this.app.adminController.config.hero = data;
    }
    this.renderAdminHeroSlides(data);
    this.renderAdminHeroLivePreview();
  }

  addAdminHeroJump() {
    const data = this.collectHeroDataFromInputs();
    data.quickJumpButtons.push({
      id: `jump-${Date.now()}`,
      label: 'New Department',
      target: '#storefront-catalog-anchor',
      style: 'neutral',
      icon: 'arrow_downward'
    });
    if (this.app.adminController && this.app.adminController.config) {
      this.app.adminController.config.hero = data;
    }
    this.renderAdminHeroJumps(data);
    this.renderAdminHeroLivePreview();
  }

  removeAdminHeroJump(idx) {
    const data = this.collectHeroDataFromInputs();
    data.quickJumpButtons.splice(idx, 1);
    if (this.app.adminController && this.app.adminController.config) {
      this.app.adminController.config.hero = data;
    }
    this.renderAdminHeroJumps(data);
    this.renderAdminHeroLivePreview();
  }

  renderAdminHeroLivePreview() {
    const preview = document.getElementById('admin-hero-live-preview');
    if (!preview) return;

    const prefix = document.getElementById('admin-hero-headline-prefix')?.value || 'THE EUROPEAN MASTER HUB FOR';
    const accent = document.getElementById('admin-hero-headline-accent')?.value || 'KROMA EDGE CHROME & FLAKE KING';
    const subhead = document.getElementById('admin-hero-subheadline')?.value || 'Engineered for automotive refinishers across Europe.';
    const desc = document.getElementById('admin-hero-description')?.value || 'Direct European bonded dispatch from our UK logistics center.';
    const pillStat = document.getElementById('admin-hero-pill-status')?.value || '✦ OFFICIAL EUROPEAN MASTER HUB';
    const pillLoc = document.getElementById('admin-hero-pill-location')?.value || 'PLACENTIA, CA AUTHORIZED';
    const trust = document.getElementById('admin-hero-trust-line')?.value || 'Dispatched from UK Hub • Tracked APC Overnight';

    const firstSlideImg = document.querySelector('#admin-hero-slides-container .admin-slide-image')?.value || 'assets/images/kroma-skull-mirror.jpg';
    const firstSlideBadge = document.querySelector('#admin-hero-slides-container .admin-slide-badge')?.value || 'Zero Gray Clouding';
    const totalSlides = document.querySelectorAll('#admin-hero-slides-container [data-slide-index]').length || 1;

    const jumpLabels = [];
    document.querySelectorAll('#admin-hero-jumps-container [data-jump-index]').forEach(c => {
      const lbl = c.querySelector('.admin-jump-label')?.value;
      if (lbl) jumpLabels.push(lbl);
    });

    preview.innerHTML = `
      <div class="relative rounded overflow-hidden border border-white/10 p-4 min-h-[220px] flex flex-col justify-between" style="background: linear-gradient(135deg, rgba(12,14,14,0.92) 30%, rgba(12,14,14,0.6) 100%), url('${this.getAssetUrl(firstSlideImg)}') center right / cover no-repeat;">
        <div class="space-y-3 relative z-10">
          <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/85 border border-primary/50 text-[9px] font-mono text-white">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="truncate font-bold">${this.escapeHtml(pillStat)}</span>
            <span class="text-neutral-500">•</span>
            <span class="text-amber-300 truncate">${this.escapeHtml(pillLoc)}</span>
          </div>

          <div>
            <div class="font-headline text-xs font-black uppercase text-white tracking-tight leading-snug">
              ${this.escapeHtml(prefix)} <br>
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-primary-container">${this.escapeHtml(accent)}</span>
            </div>
            <div class="text-[10px] text-neutral-300 font-headline font-medium mt-1 line-clamp-1">
              ${this.escapeHtml(subhead)}
            </div>
            <div class="text-[9px] text-neutral-400 font-body mt-0.5 line-clamp-2">
              ${this.escapeHtml(desc)}
            </div>
          </div>

          <div class="flex flex-wrap gap-1 pt-1">
            ${jumpLabels.slice(0, 4).map((l, i) => `
              <span class="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded border ${i === 0 ? 'bg-primary/20 border-primary text-primary font-bold' : 'bg-black/60 border-white/20 text-neutral-300'}">${this.escapeHtml(l)}</span>
            `).join('')}
          </div>
        </div>

        <div class="border-t border-white/10 pt-2 mt-3 flex items-center justify-between text-[8px] font-mono text-neutral-400 relative z-10">
          <span class="truncate max-w-[180px]">${this.escapeHtml(trust)}</span>
          <span class="text-primary font-bold flex-shrink-0">Finish: ${this.escapeHtml(firstSlideBadge)} (1/${totalSlides})</span>
        </div>
      </div>
    `;
  }

  saveHeroFromAdmin() {
    const heroData = this.collectHeroDataFromInputs();
    if (this.app.adminController) {
      this.app.adminController.saveHeroConfig(heroData);
    }
    this.renderStorefrontHero();
    if (this.app.setupHeroCrossfade) {
      this.app.setupHeroCrossfade();
    }
    this.renderAdminHeroLivePreview();
    if (this.app.showToast) {
      this.app.showToast("⚡ Hero & Landing Showcase Published Successfully!", "success");
    }
  }

  resetHeroFromAdmin() {
    if (confirm("Reset Hero & Landing Showcase back to factory defaults?")) {
      if (this.app.adminController) {
        this.app.adminController.resetHeroConfig();
      }
      this.renderAdminHero();
      this.renderStorefrontHero();
      if (this.app.setupHeroCrossfade) {
        this.app.setupHeroCrossfade();
      }
      if (this.app.showToast) {
        this.app.showToast("↺ Hero Showcase restored to factory defaults.", "info");
      }
    }
  }

  triggerHeroSlideUpload(slideIndex) {
    this._targetUploadSlideIndex = (slideIndex !== undefined && slideIndex !== null) ? Number(slideIndex) : null;
    this.app._targetUploadSlideIndex = this._targetUploadSlideIndex;
    const fileInput = document.getElementById('input-hero-image-upload');
    if (fileInput) fileInput.click();
  }

  handleHeroImageUpload(file, slideIndex) {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      if (this.app.showToast) {
        this.app.showToast("Please select a valid image file (PNG, JPG, WebP).", "warning");
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Downscale image to max dimension 1920 to prevent excessive localStorage usage
        const maxDim = 1920;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        const data = this.collectHeroDataFromInputs();

        if (slideIndex !== null && slideIndex !== undefined && data.slides[slideIndex]) {
          data.slides[slideIndex].image = optimizedDataUrl;
          if (this.app.adminController && this.app.adminController.config) {
            this.app.adminController.config.hero = data;
          }
          this.renderAdminHeroSlides(data);
          this.renderAdminHeroLivePreview();
          if (this.app.showToast) {
            this.app.showToast(`Slide #${slideIndex + 1} image uploaded & optimized!`, "success");
          }
        } else {
          // New slide created from upload
          const newIdx = data.slides.length + 1;
          data.slides.push({
            id: `slide-${Date.now()}`,
            image: optimizedDataUrl,
            badge: 'Custom Optical Specimen',
            caption: `0${newIdx}/0${newIdx} • Custom Uploaded Finish`,
            position: 'center right 15%'
          });
          if (this.app.adminController && this.app.adminController.config) {
            this.app.adminController.config.hero = data;
          }
          this.renderAdminHeroSlides(data);
          this.renderAdminHeroLivePreview();
          if (this.app.showToast) {
            this.app.showToast("New optical finish slide uploaded successfully!", "success");
          }
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  openHeroAiCopyModal() {
    const modal = document.getElementById('modal-admin-hero-ai-copy');
    if (modal) {
      modal.classList.add('active');
      modal.classList.add('flex');
      this.generateHeroCopyOptions();
    }
  }

  closeHeroAiCopyModal() {
    const modal = document.getElementById('modal-admin-hero-ai-copy');
    if (modal) {
      modal.classList.remove('active');
      modal.classList.remove('flex');
    }
  }

  generateHeroCopyOptions() {
    const selectTone = document.getElementById('select-hero-ai-tone');
    const inputPrompt = document.getElementById('input-hero-ai-custom-prompt');
    const tone = selectTone ? selectTone.value : 'master_refinisher';
    const customPrompt = inputPrompt ? inputPrompt.value.trim() : '';

    if (!this.app.adminController || !this.app.adminController.generateHeroAiCopy) {
      return;
    }

    const proposals = this.app.adminController.generateHeroAiCopy({ tone, customPrompt });
    const container = document.getElementById('hero-ai-proposals-container');
    if (!container) return;

    if (!proposals || proposals.length === 0) {
      container.innerHTML = `<div class="p-4 bg-surface-dim border border-white/10 text-secondary text-center">No proposals generated for this tone.</div>`;
      return;
    }

    container.innerHTML = proposals.map((p, idx) => `
      <div class="p-4 bg-surface-dim border border-secondary/30 hover:border-primary/50 rounded space-y-3 transition-all">
        <div class="flex justify-between items-start border-b border-white/10 pb-2">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-headline text-sm font-bold uppercase text-white">${this.escapeHtml(p.name)}</span>
              <span class="font-mono text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/40 font-bold">${this.escapeHtml(p.pillStatus)}</span>
            </div>
            <span class="text-[10px] text-amber-300 font-mono">${this.escapeHtml(p.pillLocation)}</span>
          </div>
          <button type="button" onclick="window.applyHeroCopyOption('${tone}', ${idx})" class="mech-button-primary !py-1 !px-3 text-[11px] font-mono font-bold flex items-center gap-1 shadow-sm cursor-pointer">
            <span class="material-symbols-outlined text-[14px]">done_all</span> Apply Proposal
          </button>
        </div>

        <div class="space-y-1.5 font-headline">
          <div class="text-[11px] text-neutral-400 tracking-wide uppercase">
            ${this.escapeHtml(p.headlinePrefix)} <span class="text-primary font-bold">${this.escapeHtml(p.headlineAccent)}</span>
          </div>
          <div class="text-xs text-white font-medium">
            ${this.escapeHtml(p.subheadline)}
          </div>
        </div>

        <p class="font-body text-[11px] text-neutral-300 leading-relaxed bg-black/30 p-2.5 rounded border border-white/5">
          ${this.escapeHtml(p.description)}
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono text-neutral-400 pt-1 border-t border-white/5">
          <div><span class="text-secondary font-bold">Trust Bar:</span> ${this.escapeHtml(p.trustLine)}</div>
          <div><span class="text-amber-400 font-bold">${this.escapeHtml(p.tradeBadge)}</span> ${this.escapeHtml(p.tradeText)} <span class="text-emerald-400 font-bold underline">${this.escapeHtml(p.tradeLinkText)}</span></div>
        </div>
      </div>
    `).join('');
  }

  applyHeroCopyOption(tone, idx) {
    if (!this.app.adminController || !this.app.adminController.generateHeroAiCopy) {
      return;
    }
    const proposals = this.app.adminController.generateHeroAiCopy({ tone });
    const p = proposals && proposals[idx];
    if (!p) return;

    const pPrefix = document.getElementById('admin-hero-headline-prefix');
    const pAccent = document.getElementById('admin-hero-headline-accent');
    const pSubhead = document.getElementById('admin-hero-subheadline');
    const pDesc = document.getElementById('admin-hero-description');
    const pPillStat = document.getElementById('admin-hero-pill-status');
    const pPillLoc = document.getElementById('admin-hero-pill-location');
    const pTrust = document.getElementById('admin-hero-trust-line');
    const pTradeBadge = document.getElementById('admin-hero-trade-badge');
    const pTradeText = document.getElementById('admin-hero-trade-text');
    const pTradeLink = document.getElementById('admin-hero-trade-link-text');

    if (pPrefix) pPrefix.value = p.headlinePrefix;
    if (pAccent) pAccent.value = p.headlineAccent;
    if (pSubhead) pSubhead.value = p.subheadline;
    if (pDesc) pDesc.value = p.description;
    if (pPillStat) pPillStat.value = p.pillStatus;
    if (pPillLoc) pPillLoc.value = p.pillLocation;
    if (pTrust) pTrust.value = p.trustLine;
    if (pTradeBadge) pTradeBadge.value = p.tradeBadge;
    if (pTradeText) pTradeText.value = p.tradeText;
    if (pTradeLink) pTradeLink.value = p.tradeLinkText;

    const updated = this.collectHeroDataFromInputs();
    if (this.app.adminController && this.app.adminController.config) {
      this.app.adminController.config.hero = updated;
    }
    this.renderAdminHeroLivePreview();
    this.closeHeroAiCopyModal();
    if (this.app.showToast) {
      this.app.showToast(`✨ AI Copy Proposal "${p.name}" applied!`, "success");
    }
  }

  quickPolishHeroField(field) {
    const selectTone = document.getElementById('select-hero-ai-tone');
    const tone = selectTone ? selectTone.value : 'master_refinisher';

    let inputEl = null;
    let fieldName = '';
    if (field === 'prefix') {
      inputEl = document.getElementById('admin-hero-headline-prefix');
      fieldName = 'Headline Prefix';
    } else if (field === 'accent') {
      inputEl = document.getElementById('admin-hero-headline-accent');
      fieldName = 'Accent Words';
    } else if (field === 'subheadline') {
      inputEl = document.getElementById('admin-hero-subheadline');
      fieldName = 'Subheadline';
    } else if (field === 'description') {
      inputEl = document.getElementById('admin-hero-description');
      fieldName = 'Value Proposition';
    }

    if (!inputEl) return;
    const current = inputEl.value;
    if (!this.app.adminController || !this.app.adminController.polishHeroField) {
      return;
    }
    const polished = this.app.adminController.polishHeroField(field, current, tone);
    inputEl.value = polished;

    this.renderAdminHeroLivePreview();
    if (this.app.showToast) {
      this.app.showToast(`✨ Polished ${fieldName} with AI!`, "info");
    }
  }
}
