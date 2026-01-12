import axios from 'axios';
import { serialize, tansParams } from '@/utils/util';
import { getToken, removeToken, removeRefreshToken } from '@/utils/auth';
import { isURL, validatenull } from '@/utils/validate';
import website from '@/config/website';
import { Base64 } from 'js-base64';
import { baseUrl } from '@/config/env';
import crypto from '@/utils/crypto';
import { useAuthStore } from '@/store/auth';
import { translate } from '@/locales';

const isLoginPath = (p = '') => p.includes('/pages/login');

const getCurrentFullPath = () => {
  try {
    if (typeof getCurrentPages === 'function') {
      const pages = getCurrentPages();
      const cur = pages[pages.length - 1];
      if (cur?.route) {
        const query = cur.options || {};
        const search = Object.keys(query)
          .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
          .join('&');
        return `/${cur.route}${search ? `?${search}` : ''}`;
      }
    }
  } catch (err) {
    console.warn('[http] failed to read current route:', err);
  }
  if (typeof window !== 'undefined') {
    return window.location.pathname + window.location.search + window.location.hash;
  }
  return '/pages/index/index';
};

const resolveIntendedForRedirect = () => {
  const full = getCurrentFullPath();
  if (!full || full === '/' || isLoginPath(full)) return '/pages/index/index';
  return full;
};

const service = axios.create({
  timeout: 300000,
  withCredentials: true,
  validateStatus: (status) => status >= 200 && status <= 500,
});

const noBaseUrlPrefixList = ['/pdf-printing'];

const getSystemErrorMessage = () => translate('common.errors.system', '系统错误');
const getTokenExpiredMessage = () =>
  translate('common.errors.tokenExpired', '用户令牌过期，请重新登录');
const getNetworkErrorMessage = () => translate('common.errors.network', '网络异常');

function toastError(message, cfg) {
  if (cfg?.noErrorMsg) return;
  const resolvedMessage = message || getSystemErrorMessage();
  if (typeof uni !== 'undefined') {
    uni.showToast({
      title: resolvedMessage,
      icon: 'none',
      duration: 2000,
    });
  }
}

let isErrorShown = false;
let isRedirecting401 = false;

service.interceptors.request.use(
  (config) => {
    isErrorShown = false;

    if (
      !isURL(config.url) &&
      !config.url.startsWith(baseUrl) &&
      !noBaseUrlPrefixList.some((p) => config.url.startsWith(p))
    ) {
      config.url = baseUrl + config.url;
    }

    config.headers['Blade-Requested-With'] = 'BladeHttpRequest';

    const authorization = config.authorization === false;
    if (!authorization) {
      config.headers['Authorization'] = `Basic ${Base64.encode(
        `${website.clientId}:${website.clientSecret}`
      )}`;
    }

    const isProd = ['test', 'production'].includes(import.meta.env.VITE_APP_ENV);
    if (!isProd) config.headers['X-Dev-ID'] = '6176';

    const meta = config.meta || {};
    const isToken = meta.isToken === false;
    const cryptoToken = config.cryptoToken === true;
    const token = getToken();
    if (token && !isToken) {
      config.headers[website.tokenHeader] = cryptoToken
        ? 'crypto ' + crypto.encryptAES(token, crypto.cryptoKey)
        : 'bearer ' + token;
    }

    const cryptoData = config.cryptoData === true;
    if (cryptoData) {
      if (config.params) {
        const data = crypto.encryptAES(JSON.stringify(config.params), crypto.aesKey);
        config.params = { data };
      }
      if (config.data) {
        config.text = true;
        config.data = crypto.encryptAES(JSON.stringify(config.data), crypto.aesKey);
      }
    }

    if (config.text === true) {
      config.headers['Content-Type'] = 'text/plain';
    }

    if (config.method === 'post' && meta.isSerialize === true) {
      config.data = serialize(config.data);
    }

    if (config?.params) {
      const sep = config.url.includes('?') ? '&' : '?';
      config.url += sep + tansParams(config.params);
      delete config.params;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

service.interceptors.response.use(
  async (res) => {
    const status = res.data?.error_code ?? res.data?.code ?? res.status;
    const statusWhiteList = website.statusWhiteList || [];
    const message = res.data?.msg || res.data?.error_description || getSystemErrorMessage();
    const config = res.config;
    const cryptoData = config.cryptoData === true;

    if (statusWhiteList.includes(status)) return Promise.reject(res);

    if (status === 401) {
      if (config?.meta?.ignoreAuthRedirect) {
        return Promise.reject(res);
      }

      if (!config._retried) {
        config._retried = true;
        try {
          const auth = useAuthStore();
          await auth.refresh();
          return service(config);
        } catch (e) {
          if (!isErrorShown) {
            isErrorShown = true;
            toastError(getTokenExpiredMessage(), res.config);
          }
          const auth = useAuthStore();
          auth.logout?.();
          removeToken();
          removeRefreshToken();

          if (!isRedirecting401) {
            isRedirecting401 = true;
            try {
              const intended = resolveIntendedForRedirect();
              if (!isLoginPath(intended)) {
                uni.reLaunch({
                  url: `/pages/login/index?redirect=${encodeURIComponent(intended)}`,
                });
              }
            } finally {
              setTimeout(() => (isRedirecting401 = false), 200);
            }
          }

          return Promise.reject(new Error(message));
        }
      }

      if (!isErrorShown) {
        isErrorShown = true;
        toastError(getTokenExpiredMessage(), res.config);
      }
      const auth = useAuthStore();
      auth.logout?.();
      removeToken();
      removeRefreshToken();

      if (!isRedirecting401) {
        isRedirecting401 = true;
        try {
          const intended = resolveIntendedForRedirect();
          if (!isLoginPath(intended)) {
            uni.reLaunch({
              url: `/pages/login/index?redirect=${encodeURIComponent(intended)}`,
            });
          }
        } finally {
          setTimeout(() => (isRedirecting401 = false), 200);
        }
      }

      return Promise.reject(new Error(message));
    }

    if (status > 2000 && !validatenull(res.data?.error_description)) {
      if (!isErrorShown) {
        isErrorShown = true;
        toastError(message, res.config);
      }
      return Promise.reject(new Error(message));
    }

    if (status !== 200) {
      toastError(message, res.config);
      return Promise.reject(new Error(message));
    }

    if (cryptoData) {
      res.data = JSON.parse(crypto.decryptAES(res.data, crypto.aesKey));
    }

    return res;
  },
  (error) => {
    toastError(error?.message || getNetworkErrorMessage());
    return Promise.reject(new Error(error));
  }
);

function request(config) {
  return service(config);
}

request.get = (url, cfg) => service.get(url, cfg);
request.post = (url, data, cfg) => service.post(url, data, cfg);
request.put = (url, data, cfg) => service.put(url, data, cfg);
request.delete = (url, cfg) => service.delete(url, cfg);

export default request;
export { service as http, request };
