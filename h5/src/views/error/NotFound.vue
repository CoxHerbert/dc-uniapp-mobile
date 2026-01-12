<template>
  <div class="notfound-page">
    <van-empty class="nf-empty" image="error" :description="t('error.notFound.description')">
      <template #image>
        <!-- 自定义插画：大图标 + 404 文案 -->
        <div class="nf-hero">
          <van-icon name="warning-o" class="nf-icon" />
          <div class="nf-code">404</div>
        </div>
      </template>
      <div class="nf-desc" @click="$copyText(route.fullPath)">
        {{ t('error.notFound.target', { path: route.fullPath || '-' }) }}
      </div>
      <div class="nf-actions">
        <van-space :size="8" direction="horizontal" class="nf-row">
          <van-button type="primary" block round @click="goBack">
            {{ t('error.notFound.actions.back') }}
          </van-button>
        </van-space>
        <van-space :size="8" direction="horizontal" class="nf-row">
          <van-button plain type="primary" round @click="goHome">
            {{ t('error.notFound.actions.home') }}
          </van-button>
          <van-button plain type="default" round @click="reload">
            {{ t('error.notFound.actions.retry') }}
          </van-button>
        </van-space>
      </div>

      <div class="nf-tip">{{ t('error.notFound.tip') }}</div>
    </van-empty>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast } from 'vant';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

function goBack() {
  // 如果没有历史记录，就回首页
  if (window.history.length <= 1) {
    goHome();
  } else {
    router.back();
  }
}

function goHome() {
  // 根据你的首页路由名调整
  router.replace({ path: '/home' }).catch(() => {});
}

function reload() {
  // 对外部直链或弱网场景友好
  showToast(t('error.notFound.toast.refreshing'));
  setTimeout(() => location.reload(), 200);
}

onMounted(() => {
  // 你也可以在这里上报 404（埋点）
  // report('page_404', { path: route.fullPath })
  console.warn('[404] Not Found:', route.fullPath);
});
</script>

<style scoped>
.notfound-page {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, var(--nf-bg1, #f7f8fa), var(--nf-bg2, #ffffff));
  padding: 24px 16px env(safe-area-inset-bottom);
}

.nf-empty {
  width: 100%;
  max-width: 520px;
}

.nf-hero {
  display: grid;
  place-items: center;
  margin-bottom: 8px;
}

.nf-icon {
  font-size: 64px;
  opacity: 0.85;
}

.nf-code {
  margin-top: 8px;
  font-weight: 700;
  font-size: 40px;
  letter-spacing: 2px;
  opacity: 0.9;
}

.nf-actions {
  width: 100%;
  margin-top: 12px;
}

.nf-row {
  margin-top: 8px;
  width: 100%;
  display: flex;
  justify-content: center;
}
.nf-desc {
  margin-top: 12px;
  font-size: 14px;
  color: var(--nf-tip, blue);
  text-align: center;
}
.nf-tip {
  margin-top: 12px;
  font-size: 12px;
  color: var(--nf-tip, #999);
  text-align: center;
}

/* 暗色模式适配（如果你的站有 dark class） */
:global(.dark) .notfound-page {
  --nf-bg1: #121212;
  --nf-bg2: #0b0b0b;
  --nf-tip: #bbb;
  background: linear-gradient(180deg, var(--nf-bg1), var(--nf-bg2));
}
</style>
