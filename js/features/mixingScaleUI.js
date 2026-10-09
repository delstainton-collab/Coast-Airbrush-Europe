// Coast Airbrush Europe - Mixing Calculator, Recipe Engine & Scale Assistant
// Extracted per Anti-God Monolith Architecture Skill (Laws 2 & 4)

import { calculateMixingRecipe } from '../mixingEngine.js?v=20260909_calc_engine';
import { ECOM_CATALOG } from '../../data/full_ecom_catalog.js';

export class MixingScaleUI {
  constructor(appRef) {
    this.app = appRef;
  }

  get currentCatalog() { return this.app.currentCatalog; }
  get selectedSystem() { return this.app.selectedSystem; }
  set selectedSystem(val) { this.app.selectedSystem = val; }
  get selectedColors() { return this.app.selectedColors; }
  set selectedColors(val) { this.app.selectedColors = val; }
  get totalMlNeeded() { return this.app.totalMlNeeded; }
  set totalMlNeeded(val) { this.app.totalMlNeeded = val; }
  get currentRecipe() { return this.app.currentRecipe; }
  set currentRecipe(val) { this.app.currentRecipe = val; }
  get currentScaleStepIndex() { return this.app.currentScaleStepIndex; }
  set currentScaleStepIndex(val) { this.app.currentScaleStepIndex = val; }
  get _manualVolumeOverride() { return this.app._manualVolumeOverride; }
  set _manualVolumeOverride(val) { this.app._manualVolumeOverride = val; }

  renderSystemsDropdown() {
    const select = document.getElementById('select-mixing-system');
    const grid = document.getElementById('mixing-systems-grid');
    const modalGrid = document.getElementById('modal-mixing-systems-grid');

    if (select && this.currentCatalog?.mixingSystems) {
      select.innerHTML = '';
      this.currentCatalog.mixingSystems.forEach(sys => {
        const opt = document.createElement('option');
        opt.value = sys.id;
        opt.textContent = `${sys.name} (${sys.ratioText})`;
        select.appendChild(opt);
      });
      if (this.selectedSystem) {
        select.value = this.selectedSystem.id;
      }
    }

    const renderCardGrid = (container, isModal = false) => {
      if (!container || !this.currentCatalog?.mixingSystems) return;
      container.innerHTML = '';
      this.currentCatalog.mixingSystems.forEach(sys => {
        const isSelected = this.selectedSystem && sys.id === this.selectedSystem.id;
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `p-3 text-left border rounded transition-all duration-150 cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
          isSelected 
            ? 'bg-gradient-to-br from-red-950/40 via-[#18181d] to-[#141418] border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.25),inset_0_0_0_1px_rgba(220,38,38,0.4)]' 
            : 'bg-[#16161a] border-[#27272a] hover:border-neutral-500 hover:bg-[#1a1a20]'
        }`;
        card.innerHTML = `
          <div class="flex items-center justify-between mb-1.5 w-full">
            <span class="font-mono text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded ${
              isSelected 
                ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                : 'bg-neutral-800 text-neutral-400 border border-white/5'
            }">
              ${sys.badge || 'FORMULA'}
            </span>
            ${isSelected ? '<span class="material-symbols-outlined text-red-500 text-[18px]">check_circle</span>' : ''}
          </div>
          <div class="font-headline text-xs ${isSelected ? 'text-white' : 'text-neutral-200 group-hover:text-white'} uppercase font-bold leading-tight mb-1">
            ${sys.name.split('(')[0].trim()}
          </div>
          <div class="font-mono text-[10px] ${isSelected ? 'text-amber-300 font-semibold' : 'text-neutral-400 group-hover:text-amber-300/90 font-medium'} flex items-center gap-1.5">
            <span class="text-neutral-500 text-[9px] font-bold">RATIO:</span>
            <span>${sys.ratioText}</span>
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
      modalRatioBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block mr-1.5"></span><span>Ratio: <strong class="text-white font-bold">${this.selectedSystem.ratioText}</strong></span>`;
    }
  }

  onSystemChange(systemId) {
    this._manualVolumeOverride = false;
    this.selectedSystem = this.currentCatalog?.mixingSystems?.find(s => s.id === systemId) || (this.currentCatalog?.mixingSystems ? this.currentCatalog.mixingSystems[0] : null);
    const select = document.getElementById('select-mixing-system');
    if (select && this.selectedSystem) select.value = this.selectedSystem.id;
    this.renderSystemsDropdown();
    this.updateCalculation();
    if (typeof this.app.updateModalCalculation === 'function') {
      this.app.updateModalCalculation();
    }
    if (typeof this.app.updateEstimatorCalculation === 'function') {
      this.app.updateEstimatorCalculation();
    }
    if (typeof this.app.renderApplicationGuide === 'function') {
      this.app.renderApplicationGuide();
    }
    if (typeof this.app.updateTopcoatCalculation === 'function') {
      this.app.updateTopcoatCalculation();
    }
  }

  setMixVolumePreset(vol, unit = 'ml') {
    this._manualVolumeOverride = true;
    const volInput = document.getElementById('input-total-volume');
    const unitSelect = document.getElementById('select-volume-unit');
    if (unitSelect) unitSelect.value = unit;
    if (volInput) volInput.value = vol;
    this.updateCalculation();
  }

  renderColorSwatches() {
    const container = document.getElementById('swatch-container');
    if (!container) return;
    container.innerHTML = '';

    const products = this.currentCatalog?.products || this.currentCatalog?.colors || ECOM_CATALOG.slice(0, 16);
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

  configureKromaEdgeInMixLab() {
    const system = this.currentCatalog?.mixingSystems?.find(s => s.id === 'kroma_edge_mirror_chrome') || (this.currentCatalog?.mixingSystems ? this.currentCatalog.mixingSystems[0] : null);
    if (system) {
      this.selectedSystem = system;
      const select = document.getElementById('select-mixing-system');
      if (select) select.value = system.id;
    }
    this.app.switchTab('tab-calculator', 'view-calculator');
    this.onSystemChange(system ? system.id : undefined);
  }

  mixThisProduct(product) {
    this.selectedColors['base'] = product;
    this.app.switchTab('tab-calculator', 'view-calculator');
    this.updateCalculation();
    if (typeof this.app.updateEstimatorCalculation === 'function') {
      this.app.updateEstimatorCalculation();
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
    if (this.selectedSystem) {
      this.currentRecipe = calculateMixingRecipe(this.selectedSystem, this.totalMlNeeded, this.selectedColors);
    }

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
      tr.className = 'hover:bg-white/[0.02] transition-colors';
      tr.innerHTML = `
        <td class="py-2.5 px-3"><span class="inline-flex items-center justify-center w-5 h-5 rounded bg-neutral-800 text-neutral-300 font-mono text-[10px] font-bold border border-white/10">${index + 1}</span></td>
        <td class="py-2.5 px-3 font-bold text-white">${name}</td>
        <td class="py-2.5 px-3 text-neutral-400 font-mono text-[11px]">${sku}</td>
        <td class="py-2.5 px-3 text-red-400 font-bold">${step.percentage}%</td>
        <td class="py-2.5 px-3 text-neutral-300">${Math.round(step.volumeMl)} mL</td>
        <td class="py-2.5 px-3 text-neutral-200 font-semibold">${weight.toFixed(1)} g</td>
        <td class="py-2.5 px-3 font-bold text-emerald-400 font-mono">${cumulative.toFixed(1)} g</td>
      `;
      tbody.appendChild(tr);
    });
  }

  openScaleMode() {
    this.app.switchTab('tab-scale', 'view-scale');
    this.initScaleAssistant();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      if (this.app.showToast) {
        this.app.showToast("✅ Mix Complete! All scale target weights reached.", "success");
      }
    }
  }
}
