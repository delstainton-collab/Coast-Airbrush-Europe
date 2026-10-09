// Master Brands & Vendor Partner Showcase
// Extracted per Anti-God Monolith Architecture Skill (Laws 2 & 4)

import { BRANDS_MASTER, getBrandById } from '../../data/brands_master.js';
import { ECOM_CATALOG } from '../../data/full_ecom_catalog.js';

export class BrandsShowcase {
  constructor(appRef) {
    this.app = appRef;
    this.currentModalBrandId = 'kroma-edge';
  }

  getProductCount(brand, catalog) {
    if (!catalog || !Array.isArray(catalog)) return 0;
    const slug = (brand.slug || brand.id || '').toLowerCase();
    const brandName = (brand.name || '').toLowerCase();
    const filterBrand = (brand.filterBrand || '').toLowerCase();

    return catalog.filter(p => {
      if (p.hideFromStorefront) return false;
      const pb = (p.brand || '').toLowerCase();
      if (slug === 'iwata-atawi' || slug === 'iwata' || slug === 'atawi') {
        return pb.includes('iwata') || pb.includes('atawi');
      }
      if (slug === 'flake-king') {
        return pb === 'flake king' || pb.includes('flake king');
      }
      if (slug === 'vsionair') {
        return pb === 'vsionair' || pb.includes('vsionair');
      }
      if (slug === 'kroma-edge') {
        return pb.includes('kroma');
      }
      if (slug === 'ace-of-shades') {
        return pb.includes('ace of shades');
      }
      if (slug === 'hyper-fx') {
        return pb.includes('hyper fx') || pb.includes('createx');
      }
      if (slug === 'lumilor') {
        return pb.includes('lumilor');
      }
      if (slug === 'clean-armor') {
        return pb.includes('clean armor');
      }
      if (filterBrand && pb.includes(filterBrand)) return true;
      return pb.includes(brandName);
    }).length;
  }

  render() {
    const grid = document.getElementById('brands-showcase-grid');
    if (!grid) return;

    const catalog = (typeof window !== 'undefined' && window.SHOPIFY_CATALOG) || ECOM_CATALOG || [];

    // MANDATORY RULE: If brand product count is 0, brand box is NOT displayed
    const activeBrands = BRANDS_MASTER.filter(brand => {
      const count = this.getProductCount(brand, catalog);
      return count > 0;
    });

    const badgeEl = document.getElementById('brands-count-badge');
    if (badgeEl) {
      badgeEl.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
        <span>✦ OFFICIAL EUROPEAN PARTNER ECOSYSTEM • ${activeBrands.length} ACTIVE MANUFACTURERS</span>
      `;
    }

    grid.innerHTML = activeBrands.map(brand => {
      const count = this.getProductCount(brand, catalog);
      const borderHover = brand.slug === 'kroma-edge' ? 'hover:border-sky-500/70' :
                          brand.slug === 'vsionair' ? 'hover:border-amber-500/70' :
                          brand.slug === 'iwata-atawi' ? 'hover:border-red-500/70' : 'hover:border-red-500/70';
      const textAccent = brand.slug === 'kroma-edge' ? 'text-sky-400' :
                         brand.slug === 'vsionair' ? 'text-amber-400' :
                         brand.slug === 'iwata-atawi' ? 'text-red-400' : 'text-red-400';
      const bgAccentBadge = brand.slug === 'kroma-edge' ? 'bg-sky-950/60 border-sky-500/40 text-sky-400' :
                            brand.slug === 'vsionair' ? 'bg-amber-950/60 border-amber-500/40 text-amber-400' :
                            brand.slug === 'iwata-atawi' ? 'bg-red-950/60 border-red-500/40 text-red-400' : 'bg-red-950/60 border-red-500/40 text-red-400';
      const glowBg = brand.slug === 'kroma-edge' ? 'bg-sky-500/10' :
                     brand.slug === 'vsionair' ? 'bg-amber-500/10' :
                     brand.slug === 'iwata-atawi' ? 'bg-red-500/10' : 'bg-red-500/10';

      const uspsList = (brand.usps || []).slice(0, 3).map(u => {
        const parts = u.split(':');
        const boldPart = parts.length > 1 ? `<strong>${parts[0]}:</strong>${parts.slice(1).join(':')}` : u;
        return `<li class="flex items-start gap-1.5"><span class="${textAccent} font-bold">✓</span> <span>${boldPart}</span></li>`;
      }).join('');

      return `
        <div class="bg-surface-container border border-surface-container-high ${borderHover} transition-all rounded-lg p-5 flex flex-col justify-between shadow-md group relative overflow-hidden">
          <div class="absolute top-0 right-0 w-24 h-24 ${glowBg} rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="font-mono text-[10px] sm:text-[11px] font-bold ${bgAccentBadge} border px-2.5 py-0.5 rounded flex items-center gap-1">
                <span>${brand.origin.includes('Japan') ? '🇯🇵' : '🇬🇧'}</span>
                <span>${brand.badgeText || brand.distributorTier}</span>
              </span>
              <span class="text-[10px] font-mono text-secondary uppercase">${(brand.category || '').split('&')[0].trim()}</span>
            </div>

            <div class="h-14 w-full flex items-center justify-start mb-3 bg-[#0d0d10] p-2.5 rounded border border-[#242429] shadow-inner group-hover:border-[#383842] transition-colors">
              <img src="${brand.logoImage}" alt="${brand.name} Official Logo" class="h-full w-auto max-h-9 object-contain" onerror="this.style.display='none'">
            </div>

            <h3 class="font-headline text-2xl uppercase text-white font-bold tracking-tight group-hover:${textAccent} transition-colors">
              ${brand.name}
            </h3>
            <p class="font-mono text-xs ${textAccent} font-semibold mb-3">
              ${brand.tagline}
            </p>
            <p class="font-body text-xs text-neutral-300 leading-relaxed mb-4 line-clamp-3">
              ${brand.story ? brand.story.originNarrative : ''}
            </p>
            <ul class="font-mono text-[11px] text-neutral-300 space-y-1.5 mb-5 border-t border-surface-container-high pt-3">
              ${uspsList}
            </ul>
          </div>
          <div class="flex items-center gap-2 pt-3 border-t border-surface-container-high">
            <button onclick="window.openBrandStoryModal && window.openBrandStoryModal('${brand.id}')" class="mech-btn-secondary !text-[11px] !py-2 !px-2.5 flex-1 text-center font-mono flex items-center justify-center gap-1 cursor-pointer">
              <span class="material-symbols-outlined text-[14px]">auto_stories</span>
              <span>Story &amp; TDS</span>
            </button>
            <button onclick="window.filterByBrandAndScroll && window.filterByBrandAndScroll('${brand.filterBrand || brand.name}')" class="mech-button-primary !text-[11px] !py-2 !px-3 font-mono font-bold text-center flex items-center justify-center gap-1 cursor-pointer">
              <span>Shop (${count})</span>
              <span class="material-symbols-outlined text-[14px]">arrow_downward</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  openModal(brandId) {
    this.currentModalBrandId = brandId || 'kroma-edge';
    const brand = getBrandById(this.currentModalBrandId) || BRANDS_MASTER[0];
    if (!brand) return;

    const modal = document.getElementById('modal-brand-story');
    if (!modal) return;

    const titleEl = document.getElementById('modal-brand-title');
    const taglineEl = document.getElementById('modal-brand-tagline');
    const originEl = document.getElementById('modal-brand-origin-badge');
    const tierEl = document.getElementById('modal-brand-distributor-tier');
    const linkEl = document.getElementById('modal-brand-official-link');

    const logoEl = document.getElementById('modal-brand-logo');
    if (logoEl) {
      if (brand.logoImage) {
        logoEl.src = brand.logoImage;
        logoEl.alt = `${brand.name} Official Logo`;
        logoEl.classList.remove('hidden');
      } else {
        logoEl.classList.add('hidden');
      }
    }

    if (titleEl) titleEl.textContent = brand.name;
    if (taglineEl) taglineEl.textContent = brand.tagline;
    if (originEl) originEl.innerHTML = `<span>🌐</span><span>ORIGIN: ${brand.origin.toUpperCase()}</span>`;
    if (tierEl) tierEl.textContent = brand.distributorTier.toUpperCase();
    if (linkEl) {
      linkEl.href = brand.website;
      linkEl.title = `Visit official ${brand.name} website`;
    }

    const originTextEl = document.getElementById('modal-brand-story-origin');
    const missionTextEl = document.getElementById('modal-brand-story-mission');
    const techTextEl = document.getElementById('modal-brand-story-tech');

    if (originTextEl) originTextEl.textContent = brand.story.originNarrative;
    if (missionTextEl) missionTextEl.textContent = brand.story.europeanMission;
    if (techTextEl) techTextEl.textContent = brand.story.technologyBreakthrough;

    const uspsListEl = document.getElementById('modal-brand-usps-list');
    if (uspsListEl) {
      uspsListEl.innerHTML = brand.usps.map((usp, i) => `
        <div class="p-3 bg-black/50 border border-surface-container-high rounded flex items-start gap-2.5">
          <span class="text-amber-400 font-bold text-sm shrink-0">0${i + 1}</span>
          <p class="font-mono text-xs text-neutral-200 leading-relaxed">${usp}</p>
        </div>
      `).join('');
    }

    const tdsGridEl = document.getElementById('modal-brand-tds-grid');
    if (tdsGridEl) {
      const h = brand.applicationHighlights || {};
      tdsGridEl.innerHTML = Object.entries(h).map(([k, v]) => {
        const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
        return `
          <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#242429] pb-2 gap-1">
            <span class="text-secondary uppercase text-[11px] font-bold">${label}:</span>
            <span class="text-white text-xs font-semibold sm:text-right max-w-md">${v}</span>
          </div>
        `;
      }).join('');
    }

    this.switchModalTab('story');
    modal.classList.remove('hidden');
  }

  closeModal() {
    const modal = document.getElementById('modal-brand-story');
    if (modal) modal.classList.add('hidden');
  }

  switchModalTab(tabKey) {
    const tabs = ['story', 'tech', 'tds'];
    tabs.forEach(t => {
      const btn = document.getElementById(`btn-brand-tab-${t}`);
      const pane = document.getElementById(`brand-tab-content-${t}`);
      if (btn) {
        if (t === tabKey) {
          btn.className = 'brand-modal-tab active px-3 py-1.5 rounded font-bold bg-primary text-white flex items-center gap-1.5 cursor-pointer';
        } else {
          btn.className = 'brand-modal-tab px-3 py-1.5 rounded font-bold text-neutral-400 hover:text-white flex items-center gap-1.5 cursor-pointer';
        }
      }
      if (pane) {
        if (t === tabKey) pane.classList.remove('hidden');
        else pane.classList.add('hidden');
      }
    });
  }

  shopCurrentBrand() {
    const brand = getBrandById(this.currentModalBrandId);
    this.closeModal();
    if (brand) {
      this.filterByBrandAndScroll(brand.name);
    }
  }

  filterByBrandAndScroll(brandName) {
    let target = brandName;
    if (target.includes('Iwata') || target.includes('Atawi')) target = 'Iwata';
    else if (target.includes('VsionAir')) target = 'VsionAir';
    else if (target.includes('Hyper FX') || target.includes('Createx')) target = 'Hyper FX';
    else if (target.includes('Ace of Shades')) target = 'Ace of Shades';
    else if (target.includes('Clean Armor')) target = 'Clean Armor';
    else if (target.includes('LumiLor')) target = 'LumiLor';
    else if (target.includes('Kroma')) target = 'Kroma Edge';
    else if (target.includes('Flake King')) target = 'Flake King';

    this.app.setBrandFilter(target);
    const anchor = document.getElementById('storefront-catalog-anchor');
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    this.app.showToast(`Filtered catalog for ${brandName} products.`, 'info');
  }

  renderAdmin() {
    const container = document.getElementById('admin-brands-grid');
    if (!container) return;

    container.innerHTML = BRANDS_MASTER.map(brand => {
      const bn = brand.name.toLowerCase();
      const count = ECOM_CATALOG.filter(p => (p.brand || '').toLowerCase().includes(brand.slug.replace('-', ' ')) || (p.brand || '').toLowerCase().includes(bn) || (brand.slug === 'iwata-atawi' && (p.brand || '').toLowerCase().includes('iwata'))).length;

      return `
        <div class="bg-surface-container border border-secondary/60 rounded-lg p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div class="space-y-3">
            <div class="flex items-center justify-between gap-2">
              <span class="font-mono text-[10px] text-primary font-bold bg-primary/20 border border-primary/40 px-2 py-0.5 rounded">
                ${brand.origin}
              </span>
              <span class="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">
                ✓ VERIFIED DISTRIBUTOR
              </span>
            </div>

            <div>
              <h4 class="font-headline text-lg uppercase text-white font-bold">${brand.name}</h4>
              <p class="font-mono text-[11px] text-neutral-400 leading-tight mt-0.5">${brand.legalName}</p>
            </div>

            <p class="font-body text-xs text-neutral-300 leading-relaxed line-clamp-3">
              ${brand.story.originNarrative}
            </p>

            <div class="p-2.5 bg-black/50 border border-secondary/40 rounded font-mono text-[11px] flex items-center justify-between">
              <span class="text-secondary">Catalog Mapped:</span>
              <span class="text-white font-bold">${count > 0 ? count : brand.productIds.length} SKUs Active</span>
            </div>
          </div>

          <div class="space-y-2 pt-4 border-t border-secondary/40 mt-4">
            <div class="grid grid-cols-2 gap-2">
              <button onclick="window.openBrandStoryModal && window.openBrandStoryModal('${brand.id}')" class="mech-btn-secondary !text-[11px] !py-2 !px-2 flex items-center justify-center gap-1 cursor-pointer">
                <span class="material-symbols-outlined text-[14px]">visibility</span>
                <span>Story &amp; TDS</span>
              </button>
              <button onclick="window.paintApp.filterByBrandAndScroll('${brand.name}')" class="mech-btn-secondary !text-[11px] !py-2 !px-2 flex items-center justify-center gap-1 cursor-pointer">
                <span class="material-symbols-outlined text-[14px]">inventory_2</span>
                <span>View SKUs</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  downloadCatalogJson() {
    const jsonStr = JSON.stringify(BRANDS_MASTER, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coast_airbrush_partner_brands_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.app.showToast('Downloaded manufacturer brand catalog JSON.', 'info');
  }
}
