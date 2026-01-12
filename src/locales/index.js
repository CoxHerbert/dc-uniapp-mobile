import { createI18n } from 'vue-i18n';
import { KEYS } from '@/constants/keys';
import zhCN from './zh-CN';
import enUS from './en-US';
import viVN from './vi-VN';

const defaultLocale = 'zh-CN';
const messages = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'vi-VN': viVN,
};

const LOCALE_STORAGE_KEY = KEYS.LOCALE_PREFERENCE;

function readStoredLocale() {
  try {
    const stored = uni.getStorageSync(LOCALE_STORAGE_KEY);
    if (stored && Object.prototype.hasOwnProperty.call(messages, stored)) {
      return stored;
    }
  } catch {
    // ignore
  }
  return null;
}

function detectSystemLocale() {
  try {
    const language = uni.getSystemInfoSync().language;
    if (!language) return null;
    const normalized = language.toLowerCase();
    if (normalized.startsWith('zh')) return 'zh-CN';
    if (normalized.startsWith('en')) return 'en-US';
    if (normalized.startsWith('vi')) return 'vi-VN';
  } catch {
    // ignore
  }
  return null;
}

const initialLocale = readStoredLocale() || detectSystemLocale() || defaultLocale;

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: initialLocale,
  fallbackLocale: defaultLocale,
  messages,
});

export function translate(key, fallback = '', values) {
  if (!key) return fallback;
  const t = i18n.global?.t;
  if (typeof t !== 'function') {
    return fallback || key;
  }
  const translated = t(key, values);
  if (translated === key) {
    return fallback || key;
  }
  return translated;
}

export function changeLocale(nextLocale) {
  if (!nextLocale || !Object.prototype.hasOwnProperty.call(messages, nextLocale)) {
    return;
  }
  i18n.global.locale.value = nextLocale;
  try {
    uni.setStorageSync(LOCALE_STORAGE_KEY, nextLocale);
  } catch {
    // ignore
  }
}

export { LOCALE_STORAGE_KEY };

export default i18n;
