// Department Product Views & Subcategory Controllers (Flake, Guns, Tapes, VsionAir)
// Extracted per Anti-God Monolith Architecture Skill (Laws 2 & 3)

import { ECOM_CATALOG } from '../../data/full_ecom_catalog.js';

export class DepartmentViews {
  constructor(appRef) {
    this.app = appRef;
  }

  getAssetUrl(path) {
    return this.app.getAssetUrl ? this.app.getAssetUrl(path) : path;
  }

  escapeHtml(str) {
    return this.app.escapeHtml ? this.app.escapeHtml(str) : String(str || '');
  }

  matchPackToken(packA, packB) {
    if (!packA || !packB) return false;
    const a = String(packA).trim().toLowerCase();
    const b = String(packB).trim().toLowerCase();
    if (a === b) return true;

    // Extract leading/distinct weight/volume/width token (e.g. 1000g, 100g, 30g, 500ml, 140g, 420g, 1260g, 1l, 1mm, 2mm, 3mm, 6mm, etc.)
    const extractToken = (str) => {
      const m = str.match(/\b(\d+(?:\.\d+)?\s*(?:mm|cm|m|g|kg|ml|l|litre|litres|oz|qt|pt|set)?)\b/i);
      return m ? m[1].replace(/\s+/g, '').toLowerCase() : '';
    };

    const tokenA = extractToken(a);
    const tokenB = extractToken(b);

    if (tokenA && tokenB) {
      if (tokenA === tokenB) return true;
      const normA = tokenA.replace(/litres?/, 'l');
      const normB = tokenB.replace(/litres?/, 'l');
      if (normA === normB) return true;
      // Handle 1mm vs 1.5mm tolerance for Prime Fine Line tape
      if ((normA === '1mm' && normB === '1.5mm') || (normA === '1.5mm' && normB === '1mm')) return true;
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
    if (name.includes('kromatic') || desc.includes('kromatic') || name.includes('holographic')) return 'Kromatic';
    if (name.includes('dragon') || desc.includes('iridescent') || name.includes('iridescent')) return 'Iridescent';
    if (name.includes('blend') || name.includes('mixed') || name.includes('peacock') || name.includes('sky purple') || name.includes('fire purple') || name.includes('fizzy green') || name.includes('nevada sands')) return 'Mixed';
    return 'Single Colour';
  }

  getFlakeBadgeInfo(p) {
    const n = (p.name || '').toLowerCase();
    if (n.includes('show krome') && n.includes('kromatic')) return { badge: 'HOLO', color: 'text-amber-300', sub: 'Rainbow Holo' };
    if (n.includes('show krome')) return { badge: 'SILVER', color: 'text-white', sub: '0.015 Hex' };
    if (n.includes('asteroid')) return { badge: 'BLACK HOLO', color: 'text-neutral-300', sub: 'Dark Prismatic' };
    if (n.includes('gun metal')) return { badge: 'GREY', color: 'text-neutral-400', sub: 'Anthracite Metallic' };
    if (n.includes('elvis gold') && n.includes('kromatic')) return { badge: 'GOLD HOLO', color: 'text-amber-400', sub: 'Prismatic Gold' };
    if (n.includes('elvis gold')) return { badge: 'GOLD', color: 'text-amber-400', sub: 'Deep Pure Gold' };
    if (n.includes('dragon koi')) return { badge: 'COPPER', color: 'text-orange-400', sub: 'Copper Fire' };
    if (n.includes('water dragon')) return { badge: 'TEAL', color: 'text-teal-400', sub: 'Aqua Iridescent' };
    if (n.includes('cobalt blue')) return { badge: 'BLUE', color: 'text-sky-400', sub: 'Deep Candy Royal' };
    if (n.includes('turquoise')) return { badge: 'TEAL', color: 'text-cyan-400', sub: 'Candy Turquoise' };
    if (n.includes('azura blue')) return { badge: 'AZURA', color: 'text-blue-400', sub: 'Vivid Azura' };
    if (n.includes('kromatic blue')) return { badge: 'BLUE HOLO', color: 'text-sky-300', sub: 'Holo Candy Blue' };
    if (n.includes('light blue')) return { badge: 'SKY BLUE', color: 'text-sky-300', sub: 'Candy Light Blue' };
    if (n.includes('poison green') && n.includes('kromatic')) return { badge: 'GREEN HOLO', color: 'text-emerald-300', sub: 'Electric Prismatic' };
    if (n.includes('emerald green')) return { badge: 'EMERALD', color: 'text-emerald-400', sub: 'Candy Emerald' };
    if (n.includes('poison green')) return { badge: 'POISON', color: 'text-lime-400', sub: 'Candy Poison' };
    if (n.includes('lime green')) return { badge: 'LIME', color: 'text-lime-300', sub: 'Candy Lime' };
    if (n.includes('peacock')) return { badge: 'MIXED', color: 'text-teal-300', sub: 'Multi-Chroma' };
    if (n.includes('purple heart')) return { badge: 'PURPLE', color: 'text-purple-400', sub: 'Candy Purple' };
    if (n.includes('sky purple')) return { badge: 'MIXED', color: 'text-purple-300', sub: 'Dual Blend' };
    if (n.includes('fewsha')) return { badge: 'FUCHSIA', color: 'text-pink-400', sub: 'Candy Fewsha' };
    if (n.includes('lavender')) return { badge: 'LAVENDER', color: 'text-purple-200', sub: 'Holo Lavender' };
    if (n.includes('bubble gum')) return { badge: 'BUBBLEGUM', color: 'text-pink-300', sub: 'Holo Pink' };
    if (n.includes('pink')) return { badge: 'PINK', color: 'text-rose-400', sub: 'Candy Pink' };
    if (n.includes('fire purple')) return { badge: 'MIXED', color: 'text-violet-400', sub: 'Fiery Purple' };
    if (n.includes('volcano red')) return { badge: 'RED HOLO', color: 'text-red-400', sub: 'Volcanic Prismatic' };
    if (n.includes('bright red')) return { badge: 'BRIGHT RED', color: 'text-red-500', sub: 'Candy Bright Red' };
    if (n.includes('apple red')) return { badge: 'APPLE RED', color: 'text-rose-500', sub: 'Candy Apple' };
    if (n.includes('tangy orange')) return { badge: 'ORANGE', color: 'text-orange-500', sub: 'Candy Orange' };
    if (n.includes('fizzy green')) return { badge: 'MIXED', color: 'text-emerald-300', sub: 'Fizzy Multi' };
    if (n.includes('extreme yellow')) return { badge: 'YELLOW', color: 'text-yellow-400', sub: 'Candy Yellow' };
    if (n.includes('nevada sands')) return { badge: 'MIXED', color: 'text-amber-200', sub: 'Desert Tone' };
    if (n.includes('copper head') && n.includes('kromatic')) return { badge: 'COPPER HOLO', color: 'text-amber-500', sub: 'Holo Copper' };
    if (n.includes('copper head')) return { badge: 'COPPER', color: 'text-orange-400', sub: 'Candy Copper' };
    if (n.includes('righteous gold')) return { badge: 'GOLD', color: 'text-amber-300', sub: 'Righteous Gold' };
    if (n.includes('sovereign gold')) return { badge: 'GOLD', color: 'text-amber-400', sub: 'Sovereign Gold' };
    return { badge: (p.flakeType || 'FLAKE').toUpperCase(), color: 'text-white', sub: 'Precision Hex' };
  }

  setDeptFlakeSubcat(subcat, viewAll = false) {
    if (!this.app.deptFlakeState) {
      this.app.deptFlakeState = { subcat: 'all', viewMode: 'curated' };
    }
    this.app.deptFlakeState.subcat = subcat;
    this.app.deptFlakeState.viewMode = 'all';

    const buttons = document.querySelectorAll('.dept-flake-subcat-btn');
    buttons.forEach(btn => {
      const btnCat = btn.getAttribute('data-dept-flake-subcat');
      if (btnCat === subcat) {
        btn.className = 'dept-flake-subcat-btn active px-3 py-1.5 border border-primary bg-primary/20 text-white font-bold transition-colors cursor-pointer rounded text-[11px] shadow-sm';
      } else {
        btn.className = 'dept-flake-subcat-btn px-3 py-1.5 border border-secondary bg-black/70 text-secondary hover:text-white hover:border-primary transition-colors cursor-pointer rounded text-[11px]';
      }
    });

    this.renderDeptFlakesGrid();
  }

  toggleDeptFlakeViewMode() {
    if (!this.app.deptFlakeState) {
      this.app.deptFlakeState = { subcat: 'all', viewMode: 'curated' };
    }
    if (this.app.deptFlakeState.viewMode === 'curated') {
      this.app.deptFlakeState.viewMode = 'all';
      this.app.deptFlakeState.subcat = 'all';
    } else {
      this.app.deptFlakeState.viewMode = 'curated';
      this.app.deptFlakeState.subcat = 'all';
    }
    const buttons = document.querySelectorAll('.dept-flake-subcat-btn');
    buttons.forEach(btn => {
      const btnCat = btn.getAttribute('data-dept-flake-subcat');
      if (btnCat === 'all') {
        btn.className = 'dept-flake-subcat-btn active px-3 py-1.5 border border-primary bg-primary/20 text-white font-bold transition-colors cursor-pointer rounded text-[11px] shadow-sm';
      } else {
        btn.className = 'dept-flake-subcat-btn px-3 py-1.5 border border-secondary bg-black/70 text-secondary hover:text-white hover:border-primary transition-colors cursor-pointer rounded text-[11px]';
      }
    });
    this.renderDeptFlakesGrid();
  }

  renderDeptFlakesGrid() {
    const grid = document.getElementById('dept-flakes-grid');
    if (!grid) return;

    if (!this.app.deptFlakeState) {
      this.app.deptFlakeState = { subcat: 'all', viewMode: 'curated' };
    }

    const countBadge = document.getElementById('dept-flakes-count-badge');
    const toggleBtnLabel = document.getElementById('label-dept-flake-toggle-view');
    const viewSwitchBtn = document.getElementById('btn-dept-flake-view-switch');
    const curatedFooter = document.getElementById('dept-flakes-curated-footer');

    const allFlakes = ECOM_CATALOG.filter(p => p.category === 'Dry Metal Flake (Glitter)' && !p.hideFromStorefront);
    const CURATED_IDS = ['fk-2610', 'fk-2524', 'fk-2341', 'fk-2319', 'fk-2308', 'fk-2283', 'fk-2297', 'fk-2330'];

    let itemsToDisplay = [];
    const isCuratedView = (this.app.deptFlakeState.subcat === 'all' && this.app.deptFlakeState.viewMode === 'curated');

    if (isCuratedView) {
      grid.className = 'grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4';
      itemsToDisplay = CURATED_IDS.map(id => allFlakes.find(p => p.id === id)).filter(Boolean);
      if (countBadge) countBadge.textContent = `Showing 8 Curated Swatches (of ${allFlakes.length} Flakes)`;
      if (toggleBtnLabel) toggleBtnLabel.textContent = `View All ${allFlakes.length} Flakes in Department`;
      if (viewSwitchBtn) viewSwitchBtn.innerHTML = `Show All ${allFlakes.length} Flakes &darr;`;
      if (curatedFooter) curatedFooter.style.display = 'block';
    } else {
      grid.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4';
      if (this.app.deptFlakeState.subcat === 'all') {
        itemsToDisplay = allFlakes;
        if (countBadge) countBadge.textContent = `Showing All ${allFlakes.length} Flakes (Full Department)`;
      } else {
        const targetSub = this.app.deptFlakeState.subcat.toLowerCase();
        itemsToDisplay = allFlakes.filter(p => {
          const sub = (this.getFlakeSubcategory(p) || '').toLowerCase();
          if (targetSub === 'single') return sub.includes('single');
          if (targetSub === 'kromatic') return sub.includes('kromatic');
          if (targetSub === 'iridescent') return sub.includes('iridescent');
          if (targetSub === 'mixed') return sub.includes('mixed');
          return sub === targetSub;
        });
        const labelMap = { single: 'Single Colour', kromatic: 'Kromatic', iridescent: 'Iridescent', mixed: 'Mixed' };
        const label = labelMap[targetSub] || targetSub;
        if (countBadge) countBadge.textContent = `Showing ${itemsToDisplay.length} ${label} Flakes`;
      }
      if (toggleBtnLabel) toggleBtnLabel.textContent = `Show Curated 8 Swatches`;
      if (viewSwitchBtn) viewSwitchBtn.innerHTML = `Show Curated 8 Swatches &uarr;`;
      if (curatedFooter) curatedFooter.style.display = 'none';
    }

    grid.innerHTML = itemsToDisplay.map(prod => {
      const badgeInfo = this.getFlakeBadgeInfo(prod);
      const priceInfo = this.app.calculateDisplayPrice(prod);
      const title = prod.name.replace(' Metal Flake', '').replace(' Flake', '');
      const sizesText = (prod.sizes && prod.sizes.length > 0) 
        ? prod.sizes.map(s => s.replace('Medium ', '').replace('Large ', '')).join(' / ') 
        : '0.008″ & .015″';
      const rawImg = prod.image || `assets/images/flakes/${prod.id}.jpg`;
      const imgSrc = this.getAssetUrl(rawImg);
      const fallbackChart = this.getAssetUrl('assets/images/flakes/flake_king_color_chart.png');

      return `
        <div onclick="window.paintApp && window.paintApp.openDetailModal('${prod.id}')" 
             class="industrial-card p-3 flex flex-col justify-between bg-surface-container rounded group hover:border-primary/60 transition-all cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5" 
             title="Click to view details and select particle &amp; pack size">
          <div>
            <div class="h-28 bg-surface-dim rounded overflow-hidden flex items-center justify-center p-1.5 mb-2 relative">
              <img src="${imgSrc}" alt="${prod.name}" class="h-full w-full object-cover rounded group-hover:scale-110 transition-transform duration-300" onerror="this.onerror=null; this.src='${fallbackChart}';">
              <span class="absolute top-1 left-1 px-1 py-0.5 rounded bg-black/80 text-[8px] font-mono ${badgeInfo.color} font-bold tracking-wider">${badgeInfo.badge}</span>
              <span class="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-mono text-amber-300 font-bold border border-amber-500/40 opacity-90 group-hover:opacity-100 flex items-center gap-0.5"><span class="material-symbols-outlined text-[10px]">tune</span> Sizes</span>
            </div>
            <h5 class="font-headline text-xs uppercase text-white font-bold leading-tight mb-1 truncate group-hover:text-primary transition-colors" title="${prod.name}">${title}</h5>
            <div class="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-2">
              <span class="truncate pr-1">${badgeInfo.sub || sizesText}</span>
              <span class="text-amber-400 font-bold text-[9px] group-hover:underline flex-shrink-0">Options &rarr;</span>
            </div>
          </div>
          <div>
            <span class="text-primary font-headline text-sm font-bold block mb-1.5">From ${priceInfo.formattedPrimary}</span>
            <button onclick="event.stopPropagation(); window.paintApp && window.paintApp.openDetailModal('${prod.id}')" class="mech-button-primary !w-full !py-1.5 !text-[10px] !justify-center cursor-pointer font-bold tracking-wider">
              Select Size
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  setDeptGunsSubcat(subcat, viewAll = false) {
    if (!this.app.deptGunsState) {
      this.app.deptGunsState = { subcat: 'featured', viewMode: 'featured' };
    }
    this.app.deptGunsState.subcat = subcat;
    this.app.deptGunsState.viewMode = (subcat === 'featured') ? 'featured' : 'all';

    const buttons = document.querySelectorAll('.dept-guns-subcat-btn');
    buttons.forEach(btn => {
      const btnCat = btn.getAttribute('data-dept-guns-subcat');
      if (btnCat === subcat) {
        btn.className = 'dept-guns-subcat-btn active px-3 py-1.5 border border-primary bg-primary/20 text-white font-bold transition-colors cursor-pointer rounded text-[11px] shadow-sm';
      } else {
        btn.className = 'dept-guns-subcat-btn px-3 py-1.5 border border-secondary bg-black/70 text-secondary hover:text-white hover:border-primary transition-colors cursor-pointer rounded text-[11px]';
      }
    });

    this.renderDeptGunsGrid();
  }

  renderDeptGunsGrid() {
    const featuredView = document.getElementById('dept-guns-featured-view');
    const dynamicGrid = document.getElementById('dept-guns-dynamic-grid');
    const countBadge = document.getElementById('dept-guns-count-badge');
    if (!featuredView || !dynamicGrid) return;

    if (!this.app.deptGunsState) {
      this.app.deptGunsState = { subcat: 'featured', viewMode: 'featured' };
    }

    if (this.app.deptGunsState.subcat === 'featured') {
      featuredView.style.display = 'grid';
      dynamicGrid.style.display = 'none';
      if (countBadge) countBadge.textContent = 'Showing 4 Featured Guns';
      return;
    }

    featuredView.style.display = 'none';
    dynamicGrid.style.display = 'grid';

    const allHardware = ECOM_CATALOG.filter(p => 
      (p.category === 'Dry Metal Flake Guns' || p.category === 'Flake King Gun Accessories') && !p.hideFromStorefront
    );

    let items = allHardware;
    if (this.app.deptGunsState.subcat === 'guns') {
      items = allHardware.filter(p => p.category === 'Dry Metal Flake Guns');
    } else if (this.app.deptGunsState.subcat === 'accessories') {
      items = allHardware.filter(p => p.category === 'Flake King Gun Accessories');
    }

    if (countBadge) {
      const labelMap = { all: 'All Hardware Tools & Jars', guns: 'Guns & Spray Tools', accessories: 'Nozzles & Spare Jars' };
      countBadge.textContent = `Showing ${items.length} ${labelMap[this.app.deptGunsState.subcat] || 'Products'}`;
    }

    dynamicGrid.innerHTML = items.map(prod => {
      const priceInfo = this.app.calculateDisplayPrice(prod);
      const isGun = prod.category === 'Dry Metal Flake Guns';
      const badgeText = isGun ? 'HARD RED ANODIZED' : 'GENUINE OEM PART';
      const badgeColor = isGun ? 'bg-red-950/80 border-red-500/60 text-red-300' : 'bg-amber-950/80 border-amber-500/60 text-amber-300';
      const imgSrc = this.getAssetUrl(prod.image) || 'https://i0.wp.com/www.flakeking.com/wp-content/uploads/2020/06/FOM10001.png?fit=600%2C600&ssl=1';

      return `
        <div class="industrial-card p-4 flex flex-col justify-between bg-surface-container border border-white/15 rounded-lg group hover:border-primary/60 transition-colors">
          <div>
            <div class="h-36 bg-black/40 rounded overflow-hidden flex items-center justify-center p-2 mb-3 relative cursor-pointer" onclick="window.paintApp.openDetailModal('${prod.id}')">
              <img src="${imgSrc}" alt="${prod.name}" class="h-full object-contain group-hover:scale-105 transition-transform duration-300" onerror="this.onerror=null; this.src='https://i0.wp.com/www.flakeking.com/wp-content/uploads/2020/06/FOM10001.png?fit=600%2C600&amp;ssl=1';">
              <span class="absolute top-2 left-2 px-1.5 py-0.5 rounded border text-[8px] font-mono font-bold ${badgeColor}">${badgeText}</span>
            </div>
            <h4 class="font-headline text-sm uppercase text-white font-bold leading-tight mb-1 group-hover:text-primary cursor-pointer" onclick="window.paintApp.openDetailModal('${prod.id}')">
              ${prod.name}
            </h4>
            <p class="text-[11px] text-neutral-400 font-body mb-2 line-clamp-2">
              ${prod.description ? prod.description.split('\n')[0] : 'Precision Flake King hardware tool.'}
            </p>
          </div>
          <div>
            <div class="flex items-baseline justify-between border-t border-white/10 pt-2 mb-2">
              <span class="text-primary font-headline text-base font-bold">${priceInfo.formattedPrimary}</span>
              <span class="text-secondary font-mono text-[10px]">${priceInfo.formattedSecondary}</span>
            </div>
            <div class="grid grid-cols-2 gap-1.5">
              <button onclick="window.paintApp.addProductToCartById('${prod.id}')" class="mech-button-primary !w-full !py-1.5 !text-[10px] !justify-center font-bold">
                + Add
              </button>
              <button onclick="window.paintApp.openDetailModal('${prod.id}')" class="mech-btn-secondary !w-full !py-1.5 !text-[10px] !justify-center">
                Specs
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  setDeptTapesSubcat(subcat, viewAll = false) {
    if (!this.app.deptTapesState) {
      this.app.deptTapesState = { subcat: 'featured', viewMode: 'featured' };
    }
    this.app.deptTapesState.subcat = subcat;
    this.app.deptTapesState.viewMode = (subcat === 'featured') ? 'featured' : 'all';

    const buttons = document.querySelectorAll('.dept-tapes-subcat-btn');
    buttons.forEach(btn => {
      const btnCat = btn.getAttribute('data-dept-tapes-subcat');
      if (btnCat === subcat) {
        btn.className = 'dept-tapes-subcat-btn active px-3 py-1.5 border border-primary bg-primary/20 text-white font-bold transition-colors cursor-pointer rounded text-[11px] shadow-sm';
      } else {
        btn.className = 'dept-tapes-subcat-btn px-3 py-1.5 border border-secondary bg-black/70 text-secondary hover:text-white hover:border-primary transition-colors cursor-pointer rounded text-[11px]';
      }
    });

    this.renderDeptTapesGrid();
  }

  renderDeptTapesGrid() {
    const featuredView = document.getElementById('dept-tapes-featured-view');
    const dynamicGrid = document.getElementById('dept-tapes-dynamic-grid');
    const countBadge = document.getElementById('dept-tapes-count-badge');
    if (!featuredView || !dynamicGrid) return;

    if (!this.app.deptTapesState) {
      this.app.deptTapesState = { subcat: 'featured', viewMode: 'featured' };
    }

    if (this.app.deptTapesState.subcat === 'featured') {
      featuredView.style.display = 'grid';
      dynamicGrid.style.display = 'none';
      if (countBadge) countBadge.textContent = 'Showing 4 Featured Tapes';
      return;
    }

    featuredView.style.display = 'none';
    dynamicGrid.style.display = 'grid';

    const allTapes = ECOM_CATALOG.filter(p => 
      p.category === 'Masking Products' && !p.hideFromStorefront
    );

    let items = allTapes;
    if (this.app.deptTapesState.subcat === 'tapes') {
      items = allTapes.filter(p => p.category === 'Masking Products' && !p.name.includes('Mixed'));
    } else if (this.app.deptTapesState.subcat === 'sets') {
      items = allTapes.filter(p => p.name.includes('Mixed Set') || p.name.includes('Workshop Set'));
    }

    if (countBadge) {
      const labelMap = { all: 'All Masking Tapes', tapes: 'Fine Line Single Rolls', sets: 'Mixed Width Sets' };
      countBadge.textContent = `Showing ${items.length} ${labelMap[this.app.deptTapesState.subcat] || 'Tapes'}`;
    }

    dynamicGrid.innerHTML = items.map(prod => {
      const priceInfo = this.app.calculateDisplayPrice(prod);
      const isGreen = prod.name.toLowerCase().includes('green');
      const isOrange = prod.name.toLowerCase().includes('orange');
      const isSet = prod.name.includes('Set') || prod.name.includes('Mixed');
      const badgeText = isSet ? '5-ROLL SET' : (isGreen ? 'RAZOR EDGE' : (isOrange ? 'HEAT 132°C' : 'MASKING'));
      const badgeColor = isGreen 
        ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300' 
        : (isOrange 
            ? 'bg-orange-950/80 border-orange-500/60 text-orange-300' 
            : 'bg-neutral-900 border-neutral-600 text-neutral-300');
      const imgSrc = this.getAssetUrl(prod.image) || this.getAssetUrl('assets/images/flake-king-orange-mixed-set.webp');

      return `
        <div class="industrial-card p-4 flex flex-col justify-between bg-surface-container border border-white/15 rounded-lg group hover:border-primary/60 transition-colors">
          <div>
            <div class="h-36 bg-black/40 rounded overflow-hidden flex items-center justify-center p-2 mb-3 relative cursor-pointer" onclick="window.paintApp.openDetailModal('${prod.id}')">
              <img src="${imgSrc}" alt="${prod.name}" class="h-full object-contain group-hover:scale-105 transition-transform duration-300" onerror="this.onerror=null; this.src='${this.getAssetUrl('assets/images/flake-king-orange-mixed-set.webp')}';">
              <span class="absolute top-2 left-2 px-1.5 py-0.5 rounded border text-[8px] font-mono font-bold ${badgeColor}">${badgeText}</span>
            </div>
            <h4 class="font-headline text-sm uppercase text-white font-bold leading-tight mb-1 group-hover:text-primary cursor-pointer" onclick="window.paintApp.openDetailModal('${prod.id}')">
              ${prod.name}
            </h4>
            <p class="text-[11px] text-neutral-400 font-body mb-2 line-clamp-2">
              ${prod.description ? prod.description.split('\n')[0] : 'Automotive workshop masking and prep solution.'}
            </p>
          </div>
          <div>
            <div class="flex items-baseline justify-between border-t border-white/10 pt-2 mb-2">
              <span class="text-primary font-headline text-base font-bold">${priceInfo.formattedPrimary}</span>
              <span class="text-secondary font-mono text-[10px]">${priceInfo.formattedSecondary}</span>
            </div>
            <div class="grid grid-cols-2 gap-1.5">
              <button onclick="window.paintApp.addProductToCartById('${prod.id}')" class="mech-button-primary !w-full !py-1.5 !text-[10px] !justify-center font-bold">
                + Add
              </button>
              <button onclick="window.paintApp.openDetailModal('${prod.id}')" class="mech-btn-secondary !w-full !py-1.5 !text-[10px] !justify-center">
                Options
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  filterAndScrollToVsionCategory(cat) {
    this.app.setBrandFilter('VsionAir');
    this.app.setCategoryFilter(cat);
    const anchor = document.getElementById('storefront-catalog-anchor');
    if (anchor) anchor.scrollIntoView({ behavior: 'smooth' });
  }
}
