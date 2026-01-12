// src/utils/http.js
import axios from 'axios';
import router from '@/router';
import { serialize, tansParams } from '@/utils/util';
import { getToken, removeToken, removeRefreshToken } from '@/utils/auth';
import { isURL, validatenull } from '@/utils/validate';
import website from '@/config/website';
import NProgress from 'nprogress';
import { Base64 } from 'js-base64';
import { baseUrl } from '@/config/env';
import crypto from '@/utils/crypto';
import { showToast } from 'vant';
import { useAuthStore } from '@/store/auth';
import { translate } from '@/locales';

// 与路由守卫共享：登录路径与回跳地址处理
const isLoginPath = (p = '') => p === '/login' || p.startsWith('/login/');
const getIntendedFullPath = (routerInstance) => {
  const cur = routerInstance?.currentRoute?.value;
  if (cur?.fullPath) return cur.fullPath;
  if (typeof window !== 'undefined') {
    const p = window.location.pathname + window.location.search + window.location.hash;
    return p || '/';
  }
  return '/';
};
const resolveIntendedForRedirect = (routerInstance) => {
  const full = getIntendedFullPath(routerInstance);
  if (!full || full === '/' || isLoginPath(full)) return '/';
  return full;
};

// ----------------- axios 实例 -----------------
const service = axios.create({
  timeout: 300000,
  withCredentials: true,
  validateStatus: (status) => status >= 200 && status <= 500,
});

NProgress.configure({ showSpinner: false });

// 不拼接 baseUrl 的白名单前缀
const noBaseUrlPrefixList = ['/pdf-printing'];

// 统一错误提示（遵守 noErrorMsg）
const getSystemErrorMessage = () => translate('common.errors.system', '系统错误');
const getTokenExpiredMessage = () =>
  translate('common.errors.tokenExpired', '用户令牌过期，请重新登录');
const getNetworkErrorMessage = () => translate('common.errors.network', '网络异常');

function toastError(message, cfg) {
  if (cfg?.noErrorMsg) return;
  const resolvedMessage = message || getSystemErrorMessage();
  showToast({ message: resolvedMessage, type: 'fail', duration: 20000 });
}

// 全局只提示一次未授权
let isErrorShown = false;
// 并发 401 导航去重
let isRedirecting401 = false;

// ----------------- request 拦截 -----------------
service.interceptors.request.use(
  (config) => {
    NProgress.start();
    isErrorShown = false;

    // 1) baseUrl
    if (
      !isURL(config.url) &&
      !config.url.startsWith(baseUrl) &&
      !noBaseUrlPrefixList.some((p) => config.url.startsWith(p))
    ) {
      config.url = baseUrl + config.url;
    } else {
      config.url = config.url;
    }

    // 2) 标准头
    config.headers['Blade-Requested-With'] = 'BladeHttpRequest';

    // 3) Basic（除非显式关闭）
    const authorization = config.authorization === false;
    if (!authorization) {
      config.headers['Authorization'] = `Basic ${Base64.encode(
        `${website.clientId}:${website.clientSecret}`
      )}`;
    }

    // 4) Dev 头
    const isProd = ['test', 'production'].includes(import.meta.env.VITE_APP_ENV);
    if (!isProd) config.headers['X-Dev-ID'] = '6176';

    // 5) Token（尊重 meta.isToken === false 与 cryptoToken）
    const meta = config.meta || {};
    const isToken = meta.isToken === false;
    const cryptoToken = config.cryptoToken === true;
    const token = getToken();
    if (token && !isToken) {
      config.headers[website.tokenHeader] = cryptoToken
        ? 'crypto ' + crypto.encryptAES(token, crypto.cryptoKey)
        : 'bearer ' + token;
    }

    // 6) 报文加密
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

    // 7) text/plain
    if (config.text === true) {
      config.headers['Content-Type'] = 'text/plain';
    }

    // 8) form 序列化
    if (config.method === 'post' && meta.isSerialize === true) {
      config.data = serialize(config.data);
    }

    // 9) 扁平化 params → url
    if (config?.params) {
      const sep = config.url.includes('?') ? '&' : '?';
      config.url += sep + tansParams(config.params);
      delete config.params;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ----------------- response 拦截（刷新 & 导航） -----------------
service.interceptors.response.use(
  async (res) => {
    NProgress.done();

    const status = res.data?.error_code ?? res.data?.code ?? res.status;
    const statusWhiteList = website.statusWhiteList || [];
    const message = res.data?.msg || res.data?.error_description || getSystemErrorMessage();
    const config = res.config;
    const cryptoData = config.cryptoData === true;

    // 白名单：交给业务 catch
    if (statusWhiteList.includes(status)) return Promise.reject(res);

    // === 401：refresh → 重试；失败则带 redirect 去登录/静默 ===
    if (status === 401) {
      // 某些请求不需要跳转登录
      if (config?.meta?.ignoreAuthRedirect) {
        return Promise.reject(res);
      }

      if (!config._retried) {
        config._retried = true;
        try {
          const auth = useAuthStore();
          await auth.refresh(); // 刷新成功
          return service(config); // 用当前实例重试
        } catch (e) {
          // 刷新失败 → 统一登出 & 导航
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
              const cur = router.currentRoute.value;
              const intended = resolveIntendedForRedirect(router); // 还原真实入口

              if (!isLoginPath(cur?.path)) {
                await router.replace({ path: '/login', query: { redirect: intended } });
              }
            } finally {
              setTimeout(() => (isRedirecting401 = false), 200);
            }
          }

          return Promise.reject(new Error(message));
        }
      }

      // 已重试过仍 401
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
          const cur = router.currentRoute.value;
          const intended = resolveIntendedForRedirect(router);

          if (!isLoginPath(cur?.path)) {
            await router.replace({ path: '/login', query: { redirect: intended } });
          }
        } finally {
          setTimeout(() => (isRedirecting401 = false), 200);
        }
      }

      return Promise.reject(new Error(message));
    }

    // oauth2 错误
    if (status > 2000 && !validatenull(res.data?.error_description)) {
      if (!isErrorShown) {
        isErrorShown = true;
        toastError(message, res.config);
      }
      return Promise.reject(new Error(message));
    }

    // 非 200
    if (status !== 200) {
      toastError(message, res.config);
      return Promise.reject(new Error(message));
    }

    // 解密响应体
    if (cryptoData) {
      res.data = JSON.parse(crypto.decryptAES(res.data, crypto.aesKey));
    }

    return res;
  },
  (error) => {
    NProgress.done();
    toastError(error?.message || getNetworkErrorMessage());
    return Promise.reject(new Error(error));
  }
);

// ----------------- 导出：保持原有“request(config)”写法 -----------------
function request(config) {
  return service(config);
}

// （可选）也暴露 get/post 便于少数场景使用
request.get = (url, cfg) => service.get(url, cfg);
request.post = (url, data, cfg) => service.post(url, data, cfg);
request.put = (url, data, cfg) => service.put(url, data, cfg);
request.delete = (url, cfg) => service.delete(url, cfg);

export default request;
export { service as http, request };
