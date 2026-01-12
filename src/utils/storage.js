// src/utils/storage.js
export function getStorage(key, fallback = null) {
  try {
    const value = uni.getStorageSync(key);
    return value === '' || typeof value === 'undefined' ? fallback : value;
  } catch (err) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
}

export function setStorage(key, value) {
  try {
    uni.setStorageSync(key, value);
  } catch (err) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }
}

export function removeStorage(key) {
  try {
    uni.removeStorageSync(key);
  } catch (err) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}
