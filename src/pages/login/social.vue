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
        <view v-if="pageState === 'loading'" class="loading-box">
          <text>{{ t('login.social.loading') }}</text>
        </view>
        <view v-else class="fallback">
          <text class="fallback-title">{{ t('login.social.fallbackTitle') }}</text>
          <text class="fallback-desc">
            {{ errorText || t('login.social.fallbackDesc') }}
          </text>
          <view class="fallback-actions">
            <button class="primary" @tap="goAccountLogin">
              {{ t('login.social.goAccountLogin') }}
            </button>
            <button class="ghost" @tap="retry">
              {{ t('login.social.retry') }}
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import authStore from '@/store/auth';
import userStore from '@/store/user';
import Api from '@/api';
import { getLoginEnv } from '@/utils/env';
import { extractLoginInfo } from '@/utils/login-info';
import { t } from '@/locales';

export default {
  data() {
    return {
      logoUrl: '/static/logo.png',
      pageState: 'loading',
      errorText: '',
      redirect: '',
      callbackUrl: '',
    };
  },
  onLoad(options) {
    this.redirect = options?.redirect || '';
    this.callbackUrl = options?.callbackUrl || '';
    this.bootstrap(options);
  },
  methods: {
    t,
    async bootstrap(options) {
      this.pageState = 'loading';
      this.errorText = '';
      try {
        const code = options?.code || '';
        const state = options?.state || '';
        if (code && state) {
          await this.loginBySocial({
            tenantId: '000000',
            source: this.resolveEnv(),
            code,
            state,
            callbackUrl: this.callbackUrl || '/',
          });
        } else {
          await this.authorize();
        }
      } catch (err) {
        console.error('[social] bootstrap error:', err);
        this.setFail(err);
      }
    },
    resolveEnv() {
      const map = {
        WECHAT_MP: 'wechat_open',
        WECHAT_ENTERPRISE: 'wechat_enterprise',
      };
      return map[getLoginEnv()] || null;
    },
    setFail(err) {
      this.pageState = 'error';
      const msg =
        err?.message ||
        err?.msg ||
        err?.error_description ||
        t('login.social.errors.generic') ||
        '登录失败，请使用账号密码登录';
      this.errorText = String(msg);
    },
    async authorize() {
      if (typeof window === 'undefined') {
        throw new Error(t('login.social.errors.missingRedirect'));
      }
      const origin = window.location.origin;
      const href = window.location.href;
      const redirectUrl = `${origin}/#/pages/login/social?callbackUrl=${encodeURIComponent(href)}`;
      const res = await Api.auth.authorize({
        redirectUrl,
        type: this.resolveEnv(),
      });
      const payload = res?.data ?? res;
      const url = payload?.data || payload?.url || payload;
      if (typeof url === 'string' && url) {
        window.location.href = url;
        return;
      }
      throw new Error(t('login.social.errors.missingRedirect'));
    },
    async loginBySocial(data) {
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
        throw new Error(msg);
      }

      authStore.setTokenPair({ accessToken, refreshToken });
      try {
        await userStore.fetchUserInfo();
      } catch (err) {
        console.warn('[social] fetchUserInfo failed:', err);
      }
      userStore.mergeLoginInfo(loginInfo);
      this.redirectToTarget();
    },
    resolveRedirect() {
      const fallback = '/pages/index/index';
      const raw = this.redirect || this.callbackUrl;
      if (!raw) return fallback;
      if (raw.includes('/pages/login')) return fallback;
      return raw;
    },
    redirectToTarget() {
      const target = this.resolveRedirect();
      uni.reLaunch({ url: target });
    },
    goAccountLogin() {
      const url = this.redirect ? `/pages/login/login?redirect=${encodeURIComponent(this.redirect)}` : '/pages/login/login';
      uni.redirectTo({ url });
    },
    retry() {
      this.bootstrap({});
    },
  },
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #f5f7fb;
  padding: 32rpx;
  box-sizing: border-box;
}

.hero {
  margin-top: 24rpx;
}

.brand {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.logo {
  width: 96rpx;
  height: 96rpx;
  border-radius: 20rpx;
}

.title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1f2a44;
}

.sub {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #64748b;
}

.card {
  margin-top: 32rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 24rpx 48rpx rgba(0, 0, 0, 0.08);
}

.loading-box {
  text-align: center;
  font-size: 26rpx;
  color: #64748b;
}

.fallback-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2a44;
}

.fallback-desc {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #64748b;
}

.fallback-actions {
  margin-top: 24rpx;
  display: grid;
  gap: 16rpx;
}

.primary {
  background: #2563ff;
  color: #fff;
}

.ghost {
  border: 2rpx solid #cbd5f5;
  color: #2563ff;
  background: transparent;
}
</style>
