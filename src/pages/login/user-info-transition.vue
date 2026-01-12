<template>
  <view class="m-userinfo" :class="statusClass">
    <view class="m-userinfo__safe-top"></view>

    <view class="m-userinfo__hero">
      <image class="m-userinfo__logo" :src="logoUrl" mode="aspectFit" />
      <view class="m-userinfo__meta">
        <text class="m-userinfo__title">{{ t('login.userInfoTransition.title') }}</text>
        <text class="m-userinfo__sub">{{ t('login.userInfoTransition.subtitle') }}</text>
      </view>
    </view>

    <view class="m-userinfo__card">
      <view class="m-userinfo__center">
        <view v-if="status === 'loading'" class="m-userinfo__spinner" aria-hidden="true"></view>

        <view v-if="status === 'success'" class="m-userinfo__result m-userinfo__result--ok"></view>
        <view v-if="status === 'error'" class="m-userinfo__result m-userinfo__result--err"></view>

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

      <view class="m-userinfo__progress">
        <view class="m-userinfo__progress-bar" :style="{ '--pct': pctStr }"></view>
        <view class="m-userinfo__progress-text">
          <text>{{ t('login.userInfoTransition.progress.label') }}</text>
          <text class="m-userinfo__progress-num">{{ pctStr }}</text>
        </view>
      </view>

      <view class="m-userinfo__steps">
        <view class="step" :class="stepClass(0)">
          <text class="step__dot"></text>
          <text class="step__text">{{ t('login.userInfoTransition.steps.readTicket') }}</text>
          <text class="step__tag">{{ stepTag(0) }}</text>
        </view>
        <view class="step" :class="stepClass(1)">
          <text class="step__dot"></text>
          <text class="step__text">{{ t('login.userInfoTransition.steps.fetchUser') }}</text>
          <text class="step__tag">{{ stepTag(1) }}</text>
        </view>
        <view class="step" :class="stepClass(2)">
          <text class="step__dot"></text>
          <text class="step__text">{{ t('login.userInfoTransition.steps.persist') }}</text>
          <text class="step__tag">{{ stepTag(2) }}</text>
        </view>
        <view class="step" :class="stepClass(3)">
          <text class="step__dot"></text>
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
      <view class="m-userinfo__tip">{{ t('login.userInfoTransition.footerNote') }}</view>
      <view class="m-userinfo__safe-bottom"></view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useAuthStore } from '@/store/auth';
import { useUserStore } from '@/store/user';
import Api from '@/api';
import { getLoginEnv } from '@/utils/env.js';
import { useI18n } from 'vue-i18n';
import { extractLoginInfo } from '@/utils/login-info';

const auth = useAuthStore();
const user = useUserStore();
const { t } = useI18n();

const logoUrl = '/static/logo.png';

const UUID_PARAM_KEY = 'urlTicketId';

const status = ref('loading');
const pct = ref(10);
const errorMsg = ref('');
const steps = ref([0, -99, -99, -99]);
const ticketId = ref('');

const statusText = computed(() => {
  if (status.value === 'loading') return t('login.userInfoTransition.status.loading');
  if (status.value === 'success') return t('login.userInfoTransition.status.success');
  return t('login.userInfoTransition.status.error');
});
const subHint = computed(() => {
  if (status.value === 'loading') return t('login.userInfoTransition.hints.loading');
  if (status.value === 'success') return t('login.userInfoTransition.hints.success');
  return t('login.userInfoTransition.hints.error');
});
const pctStr = computed(() => `${pct.value}%`);
const statusClass = computed(() => `m-userinfo--${status.value}`);

function stepClass(i) {
  const v = steps.value[i];
  if (v === 1) return 'step--done';
  if (v === 0) return 'step--doing';
  if (v === -1) return 'step--error';
  return '';
}
function stepTag(i) {
  const v = steps.value[i];
  if (v === 1) return t('login.userInfoTransition.stepTags.done');
  if (v === 0) return t('login.userInfoTransition.stepTags.doing');
  if (v === -1) return t('login.userInfoTransition.stepTags.error');
  return t('login.userInfoTransition.stepTags.pending');
}

onLoad(async (options) => {
  ticketId.value = options?.[UUID_PARAM_KEY] || '';
  if (getLoginEnv() === 'normal') {
    auth.logout();
    const redirect = `/pages/login/transfer?${UUID_PARAM_KEY}=${encodeURIComponent(
      ticketId.value
    )}`;
    uni.redirectTo({
      url: `/pages/login/index?redirect=${encodeURIComponent(redirect)}`,
    });
  } else {
    await bootstrap();
  }
});

async function bootstrap() {
  try {
    steps.value[0] = 0;
    const urlTicketId = String(ticketId.value || '').trim();
    if (!urlTicketId) {
      steps.value[0] = -1;
      status.value = 'error';
      errorMsg.value = t('login.userInfoTransition.errors.missingTicket', { key: UUID_PARAM_KEY });
      pct.value = 100;
      return;
    }
    steps.value[0] = 1;
    steps.value[1] = 0;
    pct.value = 35;

    const res = await Api.auth.consumeTicket({ urlTicketId });
    const { code, data } = res.data || {};
    let userInfo = {};
    if (code === 200) {
      userInfo = data;
    } else {
      throw new Error(data?.msg || t('login.userInfoTransition.errors.server'));
    }

    steps.value[1] = 1;
    steps.value[2] = 0;
    pct.value = 68;

    try {
      const accessToken = data?.access_token;
      const refreshToken = data?.refresh_token;
      auth.setTokenPair({ accessToken, refreshToken });
      user.setUserInfo(userInfo);
      const loginInfo = extractLoginInfo(data);
      user.mergeLoginInfo(loginInfo);
      steps.value[2] = 1;
    } catch (e) {
      steps.value[2] = -1;
      throw e;
    }

    steps.value[3] = 0;
    status.value = 'success';
    pct.value = 88;

    let path = userInfo?.h5Url;
    if (userInfo?.h5Url) {
      path = userInfo.h5Url.replace(/^\/mobile/, '');
    }

    setTimeout(() => {
      steps.value[3] = 1;
      pct.value = 100;
      uni.reLaunch({
        url: path || '/pages/index/index',
      });
    }, 420);
  } catch (err) {
    console.error(err);
    status.value = 'error';
    errorMsg.value = err?.message || t('login.userInfoTransition.errors.unknown');
    if (steps.value[1] === 0) steps.value[1] = -1;
    else if (steps.value[2] === 0) steps.value[2] = -1;
    else if (steps.value[3] === 0) steps.value[3] = -1;
    pct.value = 100;
  }
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
  grid-template-rows: auto auto 1fr auto;
  background:
    radial-gradient(900px 600px at 10% -10%, rgba(99, 102, 241, 0.18), transparent),
    radial-gradient(600px 600px at 110% 10%, rgba(16, 185, 129, 0.18), transparent),
    linear-gradient(180deg, #0f1220, #0b0f1a);
  color: #eef1ff;
}

.m-userinfo__safe-top {
  height: constant(safe-area-inset-top);
  height: env(safe-area-inset-top);
}

.m-userinfo__safe-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
}

.m-userinfo__hero {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px 0;
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
  margin: 12px 12px 0;
  padding: 14px 12px 12px;
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

.m-userinfo__progress {
  margin-top: 6px;
  display: grid;
  gap: 6px;
}

.m-userinfo__progress-bar {
  height: 6px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.12);
  position: relative;
}

.m-userinfo__progress-bar::after {
  content: '';
  position: absolute;
  inset: 0;
  transform-origin: left center;
  transform: scaleX(calc(var(--pct, 0) / 100));
  background: linear-gradient(90deg, #6d8bff, #22c55e);
}

.m-userinfo__progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(238, 241, 255, 0.72);
}

.m-userinfo__progress-num {
  color: #fff;
  font-weight: 600;
}

.m-userinfo__steps {
  margin-top: 8px;
  display: grid;
  gap: 6px;
}

.step {
  display: grid;
  grid-template-columns: 14px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.step__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.28);
}

.step__text {
  font-size: 13px;
}

.step__tag {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(238, 241, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.step--doing {
  border-color: rgba(245, 158, 11, 0.45);
}

.step--doing .step__dot {
  background: #f59e0b;
  box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.18);
}

.step--doing .step__tag {
  color: #fff;
  background: rgba(245, 158, 11, 0.18);
  border-color: rgba(245, 158, 11, 0.38);
}

.step--done {
  border-color: rgba(34, 197, 94, 0.45);
}

.step--done .step__dot {
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18);
}

.step--done .step__tag {
  color: #fff;
  background: rgba(34, 197, 94, 0.18);
  border-color: rgba(34, 197, 94, 0.38);
}

.step--error {
  border-color: rgba(239, 68, 68, 0.45);
}

.step--error .step__dot {
  background: #ef4444;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.18);
}

.step--error .step__tag {
  color: #fff;
  background: rgba(239, 68, 68, 0.18);
  border-color: rgba(239, 68, 68, 0.38);
}

.m-userinfo__alert {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 13px;
  text-align: center;
  border: 1px solid transparent;
}

.m-userinfo__alert--ok {
  background: rgba(34, 197, 94, 0.14);
  border-color: rgba(34, 197, 94, 0.4);
}

.m-userinfo__alert--err {
  background: rgba(239, 68, 68, 0.14);
  border-color: rgba(239, 68, 68, 0.4);
}

.m-userinfo__footer {
  margin: 8px 12px 0;
  padding-bottom: 6px;
  text-align: center;
  color: rgba(238, 241, 255, 0.72);
  font-size: 11px;
}

.m-userinfo__tip {
  opacity: 0.9;
}
</style>
