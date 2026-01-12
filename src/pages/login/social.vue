<template>
  <view class="login-page">
    <view class="hero">
      <view class="brand">
        <image class="logo" :src="logoUrl" mode="aspectFit" />
        <view class="meta">
          <text class="title">{{ t('login.social.title') }}</text>
          <text class="sub">{{ t('login.social.subtitle') }}</text>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="body">
        <view class="wx-social-page">
          <view v-if="pageState === 'loading'" class="card loading-box">
            <text class="loading-text">{{ t('login.social.loading') }}</text>
          </view>

          <view v-else class="fallback">
            <text class="fallback-title">
              {{ t('login.social.fallbackTitle') || '登录失败' }}
            </text>
            <text class="fallback-desc">
              {{
                errorText ||
                t('login.social.fallbackDesc') ||
                '无法完成第三方登录，你可以使用账号密码登录。'
              }}
            </text>

            <view class="fallback-actions">
              <wd-button type="primary" block @click="goAccountLogin">
                {{ t('login.social.goAccountLogin') || '前往账号密码登录' }}
              </wd-button>

              <wd-button block plain style="margin-top: 10px" @click="retry">
                {{ t('login.social.retry') || '重试' }}
              </wd-button>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useAuthStore } from '@/store/auth';
import { useUserStore } from '@/store/user';
import { getLoginEnv } from '@/utils/env.js';
import { getCallbackUrl } from '@/utils/callback-url';
import Api from '@/api';
import { useI18n } from 'vue-i18n';
import { extractLoginInfo } from '@/utils/login-info';

const auth = useAuthStore();
const user = useUserStore();
const { t } = useI18n();

const envMap = {
  WECHAT_MP: 'wechat_open',
  WECHAT_ENTERPRISE: 'wechat_enterprise',
};
const env = envMap[getLoginEnv()] || null;

const logoUrl = '/static/logo.png';

const pageState = ref('loading');
const errorText = ref('');
const pageOptions = ref({});

onLoad(async (options) => {
  pageOptions.value = options || {};
  pageState.value = 'loading';
  errorText.value = '';
  try {
    const code = readParam('code');
    const state = readParam('state');

    if (code && state) {
      await loginBySocial({
        tenantId: '000000',
        source: env,
        code,
        state,
        callbackUrl: readCallbackFromUrl() || getCallbackUrl({ query: pageOptions.value }) || '/',
      });
    } else {
      await authorize();
    }
  } catch (err) {
    console.error('[social] onLoad error:', err);
    setFail(err);
  }
});

function readParam(key) {
  if (pageOptions.value?.[key]) return pageOptions.value[key];
  if (typeof window !== 'undefined') {
    try {
      return new URL(window.location.href).searchParams.get(key);
    } catch {
      return '';
    }
  }
  return '';
}

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

function readCallbackFromUrl() {
  if (typeof window === 'undefined') return null;
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get('callbackUrl');
  } catch {
    return null;
  }
}

async function authorize() {
  if (typeof window === 'undefined') {
    throw new Error(t('login.social.errors.missingRedirect') || '未获取到授权跳转地址');
  }
  const origin = window.location.origin;
  const href = window.location.href;

  const redirectUrl = `${origin}${import.meta.env.BASE_URL}login/social?callbackUrl=${encodeURIComponent(
    href
  )}`;

  const res = await Api.auth.authorize({
    redirectUrl,
    type: env,
  });

  const payload = res?.data ?? res;
  const url = payload?.data || payload?.url || payload;

  if (typeof url === 'string' && url) {
    window.location.href = url;
  } else {
    throw new Error(t('login.social.errors.missingRedirect') || '未获取到授权跳转地址');
  }
}

async function loginBySocial(data) {
  const res = await Api.auth.loginBySocial(data);
  const payload = res?.data ?? res;
  const loginInfo = extractLoginInfo(payload);

  const accessToken =
    payload?.access_token || payload?.accessToken || payload?.token || payload?.data?.access_token;

  const refreshToken = payload?.refresh_token || payload?.refreshToken || payload?.data?.refresh_token;

  if (!accessToken) {
    const msg =
      payload?.error_description ||
      payload?.msg ||
      t('login.social.errors.missingToken') ||
      '未获取到登录凭证';
    console.error('[social] loginBySocial error:', msg, payload);
    throw new Error(msg);
  }

  auth.setTokenPair({ accessToken, refreshToken });

  const userId = String(payload?.user_id ?? '');
  const oauthId = payload?.oauth_id;

  if ((userId === 'null' || userId === '') && env === 'wechat_open' && oauthId) {
    user.mergeLoginInfo(loginInfo);
    await createUserThenRedirect(oauthId);
    return;
  }

  try {
    await user.fetchUserInfo();
  } catch (e) {
    console.warn('[social] fetchUserInfo failed:', e);
  }

  user.mergeLoginInfo(loginInfo);

  const redirect = sanitizeRedirect(readParam('redirect'));
  if (redirect) {
    uni.reLaunch({ url: redirect });
  } else {
    uni.reLaunch({ url: '/pages/index/index' });
  }
}

async function createUserThenRedirect(oauthId) {
  const res = await Api.user.talentRegister({ oauthId });
  const { code } = res.data || {};

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

  uni.reLaunch({ url: '/pages/index/index' });
}

function sanitizeRedirect(p) {
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return '';
  if (!p.startsWith('/')) return '';
  if (p.includes('/pages/login')) return '';
  return p;
}

function goAccountLogin() {
  const redirect = sanitizeRedirect(readParam('redirect'));
  const target = redirect
    ? `/pages/login/index?redirect=${encodeURIComponent(redirect)}`
    : '/pages/login/index';
  uni.redirectTo({ url: target });
}

function retry() {
  if (typeof window !== 'undefined') {
    window.location.reload();
    return;
  }
  uni.redirectTo({ url: '/pages/login/social' });
}
</script>

<style scoped>
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
  width: 92%;
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
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.meta {
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 20px;
  color: #0f172a;
}

.sub {
  margin-top: 2px;
  color: #64748b;
  font-size: 13px;
}

.card {
  width: 92%;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 20px 60px rgba(2, 6, 23, 0.08);
  overflow: hidden;
}

.body {
  min-height: 200px;
}

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
  border-radius: 8px;
  padding: 6px 8px;
}

.fallback {
  width: 92%;
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
