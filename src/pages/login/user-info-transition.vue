<template>
  <view class="m-userinfo" :class="statusClass">
    <view class="m-userinfo__safe-top" />

    <view class="m-userinfo__hero">
      <image class="m-userinfo__logo" :src="logoUrl" mode="aspectFit" />
      <view class="m-userinfo__meta">
        <text class="m-userinfo__title">{{ t('login.userInfoTransition.title') }}</text>
        <text class="m-userinfo__sub">{{ t('login.userInfoTransition.subtitle') }}</text>
      </view>
    </view>

    <view class="m-userinfo__card">
      <view class="m-userinfo__center">
        <view v-if="status === 'loading'" class="m-userinfo__spinner" />
        <view v-if="status === 'success'" class="m-userinfo__result m-userinfo__result--ok" />
        <view v-if="status === 'error'" class="m-userinfo__result m-userinfo__result--err" />

        <view class="m-userinfo__msg">
          <text class="m-userinfo__msg-main">{{ statusText }}</text>
        </view>
        <text class="m-userinfo__hint">{{ subHint }}</text>
      </view>

      <view class="m-userinfo__progress">
        <view class="m-userinfo__progress-bar" :style="{ '--pct': pctStr }" />
        <view class="m-userinfo__progress-text">
          <text>{{ t('login.userInfoTransition.progress.label') }}</text>
          <text class="m-userinfo__progress-num">{{ pctStr }}</text>
        </view>
      </view>

      <view class="m-userinfo__steps">
        <view class="step" :class="stepClass(0)">
          <text class="step__dot" />
          <text class="step__text">{{ t('login.userInfoTransition.steps.readTicket') }}</text>
          <text class="step__tag">{{ stepTag(0) }}</text>
        </view>
        <view class="step" :class="stepClass(1)">
          <text class="step__dot" />
          <text class="step__text">{{ t('login.userInfoTransition.steps.fetchUser') }}</text>
          <text class="step__tag">{{ stepTag(1) }}</text>
        </view>
        <view class="step" :class="stepClass(2)">
          <text class="step__dot" />
          <text class="step__text">{{ t('login.userInfoTransition.steps.persist') }}</text>
          <text class="step__tag">{{ stepTag(2) }}</text>
        </view>
        <view class="step" :class="stepClass(3)">
          <text class="step__dot" />
          <text class="step__text">{{ t('login.userInfoTransition.steps.redirect') }}</text>
          <text class="step__tag">{{ stepTag(3) }}</text>
        </view>
      </view>

      <view v-if="status === 'success'" class="m-userinfo__alert m-userinfo__alert--ok">
        {{ t('login.userInfoTransition.alerts.success') }}
      </view>
      <view v-if="status === 'error'" class="m-userinfo__alert m-userinfo__alert--err">
        {{ errorMsg || t('login.userInfoTransition.alerts.error') }}
      </view>
    </view>

    <view class="m-userinfo__footer">
      <text class="m-userinfo__tip">{{ t('login.userInfoTransition.footerNote') }}</text>
      <view class="m-userinfo__safe-bottom" />
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

const UUID_PARAM_KEY = 'urlTicketId';

export default {
  data() {
    return {
      status: 'loading',
      pct: 10,
      errorMsg: '',
      steps: [0, -99, -99, -99],
      logoUrl: '/static/logo.png',
      urlTicketId: '',
    };
  },
  onLoad(options) {
    this.urlTicketId = options?.[UUID_PARAM_KEY] || '';
    this.bootstrap();
  },
  computed: {
    statusText() {
      if (this.status === 'loading') return t('login.userInfoTransition.status.loading');
      if (this.status === 'success') return t('login.userInfoTransition.status.success');
      return t('login.userInfoTransition.status.error');
    },
    subHint() {
      if (this.status === 'loading') return t('login.userInfoTransition.hints.loading');
      if (this.status === 'success') return t('login.userInfoTransition.hints.success');
      return t('login.userInfoTransition.hints.error');
    },
    pctStr() {
      return `${this.pct}%`;
    },
    statusClass() {
      return `m-userinfo--${this.status}`;
    },
  },
  methods: {
    t,
    stepClass(i) {
      const v = this.steps[i];
      if (v === 1) return 'step--done';
      if (v === 0) return 'step--doing';
      if (v === -1) return 'step--error';
      return '';
    },
    stepTag(i) {
      const v = this.steps[i];
      if (v === 1) return t('login.userInfoTransition.stepTags.done');
      if (v === 0) return t('login.userInfoTransition.stepTags.doing');
      if (v === -1) return t('login.userInfoTransition.stepTags.error');
      return t('login.userInfoTransition.stepTags.pending');
    },
    async bootstrap() {
      if (getLoginEnv() === 'normal') {
        authStore.logout();
        const redirect = `/pages/login/transfer?urlTicketId=${this.urlTicketId}`;
        uni.redirectTo({ url: `/pages/login/login?redirect=${encodeURIComponent(redirect)}` });
        return;
      }
      await this.loadUserInfo();
    },
    async loadUserInfo() {
      try {
        this.steps[0] = 0;
        const urlTicketId = String(this.urlTicketId || '').trim();
        if (!urlTicketId) {
          this.steps[0] = -1;
          this.status = 'error';
          this.errorMsg = t('login.userInfoTransition.errors.missingTicket', { key: UUID_PARAM_KEY });
          this.pct = 100;
          return;
        }
        this.steps[0] = 1;
        this.steps[1] = 0;
        this.pct = 35;

        const res = await Api.auth.consumeTicket({ urlTicketId });
        const { code, data } = res.data || {};
        if (code !== 200) {
          throw new Error(data?.msg || t('login.userInfoTransition.errors.server'));
        }

        this.steps[1] = 1;
        this.steps[2] = 0;
        this.pct = 68;

        const accessToken = data?.access_token;
        const refreshToken = data?.refresh_token;
        authStore.setTokenPair({ accessToken, refreshToken });
        userStore.setUserInfo(data || {});
        const loginInfo = extractLoginInfo(data);
        userStore.mergeLoginInfo(loginInfo);
        this.steps[2] = 1;

        this.steps[3] = 0;
        this.status = 'success';
        this.pct = 88;

        let path = data?.h5Url || '/pages/index/index';
        if (path && !path.startsWith('/')) {
          path = `/${path}`;
        }

        setTimeout(() => {
          this.steps[3] = 1;
          this.pct = 100;
          uni.reLaunch({ url: path });
        }, 420);
      } catch (err) {
        console.error(err);
        this.status = 'error';
        this.errorMsg = err?.message || t('login.userInfoTransition.errors.unknown');
        if (this.steps[1] === 0) this.steps[1] = -1;
        else if (this.steps[2] === 0) this.steps[2] = -1;
        else if (this.steps[3] === 0) this.steps[3] = -1;
        this.pct = 100;
      }
    },
  },
};
</script>

<style scoped>
.m-userinfo {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  color: #eef1ff;
  background: linear-gradient(180deg, #0f1220, #0b0f1a);
}

.m-userinfo__safe-top,
.m-userinfo__safe-bottom {
  height: 24rpx;
}

.m-userinfo__hero {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 32rpx 32rpx 0;
}

.m-userinfo__logo {
  width: 88rpx;
  height: 88rpx;
  border-radius: 20rpx;
}

.m-userinfo__title {
  font-size: 32rpx;
  font-weight: 700;
}

.m-userinfo__sub {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: rgba(238, 241, 255, 0.72);
}

.m-userinfo__card {
  margin: 0 24rpx;
  padding: 32rpx 24rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.08);
}

.m-userinfo__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.m-userinfo__spinner {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  border: 6rpx solid rgba(255, 255, 255, 0.2);
  border-top-color: rgba(255, 255, 255, 0.9);
  animation: spin 1s linear infinite;
}

.m-userinfo__result {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
}

.m-userinfo__result--ok {
  background: rgba(34, 197, 94, 0.2);
  border: 2rpx solid rgba(34, 197, 94, 0.6);
}

.m-userinfo__result--err {
  background: rgba(239, 68, 68, 0.2);
  border: 2rpx solid rgba(239, 68, 68, 0.6);
}

.m-userinfo__msg-main {
  font-size: 28rpx;
  font-weight: 600;
}

.m-userinfo__hint {
  font-size: 22rpx;
  color: rgba(238, 241, 255, 0.72);
}

.m-userinfo__progress {
  margin-top: 24rpx;
}

.m-userinfo__progress-bar {
  height: 12rpx;
  border-radius: 999rpx;
  background: linear-gradient(90deg, #2563ff, #22c55e);
  width: var(--pct);
}

.m-userinfo__progress-text {
  margin-top: 12rpx;
  display: flex;
  justify-content: space-between;
  font-size: 22rpx;
}

.m-userinfo__steps {
  margin-top: 24rpx;
  display: grid;
  gap: 12rpx;
}

.step {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 22rpx;
}

.step__dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
}

.step__tag {
  margin-left: auto;
  font-size: 20rpx;
  color: rgba(238, 241, 255, 0.72);
}

.step--done .step__dot {
  background: #22c55e;
}

.step--doing .step__dot {
  background: #2563ff;
}

.step--error .step__dot {
  background: #ef4444;
}

.m-userinfo__alert {
  margin-top: 24rpx;
  padding: 16rpx;
  border-radius: 16rpx;
  text-align: center;
  font-size: 22rpx;
}

.m-userinfo__alert--ok {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.m-userinfo__alert--err {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.m-userinfo__footer {
  padding: 0 24rpx 24rpx;
  text-align: center;
  color: rgba(238, 241, 255, 0.72);
  font-size: 20rpx;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
