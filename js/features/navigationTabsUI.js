// Master Navigation, Tabs & Department Anchor Routing Controller
// Extracted per Anti-God Monolith Architecture Skill (Target <= 250 lines)

export class NavigationTabsUI {
  constructor(appRef) {
    this.app = appRef;
  }

  setupTabs() {
    const tabMappings = [
      { id: 'tab-storefront', viewId: 'view-storefront' },
      { id: 'tab-academy', viewId: 'view-academy' },
      { id: 'tab-forum', viewId: 'view-forum' },
      { id: 'tab-agent-a', viewId: 'view-agent-a' },
      { id: 'tab-agent-b', viewId: 'view-agent-b' },
      { id: 'tab-agent-c', viewId: 'view-agent-c' },
      { id: 'tab-agent-d', viewId: 'view-agent-d' },
      { id: 'tab-calculator', viewId: 'view-calculator' },
      { id: 'tab-scale', viewId: 'view-scale' },
      { id: 'tab-admin', viewId: 'view-admin' }
    ];

    tabMappings.forEach(tab => {
      const btn = document.getElementById(tab.id);
      if (btn) {
        btn.addEventListener('click', () => {
          if (tab.id === 'tab-admin' && !this.app.adminController.isAuthenticated) {
            this.app.openAdminAuthModal();
            return;
          }
          this.switchTab(tab.id, tab.viewId);
        });
      }
    });

    const mobileAdminBtn = document.getElementById('tab-admin-mobile');
    if (mobileAdminBtn) {
      mobileAdminBtn.addEventListener('click', () => {
        if (!this.app.adminController.isAuthenticated) {
          this.app.openAdminAuthModal();
          return;
        }
        this.switchTab('tab-admin', 'view-admin');
      });
    }

    // Floating AI Trigger Button
    this.app.addSafeListener('btn-floating-agent-a', 'click', () => {
      this.switchTab('tab-agent-a', 'view-agent-a');
    });

    // Global Department and Section Anchor Navigation Handler
    this.setupDepartmentNavigation();
  }

  switchTab(activeTabId, activeViewId, scrollToTop = true) {
    const tabIds = ['tab-storefront', 'tab-academy', 'tab-forum', 'tab-agent-a', 'tab-agent-b', 'tab-agent-c', 'tab-agent-d', 'tab-calculator', 'tab-scale', 'tab-admin'];
    const viewIds = ['view-storefront', 'view-academy', 'view-forum', 'view-agent-a', 'view-agent-b', 'view-agent-c', 'view-agent-d', 'view-calculator', 'view-scale', 'view-admin'];

    tabIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (id === activeTabId) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }
    });

    const mobileAdminBtn = document.getElementById('tab-admin-mobile');
    if (mobileAdminBtn) {
      if (activeTabId === 'tab-admin' || activeViewId === 'view-admin') {
        mobileAdminBtn.classList.add('active', 'border-amber-400', 'bg-amber-500/20');
      } else {
        mobileAdminBtn.classList.remove('active', 'border-amber-400', 'bg-amber-500/20');
      }
    }

    // Step 1: Hide all inactive views first so page reflow does not cancel scroll animations
    viewIds.forEach(id => {
      const el = document.getElementById(id);
      if (el && id !== activeViewId) {
        el.style.display = 'none';
      }
    });

    // Step 2: Show the active view
    const activeEl = document.getElementById(activeViewId);
    if (activeEl) {
      activeEl.style.display = 'flex';
    }

    // Step 3: Cleanly reset scroll position to top if requested
    if (scrollToTop) {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }

    if (activeViewId === 'view-calculator') {
      this.app.updateCalculation();
      if (typeof this.app.updateEstimatorCalculation === 'function') {
        this.app.updateEstimatorCalculation();
      }
    }
    if (activeViewId === 'view-scale') {
      this.app.initScaleAssistant();
    }
    if (activeViewId === 'view-agent-b') {
      this.app.renderOrderTracking(this.app.selectedTrackingOrder);
    }
    if (activeViewId === 'view-agent-c') {
      this.app.renderSocialCampaigns();
    }
    if (activeViewId === 'view-agent-d') {
      this.app.renderInventoryDashboard();
    }
    if (activeViewId === 'view-forum') {
      this.app.renderForumThreads();
    }
    if (activeViewId === 'view-admin') {
      this.app.renderAdminAll();
    }
  }

  navigateToAnchor(targetHash) {
    if (!targetHash) return;
    const cleanId = targetHash.replace(/^#/, '');
    if (!cleanId) return;

    const targetEl = document.getElementById(cleanId);
    if (!targetEl) return;

    // Check which view contains this element and switch to it if hidden
    const containingView = targetEl.closest('.tab-view');
    if (containingView && containingView.id) {
      const activeTabMap = {
        'view-storefront': 'tab-storefront',
        'view-academy': 'tab-academy',
        'view-forum': 'tab-forum',
        'view-calculator': 'tab-calculator',
        'view-scale': 'tab-scale',
        'view-admin': 'tab-admin'
      };
      const matchingTabId = activeTabMap[containingView.id] || 'tab-storefront';
      if (containingView.style.display === 'none') {
        this.switchTab(matchingTabId, containingView.id, false);
      }
    }

    // Smoothly scroll down to the target with sticky header offset
    requestAnimationFrame(() => {
      setTimeout(() => {
        const headerOffset = 85;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth'
        });
      }, 25);
    });
  }

  navigateToDepartment(deptId) {
    this.navigateToAnchor(deptId);
  }

  setupDepartmentNavigation() {
    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && href.length > 1 && !href.startsWith('#!') && href !== '#') {
          const targetEl = document.getElementById(href.substring(1));
          if (targetEl) {
            e.preventDefault();
            this.navigateToAnchor(href);
          }
        }
      }
    });

    window.navigateToDepartment = (deptId) => this.navigateToDepartment(deptId);
  }
}
