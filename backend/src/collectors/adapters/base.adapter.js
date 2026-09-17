/**
 * Abstract Base Platform Adapter
 * All platform-specific adapters must extend this class and implement search().
 */

export class BaseAdapter {
  /**
   * @param {string} platformName Human-readable platform name (e.g. 'Amazon')
   * @param {string} storeId Canonical platform slug (e.g. 'amazon')
   */
  constructor(platformName, storeId) {
    if (new.target === BaseAdapter) {
      throw new TypeError('Cannot construct BaseAdapter instances directly; must be extended.');
    }
    this.platformName = platformName;
    this.storeId = storeId;
  }

  /**
   * Returns human-readable platform name
   */
  getPlatformName() {
    return this.platformName;
  }

  /**
   * Returns platform identifier
   */
  getStoreId() {
    return this.storeId;
  }

  /**
   * Search for product listings on this platform
   * @param {string} query Search term
   * @returns {Promise<Array<Object>>} Array of raw platform listing objects
   */
  async search(query) {
    throw new Error(`search(query) must be implemented by subclass '${this.constructor.name}'.`);
  }
}
