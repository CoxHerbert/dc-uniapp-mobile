<template>
  <div class="confirm-material">
    <van-nav-bar ref="navRef" title="确认领料" left-arrow @click-left="handleBack" />
    <div class="confirm-material__content">
      <van-sticky ref="stickyRef" :offset-top="tabsOffsetTop" class="confirm-material__sticky">
        <div ref="stickyInnerRef">
          <van-tabs
            ref="tabsRef"
            v-model:active="activeTab"
            :swipeable="false"
            shrink
            class="confirm-material__tabs"
          >
            <van-tab v-for="tab in tabs" :key="tab.value" :name="tab.value" :title="tab.label" />
          </van-tabs>
        </div>
      </van-sticky>

      <div v-if="activeTab === 'search'" class="confirm-material__search-panel">
        <DcSearchBar
          v-model="searchKeyword"
          placeholder="请输入出库单据编号"
          button-text="查询"
          @search="handleSearch"
        />
      </div>
      <PendingList
        v-else-if="activeTab === 'pending'"
        :get-nav-el="getNavEl"
        :sticky-top="paginationStickyTop"
        @select="handleSelectOrder"
      />
      <ResultPanel v-else ref="resultRef" />
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import PendingList from './components/PendingList.vue';
import ResultPanel from './components/ResultPanel.vue';
import { goBackOrHome } from '@/utils/navigation';
import DcSearchBar from '@/components/dc-ui/components/SearchBar/index.vue';

const router = useRouter();
const navRef = ref(null);
const resultRef = ref(null);
const activeTab = ref('search');
const searchKeyword = ref('');
const tabsOffsetTop = ref(0);
const tabsRef = ref(null);
const stickyRef = ref(null);
const stickyInnerRef = ref(null);
const navHeight = ref(0);
const stickyHeight = ref(0);
const tabs = [
  { label: '查询条件', value: 'search' },
  { label: '待确认单据', value: 'pending' },
  { label: '结果提示', value: 'result' },
];

const getNavEl = () => {
  const target = navRef.value;
  if (!target) return null;
  if (target instanceof HTMLElement) return target;
  if (target.$el instanceof HTMLElement) return target.$el;
  if (target.$?.subTree?.el instanceof HTMLElement) return target.$?.subTree?.el;
  return null;
};
const showTabs = computed(() => activeTab.value !== 'pending');
const paginationStickyTop = computed(
  () => navHeight.value + (showTabs.value ? stickyHeight.value : 0)
);

const measureNavHeight = () => {
  navHeight.value = 0;
  tabsOffsetTop.value = 0;
};

const resolveElement = (target) => {
  if (!target) return null;
  if (target instanceof HTMLElement) return target;
  if (target.$el instanceof HTMLElement) return target.$el;
  if (target?.value) return resolveElement(target.value);
  if (target?.$?.subTree?.el instanceof HTMLElement) return target.$?.subTree?.el;
  return null;
};

const measureStickyHeight = () => {
  nextTick(() => {
    const el = resolveElement(stickyRef.value) || resolveElement(stickyInnerRef.value);
    const rect = el?.getBoundingClientRect();
    stickyHeight.value = rect?.height ?? 0;
  });
};

const handleResize = () => {
  measureNavHeight();
  if (showTabs.value) {
    measureStickyHeight();
  } else {
    stickyHeight.value = 0;
  }
};

onMounted(() => {
  measureNavHeight();
  if (showTabs.value) {
    measureStickyHeight();
  }
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('orientationchange', handleResize);
});

watch(activeTab, () => {
  if (showTabs.value) {
    measureStickyHeight();
  } else {
    stickyHeight.value = 0;
  }
});

watch(tabsRef, () => {
  if (showTabs.value) {
    measureStickyHeight();
  }
});

watch(showTabs, (visible) => {
  if (visible) {
    measureStickyHeight();
  } else {
    stickyHeight.value = 0;
  }
});

function handleBack() {
  goBackOrHome(router);
}

function showResultByCode(rawCode) {
  const code = rawCode?.toString().trim();
  if (!code) return;

  const invokeFetch = () => {
    resultRef.value?.fetchByCode(code);
  };

  if (activeTab.value === 'result') {
    invokeFetch();
  } else {
    activeTab.value = 'result';
    nextTick(invokeFetch);
  }
}

function handleSearch(code) {
  const value = (code ?? searchKeyword.value ?? '').toString().trim();
  if (!value) return;
  searchKeyword.value = value;
  showResultByCode(value);
}

function handleSelectOrder(order) {
  if (!order) return;
  showResultByCode(order.outStockCode || order.code);
}
</script>

<style lang="scss" scoped>
.confirm-material {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f7f8fa;

  &__content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  &__sticky {
    background: #f7f8fa;
    box-sizing: border-box;
    z-index: 9;
  }

  &__tabs {
    --van-tabs-bottom-bar-color: transparent;
    --van-tabs-line-height: 0;
    background: #fff;
    padding: 4px;
    box-shadow: 0 6px 16px rgba(31, 35, 41, 0.08);
  }

  &__search-panel {
    padding: 16px 12px 8px;
    background: #fff;
  }
}

:deep(.van-tabs__wrap) {
  height: auto;
}

:deep(.van-tabs__nav--line) {
  padding-bottom: 0;
}

:deep(.van-tab) {
  font-size: 14px;
  color: #646566;
  padding: 6px 18px;
  border-radius: 999px;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

:deep(.van-tab--active) {
  background: linear-gradient(135deg, #1989fa, #1668dc);
  color: #fff;
}
</style>
