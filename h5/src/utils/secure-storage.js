// src/utils/secure-storage.js
import CryptoJS from 'crypto-js';

const APP_SECURE_KEY = import.meta.env.VITE_APP_SECURE_KEY || 'CHANGE_ME_32BYTES_KEY';
const IV = CryptoJS.enc.Utf8.parse('16BYTES_FIXED_IV'); // 16字节

function getKey32() {
  const s = String(APP_SECURE_KEY);
  return CryptoJS.enc.Utf8.parse(s.length >= 32 ? s.slice(0, 32) : s.padEnd(32, '0'));
}

export const secureStorage = {
  set(key, value) {
    try {
      const text = typeof value === 'string' ? value : JSON.stringify(value);
      const enc = CryptoJS.AES.encrypt(text, getKey32(), {
        iv: IV,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      localStorage.setItem(key, enc.toString());
    } catch {
      localStorage.setItem(key, JSON.stringify(value));
    }
  },
  get(key, fallback = null) {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try {
      const dec = CryptoJS.AES.decrypt(raw, getKey32(), {
        iv: IV,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      const text = dec.toString(CryptoJS.enc.Utf8);
      return JSON.parse(text);
    } catch {
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    }
  },
  remove(key) {
    localStorage.removeItem(key);
  },
};
