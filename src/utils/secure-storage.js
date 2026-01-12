const safeStringify = (value) => {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value ?? '');
  }
};

const safeParse = (raw, fallback) => {
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

export const secureStorage = {
  set(key, value) {
    const text = safeStringify(value);
    uni.setStorageSync(key, text);
  },
  get(key, fallback = null) {
    const raw = uni.getStorageSync(key);
    if (!raw) return fallback;
    return safeParse(raw, fallback);
  },
  remove(key) {
    uni.removeStorageSync(key);
  },
};
