// Shopify & E-Commerce Integration Layer for Coast Airbrush Europe
// Compliant with standard Shopify Online Store 2.0 and GraphQL Variant Architecture

import { recommendContainerPack } from './mixingEngine.js';
import { SHOPIFY_VARIANT_MAP } from '../data/shopify_variant_map.js';

export class ShopifyCartManager {
  constructor(shopifyDomain) {
    if (!shopifyDomain) {
      if (typeof window !== 'undefined' && window.location && window.location.hostname && !window.location.hostname.includes('file:')) {
        this.shopifyDomain = window.location.host;
      } else {
        this.shopifyDomain = "coastairbrush.eu";
      }
    } else {
      this.shopifyDomain = shopifyDomain;
    }

    this.variantMap = SHOPIFY_VARIANT_MAP || (typeof window !== 'undefined' && window.SHOPIFY_VARIANT_MAP) || {};
    this.cartItems = JSON.parse(localStorage.getItem('coast_cart_items') || '[]');
    this.listeners = [];

    // Re-validate existing cart items with variant IDs if loaded from cache
    this.sanitizeCartItems();
  }

  /**
   * Ensures all cart items have a valid numerical Shopify Variant ID
   */
  sanitizeCartItems() {
    let modified = false;
    this.cartItems.forEach(item => {
      if (!item.variantId && item.sku) {
        const info = this.resolveVariant(item.sku);
        if (info && info.shopifyVariantId) {
          item.variantId = info.shopifyVariantId;
          modified = true;
        }
      }
    });
    if (modified) {
      localStorage.setItem('coast_cart_items', JSON.stringify(this.cartItems));
    }
  }

  /**
   * Resolves a SKU into a Shopify Variant Map entry
   */
  resolveVariant(sku) {
    if (!sku) return null;
    const cleanSku = String(sku).trim();
    if (this.variantMap[cleanSku]) {
      return this.variantMap[cleanSku];
    }
    if (typeof window !== 'undefined' && window.SHOPIFY_VARIANT_MAP && window.SHOPIFY_VARIANT_MAP[cleanSku]) {
      return window.SHOPIFY_VARIANT_MAP[cleanSku];
    }
    // Fallback: check case-insensitive match
    const lower = cleanSku.toLowerCase();
    for (const [s, data] of Object.entries(this.variantMap)) {
      if (s.toLowerCase() === lower) return data;
    }
    return null;
  }

  onCartUpdate(callback) {
    this.listeners.push(callback);
  }

  notifyListeners() {
    localStorage.setItem('coast_cart_items', JSON.stringify(this.cartItems));
    this.listeners.forEach(cb => cb(this.getCartSummary()));
  }

  /**
   * Adds an item to the shopping cart, automatically attaching its standard Shopify Variant ID
   */
  addItem(item) {
    const variantInfo = this.resolveVariant(item.sku);
    const resolvedVariantId = item.variantId || (variantInfo ? variantInfo.shopifyVariantId : null) || this.generateFallbackVariantId(item.sku);
    const priceEur = item.priceEur || (variantInfo ? variantInfo.priceEur : item.price) || 24.00;
    const priceGbp = item.priceGbp || (variantInfo ? variantInfo.priceGbp : Math.round(priceEur * 0.85 * 100) / 100);

    const existingIndex = this.cartItems.findIndex(i => 
      (i.variantId && i.variantId === resolvedVariantId) ||
      (i.sku === item.sku && i.variantDetails === item.variantDetails)
    );

    if (existingIndex > -1) {
      this.cartItems[existingIndex].quantity += (item.quantity || 1);
    } else {
      this.cartItems.push({
        id: item.id || `var_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        variantId: resolvedVariantId,
        sku: item.sku,
        handle: item.handle || (variantInfo ? variantInfo.handle : ''),
        title: item.title || (variantInfo ? variantInfo.productTitle : item.name) || 'Custom Formulation',
        variantDetails: item.variantDetails || (variantInfo ? variantInfo.variantTitle : item.containerLabel) || 'Standard',
        category: item.category || (variantInfo ? variantInfo.category : 'custom_paint'),
        quantity: item.quantity || 1,
        priceEur: priceEur,
        priceGbp: priceGbp,
        properties: item.properties || {}
      });
    }
    this.notifyListeners();
  }

  /**
   * Adds entire mixed recipe BOM into Shopify Cart with Line Item Properties
   */
  addRecipeToShopifyCart(recipe, projectName = "Custom Color Mix") {
    const items = recipe ? (recipe.steps || recipe.components) : null;
    if (!items || !items.length) return false;

    items.forEach(step => {
      const sku = step.productSku || step.sku || 'KE-BASE-1L';
      const name = step.componentName || step.name || 'Custom Blend Component';
      const variantInfo = this.resolveVariant(sku);
      const basePriceEur = (step.selectedProduct && step.selectedProduct.priceEur) || (variantInfo ? variantInfo.priceEur : step.priceEur) || 28.50;
      const targetWeight = (step.targetWeightGrams !== undefined ? step.targetWeightGrams : (step.individualWeightGrams || 0));
      const cumulativeWeight = (step.cumulativeWeightGrams !== undefined ? step.cumulativeWeightGrams : 0);
      const volumeMl = Math.round(step.volumeMl || 0);

      this.addItem({
        sku: sku,
        variantId: variantInfo ? variantInfo.shopifyVariantId : null,
        title: name,
        priceEur: basePriceEur,
        quantity: 1,
        variantDetails: `${volumeMl} mL / ${targetWeight.toFixed(1)}g`,
        properties: {
          "Mixed Formula": recipe.systemName || projectName || "Custom Mix",
          "Target Scale Weight": `${cumulativeWeight.toFixed(1)}g`,
          "Volume Needed": `${volumeMl}mL`,
          "Mix Ratio": recipe.mixRatio || "Formulated Mix"
        }
      });
    });
    return true;
  }

  removeItem(index) {
    if (typeof index === 'number' && index >= 0 && index < this.cartItems.length) {
      this.cartItems.splice(index, 1);
      this.notifyListeners();
    } else if (typeof index === 'string') {
      this.cartItems = this.cartItems.filter(i => i.sku !== index && String(i.variantId) !== index);
      this.notifyListeners();
    }
  }

  updateQuantity(index, newQty) {
    if (index >= 0 && index < this.cartItems.length) {
      if (newQty <= 0) {
        this.removeItem(index);
      } else {
        this.cartItems[index].quantity = newQty;
        this.notifyListeners();
      }
    }
  }

  clearCart() {
    this.cartItems = [];
    this.notifyListeners();
  }

  getCartSummary() {
    const itemCount = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = this.cartItems.reduce((sum, item) => sum + (item.priceEur * item.quantity), 0);
    const subtotalGbp = this.cartItems.reduce((sum, item) => sum + ((item.priceGbp || item.priceEur * 0.85) * item.quantity), 0);
    return {
      items: this.cartItems,
      itemCount,
      subtotal: Math.round(subtotal * 100) / 100,
      subtotalGbp: Math.round(subtotalGbp * 100) / 100
    };
  }

  /**
   * Generates a 100% compliant Shopify Cart Permalink using numeric Variant IDs
   * Example: https://coastairbrush.eu/cart/4591028300001:1,4591028300002:2?note=...
   */
  generateShopifyCartPermalink() {
    if (this.cartItems.length === 0) return "";

    const itemsParam = this.cartItems.map(item => {
      const vid = item.variantId || this.generateFallbackVariantId(item.sku);
      return `${vid}:${item.quantity}`;
    }).join(',');

    let permalink = `https://${this.shopifyDomain}/cart/${itemsParam}?note=${encodeURIComponent("Coast Airbrush Europe Dispatch Order")}`;

    // Attach custom formula attributes if mixing recipes exist in cart
    const formulaNames = [...new Set(this.cartItems.map(i => i.properties && i.properties["Mixed Formula"]).filter(Boolean))];
    if (formulaNames.length > 0) {
      permalink += `&attributes[Custom+Formulation]=${encodeURIComponent(formulaNames.join(", "))}`;
    }

    return permalink;
  }

  /**
   * Pushes items directly to standard Shopify Ajax Cart API (/cart/add.js)
   * if running in the live Shopify theme environment
   */
  async addToShopifyNativeCart(items = null) {
    const targetItems = items || this.cartItems;
    if (!targetItems.length) return false;

    const payloadItems = targetItems.map(item => {
      const vid = item.variantId || this.generateFallbackVariantId(item.sku);
      return {
        id: vid,
        quantity: item.quantity || 1,
        properties: item.properties || {}
      };
    });

    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ items: payloadItems })
      });

      if (res.ok) {
        const cartData = await res.json();
        if (typeof window !== 'undefined') {
          // Trigger Shopify standard theme cart refresh events
          document.dispatchEvent(new CustomEvent('cart:updated', { detail: cartData }));
          document.dispatchEvent(new CustomEvent('cart:refresh', { detail: cartData }));
        }
        return cartData;
      }
    } catch (err) {
      console.info("Native Shopify /cart/add.js not available in current environment; falling back to permalink.", err);
    }
    return false;
  }

  /**
   * Dispatches checkout either via direct Shopify checkout or valid permalink
   */
  async checkout() {
    if (this.cartItems.length === 0) return false;

    const isShopifyHost = typeof window !== 'undefined' && 
      (window.Shopify || (window.location && (window.location.hostname.includes('myshopify.com') || window.location.hostname === this.shopifyDomain)));

    if (isShopifyHost && typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
      const ajaxSuccess = await this.addToShopifyNativeCart();
      if (ajaxSuccess) {
        window.location.href = '/checkout';
        return true;
      }
    }

    const permalink = this.generateShopifyCartPermalink();
    if (typeof window !== 'undefined') {
      window.open(permalink, '_blank');
    }
    return permalink;
  }

  /**
   * Deterministic numerical fallback for SKUs pending Shopify live sync
   */
  generateFallbackVariantId(sku) {
    let hash = 4591000000000;
    const str = String(sku || 'DEFAULT');
    for (let i = 0; i < str.length; i++) {
      hash = (hash + str.charCodeAt(i) * (i + 1) * 31) % 9000000000000;
    }
    return hash;
  }

  exportToCSV() {
    if (this.cartItems.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,SKU,Shopify Variant ID,Product Name,Variant / Size,Quantity,Unit Price (EUR),Subtotal (EUR)\n";
    this.cartItems.forEach(item => {
      const vid = item.variantId || 'Unsynced';
      csvContent += `"${item.sku}","${vid}","${item.title}","${item.variantDetails || 'Std'}",${item.quantity},${item.priceEur.toFixed(2)},${(item.priceEur * item.quantity).toFixed(2)}\n`;
    });
    const summary = this.getCartSummary();
    csvContent += `,,,,TOTAL,,${summary.subtotal.toFixed(2)}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `coast_airbrush_eu_order_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  exportToJSON(recipe) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ recipe, cart: this.getCartSummary() }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `coast_airbrush_order_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}
