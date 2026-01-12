import { createI18n } from 'vue-i18n';
import { Locale as VantLocale } from 'vant';
import vantZhCN from 'vant/es/locale/lang/zh-CN';
import vantEnUS from 'vant/es/locale/lang/en-US';
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

const vantMessages = {
  'zh-CN': vantZhCN,
  'en-US': vantEnUS,
  'vi-VN': vantEnUS,
};

const LOCALE_STORAGE_KEY = KEYS.LOCALE_PREFERENCE;

function readStoredLocale() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage?.getItem(LOCALE_STORAGE_KEY);
    if (stored && Object.prototype.hasOwnProperty.call(messages, stored)) {
      return stored;
    }
  } catch (_err) {
    // 忽略 storage 读取异常
  }
  return null;
}

function detectBrowserLocale() {
  if (typeof navigator === 'undefined') return null;
  const language = navigator.language || navigator.userLanguage;
  if (!language) return null;
  const normalized = language.toLowerCase();
  if (normalized.startsWith('zh')) return 'zh-CN';
  if (normalized.startsWith('en')) return 'en-US';
  if (normalized.startsWith('vi')) return 'vi-VN';
  return null;
}

const initialLocale = readStoredLocale() || detectBrowserLocale() || defaultLocale;

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: initialLocale,
  fallbackLocale: defaultLocale,
  messages,
});

function applyVantLocale(locale) {
  const targetLocale = vantMessages[locale];
  if (targetLocale) {
    VantLocale.use(locale, targetLocale);
  }
}

applyVantLocale(initialLocale);

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
  applyVantLocale(nextLocale);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage?.setItem(LOCALE_STORAGE_KEY, nextLocale);
  } catch (_err) {
      // 忽略 storage 写入异常
    }
  }
}

export { LOCALE_STORAGE_KEY };

export default i18n;
