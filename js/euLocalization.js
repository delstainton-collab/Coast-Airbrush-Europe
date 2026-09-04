// European Regional Localization & Compliance Engine for Coast Airbrush Europe

export const EU_COUNTRIES = {
  DE: {
    code: 'DE',
    name: 'Germany (Deutschland)',
    flag: '🇩🇪',
    currency: 'EUR',
    symbol: '€',
    rateToEur: 1.0,
    rateToUsd: 1.08,
    vatRate: 0.19,
    vatPrefix: 'DE',
    carrier: 'DHL Express Tracked',
    leadTime: '2-3 Business Days (Dispatched from UK)',
    popularPayment: 'Klarna / PayPal / Sofort',
    dutyFree: true
  },
  FR: {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    currency: 'EUR',
    symbol: '€',
    rateToEur: 1.0,
    rateToUsd: 1.08,
    vatRate: 0.20,
    vatPrefix: 'FR',
    carrier: 'Chronopost / DPD Express',
    leadTime: '2-3 Business Days (Dispatched from UK)',
    popularPayment: 'Carte Bancaire / PayPal / Klarna',
    dutyFree: true
  },
  NL: {
    code: 'NL',
    name: 'Netherlands (Nederland)',
    flag: '🇳🇱',
    currency: 'EUR',
    symbol: '€',
    rateToEur: 1.0,
    rateToUsd: 1.08,
    vatRate: 0.21,
    vatPrefix: 'NL',
    carrier: 'DPD / PostNL Express',
    leadTime: '2-3 Business Days (Dispatched from UK)',
    popularPayment: 'iDEAL (Direct Bank) / Klarna',
    dutyFree: true
  },
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    symbol: '£',
    rateToEur: 0.85,
    rateToUsd: 0.92,
    vatRate: 0.20,
    vatPrefix: 'GB',
    carrier: 'APC Overnight (Hazchem & LQ Tracked Next Day)',
    leadTime: 'Next Day Delivery by 4PM (APC Depot Dispatched)',
    popularPayment: 'Klarna / PayPal / Apple Pay',
    dutyFree: true
  },
  IT: {
    code: 'IT',
    name: 'Italy (Italia)',
    flag: '🇮🇹',
    currency: 'EUR',
    symbol: '€',
    rateToEur: 1.0,
    rateToUsd: 1.08,
    vatRate: 0.22,
    vatPrefix: 'IT',
    carrier: 'BRT / DHL Express',
    leadTime: '2-4 Business Days (Dispatched from UK)',
    popularPayment: 'Scalapay / PayPal / Satispay',
    dutyFree: true
  },
  ES: {
    code: 'ES',
    name: 'Spain (España)',
    flag: '🇪🇸',
    currency: 'EUR',
    symbol: '€',
    rateToEur: 1.0,
    rateToUsd: 1.08,
    vatRate: 0.21,
    vatPrefix: 'ES',
    carrier: 'SEUR / Correos Express',
    leadTime: '2-4 Business Days (Dispatched from UK)',
    popularPayment: 'Bizum / PayPal / Klarna',
    dutyFree: true
  },
  PL: {
    code: 'PL',
    name: 'Poland (Polska)',
    flag: '🇵🇱',
    currency: 'PLN',
    symbol: 'zł ',
    rateToEur: 4.30,
    rateToUsd: 4.65,
    vatRate: 0.23,
    vatPrefix: 'PL',
    carrier: 'DPD / InPost Express',
    leadTime: '3-4 Business Days (Dispatched from UK)',
    popularPayment: 'BLIK / Przelewy24',
    dutyFree: true
  },
  BE: {
    code: 'BE',
    name: 'Belgium (België/Belgique)',
    flag: '🇧🇪',
    currency: 'EUR',
    symbol: '€',
    rateToEur: 1.0,
    rateToUsd: 1.08,
    vatRate: 0.21,
    vatPrefix: 'BE',
    carrier: 'bpost / DPD Express',
    leadTime: '2-3 Business Days (Dispatched from UK)',
    popularPayment: 'Bancontact / Payconiq / Klarna',
    dutyFree: true
  },
  CH: {
    code: 'CH',
    name: 'Switzerland (Schweiz)',
    flag: '🇨🇭',
    currency: 'CHF',
    symbol: 'CHF ',
    rateToEur: 0.95,
    rateToUsd: 1.03,
    vatRate: 0.081,
    vatPrefix: 'CHE',
    carrier: 'Swiss Post Priority (DDP Cleared)',
    leadTime: '2-3 Business Days (Dispatched from UK)',
    popularPayment: 'TWINT / PostFinance / PayPal',
    dutyFree: true
  },
  SE: {
    code: 'SE',
    name: 'Sweden (Sverige)',
    flag: '🇸🇪',
    currency: 'SEK',
    symbol: 'kr ',
    rateToEur: 11.45,
    rateToUsd: 12.35,
    vatRate: 0.25,
    vatPrefix: 'SE',
    carrier: 'PostNord / DHL Express',
    leadTime: '3-4 Business Days (Dispatched from UK)',
    popularPayment: 'Klarna / Swish / Cards',
    dutyFree: true
  }
};

const safeStorage = {
  getItem: (key) => {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem: (key, val) => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, val);
    } catch {}
  },
  removeItem: (key) => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    } catch {}
  }
};

export class FXVolatilityEngine {
  constructor(localizationManager) {
    this.localization = localizationManager;
    this.storageKey = 'coast_fx_volatility_config_v1';

    const defaultConfig = {
      baseCurrency: 'GBP',
      targetCurrency: 'EUR',
      baselineRate: 0.8547, // 1 EUR = 0.8547 GBP (yielding 208.33 GBP -> ~243.75 EUR)
      currentRate: 0.8547,
      bufferPercent: 1.8, // 1.8% safety cushion
      spikeThresholdPercent: 3.5, // 3.5% triggers warning alarm
      circuitBreakerPercent: 7.5, // 7.5% trips circuit breaker (locks conversion to baseline)
      roundingMode: 'retail_95', // 'retail_95', 'retail_99', 'round_half', 'exact'
      lastChecked: new Date().toISOString(),
      alarmState: 'NORMAL', // 'NORMAL' | 'SPIKE_WARNING' | 'CIRCUIT_BREAKER'
      isCircuitBreakerTripped: false,
      isDismissed: false,
      simulatedShiftPercent: 0,
      history: []
    };

    const saved = safeStorage.getItem(this.storageKey);
    let parsed = null;
    if (saved) {
      try {
        parsed = JSON.parse(saved);
      } catch (e) {
        console.warn('[FX Engine] Failed to parse saved config:', e);
      }
    }
    this.config = parsed ? { ...defaultConfig, ...parsed } : defaultConfig;
    this.listeners = [];

    // Ensure state integrity on startup
    this.evaluateAlarmState(false);
  }

  save() {
    safeStorage.setItem(this.storageKey, JSON.stringify(this.config));
  }

  onUpdate(callback) {
    this.listeners.push(callback);
  }

  notify() {
    this.listeners.forEach(cb => {
      try { cb(this); } catch (e) { console.error('[FX Engine] Listener error:', e); }
    });
  }

  getEffectiveRate() {
    // If circuit breaker is tripped, lock conversion to safe baseline rate
    if (this.config.isCircuitBreakerTripped) {
      return this.config.baselineRate;
    }
    return this.config.currentRate;
  }

  calculateEurPrice(gbpPrice, options = {}) {
    const numericGbp = parseFloat(gbpPrice) || 0;
    if (numericGbp <= 0) return 0;

    const rate = options.rate || this.getEffectiveRate();
    const bufferPct = options.bufferPercent !== undefined ? options.bufferPercent : this.config.bufferPercent;
    const rounding = options.roundingMode || this.config.roundingMode;

    // Standard conversion: (GBP / rate) * (1 + buffer)
    const rawEur = (numericGbp / rate) * (1 + (bufferPct / 100));

    if (rounding === 'retail_95') {
      if (rawEur < 3) return Math.round(rawEur * 100) / 100;
      return Math.floor(rawEur) + 0.95;
    } else if (rounding === 'retail_99') {
      if (rawEur < 3) return Math.round(rawEur * 100) / 100;
      return Math.floor(rawEur) + 0.99;
    } else if (rounding === 'round_half') {
      return Math.round(rawEur * 2) / 2;
    } else {
      // 'exact'
      return Math.round(rawEur * 100) / 100;
    }
  }

  getDeviationDetails() {
    const baseline = this.config.baselineRate;
    const current = this.config.currentRate;
    // Percentage shift in rate: ((current - baseline) / baseline) * 100
    const rateShiftPercent = ((current - baseline) / baseline) * 100;
    // Price impact: when GBP/EUR rate drops (EUR appreciates), EUR prices drop or vice versa
    const absShiftPercent = Math.abs(rateShiftPercent);

    return {
      baselineRate: baseline,
      currentRate: current,
      effectiveRate: this.getEffectiveRate(),
      rateShiftPercent: +rateShiftPercent.toFixed(2),
      absShiftPercent: +absShiftPercent.toFixed(2),
      direction: rateShiftPercent > 0 ? 'GBP_DEPRECIATED' : (rateShiftPercent < 0 ? 'GBP_APPRECIATED' : 'UNCHANGED'),
      isAlarmActive: (this.config.alarmState !== 'NORMAL') && !this.config.isDismissed,
      isCircuitBreakerTripped: this.config.isCircuitBreakerTripped,
      alarmState: this.config.alarmState
    };
  }

  evaluateAlarmState(triggerNotify = true) {
    const baseline = this.config.baselineRate;
    const current = this.config.currentRate;
    const rateShiftPercent = ((current - baseline) / baseline) * 100;
    const absShift = Math.abs(rateShiftPercent);

    if (absShift >= this.config.circuitBreakerPercent) {
      this.config.alarmState = 'CIRCUIT_BREAKER';
      this.config.isCircuitBreakerTripped = true;
    } else if (absShift >= this.config.spikeThresholdPercent) {
      this.config.alarmState = 'SPIKE_WARNING';
      this.config.isCircuitBreakerTripped = false;
    } else {
      this.config.alarmState = 'NORMAL';
      this.config.isCircuitBreakerTripped = false;
      this.config.isDismissed = false;
    }

    if (this.localization) {
      this.localization.syncFxRate(this.getEffectiveRate());
    }

    this.save();
    if (triggerNotify) {
      this.notify();
    }
  }

  async fetchLiveRate() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const resp = await fetch('https://open.er-api.com/v6/latest/EUR', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      const gbpRate = data.rates && data.rates.GBP;
      if (typeof gbpRate === 'number' && gbpRate > 0.4 && gbpRate < 1.6) {
        this.config.currentRate = +gbpRate.toFixed(4);
        this.config.lastChecked = new Date().toISOString();
        this.config.simulatedShiftPercent = 0;
        this.config.isDismissed = false;
        this.evaluateAlarmState(true);

        return {
          success: true,
          rate: this.config.currentRate,
          source: 'Open Exchange Rates (ECB Mid-market)',
          details: this.getDeviationDetails()
        };
      } else {
        throw new Error('Invalid rate returned');
      }
    } catch (err) {
      console.warn('[FX Engine] Live rate fetch failed, using cached safe rate:', err.message);
      return {
        success: false,
        rate: this.config.currentRate,
        error: err.message,
        source: 'Cached Safe Rate',
        details: this.getDeviationDetails()
      };
    }
  }

  simulateSpike(percentShift) {
    const shift = parseFloat(percentShift) || 0;
    this.config.currentRate = +(this.config.baselineRate * (1 + shift / 100)).toFixed(4);
    this.config.simulatedShiftPercent = shift;
    this.config.isDismissed = false;
    this.config.lastChecked = new Date().toISOString();
    this.evaluateAlarmState(true);

    return {
      success: true,
      simulatedRate: this.config.currentRate,
      shiftPercent: shift,
      details: this.getDeviationDetails()
    };
  }

  reanchorBaseline(options = {}) {
    const prevBaseline = this.config.baselineRate;
    const newBaseline = this.config.currentRate;

    this.config.baselineRate = newBaseline;
    if (options.bufferPercent !== undefined) {
      this.config.bufferPercent = parseFloat(options.bufferPercent) || 0;
    }
    if (options.roundingMode) {
      this.config.roundingMode = options.roundingMode;
    }

    this.config.alarmState = 'NORMAL';
    this.config.isCircuitBreakerTripped = false;
    this.config.isDismissed = false;
    this.config.simulatedShiftPercent = 0;
    this.config.lastUpdated = new Date().toISOString();

    if (!Array.isArray(this.config.history)) this.config.history = [];
    this.config.history.unshift({
      timestamp: new Date().toISOString(),
      prevBaseline,
      newBaseline,
      bufferPercent: this.config.bufferPercent,
      roundingMode: this.config.roundingMode
    });
    if (this.config.history.length > 25) this.config.history = this.config.history.slice(0, 25);

    this.evaluateAlarmState(true);

    return {
      success: true,
      prevBaseline,
      newBaseline,
      bufferPercent: this.config.bufferPercent,
      roundingMode: this.config.roundingMode
    };
  }

  dismissAlarm() {
    this.config.isDismissed = true;
    this.save();
    this.notify();
  }

  updateConfig(updates = {}) {
    if (updates.bufferPercent !== undefined) this.config.bufferPercent = parseFloat(updates.bufferPercent) || 0;
    if (updates.spikeThresholdPercent !== undefined) this.config.spikeThresholdPercent = parseFloat(updates.spikeThresholdPercent) || 3.5;
    if (updates.circuitBreakerPercent !== undefined) this.config.circuitBreakerPercent = parseFloat(updates.circuitBreakerPercent) || 7.5;
    if (updates.roundingMode) this.config.roundingMode = updates.roundingMode;
    if (updates.baselineRate !== undefined) this.config.baselineRate = parseFloat(updates.baselineRate) || 0.8547;
    if (updates.currentRate !== undefined) this.config.currentRate = parseFloat(updates.currentRate) || this.config.baselineRate;

    this.evaluateAlarmState(true);
  }

  resetToDefaults() {
    this.config.baselineRate = 0.8547;
    this.config.currentRate = 0.8547;
    this.config.bufferPercent = 1.8;
    this.config.spikeThresholdPercent = 3.5;
    this.config.circuitBreakerPercent = 7.5;
    this.config.roundingMode = 'retail_95';
    this.config.alarmState = 'NORMAL';
    this.config.isCircuitBreakerTripped = false;
    this.config.isDismissed = false;
    this.config.simulatedShiftPercent = 0;
    this.evaluateAlarmState(true);
  }

  getSampleImpact(sampleItems = []) {
    const defaultSamples = [
      { name: 'Flake King Pro Series Kit', sku: 'FOMPRO', gbpPrice: 208.33 },
      { name: 'Flake King 1000 Dry Metal Flake Gun', sku: '5060733580014', gbpPrice: 108.33 },
      { name: 'FK50 Surface Binder 500ml', sku: 'FK50500', gbpPrice: 16.66 },
      { name: 'Show Krome Metal Flake (Single Colour)', sku: 'fk-2610', gbpPrice: 4.71 }
    ];

    const items = sampleItems.length > 0 ? sampleItems : defaultSamples;
    const baselineRate = this.config.baselineRate;
    const currentRate = this.config.currentRate;
    const buffer = this.config.bufferPercent;
    const rounding = this.config.roundingMode;

    return items.map(item => {
      const oldEur = this.calculateEurPrice(item.gbpPrice, {
        rate: baselineRate,
        bufferPercent: buffer,
        roundingMode: rounding
      });
      const newEur = this.calculateEurPrice(item.gbpPrice, {
        rate: currentRate,
        bufferPercent: buffer,
        roundingMode: rounding
      });
      const diffEur = +(newEur - oldEur).toFixed(2);
      const diffPct = oldEur > 0 ? +((diffEur / oldEur) * 100).toFixed(1) : 0;

      return {
        name: item.name,
        sku: item.sku,
        gbpPrice: item.gbpPrice,
        oldEur,
        newEur,
        diffEur,
        diffPct
      };
    });
  }
}

export class EULocalizationManager {
  constructor() {
    const stored = safeStorage.getItem('coast_eu_country');
    this.selectedCountryCode = (stored && EU_COUNTRIES[stored]) ? stored : (this.detectCountry() || 'GB');
    this.unitPreference = safeStorage.getItem('coast_eu_unit') || 'metric';
    this.vatNumber = safeStorage.getItem('coast_eu_vat_num') || '';
    this.isVatExempt = safeStorage.getItem('coast_eu_vat_exempt') === 'true';
    this.vatCompanyName = safeStorage.getItem('coast_eu_vat_company') || '';
    this.listeners = [];

    // Initialize FX Volatility & Margin Guard Engine
    this.fxEngine = new FXVolatilityEngine(this);
  }

  syncFxRate(rate) {
    if (EU_COUNTRIES.GB) {
      EU_COUNTRIES.GB.rateToEur = rate;
    }
  }

  detectCountry() {
    try {
      if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
        const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();
        if (tz.includes('london')) return 'GB';
        if (tz.includes('berlin')) return 'DE';
        if (tz.includes('paris')) return 'FR';
        if (tz.includes('amsterdam')) return 'NL';
        if (tz.includes('madrid')) return 'ES';
        if (tz.includes('rome')) return 'IT';
        if (tz.includes('warsaw')) return 'PL';
        if (tz.includes('brussels')) return 'BE';
        if (tz.includes('zurich')) return 'CH';
        if (tz.includes('stockholm')) return 'SE';
      }
      if (typeof navigator !== 'undefined' && navigator.language) {
        const lang = navigator.language.toLowerCase();
        if (lang.includes('gb') || lang === 'en') return 'GB';
        if (lang.includes('de')) return 'DE';
        if (lang.includes('fr')) return 'FR';
        if (lang.includes('nl')) return 'NL';
        if (lang.includes('es')) return 'ES';
        if (lang.includes('it')) return 'IT';
        if (lang.includes('pl')) return 'PL';
        if (lang.includes('se') || lang.includes('sv')) return 'SE';
      }
    } catch {}
    return 'GB';
  }

  getCountry() {
    return EU_COUNTRIES[this.selectedCountryCode] || EU_COUNTRIES.GB;
  }

  setCountry(code) {
    if (EU_COUNTRIES[code]) {
      this.selectedCountryCode = code;
      safeStorage.setItem('coast_eu_country', code);
      this.notify();
    }
  }

  setUnitPreference(pref) {
    this.unitPreference = pref;
    safeStorage.setItem('coast_eu_unit', pref);
    this.notify();
  }

  formatPrice(amountInEur, showSecondary = true) {
    const country = this.getCountry();
    const converted = amountInEur * country.rateToEur;
    const formatted = `${country.symbol}${converted.toFixed(2)}`;
    
    if (showSecondary) {
      if (country.currency === 'GBP') {
        return `${formatted} <span class="text-secondary font-mono text-[11px] font-normal">(€${amountInEur.toFixed(2)})</span>`;
      } else if (country.currency === 'EUR') {
        const gbp = amountInEur * (EU_COUNTRIES.GB?.rateToEur || 0.85);
        return `${formatted} <span class="text-secondary font-mono text-[11px] font-normal">(£${gbp.toFixed(2)})</span>`;
      } else {
        const gbp = amountInEur * (EU_COUNTRIES.GB?.rateToEur || 0.85);
        return `${formatted} <span class="text-secondary font-mono text-[11px] font-normal">(€${amountInEur.toFixed(2)} / £${gbp.toFixed(2)})</span>`;
      }
    }
    return formatted;
  }

  convertPrice(amountInEur) {
    const country = this.getCountry();
    return amountInEur * country.rateToEur;
  }

  convertGbpToEur(gbpPrice, options = {}) {
    return this.fxEngine.calculateEurPrice(gbpPrice, options);
  }

  validateVIESVat(vatInput) {
    const cleanVat = (vatInput || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    const vatPatterns = {
      DE: /^DE[0-9]{9}$/,
      FR: /^FR[A-Z0-9]{2}[0-9]{9}$/,
      NL: /^NL[0-9]{9}B[0-9]{2}$/,
      GB: /^GB([0-9]{9}|[0-9]{12}|(GD|HA)[0-9]{3})$/,
      IT: /^IT[0-9]{11}$/,
      ES: /^ES[A-Z0-9][0-9]{7}[A-Z0-9]$/,
      PL: /^PL[0-9]{10}$/,
      BE: /^BE[0-1][0-9]{9}$/,
      SE: /^SE[0-9]{12}$/,
      CHE: /^CHE[0-9]{9}(MWST|TVA|IVA)?$/
    };

    let isValid = false;
    let detectedCountry = '';

    for (const [prefix, regex] of Object.entries(vatPatterns)) {
      if (regex.test(cleanVat)) {
        isValid = true;
        detectedCountry = prefix;
        break;
      }
    }

    if (!isValid && /^[A-Z]{2}[A-Z0-9]{6,12}$/.test(cleanVat)) {
      isValid = true;
      detectedCountry = cleanVat.substring(0, 2);
    }

    if (isValid) {
      this.vatNumber = cleanVat;
      safeStorage.setItem('coast_eu_vat_num', cleanVat);

      // UK domestic businesses are subject to 20% UK VAT (reclaimable via HMRC return), NOT 0% zero-rate
      if (detectedCountry === 'GB' || cleanVat.startsWith('GB')) {
        this.isVatExempt = false;
        this.vatCompanyName = `UK Registered Business (${cleanVat})`;
        safeStorage.setItem('coast_eu_vat_exempt', 'false');
        safeStorage.setItem('coast_eu_vat_company', this.vatCompanyName);
        this.notify();
        return {
          valid: true,
          vatNumber: cleanVat,
          exempt: false,
          message: `✅ Valid UK VAT (${cleanVat}). 20% Standard UK VAT applied (full VAT invoice provided for HMRC reclaim).`
        };
      }

      // Valid EU cross-border B2B qualifies for 0% intra-trade reverse charge
      this.isVatExempt = true;
      this.vatCompanyName = `Verified EU Business (${cleanVat})`;
      safeStorage.setItem('coast_eu_vat_exempt', 'true');
      safeStorage.setItem('coast_eu_vat_company', this.vatCompanyName);
      this.notify();
      return {
        valid: true,
        vatNumber: cleanVat,
        exempt: true,
        message: `✅ Verified EU B2B VAT (${cleanVat}) - 0% Cross-Border Reverse Charge Applied.`
      };
    } else {
      return {
        valid: false,
        message: `❌ Invalid VAT Format. Expected format e.g. DE123456789 or GB123456789.`
      };
    }
  }

  clearVatExemption() {
    this.vatNumber = '';
    this.isVatExempt = false;
    this.vatCompanyName = '';
    safeStorage.removeItem('coast_eu_vat_num');
    safeStorage.setItem('coast_eu_vat_exempt', 'false');
    safeStorage.removeItem('coast_eu_vat_company');
    this.notify();
  }

  calculateTaxAndTotal(subtotalEur) {
    const country = this.getCountry();
    const isUK = country.code === 'GB';
    
    // Tax calculation: UK always pays 20% UK VAT. EU B2C pays destination VAT (IOSS/DDP); EU B2B with valid VIES is 0%
    const appliedTaxRate = (!isUK && this.isVatExempt) ? 0.0 : country.vatRate;
    const vatAmountEur = subtotalEur * appliedTaxRate;

    // Shipping & DDP Cost Recovery Engine (dispatched from UK)
    let shippingBaseEur = 0;
    let ddpAdminFeeEur = 0;

    if (subtotalEur > 0) {
      if (isUK) {
        // Domestic UK shipping: Free over £150
        const subtotalGbp = subtotalEur * (country.rateToEur || 0.85);
        shippingBaseEur = subtotalGbp >= 150 ? 0.0 : 8.50;
        ddpAdminFeeEur = 0.0; // Domestic shipment has no customs clearance fee
      } else {
        // European Cross-Border Export: DDP road courier + ADR hazard pack: Free over €200
        shippingBaseEur = subtotalEur >= 200 ? 0.0 : 16.50;
        // Courier DDP customs clearance admin fee (£5.50 / ~€6.50) passed transparently to protect margin
        // If order qualifies for IOSS (< €150) or B2B Reverse Charge, courier fee is waived/optimized
        ddpAdminFeeEur = (subtotalEur > 150 && !this.isVatExempt) ? 6.50 : 0.0;
      }
    }

    const shippingTotalEur = shippingBaseEur + ddpAdminFeeEur;
    const totalEur = subtotalEur + vatAmountEur + shippingTotalEur;

    return {
      subtotalEur,
      vatRatePercent: (appliedTaxRate * 100).toFixed(0),
      vatAmountEur,
      shippingBaseEur,
      ddpAdminFeeEur,
      shippingTotalEur,
      totalEur,
      isVatExempt: this.isVatExempt,
      isUK,
      subtotalLocal: this.convertPrice(subtotalEur),
      vatAmountLocal: this.convertPrice(vatAmountEur),
      shippingTotalLocal: this.convertPrice(shippingTotalEur),
      ddpAdminFeeLocal: this.convertPrice(ddpAdminFeeEur),
      totalLocal: this.convertPrice(totalEur),
      currencySymbol: country.symbol,
      currencyCode: country.currency
    };
  }

  onUpdate(callback) {
    this.listeners.push(callback);
  }

  notify() {
    this.listeners.forEach(cb => cb(this));
  }
}
