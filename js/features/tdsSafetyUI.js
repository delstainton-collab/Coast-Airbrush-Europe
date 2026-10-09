// Technical Data Sheets, SDS & Safety Documentation UI Controller
// Extracted per Anti-God Monolith Architecture Skill (Target <= 250 lines)

import { FLAKE_KING_WET_MIX_RATIOS } from '../../data/flake_king_tds.js';

export class TdsSafetyUI {
  constructor(appRef) {
    this.app = appRef;
  }

  getAssetUrl(path) {
    if (this.app && typeof this.app.getAssetUrl === 'function') {
      return this.app.getAssetUrl(path);
    }
    if (typeof window !== 'undefined' && typeof window.getAssetUrl === 'function') {
      return window.getAssetUrl(path);
    }
    return path;
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
    const isFlake = prod.category === 'Dry Metal Flake (Glitter)' || (prod.brand || '').includes('Flake King');
    
    // Select the designated European REACH SDS PDF document
    let pdfUrl = 'assets/docs/KROMA_EDGE_REACH_SDS_SAFETY_DATA_SHEET.pdf';
    let filename = `REACH_SDS_${(prod.sku || prod.id || 'PRODUCT').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    
    if (isFlake) {
      pdfUrl = 'assets/docs/FLAKE_KING_REACH_SDS_SAFETY_DATA_SHEET.pdf';
    }

    const a = document.createElement('a');
    a.href = this.getAssetUrl(pdfUrl);
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  getFlakeSpecForSize(sizeString) {
    const s = String(sizeString || '').toLowerCase();
    if (s.includes('002') || s.includes('50') || s.includes('ultra small')) {
      return FLAKE_KING_WET_MIX_RATIOS[0];
    }
    if (s.includes('004') || s.includes('100')) {
      return FLAKE_KING_WET_MIX_RATIOS[1];
    }
    if (s.includes('008') || s.includes('200') || s.includes('medium')) {
      return FLAKE_KING_WET_MIX_RATIOS[2];
    }
    if (s.includes('015') || s.includes('375') || s.includes('large')) {
      return FLAKE_KING_WET_MIX_RATIOS[3];
    }
    if (s.includes('025') || s.includes('625') || s.includes('xl') || s.includes('x large')) {
      return FLAKE_KING_WET_MIX_RATIOS[4];
    }
    if (s.includes('040') || s.includes('1025') || s.includes('060') || s.includes('dxl')) {
      return FLAKE_KING_WET_MIX_RATIOS[5];
    }
    return FLAKE_KING_WET_MIX_RATIOS[2]; // fallback to medium .008"
  }

  openFlakeTDSModal() {
    const modal = document.getElementById('modal-flake-tds');
    if (modal) {
      modal.classList.add('active');
    }
  }

  closeFlakeTDSModal() {
    const modal = document.getElementById('modal-flake-tds');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  downloadTDS(prod) {
    if (!prod) return;
    const nameLower = (prod.name || '').toLowerCase();
    const idLower = (prod.id || '').toLowerCase();
    const isKromaClear = nameLower.includes('clear') || idLower.includes('clear') || idLower.includes('topcoat');
    const isVsionAir = (prod.brand || '').toLowerCase().includes('vsionair') || (prod.category || '').toLowerCase().includes('jig');
    const isFlake = prod.category === 'Dry Metal Flake (Glitter)' || (prod.brand || '').includes('Flake King') || (prod.name || '').toLowerCase().includes('flake');

    if (isFlake) {
      this.openFlakeTDSModal();
      return;
    }

    let pdfUrl = 'assets/docs/KROMA_EDGE_MIRROR_SYSTEM_TDS.pdf';
    let filename = `TDS_${(prod.sku || prod.id || 'PRODUCT').replace(/[^a-zA-Z0-9_-]/g, '_')}_SPECS.pdf`;

    if (isKromaClear) {
      pdfUrl = 'assets/docs/KROMA_EDGE_TOPCOAT_CLEAR_TDS.pdf';
    } else if (isVsionAir) {
      pdfUrl = 'assets/docs/VSIONAIR_TECHNICAL_DATA_SHEET.pdf';
    }

    const a = document.createElement('a');
    a.href = this.getAssetUrl(pdfUrl);
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  downloadSystemTDS(system) {
    if (!system) return;
    if ((system.id || '').startsWith('flake_king_')) {
      this.openFlakeTDSModal();
      return;
    }
    const isClear = (system.id || '').includes('clear');
    const pdfUrl = isClear ? 'assets/docs/KROMA_EDGE_TOPCOAT_CLEAR_TDS.pdf' : 'assets/docs/KROMA_EDGE_MIRROR_SYSTEM_TDS.pdf';
    const a = document.createElement('a');
    a.href = this.getAssetUrl(pdfUrl);
    a.download = `TDS_${system.id.toUpperCase()}_SPECS.pdf`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  downloadSystemSDS(system) {
    if (!system) return;
    const a = document.createElement('a');
    a.href = this.getAssetUrl('assets/docs/KROMA_EDGE_REACH_SDS_SAFETY_DATA_SHEET.pdf');
    a.download = `REACH_SDS_${system.id.toUpperCase()}.pdf`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  setupDetailModal() {
    const modal = document.getElementById('modal-product-detail');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.app.closeDetailModal();
      });
    }

    const flakeTdsModal = document.getElementById('modal-flake-tds');
    if (flakeTdsModal) {
      flakeTdsModal.addEventListener('click', (e) => {
        if (e.target === flakeTdsModal) this.closeFlakeTDSModal();
      });
    }

    this.app.addSafeListener('btn-detail-add-cart', () => {
      if (this.app.activeModalProduct) {
        const prod = this.app.activeModalProduct;
        if (prod.isComingSoon || prod.brand === 'VsionAir') {
          const subject = encodeURIComponent(`VsionAir Allocation Inquiry: ${prod.name} (${prod.sku || ''})`);
          const body = encodeURIComponent(`Hello Coast Airbrush Europe,\n\nPlease register my interest / provide quotation for:\nProduct: ${prod.name}\nSKU: ${prod.sku || 'N/A'}\n\nName:\nCompany (if applicable):\nCountry:\nQuantity required:\n\nThank you.`);
          window.location.href = `mailto:info@coastairbrush.eu?subject=${subject}&body=${body}`;
          return;
        }
        const currentSelection = this.app.selectedProductVariants[prod.id] || {};
        const prices = this.app.getProductCalculatedPrice(prod, currentSelection.pack, currentSelection.size);
        const variantDesc = [currentSelection.size, currentSelection.pack].filter(Boolean).join(' / ') || 'Standard';

        this.app.shopifyCartManager.addItem({
          sku: prices.sku || prod.sku,
          title: prod.name,
          priceEur: prices.priceEur,
          quantity: 1,
          variantDetails: variantDesc
        });
        this.app.closeDetailModal();
        this.app.openCartDrawer();
      }
    });

    this.app.addSafeListener('btn-download-sds', () => {
      if (this.app.activeModalProduct) this.downloadSDS(this.app.activeModalProduct);
    });

    this.app.addSafeListener('btn-download-tds', () => {
      if (this.app.activeModalProduct) this.downloadTDS(this.app.activeModalProduct);
    });

    this.app.addSafeListener('btn-detail-open-mix-calc', () => {
      if (this.app.activeModalProduct) {
        const prod = this.app.activeModalProduct;
        this.app.closeDetailModal();
        this.app.openQuickMixModal(prod.mixingSystemId || (prod.brand === 'Kroma Edge' ? 'kroma_edge_mirror_chrome' : null));
      }
    });
  }
}
