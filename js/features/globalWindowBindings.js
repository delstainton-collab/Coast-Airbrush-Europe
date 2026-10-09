// Global Window Action Bindings Helper
// Extracted per Anti-God Monolith Architecture Skill (Target <= 250 lines)

import { BRANDS_MASTER } from '../../data/brands_master.js';

export function bindGlobalWindowActions(app) {
  window.paintApp = app;
  window.app = app;
  app.cartManager = app.shopifyCartManager;
  app.showCartDrawer = () => app.openCartDrawer();
  app.removeKromaEdgeFromCart = () => app.cartDrawerUI ? app.cartDrawerUI.removeKromaEdgeFromCart() : null;
  app.submitKromaWaitlistFromCart = (form, code, name) => app.cartDrawerUI ? app.cartDrawerUI.submitKromaWaitlistFromCart(form, code, name) : null;
  app.submitKromaWaitlistFromPdp = async (form, code, name) => {
    const input = form.querySelector('input[type="email"]');
    const email = input ? input.value : '';
    if (!email) return;
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.textContent = 'Saving...';
    const { registerKromaEuWaitlist } = await import('./kromaEuWaitlist.js');
    const res = await registerKromaEuWaitlist(email, code, name);
    app.showToast(res.message, res.success ? "success" : "warning", 6000);
    if (res.success) {
      form.innerHTML = `<span class="text-emerald-400 font-bold text-[11px] flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">check_circle</span> You're registered on the European priority dispatch list for ${name}!</span>`;
    }
  };
  window.changeCartItemQuantity = (idx, delta) => app.changeItemQuantity(idx, delta);
  window.removeCartItem = (idx) => app.removeItem(idx);
  window.addUpsellToCart = (upsellId) => app.addUpsellToCart(upsellId);
  window.addKromaEdgeToCart = (prodId) => app.addProductToCartById(prodId);
  window.addKromaEdgeBundleToCart = () => app.addKromaEdgeBundleToCart();
  window.addFlakeKingMasterBundleToCart = () => app.addFlakeKingMasterBundleToCart();
  window.configureKromaEdgeInMixLab = () => app.configureKromaEdgeInMixLab();
  window.openDetailModal = (prodId, tab) => app.openDetailModal(prodId, tab);
  window.openQuickMixModal = (systemId) => app.openQuickMixModal(systemId);
  window.openFlakeTDSModal = () => app.openFlakeTDSModal();
  window.closeFlakeTDSModal = () => app.closeFlakeTDSModal();
  window.setCategoryAndScroll = (catId) => app.setCategoryAndScroll(catId);
  window.applyKromaPreset = (panelId) => app.applyKromaPreset(panelId);
  window.calcCustomKromaArea = (val) => app.calcCustomKromaArea(val);
  window.applyEstimatedVolumeToMix = () => app.applyEstimatedVolumeToMix();
  window.setMixVolumePreset = (vol, unit) => app.setMixVolumePreset(vol, unit);
  window.setQuickMixVolumePreset = (vol, unit) => app.setQuickMixVolumePreset(vol, unit);
  window.switchDetailImage = (imgSrc, btn) => app.switchDetailImage(imgSrc, btn);
  window.switchDetailVideo = (videoIndex) => app.switchDetailVideo(videoIndex);
  window.switchCopyTab = (tab) => app.switchCopyTab(tab);
  window.openScaleMode = () => app.openScaleMode();
  window.openAdminLogin = () => app.openAdminAuthModal();
  window.fillDefaultAdminPin = () => app.fillDefaultAdminPin();
  window.toggleAdminPinVisibility = () => app.toggleAdminPinVisibility();
  window.openTradePortalModal = () => app.openTradePortalModal();
  window.closeTradePortalModal = () => app.closeTradePortalModal();
  window.switchTradeTab = (tab) => app.switchTradeTab(tab);
  window.handleTradeLogin = () => app.handleTradeLogin();
  window.handleTradeLogout = () => app.handleTradeLogout();
  window.fillDemoTradeLogin = (type) => app.fillDemoTradeLogin(type);
  window.handleTradeApply = () => app.handleTradeApply();
  window.addConfiguredBundleToCart = (bundleId) => app.addConfiguredBundleToCart(bundleId);
  window.openBundleCustomizerModal = (bundleId) => app.openBundleCustomizerModal(bundleId);
  window.closeBundleCustomizerModal = () => app.closeBundleCustomizerModal();
  window.submitCustomizedBundleToCart = () => app.submitCustomizedBundleToCart();
  window.recalculateCustomizerPrice = () => app.recalculateCustomizerPrice();
  window.saveBundleFromAdmin = () => app.saveBundleFromAdmin();
  window.resetBundleFromAdmin = () => app.resetBundleFromAdmin();
  window.addAdminBundleSlot = () => app.addAdminBundleSlot();
  window.removeAdminBundleSlot = (slotId) => app.removeAdminBundleSlot(slotId);
  window.saveHeroFromAdmin = () => app.saveHeroFromAdmin();
  window.resetHeroFromAdmin = () => app.resetHeroFromAdmin();
  window.addAdminHeroSlide = () => app.addAdminHeroSlide();
  window.removeAdminHeroSlide = (idx) => app.removeAdminHeroSlide(idx);
  window.moveAdminHeroSlide = (idx, dir) => app.moveAdminHeroSlide(idx, dir);
  window.addAdminHeroJump = () => app.addAdminHeroJump();
  window.removeAdminHeroJump = (idx) => app.removeAdminHeroJump(idx);
  window.triggerHeroSlideUpload = (idx) => app.triggerHeroSlideUpload(idx);
  window.openHeroAiEnhancer = (idx) => app.openHeroAiEnhancer(idx);
  window.closeHeroAiEnhancer = () => app.closeHeroAiEnhancer();
  window.applyAiFinishPreset = (preset) => app.applyAiFinishPreset(preset);
  window.saveEnhancedSlideImage = () => app.saveEnhancedSlideImage();
  window.openHeroAiCopyModal = () => app.openHeroAiCopyModal();
  window.closeHeroAiCopyModal = () => app.closeHeroAiCopyModal();
  window.generateHeroCopyOptions = () => app.generateHeroCopyOptions();
  window.applyHeroCopyOption = (tone, idx) => app.applyHeroCopyOption(tone, idx);
  window.quickPolishHeroField = (field) => app.quickPolishHeroField(field);
  window.setDeptFlakeSubcat = (subcat, viewAll) => app.setDeptFlakeSubcat(subcat, viewAll);
  window.toggleDeptFlakeViewMode = () => app.toggleDeptFlakeViewMode();
  window.setDeptGunsSubcat = (subcat, viewAll) => app.setDeptGunsSubcat(subcat, viewAll);
  window.setDeptTapesSubcat = (subcat, viewAll) => app.setDeptTapesSubcat(subcat, viewAll);
  window.filterAndScrollToVsionCategory = (cat) => app.filterAndScrollToVsionCategory(cat);
  window.sendPromptToDave = (text) => {
    const input = document.getElementById('input-floating-dave');
    const btn = document.getElementById('btn-floating-dave-send');
    if (input && btn) {
      input.value = text;
      btn.click();
    }
  };

  // Brand Showcase & Vendor Master Global Bindings
  window.BRANDS_MASTER = BRANDS_MASTER;
  window.openBrandStoryModal = (brandId) => app.openBrandStoryModal(brandId);
  window.closeBrandStoryModal = () => app.closeBrandStoryModal();
  window.switchBrandModalTab = (tab) => app.switchBrandModalTab(tab);
  window.shopCurrentModalBrand = () => app.shopCurrentModalBrand();
  window.filterByBrandAndScroll = (brandName) => app.filterByBrandAndScroll(brandName);
  window.downloadBrandsCatalogJson = () => app.downloadBrandsCatalogJson();
}
