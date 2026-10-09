import { 
  calculateRequiredVolume, 
  calculateMixingRecipe, 
  calculateUniversalCoverage, 
  calculateTopcoatClearCoverage, 
  calculateBoxSurfaceArea, 
  calculatePanelSurfaceArea, 
  calculateAreaFromVolume, 
  PRESET_PANELS 
} from '../mixingEngine.js';

export class ProjectEstimator {
  constructor(appRef) {
    this.app = appRef;
    this.estimatorUnit = 'imperial'; // 'imperial' or 'metric'
    this.estimatorMode = 'box'; // 'box', 'panel', or 'direct'
    this.currentEstimatorSqFt = 6.0;
    this.currentCoatCount = null;
    this.currentBundleData = null;
    this._manualVolumeOverride = false;
    this.activeRecipeTab = 'base';
    this.lastEstimatedVolumeMl = 0;
  }

  setup() {
    this.estimatorUnit = 'imperial';
    this.estimatorMode = 'box';
    this.currentEstimatorSqFt = 6.0;
    this.currentCoatCount = null;
    this.currentBundleData = null;
    this._manualVolumeOverride = false;
    this.activeRecipeTab = 'base';

    // Unit toggle buttons
    const btnImperial = document.getElementById('btn-unit-imperial');
    const btnMetric = document.getElementById('btn-unit-metric');
    if (btnImperial) {
      btnImperial.addEventListener('click', () => {
        this._manualVolumeOverride = false;
        this.setEstimatorUnit('imperial');
      });
    }
    if (btnMetric) {
      btnMetric.addEventListener('click', () => {
        this._manualVolumeOverride = false;
        this.setEstimatorUnit('metric');
      });
    }

    // Calculation Mode Tabs
    const btnBox = document.getElementById('btn-calc-mode-box');
    const btnPanel = document.getElementById('btn-calc-mode-panel');
    const btnDirect = document.getElementById('btn-calc-mode-direct');
    if (btnBox) btnBox.addEventListener('click', () => {
      this._manualVolumeOverride = false;
      this.setEstimatorMode('box');
    });
    if (btnPanel) btnPanel.addEventListener('click', () => {
      this._manualVolumeOverride = false;
      this.setEstimatorMode('panel');
    });
    if (btnDirect) btnDirect.addEventListener('click', () => {
      this._manualVolumeOverride = false;
      this.setEstimatorMode('direct');
    });

    // Dimensional Inputs
    ['est-length', 'est-width', 'est-height', 'est-panel-length', 'est-panel-width', 'est-direct-volume'].forEach(id => {
      this.app.addSafeListener(id, 'input', () => {
        this._manualVolumeOverride = false;
        this.updateEstimatorCalculation();
      });
    });
    this.app.addSafeListener('check-open-bottom', 'change', () => {
      this._manualVolumeOverride = false;
      this.updateEstimatorCalculation();
    });
    this.app.addSafeListener('est-direct-unit', 'change', () => {
      this._manualVolumeOverride = false;
      this.updateEstimatorCalculation();
    });

    // Automotive Presets
    const presetChips = document.querySelectorAll('.btn-preset-chip');
    presetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this._manualVolumeOverride = false;
        const key = chip.getAttribute('data-preset');
        this.applyAutomotivePreset(key);
      });
    });

    // Manual target batch volume inputs in Step 2
    const volInput = document.getElementById('input-total-volume');
    if (volInput) {
      volInput.addEventListener('input', () => {
        this._manualVolumeOverride = true;
        this.app.updateCalculation();
      });
    }
    const unitSelect = document.getElementById('select-volume-unit');
    if (unitSelect) {
      unitSelect.addEventListener('change', () => {
        this._manualVolumeOverride = true;
        this.app.updateCalculation();
      });
    }

    // Step 3 Recipe sub-tabs (Primary vs Dedicated Clear)
    const btnTabBase = document.getElementById('btn-recipe-tab-base');
    const btnTabClear = document.getElementById('btn-recipe-tab-clear');
    if (btnTabBase) {
      btnTabBase.addEventListener('click', () => this.setRecipeTab('base'));
    }
    if (btnTabClear) {
      btnTabClear.addEventListener('click', () => this.setRecipeTab('clear'));
    }

    // Sync button to mix recipe table
    this.app.addSafeListener('btn-sync-estimator-to-mix', 'click', () => this.syncEstimatorToMixTable());

    // Dedicated Topcoat Clear Thinner Slider
    const tcSlider = document.getElementById('tc-reduction-slider');
    if (tcSlider) {
      tcSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        const display = document.getElementById('tc-reduction-display');
        const valLabel = document.getElementById('tc-reduction-val-label');
        if (display) display.textContent = `${val}%`;
        if (valLabel) {
          if (val <= 75) valLabel.textContent = `${val}% (High Film Build)`;
          else if (val <= 90) valLabel.textContent = `${val}% (Balanced Viscosity)`;
          else valLabel.textContent = `${val}% (Maximum Flow & Glass Leveling)`;
        }
        this.updateTopcoatCalculation();
      });
    }

    // Add Bundle to Cart
    this.app.addSafeListener('btn-add-bundle-cart', 'click', () => this.addRecommendedBundleToCart());

    // Guide download buttons
    this.app.addSafeListener('btn-guide-download-tds', 'click', () => {
      if (this.app.selectedSystem) this.app.downloadSystemTDS(this.app.selectedSystem);
    });
    this.app.addSafeListener('btn-guide-download-sds', 'click', () => {
      if (this.app.selectedSystem) this.app.downloadSystemSDS(this.app.selectedSystem);
    });

    // Run initial calculation and render
    this.updateEstimatorCalculation();
    this.renderApplicationGuide();
    this.updateTopcoatCalculation();
  }

  setEstimatorUnit(unit) {
    this.estimatorUnit = unit;
    const btnImperial = document.getElementById('btn-unit-imperial');
    const btnMetric = document.getElementById('btn-unit-metric');
    
    if (btnImperial && btnMetric) {
      if (unit === 'imperial') {
        btnImperial.className = "px-2.5 py-1 text-xs font-mono font-bold bg-primary text-white rounded transition-colors cursor-pointer shadow-sm";
        btnMetric.className = "px-2.5 py-1 text-xs font-mono font-bold bg-surface hover:bg-surface-variant text-secondary hover:text-white rounded transition-colors cursor-pointer";
      } else {
        btnMetric.className = "px-2.5 py-1 text-xs font-mono font-bold bg-primary text-white rounded transition-colors cursor-pointer shadow-sm";
        btnImperial.className = "px-2.5 py-1 text-xs font-mono font-bold bg-surface hover:bg-surface-variant text-secondary hover:text-white rounded transition-colors cursor-pointer";
      }
    }

    // Update label suffixes
    const suffix = unit === 'imperial' ? 'in' : 'cm';
    const labelL = document.getElementById('est-unit-label-l');
    const labelW = document.getElementById('est-unit-label-w');
    const labelH = document.getElementById('est-unit-label-h');
    const labelPL = document.getElementById('est-panel-unit-label-l');
    const labelPW = document.getElementById('est-panel-unit-label-w');

    if (labelL) labelL.textContent = suffix;
    if (labelW) labelW.textContent = suffix;
    if (labelH) labelH.textContent = suffix;
    if (labelPL) labelPL.textContent = suffix;
    if (labelPW) labelPW.textContent = suffix;

    // Convert values in inputs gracefully
    const lenInput = document.getElementById('est-length');
    const widInput = document.getElementById('est-width');
    const hgtInput = document.getElementById('est-height');
    if (lenInput && widInput && hgtInput) {
      if (unit === 'metric') {
        lenInput.value = Math.round((parseFloat(lenInput.value) || 12) * 2.54);
        widInput.value = Math.round((parseFloat(widInput.value) || 12) * 2.54);
        hgtInput.value = Math.round((parseFloat(hgtInput.value) || 12) * 2.54);
      } else {
        lenInput.value = (Math.round(((parseFloat(lenInput.value) || 30) / 2.54) * 2) / 2).toFixed(1);
        widInput.value = (Math.round(((parseFloat(widInput.value) || 30) / 2.54) * 2) / 2).toFixed(1);
        hgtInput.value = (Math.round(((parseFloat(hgtInput.value) || 30) / 2.54) * 2) / 2).toFixed(1);
      }
    }

    this.updateEstimatorCalculation();
  }

  setEstimatorMode(mode) {
    this.estimatorMode = mode;
    const boxInputs = document.getElementById('estimator-box-inputs');
    const panelInputs = document.getElementById('estimator-panel-inputs');
    const directInputs = document.getElementById('estimator-direct-inputs');

    const btnBox = document.getElementById('btn-calc-mode-box');
    const btnPanel = document.getElementById('btn-calc-mode-panel');
    const btnDirect = document.getElementById('btn-calc-mode-direct');

    const activeClass = "px-3 py-1.5 text-xs font-mono font-bold border rounded transition-all cursor-pointer bg-primary/20 border-primary text-primary flex items-center gap-1.5 shadow-sm";
    const inactiveClass = "px-3 py-1.5 text-xs font-mono font-bold border rounded transition-all cursor-pointer bg-surface border-secondary/60 text-secondary hover:text-white hover:border-secondary flex items-center gap-1.5";

    if (btnBox) btnBox.className = mode === 'box' ? activeClass : inactiveClass;
    if (btnPanel) btnPanel.className = mode === 'panel' ? activeClass : inactiveClass;
    if (btnDirect) btnDirect.className = mode === 'direct' ? activeClass : inactiveClass;

    if (boxInputs) boxInputs.classList.toggle('hidden', mode !== 'box');
    if (panelInputs) panelInputs.classList.toggle('hidden', mode !== 'panel');
    if (directInputs) directInputs.classList.toggle('hidden', mode !== 'direct');

    this.updateEstimatorCalculation();
  }

  applyAutomotivePreset(presetKey) {
    const preset = PRESET_PANELS.find(p => p.id === presetKey) || PRESET_PANELS[1];
    if (!preset) return;

    this.setEstimatorMode('panel');
    const isMetric = this.estimatorUnit === 'metric';
    const targetSqFt = preset.sqft;

    // Approximate a square panel dimension that gives this square footage
    const sideInches = Math.round(Math.sqrt(targetSqFt * 144) * 10) / 10;
    const sideCm = Math.round(sideInches * 2.54);

    const pLen = document.getElementById('est-panel-length');
    const pWid = document.getElementById('est-panel-width');
    if (pLen && pWid) {
      pLen.value = isMetric ? sideCm : sideInches;
      pWid.value = isMetric ? sideCm : sideInches;
    }

    this.updateEstimatorCalculation();
  }

  updateEstimatorCalculation() {
    let sqft = 0;
    let sqm = 0;
    const isMetric = this.estimatorUnit === 'metric';

    if (this.estimatorMode === 'box') {
      const l = parseFloat(document.getElementById('est-length')?.value) || 0;
      const w = parseFloat(document.getElementById('est-width')?.value) || 0;
      const h = parseFloat(document.getElementById('est-height')?.value) || 0;
      const openBottom = document.getElementById('check-open-bottom')?.checked || false;
      const res = calculateBoxSurfaceArea(l, w, h, isMetric ? 'cm' : 'in', openBottom);
      sqft = res.sqft;
      sqm = res.sqm;
    } else if (this.estimatorMode === 'panel') {
      const l = parseFloat(document.getElementById('est-panel-length')?.value) || 0;
      const w = parseFloat(document.getElementById('est-panel-width')?.value) || 0;
      const res = calculatePanelSurfaceArea(l, w, isMetric ? 'cm' : 'in');
      sqft = res.sqft;
      sqm = res.sqm;
    } else if (this.estimatorMode === 'direct') {
      const vol = parseFloat(document.getElementById('est-direct-volume')?.value) || 0;
      const unit = document.getElementById('est-direct-unit')?.value || 'ml';
      const res = calculateAreaFromVolume(vol, unit, this.app.selectedSystem);
      sqft = res.sqft;
      sqm = res.sqm;
    }

    if (sqft <= 0) sqft = 2.0;
    this.currentEstimatorSqFt = sqft;

    // Update Adaptive Coat Selector for the selected formula
    this.renderCoatSelector();

    // Calculate Universal Coverage using the modular engine
    const cov = calculateUniversalCoverage({
      system: this.app.selectedSystem,
      sqft: sqft,
      sqm: sqm,
      userCoats: this.currentCoatCount
    });

    this.lastEstimatedVolumeMl = cov.totalMl;

    // Real-time live auto-sync to batch volume input & recipe calculations
    const volInput = document.getElementById('input-total-volume');
    const unitSelect = document.getElementById('select-volume-unit');
    if (volInput && !this._manualVolumeOverride) {
      if (unitSelect) unitSelect.value = 'ml';
      volInput.value = cov.totalMl;
      this.app.totalMlNeeded = cov.totalMl;
      this.app.currentRecipe = calculateMixingRecipe(this.app.selectedSystem, this.app.totalMlNeeded, this.app.selectedColors);
      this.app.renderRecipeTable();
      this.app.updateSystemDescription();
    }

    // Update live metrics on screen
    const areaDisplay = document.getElementById('est-area-display');
    const areaSqmDisplay = document.getElementById('est-area-sqm-display');
    const volDisplay = document.getElementById('est-volume-display');
    const flozDisplay = document.getElementById('est-floz-display');
    const potlifeDisplay = document.getElementById('est-potlife-display');

    if (areaDisplay) areaDisplay.textContent = `${cov.sqft} sq ft`;
    if (areaSqmDisplay) areaSqmDisplay.textContent = `(${cov.sqm} m²)`;
    if (volDisplay) volDisplay.textContent = `${cov.totalMl} mL`;
    if (flozDisplay) flozDisplay.textContent = `${cov.totalFlOz} fl oz (w/ 10% safety buffer)`;
    if (potlifeDisplay) potlifeDisplay.textContent = `${cov.profile.potLifeHours || 3} Hours`;

    // Render bundle recommender card
    this.renderBundleRecommender(cov);

    // Update dedicated clearcoat co-calculator if applicable
    this.updateTopcoatCalculation();
  }

  renderCoatSelector() {
    const container = document.getElementById('coat-selector-container');
    if (!container || !this.app.selectedSystem) return;

    const profile = this.app.selectedSystem.coverageProfile || {};
    const isChrome = this.app.selectedSystem.id === 'kroma_edge_mirror_chrome';
    const isCandy = profile.type === 'candy';

    const labelEl = document.getElementById('label-coat-mode');
    const noteEl = document.getElementById('note-coat-mode');
    const controlsEl = document.getElementById('controls-coat-slider');

    if (isChrome) {
      this.currentCoatCount = 1;
      if (labelEl) labelEl.textContent = "Application Method (Locked)";
      if (noteEl) noteEl.textContent = "Strictly ONE continuous wet coat. Do NOT mist or tack coat.";
      if (controlsEl) {
        controlsEl.innerHTML = `
          <span class="metal-spec-plate-red !py-1 !px-2.5 font-bold">1 WET COAT ONLY</span>
        `;
      }
    } else if (isCandy) {
      if (!this.currentCoatCount || this.currentCoatCount < 3) this.currentCoatCount = 4;
      if (labelEl) labelEl.textContent = "Candy Color Depth (Coats)";
      if (noteEl) noteEl.textContent = profile.coatNote || "Translucent build coats scale color intensity.";
      if (controlsEl) {
        controlsEl.innerHTML = `
          <div class="flex items-center gap-2">
            <input type="range" id="input-coat-slider" min="3" max="6" value="${this.currentCoatCount}" class="w-24 accent-primary cursor-pointer h-1.5 bg-surface rounded">
            <span id="label-coat-val" class="font-mono text-xs font-bold text-amber-400 min-w-[55px]">${this.currentCoatCount} Coats</span>
          </div>
        `;
        const slider = document.getElementById('input-coat-slider');
        if (slider) {
          slider.addEventListener('input', (e) => {
            this.currentCoatCount = parseInt(e.target.value, 10);
            const valLabel = document.getElementById('label-coat-val');
            if (valLabel) valLabel.textContent = `${this.currentCoatCount} Coats`;
            this._manualVolumeOverride = false;
            this.updateEstimatorCalculation();
          });
        }
      }
    } else {
      if (!this.currentCoatCount) this.currentCoatCount = profile.recommendedCoats || 2;
      if (labelEl) labelEl.textContent = "Coats Required";
      if (noteEl) noteEl.textContent = profile.coatNote || `${profile.recommendedCoats || 2} coats recommended for full hiding & DFT.`;
      if (controlsEl) {
        controlsEl.innerHTML = `
          <div class="flex items-center gap-2">
            <input type="range" id="input-coat-slider" min="1" max="4" value="${this.currentCoatCount}" class="w-24 accent-primary cursor-pointer h-1.5 bg-surface rounded">
            <span id="label-coat-val" class="font-mono text-xs font-bold text-white min-w-[50px]">${this.currentCoatCount} Coats</span>
          </div>
        `;
        const slider = document.getElementById('input-coat-slider');
        if (slider) {
          slider.addEventListener('input', (e) => {
            this.currentCoatCount = parseInt(e.target.value, 10);
            const valLabel = document.getElementById('label-coat-val');
            if (valLabel) valLabel.textContent = `${this.currentCoatCount} Coats`;
            this._manualVolumeOverride = false;
            this.updateEstimatorCalculation();
          });
        }
      }
    }
  }

  syncEstimatorToMixTable() {
    this._manualVolumeOverride = false;
    this.updateEstimatorCalculation();
    const target = document.getElementById('step-3-recipe-card') || document.getElementById('recipe-table-body');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    this.app.showToast(`✅ Live Synced ${this.lastEstimatedVolumeMl} mL to Digital Scale recipe!`, 'success');
  }

  setRecipeTab(tab) {
    this.activeRecipeTab = tab;
    const btnBase = document.getElementById('btn-recipe-tab-base');
    const btnClear = document.getElementById('btn-recipe-tab-clear');
    const primaryContainer = document.getElementById('recipe-table-container');
    const clearPanel = document.getElementById('kroma-topcoat-panel');

    const baseActive = "px-3.5 py-1.5 text-xs font-mono font-bold border rounded transition-all cursor-pointer bg-primary/20 border-primary text-primary flex items-center gap-1.5 shadow-sm";
    const baseInactive = "px-3.5 py-1.5 text-xs font-mono font-bold border rounded transition-all cursor-pointer bg-surface border-secondary/60 text-secondary hover:text-white hover:border-secondary flex items-center gap-1.5";

    const clearActive = "px-3.5 py-1.5 text-xs font-mono font-bold border rounded transition-all cursor-pointer bg-purple-900/40 border-purple-400 text-purple-200 flex items-center gap-1.5 shadow-sm";
    const clearInactive = "px-3.5 py-1.5 text-xs font-mono font-bold border rounded transition-all cursor-pointer bg-surface border-purple-500/60 text-purple-300 hover:text-white hover:border-purple-400 flex items-center gap-1.5";

    if (tab === 'clear') {
      if (btnBase) btnBase.className = baseInactive;
      if (btnClear) btnClear.className = clearActive;
      if (primaryContainer) primaryContainer.classList.add('hidden');
      if (clearPanel) clearPanel.classList.remove('hidden');
    } else {
      if (btnBase) btnBase.className = baseActive;
      if (btnClear) btnClear.className = clearInactive;
      if (primaryContainer) primaryContainer.classList.remove('hidden');
      if (clearPanel) clearPanel.classList.add('hidden');
    }
  }

  updateTopcoatCalculation() {
    const topcoatPanel = document.getElementById('kroma-topcoat-panel');
    const tabsContainer = document.getElementById('recipe-view-tabs');
    const isChrome = this.app.selectedSystem?.id === 'kroma_edge_mirror_chrome';
    if (tabsContainer) {
      tabsContainer.classList.toggle('hidden', !isChrome);
    }
    if (!isChrome) {
      if (topcoatPanel) topcoatPanel.classList.add('hidden');
      const primaryContainer = document.getElementById('recipe-table-container');
      if (primaryContainer) primaryContainer.classList.remove('hidden');
      return;
    }

    this.setRecipeTab(this.activeRecipeTab || 'base');

    const slider = document.getElementById('tc-reduction-slider');
    const reduction = slider ? parseFloat(slider.value) : 100;
    const tcRes = calculateTopcoatClearCoverage(this.currentEstimatorSqFt, reduction);

    const totalBatchEl = document.getElementById('tc-total-batch-display');
    if (totalBatchEl) totalBatchEl.textContent = `${tcRes.totalGrams.toFixed(1)} g`;

    const tbody = document.getElementById('tc-recipe-table-body');
    if (tbody) {
      tbody.innerHTML = `
        <tr class="hover:bg-purple-950/30 transition-colors">
          <td><span class="metal-spec-plate !border-purple-400 !text-purple-300">1</span></td>
          <td class="font-bold text-white">Kroma Dedicated Clear Base</td>
          <td class="font-mono text-purple-300">10 Parts</td>
          <td class="font-mono">${tcRes.baseGrams.toFixed(1)} g</td>
          <td class="font-mono font-bold text-purple-300">${tcRes.scaleTargets.step1Base.toFixed(1)} g</td>
        </tr>
        <tr class="hover:bg-purple-950/30 transition-colors">
          <td><span class="metal-spec-plate !border-purple-400 !text-purple-300">2</span></td>
          <td class="font-bold text-white">Dedicated Clear Hardener</td>
          <td class="font-mono text-purple-300">1 Part</td>
          <td class="font-mono">${tcRes.hardenerGrams.toFixed(1)} g</td>
          <td class="font-mono font-bold text-purple-300">${tcRes.scaleTargets.step2Hardener.toFixed(1)} g</td>
        </tr>
        <tr class="hover:bg-purple-950/30 transition-colors">
          <td><span class="metal-spec-plate !border-purple-400 !text-purple-300">3</span></td>
          <td class="font-bold text-white">Dedicated Clear Thinner (${tcRes.reductionPercent}%)</td>
          <td class="font-mono text-purple-300">${(tcRes.reductionPercent / 10).toFixed(1)} Parts</td>
          <td class="font-mono">${tcRes.thinnerGrams.toFixed(1)} g</td>
          <td class="font-mono font-bold text-purple-300">${tcRes.scaleTargets.step3Thinner.toFixed(1)} g</td>
        </tr>
      `;
    }
  }

  renderBundleRecommender(coverage) {
    const isChrome = this.app.selectedSystem?.id === 'kroma_edge_mirror_chrome';
    const tier = coverage.recommendedTier;
    const companion = coverage.companion;

    const primaryTitle = document.getElementById('bundle-primary-title');
    const primarySku = document.getElementById('bundle-primary-sku');
    const primaryDesc = document.getElementById('bundle-primary-desc');
    const primaryPrice = document.getElementById('bundle-primary-price');

    const companionCard = document.getElementById('bundle-card-companion');
    const companionTitle = document.getElementById('bundle-companion-title');
    const companionSku = document.getElementById('bundle-companion-sku');
    const companionDesc = document.getElementById('bundle-companion-desc');
    const companionPrice = document.getElementById('bundle-companion-price');

    const totalPriceEl = document.getElementById('bundle-total-price');

    let pPrice = tier?.priceEUR || 149.00;
    let cPrice = companion?.clearPriceEUR || 89.00;
    let totalEUR = pPrice;

    if (primaryTitle && tier) {
      primaryTitle.textContent = tier.name;
      if (primarySku) primarySku.textContent = tier.sku;
      if (primaryDesc) primaryDesc.textContent = tier.desc || `Pre-measured commercial kit covering up to ${tier.maxSqFt || 10} sq ft.`;
      if (primaryPrice) primaryPrice.textContent = `€${pPrice.toFixed(2)}`;
    }

    if (companionCard) {
      if (isChrome && companion) {
        companionCard.classList.remove('hidden');
        if (companionTitle) companionTitle.textContent = companion.recommendedSet;
        if (companionSku) companionSku.textContent = companion.clearSku;
        if (companionDesc) companionDesc.textContent = `Includes Clear Base, Hardener, and Dedicated Thinner calibrated for ${coverage.sqft} sq ft.`;
        if (companionPrice) companionPrice.textContent = `€${cPrice.toFixed(2)}`;
        totalEUR += cPrice;
      } else {
        companionCard.classList.add('hidden');
      }
    }

    if (totalPriceEl) {
      totalPriceEl.textContent = `€${totalEUR.toFixed(2)}`;
    }

    // Save bundle data for 1-click cart addition
    this.currentBundleData = {
      systemId: this.app.selectedSystem.id,
      sqft: coverage.sqft,
      primary: {
        sku: tier?.sku || 'KE-MIRROR-140G',
        name: tier?.name || 'KromaEdge Small Kit',
        priceEUR: pPrice
      },
      companion: isChrome && companion ? {
        sku: companion.clearSku,
        name: companion.recommendedSet,
        priceEUR: cPrice
      } : null,
      totalEUR: totalEUR
    };

    // Update banner on top estimator
    const estName = document.getElementById('est-recommended-name');
    const estPrice = document.getElementById('est-recommended-price');
    const estDesc = document.getElementById('est-recommended-desc');
    const estCompText = document.getElementById('est-companion-text');
    const estCompInd = document.getElementById('est-companion-indicator');

    if (estName && tier) estName.textContent = tier.name;
    if (estPrice) estPrice.textContent = `€${totalEUR.toFixed(2)}`;
    if (estDesc && tier) estDesc.textContent = tier.desc || `Calibrated for ${coverage.sqft} sq ft coverage.`;
    if (estCompInd) {
      estCompInd.classList.toggle('hidden', !isChrome || !companion);
      if (estCompText && companion) {
        estCompText.textContent = `+ ${companion.recommendedSet}`;
      }
    }
  }

  addRecommendedBundleToCart() {
    if (!this.currentBundleData) {
      this.app.showToast("Please calculate project dimensions first.", "warning");
      return;
    }

    const b = this.currentBundleData;
    const cart = this.app.cartManager || this.app.shopifyCartManager;
    // Add primary kit
    cart.addItem({
      sku: b.primary.sku,
      title: b.primary.name,
      priceEur: b.primary.priceEUR,
      quantity: 1,
      variantDetails: `Coverage: ${b.sqft} sq ft`,
      properties: {
        "Project Coverage": `${b.sqft} sq ft`,
        "System": this.app.selectedSystem?.name || "Kroma Edge"
      }
    });

    // Add companion clearcoat if applicable
    if (b.companion) {
      cart.addItem({
        sku: b.companion.sku,
        title: b.companion.name,
        priceEur: b.companion.priceEUR,
        quantity: 1,
        variantDetails: `Topcoat Companion for ${b.sqft} sq ft`,
        properties: {
          "Companion To": b.primary.sku,
          "Project Coverage": `${b.sqft} sq ft`
        }
      });
    }

    this.app.showToast(`🔥 Added ${b.primary.name}${b.companion ? ' + ' + b.companion.name : ''} to cart!`, 'success');
    this.app.openCartDrawer();
  }

  renderApplicationGuide() {
    const container = document.getElementById('application-guide-timeline');
    if (!container || !this.app.selectedSystem) return;

    const guide = this.app.selectedSystem.applicationGuide;
    if (!guide || guide.length === 0) {
      container.innerHTML = `
        <div class="p-4 bg-[#18181c] rounded-lg border border-[#27272a] text-xs font-mono text-neutral-300">
          <div class="font-bold text-white mb-1 uppercase">${this.app.selectedSystem.name} Spray Protocol</div>
          <p>Follow standard automotive refinishing practices: Strain through 125µm mesh filter, maintain 1.2–1.4mm HVLP @ 1.8–2.2 Bar, and observe recommended flash times between coats.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = guide.map(item => {
      const alertHtml = item.alert ? `
        <div class="mt-3 p-3 rounded-lg text-xs font-mono ${
          item.alert.type === 'danger' 
            ? 'bg-red-950/40 border border-red-500/50 text-red-200' 
            : 'bg-amber-950/40 border border-amber-500/50 text-amber-200'
        }">
          <div class="font-bold uppercase flex items-center gap-1.5 mb-0.5">
            <span class="material-symbols-outlined text-[16px]">${item.alert.type === 'danger' ? 'report' : 'warning'}</span>
            <span>${item.alert.title}</span>
          </div>
          <p class="leading-relaxed opacity-90">${item.alert.text}</p>
        </div>
      ` : '';

      const pointsHtml = item.points.map(pt => `
        <li class="flex items-start gap-2">
          <span class="text-red-500 font-bold">•</span>
          <span>${pt}</span>
        </li>
      `).join('');

      return `
        <div class="bg-[#18181c] p-4 md:p-5 border border-[#27272a] rounded-lg hover:border-neutral-500 transition-all">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div class="flex items-center gap-2.5">
              <span class="w-6 h-6 rounded-full bg-[#dc2626] text-white font-mono text-xs font-bold flex items-center justify-center">${item.step}</span>
              <h4 class="font-headline text-base text-white font-bold uppercase">${item.title}</h4>
            </div>
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#121215] text-neutral-300 border border-[#27272a] uppercase">${item.badge || 'STAGE PROTOCOL'}</span>
          </div>
          <p class="font-mono text-xs text-neutral-300 mb-2 leading-relaxed">${item.summary}</p>
          <ul class="font-mono text-xs text-neutral-400 space-y-1 pl-1">
            ${pointsHtml}
          </ul>
          ${alertHtml}
        </div>
      `;
    }).join('');
  }

  // Backward compatibility alias
  applyKromaPreset(panelKey) {
    this.applyAutomotivePreset(panelKey);
  }

  calcCustomKromaArea(val) {
    this.currentEstimatorSqFt = parseFloat(val) || 2.0;
    this.updateEstimatorCalculation();
  }

  renderEstimatorResults(res) {
    this.updateEstimatorCalculation();
  }
}
