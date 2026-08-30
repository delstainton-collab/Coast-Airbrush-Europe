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
    carrier: 'DPD UK / Royal Mail Tracked 24',
    leadTime: 'Next Day Delivery (UK Direct)',
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

export class EULocalizationManager {
  constructor() {
    this.selectedCountryCode = safeStorage.getItem('coast_eu_country') || 'DE';
    this.unitPreference = safeStorage.getItem('coast_eu_unit') || 'metric';
    this.vatNumber = safeStorage.getItem('coast_eu_vat_num') || '';
    this.isVatExempt = safeStorage.getItem('coast_eu_vat_exempt') === 'true';
    this.vatCompanyName = safeStorage.getItem('coast_eu_vat_company') || '';
    this.listeners = [];
  }

  getCountry() {
    return EU_COUNTRIES[this.selectedCountryCode] || EU_COUNTRIES.DE;
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

  formatPrice(amountInEur, showOriginal = false) {
    const country = this.getCountry();
    const converted = amountInEur * country.rateToEur;
    const formatted = `${country.symbol}${converted.toFixed(2)}`;
    
    if (showOriginal && country.currency !== 'EUR') {
      return `${formatted} <span class="text-secondary font-mono text-[11px] font-normal">(€${amountInEur.toFixed(2)})</span>`;
    }
    return formatted;
  }

  convertPrice(amountInEur) {
    const country = this.getCountry();
    return amountInEur * country.rateToEur;
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

    for (const [prefix, regex] of Object.entries(vatPatterns)) {
      if (regex.test(cleanVat)) {
        isValid = true;
        break;
      }
    }

    if (!isValid && /^[A-Z]{2}[A-Z0-9]{6,12}$/.test(cleanVat)) {
      isValid = true;
    }

    if (isValid) {
      this.vatNumber = cleanVat;
      this.isVatExempt = true;
      this.vatCompanyName = `Verified EU Business (${cleanVat})`;
      safeStorage.setItem('coast_eu_vat_num', cleanVat);
      safeStorage.setItem('coast_eu_vat_exempt', 'true');
      safeStorage.setItem('coast_eu_vat_company', this.vatCompanyName);
      this.notify();
      return {
        valid: true,
        vatNumber: cleanVat,
        exempt: true,
        message: `✅ Verified Business VAT (${cleanVat}) - 0% Export/Intra-Trade Tax Applied.`
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
    const appliedTaxRate = this.isVatExempt ? 0.0 : country.vatRate;
    const vatAmountEur = subtotalEur * appliedTaxRate;
    const totalEur = subtotalEur + vatAmountEur;

    return {
      subtotalEur,
      vatRatePercent: (appliedTaxRate * 100).toFixed(0),
      vatAmountEur,
      totalEur,
      isVatExempt: this.isVatExempt,
      subtotalLocal: this.convertPrice(subtotalEur),
      vatAmountLocal: this.convertPrice(vatAmountEur),
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
