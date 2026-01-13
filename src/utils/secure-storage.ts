const APP_SECURE_KEY = import.meta.env.VITE_APP_SECURE_KEY || 'CHANGE_ME_32BYTES_KEY'

const storage = {
  getItem(key: string) {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key)
    }
    if (typeof uni !== 'undefined' && typeof uni.getStorageSync === 'function') {
      const value = uni.getStorageSync(key)
      return typeof value === 'string' ? value : JSON.stringify(value)
    }
    return null
  },
  setItem(key: string, value: string) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value)
      return
    }
    if (typeof uni !== 'undefined' && typeof uni.setStorageSync === 'function') {
      uni.setStorageSync(key, value)
    }
  },
  removeItem(key: string) {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key)
      return
    }
    if (typeof uni !== 'undefined' && typeof uni.removeStorageSync === 'function') {
      uni.removeStorageSync(key)
    }
  },
}

const encode = (text: string) => {
  const payload = `${APP_SECURE_KEY}:${encodeURIComponent(text)}`
  if (typeof btoa !== 'undefined') {
    return btoa(payload)
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(payload, 'utf-8').toString('base64')
  }
  return payload
}

const decode = (text: string) => {
  try {
    const decoded = typeof atob !== 'undefined'
      ? atob(text)
      : typeof Buffer !== 'undefined'
        ? Buffer.from(text, 'base64').toString('utf-8')
        : text
    const cleaned = decoded.replace(`${APP_SECURE_KEY}:`, '')
    return decodeURIComponent(cleaned)
  }
  catch {
    return text
  }
}

export const secureStorage = {
  set(key: string, value: unknown) {
    try {
      const text = typeof value === 'string' ? value : JSON.stringify(value)
      storage.setItem(key, encode(text))
    }
    catch {
      storage.setItem(key, JSON.stringify(value))
    }
  },
  get<T>(key: string, fallback: T | null = null) {
    const raw = storage.getItem(key)
    if (!raw) return fallback
    try {
      const text = decode(raw)
      return JSON.parse(text) as T
    }
    catch {
      try {
        return JSON.parse(raw) as T
      }
      catch {
        return raw as T
      }
    }
  },
  remove(key: string) {
    storage.removeItem(key)
  },
}
