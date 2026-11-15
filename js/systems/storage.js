/**
 * Safe LocalStorage Wrapper
 */
export class StorageManager {
  static get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn('LocalStorage get failed:', e);
      return defaultValue;
    }
  }

  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('LocalStorage set failed:', e);
      return false;
    }
  }

  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  }

  static clear() {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      return false;
    }
  }
}
