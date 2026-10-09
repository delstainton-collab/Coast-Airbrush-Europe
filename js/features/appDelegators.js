// Master Application Delegators & Mixin Registry
// Extracted per Anti-God Monolith Architecture Skill (Orchestrator target <= 400 lines)

export function registerAppDelegators(proto) {
  const delegations = {
    storefrontShowcaseUI: [
      'handleUrlParameters',
      'syncFeaturedShowcaseCards',
      'updateDropdownOptionPrices'
    ],
    euLocalizationUI: [
      ['setupEULocalization', 'setup']
    ],
    navigationTabsUI: [
      'setupTabs',
      'switchTab',
      'navigateToAnchor',
      'navigateToDepartment',
      'setupDepartmentNavigation'
    ],
    forumPreorderUI: [
      ['setupForumAndPreorders', 'setup'],
      'updateReinvestmentDisplay',
      'addPreorderTier',
      'renderForumThreads'
    ],
    storefrontAiAgentsUI: [
      'setupAgentC',
      'renderSocialCampaigns',
      'renderDaiveFormattedMessage',
      'setupAgentA',
      'setupAgentB',
      'renderOrderTracking',
      'openVatInvoiceModal',
      'setupAgentD',
      'renderInventoryDashboard',
      'renderSourcingEvaluation',
      'openPurchaseOrderModal'
    ],
    storefrontFiltersUI: [
      'matchCategory',
      'renderCategoryButtons',
      'renderActiveFilterChips',
      'setCategoryFilter',
      'setBrandFilter',
      'setFlakeSubcat',
      'onSearchInput',
      'setCategoryAndScroll',
      'syncShopifyCatalog',
      'resetAllFilters',
      'renderCategoryDropdown',
      'renderCategoryPills',
      'setupShopFilters'
    ],
    tdsSafetyUI: [
      'getProductReviewData',
      'downloadSDS',
      'getFlakeSpecForSize',
      'openFlakeTDSModal',
      'closeFlakeTDSModal',
      'downloadTDS',
      'downloadSystemTDS',
      'downloadSystemSDS',
      'setupDetailModal'
    ],
    onboardingHeroUI: [
      'setupWelcomeModal',
      'openWelcomeModal',
      'closeWelcomeModal',
      'setupHeroCrossfade',
      'initSocialProofPulse',
      'initReferralModal'
    ],
    productDetailModal: [
      ['openDetailModal', 'open'],
      ['loadDetailVideoPlayer', 'loadVideoPlayer'],
      ['switchDetailVideo', 'switchVideo'],
      ['renderProductSalesCopy', 'renderSalesCopy'],
      'switchCopyTab',
      'renderCopyTabContent',
      ['switchDetailImage', 'switchImage'],
      ['closeDetailModal', 'close']
    ],
    tradePortalModal: [
      ['openTradePortalModal', 'open'],
      ['closeTradePortalModal', 'close'],
      ['switchTradeTab', 'switchTab'],
      ['fillDemoTradeLogin', 'fillDemo'],
      ['handleTradeLogin', 'handleLogin'],
      'fetchB2BPricing',
      ['updateTradeBanner', 'updateBanner'],
      ['handleTradeLogout', 'handleLogout'],
      ['restoreTradeSession', 'restoreSession'],
      ['handleTradeApply', 'handleApply']
    ],
    mixingScaleUI: [
      'renderSystemsDropdown',
      'updateSystemDescription',
      'onSystemChange',
      'setMixVolumePreset',
      'renderColorSwatches',
      'configureKromaEdgeInMixLab',
      'mixThisProduct',
      'updateCalculation',
      'renderRecipeTable',
      'openScaleMode',
      'initScaleAssistant',
      'renderScaleStep',
      'prevScaleStep',
      'nextScaleStep'
    ],
    quickMixModal: [
      'setQuickMixVolumePreset',
      ['setupQuickMixModal', 'setup'],
      'openQuickMixModal',
      'closeQuickMixModal',
      'updateModalCalculation'
    ],
    storefrontGridUI: [
      'calculateDisplayPrice',
      'getProductCalculatedPrice',
      'renderStorefrontGrid',
      'onProductVariantChange',
      'addProductToCartById',
      'addDirectToCart',
      'addKromaEdgeBundleToCart'
    ],
    bundleConfigurator: [
      'getActiveBundle',
      'renderFeaturedBundle',
      'addConfiguredBundleToCart',
      'addFlakeKingMasterBundleToCart',
      'getFlakeTierInfo',
      'openBundleCustomizerModal',
      'recalculateCustomizerPrice',
      'closeBundleCustomizerModal',
      'submitCustomizedBundleToCart',
      'renderAdminBundles',
      'renderAdminBundleSlots',
      'onAdminBundleProductChange',
      'addAdminBundleSlot',
      'removeAdminBundleSlot',
      'saveBundleFromAdmin',
      'resetBundleFromAdmin',
      'renderAdminBundleLivePreview'
    ],
    heroEditorUI: [
      'getActiveHeroConfig',
      'renderStorefrontHero',
      'renderAdminHero',
      'renderAdminHeroSlides',
      'renderAdminHeroJumps',
      'collectHeroDataFromInputs',
      'addAdminHeroSlide',
      'removeAdminHeroSlide',
      'moveAdminHeroSlide',
      'addAdminHeroJump',
      'removeAdminHeroJump',
      'renderAdminHeroLivePreview',
      'saveHeroFromAdmin',
      'resetHeroFromAdmin',
      'triggerHeroSlideUpload',
      'handleHeroImageUpload',
      'openHeroAiCopyModal',
      'closeHeroAiCopyModal',
      'generateHeroCopyOptions',
      'applyHeroCopyOption',
      'quickPolishHeroField'
    ],
    heroCanvasEnhancer: [
      ['openHeroAiEnhancer', 'open'],
      ['closeHeroAiEnhancer', 'close'],
      ['setEnhancerViewMode', 'setViewMode'],
      ['applyAiFinishPreset', 'applyPreset'],
      ['updateEnhancerSliderLabels', 'updateSliderLabels'],
      ['processEnhancedCanvas', 'processCanvas'],
      'saveEnhancedSlideImage'
    ],
    projectEstimator: [
      ['setupProjectEstimator', 'setup'],
      'setEstimatorUnit',
      'setEstimatorMode',
      'applyAutomotivePreset',
      'updateEstimatorCalculation',
      'renderCoatSelector',
      'syncEstimatorToMixTable',
      'setRecipeTab',
      'updateTopcoatCalculation',
      'renderBundleRecommender',
      'addRecommendedBundleToCart',
      'renderApplicationGuide',
      'applyKromaPreset',
      'calcCustomKromaArea',
      'renderEstimatorResults'
    ],
    cartDrawerUI: [
      'renderCartSummary',
      'removeItem',
      'changeItemQuantity',
      'setItemQuantity',
      'addUpsellToCart',
      'checkoutShopify',
      'openTradeAccountModal',
      'closeTradeAccountModal',
      'submitTradeAccountOrder',
      'closeOrderConfirmedModal',
      'showReviewModeModal',
      'closeReviewModeModal',
      ['setupCartDrawer', 'setup'],
      'openCartDrawer',
      'closeCartDrawer'
    ],
    departmentViews: [
      'matchPackToken',
      'matchFlakeSizeToken',
      'formatFlakeDimension',
      'formatFlakePackSize',
      'getFlakeSubcategory',
      'getFlakeBadgeInfo',
      'setDeptFlakeSubcat',
      'toggleDeptFlakeViewMode',
      'renderDeptFlakesGrid',
      'setDeptGunsSubcat',
      'renderDeptGunsGrid',
      'setDeptTapesSubcat',
      'renderDeptTapesGrid',
      'filterAndScrollToVsionCategory'
    ],
    adminAuthUI: [
      ['setupAdminSuite', 'setup'],
      'openAdminAuthModal',
      'closeAdminAuthModal',
      'fillDefaultAdminPin',
      'toggleAdminPinVisibility',
      'handleAdminPinSubmit',
      'renderAdminAll'
    ],
    adminTaxonomyUI: [
      'renderAdminTaxonomy',
      'syncTaxonomyDropdowns',
      'openAdminDepartmentModal',
      'closeAdminDepartmentModal',
      'saveAdminDepartmentFromModal',
      'deleteAdminDepartment',
      'addTaxonomyCategory',
      'removeTaxonomyCategory',
      'filterSpreadsheetByDept'
    ],
    adminProductUI: [
      'getDefaultDepartmentForProduct',
      'getEffectiveProducts',
      'renderAdminProducts',
      'openAdminProductModal',
      'closeAdminProductModal',
      'saveAdminProductFromModal',
      'duplicateAdminProductFromModal',
      'deleteAdminProductPermanentlyFromModal',
      'deleteAdminProductPermanently',
      'resetAdminProductOverridesFromModal',
      'deleteAdminProductFromModal'
    ],
    spreadsheetEditor: [
      ['setupAdminSpreadsheet', 'setup'],
      'getProductPricingSummary',
      'getFilteredSortedSpreadsheetProducts',
      'renderAdminSpreadsheet',
      'wireSpreadsheetRowEvents',
      'onSpreadsheetCellChange',
      'applyBatchPricePercentage',
      'applyBatchCurrencySync',
      'applyBatchRounding',
      'roundPriceTo',
      'applyBatchTaxonomy',
      'applyBatchStock',
      'applyBatchBadge',
      'saveSpreadsheetEdits',
      'discardSpreadsheetEdits',
      'revertSpreadsheetRow',
      'copySpreadsheetProduct',
      'copySelectedSpreadsheetProducts',
      'deleteSpreadsheetProduct',
      'deleteSelectedSpreadsheetProducts',
      'openTrashModal',
      'closeTrashModal',
      'restoreTrashProduct',
      'restoreAllTrashProducts',
      'updateTrashBadgeCount',
      'addSpreadsheetProductRow',
      'exportSpreadsheetCsv',
      'importSpreadsheetCsv',
      'parseCsvString'
    ],
    productMatrixModal: [
      'openProductMatrixModal',
      'closeProductMatrixModal',
      'getNormalizedProductMatrix',
      'renderMatrixModalRows',
      'generateMatrixCombinations',
      'applyMatrixBasePriceToAll',
      'applyMatrixPercentageAdjust',
      'autoGenerateMatrixSkus',
      'addSingleMatrixRow',
      'deleteMatrixRow',
      'saveProductMatrixFromModal',
      'resetProductMatrixToDefaults'
    ],
    geminiModal: [
      'triggerGeminiSalesCopy',
      'triggerGeminiVideoScript',
      'quickGeminiCopy',
      'showGeminiPreviewModal',
      'closeGeminiPreviewModal',
      'applyGeminiSalesCopy'
    ],
    adminFormulasPreorders: [
      'renderAdminFormulas',
      'openAdminFormulaModal',
      'addComponentRowToModal',
      'closeAdminFormulaModal',
      'saveAdminFormulaFromModal',
      'deleteAdminFormula',
      'renderAdminPreorders',
      'saveAdminPreorders'
    ],
    adminHardwareHazmat: [
      'renderAdminPrinter',
      'saveAdminPrinterConfig',
      'downloadAdminTspl',
      'triggerAdminTestPrint',
      'renderAdminHazmat',
      'saveAdminHazmatConfig'
    ],
    adminFxEngineUI: [
      ['setupFxEngineUI', 'setup'],
      'renderFxStatus',
      'openFxUpdateModal',
      'closeFxUpdateModal',
      'renderFxModalImpactTable'
    ],
    adminAiSpecialists: [
      'renderAdminAI',
      'saveAdminAiConfig'
    ],
    marketingEmailHub: [
      ['setupAdminEmailHub', 'setup'],
      ['renderAdminEmailHub', 'render'],
      'populateSingleCustomerDropdown',
      'updateAudienceCountBadge',
      'updateSingleCustomerDetails',
      ['renderEmailMetricsRibbon', 'renderMetricsRibbon'],
      ['updateEmailPreview', 'updatePreview'],
      ['triggerAiEmailGen', 'triggerAiGen'],
      ['handleEmailDispatch', 'handleDispatch'],
      'handleSendTestEmail',
      'handleSaveCurrentTemplate',
      ['renderAdminCampaignAnalytics', 'renderCampaignAnalytics'],
      ['renderAdminDispatchLogs', 'renderDispatchLogs']
    ],
    brandsShowcase: [
      ['getBrandProductCount', 'getProductCount'],
      ['renderBrandsShowcase', 'render'],
      ['openBrandStoryModal', 'openModal'],
      ['closeBrandStoryModal', 'closeModal'],
      'switchBrandModalTab',
      ['shopCurrentModalBrand', 'shopCurrentBrand'],
      'filterByBrandAndScroll',
      ['renderAdminBrands', 'renderAdmin'],
      ['downloadBrandsCatalogJson', 'downloadCatalogJson']
    ]
  };

  for (const [moduleProp, methods] of Object.entries(delegations)) {
    for (const item of methods) {
      const appMethod = Array.isArray(item) ? item[0] : item;
      const targetMethod = Array.isArray(item) ? item[1] : item;
      if (!proto[appMethod]) {
        proto[appMethod] = function(...args) {
          const mod = this[moduleProp];
          if (mod && typeof mod[targetMethod] === 'function') {
            return mod[targetMethod](...args);
          }
          console.warn(`Delegated method ${targetMethod} (for ${appMethod}) not found on ${moduleProp}`);
        };
      }
    }
  }

  // Handle getter/setter property for _targetUploadSlideIndex
  Object.defineProperty(proto, '_targetUploadSlideIndex', {
    get() {
      return this.heroEditorUI ? this.heroEditorUI._targetUploadSlideIndex : null;
    },
    set(val) {
      if (this.heroEditorUI) this.heroEditorUI._targetUploadSlideIndex = val;
    },
    configurable: true,
    enumerable: true
  });
}
