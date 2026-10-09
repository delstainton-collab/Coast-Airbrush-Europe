export class GeminiModal {
  constructor(appRef) {
    this.app = appRef;
    this.currentGeminiOutput = null;
  }

  triggerGeminiSalesCopy() {
    const name = document.getElementById('form-product-name')?.value || 'Custom Formula';
    const brand = document.getElementById('form-product-brand')?.value || 'Kroma Edge';
    const cat = document.getElementById('form-product-category')?.value || 'Specialty Paint';
    const sku = document.getElementById('form-product-sku')?.value || 'KE-SYS';
    const priceEur = parseFloat(document.getElementById('form-product-price-eur')?.value || '100');

    const result = this.app.adminController.generateGeminiSalesCopy({
      name, brand, category: cat, sku, priceEur
    });

    this.currentGeminiOutput = { type: 'copy', data: result };
    this.app.currentGeminiOutput = this.currentGeminiOutput;
    this.showGeminiPreviewModal("✨ Gemini AI Sales Copy Generator", `
      <div class="space-y-3">
        <div class="p-3 bg-primary/10 border border-primary/40 rounded">
          <div class="font-bold text-primary text-xs uppercase mb-1">Generated Hook / Tagline:</div>
          <div class="text-white font-medium">${result.hook}</div>
        </div>

        <div>
          <div class="font-bold text-secondary text-xs uppercase mb-1">Generated High-Desire Sales Copy:</div>
          <div class="p-3 bg-surface-dim border border-secondary rounded whitespace-pre-wrap text-white leading-relaxed text-xs">
${result.description}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 text-xs">
          <div class="p-2 bg-surface-dim border border-secondary rounded">
            <span class="text-secondary font-bold">Suggested Badge:</span> 
            <span class="text-amber-400 font-bold ml-1">${result.badgeSuggestion}</span>
          </div>
          <div class="p-2 bg-surface-dim border border-secondary rounded">
            <span class="text-secondary font-bold">SEO Keywords:</span> 
            <span class="text-emerald-400 font-bold ml-1">${result.seoKeywords}</span>
          </div>
        </div>
      </div>
    `);
  }

  triggerGeminiVideoScript() {
    const name = document.getElementById('form-product-name')?.value || 'Kroma Edge Mirror Chrome';
    const brand = document.getElementById('form-product-brand')?.value || 'Kroma Edge';

    const script = this.app.adminController.generateGeminiVideoScript({ name, brand });

    const shotsHtml = script.shotList.map(s => `
      <div class="p-2.5 bg-surface-dim border border-secondary/40 rounded flex flex-col gap-1">
        <div class="flex justify-between items-center text-[10px] text-primary font-bold">
          <span>⏱️ ${s.time}</span>
          <span class="text-amber-300">OVERLAY: ${s.textOverlay}</span>
        </div>
        <div class="text-white text-xs">${s.visual}</div>
      </div>
    `).join('');

    this.currentGeminiOutput = { type: 'video', data: script };
    this.app.currentGeminiOutput = this.currentGeminiOutput;
    this.showGeminiPreviewModal("🎬 Gemini 15-30s Promotional Video Script Blueprint", `
      <div class="space-y-3">
        <div class="p-3 bg-amber-950/30 border border-amber-500/40 rounded space-y-1">
          <div class="text-[10px] text-secondary font-bold uppercase">Viral Voiceover Hook:</div>
          <div class="text-amber-300 font-bold text-sm leading-snug">${script.voiceoverHook}</div>
          <div class="text-[10px] text-secondary mt-1">Visual: ${script.visualHook}</div>
        </div>

        <div>
          <div class="text-[10px] text-secondary font-bold uppercase mb-2">Shot-by-Shot Storyboard:</div>
          <div class="space-y-2">${shotsHtml}</div>
        </div>

        <div class="p-2 bg-surface-dim border border-secondary rounded flex justify-between items-center text-xs">
          <div><strong class="text-secondary">Hashtags:</strong> <span class="text-emerald-400">${script.hashtags.join(' ')}</span></div>
        </div>
      </div>
    `);
  }

  quickGeminiCopy(productId) {
    this.app.openAdminProductModal(productId);
    setTimeout(() => this.triggerGeminiSalesCopy(), 200);
  }

  showGeminiPreviewModal(title, htmlContent) {
    const modal = document.getElementById('modal-admin-gemini-preview');
    const titleEl = document.getElementById('modal-gemini-preview-title');
    const bodyEl = document.getElementById('gemini-preview-content');
    if (!modal || !bodyEl) return;

    if (titleEl) titleEl.innerText = title;
    bodyEl.innerHTML = htmlContent;
    modal.classList.add('active');
  }

  closeGeminiPreviewModal() {
    const modal = document.getElementById('modal-admin-gemini-preview');
    if (modal) modal.classList.remove('active');
  }

  applyGeminiSalesCopy() {
    if (!this.currentGeminiOutput || !this.currentGeminiOutput.data) {
      this.closeGeminiPreviewModal();
      return;
    }

    if (this.currentGeminiOutput.type === 'copy') {
      const descInput = document.getElementById('form-product-description');
      const badgeInput = document.getElementById('form-product-badge');
      if (descInput) descInput.value = this.currentGeminiOutput.data.description;
      if (badgeInput && this.currentGeminiOutput.data.badgeSuggestion) {
        badgeInput.value = this.currentGeminiOutput.data.badgeSuggestion;
      }
      this.app.showToast("✨ Applied Gemini copywriting to product form!", 'success');
    } else if (this.currentGeminiOutput.type === 'video') {
      navigator.clipboard.writeText(JSON.stringify(this.currentGeminiOutput.data, null, 2));
      this.app.showToast("📋 Video storyboard script copied to clipboard!", 'success');
    }

    this.closeGeminiPreviewModal();
  }
}
