<template>
  <div class="dc-page" :class="{ 'dc-page--footer-fixed': footerFixed }" :style="cssVars">
    <slot name="nav"></slot>
    <slot></slot>
    <section class="dc-content">
      <slot></slot>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';

const props = defineProps({
  /* Header（插槽或回退 NavBar） */
  showHeader: { type: Boolean, default: true },
  title: { type: String, default: '' },
  showBack: { type: Boolean, default: true },
  headerBorder: { type: Boolean, default: false },

  /* Header 固定与测量 */
  fixedHeader: { type: Boolean, default: true },
  headerZIndex: { type: Number, default: 999 },
  headerHeightFallback: { type: Number, default: 0 },
  headerSafeArea: { type: Boolean, default: true },

  /* 搜索区 */
  searchSticky: { type: Boolean, default: true },

  /* 页面与底部 */
  pageBg: { type: String, default: '#f7f8fa' },
  contentPadding: { type: Number, default: 12 },
  footerFixed: { type: Boolean, default: true },
  footerHeight: { type: Number, default: 64 },
  footerSafeArea: { type: Boolean, default: true },

  /* Tabbar 占位（如 Vant Tabbar 高度 50px） */
  tabbarInset: { type: Boolean, default: true },
  tabbarHeight: { type: Number, default: 50 },

  /* 滚动开关 */
  scrollY: { type: Boolean, default: true },
  scrollX: { type: Boolean, default: false },

  /* 触顶/触底阈值（px） */
  reachOffset: { type: Number, default: 40 },
});

/* 头部高度测量 */
const headerRef = ref(null);
const headerH = ref(0);
const measure = () => {
  if (!props.fixedHeader) {
    headerH.value = 0;
    return;
  }
  headerH.value = headerRef.value?.offsetHeight || props.headerHeightFallback;
};

let ro;
onMounted(async () => {
  await nextTick();
  measure();
  if (window.ResizeObserver && headerRef.value) {
    ro = new ResizeObserver(measure);
    ro.observe(headerRef.value);
  } else {
    window.addEventListener('resize', measure);
  }
});
onBeforeUnmount(() => {
  if (ro && headerRef.value) ro.unobserve(headerRef.value);
  window.removeEventListener?.('resize', measure);
});

/* CSS 变量 */
const cssVars = computed(() => ({
  '--dc-page-bg': props.pageBg,
}));

/* 滚动区样式（把滚动与底部 inset 放在 .dc-body 上） */
const bodyRef = ref(null);

/* 对外暴露方法 */
const scrollToTop = (smooth = true) => {
  const el = bodyRef.value;
  if (!el) return;
  el.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
};
const scrollToBottom = (smooth = true) => {
  const el = bodyRef.value;
  if (!el) return;
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
};

defineExpose({ scrollToTop, scrollToBottom });
</script>

<style lang="scss" scoped>
/* ---- SCSS Tokens ---- */
$dc-gap: 12px;
$dc-shadow-lift: 0 -4px 12px rgba(0, 0, 0, 0.04);

/* iOS 安全区 mixins（兼容 constant()） */
@mixin ios-safe-padding-top {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
}
@mixin ios-safe-height-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
}

/* 根容器 */
.dc-page {
  width: 100%;
  min-height: 100dvh; /* 解决 iOS 可视高度波动 */
  background: var(--dc-page-bg);
  display: flex;
  flex-direction: column;

  &--footer-fixed {
    /* 需要时可做差异样式 */
  }
}

/* 头部 */
.dc-header {
  background: #fff;

  &--fixed {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
  }
  &--safe {
    @include ios-safe-padding-top;
  }
}

/* 主体滚动区（统一滚动容器） */
.dc-body {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0; /* 关键：允许内部滚动不被挤压 */
}

/* 搜索区（吸顶） */
.dc-search {
  background: #fff;
  padding: $dc-gap;

  &--sticky {
    position: sticky;
    z-index: 2;
    border-bottom: 1px solid #f5f5f5;
  }
}

/* 内容区域（不再单独 overflow） */
.dc-content {
  flex: 0 0 auto;
}

/* 底部操作条 */
.dc-footer {
  background: #fff;
  box-shadow: $dc-shadow-lift;

  &--fixed {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
  }

  &--safe {
    .dc-footer__safe {
      width: 100%;
      @include ios-safe-height-bottom;
    }
  }
}

/* 占位（footer + tabbar） */
.dc-footer-spacer {
  width: 100%;
}
</style>
