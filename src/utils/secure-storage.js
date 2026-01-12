import CryptoJS from 'crypto-js';
import { storage } from '@/utils/storage';

const APP_SECURE_KEY = import.meta.env.VITE_APP_SECURE_KEY || 'CHANGE_ME_32BYTES_KEY';
const IV = CryptoJS.enc.Utf8.parse('16BYTES_FIXED_IV');

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
      storage.set(key, enc.toString());
    } catch {
      storage.set(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  },
  get(key, fallback = null) {
    const raw = storage.get(key);
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
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch {
        return raw;
      }
    }
  },
  remove(key) {
    storage.remove(key);
  },
};
