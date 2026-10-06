import { decryptCredentials } from "../core/crypto.js";
import { MockLtlCarrierAdapter } from "./mockCarrierAdapter.js";
import { MainfreightEuropeAdapter } from "./mainfreightAdapter.js";

const ADAPTER_MAP = {
  "mock-ltl": MockLtlCarrierAdapter,
  "mainfreight-eu": MainfreightEuropeAdapter
};

export class CarrierRegistry {
  /**
   * Register a custom carrier adapter class
   */
  static register(carrierId, adapterClass) {
    ADAPTER_MAP[carrierId] = adapterClass;
  }

  /**
   * Instantiate an adapter using account configuration from database
   */
  static getAdapter(accountConfig) {
    if (!accountConfig) {
      throw new Error("Carrier account config is required");
    }

    const { carrierId, credentialsEncrypted } = accountConfig;
    const AdapterClass = ADAPTER_MAP[carrierId];

    if (!AdapterClass) {
      throw new Error(`Unsupported carrier plugin: "${carrierId}". Available: ${Object.keys(ADAPTER_MAP).join(", ")}`);
    }

    let credentials = {};
    if (credentialsEncrypted) {
      try {
        credentials = decryptCredentials(credentialsEncrypted) || {};
      } catch (e) {
        console.warn(`[CarrierRegistry] Decryption failed for carrier ${carrierId}:`, e.message);
      }
    }

    return new AdapterClass({
      ...accountConfig,
      ...credentials
    });
  }

  /**
   * Get all available carrier identifiers
   */
  static getSupportedCarriers() {
    return Object.keys(ADAPTER_MAP);
  }
}
