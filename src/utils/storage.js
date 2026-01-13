export const storage = {
  get(key, fallback = null) {
    try {
      const value = uni.getStorageSync(key);
      return value !== undefined && value !== '' ? value : fallback;
    } catch (err) {
      try {
        if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem(key);
          return raw ? JSON.parse(raw) : fallback;
        }
      } catch {
        return fallback;
      }
    }
    return fallback;
  },
  set(key, value) {
    try {
      uni.setStorageSync(key, value);
      return;
    } catch (err) {
      try {
        if (typeof localStorage !== 'undefined') {
          const payload = typeof value === 'string' ? value : JSON.stringify(value);
          localStorage.setItem(key, payload);
        }
      } catch {
        // ignore
      }
    }
  },
  remove(key) {
    try {
      uni.removeStorageSync(key);
      return;
    } catch (err) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        }
      } catch {
        // ignore
      }
    }
  },
};
