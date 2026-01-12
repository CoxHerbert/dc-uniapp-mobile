<!-- src/views/login/Transfer.vue -->
<template>
  <div class="m-userinfo" :class="statusClass">
    <!-- 顶部 -->
    <div class="m-userinfo__hero">
      <img class="m-userinfo__logo" :src="logoUrl" alt="logo" />
      <div class="m-userinfo__meta">
        <h1 class="m-userinfo__title">{{ t('login.ticketTransfer.title') }}</h1>
        <p class="m-userinfo__sub">{{ t('login.ticketTransfer.subtitle') }}</p>
      </div>
    </div>

    <!-- 卡片主体（仅显示简单状态） -->
    <div class="m-userinfo__card">
      <div class="m-userinfo__center">
        <div v-if="status === 'loading'" class="m-userinfo__spinner" aria-hidden="true"></div>
        <div
          v-else-if="status === 'success'"
          class="m-userinfo__result m-userinfo__result--ok"
        ></div>
        <div v-else class="m-userinfo__result m-userinfo__result--err"></div>

        <div class="m-userinfo__msg">
          <span class="m-userinfo__msg-main">{{ statusText }}</span>
          <span v-if="status === 'loading'" class="m-userinfo__dots"><i></i><i></i><i></i></span>
        </div>
        <div class="m-userinfo__hint">{{ subHint }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Api from '@/api/index';
import { useI18n } from 'vue-i18n';

// —— 可自定义 —— //
const UUID_PARAM_KEY = 'urlTicketId'; // 若没传 :id，则从 ?urlTicketId= 取
const FALLBACK_404 = '/404'; // 失败跳转
// ================= //

/** 视觉用：logo 路径（兼容二级目录） */
const logoUrl = `${import.meta.env.BASE_URL}images/logo.png`;

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const status = ref('loading'); // 'loading' | 'success' | 'error'
const errorMsg = ref('');

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

onMounted(async () => {
  try {
    // ① 获取 urlTicketId（优先 :id，其次 ?urlTicketId=）
    const urlTicketId = route.params[UUID_PARAM_KEY];
    if (!urlTicketId) throw new Error(t('login.ticketTransfer.errors.missingTicket'));

    // ② 请求接口 → 跳转
    const resp = await Api.auth.consumeTicket({ urlTicketId });
    const { code, data, msg } = resp.data || {};
    if (code !== 200)
      throw new Error(msg || (data && data.msg) || t('login.ticketTransfer.errors.server'));

    const target = (data && data.h5Url) || '';
    if (!target) throw new Error(t('login.ticketTransfer.errors.missingUrl'));

    status.value = 'success';
    const output = normalizeTarget(target);
    // 站内：router 跳
    router
      .replace(output)
      .catch(() => router.replace({ path: FALLBACK_404, query: { redirect: output } }));
  } catch (err) {
    console.error(err);
    status.value = 'error';
    errorMsg.value = (err && err.message) || t('login.ticketTransfer.errors.unknown');
  }
});

function normalizeTarget(t) {
  let s = t;
  try {
    s = decodeURIComponent(s);
  } catch (err) {
    console.warn('[ticket-transfer] failed to decode redirect target:', s, err);
  }
  if (!/^https?:\/\//i.test(s)) {
    s = s.replace(/^\/mobile(\/|$)/, '/');
    if (!s.startsWith('/')) s = '/' + s;
  }
  return s;
}
</script>

<style lang="scss" scoped>
/* 主题变量（保持你的视觉风格） */
$bg-start: #0f1220;
$bg-end: #0b0f1a;
$ink: #eef1ff;
$muted: rgba(238, 241, 255, 0.72);
$glass-top: rgba(255, 255, 255, 0.1);
$glass-bottom: rgba(255, 255, 255, 0.06);
$glass-border: rgba(255, 255, 255, 0.14);
$ok: #22c55e;
$err: #ef4444;

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
  color: $ink;
  background:
    radial-gradient(900px 600px at 10% -10%, rgba(99, 102, 241, 0.18), transparent),
    radial-gradient(600px 600px at 110% 10%, rgba(16, 185, 129, 0.18), transparent),
    linear-gradient(180deg, $bg-start, $bg-end);

  &__hero {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 24px 18px 0;
  }
  &__logo {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    object-fit: cover;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.08));
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.12),
      0 6px 18px rgba(0, 0, 0, 0.35);
  }
  &__title {
    margin: 0 0 2px;
    font-size: 17px;
    font-weight: 700;
  }
  &__sub {
    margin: 0;
    font-size: 12px;
    color: $muted;
  }

  &__card {
    margin: 0 12px 18px;
    padding: 16px 12px 12px;
    border-radius: 16px;
    background: linear-gradient(180deg, $glass-top, $glass-bottom);
    border: 1px solid $glass-border;
    // backdrop-filter: blur(8px);
    box-shadow:
      0 8px 28px rgba(0, 0, 0, 0.42),
      inset 0 0 28px rgba(255, 255, 255, 0.06);
    animation: fadeInUp 0.28s ease both;
  }
  &__center {
    display: grid;
    justify-items: center;
    gap: 10px;
    min-height: 92px;
  }

  &__spinner {
    $size: 48px;
    width: $size;
    height: $size;
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
    &::after {
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
  }

  &__result {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    &--ok {
      background: rgba($ok, 0.14);
      box-shadow: inset 0 0 0 2px rgba($ok, 0.45);
      position: relative;
      &::before,
      &::after {
        content: '';
        position: absolute;
        background: $ok;
        border-radius: 2px;
      }
      &::before {
        width: 9px;
        height: 2px;
        left: 15px;
        top: 24px;
        transform: rotate(40deg);
      }
      &::after {
        width: 20px;
        height: 2px;
        left: 22px;
        top: 20px;
        transform: rotate(-40deg);
      }
    }
    &--err {
      background: rgba($err, 0.14);
      box-shadow: inset 0 0 0 2px rgba($err, 0.45);
      position: relative;
      &::before,
      &::after {
        content: '';
        position: absolute;
        width: 22px;
        height: 2px;
        top: 23px;
        left: 13px;
        background: $err;
        border-radius: 2px;
      }
      &::before {
        transform: rotate(45deg);
      }
      &::after {
        transform: rotate(-45deg);
      }
    }
  }

  &__msg {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    font-size: 14px;
  }
  &__dots {
    display: inline-flex;
    gap: 3px;
    i {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      animation: bounce 1.2s infinite ease-in-out;
      &:nth-child(2) {
        animation-delay: 0.15s;
      }
      &:nth-child(3) {
        animation-delay: 0.3s;
      }
    }
  }
  &__hint {
    font-size: 12px;
    color: $muted;
  }
}

.m-userinfo--loading {
}
.m-userinfo--success {
}
.m-userinfo--error {
}
</style>
