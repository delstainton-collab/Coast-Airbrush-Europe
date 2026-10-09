/**
 * Coast Airbrush Europe — Enterprise CRM Engine (js/crm.js)
 * Master Controller & Module Orchestrator
 * Decomposed per Anti-God Monolith Architecture Skill (target <= 250 lines)
 */

import {
  initClientSelector,
  loadClientData,
  renderSkuTable,
  initGlobalSearch,
  updateTierVal,
  calculateMargin,
  addNewSkuRow,
  syncPricingToShopify
} from './crm/crmPricing.js';

import {
  showToast,
  openModal,
  closeModal,
  openEmailModal,
  openCallModal,
  sendFullEmail,
  sendEmail,
  sendQuickReply,
  saveCallLog,
  launchInstantMeet,
  endMeeting,
  copyMeetLink,
  appendTimelineItem,
  geminiGenerateEmail,
  geminiTranslateEmail,
  geminiQuickDraft
} from './crm/crmCommunications.js';

import {
  apcEngine,
  initApcSeedData,
  renderApcConsignmentsTable,
  handleCreateApcConsignment,
  printApcConsignmentA4,
  handleApcCloseManifest
} from './crm/crmApcLogistics.js';

import {
  loadTradeApplications,
  renderTradeApplications,
  approveTradePartner,
  rejectTradePartner,
  resetDemoTradeApplicant,
  escapeCrmText,
  fetchAndRenderLaunchVips
} from './crm/crmTradeApplications.js';

// View Navigation Switcher
export function initNavigation() {
  const tabs = document.querySelectorAll(".crm-nav-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetView = tab.getAttribute("data-view");
      switchCrmView(targetView);
    });
  });
}

export function switchCrmView(viewName) {
  // Update nav tabs
  document.querySelectorAll(".crm-nav-tab").forEach(t => {
    if (t.getAttribute("data-view") === viewName) {
      t.classList.add("active");
    } else {
      t.classList.remove("active");
    }
  });

  // Switch panels
  document.querySelectorAll(".crm-view-panel").forEach(panel => {
    panel.classList.remove("active");
  });

  const activePanel = document.getElementById(`view-${viewName}`);
  if (activePanel) {
    activePanel.classList.add("active");
  }

  if (viewName === 'apc') {
    renderApcConsignmentsTable();
  }
  if (viewName === 'launch-vips') {
    fetchAndRenderLaunchVips();
  }
}

// Global Window Bindings for Inline HTML Event Listeners
window.switchCrmView = switchCrmView;
window.openEmailModal = openEmailModal;
window.openCallModal = openCallModal;
window.closeModal = closeModal;
window.sendEmail = sendEmail;
window.sendFullEmail = sendFullEmail;
window.sendQuickReply = sendQuickReply;
window.saveCallLog = saveCallLog;
window.launchInstantMeet = launchInstantMeet;
window.endMeeting = endMeeting;
window.copyMeetLink = copyMeetLink;
window.geminiGenerateEmail = geminiGenerateEmail;
window.geminiTranslateEmail = geminiTranslateEmail;
window.geminiQuickDraft = geminiQuickDraft;
window.showToast = showToast;
window.calculateMargin = calculateMargin;
window.updateTierVal = updateTierVal;
window.addNewSkuRow = addNewSkuRow;
window.syncPricingToShopify = syncPricingToShopify;
window.handleCreateApcConsignment = handleCreateApcConsignment;
window.handleApcCloseManifest = handleApcCloseManifest;
window.printApcConsignmentA4 = printApcConsignmentA4;
window.renderApcConsignmentsTable = renderApcConsignmentsTable;
window.loadTradeApplications = loadTradeApplications;
window.approveTradePartner = approveTradePartner;
window.rejectTradePartner = rejectTradePartner;
window.resetDemoTradeApplicant = resetDemoTradeApplicant;
window.fetchAndRenderLaunchVips = fetchAndRenderLaunchVips;

// DOM Initialization
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initClientSelector();
  initGlobalSearch();
  initApcSeedData();
  loadTradeApplications();
});
