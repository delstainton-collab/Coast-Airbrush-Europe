export class AdminFxEngineUI {
  constructor(appRef) {
    this.app = appRef;
  }

  setup() {
    if (!this.app.euLocalization?.fxEngine) return;
    const fx = this.app.euLocalization.fxEngine;

    // Listen to FX updates to refresh UI live
    fx.onUpdate(() => {
      this.renderFxStatus();
    });

    // 1. Sync Live Rate
    this.app.addSafeListener('btn-fx-sync-live', 'click', async () => {
      const btn = document.getElementById('btn-fx-sync-live');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin">refresh</span> SYNCING...`;
      }
      const res = await fx.fetchLiveRate();
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span class="material-symbols-outlined text-[16px]">sync</span> SYNC LIVE ECB RATE`;
      }
      if (res.success) {
        this.app.showToast(`✅ Live ECB Rate Synced: 1 EUR = £${res.rate.toFixed(4)}`, 'success');
      } else {
        this.app.showToast(`⚠️ Rate fetch note: ${res.source || res.error}`, 'warning');
      }
      this.renderFxStatus();
    });

    // 2. Open Update Euro Pricing Modal (from banner or control card)
    const openModal = () => this.openFxUpdateModal();
    this.app.addSafeListener('btn-fx-banner-update-pricing', 'click', openModal);
    this.app.addSafeListener('btn-fx-open-update-modal', 'click', openModal);

    // 3. Banner Adjust Buffer quick button
    this.app.addSafeListener('btn-fx-banner-adjust-buffer', 'click', () => {
      const hazmatTab = document.getElementById('subtab-admin-hazmat');
      if (hazmatTab) hazmatTab.click();
      const bufInput = document.getElementById('fx-input-buffer-percent');
      if (bufInput) {
        bufInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        bufInput.focus();
        bufInput.select();
      }
    });

    // 4. Banner Dismiss button
    this.app.addSafeListener('btn-fx-banner-dismiss', 'click', () => {
      fx.dismissAlarm();
      this.renderFxStatus();
    });

    // 5. Set Current as Baseline
    this.app.addSafeListener('btn-fx-set-baseline', 'click', () => {
      const cur = fx.config.currentRate;
      fx.reanchorBaseline();
      this.app.adminController.saveFxSettings({ baselineRate: cur });
      this.app.showToast(`⚡ New Baseline Set: 1 EUR = £${cur.toFixed(4)}. Alarms reset.`, 'success');
      this.renderFxStatus();
    });

    // 6. Save FX Settings
    this.app.addSafeListener('btn-fx-save-settings', 'click', () => {
      const buf = parseFloat(document.getElementById('fx-input-buffer-percent')?.value || '1.8');
      const spike = parseFloat(document.getElementById('fx-input-spike-threshold')?.value || '3.5');
      const breaker = parseFloat(document.getElementById('fx-input-circuit-breaker')?.value || '7.5');
      const rounding = document.getElementById('fx-select-rounding-mode')?.value || 'retail_95';

      this.app.adminController.saveFxSettings({
        bufferPercent: buf,
        spikeThresholdPercent: spike,
        circuitBreakerPercent: breaker,
        roundingMode: rounding
      });
      this.app.showToast("✅ FX Volatility & Margin Guard parameters saved!", 'success');
      this.renderFxStatus();
    });

    // 7. Reset to Defaults
    this.app.addSafeListener('btn-fx-reset-defaults', 'click', () => {
      if (confirm("Reset FX Volatility Guard settings to default calibration (Baseline £0.8547, 1.8% Buffer)?")) {
        fx.resetToDefaults();
        this.app.adminController.saveFxSettings(fx.config);
        this.renderFxStatus();
        this.app.showToast("↺ FX settings restored to defaults", 'info');
      }
    });

    // 8. Test Simulator Buttons
    this.app.addSafeListener('btn-sim-spike-up', 'click', () => {
      fx.simulateSpike(4.5);
      this.app.showToast("⚡ Simulated +4.5% Euro Spike (Triggering Alarm)", 'warning');
      this.renderFxStatus();
    });

    this.app.addSafeListener('btn-sim-spike-down', 'click', () => {
      fx.simulateSpike(-4.5);
      this.app.showToast("📉 Simulated -4.5% Euro Drop (Triggering Alarm)", 'warning');
      this.renderFxStatus();
    });

    this.app.addSafeListener('btn-sim-circuit-breaker', 'click', () => {
      fx.simulateSpike(8.5);
      this.app.showToast("🛑 Simulated +8.5% Extreme Shift (Circuit Breaker Tripped!)", 'error');
      this.renderFxStatus();
    });

    this.app.addSafeListener('btn-sim-reset-normal', 'click', () => {
      fx.resetToDefaults();
      this.app.showToast("↺ Restored Normal Baseline Rate", 'success');
      this.renderFxStatus();
    });

    // 9. Modal Interactions
    this.app.addSafeListener('btn-close-fx-modal', 'click', () => this.closeFxUpdateModal());
    this.app.addSafeListener('btn-cancel-fx-modal', 'click', () => this.closeFxUpdateModal());

    const modalBufInput = document.getElementById('fx-modal-buffer-input');
    if (modalBufInput) {
      modalBufInput.addEventListener('input', () => this.renderFxModalImpactTable());
    }
    const modalRoundingSelect = document.getElementById('fx-modal-rounding-select');
    if (modalRoundingSelect) {
      modalRoundingSelect.addEventListener('change', () => this.renderFxModalImpactTable());
    }

    this.app.addSafeListener('btn-confirm-fx-reprice', 'click', () => {
      const bufVal = parseFloat(document.getElementById('fx-modal-buffer-input')?.value || '1.8');
      const roundVal = document.getElementById('fx-modal-rounding-select')?.value || 'retail_95';

      // Re-anchor baseline & reset alarms
      const res = this.app.adminController.reanchorFxBaseline({
        bufferPercent: bufVal,
        roundingMode: roundVal
      });

      // Batch reprice catalog products from master GBP ex-vat
      const repriceRes = this.app.adminController.batchRepriceCatalogFromGbp({
        rate: res.newBaseline,
        bufferPercent: bufVal,
        roundingMode: roundVal
      });

      this.closeFxUpdateModal();
      this.renderFxStatus();
      this.app.renderAdminSpreadsheet();
      this.app.renderAdminProducts();
      this.app.renderStorefrontGrid();

      this.app.showToast(`⚡ Repriced ${repriceRes.count || 135} catalog products in EUR! New baseline locked at 1 EUR = £${res.newBaseline.toFixed(4)}.`, 'success');
    });

    // Initial render of FX UI
    this.renderFxStatus();
  }

  renderFxStatus() {
    if (!this.app.euLocalization?.fxEngine) return;
    const fx = this.app.euLocalization.fxEngine;
    const details = fx.getDeviationDetails();

    // 1. Metric cards in Hazmat & FX panel
    const curRateEl = document.getElementById('fx-metric-current-rate');
    const invRateEl = document.getElementById('fx-metric-inverse-rate');
    const baseRateEl = document.getElementById('fx-metric-baseline-rate');
    const devEl = document.getElementById('fx-metric-deviation');
    const statusBadgeEl = document.getElementById('fx-guard-status-badge');
    const bufInput = document.getElementById('fx-input-buffer-percent');
    const spikeInput = document.getElementById('fx-input-spike-threshold');
    const breakerInput = document.getElementById('fx-input-circuit-breaker');
    const roundSelect = document.getElementById('fx-select-rounding-mode');
    const lastSyncEl = document.getElementById('fx-metric-last-sync');

    if (curRateEl) curRateEl.innerText = `1 € = £${details.currentRate.toFixed(4)}`;
    if (invRateEl) invRateEl.innerText = `£1 = €${(1 / details.currentRate).toFixed(4)}`;
    if (baseRateEl) baseRateEl.innerText = `1 € = £${details.baselineRate.toFixed(4)}`;

    if (devEl) {
      const sign = details.rateShiftPercent > 0 ? '+' : '';
      devEl.innerText = `${sign}${details.rateShiftPercent.toFixed(1)}%`;
      if (details.alarmState === 'CIRCUIT_BREAKER') {
        devEl.className = 'text-rose-400 font-bold';
      } else if (details.alarmState === 'SPIKE_WARNING') {
        devEl.className = 'text-amber-400 font-bold';
      } else {
        devEl.className = 'text-emerald-400 font-bold';
      }
    }

    if (statusBadgeEl) {
      if (details.alarmState === 'CIRCUIT_BREAKER') {
        statusBadgeEl.className = 'bg-rose-950/80 text-rose-300 border border-rose-500/70 text-[10px] font-mono px-2 py-0.5 uppercase font-bold flex items-center gap-1';
        statusBadgeEl.innerHTML = `<span class="material-symbols-outlined text-[12px]">gpp_bad</span> CIRCUIT BREAKER TRIPPED`;
      } else if (details.alarmState === 'SPIKE_WARNING') {
        statusBadgeEl.className = 'bg-amber-950/80 text-amber-300 border border-amber-500/70 text-[10px] font-mono px-2 py-0.5 uppercase font-bold flex items-center gap-1';
        statusBadgeEl.innerHTML = `<span class="material-symbols-outlined text-[12px]">warning</span> SPIKE ALERT ACTIVE`;
      } else {
        statusBadgeEl.className = 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono px-2 py-0.5 uppercase font-bold flex items-center gap-1';
        statusBadgeEl.innerHTML = `<span class="material-symbols-outlined text-[12px]">verified</span> NORMAL // PROTECTED`;
      }
    }

    if (bufInput && document.activeElement !== bufInput) bufInput.value = fx.config.bufferPercent;
    if (spikeInput && document.activeElement !== spikeInput) spikeInput.value = fx.config.spikeThresholdPercent;
    if (breakerInput && document.activeElement !== breakerInput) breakerInput.value = fx.config.circuitBreakerPercent;
    if (roundSelect && document.activeElement !== roundSelect) roundSelect.value = fx.config.roundingMode;
    if (lastSyncEl) {
      const dt = new Date(fx.config.lastChecked);
      lastSyncEl.innerText = `${dt.getHours().toString().padStart(2,'0')}:${dt.getMinutes().toString().padStart(2,'0')} GMT`;
    }

    // 2. Top Banner Alert
    const banner = document.getElementById('fx-spike-alert-banner');
    const bannerStatusBadge = document.getElementById('fx-banner-status-badge');
    const bannerSummary = document.getElementById('fx-banner-rate-summary');
    const bannerDesc = document.getElementById('fx-banner-description');
    const bannerIconBox = document.getElementById('fx-banner-icon-box');
    const bannerIcon = document.getElementById('fx-banner-icon');

    if (banner) {
      if (details.isAlarmActive) {
        banner.classList.remove('hidden');
        if (details.alarmState === 'CIRCUIT_BREAKER') {
          banner.className = 'mb-6 p-4 border-2 border-rose-500/80 bg-rose-950/40 rounded shadow-[0_0_20px_rgba(244,63,94,0.25)] font-mono transition-all';
          if (bannerIconBox) bannerIconBox.className = 'w-10 h-10 rounded flex items-center justify-center flex-shrink-0 bg-rose-500/20 text-rose-400 border border-rose-500/40';
          if (bannerIcon) bannerIcon.innerText = 'gpp_bad';
          if (bannerStatusBadge) {
            bannerStatusBadge.className = 'px-2 py-0.5 text-[10px] font-bold uppercase rounded border bg-rose-600 text-white border-rose-400';
            bannerStatusBadge.innerText = 'CIRCUIT BREAKER ENGAGED';
          }
          if (bannerSummary) {
            bannerSummary.innerText = `Extreme shift of ${details.rateShiftPercent > 0 ? '+' : ''}${details.rateShiftPercent}% detected! (Live: £${details.currentRate.toFixed(4)} | Baseline: £${details.baselineRate.toFixed(4)})`;
          }
          if (bannerDesc) {
            bannerDesc.innerText = 'Automated fail-safe triggered: Customer Euro conversions are FROZEN to baseline rate to prevent distorted prices. Click "Update Euro Pricing" to review & re-anchor.';
          }
        } else {
          // SPIKE_WARNING
          banner.className = 'mb-6 p-4 border-2 border-amber-500/80 bg-amber-950/30 rounded shadow-[0_0_20px_rgba(245,158,11,0.2)] font-mono transition-all';
          if (bannerIconBox) bannerIconBox.className = 'w-10 h-10 rounded flex items-center justify-center flex-shrink-0 bg-amber-500/20 text-amber-400 border border-amber-500/40';
          if (bannerIcon) bannerIcon.innerText = 'warning';
          if (bannerStatusBadge) {
            bannerStatusBadge.className = 'px-2 py-0.5 text-[10px] font-bold uppercase rounded border bg-amber-500 text-slate-950 border-amber-400';
            bannerStatusBadge.innerText = 'FX SPIKE ALERT';
          }
          if (bannerSummary) {
            bannerSummary.innerText = `EUR/GBP moved ${details.rateShiftPercent > 0 ? '+' : ''}${details.rateShiftPercent}% vs Baseline (Live: 1 € = £${details.currentRate.toFixed(4)} | Baseline: £${details.baselineRate.toFixed(4)})`;
          }
          if (bannerDesc) {
            bannerDesc.innerText = 'Currency volatility exceeds safe threshold. European profit margins may be impacted. Review impact and click "Update Euro Pricing" to re-anchor.';
          }
        }
      } else {
        banner.classList.add('hidden');
      }
    }
  }

  openFxUpdateModal() {
    const modal = document.getElementById('modal-fx-update-pricing');
    if (!modal || !this.app.euLocalization?.fxEngine) return;
    const fx = this.app.euLocalization.fxEngine;
    const details = fx.getDeviationDetails();

    const baseEl = document.getElementById('fx-modal-baseline-rate');
    const liveEl = document.getElementById('fx-modal-live-rate');
    const shiftEl = document.getElementById('fx-modal-rate-shift');
    const bufInput = document.getElementById('fx-modal-buffer-input');
    const roundSelect = document.getElementById('fx-modal-rounding-select');
    const circuitStatusEl = document.getElementById('fx-modal-circuit-status');

    if (baseEl) baseEl.innerText = `1 € = £${details.baselineRate.toFixed(4)}`;
    if (liveEl) liveEl.innerText = `1 € = £${details.currentRate.toFixed(4)}`;
    if (shiftEl) {
      shiftEl.innerText = `${details.rateShiftPercent > 0 ? '+' : ''}${details.rateShiftPercent}% Rate Shift`;
      shiftEl.className = details.isCircuitBreakerTripped ? 'text-[10px] text-rose-400 font-bold mt-0.5' : 'text-[10px] text-amber-400 font-bold mt-0.5';
    }
    if (bufInput) bufInput.value = fx.config.bufferPercent;
    if (roundSelect) roundSelect.value = fx.config.roundingMode;
    if (circuitStatusEl) {
      if (details.isCircuitBreakerTripped) {
        circuitStatusEl.innerText = '⚠️ Circuit Breaker Currently Engaged (Re-anchoring will reset)';
        circuitStatusEl.className = 'text-rose-400 font-bold';
      } else {
        circuitStatusEl.innerText = '✓ Safe Volatility Band';
        circuitStatusEl.className = 'text-emerald-400 font-bold';
      }
    }

    this.renderFxModalImpactTable();
    modal.classList.add('active');
  }

  closeFxUpdateModal() {
    const modal = document.getElementById('modal-fx-update-pricing');
    if (modal) modal.classList.remove('active');
  }

  renderFxModalImpactTable() {
    const tbody = document.getElementById('fx-modal-sample-tbody');
    if (!tbody || !this.app.euLocalization?.fxEngine) return;
    const fx = this.app.euLocalization.fxEngine;

    const buf = parseFloat(document.getElementById('fx-modal-buffer-input')?.value || '1.8');
    const rounding = document.getElementById('fx-modal-rounding-select')?.value || 'retail_95';

    // Get real catalog samples
    const all = this.app.getEffectiveProducts ? this.app.getEffectiveProducts() : [];
    const kit = all.find(p => (p.sku || '').includes('5060733580007') || (p.sku || '').includes('FOMPRO')) || { name: 'Flake King Pro Series Kit', sku: 'FOMPRO', priceGbp: 208.33 };
    const gun = all.find(p => (p.sku || '').includes('5060733580014')) || { name: 'Flake King 1000 Dry Metal Flake Gun', sku: '5060733580014', priceGbp: 108.33 };
    const jar = all.find(p => (p.sku || '').includes('5060733580021')) || { name: 'FOM 1000/1050 100g Jar & Lid', sku: '5060733580021', priceGbp: 1.65 };
    const binder = all.find(p => (p.sku || '').includes('FK50500')) || { name: 'FK50 Surface Binder 500ml', sku: 'FK50500', priceGbp: 16.66 };

    const samples = [
      { name: kit.name, sku: kit.sku || 'FOMPRO', gbpPrice: parseFloat(kit.priceGbp) || 208.33 },
      { name: gun.name, sku: gun.sku || '5060733580014', gbpPrice: parseFloat(gun.priceGbp) || 108.33 },
      { name: binder.name, sku: binder.sku || 'FK50500', gbpPrice: parseFloat(binder.priceGbp) || 16.66 },
      { name: jar.name, sku: jar.sku || '5060733580021', gbpPrice: parseFloat(jar.priceGbp) || 1.65 }
    ];

    tbody.innerHTML = '';
    samples.forEach(item => {
      const oldEur = fx.calculateEurPrice(item.gbpPrice, {
        rate: fx.config.baselineRate,
        bufferPercent: fx.config.bufferPercent,
        roundingMode: fx.config.roundingMode
      });
      const newEur = fx.calculateEurPrice(item.gbpPrice, {
        rate: fx.config.currentRate,
        bufferPercent: buf,
        roundingMode: rounding
      });
      const diff = +(newEur - oldEur).toFixed(2);
      const sign = diff >= 0 ? '+' : '';

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-surface-container transition-colors';
      tr.innerHTML = `
        <td class="p-2.5">
          <div class="font-bold text-white">${item.name}</div>
          <div class="text-[10px] text-secondary font-mono">${item.sku}</div>
        </td>
        <td class="p-2.5 text-right font-mono font-bold text-amber-400">
          &pound;${item.gbpPrice.toFixed(2)}
        </td>
        <td class="p-2.5 text-right font-mono text-slate-400">
          &euro;${oldEur.toFixed(2)}
        </td>
        <td class="p-2.5 text-right font-mono font-bold text-emerald-400">
          &euro;${newEur.toFixed(2)}
        </td>
        <td class="p-2.5 text-right font-mono text-xs ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
          ${sign}&euro;${diff.toFixed(2)}
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
}
