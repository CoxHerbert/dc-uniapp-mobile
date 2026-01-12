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
        <view v-if="status === 'loading'" class="m-userinfo__spinner" aria-hidden="true"></view>
        <view
          v-else-if="status === 'success'"
          class="m-userinfo__result m-userinfo__result--ok"
        ></view>
        <view v-else class="m-userinfo__result m-userinfo__result--err"></view>

        <view class="m-userinfo__msg">
          <text class="m-userinfo__msg-main">{{ statusText }}</text>
          <view v-if="status === 'loading'" class="m-userinfo__dots">
            <text></text>
            <text></text>
            <text></text>
          </view>
        </view>
        <view class="m-userinfo__hint">{{ subHint }}</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import Api from '@/api';
import { useI18n } from 'vue-i18n';

const UUID_PARAM_KEY = 'urlTicketId';
const FALLBACK_404 = '/pages/index/index';

const logoUrl = '/static/logo.png';

const { t } = useI18n();

const status = ref('loading');
const errorMsg = ref('');
const ticketId = ref('');

const statusText = computed(() => {
  if (status.value === 'loading') return t('login.ticketTransfer.status.loading');
  if (status.value === 'success') return t('login.ticketTransfer.status.success');
  return t('login.ticketTransfer.status.error');
});
const subHint = computed(() => {
  if (status.value === 'loading') return t('login.ticketTransfer.hints.loading');
  if (status.value === 'success') return t('login.ticketTransfer.hints.success');
  return errorMsg.value || t('login.ticketTransfer.hints.error');
});
const statusClass = computed(() => `m-userinfo--${status.value}`);

onLoad(async (options) => {
  ticketId.value = options?.[UUID_PARAM_KEY] || '';
  try {
    const urlTicketId = ticketId.value;
    if (!urlTicketId) throw new Error(t('login.ticketTransfer.errors.missingTicket'));

    const resp = await Api.auth.consumeTicket({ urlTicketId });
    const { code, data, msg } = resp.data || {};
    if (code !== 200) {
      throw new Error(msg || (data && data.msg) || t('login.ticketTransfer.errors.server'));
    }

    const target = (data && data.h5Url) || '';
    if (!target) throw new Error(t('login.ticketTransfer.errors.missingUrl'));

    status.value = 'success';
    const output = normalizeTarget(target);

    setTimeout(() => {
      uni.reLaunch({
        url: output || FALLBACK_404,
      });
    }, 400);
  } catch (err) {
    console.error(err);
    status.value = 'error';
    errorMsg.value = (err && err.message) || t('login.ticketTransfer.errors.unknown');
  }
});

function normalizeTarget(target) {
  let output = target;
  try {
    output = decodeURIComponent(output);
  } catch (err) {
    console.warn('[ticket-transfer] failed to decode redirect target:', output, err);
  }
  if (!/^https?:\/\//i.test(output)) {
    output = output.replace(/^\/mobile(\/|$)/, '/');
    if (!output.startsWith('/')) output = '/' + output;
  }
  return output;
}
</script>

<style scoped>
@keyframes rotate360 {
  to {
    transform: rotate(360deg);
  }
}
@keyframes bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.9;
  }
  30% {
    transform: translateY(-5px);
    opacity: 1;
  }
}
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.m-userinfo {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 20px;
  color: #eef1ff;
  background:
    radial-gradient(900px 600px at 10% -10%, rgba(99, 102, 241, 0.18), transparent),
    radial-gradient(600px 600px at 110% 10%, rgba(16, 185, 129, 0.18), transparent),
    linear-gradient(180deg, #0f1220, #0b0f1a);
}

.m-userinfo__hero {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 18px 0;
}

.m-userinfo__logo {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.08));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.12),
    0 6px 18px rgba(0, 0, 0, 0.35);
}

.m-userinfo__title {
  margin-bottom: 2px;
  font-size: 17px;
  font-weight: 700;
}

.m-userinfo__sub {
  font-size: 12px;
  color: rgba(238, 241, 255, 0.72);
}

.m-userinfo__card {
  margin: 0 12px 18px;
  padding: 16px 12px 12px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.06));
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow:
    0 8px 28px rgba(0, 0, 0, 0.42),
    inset 0 0 28px rgba(255, 255, 255, 0.06);
  animation: fadeInUp 0.28s ease both;
}

.m-userinfo__center {
  display: grid;
  justify-items: center;
  gap: 10px;
  min-height: 92px;
}

.m-userinfo__spinner {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  position: relative;
  mask: radial-gradient(circle 18px, transparent 59%, #000 60%);
  background: conic-gradient(
    from 0deg,
    rgba(255, 255, 255, 0.06),
    rgba(255, 255, 255, 0.9) 60%,
    rgba(255, 255, 255, 0.06)
  );
  animation: rotate360 1.05s linear infinite;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08) inset;
}

.m-userinfo__spinner::after {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  background:
    radial-gradient(5px 5px at 95% 50%, rgba(99, 102, 241, 0.95), transparent 70%),
    radial-gradient(6px 6px at 90% 50%, rgba(16, 185, 129, 0.85), transparent 70%);
  animation: rotate360 1.05s linear infinite;
  filter: blur(0.2px);
}

.m-userinfo__result {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.m-userinfo__result--ok {
  background: rgba(34, 197, 94, 0.14);
  box-shadow: inset 0 0 0 2px rgba(34, 197, 94, 0.45);
  position: relative;
}

.m-userinfo__result--ok::before,
.m-userinfo__result--ok::after {
  content: '';
  position: absolute;
  background: #22c55e;
  border-radius: 2px;
}

.m-userinfo__result--ok::before {
  width: 9px;
  height: 2px;
  left: 15px;
  top: 24px;
  transform: rotate(40deg);
}

.m-userinfo__result--ok::after {
  width: 20px;
  height: 2px;
  left: 22px;
  top: 20px;
  transform: rotate(-40deg);
}

.m-userinfo__result--err {
  background: rgba(239, 68, 68, 0.14);
  box-shadow: inset 0 0 0 2px rgba(239, 68, 68, 0.45);
  position: relative;
}

.m-userinfo__result--err::before,
.m-userinfo__result--err::after {
  content: '';
  position: absolute;
  width: 22px;
  height: 2px;
  top: 23px;
  left: 13px;
  background: #ef4444;
  border-radius: 2px;
}

.m-userinfo__result--err::before {
  transform: rotate(45deg);
}

.m-userinfo__result--err::after {
  transform: rotate(-45deg);
}

.m-userinfo__msg {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  font-size: 14px;
}

.m-userinfo__dots {
  display: inline-flex;
  gap: 3px;
}

.m-userinfo__dots text {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  animation: bounce 1.2s infinite ease-in-out;
}

.m-userinfo__dots text:nth-child(2) {
  animation-delay: 0.15s;
}

.m-userinfo__dots text:nth-child(3) {
  animation-delay: 0.3s;
}

.m-userinfo__hint {
  font-size: 12px;
  color: rgba(238, 241, 255, 0.72);
}
</style>
