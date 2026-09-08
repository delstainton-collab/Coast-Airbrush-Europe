/**
 * COAST AIRBRUSH EUROPE - BUNDLE CONFIGURATION ENGINE
 * Enables the business owner to define, configure, and customize bundle contents,
 * pricing, and product slots across the storefront and admin consoles.
 */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'coast_store_bundles_v2';

  const DEFAULT_BUNDLES = [
    {
      id: 'fk-pro-mastery-bundle',
      title: 'THE FLAKE KING™ PRO MASTERY BUNDLE',
      badge: '🔥 COMPLETE IN-STOCK BUNDLE',
      tagline: 'Physical UK Inventory • Dispatched APC Overnight',
      description: 'Everything needed to shoot dry metal flake with zero clear coat contamination. Saves 50% material waste with professional micro-edge tape lines.',
      priceGbp: 109.95,
      priceEur: 129.95,
      retailValueGbp: 120.43,
      retailValueEur: 140.89,
      savingsGbp: 10.48,
      savingsEur: 10.94,
      image: 'https://i0.wp.com/www.flakeking.com/wp-content/uploads/2020/06/ProSeriesKit2.jpg?fit=600%2C600&ssl=1',
      items: [
        {
          id: 'slot-1',
          productId: 'fk-1970',
          sku: 'FOM550',
          name: 'Flake King 550 Mini Dry Metal Flake Gun',
          variant: 'Standard Airbrush Fitting',
          qty: 1,
          priceGbp: 95.99,
          priceEur: 112.95,
          category: 'Dry Metal Flake Guns',
          allowCustomerSwap: false
        },
        {
          id: 'slot-2',
          productId: 'fk-2524',
          sku: 'FK-FLAKE-HOLO-SILVER',
          name: '0.015 Kromatic Silver Holo (Gun-Mount Jar)',
          variant: '30g Jar (Direct Gun Mount)',
          qty: 1,
          priceGbp: 9.01,
          priceEur: 10.95,
          category: 'Dry Metal Flake (Glitter)',
          allowCustomerSwap: true
        },
        {
          id: 'slot-3',
          productId: 'fk-tape-orange',
          sku: 'FK-TAPE-ORANGE-3MM',
          name: 'Orange Fine Line Masking Tape',
          variant: '3mm Precision Width x 55m',
          qty: 1,
          priceGbp: 4.95,
          priceEur: 6.05,
          category: 'Masking Products',
          allowCustomerSwap: true
        }
      ]
    }
  ];

  class BundleConfigEngine {
    constructor() {
      this.listeners = [];
      this.loadBundles();
    }

    loadBundles() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.bundles = JSON.parse(stored);
        } else {
          this.bundles = JSON.parse(JSON.stringify(DEFAULT_BUNDLES));
        }
      } catch (err) {
        console.warn('Could not load stored bundles, using defaults:', err);
        this.bundles = JSON.parse(JSON.stringify(DEFAULT_BUNDLES));
      }
    }

    getBundles() {
      return this.bundles;
    }

    getBundleById(id) {
      return this.bundles.find(b => b.id === id) || this.bundles[0];
    }

    saveBundle(bundleData) {
      const idx = this.bundles.findIndex(b => b.id === bundleData.id);
      if (idx >= 0) {
        this.bundles[idx] = bundleData;
      } else {
        this.bundles.push(bundleData);
      }
      this.persist();
      this.notify();
      return true;
    }

    resetDefaults() {
      this.bundles = JSON.parse(JSON.stringify(DEFAULT_BUNDLES));
      this.persist();
      this.notify();
    }

    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.bundles));
      } catch (e) {
        console.error('Failed to save bundles to localStorage', e);
      }
    }

    onChange(cb) {
      if (typeof cb === 'function') {
        this.listeners.push(cb);
      }
    }

    notify() {
      this.listeners.forEach(cb => {
        try { cb(this.bundles); } catch (e) { console.error(e); }
      });
    }
  }

  window.BundleConfigEngine = new BundleConfigEngine();
})(window);
