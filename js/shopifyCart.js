// Shopify & E-Commerce Integration Layer for Coast Airbrush Europe

import { recommendContainerPack } from './mixingEngine.js';

export class ShopifyCartManager {
  constructor(shopifyDomain = "coastairbrush.eu") {
    this.shopifyDomain = shopifyDomain;
    this.cartItems = JSON.parse(localStorage.getItem('coast_cart_items') || '[]');
    this.listeners = [];
  }

  onCartUpdate(callback) {
    this.listeners.push(callback);
  }

  notifyListeners() {
    localStorage.setItem('coast_cart_items', JSON.stringify(this.cartItems));
    this.listeners.forEach(cb => cb(this.getCartSummary()));
  }

  /**
   * Adds an item to the shopping cart with EUR and converted currency support
   */
  addItem(item) {
    const existingIndex = this.cartItems.findIndex(i => i.sku === item.sku && (i.variantDetails === item.variantDetails));
    const priceEur = item.priceEur || item.price || 24.00;

    if (existingIndex > -1) {
      this.cartItems[existingIndex].quantity += (item.quantity || 1);
    } else {
      this.cartItems.push({
        id: item.id || `var_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        sku: item.sku,
        title: item.title || item.name || 'Custom Formulation',
        variantDetails: item.variantDetails || item.containerLabel || 'Standard',
        quantity: item.quantity || 1,
        priceEur: priceEur,
        properties: item.properties || {}
      });
    }
    this.notifyListeners();
  }

  /**
   * Adds entire mixed recipe BOM into Shopify Cart Drawer
   */
  addRecipeToShopifyCart(recipe, projectName = "Custom Color Mix") {
    const items = recipe ? (recipe.steps || recipe.components) : null;
    if (!items || !items.length) return false;

    items.forEach(step => {
      const sku = step.productSku || step.sku || 'KE-BASE-1L';
      const name = step.componentName || step.name || 'Custom Blend Component';
      const basePriceEur = (step.selectedProduct && step.selectedProduct.priceEur) || step.priceEur || 28.50;
      const targetWeight = (step.targetWeightGrams !== undefined ? step.targetWeightGrams : (step.individualWeightGrams || 0));
      const cumulativeWeight = (step.cumulativeWeightGrams !== undefined ? step.cumulativeWeightGrams : 0);
      const volumeMl = Math.round(step.volumeMl || 0);

      this.addItem({
        sku: sku,
        title: name,
        priceEur: basePriceEur,
        quantity: 1,
        variantDetails: `${volumeMl} mL / ${targetWeight.toFixed(1)}g`,
        properties: {
          "Mixed Formula": recipe.systemName || projectName || "Custom Mix",
          "Target Scale Weight": `${cumulativeWeight.toFixed(1)}g`,
          "Volume Needed": `${volumeMl}mL`
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
      this.cartItems = this.cartItems.filter(i => i.sku !== index);
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
    return {
      items: this.cartItems,
      itemCount,
      subtotal: Math.round(subtotal * 100) / 100
    };
  }

  generateShopifyCartPermalink() {
    if (this.cartItems.length === 0) return "";
    const itemsParam = this.cartItems.map(item => `${item.sku}:${item.quantity}`).join(',');
    return `https://${this.shopifyDomain}/cart/${itemsParam}?note=${encodeURIComponent("Coast Airbrush Europe Dispatch Order")}`;
  }

  exportToCSV() {
    if (this.cartItems.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,SKU,Product Name,Variant / Size,Quantity,Unit Price (EUR),Subtotal (EUR)\n";
    this.cartItems.forEach(item => {
      csvContent += `"${item.sku}","${item.title}","${item.variantDetails || 'Std'}",${item.quantity},${item.priceEur.toFixed(2)},${(item.priceEur * item.quantity).toFixed(2)}\n`;
    });
    const summary = this.getCartSummary();
    csvContent += `,,,TOTAL,,${summary.subtotal.toFixed(2)}\n`;

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
