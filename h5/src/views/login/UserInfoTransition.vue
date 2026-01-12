<!-- src/views/login/UserInfoTransitionMobile.vue -->
<template>
  <div class="m-userinfo" :class="statusClass">
    <!-- 安全区顶栏 -->
    <div class="m-userinfo__safe-top"></div>

    <!-- 品牌/说明 -->
    <header class="m-userinfo__hero">
      <img class="m-userinfo__logo" :src="logoUrl" />
      <div class="m-userinfo__meta">
        <h1 class="m-userinfo__title">{{ t('login.userInfoTransition.title') }}</h1>
        <p class="m-userinfo__sub">{{ t('login.userInfoTransition.subtitle') }}</p>
      </div>
    </header>

    <!-- 卡片主体 -->
    <main class="m-userinfo__card">
      <div class="m-userinfo__center">
        <!-- Loading 圈 -->
        <div v-if="status === 'loading'" class="m-userinfo__spinner" aria-hidden="true"></div>

        <!-- 成功/失败图标 -->
        <div v-if="status === 'success'" class="m-userinfo__result m-userinfo__result--ok"></div>
        <div v-if="status === 'error'" class="m-userinfo__result m-userinfo__result--err"></div>

        <!-- 提示语 -->
        <div class="m-userinfo__msg">
          <span class="m-userinfo__msg-main">{{ statusText }}</span>
          <span v-if="status === 'loading'" class="m-userinfo__dots"><i></i><i></i><i></i></span>
        </div>
        <div class="m-userinfo__hint">{{ subHint }}</div>
      </div>

      <!-- 进度条（仅样式，用 CSS 变量 --pct 控制） -->
      <div class="m-userinfo__progress">
        <div class="m-userinfo__progress-bar" :style="{ '--pct': pctStr }"></div>
        <div class="m-userinfo__progress-text">
          <span>{{ t('login.userInfoTransition.progress.label') }}</span>
          <span class="m-userinfo__progress-num">{{ pctStr }}</span>
        </div>
      </div>

      <!-- 步骤（移动端紧凑行高） -->
      <ul class="m-userinfo__steps">
        <li class="step" :class="stepClass(0)">
          <span class="step__dot"></span
          ><span class="step__text">{{ t('login.userInfoTransition.steps.readTicket') }}</span
          ><span class="step__tag">{{ stepTag(0) }}</span>
        </li>
        <li class="step" :class="stepClass(1)">
          <span class="step__dot"></span
          ><span class="step__text">{{ t('login.userInfoTransition.steps.fetchUser') }}</span
          ><span class="step__tag">{{ stepTag(1) }}</span>
        </li>
        <li class="step" :class="stepClass(2)">
          <span class="step__dot"></span
          ><span class="step__text">{{ t('login.userInfoTransition.steps.persist') }}</span
          ><span class="step__tag">{{ stepTag(2) }}</span>
        </li>
        <li class="step" :class="stepClass(3)">
          <span class="step__dot"></span
          ><span class="step__text">{{ t('login.userInfoTransition.steps.redirect') }}</span
          ><span class="step__tag">{{ stepTag(3) }}</span>
        </li>
      </ul>

      <!-- 结果提示 -->
      <div v-if="status === 'success'" class="m-userinfo__alert m-userinfo__alert--ok">
        {{ t('login.userInfoTransition.alerts.success') }}
      </div>
      <div v-if="status === 'error'" class="m-userinfo__alert m-userinfo__alert--err">
        {{ errorMsg || t('login.userInfoTransition.alerts.error') }}
      </div>
    </main>

    <!-- 底部安全区 + 小注释 -->
    <footer class="m-userinfo__footer">
      <div class="m-userinfo__tip">{{ t('login.userInfoTransition.footerNote') }}</div>
      <div class="m-userinfo__safe-bottom"></div>
    </footer>
  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { useUserStore } from '@/store/user';
import Api from '@/api/index';
import { getLoginEnv } from '@/utils/env.js';
import { useI18n } from 'vue-i18n';
import { extractLoginInfo } from '@/utils/login-info';

const auth = useAuthStore();
const user = useUserStore();
const { t } = useI18n();

/** 视觉用：logo 路径（兼容二级目录） */
const logoUrl = `${import.meta.env.BASE_URL}images/logo.png`;

// 如需 Pinia：
// import { useUserStore } from '@/stores/user'
// const userStore = useUserStore()

// 自定义点
const UUID_PARAM_KEY = 'urlTicketId'; // 路由 params/query 的 key

const route = useRoute();
const router = useRouter();

const status = ref('loading'); // loading | success | error
const pct = ref(10);
const errorMsg = ref('');
// 步骤：1=done, 0=doing, -1=error, -99=未开始
const steps = ref([0, -99, -99, -99]);

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

onMounted(async () => {
  if (getLoginEnv() === 'normal') {
    auth.logout();
    const redirect = `/login/transfer/${route.params.urlTicketId}`;
    router.push({
      path: '/login/account',
      query: {
        redirect,
      },
    });
  } else {
    await bootstrap();
  }
});
async function bootstrap() {
  try {
    // step0: 取 uuid（params 优先，再 query）
    steps.value[0] = 0;
    const urlTicketId = (route.params[UUID_PARAM_KEY] || route.query[UUID_PARAM_KEY] || '')
      .toString()
      .trim();
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

    // step1: 请求 userinfo（GET 示例，可换 POST）
    const res = await Api.auth.consumeTicket({ urlTicketId: urlTicketId });
    const { code, data } = res.data;
    let userInfo = {};
    if (code === 200) {
      userInfo = data;
    } else {
      throw new Error(data?.msg || t('login.userInfoTransition.errors.server'));
    }

    steps.value[1] = 1;
    steps.value[2] = 0;
    pct.value = 68;

    // step2: 存储（LocalStorage / Pinia）
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

    // step3: 跳转
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
      router.push({ path });
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

<style lang="scss" scoped>
/* ===== 移动端主题变量 ===== */
$bg-start: #0f1220;
$bg-end: #0b0f1a;
$ink: #eef1ff;
$muted: rgba(238, 241, 255, 0.72);
$glass-top: rgba(255, 255, 255, 0.1);
$glass-bottom: rgba(255, 255, 255, 0.06);
$glass-border: rgba(255, 255, 255, 0.14);
$ok: #22c55e;
$warn: #f59e0b;
$err: #ef4444;

/* 动画 */
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

/* ===== 容器（更紧凑的移动端排版） ===== */
.m-userinfo {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  background:
    radial-gradient(900px 600px at 10% -10%, rgba(99, 102, 241, 0.18), transparent),
    radial-gradient(600px 600px at 110% 10%, rgba(16, 185, 129, 0.18), transparent),
    linear-gradient(180deg, $bg-start, $bg-end);
  color: $ink;

  &__safe-top {
    height: constant(safe-area-inset-top);
    height: env(safe-area-inset-top);
  }
  &__safe-bottom {
    height: constant(safe-area-inset-bottom);
    height: env(safe-area-inset-bottom);
  }

  &__hero {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px 0;
  }
  &__logo {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    font-weight: 700;
    letter-spacing: 0.2px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.08));
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.12),
      0 6px 18px rgba(0, 0, 0, 0.35);
    font-size: 12px;
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
    margin: 12px 12px 0;
    padding: 14px 12px 12px;
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

  /* 更小的圈，适合手机视觉节奏 */
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

  /* 结果图标（无字体依赖） */
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

  /* 进度条 */
  &__progress {
    margin-top: 6px;
    display: grid;
    gap: 6px;
  }
  &__progress-bar {
    height: 6px;
    border-radius: 999px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.12);
    position: relative;
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      transform-origin: left center;
      transform: scaleX(calc(var(--pct, 0) / 100));
      background: linear-gradient(90deg, #6d8bff, #22c55e);
    }
  }
  &__progress-text {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: $muted;
  }
  &__progress-num {
    color: #fff;
    font-weight: 600;
  }

  /* 步骤：紧凑 */
  &__steps {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
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

    &__dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.28);
    }
    &__text {
      font-size: 13px;
    }
    &__tag {
      font-size: 11px;
      padding: 1px 8px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      color: $muted;
      border: 1px solid rgba(255, 255, 255, 0.12);
    }

    &--doing {
      border-color: rgba($warn, 0.45);
      .step__dot {
        background: $warn;
        box-shadow: 0 0 0 4px rgba($warn, 0.18);
      }
      .step__tag {
        color: #fff;
        background: rgba($warn, 0.18);
        border-color: rgba($warn, 0.38);
      }
    }
    &--done {
      border-color: rgba($ok, 0.45);
      .step__dot {
        background: $ok;
        box-shadow: 0 0 0 4px rgba($ok, 0.18);
      }
      .step__tag {
        color: #fff;
        background: rgba($ok, 0.18);
        border-color: rgba($ok, 0.38);
      }
    }
    &--error {
      border-color: rgba($err, 0.45);
      .step__dot {
        background: $err;
        box-shadow: 0 0 0 4px rgba($err, 0.18);
      }
      .step__tag {
        color: #fff;
        background: rgba($err, 0.18);
        border-color: rgba($err, 0.38);
      }
    }
  }

  &__alert {
    margin-top: 8px;
    padding: 10px 12px;
    border-radius: 12px;
    font-size: 13px;
    text-align: center;
    border: 1px solid transparent;
    &--ok {
      background: rgba($ok, 0.14);
      border-color: rgba($ok, 0.4);
    }
    &--err {
      background: rgba($err, 0.14);
      border-color: rgba($err, 0.4);
    }
  }

  &__footer {
    margin: 8px 12px 0;
    padding-bottom: 6px;
    text-align: center;
    color: $muted;
    font-size: 11px;
  }
  &__tip {
    opacity: 0.9;
  }
}

/* 状态修饰符（可扩展） */
.m-userinfo--loading {
}
.m-userinfo--success {
}
.m-userinfo--error {
}
</style>
