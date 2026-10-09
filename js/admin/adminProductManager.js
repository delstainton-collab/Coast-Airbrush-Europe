export class AdminProductManager {
  constructor(adminController) {
    this.admin = adminController;
  }

  get config() {
    return this.admin.config;
  }

  saveProductOverride(productId, productFields) {
    if (!this.config.productOverrides) {
      this.config.productOverrides = {};
    }
    this.config.productOverrides[productId] = {
      ...(this.config.productOverrides[productId] || {}),
      ...productFields,
      updatedAt: new Date().toISOString()
    };
    this.admin.saveConfig();
    return this.config.productOverrides[productId];
  }

  saveProductOverridesBulk(overridesMap) {
    if (!this.config.productOverrides) {
      this.config.productOverrides = {};
    }
    const timestamp = new Date().toISOString();
    for (const [productId, fields] of Object.entries(overridesMap)) {
      this.config.productOverrides[productId] = {
        ...(this.config.productOverrides[productId] || {}),
        ...fields,
        updatedAt: timestamp
      };
    }
    this.admin.saveConfig();
    return this.config.productOverrides;
  }

  deleteProductOverride(productId) {
    if (this.config.productOverrides && this.config.productOverrides[productId]) {
      delete this.config.productOverrides[productId];
      this.admin.saveConfig();
    }
  }

  saveProductMatrix(productId, matrixData) {
    if (!this.config.productOverrides) {
      this.config.productOverrides = {};
    }
    const current = this.config.productOverrides[productId] || {};
    this.config.productOverrides[productId] = {
      ...current,
      variantMatrix: matrixData,
      hasOptions: Boolean(matrixData && matrixData.variants && matrixData.variants.length > 0),
      updatedAt: new Date().toISOString()
    };
    this.admin.saveConfig();
    return this.config.productOverrides[productId];
  }

  deleteProductMatrix(productId) {
    if (this.config.productOverrides && this.config.productOverrides[productId]) {
      delete this.config.productOverrides[productId].variantMatrix;
      this.admin.saveConfig();
    }
  }

  deleteProduct(productId, productSnapshot = null) {
    if (!this.config.deletedProductIds) {
      this.config.deletedProductIds = [];
    }
    if (!this.config.deletedProductRecords) {
      this.config.deletedProductRecords = {};
    }
    if (!this.config.deletedProductIds.includes(productId)) {
      this.config.deletedProductIds.push(productId);
    }
    if (productSnapshot) {
      this.config.deletedProductRecords[productId] = {
        ...productSnapshot,
        deletedAt: new Date().toISOString()
      };
    }
    if (this.config.productOverrides && this.config.productOverrides[productId]) {
      delete this.config.productOverrides[productId];
    }
    this.admin.saveConfig();
    return this.config.deletedProductIds;
  }

  deleteProductsBulk(items) {
    if (!this.config.deletedProductIds) {
      this.config.deletedProductIds = [];
    }
    if (!this.config.deletedProductRecords) {
      this.config.deletedProductRecords = {};
    }
    items.forEach(item => {
      const id = typeof item === 'string' ? item : item.id;
      const snapshot = typeof item === 'object' ? item : null;
      if (!this.config.deletedProductIds.includes(id)) {
        this.config.deletedProductIds.push(id);
      }
      if (snapshot) {
        this.config.deletedProductRecords[id] = {
          ...snapshot,
          deletedAt: new Date().toISOString()
        };
      }
      if (this.config.productOverrides && this.config.productOverrides[id]) {
        delete this.config.productOverrides[id];
      }
    });
    this.admin.saveConfig();
    return this.config.deletedProductIds;
  }

  restoreProduct(productId) {
    let restoredRecord = null;
    if (this.config.deletedProductIds) {
      this.config.deletedProductIds = this.config.deletedProductIds.filter(id => id !== productId);
    }
    if (this.config.deletedProductRecords && this.config.deletedProductRecords[productId]) {
      restoredRecord = { ...this.config.deletedProductRecords[productId] };
      delete this.config.deletedProductRecords[productId];
    }
    this.admin.saveConfig();
    return restoredRecord;
  }

  restoreAllDeletedProducts() {
    const records = Object.values(this.config.deletedProductRecords || {});
    this.config.deletedProductIds = [];
    this.config.deletedProductRecords = {};
    this.admin.saveConfig();
    return records;
  }

  getDeletedProductIds() {
    return this.config.deletedProductIds || [];
  }

  getDeletedProductRecords() {
    return this.config.deletedProductRecords || {};
  }

  resetAllProductOverrides() {
    this.config.productOverrides = {};
    this.admin.saveConfig();
  }

  saveCustomField(fieldDef) {
    if (!this.config.customProductFields) {
      this.config.customProductFields = [];
    }
    const idx = this.config.customProductFields.findIndex(f => f.key === fieldDef.key);
    if (idx >= 0) {
      this.config.customProductFields[idx] = fieldDef;
    } else {
      this.config.customProductFields.push(fieldDef);
    }
    this.admin.saveConfig();
  }

  deleteCustomField(fieldKey) {
    if (this.config.customProductFields) {
      this.config.customProductFields = this.config.customProductFields.filter(f => f.key !== fieldKey);
      this.admin.saveConfig();
    }
  }

  batchRepriceCatalogFromGbp(options = {}) {
    if (!this.admin.app?.euLocalization?.fxEngine) {
      return { success: 0 };
    }
    const fx = this.admin.app.euLocalization.fxEngine;
    const products = this.admin.app.getEffectiveProducts ? this.admin.app.getEffectiveProducts() : [];
    const bulkMap = {};
    let count = 0;

    products.forEach(p => {
      const gbpBase = parseFloat(p.priceGbp) || parseFloat(p.priceRrpExVat) || 0;
      if (gbpBase > 0) {
        const newEur = fx.calculateEurPrice(gbpBase, options);
        bulkMap[p.id] = { priceEur: newEur };
        p.priceEur = newEur;
        count++;
      }
    });

    if (Object.keys(bulkMap).length > 0) {
      this.saveProductOverridesBulk(bulkMap);
    }

    return {
      success: true,
      count,
      rateUsed: options.rate || fx.getEffectiveRate(),
      bufferUsed: options.bufferPercent !== undefined ? options.bufferPercent : fx.config.bufferPercent
    };
  }
}
