/**
 * Simple in-memory cache for prediction results.
 * Keys are string identifiers (e.g., hash of image buffer).
 * Values are the prediction JSON.
 */
class SimpleCache {
  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries;
    this.map = new Map();
  }
  _ensureSize() {
    while (this.map.size > this.maxEntries) {
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
    }
  }
  set(key, value) {
    this.map.set(key, value);
    this._ensureSize();
  }
  get(key) {
    return this.map.get(key);
  }
  has(key) {
    return this.map.has(key);
  }
}
module.exports = new SimpleCache();
