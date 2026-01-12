<template>
  <div class="dc-paged-infinite-list">
    <!-- 可选：自定义导航栏 -->
    <slot name="nav"> </slot>

    <!-- 顶部固定：默认提供 搜索 + 状态筛选，也允许整体替换 -->
    <div ref="stickyRef" class="dc-sticky-header">
      <slot
        name="sticky"
        :keyword="kw"
        :set-keyword="(v) => (kw = v)"
        :active-status="act"
        :set-active-status="(v) => (act = v)"
        :status-options="statusOptions"
        :query="qry"
        :set-query="setQuery"
        :set-query-field="setQueryField"
        :clear-query="clearQuery"
        :reset-and-load="doResetAndLoad"
        :apply="doResetAndLoad"
        :show-search="showSearch"
        :show-tabs="showTabs"
      >
        <div class="dc-notice-bar">
          <slot
            name="notice"
            :query="qry"
            :set-query="setQuery"
            :set-query-field="setQueryField"
            :clear-query="clearQuery"
            :apply="doResetAndLoad"
          ></slot>
        </div>

        <div v-if="showSearch" class="dc-search-bar">
          <DcSearchBar
            v-model="kw"
            :placeholder="searchPlaceholder"
            :button-text="searchButtonText"
            :show-scan="searchScanVisible"
            background="#fff"
            @search="doResetAndLoad"
            @clear="handleSearchClear"
          />
        </div>

        <slot
          name="search-extra"
          :keyword="kw"
          :set-keyword="(v) => (kw = v)"
          :active-status="act"
          :set-active-status="(v) => (act = v)"
          :status-options="statusOptions"
          :query="qry"
          :set-query="setQuery"
          :set-query-field="setQueryField"
          :clear-query="clearQuery"
          :apply="doResetAndLoad"
        ></slot>

        <!-- 可选：多条件过滤区域（完全由父组件插槽自定义） -->
        <div class="dc-filters">
          <slot
            name="filters"
            :query="qry"
            :set-query="setQuery"
            :set-query-field="setQueryField"
            :clear-query="clearQuery"
            :apply="doResetAndLoad"
          ></slot>
        </div>

        <van-tabs
          v-if="showTabs"
          v-model:active="act"
          line-width="22px"
          line-height="2px"
          background="#fff"
          @change="doResetAndLoad"
        >
          <van-tab
            v-for="opt in statusOptions"
            :key="opt.value"
            :name="opt.value"
            :title="opt.label"
          />
        </van-tabs>
      </slot>
    </div>

    <!-- 内容区 -->
    <div
      ref="contentRef"
      class="dc-content"
      :style="{ top: contentTop + 'px' }"
      role="region"
      aria-label="dc 列表内容区"
    >
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <template v-if="list.length">
          <van-list
            v-model:loading="loading"
            :finished="finished"
            :error="loadError"
            :offset="offset"
            finished-text="没有更多了"
            error-text="加载失败，点击重试"
            @load="onLoad"
            @update:error="loadError = false"
          >
            <!-- 自定义每行渲染 -->
            <slot
              v-for="(item, idx) in list"
              :key="itemKey(item, idx)"
              name="item"
              :item="item"
              :index="idx"
            >
            </slot>
          </van-list>
        </template>

        <slot v-else name="empty">
          <van-empty description="暂无数据" />
        </slot>
      </van-pull-refresh>

      <div class="dc-safe-bottom"></div>
    </div>

    <!-- 回到顶部 -->
    <transition name="dc-fade-zoom">
      <button
        v-if="showBackTop"
        class="dc-back-top"
        :title="'回到顶部'"
        aria-label="回到顶部"
        @click="scrollToTopSmooth"
      >
        <van-icon name="arrow-up" size="18" />
      </button>
    </transition>

    <!-- 右下角新增悬浮（默认显示，可用 #fab 覆盖；保持 dc-* 命名） -->
    <slot name="fab">
      <button
        v-if="addVisible"
        class="dc-fab-add"
        :title="'新增'"
        aria-label="新增"
        @click="$emit('add')"
      >
        <van-icon name="plus" size="18" />
      </button>
    </slot>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import DcSearchBar from '@/components/dc-ui/components/SearchBar/index.vue';

/**
 * Props
 * - fetcher: (params) => Promise<{ current, pages, records, total, size }>
 * - pageSize: number
 * - statusOptions: Array<{label, value}>
 * - defaultStatus: any
 * - keyword: v-model 受控（可选）
 * - activeStatus: v-model 受控（可选）
 * - query: v-model 受控（对象，多条件查询）【新增】
 * - searchPlaceholder: string
 * - offset: number (van-list 触底阈值)
 * - immediate: boolean 是否挂载自动加载
 * - itemKey: (item, index) => key
 * - navSelector: string | null 用于测量导航高度（默认自动探测 .van-nav-bar--fixed）
 * - getNavEl: () => HTMLElement | null 自定义获取 nav 元素
 * - backTopThreshold: number 滚动超过多少像素显示回顶按钮
 * - addVisible: boolean 是否显示右下角新增悬浮按钮
 * - searchVisible: boolean 是否展示顶部搜索区域
 * - tabsVisible: boolean 是否展示状态切换标签
 */
const props = defineProps({
  fetcher: { type: Function, required: true },
  pageSize: { type: Number, default: 8 },
  statusOptions: {
    type: Array,
    default: () => [{ label: '全部', value: null, type: 'success' }],
  },
  defaultStatus: { type: [String, Number], default: null },
  keyword: { type: String, default: '' },
  activeStatus: { type: [String, Number], default: null },
  query: { type: Object, default: () => ({}) }, // 新增：多条件对象
  searchPlaceholder: { type: String, default: '请输入关键词' },
  searchButtonText: { type: String, default: '查询' },
  searchScanVisible: { type: Boolean, default: false },
  offset: { type: Number, default: 200 },
  immediate: { type: Boolean, default: true },
  itemKey: { type: Function, default: (item, idx) => item?.id ?? item?.no ?? idx },
  navSelector: { type: String, default: '.van-nav-bar--fixed' },
  getNavEl: { type: Function, default: null },
  backTopThreshold: { type: Number, default: 300 },
  addVisible: { type: Boolean, default: true },
  searchVisible: { type: Boolean, default: true },
  tabsVisible: { type: Boolean, default: true },
});

const emit = defineEmits([
  'update:keyword',
  'update:activeStatus',
  'update:query', // 新增：多条件双向绑定
  'item-action',
  'add',
]);

const showSearch = computed(() => props.searchVisible !== false);
const showTabs = computed(
  () => props.tabsVisible !== false && (props.statusOptions || []).length > 0
);

/** 受控 v-model 封装（父传/不传都可用） */
const kw = computed({
  get: () => props.keyword,
  set: (v) => emit('update:keyword', v),
});
const act = computed({
  get: () => props.activeStatus ?? props.defaultStatus,
  set: (v) => emit('update:activeStatus', v),
});
const qry = computed({
  get: () => props.query || {},
  set: (v) => emit('update:query', v || {}),
});

/** 更新查询对象的便捷方法（不直接改 props 引用） */
const setQuery = (partial = {}) => {
  const next = { ...(props.query || {}), ...(partial || {}) };
  emit('update:query', next);
};
const setQueryField = (key, value) => {
  const next = { ...(props.query || {}), [key]: value };
  emit('update:query', next);
};
const clearQuery = () => emit('update:query', {});

/** 分页与加载状态 */
const page = reactive({ no: 1, size: props.pageSize });
const list = ref([]);
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const loadError = ref(false);
const fetching = ref(false); // 自己的请求锁，避免并发

/** 顶部高度测量 */
const stickyRef = ref(null);
const contentRef = ref(null);
const contentTop = ref(0);
let headerResizeObs = null;

const resolveNavEl = () => {
  if (typeof props.getNavEl === 'function') return props.getNavEl();
  if (props.navSelector) return document.querySelector(props.navSelector);
  return document.querySelector('.van-nav-bar--fixed') || document.querySelector('.nav-primary');
};

const measureAndApplyTop = () => {
  const navEl = resolveNavEl();
  const navH = navEl ? navEl.getBoundingClientRect().height : 46;
  const headerH = stickyRef.value ? stickyRef.value.getBoundingClientRect().height : 0;
  contentTop.value = navH + headerH;
};
const handleWindowResize = () => measureAndApplyTop();

/** 回到顶部显示控制 */
const showBackTop = ref(false);
const handleContentScroll = () => {
  const el = contentRef.value;
  if (!el) return;
  showBackTop.value = el.scrollTop > props.backTopThreshold;
};

/** 平滑滚动到顶部 */
const scrollToTopSmooth = () => {
  const el = contentRef.value;
  if (!el) return;
  const start = el.scrollTop;
  const duration = 320;
  const startTime = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - startTime) / duration);
    const ease = 1 - Math.pow(1 - p, 3); // easeOutCubic
    el.scrollTop = start * (1 - ease);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

/** 统一调用外部 fetcher：把多条件合并传出 */
async function fetchPage({ pageNo, pageSize }) {
  const params = {
    pageNo,
    pageSize,
    keyword: kw.value,
    status: act.value,
    ...(qry.value || {}),
  };
  const data = await props.fetcher(params);
  if (!data) throw new Error('fetcher 返回为空');
  return data; // { current, pages, records, total, size }
}

/** 下拉刷新：首屏拉取第1页 */
const onRefresh = async () => {
  try {
    page.no = 1;
    finished.value = false;
    loadError.value = false;

    fetching.value = true;
    const data = await fetchPage({ pageNo: page.no, pageSize: page.size });
    const { current, pages, records, total, size } = data;
    list.value = records || [];
    const isLast =
      !pages || current >= pages || (records?.length ?? 0) < size || current * size >= total;
    finished.value = isLast;
    if (!isLast) page.no = current + 1;
  } catch (e) {
    loadError.value = true;
  } finally {
    fetching.value = false;
    refreshing.value = false;
    loading.value = false;
  }
};

/** 上拉加载更多（van-list 触发） */
const onLoad = async () => {
  if (finished.value || fetching.value) {
    loading.value = false;
    return;
  }
  loadError.value = false;
  fetching.value = true;
  try {
    const data = await fetchPage({ pageNo: page.no, pageSize: page.size });
    const { current, pages, records, total, size } = data;
    const rows = records || [];
    list.value.push(...rows);

    const isLast = !pages || current >= pages || rows.length < size || current * size >= total;
    finished.value = isLast;
    if (!isLast) page.no = current + 1;
  } catch (e) {
    loadError.value = true;
  } finally {
    fetching.value = false;
    loading.value = false;
  }
};

/** 重置并首屏加载（搜索/状态切换/多条件变更后） */
const doResetAndLoad = async () => {
  page.no = 1;
  list.value = [];
  finished.value = false;
  loadError.value = false;

  await nextTick();
  if (contentRef.value) contentRef.value.scrollTop = 0;

  try {
    fetching.value = true;
    const data = await fetchPage({ pageNo: page.no, pageSize: page.size });
    const { current, pages, records, total, size } = data;
    list.value = records || [];
    const isLast =
      !pages || current >= pages || (records?.length ?? 0) < size || current * size >= total;
    finished.value = isLast;
    if (!isLast) page.no = current + 1;
  } catch (e) {
    loadError.value = true;
  } finally {
    fetching.value = false;
    loading.value = false;
  }
};

const handleSearchClear = () => {
  doResetAndLoad();
};

/** 输入节流：停止输入 300ms 自动检索（仅对 keyword） */
let searchTimer = null;
watch(kw, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => doResetAndLoad(), 300);
});

/** 生命周期 */
onMounted(async () => {
  measureAndApplyTop();
  headerResizeObs = new ResizeObserver(() => measureAndApplyTop());
  if (stickyRef.value) headerResizeObs.observe(stickyRef.value);
  window.addEventListener('resize', handleWindowResize);
  window.addEventListener('orientationchange', handleWindowResize);

  if (contentRef.value) {
    contentRef.value.addEventListener('scroll', handleContentScroll, { passive: true });
  }

  if (props.immediate) await doResetAndLoad();
});
onBeforeUnmount(() => {
  if (headerResizeObs && stickyRef.value) headerResizeObs.unobserve(stickyRef.value);
  window.removeEventListener('resize', handleWindowResize);
  window.removeEventListener('orientationchange', handleWindowResize);

  if (contentRef.value) {
    contentRef.value.removeEventListener('scroll', handleContentScroll);
  }
});

/** 暴露方法给父组件 */
defineExpose({
  resetAndLoad: doResetAndLoad,
  refresh: onRefresh,
  scrollToTop: () => contentRef.value && (contentRef.value.scrollTop = 0),
  getList: () => list.value,
  scrollToTopSmooth,
  setQuery,
  setQueryField,
  clearQuery,
});
</script>

<style lang="scss" scoped>
.dc-paged-infinite-list {
  background: #f7f8fa;
  min-height: 100vh;

  /* sticky */
  .dc-sticky-header {
    position: fixed;
    left: 0;
    right: 0;
    top: var(--nav-top, 46px);
    background: #fff;
    z-index: 998;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    padding: 0 12px 0;

    .dc-search-bar {
      padding: 8px 0 12px;

      :deep(.dc-search-panel) {
        width: 100%;
      }
    }

    .dc-notice-bar {
      padding-top: 8px;
    }

    :deep(.van-tabs__wrap) {
      height: 36px;
    }
    :deep(.van-tab) {
      padding: 0 8px;
      font-size: 13px;
    }
    :deep(.van-tabs__line) {
      height: 2px;
    }
  }

  /* content */
  .dc-content {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 10px 12px 0;

    .dc-card {
      background: #fff;
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 10px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);

      &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      &__title {
        font-size: 15px;
        font-weight: 600;
        color: #333;
      }

      .dc-status-tag {
        margin-left: 8px;
      }

      &__meta {
        margin-top: 8px;
        color: #666;
        font-size: 13px;

        &__row,
        .dc-card__row {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }

        &__label,
        .dc-card__label {
          color: #888;
          min-width: 40px;
        }

        &__value,
        .dc-card__value {
          /* 值样式可扩展 */
        }
      }

      &__footer {
        margin-top: 10px;
        display: flex;
        gap: 8px;
      }
    }

    .dc-safe-bottom {
      height: env(safe-area-inset-bottom, 0);
    }
  }

  /* 回到顶部按钮 */
  .dc-back-top {
    position: fixed;
    right: 12px;
    bottom: calc(env(safe-area-inset-bottom, 0) + 76px);
    width: 42px;
    height: 42px;
    border: none;
    border-radius: 50%;
    background: var(--van-primary-color, #1989fa);
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    z-index: 999;
  }

  /* 右下角新增悬浮按钮 */
  .dc-fab-add {
    position: fixed;
    right: 12px;
    bottom: calc(env(safe-area-inset-bottom, 0) + 16px);
    width: 52px;
    height: 52px;
    border: none;
    border-radius: 50%;
    background: var(--van-primary-color, #1989fa);
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    z-index: 1000;
  }

  /* 过渡动画 */
  .dc-fade-zoom-enter-active,
  .dc-fade-zoom-leave-active {
    transition:
      opacity 0.18s ease,
      transform 0.18s ease;
  }
  .dc-fade-zoom-enter-from,
  .dc-fade-zoom-leave-to {
    opacity: 0;
    transform: scale(0.92);
  }
}
</style>
