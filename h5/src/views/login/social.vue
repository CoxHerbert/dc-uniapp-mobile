<!-- src/pages/login/social.vue -->
<template>
  <div class="login-page">
    <!-- 顶部品牌区 -->
    <div class="hero">
      <div class="brand">
        <img class="logo" :src="logoUrl" alt="logo" />
        <div class="meta">
          <h1>{{ t('login.social.title') }}</h1>
          <p class="sub">{{ t('login.social.subtitle') }}</p>
        </div>
      </div>
    </div>

    <!-- 内容卡片 -->
    <div class="card">
      <div class="body">
        <div class="wx-social-page">
          <!-- 正常 loading -->
          <div v-if="pageState === 'loading'" class="card loading-box">
            <van-loading size="20px" style="margin-right: 8px" />
            <span>{{ t('login.social.loading') }}</span>
          </div>

          <!-- 失败兜底 -->
          <div v-else class="fallback">
            <div class="fallback-title">
              {{ t('login.social.fallbackTitle') || '登录失败' }}
            </div>
            <div class="fallback-desc">
              {{
                errorText ||
                t('login.social.fallbackDesc') ||
                '无法完成第三方登录，你可以使用账号密码登录。'
              }}
            </div>

            <div class="fallback-actions">
              <van-button type="primary" block @click="goAccountLogin">
                {{ t('login.social.goAccountLogin') || '前往账号密码登录' }}
              </van-button>

              <van-button plain block style="margin-top: 10px" @click="retry">
                {{ t('login.social.retry') || '重试' }}
              </van-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { useUserStore } from '@/store/user';
import { getLoginEnv } from '@/utils/env.js';
import { getCallbackUrl } from '@/utils/callback-url';
import Api from '@/api';
import { useI18n } from 'vue-i18n';
import { extractLoginInfo } from '@/utils/login-info';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const user = useUserStore();
const { t } = useI18n();

const _env = {
  WECHAT_MP: 'wechat_open',
  WECHAT_ENTERPRISE: 'wechat_enterprise',
};
const env = _env[getLoginEnv()] || null; // wechat_open / wechat_enterprise / 其它

/** 视觉用：logo 路径（兼容二级目录） */
const logoUrl = `${import.meta.env.BASE_URL}images/logo.png`;

/** 页面状态：loading / error */
const pageState = ref('loading');
const errorText = ref('');

onMounted(async () => {
  pageState.value = 'loading';
  errorText.value = '';
  try {
    // 读取 code / state
    const sp = new URLSearchParams(window.location.search || '');
    const code = sp.get('code');
    const state = sp.get('state');

    if (code && state) {
      // 已回跳，携带 code/state，直接走登录
      await loginBySocial({
        tenantId: '000000',
        source: env,
        code,
        state,
        callbackUrl: readCallbackFromUrl() || getCallbackUrl({ route }) || '/',
      });
    } else {
      // 未授权，先去授权
      await authorize();
    }
  } catch (err) {
    console.error('[social] onMounted error:', err);
    setFail(err);
  }
});

/** 设置失败态 + 展示提示 */
function setFail(err) {
  pageState.value = 'error';
  const msg =
    err?.message ||
    err?.msg ||
    err?.error_description ||
    t('login.social.errors.generic') ||
    '登录失败，请使用账号密码登录';
  errorText.value = String(msg);
}

/** 从当前地址 query 中取 callbackUrl（优先原始 query，次之工具函数） */
function readCallbackFromUrl() {
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get('callbackUrl');
  } catch {
    return null;
  }
}

/** 去后端换取第三方授权地址并跳转 */
async function authorize() {
  const origin = window.location.origin;
  const href = window.location.href;

  // 授权回跳地址：当前页 + callbackUrl=当前完整地址
  const redirectUrl = `${origin}${import.meta.env.BASE_URL}login/social?callbackUrl=${encodeURIComponent(
    href
  )}`;

  const res = await Api.auth.authorize({
    redirectUrl,
    type: env,
  });

  // 容错多种返回结构
  const payload = res?.data ?? res;
  const url = payload?.data || payload?.url || payload;

  if (typeof url === 'string' && url) {
    window.location.href = url;
  } else {
    throw new Error(t('login.social.errors.missingRedirect') || '未获取到授权跳转地址');
  }
}

/** 后端用 code/state 换 token，写入 Pinia，并按 callbackUrl 跳转 */
async function loginBySocial(data) {
  const res = await Api.auth.loginBySocial(data);
  const payload = res?.data ?? res;
  const loginInfo = extractLoginInfo(payload);

  const accessToken =
    payload?.access_token || payload?.accessToken || payload?.token || payload?.data?.access_token;

  const refreshToken =
    payload?.refresh_token || payload?.refreshToken || payload?.data?.refresh_token;

  if (!accessToken) {
    const msg =
      payload?.error_description ||
      payload?.msg ||
      t('login.social.errors.missingToken') ||
      '未获取到登录凭证';
    console.error('[social] loginBySocial error:', msg, payload);
    throw new Error(msg);
  }

  // 1) 写入 Token（Pinia）
  auth.setTokenPair({ accessToken, refreshToken });

  // 2) 特例：若后端提示“未建档用户且微信开放平台”，按旧逻辑先建档再走回调
  const userId = String(payload?.user_id ?? '');
  const oauthId = payload?.oauth_id;

  // 注意：这里原代码 env === 'WECHAT_MP' 永远不会成立（env 是 wechat_open/wechat_enterprise）
  // 我保持你原意：对 wechat_open 做特例处理
  if ((userId === 'null' || userId === '') && env === 'wechat_open' && oauthId) {
    user.mergeLoginInfo(loginInfo);
    await createUserThenRedirect(oauthId);
    return;
  }

  // 3) 拉取用户信息（Pinia）
  try {
    await user.fetchUserInfo();
  } catch (e) {
    console.warn('[social] fetchUserInfo failed:', e);
  }

  user.mergeLoginInfo(loginInfo);

  // 4) 回跳逻辑：先外层 redirect，再 callbackUrl 内层 redirect，最后兜底 /home
  const OUTER = new URL(window.location.href);
  const outerRedirect = OUTER.searchParams.get('redirect') || '';
  const callbackUrlRaw = OUTER.searchParams.get('callbackUrl') || '';

  function sanitizeRedirect(p) {
    if (!p) return '';
    // 绝对 URL：只允许同源
    if (/^https?:\/\//i.test(p)) {
      try {
        const u = new URL(p);
        if (u.origin !== window.location.origin) return '';
        p = u.pathname + u.search + u.hash;
      } catch (err) {
        console.warn('[social] invalid absolute redirect:', p, err);
        return '';
      }
    }
    // 相对路径：必须是站内
    if (!p.startsWith('/')) return '';
    // 禁止回到登录页
    if (p === '/login' || p.startsWith('/login/')) return '';
    return p || '';
  }

  let redirect = sanitizeRedirect(outerRedirect);

  if (!redirect && callbackUrlRaw) {
    // callbackUrl 里再解析一层 redirect
    let decoded = callbackUrlRaw;
    try {
      decoded = decodeURIComponent(callbackUrlRaw);
    } catch (err) {
      console.warn('[social] failed to decode callbackUrl:', callbackUrlRaw, err);
    }
    try {
      const innerURL = new URL(decoded, window.location.origin);
      const innerRedirect = innerURL.searchParams.get('redirect') || '';
      redirect = sanitizeRedirect(innerRedirect);
    } catch (e) {
      console.warn('[social] invalid callbackUrl:', callbackUrlRaw, e);
    }
  }

  if (redirect) {
    router.push({ path: redirect });
  } else {
    router.push({ path: '/home' });
  }
}

/** 未建档用户：用 oauthId 建档后再回跳 */
async function createUserThenRedirect(oauthId) {
  const res = await Api.user.talentRegister({ oauthId });
  const { code } = res.data;

  if (code !== 200) {
    console.error('[social] userCreate failed:', res);
    throw new Error(t('login.social.errors.initAccount') || '初始化账号失败');
  }

  try {
    const id = res?.data?.data?.id || res?.data?.id || res?.id;
    if (id) {
      const next = { ...(user.userInfo || {}), id };
      user.setUserInfo(next);
    }
  } catch (err) {
    console.warn('[social] failed to persist user info after init:', err);
  }

  // 建档成功后，通常可以回到主页或走既定 redirect
  // 这里沿用 loginBySocial 的跳转策略：简单回 /home
  router.push({ path: '/home' });
}

/** 跳转账号密码登录（尽量保留 redirect） */
function goAccountLogin() {
  const OUTER = new URL(window.location.href);
  const outerRedirect = OUTER.searchParams.get('redirect') || '';
  const callbackUrlRaw = OUTER.searchParams.get('callbackUrl') || '';

  function sanitizeRedirect(p) {
    if (!p) return '';
    if (/^https?:\/\//i.test(p)) {
      try {
        const u = new URL(p);
        if (u.origin !== window.location.origin) return '';
        p = u.pathname + u.search + u.hash;
      } catch {
        return '';
      }
    }
    if (!p.startsWith('/')) return '';
    // 禁止回到登录页（改为 /login/account）
    if (p === '/login/account' || p.startsWith('/login/')) return '';
    return p || '';
  }

  let redirect = sanitizeRedirect(outerRedirect);

  if (!redirect && callbackUrlRaw) {
    let decoded = callbackUrlRaw;
    try {
      decoded = decodeURIComponent(callbackUrlRaw);
    } catch {}
    try {
      const innerURL = new URL(decoded, window.location.origin);
      const innerRedirect = innerURL.searchParams.get('redirect') || '';
      redirect = sanitizeRedirect(innerRedirect);
    } catch {}
  }

  if (redirect) {
    router.replace({ path: '/login/account', query: { redirect } });
  } else {
    router.replace({ path: '/login/account' });
  }
}

/** 重试：重新走 mounted 流程（刷新当前页最稳） */
function retry() {
  window.location.reload();
}
</script>

<style scoped>
/* ===== 页面外壳（与 AccountLogin 保持一致） ===== */
.login-page {
  min-height: 100vh;
  background:
    radial-gradient(1200px 500px at 90% -20%, rgba(64, 158, 255, 0.25), transparent 50%),
    radial-gradient(800px 400px at -10% 10%, rgba(64, 158, 255, 0.15), transparent 50%),
    linear-gradient(180deg, #f7fbff 0%, #f8fafc 20%, #ffffff 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36px 14px;
  box-sizing: border-box;
}
.hero {
  width: min(960px, 92%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px 0 8px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.logo {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #fff;
  display: grid;
  place-items: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}
.meta h1 {
  margin: 0;
  font-size: 20px;
  color: #0f172a;
}
.sub {
  margin: 2px 0 0;
  color: #64748b;
  font-size: 13px;
}

.card {
  width: min(960px, 92%);
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 20px 60px rgba(2, 6, 23, 0.08);
  overflow: hidden;
}
.body {
  min-height: 200px;
}

/* ===== social 页面自身的内容区 ===== */
.wx-social-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  padding: 20px 16px;
}
.loading-box {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  color: #333;
  background: #fff;
  box-shadow: none;
  border-radius: 8px;
  padding: 6px 8px;
}

/* ===== 失败兜底 UI ===== */
.fallback {
  width: min(420px, 92%);
  text-align: center;
}
.fallback-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}
.fallback-desc {
  margin-top: 8px;
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
}
.fallback-actions {
  margin-top: 14px;
}
</style>
