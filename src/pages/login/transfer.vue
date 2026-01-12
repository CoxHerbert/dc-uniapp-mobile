<template>
  <view class="m-userinfo" :class="statusClass">
    <view class="m-userinfo__hero">
      <image class="m-userinfo__logo" :src="logoUrl" mode="aspectFit" />
      <view class="m-userinfo__meta">
        <text class="m-userinfo__title">{{ t('login.ticketTransfer.title') }}</text>
        <text class="m-userinfo__sub">{{ t('login.ticketTransfer.subtitle') }}</text>
      </view>
    </view>

    <view class="m-userinfo__card">
      <view class="m-userinfo__center">
        <view v-if="status === 'loading'" class="m-userinfo__spinner" />
        <view v-else-if="status === 'success'" class="m-userinfo__result m-userinfo__result--ok" />
        <view v-else class="m-userinfo__result m-userinfo__result--err" />

        <view class="m-userinfo__msg">
          <text class="m-userinfo__msg-main">{{ statusText }}</text>
        </view>
        <text class="m-userinfo__hint">{{ subHint }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import Api from '@/api';
import { t } from '@/locales';

const UUID_PARAM_KEY = 'urlTicketId';

export default {
  data() {
    return {
      status: 'loading',
      errorMsg: '',
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
      if (this.status === 'loading') return t('login.ticketTransfer.status.loading');
      if (this.status === 'success') return t('login.ticketTransfer.status.success');
      return t('login.ticketTransfer.status.error');
    },
    subHint() {
      if (this.status === 'loading') return t('login.ticketTransfer.hints.loading');
      if (this.status === 'success') return t('login.ticketTransfer.hints.success');
      return this.errorMsg || t('login.ticketTransfer.hints.error');
    },
    statusClass() {
      return `m-userinfo--${this.status}`;
    },
  },
  methods: {
    t,
    async bootstrap() {
      try {
        const urlTicketId = this.urlTicketId;
        if (!urlTicketId) throw new Error(t('login.ticketTransfer.errors.missingTicket'));

        const resp = await Api.auth.consumeTicket({ urlTicketId });
        const { code, data, msg } = resp.data || {};
        if (code !== 200) {
          throw new Error(msg || (data && data.msg) || t('login.ticketTransfer.errors.server'));
        }

        const target = (data && data.h5Url) || '';
        if (!target) throw new Error(t('login.ticketTransfer.errors.missingUrl'));

        this.status = 'success';
        const output = this.normalizeTarget(target);
        uni.reLaunch({ url: output });
      } catch (err) {
        console.error(err);
        this.status = 'error';
        this.errorMsg = err?.message || t('login.ticketTransfer.errors.unknown');
      }
    },
    normalizeTarget(target) {
      let output = target;
      try {
        output = decodeURIComponent(output);
      } catch (err) {
        console.warn('[ticket-transfer] decode failed:', output, err);
      }
      if (!/^https?:\/\//i.test(output)) {
        if (!output.startsWith('/')) output = `/${output}`;
      }
      return output;
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
