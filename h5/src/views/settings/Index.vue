<template>
  <div class="settings-page">
    <van-nav-bar :title="t('routes.settings')" left-arrow @click-left="handleBack" />

    <section class="settings-page__content">
      <van-cell-group inset>
        <van-cell
          title="VConsole 调试面板"
          label="开启后可在页面底部展开调试工具"
          class="settings-page__cell"
        >
          <template #right-icon>
            <van-switch
              :model-value="debugStore.vconsoleEnabled"
              :loading="loading"
              size="24px"
              @update:model-value="onToggle"
            />
          </template>
        </van-cell>
        <van-cell title="打包时间" :value="buildTime || '暂无'" />
      </van-cell-group>

      <van-cell-group inset>
        <van-cell
          title="查看所有缓存"
          label="localStorage / sessionStorage"
          is-link
          @click="openCacheViewer"
        />
        <van-cell
          title="清空全部缓存"
          label="删除 localStorage 与 sessionStorage 的所有数据"
          class="settings-page__danger"
          is-link
          @click="onClearCache"
        />
      </van-cell-group>
    </section>

    <van-popup v-model:show="showCachePopup" position="bottom" round :style="{ height: '75%' }">
      <div class="cache-viewer">
        <div class="cache-viewer__header">
          <div class="cache-viewer__title">缓存详情</div>
          <van-button size="small" type="primary" plain @click="refreshCacheEntries">刷新</van-button>
        </div>

        <div class="cache-viewer__body">
          <div class="cache-viewer__section">
            <div class="cache-viewer__section-title">
              localStorage
              <span class="cache-viewer__section-count">（{{ cacheEntries.local.length }}）</span>
            </div>
            <template v-if="cacheEntries.local.length">
              <van-cell-group inset>
                <van-cell
                  v-for="item in cacheEntries.local"
                  :key="`local-${item.key}`"
                  class="cache-viewer__cell"
                >
                  <template #title>
                    <div class="cache-viewer__cell-title">{{ item.key }}</div>
                  </template>
                  <template #label>
                    <pre class="cache-viewer__cell-value">{{ item.value }}</pre>
                  </template>
                </van-cell>
              </van-cell-group>
            </template>
            <div v-else class="cache-viewer__empty">暂无数据</div>
          </div>

          <div class="cache-viewer__section">
            <div class="cache-viewer__section-title">
              sessionStorage
              <span class="cache-viewer__section-count">（{{ cacheEntries.session.length }}）</span>
            </div>
            <template v-if="cacheEntries.session.length">
              <van-cell-group inset>
                <van-cell
                  v-for="item in cacheEntries.session"
                  :key="`session-${item.key}`"
                  class="cache-viewer__cell"
                >
                  <template #title>
                    <div class="cache-viewer__cell-title">{{ item.key }}</div>
                  </template>
                  <template #label>
                    <pre class="cache-viewer__cell-value">{{ item.value }}</pre>
                  </template>
                </van-cell>
              </van-cell-group>
            </template>
            <div v-else class="cache-viewer__empty">暂无数据</div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { showConfirmDialog, showFailToast, showToast } from 'vant';
import { useRouter } from 'vue-router';
import { useDebugStore } from '@/store/debug';

const router = useRouter();
const debugStore = useDebugStore();
const loading = ref(false);
const { t } = useI18n();
const buildTime = import.meta.env.VITE_APP_BUILD_TIME;
const showCachePopup = ref(false);
const cacheEntries = ref({ local: [], session: [] });

const handleBack = () => {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  router.replace('/');
};

const getStorageEntries = (storage) => {
  if (!storage) return [];
  const entries = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    entries.push({
      key,
      value: storage.getItem(key) ?? '',
    });
  }
  return entries;
};

const collectCacheEntries = () => ({
  local: getStorageEntries(window.localStorage),
  session: getStorageEntries(window.sessionStorage),
});

const refreshCacheEntries = () => {
  if (!showCachePopup.value) return;
  cacheEntries.value = collectCacheEntries();
};

const openCacheViewer = () => {
  cacheEntries.value = collectCacheEntries();
  showCachePopup.value = true;
};

const onClearCache = async () => {
  try {
    await showConfirmDialog({
      title: '提示',
      message: '确定要清空 localStorage 和 sessionStorage 吗？',
      confirmButtonText: '立即清空',
    });
  } catch (error) {
    return;
  }
  window.localStorage.clear();
  window.sessionStorage.clear();
  refreshCacheEntries();
  showToast({ message: '缓存已全部清理', duration: 800 });
};

const onToggle = async (value) => {
  if (loading.value) return;
  loading.value = true;
  try {
    await debugStore.setVConsoleEnabled(value);
    showToast({
      message: value ? 'VConsole 已开启' : 'VConsole 已关闭',
      duration: 800,
    });
  } catch (error) {
    console.warn('[debug] toggle failed', error);
    showFailToast({ message: 'VConsole 加载失败，请稍后重试' });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  debugStore.init();
});
</script>

<style scoped lang="scss">
.settings-page {
  min-height: 100vh;
  background-color: #f7f8fa;

  &__content {
    padding: 16px 0;
  }

  &__cell {
    align-items: center;
  }

  &__danger {
    color: #ee0a24;
  }
}

.cache-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
  }

  &__body {
    flex: 1;
    overflow-y: auto;
  }

  &__section {
    margin-bottom: 20px;
  }

  &__section-title {
    font-size: 14px;
    font-weight: 500;
    color: #323233;
    margin-bottom: 8px;
  }

  &__section-count {
    font-size: 12px;
    color: #999;
  }

  &__cell-value {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
    font-size: 12px;
    line-height: 1.5;
    color: #666;
  }

  &__cell-title {
    font-weight: 600;
    font-size: 13px;
    color: #323233;
  }

  &__empty {
    padding: 12px;
    font-size: 13px;
    color: #969799;
    background: #f7f8fa;
    border-radius: 8px;
  }
}
</style>
