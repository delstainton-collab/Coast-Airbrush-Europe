// Onboarding Welcome Modal, Ambient Social Proof & Hero Crossfade UI Controller
// Extracted per Anti-God Monolith Architecture Skill (Target <= 250 lines)

export class OnboardingHeroUI {
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

  setupWelcomeModal() {
    const modal = document.getElementById('welcome-launch-modal');
    if (!modal) return;

    // Expose globally for manual triggers
    window.openWelcomeModal = (force = false) => this.openWelcomeModal(force);

    // Close button handlers
    this.app.addSafeListener('btn-close-welcome-modal', 'click', () => this.closeWelcomeModal());
    this.app.addSafeListener('btn-welcome-enter-shop', 'click', () => {
      this.closeWelcomeModal();
      this.app.switchTab('tab-storefront', 'view-storefront');
      setTimeout(() => {
        const anchor = document.getElementById('storefront-catalog-anchor');
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    // Backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeWelcomeModal();
    });

    // ESC key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        this.closeWelcomeModal();
      }
    });

    // Checkbox toggle handler
    const chk = document.getElementById('chk-dont-show-welcome');
    if (chk) {
      chk.addEventListener('change', (e) => {
        if (e.target.checked) {
          localStorage.setItem('coast_eu_welcome_dismissed', 'true');
        } else {
          localStorage.removeItem('coast_eu_welcome_dismissed');
        }
      });
    }

    // Note: Auto-display popup disabled to allow instant entry to storefront.
    // Modal remains accessible via window.openWelcomeModal() or About links.
  }

  openWelcomeModal(force = false) {
    const modal = document.getElementById('welcome-launch-modal');
    if (!modal) return;

    const isDismissed = localStorage.getItem('coast_eu_welcome_dismissed') === 'true';
    const chk = document.getElementById('chk-dont-show-welcome');
    if (chk) {
      chk.checked = isDismissed;
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  closeWelcomeModal() {
    const modal = document.getElementById('welcome-launch-modal');
    if (!modal) return;

    const chk = document.getElementById('chk-dont-show-welcome');
    if (chk && chk.checked) {
      localStorage.setItem('coast_eu_welcome_dismissed', 'true');
    }

    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  setupHeroCrossfade() {
    if (window._heroCrossfadeInterval) {
      clearInterval(window._heroCrossfadeInterval);
      window._heroCrossfadeInterval = null;
    }

    const container = document.getElementById('hero-crossfade-container');
    if (!container) return;

    const slides = container.querySelectorAll('.hero-crossfade-slide');
    const dots = document.querySelectorAll('#hero-slide-dots .hero-indicator-dot');
    const captionEl = document.getElementById('hero-caption-text');

    if (!slides || slides.length === 0) return;

    // Dynamically resolve slide background images under Shopify CDN
    slides.forEach((slide) => {
      const bg = slide.style.backgroundImage;
      if (bg) {
        const m = bg.match(/url\(['"]?([^'")]+)['"]?\)/);
        if (m && m[1]) {
          const rawUrl = m[1];
          if (typeof window !== 'undefined' && window.SHOPIFY_ASSET_URL_ROOT && (rawUrl.includes('assets/images/') || rawUrl.includes('Images/'))) {
            slide.style.backgroundImage = `url('${this.getAssetUrl(rawUrl)}')`;
          }
        }
      }
    });

    // Ensure nav logo image is also resolved under Shopify CDN
    const navLogoImg = document.querySelector('#nav-logo-btn img');
    if (navLogoImg && typeof window !== 'undefined' && window.SHOPIFY_ASSET_URL_ROOT) {
      const src = navLogoImg.getAttribute('src');
      if (src && (src.includes('assets/images/') || src.includes('Images/'))) {
        navLogoImg.src = this.getAssetUrl(src);
      }
    }

    let currentSlide = 0;
    const totalSlides = slides.length;

    window.setHeroSlide = (index) => {
      currentSlide = (index + totalSlides) % totalSlides;
      
      // Sync ambient background slides
      slides.forEach((s, idx) => {
        if (idx === currentSlide) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
      });

      // Sync indicator dots
      dots.forEach((d, idx) => {
        if (idx === currentSlide) {
          d.classList.add('active');
        } else {
          d.classList.remove('active');
        }
      });

      // Sync caption text
      if (captionEl && slides[currentSlide]) {
        captionEl.innerHTML = slides[currentSlide].getAttribute('data-caption') || `0${currentSlide + 1}/0${totalSlides}`;
      }

      // Sync artifact badge
      const artifactBadge = document.getElementById('hero-artifact-badge');
      if (artifactBadge && slides[currentSlide]) {
        const badge = slides[currentSlide].getAttribute('data-badge') || 'Standard 2K Clearcoat Applied';
        artifactBadge.textContent = badge;
      }
    };

    window.nextHeroSlide = () => {
      window.setHeroSlide(currentSlide + 1);
    };

    window.prevHeroSlide = () => {
      window.setHeroSlide(currentSlide - 1);
    };

    // Gentle cinematic auto slideshow every 6s with pause on hover
    const heroSection = container.closest('section');
    window._heroCrossfadeInterval = setInterval(() => {
      if (!heroSection || !heroSection.matches(':hover')) {
        window.setHeroSlide(currentSlide + 1);
      }
    }, 6000);
  }

  initSocialProofPulse() {
    const orders = [
      { name: "David M.", location: "Birmingham, UK", flag: "🇬🇧", item: "3x Show Krome Metal Flake Jars (30g)", time: "3m ago" },
      { name: "Stefan K.", location: "Munich, Germany", flag: "🇩🇪", item: "Kroma Edge Mirror Chrome Kit (140g)", time: "6m ago" },
      { name: "Marco B.", location: "Milan, Italy", flag: "🇮🇹", item: "Flake King 550 Mini Dry Gun System", time: "9m ago" },
      { name: "Julien D.", location: "Lyon, France", flag: "🇫🇷", item: "Dedicated Kroma Clearcoat & 3mm Fineline Tape", time: "12m ago" },
      { name: "Bram V.", location: "Amsterdam, Netherlands", flag: "🇳🇱", item: "2x Kromatic Silver Holographic Flakes", time: "16m ago" },
      { name: "Alejandro R.", location: "Barcelona, Spain", flag: "🇪🇸", item: "Flake King Pro Series Multi-Gun Kit", time: "21m ago" },
      { name: "Gareth P.", location: "Cardiff, UK", flag: "🇬🇧", item: "Show Krome .008 Micro Flake (100g Trade Jar)", time: "27m ago" },
      { name: "Lukas W.", location: "Vienna, Austria", flag: "🇦🇹", item: "Kroma Edge Batch 1 Mirror Chrome System", time: "34m ago" }
    ];

    let currentIndex = 0;
    const toast = document.getElementById('social-proof-toast');
    if (!toast) return;

    const showNext = () => {
      const ord = orders[currentIndex];
      currentIndex = (currentIndex + 1) % orders.length;

      const flagEl = document.getElementById('social-proof-flag');
      const nameEl = document.getElementById('social-proof-name');
      const itemEl = document.getElementById('social-proof-item');
      const timeEl = document.getElementById('social-proof-time');

      if (flagEl) flagEl.textContent = ord.flag;
      if (nameEl) nameEl.textContent = `${ord.name} (${ord.location})`;
      if (itemEl) itemEl.textContent = ord.item;
      if (timeEl) timeEl.textContent = ord.time;

      toast.classList.add('visible');

      setTimeout(() => {
        toast.classList.remove('visible');
      }, 5000);
    };

    // First appearance after 5s, then cycle every 18s
    setTimeout(() => {
      showNext();
      setInterval(showNext, 18000);
    }, 5000);
  }

  initReferralModal() {
    window.openReferralModal = () => {
      const m = document.getElementById('modal-referral');
      if (m) m.classList.add('active');
    };
    window.closeReferralModal = () => {
      const m = document.getElementById('modal-referral');
      if (m) m.classList.remove('active');
    };
    window.copyReferralLink = () => {
      const input = document.getElementById('input-referral-link');
      if (input) {
        input.select();
        navigator.clipboard.writeText(input.value).then(() => {
          const btnLabel = document.getElementById('btn-copy-referral-label');
          if (btnLabel) btnLabel.textContent = 'COPIED!';
          this.app.showToast('✅ Referral link copied! Share with fellow painters.', 'success');
          setTimeout(() => {
            if (btnLabel) btnLabel.textContent = 'COPY';
          }, 2500);
        }).catch(() => {
          this.app.showToast('Link ready to share: ' + input.value, 'info');
        });
      }
    };
    window.shareReferralWhatsApp = () => {
      const msg = encodeURIComponent("Hey! Check out Coast Airbrush Europe for Kroma Edge Mirror Chrome & Flake King gear. Grab £15 off your first order over £125: https://coastairbrush.com/?ref=CREW-PAINTER");
      window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
    };
    window.shareReferralFacebook = () => {
      const url = encodeURIComponent("https://coastairbrush.com/?ref=CREW-PAINTER");
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    };
    window.shareReferralTwitter = () => {
      const text = encodeURIComponent("Check out Coast Airbrush Europe for Kroma Edge Mirror Chrome & Flake King dry guns. Get £15 off orders £125+:");
      const url = encodeURIComponent("https://coastairbrush.com/?ref=CREW-PAINTER");
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    };
    window.shareReferralEmail = () => {
      const subject = encodeURIComponent("Coast Airbrush Europe VIP Invite (£15 Off)");
      const body = encodeURIComponent("Hey,\n\nI thought you'd want to check out Coast Airbrush Europe for official Kroma Edge Mirror Chrome and Flake King dry flake guns.\n\nYou can get £15 off your first order over £125 with this link:\nhttps://coastairbrush.com/?ref=CREW-PAINTER\n\nCheers!");
      window.open(`mailto:?subject=${subject}&body=${body}`);
    };
  }
}
