import zhCN from './zh-CN';
import { KEYS } from '@/constants/keys';
import { getStorage, setStorage } from '@/utils/storage';

const locales = {
  'zh-CN': zhCN,
};

function resolvePath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] != null ? acc[key] : null), obj);
}

function interpolate(value, params) {
  if (!params || typeof value !== 'string') return value;
  return Object.keys(params).reduce(
    (acc, key) => acc.replace(new RegExp(`\\{${key}\\}`, 'g'), params[key]),
    value
  );
}

export function getLocale() {
  return getStorage(KEYS.LOCALE_PREFERENCE, 'zh-CN');
}

export function setLocale(locale) {
  if (locales[locale]) setStorage(KEYS.LOCALE_PREFERENCE, locale);
}

export function t(key, paramsOrFallback = '', fallback = '') {
  const locale = getLocale();
  const dict = locales[locale] || locales['zh-CN'];
  const value = resolvePath(dict, key);
  const params =
    paramsOrFallback && typeof paramsOrFallback === 'object' ? paramsOrFallback : null;
  const resolvedFallback =
    typeof paramsOrFallback === 'string' || typeof paramsOrFallback === 'number'
      ? paramsOrFallback
      : fallback;
  if (value == null || value === '') return resolvedFallback || key;
  return interpolate(value, params);
}
