// Hero AI Specular Finish & Optical Canvas Enhancer
// Extracted per Anti-God Monolith Architecture Skill (Laws 2 & 4)

export class HeroCanvasEnhancer {
  constructor(appRef) {
    this.app = appRef;
    this._enhancingSlideIndex = null;
    this._enhancerViewMode = 'split';
    this._activePreset = 'chrome_specular';
    this._originalImg = null;
  }

  open(slideIndex) {
    const config = this.app.getActiveHeroConfig();
    const slide = config.slides && config.slides[slideIndex];
    if (!slide) return;

    this._enhancingSlideIndex = Number(slideIndex);
    this._enhancerViewMode = 'split';
    this._activePreset = 'chrome_specular';

    const modal = document.getElementById('modal-admin-hero-ai-enhancer');
    if (!modal) return;

    modal.classList.add('active');
    modal.classList.add('flex');

    this.setViewMode('split');
    this.applyPreset('chrome_specular');

    const getAssetUrl = typeof window !== 'undefined' && window.getAssetUrl ? window.getAssetUrl : (p => p);
    const rawSrc = getAssetUrl(slide.image);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      this._originalImg = img;
      const resBadge = document.getElementById('enhance-resolution-badge');
      if (resBadge) {
        resBadge.textContent = `Dimensions: ${img.naturalWidth} × ${img.naturalHeight} • Canvas RGBA`;
      }
      this.processCanvas();
    };
    img.onerror = () => {
      img.src = 'assets/images/kroma-skull-mirror.jpg';
    };
    img.src = rawSrc;
  }

  close() {
    const modal = document.getElementById('modal-admin-hero-ai-enhancer');
    if (modal) {
      modal.classList.remove('active');
      modal.classList.remove('flex');
    }
  }

  setViewMode(mode) {
    this._enhancerViewMode = mode;
    const halfOriginal = document.getElementById('enhance-half-original');
    const halfEnhanced = document.getElementById('enhance-half-enhanced');

    const btnSplit = document.getElementById('btn-enhance-view-split');
    const btnEnh = document.getElementById('btn-enhance-view-enhanced');
    const btnOrig = document.getElementById('btn-enhance-view-original');

    [btnSplit, btnEnh, btnOrig].forEach(b => {
      if (b) {
        b.classList.remove('bg-primary', 'text-white', 'font-bold');
        b.classList.add('text-secondary');
      }
    });

    if (mode === 'split') {
      if (btnSplit) {
        btnSplit.classList.add('bg-primary', 'text-white', 'font-bold');
        btnSplit.classList.remove('text-secondary');
      }
      if (halfOriginal) halfOriginal.style.display = 'flex';
      if (halfEnhanced) halfEnhanced.style.display = 'flex';
      if (halfOriginal) halfOriginal.style.width = '50%';
      if (halfEnhanced) halfEnhanced.style.width = '50%';
    } else if (mode === 'enhanced') {
      if (btnEnh) {
        btnEnh.classList.add('bg-primary', 'text-white', 'font-bold');
        btnEnh.classList.remove('text-secondary');
      }
      if (halfOriginal) halfOriginal.style.display = 'none';
      if (halfEnhanced) halfEnhanced.style.display = 'flex';
      if (halfEnhanced) halfEnhanced.style.width = '100%';
    } else if (mode === 'original') {
      if (btnOrig) {
        btnOrig.classList.add('bg-primary', 'text-white', 'font-bold');
        btnOrig.classList.remove('text-secondary');
      }
      if (halfOriginal) halfOriginal.style.display = 'flex';
      if (halfEnhanced) halfEnhanced.style.display = 'none';
      if (halfOriginal) halfOriginal.style.width = '100%';
    }

    this.processCanvas();
  }

  applyPreset(preset) {
    this._activePreset = preset;
    const presets = {
      chrome_specular: { specular: 65, contrast: 55, chroma: 25, sharpness: 45, bloom: 20 },
      kroma_prism: { specular: 55, contrast: 40, chroma: 75, sharpness: 35, bloom: 45 },
      candy_flake: { specular: 50, contrast: 45, chroma: 90, sharpness: 50, bloom: 25 },
      wet_clearcoat: { specular: 45, contrast: 50, chroma: 40, sharpness: 30, bloom: 65 },
      garage_contrast: { specular: 60, contrast: 80, chroma: 15, sharpness: 60, bloom: 10 },
      reset: { specular: 40, contrast: 30, chroma: 35, sharpness: 25, bloom: 20 }
    };

    const cfg = presets[preset] || presets.chrome_specular;
    const setSlider = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };

    setSlider('slider-finish-specular', cfg.specular);
    setSlider('slider-finish-contrast', cfg.contrast);
    setSlider('slider-finish-chroma', cfg.chroma);
    setSlider('slider-finish-sharpness', cfg.sharpness);
    setSlider('slider-finish-bloom', cfg.bloom);

    this.updateSliderLabels();
    this.processCanvas();
  }

  updateSliderLabels() {
    const update = (sliderId, labelId) => {
      const s = document.getElementById(sliderId);
      const l = document.getElementById(labelId);
      if (s && l) l.textContent = `${s.value}%`;
    };
    update('slider-finish-specular', 'label-val-specular');
    update('slider-finish-contrast', 'label-val-contrast');
    update('slider-finish-chroma', 'label-val-chroma');
    update('slider-finish-sharpness', 'label-val-sharpness');
    update('slider-finish-bloom', 'label-val-bloom');
  }

  processCanvas() {
    if (!this._originalImg) return;

    const canvasOrig = document.getElementById('canvas-hero-original-preview');
    const canvasEnh = document.getElementById('canvas-hero-enhance-preview');
    if (!canvasOrig || !canvasEnh) return;

    const getVal = (id, def) => {
      const el = document.getElementById(id);
      return el ? Number(el.value) : def;
    };

    const specular = getVal('slider-finish-specular', 40);
    const contrast = getVal('slider-finish-contrast', 30);
    const chroma = getVal('slider-finish-chroma', 35);
    const bloom = getVal('slider-finish-bloom', 20);

    const maxW = 800;
    const naturalW = this._originalImg.naturalWidth || 800;
    const naturalH = this._originalImg.naturalHeight || 600;
    const w = Math.min(maxW, naturalW);
    const h = Math.round(w * (naturalH / naturalW));

    canvasOrig.width = w;
    canvasOrig.height = h;
    const ctxOrig = canvasOrig.getContext('2d');
    ctxOrig.clearRect(0, 0, w, h);
    ctxOrig.drawImage(this._originalImg, 0, 0, w, h);

    canvasEnh.width = w;
    canvasEnh.height = h;
    const ctxEnh = canvasEnh.getContext('2d');
    ctxEnh.clearRect(0, 0, w, h);

    const contrastFactor = 1.0 + (contrast / 100) * 0.75;
    const brightnessFactor = 1.0 + (specular / 100) * 0.35;
    const saturateFactor = 1.0 + (chroma / 100) * 1.1;

    ctxEnh.filter = `contrast(${contrastFactor}) brightness(${brightnessFactor}) saturate(${saturateFactor})`;
    ctxEnh.drawImage(this._originalImg, 0, 0, w, h);

    if (bloom > 0) {
      ctxEnh.save();
      ctxEnh.globalCompositeOperation = 'screen';
      const blurRadius = Math.max(2, Math.round(bloom * 0.12));
      ctxEnh.filter = `brightness(1.4) contrast(1.8) blur(${blurRadius}px)`;
      ctxEnh.globalAlpha = (bloom / 100) * 0.45;
      ctxEnh.drawImage(this._originalImg, 0, 0, w, h);
      ctxEnh.restore();
    }

    if (this._activePreset === 'kroma_prism') {
      ctxEnh.save();
      ctxEnh.globalCompositeOperation = 'color-dodge';
      ctxEnh.globalAlpha = 0.22;
      const grad = ctxEnh.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, 'rgba(255, 0, 128, 0.5)');
      grad.addColorStop(0.33, 'rgba(0, 255, 255, 0.5)');
      grad.addColorStop(0.66, 'rgba(255, 255, 0, 0.5)');
      grad.addColorStop(1, 'rgba(0, 255, 128, 0.5)');
      ctxEnh.fillStyle = grad;
      ctxEnh.fillRect(0, 0, w, h);
      ctxEnh.restore();
    }

    if (this._activePreset === 'candy_flake') {
      ctxEnh.save();
      ctxEnh.globalCompositeOperation = 'lighter';
      ctxEnh.filter = `contrast(2.5) brightness(1.2)`;
      ctxEnh.globalAlpha = 0.18;
      ctxEnh.drawImage(this._originalImg, 0, 0, w, h);
      ctxEnh.restore();
    }

    ctxEnh.filter = 'none';
  }

  saveEnhancedSlideImage() {
    if (this._enhancingSlideIndex === null || this._enhancingSlideIndex === undefined || !this._originalImg) {
      this.close();
      return;
    }

    const maxDim = 1920;
    let w = this._originalImg.naturalWidth || 1920;
    let h = this._originalImg.naturalHeight || 1080;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }

    const procCanvas = document.createElement('canvas');
    procCanvas.width = w;
    procCanvas.height = h;
    const ctx = procCanvas.getContext('2d');

    const getVal = (id, def) => {
      const el = document.getElementById(id);
      return el ? Number(el.value) : def;
    };

    const specular = getVal('slider-finish-specular', 40);
    const contrast = getVal('slider-finish-contrast', 30);
    const chroma = getVal('slider-finish-chroma', 35);
    const bloom = getVal('slider-finish-bloom', 20);

    const contrastFactor = 1.0 + (contrast / 100) * 0.75;
    const brightnessFactor = 1.0 + (specular / 100) * 0.35;
    const saturateFactor = 1.0 + (chroma / 100) * 1.1;

    ctx.filter = `contrast(${contrastFactor}) brightness(${brightnessFactor}) saturate(${saturateFactor})`;
    ctx.drawImage(this._originalImg, 0, 0, w, h);

    if (bloom > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const blurRadius = Math.max(3, Math.round(bloom * 0.18));
      ctx.filter = `brightness(1.4) contrast(1.8) blur(${blurRadius}px)`;
      ctx.globalAlpha = (bloom / 100) * 0.45;
      ctx.drawImage(this._originalImg, 0, 0, w, h);
      ctx.restore();
    }

    if (this._activePreset === 'kroma_prism') {
      ctx.save();
      ctx.globalCompositeOperation = 'color-dodge';
      ctx.globalAlpha = 0.22;
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, 'rgba(255, 0, 128, 0.5)');
      grad.addColorStop(0.33, 'rgba(0, 255, 255, 0.5)');
      grad.addColorStop(0.66, 'rgba(255, 255, 0, 0.5)');
      grad.addColorStop(1, 'rgba(0, 255, 128, 0.5)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    if (this._activePreset === 'candy_flake') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.filter = `contrast(2.5) brightness(1.2)`;
      ctx.globalAlpha = 0.18;
      ctx.drawImage(this._originalImg, 0, 0, w, h);
      ctx.restore();
    }

    const enhancedDataUrl = procCanvas.toDataURL('image/jpeg', 0.90);
    const data = this.app.collectHeroDataFromInputs();

    if (data.slides && data.slides[this._enhancingSlideIndex]) {
      data.slides[this._enhancingSlideIndex].image = enhancedDataUrl;
      this.app.adminController.config.hero = data;
      this.app.renderAdminHeroSlides(data);
      this.app.renderAdminHeroLivePreview();
      this.close();
      this.app.showToast(`✨ AI Specular Finish saved to Slide #${this._enhancingSlideIndex + 1}!`, "success");
    }
  }
}
