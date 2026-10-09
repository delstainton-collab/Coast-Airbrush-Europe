import { calculateMixingRecipe } from '../mixingEngine.js';

export class QuickMixModal {
  constructor(appRef) {
    this.app = appRef;
  }

  setup() {
    const modal = document.getElementById('modal-quick-mix');
    if (!modal) return;

    this.app.addSafeListener('btn-close-quick-mix-modal', 'click', () => this.closeQuickMixModal());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeQuickMixModal();
    });

    this.app.addSafeListener('input-modal-total-volume', 'input', () => this.updateModalCalculation());
    this.app.addSafeListener('select-modal-volume-unit', 'change', () => this.updateModalCalculation());

    this.app.addSafeListener('btn-modal-download-tds', () => {
      if (this.app.selectedSystem) this.app.downloadSystemTDS(this.app.selectedSystem);
    });
    this.app.addSafeListener('btn-modal-download-sds', () => {
      if (this.app.selectedSystem) this.app.downloadSystemSDS(this.app.selectedSystem);
    });
  }

  setQuickMixVolumePreset(vol, unit = 'ml') {
    const volInput = document.getElementById('input-modal-total-volume');
    const unitSelect = document.getElementById('select-modal-volume-unit');
    if (unitSelect) unitSelect.value = unit;
    if (volInput) volInput.value = vol;

    document.querySelectorAll('.quick-mix-preset-btn').forEach(btn => {
      const bVol = parseFloat(btn.getAttribute('data-vol'));
      const bUnit = btn.getAttribute('data-unit') || 'ml';
      if (bVol === parseFloat(vol) && bUnit === unit) {
        btn.classList.add('border-red-500/80', 'bg-red-950/40', 'text-white', 'shadow-[0_0_8px_rgba(220,38,38,0.25)]');
        btn.classList.remove('bg-[#1c1c22]', 'border-white/10', 'text-neutral-300');
      } else {
        btn.classList.remove('border-red-500/80', 'bg-red-950/40', 'text-white', 'shadow-[0_0_8px_rgba(220,38,38,0.25)]');
        btn.classList.add('bg-[#1c1c22]', 'border-white/10', 'text-neutral-300');
      }
    });

    this.updateModalCalculation();
  }

  openQuickMixModal(systemId) {
    if (systemId) {
      this.app.onSystemChange(systemId);
    } else {
      this.app.renderSystemsDropdown();
      this.updateModalCalculation();
    }
    const modal = document.getElementById('modal-quick-mix');
    if (!modal) return;
    modal.classList.add('active');
    document.body.classList.add('modal-open');
  }

  closeQuickMixModal() {
    const modal = document.getElementById('modal-quick-mix');
    if (modal) modal.classList.remove('active');
    if (!document.querySelector('.modal-overlay.active')) {
      document.body.classList.remove('modal-open');
    }
  }

  updateModalCalculation() {
    const volInput = document.getElementById('input-modal-total-volume');
    const unitSelect = document.getElementById('select-modal-volume-unit');
    let vol = parseFloat(volInput ? volInput.value : 140) || 140;
    const unit = unitSelect ? unitSelect.value : 'ml';

    if (unit === 'floz') vol = vol * 29.5735;
    else if (unit === 'pt') vol = vol * 473.176;
    else if (unit === 'qt') vol = vol * 946.353;

    const recipe = calculateMixingRecipe(this.app.selectedSystem, vol, this.app.selectedColors);
    const tbody = document.getElementById('modal-recipe-table-body');
    if (!tbody || !recipe) return;
    tbody.innerHTML = '';

    const steps = recipe.steps || recipe.components || [];
    steps.forEach((step, index) => {
      const name = step.componentName || step.name;
      const weight = step.targetWeightGrams !== undefined ? step.targetWeightGrams : (step.individualWeightGrams || 0);
      const cumulative = step.cumulativeWeightGrams || 0;

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-white/[0.03] transition-colors';
      tr.innerHTML = `
        <td class="py-2.5 px-3">
          <span class="w-6 h-5 rounded bg-neutral-800 text-neutral-300 font-mono text-[10px] font-bold inline-flex items-center justify-center border border-white/10">0${index + 1}</span>
        </td>
        <td class="py-2.5 px-3 font-semibold text-white text-xs">${name}</td>
        <td class="py-2.5 px-3 text-right text-neutral-300 font-mono text-xs">${step.percentage}%</td>
        <td class="py-2.5 px-3 text-right text-neutral-400 font-mono text-xs">${Math.round(step.volumeMl)} mL</td>
        <td class="py-2.5 px-3 text-right text-neutral-300 font-mono text-xs">${weight.toFixed(1)} g</td>
        <td class="py-2.5 px-3 text-right">
          <span class="inline-block px-2.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-mono font-bold text-xs tracking-tight shadow-[0_0_8px_rgba(34,197,94,0.15)]">${cumulative.toFixed(1)} g</span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
}
