// src/permission.js
import { useAuthStore } from '@/store/auth';
import NProgress from 'nprogress';
import { watch } from 'vue';
import i18n, { translate } from './locales';
import { getLoginEnv } from '@/utils/env';

const isLoginPath = (p = '') => p === '/login' || p.startsWith('/login/');
const getFullPath = (loc) => {
  if (loc?.fullPath) return loc.fullPath;
  if (typeof window !== 'undefined') {
    const p = window.location.pathname + window.location.search + window.location.hash;
    return p || '/';
  }
  return '/';
};
const resolveRedirect = (loc) => {
  const full = getFullPath(loc);
  if (!full || full === '/' || isLoginPath(full)) return '/';
  return full;
};

function setTitle(meta) {
  const baseTitle = '联合东创';
  if (!meta) {
    document.title = baseTitle;
    return;
  }

  const isString = typeof meta === 'string';
  const titleKey = isString ? meta : meta.title;
  const fallback = isString ? meta : (meta.titleFallback ?? meta.title);
  const resolved = translate(titleKey, fallback);

  document.title = resolved ? `${resolved}` : baseTitle;
}
NProgress.configure({ showSpinner: false });

/** 无需登录可访问的路由（不要把 /login 放进来，否则已登录用户会停留在登录页） */
const publicviews = new Set(['/404', '/about']);

/** URL token 白名单（SSO 回跳等） */
const urlTokenWhiteList = new Set(['/login']);

/** 是否公开页面 */
const isPublic = (path) => publicviews.has(path);

/** 写 token（兼容老逻辑的“慢写入”场景） */
const syncSetToken = (token) =>
  new Promise((resolve) => {
    if (token) {
      const auth = useAuthStore();
      auth.setTokenPair?.({ accessToken: token });
    }
    setTimeout(resolve, 150);
  });

export function setupPermissionGuard(router) {
  if (!router) return;

  watch(
    () => i18n.global.locale.value,
    () => {
      const { meta } = router.currentRoute.value || {};
      setTitle(meta);
    }
  );

  setTitle(router.currentRoute.value?.meta);

  router.beforeEach(async (to, from, next) => {
    NProgress.start();
    setTitle(to.meta);

    const auth = useAuthStore();
    const token = auth.token;

    // 1) URL token 白名单：写入后直接放行
    if (urlTokenWhiteList.has(to.path)) {
      if (to.query?.token) {
        await syncSetToken(to.query.token);
      }
      NProgress.done();
      return next();
    }

    // 2) 显式公开页面
    const noAuth = to.meta?.requiresAuth === false || isPublic(to.path);
    if (noAuth) {
      NProgress.done();
      return next();
    }

    // 3) 需要鉴权但未登录 ⇒ 静默 or 普通登录
    if (!token) {
      // 避免已经在登录页时再次重定向导致循环
      if (!isLoginPath(to.path)) {
        NProgress.done();
        const redirectFromTo = resolveRedirect(to);
        const redirectFull = redirectFromTo === '/' ? resolveRedirect(from) : redirectFromTo;

        const env = getLoginEnv?.();
        const isWxEnv = env === 'WECHAT_MP' || env === 'WECHAT_ENTERPRISE';
        const silentLoginPath = '/login/social';
        const normalLoginPath = '/login';
        const targetPath = isWxEnv ? silentLoginPath : normalLoginPath;

        return next({ path: targetPath, query: { redirect: redirectFull } });
      }
      NProgress.done();
      return next();
    }

    // 4) 已登录访问 /login* ⇒ 回首页（避免登录页死循环）
    if (isLoginPath(to.path)) {
      NProgress.done();
      return next('/');
    }

    // 5) 正常放行
    NProgress.done();
    next();
  });

  router.afterEach(() => NProgress.done());
  router.onError(() => NProgress.done());
}
